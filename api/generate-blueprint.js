// api/generate-blueprint.js

// Default configurations matching gemini-config.js
const MODEL = 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MAX_OUTPUT_TOKENS = 65536;
const TEMPERATURE = 0.7;

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
    "frontend": ["Build the [specific component] with [specific features] using [tech from techStack]", "..."],
    "backend": ["Implement the [specific service] with [business logic from features]", "..."],
    "database": ["Design the [entity] schema with [specific relations and indexes]", "..."],
    "api": ["Build the [specific endpoint path] with [auth, validation, business rules]", "..."],
    "ai": ["Implement [specific AI feature] for [product-specific use case]", "..."],
    "testing": ["Write [test type] for [specific feature/flow]", "..."],
    "deployment": ["Configure [specific deployment tool] for [product-specific infra]", "..."]
  }
}

Rules:
- Return ONLY the JSON object — no markdown, no prose, no code fences.
- All string values must be short (1-2 sentences).
- Arrays must be kept to 3-5 items.
- vibeCoding prompts MUST be specific to the product. Reference actual feature names, entity names, API paths, and tech stack choices from the generated blueprint. NEVER use generic placeholders like "npm install" or "npm run dev". Each prompt should be a detailed, actionable implementation task that a developer can paste into an AI coding assistant.`;
}

function buildRetryPrompt() {
  return `You are a software architect. The user describes an idea.
Return a SINGLE JSON object containing a complete product specification and development blueprint.
To avoid any token limit issues, keep every text value extremely short (less than 5-10 words) and keep arrays to exactly 2-3 items.
The vibeCoding field must have 7 keys (frontend, backend, database, api, ai, testing, deployment), each an array of 2-3 product-specific implementation prompts. Never use generic commands.
Return ONLY valid JSON without markdown formatting or code fences. Use the same key names.`;
}

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
          frontend:   { type: 'ARRAY', items: { type: 'STRING' } },
          backend:    { type: 'ARRAY', items: { type: 'STRING' } },
          database:   { type: 'ARRAY', items: { type: 'STRING' } },
          api:        { type: 'ARRAY', items: { type: 'STRING' } },
          ai:         { type: 'ARRAY', items: { type: 'STRING' } },
          testing:    { type: 'ARRAY', items: { type: 'STRING' } },
          deployment: { type: 'ARRAY', items: { type: 'STRING' } }
        },
        required: ['frontend', 'backend', 'database', 'api', 'ai', 'testing', 'deployment']
      }
    },
    required: [
      'productName', 'productLabel', 'businessAnalysis', 'roles', 'entities', 'competitors', 'revenueModel',
      'prd', 'userStories', 'techStack', 'roadmap', 'database', 'api', 'frontend', 'vibeCoding'
    ]
  };
}

function repairTruncatedJSON(raw) {
  console.log('[DIAG-REPAIR] Attempting JSON repair on', raw.length, 'chars');

  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  try {
    return JSON.parse(text);
  } catch (_) {}

  let inString = false;
  let escaped  = false;
  let stack    = [];

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

  if (inString) {
    text = text.replace(/\\+$/, '');
    text += '"';
  }

  text = text.replace(/[,:\s]+$/, '');
  text = text.replace(/,\s*"[^"]*"\s*$/, '');

  while (stack.length) {
    text += stack.pop();
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

async function callGemini(userPrompt, systemPrompt, label, schemaObj, modelOverride) {
  const model = modelOverride || MODEL;
  const url = `${API_BASE}/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const generationConfig = {
    temperature     : TEMPERATURE,
    maxOutputTokens : MAX_OUTPUT_TOKENS,
    responseMimeType: 'application/json',
    thinkingConfig  : { thinkingBudget: 0 },
  };

  if (schemaObj) {
    generationConfig.responseSchema = schemaObj;
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
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    let response;
    try {
      response = await fetch(url, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body),
      });
    } catch (networkErr) {
      if (attempt === 3) {
        throw new Error(`Network error: ${networkErr.message}`);
      }
      continue;
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      if (retryableStatuses.includes(response.status) && attempt < 3) {
        continue;
      }
      throw new Error(`Gemini API ${response.status}: ${errText}`);
    }

    const apiResponse = await response.json();
    const candidate    = apiResponse?.candidates?.[0] || {};
    const finishReason = candidate.finishReason || 'UNKNOWN';
    const tokenMeta    = apiResponse?.usageMetadata || {};
    const rawText      = candidate?.content?.parts?.[0]?.text || '';

    return { rawText, finishReason, tokenMeta };
  }
}

function tryParse(rawText) {
  if (!rawText || !rawText.trim()) return null;
  try {
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

module.exports = async function handler(req, res) {

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "prompt" parameter in request body' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key is not configured on the server environment.' });
  }

  console.log(`[API] Starting generation for prompt: "${prompt.substring(0, 60)}..."`);

  const modelChain = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ];
  let parsed = null;
  let lastError = null;

  for (const model of modelChain) {
    console.log(`[API] Trying model: ${model}`);
    try {
      let result = await callGemini(prompt, buildSystemPrompt(), 'ATTEMPT-1', getResponseSchema(), model);
      parsed = tryParse(result.rawText);

      if (!parsed && result.finishReason === 'MAX_TOKENS') {
        console.log('[API] MAX_TOKENS reached on ATTEMPT-1. Repairing JSON...');
        parsed = repairTruncatedJSON(result.rawText);
      }

      if (!parsed) {
        console.log('[API] ATTEMPT-1 failed or was unparseable. Retrying with ATTEMPT-2 (minimal prompt)...');
        result = await callGemini(prompt, buildRetryPrompt(), 'ATTEMPT-2', getResponseSchema(), model);
        parsed = tryParse(result.rawText);

        if (!parsed && result.finishReason === 'MAX_TOKENS') {
          console.log('[API] MAX_TOKENS reached on ATTEMPT-2. Repairing JSON...');
          parsed = repairTruncatedJSON(result.rawText);
        }
      }

      if (parsed) {
        console.log(`[API] Successfully generated blueprint with model: ${model}`);
        break;
      }
    } catch (err) {
      console.error(`[API] Model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  if (!parsed) {
    return res.status(502).json({
      error: `Could not generate blueprint after trying all models. Last error: ${lastError ? lastError.message : 'Unknown error'}`
    });
  }

  return res.status(200).json(parsed);
};
