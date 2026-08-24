import jwt from 'jsonwebtoken';

/**
 * Middleware to verify a JWT and optionally enforce allowed roles.
 *
 * - Uses `process.env.JWT_SECRET` if defined, otherwise falls back to a
 *   hard‑coded development secret (`'default_secret'`).
 * - Gracefully handles missing or malformed tokens, returning 401 with a
 *   clear message.
 * - If `allowedRoles` are provided, the decoded token's `role` must be one of
 *   them; otherwise a 403 is returned. When no roles are supplied, any valid
 *   token is accepted.
 */
export const requireRole = (...allowedRoles) => (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: token missing' });
    }

    // Use fallback secret if JWT_SECRET is not set (useful for local dev)
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secret);

    // If specific roles are required, enforce them
    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }

    // Attach user info to request for downstream handlers
    req.user = {
      id: decoded.id,
      role: decoded.role,
      username: decoded.username,
    };
    next();
  } catch (err) {
    console.error('Auth error:', err);
    // Distinguish token expiration vs other verification errors when possible
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ message });
  }
};
