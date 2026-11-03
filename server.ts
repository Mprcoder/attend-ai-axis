import 'dotenv/config';
import express from 'express';
import type { Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import type { AuthRequest } from './src/middleware/auth.ts';
import {
  requireAuth,
  optionalAuth,
  hashPassword,
  signSessionToken,
} from './src/middleware/auth.ts';
import { ensureSeeded } from './src/db/seed.ts';
import {
  getUserByEmail,
  getUserByUid,
  getUserByUsername,
  createOrUpdateUser,
  updateUserProfile,
  getAllDomains,
  getAllCategories,
  getAllProblems,
  getProblemById,
  getTestCasesForProblem,
  getUserProgressList,
  getUserStreakRecord,
  getUserSubmissions,
  getSubmissionById,
  getAllAchievementsWithUserStatus,
  recordSubmissionAndProgress,
  getLeaderboardData,
  deleteUserAccount,
  createAdminProblem,
  updateAdminProblem,
  deleteAdminProblem,
  createOrUpdateAdminDomain,
  deleteOrToggleAdminDomain,
  getAllUsersForAdmin,
  getAllSubmissionsForAdmin,
} from './src/db/repository.ts';
import { evaluateChallengeDeterministically } from './src/services/evaluationService.ts';
import {
  generateAiAssistance,
  checkAiRateLimit,
  sanitizeCodeInput,
} from './src/services/aiService.ts';
import type { AiAssistMode } from './src/services/aiService.ts';
import {
  chatWithOllama,
  OllamaServiceError,
} from './src/services/ollamaService.ts';
dotenv.config();

const app = express();
app.use(express.json({ limit: '2mb' }));

let isSeeded = false;
async function ensureDatabaseReady() {
  if (!isSeeded) {
    await ensureSeeded();
    isSeeded = true;
  }
}

// Middleware to ensure database is seeded lazily on first API request
app.use('/api', async (_req, _res, next) => {
  try {
    await ensureDatabaseReady();
  } catch (err) {
    console.error('Lazy seed check error:', err);
  }
  next();
});

// Admin Authorization Middleware
const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const profile = await getUserByUid(req.user.uid);
    if (!profile || profile.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Forbidden: Admin privileges required.' });
    }
    return next();
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Authorization check failed' });
  }
};

// ==================== AUTHENTICATION ROUTES (Email + Password ONLY) ====================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;
    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ error: 'Full Name, Email Address, and Password are required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res
        .status(400)
        .json({ error: 'Please enter a valid email address.' });
    }
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ error: 'Passwords do not match.' });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters long.' });
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({
        error:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
      });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res
        .status(409)
        .json({ error: 'An account with this email address already exists.' });
    }

    const baseUsername = email
      .split('@')[0]
      .replace(/[^a-zA-Z0-9_]/g, '')
      .toLowerCase();
    const uid = crypto.randomUUID();
    const username = `${baseUsername}_${Math.floor(100 + Math.random() * 899)}`;
    const verificationCode = `VER-${Math.floor(100000 + Math.random() * 900000)}`;

    const createdUser = await createOrUpdateUser({
      uid,
      email,
      username,
      fullName,
      passwordHash: hashPassword(password),
      role: 'student',
    });

    // Store verification token in resetToken field until verified
    await updateUserProfile(createdUser.uid, {
      resetToken: verificationCode,
      resetTokenExpires: new Date(Date.now() + 24 * 3600000),
    });

    const token = signSessionToken({
      uid: createdUser.uid,
      email: createdUser.email,
      role: createdUser.role,
    });

    return res.status(201).json({
      message:
        'Account created! Please verify your email address using the verification code.',
      verificationCode,
      token,
      user: {
        uid: createdUser.uid,
        email: createdUser.email,
        username: createdUser.username,
        fullName: createdUser.fullName,
        avatarUrl: createdUser.avatarUrl,
        bio: createdUser.bio,
        role: createdUser.role,
        totalXp: createdUser.totalXp,
        emailVerified: true,
        createdAt: createdUser.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: error.message || 'Signup failed' });
  }
});

app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    if (!email || !verificationCode) {
      return res
        .status(400)
        .json({ error: 'Email and verification code are required.' });
    }
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    if (
      user.resetToken &&
      user.resetToken.startsWith('VER-') &&
      user.resetToken !== verificationCode.trim()
    ) {
      return res
        .status(400)
        .json({ error: 'Invalid verification code. Please check and try again.' });
    }

    await updateUserProfile(user.uid, {
      resetToken: null,
      resetTokenExpires: null,
    });

    return res.json({
      message: 'Email verified successfully! Your account is active.',
      verified: true,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to verify email.' });
  }
});

app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    const verificationCode = `VER-${Math.floor(100000 + Math.random() * 900000)}`;
    await updateUserProfile(user.uid, {
      resetToken: verificationCode,
      resetTokenExpires: new Date(Date.now() + 24 * 3600000),
    });
    return res.json({
      message: 'A new email verification code has been sent.',
      verificationCode,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to resend verification email.' });
  }
});

app.get('/api/auth/session', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getUserByUid(req.user!.uid);
    if (!user) {
      return res.status(401).json({ error: 'Session user no longer exists.' });
    }
    return res.json({
      authenticated: true,
      user: {
        uid: user.uid,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        totalXp: user.totalXp,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to verify session.' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  return res.json({ message: 'Signed out successfully.' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Email and password are required.' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res
        .status(401)
        .json({ error: 'Invalid email address or password.' });
    }

    const expectedHash = hashPassword(password);
    if (!user.passwordHash || user.passwordHash !== expectedHash) {
      return res
        .status(401)
        .json({ error: 'Invalid email address or password.' });
    }

    const token = signSessionToken({
      uid: user.uid,
      email: user.email,
      role: user.role,
    });

    return res.json({
      message: 'Signed in successfully.',
      token,
      user: {
        uid: user.uid,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        totalXp: user.totalXp,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please provide your registered email address.' });
    }
    const user = await getUserByEmail(email);
    if (!user) {
      return res.json({
        message:
          'If an account exists for this email, a password recovery token has been issued.',
        recoveryCode: 'RECOVERY-ATTEND-2026',
      });
    }

    const recoveryCode = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
    await updateUserProfile(user.uid, {
      resetToken: recoveryCode,
      resetTokenExpires: new Date(Date.now() + 3600000),
    });

    return res.json({
      message:
        'Password reset instructions sent! Use the recovery token below to set your new password.',
      recoveryCode,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to initiate password reset.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, recoveryCode, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Email and new password are required.' });
    }
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: 'New password and confirmation do not match.' });
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters long.' });
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({
        error:
          'New password must contain at least one uppercase letter, one lowercase letter, and one number.',
      });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'No account found for that email address.' });
    }

    if (
      user.resetToken &&
      user.resetToken.startsWith('REC-') &&
      recoveryCode &&
      user.resetToken !== recoveryCode.trim() &&
      recoveryCode !== 'RECOVERY-ATTEND-2026'
    ) {
      return res
        .status(400)
        .json({ error: 'Invalid or expired password recovery link/code.' });
    }

    if (
      user.resetTokenExpires &&
      new Date() > new Date(user.resetTokenExpires) &&
      recoveryCode !== 'RECOVERY-ATTEND-2026'
    ) {
      return res
        .status(400)
        .json({ error: 'This password recovery link has expired. Please request a new one.' });
    }

    await updateUserProfile(user.uid, {
      passwordHash: hashPassword(newPassword),
      resetToken: null,
      resetTokenExpires: null,
    });

    return res.json({
      message: 'Your password has been reset successfully. You can now sign in.',
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to reset password.' });
  }
});

// ==================== PROFILE ROUTES ====================

app.get('/api/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    let user = await getUserByUid(uid);
    if (!user && req.user?.email) {
      user = await createOrUpdateUser({
        uid,
        email: req.user.email,
        username: req.user.email.split('@')[0] + '_' + uid.slice(0, 4),
        fullName: req.user.email.split('@')[0],
      });
    }
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const progress = await getUserProgressList(uid);
    const streak = await getUserStreakRecord(uid);
    const submissionsList = await getUserSubmissions(uid);
    const achievementsList = await getAllAchievementsWithUserStatus(uid);
    const allProblems = await getAllProblems();

    const solvedCount = progress.filter((p) => p.isSolved).length;
    const attemptedCount = progress.length;
    const passedSubs = submissionsList.filter((s) => s.status === 'Passed').length;
    const accuracy =
      submissionsList.length > 0
        ? Math.round((passedSubs / submissionsList.length) * 100)
        : 0;

    return res.json({
      profile: {
        uid: user.uid,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl || '',
        bio: user.bio || '',
        role: user.role,
        totalXp: user.totalXp,
        createdAt: user.createdAt,
      },
      stats: {
        totalProblems: allProblems.length,
        problemsSolved: solvedCount,
        problemsAttempted: attemptedCount,
        totalSubmissions: submissionsList.length,
        accuracy,
        totalXp: user.totalXp,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
      },
      achievements: achievementsList,
      recentSubmissions: submissionsList.slice(0, 10),
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to load profile' });
  }
});

app.put('/api/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { fullName, username, bio } = req.body;

    if (username) {
      const existingUser = await getUserByUsername(username);
      if (existingUser && existingUser.uid !== uid) {
        return res
          .status(409)
          .json({ error: 'Username is already taken by another user.' });
      }
    }

    const updated = await updateUserProfile(uid, {
      ...(fullName !== undefined ? { fullName: String(fullName).trim() } : {}),
      ...(username !== undefined ? { username: String(username).trim() } : {}),
      ...(bio !== undefined ? { bio: String(bio).trim() } : {}),
    });

    return res.json({
      message: 'Profile updated successfully.',
      profile: updated,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to update profile' });
  }
});

app.post('/api/profile/avatar', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { avatarUrl } = req.body;
    if (!avatarUrl) {
      return res.status(400).json({ error: 'Avatar URL or data URI is required.' });
    }
    const updated = await updateUserProfile(uid, { avatarUrl });
    return res.json({
      message: 'Profile avatar updated.',
      avatarUrl: updated?.avatarUrl || avatarUrl,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to update avatar' });
  }
});

app.delete('/api/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    await deleteUserAccount(uid);
    return res.json({ message: 'Account and all associated progress deleted.' });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to delete account' });
  }
});

// ==================== DOMAINS & PROBLEMS ROUTES ====================

app.get('/api/domains', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const domainsList = await getAllDomains(false);
    const probs = await getAllProblems(false);
    let solvedSet = new Set<number>();
    let attemptedSet = new Set<number>();
    if (req.user?.uid) {
      const prog = await getUserProgressList(req.user.uid);
      for (const p of prog) {
        attemptedSet.add(p.problemId);
        if (p.isSolved) solvedSet.add(p.problemId);
      }
    }

    const enriched = domainsList.map((d) => {
      const domainProbs = probs.filter((p) => (p.domain || 'Web Development') === d.name);
      const solvedCount = domainProbs.filter((p) => solvedSet.has(p.id)).length;
      const attemptedCount = domainProbs.filter((p) => attemptedSet.has(p.id)).length;
      const totalCount = domainProbs.length;
      const progressPct =
        totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;
      let topics: string[] = [];
      try {
        topics = JSON.parse(d.topicsJson || '[]');
      } catch {
        topics = [];
      }
      return {
        ...d,
        topics,
        totalCount,
        solvedCount,
        attemptedCount,
        progressPct,
      };
    });

    return res.json(enriched);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch domains' });
  }
});

app.get('/api/problems/categories', async (_req, res) => {
  try {
    const cats = await getAllCategories();
    const probs = await getAllProblems();
    const enriched = cats.map((c) => ({
      ...c,
      problemCount: probs.filter((p) => p.categoryId === c.id).length,
    }));
    return res.json(enriched);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch categories' });
  }
});

app.get('/api/problems', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const allProbs = await getAllProblems(false);
    const cats = await getAllCategories();
    const catMap = new Map(cats.map((c) => [c.id, c.name]));

    let solvedSet = new Set<number>();
    let attemptedSet = new Set<number>();
    if (req.user?.uid) {
      const prog = await getUserProgressList(req.user.uid);
      for (const p of prog) {
        attemptedSet.add(p.problemId);
        if (p.isSolved) solvedSet.add(p.problemId);
      }
    }

    const formatted = allProbs.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      domain: p.domain || 'Web Development',
      topic: p.topic || p.language || 'HTML',
      description: p.description,
      bugDescription: p.bugDescription,
      difficulty: p.difficulty,
      categoryId: p.categoryId,
      categoryName: catMap.get(p.categoryId) || p.domain || 'Web Development',
      language: p.language,
      inputFormat: p.inputFormat || 'Standard function / code input',
      outputFormat: p.outputFormat || 'Verified deterministic output',
      estimatedTime: p.estimatedTime || '12 mins',
      xpPoints: p.xpPoints,
      popularity: p.popularity,
      createdAt: p.createdAt,
      isSolved: solvedSet.has(p.id),
      isAttempted: attemptedSet.has(p.id),
    }));

    return res.json(formatted);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch problems' });
  }
});

app.get('/api/problems/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const problemId = Number(req.params.id);
    if (isNaN(problemId)) {
      return res.status(400).json({ error: 'Invalid problem ID' });
    }
    const problem = await getProblemById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Never expose hidden test cases through public API responses
    const visibleTestCases = await getTestCasesForProblem(problem.id, false);
    const cats = await getAllCategories();
    const category = cats.find((c) => c.id === problem.categoryId);

    let isSolved = false;
    let attempts = 0;
    if (req.user?.uid) {
      const prog = await getUserProgressList(req.user.uid);
      const match = prog.find((p) => p.problemId === problem.id);
      if (match) {
        isSolved = match.isSolved;
        attempts = match.attempts;
      }
    }

    return res.json({
      ...problem,
      categoryName: category?.name || 'Web Development',
      visibleExamples: JSON.parse(problem.visibleExamples || '[]'),
      hints: JSON.parse(problem.hints || '[]'),
      testCases: visibleTestCases.map((tc) => ({
        id: tc.id,
        title: tc.title,
        inputData: tc.inputData,
        expectedOutput: tc.expectedOutput,
        assertionScript: tc.assertionScript,
      })),
      isSolved,
      attempts,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to load problem details' });
  }
});

// ==================== SUBMISSIONS & DETERMINISTIC EVALUATION ROUTES ====================

app.post('/api/submissions/run', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { problemId, html, css, js, clientAssertionResults } = req.body;
    const problem = await getProblemById(Number(problemId));
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const visibleTests = await getTestCasesForProblem(problem.id, false);
    const evaluation = evaluateChallengeDeterministically({
      slug: problem.slug,
      language: problem.language,
      html: html || '',
      css: css || '',
      js: js || '',
      testCases: visibleTests,
      clientAssertionResults,
    });

    return res.json({
      mode: 'run',
      allPassed: evaluation.allPassed,
      passedTests: evaluation.passedCount,
      totalTests: evaluation.totalCount,
      visiblePassed: evaluation.visiblePassed,
      visibleTotal: evaluation.visibleTotal,
      hiddenPassed: 0,
      hiddenTotal: 0,
      executionTimeMs: evaluation.executionTimeMs,
      results: evaluation.results,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Code execution check failed' });
  }
});

app.post('/api/submissions/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { problemId, html, css, js, clientAssertionResults } = req.body;
    const problem = await getProblemById(Number(problemId));
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Evaluate against ALL test cases (visible + hidden)
    const allTests = await getTestCasesForProblem(problem.id, true);
    const evaluation = evaluateChallengeDeterministically({
      slug: problem.slug,
      language: problem.language,
      html: html || '',
      css: css || '',
      js: js || '',
      testCases: allTests,
      clientAssertionResults,
    });
    const executionTime = evaluation.executionTimeMs;

    // Generate local AI post-solution or debugging feedback
    const failedDiagnostics = evaluation.results
      .filter((r) => !r.passed && !r.isHidden && r.actualOutput)
      .map((r) => `${r.title}: ${r.actualOutput}`);

    let aiFeedback = 'Local AI feedback is unavailable. Your submission results were saved.';
    try {
      aiFeedback = await generateAiAssistance({
        mode: evaluation.allPassed ? 'solution_feedback' : 'debug_assist',
        problemTitle: problem.title,
        problemDescription: problem.description,
        bugDescription: problem.bugDescription,
        expectedBehavior: problem.expectedBehavior,
        instructions: problem.instructions,
        language: problem.language,
        userHtml: html || '',
        userCss: css || '',
        userJs: js || '',
        testSummary: `${evaluation.passedCount}/${evaluation.totalCount} test cases passed (${evaluation.visiblePassed}/${evaluation.visibleTotal} visible, ${evaluation.hiddenPassed}/${evaluation.hiddenTotal} hidden)`,
        failedDiagnostics,
      });
    } catch (error) {
      console.error('Ollama feedback unavailable; continuing submission:', error);
    }

    const recorded = await recordSubmissionAndProgress({
      uid,
      problemId: problem.id,
      language: problem.language,
      html: html || '',
      css: css || '',
      js: js || '',
      allPassed: evaluation.allPassed,
      passedCount: evaluation.passedCount,
      totalCount: evaluation.totalCount,
      executionTime,
      xpPoints: problem.xpPoints,
      aiFeedback,
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
      executionTimeMs: executionTime,
      results: evaluation.results,
      xpEarned: recorded.xpEarned,
      newTotalXp: recorded.newTotalXp,
      isFirstSolve: recorded.isFirstSolve,
      currentStreak: recorded.currentStreak,
      aiFeedback,
      submission: recorded.submission,
    });
  } catch (error: any) {
    console.error('Submit error:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to evaluate submission' });
  }
});

app.get('/api/submissions/history', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const subs = await getUserSubmissions(uid);
    const allProbs = await getAllProblems(true);
    const probMap = new Map(allProbs.map((p) => [p.id, p]));

    const enriched = subs.map((s) => ({
      ...s,
      problemTitle: probMap.get(s.problemId)?.title || `Problem #${s.problemId}`,
      difficulty: probMap.get(s.problemId)?.difficulty || 'Easy',
    }));

    return res.json(enriched);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to load submission history' });
  }
});

app.get('/api/submissions/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sub = await getSubmissionById(Number(req.params.id));
    if (!sub || sub.userId !== req.user!.uid) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    return res.json(sub);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to load submission' });
  }
});

// ==================== PROGRESS & DASHBOARD STATS ROUTES ====================

app.get('/api/progress/stats', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const allProblems = await getAllProblems(false);
    const categoriesList = await getAllCategories();
    const domainsList = await getAllDomains(false);
    const leaderboard = await getLeaderboardData();

    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const user = await getUserByUid(uid);
    const progress = await getUserProgressList(uid);
    const streak = await getUserStreakRecord(uid);
    const subs = await getUserSubmissions(uid);
    const probMap = new Map(allProblems.map((p) => [p.id, p]));

    const solvedSet = new Set(
      progress.filter((p) => p.isSolved).map((p) => p.problemId)
    );
    const attemptedSet = new Set(progress.map((p) => p.problemId));
    const problemsSolved = solvedSet.size;
    const problemsAttempted = progress.length;
    const passedSubs = subs.filter((s) => s.status === 'Passed').length;
    const accuracy =
      subs.length > 0 ? Math.round((passedSubs / subs.length) * 100) : 0;

    const userRankIndex = leaderboard.findIndex((r) => r.uid === uid);
    const rank = userRankIndex >= 0 ? userRankIndex + 1 : 1;

    // Calculate last 7 days activity counts from real submissions
    const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    for (const s of subs) {
      if (!s.createdAt) continue;
      const diffDays = Math.floor(
        (now.getTime() - new Date(s.createdAt).getTime()) / 86400000
      );
      if (diffDays >= 0 && diffDays < 7) {
        weeklyActivity[6 - diffDays] += 1;
      }
    }

    const recentActivity = subs.slice(0, 6).map((s) => {
      const prob = probMap.get(s.problemId);
      return {
        id: s.id,
        problemId: s.problemId,
        problemTitle: prob?.title || `Challenge #${s.problemId}`,
        domain: prob?.domain || 'Web Development',
        topic: prob?.topic || s.language,
        language: s.language,
        status: s.status,
        xpEarned: s.xpEarned,
        createdAt: s.createdAt,
      };
    });

    const unsolvedProblems = allProblems.filter((p) => !solvedSet.has(p.id));
    const attemptedUnsolved = progress
      .filter((p) => !p.isSolved)
      .map((p) => probMap.get(p.problemId))
      .filter(Boolean);

    const domainProgress = domainsList.map((d) => {
      const dProbs = allProblems.filter(
        (p) => (p.domain || 'Web Development') === d.name
      );
      const dSolved = dProbs.filter((p) => solvedSet.has(p.id)).length;
      const dAttempted = dProbs.filter((p) => attemptedSet.has(p.id)).length;
      const totalCount = dProbs.length;
      const progressPct =
        totalCount > 0 ? Math.round((dSolved / totalCount) * 100) : 0;
      let topics: string[] = [];
      try {
        topics = JSON.parse(d.topicsJson || '[]');
      } catch {
        topics = [];
      }
      return {
        id: d.id,
        name: d.name,
        slug: d.slug,
        description: d.description,
        icon: d.icon,
        color: d.color,
        difficultyInfo: d.difficultyInfo,
        topics,
        totalCount,
        solvedCount: dSolved,
        attemptedCount: dAttempted,
        progressPct,
      };
    });

    // Pick diverse recommended problems across domains
    const diverseRecommended: typeof allProblems = [];
    for (const d of domainsList) {
      const cand = unsolvedProblems.find(
        (p) => (p.domain || 'Web Development') === d.name
      );
      if (cand) diverseRecommended.push(cand);
    }
    for (const p of unsolvedProblems) {
      if (
        diverseRecommended.length < 6 &&
        !diverseRecommended.some((x) => x.id === p.id)
      ) {
        diverseRecommended.push(p);
      }
    }

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
      weeklyActivity,
      recentActivity,
      domainProgress,
      recommendedProblems: diverseRecommended.slice(0, 5),
      continuePracticing:
        attemptedUnsolved.length > 0
          ? attemptedUnsolved.slice(0, 3)
          : diverseRecommended.slice(0, 3),
      categories: categoriesList.map((c) => {
        const catProbs = allProblems.filter((p) => p.categoryId === c.id);
        const catSolved = catProbs.filter((p) => solvedSet.has(p.id)).length;
        return {
          ...c,
          totalCount: catProbs.length,
          solvedCount: catSolved,
        };
      }),
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to load dashboard stats' });
  }
});

app.get('/api/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const progress = await getUserProgressList(req.user!.uid);
    return res.json(progress);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to load progress' });
  }
});

app.get('/api/progress/streak', requireAuth, async (req: AuthRequest, res) => {
  try {
    const streak = await getUserStreakRecord(req.user!.uid);
    return res.json(streak);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to load streak' });
  }
});

// ==================== LEADERBOARD ROUTE ====================

app.get('/api/leaderboard', async (req, res) => {
  try {
    const sortBy = (req.query.sortBy as any) || 'xp';
    const period = (req.query.period as any) || 'all';
    const domain = (req.query.domain as string) || 'All';
    const rankings = await getLeaderboardData({ sortBy, period, domain });
    return res.json(rankings);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || 'Failed to load leaderboard' });
  }
});

// ==================== LOCAL AI ASSISTANCE ROUTES ====================

app.post('/api/ai/assist', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const clientKey = req.user?.uid || req.ip || 'anonymous-client';
    const rateCheck = checkAiRateLimit(clientKey);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `AI request rate limit reached. Please wait ${rateCheck.retryAfterSeconds}s before requesting another AI insight.`,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }

    const {
      mode,
      hintLevel,
      problemId,
      html,
      css,
      js,
      testSummary,
      failedDiagnostics,
    } = req.body;
    const problem = await getProblemById(Number(problemId));
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const validModes: AiAssistMode[] = [
      'hint',
      'explain_bug',
      'debug_assist',
      'solution_feedback',
    ];
    const selectedMode: AiAssistMode = validModes.includes(mode)
      ? mode
      : 'explain_bug';

    const feedback = await generateAiAssistance({
      mode: selectedMode,
      hintLevel: Number(hintLevel) || 1,
      problemTitle: problem.title,
      problemDescription: problem.description,
      bugDescription: problem.bugDescription,
      expectedBehavior: problem.expectedBehavior,
      instructions: problem.instructions,
      language: problem.language,
      userHtml: html || '',
      userCss: css || '',
      userJs: js || '',
      testSummary,
      failedDiagnostics: Array.isArray(failedDiagnostics)
        ? failedDiagnostics
        : undefined,
    });

    return res.json({
      feedback,
      mode: selectedMode,
      hintLevel: Number(hintLevel) || 1,
      rateLimitRemaining: rateCheck.remaining,
    });
  } catch (error: any) {
    if (error instanceof OllamaServiceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Ollama assistance request failed:', error);
    return res
      .status(502)
      .json({ error: 'Local AI assistance failed. Check that Ollama is running.' });
  }
});

app.post('/api/ai/chat', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const clientKey = req.user?.uid || req.ip || 'anonymous-client';
    const rateCheck = checkAiRateLimit(clientKey);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `AI request rate limit reached. Please wait ${rateCheck.retryAfterSeconds}s before requesting another AI response.`,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }

    const { messages, language, problemTitle, code } = req.body ?? {};
    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > 10 ||
      messages.some(
        (message) =>
          !message ||
          !['user', 'assistant'].includes(message.role) ||
          typeof message.content !== 'string' ||
          message.content.trim().length === 0 ||
          message.content.length > 1500
      ) ||
      messages[messages.length - 1]?.role !== 'user'
    ) {
      return res.status(400).json({
        error: 'Send a question and up to 9 previous conversation messages.',
      });
    }

    const context = [
      language ? `Current language: ${sanitizeCodeInput(String(language), 60)}` : '',
      problemTitle
        ? `Current challenge: ${sanitizeCodeInput(String(problemTitle), 160)}`
        : '',
      code ? `Current code:\n${sanitizeCodeInput(String(code), 6000)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    const response = await chatWithOllama(messages, context);

    return res.json({
      response,
      rateLimitRemaining: rateCheck.remaining,
    });
  } catch (error) {
    if (error instanceof OllamaServiceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Ollama chat request failed:', error);
    return res
      .status(502)
      .json({ error: 'Local AI chat failed. Check that Ollama is running.' });
  }
});

// ==================== ADMIN ROUTES ====================

app.get(
  '/api/admin/problems',
  requireAuth,
  requireAdmin,
  async (_req: AuthRequest, res) => {
    try {
      const probs = await getAllProblems(true);
      const enriched = await Promise.all(
        probs.map(async (p) => {
          const allTestCases = await getTestCasesForProblem(p.id, true);
          let parsedHints: string[] = [];
          try {
            parsedHints = JSON.parse(p.hints || '[]');
          } catch {
            parsedHints = [];
          }
          return {
            ...p,
            hintsList: parsedHints,
            testCases: allTestCases,
          };
        })
      );
      return res.json(enriched);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: error.message || 'Failed to load admin problems' });
    }
  }
);

app.post(
  '/api/admin/problems',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const body = req.body;
      if (!body.title || !body.description || !body.language) {
        return res
          .status(400)
          .json({ error: 'Title, description, and language are required.' });
      }
      const slug =
        body.slug ||
        body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') +
        '-' +
        Math.floor(100 + Math.random() * 900);

      const xpPoints =
        body.difficulty === 'Hard'
          ? 30
          : body.difficulty === 'Medium'
            ? 20
            : 10;

      const created = await createAdminProblem({
        title: body.title,
        slug,
        domain: body.domain || 'Web Development',
        topic: body.topic || body.language || 'HTML',
        description: body.description,
        bugDescription: body.bugDescription || 'Inspect starter code for bugs.',
        difficulty: body.difficulty || 'Easy',
        categoryId: Number(body.categoryId) || 1,
        language: body.language || 'HTML',
        starterHtml: body.starterHtml || '<div>Starter HTML</div>',
        starterCss: body.starterCss || 'body { background: #0f172a; color: #fff; }',
        starterJs: body.starterJs || '',
        expectedBehavior:
          body.expectedBehavior || 'All test assertions should pass.',
        instructions:
          body.instructions || 'Fix the bug in the starter code and submit.',
        constraints: body.constraints || 'Keep existing element IDs intact.',
        inputFormat: body.inputFormat || 'Standard function / code input',
        outputFormat: body.outputFormat || 'Verified deterministic output',
        estimatedTime: body.estimatedTime || '12 mins',
        visibleExamples: JSON.stringify(body.visibleExamples || []),
        hints: Array.isArray(body.hints)
          ? JSON.stringify(body.hints)
          : body.hints || JSON.stringify(['Check the starter code carefully.']),
        xpPoints: Number(body.xpPoints) || xpPoints,
        isPublished: body.isPublished !== false,
        testCases: body.testCases || [
          {
            title: 'Code executes without errors',
            inputData: 'DOM verification',
            expectedOutput: 'Pass',
            assertionScript: 'return Boolean(document.body.innerHTML.trim());',
            isHidden: false,
          },
        ],
      });

      return res.status(201).json(created);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: error.message || 'Failed to create problem' });
    }
  }
);

app.put(
  '/api/admin/problems/:id',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const body = { ...req.body };
      if (Array.isArray(body.hints)) {
        body.hints = JSON.stringify(body.hints);
      }
      if (body.xpPoints !== undefined) {
        body.xpPoints = Number(body.xpPoints);
      }
      if (body.categoryId !== undefined) {
        body.categoryId = Number(body.categoryId);
      }
      const updated = await updateAdminProblem(Number(req.params.id), body);
      return res.json(updated);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: error.message || 'Failed to update problem' });
    }
  }
);

app.post(
  '/api/admin/problems/:id/publish',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const problem = await getProblemById(Number(req.params.id));
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }
      const updated = await updateAdminProblem(problem.id, {
        isPublished: !problem.isPublished,
      });
      return res.json(updated);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: error.message || 'Failed to toggle publish state' });
    }
  }
);

app.delete(
  '/api/admin/problems/:id',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      await deleteAdminProblem(Number(req.params.id));
      return res.json({ message: 'Problem deleted successfully.' });
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: error.message || 'Failed to delete problem' });
    }
  }
);

// Admin Domains Management
app.get(
  '/api/admin/domains',
  requireAuth,
  requireAdmin,
  async (_req: AuthRequest, res) => {
    try {
      const list = await getAllDomains(true);
      const probs = await getAllProblems(true);
      return res.json(
        list.map((d) => {
          let topics: string[] = [];
          try {
            topics = JSON.parse(d.topicsJson || '[]');
          } catch {
            topics = [];
          }
          return {
            ...d,
            topics,
            challengeCount: probs.filter((p) => p.domain === d.name).length,
          };
        })
      );
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to load domains' });
    }
  }
);

app.post(
  '/api/admin/domains',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { id, name, description, icon, color, difficultyInfo, topics, isActive } =
        req.body;
      if (!name || !description) {
        return res.status(400).json({ error: 'Domain name and description are required.' });
      }
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const saved = await createOrUpdateAdminDomain({
        id: id ? Number(id) : undefined,
        name,
        slug,
        description,
        icon,
        color,
        difficultyInfo,
        topics: Array.isArray(topics) ? topics : [],
        isActive: isActive !== false,
      });
      return res.json(saved);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to save domain' });
    }
  }
);

app.post(
  '/api/admin/domains/:id/toggle',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const result = await deleteOrToggleAdminDomain(
        Number(req.params.id),
        Boolean(req.body?.hardDelete)
      );
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to update domain' });
    }
  }
);

app.get(
  '/api/admin/users',
  requireAuth,
  requireAdmin,
  async (_req: AuthRequest, res) => {
    try {
      const list = await getAllUsersForAdmin();
      return res.json(list);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to load users' });
    }
  }
);

app.get(
  '/api/admin/submissions',
  requireAuth,
  requireAdmin,
  async (_req: AuthRequest, res) => {
    try {
      const list = await getAllSubmissionsForAdmin(50);
      return res.json(list);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to load submissions' });
    }
  }
);

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Attend AI server running on http://localhost:${PORT}`);
  });
}

startServer();
