import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/authenticate.js';
import {
  getAllProblems,
  getAllCategories,
  getLeaderboardData,
  getUserByUid,
  getUserProgressList,
  getUserStreakRecord,
  getUserSubmissions,
} from '../../src/db/repository.ts';

const router = express.Router();

router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const allProblems = await getAllProblems(false);
    const categoriesList = await getAllCategories();
    const leaderboard = await getLeaderboardData();

    if (!req.user?.uid) {
      return res.json({
        authenticated: false,
        totalProblems: allProblems.length,
        problemsSolved: 0,
        problemsAttempted: 0,
        totalAttempts: 0,
        accuracy: 0,
        totalXp: 0,
        currentStreak: 0,
        longestStreak: 0,
        rank: null,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
        recentActivity: [],
        recommendedProblems: allProblems.slice(0, 4),
        continuePracticing: allProblems.slice(0, 3),
        categories: categoriesList.map((c) => ({
          ...c,
          totalCount: allProblems.filter((p) => p.categoryId === c.id).length,
          solvedCount: 0,
        })),
      });
    }

    const uid = req.user.uid;
    const user = await getUserByUid(uid);
    const progress = await getUserProgressList(uid);
    const streak = await getUserStreakRecord(uid);
    const subs = await getUserSubmissions(uid);
    const probMap = new Map(allProblems.map((p) => [p.id, p]));

    const solvedSet = new Set(
      progress.filter((p) => p.isSolved).map((p) => p.problemId)
    );
    const problemsSolved = solvedSet.size;
    const problemsAttempted = progress.length;
    const passedSubs = subs.filter((s) => s.status === 'Passed').length;
    const accuracy =
      subs.length > 0 ? Math.round((passedSubs / subs.length) * 100) : 0;

    const userRankIndex = leaderboard.findIndex((r) => r.uid === uid);
    const rank = userRankIndex >= 0 ? userRankIndex + 1 : leaderboard.length + 1;

    return res.json({
      authenticated: true,
      totalProblems: allProblems.length,
      problemsSolved,
      problemsAttempted,
      totalAttempts: subs.length,
      accuracy,
      totalXp: user?.totalXp || 0,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      rank,
      recentActivity: subs.slice(0, 6).map((s) => ({
        id: s.id,
        problemId: s.problemId,
        problemTitle: probMap.get(s.problemId)?.title || `Challenge #${s.problemId}`,
        language: s.language,
        status: s.status,
        xpEarned: s.xpEarned,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load stats' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const progress = await getUserProgressList(req.user.uid);
    return res.json(progress);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load progress' });
  }
});

router.get('/streak', requireAuth, async (req, res) => {
  try {
    const streak = await getUserStreakRecord(req.user.uid);
    return res.json(streak);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load streak' });
  }
});

export default router;
