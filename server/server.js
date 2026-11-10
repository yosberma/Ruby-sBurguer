// ============================================================================
// SERVIDOR PRINCIPAL BACKEND: RUBY'S BURGER & DOGS API & PWA HOST
// ============================================================================
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { getDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar la base de datos y sembrar datos iniciales si no existen
getDb();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de la aplicación PWA (Frontend)
const publicPath = path.join(__dirname, '..');
app.use(express.static(publicPath));

// Rutas de la API RESTful
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/reports', require('./routes/reports'));

// Endpoint de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    sistema: "Ruby's Burger & Dogs POS & Control API",
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas del Frontend (Single Page App / PWA fallback)
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint de API no encontrado' });
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('⚠️ Error no controlado en servidor:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🍔 RUBY'S BURGER & DOGS - BACKEND & PWA SERVER INICIADO`);
    console.log(`🚀 Escuchando en: http://localhost:${PORT}`);
    console.log(`📱 Diseñado para iOS iPhone y Android PWA`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
