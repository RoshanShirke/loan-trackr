import crypto from 'crypto';

export function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

export function getOTPExpiry(minutes = 10) {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry.toISOString();
}
