import express from 'express';
import { requireAuth } from '../middleware/authenticate.js';
import {
  getUserByUid,
  getUserByUsername,
  updateUserProfile,
  deleteUserAccount,
  getUserProgressList,
  getUserStreakRecord,
  getUserSubmissions,
  getAllAchievementsWithUserStatus,
  getAllProblems,
} from '../../src/db/repository.ts';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const user = await getUserByUid(uid);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    const progress = await getUserProgressList(uid);
    const streak = await getUserStreakRecord(uid);
    const submissionsList = await getUserSubmissions(uid);
    const achievementsList = await getAllAchievementsWithUserStatus(uid);
    const allProblems = await getAllProblems();

    const solvedCount = progress.filter((p) => p.isSolved).length;
    const passedSubs = submissionsList.filter((s) => s.status === 'Passed').length;
    const accuracy =
      submissionsList.length > 0
        ? Math.round((passedSubs / submissionsList.length) * 100)
        : 0;

    return res.json({
      profile: user,
      stats: {
        totalProblems: allProblems.length,
        problemsSolved: solvedCount,
        problemsAttempted: progress.length,
        totalSubmissions: submissionsList.length,
        accuracy,
        totalXp: user.totalXp,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
      },
      achievements: achievementsList,
      recentSubmissions: submissionsList.slice(0, 10),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to load profile' });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { fullName, username, bio } = req.body;
    if (username) {
      const existing = await getUserByUsername(username);
      if (existing && existing.uid !== uid) {
        return res.status(409).json({ error: 'Username is already taken.' });
      }
    }
    const updated = await updateUserProfile(uid, { fullName, username, bio });
    return res.json({ message: 'Profile updated.', profile: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

router.post('/avatar', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { avatarUrl } = req.body;
    const updated = await updateUserProfile(uid, { avatarUrl });
    return res.json({ message: 'Avatar updated.', avatarUrl: updated?.avatarUrl });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to update avatar' });
  }
});

router.delete('/', requireAuth, async (req, res) => {
  try {
    await deleteUserAccount(req.user.uid);
    return res.json({ message: 'Account deleted.' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to delete account' });
  }
});

export default router;
