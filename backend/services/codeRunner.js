/**
 * Attend AI — Safe Sandbox Code Runner Helper
 * Builds isolated HTML/CSS/JS sandbox documents for client iframe execution.
 * Never executes untrusted user code on the Node.js host process.
 */

export function buildSandboxedRunnerDocument({ html = '', css = '', js = '', testCases = [] }) {
  const safeTests = JSON.stringify(
    testCases.map((tc) => ({
      id: tc.id,
      assertionScript: tc.assertion_script || tc.assertionScript || 'return true;',
    }))
  );

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>${css}</style>
</head>
<body>
${html}
<script>
try {
${js}
} catch (err) {
  console.error(err && err.message ? err.message : String(err));
}
</script>
<script>
setTimeout(function() {
  const tests = ${safeTests};
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
}, 40);
</script>
</body>
</html>`;
}
