import express from 'express';
import { optionalAuth } from '../middleware/authenticate.js';
import {
  checkAiRateLimit,
  generateAiMentorResponse,
} from '../services/geminiService.js';

const router = express.Router();

/**
 * POST /api/ai/assist
 * Modes: 'hint' | 'explain_bug' | 'debug_assist' | 'solution_feedback'
 */
router.post('/assist', optionalAuth, async (req, res) => {
  try {
    const clientKey = req.user?.uid || req.ip || 'anonymous-client';
    const rate = checkAiRateLimit(clientKey);
    if (!rate.allowed) {
      return res.status(429).json({
        error: `AI request rate limit reached. Please wait ${rate.retryAfterSeconds}s.`,
        retryAfterSeconds: rate.retryAfterSeconds,
      });
    }

    const {
      mode,
      hintLevel,
      problemTitle,
      problemDescription,
      bugDescription,
      expectedBehavior,
      language,
      html,
      css,
      js,
      testSummary,
      failedDiagnostics,
    } = req.body;

    const feedback = await generateAiMentorResponse({
      mode,
      hintLevel: Number(hintLevel) || 1,
      problemTitle: problemTitle || 'Debugging Challenge',
      problemDescription: problemDescription || '',
      bugDescription: bugDescription || '',
      expectedBehavior: expectedBehavior || '',
      language: language || 'JavaScript',
      userHtml: html || '',
      userCss: css || '',
      userJs: js || '',
      testSummary,
      failedDiagnostics: Array.isArray(failedDiagnostics) ? failedDiagnostics : [],
    });

    return res.json({
      feedback,
      mode: mode || 'explain_bug',
      hintLevel: Number(hintLevel) || 1,
      rateLimitRemaining: rate.remaining,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || 'AI assistance request failed' });
  }
});

export default router;
