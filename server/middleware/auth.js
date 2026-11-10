// ============================================================================
// SISTEMA DE AUTENTICACIÓN Y ROLES (JWT CON CRIPTOGRAFÍA NATIVA)
// ============================================================================
const crypto = require('node:crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'rubys_burger_super_secret_key_2026';

/**
 * Genera un hash seguro para contraseñas utilizando PBKDF2/scrypt
 */
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifica una contraseña en texto plano contra el hash almacenado
 */
function verifyPassword(password, storedCombined) {
  if (!storedCombined || !storedCombined.includes(':')) return false;
  const [salt, originalHash] = storedCombined.split(':');
  const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(computedHash, 'hex'));
}

/**
 * Codifica en Base64 URL Safe
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decodifica desde Base64 URL Safe
 */
function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Genera un token JWT firmado con HMAC-SHA256
 */
function generateToken(payload, expiresInSeconds = 86400 * 7) { // 7 días para app móvil
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

/**
 * Verifica y extrae el contenido de un token JWT
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null; // Expirado
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Middleware para validar que el usuario esté autenticado
 */
function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado. Token requerido.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido o expirado. Por favor inicia sesión nuevamente.' });
  }

  req.user = decoded;
  next();
}

/**
 * Middleware para restringir acceso por roles (ej: ['admin'] o ['admin', 'empleado'])
 */
function requireRoles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        error: `Permiso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  authenticateUser,
  requireRoles
};
