import jwt from 'jsonwebtoken';

/**
 * Middleware factory that ensures the request carries a valid JWT and that the
 * decoded token contains one of the allowed roles.
 *
 * It gracefully handles missing environment secrets by falling back to a
 * hard‑coded default (useful for local development) and provides clearer error
 * messages for missing/invalid tokens.
 */
export const requireRole = (...allowedRoles) => (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }

    // Use the secret from env or a safe fallback for development/testing.
    const secret = process.env.JWT_SECRET || 'default_jwt_secret';

    const decoded = jwt.verify(token, secret);

    // Ensure the token contains a role and that it matches one of the allowed roles.
    if (!decoded.role) {
      return res.status(403).json({ message: 'Token does not contain a role' });
    }
    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }

    // Attach user info to request for downstream handlers.
    req.user = { id: decoded.id, role: decoded.role, username: decoded.username };
    next();
  } catch (err) {
    console.error('Auth error:', err);
    // Distinguish token expiration from other verification errors if needed.
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
