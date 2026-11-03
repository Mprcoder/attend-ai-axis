import React, { useEffect, useState } from 'react';
import { Trophy, Flame, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

const LEADERBOARD_DOMAINS = [
  'All',
  'Web Development',
  'Programming Languages',
  'Data Structures & Algorithms',
  'Data Science & Analytics',
  'AI & Machine Learning',
];

export const LeaderboardView: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [rankings, setRankings] = useState<any[]>([]);
  const [period, setPeriod] = useState<'all' | 'monthly' | 'weekly'>('all');
  const [domain, setDomain] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'xp' | 'solved' | 'streak' | 'accuracy'>(
    'xp'
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(
          `/api/leaderboard?period=${period}&sortBy=${sortBy}&domain=${encodeURIComponent(
            domain
          )}`
        );
        if (res.ok && active) {
          setRankings(await res.json());
        }
      } catch (err) {
        console.error('Error loading leaderboard:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [period, sortBy, domain]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>
              {domain === 'All' ? 'Global' : domain} Leaderboard
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Compare developer performance across global, domain-wise, monthly,
            and weekly rankings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sort Metric Selector */}
          <div className="flex items-center gap-1 p-1 bg-[#121420] border border-slate-800 rounded-xl text-xs">
            {(
              [
                { id: 'xp', label: 'Total XP' },
                { id: 'solved', label: 'Solved' },
                { id: 'streak', label: 'Streak' },
                { id: 'accuracy', label: 'Accuracy' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSortBy(opt.id)}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-colors cursor-pointer ${
                  sortBy === opt.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Period Toggle: All-Time, Monthly, Weekly */}
          <div className="flex items-center gap-1 p-1 bg-[#121420] border border-slate-800 rounded-xl">
            {(
              [
                { id: 'all', label: 'All-Time' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'weekly', label: 'Weekly' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  period === p.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Domain-Wise Leaderboard Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mr-1 shrink-0">
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>Domain:</span>
        </span>
        {LEADERBOARD_DOMAINS.map((dom) => {
          const active = domain === dom;
          return (
            <button
              key={dom}
              type="button"
              onClick={() => setDomain(dom)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300'
                  : 'bg-[#121420] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {dom === 'All' ? 'All Domains (Global)' : dom}
            </button>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#121420] border border-slate-800/90 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0D0E17] text-xs font-semibold text-slate-400">
                <th className="py-3.5 px-5">Rank</th>
                <th className="py-3.5 px-5">Developer</th>
                <th className="py-3.5 px-5 text-right">Solved Questions</th>
                <th className="py-3.5 px-5 text-right">Accuracy</th>
                <th className="py-3.5 px-5 text-right">Day Streak</th>
                <th className="py-3.5 px-5 text-right">
                  {domain === 'All' ? 'Total XP' : `${domain} XP`}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading leaderboard rankings...
                  </td>
                </tr>
              ) : rankings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No developers ranked yet.
                  </td>
                </tr>
              ) : (
                rankings.map((row) => {
                  const isCurrentUser = user && user.uid === row.uid;
                  return (
                    <tr
                      key={row.uid}
                      className={`hover:bg-[#171A2B] transition-colors ${
                        isCurrentUser ? 'bg-indigo-950/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-5 font-mono font-bold tabular-nums">
                        <span
                          className={
                            row.rank === 1
                              ? 'text-amber-400'
                              : row.rank === 2
                              ? 'text-slate-200'
                              : row.rank === 3
                              ? 'text-amber-600'
                              : 'text-slate-400'
                          }
                        >
                          #{row.rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {row.avatarUrl ? (
                            <img
                              src={row.avatarUrl}
                              alt={row.fullName}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full object-cover bg-indigo-600"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                              {(row.fullName || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{row.fullName}</span>
                              {isCurrentUser && (
                                <span className="text-[11px] font-mono text-indigo-400">
                                  (You)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              @{row.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums text-emerald-400 font-semibold">
                        {row.problemsSolved}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums text-sky-400">
                        {row.accuracy ?? 100}%
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums text-amber-400">
                        <span className="inline-flex items-center justify-end gap-1">
                          <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{row.streak}d</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold tabular-nums text-indigo-400">
                        {row.totalXp} XP
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
