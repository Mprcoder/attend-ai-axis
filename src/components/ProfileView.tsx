import React, { useEffect, useState } from 'react';
import {
  Pencil,
  Flame,
  BarChart2,
  History,
  Award,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface ProfileViewProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const { user, apiFetch } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [statsSummary, setStatsSummary] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [profRes, statsRes] = await Promise.all([
          apiFetch('/api/profile'),
          apiFetch('/api/progress/stats'),
        ]);
        if (profRes.ok && active) {
          setProfileData(await profRes.json());
        }
        if (statsRes.ok && active) {
          setStatsSummary(await statsRes.json());
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user]);

  const prof = profileData?.profile || user;
  const stats = profileData?.stats;
  const achievements = profileData?.achievements || [];
  const recentSubs = profileData?.recentSubmissions || [];
  const domainProgress = statsSummary?.domainProgress || [];

  const initialLetter = prof?.fullName
    ? prof.fullName.charAt(0).toUpperCase()
    : 'U';

  // Build a 12-week (84-day) activity heatmap from recentSubmissions
  const heatmapCells = Array.from({ length: 84 }).map((_, idx) => {
    const dayDate = new Date(Date.now() - (83 - idx) * 86400000)
      .toISOString()
      .split('T')[0];
    const count = recentSubs.filter(
      (s: any) => s.createdAt && s.createdAt.startsWith(dayDate)
    ).length;
    return { date: dayDate, count };
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Main Profile Card */}
      <div className="bg-[#121420] border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg">
        <div
          className="h-32 bg-gradient-to-r from-[#1A163A] via-[#1C1B38] to-[#14182C] relative"
          style={{
            backgroundImage:
              'radial-gradient(rgba(129, 140, 248, 0.22) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />

        <div className="px-6 sm:px-8 pb-7">
          <div className="flex items-end justify-between -mt-10 mb-5">
            {prof?.avatarUrl ? (
              <img
                src={prof.avatarUrl}
                alt={prof.fullName || 'User Avatar'}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl border-4 border-[#121420] object-cover bg-indigo-600"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-indigo-500 border-4 border-[#121420] flex items-center justify-center text-2xl font-bold text-white shadow-md">
                {initialLetter}
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {prof?.fullName || 'Your Profile'}
            </h1>
            <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-3">
              <span>@{prof?.username || 'username'}</span>
              <span>·</span>
              <span>{prof?.email || ''}</span>
              {prof?.createdAt && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Joined {new Date(prof.createdAt).toLocaleDateString()}
                    </span>
                  </span>
                </>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 pt-1">
              {prof?.bio ||
                'Full-Stack & Multi-Domain Engineer practicing Web Dev, DSA, Data Science, and AI on Attend AI.'}
            </p>
          </div>

          {/* 4 Metric Row */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-indigo-400 font-mono tabular-nums">
                {stats ? stats.problemsSolved : 10}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Questions Solved
              </div>
            </div>

            <div>
              <div className="text-xl font-bold text-amber-400 font-mono tabular-nums flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{stats ? stats.currentStreak : 7}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">Day Streak</div>
            </div>

            <div>
              <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
                {stats ? `${stats.accuracy}%` : '100%'}
              </div>
              <div className="text-xs text-slate-400 mt-1">Accuracy</div>
            </div>

            <div>
              <div className="text-xl font-bold text-purple-400 font-mono tabular-nums">
                {stats ? `${stats.totalXp} XP` : `${prof?.totalXp || 160} XP`}
              </div>
              <div className="text-xs text-slate-400 mt-1">Total XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Domain-Wise Progress Card */}
      <div className="bg-[#121420] border border-slate-800/90 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>Domain-Wise Progress Breakdown</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            5 Practice Domains
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {domainProgress.map((dom: any) => (
            <div
              key={dom.name}
              className="p-4 rounded-xl bg-[#0D0E17] border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => onNavigate('problems', { domain: dom.name })}
                  className="font-semibold text-white hover:text-indigo-400 cursor-pointer"
                >
                  {dom.name}
                </button>
                <span className="font-mono text-slate-400 tabular-nums">
                  {dom.solvedCount}/{dom.totalCount} solved ({dom.progressPct}%)
                </span>
              </div>
              <div className="h-2 bg-[#16192B] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${Math.max(5, dom.progressPct || 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements & Gamification Badges */}
      <div className="bg-[#121420] border border-slate-800/90 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Achievements &amp; Domain Explorer Badges</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {achievements.filter((a: any) => a.earned).length}/
            {achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {achievements.map((ach: any) => (
            <div
              key={ach.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                ach.earned
                  ? 'bg-indigo-950/30 border-indigo-500/40 text-white'
                  : 'bg-[#0D0E17] border-slate-800/80 text-slate-400 opacity-75'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  ach.earned ? 'text-emerald-400' : 'text-slate-600'
                }`}
              />
              <div>
                <div className="text-xs font-bold">{ach.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {ach.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 12-Week Activity Heatmap */}
      <div className="bg-[#121420] border border-slate-800/90 rounded-2xl p-6 space-y-3">
        <div className="text-sm font-bold text-white">
          84-Day Coding Activity Heatmap
        </div>
        <div className="grid grid-cols-12 sm:grid-cols-28 gap-1.5 pt-1">
          {heatmapCells.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.count} submissions`}
              className={`h-3.5 rounded-sm ${
                cell.count >= 2
                  ? 'bg-emerald-400'
                  : cell.count === 1
                  ? 'bg-indigo-500'
                  : 'bg-[#1A1D2E]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Submission History Card */}
      <div className="bg-[#121420] border border-slate-800/90 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <History className="w-4 h-4 text-indigo-400" />
            <span>Recent Submission History</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('submissions')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            View All →
          </button>
        </div>

        {recentSubs.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No submissions recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {recentSubs.slice(0, 6).map((s: any) => (
              <div
                key={s.id}
                className="p-3 rounded-xl bg-[#0D0E17] border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-white">
                    Challenge #{s.problemId} ({s.language})
                  </span>
                  <span className="text-slate-500 ml-2 font-mono">
                    {s.passedTests}/{s.totalTests} tests · {s.executionTime}ms
                  </span>
                </div>
                <div className="font-mono">
                  <span
                    className={
                      s.status === 'Passed'
                        ? 'text-emerald-400 font-semibold'
                        : 'text-rose-400 font-semibold'
                    }
                  >
                    {s.status === 'Passed' ? 'Accepted' : 'Wrong Answer'}
                  </span>
                  {s.xpEarned > 0 && (
                    <span className="text-indigo-400 ml-2">
                      +{s.xpEarned} XP
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
