// ============================================================================
// RUTAS DE CATÁLOGO Y PRODUCTOS
// ============================================================================
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authenticateUser } = require('../middleware/auth');

/**
 * GET /api/products
 * Lista de productos activos con su categoría
 */
router.get('/', (req, res) => {
  const db = getDb();
  const products = db.prepare(`
    SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen, p.activo,
           c.id as categoria_id, c.nombre as categoria_nombre, c.icono as categoria_icono
    FROM productos p
    INNER JOIN categorias c ON p.categoria_id = c.id
    WHERE p.activo = 1
    ORDER BY c.orden ASC, p.id ASC
  `).all();

  // Obtener insumos requeridos por producto (receta)
  const recipes = db.prepare(`
    SELECT r.producto_id, r.cantidad_requerida, i.id as insumo_id, i.nombre as insumo_nombre, i.unidad_medida, i.stock_actual
    FROM recetas_insumos r
    INNER JOIN insumos i ON r.insumo_id = i.id
  `).all();

  const recipeMap = {};
  recipes.forEach(r => {
    if (!recipeMap[r.producto_id]) recipeMap[r.producto_id] = [];
    recipeMap[r.producto_id].push({
      insumoId: r.insumo_id,
      nombre: r.insumo_nombre,
      unidad: r.unidad_medida,
      cantidadRequerida: r.cantidad_requerida,
      stockActual: r.stock_actual
    });
  });

  const formatted = products.map(p => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: Number(p.precio),
    imagen: p.imagen,
    categoriaId: p.categoria_id,
    categoriaNombre: p.categoria_nombre,
    categoriaIcono: p.categoria_icono,
    receta: recipeMap[p.id] || []
  }));

  res.json({ products: formatted });
});

/**
 * GET /api/categories
 * Lista de categorías disponibles
 */
router.get('/categories', (req, res) => {
  const db = getDb();
  const categories = db.prepare('SELECT * FROM categorias ORDER BY orden ASC').all();
  res.json({ categories });
});

module.exports = router;
