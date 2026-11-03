import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  Timer,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface ProblemsViewProps {
  initialDomain?: string;
  initialTopic?: string;
  initialLanguage?: string;
  initialCategory?: number;
  initialSearch?: string;
  onNavigate: (page: string, params?: any) => void;
}

const DOMAIN_OPTIONS = [
  'All',
  'Web Development',
  'Programming Languages',
  'Data Structures & Algorithms',
  'Data Science & Analytics',
  'AI & Machine Learning',
];

const DIFFICULTY_RANK: Record<string, number> = {
  Beginner: 1,
  Easy: 2,
  Medium: 3,
  Hard: 4,
  Expert: 5,
};

export const ProblemsView: React.FC<ProblemsViewProps> = ({
  initialDomain = 'All',
  initialTopic = 'All',
  initialLanguage = 'All',
  initialCategory,
  initialSearch = '',
  onNavigate,
}) => {
  const { apiFetch, user } = useAuth();
  const [problems, setProblems] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [domainFilter, setDomainFilter] = useState<string>(
    initialDomain || 'All'
  );
  const [topicFilter, setTopicFilter] = useState<string>(initialTopic || 'All');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [languageFilter, setLanguageFilter] = useState<string>(
    initialLanguage || 'All'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>(
    initialCategory ? String(initialCategory) : 'All'
  );
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('id');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch || '');

  useEffect(() => {
    setDomainFilter(initialDomain || 'All');
    setTopicFilter(initialTopic || 'All');
  }, [initialDomain, initialTopic]);

  useEffect(() => {
    setLanguageFilter(initialLanguage || 'All');
  }, [initialLanguage]);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    let active = true;
    const loadProblemsAndDomains = async () => {
      try {
        setLoading(true);
        const [probRes, domRes] = await Promise.all([
          apiFetch('/api/problems'),
          apiFetch('/api/domains'),
        ]);
        if (probRes.ok && active) {
          setProblems(await probRes.json());
        }
        if (domRes.ok && active) {
          setDomains(await domRes.json());
        }
      } catch (err) {
        console.error('Failed to load problems library:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProblemsAndDomains();
    return () => {
      active = false;
    };
  }, [user]);

  // Topics available for current domain
  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    const activeDomObj = domains.find((d) => d.name === domainFilter);
    if (activeDomObj && Array.isArray(activeDomObj.topics)) {
      activeDomObj.topics.forEach((t: string) => set.add(t));
    }
    problems
      .filter((p) => domainFilter === 'All' || p.domain === domainFilter)
      .forEach((p) => {
        if (p.topic) set.add(p.topic);
      });
    return ['All', ...Array.from(set)];
  }, [problems, domains, domainFilter]);

  // Languages available
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    problems.forEach((p) => {
      if (p.language) set.add(p.language);
    });
    return ['All', ...Array.from(set)];
  }, [problems]);

  const filteredProblems = useMemo(() => {
    return problems
      .filter((p) => {
        if (domainFilter !== 'All' && p.domain !== domainFilter) {
          return false;
        }
        if (topicFilter !== 'All' && p.topic !== topicFilter) {
          return false;
        }
        if (difficultyFilter !== 'All' && p.difficulty !== difficultyFilter) {
          return false;
        }
        if (languageFilter !== 'All' && p.language !== languageFilter) {
          return false;
        }
        if (
          categoryFilter !== 'All' &&
          String(p.categoryId) !== String(categoryFilter)
        ) {
          return false;
        }
        if (statusFilter === 'Solved' && !p.isSolved) {
          return false;
        }
        if (statusFilter === 'Unsolved' && p.isSolved) {
          return false;
        }
        if (statusFilter === 'Attempted' && (!p.isAttempted || p.isSolved)) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = p.title.toLowerCase().includes(q);
          const matchesDesc = p.description.toLowerCase().includes(q);
          const matchesTopic = (p.topic || '').toLowerCase().includes(q);
          const matchesLang = (p.language || '').toLowerCase().includes(q);
          const matchesDomain = (p.domain || '').toLowerCase().includes(q);
          if (
            !matchesTitle &&
            !matchesDesc &&
            !matchesTopic &&
            !matchesLang &&
            !matchesDomain
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'popularity') {
          return (b.popularity || 0) - (a.popularity || 0);
        }
        if (sortBy === 'recent') {
          return b.id - a.id;
        }
        if (sortBy === 'difficulty-asc') {
          return (
            (DIFFICULTY_RANK[a.difficulty] || 2) -
            (DIFFICULTY_RANK[b.difficulty] || 2)
          );
        }
        if (sortBy === 'difficulty-desc') {
          return (
            (DIFFICULTY_RANK[b.difficulty] || 2) -
            (DIFFICULTY_RANK[a.difficulty] || 2)
          );
        }
        if (sortBy === 'xp') {
          return (b.xpPoints || 0) - (a.xpPoints || 0);
        }
        return a.id - b.id;
      });
  }, [
    problems,
    domainFilter,
    topicFilter,
    difficultyFilter,
    languageFilter,
    categoryFilter,
    statusFilter,
    searchQuery,
    sortBy,
  ]);

  const domainScopedProblems = useMemo(
    () =>
      problems.filter(
        (p) => domainFilter === 'All' || p.domain === domainFilter
      ),
    [problems, domainFilter]
  );

  const solvedCountInScope = useMemo(
    () => domainScopedProblems.filter((p) => p.isSolved).length,
    [domainScopedProblems]
  );

  const getDifficultyBadgeStyle = (diff: string) => {
    switch (diff) {
      case 'Beginner':
      case 'Easy':
        return 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400';
      case 'Medium':
        return 'bg-amber-950/80 border-amber-800/60 text-amber-400';
      case 'Hard':
        return 'bg-rose-950/80 border-rose-800/60 text-rose-400';
      case 'Expert':
        return 'bg-purple-950/80 border-purple-800/60 text-purple-300';
      default:
        return 'bg-slate-900 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {domainFilter === 'All' ? 'Multi-Domain' : domainFilter}{' '}
            <span className="text-indigo-400">Challenges</span>
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono tabular-nums">
            <span className="text-emerald-400">
              {solvedCountInScope}/{domainScopedProblems.length} Solved
            </span>
            <span>·</span>
            <span>
              {filteredProblems.length}{' '}
              {filteredProblems.length === 1 ? 'challenge' : 'challenges'} shown
            </span>
          </div>
        </div>
      </div>

      {/* Domain Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {DOMAIN_OPTIONS.map((dom) => {
          const active = domainFilter === dom;
          return (
            <button
              key={dom}
              type="button"
              onClick={() => {
                setDomainFilter(dom);
                setTopicFilter('All');
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : 'bg-[#121420] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {dom === 'All' ? 'All Domains' : dom}
            </button>
          );
        })}
      </div>

      {/* Filter & Search Panel */}
      <div className="bg-[#121420] border border-slate-800/90 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Difficulty Filter Buttons (Beginner, Easy, Medium, Hard, Expert) */}
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'].map(
              (diff) => {
                const active = difficultyFilter === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-full border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-indigo-950/90 border-indigo-500/80 text-indigo-300'
                        : 'bg-[#0B0C14] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {diff}
                  </button>
                );
              }
            )}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[250px] flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Python, DSA, SQL, ML, JS, or challenge title..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Topic Filter Bar */}
        <div className="pt-3 border-t border-slate-800/70 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400 mr-1">
            Topic:
          </span>
          {availableTopics.slice(0, 14).map((topic) => {
            const active = topicFilter === topic;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => setTopicFilter(topic)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-colors cursor-pointer ${
                  active
                    ? 'bg-indigo-600/25 border-indigo-500/60 text-indigo-300 font-semibold'
                    : 'bg-[#0B0C14] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Bar: Topic Dropdown, Language, Solved Status, Sort */}
        <div className="pt-3 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Refine &amp; Sort:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              {availableTopics.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Topics' : t}
                </option>
              ))}
            </select>

            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang === 'All' ? 'All Languages' : lang}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Status</option>
              <option value="Solved">Solved</option>
              <option value="Unsolved">Unsolved</option>
              <option value="Attempted">Attempted (In Progress)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#0B0C14] border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="id">Sort by Challenge #</option>
              <option value="difficulty-asc">Difficulty: Easy → Hard</option>
              <option value="difficulty-desc">Difficulty: Hard → Easy</option>
              <option value="popularity">Most Popular</option>
              <option value="recent">Recently Added</option>
              <option value="xp">Highest XP Reward</option>
            </select>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-24 bg-[#141726] border border-slate-800/80 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="bg-[#141726] border border-slate-800/90 rounded-2xl p-10 text-center space-y-3">
          <div className="text-sm font-semibold text-white">
            No matching challenges found
          </div>
          <p className="text-xs text-slate-400">
            Try clearing your search query or switching the domain, topic,
            language, or difficulty filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setDomainFilter('All');
              setTopicFilter('All');
              setDifficultyFilter('All');
              setLanguageFilter('All');
              setCategoryFilter('All');
              setStatusFilter('All');
            }}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProblems.map((prob) => (
            <div
              key={prob.id}
              className="bg-[#151828] hover:bg-[#181C2E] border border-slate-800/90 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1E2238] text-indigo-300 font-mono text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                  #{prob.id}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-white">
                      {prob.title}
                    </h3>
                    {prob.isSolved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Solved</span>
                      </span>
                    ) : prob.isAttempted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Attempted</span>
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {prob.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-1 font-mono flex-wrap">
                    <span className="text-indigo-300 font-semibold">
                      {prob.domain || 'Web Development'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-sky-300">
                      Topic: {prob.topic || prob.language}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{prob.language}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-indigo-400 tabular-nums">
                      +{prob.xpPoints} XP
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Timer className="w-3 h-3" />
                      <span>{prob.estimatedTime || '12 mins'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 shrink-0 self-end sm:self-center">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-lg border ${getDifficultyBadgeStyle(
                    prob.difficulty
                  )}`}
                >
                  {prob.difficulty}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onNavigate('workspace', { problemId: prob.id })
                  }
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer"
                >
                  <span>Solve</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
