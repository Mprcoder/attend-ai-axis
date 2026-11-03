// Attend AI — Email + Password Authentication Module (Phase 2)
// Supports Signup, Email Verification, Login, Forgot Password, Reset Password, and Logout.
// Strictly excludes Google OAuth or social login.

import { apiRequest, setAuthSession, clearAuthSession } from './supabase.js';

export function validateStrongPassword(password) {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return {
    valid: minLength && hasUpper && hasLower && hasNumber,
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
  };
}

export async function signUpWithEmail({ fullName, email, password, confirmPassword }) {
  const check = validateStrongPassword(password);
  if (!check.valid) {
    throw new Error(
      'Password must be at least 8 characters and include uppercase, lowercase, and a number.'
    );
  }
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match.');
  }

  return await apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password, confirmPassword }),
  });
}

export async function verifyEmailCode({ email, verificationCode }) {
  return await apiRequest('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, verificationCode }),
  });
}

export async function signInWithEmail({ email, password, rememberMe = true }) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, rememberMe }),
  });
  setAuthSession(data.token, data.user);
  return data;
}

export async function requestPasswordReset(email) {
  return await apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function confirmPasswordReset({
  email,
  recoveryCode,
  newPassword,
  confirmPassword,
}) {
  return await apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, recoveryCode, newPassword, confirmPassword }),
  });
}

export async function signOutUser() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    clearAuthSession();
  }
}
