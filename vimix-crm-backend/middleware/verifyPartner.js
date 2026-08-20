import jwt from 'jsonwebtoken';

export const requireRole = (...allowedRoles) => (req, res, next) => {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!allowedRoles.includes(decoded.role))
      return res.status(403).json({ message: 'Forbidden' });

    // Attach user info to request
    req.user = { id: decoded.id, role: decoded.role, username: decoded.username };
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
