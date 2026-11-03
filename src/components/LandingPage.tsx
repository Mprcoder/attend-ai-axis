import React from 'react';
import { Code2, Bug, Terminal, Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#0B0C14] text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b border-slate-800/80 bg-[#0B0C14]/90 backdrop-blur sticky top-0 z-30">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('landing');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          Attend AI
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a
            href="#features"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            How It Works
          </a>
          <button
            type="button"
            onClick={() => onNavigate('problems')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Challenges
          </button>
          <button
            type="button"
            onClick={() => onNavigate('leaderboard')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Leaderboard
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs font-medium text-indigo-400 tracking-wide">
              AI-Powered Coding Practice & Debugging Platform
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              Find the Bug. Fix the Code. Improve Your Skills.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Stop staring at blank files. Attend AI gives you real-world HTML, CSS, and
              JavaScript codebases containing intentional bugs. Inspect the broken logic,
              test your fix in a sandboxed workspace, pass deterministic test suites, and
              receive guided explanations from the locally running Llama 3.2 model.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Explore Workspace
              </button>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-4 py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Log In to Existing Account
              </button>
            </div>

            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-6 max-w-lg">
              <div>
                <div className="text-2xl font-bold text-white tabular-nums">15+</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Curated Debugging Challenges
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white tabular-nums">3</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Core Web Languages (HTML, CSS, JS)
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white tabular-nums">100%</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Deterministic Test Verification
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Code Preview Window */}
          <div className="lg:col-span-5 bg-[#121420] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-4 py-3 bg-[#0D0E17] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <Bug className="w-3.5 h-3.5 text-amber-400" />
                <span>challenge_11_counter_logic.js</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Easy · 10 XP</span>
            </div>
            <div className="p-5 font-mono text-xs sm:text-sm space-y-2 leading-relaxed">
              <div className="text-slate-500">
                1 &nbsp;incBtn.addEventListener(&apos;click&apos;, () =&gt; &#123;
              </div>
              <div className="bg-rose-950/40 text-rose-300 px-2 py-1 rounded">
                2 &nbsp;&nbsp;&nbsp;- count--; &nbsp;// Bug: Decrements instead of adding 1
              </div>
              <div className="bg-emerald-950/40 text-emerald-300 px-2 py-1 rounded">
                3 &nbsp;&nbsp;&nbsp;+ count++; &nbsp;// Fix: Increments counter state
              </div>
              <div className="text-slate-300">4 &nbsp;&nbsp;&nbsp;updateUI();</div>
              <div className="text-slate-500">5 &nbsp;&#125;);</div>
            </div>
            <div className="px-5 py-4 bg-[#0D0E17] border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  All 2/2 Deterministic Assertions Passed
                </span>
                <span className="text-indigo-400 font-mono tabular-nums">+10 XP Earned</span>
              </div>
              <p className="text-xs text-slate-400">
                Llama 3.2 Mentor: &ldquo;Replacing the post-decrement operator (count--)
                with count++ ensures the state advances on each click.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-slate-800/80 py-16 lg:py-20 bg-[#0D0E17]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-2xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Engineered for Practical Debugging Mastery
              </h2>
              <p className="text-sm sm:text-base text-slate-400 mt-2">
                Real engineering interviews and production jobs test how well you read,
                diagnose, and repair existing code.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#121420] border border-slate-800 rounded-xl p-6 space-y-3">
                <Code2 className="w-6 h-6 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">
                  Pre-Written Buggy Code
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Every challenge loads directly with realistic HTML, CSS, and JavaScript
                  starter code containing subtle layout, attribute, or logic defects.
                </p>
              </div>

              <div className="bg-[#121420] border border-slate-800 rounded-xl p-6 space-y-3">
                <Terminal className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">
                  Deterministic Test Engine
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Solutions are verified against visible and hidden test assertions inside
                  an isolated sandbox. Pass/fail is 100% deterministic.
                </p>
              </div>

              <div className="bg-[#121420] border border-slate-800 rounded-xl p-6 space-y-3">
                <Sparkles className="w-6 h-6 text-amber-400" />
                <h3 className="text-base font-semibold text-white">
                  Local Llama 3.2 Debugging Mentor
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Request progressive hints, root-cause bug analysis, and post-solution
                  architectural reviews powered by your local Ollama model.
                </p>
              </div>

              <div className="bg-[#121420] border border-slate-800 rounded-xl p-6 space-y-3">
                <ShieldCheck className="w-6 h-6 text-sky-400" />
                <h3 className="text-base font-semibold text-white">
                  XP, Streaks & Leaderboard
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Earn 10, 20, or 30 XP on your first solve, build daily streaks, unlock
                  developer badges, and climb the global leaderboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="border-t border-slate-800/80 py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-2xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                How Attend AI Works
              </h2>
              <p className="text-sm sm:text-base text-slate-400 mt-2">
                A structured four-step workflow designed after VS Code, GitHub, and
                LeetCode.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[#121420] border border-slate-800 rounded-xl p-6 space-y-2">
                <div className="text-xs font-mono text-indigo-400">01. Select Challenge</div>
                <h3 className="text-base font-semibold text-white">Inspect the Bug</h3>
                <p className="text-sm text-slate-400">
                  Pick from 15+ HTML, CSS, and JavaScript challenges filtered by
                  difficulty and category.
                </p>
              </div>
              <div className="bg-[#121420] border border-slate-800 rounded-xl p-6 space-y-2">
                <div className="text-xs font-mono text-indigo-400">02. Edit & Preview</div>
                <h3 className="text-base font-semibold text-white">Run in Sandbox</h3>
                <p className="text-sm text-slate-400">
                  Modify the code in the multi-tab editor and inspect the live preview and
                  console logs.
                </p>
              </div>
              <div className="bg-[#121420] border border-slate-800 rounded-xl p-6 space-y-2">
                <div className="text-xs font-mono text-indigo-400">03. Pass Tests</div>
                <h3 className="text-base font-semibold text-white">Submit Solution</h3>
                <p className="text-sm text-slate-400">
                  Our deterministic test runner verifies both visible and hidden test
                  cases before marking solved.
                </p>
              </div>
              <div className="bg-[#121420] border border-slate-800 rounded-xl p-6 space-y-2">
                <div className="text-xs font-mono text-indigo-400">04. Level Up</div>
                <h3 className="text-base font-semibold text-white">Review AI Feedback</h3>
                <p className="text-sm text-slate-400">
                  Read the local AI’s explanation of why the bug happened and earn XP toward
                  your rank.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 lg:px-12 bg-[#0D0E17]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-300">Attend AI</span> · Find the Bug.
            Fix the Code. Improve Your Skills.
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate('problems')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Problems Library
            </button>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
