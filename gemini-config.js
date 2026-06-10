/**
 * OutcomeSpec AI — Gemini API Configuration
 * ─────────────────────────────────────────
 * 1. Go to https://aistudio.google.com/app/apikey
 * 2. Create an API key (free tier available)
 * 3. Paste it below, replacing the placeholder string
 *
 * This file is intentionally separate so you can add it to .gitignore.
 * NEVER commit a real API key to a public repository.
 */

window.GEMINI_CONFIG = {
  // API key is now secured on the Vercel backend environment variables (GEMINI_API_KEY)
  API_KEY: '',

  // Model to use — gemini-2.0-flash is fast and generous on free tier
  MODEL: 'gemini-2.5-flash',

  // API endpoint (no trailing slash)
  API_BASE: 'https://generativelanguage.googleapis.com/v1beta',

  // Max tokens for the blueprint response (keep high for complete JSON)
  MAX_OUTPUT_TOKENS: 65536,

  // Temperature — 0.7 gives creative-yet-structured output
  TEMPERATURE: 0.7,
};
