// Attend AI — Route Protection & Session Verification Guard (Phase 2)
import { apiRequest, getAuthToken, setAuthSession, clearAuthSession } from './supabase.js';

export async function requireAuthenticatedUser(onUnauthenticated) {
  const token = getAuthToken();
  if (!token) {
    if (typeof onUnauthenticated === 'function') {
      onUnauthenticated();
    }
    return null;
  }

  try {
    const data = await apiRequest('/auth/session', { method: 'GET' });
    if (data && data.user) {
      setAuthSession(token, data.user);
      return data.user;
    }
    clearAuthSession();
    if (typeof onUnauthenticated === 'function') {
      onUnauthenticated();
    }
    return null;
  } catch {
    clearAuthSession();
    if (typeof onUnauthenticated === 'function') {
      onUnauthenticated();
    }
    return null;
  }
}

export async function requireAdminRole(onForbidden) {
  const user = await requireAuthenticatedUser(onForbidden);
  if (!user || user.role !== 'admin') {
    if (typeof onForbidden === 'function') {
      onForbidden();
    }
    return null;
  }
  return user;
}
