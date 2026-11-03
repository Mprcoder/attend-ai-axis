import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  fullName: text('full_name').notNull(),
  passwordHash: text('password_hash'),
  emailVerified: boolean('email_verified').notNull().default(true),
  resetToken: text('reset_token'),
  resetTokenExpires: timestamp('reset_token_expires'),
  avatarUrl: text('avatar_url').default(''),
  bio: text('bio').default(''),
  role: text('role').notNull().default('student'),
  totalXp: integer('total_xp').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const domains = pgTable('domains', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  icon: text('icon').notNull().default('globe'),
  color: text('color').notNull().default('indigo'),
  difficultyInfo: text('difficulty_info').notNull().default('Beginner to Hard'),
  topicsJson: text('topics_json').notNull().default('[]'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  level: text('level').notNull().default('Beginner'),
  icon: text('icon').notNull().default('globe'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const problems = pgTable(
  'problems',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    domain: text('domain').notNull().default('Web Development'),
    topic: text('topic').notNull().default('HTML'),
    description: text('description').notNull(),
    bugDescription: text('bug_description').notNull(),
    difficulty: text('difficulty').notNull(), // Beginner, Easy, Medium, Hard, Expert
    categoryId: integer('category_id')
      .references(() => categories.id)
      .notNull(),
    language: text('language').notNull(), // HTML, CSS, JavaScript, React.js, Node.js, Python, C, C++, Java, SQL
    starterHtml: text('starter_html').notNull(),
    starterCss: text('starter_css').notNull(),
    starterJs: text('starter_js').notNull(),
    expectedBehavior: text('expected_behavior').notNull(),
    instructions: text('instructions').notNull(),
    constraints: text('constraints').notNull(),
    inputFormat: text('input_format').notNull().default('Standard function / code input'),
    outputFormat: text('output_format').notNull().default('Verified deterministic output'),
    estimatedTime: text('estimated_time').notNull().default('10 mins'),
    visibleExamples: text('visible_examples').notNull(), // JSON string
    hints: text('hints').notNull(), // JSON string array
    xpPoints: integer('xp_points').notNull().default(10),
    isPublished: boolean('is_published').notNull().default(true),
    popularity: integer('popularity').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_problems_category_id').on(table.categoryId),
    index('idx_problems_domain').on(table.domain),
    index('idx_problems_topic').on(table.topic),
    index('idx_problems_difficulty').on(table.difficulty),
    index('idx_problems_language').on(table.language),
  ]
);

export const problemTestCases = pgTable(
  'problem_test_cases',
  {
    id: serial('id').primaryKey(),
    problemId: integer('problem_id')
      .references(() => problems.id)
      .notNull(),
    title: text('title').notNull(),
    inputData: text('input_data').notNull(),
    expectedOutput: text('expected_output').notNull(),
    assertionScript: text('assertion_script').notNull(),
    isHidden: boolean('is_hidden').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [index('idx_test_cases_problem_id').on(table.problemId)]
);

export const submissions = pgTable(
  'submissions',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    problemId: integer('problem_id')
      .references(() => problems.id)
      .notNull(),
    language: text('language').notNull(),
    submittedHtml: text('submitted_html').notNull(),
    submittedCss: text('submitted_css').notNull(),
    submittedJs: text('submitted_js').notNull(),
    status: text('status').notNull(), // Passed, Failed
    passedTests: integer('passed_tests').notNull(),
    totalTests: integer('total_tests').notNull(),
    executionTime: integer('execution_time').notNull().default(14),
    xpEarned: integer('xp_earned').notNull().default(0),
    aiFeedback: text('ai_feedback').default(''),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('idx_submissions_user_id').on(table.userId),
    index('idx_submissions_problem_id').on(table.problemId),
  ]
);

export const userProgress = pgTable(
  'user_progress',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    problemId: integer('problem_id')
      .references(() => problems.id)
      .notNull(),
    isSolved: boolean('is_solved').notNull().default(false),
    firstSolvedAt: timestamp('first_solved_at'),
    attempts: integer('attempts').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_user_progress_user_id').on(table.userId),
    uniqueIndex('uq_user_progress_user_problem').on(table.userId, table.problemId),
  ]
);

export const userStreaks = pgTable('user_streaks', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastActivityDate: text('last_activity_date').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().unique(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  requirementType: text('requirement_type').notNull(), // solved_count, xp_total, streak_days
  requirementValue: integer('requirement_value').notNull(),
});

export const userAchievements = pgTable(
  'user_achievements',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    achievementId: integer('achievement_id')
      .references(() => achievements.id)
      .notNull(),
    earnedAt: timestamp('earned_at').defaultNow(),
  },
  (table) => [
    index('idx_user_achievements_user_id').on(table.userId),
    uniqueIndex('uq_user_achievement').on(table.userId, table.achievementId),
  ]
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  problems: many(problems),
}));

export const problemsRelations = relations(problems, ({ one, many }) => ({
  category: one(categories, {
    fields: [problems.categoryId],
    references: [categories.id],
  }),
  testCases: many(problemTestCases),
  submissions: many(submissions),
}));

export const problemTestCasesRelations = relations(problemTestCases, ({ one }) => ({
  problem: one(problems, {
    fields: [problemTestCases.problemId],
    references: [problems.id],
  }),
}));
