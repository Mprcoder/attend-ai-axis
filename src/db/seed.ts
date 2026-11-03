import { db } from './index.ts';
import {
  categories,
  problems,
  problemTestCases,
  achievements,
  users,
  userProgress,
  userStreaks,
  submissions,
  userAchievements,
} from './schema.ts';
import { eq, inArray } from 'drizzle-orm';
import { ensureMultiDomainSeeded } from './multiDomainSeed.ts';

export async function ensureSeeded() {
  try {
    await db
      .update(users)
      .set({ role: 'student', passwordHash: null })
      .where(
        inArray(users.uid, [
          'admin-attend-ai-001',
          'user-sarah-chen-002',
          'user-rohan-verma-003',
        ])
      );
    await db
      .update(users)
      .set({ role: 'student' })
      .where(eq(users.role, 'user'));

    const existingCats = await db.select().from(categories);
    if (existingCats.length > 0) {
      await ensureMultiDomainSeeded();
      return;
    }

    console.log('Seeding Attend AI PostgreSQL database...');

    // 1. Seed Categories
    const insertedCategories = await db
      .insert(categories)
      .values([
        {
          name: 'Web Development (HTML)',
          slug: 'html-debugging',
          description:
            'HTML5 semantic structure, form controls, image paths, accessibility labels, and document layout repairs.',
          level: 'Beginner',
          icon: 'globe',
        },
        {
          name: 'CSS Layout & Styling',
          slug: 'css-debugging',
          description:
            'Flexbox centering, responsive navbars, CSS Grid columns, button states, and mobile overflow fixes.',
          level: 'Intermediate',
          icon: 'layers',
        },
        {
          name: 'JavaScript Logic & DOM',
          slug: 'js-debugging',
          description:
            'Event listeners, counter state bugs, form validation rules, array filtering, and calculator arithmetic.',
          level: 'Advanced',
          icon: 'code',
        },
      ])
      .onConflictDoNothing()
      .returning();

    const allCats =
      insertedCategories.length > 0
        ? insertedCategories
        : await db.select().from(categories);

    const htmlCatId = allCats.find((c) => c.slug === 'html-debugging')?.id || 1;
    const cssCatId = allCats.find((c) => c.slug === 'css-debugging')?.id || 2;
    const jsCatId = allCats.find((c) => c.slug === 'js-debugging')?.id || 3;

    // 2. Seed Achievements
    const insertedAchievements = await db
      .insert(achievements)
      .values([
        {
          title: 'First Bug Squashed',
          description: 'Solve your very first debugging challenge on Attend AI.',
          icon: 'bug',
          requirementType: 'solved_count',
          requirementValue: 1,
        },
        {
          title: 'Bug Hunter V',
          description: 'Successfully debug and pass all tests on 5 challenges.',
          icon: 'shield',
          requirementType: 'solved_count',
          requirementValue: 5,
        },
        {
          title: 'XP Centurion',
          description: 'Accumulate at least 100 XP from solved debugging challenges.',
          icon: 'zap',
          requirementType: 'xp_total',
          requirementValue: 100,
        },
        {
          title: '3-Day Streak',
          description: 'Maintain an active debugging streak of 3 consecutive days.',
          icon: 'flame',
          requirementType: 'streak_days',
          requirementValue: 3,
        },
        {
          title: 'Full-Stack Debugger',
          description: 'Solve 15 challenges across HTML, CSS, and JavaScript.',
          icon: 'trophy',
          requirementType: 'solved_count',
          requirementValue: 15,
        },
      ])
      .onConflictDoNothing()
      .returning();

    // 3. Seed 15 Realistic Debugging Challenges (5 HTML, 5 CSS, 5 JavaScript)
    const challengeData = [
      // ================= HTML CHALLENGES (5) =================
      {
        title: 'Fix Broken Contact Form',
        slug: 'fix-broken-login-form',
        description:
          'A developer created a feedback contact form, but clicking the Submit Feedback button never submits the form and the secret access code field displays characters in plain text.',
        bugDescription:
          'The access code input uses type="text" instead of type="password", and the submit button has type="button" instead of type="submit".',
        difficulty: 'Easy',
        categoryId: htmlCatId,
        language: 'HTML',
        starterHtml: `<form id="login-form">
  <div class="field">
    <label for="email">Developer Email</label>
    <input id="email" name="email" type="email" placeholder="dev@attendai.dev" required />
  </div>
  <div class="field">
    <label for="password">Access Code</label>
    <!-- BUG 1: Access code is visible as plain text -->
    <input id="password" name="password" type="text" placeholder="Enter secret code" required />
  </div>
  <!-- BUG 2: Button does not trigger form submission -->
  <button id="login-btn" type="button">Submit Feedback</button>
</form>`,
        starterCss: `body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }
form { max-width: 320px; background: #1e293b; padding: 20px; border-radius: 8px; }
.field { margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px; }
input { padding: 8px 10px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #fff; }
button { width: 100%; padding: 10px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; }`,
        starterJs: `// No JS changes needed for this HTML challenge`,
        expectedBehavior:
          'The #password input must have type="password" to mask characters, and #login-btn must have type="submit" so the form submits properly.',
        instructions:
          'Inspect the HTML form elements and fix the input type on #password and the button type on #login-btn.',
        constraints: 'Do not change element IDs (#login-form, #email, #password, #login-btn).',
        visibleExamples: JSON.stringify([
          {
            input: 'Inspect #password and #login-btn attributes',
            output: '#password[type="password"] and #login-btn[type="submit"]',
          },
        ]),
        hints: JSON.stringify([
          'Check the type attribute of the <input id="password"> element.',
          'HTML buttons inside forms need type="submit" to trigger form submission.',
        ]),
        xpPoints: 10,
        popularity: 142,
        testCases: [
          {
            title: 'Access Code input masks characters',
            inputData: 'document.getElementById("password").getAttribute("type")',
            expectedOutput: 'password',
            assertionScript:
              'const el = document.getElementById("password"); return el && el.getAttribute("type") === "password";',
            isHidden: false,
          },
          {
            title: 'Submit button has type="submit"',
            inputData: 'document.getElementById("login-btn").getAttribute("type")',
            expectedOutput: 'submit',
            assertionScript:
              'const btn = document.getElementById("login-btn"); return btn && btn.getAttribute("type") === "submit";',
            isHidden: false,
          },
          {
            title: 'Email input retains required & email type',
            inputData: 'document.getElementById("email") validation check',
            expectedOutput: 'type="email" and required',
            assertionScript:
              'const em = document.getElementById("email"); return em && em.getAttribute("type") === "email" && em.hasAttribute("required");',
            isHidden: true,
          },
        ],
      },
      {
        title: 'Repair Missing Navigation Links',
        slug: 'repair-missing-navigation-links',
        description:
          'The site navigation bar renders link text, but clicking the links does nothing because the anchor tags are missing valid href attributes.',
        bugDescription:
          'The <a> tags inside <nav id="main-nav"> use hrefAttribute or missing href instead of href="#home", href="#problems", and href="#leaderboard".',
        difficulty: 'Easy',
        categoryId: htmlCatId,
        language: 'HTML',
        starterHtml: `<nav id="main-nav">
  <a id="nav-home" url="#home">Home</a>
  <a id="nav-problems" link="#problems">Problems</a>
  <a id="nav-leaderboard">Leaderboard</a>
</nav>`,
        starterCss: `body { background: #0f172a; padding: 20px; font-family: sans-serif; }
nav { display: flex; gap: 16px; background: #1e293b; padding: 14px 20px; border-radius: 8px; }
a { color: #818cf8; text-decoration: none; font-weight: 600; }`,
        starterJs: ``,
        expectedBehavior:
          '#nav-home must have href="#home", #nav-problems must have href="#problems", and #nav-leaderboard must have href="#leaderboard".',
        instructions:
          'Replace invalid attributes on the three <a> elements with proper href attributes.',
        constraints: 'Keep the anchor IDs (#nav-home, #nav-problems, #nav-leaderboard) unchanged.',
        visibleExamples: JSON.stringify([
          {
            input: 'Check href attributes of nav links',
            output: '#home, #problems, #leaderboard',
          },
        ]),
        hints: JSON.stringify([
          'Anchor tags require the standard href attribute to become clickable hyperlinks.',
          'Set href="#home", href="#problems", and href="#leaderboard" on the three links.',
        ]),
        xpPoints: 10,
        popularity: 118,
        testCases: [
          {
            title: 'Home link has href="#home"',
            inputData: '#nav-home href',
            expectedOutput: '#home',
            assertionScript:
              'const a = document.getElementById("nav-home"); return a && a.getAttribute("href") === "#home";',
            isHidden: false,
          },
          {
            title: 'Problems link has href="#problems"',
            inputData: '#nav-problems href',
            expectedOutput: '#problems',
            assertionScript:
              'const a = document.getElementById("nav-problems"); return a && a.getAttribute("href") === "#problems";',
            isHidden: false,
          },
          {
            title: 'Leaderboard link has href="#leaderboard"',
            inputData: '#nav-leaderboard href',
            expectedOutput: '#leaderboard',
            assertionScript:
              'const a = document.getElementById("nav-leaderboard"); return a && a.getAttribute("href") === "#leaderboard";',
            isHidden: true,
          },
        ],
      },
      {
        title: 'Fix Incorrect Image Attributes',
        slug: 'fix-incorrect-image-attributes',
        description:
          'A product card image is not loading and fails accessibility audits because the developer used non-standard attributes for the image source and alt text.',
        bugDescription:
          'The <img id="avatar-img"> uses source="..." and description="..." instead of standard src and alt attributes.',
        difficulty: 'Easy',
        categoryId: htmlCatId,
        language: 'HTML',
        starterHtml: `<div class="profile-card">
  <!-- BUG: Invalid image attributes -->
  <img id="avatar-img" source="https://api.dicebear.com/7.x/bottts/svg?seed=attend" description="Developer Avatar" width="80" height="80" />
  <h3>Alex Rivera</h3>
  <p>Senior Debugging Mentor</p>
</div>`,
        starterCss: `body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; }
.profile-card { background: #1e293b; padding: 20px; border-radius: 10px; text-align: center; width: 220px; }`,
        starterJs: ``,
        expectedBehavior:
          'The #avatar-img element must use src="https://api.dicebear.com/7.x/bottts/svg?seed=attend" and alt="Developer Avatar".',
        instructions:
          'Fix the attribute names on #avatar-img so the browser loads the image and screen readers can read the alt text.',
        constraints: 'Do not modify the image URL or alt text value.',
        visibleExamples: JSON.stringify([
          {
            input: '<img id="avatar-img" ... />',
            output: 'src="https://api.dicebear.com/7.x/bottts/svg?seed=attend" alt="Developer Avatar"',
          },
        ]),
        hints: JSON.stringify([
          'HTML <img> tags use src for the image URL, not source.',
          'Accessibility requires the alt attribute, not description.',
        ]),
        xpPoints: 10,
        popularity: 95,
        testCases: [
          {
            title: 'Image has valid src attribute',
            inputData: '#avatar-img[src]',
            expectedOutput: 'https://api.dicebear.com/7.x/bottts/svg?seed=attend',
            assertionScript:
              'const img = document.getElementById("avatar-img"); return img && img.getAttribute("src") === "https://api.dicebear.com/7.x/bottts/svg?seed=attend";',
            isHidden: false,
          },
          {
            title: 'Image has accessible alt attribute',
            inputData: '#avatar-img[alt]',
            expectedOutput: 'Developer Avatar',
            assertionScript:
              'const img = document.getElementById("avatar-img"); return img && img.getAttribute("alt") === "Developer Avatar";',
            isHidden: false,
          },
        ],
      },
      {
        title: 'Repair Form Labels & Accessibility',
        slug: 'repair-form-labels',
        description:
          'Clicking on the form labels does not focus the corresponding input fields because the label "for" attributes do not match the input "id" attributes.',
        bugDescription:
          'The labels point to "user_name" and "user_bio", while the inputs have id="username" and id="bio".',
        difficulty: 'Easy',
        categoryId: htmlCatId,
        language: 'HTML',
        starterHtml: `<form class="settings-form">
  <div class="group">
    <label id="label-username" for="user_name">Username</label>
    <input id="username" type="text" value="debug_ninja" />
  </div>
  <div class="group">
    <label id="label-bio" for="user_bio">Developer Bio</label>
    <textarea id="bio">Squashing bugs daily.</textarea>
  </div>
</form>`,
        starterCss: `body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; }
.group { margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px; max-width: 300px; }
input, textarea { padding: 8px; border-radius: 6px; background: #1e293b; color: #fff; border: 1px solid #334155; }`,
        starterJs: ``,
        expectedBehavior:
          '#label-username must have for="username" and #label-bio must have for="bio" so clicking each label focuses its control.',
        instructions:
          'Update the for attributes on #label-username and #label-bio to match the exact id attributes of their inputs.',
        constraints: 'Keep input IDs as "username" and "bio".',
        visibleExamples: JSON.stringify([
          {
            input: 'label.getAttribute("for") === input.id',
            output: 'true for both fields',
          },
        ]),
        hints: JSON.stringify([
          'A <label for="X"> only associates with an input whose id="X" matches exactly.',
        ]),
        xpPoints: 10,
        popularity: 88,
        testCases: [
          {
            title: 'Username label matches #username input',
            inputData: '#label-username[for]',
            expectedOutput: 'username',
            assertionScript:
              'const lbl = document.getElementById("label-username"); return lbl && lbl.getAttribute("for") === "username";',
            isHidden: false,
          },
          {
            title: 'Bio label matches #bio textarea',
            inputData: '#label-bio[for]',
            expectedOutput: 'bio',
            assertionScript:
              'const lbl = document.getElementById("label-bio"); return lbl && lbl.getAttribute("for") === "bio";',
            isHidden: false,
          },
        ],
      },
      {
        title: 'Fix Broken Semantic Table Structure',
        slug: 'fix-broken-page-structure',
        description:
          'A leaderboard table is rendering column headers inside the table body and uses regular <td> cells instead of semantic <th> header cells inside <thead>.',
        bugDescription:
          'The header row is missing <thead> and uses <td> tags instead of <th> tags for Rank, User, and XP.',
        difficulty: 'Medium',
        categoryId: htmlCatId,
        language: 'HTML',
        starterHtml: `<table id="leaderboard-table">
  <!-- BUG: Header row should be inside <thead> and use <th> elements -->
  <tbody>
    <tr id="header-row">
      <td>Rank</td>
      <td>User</td>
      <td>XP</td>
    </tr>
    <tr>
      <td>#1</td>
      <td>Sarah Chen</td>
      <td>450 XP</td>
    </tr>
  </tbody>
</table>`,
        starterCss: `body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; }
table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; }
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; }
th { background: #0f172a; color: #818cf8; }`,
        starterJs: ``,
        expectedBehavior:
          '#leaderboard-table must contain a <thead> wrapping #header-row, and #header-row must contain 3 <th> elements (Rank, User, XP).',
        instructions:
          'Move #header-row inside a <thead> element and convert its three <td> cells into <th> header cells.',
        constraints: 'Keep id="leaderboard-table" and id="header-row".',
        visibleExamples: JSON.stringify([
          {
            input: 'document.querySelectorAll("#leaderboard-table thead tr#header-row th").length',
            output: '3',
          },
        ]),
        hints: JSON.stringify([
          'Wrap <tr id="header-row"> in a <thead>...</thead> section above <tbody>.',
          'Change the three <td> cells inside #header-row to <th> cells.',
        ]),
        xpPoints: 20,
        popularity: 84,
        testCases: [
          {
            title: 'Table has a <thead> containing #header-row',
            inputData: '#leaderboard-table thead #header-row',
            expectedOutput: 'Element exists',
            assertionScript:
              'return Boolean(document.querySelector("#leaderboard-table thead tr#header-row"));',
            isHidden: false,
          },
          {
            title: 'Header row uses 3 <th> cells',
            inputData: '#header-row th count',
            expectedOutput: '3',
            assertionScript:
              'return document.querySelectorAll("#leaderboard-table thead tr#header-row th").length === 3;',
            isHidden: false,
          },
        ],
      },

      // ================= CSS CHALLENGES (5) =================
      {
        title: 'Fix Button Styling',
        slug: 'fix-button-styling',
        description:
          'Make the primary action button background blue (#3b82f6) with white text (#ffffff) using CSS. Currently the CSS property names contain typos.',
        bugDescription:
          'The stylesheet uses bg-color instead of background-color and font-color instead of color.',
        difficulty: 'Easy',
        categoryId: cssCatId,
        language: 'CSS',
        starterHtml: `<div class="wrapper">
  <button id="action-btn">Deploy Application</button>
</div>`,
        starterCss: `body { background: #0f172a; display: flex; justify-content: center; padding: 40px; font-family: sans-serif; }
#action-btn {
  /* BUG: Invalid CSS property names */
  bg-color: rgb(59, 130, 246);
  font-color: rgb(255, 255, 255);
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}`,
        starterJs: ``,
        expectedBehavior:
          '#action-btn must have computed background-color of rgb(59, 130, 246) (#3b82f6 / blue) and color of rgb(255, 255, 255) (#ffffff / white).',
        instructions:
          'Fix the CSS property names inside #action-btn so the button renders with a blue background and white text.',
        constraints: 'Keep #action-btn selector intact.',
        visibleExamples: JSON.stringify([
          {
            input: 'getComputedStyle(#action-btn).backgroundColor',
            output: 'rgb(59, 130, 246)',
          },
        ]),
        hints: JSON.stringify([
          'In CSS, background color is set with background-color (or background), not bg-color.',
          'Text color is set with color, not font-color.',
        ]),
        xpPoints: 10,
        popularity: 210,
        testCases: [
          {
            title: 'Button background color is blue',
            inputData: 'getComputedStyle(#action-btn).backgroundColor',
            expectedOutput: 'rgb(59, 130, 246) or blue',
            assertionScript:
              'const btn = document.getElementById("action-btn"); if (!btn) return false; const bg = window.getComputedStyle(btn).backgroundColor; return bg === "rgb(59, 130, 246)" || bg === "rgb(0, 0, 255)" || bg === "rgb(37, 99, 235)";',
            isHidden: false,
          },
          {
            title: 'Button text color is white',
            inputData: 'getComputedStyle(#action-btn).color',
            expectedOutput: 'rgb(255, 255, 255)',
            assertionScript:
              'const btn = document.getElementById("action-btn"); if (!btn) return false; return window.getComputedStyle(btn).color === "rgb(255, 255, 255)";',
            isHidden: false,
          },
        ],
      },
      {
        title: 'Fix Centered Login Card',
        slug: 'fix-centered-login-card',
        description:
          'The login card is stuck in the top-left corner of the viewport container instead of being centered horizontally and vertically with Flexbox.',
        bugDescription:
          'The .viewport container sets justify-content: center and align-items: center, but is missing display: flex.',
        difficulty: 'Easy',
        categoryId: cssCatId,
        language: 'CSS',
        starterHtml: `<div id="viewport" class="viewport">
  <div id="login-card" class="card">
    <h3>Attend AI Portal</h3>
    <p>Centered Flexbox Card</p>
  </div>
</div>`,
        starterCss: `body { margin: 0; background: #0f172a; color: #f8fafc; font-family: sans-serif; }
.viewport {
  height: 260px;
  /* BUG: justify-content and align-items have no effect without display: flex */
  justify-content: center;
  align-items: center;
}
.card {
  background: #1e293b;
  padding: 24px 32px;
  border-radius: 12px;
  border: 1px solid #334155;
  text-align: center;
}`,
        starterJs: ``,
        expectedBehavior:
          '#viewport must use display: flex with justify-content: center and align-items: center.',
        instructions: 'Add the missing display property to .viewport so Flexbox centering works.',
        constraints: 'Do not remove justify-content: center or align-items: center.',
        visibleExamples: JSON.stringify([
          {
            input: 'getComputedStyle(#viewport).display',
            output: 'flex',
          },
        ]),
        hints: JSON.stringify([
          'justify-content and align-items only work on a flex or grid container.',
          'Add display: flex; to the .viewport rule.',
        ]),
        xpPoints: 10,
        popularity: 165,
        testCases: [
          {
            title: 'Viewport uses display: flex',
            inputData: 'getComputedStyle(#viewport).display',
            expectedOutput: 'flex',
            assertionScript:
              'const vp = document.getElementById("viewport"); return vp && window.getComputedStyle(vp).display === "flex";',
            isHidden: false,
          },
          {
            title: 'Viewport centers both axes',
            inputData: 'justifyContent & alignItems',
            expectedOutput: 'center & center',
            assertionScript:
              'const vp = document.getElementById("viewport"); if (!vp) return false; const s = window.getComputedStyle(vp); return s.justifyContent === "center" && s.alignItems === "center";',
            isHidden: false,
          },
        ],
      },
      {
        title: 'Repair Responsive Navbar Layout',
        slug: 'repair-responsive-navbar',
        description:
          'A navigation bar should place the brand logo on the far left and navigation links in a horizontal row on the far right, but everything stacks vertically.',
        bugDescription:
          '#navbar has flex-direction: column instead of row, and .nav-links is missing display: flex.',
        difficulty: 'Medium',
        categoryId: cssCatId,
        language: 'CSS',
        starterHtml: `<header id="navbar">
  <div class="brand">Attend AI</div>
  <ul id="nav-links" class="nav-links">
    <li>Dashboard</li>
    <li>Problems</li>
    <li>Profile</li>
  </ul>
</header>`,
        starterCss: `body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; }
#navbar {
  display: flex;
  /* BUG 1: Stacking vertically instead of horizontal row */
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background: #1e293b;
  padding: 14px 20px;
  border-radius: 10px;
}
.nav-links {
  /* BUG 2: List items stack vertically instead of horizontal flex row */
  list-style: none;
  gap: 20px;
  margin: 0;
  padding: 0;
}`,
        starterJs: ``,
        expectedBehavior:
          '#navbar must have flex-direction: row and #nav-links must have display: flex.',
        instructions:
          'Change #navbar flex-direction to row and enable Flexbox on .nav-links.',
        constraints: 'Keep #navbar and #nav-links IDs intact.',
        visibleExamples: JSON.stringify([
          {
            input: 'getComputedStyle(#navbar).flexDirection & getComputedStyle(#nav-links).display',
            output: 'row & flex',
          },
        ]),
        hints: JSON.stringify([
          'Change flex-direction: column to flex-direction: row on #navbar.',
          'Add display: flex; to .nav-links so the <li> items sit side by side.',
        ]),
        xpPoints: 20,
        popularity: 130,
        testCases: [
          {
            title: 'Navbar uses horizontal row direction',
            inputData: 'getComputedStyle(#navbar).flexDirection',
            expectedOutput: 'row',
            assertionScript:
              'const nav = document.getElementById("navbar"); return nav && window.getComputedStyle(nav).flexDirection === "row";',
            isHidden: false,
          },
          {
            title: 'Nav links container uses display: flex',
            inputData: 'getComputedStyle(#nav-links).display',
            expectedOutput: 'flex',
            assertionScript:
              'const links = document.getElementById("nav-links"); return links && window.getComputedStyle(links).display === "flex";',
            isHidden: false,
          },
        ],
      },
      {
        title: 'Fix 3-Column CSS Grid Layout',
        slug: 'fix-grid-layout',
        description:
          'A dashboard stat section should display 3 equal-width cards in a CSS Grid row, but all 3 cards render in a single vertical column.',
        bugDescription:
          '#stats-grid uses grid-template-columns: 1fr instead of repeat(3, 1fr) (3 equal columns).',
        difficulty: 'Medium',
        categoryId: cssCatId,
        language: 'CSS',
        starterHtml: `<div id="stats-grid">
  <div class="stat">Solved: 12</div>
  <div class="stat">Streak: 5d</div>
  <div class="stat">XP: 240</div>
</div>`,
        starterCss: `body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; }
#stats-grid {
  display: grid;
  /* BUG: Only 1 column defined instead of 3 equal columns */
  grid-template-columns: 1fr;
  gap: 16px;
}
.stat {
  background: #1e293b;
  padding: 18px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #334155;
}`,
        starterJs: ``,
        expectedBehavior:
          '#stats-grid must define 3 columns using grid-template-columns: repeat(3, 1fr) or 1fr 1fr 1fr.',
        instructions:
          'Update grid-template-columns on #stats-grid so the 3 cards sit in 3 equal columns.',
        constraints: 'Keep display: grid on #stats-grid.',
        visibleExamples: JSON.stringify([
          {
            input: 'Computed grid column tracks count on #stats-grid',
            output: '3 columns',
          },
        ]),
        hints: JSON.stringify([
          'Use grid-template-columns: repeat(3, 1fr); or grid-template-columns: 1fr 1fr 1fr;.',
        ]),
        xpPoints: 20,
        popularity: 112,
        testCases: [
          {
            title: 'Grid renders 3 column tracks',
            inputData: 'getComputedStyle(#stats-grid).gridTemplateColumns',
            expectedOutput: '3 track values',
            assertionScript:
              'const g = document.getElementById("stats-grid"); if (!g) return false; const cols = window.getComputedStyle(g).gridTemplateColumns.trim().split(/\\s+/); return cols.length === 3;',
            isHidden: false,
          },
        ],
      },
      {
        title: 'Fix Card Overflow & Box Sizing',
        slug: 'fix-mobile-overflow',
        description:
          'An input inside a card overflows horizontally past the card border because its width is 100% plus 20px padding without border-box sizing, and a long code token overflows the card.',
        bugDescription:
          '#search-input has box-sizing: content-box causing horizontal overflow, and #code-box has overflow-x: visible instead of auto or hidden.',
        difficulty: 'Hard',
        categoryId: cssCatId,
        language: 'CSS',
        starterHtml: `<div class="container-card">
  <input id="search-input" type="text" value="Search debugging challenges..." />
  <pre id="code-box">const superLongVariableIdentifierForDebugging = "attend_ai_platform_2026";</pre>
</div>`,
        starterCss: `body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; }
.container-card { width: 260px; background: #1e293b; padding: 16px; border-radius: 10px; border: 1px solid #334155; }
#search-input {
  width: 100%;
  padding: 10px 14px;
  /* BUG 1: content-box makes 100% + padding exceed parent width */
  box-sizing: content-box;
  border-radius: 6px;
  border: 1px solid #475569;
  background: #0f172a;
  color: #fff;
}
#code-box {
  margin-top: 12px;
  padding: 10px;
  background: #0f172a;
  /* BUG 2: Long code spills outside the container */
  overflow-x: visible;
}`,
        starterJs: ``,
        expectedBehavior:
          '#search-input must have box-sizing: border-box and #code-box must have overflow-x: auto (or hidden).',
        instructions:
          'Set box-sizing: border-box on #search-input and overflow-x: auto on #code-box.',
        constraints: 'Keep #search-input and #code-box selectors.',
        visibleExamples: JSON.stringify([
          {
            input: 'getComputedStyle(#search-input).boxSizing & getComputedStyle(#code-box).overflowX',
            output: 'border-box & auto',
          },
        ]),
        hints: JSON.stringify([
          'Change box-sizing: content-box to box-sizing: border-box on #search-input.',
          'Change overflow-x: visible to overflow-x: auto on #code-box.',
        ]),
        xpPoints: 30,
        popularity: 94,
        testCases: [
          {
            title: 'Input uses box-sizing: border-box',
            inputData: 'getComputedStyle(#search-input).boxSizing',
            expectedOutput: 'border-box',
            assertionScript:
              'const inp = document.getElementById("search-input"); return inp && window.getComputedStyle(inp).boxSizing === "border-box";',
            isHidden: false,
          },
          {
            title: 'Code box prevents horizontal overflow spill',
            inputData: 'getComputedStyle(#code-box).overflowX',
            expectedOutput: 'auto or hidden',
            assertionScript:
              'const pre = document.getElementById("code-box"); if (!pre) return false; const ox = window.getComputedStyle(pre).overflowX; return ox === "auto" || ox === "hidden" || ox === "scroll";',
            isHidden: false,
          },
        ],
      },

      // ================= JAVASCRIPT CHALLENGES (5) =================
      {
        title: 'Fix Counter Increment Logic',
        slug: 'fix-counter-logic',
        description:
          'A counter widget has an Increment (+1) button and a Reset button, but clicking Increment subtracts 1 instead of adding 1, and Reset sets the counter to 10 instead of 0.',
        bugDescription:
          'incrementCounter() uses count-- instead of count++, and resetCounter() sets count = 10 instead of count = 0.',
        difficulty: 'Easy',
        categoryId: jsCatId,
        language: 'JavaScript',
        starterHtml: `<div class="counter-card">
  <h2 id="count-display">0</h2>
  <div class="actions">
    <button id="inc-btn">Increment +1</button>
    <button id="reset-btn">Reset</button>
  </div>
</div>`,
        starterCss: `body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; }
.counter-card { background: #1e293b; padding: 24px; border-radius: 10px; text-align: center; width: 240px; }
.actions { display: flex; gap: 10px; justify-content: center; margin-top: 12px; }
button { padding: 8px 14px; border-radius: 6px; border: none; background: #6366f1; color: white; cursor: pointer; }`,
        starterJs: `let count = 0;
const display = document.getElementById('count-display');
const incBtn = document.getElementById('inc-btn');
const resetBtn = document.getElementById('reset-btn');

function updateUI() {
  display.textContent = String(count);
}

incBtn.addEventListener('click', () => {
  // BUG 1: Decrements instead of incrementing
  count--;
  updateUI();
});

resetBtn.addEventListener('click', () => {
  // BUG 2: Resets to 10 instead of 0
  count = 10;
  updateUI();
});`,
        expectedBehavior:
          'Clicking #inc-btn must increase #count-display by 1, and clicking #reset-btn must reset #count-display to 0.',
        instructions:
          'Fix the event listener logic in JavaScript so Increment adds 1 and Reset sets count back to 0.',
        constraints: 'Update #count-display textContent whenever count changes.',
        visibleExamples: JSON.stringify([
          {
            input: 'Click #inc-btn twice, then click #reset-btn',
            output: 'Display shows "2", then "0"',
          },
        ]),
        hints: JSON.stringify([
          'Replace count-- with count++ (or count += 1) inside the #inc-btn click handler.',
          'Set count = 0 inside the #reset-btn click handler.',
        ]),
        xpPoints: 10,
        popularity: 195,
        testCases: [
          {
            title: 'Clicking Increment increases counter by 1',
            inputData: 'incBtn.click() x2',
            expectedOutput: '2',
            assertionScript:
              'const inc = document.getElementById("inc-btn"); const reset = document.getElementById("reset-btn"); const disp = document.getElementById("count-display"); if (!inc || !reset || !disp) return false; reset.click(); inc.click(); inc.click(); return disp.textContent.trim() === "2";',
            isHidden: false,
          },
          {
            title: 'Clicking Reset sets counter back to 0',
            inputData: 'resetBtn.click()',
            expectedOutput: '0',
            assertionScript:
              'const inc = document.getElementById("inc-btn"); const reset = document.getElementById("reset-btn"); const disp = document.getElementById("count-display"); if (!inc || !reset || !disp) return false; inc.click(); reset.click(); return disp.textContent.trim() === "0";',
            isHidden: false,
          },
        ],
      },
      {
        title: 'Repair Password Length Validation',
        slug: 'repair-form-validation',
        description:
          'A password validation function validatePassword(pwd) should return "Valid" when a password is at least 8 characters long, and "Too short" otherwise. Currently the comparison operator is inverted.',
        bugDescription:
          'validatePassword(pwd) checks if (pwd.length < 8) return "Valid", which accepts short passwords and rejects valid ones.',
        difficulty: 'Easy',
        categoryId: jsCatId,
        language: 'JavaScript',
        starterHtml: `<div class="validator">
  <input id="pwd-input" type="text" value="secret123" />
  <button id="check-btn">Validate</button>
  <p id="status-msg"></p>
</div>`,
        starterCss: `body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; }
.validator { background: #1e293b; padding: 20px; border-radius: 10px; max-width: 300px; }`,
        starterJs: `function validatePassword(pwd) {
  // BUG: Condition is reversed! Passwords >= 8 chars should be "Valid"
  if (pwd.length < 8) {
    return "Valid";
  }
  return "Too short";
}

window.validatePassword = validatePassword;

document.getElementById('check-btn').addEventListener('click', () => {
  const val = document.getElementById('pwd-input').value;
  document.getElementById('status-msg').textContent = validatePassword(val);
});`,
        expectedBehavior:
          'validatePassword(pwd) must return "Valid" when pwd.length >= 8, and "Too short" when pwd.length < 8.',
        instructions:
          'Fix the comparison condition inside validatePassword(pwd) and keep window.validatePassword assigned.',
        constraints: 'Return exact strings "Valid" or "Too short".',
        visibleExamples: JSON.stringify([
          {
            input: 'validatePassword("secure123") / validatePassword("abc")',
            output: '"Valid" / "Too short"',
          },
        ]),
        hints: JSON.stringify([
          'Change if (pwd.length < 8) to if (pwd.length >= 8).',
        ]),
        xpPoints: 10,
        popularity: 154,
        testCases: [
          {
            title: 'Accepts passwords with 8 or more characters',
            inputData: 'validatePassword("secure123")',
            expectedOutput: 'Valid',
            assertionScript:
              'return typeof window.validatePassword === "function" && window.validatePassword("secure123") === "Valid" && window.validatePassword("12345678") === "Valid";',
            isHidden: false,
          },
          {
            title: 'Rejects passwords shorter than 8 characters',
            inputData: 'validatePassword("short")',
            expectedOutput: 'Too short',
            assertionScript:
              'return typeof window.validatePassword === "function" && window.validatePassword("short") === "Too short";',
            isHidden: false,
          },
        ],
      },
      {
        title: 'Fix Array Filtering for Passed Submissions',
        slug: 'fix-array-filtering',
        description:
          'The function getPassedScores(scores) should filter an array of numeric test scores and return only scores greater than or equal to 70, but it currently returns scores below 70.',
        bugDescription:
          'The .filter() callback checks score < 70 instead of score >= 70.',
        difficulty: 'Medium',
        categoryId: jsCatId,
        language: 'JavaScript',
        starterHtml: `<div class="card">
  <h4>Passed Scores (>= 70)</h4>
  <div id="result-list"></div>
</div>`,
        starterCss: `body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; }
.card { background: #1e293b; padding: 20px; border-radius: 8px; }`,
        starterJs: `function getPassedScores(scores) {
  // BUG: Filtering for failing scores instead of passing scores (>= 70)
  return scores.filter((score) => score < 70);
}

window.getPassedScores = getPassedScores;
document.getElementById('result-list').textContent = JSON.stringify(getPassedScores([45, 70, 88, 62, 95]));`,
        expectedBehavior:
          'getPassedScores([45, 70, 88, 62, 95]) must return [70, 88, 95].',
        instructions:
          'Fix the filter predicate inside getPassedScores(scores) so all scores >= 70 are returned.',
        constraints: 'Keep window.getPassedScores exposed on window.',
        visibleExamples: JSON.stringify([
          {
            input: 'getPassedScores([45, 70, 88, 62, 95])',
            output: '[70, 88, 95]',
          },
        ]),
        hints: JSON.stringify([
          'Use score >= 70 inside scores.filter(...).',
        ]),
        xpPoints: 20,
        popularity: 140,
        testCases: [
          {
            title: 'Returns scores >= 70 including boundary value 70',
            inputData: 'getPassedScores([45, 70, 88, 62, 95])',
            expectedOutput: '[70, 88, 95]',
            assertionScript:
              'if (typeof window.getPassedScores !== "function") return false; const res = window.getPassedScores([45, 70, 88, 62, 95]); return JSON.stringify(res) === JSON.stringify([70, 88, 95]);',
            isHidden: false,
          },
          {
            title: 'Returns empty array when all scores are below 70',
            inputData: 'getPassedScores([10, 50, 69])',
            expectedOutput: '[]',
            assertionScript:
              'const res = window.getPassedScores([10, 50, 69]); return Array.isArray(res) && res.length === 0;',
            isHidden: true,
          },
        ],
      },
      {
        title: 'Debug Todo List Item Addition',
        slug: 'debug-todo-list',
        description:
          'When a user types a task into #todo-input and clicks #add-todo-btn, a new <li> item should be appended to #todo-list. Currently it overwrites the entire list and reads the placeholder instead of the input value.',
        bugDescription:
          'The click handler uses todoInput.placeholder instead of todoInput.value, and replaces todoList.innerHTML instead of appending an <li> element.',
        difficulty: 'Medium',
        categoryId: jsCatId,
        language: 'JavaScript',
        starterHtml: `<div class="todo-app">
  <div class="row">
    <input id="todo-input" type="text" placeholder="Enter task..." value="Fix bug #4" />
    <button id="add-todo-btn">Add Task</button>
  </div>
  <ul id="todo-list">
    <li>Write unit tests</li>
  </ul>
</div>`,
        starterCss: `body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; }
.todo-app { background: #1e293b; padding: 20px; border-radius: 10px; max-width: 320px; }
.row { display: flex; gap: 8px; margin-bottom: 12px; }
input { flex: 1; padding: 8px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #fff; }
button { padding: 8px 12px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; }`,
        starterJs: `const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-todo-btn');
const todoList = document.getElementById('todo-list');

addBtn.addEventListener('click', () => {
  // BUG 1: Reads placeholder instead of current input value
  const text = todoInput.placeholder.trim();
  if (!text) return;

  // BUG 2: Overwrites existing list items instead of appending a new <li>
  todoList.innerHTML = '<li>' + text + '</li>';
});`,
        expectedBehavior:
          'Clicking #add-todo-btn must read todoInput.value.trim() and append a new <li> containing that text to #todo-list without deleting existing items.',
        instructions:
          'Read todoInput.value.trim(), create a new <li> element with document.createElement("li"), set its textContent, and append it to #todo-list.',
        constraints: 'Do not remove existing <li> items when adding a new task.',
        visibleExamples: JSON.stringify([
          {
            input: 'Set #todo-input value to "Deploy app" and click #add-todo-btn',
            output: '#todo-list has 2 <li> items, last item text is "Deploy app"',
          },
        ]),
        hints: JSON.stringify([
          'Use todoInput.value.trim() to get the user input.',
          'Create an element with const li = document.createElement("li"); li.textContent = text; todoList.appendChild(li);',
        ]),
        xpPoints: 20,
        popularity: 127,
        testCases: [
          {
            title: 'Appends new <li> with input value without removing existing items',
            inputData: 'todoInput.value = "Ship release"; addBtn.click()',
            expectedOutput: 'New <li> "Ship release" appended',
            assertionScript:
              'const inp = document.getElementById("todo-input"); const btn = document.getElementById("add-todo-btn"); const list = document.getElementById("todo-list"); if (!inp || !btn || !list) return false; const before = list.querySelectorAll("li").length; inp.value = "Ship release"; btn.click(); const items = list.querySelectorAll("li"); return items.length === before + 1 && items[items.length - 1].textContent.trim() === "Ship release";',
            isHidden: false,
          },
        ],
      },
      {
        title: 'Fix String Concatenation in Calculator',
        slug: 'fix-calculator-logic',
        description:
          'A calculator function calculateSum(a, b) reads values from text inputs and adds them together, but calculateSum("15", "25") returns "1525" instead of the number 40 because of string concatenation.',
        bugDescription:
          'calculateSum(a, b) performs a + b directly on string inputs without converting them using Number(a) + Number(b).',
        difficulty: 'Hard',
        categoryId: jsCatId,
        language: 'JavaScript',
        starterHtml: `<div class="calc">
  <input id="num-a" type="number" value="15" />
  <span>+</span>
  <input id="num-b" type="number" value="25" />
  <button id="sum-btn">=</button>
  <strong id="sum-output">?</strong>
</div>`,
        starterCss: `body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; }
.calc { display: flex; align-items: center; gap: 8px; background: #1e293b; padding: 16px; border-radius: 8px; }
input { width: 65px; padding: 6px; background: #0f172a; color: #fff; border: 1px solid #334155; border-radius: 4px; }
button { padding: 6px 12px; background: #6366f1; color: #fff; border: none; border-radius: 4px; cursor: pointer; }`,
        starterJs: `function calculateSum(a, b) {
  // BUG: If a or b are strings from input.value, '+' concatenates them!
  return a + b;
}

window.calculateSum = calculateSum;

document.getElementById('sum-btn').addEventListener('click', () => {
  const a = document.getElementById('num-a').value;
  const b = document.getElementById('num-b').value;
  document.getElementById('sum-output').textContent = String(calculateSum(a, b));
});`,
        expectedBehavior:
          'calculateSum("15", "25") must return the number 40, and clicking #sum-btn must display "40" in #sum-output.',
        instructions:
          'Convert both parameters a and b to numbers inside calculateSum(a, b) using Number(a) + Number(b).',
        constraints: 'calculateSum must return a numeric value (typeof === "number").',
        visibleExamples: JSON.stringify([
          {
            input: 'calculateSum("15", "25")',
            output: '40',
          },
        ]),
        hints: JSON.stringify([
          'HTML input .value is always a string. Wrap both arguments with Number(a) + Number(b).',
        ]),
        xpPoints: 30,
        popularity: 176,
        testCases: [
          {
            title: 'calculateSum("15", "25") returns number 40',
            inputData: 'calculateSum("15", "25")',
            expectedOutput: '40',
            assertionScript:
              'return typeof window.calculateSum === "function" && window.calculateSum("15", "25") === 40;',
            isHidden: false,
          },
          {
            title: 'Handles decimal string inputs accurately',
            inputData: 'calculateSum("12.5", "7.5")',
            expectedOutput: '20',
            assertionScript:
              'return typeof window.calculateSum === "function" && window.calculateSum("12.5", "7.5") === 20;',
            isHidden: true,
          },
        ],
      },
    ];

    for (const ch of challengeData) {
      const [insertedProblem] = await db
        .insert(problems)
        .values({
          title: ch.title,
          slug: ch.slug,
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
          visibleExamples: ch.visibleExamples,
          hints: ch.hints,
          xpPoints: ch.xpPoints,
          isPublished: true,
          popularity: ch.popularity,
        })
        .onConflictDoNothing()
        .returning();

      if (insertedProblem && ch.testCases.length > 0) {
        await db.insert(problemTestCases).values(
          ch.testCases.map((tc) => ({
            problemId: insertedProblem.id,
            title: tc.title,
            inputData: tc.inputData,
            expectedOutput: tc.expectedOutput,
            assertionScript: tc.assertionScript,
            isHidden: tc.isHidden,
          }))
        );
      }
    }

    // 4. Seed realistic leaderboard profiles
    const sampleUsers = [
      {
        uid: 'user-sarah-chen-002',
        email: 'sarah@attendai.dev',
        username: 'sarah_debugs',
        fullName: 'Sarah Chen',
        bio: 'Frontend Engineer passionate about clean CSS Grid and accessible HTML.',
        role: 'student',
        totalXp: 120,
        streak: 5,
      },
      {
        uid: 'user-rohan-verma-003',
        email: 'rohan@attendai.dev',
        username: 'rohan_js',
        fullName: 'Rohan Verma',
        bio: 'Computer Science senior practicing DOM debugging and JS algorithms.',
        role: 'student',
        totalXp: 90,
        streak: 4,
      },
    ];

    const allProblems = await db.select().from(problems);
    const todayStr = new Date().toISOString().split('T')[0];

    for (const u of sampleUsers) {
      await db
        .insert(users)
        .values({
          uid: u.uid,
          email: u.email,
          username: u.username,
          fullName: u.fullName,
          bio: u.bio,
          role: u.role,
          totalXp: u.totalXp,
          emailVerified: true,
        })
        .onConflictDoNothing();

      await db
        .insert(userStreaks)
        .values({
          userId: u.uid,
          currentStreak: u.streak,
          longestStreak: u.streak + 2,
          lastActivityDate: todayStr,
        })
        .onConflictDoNothing();
    }

    // Add initial solved progress & submissions for sample leaderboard users
    if (allProblems.length >= 6) {
      const sampleSolvedMap = [
        { uid: 'user-sarah-chen-002', count: 8 },
        { uid: 'user-rohan-verma-003', count: 6 },
      ];

      for (const entry of sampleSolvedMap) {
        for (let i = 0; i < Math.min(entry.count, allProblems.length); i++) {
          const prob = allProblems[i];
          await db.insert(userProgress).values({
            userId: entry.uid,
            problemId: prob.id,
            isSolved: true,
            firstSolvedAt: new Date(Date.now() - i * 86400000),
            attempts: 1,
          });
          await db.insert(submissions).values({
            userId: entry.uid,
            problemId: prob.id,
            language: prob.language,
            submittedHtml: prob.starterHtml,
            submittedCss: prob.starterCss,
            submittedJs: prob.starterJs,
            status: 'Passed',
            passedTests: 2,
            totalTests: 2,
            executionTime: 11 + (i % 7),
            xpEarned: prob.xpPoints,
            aiFeedback:
              'All test assertions passed. Root cause identified and resolved cleanly.',
            createdAt: new Date(Date.now() - i * 43200000),
          });
        }
      }
    }

    await ensureMultiDomainSeeded();
    console.log('Attend AI database seed completed.');
  } catch (error) {
    console.error('Database seed warning:', error);
  }
}
