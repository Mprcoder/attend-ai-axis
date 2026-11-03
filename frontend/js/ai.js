/**
 * Attend AI — Frontend Gemini AI Assistance Client Module
 * Requests progressive hints, bug explanations, failing test debugging help, and post-solution feedback
 * through the backend API (/api/ai/assist). Never exposes GEMINI_API_KEY in the browser.
 */
import { API_BASE_URL } from './config.js';
import { getSessionToken } from './supabase.js';

export async function requestAiAssistance({
  mode = 'explain_bug',
  hintLevel = 1,
  problemId,
  html = '',
  css = '',
  js = '',
  testSummary,
  failedDiagnostics = [],
}) {
  const token = getSessionToken();
  const res = await fetch(`${API_BASE_URL}/ai/assist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      mode,
      hintLevel,
      problemId,
      html,
      css,
      js,
      testSummary,
      failedDiagnostics,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to get Gemini AI assistance');
  }
  return data;
}
