import React, { useEffect, useState } from 'react';
import { History, CheckCircle2, XCircle, Eye, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface SubmissionsHistoryViewProps {
  onNavigate: (page: string, params?: any) => void;
}

export const SubmissionsHistoryView: React.FC<SubmissionsHistoryViewProps> = ({
  onNavigate,
}) => {
  const { user, apiFetch } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await apiFetch('/api/submissions/history');
        if (res.ok && active) {
          setSubmissions(await res.json());
        }
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto bg-[#121420] border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-white">Submission History &amp; Progress</h2>
        <p className="text-xs text-slate-400">
          Sign in to inspect your past code submissions, passed test counts, and AI
          feedback logs.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-400" />
          <span>My Progress &amp; Submission History</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Every code submission, deterministic test result, and local AI code review.
        </p>
      </div>

      {/* Selected Submission Detail Drawer */}
      {selectedSub && (
        <div className="bg-[#121420] border border-indigo-800/70 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Submission #{selectedSub.id} — {selectedSub.problemTitle}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {selectedSub.language} · {selectedSub.status} ({selectedSub.passedTests}/
                {selectedSub.totalTests} tests) ·{' '}
                {selectedSub.createdAt
                  ? new Date(selectedSub.createdAt).toLocaleString()
                  : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSub(null)}
              className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg cursor-pointer"
            >
              Close Details
            </button>
          </div>

          {selectedSub.aiFeedback && (
            <div className="bg-[#0B0C14] border border-slate-800 rounded-xl p-4 space-y-1.5">
              <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Local AI Feedback</span>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {selectedSub.aiFeedback}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#0B0C14] border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] font-mono text-slate-400 mb-1">
                Submitted HTML
              </div>
              <pre className="text-xs font-mono text-slate-200 overflow-x-auto max-h-40">
                {selectedSub.submittedHtml || '// Empty'}
              </pre>
            </div>
            <div className="bg-[#0B0C14] border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] font-mono text-slate-400 mb-1">
                Submitted CSS
              </div>
              <pre className="text-xs font-mono text-slate-200 overflow-x-auto max-h-40">
                {selectedSub.submittedCss || '/* Empty */'}
              </pre>
            </div>
            <div className="bg-[#0B0C14] border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] font-mono text-slate-400 mb-1">
                Submitted JS
              </div>
              <pre className="text-xs font-mono text-slate-200 overflow-x-auto max-h-40">
                {selectedSub.submittedJs || '// Empty'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Table */}
      <div className="bg-[#121420] border border-slate-800/90 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0D0E17] text-xs font-semibold text-slate-400">
                <th className="py-3.5 px-5">Problem Title</th>
                <th className="py-3.5 px-5">Language</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Tests Passed</th>
                <th className="py-3.5 px-5 text-right">Exec Time</th>
                <th className="py-3.5 px-5 text-right">XP Earned</th>
                <th className="py-3.5 px-5 text-right">Submitted At</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading submission history...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No submissions yet. Solve a challenge to populate your history.
                  </td>
                </tr>
              ) : (
                submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#171A2B] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-white">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate('workspace', { problemId: s.problemId })
                        }
                        className="hover:text-indigo-400 cursor-pointer"
                      >
                        {s.problemTitle}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-300">
                      {s.language}
                    </td>
                    <td className="py-3.5 px-5">
                      {s.status === 'Passed' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Passed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Failed</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums text-slate-300">
                      {s.passedTests}/{s.totalTests}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums text-slate-400">
                      {s.executionTime ?? 12}ms
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums text-indigo-400 font-semibold">
                      +{s.xpEarned} XP
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-400">
                      {s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSub(s)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
