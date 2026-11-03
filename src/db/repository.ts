import { db } from './index.ts';
import {
  users,
  domains,
  categories,
  problems,
  problemTestCases,
  submissions,
  userProgress,
  userStreaks,
  achievements,
  userAchievements,
} from './schema.ts';
import { eq, desc, asc, and } from 'drizzle-orm';

export async function getAllDomains(includeInactive = false) {
  try {
    const rows = await db.select().from(domains).orderBy(asc(domains.id));
    if (includeInactive) return rows;
    return rows.filter((d) => d.isActive);
  } catch (error) {
    console.error('Database query failed in getAllDomains:', error);
    throw new Error('Failed to fetch practice domains.', { cause: error });
  }
}

export async function getUserByEmail(email: string) {
  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getUserByEmail:', error);
    throw new Error('Failed to look up user account.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getUserByUid:', error);
    throw new Error('Failed to load user profile.', { cause: error });
  }
}

export async function getUserByUsername(username: string) {
  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.username, username.trim()));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getUserByUsername:', error);
    throw new Error('Failed to check username availability.', { cause: error });
  }
}

export async function createOrUpdateUser(params: {
  uid: string;
  email: string;
  username: string;
  fullName: string;
  passwordHash?: string;
  role?: string;
}) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid: params.uid,
        email: params.email.toLowerCase().trim(),
        username: params.username.trim(),
        fullName: params.fullName.trim(),
        passwordHash: params.passwordHash || '',
        role: params.role || 'student',
        emailVerified: true,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: params.email.toLowerCase().trim(),
          updatedAt: new Date(),
        },
      })
      .returning();

    const user = result[0];
    // Ensure streak record exists
    await db
      .insert(userStreaks)
      .values({
        userId: user.uid,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: '',
      })
      .onConflictDoNothing();

    return user;
  } catch (error) {
    console.error('Database query failed in createOrUpdateUser:', error);
    throw new Error('Failed to create user account.', { cause: error });
  }
}

export async function updateUserProfile(
  uid: string,
  updates: {
    fullName?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    passwordHash?: string;
    resetToken?: string | null;
    resetTokenExpires?: Date | null;
  }
) {
  try {
    const result = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error('Database query failed in updateUserProfile:', error);
    throw new Error('Failed to update user profile.', { cause: error });
  }
}

export async function getAllCategories() {
  try {
    return await db.select().from(categories).orderBy(asc(categories.id));
  } catch (error) {
    console.error('Database query failed in getAllCategories:', error);
    throw new Error('Failed to fetch categories.', { cause: error });
  }
}

export async function getAllProblems(includeUnpublished = false) {
  try {
    const allProbs = await db
      .select()
      .from(problems)
      .orderBy(asc(problems.id));
    if (includeUnpublished) return allProbs;
    return allProbs.filter((p) => p.isPublished);
  } catch (error) {
    console.error('Database query failed in getAllProblems:', error);
    throw new Error('Failed to fetch problems list.', { cause: error });
  }
}

export async function getProblemById(id: number) {
  try {
    const rows = await db.select().from(problems).where(eq(problems.id, id));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getProblemById:', error);
    throw new Error('Failed to fetch problem details.', { cause: error });
  }
}

export async function getTestCasesForProblem(problemId: number, includeHidden = false) {
  try {
    const rows = await db
      .select()
      .from(problemTestCases)
      .where(eq(problemTestCases.problemId, problemId))
      .orderBy(asc(problemTestCases.id));
    if (includeHidden) return rows;
    return rows.filter((tc) => !tc.isHidden);
  } catch (error) {
    console.error('Database query failed in getTestCasesForProblem:', error);
    throw new Error('Failed to fetch problem test cases.', { cause: error });
  }
}

export async function getUserProgressList(uid: string) {
  try {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, uid));
  } catch (error) {
    console.error('Database query failed in getUserProgressList:', error);
    throw new Error('Failed to load user progress.', { cause: error });
  }
}

export async function getUserStreakRecord(uid: string) {
  try {
    const rows = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, uid));
    return (
      rows[0] || {
        userId: uid,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: '',
      }
    );
  } catch (error) {
    console.error('Database query failed in getUserStreakRecord:', error);
    throw new Error('Failed to load user streak.', { cause: error });
  }
}

export async function getUserSubmissions(uid: string) {
  try {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.userId, uid))
      .orderBy(desc(submissions.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserSubmissions:', error);
    throw new Error('Failed to load submission history.', { cause: error });
  }
}

export async function getSubmissionById(id: number) {
  try {
    const rows = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, id));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getSubmissionById:', error);
    throw new Error('Failed to load submission details.', { cause: error });
  }
}

export async function getAllAchievementsWithUserStatus(uid?: string) {
  try {
    const allAch = await db
      .select()
      .from(achievements)
      .orderBy(asc(achievements.id));
    if (!uid) {
      return allAch.map((a) => ({ ...a, earned: false, earnedAt: null }));
    }
    const earnedRows = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, uid));
    const earnedMap = new Map(
      earnedRows.map((r) => [r.achievementId, r.earnedAt])
    );
    return allAch.map((a) => ({
      ...a,
      earned: earnedMap.has(a.id),
      earnedAt: earnedMap.get(a.id) || null,
    }));
  } catch (error) {
    console.error('Database query failed in getAllAchievementsWithUserStatus:', error);
    throw new Error('Failed to load achievements.', { cause: error });
  }
}

export async function recordSubmissionAndProgress(params: {
  uid: string;
  problemId: number;
  language: string;
  html: string;
  css: string;
  js: string;
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  executionTime: number;
  xpPoints: number;
  aiFeedback: string;
}) {
  try {
    // 1. Check existing user_progress for this problem
    const existingProgRows = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, params.uid),
          eq(userProgress.problemId, params.problemId)
        )
      );

    const existingProg = existingProgRows[0];
    const alreadySolved = Boolean(existingProg?.isSolved);
    const isFirstSolve = params.allPassed && !alreadySolved;
    const xpEarned = isFirstSolve ? params.xpPoints : 0;

    // 2. Insert submission record
    const [insertedSub] = await db
      .insert(submissions)
      .values({
        userId: params.uid,
        problemId: params.problemId,
        language: params.language,
        submittedHtml: params.html,
        submittedCss: params.css,
        submittedJs: params.js,
        status: params.allPassed ? 'Passed' : 'Failed',
        passedTests: params.passedCount,
        totalTests: params.totalCount,
        executionTime: params.executionTime,
        xpEarned,
        aiFeedback: params.aiFeedback,
      })
      .returning();

    // 3. Upsert user_progress
    if (!existingProg) {
      await db.insert(userProgress).values({
        userId: params.uid,
        problemId: params.problemId,
        isSolved: params.allPassed,
        firstSolvedAt: params.allPassed ? new Date() : null,
        attempts: 1,
      });
    } else {
      await db
        .update(userProgress)
        .set({
          isSolved: alreadySolved || params.allPassed,
          firstSolvedAt:
            existingProg.firstSolvedAt || (params.allPassed ? new Date() : null),
          attempts: existingProg.attempts + 1,
          updatedAt: new Date(),
        })
        .where(eq(userProgress.id, existingProg.id));
    }

    // 4. Update user XP if solved for the first time
    const userRow = await getUserByUid(params.uid);
    let newTotalXp = userRow?.totalXp || 0;
    if (isFirstSolve && userRow) {
      newTotalXp = userRow.totalXp + xpEarned;
      await db
        .update(users)
        .set({
          totalXp: newTotalXp,
          updatedAt: new Date(),
        })
        .where(eq(users.uid, params.uid));
    }

    // 5. Update user streak on activity
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0];
    const streakRow = await getUserStreakRecord(params.uid);
    let currentStreak = streakRow.currentStreak || 0;
    let longestStreak = streakRow.longestStreak || 0;

    if (streakRow.lastActivityDate !== todayStr) {
      if (streakRow.lastActivityDate === yesterdayStr) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      await db
        .insert(userStreaks)
        .values({
          userId: params.uid,
          currentStreak,
          longestStreak,
          lastActivityDate: todayStr,
        })
        .onConflictDoUpdate({
          target: userStreaks.userId,
          set: {
            currentStreak,
            longestStreak,
            lastActivityDate: todayStr,
            updatedAt: new Date(),
          },
        });
    }

    // 6. Check and unlock achievements (including domain-specific explorer badges)
    const allProg = await getUserProgressList(params.uid);
    const allProbs = await db.select().from(problems);
    const probMap = new Map(allProbs.map((p) => [p.id, p]));
    const solvedProbs = allProg
      .filter((p) => p.isSolved)
      .map((p) => probMap.get(p.problemId))
      .filter(Boolean);
    const solvedCount = solvedProbs.length;

    const solvedPythonCount = solvedProbs.filter(
      (p) => p?.language === 'Python' || p?.topic === 'Python'
    ).length;
    const solvedDsaCount = solvedProbs.filter(
      (p) => p?.domain === 'Data Structures & Algorithms'
    ).length;
    const solvedDsCount = solvedProbs.filter(
      (p) => p?.domain === 'Data Science & Analytics'
    ).length;
    const solvedAiMlCount = solvedProbs.filter(
      (p) => p?.domain === 'AI & Machine Learning'
    ).length;

    const allAch = await db.select().from(achievements);
    const userAch = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, params.uid));
    const ownedIds = new Set(userAch.map((ua) => ua.achievementId));

    for (const ach of allAch) {
      if (ownedIds.has(ach.id)) continue;
      let qualifies = false;
      if (
        ach.requirementType === 'solved_count' &&
        solvedCount >= ach.requirementValue
      ) {
        qualifies = true;
      } else if (
        ach.requirementType === 'xp_total' &&
        newTotalXp >= ach.requirementValue
      ) {
        qualifies = true;
      } else if (
        ach.requirementType === 'streak_days' &&
        currentStreak >= ach.requirementValue
      ) {
        qualifies = true;
      } else if (
        ach.requirementType === 'domain_python' &&
        solvedPythonCount >= ach.requirementValue
      ) {
        qualifies = true;
      } else if (
        ach.requirementType === 'domain_dsa' &&
        solvedDsaCount >= ach.requirementValue
      ) {
        qualifies = true;
      } else if (
        ach.requirementType === 'domain_ds' &&
        solvedDsCount >= ach.requirementValue
      ) {
        qualifies = true;
      } else if (
        ach.requirementType === 'domain_aiml' &&
        solvedAiMlCount >= ach.requirementValue
      ) {
        qualifies = true;
      }
      if (qualifies) {
        await db.insert(userAchievements).values({
          userId: params.uid,
          achievementId: ach.id,
        });
      }
    }

    return {
      submission: insertedSub,
      xpEarned,
      newTotalXp,
      isFirstSolve,
      currentStreak,
    };
  } catch (error) {
    console.error('Database transaction failed in recordSubmissionAndProgress:', error);
    throw new Error('Failed to record submission and update progress.', {
      cause: error,
    });
  }
}

export async function getLeaderboardData(options?: {
  sortBy?: 'xp' | 'solved' | 'streak' | 'accuracy';
  period?: 'all' | 'weekly' | 'monthly';
  domain?: string;
}) {
  try {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.totalXp));
    const allProgress = await db.select().from(userProgress);
    const allStreaks = await db.select().from(userStreaks);
    const allSubs = await db.select().from(submissions);
    const allProblems = await db.select().from(problems);
    const probMap = new Map(allProblems.map((p) => [p.id, p]));

    const period = options?.period || 'all';
    const domainFilter =
      options?.domain && options.domain !== 'All' ? options.domain : null;
    const cutoffDate =
      period === 'weekly'
        ? new Date(Date.now() - 7 * 86400000)
        : period === 'monthly'
        ? new Date(Date.now() - 30 * 86400000)
        : null;

    const solvedByUser = new Map<string, number>();
    const domainXpByUser = new Map<string, number>();

    for (const p of allProgress) {
      if (p.isSolved) {
        const prob = probMap.get(p.problemId);
        if (domainFilter && prob?.domain !== domainFilter) {
          continue;
        }
        if (cutoffDate && p.firstSolvedAt && new Date(p.firstSolvedAt) < cutoffDate) {
          continue;
        }
        solvedByUser.set(p.userId, (solvedByUser.get(p.userId) || 0) + 1);
        domainXpByUser.set(
          p.userId,
          (domainXpByUser.get(p.userId) || 0) + (prob?.xpPoints || 10)
        );
      }
    }

    const streakByUser = new Map<string, number>();
    for (const s of allStreaks) {
      streakByUser.set(s.userId, s.currentStreak);
    }

    const subsCountByUser = new Map<
      string,
      { total: number; passed: number; periodXp: number }
    >();
    for (const sub of allSubs) {
      const prob = probMap.get(sub.problemId);
      if (domainFilter && prob?.domain !== domainFilter) {
        continue;
      }
      if (cutoffDate && sub.createdAt && new Date(sub.createdAt) < cutoffDate) {
        continue;
      }
      const cur = subsCountByUser.get(sub.userId) || {
        total: 0,
        passed: 0,
        periodXp: 0,
      };
      cur.total += 1;
      if (sub.status === 'Passed') cur.passed += 1;
      cur.periodXp += sub.xpEarned || 0;
      subsCountByUser.set(sub.userId, cur);
    }

    const rows = allUsers.map((u) => {
      const subStats = subsCountByUser.get(u.uid) || {
        total: 0,
        passed: 0,
        periodXp: 0,
      };
      const accuracy =
        subStats.total > 0
          ? Math.round((subStats.passed / subStats.total) * 100)
          : 0;
      const computedXp = domainFilter
        ? domainXpByUser.get(u.uid) || 0
        : cutoffDate
        ? subStats.periodXp || u.totalXp
        : u.totalXp;

      return {
        uid: u.uid,
        username: u.username,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl || '',
        totalXp: computedXp,
        problemsSolved: solvedByUser.get(u.uid) || 0,
        streak: streakByUser.get(u.uid) || 0,
        accuracy,
        totalSubmissions: subStats.total,
      };
    });

    const sortBy = options?.sortBy || 'xp';
    rows.sort((a, b) => {
      if (sortBy === 'solved') {
        return b.problemsSolved - a.problemsSolved || b.totalXp - a.totalXp;
      }
      if (sortBy === 'streak') {
        return b.streak - a.streak || b.totalXp - a.totalXp;
      }
      if (sortBy === 'accuracy') {
        return b.accuracy - a.accuracy || b.problemsSolved - a.problemsSolved;
      }
      return b.totalXp - a.totalXp || b.problemsSolved - a.problemsSolved;
    });

    return rows.map((r, idx) => ({
      ...r,
      rank: idx + 1,
    }));
  } catch (error) {
    console.error('Database query failed in getLeaderboardData:', error);
    throw new Error('Failed to load leaderboard rankings.', { cause: error });
  }
}

export async function deleteUserAccount(uid: string) {
  try {
    await db.delete(userAchievements).where(eq(userAchievements.userId, uid));
    await db.delete(userStreaks).where(eq(userStreaks.userId, uid));
    await db.delete(userProgress).where(eq(userProgress.userId, uid));
    await db.delete(submissions).where(eq(submissions.userId, uid));
    await db.delete(users).where(eq(users.uid, uid));
    return true;
  } catch (error) {
    console.error('Database query failed in deleteUserAccount:', error);
    throw new Error('Failed to delete user account.', { cause: error });
  }
}

export async function createAdminProblem(data: {
  title: string;
  slug: string;
  domain?: string;
  topic?: string;
  description: string;
  bugDescription: string;
  difficulty: string;
  categoryId: number;
  language: string;
  starterHtml: string;
  starterCss: string;
  starterJs: string;
  expectedBehavior: string;
  instructions: string;
  constraints: string;
  inputFormat?: string;
  outputFormat?: string;
  estimatedTime?: string;
  visibleExamples: string;
  hints: string;
  xpPoints: number;
  isPublished: boolean;
  testCases?: Array<{
    title: string;
    inputData: string;
    expectedOutput: string;
    assertionScript: string;
    isHidden: boolean;
  }>;
}) {
  try {
    const [created] = await db
      .insert(problems)
      .values({
        title: data.title,
        slug: data.slug,
        domain: data.domain || 'Web Development',
        topic: data.topic || data.language || 'HTML',
        description: data.description,
        bugDescription: data.bugDescription,
        difficulty: data.difficulty,
        categoryId: data.categoryId,
        language: data.language,
        starterHtml: data.starterHtml,
        starterCss: data.starterCss,
        starterJs: data.starterJs,
        expectedBehavior: data.expectedBehavior,
        instructions: data.instructions,
        constraints: data.constraints,
        inputFormat: data.inputFormat || 'Standard function / code input',
        outputFormat: data.outputFormat || 'Verified deterministic output',
        estimatedTime: data.estimatedTime || '12 mins',
        visibleExamples: data.visibleExamples,
        hints: data.hints,
        xpPoints: data.xpPoints,
        isPublished: data.isPublished,
      })
      .returning();

    if (created && data.testCases && data.testCases.length > 0) {
      await db.insert(problemTestCases).values(
        data.testCases.map((tc) => ({
          problemId: created.id,
          title: tc.title,
          inputData: tc.inputData,
          expectedOutput: tc.expectedOutput,
          assertionScript: tc.assertionScript || 'return true;',
          isHidden: Boolean(tc.isHidden),
        }))
      );
    }

    return created;
  } catch (error) {
    console.error('Database query failed in createAdminProblem:', error);
    throw new Error('Failed to create problem.', { cause: error });
  }
}

export async function updateAdminProblem(
  id: number,
  updates: Partial<typeof problems.$inferInsert> & {
    testCases?: Array<{
      title: string;
      inputData: string;
      expectedOutput: string;
      assertionScript: string;
      isHidden: boolean;
    }>;
  }
) {
  try {
    const { testCases, ...problemFields } = updates;
    const [updated] = await db
      .update(problems)
      .set({
        ...problemFields,
        updatedAt: new Date(),
      })
      .where(eq(problems.id, id))
      .returning();

    if (updated && Array.isArray(testCases) && testCases.length > 0) {
      await db
        .delete(problemTestCases)
        .where(eq(problemTestCases.problemId, id));
      await db.insert(problemTestCases).values(
        testCases.map((tc) => ({
          problemId: id,
          title: tc.title || 'Test Case',
          inputData: tc.inputData || 'DOM Verification',
          expectedOutput: tc.expectedOutput || 'Pass',
          assertionScript: tc.assertionScript || 'return true;',
          isHidden: Boolean(tc.isHidden),
        }))
      );
    }

    return updated || null;
  } catch (error) {
    console.error('Database query failed in updateAdminProblem:', error);
    throw new Error('Failed to update problem.', { cause: error });
  }
}

export async function deleteAdminProblem(id: number) {
  try {
    await db
      .delete(problemTestCases)
      .where(eq(problemTestCases.problemId, id));
    await db.delete(submissions).where(eq(submissions.problemId, id));
    await db.delete(userProgress).where(eq(userProgress.problemId, id));
    await db.delete(problems).where(eq(problems.id, id));
    return true;
  } catch (error) {
    console.error('Database query failed in deleteAdminProblem:', error);
    throw new Error('Failed to delete problem.', { cause: error });
  }
}

export async function createOrUpdateAdminDomain(data: {
  id?: number;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  color?: string;
  difficultyInfo?: string;
  topics?: string[];
  isActive?: boolean;
}) {
  try {
    const topicsJson = JSON.stringify(data.topics || []);
    if (data.id) {
      const [updated] = await db
        .update(domains)
        .set({
          name: data.name,
          slug: data.slug,
          description: data.description,
          icon: data.icon || 'globe',
          color: data.color || 'indigo',
          difficultyInfo: data.difficultyInfo || 'Beginner to Hard',
          topicsJson,
          isActive: data.isActive ?? true,
        })
        .where(eq(domains.id, data.id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(domains)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon || 'globe',
        color: data.color || 'indigo',
        difficultyInfo: data.difficultyInfo || 'Beginner to Hard',
        topicsJson,
        isActive: data.isActive ?? true,
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database query failed in createOrUpdateAdminDomain:', error);
    throw new Error('Failed to save domain.', { cause: error });
  }
}

export async function deleteOrToggleAdminDomain(id: number, hardDelete = false) {
  try {
    if (hardDelete) {
      await db.delete(domains).where(eq(domains.id, id));
      return { deleted: true };
    }
    const existing = await db.select().from(domains).where(eq(domains.id, id));
    if (!existing[0]) return null;
    const [updated] = await db
      .update(domains)
      .set({ isActive: !existing[0].isActive })
      .where(eq(domains.id, id))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database query failed in deleteOrToggleAdminDomain:', error);
    throw new Error('Failed to toggle domain status.', { cause: error });
  }
}

export async function getAllUsersForAdmin() {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.totalXp));
    const allProg = await db.select().from(userProgress);
    const allStreaks = await db.select().from(userStreaks);
    const streakMap = new Map(allStreaks.map((s) => [s.userId, s.currentStreak]));

    return allUsers.map((u) => {
      const userSolved = allProg.filter(
        (p) => p.userId === u.uid && p.isSolved
      ).length;
      return {
        uid: u.uid,
        email: u.email,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        totalXp: u.totalXp,
        problemsSolved: userSolved,
        streak: streakMap.get(u.uid) || 0,
        createdAt: u.createdAt,
      };
    });
  } catch (error) {
    console.error('Database query failed in getAllUsersForAdmin:', error);
    throw new Error('Failed to load users for admin.', { cause: error });
  }
}

export async function getAllSubmissionsForAdmin(limit = 50) {
  try {
    const allSubs = await db
      .select()
      .from(submissions)
      .orderBy(desc(submissions.createdAt));
    const allProbs = await db.select().from(problems);
    const allUsers = await db.select().from(users);
    const probMap = new Map(allProbs.map((p) => [p.id, p]));
    const userMap = new Map(allUsers.map((u) => [u.uid, u]));

    return allSubs.slice(0, limit).map((s) => {
      const p = probMap.get(s.problemId);
      const u = userMap.get(s.userId);
      return {
        ...s,
        problemTitle: p?.title || `Challenge #${s.problemId}`,
        domain: p?.domain || 'Web Development',
        topic: p?.topic || s.language,
        userFullName: u?.fullName || s.userId,
        username: u?.username || 'developer',
      };
    });
  } catch (error) {
    console.error('Database query failed in getAllSubmissionsForAdmin:', error);
    throw new Error('Failed to load submissions for admin.', { cause: error });
  }
}
