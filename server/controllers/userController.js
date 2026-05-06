import { dbRun, dbGet } from '../config/database.js';

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
      'SELECT id, user_id, first_name, last_name, email, mobile, preferred_currency FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ message: 'Profile updated', user: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}
