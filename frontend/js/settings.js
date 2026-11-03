/**
 * Attend AI — Frontend Account & Editor Settings Module
 */
import { API_BASE_URL } from './config.js';
import { getSessionToken } from './supabase.js';

export async function updateProfileSettings({ fullName, username, bio }) {
  const token = getSessionToken();
  const res = await fetch(`${API_BASE_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ fullName, username, bio }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile');
  return data;
}

export async function uploadProfileAvatar(avatarUrl) {
  const token = getSessionToken();
  const res = await fetch(`${API_BASE_URL}/profile/avatar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ avatarUrl }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload avatar');
  return data;
}
