import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Pencil,
  ExternalLink,
  X,
  Globe,
  Users,
  Activity,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AdminViewProps {
  onNavigate: (page: string, params?: any) => void;
}

interface AdminTestCaseInput {
  title: string;
  inputData: string;
  expectedOutput: string;
  assertionScript: string;
  isHidden: boolean;
}

const DOMAIN_TOPICS_MAP: Record<string, string[]> = {
  'Web Development': [
    'HTML',
    'CSS',
    'JavaScript',
    'React.js',
    'Node.js',
    'Express.js',
  ],
  'Programming Languages': ['Python', 'C', 'C++', 'Java'],
  'Data Structures & Algorithms': [
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
  ],
  'Data Science & Analytics': [
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
  ],
  'AI & Machine Learning': [
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
  ],
};

export const AdminView: React.FC<AdminViewProps> = ({ onNavigate }) => {
  const { apiFetch } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<
    'challenges' | 'domains' | 'submissions' | 'users'
  >('challenges');

  const [problems, setProblems] = useState<any[]>([]);
  const [domainsList, setDomainsList] = useState<any[]>([]);
  const [adminSubmissions, setAdminSubmissions] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showEditorForm, setShowEditorForm] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<number | null>(null);

  // Challenge Form State
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('Data Structures & Algorithms');
  const [topic, setTopic] = useState('Arrays');
  const [difficulty, setDifficulty] = useState('Easy');
  const [xpPoints, setXpPoints] = useState<number>(20);
  const [estimatedTime, setEstimatedTime] = useState('15 mins');
  const [language, setLanguage] = useState('Python');
  const [categoryId, setCategoryId] = useState(1);
  const [description, setDescription] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [inputFormat, setInputFormat] = useState('nums = [2, 7, 11, 15], target = 9');
  const [outputFormat, setOutputFormat] = useState('[0, 1]');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [instructions, setInstructions] = useState('');
  const [constraints, setConstraints] = useState('');
  const [starterHtml, setStarterHtml] = useState('');
  const [starterCss, setStarterCss] = useState('');
  const [starterJs, setStarterJs] = useState('# Write starter code here');
  const [hints, setHints] = useState<string[]>([
    'Inspect the buggy condition or logic carefully.',
    'Compare current output against expected behavior.',
  ]);
  const [testCases, setTestCases] = useState<AdminTestCaseInput[]>([
    {
      title: 'Sample Test Case #1',
      inputData: 'Sample Input',
      expectedOutput: 'Pass',
      assertionScript: 'return true;',
      isHidden: false,
    },
    {
      title: 'Hidden Edge Case #1',
      inputData: 'Hidden Input',
      expectedOutput: 'Pass',
      assertionScript: 'return true;',
      isHidden: true,
    },
  ]);

  // Domain Form State
  const [domainName, setDomainName] = useState('');
  const [domainDesc, setDomainDesc] = useState('');
  const [domainDiffInfo, setDomainDiffInfo] = useState('Beginner to Hard');
  const [domainTopicsInput, setDomainTopicsInput] = useState('');

  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [probRes, domRes, subRes, usrRes] = await Promise.all([
        apiFetch('/api/admin/problems'),
        apiFetch('/api/admin/domains'),
        apiFetch('/api/admin/submissions'),
        apiFetch('/api/admin/users'),
      ]);
      if (probRes.ok) setProblems(await probRes.json());
      if (domRes.ok) setDomainsList(await domRes.json());
      if (subRes.ok) setAdminSubmissions(await subRes.json());
      if (usrRes.ok) setAdminUsers(await usrRes.json());
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const resetFormForCreate = () => {
    setEditingProblemId(null);
    setTitle('');
    setDomain('Data Structures & Algorithms');
    setTopic('Arrays');
    setDifficulty('Easy');
    setXpPoints(25);
    setEstimatedTime('15 mins');
    setLanguage('Python');
    setCategoryId(1);
    setDescription('');
    setBugDescription('');
    setInputFormat('Standard function input');
    setOutputFormat('Expected return output');
    setExpectedBehavior('');
    setInstructions('Inspect the starter code, fix the bug, and run tests.');
    setConstraints('Time Complexity: O(n)');
    setStarterHtml('');
    setStarterCss('');
    setStarterJs('# Starter code with bug\ndef solve(nums):\n    return nums');
    setHints([
      'Inspect the buggy condition or logic carefully.',
      'Compare current output against expected behavior.',
    ]);
    setTestCases([
      {
        title: 'Sample Verification Case',
        inputData: 'Sample Input',
        expectedOutput: 'Pass',
        assertionScript: 'return true;',
        isHidden: false,
      },
      {
        title: 'Hidden Verification Case',
        inputData: 'Hidden Input',
        expectedOutput: 'Pass',
        assertionScript: 'return true;',
        isHidden: true,
      },
    ]);
    setShowEditorForm(true);
  };

  const handleOpenEdit = (prob: any) => {
    setEditingProblemId(prob.id);
    setTitle(prob.title || '');
    setDomain(prob.domain || 'Web Development');
    setTopic(prob.topic || prob.language || 'HTML');
    setDifficulty(prob.difficulty || 'Easy');
    setXpPoints(Number(prob.xpPoints) || 10);
    setEstimatedTime(prob.estimatedTime || '12 mins');
    setLanguage(prob.language || 'HTML');
    setCategoryId(Number(prob.categoryId) || 1);
    setDescription(prob.description || '');
    setBugDescription(prob.bugDescription || '');
    setInputFormat(prob.inputFormat || '');
    setOutputFormat(prob.outputFormat || '');
    setExpectedBehavior(prob.expectedBehavior || '');
    setInstructions(prob.instructions || '');
    setConstraints(prob.constraints || '');
    setStarterHtml(prob.starterHtml || '');
    setStarterCss(prob.starterCss || '');
    setStarterJs(prob.starterJs || '');

    const parsedHints = Array.isArray(prob.hintsList)
      ? prob.hintsList
      : ['Inspect the starter code carefully.'];
    setHints(parsedHints.length > 0 ? parsedHints : ['']);

    const existingTcs = Array.isArray(prob.testCases) ? prob.testCases : [];
    setTestCases(
      existingTcs.length > 0
        ? existingTcs.map((tc: any) => ({
            title: tc.title || '',
            inputData: tc.inputData || '',
            expectedOutput: tc.expectedOutput || 'Pass',
            assertionScript: tc.assertionScript || 'return true;',
            isHidden: Boolean(tc.isHidden),
          }))
        : [
            {
              title: 'Primary check',
              inputData: 'Check',
              expectedOutput: 'Pass',
              assertionScript: 'return true;',
              isHidden: false,
            },
          ]
    );
    setShowEditorForm(true);
    setStatusMsg('');
    setErrorMsg('');
  };

  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');
    try {
      const payload = {
        title,
        domain,
        topic,
        difficulty,
        xpPoints: Number(xpPoints) || 10,
        estimatedTime,
        language,
        categoryId,
        description,
        bugDescription,
        inputFormat,
        outputFormat,
        expectedBehavior,
        instructions,
        constraints,
        starterHtml,
        starterCss,
        starterJs,
        hints: hints.map((h) => h.trim()).filter(Boolean),
        testCases: testCases.filter((tc) => tc.title.trim()),
      };

      const url = editingProblemId
        ? `/api/admin/problems/${editingProblemId}`
        : '/api/admin/problems';
      const method = editingProblemId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to save challenge.');
        return;
      }

      setStatusMsg(
        editingProblemId
          ? `Challenge "${data.title}" updated successfully!`
          : `Challenge "${data.title}" created and published in ${domain}!`
      );
      setShowEditorForm(false);
      setEditingProblemId(null);
      await loadAllAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving challenge.');
    }
  };

  const handleTogglePublish = async (id: number) => {
    try {
      const res = await apiFetch(`/api/admin/problems/${id}/publish`, {
        method: 'POST',
      });
      if (res.ok) {
        await loadAllAdminData();
      }
    } catch (err) {
      console.error('Publish toggle error:', err);
    }
  };

  const handleDeleteProblem = async (id: number) => {
    try {
      const res = await apiFetch(`/api/admin/problems/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStatusMsg(`Challenge #${id} deleted.`);
        await loadAllAdminData();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');
    try {
      const topics = domainTopicsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await apiFetch('/api/admin/domains', {
        method: 'POST',
        body: JSON.stringify({
          name: domainName,
          description: domainDesc,
          difficultyInfo: domainDiffInfo,
          topics,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create domain.');
        return;
      }
      setStatusMsg(`Domain "${data.name}" saved successfully!`);
      setDomainName('');
      setDomainDesc('');
      setDomainTopicsInput('');
      await loadAllAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save domain.');
    }
  };

  const handleToggleDomainActive = async (id: number) => {
    try {
      const res = await apiFetch(`/api/admin/domains/${id}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ hardDelete: false }),
      });
      if (res.ok) {
        await loadAllAdminData();
      }
    } catch (err) {
      console.error('Toggle domain error:', err);
    }
  };

  const totalTestCasesCount = problems.reduce(
    (sum, p) => sum + (Array.isArray(p.testCases) ? p.testCases.length : 0),
    0
  );

  const availableTopicsForSelectedDomain =
    DOMAIN_TOPICS_MAP[domain] || ['General'];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Admin Multi-Domain Platform Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage domains, create multi-domain challenges, configure sample &amp;
            hidden test cases, inspect submissions, and view analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { id: 'challenges', label: 'Challenges', icon: BarChart3 },
              { id: 'domains', label: 'Domains', icon: Globe },
              { id: 'submissions', label: 'Submissions', icon: Activity },
              { id: 'users', label: 'Users', icon: Users },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeAdminTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveAdminTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  active
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-[#121420] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin KPI Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#121420] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Practice Domains</div>
          <div className="text-2xl font-bold text-indigo-400 font-mono tabular-nums mt-1">
            {domainsList.length || 5}
          </div>
        </div>
        <div className="bg-[#121420] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Total Challenges</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
            {problems.length}
          </div>
        </div>
        <div className="bg-[#121420] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Configured Test Cases</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
            {totalTestCasesCount}
          </div>
        </div>
        <div className="bg-[#121420] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Registered Developers</div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums mt-1">
            {adminUsers.length}
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/70 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/70 text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: CHALLENGES MANAGER */}
      {activeAdminTab === 'challenges' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (showEditorForm) {
                  setShowEditorForm(false);
                  setEditingProblemId(null);
                } else {
                  resetFormForCreate();
                }
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              {showEditorForm ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Close Challenge Editor</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create New Challenge</span>
                </>
              )}
            </button>
          </div>

          {showEditorForm && (
            <form
              onSubmit={handleSaveProblem}
              className="bg-[#121420] border border-indigo-500/40 rounded-2xl p-6 space-y-5"
            >
              <h2 className="text-base font-bold text-white">
                {editingProblemId
                  ? `Edit Challenge #${editingProblemId}`
                  : 'Create New Multi-Domain Challenge'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Challenge Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g., DSA Arrays: Fix Subarray Sum"
                    className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Practice Domain
                  </label>
                  <select
                    value={domain}
                    onChange={(e) => {
                      const nextDom = e.target.value;
                      setDomain(nextDom);
                      const firstTopic =
                        (DOMAIN_TOPICS_MAP[nextDom] || [])[0] || 'General';
                      setTopic(firstTopic);
                    }}
                    className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
                  >
                    {Object.keys(DOMAIN_TOPICS_MAP).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Topic
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
                  >
                    {availableTopicsForSelectedDomain.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
                  >
                    {[
                      'Python',
                      'JavaScript',
                      'HTML',
                      'CSS',
                      'React.js',
                      'Node.js',
                      'Express.js',
                      'C',
                      'C++',
                      'Java',
                      'SQL',
                    ].map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
                  >
                    {['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'].map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    XP Reward
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={xpPoints}
                    onChange={(e) => setXpPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Estimated Time
                  </label>
                  <input
                    type="text"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    placeholder="15 mins"
                    className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Problem Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Bug / Task Diagnostic
                  </label>
                  <textarea
                    rows={2}
                    value={bugDescription}
                    onChange={(e) => setBugDescription(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Starter Code ({language})
                </label>
                <textarea
                  rows={5}
                  value={starterJs}
                  onChange={(e) => setStarterJs(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditorForm(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  {editingProblemId ? 'Update Challenge' : 'Publish Challenge'}
                </button>
              </div>
            </form>
          )}

          {/* Problems Table */}
          <div className="bg-[#121420] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0D0E17] text-slate-400">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Domain &amp; Topic</th>
                    <th className="py-3 px-4">Language</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">XP</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {problems.map((p) => (
                    <tr key={p.id} className="hover:bg-[#171A2B]">
                      <td className="py-3 px-4 font-mono text-slate-400">
                        #{p.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {p.title}
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-300">
                        {p.domain || 'Web Development'} · {p.topic || p.language}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {p.language}
                      </td>
                      <td className="py-3 px-4 font-mono">{p.difficulty}</td>
                      <td className="py-3 px-4 font-mono text-indigo-400">
                        {p.xpPoints} XP
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onNavigate('workspace', { problemId: p.id })
                            }
                            title="Open in Workspace"
                            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Challenge"
                            className="p-1.5 rounded bg-slate-800 text-indigo-400 hover:text-indigo-300 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(p.id)}
                            title={p.isPublished ? 'Unpublish' : 'Publish'}
                            className="p-1.5 rounded bg-slate-800 text-emerald-400 cursor-pointer"
                          >
                            {p.isPublished ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProblem(p.id)}
                            title="Delete"
                            className="p-1.5 rounded bg-slate-800 text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOMAINS MANAGER */}
      {activeAdminTab === 'domains' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveDomain}
            className="lg:col-span-5 bg-[#121420] border border-slate-800 rounded-2xl p-6 space-y-4 self-start"
          >
            <h2 className="text-base font-bold text-white">
              Create or Update Practice Domain
            </h2>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Domain Name
              </label>
              <input
                type="text"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                required
                placeholder="e.g., Cloud & DevOps Engineering"
                className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Short Description
              </label>
              <textarea
                rows={2}
                value={domainDesc}
                onChange={(e) => setDomainDesc(e.target.value)}
                required
                placeholder="Dockerfiles, Kubernetes manifests, CI/CD pipelines..."
                className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Difficulty Range
              </label>
              <input
                type="text"
                value={domainDiffInfo}
                onChange={(e) => setDomainDiffInfo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Topics (comma-separated)
              </label>
              <input
                type="text"
                value={domainTopicsInput}
                onChange={(e) => setDomainTopicsInput(e.target.value)}
                placeholder="Docker, Kubernetes, GitHub Actions, Linux"
                className="w-full px-3 py-2 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Save Practice Domain
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {domainsList.map((dom) => (
              <div
                key={dom.id}
                className="bg-[#121420] border border-slate-800 rounded-2xl p-5 flex items-start justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {dom.name}
                    </span>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                        dom.isActive
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {dom.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{dom.description}</p>
                  <div className="text-[11px] font-mono text-indigo-300">
                    {dom.challengeCount || 0} Challenges · {dom.difficultyInfo}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleDomainActive(dom.id)}
                  className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg shrink-0 cursor-pointer"
                >
                  {dom.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SUBMISSIONS INSPECTOR */}
      {activeAdminTab === 'submissions' && (
        <div className="bg-[#121420] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0D0E17] text-slate-400">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Developer</th>
                  <th className="py-3 px-4">Challenge</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4">Tests</th>
                  <th className="py-3 px-4">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {adminSubmissions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#171A2B]">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      #{s.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {s.userFullName} (@{s.username})
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {s.problemTitle}
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-300">
                      {s.domain}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={
                          s.status === 'Passed'
                            ? 'text-emerald-400 font-semibold'
                            : 'text-rose-400 font-semibold'
                        }
                      >
                        {s.status === 'Passed' ? 'Accepted' : 'Wrong Answer'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {s.passedTests}/{s.totalTests}
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-400">
                      +{s.xpEarned} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USERS DIRECTORY */}
      {activeAdminTab === 'users' && (
        <div className="bg-[#121420] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0D0E17] text-slate-400">
                  <th className="py-3 px-4">Developer</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Solved</th>
                  <th className="py-3 px-4">Streak</th>
                  <th className="py-3 px-4">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {adminUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-[#171A2B]">
                    <td className="py-3 px-4 font-semibold text-white">
                      {u.fullName} (@{u.username})
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {u.email}
                    </td>
                    <td className="py-3 px-4 font-mono uppercase text-indigo-400">
                      {u.role}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400">
                      {u.problemsSolved}
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-400">
                      {u.streak}d
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      {u.totalXp} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
