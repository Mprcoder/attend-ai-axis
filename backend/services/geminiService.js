/**
 * Attend AI — Backend Gemini AI Service
 * Server-side only integration with @google/genai (gemini-3.8-flash).
 * Never exposes GEMINI_API_KEY to the browser. Never acts as the pass/fail judge.
 */
import { GoogleGenAI } from '@google/genai';

const rateLimitStore = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

export function checkAiRateLimit(clientKey) {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(clientKey) || []).filter(
    (t) => now - t < WINDOW_MS
  );
  if (timestamps.length >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((WINDOW_MS - (now - timestamps[0])) / 1000)
    );
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  timestamps.push(now);
  rateLimitStore.set(clientKey, timestamps);
  return {
    allowed: true,
    remaining: Math.max(0, MAX_REQUESTS - timestamps.length),
    retryAfterSeconds: 0,
  };
}

export function sanitizeCodeInput(raw, maxLength = 3000) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .slice(0, maxLength)
    .trim();
}

export async function generateAiMentorResponse({
  mode = 'explain_bug',
  hintLevel = 1,
  problemTitle,
  problemDescription,
  bugDescription,
  expectedBehavior,
  language,
  userHtml,
  userCss,
  userJs,
  testSummary,
  failedDiagnostics = [],
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const safeHtml = sanitizeCodeInput(userHtml, 3000);
  const safeCss = sanitizeCodeInput(userCss, 3000);
  const safeJs = sanitizeCodeInput(userJs, 3000);

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    if (mode === 'hint') {
      return `Hint (Level ${hintLevel}/3): Focus on ${bugDescription} Ensure your ${language} code satisfies: ${expectedBehavior}`;
    }
    if (mode === 'solution_feedback') {
      return `Post-Solution Feedback for "${problemTitle}":\n1. What the bug was: ${bugDescription}\n2. Why the fix works: Your code now satisfies ${expectedBehavior}\n3. How the code can be improved: Keep selectors and functions modular.\n4. Best practices: Always verify edge-case inputs.`;
    }
    return `Bug Analysis (${problemTitle}):\n• Root Cause: ${bugDescription}\n• Expected Behavior: ${expectedBehavior}`;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const prompt = `Challenge: ${problemTitle} (${language})
Description: ${problemDescription}
Reported Bug: ${bugDescription}
Expected Behavior: ${expectedBehavior}
Test Status: ${testSummary || 'Not yet run'}
Diagnostics: ${failedDiagnostics.join('; ')}

Student Code:
HTML:
${safeHtml}
CSS:
${safeCss}
JS:
${safeJs}

Mode: ${mode} (Hint Level: ${hintLevel})`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction:
        'You are Attend AI, an expert coding and debugging mentor. Keep responses under 180 words. Never act as the pass/fail evaluator.',
    },
  });

  return response.text || 'Unable to generate AI response.';
}
