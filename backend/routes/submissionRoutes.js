import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/authenticate.js';
import { evaluateTestCases } from '../services/evaluationService.js';

const router = express.Router();

/**
 * POST /api/submissions/run
 * Evaluates user code against visible test cases only (is_hidden = false).
 */
router.post('/run', optionalAuth, async (req, res) => {
  try {
    const { problemId, html, css, js, visibleTestCases = [], clientAssertionResults = {} } = req.body;
    const evaluation = evaluateTestCases({
      slug: String(problemId),
      html,
      css,
      js,
      testCases: visibleTestCases,
      clientAssertionResults,
    });

    return res.json({
      mode: 'run',
      allPassed: evaluation.allPassed,
      passedTests: evaluation.passedCount,
      totalTests: evaluation.totalCount,
      visiblePassed: evaluation.visiblePassed,
      visibleTotal: evaluation.visibleTotal,
      executionTimeMs: evaluation.executionTimeMs,
      results: evaluation.results,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Code execution failed' });
  }
});

/**
 * POST /api/submissions/submit
 * Evaluates user code against ALL test cases (visible + hidden) and records submission.
 */
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { problemId, html, css, js, allTestCases = [], clientAssertionResults = {} } = req.body;
    const evaluation = evaluateTestCases({
      slug: String(problemId),
      html,
      css,
      js,
      testCases: allTestCases,
      clientAssertionResults,
    });

    return res.json({
      mode: 'submit',
      status: evaluation.allPassed ? 'Passed' : 'Failed',
      allPassed: evaluation.allPassed,
      passedTests: evaluation.passedCount,
      totalTests: evaluation.totalCount,
      visiblePassed: evaluation.visiblePassed,
      visibleTotal: evaluation.visibleTotal,
      hiddenPassed: evaluation.hiddenPassed,
      hiddenTotal: evaluation.hiddenTotal,
      executionTimeMs: evaluation.executionTimeMs,
      results: evaluation.results,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Submission evaluation failed' });
  }
});

export default router;
