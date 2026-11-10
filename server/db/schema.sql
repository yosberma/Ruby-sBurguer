-- ============================================================================
-- ESQUEMA DE BASE DE DATOS RELACIONAL: RUBY'S BURGER & DOGS
-- Compatible con SQLite 3 y adaptable a PostgreSQL / MySQL
-- ============================================================================

-- Habilitar integridad referencial (llaves foráneas)
PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. TABLA: USUARIOS Y ROLES (Autenticación y Control de Acceso)
-- Roles soportados: 'admin' (Gerencia/Dueño) y 'empleado' (Cajero/Operativo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK(rol IN ('admin', 'empleado')),
    telefono VARCHAR(30),
    activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. TABLA: CATEGORÍAS DE PRODUCTOS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(60) NOT NULL UNIQUE,
    icono VARCHAR(40) DEFAULT '🍔',
    orden INTEGER DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- 3. TABLA: PRODUCTOS (Menú de Ventas: Hamburguesas, Perros, Bebidas, Combos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL CHECK(precio >= 0),
    imagen VARCHAR(255),
    activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ----------------------------------------------------------------------------
-- 4. TABLA: INVENTARIO DE INSUMOS Y MERCANCÍA (Stock de materias primas)
-- Registra panes, carnes, salchichas, salsas, quesos, empaques, etc.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insumos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(120) NOT NULL UNIQUE,
    categoria VARCHAR(60) NOT NULL, -- 'Panadería', 'Carnes y Embutidos', 'Lácteos', 'Vegetales', 'Salsas', 'Empaques', 'Bebidas'
    unidad_medida VARCHAR(20) NOT NULL, -- 'unidades', 'kg', 'litros', 'gramos', 'paquetes'
    stock_actual DECIMAL(12, 3) NOT NULL DEFAULT 0 CHECK(stock_actual >= 0),
    stock_minimo DECIMAL(12, 3) NOT NULL DEFAULT 5, -- Umbral para disparo de alerta visual
    costo_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0,
    proveedor_habitual VARCHAR(120),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. TABLA: RECETAS / ESCANDALLO (Relación Producto -> Insumos)
-- Permite el descuento automático exacto de insumos tras cada venta realizada
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recetas_insumos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    insumo_id INTEGER NOT NULL,
    cantidad_requerida DECIMAL(10, 3) NOT NULL CHECK(cantidad_requerida > 0),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE RESTRICT,
    UNIQUE(producto_id, insumo_id)
);

-- ----------------------------------------------------------------------------
-- 6. TABLA: MOVIMIENTOS DE INVENTARIO (Kárdex / Auditoría de Stock)
-- Registra entradas de compra, salidas por venta, mermas o ajustes manuales
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insumo_id INTEGER NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK(tipo IN ('entrada_compra', 'salida_venta', 'merma', 'ajuste')),
    cantidad DECIMAL(12, 3) NOT NULL,
    stock_anterior DECIMAL(12, 3) NOT NULL,
    stock_posterior DECIMAL(12, 3) NOT NULL,
    motivo TEXT,
    referencia_id INTEGER, -- ID de venta o ID de gasto/compra asociado
    usuario_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- 7. TABLA: VENTAS (Encabezado de Transacciones de Punto de Venta)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_factura VARCHAR(40) NOT NULL UNIQUE,
    usuario_id INTEGER NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL CHECK(metodo_pago IN ('efectivo', 'tarjeta', 'pago_movil', 'transferencia', 'zelle')),
    subtotal DECIMAL(10, 2) NOT NULL CHECK(subtotal >= 0),
    impuestos DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK(impuestos >= 0),
    total DECIMAL(10, 2) NOT NULL CHECK(total >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'completada' CHECK(estado IN ('completada', 'anulada')),
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- ----------------------------------------------------------------------------
-- 8. TABLA: DETALLE DE VENTAS (Ítems individuales por transacción)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK(cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK(precio_unitario >= 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK(subtotal >= 0),
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
);

-- ----------------------------------------------------------------------------
-- 9. TABLA: GASTOS Y COMPRAS (Egresos Operacionales y Adquisición de Insumos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    categoria VARCHAR(60) NOT NULL CHECK(categoria IN ('Insumos y Mercancía', 'Empaques', 'Servicios Públicos', 'Nómina', 'Mantenimiento', 'Otros')),
    proveedor VARCHAR(120),
    monto DECIMAL(10, 2) NOT NULL CHECK(monto > 0),
    fecha DATE NOT NULL,
    comprobante VARCHAR(100),
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- ----------------------------------------------------------------------------
-- ÍNDICES DE RENDIMIENTO (Optimización para búsquedas y reportes rápidos en móvil)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(created_at);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_prod ON detalle_ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_insumos_stock ON insumos(stock_actual, stock_minimo);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);
CREATE INDEX IF NOT EXISTS idx_movimientos_insumo ON movimientos_inventario(insumo_id, created_at);
