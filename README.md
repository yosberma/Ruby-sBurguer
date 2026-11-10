# 🍔 Ruby's Burger & Dogs - POS Móvil, Inventario & Gestión Financiera (PWA)

Sistema integral de **Punto de Venta (POS) rápido, Control de Inventario con escandallo/recetas, Registro de Gastos y Reportes Financieros Semanales**, desarrollado específicamente para el personal interno de **Ruby's Burger & Dogs**.

La aplicación está diseñada bajo el estándar **Mobile-First** y optimizada al 100% para pantallas táctiles de **iOS (iPhone con soporte de Notch / Dynamic Island)** y **Android**, operando como una **Progressive Web App (PWA)** instalable en la pantalla de inicio con soporte de caché fuera de línea.

---

## 🏗️ Arquitectura del Sistema

```
Ruby-sBurguer/
├── index.html                 # Frontend PWA (Mobile-first, vistas SPA: POS, Stock, Gastos, Reportes)
├── styles.css                 # Estilos táctiles iOS HIG, Dark Mode Ruby's, Safe Areas (env)
├── app.js                     # Controlador modular JS (Gestión de estado, llamadas API, gráficos SVG)
├── manifest.json              # Manifiesto PWA para instalación nativa en iOS/Android
├── sw.js                      # Service Worker para ejecución offline y aceleración de carga
├── package.json               # Configuración de dependencias (Node 24+, Express 5, CORS)
└── server/
    ├── server.js              # Servidor Express API RESTful & Static Host
    ├── test.js                # Suite de pruebas automatizadas E2E
    ├── middleware/
    │   └── auth.js            # Autenticación JWT y control de acceso por roles (Admin vs Empleado)
    ├── routes/
    │   ├── auth.js            # Login y validación de sesión
    │   ├── products.js        # Catálogo de productos y desglose de recetas
    │   ├── sales.js           # POS: registro de ventas y descuento automático de stock
    │   ├── inventory.js       # Control de existencias, kárdex y alertas de reposición
    │   ├── expenses.js        # Egresos operacionales con filtros temporales
    │   └── reports.js         # Reportes semanales, balance neto y gráficos diarios
    └── db/
        ├── schema.sql         # Esquema relacional DDL (SQLite / PostgreSQL / MySQL)
        ├── database.js        # Driver síncrono nativo (node:sqlite) y sembrado de datos
        └── rubys.db           # Base de datos relacional local (generada automáticamente)
```

---

## 📱 Módulos Principales Implementados

### 1. ⚡ Punto de Venta Rápido (POS Móvil)
* **Interfaz táctil en pocos toques**: Selección visual de productos agrupados por categorías (Hamburguesas, Perros Calientes, Acompañantes, Bebidas) y buscador en tiempo real.
* **Barra flotante de orden**: Conteo en vivo de productos y subtotal acumulado.
* **Bottom Sheet de Cobro (iOS Native Sheet)**: Control de cantidades `+`/`-`, notas de comanda o mesa, y selector táctil de métodos de pago (`Efectivo`, `Punto/Tarjeta`, `Pago Móvil`, `Zelle`).
* **Comprobante y Ticket**: Generación de código único de factura (ej. `RB-20261110-0001`) con confirmación inmediata y advertencias en pantalla si algún ingrediente quedó en stock bajo tras la venta.

### 2. 📦 Control de Inventario y Descuento Automático
* **Actualización automática por receta**: Al vender un producto (ej. *Ruby Monster Smash*), el sistema descuenta automáticamente del inventario la cantidad exacta de ingredientes vinculados (2 carnes smash, 1 pan brioche, 2 rebanadas de cheddar, 1 tocineta, salsa y empaque kraft) dentro de una transacción atómica `ACID`.
* **Semáforo visual de stock**:
  - 🚨 **Agotado**: Stock = 0 unidades (Borde rojo).
  - ⚠️ **Stock Crítico**: Stock $\le$ 50% del umbral mínimo (Borde naranja).
  - ⚡ **Stock Bajo**: Stock $\le$ umbral mínimo configurado (Borde amarillo).
  - ✅ **Nivel Óptimo**: Existencias suficientes (Borde verde).
* **Registro de movimientos**: Modal para entradas de reabastecimiento, mermas/desechos o ajustes de conteo físico con kárdex de auditoría.

### 3. 💸 Gestión de Gastos y Compras
* Registro de egresos con fecha, categoría (*Insumos y Mercancía*, *Empaques*, *Servicios Públicos*, *Nómina*, *Mantenimiento*, *Otros*), proveedor, comprobante y monto.
* **Filtros rápidos temporales**: Vista por **Hoy**, **Esta Semana**, **Este Mes** o histórico completo.
* Resumen en tiempo real del total gastado y desglose visual por categorías.

### 4. 📊 Reportes de Estadísticas Semanales
* **Resumen financiero automático**:
  - **Total Ventas**: Ingresos brutos y conteo de órdenes con cálculo de ticket promedio.
  - **Total Gastos**: Suma de compras operacionales de los últimos 7 días.
  - **Balance Neto**: Ganancia estimada en dólares ($) y porcentaje de margen de ganancia.
* **Gráfico diario visual ultra-ligero**: Renderizado en SVG nativo adaptado a pantallas Retina móviles sin librerías pesadas (Ventas vs. Gastos día por día).
* **Top 5 Productos Más Vendidos**: Ranking con barras de progreso, unidades despachadas e ingresos generados.
* **Distribución de Métodos de Pago**: Proporción de transacciones por canal.

### 5. 👥 Control de Acceso por Roles (RBAC)
* **Administrador (`admin`)**: Acceso completo a métricas financieras, configuración de umbrales de stock, auditoría y registro de egresos.
  - *Credenciales de prueba*: `admin@rubys.com` / `admin123`
* **Empleado / Cajero (`empleado`)**: Acceso directo al POS de ventas, visualización de existencias de insumos y comanda.
  - *Credenciales de prueba*: `cajero@rubys.com` / `cajero123`
* Incluye un selector rápido de perfil en la interfaz para alternar entre roles durante las pruebas operativas en el teléfono móvil.

---

## 🗄️ Esquema de la Base de Datos Relacional

El modelo implementa integridad referencial con claves foráneas activas (`PRAGMA foreign_keys = ON;`) y estructura normalizada:

| Tabla | Propósito Principal |
|---|---|
| `usuarios` | Personal del negocio, contraseñas hasheadas (`scrypt`), rol (`admin` / `empleado`) y estado activo. |
| `categorias` | Agrupación del menú (Hamburguesas, Perros, Acompañantes, Bebidas). |
| `productos` | Ítems para la venta con precio, nombre, descripción e imagen. |
| `insumos` | Materias primas y empaques en bodega, stock actual, stock mínimo y costo unitario. |
| `recetas_insumos` | Escandallo / Relación muchos a muchos (BOM) entre productos e insumos para descuento automático. |
| `movimientos_inventario`| Kárdex de auditoría (entradas, ventas, mermas, ajustes) con stock anterior y posterior. |
| `ventas` | Encabezado de la transacción, código de factura, método de pago, subtotal y total. |
| `detalle_ventas` | Renglones de la orden con producto, cantidad vendida y precio. |
| `gastos` | Egresos operacionales clasificados por categoría, fecha, proveedor y monto. |

---

## 📱 Configuración PWA para iOS (iPhone)

Para garantizar que Safari en iPhone trate la aplicación como una aplicación nativa:

1. **Metaetiqueta Viewport**:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
   ```
   *El parámetro `viewport-fit=cover` permite que la app ocupe el 100% de la pantalla hasta los bordes del Notch y Dynamic Island.*

2. **Capacidad de App Web e Iconos de Apple**:
   ```html
   <meta name="apple-mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
   <meta name="apple-mobile-web-app-title" content="Ruby's POS">
   <link rel="apple-touch-icon" href="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=180&q=80">
   ```

3. **Variables de Safe Area en CSS**:
   ```css
   padding-top: env(safe-area-inset-top);
   padding-bottom: env(safe-area-inset-bottom);
   ```

4. **Instalación en iPhone**:
   - Abrir la URL en Safari.
   - Presionar el botón **Compartir** de Safari (icono con flecha hacia arriba).
   - Seleccionar **"Añadir a la pantalla de inicio"**.

---

## 🚀 Puesta en Marcha

### Prerrequisitos
* Node.js v18+ (o Node.js v24 LTS recomendado)
* npm

### Ejecución
```bash
# Instalar dependencias
npm install

# Ejecutar suite de pruebas de integración backend
npm test

# Iniciar servidor backend y frontend PWA
npm start
```

Abrir en el navegador móvil o computadora:
```
http://localhost:3000
```
