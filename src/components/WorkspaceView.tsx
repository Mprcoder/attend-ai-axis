import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  ArrowLeft,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  Terminal,
  Eye,
  FileCode,
  History,
  Bug,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Database,
  Timer,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface WorkspaceViewProps {
  problemId: number;
  onNavigate: (page: string, params?: any) => void;
}

interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  problemId,
  onNavigate,
}) => {
  const { apiFetch, refreshProfile } = useAuth();
  const [problem, setProblem] = useState<any>(null);
  const [allProblemIds, setAllProblemIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeEditorTab, setActiveEditorTab] = useState<
    'HTML' | 'CSS' | 'JavaScript' | 'Code'
  >('HTML');
  const [selectedExecLang, setSelectedExecLang] = useState<string>('Python');
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const [editorFontSize, setEditorFontSize] = useState<number>(13);
  const [autoPreview, setAutoPreview] = useState<boolean>(true);

  const [activeBottomTab, setActiveBottomTab] = useState<
    'preview' | 'tests' | 'console' | 'ai' | 'history'
  >('preview');

  const [consoleLogs, setConsoleLogs] = useState<
    Array<{ level: string; text: string; time: string }>
  >([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [evalMeta, setEvalMeta] = useState<{
    mode: 'run' | 'submit';
    verdict: 'Accepted' | 'Wrong Answer' | 'Runtime Error';
    visiblePassed: number;
    visibleTotal: number;
    hiddenPassed: number;
    hiddenTotal: number;
    executionTimeMs: number;
  } | null>(null);
  const [evalBanner, setEvalBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [aiActiveModeLabel, setAiActiveModeLabel] = useState<string>(
    'Local AI Debugging Mentor'
  );
  const [aiHintLevel, setAiHintLevel] = useState<number>(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<AiChatMessage[]>([]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatError, setAiChatError] = useState('');
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [problemSubmissions, setProblemSubmissions] = useState<any[]>([]);
  const [previewSrcDoc, setPreviewSrcDoc] = useState<string>('');
  const clientAssertionsRef = useRef<Record<number, boolean>>({});
  const workspaceGridRef = useRef<HTMLDivElement>(null);
  const rightPanelsRef = useRef<HTMLDivElement>(null);
  const workspaceResizeRef = useRef<{
    panel: 'question' | 'editor';
    axis: 'x' | 'y';
    startCoordinate: number;
    startSize: number;
    containerSize: number;
  } | null>(null);
  const [questionPanelSize, setQuestionPanelSize] = useState(42);
  const [editorPanelSize, setEditorPanelSize] = useState(55);
  const [isStacked, setIsStacked] = useState(() =>
    window.matchMedia('(max-width: 1023px)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const updateLayout = (event: MediaQueryListEvent) => {
      setIsStacked(event.matches);
      setQuestionPanelSize((size) =>
        Math.min(event.matches ? 62 : 75, size)
      );
    };
    mediaQuery.addEventListener('change', updateLayout);
    return () => mediaQuery.removeEventListener('change', updateLayout);
  }, []);

  const startPanelResize = (
    panel: 'question' | 'editor',
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    const container =
      panel === 'question' ? workspaceGridRef.current : rightPanelsRef.current;
    if (!container) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const stacked = window.matchMedia('(max-width: 1023px)').matches;
    const rect = container.getBoundingClientRect();
    workspaceResizeRef.current = {
      panel,
      axis: panel === 'editor' || stacked ? 'y' : 'x',
      startCoordinate:
        panel === 'editor' || stacked ? event.clientY : event.clientX,
      startSize: panel === 'editor' ? editorPanelSize : questionPanelSize,
      containerSize:
        panel === 'editor' || stacked ? rect.height : rect.width,
    };
  };

  const movePanelResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const resize = workspaceResizeRef.current;
    if (!resize || resize.containerSize <= 0) return;
    const coordinate = resize.axis === 'y' ? event.clientY : event.clientX;
    const change =
      ((coordinate - resize.startCoordinate) / resize.containerSize) * 100;
    const maxSize =
      resize.panel === 'question' && resize.axis === 'y' ? 62 : 75;
    const nextSize = Math.min(maxSize, Math.max(25, resize.startSize + change));
    if (resize.panel === 'editor') setEditorPanelSize(nextSize);
    else setQuestionPanelSize(nextSize);
  };

  const endPanelResize = () => {
    workspaceResizeRef.current = null;
  };

  const adjustPanelSize = (panel: 'question' | 'editor', change: number) => {
    const setter =
      panel === 'editor' ? setEditorPanelSize : setQuestionPanelSize;
    setter((size) => {
      const maxSize =
        panel === 'question' &&
        window.matchMedia('(max-width: 1023px)').matches
          ? 62
          : 75;
      return Math.min(maxSize, Math.max(25, size + change));
    });
  };

  // Determine whether this challenge is a Web Dev multi-file challenge, SQL challenge, or Code/DSA/AI challenge
  const isWebMultiTab =
    problem &&
    (problem.language === 'HTML' ||
      problem.language === 'CSS' ||
      (problem.domain === 'Web Development' &&
        (problem.starterHtml || '').trim().length > 0));

  const isSqlChallenge = problem && problem.language === 'SQL';

  // Listen for sandboxed iframe console & test assertion messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.source === 'attend-ai-sandbox-console') {
        setConsoleLogs((prev) => [
          ...prev,
          {
            level: data.level || 'log',
            text: data.message || '',
            time: new Date().toLocaleTimeString(),
          },
        ]);
      } else if (data.source === 'attend-ai-sandbox-assertions') {
        clientAssertionsRef.current = data.results || {};
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const buildSandboxDocument = (
    rawHtml: string,
    rawCss: string,
    rawJs: string,
    testCases: any[] = []
  ) => {
    const serializedTests = JSON.stringify(
      testCases.map((tc) => ({
        id: tc.id,
        assertionScript: tc.assertionScript,
      }))
    );

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
${rawCss}
</style>
</head>
<body>
${rawHtml}
<script>
(function() {
  const sendConsole = (level, args) => {
    try {
      const msg = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      parent.postMessage({ source: 'attend-ai-sandbox-console', level, message: msg }, '*');
    } catch (e) {}
  };
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;
  console.log = function() { sendConsole('log', arguments); origLog.apply(console, arguments); };
  console.warn = function() { sendConsole('warn', arguments); origWarn.apply(console, arguments); };
  console.error = function() { sendConsole('error', arguments); origError.apply(console, arguments); };
  window.onerror = function(msg, url, line) {
    sendConsole('error', [msg + ' (line ' + line + ')']);
  };

  // Prevent form submission or anchor clicks from navigating the sandboxed iframe to a browser error page
  document.addEventListener('submit', function(e) {
    e.preventDefault();
    console.log('Form submit event triggered successfully inside sandbox.');
  }, true);

  document.addEventListener('click', function(e) {
    const link = e.target && e.target.closest ? e.target.closest('a') : null;
    if (link) {
      e.preventDefault();
      const hrefVal = link.getAttribute('href');
      console.log(hrefVal ? 'Navigation link clicked: ' + hrefVal : 'Anchor clicked (missing href attribute)');
    }
  }, true);
})();
</script>
<script>
try {
${rawJs}
} catch (err) {
  console.error(err && err.message ? err.message : String(err));
}
</script>
<script>
setTimeout(function() {
  try {
    const tests = ${serializedTests};
    const results = {};
    for (const t of tests) {
      try {
        const fn = new Function(t.assertionScript);
        results[t.id] = Boolean(fn());
      } catch (e) {
        results[t.id] = false;
      }
    }
    parent.postMessage({ source: 'attend-ai-sandbox-assertions', results }, '*');

    // After assertions run, replace any missing/broken img visuals with a clean SVG placeholder so no browser broken-image icon appears
    document.querySelectorAll('img').forEach(function(img) {
      const hasValidSrc = img.getAttribute('src') && img.getAttribute('src').trim().length > 0;
      if (!hasValidSrc) {
        img.style.display = 'inline-block';
        img.style.background = '#1e293b';
        img.style.border = '1px dashed #6366f1';
        img.style.borderRadius = '50%';
        img.src = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#1e293b"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="11">Missing src</text></svg>');
      }
    });
  } catch (e) {}
}, 40);
</script>
</body>
</html>`;
  };

  useEffect(() => {
    let active = true;
    const loadProblem = async () => {
      try {
        setLoading(true);
        setEvalBanner(null);
        setEvalMeta(null);
        setTestResults([]);
        setAiFeedback('');
        setAiChatMessages([]);
        setAiChatInput('');
        setAiChatError('');
        setRevealedHints(0);
        const [probRes, listRes] = await Promise.all([
          apiFetch(`/api/problems/${problemId}`),
          apiFetch('/api/problems'),
        ]);
        if (listRes.ok && active) {
          const allList = await listRes.json();
          setAllProblemIds(allList.map((p: any) => p.id));
        }
        if (probRes.ok && active) {
          const data = await probRes.json();
          setProblem(data);
          setHtmlCode(data.starterHtml || '');
          setCssCode(data.starterCss || '');
          setJsCode(data.starterJs || '');
          setSelectedExecLang(data.language || 'Python');

          const webMode =
            data.language === 'HTML' ||
            data.language === 'CSS' ||
            (data.domain === 'Web Development' &&
              (data.starterHtml || '').trim().length > 0);

          if (!webMode) {
            setActiveEditorTab('Code');
            setActiveBottomTab(data.language === 'SQL' ? 'preview' : 'tests');
          } else {
            if (data.language === 'CSS') setActiveEditorTab('CSS');
            else if (
              data.language === 'JavaScript' ||
              data.language === 'React.js' ||
              data.language === 'Node.js' ||
              data.language === 'Express.js'
            ) {
              setActiveEditorTab('JavaScript');
            } else {
              setActiveEditorTab('HTML');
            }
            setActiveBottomTab('preview');
          }

          setPreviewSrcDoc(
            buildSandboxDocument(
              data.starterHtml || '',
              data.starterCss || '',
              data.starterJs || '',
              data.testCases || []
            )
          );
        }
      } catch (err) {
        console.error('Error loading problem:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProblem();
    return () => {
      active = false;
    };
  }, [problemId]);

  // Auto-update isolated preview when autoPreview is enabled
  useEffect(() => {
    if (!autoPreview || !problem || !isWebMultiTab) return;
    const timer = setTimeout(() => {
      setPreviewSrcDoc(
        buildSandboxDocument(htmlCode, cssCode, jsCode, problem.testCases || [])
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [htmlCode, cssCode, jsCode, autoPreview, problem, isWebMultiTab]);

  const loadSubmissionHistoryForProblem = async () => {
    try {
      const res = await apiFetch('/api/submissions/history');
      if (res.ok) {
        const all = await res.json();
        setProblemSubmissions(
          all.filter((s: any) => Number(s.problemId) === Number(problemId))
        );
      }
    } catch (err) {
      console.error('Failed to load problem submissions:', err);
    }
  };

  const handleResetCode = () => {
    if (!problem) return;
    setHtmlCode(problem.starterHtml || '');
    setCssCode(problem.starterCss || '');
    setJsCode(problem.starterJs || '');
    setConsoleLogs([]);
    setTestResults([]);
    setEvalMeta(null);
    setEvalBanner({
      type: 'info',
      text: 'Starter code restored to initial state.',
    });
    if (isWebMultiTab) {
      setPreviewSrcDoc(
        buildSandboxDocument(
          problem.starterHtml || '',
          problem.starterCss || '',
          problem.starterJs || '',
          problem.testCases || []
        )
      );
    }
  };

  const handleRefreshPreview = () => {
    if (!problem) return;
    setConsoleLogs([]);
    setPreviewSrcDoc(
      buildSandboxDocument(htmlCode, cssCode, jsCode, problem.testCases || [])
    );
  };

  const computeVerdict = (
    allPassed: boolean,
    results: any[]
  ): 'Accepted' | 'Wrong Answer' | 'Runtime Error' => {
    if (allPassed) return 'Accepted';
    const hasRuntimeErr = results.some(
      (r) =>
        r.actualOutput &&
        (r.actualOutput.includes('Runtime Error') ||
          r.actualOutput.includes('KeyError') ||
          r.actualOutput.includes('Syntax Error') ||
          r.actualOutput.includes('Time Limit'))
    );
    return hasRuntimeErr ? 'Runtime Error' : 'Wrong Answer';
  };

  const handleRunCode = async () => {
    if (!problem) return;
    setRunning(true);
    setConsoleLogs([]);
    setEvalBanner(null);

    if (isWebMultiTab) {
      setPreviewSrcDoc(
        buildSandboxDocument(htmlCode, cssCode, jsCode, problem.testCases || [])
      );
    }

    try {
      const res = await apiFetch('/api/submissions/run', {
        method: 'POST',
        body: JSON.stringify({
          problemId: problem.id,
          html: htmlCode,
          css: cssCode,
          js: jsCode,
          clientAssertionResults: clientAssertionsRef.current,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const results = data.results || [];
        const verdict = computeVerdict(Boolean(data.allPassed), results);
        setTestResults(results);
        setEvalMeta({
          mode: 'run',
          verdict,
          visiblePassed: data.visiblePassed ?? data.passedTests ?? 0,
          visibleTotal: data.visibleTotal ?? data.totalTests ?? 0,
          hiddenPassed: 0,
          hiddenTotal: 0,
          executionTimeMs: data.executionTimeMs ?? 12,
        });
        if (!isSqlChallenge) {
          setActiveBottomTab('tests');
        }
        setEvalBanner({
          type: data.allPassed ? 'success' : 'error',
          text: data.allPassed
            ? `[${verdict}] Run Complete (${data.executionTimeMs ?? 12}ms): All ${data.passedTests}/${data.totalTests} sample test cases passed! Click "Submit Solution" to verify against hidden tests and earn +${problem.xpPoints} XP.`
            : `[${verdict}] Run Complete (${data.executionTimeMs ?? 12}ms): ${data.passedTests}/${data.totalTests} sample test cases passed. Inspect the diagnostics below.`,
        });
      }
    } catch (err: any) {
      setEvalBanner({
        type: 'error',
        text: err.message || 'Failed to run test suite.',
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!problem) return;

    setSubmitting(true);
    setEvalBanner(null);
    if (isWebMultiTab) {
      setPreviewSrcDoc(
        buildSandboxDocument(htmlCode, cssCode, jsCode, problem.testCases || [])
      );
    }

    try {
      const res = await apiFetch('/api/submissions/submit', {
        method: 'POST',
        body: JSON.stringify({
          problemId: problem.id,
          html: htmlCode,
          css: cssCode,
          js: jsCode,
          clientAssertionResults: clientAssertionsRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEvalBanner({
          type: 'error',
          text: data.error || 'Submission failed.',
        });
        return;
      }

      const results = data.results || [];
      const verdict = computeVerdict(Boolean(data.allPassed), results);
      setTestResults(results);
      setEvalMeta({
        mode: 'submit',
        verdict,
        visiblePassed: data.visiblePassed ?? 0,
        visibleTotal: data.visibleTotal ?? 0,
        hiddenPassed: data.hiddenPassed ?? 0,
        hiddenTotal: data.hiddenTotal ?? 0,
        executionTimeMs: data.executionTimeMs ?? 14,
      });
      if (data.aiFeedback) {
        setAiFeedback(data.aiFeedback);
        setAiActiveModeLabel(
          data.allPassed
            ? 'Post-Solution Code Review'
            : 'Failed Submission Debugging Analysis'
        );
      }

      if (data.allPassed) {
        setProblem((prev: any) => ({ ...prev, isSolved: true }));
        setEvalBanner({
          type: 'success',
          text: data.isFirstSolve
            ? `[Accepted] Challenge Solved! All ${data.passedTests}/${data.totalTests} test cases (${data.visiblePassed}/${data.visibleTotal} visible + ${data.hiddenPassed}/${data.hiddenTotal} hidden) passed in ${data.executionTimeMs ?? 14}ms. +${data.xpEarned} XP awarded!`
            : `[Accepted] Challenge Solved! All ${data.passedTests}/${data.totalTests} test cases passed in ${data.executionTimeMs ?? 14}ms. (XP already claimed on first solve)`,
        });
        await refreshProfile();
      } else {
        setEvalBanner({
          type: 'error',
          text: `[${verdict}] Submission Failed: ${data.passedTests}/${data.totalTests} test cases passed (${data.visiblePassed}/${data.visibleTotal} visible, ${data.hiddenPassed}/${data.hiddenTotal} hidden). Check Test Results & AI Feedback.`,
        });
      }

      setActiveBottomTab('tests');
      await loadSubmissionHistoryForProblem();
    } catch (err: any) {
      setEvalBanner({
        type: 'error',
        text: err.message || 'Network error while submitting solution.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const requestAiHelp = async (
    mode: 'hint' | 'explain_bug' | 'debug_assist' | 'solution_feedback',
    explicitHintLevel?: number
  ) => {
    if (!problem) return;
    setAiLoading(true);
    setActiveBottomTab('ai');

    const levelToUse = explicitHintLevel || aiHintLevel;
    const labelMap: Record<string, string> = {
      hint: `Progressive Hint (Level ${levelToUse}/3)`,
      explain_bug: 'Bug Root-Cause Explanation',
      debug_assist: 'Failed Test Debugging Assistance',
      solution_feedback: 'Post-Solution Feedback & Best Practices',
    };
    setAiActiveModeLabel(labelMap[mode] || 'Local AI Debugging Mentor');

    const failedDiagnostics = testResults
      .filter((r) => r.passed === false && !r.isHidden && r.actualOutput)
      .map((r) => `${r.title}: ${r.actualOutput}`);

    const passedCount = testResults.filter((r) => r.passed === true).length;
    const testSummary =
      testResults.length > 0
        ? `${passedCount}/${testResults.length} test cases passed`
        : undefined;

    try {
      const res = await apiFetch('/api/ai/assist', {
        method: 'POST',
        body: JSON.stringify({
          mode,
          hintLevel: levelToUse,
          problemId: problem.id,
          html: htmlCode,
          css: cssCode,
          js: jsCode,
          testSummary,
          failedDiagnostics,
        }),
      });
      const data = await res.json();
      if (res.ok && data.feedback) {
        setAiFeedback(data.feedback);
        if (mode === 'hint' && levelToUse < 3) {
          setAiHintLevel(levelToUse + 1);
        }
      } else {
        setAiFeedback(data.error || 'Unable to fetch AI debugging assistance.');
      }
    } catch (err: any) {
      setAiFeedback(err.message || 'Network error requesting AI assistance.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiChatSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const question = aiChatInput.trim();
    if (!question || aiChatLoading) return;

    const nextMessages = [
      ...aiChatMessages,
      { role: 'user' as const, content: question },
    ].slice(-10);
    setAiChatMessages(nextMessages);
    setAiChatInput('');
    setAiChatError('');
    setAiChatLoading(true);

    const codeContext = [
      htmlCode ? `HTML:\n${htmlCode}` : '',
      cssCode ? `CSS:\n${cssCode}` : '',
      jsCode ? `JavaScript:\n${jsCode}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      const res = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: nextMessages,
          language: problem?.language || selectedExecLang,
          problemTitle: problem?.title,
          code: codeContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to get a response from local AI.');
      }
      if (typeof data.response !== 'string' || !data.response.trim()) {
        throw new Error('Local AI returned an empty answer. Please try again.');
      }
      setAiChatMessages([
        ...nextMessages,
        { role: 'assistant' as const, content: data.response },
      ].slice(-10));
    } catch (error) {
      setAiChatError(
        error instanceof Error
          ? error.message
          : 'Unable to reach local AI. Check that Ollama is running.'
      );
    } finally {
      setAiChatLoading(false);
    }
  };

  const currentCode =
    !isWebMultiTab
      ? jsCode
      : activeEditorTab === 'HTML'
      ? htmlCode
      : activeEditorTab === 'CSS'
      ? cssCode
      : jsCode;

  const getMonacoLanguage = () => {
    if (isWebMultiTab) {
      if (activeEditorTab === 'HTML') return 'html';
      if (activeEditorTab === 'CSS') return 'css';
      return 'javascript';
    }
    const lang = (problem?.language || selectedExecLang || '').toLowerCase();
    if (lang.includes('python')) return 'python';
    if (lang.includes('sql')) return 'sql';
    if (lang === 'c++' || lang === 'cpp') return 'cpp';
    if (lang === 'c') return 'c';
    if (lang === 'java') return 'java';
    return 'javascript';
  };

  const getCodeFileName = () => {
    if (isWebMultiTab) {
      if (activeEditorTab === 'HTML') return 'index.html';
      if (activeEditorTab === 'CSS') return 'styles.css';
      return 'script.js';
    }
    const lang = problem?.language || selectedExecLang || 'Python';
    if (lang === 'Python') return 'solution.py';
    if (lang === 'SQL') return 'query.sql';
    if (lang === 'C++') return 'solution.cpp';
    if (lang === 'Java') return 'AccessControl.java';
    if (lang === 'C') return 'solution.c';
    return 'solution.js';
  };

  const updateCurrentCode = (val: string) => {
    if (!isWebMultiTab) {
      setJsCode(val);
      return;
    }
    if (activeEditorTab === 'HTML') setHtmlCode(val);
    else if (activeEditorTab === 'CSS') setCssCode(val);
    else setJsCode(val);
  };

  const currentIdx = allProblemIds.indexOf(Number(problemId));
  const prevProblemId = currentIdx > 0 ? allProblemIds[currentIdx - 1] : null;
  const nextProblemId =
    currentIdx >= 0 && currentIdx < allProblemIds.length - 1
      ? allProblemIds[currentIdx + 1]
      : null;

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-slate-400">
        Loading workspace...
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-base font-bold text-white">Challenge not found</div>
        <button
          type="button"
          onClick={() => onNavigate('problems')}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          Back to Challenges Library
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Workspace Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121420] border border-slate-800/90 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() =>
              onNavigate('problems', { domain: problem.domain || 'All' })
            }
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{problem.domain || 'Problems'}</span>
          </button>

          {/* Prev / Next Challenge Navigation */}
          <div className="inline-flex items-center gap-1 ml-1">
            <button
              type="button"
              disabled={!prevProblemId}
              onClick={() =>
                prevProblemId &&
                onNavigate('workspace', { problemId: prevProblemId })
              }
              title="Previous Challenge"
              className="p-1 rounded bg-[#0D0E17] border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={!nextProblemId}
              onClick={() =>
                nextProblemId &&
                onNavigate('workspace', { problemId: nextProblemId })
              }
              title="Next Challenge"
              className="p-1 rounded bg-[#0D0E17] border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-slate-700">/</span>
          <h1 className="text-base font-bold text-white">
            #{problem.id} {problem.title}
          </h1>
          <span className="text-xs font-mono text-slate-400">
            {problem.difficulty} · {problem.topic || problem.language} · +
            {problem.xpPoints} XP
          </span>
          {problem.isSolved && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Accepted</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetCode}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Code</span>
          </button>

          <button
            type="button"
            onClick={handleRunCode}
            disabled={running}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {running
                ? 'Running...'
                : isSqlChallenge
                ? 'Execute Query'
                : 'Run Code'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSubmitSolution}
            disabled={submitting}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Evaluating...' : 'Submit Solution'}</span>
          </button>
        </div>
      </div>

      {/* Evaluation Status Notification Banner */}
      {evalBanner && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            evalBanner.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/70 text-emerald-200'
              : evalBanner.type === 'error'
              ? 'bg-rose-950/60 border-rose-800/70 text-rose-200'
              : 'bg-indigo-950/60 border-indigo-800/70 text-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {evalBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : evalBanner.type === 'error' ? (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{evalBanner.text}</span>
          </div>
        </div>
      )}

      {/* Split-Screen Workspace Grid */}
      <div
        ref={workspaceGridRef}
        className="workspace-resizable-grid"
        style={
          {
            '--question-panel-fr': `${questionPanelSize}fr`,
            '--workspace-remainder-fr': `${100 - questionPanelSize}fr`,
            '--question-panel-size': `${questionPanelSize}%`,
          } as React.CSSProperties
        }
      >
        {/* LEFT PANEL — Problem Information (5 cols) */}
        <div className="workspace-question-panel bg-[#121420] border border-slate-800/90 rounded-xl p-5 space-y-5 flex flex-col">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-mono text-indigo-400 mb-1">
                <span>
                  {problem.domain || problem.categoryName} · Topic:{' '}
                  {problem.topic || problem.language}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Timer className="w-3.5 h-3.5" />
                  <span>{problem.estimatedTime || '12 mins'}</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">{problem.title}</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                {problem.description}
              </p>
            </div>

            {/* Bug / Task Description Box */}
            <div className="bg-[#181B2C] border border-amber-900/50 rounded-xl p-4 space-y-1.5">
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Bug className="w-3.5 h-3.5" />
                <span>Bug / Challenge Diagnostic</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {problem.bugDescription}
              </p>
            </div>

            {/* Input & Output Format */}
            {(problem.inputFormat || problem.outputFormat) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-[#0B0C14] border border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-300">
                    Input Format
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {problem.inputFormat || 'Standard input'}
                  </div>
                </div>
                <div className="bg-[#0B0C14] border border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-300">
                    Output Format
                  </div>
                  <div className="text-xs font-mono text-emerald-400">
                    {problem.outputFormat || 'Verified output'}
                  </div>
                </div>
              </div>
            )}

            {/* Expected Behavior & Instructions */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-200">
                Expected Solution Behavior
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {problem.expectedBehavior}
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-200">
                Instructions
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {problem.instructions}
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-200">
                Constraints
              </h3>
              <p className="text-xs text-slate-400 font-mono bg-[#0B0C14] p-2.5 rounded-lg border border-slate-800">
                {problem.constraints}
              </p>
            </div>

            {/* Visible Sample Input / Output Examples */}
            {problem.visibleExamples && problem.visibleExamples.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-200">
                  Sample Input &amp; Output
                </h3>
                {problem.visibleExamples.map((ex: any, i: number) => (
                  <div
                    key={i}
                    className="bg-[#0B0C14] border border-slate-800 rounded-lg p-3 font-mono text-xs space-y-1"
                  >
                    <div className="text-slate-300">
                      <span className="text-slate-500">Sample Input:</span>{' '}
                      {ex.input}
                    </div>
                    <div className="text-emerald-400">
                      <span className="text-slate-500">Sample Output:</span>{' '}
                      {ex.output}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Progressive Hints & Local AI Mentor */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Hints ({revealedHints}/{(problem.hints || []).length})
                  </span>
                </span>
                {revealedHints < (problem.hints || []).length && (
                  <button
                    type="button"
                    onClick={() => setRevealedHints((h) => h + 1)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    Reveal Next Hint
                  </button>
                )}
              </div>

              {revealedHints > 0 && (
                <div className="space-y-2">
                  {(problem.hints || [])
                    .slice(0, revealedHints)
                    .map((hint: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#0B0C14] border border-slate-800 text-xs text-slate-300"
                      >
                        <strong className="text-amber-400">
                          Hint #{idx + 1}:
                        </strong>{' '}
                        {hint}
                      </div>
                    ))}
                </div>
              )}

              {/* Local AI Assistance Buttons */}
              <div className="pt-2 space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Llama 3.2 Debugging Assistant</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => requestAiHelp('hint', aiHintLevel)}
                    className="px-3 py-1.5 text-xs bg-[#1A1D30] hover:bg-indigo-950/80 border border-slate-700 text-indigo-300 rounded-lg cursor-pointer"
                  >
                    AI Hint (Level {aiHintLevel}/3)
                  </button>
                  <button
                    type="button"
                    onClick={() => requestAiHelp('explain_bug')}
                    className="px-3 py-1.5 text-xs bg-[#1A1D30] hover:bg-indigo-950/80 border border-slate-700 text-indigo-300 rounded-lg cursor-pointer"
                  >
                    Explain Bug
                  </button>
                  <button
                    type="button"
                    onClick={() => requestAiHelp('debug_assist')}
                    className="px-3 py-1.5 text-xs bg-[#1A1D30] hover:bg-indigo-950/80 border border-slate-700 text-indigo-300 rounded-lg cursor-pointer"
                  >
                    Why Is My Code Failing?
                  </button>
                  {problem.isSolved && (
                    <button
                      type="button"
                      onClick={() => requestAiHelp('solution_feedback')}
                      className="px-3 py-1.5 text-xs bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800/70 text-emerald-300 rounded-lg cursor-pointer"
                    >
                      Post-Solution Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="workspace-divider workspace-question-divider"
          role="separator"
          aria-label="Resize question panel"
          aria-orientation={isStacked ? 'horizontal' : 'vertical'}
          aria-valuenow={Math.round(questionPanelSize)}
          aria-valuemin={25}
          aria-valuemax={75}
          tabIndex={0}
          onPointerDown={(event) => startPanelResize('question', event)}
          onPointerMove={movePanelResize}
          onPointerUp={endPanelResize}
          onPointerCancel={endPanelResize}
          onKeyDown={(event) => {
            const decreaseKey = isStacked ? 'ArrowUp' : 'ArrowLeft';
            const increaseKey = isStacked ? 'ArrowDown' : 'ArrowRight';
            if (event.key === decreaseKey) {
              event.preventDefault();
              adjustPanelSize('question', -2);
            } else if (event.key === increaseKey) {
              event.preventDefault();
              adjustPanelSize('question', 2);
            }
          }}
        />

        {/* RIGHT PANEL — Monaco Code Editor + Domain-Specific Bottom Panel (7 cols) */}
        <div
          ref={rightPanelsRef}
          className="workspace-right-panels"
          style={{
            gridTemplateRows: `minmax(230px, ${editorPanelSize}fr) 8px minmax(200px, ${100 - editorPanelSize}fr)`,
          }}
        >
          {/* Code Editor Card */}
          <div className="workspace-editor-card bg-[#121420] border border-slate-800/90 rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-[#0D0E17] border-b border-slate-800 flex-wrap gap-2">
              {isWebMultiTab ? (
                <div className="flex items-center gap-1">
                  {(['HTML', 'CSS', 'JavaScript'] as const).map((tab) => {
                    const active = activeEditorTab === tab;
                    const fileName =
                      tab === 'HTML'
                        ? 'index.html'
                        : tab === 'CSS'
                        ? 'styles.css'
                        : 'script.js';
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveEditorTab(tab)}
                        className={`px-3 py-1.5 text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                          active
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{fileName}</span>
                        {problem.language === tab && (
                          <span className="text-[10px] text-amber-400 ml-1">
                            • bug
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 text-xs font-mono rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{getCodeFileName()}</span>
                  </span>
                  {!isSqlChallenge && (
                    <select
                      value={selectedExecLang}
                      onChange={(e) => setSelectedExecLang(e.target.value)}
                      className="px-2.5 py-1 text-xs font-mono bg-[#121420] border border-slate-700 rounded-lg text-slate-200"
                    >
                      <option value={problem.language}>{problem.language}</option>
                      {['Python', 'JavaScript', 'C++', 'Java', 'C']
                        .filter((l) => l !== problem.language)
                        .map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <label className="flex items-center gap-1.5">
                  <span>Font:</span>
                  <select
                    value={editorFontSize}
                    onChange={(e) => setEditorFontSize(Number(e.target.value))}
                    className="bg-[#121420] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200"
                  >
                    <option value={12}>12px</option>
                    <option value={13}>13px</option>
                    <option value={14}>14px</option>
                    <option value={16}>16px</option>
                  </select>
                </label>
                <span>
                  Monaco · {isWebMultiTab ? activeEditorTab : problem.language}
                </span>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="workspace-monaco-container bg-[#1E1E1E] relative">
              <Editor
                height="100%"
                language={getMonacoLanguage()}
                theme="vs-dark"
                path={getCodeFileName()}
                value={currentCode}
                onChange={(val) => updateCurrentCode(val ?? '')}
                options={{
                  fontSize: editorFontSize,
                  fontFamily:
                    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  tabSize: 2,
                  automaticLayout: true,
                  padding: { top: 12, bottom: 12 },
                }}
                loading={
                  <textarea
                    value={currentCode}
                    onChange={(e) => updateCurrentCode(e.target.value)}
                    spellCheck={false}
                    className="code-editor-font w-full h-full p-4 bg-[#0B0C14] text-slate-100 font-mono text-xs sm:text-sm leading-6 focus:outline-none resize-none"
                  />
                }
              />
            </div>
          </div>

          <div
            className="workspace-divider workspace-editor-divider"
            role="separator"
            aria-label="Resize code editor and output panels"
            aria-orientation="horizontal"
            aria-valuenow={Math.round(editorPanelSize)}
            aria-valuemin={25}
            aria-valuemax={75}
            tabIndex={0}
            onPointerDown={(event) => startPanelResize('editor', event)}
            onPointerMove={movePanelResize}
            onPointerUp={endPanelResize}
            onPointerCancel={endPanelResize}
            onKeyDown={(event) => {
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                adjustPanelSize('editor', -2);
              } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                adjustPanelSize('editor', 2);
              }
            }}
          />

          {/* BOTTOM PANEL — Domain-Adaptive Preview / SQL Schema / Test Cases / Console / AI / History */}
          <div className="workspace-output-panel bg-[#121420] border border-slate-800/90 rounded-xl overflow-hidden flex flex-col">
            <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#0D0E17] border-b border-slate-800 gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('preview')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer ${
                    activeBottomTab === 'preview'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isSqlChallenge ? (
                    <Database className="w-3.5 h-3.5 text-sky-400" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isWebMultiTab
                      ? 'Live Preview'
                      : isSqlChallenge
                      ? 'SQL Schema & Query Results'
                      : 'Execution Environment'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBottomTab('tests')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer ${
                    activeBottomTab === 'tests'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Test Results
                    {testResults.length > 0 &&
                      ` (${testResults.filter((t) => t.passed).length}/${
                        testResults.length
                      })`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBottomTab('console')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer ${
                    activeBottomTab === 'console'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Console ({consoleLogs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBottomTab('ai')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer ${
                    activeBottomTab === 'ai'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Feedback</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveBottomTab('history');
                    loadSubmissionHistoryForProblem();
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer ${
                    activeBottomTab === 'history'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Submissions</span>
                </button>
              </div>

              {/* Preview Controls for Web Dev */}
              {activeBottomTab === 'preview' && isWebMultiTab && (
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPreview}
                      onChange={(e) => setAutoPreview(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                    />
                    <span>Auto-refresh</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRefreshPreview}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title="Refresh Sandbox Preview"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Tab Content Area */}
            <div className="workspace-bottom-content overflow-y-auto bg-[#0B0C14]">
              {/* 1. Sandboxed Live Preview (kept intact in DOM for Web Dev; SQL & Code panels shown for non-Web) */}
              <div
                className={
                  activeBottomTab === 'preview' ? 'w-full h-full' : 'hidden'
                }
              >
                {isWebMultiTab ? (
                  <iframe
                    title="Attend AI Isolated Sandbox Preview"
                    sandbox="allow-scripts allow-forms"
                    srcDoc={previewSrcDoc}
                    className="w-full h-full border-0 bg-[#0F172A] block"
                  />
                ) : isSqlChallenge ? (
                  <div className="p-4 space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-[#121420] border border-slate-800 rounded-xl p-3 space-y-1.5">
                        <div className="font-semibold text-sky-400 font-mono">
                          Sample Table: employees / customers
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                          {problem.slug.includes('department') ? (
                            <>
                              <div>1 | Alice | Engineering | $95,000</div>
                              <div>2 | Bob | Engineering | $85,000</div>
                              <div>3 | Charlie | Marketing | $68,000</div>
                              <div>4 | Diana | AI Research | $110,000</div>
                            </>
                          ) : (
                            <>
                              <div>customers: (1, Alice), (2, Bob), (3, NewUser)</div>
                              <div>orders: (101, cust=1, $250), (102, cust=2, $120)</div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="bg-[#121420] border border-slate-800 rounded-xl p-3 space-y-1.5">
                        <div className="font-semibold text-emerald-400 font-mono">
                          Expected Query Result Set
                        </div>
                        <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
                          {problem.slug.includes('department') ? (
                            <>
                              <div>department | avg_salary</div>
                              <div className="text-emerald-400">
                                AI Research | 110000
                              </div>
                              <div className="text-emerald-400">
                                Engineering | 90000
                              </div>
                            </>
                          ) : (
                            <>
                              <div>customer_name | total_spent</div>
                              <div className="text-emerald-400">Alice | 250</div>
                              <div className="text-emerald-400">Bob | 120</div>
                              <div className="text-emerald-400">NewUser | 0</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-400 font-mono text-[11px]">
                      Click &ldquo;Execute Query&rdquo; or &ldquo;Submit Solution&rdquo; to validate your SQL query against all test assertions.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-3 text-xs font-mono">
                    <div className="bg-[#121420] border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-400 font-semibold">
                          Deterministic {problem.domain} Sandbox Runner
                        </span>
                        <span className="text-slate-400">
                          Language: {problem.language}
                        </span>
                      </div>
                      <p className="text-slate-400 leading-relaxed">
                        Your {problem.language} solution is verified against sample
                        and hidden test cases without executing untrusted host
                        commands. Click <strong className="text-white">Run Code</strong>{' '}
                        to test sample inputs or{' '}
                        <strong className="text-white">Submit Solution</strong> for
                        full evaluation.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Deterministic Test Cases & Results */}
              {activeBottomTab === 'tests' && (
                <div className="p-4 space-y-3">
                  {evalMeta && (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#121420] border border-slate-800 text-xs font-mono">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            evalMeta.verdict === 'Accepted'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : evalMeta.verdict === 'Runtime Error'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {evalMeta.verdict}
                        </span>
                        <span className="text-slate-400">
                          Sample Tests:{' '}
                          <strong className="text-white">
                            {evalMeta.visiblePassed}/{evalMeta.visibleTotal}
                          </strong>
                        </span>
                        {evalMeta.mode === 'submit' && (
                          <span className="text-slate-400">
                            Hidden Tests:{' '}
                            <strong className="text-white">
                              {evalMeta.hiddenPassed}/{evalMeta.hiddenTotal}
                            </strong>
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400">
                        Runtime: {evalMeta.executionTimeMs}ms
                      </span>
                    </div>
                  )}

                  {(testResults.length > 0
                    ? testResults
                    : (problem.testCases || []).map((tc: any) => ({
                        ...tc,
                        passed: null,
                        isHidden: false,
                      }))
                  ).map((tc: any, idx: number) => (
                    <div
                      key={tc.id || idx}
                      className="bg-[#121420] border border-slate-800 rounded-lg p-3 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          <span>
                            Test Case #{idx + 1}: {tc.title}
                          </span>
                          {tc.isHidden && (
                            <span className="text-[10px] font-mono text-amber-400">
                              [Hidden Test]
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          Input: {tc.inputData} · Expected: {tc.expectedOutput}
                        </div>
                        {tc.passed === false && tc.actualOutput && (
                          <div className="text-[11px] font-mono text-rose-400">
                            Diagnostic: {tc.actualOutput}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        {tc.passed === true && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accepted</span>
                          </span>
                        )}
                        {tc.passed === false && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                            <XCircle className="w-4 h-4" />
                            <span>Failed</span>
                          </span>
                        )}
                        {tc.passed === null && (
                          <span className="text-xs text-slate-500 font-mono">
                            Click Run or Submit
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Console Output */}
              {activeBottomTab === 'console' && (
                <div className="p-4 font-mono text-xs space-y-1.5">
                  {consoleLogs.length === 0 ? (
                    <div className="text-slate-500">
                      No console output recorded yet. Click &ldquo;Run Code&rdquo; to
                      execute inside the isolated sandbox.
                    </div>
                  ) : (
                    consoleLogs.map((log, i) => (
                      <div
                        key={i}
                        className={`py-1 border-b border-slate-800/60 ${
                          log.level === 'error'
                            ? 'text-rose-400'
                            : log.level === 'warn'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}
                      >
                        <span className="text-slate-600 mr-2">[{log.time}]</span>
                        <span>{log.text}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 4. Local AI Feedback */}
              {activeBottomTab === 'ai' && (
                <div className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{aiActiveModeLabel}</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => requestAiHelp('hint', 1)}
                        className="px-2 py-1 text-[11px] bg-[#121420] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded cursor-pointer"
                      >
                        Hint L1
                      </button>
                      <button
                        type="button"
                        onClick={() => requestAiHelp('hint', 2)}
                        className="px-2 py-1 text-[11px] bg-[#121420] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded cursor-pointer"
                      >
                        Hint L2
                      </button>
                      <button
                        type="button"
                        onClick={() => requestAiHelp('hint', 3)}
                        className="px-2 py-1 text-[11px] bg-[#121420] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded cursor-pointer"
                      >
                        Hint L3
                      </button>
                      <button
                        type="button"
                        onClick={() => requestAiHelp('explain_bug')}
                        className="px-2 py-1 text-[11px] bg-[#121420] hover:bg-slate-800 border border-slate-700 text-indigo-300 rounded cursor-pointer"
                      >
                        Explain Bug
                      </button>
                      <button
                        type="button"
                        onClick={() => requestAiHelp('debug_assist')}
                        className="px-2 py-1 text-[11px] bg-[#121420] hover:bg-slate-800 border border-slate-700 text-amber-300 rounded cursor-pointer"
                      >
                        Debug Failure
                      </button>
                      {problem.isSolved && (
                        <button
                          type="button"
                          onClick={() => requestAiHelp('solution_feedback')}
                          className="px-2 py-1 text-[11px] bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-800 text-emerald-300 rounded cursor-pointer"
                        >
                          Solution Review
                        </button>
                      )}
                    </div>
                  </div>

                  {aiLoading ? (
                    <div className="text-xs text-indigo-300 animate-pulse py-3">
                      Llama 3.2 is analyzing your code and challenge context...
                    </div>
                  ) : aiFeedback ? (
                    <div className="bg-[#121420] border border-indigo-900/50 rounded-xl p-4 space-y-2">
                      <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                        {aiFeedback}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 space-y-2">
                      <p>
                        Select a mode above for progressive hints, root-cause bug
                        analysis, test failure debugging, or post-solution review.
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-200">
                        Ask a programming question
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        llama3.2:3b · local
                      </span>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {aiChatMessages.length === 0 && (
                        <p className="text-[11px] text-slate-500">
                          Ask about Python, Java, C/C++, HTML, CSS, JavaScript,
                          or the code in this workspace.
                        </p>
                      )}
                      {aiChatMessages.map((message, index) => (
                        <div
                          key={`${index}-${message.role}`}
                          className={`rounded-lg border p-2.5 text-xs whitespace-pre-line leading-relaxed ${
                            message.role === 'user'
                              ? 'ml-6 bg-[#0B0C14] border-slate-800 text-slate-300'
                              : 'mr-3 bg-[#121420] border-indigo-900/50 text-slate-200'
                          }`}
                        >
                          <span className="block text-[10px] font-semibold text-indigo-400 mb-1">
                            {message.role === 'user' ? 'You' : 'Attend AI'}
                          </span>
                          {message.content}
                        </div>
                      ))}
                      {aiChatLoading && (
                        <div className="text-xs text-indigo-300 animate-pulse">
                          Llama 3.2 is thinking...
                        </div>
                      )}
                    </div>
                    {aiChatError && (
                      <p role="alert" className="text-xs text-rose-400">
                        {aiChatError}
                      </p>
                    )}
                    <form onSubmit={handleAiChatSubmit} className="flex items-end gap-2">
                      <textarea
                        value={aiChatInput}
                        onChange={(event) => setAiChatInput(event.target.value)}
                        maxLength={1500}
                        rows={2}
                        placeholder="Ask a coding or debugging question..."
                        aria-label="Ask the local programming assistant"
                        className="min-w-0 flex-1 resize-none rounded-lg border border-slate-800 bg-[#0B0C14] px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={!aiChatInput.trim() || aiChatLoading}
                        aria-label="Send question"
                        className="rounded-lg border border-indigo-700 bg-indigo-950/70 p-2 text-indigo-300 hover:bg-indigo-900/70 disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 5. Submission History for this Problem */}
              {activeBottomTab === 'history' && (
                <div className="p-4 space-y-2">
                  {problemSubmissions.length === 0 ? (
                    <div className="text-xs text-slate-500">
                      No submissions recorded for this problem yet.
                    </div>
                  ) : (
                    problemSubmissions.map((s) => (
                      <div
                        key={s.id}
                        className="bg-[#121420] border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span
                            className={`font-semibold ${
                              s.status === 'Passed'
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {s.status === 'Passed' ? 'Accepted' : 'Wrong Answer'}
                          </span>
                          <span className="text-slate-400 ml-2 font-mono">
                            ({s.passedTests}/{s.totalTests} tests · {s.executionTime}
                            ms)
                          </span>
                        </div>
                        <div className="font-mono text-slate-400">
                          {s.xpEarned > 0 && (
                            <span className="text-indigo-400 mr-3">
                              +{s.xpEarned} XP
                            </span>
                          )}
                          <span>
                            {s.createdAt
                              ? new Date(s.createdAt).toLocaleString()
                              : 'Just now'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
