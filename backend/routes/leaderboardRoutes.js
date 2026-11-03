import express from 'express';
import { getLeaderboardData } from '../../src/db/repository.ts';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'xp';
    const period = req.query.period || 'all';
    const rankings = await getLeaderboardData({ sortBy, period });
    return res.json(rankings);
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to load leaderboard' });
  }
});

export default router;
