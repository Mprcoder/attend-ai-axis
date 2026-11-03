/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Trophy,
  Globe,
  Code2,
  User,
  Settings,
  Shield,
  Flame,
  FolderOpen,
  Menu,
  X,
  LogIn,
  LogOut,
  Cpu,
  Terminal,
  Database,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { AuthViews } from './components/AuthViews.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ProblemsView } from './components/ProblemsView.tsx';
import { WorkspaceView } from './components/WorkspaceView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';
import { SubmissionsHistoryView } from './components/SubmissionsHistoryView.tsx';
import { AdminView } from './components/AdminView.tsx';

const AUTH_PAGES = new Set([
  'login',
  'signup',
  'verify-email',
  'forgot-password',
  'reset-password',
]);

const getHomePage = (role?: string) => (role === 'admin' ? 'admin' : 'dashboard');

function AppShell() {
  const { user, clearSession, loading } = useAuth();
  // Default page is now 'landing' so unauthenticated visitors see the public landing page first
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [navParams, setNavParams] = useState<any>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarResizeRef = useRef<{ startX: number; startWidth: number } | null>(
    null
  );

  useEffect(() => {
    if (loading) return;
    
    // If user is logged in and is on landing/auth pages, redirect to their home dashboard
    if (user && (currentPage === 'login' || currentPage === 'signup' || currentPage === 'landing')) {
      setCurrentPage(getHomePage(user.role));
    } 
    // If user is not logged in and tries to access a protected page (not auth pages and not landing), force login
    else if (!user && !AUTH_PAGES.has(currentPage) && currentPage !== 'landing') {
      setCurrentPage('login');
    } else if (user && currentPage === 'admin' && user.role !== 'admin') {
      setCurrentPage('dashboard');
    }
  }, [currentPage, loading, user]);

  const handleNavigate = (page: string, params: any = {}) => {
    const targetPage = !user && !AUTH_PAGES.has(page) && page !== 'landing'
      ? 'login'
      : user && page === 'admin' && user.role !== 'admin'
        ? 'dashboard'
        : page;
    setCurrentPage(targetPage);
    setNavParams(params);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNavigate('problems', {
      domain: 'All',
      language: 'All',
      searchQuery: globalSearch.trim(),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0C14] text-slate-300 flex items-center justify-center">
        Verifying your session...
      </div>
    );
  }

  // If user is not authenticated and trying to view auth pages directly
  if (
    !user &&
    (currentPage === 'login' ||
      currentPage === 'signup' ||
      currentPage === 'verify-email' ||
      currentPage === 'forgot-password' ||
      currentPage === 'reset-password')
  ) {
    return (
      <AuthViews
        mode={
          currentPage as
            | 'login'
            | 'signup'
            | 'verify-email'
            | 'forgot-password'
            | 'reset-password'
        }
        redirectAfterAuth={navParams?.redirectTo || 'dashboard'}
        onNavigate={handleNavigate}
      />
    );
  }

  // Render Public Landing Page
  if (currentPage === 'landing' && !user) {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  const getHeaderTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Multi-Domain Learning Dashboard';
      case 'problems':
        if (navParams?.domain && navParams.domain !== 'All') {
          return `${navParams.domain} Challenges`;
        }
        if (navParams?.language && navParams.language !== 'All') {
          return `${navParams.language} Challenges`;
        }
        return 'All Practice Domains & Challenges';
      case 'workspace':
        return 'Coding, DSA & AI Workspace';
      case 'profile':
        return 'Developer Profile & Domain Progress';
      case 'settings':
        return 'Account Settings';
      case 'leaderboard':
        return 'Global & Domain Leaderboard';
      case 'submissions':
        return 'My Progress & Submissions';
      case 'admin':
        return 'Admin Multi-Domain Suite';
      default:
        return 'Attend AI';
    }
  };

  const navLinkClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
      active
        ? 'bg-[#1D2036] text-white font-semibold border border-indigo-500/30'
        : 'text-slate-400 hover:text-slate-200 hover:bg-[#141625]'
    } ${sidebarCollapsed ? 'justify-center px-2' : ''}`;

  return (
    <div className="app-theme app-shell min-h-screen bg-[#0B0C14] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <aside
        style={{ width: sidebarCollapsed ? 72 : sidebarWidth }}
        className={`app-sidebar fixed inset-y-0 left-0 z-40 bg-[#0D0E17] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto">
          {/* Top Brand Lockup */}
          <div className={`relative p-5 border-b border-slate-800/80 flex items-center ${sidebarCollapsed ? 'justify-center p-3' : 'justify-between'}`}>
            <button
              type="button"
              onClick={() => handleNavigate(user ? 'dashboard' : 'landing')}
              className="flex items-center gap-3 text-left cursor-pointer"
              title="Attend AI"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-mono font-bold text-white text-sm shadow-md shadow-indigo-600/20">
                &lt;/&gt;
              </div>
              {!sidebarCollapsed && <div>
                <div className="text-base font-bold text-white leading-tight">
                  Attend AI
                </div>
                <div className="text-[11px] text-indigo-400 font-medium">
                  Coding, DSA &amp; AI Platform
                </div>
              </div>}
            </button>
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="hidden lg:inline-flex text-slate-400 hover:text-white cursor-pointer"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="hidden lg:inline-flex absolute left-[52px] top-8 text-slate-400 hover:text-white cursor-pointer"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sidebar Sections */}
          <div className={`p-4 space-y-6 ${sidebarCollapsed ? 'px-2' : ''}`}>
            {/* MAIN */}
            <div className="space-y-1">
              {!sidebarCollapsed && <div className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                Main
              </div>}
              <button
                type="button"
                onClick={() => handleNavigate('dashboard')}
                className={navLinkClass(currentPage === 'dashboard')}
                title={sidebarCollapsed ? 'Dashboard' : undefined}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                {!sidebarCollapsed && <span>Dashboard</span>}
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('submissions')}
                className={navLinkClass(currentPage === 'submissions')}
                title={sidebarCollapsed ? 'My Progress' : undefined}
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                {!sidebarCollapsed && <span>My Progress</span>}
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('leaderboard')}
                className={navLinkClass(currentPage === 'leaderboard')}
                title={sidebarCollapsed ? 'Leaderboard' : undefined}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                {!sidebarCollapsed && <span>Leaderboard</span>}
              </button>
            </div>

            {/* PRACTICE DOMAINS */}
            <div className="space-y-1">
              {!sidebarCollapsed && <div className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                Practice Domains
              </div>}
              <button
                type="button"
                onClick={() =>
                  handleNavigate('problems', { domain: 'All', language: 'All' })
                }
                className={navLinkClass(
                  currentPage === 'problems' &&
                    (!navParams?.domain || navParams.domain === 'All') &&
                    (!navParams?.language || navParams.language === 'All')
                )}
                title={sidebarCollapsed ? 'All Challenges' : undefined}
              >
                <FolderOpen className="w-4 h-4 text-indigo-400" />
                {!sidebarCollapsed && <span>All Challenges</span>}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleNavigate('problems', {
                    domain: 'Data Structures & Algorithms',
                  })
                }
                className={navLinkClass(
                  currentPage === 'problems' &&
                    navParams?.domain === 'Data Structures & Algorithms'
                )}
                title={sidebarCollapsed ? 'DSA Problems' : undefined}
              >
                <Cpu className="w-4 h-4 text-emerald-400" />
                {!sidebarCollapsed && <span>DSA Problems</span>}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleNavigate('problems', {
                    domain: 'Programming Languages',
                  })
                }
                className={navLinkClass(
                  currentPage === 'problems' &&
                    navParams?.domain === 'Programming Languages'
                )}
                title={sidebarCollapsed ? 'Python / C++ / Java' : undefined}
              >
                <Terminal className="w-4 h-4 text-amber-400" />
                {!sidebarCollapsed && <span>Python / C++ / Java</span>}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleNavigate('problems', { domain: 'Web Development' })
                }
                className={navLinkClass(
                  currentPage === 'problems' &&
                    navParams?.domain === 'Web Development'
                )}
                title={sidebarCollapsed ? 'Web Dev' : undefined}
              >
                <Globe className="w-4 h-4 text-sky-400" />
                {!sidebarCollapsed && <span>Web Dev</span>}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleNavigate('problems', {
                    domain: 'Data Science & Analytics',
                  })
                }
                className={navLinkClass(
                  currentPage === 'problems' &&
                    navParams?.domain === 'Data Science & Analytics'
                )}
                title={sidebarCollapsed ? 'Data Science & SQL' : undefined}
              >
                <Database className="w-4 h-4 text-cyan-400" />
                {!sidebarCollapsed && <span>Data Science &amp; SQL</span>}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleNavigate('problems', {
                    domain: 'AI & Machine Learning',
                  })
                }
                className={navLinkClass(
                  currentPage === 'problems' &&
                    navParams?.domain === 'AI & Machine Learning'
                )}
                title={sidebarCollapsed ? 'AI & Machine Learning' : undefined}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                {!sidebarCollapsed && <span>AI &amp; Machine Learning</span>}
              </button>
            </div>

            {/* ACCOUNT */}
            <div className="space-y-1">
              {!sidebarCollapsed && <div className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                Account
              </div>}
              <button
                type="button"
                onClick={() => handleNavigate('profile')}
                className={navLinkClass(currentPage === 'profile')}
                title={sidebarCollapsed ? 'Profile' : undefined}
              >
                <User className="w-4 h-4 text-slate-400" />
                {!sidebarCollapsed && <span>Profile</span>}
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('settings')}
                className={navLinkClass(currentPage === 'settings')}
                title={sidebarCollapsed ? 'Settings' : undefined}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                {!sidebarCollapsed && <span>Settings</span>}
              </button>
              {user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleNavigate('admin')}
                  className={navLinkClass(currentPage === 'admin')}
                  title={sidebarCollapsed ? 'Admin Panel' : undefined}
                >
                  <Shield className="w-4 h-4 text-rose-400" />
                  {!sidebarCollapsed && <span>Admin Panel</span>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom User Profile Bar */}
        <div className={`p-4 border-t border-slate-800/80 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          <button
            type="button"
            onClick={() => handleNavigate(user ? 'profile' : 'login')}
            className="flex items-center gap-3 text-left truncate cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user ? (
                user.fullName.charAt(0).toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            {!sidebarCollapsed && <div className="truncate">
              <div className="text-xs font-bold text-white truncate">
                {user ? user.fullName : 'Guest'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {user ? user.email : 'Click to Sign In'}
              </div>
            </div>}
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => {
                clearSession();
                handleNavigate('landing');
              }}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNavigate('login')}
              title="Sign In"
              className="p-2 text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
      <div
        className="app-sidebar-resize hidden lg:flex"
        role="separator"
        aria-label="Resize navigation sidebar"
        aria-orientation="vertical"
        aria-valuenow={sidebarCollapsed ? 72 : sidebarWidth}
        aria-valuemin={180}
        aria-valuemax={420}
        tabIndex={0}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          sidebarResizeRef.current = {
            startX: event.clientX,
            startWidth: sidebarCollapsed ? 72 : sidebarWidth,
          };
          setSidebarCollapsed(false);
        }}
        onPointerMove={(event) => {
          if (!sidebarResizeRef.current) return;
          const nextWidth =
            sidebarResizeRef.current.startWidth +
            event.clientX -
            sidebarResizeRef.current.startX;
          setSidebarWidth(Math.min(420, Math.max(180, nextWidth)));
        }}
        onPointerUp={() => {
          sidebarResizeRef.current = null;
        }}
        onPointerCancel={() => {
          sidebarResizeRef.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          setSidebarCollapsed(false);
          setSidebarWidth((width) =>
            Math.min(420, Math.max(180, width + (event.key === 'ArrowRight' ? 16 : -16)))
          );
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Global Challenge Search */}
        <header className="h-16 px-6 border-b border-slate-800/80 bg-[#0D0E17]/80 backdrop-blur flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium text-slate-200 truncate">
              {getHeaderTitle()}
            </div>
          </div>

          {/* Global Challenge Search Bar */}
          <form
            onSubmit={handleGlobalSearchSubmit}
            className="hidden md:flex items-center relative max-w-xs w-full"
          >
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search Python, DSA, SQL, ML, JS..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#141726] border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </form>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-1.5 rounded-full bg-[#161826] border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5 font-mono tabular-nums">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{user ? `${user.totalXp} XP` : '0 XP'}</span>
              <span className="text-slate-500">streak</span>
            </div>

            {user ? (
              <button
                type="button"
                onClick={() => handleNavigate('profile')}
                className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">
                  {user.fullName.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavigate('login')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Active Page View */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {currentPage === 'dashboard' && (
            <DashboardView onNavigate={handleNavigate} />
          )}

          {currentPage === 'problems' && (
            <ProblemsView
              initialDomain={navParams?.domain}
              initialTopic={navParams?.topic}
              initialLanguage={navParams?.language}
              initialCategory={navParams?.categoryId}
              initialSearch={navParams?.searchQuery}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'workspace' && (
            <WorkspaceView
              problemId={Number(navParams?.problemId) || 1}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'profile' && (
            <ProfileView onNavigate={handleNavigate} />
          )}

          {currentPage === 'settings' && (
            <SettingsView onNavigate={handleNavigate} />
          )}

          {currentPage === 'leaderboard' && <LeaderboardView />}

          {currentPage === 'submissions' && (
            <SubmissionsHistoryView onNavigate={handleNavigate} />
          )}

          {currentPage === 'admin' && <AdminView onNavigate={handleNavigate} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}