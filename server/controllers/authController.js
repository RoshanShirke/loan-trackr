import bcrypt from 'bcryptjs';
import { dbRun, dbGet, dbAll } from '../config/database.js';
import { generateToken } from '../utils/jwt.js';
import { generateOTP, getOTPExpiry } from '../utils/otp.js';
import { sendOTPEmail } from '../utils/email.js';

export async function signup(req, res) {
  try {
    const { firstName, lastName, mobile, email, userId, password } = req.validatedData;

    if (dbGet('SELECT id FROM users WHERE user_id = ?', [userId])) {
      return res.status(409).json({ error: 'User ID already taken' });
    }
    if (dbGet('SELECT id FROM users WHERE email = ?', [email])) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    if (dbGet('SELECT id FROM users WHERE mobile = ?', [mobile])) {
      return res.status(409).json({ error: 'Mobile number already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const usersCountResult = dbGet('SELECT COUNT(*) as count FROM users');
    const isAdmin = usersCountResult.count === 0 ? 1 : 0;

    const result = dbRun(
      `INSERT INTO users (first_name, last_name, mobile, email, user_id, password_hash, is_verified, is_admin)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [firstName, lastName, mobile, email, userId, passwordHash, isAdmin]
    );

    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    dbRun('DELETE FROM otps WHERE email = ? AND is_used = 0', [email]);
    dbRun(
      'INSERT INTO otps (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [email, otp, 'signup', expiresAt]
    );

    await sendOTPEmail(email, otp, 'signup');

    res.status(201).json({
      message: 'Account created. Please verify your email.',
      email,
      pendingUserId: result.lastInsertRowid,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

export async function login(req, res) {
  try {
    const { userId, password } = req.validatedData;
    const rememberMe = req.body.rememberMe || false;

    const user = dbGet(
      'SELECT id, user_id, first_name, last_name, email, password_hash, is_verified, preferred_currency, is_admin FROM users WHERE user_id = ?',
      [userId]
    );

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.is_verified) {
      const otp = generateOTP();
      const expiresAt = getOTPExpiry();
      dbRun('DELETE FROM otps WHERE email = ? AND is_used = 0', [user.email]);
      dbRun(
        'INSERT INTO otps (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
        [user.email, otp, 'login', expiresAt]
      );
      await sendOTPEmail(user.email, otp, 'login');

      return res.status(403).json({
        error: 'Email not verified',
        email: user.email,
        requiresVerification: true,
      });
    }

    const token = generateToken(user.id, rememberMe);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        userId: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        preferredCurrency: user.preferred_currency,
        isAdmin: !!user.is_admin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const otpRecord = dbGet(
      "SELECT * FROM otps WHERE email = ? AND otp_code = ? AND is_used = 0 AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1",
      [email, otp]
    );

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    dbRun('UPDATE otps SET is_used = 1 WHERE id = ?', [otpRecord.id]);
    dbRun("UPDATE users SET is_verified = 1, updated_at = datetime('now') WHERE email = ?", [email]);

    const user = dbGet(
      'SELECT id, user_id, first_name, last_name, email, preferred_currency, is_admin FROM users WHERE email = ?',
      [email]
    );

    const token = generateToken(user.id, false);

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user.id,
        userId: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        preferredCurrency: user.preferred_currency,
        isAdmin: !!user.is_admin,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
}

export async function resendOTP(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    dbRun('DELETE FROM otps WHERE email = ? AND is_used = 0', [email]);

    const otp = generateOTP();
    const expiresAt = getOTPExpiry();
    dbRun(
      'INSERT INTO otps (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [email, otp, 'signup', expiresAt]
    );

    await sendOTPEmail(email, otp, 'signup');
    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
}

export function checkUserId(req, res) {
  try {
    const { id } = req.params;
    const existing = dbGet('SELECT id FROM users WHERE user_id = ?', [id]);
    res.json({ available: !existing });
  } catch (error) {
    res.status(500).json({ error: 'Check failed' });
  }
}
