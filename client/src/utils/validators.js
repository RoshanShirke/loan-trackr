export function validatePassword(password) {
  const checks = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
  };
  const strength = Object.values(checks).filter(Boolean).length;
  let label = 'Very Weak';
  if (strength === 5) label = 'Very Strong';
  else if (strength === 4) label = 'Strong';
  else if (strength === 3) label = 'Fair';
  else if (strength >= 1) label = 'Weak';
  return { checks, strength, label, isValid: strength === 5 };
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateMobile(mobile) {
  return /^\+?[0-9]{10,15}$/.test(mobile);
}

export function validateUserId(userId) {
  return /^[a-zA-Z0-9_]{4,30}$/.test(userId);
}
