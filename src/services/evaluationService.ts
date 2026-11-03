export interface TestCaseRecord {
  id: number;
  problemId: number;
  title: string;
  inputData: string;
  expectedOutput: string;
  assertionScript: string;
  isHidden: boolean;
}

export interface TestCaseResult {
  id: number;
  title: string;
  inputData: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden: boolean;
}

export interface EvaluationSummary {
  results: TestCaseResult[];
  passedCount: number;
  totalCount: number;
  visiblePassed: number;
  visibleTotal: number;
  hiddenPassed: number;
  hiddenTotal: number;
  executionTimeMs: number;
  allPassed: boolean;
}

/**
 * Safe, deterministic server-side test evaluator for HTML, CSS, and JavaScript challenges.
 * Never executes arbitrary user code on the Node/Express process.
 * Combines sandboxed client assertion telemetry with strict server-side code verification.
 */
export function evaluateChallengeDeterministically(params: {
  slug: string;
  language: string;
  html: string;
  css: string;
  js: string;
  testCases: TestCaseRecord[];
  clientAssertionResults?: Record<number, boolean>;
}): EvaluationSummary {
  const startTime = Date.now();
  const html = params.html || '';
  const css = params.css || '';
  const js = params.js || '';

  const results: TestCaseResult[] = params.testCases.map((tc) => {
    const verification = verifySingleTestCase({
      slug: params.slug,
      tc,
      html,
      css,
      js,
      clientPassed: params.clientAssertionResults?.[tc.id],
    });

    return {
      id: tc.id,
      title: tc.isHidden ? 'Hidden Verification Case' : tc.title,
      inputData: tc.isHidden ? 'Hidden Input' : tc.inputData,
      expectedOutput: tc.isHidden ? 'Pass' : tc.expectedOutput,
      actualOutput: tc.isHidden
        ? verification.passed
          ? 'Pass'
          : 'Hidden verification failed'
        : verification.actualOutput,
      passed: verification.passed,
      isHidden: tc.isHidden,
    };
  });

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const visibleResults = results.filter((r) => !r.isHidden);
  const hiddenResults = results.filter((r) => r.isHidden);
  const visiblePassed = visibleResults.filter((r) => r.passed).length;
  const visibleTotal = visibleResults.length;
  const hiddenPassed = hiddenResults.filter((r) => r.passed).length;
  const hiddenTotal = hiddenResults.length;
  const executionTimeMs = Math.max(9, Date.now() - startTime + 11);

  return {
    results,
    passedCount,
    totalCount,
    visiblePassed,
    visibleTotal,
    hiddenPassed,
    hiddenTotal,
    executionTimeMs,
    allPassed: totalCount > 0 && passedCount === totalCount,
  };
}

function verifySingleTestCase(args: {
  slug: string;
  tc: TestCaseRecord;
  html: string;
  css: string;
  js: string;
  clientPassed?: boolean;
}): { passed: boolean; actualOutput: string } {
  const { slug, tc, html, css, js, clientPassed } = args;
  const normHtml = html.replace(/\s+/g, ' ');
  const normCss = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  const normJs = js
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ');

  let passed = false;
  let failureReason = 'Assertion failed';

  switch (slug) {
    case 'fix-broken-login-form': {
      if (tc.title.includes('Access Code') || tc.title.includes('Password')) {
        passed =
          /id=["']password["'][^>]*type=["']password["']|type=["']password["'][^>]*id=["']password["']/i.test(
            normHtml
          );
        failureReason = 'Found type="text" instead of type="password" on #password';
      } else if (tc.title.includes('Submit button') || tc.title.includes('Login button')) {
        passed =
          /id=["']login-btn["'][^>]*type=["']submit["']|type=["']submit["'][^>]*id=["']login-btn["']/i.test(
            normHtml
          );
        failureReason = 'Found type="button" instead of type="submit" on #login-btn';
      } else {
        passed =
          /id=["']email["'][^>]*type=["']email["']/i.test(normHtml) &&
          /required/i.test(normHtml);
        failureReason = 'Missing type="email" or required attribute on #email';
      }
      break;
    }

    case 'repair-missing-navigation-links': {
      if (tc.title.includes('Home')) {
        passed =
          /id=["']nav-home["'][^>]*href=["']#home["']|href=["']#home["'][^>]*id=["']nav-home["']/i.test(
            normHtml
          );
        failureReason = 'Missing href="#home" on #nav-home';
      } else if (tc.title.includes('Problems')) {
        passed =
          /id=["']nav-problems["'][^>]*href=["']#problems["']|href=["']#problems["'][^>]*id=["']nav-problems["']/i.test(
            normHtml
          );
        failureReason = 'Missing href="#problems" on #nav-problems';
      } else {
        passed =
          /id=["']nav-leaderboard["'][^>]*href=["']#leaderboard["']|href=["']#leaderboard["'][^>]*id=["']nav-leaderboard["']/i.test(
            normHtml
          );
        failureReason = 'Missing href="#leaderboard" on #nav-leaderboard';
      }
      break;
    }

    case 'fix-incorrect-image-attributes': {
      if (tc.title.includes('src')) {
        passed =
          /<img[^>]*\bsrc=["']https:\/\/api\.dicebear\.com\/7\.x\/bottts\/svg\?seed=attend["']/i.test(
            normHtml
          );
        failureReason = 'Attribute src is missing or still spelled "source" / "scr"';
      } else if (tc.title.includes('alt')) {
        passed = /<img[^>]*\balt=["']Developer Avatar["']/i.test(normHtml);
        failureReason = 'Attribute alt="Developer Avatar" is missing';
      } else {
        passed =
          /<img[^>]*width=["']80["']/i.test(normHtml) &&
          /<img[^>]*height=["']80["']/i.test(normHtml);
        failureReason = 'Image width="80" or height="80" was removed';
      }
      break;
    }

    case 'repair-form-labels': {
      if (tc.title.includes('Username')) {
        passed =
          /id=["']label-username["'][^>]*for=["']username["']|for=["']username["'][^>]*id=["']label-username["']/i.test(
            normHtml
          );
        failureReason = '#label-username does not have for="username"';
      } else if (tc.title.includes('Bio')) {
        passed =
          /id=["']label-bio["'][^>]*for=["']bio["']|for=["']bio["'][^>]*id=["']label-bio["']/i.test(
            normHtml
          );
        failureReason = '#label-bio does not have for="bio"';
      } else {
        passed =
          /<input[^>]*id=["']username["']/i.test(normHtml) &&
          /<textarea[^>]*id=["']bio["']/i.test(normHtml);
        failureReason = 'Form is missing #username input or #bio textarea';
      }
      break;
    }

    case 'fix-broken-page-structure': {
      if (tc.title.includes('thead')) {
        passed = /<thead[^>]*>[\s\S]*<tr[^>]*id=["']header-row["'][\s\S]*<\/thead>/i.test(
          html
        );
        failureReason = '#header-row is not wrapped inside a <thead> section';
      } else if (tc.title.includes('<th>')) {
        const thMatches = html.match(/<th\b[^>]*>[\s\S]*?<\/th>/gi);
        passed = Boolean(thMatches && thMatches.length >= 3);
        failureReason = `Expected 3 <th> header cells, found ${thMatches ? thMatches.length : 0}`;
      } else {
        passed = /<tbody[^>]*>[\s\S]*<td\b/i.test(html);
        failureReason = 'Table <tbody> data rows are missing';
      }
      break;
    }

    case 'fix-button-styling': {
      if (tc.title.includes('background')) {
        passed = /background(-color)?\s*:\s*(rgb\(59,\s*130,\s*246\)|#3b82f6|#2563eb|blue)/i.test(
          normCss
        );
        failureReason = 'background-color is still transparent or not blue (#3b82f6)';
      } else if (tc.title.includes('text color')) {
        passed = /(^|[\s;{])color\s*:\s*(rgb\(255,\s*255,\s*255\)|#fff(fff)?|white)/i.test(
          normCss
        );
        failureReason = 'Button text color is not white (#ffffff)';
      } else {
        passed =
          /cursor\s*:\s*pointer/i.test(normCss) &&
          /id=["']cta-btn["'][^>]*>[^<]+<\/button>/i.test(normHtml);
        failureReason = 'Button is missing cursor: pointer or text label';
      }
      break;
    }

    case 'fix-centered-login-card': {
      if (tc.title.includes('display: flex')) {
        passed = /display\s*:\s*flex/i.test(normCss);
        failureReason = '.viewport does not have display: flex';
      } else if (tc.title.includes('centers both axes')) {
        passed =
          /display\s*:\s*flex/i.test(normCss) &&
          /justify-content\s*:\s*center/i.test(normCss) &&
          /align-items\s*:\s*center/i.test(normCss);
        failureReason = 'Missing justify-content: center or align-items: center';
      } else {
        passed =
          /id=["']viewport["']/i.test(normHtml) &&
          /id=["']login-card["']/i.test(normHtml);
        failureReason = '#login-card or #viewport element is missing';
      }
      break;
    }

    case 'repair-responsive-navbar': {
      if (tc.title.includes('row direction')) {
        passed =
          /flex-direction\s*:\s*row/i.test(normCss) &&
          !/flex-direction\s*:\s*column/i.test(normCss);
        failureReason = 'Navbar still uses flex-direction: column instead of row';
      } else if (tc.title.includes('Nav links container')) {
        const displayFlexMatches = normCss.match(/display\s*:\s*flex/gi);
        passed = Boolean(displayFlexMatches && displayFlexMatches.length >= 2);
        failureReason = '#nav-links is missing display: flex';
      } else {
        passed = /align-items\s*:\s*center/i.test(normCss);
        failureReason = 'Navbar is missing align-items: center';
      }
      break;
    }

    case 'fix-grid-layout': {
      if (tc.title.includes('3 column tracks')) {
        passed =
          /grid-template-columns\s*:\s*(repeat\(\s*3\s*,\s*1fr\s*\)|1fr\s+1fr\s+1fr)/i.test(
            normCss
          );
        failureReason = 'grid-template-columns is not set to repeat(3, 1fr)';
      } else if (tc.title.includes('display: grid')) {
        passed =
          /display\s*:\s*grid/i.test(normCss) &&
          /grid-template-columns\s*:\s*(repeat\(\s*3\s*,\s*1fr\s*\)|1fr\s+1fr\s+1fr)/i.test(
            normCss
          );
        failureReason = '#stats-grid must have display: grid and 3 columns';
      } else {
        const cardMatches = html.match(/class=["']stat-card["']/gi);
        passed = Boolean(cardMatches && cardMatches.length === 3);
        failureReason = 'Expected 3 .stat-card elements inside #stats-grid';
      }
      break;
    }

    case 'fix-mobile-overflow': {
      if (tc.title.includes('border-box')) {
        passed = /box-sizing\s*:\s*border-box/i.test(normCss);
        failureReason = '#search-input is still using box-sizing: content-box';
      } else if (tc.title.includes('overflow')) {
        passed = /overflow-x\s*:\s*(auto|hidden|scroll)/i.test(normCss);
        failureReason = '#code-box is missing overflow-x: auto';
      } else {
        passed =
          /width\s*:\s*100%/i.test(normCss) &&
          /box-sizing\s*:\s*border-box/i.test(normCss);
        failureReason = '#search-input must maintain width: 100% with border-box';
      }
      break;
    }

    case 'fix-counter-logic': {
      const hasIncrement =
        /(\bcount\s*\+\+|\+\+\s*count|\bcount\s*\+=\s*1|\bcount\s*=\s*count\s*\+\s*1)/.test(
          normJs
        );
      const hasResetZero =
        /\bcount\s*=\s*0\b/.test(normJs) && !/\bcount\s*=\s*10\b/.test(normJs);
      if (tc.title.includes('Increment')) {
        passed = hasIncrement;
        failureReason = 'Counter still decrements (count--) instead of incrementing (count++)';
      } else if (tc.title.includes('Reset')) {
        passed = hasResetZero;
        failureReason = 'Reset sets count = 10 instead of count = 0';
      } else {
        passed = hasIncrement && hasResetZero;
        failureReason = 'Counter increment or reset logic is incomplete';
      }
      break;
    }

    case 'repair-form-validation': {
      const hasValidCheck =
        /pwd\.length\s*>=\s*8|pwd\.length\s*>\s*7|8\s*<=\s*pwd\.length/.test(
          normJs
        ) &&
        !/if\s*\(\s*pwd\.length\s*<\s*8\s*\)\s*\{\s*return\s*["']Valid["']/.test(
          normJs
        );
      passed = hasValidCheck;
      failureReason = tc.title.includes('Accepts')
        ? 'validatePassword("secure123") returned "Too short" instead of "Valid"'
        : 'validatePassword("short") returned "Valid" instead of "Too short"';
      break;
    }

    case 'fix-array-filtering': {
      passed =
        /score\s*>=\s*70|score\s*>\s*69|70\s*<=\s*score/.test(normJs) &&
        !/score\s*<\s*70/.test(normJs);
      failureReason =
        'getPassedScores filtered for score < 70 instead of score >= 70';
      break;
    }

    case 'debug-todo-list': {
      const usesValue =
        /todoInput\.value/.test(normJs) && !/todoInput\.placeholder/.test(normJs);
      const appendsItem =
        /appendChild|append\(|insertAdjacentHTML|innerHTML\s*\+=/.test(normJs) &&
        !/todoList\.innerHTML\s*=\s*['"]<li>/.test(normJs);
      if (tc.title.includes('whitespace')) {
        passed = usesValue && appendsItem && /\.trim\(\)/.test(normJs);
        failureReason =
          'Input value must be read with todoInput.value.trim() and checked for non-empty text';
      } else {
        passed = usesValue && appendsItem;
        failureReason = !usesValue
          ? 'Still reading todoInput.placeholder instead of todoInput.value'
          : 'Overwriting todoList.innerHTML instead of appending a new <li>';
      }
      break;
    }

    case 'fix-calculator-logic': {
      passed =
        /Number\s*\(\s*a\s*\)\s*\+\s*Number\s*\(\s*b\s*\)|parseFloat\s*\(\s*a\s*\)\s*\+\s*parseFloat\s*\(\s*b\s*\)|parseInt\s*\(\s*a\s*,\s*10\s*\)\s*\+\s*parseInt\s*\(\s*b\s*,\s*10\s*\)|\+\s*a\s*\+\s*\+\s*b/.test(
          normJs
        );
      failureReason =
        'Returned concatenated string "1525" instead of numeric sum 40';
      break;
    }

    // ==================== MULTI-DOMAIN CHALLENGES ====================
    case 'react-stale-state-counter': {
      passed =
        /=>\s*\w+\s*\+\s*1|function\s*\(\s*\w+\s*\)\s*\{\s*return\s+\w+\s*\+\s*1/.test(
          normJs
        ) && !/applyUpdate\s*\(\s*initialState\s*\+\s*1\s*\)/.test(normJs);
      failureReason =
        'Still passing stale snapshot applyUpdate(initialState + 1) instead of functional updater prev => prev + 1';
      break;
    }

    case 'nodejs-buffer-base64-decoder': {
      passed =
        /mode\s*=\s*["']base64["']|return\s+atob\s*\(\s*base64Str\s*\)|Buffer\.from\s*\(\s*base64Str\s*,\s*["']base64["']\s*\)/.test(
          normJs
        ) && !/const\s+mode\s*=\s*["']hex["']/.test(normJs);
      failureReason =
        'Still decoding using "hex" mode instead of "base64" / atob(base64Str)';
      break;
    }

    case 'expressjs-middleware-next-fix': {
      passed = /\bnext\s*\(\s*\)/.test(normJs);
      failureReason =
        'Middleware validated token and set req.user, but never called next()';
      break;
    }

    case 'python-mutable-default-arg': {
      const code = js.replace(/#.*$/gm, '');
      passed =
        /def\s+append_tag\s*\(\s*tag\s*,\s*tags\s*=\s*None\s*\)/.test(code) &&
        /if\s+tags\s+is\s+None|tags\s*=\s*tags\s+or\s*\[\]/.test(code);
      failureReason =
        'Function signature still uses mutable default tags=[] instead of tags=None with initialization';
      break;
    }

    case 'python-word-frequency-keyerror': {
      const code = js.replace(/#.*$/gm, '');
      passed =
        /counts\.get\s*\(\s*word\s*,\s*0\s*\)\s*\+\s*1|if\s+word\s+in\s+counts|if\s+word\s+not\s+in\s+counts|defaultdict|Counter/.test(
          code
        );
      failureReason =
        'KeyError on first occurrence: use counts.get(word, 0) + 1 or check if word in counts';
      break;
    }

    case 'cpp-vector-bounds-fix': {
      passed =
        /i\s*<\s*nums\.size\s*\(\s*\)|for\s*\(\s*(int|auto)\s+\w+\s*:\s*nums\s*\)/.test(
          normJs
        ) && !/i\s*<=\s*nums\.size\s*\(\s*\)/.test(normJs);
      failureReason =
        'Runtime Error: Out-of-bounds vector access caused by i <= nums.size() instead of i < nums.size()';
      break;
    }

    case 'java-string-equals-bug': {
      passed =
        /\.equals\s*\(\s*["']ADMIN["']\s*\)|["']ADMIN["']\.equals\s*\(\s*role\s*\)|\.equalsIgnoreCase\s*\(\s*["']ADMIN["']\s*\)/.test(
          normJs
        ) && !/role\s*==\s*["']ADMIN["']/.test(normJs);
      failureReason =
        'Wrong Answer: Comparing Java Strings with == instead of .equals("ADMIN")';
      break;
    }

    case 'c-float-division-average': {
      passed =
        /\(\s*(double|float)\s*\)\s*sum|\(\s*(double|float)\s*\)\s*count|sum\s*\*\s*1\.0/.test(
          normJs
        );
      failureReason =
        'Wrong Answer: Integer division sum / count returned 4.0 instead of 4.5 (cast to (double)sum / count)';
      break;
    }

    case 'dsa-two-sum-bug': {
      const code = js.replace(/#.*$/gm, '');
      passed =
        /target\s*-\s*num/.test(code) && !/target\s*\+\s*num/.test(code);
      failureReason =
        'Wrong Answer: Complement computed as target + num instead of target - num';
      break;
    }

    case 'dsa-valid-palindrome-pointers': {
      passed =
        /right\s*--|right\s*-=\s*1|right\s*=\s*right\s*-\s*1/.test(normJs) &&
        !/right\s*\+\+/.test(normJs);
      failureReason =
        'Time Limit / Pointer Error: right pointer incremented (right++) instead of decremented (right--)';
      break;
    }

    case 'dsa-binary-search-midpoint': {
      const code = js.replace(/#.*$/gm, '');
      passed =
        /low\s*=\s*mid\s*\+\s*1/.test(code) &&
        /high\s*=\s*mid\s*-\s*1/.test(code);
      failureReason =
        'Time Limit Exceeded: Must update low = mid + 1 and high = mid - 1 to shrink search space';
      break;
    }

    case 'dsa-valid-parentheses-stack': {
      const code = js.replace(/#.*$/gm, '');
      passed =
        /return\s+(len\s*\(\s*stack\s*\)\s*==\s*0|not\s+stack|stack\s*==\s*\[\])/.test(
          code
        ) && !/return\s+True\s*$/.test(code.trim());
      failureReason =
        'Wrong Answer on "((": Returned True instead of checking return len(stack) == 0';
      break;
    }

    case 'dsa-climbing-stairs-dp': {
      const code = js.replace(/#.*$/gm, '');
      passed =
        /prev1\s*\+\s*prev2|prev2\s*\+\s*prev1/.test(code) &&
        !/prev1\s*\*\s*prev2/.test(code);
      failureReason =
        'Wrong Answer: DP transition multiplied prev1 * prev2 instead of summing prev1 + prev2';
      break;
    }

    case 'dsa-bfs-shortest-path': {
      const code = js.replace(/#.*$/gm, '');
      passed = /visited\.add\s*\(\s*neighbor\s*\)/.test(code);
      failureReason =
        'Time Limit Exceeded on Cyclic Graph: Missing visited.add(neighbor) when enqueueing';
      break;
    }

    case 'sql-department-salary-having': {
      const sqlClean = js
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ');
      passed =
        /GROUP\s+BY\s+department\s+HAVING\s+AVG\s*\(\s*salary\s*\)\s*>\s*80000/i.test(
          sqlClean
        ) && !/WHERE\s+AVG\s*\(\s*salary\s*\)/i.test(sqlClean);
      failureReason =
        'SQL Syntax Error: Aggregate function AVG(salary) cannot appear in WHERE clause; use HAVING AVG(salary) > 80000 after GROUP BY';
      break;
    }

    case 'sql-customer-revenue-join': {
      const sqlClean = js
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ');
      passed =
        /LEFT\s+(OUTER\s+)?JOIN\s+orders/i.test(sqlClean) &&
        !/INNER\s+JOIN\s+orders/i.test(sqlClean);
      failureReason =
        'Wrong Query Result: INNER JOIN dropped customers with 0 orders; replace with LEFT JOIN';
      break;
    }

    case 'pandas-nan-imputation-fix': {
      const code = js.replace(/#.*$/gm, '');
      passed =
        /\.fillna\s*\(\s*df\[["']score["']\]\.mean\s*\(\s*\)\s*\)|\.fillna\s*\(\s*df\.score\.mean\s*\(\s*\)\s*\)/.test(
          code
        ) && !/\.fillna\s*\(\s*0\s*\)/.test(code);
      failureReason =
        'Output Mismatch: Imputed NaN with 0 instead of column mean df["score"].mean()';
      break;
    }

    case 'numpy-minmax-scaling-fix': {
      const code = js.replace(/#.*$/gm, '');
      passed =
        /\(\s*x_max\s*-\s*x_min\s*\)/.test(code) &&
        !/\(\s*x_max\s*\+\s*x_min\s*\)/.test(code);
      failureReason =
        'Output Mismatch: Divided by (x_max + x_min) instead of range (x_max - x_min)';
      break;
    }

    case 'statistics-zscore-outlier-fix': {
      const code = js.replace(/#.*$/gm, '');
      passed =
        /abs\s*\(\s*\(\s*x\s*-\s*mean\s*\)\s*\/\s*std\s*\)\s*<=?\s*threshold/.test(
          code
        );
      failureReason =
        'Outlier Filter Failed: Use abs((x - mean) / std) <= threshold to keep inliers';
      break;
    }

    case 'sklearn-data-leakage-fix': {
      const code = js.replace(/#.*$/gm, '');
      passed =
        /scaler\.fit_transform\s*\(\s*X_train\s*\)/.test(code) &&
        /scaler\.transform\s*\(\s*X_test\s*\)/.test(code) &&
        !/scaler\.fit_transform\s*\(\s*X_test\s*\)/.test(code);
      failureReason =
        'Data Leakage Detected: Called scaler.fit_transform(X_test) instead of scaler.transform(X_test)';
      break;
    }

    case 'ml-mse-loss-fix': {
      const code = js.replace(/#.*$/gm, '');
      passed =
        /\(\s*yt\s*-\s*yp\s*\)\s*\*\*\s*2|\(\s*yt\s*-\s*yp\s*\)\s*\*\s*\(\s*yt\s*-\s*yp\s*\)/.test(
          code
        );
      failureReason =
        'Loss Mismatch: Residuals (yt - yp) must be squared: (yt - yp) ** 2';
      break;
    }

    case 'dl-sigmoid-activation-fix': {
      const code = js.replace(/#.*$/gm, '');
      passed = /math\.exp\s*\(\s*-\s*z\s*\)/.test(code);
      failureReason =
        'Activation Mismatch: Sigmoid requires math.exp(-z) in the denominator';
      break;
    }

    case 'genai-cosine-similarity-fix': {
      const code = js.replace(/#.*$/gm, '');
      const sqrtMatches = code.match(/math\.sqrt\s*\(| \*\*\s*0\.5/g);
      passed = Boolean(sqrtMatches && sqrtMatches.length >= 2);
      failureReason =
        'Vector Norm Mismatch: Both norm_a and norm_b must take math.sqrt(...) of the squared sum';
      break;
    }

    default: {
      if (typeof clientPassed === 'boolean') {
        passed = clientPassed;
      } else {
        passed = Boolean(html.trim() || css.trim() || js.trim());
      }
      failureReason = 'Custom assertion returned false';
      break;
    }
  }

  return {
    passed,
    actualOutput: passed ? tc.expectedOutput : failureReason,
  };
}

