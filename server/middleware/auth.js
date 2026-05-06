import { verifyToken } from '../utils/jwt.js';
import { dbGet } from '../config/database.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = dbGet(
    'SELECT id, user_id, first_name, last_name, email, mobile, preferred_currency, is_verified FROM users WHERE id = ?',
    [decoded.userId]
  );

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  next();
}
