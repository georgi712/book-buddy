export type PasswordStrength = 'weak' | 'medium' | 'strong';

export function getPasswordStrength(password: string): {
  strength: PasswordStrength;
  message: string;
} {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const lengthValid = password.length >= 8;

  const score = [hasUpper, hasLower, hasNumber, hasSymbol, lengthValid].filter(Boolean).length;

  if (score === 5) {
    return { strength: 'strong', message: 'Strong password' };
  } else if (score >= 3) {
    return { strength: 'medium', message: 'Medium strength' };
  } else {
    return { strength: 'weak', message: 'Weak password' };
  }
}