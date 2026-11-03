# Attend AI

**Find the Bug. Fix the Code. Improve Your Skills.**

Attend AI is an AI-powered coding practice and debugging platform inspired by LeetCode, VS Code, and GitHub. Students improve their programming and debugging skills by inspecting, fixing, running, and submitting pre-written buggy HTML, CSS, and JavaScript challenges.

> **Important:** Attend AI is a coding practice and debugging platform. It is **not** an attendance management system.

---

## Core Architecture & Features

1. **Email + Password Authentication Only**:
   - Complete Signup, Email Verification, Login, Forgot Password, Reset Password, Session Validation, and Logout flows.
   - No Google OAuth or social login buttons anywhere in the application.

2. **15 Seeded Debugging Challenges & 45 Test Cases**:
   - **5 HTML Challenges**: Broken Login Form, Missing Navigation Links, Incorrect Image Attributes, Form Label Associations, Table Structure.
   - **5 CSS Challenges**: Button Styling, Centered Login Card, Responsive Navbar, 3-Column Grid Layout, Mobile Overflow.
   - **5 JavaScript Challenges**: Counter Increment/Reset Logic, Password Length Validation, Array Filtering, Todo List DOM Addition, Calculator String Concatenation.
   - Every challenge includes **visible** (`is_hidden = false`) and **hidden** (`is_hidden = true`) test cases in PostgreSQL.

3. **Split-Screen Monaco Coding Workspace & Deterministic Evaluation Engine**:
   - Multi-tab Monaco Editor (`index.html`, `styles.css`, `script.js`), isolated `<iframe sandbox="allow-scripts">` live preview, console output capture, and deterministic test runner.
   - **Critical Rule**: Deterministic test cases decide pass/fail. AI is never used as the pass/fail judge.

4. **Local Ollama AI Debugging Mentor (`llama3.2:3b`)**:
   - Programming Q&A, progressive hints (Levels 1–3), bug root-cause explanations, failed-test debugging, and post-solution reviews.
   - The Express backend sends requests to `http://localhost:11434/api/chat`; the browser never contacts Ollama directly.
   - Input sanitization and per-client sliding-window rate limiting on `/api/ai/assist` and `/api/ai/chat`.

5. **Real PostgreSQL Progress, Anti-Farming XP, Streaks, Leaderboard, and Admin Panel**:
   - XP (`Easy = 10`, `Medium = 20`, `Hard = 30`) is awarded only on the first solve (`user_progress.is_solved`).
   - Role-protected Admin Challenge Manager (`role = 'admin'`) for adding, editing, publishing, and deleting challenges, starter code, hints, XP, and visible/hidden test cases.

---

## Accounts & Roles

Create a student account from the Sign Up page. New accounts receive the student role.
Administrator access must be provisioned by an authorized operator; public signup
cannot create or promote an administrator account.

---

## Local Ollama Setup

Install Ollama, then download the required model once:

```powershell
ollama pull llama3.2:3b
```

Keep Ollama running locally. The Ollama app usually starts its service automatically; otherwise run `ollama serve` in a separate terminal.

---

## Running & Building

The main application is the React app in `src/`, served by the Express API in `server.ts`. It also requires the project's configured PostgreSQL database.

```powershell
# Install dependencies
npm install

# Start the full-stack Express + Vite server on port 3000
npm run dev

# Type-check & build production bundle
npm run lint
npm run build
```

## Testing the Local AI Assistant

Sign in, open a coding challenge, and select **AI Feedback** in the workspace output panel. Use a hint/debug action or ask a question in the Llama 3.2 chat box. For a direct backend test:

```powershell
$body = @{
  messages = @(
    @{ role = "user"; content = "Explain a Python list comprehension in one short example." }
  )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/ai/chat" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

The API reports a clear service error if Ollama is stopped or `llama3.2:3b` is missing. Submission evaluation and progress recording continue even when local AI is offline.
