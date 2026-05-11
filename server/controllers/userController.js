import { dbRun, dbGet, dbAll } from '../config/database.js';

export function getProfile(req, res) {
  res.json({ user: req.user });
}

export function updateProfile(req, res) {
  try {
    const { firstName, lastName, mobile, preferredCurrency } = req.body;

    dbRun(`
      UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name),
        mobile = COALESCE(?, mobile), preferred_currency = COALESCE(?, preferred_currency),
        updated_at = datetime('now')
      WHERE id = ?
    `, [firstName || null, lastName || null, mobile || null, preferredCurrency || null, req.user.id]);

    const updated = dbGet(
      'SELECT id, user_id, first_name, last_name, email, mobile, preferred_currency, is_admin FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ message: 'Profile updated', user: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

export function getAllUsers(req, res) {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    const users = dbAll(
      'SELECT id, user_id, first_name, last_name, email, mobile, is_verified, is_admin, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}
