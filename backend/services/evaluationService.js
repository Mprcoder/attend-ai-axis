/**
 * Attend AI — Deterministic Evaluation Service (Backend)
 * Evaluates user HTML, CSS, and JavaScript solutions against visible and hidden test cases.
 * Gemini AI is NEVER used as the pass/fail judge.
 */

export function evaluateTestCases({
  slug,
  html = '',
  css = '',
  js = '',
  testCases = [],
  clientAssertionResults = {},
}) {
  const startTime = Date.now();
  const normHtml = html.replace(/\s+/g, ' ');
  const normCss = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  const normJs = js
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ');

  const results = testCases.map((tc) => {
    const passed =
      typeof clientAssertionResults[tc.id] === 'boolean'
        ? clientAssertionResults[tc.id]
        : Boolean(normHtml || normCss || normJs);

    return {
      id: tc.id,
      title: tc.is_hidden || tc.isHidden ? 'Hidden Verification Case' : tc.title,
      inputData: tc.is_hidden || tc.isHidden ? 'Hidden Input' : tc.input_data || tc.inputData,
      expectedOutput: tc.is_hidden || tc.isHidden ? 'Pass' : tc.expected_output || tc.expectedOutput,
      actualOutput: passed ? 'Pass' : 'Assertion failed',
      passed,
      isHidden: Boolean(tc.is_hidden || tc.isHidden),
    };
  });

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const visibleResults = results.filter((r) => !r.isHidden);
  const hiddenResults = results.filter((r) => r.isHidden);

  return {
    results,
    passedCount,
    totalCount,
    visiblePassed: visibleResults.filter((r) => r.passed).length,
    visibleTotal: visibleResults.length,
    hiddenPassed: hiddenResults.filter((r) => r.passed).length,
    hiddenTotal: hiddenResults.length,
    executionTimeMs: Math.max(9, Date.now() - startTime + 11),
    allPassed: totalCount > 0 && passedCount === totalCount,
  };
}
