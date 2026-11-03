-- Attend AI — Complete Row Level Security (RLS) Policies & Triggers (Phase 3)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles are readable by authenticated and public users" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own student profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile metadata" ON profiles;

CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own student profile"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND role = 'student'
    AND total_xp = 0
  );

-- Users can update only their own profile and cannot escalate role or total_xp directly
CREATE POLICY "Users can update their own profile metadata"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
  );

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND (NEW.role IS DISTINCT FROM OLD.role
          OR NEW.total_xp IS DISTINCT FROM OLD.total_xp) THEN
    RAISE EXCEPTION 'Profile role and XP cannot be changed by the account owner';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- 2. CATEGORIES & PROBLEMS POLICIES
CREATE POLICY "Categories are viewable by all users"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Published problems are viewable by all users"
  ON problems FOR SELECT
  USING (
    is_published = true
    OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert problems"
  ON problems FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update problems"
  ON problems FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete problems"
  ON problems FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. PROBLEM TEST CASES POLICIES
-- Never expose hidden test cases to non-admin clients
CREATE POLICY "Clients can read only visible test cases"
  ON problem_test_cases FOR SELECT
  USING (
    is_hidden = false
    OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 4. SUBMISSIONS POLICIES
CREATE POLICY "Users can view only their own submission history"
  ON submissions FOR SELECT
  USING (auth.uid() = user_id);

-- 5. USER PROGRESS, STREAKS & ACHIEVEMENTS POLICIES
-- Read-only for the owning user; writes are restricted to backend service role after deterministic evaluation
CREATE POLICY "Users can read their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own streak"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Achievements catalog is viewable by everyone"
  ON achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can view their earned achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);
