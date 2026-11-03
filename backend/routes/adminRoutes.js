import express from 'express';
import { requireAuth } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import {
  getAllProblems,
  getProblemById,
  getTestCasesForProblem,
  createAdminProblem,
  updateAdminProblem,
  deleteAdminProblem,
} from '../../src/db/repository.ts';

const router = express.Router();

router.get('/problems', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const probs = await getAllProblems(true);
    const enriched = await Promise.all(
      probs.map(async (p) => {
        const allTestCases = await getTestCasesForProblem(p.id, true);
        let hintsList = [];
        try {
          hintsList = JSON.parse(p.hints || '[]');
        } catch {
          hintsList = [];
        }
        return {
          ...p,
          hintsList,
          testCases: allTestCases,
        };
      })
    );
    return res.json(enriched);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load admin problems' });
  }
});

router.post('/problems', requireAuth, requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    const created = await createAdminProblem({
      ...body,
      hints: Array.isArray(body.hints) ? JSON.stringify(body.hints) : body.hints,
    });
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create problem' });
  }
});

router.put('/problems/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const body = { ...req.body };
    if (Array.isArray(body.hints)) {
      body.hints = JSON.stringify(body.hints);
    }
    const updated = await updateAdminProblem(Number(req.params.id), body);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to update problem' });
  }
});

router.post('/problems/:id/publish', requireAuth, requireAdmin, async (req, res) => {
  try {
    const problem = await getProblemById(Number(req.params.id));
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    const updated = await updateAdminProblem(problem.id, {
      isPublished: !problem.isPublished,
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to toggle publish state' });
  }
});

router.delete('/problems/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await deleteAdminProblem(Number(req.params.id));
    return res.json({ message: 'Problem deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to delete problem' });
  }
});

export default router;
