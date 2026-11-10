// ============================================================================
// RUTAS DE GESTIÓN DE VENTAS (POS RÁPIDO) Y DESCUENTO AUTOMÁTICO DE STOCK
// ============================================================================
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateUser } = require('../middleware/auth');

/**
 * Generador de código secuencial de factura para el POS
 * Ejemplo: RB-20261110-0012
 */
function generateInvoiceCode(db) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = db.prepare(`
    SELECT COUNT(*) as count FROM ventas
    WHERE date(created_at) = date('now')
  `).get().count;

  const sequence = String(countToday + 1).padStart(4, '0');
  return `RB-${today}-${sequence}`;
}

/**
 * POST /api/sales
 * Registrar nueva venta desde el POS móvil con descuento automático de inventario
 */
router.post('/', authenticateUser, (req, res) => {
  const { items, metodoPago, notas } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'La orden debe contener al menos un producto' });
  }

  const validPaymentMethods = ['efectivo', 'tarjeta', 'pago_movil', 'transferencia', 'zelle'];
  if (!metodoPago || !validPaymentMethods.includes(metodoPago.toLowerCase())) {
    return res.status(400).json({
      error: `Método de pago inválido. Opciones: ${validPaymentMethods.join(', ')}`
    });
  }

  const db = getDb();

  // Iniciar Transacción Atómica ACID para asegurar integridad entre venta e inventario
  db.exec('BEGIN IMMEDIATE');

  try {
    let subtotal = 0;
    const itemsToInsert = [];

    // Validar productos y precios
    const getProduct = db.prepare('SELECT id, nombre, precio, activo FROM productos WHERE id = ?');
    for (const item of items) {
      const prod = getProduct.get(item.productoId);
      if (!prod) {
        throw new Error(`Producto con ID ${item.productoId} no existe`);
      }
      if (!prod.activo) {
        throw new Error(`El producto "${prod.nombre}" no está activo`);
      }
      const cant = parseInt(item.cantidad, 10);
      if (isNaN(cant) || cant <= 0) {
        throw new Error(`Cantidad inválida para el producto "${prod.nombre}"`);
      }

      const itemSubtotal = prod.precio * cant;
      subtotal += itemSubtotal;

      itemsToInsert.push({
        productoId: prod.id,
        nombre: prod.nombre,
        cantidad: cant,
        precioUnitario: prod.precio,
        subtotal: itemSubtotal
      });
    }

    const impuestos = 0; // Configurable si aplica IVA
    const total = subtotal + impuestos;
    const codigoFactura = generateInvoiceCode(db);

    // 1. Insertar Encabezado de Venta
    const insertVenta = db.prepare(`
      INSERT INTO ventas (codigo_factura, usuario_id, metodo_pago, subtotal, impuestos, total, estado, notas)
      VALUES (?, ?, ?, ?, ?, ?, 'completada', ?)
    `);
    const ventaResult = insertVenta.run(
      codigoFactura,
      req.user.id,
      metodoPago.toLowerCase(),
      subtotal,
      impuestos,
      total,
      notas || ''
    );
    const ventaId = ventaResult.lastInsertRowid;

    // 2. Insertar Detalle de Ventas
    const insertDetalle = db.prepare(`
      INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `);

    // 3. Preparar consultas para descuento automático de stock por receta
    const getRecipe = db.prepare(`
      SELECT r.insumo_id, r.cantidad_requerida, i.nombre, i.stock_actual, i.stock_minimo, i.unidad_medida
      FROM recetas_insumos r
      INNER JOIN insumos i ON r.insumo_id = i.id
      WHERE r.producto_id = ?
    `);

    const updateInsumoStock = db.prepare(`
      UPDATE insumos
      SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const insertMovimiento = db.prepare(`
      INSERT INTO movimientos_inventario (insumo_id, tipo, cantidad, stock_anterior, stock_posterior, motivo, referencia_id, usuario_id)
      VALUES (?, 'salida_venta', ?, ?, ?, ?, ?, ?)
    `);

    const lowStockAlerts = [];

    // Procesar cada ítem y descontar insumos
    for (const item of itemsToInsert) {
      insertDetalle.run(ventaId, item.productoId, item.cantidad, item.precioUnitario, item.subtotal);

      // Descuento automático según la receta (escandallo)
      const recipeRows = getRecipe.all(item.productoId);
      for (const recipe of recipeRows) {
        const totalInsumoADescontar = recipe.cantidad_requerida * item.cantidad;
        const stockAnterior = recipe.stock_actual;
        const stockPosterior = Math.max(0, stockAnterior - totalInsumoADescontar);

        // Actualizar stock del insumo
        updateInsumoStock.run(stockPosterior, recipe.insumo_id);

        // Registrar auditoría de movimiento (Kárdex)
        insertMovimiento.run(
          recipe.insumo_id,
          totalInsumoADescontar,
          stockAnterior,
          stockPosterior,
          `Venta POS #${codigoFactura} (${item.cantidad}x ${item.nombre})`,
          ventaId,
          req.user.id
        );

        // Alerta visual de stock si cae al nivel mínimo o menos
        if (stockPosterior <= recipe.stock_minimo) {
          lowStockAlerts.push({
            insumoId: recipe.insumo_id,
            nombre: recipe.nombre,
            stockActual: stockPosterior,
            stockMinimo: recipe.stock_minimo,
            unidad: recipe.unidad_medida,
            nivel: stockPosterior === 0 ? 'agotado' : 'critico'
          });
        }
      }
    }

    db.exec('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Venta registrada con éxito y stock actualizado automáticamente',
      venta: {
        id: ventaId,
        codigoFactura,
        metodoPago,
        subtotal,
        impuestos,
        total,
        items: itemsToInsert,
        usuario: req.user.nombre,
        fecha: new Date().toISOString(),
        alertasStock: lowStockAlerts
      }
    });

  } catch (error) {
    db.exec('ROLLBACK');
    res.status(400).json({ error: error.message || 'Error al procesar la venta en el POS' });
  }
});

/**
 * GET /api/sales
 * Historial reciente de ventas con filtro por fecha
 */
router.get('/', authenticateUser, (req, res) => {
  const db = getDb();
  const limit = parseInt(req.query.limit, 10) || 50;

  const sales = db.prepare(`
    SELECT v.id, v.codigo_factura, v.metodo_pago, v.subtotal, v.impuestos, v.total,
           v.estado, v.notas, v.created_at, u.nombre as cajero
    FROM ventas v
    INNER JOIN usuarios u ON v.usuario_id = u.id
    ORDER BY v.created_at DESC
    LIMIT ?
  `).all(limit);

  // Obtener ítems para cada venta
  const getDetails = db.prepare(`
    SELECT d.venta_id, d.producto_id, d.cantidad, d.precio_unitario, d.subtotal, p.nombre as producto_nombre
    FROM detalle_ventas d
    INNER JOIN productos p ON d.producto_id = p.id
    WHERE d.venta_id = ?
  `);

  const enrichedSales = sales.map(s => ({
    ...s,
    items: getDetails.all(s.id)
  }));

  res.json({ sales: enrichedSales });
});

/**
 * GET /api/sales/:id
 * Detalle completo de una venta específica (para reimpresión o consulta de ticket)
 */
router.get('/:id', authenticateUser, (req, res) => {
  const db = getDb();
  const venta = db.prepare(`
    SELECT v.*, u.nombre as cajero
    FROM ventas v
    INNER JOIN usuarios u ON v.usuario_id = u.id
    WHERE v.id = ?
  `).get(req.params.id);

  if (!venta) {
    return res.status(404).json({ error: 'Venta no encontrada' });
  }

  const items = db.prepare(`
    SELECT d.*, p.nombre as producto_nombre
    FROM detalle_ventas d
    INNER JOIN productos p ON d.producto_id = p.id
    WHERE d.venta_id = ?
  `).all(venta.id);

  res.json({ venta: { ...venta, items } });
});

module.exports = router;
