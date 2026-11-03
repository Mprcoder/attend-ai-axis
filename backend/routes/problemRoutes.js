// Attend AI — Modular Express Problem Routes (Phase 4)
import express from 'express';
import {
  getAllCategories,
  getAllProblems,
  getProblemById,
  getTestCasesForProblem,
  getUserProgressList,
} from '../../src/db/repository.ts';
import { optionalAuth } from '../../src/middleware/auth.ts';

const router = express.Router();

router.get('/categories', async (_req, res) => {
  try {
    const cats = await getAllCategories();
    const probs = await getAllProblems(false);
    res.json(
      cats.map((c) => ({
        ...c,
        problemCount: probs.filter((p) => p.categoryId === c.id).length,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    const problems = await getAllProblems(false);
    const categories = await getAllCategories();
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    let solvedSet = new Set();
    let attemptedSet = new Set();
    if (req.user && req.user.uid) {
      const prog = await getUserProgressList(req.user.uid);
      for (const p of prog) {
        attemptedSet.add(p.problemId);
        if (p.isSolved) solvedSet.add(p.problemId);
      }
    }

    res.json(
      problems.map((p) => ({
        ...p,
        categoryName: catMap.get(p.categoryId) || 'Web Development',
        isSolved: solvedSet.has(p.id),
        isAttempted: attemptedSet.has(p.id),
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const problem = await getProblemById(Number(req.params.id));
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    const visibleTestCases = await getTestCasesForProblem(problem.id, false);
    return res.json({
      ...problem,
      visibleExamples: JSON.parse(problem.visibleExamples || '[]'),
      hints: JSON.parse(problem.hints || '[]'),
      testCases: visibleTestCases,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch problem details' });
  }
});

export default router;
