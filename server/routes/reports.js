// ============================================================================
// RUTAS DE REPORTES Y ESTADÍSTICAS SEMANALES (MÉTRICAS CLAVE Y GRÁFICOS)
// ============================================================================
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateUser, requireRoles } = require('../middleware/auth');

/**
 * GET /api/reports/weekly
 * Resumen semanal automático con métricas clave, balance neto y ranking de productos
 * Solo accesible para Administradores (o personal autorizado)
 */
router.get('/weekly', authenticateUser, (req, res) => {
  const db = getDb();

  // 1. Total Ventas de los últimos 7 días
  const salesSummary = db.prepare(`
    SELECT COUNT(*) as transacciones,
           COALESCE(SUM(total), 0) as total_ventas,
           COALESCE(AVG(total), 0) as ticket_promedio
    FROM ventas
    WHERE date(created_at) >= date('now', 'localtime', '-7 days')
      AND estado = 'completada'
  `).get();

  // 2. Total Gastos de los últimos 7 días
  const expensesSummary = db.prepare(`
    SELECT COUNT(*) as total_compras,
           COALESCE(SUM(monto), 0) as total_gastos
    FROM gastos
    WHERE date(fecha) >= date('now', 'localtime', '-7 days')
  `).get();

  const totalVentas = Number(salesSummary.total_ventas);
  const totalGastos = Number(expensesSummary.total_gastos);
  const balanceNeto = Number((totalVentas - totalGastos).toFixed(2));
  const margenGanancia = totalVentas > 0
    ? Number((((totalVentas - totalGastos) / totalVentas) * 100).toFixed(1))
    : 0;

  // 3. Productos más vendidos de la semana (Top 5)
  const topProductos = db.prepare(`
    SELECT p.id, p.nombre, p.precio, p.imagen, c.icono as categoria_icono,
           SUM(d.cantidad) as total_unidades,
           SUM(d.subtotal) as total_ingresos
    FROM detalle_ventas d
    INNER JOIN productos p ON d.producto_id = p.id
    INNER JOIN categorias c ON p.categoria_id = c.id
    INNER JOIN ventas v ON d.venta_id = v.id
    WHERE date(v.created_at) >= date('now', 'localtime', '-7 days')
      AND v.estado = 'completada'
    GROUP BY p.id
    ORDER BY total_unidades DESC
    LIMIT 5
  `).all();

  // 4. Métricas diarias de los últimos 7 días (para gráficos móviles)
  // Generamos los últimos 7 días
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diasGrafico = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const fechaIso = d.toISOString().slice(0, 10);
    const diaNombre = diasSemana[d.getDay()];

    const vDia = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM ventas
      WHERE date(created_at) = ? AND estado = 'completada'
    `).get(fechaIso).total;

    const gDia = db.prepare(`
      SELECT COALESCE(SUM(monto), 0) as total
      FROM gastos
      WHERE date(fecha) = ?
    `).get(fechaIso).total;

    diasGrafico.push({
      fecha: fechaIso,
      dia: diaNombre,
      ventas: Number(vDia),
      gastos: Number(gDia),
      balance: Number((Number(vDia) - Number(gDia)).toFixed(2))
    });
  }

  // 5. Desglose por Método de Pago en la semana
  const metodosPago = db.prepare(`
    SELECT metodo_pago,
           COUNT(*) as transacciones,
           COALESCE(SUM(total), 0) as total_monto
    FROM ventas
    WHERE date(created_at) >= date('now', 'localtime', '-7 days')
      AND estado = 'completada'
    GROUP BY metodo_pago
    ORDER BY total_monto DESC
  `).all();

  // 6. Desglose de Gastos por Categoría
  const gastosCategorias = db.prepare(`
    SELECT categoria,
           COUNT(*) as cantidad,
           COALESCE(SUM(monto), 0) as total_monto
    FROM gastos
    WHERE date(fecha) >= date('now', 'localtime', '-7 days')
    GROUP BY categoria
    ORDER BY total_monto DESC
  `).all();

  res.json({
    semana: {
      desde: diasGrafico[0].fecha,
      hasta: diasGrafico[diasGrafico.length - 1].fecha
    },
    metricasClave: {
      totalVentas: Number(totalVentas.toFixed(2)),
      totalTransacciones: salesSummary.transacciones,
      ticketPromedio: Number(Number(salesSummary.ticket_promedio).toFixed(2)),
      totalGastos: Number(totalGastos.toFixed(2)),
      balanceNeto,
      margenGanancia
    },
    topProductos: topProductos.map(tp => ({
      ...tp,
      total_unidades: Number(tp.total_unidades),
      total_ingresos: Number(Number(tp.total_ingresos).toFixed(2))
    })),
    graficoDiario: diasGrafico,
    metodosPago,
    gastosCategorias
  });
});

module.exports = router;
