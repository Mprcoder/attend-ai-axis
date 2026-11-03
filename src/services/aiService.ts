import { chatWithOllama } from './ollamaService.ts';

export type AiAssistMode =
  | 'hint'
  | 'explain_bug'
  | 'debug_assist'
  | 'solution_feedback';

// Per-client sliding window rate limiter (max 20 requests per 60 seconds)
const aiRateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

export function checkAiRateLimit(clientKey: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const timestamps = (aiRateLimitStore.get(clientKey) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldest = timestamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000)
    );
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  timestamps.push(now);
  aiRateLimitStore.set(clientKey, timestamps);

  return {
    allowed: true,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - timestamps.length),
    retryAfterSeconds: 0,
  };
}

export function sanitizeCodeInput(raw: string, maxLength = 3000): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .slice(0, maxLength)
    .trim();
}

export async function generateAiAssistance(params: {
  mode: AiAssistMode;
  hintLevel?: number;
  problemTitle: string;
  problemDescription: string;
  bugDescription: string;
  expectedBehavior: string;
  instructions?: string;
  language: string;
  userHtml: string;
  userCss: string;
  userJs: string;
  testSummary?: string;
  failedDiagnostics?: string[];
}): Promise<string> {
  const safeHtml = sanitizeCodeInput(params.userHtml, 3000);
  const safeCss = sanitizeCodeInput(params.userCss, 3000);
  const safeJs = sanitizeCodeInput(params.userJs, 3000);
  const hintLevel = Math.min(3, Math.max(1, Number(params.hintLevel) || 1));
  const diagnosticsText =
    params.failedDiagnostics && params.failedDiagnostics.length > 0
      ? params.failedDiagnostics.slice(0, 5).join('; ')
      : '';

  let taskPrompt = '';
  if (params.mode === 'hint') {
    if (hintLevel === 1) {
      taskPrompt =
        'Provide a Level 1 progressive hint (2-3 sentences): give a subtle conceptual clue pointing the student to the right area of the code WITHOUT revealing the exact line fix or full solution.';
    } else if (hintLevel === 2) {
      taskPrompt =
        'Provide a Level 2 progressive hint (2-3 sentences): name the exact HTML attribute, CSS property, or JavaScript expression causing the bug and explain what to check, WITHOUT giving the full copy-paste code.';
    } else {
      taskPrompt =
        'Provide a Level 3 progressive hint (3-4 sentences): explain the exact change needed to fix the bug step-by-step while encouraging the student to type the fix themselves.';
    }
  } else if (params.mode === 'explain_bug') {
    taskPrompt =
      'Explain what is likely wrong in the student’s current code in 3 concise bullet points: 1) Root Cause in the code, 2) Why it causes unexpected behavior, and 3) Which element/selector/function to inspect.';
  } else if (params.mode === 'debug_assist') {
    taskPrompt = `Explain why the student's code or submission is failing test cases (${
      params.testSummary || 'test assertions failed'
    }${
      diagnosticsText ? ` — Diagnostics: ${diagnosticsText}` : ''
    }) and provide a clear 3-step debugging checklist to fix the issue without dumping the entire solution file.`;
  } else {
    taskPrompt =
      'The student just solved the challenge and passed all deterministic test cases! Provide structured Post-Solution Feedback with these 4 labeled sections:\n1) What the bug was\n2) Why the fix works\n3) How the code can be improved\n4) Best practices';
  }

  const prompt = `Challenge: ${params.problemTitle} (Primary Language: ${params.language})
Problem Description: ${params.problemDescription}
Reported Bug Context: ${params.bugDescription}
Expected Behavior: ${params.expectedBehavior}

Student's Sanitized Code:
--- HTML ---
${safeHtml}
--- CSS ---
${safeCss}
--- ${params.language} Editor Code ---
${safeJs}

Task: ${taskPrompt}`;

  return chatWithOllama([{ role: 'user', content: prompt }]);
}
