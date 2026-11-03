// Attend AI — Monaco Editor & Sandboxed Live Preview Controller (Phase 4)

export function createSandboxedSrcDoc({ html = '', css = '', js = '', testCases = [] }) {
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
<style>${css}</style>
</head>
<body>
${html}
<script>
(function() {
  const forward = (level, args) => {
    try {
      const message = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      parent.postMessage({ source: 'attend-ai-sandbox-console', level, message }, '*');
    } catch (e) {}
  };
  console.log = function() { forward('log', arguments); };
  console.warn = function() { forward('warn', arguments); };
  console.error = function() { forward('error', arguments); };
})();
try {
  ${js}
} catch (err) {
  console.error(err && err.message ? err.message : String(err));
}
setTimeout(function() {
  const tests = ${serializedTests};
  const results = {};
  for (const t of tests) {
    try {
      results[t.id] = Boolean(new Function(t.assertionScript)());
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
