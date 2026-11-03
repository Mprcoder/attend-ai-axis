/**
 * Attend AI — Frontend Submissions & Test Evaluation Client Module
 * Handles Run Code (visible tests), Submit Solution (visible + hidden tests), and Submission History.
 */
import { API_BASE_URL } from './config.js';
import { getSessionToken } from './supabase.js';

export async function runCodeAgainstVisibleTests({
  problemId,
  html,
  css,
  js,
  clientAssertionResults = {},
}) {
  const token = getSessionToken();
  const res = await fetch(`${API_BASE_URL}/submissions/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      problemId,
      html,
      css,
      js,
      clientAssertionResults,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to run code');
  return data;
}

export async function submitSolutionForEvaluation({
  problemId,
  html,
  css,
  js,
  clientAssertionResults = {},
}) {
  const token = getSessionToken();
  const res = await fetch(`${API_BASE_URL}/submissions/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      problemId,
      html,
      css,
      js,
      clientAssertionResults,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit solution');
  return data;
}

export async function fetchUserSubmissionHistory() {
  const token = getSessionToken();
  const res = await fetch(`${API_BASE_URL}/submissions/history`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load submission history');
  return data;
}
