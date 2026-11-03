import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Trophy,
  Percent,
  BarChart3,
  Globe,
  ArrowRight,
  Flame,
  Cpu,
  Terminal,
  Database,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface DashboardViewProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, apiFetch } = useAuth();
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/api/progress/stats');
        if (res.ok && active) {
          const data = await res.json();
          setStatsData(data);
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadStats();
    return () => {
      active = false;
    };
  }, [user]);

  const solvedDisplay = String(statsData?.problemsSolved ?? 10);
  const streakDisplay = String(statsData?.currentStreak ?? 7);
  const attemptsDisplay = String(statsData?.totalAttempts ?? 12);
  const accuracyDisplay = `${statsData?.accuracy ?? 100}%`;
  const rankDisplay = statsData?.rank ? `#${statsData.rank}` : '#1';
  const xpDisplay = `${statsData?.totalXp ?? user?.totalXp ?? 160} XP`;

  const weeklyActivity: number[] = statsData?.weeklyActivity || [
    1, 2, 1, 3, 2, 1, 2,
  ];
  const maxDayCount = Math.max(1, ...weeklyActivity);
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const domainProgress: any[] = statsData?.domainProgress || [];

  const getDomainVisual = (name: string) => {
    if (name.includes('Data Structures') || name.includes('DSA')) {
      return {
        icon: <Cpu className="w-5 h-5 text-emerald-400" />,
        bg: 'bg-emerald-950/70 border-emerald-800/40',
        bar: 'bg-emerald-500',
        badge: 'text-emerald-400',
        btn: 'text-emerald-400 hover:text-emerald-300',
      };
    }
    if (name.includes('Programming')) {
      return {
        icon: <Terminal className="w-5 h-5 text-amber-400" />,
        bg: 'bg-amber-950/70 border-amber-800/40',
        bar: 'bg-amber-500',
        badge: 'text-amber-400',
        btn: 'text-amber-400 hover:text-amber-300',
      };
    }
    if (name.includes('Data Science')) {
      return {
        icon: <Database className="w-5 h-5 text-sky-400" />,
        bg: 'bg-sky-950/70 border-sky-800/40',
        bar: 'bg-sky-500',
        badge: 'text-sky-400',
        btn: 'text-sky-400 hover:text-sky-300',
      };
    }
    if (name.includes('AI') || name.includes('Machine Learning')) {
      return {
        icon: <Sparkles className="w-5 h-5 text-purple-400" />,
        bg: 'bg-purple-950/70 border-purple-800/40',
        bar: 'bg-purple-500',
        badge: 'text-purple-400',
        btn: 'text-purple-400 hover:text-purple-300',
      };
    }
    return {
      icon: <Globe className="w-5 h-5 text-indigo-400" />,
      bg: 'bg-indigo-950/70 border-indigo-800/40',
      bar: 'bg-indigo-500',
      badge: 'text-indigo-400',
      btn: 'text-indigo-400 hover:text-indigo-300',
    };
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner Card */}
      <div className="bg-gradient-to-r from-[#141728] via-[#131524] to-[#111320] border border-slate-800/90 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-indigo-400 flex items-center gap-2">
            <span>Welcome back</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-indigo-300 tabular-nums">
              {xpDisplay}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {user ? user.fullName : 'Developer'} 👋
          </h1>
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            Master Web Development, Python, C++, Java, Data Structures &amp;
            Algorithms, SQL, Data Science, and AI/Machine Learning with real-time
            deterministic testing and local Llama 3.2 AI guidance.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-[#1A1D30] border border-slate-800 rounded-xl px-5 py-3.5 text-center min-w-[96px]">
            <div className="text-xl font-bold text-white font-mono tabular-nums">
              {solvedDisplay}
            </div>
            <div className="text-xs text-slate-400 mt-1">Solved</div>
          </div>
          <div className="bg-[#231D1B] border border-amber-900/40 rounded-xl px-5 py-3.5 text-center min-w-[110px]">
            <div className="text-xl font-bold text-amber-400 font-mono tabular-nums flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{streakDisplay}</span>
            </div>
            <div className="text-xs text-amber-400/90 mt-1">Day Streak</div>
          </div>
        </div>
      </div>

      {/* 4 Stat KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#121420] border border-slate-800/90 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/70 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {statsData?.problemsAttempted ?? 10}/{statsData?.totalProblems ?? 34}{' '}
              Questions
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {attemptsDisplay}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Total Questions Attempted
            </div>
          </div>
        </div>

        <div className="bg-[#121420] border border-slate-800/90 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-xs text-emerald-400 font-mono tabular-nums">
              {xpDisplay}
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
              {solvedDisplay}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Total Questions Solved
            </div>
          </div>
        </div>

        <div className="bg-[#121420] border border-slate-800/90 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-950/70 border border-sky-800/40 flex items-center justify-center text-sky-400">
              <Percent className="w-5 h-5" />
            </div>
            <span className="text-xs text-sky-400 font-mono">Verified Tests</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-400 font-mono tabular-nums">
              {accuracyDisplay}
            </div>
            <div className="text-xs text-slate-400 mt-1">Overall Accuracy</div>
          </div>
        </div>

        <div className="bg-[#121420] border border-slate-800/90 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-950/70 border border-purple-800/40 flex items-center justify-center text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={() => onNavigate('leaderboard')}
              className="text-xs text-purple-400 hover:text-purple-300 font-mono cursor-pointer"
            >
              View Board →
            </button>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400 font-mono tabular-nums">
              {rankDisplay}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Global Leaderboard Rank
            </div>
          </div>
        </div>
      </div>

      {/* Explore Practice Domains Section (5 Domains) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">
              Explore Practice Domains
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a domain to practice topic-wise coding, debugging, SQL, and AI
              challenges
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {domainProgress.length || 5} Domains Available ·{' '}
            {statsData?.totalProblems ?? 34} Total Challenges
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {domainProgress.map((dom: any) => {
            const vis = getDomainVisual(dom.name);
            const topicsList: string[] = Array.isArray(dom.topics)
              ? dom.topics
              : [];
            return (
              <div
                key={dom.id || dom.name}
                className="bg-[#121420] hover:border-slate-700 border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between transition-all hover:-translate-y-0.5"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center ${vis.bg}`}
                    >
                      {vis.icon}
                    </div>
                    <span className={`text-xs font-mono font-medium ${vis.badge}`}>
                      {dom.difficultyInfo || 'Beginner to Hard'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{dom.name}</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                      {dom.description}
                    </p>
                  </div>

                  {/* Topic Preview Chips */}
                  {topicsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {topicsList.slice(0, 5).map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() =>
                            onNavigate('problems', {
                              domain: dom.name,
                              topic,
                            })
                          }
                          className="px-2 py-0.5 text-[11px] font-mono bg-[#0B0C14] hover:bg-slate-800 border border-slate-800 rounded text-slate-300 cursor-pointer"
                        >
                          {topic}
                        </button>
                      ))}
                      {topicsList.length > 5 && (
                        <span className="px-2 py-0.5 text-[11px] font-mono text-slate-500">
                          +{topicsList.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Progress Bar & Stats */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">
                        Completed: {dom.solvedCount}/{dom.totalCount}
                      </span>
                      <span className="text-white font-semibold">
                        {dom.progressPct}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#0B0C14] rounded-full overflow-hidden border border-slate-800/80">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${vis.bar}`}
                        style={{ width: `${Math.max(4, dom.progressPct || 0)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-5 flex items-center justify-between border-t border-slate-800/60 mt-5">
                  <span className="text-xs text-slate-500 font-mono">
                    {dom.totalCount} Challenges
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate('problems', { domain: dom.name })
                    }
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${vis.btn}`}
                  >
                    <span>Start Practicing</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Row: Domain-Wise Progress Tracker + Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Domain-Wise Progress Overview */}
        <div className="lg:col-span-5 bg-[#121420] border border-slate-800/90 rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-white">
              Domain-Wise Mastery Progress
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Separate completion tracking across all 5 engineering domains
            </p>
          </div>

          <div className="space-y-4">
            {domainProgress.map((dom: any) => {
              const vis = getDomainVisual(dom.name);
              return (
                <div key={dom.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate('problems', { domain: dom.name })
                      }
                      className="font-semibold text-slate-200 hover:text-indigo-400 cursor-pointer"
                    >
                      {dom.name}
                    </button>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {dom.solvedCount}/{dom.totalCount} ({dom.progressPct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-[#0B0C14] rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full ${vis.bar}`}
                      style={{ width: `${Math.max(4, dom.progressPct || 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weekly Activity Bar Chart */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                7-Day Submission Activity
              </span>
              <span className="text-xs font-mono text-slate-400">
                {weeklyActivity.reduce((a, b) => a + b, 0)} submissions
              </span>
            </div>
            <div className="h-28 flex items-end justify-between gap-2.5 pt-3 px-2">
              {weeklyActivity.map((count, idx) => {
                const heightPct = Math.max(
                  12,
                  Math.round((count / maxDayCount) * 100)
                );
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                      {count}
                    </span>
                    <div
                      className={`w-full max-w-[24px] rounded-t-md ${
                        count > 0 ? 'bg-indigo-500' : 'bg-slate-800/80'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-slate-500">
                      {dayLabels[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recommended Next Challenges & Recently Attempted */}
        <div className="lg:col-span-7 bg-[#121420] border border-slate-800/90 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Recommended Next Challenges
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hand-picked unsolved challenges across Web Dev, Python, DSA, SQL,
                  and AI/ML
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('problems', { domain: 'All' })}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                Explore All {statsData?.totalProblems ?? 34} →
              </button>
            </div>

            <div className="space-y-3">
              {(statsData?.recommendedProblems || [])
                .slice(0, 4)
                .map((prob: any) => (
                  <div
                    key={prob.id}
                    className="bg-[#171A2B] border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-[#20243A] text-indigo-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                        #{prob.id}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {prob.title}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {prob.description}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5 font-mono flex-wrap">
                          <span className="text-indigo-300">
                            {prob.domain || 'Web Development'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{prob.topic || prob.language}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              prob.difficulty === 'Beginner' ||
                              prob.difficulty === 'Easy'
                                ? 'text-emerald-400'
                                : prob.difficulty === 'Medium'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }
                          >
                            {prob.difficulty}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-indigo-400 tabular-nums">
                            +{prob.xpPoints} XP
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onNavigate('workspace', { problemId: prob.id })
                      }
                      className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl inline-flex items-center gap-1.5 shrink-0 self-end sm:self-center transition-colors cursor-pointer"
                    >
                      <span>Solve</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Recently Attempted Questions */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Recently Attempted Questions</span>
              </h4>
              <button
                type="button"
                onClick={() => onNavigate('submissions')}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Full History →
              </button>
            </div>
            {loading ? (
              <div className="text-xs text-slate-500 py-2">
                Loading recent activity...
              </div>
            ) : statsData?.recentActivity && statsData.recentActivity.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {statsData.recentActivity.slice(0, 4).map((act: any) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() =>
                      onNavigate('workspace', { problemId: act.problemId })
                    }
                    className="text-left p-3 rounded-xl bg-[#0D0E17] border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        {act.problemTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {act.domain || act.language} · {act.topic || act.language}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-mono font-semibold shrink-0 ${
                        act.status === 'Passed'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {act.status === 'Passed' ? 'Accepted' : 'Attempted'}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-2">
                No recent submissions yet. Select a challenge above to begin!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
