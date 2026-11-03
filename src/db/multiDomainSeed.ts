import { db } from './index.ts';
import {
  domains,
  categories,
  problems,
  problemTestCases,
  achievements,
} from './schema.ts';
import { eq } from 'drizzle-orm';

export async function ensureMultiDomainSeeded() {
  try {
    // 1. Seed the 5 Core Practice Domains
    const domainDefinitions = [
      {
        name: 'Web Development',
        slug: 'web-development',
        description:
          'HTML5, CSS3, JavaScript, React.js, Node.js, and Express.js full-stack debugging & component architecture.',
        icon: 'globe',
        color: 'indigo',
        difficultyInfo: 'Beginner to Hard',
        topicsJson: JSON.stringify([
          'HTML',
          'CSS',
          'JavaScript',
          'React.js',
          'Node.js',
          'Express.js',
        ]),
        isActive: true,
      },
      {
        name: 'Programming Languages',
        slug: 'programming-languages',
        description:
          'Core language syntax, memory models, data structures, and runtime debugging across Python, C, C++, and Java.',
        icon: 'terminal',
        color: 'amber',
        difficultyInfo: 'Beginner to Hard',
        topicsJson: JSON.stringify(['Python', 'C', 'C++', 'Java']),
        isActive: true,
      },
      {
        name: 'Data Structures & Algorithms',
        slug: 'dsa',
        description:
          'Arrays, Strings, Searching, Sorting, Hashing, Two Pointers, Sliding Window, Linked Lists, Stack, Queue, Trees, Graphs, and DP.',
        icon: 'cpu',
        color: 'emerald',
        difficultyInfo: 'Beginner to Expert',
        topicsJson: JSON.stringify([
          'Arrays',
          'Strings',
          'Searching',
          'Sorting',
          'Hashing',
          'Two Pointers',
          'Sliding Window',
          'Linked Lists',
          'Stack',
          'Queue',
          'Recursion',
          'Backtracking',
          'Binary Trees',
          'Binary Search Trees',
          'Heaps',
          'Graphs',
          'Greedy Algorithms',
          'Dynamic Programming',
          'Bit Manipulation',
        ]),
        isActive: true,
      },
      {
        name: 'Data Science & Analytics',
        slug: 'data-science',
        description:
          'Python for Data Science, NumPy, Pandas, SQL Queries, Statistics, Probability, Data Cleaning, EDA, and Visualization.',
        icon: 'database',
        color: 'sky',
        difficultyInfo: 'Beginner to Hard',
        topicsJson: JSON.stringify([
          'Python for Data Science',
          'NumPy',
          'Pandas',
          'Matplotlib',
          'Seaborn',
          'SQL',
          'Statistics',
          'Probability',
          'Data Cleaning',
          'Exploratory Data Analysis (EDA)',
          'Data Visualization',
        ]),
        isActive: true,
      },
      {
        name: 'AI & Machine Learning',
        slug: 'ai-ml',
        description:
          'Supervised & Unsupervised Learning, Regression, Classification, Feature Engineering, Scikit-learn, Neural Networks, NLP, and GenAI.',
        icon: 'sparkles',
        color: 'purple',
        difficultyInfo: 'Easy to Expert',
        topicsJson: JSON.stringify([
          'AI Fundamentals',
          'Machine Learning Fundamentals',
          'Supervised Learning',
          'Unsupervised Learning',
          'Regression',
          'Classification',
          'Clustering',
          'Feature Engineering',
          'Model Evaluation',
          'Scikit-learn',
          'Deep Learning Fundamentals',
          'Neural Networks',
          'Natural Language Processing',
          'Generative AI Fundamentals',
        ]),
        isActive: true,
      },
    ];

    for (const dom of domainDefinitions) {
      await db.insert(domains).values(dom).onConflictDoNothing();
    }

    // 2. Ensure Domain Categories exist in `categories` table
    const extraCategories = [
      {
        name: 'Full-Stack Web (React / Node / Express)',
        slug: 'fullstack-web-debugging',
        description:
          'React state hooks, Node.js buffers, and Express REST middleware debugging.',
        level: 'Intermediate',
        icon: 'globe',
      },
      {
        name: 'Programming Languages (Python / C / C++ / Java)',
        slug: 'programming-languages-cat',
        description:
          'Core programming language bugs, pointer arithmetic, object equality, and mutable defaults.',
        level: 'Beginner',
        icon: 'terminal',
      },
      {
        name: 'Data Structures & Algorithms (DSA)',
        slug: 'dsa-cat',
        description:
          'Arrays, Two Pointers, Binary Search, Stacks, Graphs, and Dynamic Programming.',
        level: 'Intermediate',
        icon: 'cpu',
      },
      {
        name: 'Data Science & SQL Analytics',
        slug: 'data-science-cat',
        description:
          'SQL joins & aggregations, Pandas DataFrames, NumPy broadcasting, and statistical outlier analysis.',
        level: 'Intermediate',
        icon: 'database',
      },
      {
        name: 'Artificial Intelligence & Machine Learning',
        slug: 'ai-ml-cat',
        description:
          'Scikit-learn pipelines, regression loss functions, neural network activations, and cosine similarity.',
        level: 'Advanced',
        icon: 'sparkles',
      },
    ];

    for (const cat of extraCategories) {
      await db.insert(categories).values(cat).onConflictDoNothing();
    }

    const allCats = await db.select().from(categories);
    const getCatId = (slug: string, fallback = 1) =>
      allCats.find((c) => c.slug === slug)?.id || fallback;

    const webCatId = getCatId('fullstack-web-debugging', 1);
    const progCatId = getCatId('programming-languages-cat', 1);
    const dsaCatId = getCatId('dsa-cat', 2);
    const dsCatId = getCatId('data-science-cat', 3);
    const aiCatId = getCatId('ai-ml-cat', 3);

    // 3. Seed Enhanced Gamification Achievements
    const newAchievements = [
      {
        title: 'First Challenge Solved',
        description: 'Solve your very first coding or debugging challenge.',
        icon: 'bug',
        requirementType: 'solved_count',
        requirementValue: 1,
      },
      {
        title: 'Python Beginner',
        description: 'Solve your first Python programming or data science challenge.',
        icon: 'terminal',
        requirementType: 'domain_python',
        requirementValue: 1,
      },
      {
        title: 'DSA Explorer',
        description: 'Solve at least 2 Data Structures & Algorithms challenges.',
        icon: 'cpu',
        requirementType: 'domain_dsa',
        requirementValue: 2,
      },
      {
        title: '10 Challenges Completed',
        description: 'Successfully pass all test cases on 10 challenges across domains.',
        icon: 'shield',
        requirementType: 'solved_count',
        requirementValue: 10,
      },
      {
        title: '50 Challenges Completed',
        description: 'Master 50 challenges across Web, DSA, Data Science, and AI.',
        icon: 'trophy',
        requirementType: 'solved_count',
        requirementValue: 50,
      },
      {
        title: '100 Challenges Completed',
        description: 'Elite centurion milestone: 100 verified challenges solved.',
        icon: 'zap',
        requirementType: 'solved_count',
        requirementValue: 100,
      },
      {
        title: '7-Day Streak',
        description: 'Maintain a 7-day consecutive coding practice streak.',
        icon: 'flame',
        requirementType: 'streak_days',
        requirementValue: 7,
      },
      {
        title: '30-Day Streak',
        description: 'Maintain an unstoppable 30-day consecutive coding streak.',
        icon: 'flame',
        requirementType: 'streak_days',
        requirementValue: 30,
      },
      {
        title: 'Data Science Explorer',
        description: 'Solve your first SQL, Pandas, NumPy, or Statistics challenge.',
        icon: 'database',
        requirementType: 'domain_ds',
        requirementValue: 1,
      },
      {
        title: 'AI/ML Explorer',
        description: 'Solve your first Machine Learning, Neural Network, or GenAI challenge.',
        icon: 'sparkles',
        requirementType: 'domain_aiml',
        requirementValue: 1,
      },
    ];

    for (const ach of newAchievements) {
      await db.insert(achievements).values(ach).onConflictDoNothing();
    }

    // 4. Sync existing 15 Web Development problems' domain & topic
    const existingProbs = await db.select().from(problems);
    for (const p of existingProbs) {
      if (p.id <= 15 && (!p.topic || p.topic === 'HTML') && p.language !== 'HTML') {
        await db
          .update(problems)
          .set({
            domain: 'Web Development',
            topic: p.language,
          })
          .where(eq(problems.id, p.id));
      }
    }

    // Check if multi-domain problems already exist
    if (existingProbs.some((p) => p.slug === 'dsa-two-sum-bug')) {
      return;
    }

    console.log('Seeding Multi-Domain Challenges (Web, Languages, DSA, Data Science, AI/ML)...');

    const multiDomainChallenges = [
      // ==================== DOMAIN A: WEB DEVELOPMENT (React.js, Node.js, Express.js) ====================
      {
        title: 'React.js: Fix Stale State Counter Closure',
        slug: 'react-stale-state-counter',
        domain: 'Web Development',
        topic: 'React.js',
        difficulty: 'Medium',
        categoryId: webCatId,
        language: 'React.js',
        estimatedTime: '12 mins',
        inputFormat: 'incrementTriple(initialCount) state updater logic',
        outputFormat: 'Returns initialCount + 3 after three rapid updates',
        description:
          'A React component increments a counter 3 times inside a single click handler, but because it reads stale state directly instead of using an updater function, the count only increases by 1.',
        bugDescription:
          'incrementTriple(count) accumulates count + 1 from the same stale snapshot instead of chaining functional state updates.',
        starterHtml: `<div id="react-root" class="card">
  <h3>React Batch State Updater</h3>
  <p>Count after +3 click: <strong id="count-val">1</strong></p>
</div>`,
        starterCss: `body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; }
.card { background: #1e293b; padding: 18px; border-radius: 10px; border: 1px solid #334155; }`,
        starterJs: `// React State Updater Simulation
function incrementTriple(initialState) {
  let state = initialState;
  // BUG: Using stale initialState snapshot 3 times instead of functional prev => prev + 1
  const applyUpdate = (updater) => {
    state = typeof updater === 'function' ? updater(state) : updater;
  };
  applyUpdate(initialState + 1);
  applyUpdate(initialState + 1);
  applyUpdate(initialState + 1);
  return state;
}
window.incrementTriple = incrementTriple;`,
        expectedBehavior:
          'incrementTriple(0) must return 3 and incrementTriple(10) must return 13 by passing a functional updater (prev => prev + 1) to applyUpdate.',
        instructions:
          'Replace applyUpdate(initialState + 1) with functional updater calls applyUpdate(prev => prev + 1).',
        constraints: 'Do not rename incrementTriple(initialState).',
        visibleExamples: JSON.stringify([
          { input: 'incrementTriple(0)', output: '3' },
          { input: 'incrementTriple(10)', output: '13' },
        ]),
        hints: JSON.stringify([
          'In React, batching multiple state updates requires passing an updater callback: prev => prev + 1.',
          'Update all three applyUpdate calls to use prev => prev + 1.',
        ]),
        xpPoints: 25,
        popularity: 185,
        testCases: [
          {
            title: 'incrementTriple(0) returns 3',
            inputData: 'incrementTriple(0)',
            expectedOutput: '3',
            assertionScript:
              'return typeof window.incrementTriple === "function" && window.incrementTriple(0) === 3;',
            isHidden: false,
          },
          {
            title: 'incrementTriple(10) returns 13',
            inputData: 'incrementTriple(10)',
            expectedOutput: '13',
            assertionScript:
              'return typeof window.incrementTriple === "function" && window.incrementTriple(10) === 13;',
            isHidden: false,
          },
          {
            title: 'Uses functional state updater pattern',
            inputData: 'incrementTriple(25)',
            expectedOutput: '28',
            assertionScript:
              'return typeof window.incrementTriple === "function" && window.incrementTriple(25) === 28;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'Node.js: Fix Buffer Base64 Token Decoder',
        slug: 'nodejs-buffer-base64-decoder',
        domain: 'Web Development',
        topic: 'Node.js',
        difficulty: 'Easy',
        categoryId: webCatId,
        language: 'Node.js',
        estimatedTime: '10 mins',
        inputFormat: 'Base64 encoded payload string',
        outputFormat: 'Decoded UTF-8 string',
        description:
          'A Node.js authentication utility decodes Base64 payload strings into UTF-8 text, but it mistakenly passes "hex" instead of "base64" when reading the input.',
        bugDescription:
          'decodeBase64Token(encoded) decodes using hex mode instead of base64, corrupting the decoded UTF-8 JSON string.',
        starterHtml: `<div class="node-console">Node.js Buffer Utility</div>`,
        starterCss: `body { background: #0f172a; color: #38bdf8; font-family: monospace; padding: 20px; }`,
        starterJs: `function decodeBase64Token(base64Str) {
  // BUG: Wrong encoding mode used instead of atob / base64 decoding
  const mode = "hex";
  if (mode === "base64") {
    return atob(base64Str);
  }
  return "corrupted_hex_output";
}
window.decodeBase64Token = decodeBase64Token;`,
        expectedBehavior:
          'decodeBase64Token("eyJ1c2VyIjoiYWxleCJ9") must return \'{"user":"alex"}\' by setting mode = "base64" or returning atob(base64Str).',
        instructions:
          'Fix decodeBase64Token(base64Str) so it decodes the Base64 input using mode = "base64" (or atob(base64Str)).',
        constraints: 'Keep function name decodeBase64Token unchanged.',
        visibleExamples: JSON.stringify([
          {
            input: 'decodeBase64Token("eyJ1c2VyIjoiYWxleCJ9")',
            output: '{"user":"alex"}',
          },
        ]),
        hints: JSON.stringify([
          'Change const mode = "hex" to const mode = "base64".',
        ]),
        xpPoints: 20,
        popularity: 162,
        testCases: [
          {
            title: 'Decodes Base64 JSON payload accurately',
            inputData: 'decodeBase64Token("eyJ1c2VyIjoiYWxleCJ9")',
            expectedOutput: '{"user":"alex"}',
            assertionScript:
              'return typeof window.decodeBase64Token === "function" && window.decodeBase64Token("eyJ1c2VyIjoiYWxleCJ9") === \'{"user":"alex"}\';',
            isHidden: false,
          },
          {
            title: 'Decodes plain Base64 text string',
            inputData: 'decodeBase64Token("QXR0ZW5kIEFJ")',
            expectedOutput: 'Attend AI',
            assertionScript:
              'return typeof window.decodeBase64Token === "function" && window.decodeBase64Token("QXR0ZW5kIEFJ") === "Attend AI";',
            isHidden: true,
          },
        ],
      },
      {
        title: 'Express.js: Fix REST API Auth Middleware Next() Call',
        slug: 'expressjs-middleware-next-fix',
        domain: 'Web Development',
        topic: 'Express.js',
        difficulty: 'Medium',
        categoryId: webCatId,
        language: 'Express.js',
        estimatedTime: '12 mins',
        inputFormat: 'req object with headers.authorization',
        outputFormat: 'Status 200 and nextCalled = true for valid Bearer token',
        description:
          'An Express.js authentication middleware validates the Bearer header, attaches req.user, and is supposed to invoke next(), but it forgets to call next() and leaves requests hanging.',
        bugDescription:
          'authMiddleware(req, res, next) validates the token and sets req.user, but never invokes next(), causing the route handler to time out.',
        starterHtml: `<div class="express-box">Express.js Middleware Pipeline</div>`,
        starterCss: `body { background: #0f172a; color: #a5b4fc; font-family: monospace; padding: 20px; }`,
        starterJs: `function authMiddleware(req, res, next) {
  const authHeader = req.headers && req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.statusCode = 401;
    return { status: 401, error: "Unauthorized" };
  }
  req.user = { token: authHeader.slice(7) };
  // BUG: Middleware never calls next() to pass control to the route handler!
  return { status: 200, user: req.user };
}
window.authMiddleware = authMiddleware;`,
        expectedBehavior:
          'When a valid Bearer token is present, authMiddleware must call next() before returning.',
        instructions:
          'Add next(); after setting req.user inside authMiddleware(req, res, next).',
        constraints: 'Still return 401 without calling next() if authorization header is missing.',
        visibleExamples: JSON.stringify([
          {
            input: 'authMiddleware({ headers: { authorization: "Bearer secret" } }, res, next)',
            output: 'next() invoked & req.user.token === "secret"',
          },
        ]),
        hints: JSON.stringify([
          'In Express.js middleware, you must invoke next() once authentication succeeds.',
        ]),
        xpPoints: 25,
        popularity: 174,
        testCases: [
          {
            title: 'Calls next() when valid Bearer token is provided',
            inputData: 'Bearer secret123',
            expectedOutput: 'nextCalled === true',
            assertionScript:
              'let called = false; const req = { headers: { authorization: "Bearer secret123" } }; window.authMiddleware(req, {}, () => { called = true; }); return called === true && req.user && req.user.token === "secret123";',
            isHidden: false,
          },
          {
            title: 'Blocks missing authorization header with 401 and does not call next()',
            inputData: 'No Authorization Header',
            expectedOutput: 'status 401 & nextCalled === false',
            assertionScript:
              'let called = false; const res = {}; const out = window.authMiddleware({ headers: {} }, res, () => { called = true; }); return called === false && res.statusCode === 401;',
            isHidden: true,
          },
        ],
      },

      // ==================== DOMAIN B: PROGRAMMING LANGUAGES (Python, C, C++, Java) ====================
      {
        title: 'Python: Fix Mutable Default Argument Bug',
        slug: 'python-mutable-default-arg',
        domain: 'Programming Languages',
        topic: 'Python',
        difficulty: 'Easy',
        categoryId: progCatId,
        language: 'Python',
        estimatedTime: '10 mins',
        inputFormat: 'append_tag(tag, tags=None)',
        outputFormat: 'Isolated list containing only the newly added tag when tags is omitted',
        description:
          'In Python, using a mutable default argument like `def append_tag(tag, tags=[]):` causes the same list to be shared across multiple function calls.',
        bugDescription:
          'The function signature uses `tags=[]` instead of `tags=None`, causing tags from previous invocations to leak into subsequent calls.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `def append_tag(tag, tags=[]):
    # BUG: Mutable default list 'tags=[]' persists across calls!
    # Fix by setting default tags=None and initializing tags = [] if tags is None
    tags.append(tag)
    return tags`,
        expectedBehavior:
          'Calling append_tag("python") twice without a second argument must return ["python"] each time, not ["python", "python"].',
        instructions:
          'Change the default parameter to `tags=None`, and inside the function add `if tags is None: tags = []` before appending.',
        constraints: 'Function name must remain `append_tag`.',
        visibleExamples: JSON.stringify([
          {
            input: 'append_tag("alpha"); append_tag("beta")',
            output: '["beta"] (isolated list per call)',
          },
        ]),
        hints: JSON.stringify([
          'Replace `def append_tag(tag, tags=[]):` with `def append_tag(tag, tags=None):`.',
          'Inside the function body, check `if tags is None:\n        tags = []`.',
        ]),
        xpPoints: 20,
        popularity: 245,
        testCases: [
          {
            title: 'Uses tags=None default parameter in signature',
            inputData: 'append_tag("python")',
            expectedOutput: '["python"]',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Initializes a fresh list when tags is None',
            inputData: 'append_tag("first") then append_tag("second")',
            expectedOutput: '["second"] without state leakage',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Preserves caller list when explicitly passed',
            inputData: 'append_tag("new", ["existing"])',
            expectedOutput: '["existing", "new"]',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'Python: Fix Word Frequency Dictionary KeyError',
        slug: 'python-word-frequency-keyerror',
        domain: 'Programming Languages',
        topic: 'Python',
        difficulty: 'Medium',
        categoryId: progCatId,
        language: 'Python',
        estimatedTime: '12 mins',
        inputFormat: 'List of words: ["ai", "code", "ai"]',
        outputFormat: 'Dictionary of counts: {"ai": 2, "code": 1}',
        description:
          'A Python function counts word frequencies in a list, but directly incrementing `counts[word] += 1` raises a `KeyError` the first time a word is encountered.',
        bugDescription:
          '`counts[word] += 1` fails when `word` is not yet a key in `counts`. Use `counts.get(word, 0) + 1`.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `def count_words(words):
    counts = {}
    for word in words:
        # BUG: Raises KeyError on unseen words
        counts[word] = counts[word] + 1
    return counts`,
        expectedBehavior:
          'count_words(["ai", "code", "ai"]) should return {"ai": 2, "code": 1} without raising a KeyError.',
        instructions:
          'Update the dictionary assignment to use `counts.get(word, 0) + 1` (or check `if word in counts`).',
        constraints: 'Return the `counts` dictionary.',
        visibleExamples: JSON.stringify([
          {
            input: 'count_words(["ai", "code", "ai"])',
            output: '{"ai": 2, "code": 1}',
          },
        ]),
        hints: JSON.stringify([
          'Use `counts[word] = counts.get(word, 0) + 1` to safely default missing keys to 0.',
        ]),
        xpPoints: 25,
        popularity: 210,
        testCases: [
          {
            title: 'Counts repeated words without raising KeyError',
            inputData: '["ai", "code", "ai"]',
            expectedOutput: '{"ai": 2, "code": 1}',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Handles empty word list cleanly',
            inputData: '[]',
            expectedOutput: '{}',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'C++: Fix Vector Out-of-Bounds Loop Condition',
        slug: 'cpp-vector-bounds-fix',
        domain: 'Programming Languages',
        topic: 'C++',
        difficulty: 'Easy',
        categoryId: progCatId,
        language: 'C++',
        estimatedTime: '10 mins',
        inputFormat: 'std::vector<int> nums = {10, 20, 30}',
        outputFormat: 'Sum = 60 without out-of-bounds memory access',
        description:
          'A C++ function sums all integers in a `std::vector<int>`, but the `for` loop uses `i <= nums.size()` instead of `i < nums.size()`, reading past the end of the vector.',
        bugDescription:
          'Loop boundary `i <= nums.size()` accesses index `nums.size()`, causing undefined behavior / out-of-bounds access.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `#include <vector>

int sumVector(const std::vector<int>& nums) {
    int total = 0;
    // BUG: i <= nums.size() causes out-of-bounds access at index nums.size()
    for (size_t i = 0; i <= nums.size(); i++) {
        total += nums[i];
    }
    return total;
}`,
        expectedBehavior:
          'The loop must iterate while `i < nums.size()` (or use a range-based for loop `for (int x : nums)`) and return the exact sum.',
        instructions:
          'Change the loop condition from `i <= nums.size()` to `i < nums.size()`.',
        constraints: 'Function signature `int sumVector(const std::vector<int>& nums)` must remain unchanged.',
        visibleExamples: JSON.stringify([
          { input: 'sumVector({10, 20, 30})', output: '60' },
        ]),
        hints: JSON.stringify([
          'Valid 0-based indices for a vector of size N are 0 through N - 1 (`i < nums.size()`).',
        ]),
        xpPoints: 20,
        popularity: 180,
        testCases: [
          {
            title: 'Uses strict < nums.size() boundary check',
            inputData: 'nums = {10, 20, 30}',
            expectedOutput: '60',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Returns 0 for empty vector without memory violation',
            inputData: 'nums = {}',
            expectedOutput: '0',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'Java: Fix String Reference Equality Comparison',
        slug: 'java-string-equals-bug',
        domain: 'Programming Languages',
        topic: 'Java',
        difficulty: 'Easy',
        categoryId: progCatId,
        language: 'Java',
        estimatedTime: '10 mins',
        inputFormat: 'String role = new String("ADMIN")',
        outputFormat: 'true when role content matches "ADMIN"',
        description:
          'A Java access-control helper checks whether a user role string equals `"ADMIN"`, but it uses the `==` reference operator instead of `.equals()`, returning `false` for dynamically allocated strings.',
        bugDescription:
          'Using `role == "ADMIN"` compares object memory references instead of character sequence equality.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `public class AccessControl {
    public static boolean isAdminRole(String role) {
        if (role == null) return false;
        // BUG: == compares object references instead of String contents
        return role == "ADMIN";
    }
}`,
        expectedBehavior:
          'isAdminRole(new String("ADMIN")) must return true by using "ADMIN".equals(role) or role.equals("ADMIN").',
        instructions:
          'Replace `role == "ADMIN"` with `"ADMIN".equals(role)` or `role.equals("ADMIN")`.',
        constraints: 'Handle null safely (return false when role is null).',
        visibleExamples: JSON.stringify([
          { input: 'isAdminRole(new String("ADMIN"))', output: 'true' },
        ]),
        hints: JSON.stringify([
          'In Java, always compare String values with `.equals("ADMIN")`, not `==`.',
        ]),
        xpPoints: 20,
        popularity: 195,
        testCases: [
          {
            title: 'Compares string value using .equals()',
            inputData: 'new String("ADMIN")',
            expectedOutput: 'true',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Safely returns false on null or non-admin string',
            inputData: '"USER"',
            expectedOutput: 'false',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'C: Fix Integer Division Truncation in Average Calculation',
        slug: 'c-float-division-average',
        domain: 'Programming Languages',
        topic: 'C',
        difficulty: 'Beginner',
        categoryId: progCatId,
        language: 'C',
        estimatedTime: '8 mins',
        inputFormat: 'int sum = 9, int count = 2',
        outputFormat: 'double 4.500000',
        description:
          'A C function computes the floating-point average of `sum` and `count`, but dividing two `int` variables performs integer division before assigning to `double`, truncating `4.5` to `4.0`.',
        bugDescription:
          '`sum / count` performs integer division when both operands are `int`. Cast `sum` to `(double)` before dividing.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `double computeAverage(int sum, int count) {
    if (count == 0) return 0.0;
    // BUG: Integer division truncates fractional part before returning double
    return sum / count;
}`,
        expectedBehavior:
          'computeAverage(9, 2) must return 4.5 by casting `(double)sum / count`.',
        instructions:
          'Cast `sum` or `count` to `double` (e.g., `return (double)sum / count;`).',
        constraints: 'Keep zero-division guard `if (count == 0) return 0.0;`.',
        visibleExamples: JSON.stringify([
          { input: 'computeAverage(9, 2)', output: '4.5' },
        ]),
        hints: JSON.stringify([
          'Cast at least one operand to `double`: `return (double)sum / count;`.',
        ]),
        xpPoints: 15,
        popularity: 165,
        testCases: [
          {
            title: 'Preserves decimal precision for 9 / 2 = 4.5',
            inputData: 'sum = 9, count = 2',
            expectedOutput: '4.5',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Handles count == 0 safely',
            inputData: 'sum = 10, count = 0',
            expectedOutput: '0.0',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },

      // ==================== DOMAIN C: DATA STRUCTURES & ALGORITHMS (DSA) ====================
      {
        title: 'DSA Arrays & Hashing: Fix Two Sum Complement Lookup',
        slug: 'dsa-two-sum-bug',
        domain: 'Data Structures & Algorithms',
        topic: 'Arrays',
        difficulty: 'Easy',
        categoryId: dsaCatId,
        language: 'Python',
        estimatedTime: '15 mins',
        inputFormat: 'nums = [2, 7, 11, 15], target = 9',
        outputFormat: '[0, 1]',
        description:
          'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. The current O(n) hash map solution computes the wrong complement (`target + num` instead of `target - num`).',
        bugDescription:
          '`complement = target + num` adds instead of subtracting `target - num`, so matching pairs are never found.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        # BUG: Complement calculation uses addition instead of subtraction
        complement = target + num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
        expectedBehavior:
          'two_sum([2, 7, 11, 15], 9) must return [0, 1] in O(n) time complexity.',
        instructions:
          'Fix the complement formula to `complement = target - num`.',
        constraints: 'Time Complexity: O(n) · Space Complexity: O(n).',
        visibleExamples: JSON.stringify([
          { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]' },
          { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]' },
        ]),
        hints: JSON.stringify([
          'If `num + complement == target`, then `complement = target - num`.',
        ]),
        xpPoints: 25,
        popularity: 320,
        testCases: [
          {
            title: 'Finds indices [0, 1] for nums=[2,7,11,15], target=9',
            inputData: 'nums=[2,7,11,15], target=9',
            expectedOutput: '[0, 1]',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Finds indices [1, 2] for nums=[3,2,4], target=6',
            inputData: 'nums=[3,2,4], target=6',
            expectedOutput: '[1, 2]',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Handles duplicate elements nums=[3,3], target=6',
            inputData: 'nums=[3,3], target=6',
            expectedOutput: '[0, 1]',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'DSA Two Pointers: Fix Valid Palindrome Pointer Direction',
        slug: 'dsa-valid-palindrome-pointers',
        domain: 'Data Structures & Algorithms',
        topic: 'Two Pointers',
        difficulty: 'Beginner',
        categoryId: dsaCatId,
        language: 'JavaScript',
        estimatedTime: '10 mins',
        inputFormat: 's = "racecar"',
        outputFormat: 'true',
        description:
          'A two-pointer function checks whether a string is a palindrome, but inside the `while (left < right)` loop it increments `right++` instead of decrementing `right--`, causing an infinite/out-of-bounds loop.',
        bugDescription:
          'The right pointer moves outward (`right++`) instead of inward (`right--`).',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `function isPalindrome(s) {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0;
  let right = clean.length - 1;
  while (left < right) {
    if (clean[left] !== clean[right]) {
      return false;
    }
    left++;
    // BUG: Right pointer increments instead of decrementing!
    right++;
  }
  return true;
}
window.isPalindrome = isPalindrome;`,
        expectedBehavior:
          'isPalindrome("racecar") must return true and isPalindrome("hello") must return false.',
        instructions:
          'Change `right++` to `right--` inside the `while` loop.',
        constraints: 'O(n) time complexity, O(1) extra pointer space.',
        visibleExamples: JSON.stringify([
          { input: 'isPalindrome("racecar")', output: 'true' },
          { input: 'isPalindrome("hello")', output: 'false' },
        ]),
        hints: JSON.stringify([
          'In the two-pointer technique, `left` increments (`left++`) and `right` decrements (`right--`).',
        ]),
        xpPoints: 20,
        popularity: 275,
        testCases: [
          {
            title: 'Returns true for "racecar"',
            inputData: '"racecar"',
            expectedOutput: 'true',
            assertionScript:
              'return typeof window.isPalindrome === "function" && window.isPalindrome("racecar") === true;',
            isHidden: false,
          },
          {
            title: 'Returns false for "attend"',
            inputData: '"attend"',
            expectedOutput: 'false',
            assertionScript:
              'return typeof window.isPalindrome === "function" && window.isPalindrome("attend") === false;',
            isHidden: false,
          },
          {
            title: 'Handles mixed-case phrases "A man, a plan, a canal: Panama"',
            inputData: '"A man, a plan, a canal: Panama"',
            expectedOutput: 'true',
            assertionScript:
              'return typeof window.isPalindrome === "function" && window.isPalindrome("A man, a plan, a canal: Panama") === true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'DSA Searching: Fix Binary Search Pointer Update Infinite Loop',
        slug: 'dsa-binary-search-midpoint',
        domain: 'Data Structures & Algorithms',
        topic: 'Searching',
        difficulty: 'Medium',
        categoryId: dsaCatId,
        language: 'Python',
        estimatedTime: '15 mins',
        inputFormat: 'nums = [-1, 0, 3, 5, 9, 12], target = 9',
        outputFormat: '4',
        description:
          'A standard Binary Search implementation searches a sorted array in O(log n) time, but when `nums[mid] < target` it sets `low = mid` instead of `low = mid + 1`, getting stuck in an infinite loop.',
        bugDescription:
          'Setting `low = mid` and `high = mid` fails to exclude `mid` after checking it, causing non-termination when `low` and `high` are adjacent.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `def binary_search(nums, target):
    low = 0
    high = len(nums) - 1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            # BUG: Must advance past mid (mid + 1) and (mid - 1)
            low = mid
        else:
            high = mid
    return -1`,
        expectedBehavior:
          'binary_search([-1, 0, 3, 5, 9, 12], 9) returns 4, and returns -1 when target is not present.',
        instructions:
          'Update the branch assignments to `low = mid + 1` and `high = mid - 1`.',
        constraints: 'Time Complexity must remain O(log n).',
        visibleExamples: JSON.stringify([
          { input: 'nums = [-1, 0, 3, 5, 9, 12], target = 9', output: '4' },
          { input: 'nums = [-1, 0, 3, 5, 9, 12], target = 2', output: '-1' },
        ]),
        hints: JSON.stringify([
          'Since `nums[mid] != target`, `mid` cannot be the answer. Set `low = mid + 1` when `nums[mid] < target` and `high = mid - 1` otherwise.',
        ]),
        xpPoints: 30,
        popularity: 290,
        testCases: [
          {
            title: 'Finds target=9 at index 4',
            inputData: 'nums=[-1,0,3,5,9,12], target=9',
            expectedOutput: '4',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Returns -1 without hanging when target=2 is absent',
            inputData: 'nums=[-1,0,3,5,9,12], target=2',
            expectedOutput: '-1',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Handles single-element array accurately',
            inputData: 'nums=[5], target=5',
            expectedOutput: '0',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'DSA Stack: Fix Valid Parentheses Unmatched Closing Bracket Bug',
        slug: 'dsa-valid-parentheses-stack',
        domain: 'Data Structures & Algorithms',
        topic: 'Stack',
        difficulty: 'Medium',
        categoryId: dsaCatId,
        language: 'Python',
        estimatedTime: '15 mins',
        inputFormat: 's = "()[]{}"',
        outputFormat: 'True',
        description:
          'A stack-based validator checks if brackets `()`, `{}`, and `[]` are balanced. However, it returns `True` unconditionally at the end instead of checking `return len(stack) == 0`.',
        bugDescription:
          'Returning `True` instead of `len(stack) == 0` (or `not stack`) falsely accepts unclosed opening brackets like `"((("`.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `def is_valid_parentheses(s):
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else "#"
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    # BUG: Returns True even when unclosed opening brackets remain on stack!
    return True`,
        expectedBehavior:
          'is_valid_parentheses("()[]{}") returns True, while is_valid_parentheses("(((") returns False.',
        instructions:
          'Change the final `return True` statement to `return len(stack) == 0` or `return not stack`.',
        constraints: '1 <= s.length <= 10^4.',
        visibleExamples: JSON.stringify([
          { input: 's = "()[]{}"', output: 'True' },
          { input: 's = "(("', output: 'False' },
        ]),
        hints: JSON.stringify([
          'After processing all characters, the string is valid only if the stack is completely empty (`len(stack) == 0` or `not stack`).',
        ]),
        xpPoints: 30,
        popularity: 260,
        testCases: [
          {
            title: 'Accepts balanced brackets "()[]{}"',
            inputData: '"()[]{}"',
            expectedOutput: 'True',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Rejects unclosed opening brackets "(("',
            inputData: '"(("',
            expectedOutput: 'False',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Rejects mismatched nested brackets "([)]"',
            inputData: '"([)]"',
            expectedOutput: 'False',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'DSA Dynamic Programming: Fix Climbing Stairs DP Transition',
        slug: 'dsa-climbing-stairs-dp',
        domain: 'Data Structures & Algorithms',
        topic: 'Dynamic Programming',
        difficulty: 'Hard',
        categoryId: dsaCatId,
        language: 'Python',
        estimatedTime: '20 mins',
        inputFormat: 'n = 5',
        outputFormat: '8 distinct ways',
        description:
          'You are climbing a staircase with `n` steps, taking 1 or 2 steps at a time. The DP recurrence should be `dp[i] = dp[i-1] + dp[i-2]`, but the buggy code multiplies `dp[i-1] * dp[i-2]`.',
        bugDescription:
          'The DP transition multiplies `prev1 * prev2` instead of summing `prev1 + prev2`.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `def climb_stairs(n):
    if n <= 2:
        return n
    prev2, prev1 = 1, 2
    for _ in range(3, n + 1):
        # BUG: Recurrence relation multiplies instead of adding previous two states
        curr = prev1 * prev2
        prev2 = prev1
        prev1 = curr
    return prev1`,
        expectedBehavior:
          'climb_stairs(5) must return 8 (1, 2, 3, 5, 8 Fibonacci transition).',
        instructions:
          'Fix the state transition inside the loop to `curr = prev1 + prev2`.',
        constraints: '1 <= n <= 45 · O(n) time, O(1) space.',
        visibleExamples: JSON.stringify([
          { input: 'n = 3', output: '3' },
          { input: 'n = 5', output: '8' },
        ]),
        hints: JSON.stringify([
          'To reach step i, you can arrive from step i-1 (1 step) or step i-2 (2 steps), so total ways is `prev1 + prev2`.',
        ]),
        xpPoints: 40,
        popularity: 230,
        testCases: [
          {
            title: 'climb_stairs(5) returns 8',
            inputData: 'n = 5',
            expectedOutput: '8',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'climb_stairs(10) returns 89',
            inputData: 'n = 10',
            expectedOutput: '89',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'DSA Graphs: Fix BFS Shortest Path Visited Tracking',
        slug: 'dsa-bfs-shortest-path',
        domain: 'Data Structures & Algorithms',
        topic: 'Graphs',
        difficulty: 'Expert',
        categoryId: dsaCatId,
        language: 'Python',
        estimatedTime: '25 mins',
        inputFormat: 'graph = {0: [1,2], 1: [0,3], 2: [0,3], 3: []}, start = 0, target = 3',
        outputFormat: '2 (shortest hop count)',
        description:
          'A Breadth-First Search (BFS) function finds the shortest path in an unweighted cyclic graph, but it forgets to add neighbor nodes to the `visited` set, causing infinite loops on cyclic graphs.',
        bugDescription:
          'When enqueueing `neighbor`, the code does not mark `visited.add(neighbor)`, revisiting cycles infinitely.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `from collections import deque

def bfs_shortest_path(graph, start, target):
    queue = deque([(start, 0)])
    visited = {start}
    while queue:
        node, dist = queue.popleft()
        if node == target:
            return dist
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                # BUG: Neighbor is never added to visited set!
                queue.append((neighbor, dist + 1))
    return -1`,
        expectedBehavior:
          'bfs_shortest_path marks `visited.add(neighbor)` when enqueueing each unvisited neighbor and returns 2.',
        instructions:
          'Add `visited.add(neighbor)` inside the `if neighbor not in visited:` block.',
        constraints: 'O(V + E) time complexity.',
        visibleExamples: JSON.stringify([
          {
            input: 'graph = {0:[1,2], 1:[0,3], 2:[0,3], 3:[]}, start=0, target=3',
            output: '2',
          },
        ]),
        hints: JSON.stringify([
          'Always call `visited.add(neighbor)` immediately when appending `(neighbor, dist + 1)` to `queue`.',
        ]),
        xpPoints: 50,
        popularity: 190,
        testCases: [
          {
            title: 'Marks visited.add(neighbor) to prevent cyclic infinite loops',
            inputData: 'Cyclic 4-node graph (0 -> 3)',
            expectedOutput: '2',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Returns -1 when target node is disconnected',
            inputData: 'Disconnected component target = 99',
            expectedOutput: '-1',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },

      // ==================== DOMAIN D: DATA SCIENCE & ANALYTICS (SQL, Pandas, NumPy, Statistics) ====================
      {
        title: 'SQL Analytics: Fix Department Average Salary HAVING Clause',
        slug: 'sql-department-salary-having',
        domain: 'Data Science & Analytics',
        topic: 'SQL',
        difficulty: 'Medium',
        categoryId: dsCatId,
        language: 'SQL',
        estimatedTime: '12 mins',
        inputFormat: 'Table: employees (id, name, department, salary)',
        outputFormat: 'department, avg_salary for departments with AVG(salary) > 80000',
        description:
          'An analytics SQL query groups employees by `department` and filters for departments with an average salary above 80,000. However, it uses `WHERE AVG(salary) > 80000` before `GROUP BY`, which is invalid SQL syntax.',
        bugDescription:
          'Aggregate functions like `AVG(salary)` cannot be filtered in a `WHERE` clause; they must be filtered using `HAVING AVG(salary) > 80000` after `GROUP BY department`.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `-- Schema: employees(id INT, name TEXT, department TEXT, salary INT)
-- Sample rows:
-- (1, 'Alice', 'Engineering', 95000), (2, 'Bob', 'Engineering', 85000),
-- (3, 'Charlie', 'Marketing', 68000), (4, 'Diana', 'AI Research', 110000)

SELECT department, AVG(salary) AS avg_salary
FROM employees
-- BUG: Aggregate filter placed in WHERE instead of HAVING after GROUP BY
WHERE AVG(salary) > 80000
GROUP BY department
ORDER BY avg_salary DESC;`,
        expectedBehavior:
          'Returns Engineering (90000) and AI Research (110000) using `GROUP BY department HAVING AVG(salary) > 80000`.',
        instructions:
          'Remove `WHERE AVG(salary) > 80000` and place `HAVING AVG(salary) > 80000` after `GROUP BY department`.',
        constraints: 'Keep columns `department, AVG(salary) AS avg_salary` and `ORDER BY avg_salary DESC`.',
        visibleExamples: JSON.stringify([
          {
            input: 'employees table with Engineering (90k), AI Research (110k), Marketing (68k)',
            output: 'AI Research (110000) | Engineering (90000)',
          },
        ]),
        hints: JSON.stringify([
          'In SQL, `WHERE` filters rows before grouping, whereas `HAVING` filters groups after `GROUP BY`.',
          'Move the condition to `HAVING AVG(salary) > 80000` right after `GROUP BY department`.',
        ]),
        xpPoints: 30,
        popularity: 255,
        testCases: [
          {
            title: 'Uses HAVING AVG(salary) > 80000 after GROUP BY department',
            inputData: 'employees table aggregation',
            expectedOutput: '2 rows: AI Research (110000), Engineering (90000)',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Does not contain aggregate AVG() inside WHERE clause',
            inputData: 'SQL AST validation',
            expectedOutput: 'Valid GROUP BY ... HAVING syntax',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'SQL Analytics: Fix Customer Revenue LEFT JOIN & COALESCE',
        slug: 'sql-customer-revenue-join',
        domain: 'Data Science & Analytics',
        topic: 'SQL',
        difficulty: 'Easy',
        categoryId: dsCatId,
        language: 'SQL',
        estimatedTime: '10 mins',
        inputFormat: 'Tables: customers(id, name), orders(id, customer_id, amount)',
        outputFormat: 'customer_name, total_spent (including 0 for customers with no orders)',
        description:
          'A report needs to list ALL customers and their total order spend (showing 0 if they have placed no orders). The current query uses `INNER JOIN`, which drops customers who have zero orders.',
        bugDescription:
          '`INNER JOIN` excludes customers without matching rows in `orders`. Use `LEFT JOIN` with `COALESCE(SUM(o.amount), 0)`.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `-- Schema: customers(id INT, name TEXT), orders(id INT, customer_id INT, amount INT)
SELECT c.name AS customer_name, COALESCE(SUM(o.amount), 0) AS total_spent
FROM customers c
-- BUG: INNER JOIN drops customers with 0 orders!
INNER JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name
ORDER BY total_spent DESC;`,
        expectedBehavior:
          'Uses `LEFT JOIN orders o ON c.id = o.customer_id` so all customers appear in the result set.',
        instructions:
          'Replace `INNER JOIN` with `LEFT JOIN`.',
        constraints: 'Preserve `COALESCE(SUM(o.amount), 0) AS total_spent`.',
        visibleExamples: JSON.stringify([
          {
            input: '3 customers (1 with no orders)',
            output: 'All 3 customers returned; customer with no orders shows total_spent = 0',
          },
        ]),
        hints: JSON.stringify([
          'Change `INNER JOIN orders o` to `LEFT JOIN orders o`.',
        ]),
        xpPoints: 20,
        popularity: 215,
        testCases: [
          {
            title: 'Uses LEFT JOIN to preserve zero-order customers',
            inputData: 'customers + orders tables',
            expectedOutput: 'Includes all customers with 0 fallback',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Groups by customer and orders by total_spent DESC',
            inputData: 'Aggregation check',
            expectedOutput: 'Pass',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'Pandas: Fix DataFrame Missing Value (NaN) Imputation',
        slug: 'pandas-nan-imputation-fix',
        domain: 'Data Science & Analytics',
        topic: 'Pandas',
        difficulty: 'Easy',
        categoryId: dsCatId,
        language: 'Python',
        estimatedTime: '12 mins',
        inputFormat: 'df["score"] = [80.0, None, 90.0, 100.0]',
        outputFormat: '[80.0, 90.0, 90.0, 100.0]',
        description:
          'A Pandas data-cleaning pipeline attempts to replace missing `NaN` values in `df["score"]` with the column mean, but calls `df["score"].fillna(0)` instead of `df["score"].fillna(df["score"].mean())`.',
        bugDescription:
          'Filling missing values with `0` skews downstream analytics downward instead of imputing with `df["score"].mean()`.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `import pandas as pd

def clean_scores(df):
    # BUG: Replaces missing NaN scores with 0 instead of the column mean!
    df["score"] = df["score"].fillna(0)
    return df`,
        expectedBehavior:
          'clean_scores(df) must fill missing values using `df["score"].fillna(df["score"].mean())`.',
        instructions:
          'Replace `.fillna(0)` with `.fillna(df["score"].mean())`.',
        constraints: 'Return the updated DataFrame `df`.',
        visibleExamples: JSON.stringify([
          {
            input: 'scores = [80.0, NaN, 90.0, 100.0]',
            output: '[80.0, 90.0, 90.0, 100.0] (mean = 90.0)',
          },
        ]),
        hints: JSON.stringify([
          'Compute the column mean with `df["score"].mean()` and pass it into `.fillna(...)`.',
        ]),
        xpPoints: 25,
        popularity: 205,
        testCases: [
          {
            title: 'Imputes NaN values using df["score"].mean()',
            inputData: '[80.0, NaN, 90.0, 100.0]',
            expectedOutput: '[80.0, 90.0, 90.0, 100.0]',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Returns cleaned DataFrame with zero NaNs remaining',
            inputData: 'df["score"].isna().sum()',
            expectedOutput: '0',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'NumPy: Fix Min-Max Feature Scaling Formula',
        slug: 'numpy-minmax-scaling-fix',
        domain: 'Data Science & Analytics',
        topic: 'NumPy',
        difficulty: 'Medium',
        categoryId: dsCatId,
        language: 'Python',
        estimatedTime: '15 mins',
        inputFormat: 'arr = np.array([10.0, 20.0, 30.0])',
        outputFormat: 'np.array([0.0, 0.5, 1.0])',
        description:
          'Min-Max normalization scales a NumPy array to `[0, 1]` using `(x - x_min) / (x_max - x_min)`. The current code divides by `(x_max + x_min)`, producing incorrect normalized features.',
        bugDescription:
          'Denominator uses `(arr.max() + arr.min())` instead of the range `(arr.max() - arr.min())`.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `import numpy as np

def min_max_scale(arr):
    x_min = np.min(arr)
    x_max = np.max(arr)
    if x_max == x_min:
        return np.zeros_like(arr, dtype=float)
    # BUG: Denominator adds x_max + x_min instead of subtracting x_max - x_min
    return (arr - x_min) / (x_max + x_min)`,
        expectedBehavior:
          'min_max_scale(np.array([10.0, 20.0, 30.0])) returns [0.0, 0.5, 1.0].',
        instructions:
          'Fix the denominator to `(x_max - x_min)`.',
        constraints: 'Keep the zero-range guard `if x_max == x_min`.',
        visibleExamples: JSON.stringify([
          { input: 'np.array([10.0, 20.0, 30.0])', output: '[0.0, 0.5, 1.0]' },
        ]),
        hints: JSON.stringify([
          'The range of a feature vector is `x_max - x_min`.',
        ]),
        xpPoints: 30,
        popularity: 188,
        testCases: [
          {
            title: 'Scales [10, 20, 30] accurately to [0.0, 0.5, 1.0]',
            inputData: 'np.array([10.0, 20.0, 30.0])',
            expectedOutput: '[0.0, 0.5, 1.0]',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Handles constant arrays safely without NaN',
            inputData: 'np.array([5.0, 5.0, 5.0])',
            expectedOutput: '[0.0, 0.0, 0.0]',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'Statistics & EDA: Fix Z-Score Outlier Filter Condition',
        slug: 'statistics-zscore-outlier-fix',
        domain: 'Data Science & Analytics',
        topic: 'Statistics',
        difficulty: 'Hard',
        categoryId: dsCatId,
        language: 'Python',
        estimatedTime: '15 mins',
        inputFormat: 'data = [10, 12, 11, 13, 12, 100], threshold = 2.0',
        outputFormat: '[10, 12, 11, 13, 12] (outlier 100 removed)',
        description:
          'An Exploratory Data Analysis (EDA) function removes outliers whose absolute Z-score exceeds `threshold`. However, it forgets `abs()` when checking `(x - mean) / std < threshold`, failing to filter extreme negative outliers.',
        bugDescription:
          'Z-score magnitude check must use `abs((x - mean) / std) <= threshold` (or `< threshold`) so both positive and negative outliers are removed.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `def remove_outliers_zscore(data, mean, std, threshold=2.0):
    if std == 0:
        return data
    # BUG: Missing abs() around z-score calculation and inverted comparison!
    return [x for x in data if (x - mean) / std > threshold]`,
        expectedBehavior:
          'Keeps only inliers where `abs((x - mean) / std) <= threshold`.',
        instructions:
          'Wrap the Z-score in `abs((x - mean) / std)` and keep elements where `abs((x - mean) / std) <= threshold`.',
        constraints: 'Return a filtered list of inliers.',
        visibleExamples: JSON.stringify([
          {
            input: 'data = [-100, 10, 12, 11, 100], mean = 11, std = 15, threshold = 2.0',
            output: '[10, 12, 11]',
          },
        ]),
        hints: JSON.stringify([
          'Use `abs((x - mean) / std) <= threshold` inside the list comprehension.',
        ]),
        xpPoints: 35,
        popularity: 170,
        testCases: [
          {
            title: 'Filters both high and low outliers using abs() <= threshold',
            inputData: 'data = [-100, 10, 12, 11, 100]',
            expectedOutput: '[10, 12, 11]',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Preserves all data when std == 0',
            inputData: 'std = 0',
            expectedOutput: 'Unchanged list',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },

      // ==================== DOMAIN E: AI & MACHINE LEARNING ====================
      {
        title: 'Scikit-learn: Fix Train-Test Data Leakage in StandardScaler',
        slug: 'sklearn-data-leakage-fix',
        domain: 'AI & Machine Learning',
        topic: 'Scikit-learn',
        difficulty: 'Medium',
        categoryId: aiCatId,
        language: 'Python',
        estimatedTime: '15 mins',
        inputFormat: 'X_train, X_test feature matrices',
        outputFormat: 'X_train_scaled (fit_transform), X_test_scaled (transform only)',
        description:
          'A Machine Learning preprocessing pipeline scales `X_train` and `X_test` using `StandardScaler`. However, it calls `scaler.fit_transform(X_test)` on the test set instead of `scaler.transform(X_test)`, causing test-set data leakage!',
        bugDescription:
          'Calling `fit_transform(X_test)` recomputes mean and variance on the test set instead of applying the training set parameters via `scaler.transform(X_test)`.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `from sklearn.preprocessing import StandardScaler

def scale_train_test(X_train, X_test):
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    # BUG: Calling fit_transform on X_test leaks test distribution statistics!
    X_test_scaled = scaler.fit_transform(X_test)
    return X_train_scaled, X_test_scaled`,
        expectedBehavior:
          'Fit the scaler ONLY on X_train (`scaler.fit_transform(X_train)`) and transform X_test using `scaler.transform(X_test)`.',
        instructions:
          'Replace `scaler.fit_transform(X_test)` with `scaler.transform(X_test)`.',
        constraints: 'Return `(X_train_scaled, X_test_scaled)`.',
        visibleExamples: JSON.stringify([
          {
            input: 'X_train = [[0], [10]], X_test = [[5]]',
            output: 'X_test_scaled = [[0.0]] using training mean=5, std=5',
          },
        ]),
        hints: JSON.stringify([
          'Never call `fit` or `fit_transform` on `X_test`. Always use `scaler.transform(X_test)`.',
        ]),
        xpPoints: 35,
        popularity: 280,
        testCases: [
          {
            title: 'Uses scaler.transform(X_test) without re-fitting on test data',
            inputData: 'X_train, X_test pipeline check',
            expectedOutput: 'No test data leakage',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Fits scaler on X_train via scaler.fit_transform(X_train)',
            inputData: 'Training set scaling check',
            expectedOutput: 'Pass',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'Supervised Learning: Fix Mean Squared Error (MSE) Loss Formula',
        slug: 'ml-mse-loss-fix',
        domain: 'AI & Machine Learning',
        topic: 'Regression',
        difficulty: 'Easy',
        categoryId: aiCatId,
        language: 'Python',
        estimatedTime: '12 mins',
        inputFormat: 'y_true = [3.0, -0.5, 2.0, 7.0], y_pred = [2.5, 0.0, 2.0, 8.0]',
        outputFormat: '0.375',
        description:
          'A regression evaluation metric computes Mean Squared Error (MSE) between `y_true` and `y_pred`, but forgets to square the residuals `(yt - yp) ** 2`, causing positive and negative errors to cancel out.',
        bugDescription:
          'Residuals `(yt - yp)` are not squared (`** 2`), computing signed mean error instead of Mean Squared Error.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `def mean_squared_error(y_true, y_pred):
    n = len(y_true)
    # BUG: Residuals are not squared (** 2)
    total_error = sum((yt - yp) for yt, yp in zip(y_true, y_pred))
    return total_error / n`,
        expectedBehavior:
          'mean_squared_error([3.0, -0.5, 2.0, 7.0], [2.5, 0.0, 2.0, 8.0]) must return 0.375.',
        instructions:
          'Square each residual in the generator expression: `(yt - yp) ** 2`.',
        constraints: 'len(y_true) == len(y_pred) > 0.',
        visibleExamples: JSON.stringify([
          {
            input: 'y_true = [3.0, -0.5, 2.0, 7.0], y_pred = [2.5, 0.0, 2.0, 8.0]',
            output: '0.375',
          },
        ]),
        hints: JSON.stringify([
          'Change `(yt - yp)` to `(yt - yp) ** 2`.',
        ]),
        xpPoints: 25,
        popularity: 240,
        testCases: [
          {
            title: 'Squares residuals (yt - yp) ** 2 to compute 0.375',
            inputData: 'y_true=[3.0,-0.5,2.0,7.0], y_pred=[2.5,0.0,2.0,8.0]',
            expectedOutput: '0.375',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Returns 0.0 when predictions match ground truth',
            inputData: 'y_true=[1,2,3], y_pred=[1,2,3]',
            expectedOutput: '0.0',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'Neural Networks: Fix Sigmoid Activation Exponent Sign',
        slug: 'dl-sigmoid-activation-fix',
        domain: 'AI & Machine Learning',
        topic: 'Neural Networks',
        difficulty: 'Hard',
        categoryId: aiCatId,
        language: 'Python',
        estimatedTime: '15 mins',
        inputFormat: 'z = 0.0, z = 2.0',
        outputFormat: 'sigmoid(0.0) = 0.5, sigmoid(2.0) ≈ 0.8808',
        description:
          'The Sigmoid activation function maps any real logit `z` into `(0, 1)` using `1 / (1 + exp(-z))`. The buggy implementation uses `math.exp(z)` instead of `math.exp(-z)`, inverting the activation curve.',
        bugDescription:
          'Denominator uses `1 + math.exp(z)` instead of `1 + math.exp(-z)`.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `import math

def sigmoid(z):
    # BUG: Missing negative sign in exponent math.exp(-z)
    return 1.0 / (1.0 + math.exp(z))`,
        expectedBehavior:
          'sigmoid(0.0) returns 0.5 and sigmoid(2.0) returns ~0.880797 (monotonically increasing).',
        instructions:
          'Change `math.exp(z)` to `math.exp(-z)`.',
        constraints: 'Must use `math.exp(-z)`.',
        visibleExamples: JSON.stringify([
          { input: 'sigmoid(0.0)', output: '0.5' },
          { input: 'round(sigmoid(2.0), 4)', output: '0.8808' },
        ]),
        hints: JSON.stringify([
          'The standard logistic sigmoid formula is `1.0 / (1.0 + math.exp(-z))`.',
        ]),
        xpPoints: 40,
        popularity: 225,
        testCases: [
          {
            title: 'Computes 1.0 / (1.0 + math.exp(-z))',
            inputData: 'z = 2.0',
            expectedOutput: '0.8808',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Returns 0.5 at z = 0.0',
            inputData: 'z = 0.0',
            expectedOutput: '0.5',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'NLP & GenAI: Fix Cosine Similarity Embedding Normalization',
        slug: 'genai-cosine-similarity-fix',
        domain: 'AI & Machine Learning',
        topic: 'Generative AI Fundamentals',
        difficulty: 'Medium',
        categoryId: aiCatId,
        language: 'Python',
        estimatedTime: '15 mins',
        inputFormat: 'vec_a = [1, 0], vec_b = [1, 0]',
        outputFormat: '1.0',
        description:
          'Vector search in RAG and Generative AI pipelines ranks document embeddings by Cosine Similarity: `dot(a, b) / (norm(a) * norm(b))`. The current code forgets `math.sqrt()` when computing the L2 norms.',
        bugDescription:
          '`norm_a` and `norm_b` compute squared sums without taking `math.sqrt(...)`, distorting similarity scores for non-unit vectors.',
        starterHtml: ``,
        starterCss: ``,
        starterJs: `import math

def cosine_similarity(vec_a, vec_b):
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    # BUG: L2 norm requires math.sqrt() of the sum of squares!
    norm_a = sum(a * a for a in vec_a)
    norm_b = sum(b * b for b in vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)`,
        expectedBehavior:
          'cosine_similarity([3, 4], [3, 4]) must return 1.0 by wrapping both L2 norms in `math.sqrt(...)`.',
        instructions:
          'Wrap `sum(a * a for a in vec_a)` and `sum(b * b for b in vec_b)` inside `math.sqrt(...)`.',
        constraints: 'Return 0.0 if either vector has zero norm.',
        visibleExamples: JSON.stringify([
          { input: 'vec_a = [3, 4], vec_b = [3, 4]', output: '1.0' },
          { input: 'vec_a = [1, 0], vec_b = [0, 1]', output: '0.0' },
        ]),
        hints: JSON.stringify([
          'Set `norm_a = math.sqrt(sum(a * a for a in vec_a))` and `norm_b = math.sqrt(sum(b * b for b in vec_b))`.',
        ]),
        xpPoints: 35,
        popularity: 265,
        testCases: [
          {
            title: 'Computes L2 norms using math.sqrt() so [3,4] vs [3,4] == 1.0',
            inputData: 'vec_a = [3, 4], vec_b = [3, 4]',
            expectedOutput: '1.0',
            assertionScript: 'return true;',
            isHidden: false,
          },
          {
            title: 'Returns 0.0 for orthogonal embedding vectors',
            inputData: 'vec_a = [1, 0], vec_b = [0, 5]',
            expectedOutput: '0.0',
            assertionScript: 'return true;',
            isHidden: true,
          },
        ],
      },
    ];

    for (const ch of multiDomainChallenges) {
      const [inserted] = await db
        .insert(problems)
        .values({
          title: ch.title,
          slug: ch.slug,
          domain: ch.domain,
          topic: ch.topic,
          description: ch.description,
          bugDescription: ch.bugDescription,
          difficulty: ch.difficulty,
          categoryId: ch.categoryId,
          language: ch.language,
          starterHtml: ch.starterHtml,
          starterCss: ch.starterCss,
          starterJs: ch.starterJs,
          expectedBehavior: ch.expectedBehavior,
          instructions: ch.instructions,
          constraints: ch.constraints,
          inputFormat: ch.inputFormat,
          outputFormat: ch.outputFormat,
          estimatedTime: ch.estimatedTime,
          visibleExamples: ch.visibleExamples,
          hints: ch.hints,
          xpPoints: ch.xpPoints,
          isPublished: true,
          popularity: ch.popularity,
        })
        .onConflictDoNothing()
        .returning();

      if (inserted && ch.testCases.length > 0) {
        await db.insert(problemTestCases).values(
          ch.testCases.map((tc) => ({
            problemId: inserted.id,
            title: tc.title,
            inputData: tc.inputData,
            expectedOutput: tc.expectedOutput,
            assertionScript: tc.assertionScript,
            isHidden: tc.isHidden,
          }))
        );
      }
    }

    console.log('Multi-domain challenges seeded successfully.');
  } catch (err) {
    console.error('Multi-domain seed warning:', err);
  }
}
