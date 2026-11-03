// Attend AI — Supabase Client & Session Wrapper (Email + Password Only)
import { APP_CONFIG } from './config.js';

let inMemorySessionToken = null;
let inMemoryCurrentUser = null;

export function setAuthSession(token, user) {
  inMemorySessionToken = token;
  inMemoryCurrentUser = user;
}

export function clearAuthSession() {
  inMemorySessionToken = null;
  inMemoryCurrentUser = null;
}

export function getAuthToken() {
  return inMemorySessionToken;
}

export function getCurrentUser() {
  return inMemoryCurrentUser;
}

export async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (inMemorySessionToken) {
    headers.Authorization = `Bearer ${inMemorySessionToken}`;
  }
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${endpoint}`, {
    ...options,
    headers,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}
