// Attend AI — Problem Details Loader (Phase 4)
import { apiRequest } from './supabase.js';

export async function fetchProblemDetails(problemId) {
  return await apiRequest(`/problems/${Number(problemId)}`, { method: 'GET' });
}
