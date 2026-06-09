/**
 * OutcomeSpec AI — Gemini API Client  (v2 — truncation-safe)
 * ────────────────────────────────────────────────────────────
 * Requests only the CORE business-analysis fields from Gemini,
 * keeping the output small enough to avoid MAX_TOKENS truncation.
 * If truncation still occurs, the client:
 *   1. Attempts to repair the truncated JSON
 *   2. Retries with an even smaller prompt
 *   3. Falls back gracefully if both fail
 */

window.GeminiClient = (function () {

  // ── Helpers ──────────────────────────────────────────────────────────────

  function getConfig() {
    const cfg = window.GEMINI_CONFIG || {};
    return {
      apiKey : cfg.API_KEY           || '',
      model  : cfg.MODEL             || 'gemini-2.5-flash',
      base   : cfg.API_BASE          || 'https://generativelanguage.googleapis.com/v1beta',
      maxTok : cfg.MAX_OUTPUT_TOKENS  || 16384,
      temp   : cfg.TEMPERATURE       || 0.7,
    };
  }

  function isConfigured() {
    const key = (getConfig().apiKey || '').trim();
    return key.length > 0 && key !== 'YOUR_GEMINI_API_KEY_HERE';
  }

  // ── System prompt (requests the full technical blueprint payload) ─────────

  function buildSystemPrompt() {
    return `You are OutcomeSpec AI, an expert software architect and product analyst.
Analyze the user's product idea and return a SINGLE JSON object containing a complete product specification and development blueprint. Keep all string values concise (1-2 sentences) and keep arrays to 3-5 items to avoid excessive size.

Expected JSON structure:
{
  "productName": "marketable name",
  "productLabel": "domain category label",
  "businessAnalysis": "brief high-level summary of the business idea",
  "roles": ["role1", "role2"],
  "entities": ["entity1", "entity2"],
  "competitors": ["comp1", "comp2"],
  "revenueModel": "description of how the product makes money",
  "prd": {
    "problemStatement": "gap statement",
    "goals": ["goal1", "goal2"],
    "features": [
      {"name": "Feature Name", "description": "concise description"}
    ],
    "functional": ["req1", "req2"],
    "nonFunctional": ["req1", "req2"],
    "metrics": ["kpi1", "kpi2"]
  },
  "userStories": [
    {"as": "user role", "want": "I want to...", "so": "acceptance criteria"}
  ],
  "techStack": [
    {"layer": "Frontend", "tech": "React/Next.js", "reason": "reason"}
  ],
  "roadmap": {
    "timeline": "timeline description",
    "mvp": ["step1", "step2"],
    "phase2": ["step1"],
    "phase3": ["step1"]
  },
  "database": {
    "sql": "CREATE TABLE...",
    "nosql": "Document schema..."
  },
  "api": {
    "authStrategy": "JWT...",
    "errorHandling": "Standard envelope...",
    "endpoints": [
      {"method": "GET", "path": "/api/...", "desc": "description", "request": {}, "response": {}}
    ]
  },
  "frontend": {
    "pages": ["page1", "page2"],
    "components": ["comp1", "comp2"],
    "navFlow": "User flow...",
    "folderStructure": "src/..."
  },
  "vibeCoding": {
    "setup": "Setup command...",
    "db": "Db configuration...",
    "backend": "Backend script...",
    "frontend": "Frontend script...",
    "deploy": "Deployment command..."
  }
}

Rules:
- Return ONLY the JSON object — no markdown, no prose, no code fences.
- All string values must be short.
- Arrays must be kept to 3-5 items.`;
  }

  // ── Retry prompt (requests full blueprint but extremely brief) ───────────

  function buildRetryPrompt() {
    return `You are a software architect. The user describes an idea.
Return a SINGLE JSON object containing a complete product specification and development blueprint.
To avoid any token limit issues, keep every text value extremely short (less than 5-10 words) and keep arrays to exactly 2-3 items.
Return ONLY valid JSON without markdown formatting or code fences. Use the same key names.`;
  }

  // ── Response schemas for structured output enforcement ─────────────────────

  function getResponseSchema() {
    return {
      type: 'OBJECT',
      properties: {
        productName:  { type: 'STRING' },
        productLabel: { type: 'STRING' },
        businessAnalysis: { type: 'STRING' },
        roles: { type: 'ARRAY', items: { type: 'STRING' } },
        entities: { type: 'ARRAY', items: { type: 'STRING' } },
        competitors: { type: 'ARRAY', items: { type: 'STRING' } },
        revenueModel: { type: 'STRING' },
        prd: {
          type: 'OBJECT',
          properties: {
            problemStatement: { type: 'STRING' },
            goals:          { type: 'ARRAY', items: { type: 'STRING' } },
            features:       { type: 'ARRAY', items: {
              type: 'OBJECT',
              properties: {
                name:        { type: 'STRING' },
                description: { type: 'STRING' }
              },
              required: ['name', 'description']
            }},
            functional:    { type: 'ARRAY', items: { type: 'STRING' } },
            nonFunctional: { type: 'ARRAY', items: { type: 'STRING' } },
            metrics:       { type: 'ARRAY', items: { type: 'STRING' } }
          },
          required: ['problemStatement', 'goals', 'features', 'functional', 'nonFunctional', 'metrics']
        },
        userStories: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              as:   { type: 'STRING' },
              want: { type: 'STRING' },
              so:   { type: 'STRING' }
            },
            required: ['as', 'want', 'so']
          }
        },
        techStack: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              layer:  { type: 'STRING' },
              tech:   { type: 'STRING' },
              reason: { type: 'STRING' }
            },
            required: ['layer', 'tech', 'reason']
          }
        },
        roadmap: {
          type: 'OBJECT',
          properties: {
            timeline: { type: 'STRING' },
            mvp:      { type: 'ARRAY', items: { type: 'STRING' } },
            phase2:   { type: 'ARRAY', items: { type: 'STRING' } },
            phase3:   { type: 'ARRAY', items: { type: 'STRING' } }
          },
          required: ['timeline', 'mvp', 'phase2', 'phase3']
        },
        database: {
          type: 'OBJECT',
          properties: {
            sql:   { type: 'STRING' },
            nosql: { type: 'STRING' }
          },
          required: ['sql', 'nosql']
        },
        api: {
          type: 'OBJECT',
          properties: {
            authStrategy:  { type: 'STRING' },
            errorHandling: { type: 'STRING' },
            endpoints:     { type: 'ARRAY', items: {
              type: 'OBJECT',
              properties: {
                method:   { type: 'STRING' },
                path:     { type: 'STRING' },
                desc:     { type: 'STRING' }
              },
              required: ['method', 'path', 'desc']
            }}
          },
          required: ['authStrategy', 'errorHandling', 'endpoints']
        },
        frontend: {
          type: 'OBJECT',
          properties: {
            pages:           { type: 'ARRAY', items: { type: 'STRING' } },
            components:      { type: 'ARRAY', items: { type: 'STRING' } },
            navFlow:         { type: 'STRING' },
            folderStructure: { type: 'STRING' }
          },
          required: ['pages', 'components', 'navFlow', 'folderStructure']
        },
        vibeCoding: {
          type: 'OBJECT',
          properties: {
            setup:    { type: 'STRING' },
            db:       { type: 'STRING' },
            backend:  { type: 'STRING' },
            frontend: { type: 'STRING' },
            deploy:   { type: 'STRING' }
          },
          required: ['setup', 'db', 'backend', 'frontend', 'deploy']
        }
      },
      required: [
        'productName', 'productLabel', 'businessAnalysis', 'roles', 'entities', 'competitors', 'revenueModel',
        'prd', 'userStories', 'techStack', 'roadmap', 'database', 'api', 'frontend', 'vibeCoding'
      ]
    };
  }

  function getRetryResponseSchema() {
    return getResponseSchema();
  }

  // ── JSON repair for truncated responses ──────────────────────────────────

  function repairTruncatedJSON(raw) {
    console.log('[DIAG-REPAIR] Attempting JSON repair on', raw.length, 'chars');

    let text = raw.trim();

    // Strip markdown fences
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    // Try parsing as-is first
    try {
      return JSON.parse(text);
    } catch (_) {
      // Continue to repair
    }

    // Track parser state to find where truncation happened
    let inString = false;
    let escaped  = false;
    let stack    = [];      // tracks '{' and '['

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }

      if (inString) {
        if (ch === '"') inString = false;
        continue;
      }

      switch (ch) {
        case '"': inString = true; break;
        case '{': stack.push('}'); break;
        case '[': stack.push(']'); break;
        case '}':
        case ']':
          if (stack.length && stack[stack.length - 1] === ch) stack.pop();
          break;
      }
    }

    // If we ended inside a string, close it
    if (inString) {
      // Remove any trailing incomplete escape
      text = text.replace(/\\+$/, '');
      text += '"';
      console.log('[DIAG-REPAIR] Closed open string');
    }

    // Remove trailing comma or colon (incomplete key-value)
    text = text.replace(/[,:\s]+$/, '');

    // If the last non-whitespace is a colon or key without value, remove the dangling key
    // e.g. ..."someKey": → remove ,"someKey"
    text = text.replace(/,\s*"[^"]*"\s*$/, '');

    // Close all open brackets/braces
    while (stack.length) {
      text += stack.pop();
    }

    console.log('[DIAG-REPAIR] Repaired text (last 200 chars):', text.slice(-200));

    try {
      const parsed = JSON.parse(text);
      console.log('%c[DIAG-REPAIR] ✓ Repair successful', 'color: lime; font-weight: bold');
      console.log('[DIAG-REPAIR] Recovered keys:', Object.keys(parsed));
      return parsed;
    } catch (e) {
      console.error('%c[DIAG-REPAIR] ✗ Repair failed', 'color: red; font-weight: bold');
      console.error('[DIAG-REPAIR]', e.message);
      return null;
    }
  }

  // ── Core API call (shared by primary + retry) ────────────────────────────

  async function callGemini(userPrompt, systemPrompt, label, schemaObj, modelOverride) {
    const cfg = getConfig();
    const model = modelOverride || cfg.model;
    const url = `${cfg.base}/models/${model}:generateContent?key=${cfg.apiKey}`;

    const generationConfig = {
      temperature     : cfg.temp,
      maxOutputTokens : cfg.maxTok,
      responseMimeType: 'application/json',
      // Disable "thinking" mode for gemini-2.5-flash — without this,
      // the model spends ~7000 tokens on internal reasoning, leaving
      // almost nothing for the actual JSON response (causes MAX_TOKENS).
      thinkingConfig  : { thinkingBudget: 0 },
    };

    // Add responseSchema for structured output enforcement
    if (schemaObj) {
      generationConfig.responseSchema = schemaObj;
      console.log(`[DIAG-API] [${label}] responseSchema attached ✓`);
    }

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: `Product idea: ${userPrompt}` }] }],
      generationConfig,
    };

    const retryDelays = [2000, 5000, 10000];
    const retryableStatuses = [429, 500, 503];

    for (let attempt = 0; attempt <= 3; attempt++) {
      if (attempt > 0) {
        const delayMs = retryDelays[attempt - 1];
        console.warn(`[DIAG-RETRY] [${label}] Attempt ${attempt} failed (retryable error). Waiting ${delayMs / 1000} seconds before Retry ${attempt} (Total Attempt ${attempt + 1}/4)...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      console.log(`%c[DIAG-API] [${label}] Calling Gemini (Model: ${model}, Attempt ${attempt + 1}/4)...`, 'color: cyan; font-weight: bold');
      console.log(`[DIAG-API] [${label}] URL (key hidden):`, url.replace(cfg.apiKey, '***'));
      console.log(`[DIAG-API] [${label}] maxOutputTokens:`, cfg.maxTok);

      // ── Fetch ──────────────────────────────────────────────────────────
      let response;
      try {
        response = await fetch(url, {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify(body),
        });
      } catch (networkErr) {
        console.error(`[DIAG-API] [${label}] Network error on attempt ${attempt + 1}:`, networkErr.message);
        if (attempt === 3) {
          console.error(`[DIAG-RETRY] [${label}] Final failure on attempt 4.`);
          throw new Error(`Network error: ${networkErr.message}`);
        }
        continue;
      }

      // ── HTTP status ────────────────────────────────────────────────────
      console.log(`[DIAG-API] [${label}] HTTP ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error(`[DIAG-API] [${label}] Error body on attempt ${attempt + 1}:`, errText);

        if (retryableStatuses.includes(response.status) && attempt < 3) {
          continue;
        }

        console.error(`[DIAG-RETRY] [${label}] Final failure on attempt ${attempt + 1} with HTTP ${response.status}.`);
        throw new Error(`Gemini API ${response.status}: ${errText}`);
      }

      console.log(`[DIAG-RETRY] [${label}] Success on attempt ${attempt + 1}!`);
      const apiResponse = await response.json();

      // ── Candidate metadata ─────────────────────────────────────────────
      const candidate    = apiResponse?.candidates?.[0] || {};
      const finishReason = candidate.finishReason || 'UNKNOWN';
      const tokenMeta    = apiResponse?.usageMetadata || {};
      const rawText      = candidate?.content?.parts?.[0]?.text || '';

      console.log(`[DIAG-API] [${label}] finishReason:`, finishReason);
      console.log(`[DIAG-API] [${label}] promptTokenCount:`, tokenMeta.promptTokenCount);
      console.log(`[DIAG-API] [${label}] candidatesTokenCount:`, tokenMeta.candidatesTokenCount);
      console.log(`[DIAG-API] [${label}] totalTokenCount:`, tokenMeta.totalTokenCount);
      console.log(`[DIAG-API] [${label}] Raw response length:`, rawText.length, 'chars');
      console.log(`[DIAG-API] [${label}] Raw text (first 500):`, rawText.substring(0, 500));

      return { rawText, finishReason, tokenMeta };
    }
  }

  // ── Main exported function ────────────────────────────────────────────────

  async function generateBlueprint(userPrompt) {
    console.log('%c[DIAG-API] ── generateBlueprint() v2 ──', 'color: magenta; font-weight: bold');

    if (!isConfigured()) {
      throw new Error('Gemini API key not configured. Open gemini-config.js and add your key.');
    }

    const cfg = getConfig();
    const primaryModel = cfg.model;
    const modelChain = [primaryModel];
    if (!modelChain.includes('gemini-2.5-flash-lite')) modelChain.push('gemini-2.5-flash-lite');
    if (!modelChain.includes('gemini-1.5-flash')) modelChain.push('gemini-1.5-flash');

    let parsed = null;
    let lastError = null;

    for (const model of modelChain) {
      console.log(`%c[DIAG-FALLBACK] Trying model: ${model}`, 'color: yellow; font-weight: bold');
      try {
        // ── ATTEMPT 1: Full prompt with responseSchema ──────────────────────
        let result = await callGemini(userPrompt, buildSystemPrompt(), 'ATTEMPT-1', getResponseSchema(), model);
        parsed = tryParse(result.rawText, 'ATTEMPT-1');

        // ── If MAX_TOKENS: try repairing the truncated JSON ────────────────
        if (!parsed && result.finishReason === 'MAX_TOKENS') {
          console.warn('%c[DIAG-API] MAX_TOKENS detected — attempting JSON repair', 'color: orange; font-weight: bold');
          parsed = repairTruncatedJSON(result.rawText);
        }

        // ── If still no parsed data: ATTEMPT 2 with minimal prompt ─────────
        if (!parsed) {
          console.warn('%c[DIAG-API] Attempt 1 failed to yield valid JSON — retrying with minimal prompt', 'color: orange; font-weight: bold');
          result = await callGemini(userPrompt, buildRetryPrompt(), 'ATTEMPT-2', getRetryResponseSchema(), model);
          parsed = tryParse(result.rawText, 'ATTEMPT-2');

          if (!parsed && result.finishReason === 'MAX_TOKENS') {
            parsed = repairTruncatedJSON(result.rawText);
          }
        }

        if (parsed) {
          console.log(`%c[DIAG-FALLBACK] ✓ Success with model ${model}`, 'color: lime; font-weight: bold');
          break;
        }
      } catch (err) {
        console.error(`[DIAG-FALLBACK] Model ${model} failed entirely:`, err.message);
        lastError = err;
      }
    }

    // ── Final check ────────────────────────────────────────────────────
    if (!parsed) {
      throw new Error(`Could not generate blueprint after trying all models in chain. Last error: ${lastError ? lastError.message : 'Unknown error'}`);
    }

    console.log('%c[DIAG-API] ✓ Blueprint ready', 'color: lime; font-weight: bold');
    console.log('[DIAG-API] Top-level keys:', Object.keys(parsed));
    return parsed;
  }

  // ── Parse helper ──────────────────────────────────────────────────────────

  function tryParse(rawText, label) {
    if (!rawText || !rawText.trim()) {
      console.error(`[DIAG-API] [${label}] Raw text is empty`);
      return null;
    }

    try {
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();
      const obj = JSON.parse(cleaned);
      console.log(`%c[DIAG-API] [${label}] ✓ JSON.parse succeeded`, 'color: lime');
      return obj;
    } catch (e) {
      console.error(`[DIAG-API] [${label}] ✗ JSON.parse failed:`, e.message);
      return null;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    isConfigured,
    generateBlueprint,
  };

})();
