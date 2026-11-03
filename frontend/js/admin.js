/**
 * Attend AI — Frontend Admin Panel Client Module
 * Manages challenge creation, editing, starter code, hints, visible/hidden test cases, XP, and publishing.
 */
import { API_BASE_URL } from './config.js';
import { getSessionToken } from './supabase.js';

export async function fetchAdminProblems() {
  const token = getSessionToken();
  const res = await fetch(`${API_BASE_URL}/admin/problems`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch admin problems');
  return data;
}

export async function createChallenge(payload) {
  const token = getSessionToken();
  const res = await fetch(`${API_BASE_URL}/admin/problems`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create challenge');
  return data;
}

export async function updateChallenge(id, payload) {
  const token = getSessionToken();
  const res = await fetch(`${API_BASE_URL}/admin/problems/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update challenge');
  return data;
}

export async function togglePublishChallenge(id) {
  const token = getSessionToken();
  const res = await fetch(`${API_BASE_URL}/admin/problems/${id}/publish`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to toggle publish status');
  return data;
}

export async function deleteChallenge(id) {
  const token = getSessionToken();
  const res = await fetch(`${API_BASE_URL}/admin/problems/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete challenge');
  return data;
}
