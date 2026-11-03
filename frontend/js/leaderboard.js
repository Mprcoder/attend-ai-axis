/**
 * Attend AI — Frontend Leaderboard Client Module
 */
import { API_BASE_URL } from './config.js';

export async function fetchLeaderboard({ period = 'all', sortBy = 'xp' } = {}) {
  const res = await fetch(
    `${API_BASE_URL}/leaderboard?period=${encodeURIComponent(period)}&sortBy=${encodeURIComponent(sortBy)}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load leaderboard');
  return data;
}
