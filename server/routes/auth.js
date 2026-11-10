// ============================================================================
// RUTAS DE AUTENTICACIÓN: LOGIN Y PERFIL
// ============================================================================
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { verifyPassword, generateToken, authenticateUser } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Iniciar sesión para personal interno (Admin o Empleado)
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM usuarios WHERE email = ? AND activo = 1').get(email.trim().toLowerCase());

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
  }

  const token = generateToken({
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol
  });

  res.json({
    message: 'Inicio de sesión exitoso',
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      telefono: user.telefono
    }
  });
});

/**
 * GET /api/auth/me
 * Obtener datos del usuario autenticado
 */
router.get('/me', authenticateUser, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, nombre, email, rol, telefono, created_at FROM usuarios WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json({ user });
});

module.exports = router;
