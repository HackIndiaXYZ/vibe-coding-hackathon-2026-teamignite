/**
 * OutcomeSpec AI — Gemini API Client  (v3 — Secure Vercel Backend Client)
 * ────────────────────────────────────────────────────────────
 * Calls the secure Vercel serverless backend endpoint (/api/generate-blueprint)
 * to run Gemini generation. This keeps the API key private.
 */

window.GeminiClient = (function () {

  function isConfigured() {
    // The Gemini API key is now securely configured on the server environment.
    // We return true to allow the frontend workflow to run.
    return true;
  }

  async function generateBlueprint(userPrompt) {
    console.log('%c[DIAG-API] ── generateBlueprint() (Backend Routed) ──', 'color: magenta; font-weight: bold');
    console.log('[DIAG-API] Posting prompt to /api/generate-blueprint');

    const response = await fetch('/api/generate-blueprint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: userPrompt }),
    });

    if (!response.ok) {
      let errText = '';
      try {
        const errJson = await response.json();
        errText = errJson.error || errJson.message || '';
      } catch (_) {
        errText = await response.text().catch(() => '');
      }
      throw new Error(errText || `Server error: ${response.status}`);
    }

    const parsedBlueprint = await response.json();
    return parsedBlueprint;
  }

  return {
    isConfigured,
    generateBlueprint,
  };

})();
