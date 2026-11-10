// ============================================================================
// RUTAS DE GESTIÓN DE GASTOS Y COMPRAS DE MERCANCÍA
// ============================================================================
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateUser, requireRoles } = require('../middleware/auth');

/**
 * GET /api/expenses
 * Listado de gastos con filtros rápidos (día, semana, mes, categoría)
 */
router.get('/', authenticateUser, (req, res) => {
  const { period = 'week', category } = req.query;
  const db = getDb();

  let dateCondition = '';
  const params = [];

  if (period === 'day') {
    dateCondition = "WHERE date(g.fecha) = date('now', 'localtime')";
  } else if (period === 'week') {
    dateCondition = "WHERE date(g.fecha) >= date('now', 'localtime', '-7 days')";
  } else if (period === 'month') {
    dateCondition = "WHERE strftime('%Y-%m', g.fecha) = strftime('%Y-%m', 'now', 'localtime')";
  } else {
    dateCondition = "WHERE 1=1";
  }

  if (category) {
    dateCondition += " AND g.categoria = ?";
    params.push(category);
  }

  const query = `
    SELECT g.*, u.nombre as registrado_por
    FROM gastos g
    INNER JOIN usuarios u ON g.usuario_id = u.id
    ${dateCondition}
    ORDER BY g.fecha DESC, g.id DESC
  `;

  const gastos = db.prepare(query).all(...params);

  // Calcular totales y resumen por categoría
  let totalMonto = 0;
  const categoriaMap = {};

  gastos.forEach(g => {
    const monto = Number(g.monto);
    totalMonto += monto;
    if (!categoriaMap[g.categoria]) {
      categoriaMap[g.categoria] = { total: 0, cantidad: 0 };
    }
    categoriaMap[g.categoria].total += monto;
    categoriaMap[g.categoria].cantidad += 1;
  });

  res.json({
    periodo: period,
    totalMonto: Number(totalMonto.toFixed(2)),
    cantidadGastos: gastos.length,
    porCategoria: categoriaMap,
    gastos
  });
});

/**
 * POST /api/expenses
 * Registrar un nuevo egreso o compra de insumos
 */
router.post('/', authenticateUser, (req, res) => {
  const { descripcion, categoria, proveedor, monto, fecha, comprobante, notas } = req.body;

  if (!descripcion || !categoria || !monto) {
    return res.status(400).json({ error: 'Descripción, categoría y monto son obligatorios' });
  }

  const validCategories = [
    'Insumos y Mercancía',
    'Empaques',
    'Servicios Públicos',
    'Nómina',
    'Mantenimiento',
    'Otros'
  ];

  if (!validCategories.includes(categoria)) {
    return res.status(400).json({
      error: `Categoría inválida. Opciones permitidas: ${validCategories.join(', ')}`
    });
  }

  const parsedMonto = parseFloat(monto);
  if (isNaN(parsedMonto) || parsedMonto <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }

  const fechaGasto = fecha ? fecha.slice(0, 10) : new Date().toISOString().slice(0, 10);

  const db = getDb();
  const insertGasto = db.prepare(`
    INSERT INTO gastos (usuario_id, descripcion, categoria, proveedor, monto, fecha, comprobante, notas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertGasto.run(
    req.user.id,
    descripcion.trim(),
    categoria,
    proveedor ? proveedor.trim() : 'Proveedor General',
    parsedMonto,
    fechaGasto,
    comprobante ? comprobante.trim() : null,
    notas ? notas.trim() : null
  );

  res.status(201).json({
    success: true,
    message: 'Gasto registrado correctamente',
    gasto: {
      id: result.lastInsertRowid,
      descripcion,
      categoria,
      proveedor,
      monto: parsedMonto,
      fecha: fechaGasto,
      comprobante,
      registradoPor: req.user.nombre
    }
  });
});

/**
 * DELETE /api/expenses/:id
 * Eliminar gasto (Requiere rol Admin)
 */
router.delete('/:id', authenticateUser, requireRoles(['admin']), (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM gastos WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Gasto no encontrado' });
  }

  res.json({ success: true, message: 'Gasto eliminado exitosamente' });
});

module.exports = router;
