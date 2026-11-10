// ============================================================================
// RUTAS DE CONTROL DE INVENTARIO Y MERCANCÍA (ALERTAS Y MOVIMIENTOS)
// ============================================================================
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateUser, requireRoles } = require('../middleware/auth');

/**
 * GET /api/inventory
 * Lista completa de insumos con cálculo dinámico de alertas de stock bajo
 */
router.get('/', authenticateUser, (req, res) => {
  const db = getDb();
  const insumos = db.prepare(`
    SELECT id, nombre, categoria, unidad_medida, stock_actual, stock_minimo,
           costo_unitario, proveedor_habitual, updated_at
    FROM insumos
    ORDER BY categoria ASC, nombre ASC
  `).all();

  let totalValorInventario = 0;
  let conteoCriticos = 0;
  let conteoBajos = 0;
  let conteoAgotados = 0;

  const formatted = insumos.map(item => {
    const stock = Number(item.stock_actual);
    const min = Number(item.stock_minimo);
    const costo = Number(item.costo_unitario);
    const valorItem = stock * costo;
    totalValorInventario += valorItem;

    let estado = 'optimo';
    let estadoTexto = 'En Nivel Óptimo';
    let estadoColor = 'green';

    if (stock <= 0) {
      estado = 'agotado';
      estadoTexto = '🚨 Agotado';
      estadoColor = 'red';
      conteoAgotados++;
    } else if (stock <= min * 0.5) {
      estado = 'critico';
      estadoTexto = '⚠️ Stock Crítico';
      estadoColor = 'orange';
      conteoCriticos++;
    } else if (stock <= min) {
      estado = 'bajo';
      estadoTexto = '⚡ Stock Bajo';
      estadoColor = 'yellow';
      conteoBajos++;
    }

    const porcentajeStock = min > 0 ? Math.min(100, Math.round((stock / (min * 2)) * 100)) : 100;

    return {
      ...item,
      stock_actual: stock,
      stock_minimo: min,
      costo_unitario: costo,
      valor_total: valorItem,
      estado,
      estadoTexto,
      estadoColor,
      porcentajeStock
    };
  });

  res.json({
    insumos: formatted,
    resumen: {
      totalItems: formatted.length,
      alertasTotales: conteoAgotados + conteoCriticos + conteoBajos,
      agotados: conteoAgotados,
      criticos: conteoCriticos,
      bajos: conteoBajos,
      valorTotalInventario: Number(totalValorInventario.toFixed(2))
    }
  });
});

/**
 * POST /api/inventory/movement
 * Registrar entrada de compra, merma o ajuste manual en inventario
 */
router.post('/movement', authenticateUser, (req, res) => {
  const { insumoId, tipo, cantidad, motivo } = req.body;

  const validTypes = ['entrada_compra', 'salida_venta', 'merma', 'ajuste'];
  if (!tipo || !validTypes.includes(tipo)) {
    return res.status(400).json({ error: `Tipo de movimiento inválido. Opciones: ${validTypes.join(', ')}` });
  }

  const cant = parseFloat(cantidad);
  if (isNaN(cant) || cant <= 0) {
    return res.status(400).json({ error: 'La cantidad debe ser un número positivo mayor a cero' });
  }

  const db = getDb();
  db.exec('BEGIN IMMEDIATE');

  try {
    const insumo = db.prepare('SELECT id, nombre, stock_actual, stock_minimo FROM insumos WHERE id = ?').get(insumoId);
    if (!insumo) {
      throw new Error('Insumo no encontrado');
    }

    const stockAnterior = Number(insumo.stock_actual);
    let stockPosterior = stockAnterior;

    if (tipo === 'entrada_compra') {
      stockPosterior = stockAnterior + cant;
    } else if (tipo === 'salida_venta' || tipo === 'merma') {
      if (stockAnterior < cant) {
        throw new Error(`Stock insuficiente. Stock actual: ${stockAnterior}`);
      }
      stockPosterior = stockAnterior - cant;
    } else if (tipo === 'ajuste') {
      stockPosterior = cant; // En ajuste manual, la cantidad ingresada se convierte en el nuevo stock
    }

    // Actualizar stock
    db.prepare('UPDATE insumos SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(stockPosterior, insumoId);

    // Registrar auditoría en el kárdex
    db.prepare(`
      INSERT INTO movimientos_inventario (insumo_id, tipo, cantidad, stock_anterior, stock_posterior, motivo, usuario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      insumoId,
      tipo,
      tipo === 'ajuste' ? Math.abs(stockPosterior - stockAnterior) : cant,
      stockAnterior,
      stockPosterior,
      motivo || `Movimiento manual de tipo ${tipo}`,
      req.user.id
    );

    db.exec('COMMIT');

    res.json({
      success: true,
      message: 'Movimiento registrado exitosamente',
      insumo: {
        id: insumo.id,
        nombre: insumo.nombre,
        stockAnterior,
        stockPosterior
      }
    });
  } catch (error) {
    db.exec('ROLLBACK');
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/inventory/:id
 * Actualizar umbral de stock mínimo o costo unitario (Exclusivo Admin)
 */
router.put('/:id', authenticateUser, requireRoles(['admin']), (req, res) => {
  const { stock_minimo, costo_unitario } = req.body;
  const db = getDb();

  const insumo = db.prepare('SELECT * FROM insumos WHERE id = ?').get(req.params.id);
  if (!insumo) {
    return res.status(404).json({ error: 'Insumo no encontrado' });
  }

  const nuevoMin = stock_minimo !== undefined ? parseFloat(stock_minimo) : insumo.stock_minimo;
  const nuevoCosto = costo_unitario !== undefined ? parseFloat(costo_unitario) : insumo.costo_unitario;

  db.prepare(`
    UPDATE insumos
    SET stock_minimo = ?, costo_unitario = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nuevoMin, nuevoCosto, req.params.id);

  res.json({
    success: true,
    message: 'Insumo actualizado exitosamente'
  });
});

/**
 * GET /api/inventory/movements
 * Historial reciente de auditoría de inventario (Kárdex)
 */
router.get('/movements', authenticateUser, (req, res) => {
  const db = getDb();
  const limit = parseInt(req.query.limit, 10) || 40;

  const movements = db.prepare(`
    SELECT m.*, i.nombre as insumo_nombre, i.unidad_medida, u.nombre as usuario_nombre
    FROM movimientos_inventario m
    INNER JOIN insumos i ON m.insumo_id = i.id
    LEFT JOIN usuarios u ON m.usuario_id = u.id
    ORDER BY m.created_at DESC
    LIMIT ?
  `).all(limit);

  res.json({ movements });
});

module.exports = router;
