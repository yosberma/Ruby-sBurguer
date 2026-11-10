// ============================================================================
// CONEXIÓN Y GESTOR DE BASE DE DATOS SQLITE (Node.js 24 Native)
// ============================================================================
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const { hashPassword } = require('../middleware/auth');

const DB_PATH = path.join(__dirname, 'rubys.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Instancia de conexión síncrona nativa ultrarrápida
let db;

function getDb() {
  if (!db) {
    const isNew = !fs.existsSync(DB_PATH);
    db = new DatabaseSync(DB_PATH);
    
    // Configuración de rendimiento y seguridad
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA synchronous = NORMAL;');

    // Inicializar esquema
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schemaSql);

    // Si es nueva base de datos o está vacía, sembrar datos iniciales
    seedInitialData(db);
  }
  return db;
}

function seedInitialData(database) {
  const userCount = database.prepare('SELECT COUNT(*) as count FROM usuarios').get().count;
  if (userCount > 0) return; // Ya contiene datos

  console.log('🌱 Inicializando datos semilla para Ruby\'s Burger & Dogs...');

  database.exec('BEGIN TRANSACTION');

  try {
    // 1. Usuarios del personal
    const insertUser = database.prepare(`
      INSERT INTO usuarios (nombre, email, password_hash, rol, telefono)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Contraseña por defecto: admin123
    const adminHash = hashPassword('admin123');
    insertUser.run('Carlos Rodríguez (Admin)', 'admin@rubys.com', adminHash, 'admin', '+58 412 111 2233');

    // Contraseña por defecto: cajero123
    const cajeroHash = hashPassword('cajero123');
    insertUser.run('María Morales (Cajera)', 'cajero@rubys.com', cajeroHash, 'empleado', '+58 414 444 5566');

    // 2. Categorías del Menú
    const insertCategory = database.prepare(`
      INSERT INTO categorias (nombre, icono, orden) VALUES (?, ?, ?)
    `);
    insertCategory.run('Hamburguesas', '🍔', 1);
    insertCategory.run('Perros Calientes', '🌭', 2);
    insertCategory.run('Acompañantes', '🍟', 3);
    insertCategory.run('Bebidas', '🥤', 4);

    // 3. Productos del Menú
    const insertProd = database.prepare(`
      INSERT INTO productos (categoria_id, nombre, descripcion, precio, imagen)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Hamburguesas (Cat 1)
    insertProd.run(1, 'Ruby Monster Smash', 'Doble carne Angus smash 120g, doble queso cheddar fundido, tocineta ahumada y salsa secreta Ruby en pan brioche.', 9.50, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80');
    insertProd.run(1, 'Classic Bacon Burger', 'Carne Angus 150g, queso cheddar, tocineta crujiente, cebolla y salsa especial.', 8.00, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=400&q=80');
    insertProd.run(1, 'Crispy Chicken Burger', 'Pechuga crujiente empanizada al estilo Ruby, pepinillos, cheddar y salsa tártara.', 7.50, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=400&q=80');
    insertProd.run(1, 'Smash Sencilla Jr.', 'Carne Angus smash 100g, queso cheddar fundido y aderezo Ruby en pan suave.', 5.50, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80');

    // Perros Calientes (Cat 2)
    insertProd.run(2, 'Ruby Hot Dog Especial', 'Salchicha Jumbo ahumada, queso cheddar líquido, tocineta picada, papitas ralladas y salsa de la casa.', 4.50, 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=400&q=80');
    insertProd.run(2, 'Chili Cheese Dog', 'Salchicha Jumbo a la plancha, carne con chili artesanal picante suave y doble queso cheddar fundido.', 5.50, 'https://images.unsplash.com/photo-1627054234594-e53bfa595088?auto=format&fit=crop&w=400&q=80');

    // Acompañantes (Cat 3)
    insertProd.run(3, 'Papas Fritas Rústicas', 'Porción generosa de papas crujientes con sal marina sazonada.', 3.00, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80');
    insertProd.run(3, 'Papas Bacon & Cheddar', 'Papas fritas cubiertas de queso cheddar cremoso y lluvia de tocineta crujiente.', 4.50, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=400&q=80');

    // Bebidas (Cat 4)
    insertProd.run(4, 'Refresco Lata 355ml', 'Coca-Cola, Sprite, Fanta o Nestea bien frío.', 1.75, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80');
    insertProd.run(4, 'Agua Mineral 500ml', 'Agua purificada de manantial.', 1.00, 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80');

    // 4. Insumos y Mercancía (Inventario con alertas visuales)
    const insertInsumo = database.prepare(`
      INSERT INTO insumos (nombre, categoria, unidad_medida, stock_actual, stock_minimo, costo_unitario, proveedor_habitual)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Insumos normales y con stock bajo a propósito para probar alertas visuales
    insertInsumo.run('Pan Brioche Hamburguesa', 'Panadería', 'unidades', 45.0, 20.0, 0.45, 'Panadería El Sol');
    insertInsumo.run('Pan Perro Caliente', 'Panadería', 'unidades', 35.0, 15.0, 0.35, 'Panadería El Sol');
    insertInsumo.run('Carne Angus Smash (Bolitas 60g)', 'Carnes y Embutidos', 'unidades', 80.0, 30.0, 0.90, 'Frigorífico Central');
    insertInsumo.run('Carne Res 150g Clásica', 'Carnes y Embutidos', 'unidades', 22.0, 15.0, 1.80, 'Frigorífico Central');
    insertInsumo.run('Salchicha Jumbo Frankfurt', 'Carnes y Embutidos', 'unidades', 40.0, 20.0, 0.85, 'Embutidos Ruby');
    insertInsumo.run('Pechuga Pollo Apanada', 'Carnes y Embutidos', 'unidades', 16.0, 10.0, 1.40, 'Avícola San José');
    insertInsumo.run('Queso Cheddar Rebanado', 'Lácteos', 'rebanadas', 90.0, 30.0, 0.20, 'Distribuidora Lácteos');
    insertInsumo.run('Tocineta Ahumada Picada', 'Carnes y Embutidos', 'porciones', 60.0, 25.0, 0.50, 'Embutidos Ruby');
    insertInsumo.run('Papas Fritas Congeladas', 'Vegetales', 'kg', 14.0, 8.0, 2.20, 'Importadora FoodService');
    
    // Insumos con STOCK BAJO (para ver alertas)
    insertInsumo.run('Salsa Ruby de la Casa', 'Salsas', 'litros', 1.8, 3.0, 4.50, 'Producción Interna'); // ALERTA BAJO STOCK
    insertInsumo.run('Cheddar Líquido Especial', 'Lácteos', 'litros', 1.2, 2.0, 5.20, 'Distribuidora Lácteos'); // ALERTA BAJO STOCK
    insertInsumo.run('Caja Hamburguesa Kraft', 'Empaques', 'unidades', 8.0, 25.0, 0.18, 'Empaques EcoPack'); // ALERTA CRÍTICO
    insertInsumo.run('Caja Perro Caliente Kraft', 'Empaques', 'unidades', 28.0, 20.0, 0.12, 'Empaques EcoPack');
    insertInsumo.run('Papel Antigrasa & Servilletas', 'Empaques', 'paquetes', 3.0, 6.0, 1.50, 'Empaques EcoPack'); // ALERTA BAJO STOCK
    insertInsumo.run('Refrescos Lata Surtidos', 'Bebidas', 'unidades', 38.0, 20.0, 0.80, 'Distribuidora Polar / Coca-Cola');

    // 5. Recetas (Escandallo para descuento automático)
    const insertRecipe = database.prepare(`
      INSERT INTO recetas_insumos (producto_id, insumo_id, cantidad_requerida)
      VALUES (?, ?, ?)
    `);

    // Ruby Monster Smash (Prod 1): 1 Pan Brioche, 2 Bolitas Smash, 2 Queso Cheddar, 1 Tocineta, 0.03 Salsa Ruby, 1 Caja Hamburguesa
    insertRecipe.run(1, 1, 1.0);  // Pan Brioche
    insertRecipe.run(1, 3, 2.0);  // 2 Bolitas Smash 60g = 120g
    insertRecipe.run(1, 7, 2.0);  // 2 Cheddar
    insertRecipe.run(1, 8, 1.0);  // 1 Tocineta
    insertRecipe.run(1, 10, 0.03); // 30ml Salsa Ruby
    insertRecipe.run(1, 12, 1.0); // 1 Caja Kraft

    // Classic Bacon Burger (Prod 2): 1 Pan Brioche, 1 Carne 150g, 1 Queso Cheddar, 1 Tocineta, 1 Caja
    insertRecipe.run(2, 1, 1.0);
    insertRecipe.run(2, 4, 1.0);
    insertRecipe.run(2, 7, 1.0);
    insertRecipe.run(2, 8, 1.0);
    insertRecipe.run(2, 12, 1.0);

    // Crispy Chicken Burger (Prod 3): 1 Pan Brioche, 1 Pechuga Pollo, 1 Queso Cheddar, 1 Caja
    insertRecipe.run(3, 1, 1.0);
    insertRecipe.run(3, 6, 1.0);
    insertRecipe.run(3, 7, 1.0);
    insertRecipe.run(3, 12, 1.0);

    // Smash Sencilla Jr. (Prod 4): 1 Pan Brioche, 1 Bolita Smash, 1 Queso Cheddar, 1 Caja
    insertRecipe.run(4, 1, 1.0);
    insertRecipe.run(4, 3, 1.0);
    insertRecipe.run(4, 7, 1.0);
    insertRecipe.run(4, 12, 1.0);

    // Ruby Hot Dog Especial (Prod 5): 1 Pan Perro, 1 Salchicha Jumbo, 0.03 Cheddar Líquido, 1 Caja Perro
    insertRecipe.run(5, 2, 1.0);
    insertRecipe.run(5, 5, 1.0);
    insertRecipe.run(5, 11, 0.03);
    insertRecipe.run(5, 13, 1.0);

    // Chili Cheese Dog (Prod 6): 1 Pan Perro, 1 Salchicha Jumbo, 0.04 Cheddar Líquido, 1 Caja Perro
    insertRecipe.run(6, 2, 1.0);
    insertRecipe.run(6, 5, 1.0);
    insertRecipe.run(6, 11, 0.04);
    insertRecipe.run(6, 13, 1.0);

    // Papas Fritas Rústicas (Prod 7): 0.25 kg papas congeladas, 1 paquete servilleta / envoltura
    insertRecipe.run(7, 9, 0.25);

    // Papas Bacon & Cheddar (Prod 8): 0.25 kg papas, 0.04 cheddar líquido, 1 tocineta
    insertRecipe.run(8, 9, 0.25);
    insertRecipe.run(8, 11, 0.04);
    insertRecipe.run(8, 8, 1.0);

    // Refresco Lata (Prod 9): 1 refresco
    insertRecipe.run(9, 15, 1.0);

    // 6. Gastos iniciales (para alimentar estadísticas semanales inmediatas)
    const insertGasto = database.prepare(`
      INSERT INTO gastos (usuario_id, descripcion, categoria, proveedor, monto, fecha, comprobante)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const hoy = new Date().toISOString().split('T')[0];
    const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const hace3Dias = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
    const hace5Dias = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];

    insertGasto.run(1, 'Compra semanal de carnes y tocineta', 'Insumos y Mercancía', 'Frigorífico Central', 145.00, hace5Dias, 'FAC-00891');
    insertGasto.run(1, 'Lote de panes brioche y panes de perro', 'Insumos y Mercancía', 'Panadería El Sol', 45.00, hace3Dias, 'FAC-00432');
    insertGasto.run(1, 'Cajas biodegradables y servilletas', 'Empaques', 'Empaques EcoPack', 32.50, ayer, 'REC-7712');
    insertGasto.run(1, 'Recarga cilindros de gas industrial', 'Servicios Públicos', 'Gas Del Este', 25.00, ayer, 'REC-9941');
    insertGasto.run(1, 'Mantenimiento preventivo freidora doble', 'Mantenimiento', 'Técnicos FríoGas', 40.00, hoy, 'FAC-1022');

    // 7. Ventas iniciales simuladas para poblar dashboard semanal
    const insertVenta = database.prepare(`
      INSERT INTO ventas (codigo_factura, usuario_id, metodo_pago, subtotal, impuestos, total, estado, notas, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'completada', ?, ?)
    `);
    const insertDetalle = database.prepare(`
      INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Venta hace 4 días
    let v1 = insertVenta.run('RB-1001', 2, 'pago_movil', 19.00, 0, 19.00, 'Consumo en mesa', `${hace5Dias} 19:30:00`);
    insertDetalle.run(v1.lastInsertRowid, 1, 2, 9.50, 19.00);

    // Venta hace 3 días
    let v2 = insertVenta.run('RB-1002', 2, 'efectivo', 28.50, 0, 28.50, 'Para llevar', `${hace3Dias} 20:15:00`);
    insertDetalle.run(v2.lastInsertRowid, 1, 2, 9.50, 19.00);
    insertDetalle.run(v2.lastInsertRowid, 7, 2, 3.00, 6.00);
    insertDetalle.run(v2.lastInsertRowid, 9, 2, 1.75, 3.50);

    // Venta ayer
    let v3 = insertVenta.run('RB-1003', 2, 'tarjeta', 22.50, 0, 22.50, 'Mesa 3', `${ayer} 21:00:00`);
    insertDetalle.run(v3.lastInsertRowid, 2, 2, 8.00, 16.00);
    insertDetalle.run(v3.lastInsertRowid, 5, 1, 4.50, 4.50);
    insertDetalle.run(v3.lastInsertRowid, 10, 2, 1.00, 2.00);

    // Venta hoy
    let v4 = insertVenta.run('RB-1004', 2, 'zelle', 31.00, 0, 31.00, 'Pedido rápido', `${hoy} 13:45:00`);
    insertDetalle.run(v4.lastInsertRowid, 1, 2, 9.50, 19.00);
    insertDetalle.run(v4.lastInsertRowid, 8, 1, 4.50, 4.50);
    insertDetalle.run(v4.lastInsertRowid, 6, 1, 5.50, 5.50);
    insertDetalle.run(v4.lastInsertRowid, 9, 1, 1.75, 1.75);

    database.exec('COMMIT');
    console.log('✅ Base de datos SQLite inicializada exitosamente con datos semilla.');
  } catch (error) {
    database.exec('ROLLBACK');
    console.error('❌ Error al sembrar base de datos:', error);
  }
}

module.exports = {
  getDb
};
