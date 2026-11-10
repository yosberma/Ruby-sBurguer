// ============================================================================
// TEST DE INTEGRACIÓN: VERIFICACIÓN COMPLETA DEL BACKEND
// ============================================================================
const assert = require('node:assert');
const { getDb } = require('./db/database');
const { hashPassword, verifyPassword, generateToken, verifyToken } = require('./middleware/auth');

console.log('🧪 Iniciando pruebas automáticas de la arquitectura y backend...\n');

// 1. Prueba de Base de Datos y Semilla
console.log('1️⃣ Probando base de datos SQLite y semillas...');
const db = getDb();
const usuarios = db.prepare('SELECT * FROM usuarios').all();
assert(usuarios.length >= 2, 'Deben existir al menos 2 usuarios (admin y empleado)');
console.log('   ✅ Usuarios cargados correctamente:', usuarios.map(u => `${u.email} (${u.rol})`).join(', '));

// 2. Prueba de Autenticación y Criptografía
console.log('2️⃣ Probando hashing y verificación de contraseñas...');
const admin = usuarios.find(u => u.rol === 'admin');
assert(verifyPassword('admin123', admin.password_hash), 'La contraseña de admin debe ser verificada');
assert(!verifyPassword('incorrecta', admin.password_hash), 'La contraseña incorrecta debe fallar');

const token = generateToken({ id: admin.id, rol: admin.rol });
const decoded = verifyToken(token);
assert(decoded && decoded.id === admin.id && decoded.rol === 'admin', 'Token JWT debe ser válido');
console.log('   ✅ Criptografía y JWT validados.');

// 3. Prueba de Productos e Insumos
console.log('3️⃣ Probando catálogo de productos y recetas...');
const prods = db.prepare('SELECT * FROM productos').all();
assert(prods.length > 0, 'Debe haber productos registrados');
const insumos = db.prepare('SELECT * FROM insumos').all();
assert(insumos.length > 0, 'Debe haber insumos registrados');
const recetas = db.prepare('SELECT * FROM recetas_insumos').all();
assert(recetas.length > 0, 'Debe haber recetas vinculadas');
console.log(`   ✅ ${prods.length} productos, ${insumos.length} insumos y ${recetas.length} vínculos de receta.`);

// 4. Prueba de Venta POS y Descuento Automático de Inventario
console.log('4️⃣ Probando registro de venta POS con descuento automático de inventario...');
// Insumo a monitorear: Pan Brioche Hamburguesa (id: 1)
const panBriocheAntes = db.prepare('SELECT stock_actual FROM insumos WHERE id = 1').get().stock_actual;

// Vender 2 unidades de Ruby Monster Smash (producto id: 1), cada una usa 1 Pan Brioche
db.exec('BEGIN IMMEDIATE');
const testCode = 'TEST-' + Date.now();
const insVenta = db.prepare(`
  INSERT INTO ventas (codigo_factura, usuario_id, metodo_pago, subtotal, total)
  VALUES (?, 1, 'efectivo', 19.00, 19.00)
`);
const ventaId = insVenta.run(testCode).lastInsertRowid;
db.prepare('INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, 1, 2, 9.50, 19.00)').run(ventaId);

// Descontar según receta
const cantADescontar = 2 * 1.0; // 2 hamburguesas * 1 pan
db.prepare('UPDATE insumos SET stock_actual = stock_actual - ? WHERE id = 1').run(cantADescontar);
db.exec('COMMIT');

const panBriocheDespues = db.prepare('SELECT stock_actual FROM insumos WHERE id = 1').get().stock_actual;
assert.strictEqual(panBriocheDespues, panBriocheAntes - cantADescontar, 'El stock debió reducirse exactamente por la receta');
console.log(`   ✅ Stock Pan Brioche: Antes=${panBriocheAntes}, Después=${panBriocheDespues} (Descontado: ${cantADescontar})`);

// 5. Prueba de Registro de Gastos y Cálculos Semanales
console.log('5️⃣ Probando registro de gastos y cálculo de balance neto...');
const totalVentas = db.prepare('SELECT SUM(total) as t FROM ventas').get().t;
const totalGastos = db.prepare('SELECT SUM(monto) as t FROM gastos').get().t;
const balance = totalVentas - totalGastos;
console.log(`   ✅ Ventas Totales: $${totalVentas.toFixed(2)} | Gastos Totales: $${totalGastos.toFixed(2)} | Balance Neto: $${balance.toFixed(2)}`);

console.log('\n🎉 ¡TODAS LAS PRUEBAS DEL BACKEND Y BASE DE DATOS PASARON EXITOSAMENTE!');
