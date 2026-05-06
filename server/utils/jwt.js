import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'loantrackr-dev-secret-key-2024';

export function generateToken(userId, rememberMe = false) {
  const expiresIn = rememberMe ? '30d' : '24h';
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
