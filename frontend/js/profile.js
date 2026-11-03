/**
 * Attend AI — Frontend Profile Client Module
 */
import { API_BASE_URL } from './config.js';
import { getSessionToken } from './supabase.js';

export async function fetchUserProfile() {
  const token = getSessionToken();
  const res = await fetch(`${API_BASE_URL}/profile`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load user profile');
  return data;
}
