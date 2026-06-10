// OutcomeSpec AI - Core Application Logic & Semantic Domain Compiler

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const promptInput = document.getElementById('prompt-input');
  const charCount = document.getElementById('char-count');
  const generateBtn = document.getElementById('generate-btn');
  const inputView = document.getElementById('input-view');
  const loadingView = document.getElementById('loading-view');
  const blueprintView = document.getElementById('blueprint-view');
  const newSpecBtn = document.getElementById('new-spec-btn');
  const downloadMdBtn = document.getElementById('download-md-btn');
  const copyFullBtn = document.getElementById('copy-full-btn');
  
  const specProductName = document.getElementById('spec-product-name');
  const specProductType = document.getElementById('spec-product-type');
  const analysisView = document.getElementById('analysis-view');
  const continueBtn = document.getElementById('continue-btn');
  const refineIdeaBtn = document.getElementById('refine-idea-btn');
  const analysisCategory = document.getElementById('analysis-category');
  const analysisCompetitors = document.getElementById('analysis-competitors');
  const analysisRoles = document.getElementById('analysis-roles');
  const analysisEntities = document.getElementById('analysis-entities');
  const analysisRevenue = document.getElementById('analysis-revenue');
  
  const loadingTitle = document.getElementById('loading-title');
  const progressbarFill = document.getElementById('progressbar-fill');
  
  // Navigation tabs
  const sidebarNavBtns = document.querySelectorAll('.sidebar-nav-btn');
  const sectionContainers = document.querySelectorAll('.blueprint-section-container');
  
  // State variables
  let generatedData = null;
  let activeTabId = 'sec-executive';
  let activeDbTab = 'relational';
  let activeVibePrompt = 'frontend';

  // Debug logging helper: appends to a hidden DOM node and also logs to console
  (function initDebugLogger() {
    let devLogsEl = document.getElementById('dev-logs');
    if (!devLogsEl) {
      devLogsEl = document.createElement('pre');
      devLogsEl.id = 'dev-logs';
      devLogsEl.style.cssText = 'position:fixed; bottom:0; left:0; right:0; max-height:180px; overflow:auto; background:rgba(0,0,0,0.75); color:#e6e6e6; font-size:12px; display:none; z-index:9999; padding:8px; margin:0;';
      document.body.appendChild(devLogsEl);
    }

    window.debugLog = (label, obj) => {
      try {
        const text = label + ': ' + (typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2));
        console.log(label, obj);
        devLogsEl.textContent += text + '\n';
      } catch (e) {
        console.log(label, obj);
      }
    };

    window.toggleDevLogs = () => {
      devLogsEl.style.display = devLogsEl.style.display === 'none' ? 'block' : 'none';
    };
  })();

  // Characters counter
  promptInput.addEventListener('input', () => {
    const len = promptInput.value.length;
    charCount.textContent = len;
    if (len > 1000) {
      promptInput.value = promptInput.value.substring(0, 1000);
      charCount.textContent = 1000;
    }
  });

  // Suggestion chips handler
  const suggestionPills = document.querySelectorAll('.suggestion-pill');
  suggestionPills.forEach(pill => {
    pill.addEventListener('click', () => {
      promptInput.value = pill.getAttribute('data-prompt');
      charCount.textContent = promptInput.value.length;
      promptInput.focus();
    });
  });

  // Sidebar Tab Switching
  sidebarNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      
      // Update nav buttons active state
      sidebarNavBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update section containers active state (only active is visible)
      sectionContainers.forEach(c => {
        if (c.id === target) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
      
      activeTabId = target;
      
      // Scroll layout container to the top instantly
      const layoutEl = document.querySelector('.blueprint-layout');
      if (layoutEl) {
        const yOffset = -20; // visual margin
        const y = layoutEl.offsetTop + yOffset;
        window.scrollTo({ top: y, behavior: 'instant' });
      }
    });
  });

  // Floating Back to Top Button Logic
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Main Generate Button Handler
  generateBtn.addEventListener('click', () => {
    const rawPrompt = promptInput.value.trim();
    if (!rawPrompt) {
      showToast('Please enter a product idea or select a template.', 'error');
      promptInput.focus();
      return;
    }

    // Log original user prompt for debugging / audit
    if (window.debugLog) window.debugLog('Original user prompt', rawPrompt);

    // Switch view to loading
    inputView.classList.remove('active');
    loadingView.classList.add('active');
    
    // Begin step simulation
    startSimulation(rawPrompt);
  });

  // Reset Button Handler
  newSpecBtn.addEventListener('click', () => {
    blueprintView.classList.remove('active');
    analysisView.classList.remove('active');
    inputView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  continueBtn.addEventListener('click', () => {
    analysisView.classList.remove('active');
    populateBlueprintView();
    blueprintView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  refineIdeaBtn.addEventListener('click', () => {
    analysisView.classList.remove('active');
    inputView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Export Full Markdown Spec
  downloadMdBtn.addEventListener('click', () => {
    if (!generatedData) return;
    
    const fullMarkdown = compileFullMarkdown();
    const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fileName = generatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-specification-blueprint.md';
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Markdown specification downloaded successfully!');
  });

  // Copy Full Markdown Spec to Clipboard
  copyFullBtn.addEventListener('click', () => {
    if (!generatedData) return;
    
    const fullMarkdown = compileFullMarkdown();
    navigator.clipboard.writeText(fullMarkdown).then(() => {
      showToast('Full Markdown blueprint copied to clipboard!');
    }).catch(err => {
      showToast('Failed to copy. Please try again.', 'error');
    });
  });

  // Toast Notification Trigger
  window.showToast = function(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('.toast-icon');
    
    toastMsg.textContent = message;
    
    if (type === 'error') {
      toast.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(239, 68, 68, 0.1)';
      toastIcon.textContent = '✕';
      toastIcon.style.color = 'var(--error)';
    } else {
      toast.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(16, 185, 129, 0.1)';
      toastIcon.textContent = '✓';
      toastIcon.style.color = 'var(--success)';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  };

  // Copy Section handler (attached to button inline)
  window.copySectionText = function(sectionId) {
    if (!generatedData) return;
    
    const markdownText = compileSectionMarkdown(sectionId);
    navigator.clipboard.writeText(markdownText).then(() => {
      showToast('Section markdown copied to clipboard!');
    }).catch(err => {
      showToast('Failed to copy. Please try again.', 'error');
    });
  };

  // Switch Sub-tabs for Database (SQL / NoSQL)
  document.getElementById('db-sub-tabs').addEventListener('click', (e) => {
    if (!e.target.classList.contains('tech-sub-tab-btn')) return;
    
    const type = e.target.getAttribute('data-type');
    activeDbTab = type;
    
    // Toggle active classes on tab buttons
    document.querySelectorAll('#db-sub-tabs .tech-sub-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Re-render Database section
    renderDatabaseSection();
  });

  // Switch Sub-tabs for Vibe Prompts
  document.getElementById('vibe-copier-tabs').addEventListener('click', (e) => {
    if (!e.target.classList.contains('vibe-pill-btn')) return;
    
    const promptKey = e.target.getAttribute('data-prompt');
    activeVibePrompt = promptKey;
    
    // Toggle active classes on prompt buttons
    document.querySelectorAll('#vibe-copier-tabs .vibe-pill-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Re-render Vibe Prompt section
    renderVibeSection();
  });

  // =========================================
  // SIMULATION ENGINE  (now async — fires Gemini in parallel)
  // =========================================
  async function startSimulation(prompt) {
    const steps = [
      { id: 'step-0', title: 'Sending idea to Gemini AI for analysis...', duration: 1000 },
      { id: 'step-1', title: 'Designing product requirements document...', duration: 1100 },
      { id: 'step-2', title: 'Creating SQL & NoSQL database schemas...', duration: 1100 },
      { id: 'step-3', title: 'Designing RESTful API specifications...', duration: 1100 },
      { id: 'step-4', title: 'Building frontend & backend architecture plans...', duration: 1100 },
      { id: 'step-5', title: 'Preparing final development roadmap & vibe prompts...', duration: 900 }
    ];

    // Reset status on all items
    steps.forEach((step, idx) => {
      const el = document.getElementById(step.id);
      el.className = 'loading-step-item';
      el.querySelector('.step-bullet').textContent = idx + 1;
    });

    progressbarFill.style.width = '0%';

    // ── Fire Gemini request in parallel with the animation ──────────────────
    // We start it NOW so it runs while the steps play out (≈6 s total).
    // If GeminiClient is not available or not configured, we fall back immediately.
    let geminiPromise = null;

    // ── DIAGNOSTIC LOGGING (will be removed after debugging) ────────────────
    console.log('%c[DIAG] ── Gemini Integration Debug ──', 'color: cyan; font-weight: bold');
    console.log('[DIAG] window.GeminiClient exists?', !!window.GeminiClient);
    console.log('[DIAG] window.GEMINI_CONFIG exists?', !!window.GEMINI_CONFIG);
    if (window.GEMINI_CONFIG) {
      console.log('[DIAG] API_KEY value (first 10 chars):', (window.GEMINI_CONFIG.API_KEY || '').substring(0, 10) + '...');
      console.log('[DIAG] API_KEY length:', (window.GEMINI_CONFIG.API_KEY || '').length);
      console.log('[DIAG] MODEL:', window.GEMINI_CONFIG.MODEL);
      console.log('[DIAG] API_BASE:', window.GEMINI_CONFIG.API_BASE);
    }
    if (window.GeminiClient) {
      console.log('[DIAG] isConfigured():', window.GeminiClient.isConfigured());
    }
    // ── END DIAGNOSTIC ──────────────────────────────────────────────────────

    if (window.GeminiClient && window.GeminiClient.isConfigured()) {
      console.log('%c[DIAG] ✓ Gemini IS configured — firing API request now', 'color: lime; font-weight: bold');
      if (window.debugLog) window.debugLog('[Gemini] Firing API request in parallel with animation', prompt);
      geminiPromise = window.GeminiClient.generateBlueprint(prompt).catch(err => {
        console.error('%c[DIAG] ✗ Gemini API call FAILED', 'color: red; font-weight: bold');
        console.error('[DIAG] Error name:', err.name);
        console.error('[DIAG] Error message:', err.message);
        console.error('[DIAG] Full error:', err);
        if (window.debugLog) window.debugLog('[Gemini] API call failed', err.message);
        return null;
      });
    } else {
      console.warn('%c[DIAG] ✗ Gemini NOT configured — skipping API call entirely', 'color: orange; font-weight: bold');
      console.warn('[DIAG] Reason: GeminiClient exists?', !!window.GeminiClient, '| isConfigured?', window.GeminiClient ? window.GeminiClient.isConfigured() : 'N/A');
      if (window.debugLog) window.debugLog('[Gemini] Not configured', 'Set API_KEY in gemini-config.js');
    }

    // ── Animate the loading steps ───────────────────────────────────────────
    let currentStepIndex = 0;

    await new Promise(resolve => {
      function runNextStep() {
        if (currentStepIndex >= steps.length) {
          progressbarFill.style.width = '100%';
          resolve();
          return;
        }

        const step = steps[currentStepIndex];
        const stepEl = document.getElementById(step.id);

        stepEl.classList.add('active');
        loadingTitle.textContent = step.title;

        const percent = Math.floor((currentStepIndex / steps.length) * 100);
        progressbarFill.style.width = `${percent}%`;

        setTimeout(() => {
          stepEl.classList.remove('active');
          stepEl.classList.add('completed');
          stepEl.querySelector('.step-bullet').innerHTML = `
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          `;
          currentStepIndex++;
          runNextStep();
        }, step.duration);
      }
      runNextStep();
    });

    // ── Wait for Gemini (it may already be done) ────────────────────────────
    let geminiRaw = null;
    if (geminiPromise) {
      geminiRaw = await geminiPromise; // may be null if it errored
    }

    if (geminiRaw) {
      // Parse Gemini response directly (no local baseline template used)
      generatedData = mergeGeminiBlueprint(geminiRaw, {}, prompt);
      if (window.debugLog) window.debugLog('[Gemini] Blueprint generated successfully ✓', generatedData);

      // ── Transition to analysis view ─────────────────────────────────────────
      setTimeout(() => {
        populateAnalysisView();
        loadingView.classList.remove('active');
        analysisView.classList.add('active');
      }, 300);
    } else {
      // Show error toast and transition back to landing view
      showToast('Gemini blueprint generation failed. Please try again.', 'error');
      setTimeout(() => {
        loadingView.classList.remove('active');
        inputView.classList.add('active');
      }, 300);
    }
  }

  // =========================================
  // PAYLOAD & DIAGRAM GENERATOR HELPERS
  // =========================================
  function generateRequestPayload(endpoint, entities, features) {
    const method = endpoint.method?.toUpperCase() || 'GET';
    const path = endpoint.path || '/';
    const desc = endpoint.desc?.toLowerCase() || '';

    const payload = {};

    if (method === 'GET') {
      if (path.includes('{') || path.includes(':')) {
        const param = path.match(/\{?:?(\w+)\}?/) || ['', 'id'];
        payload[param[1]] = 'string_or_id_value';
      }
      if (desc.includes('search') || desc.includes('filter') || desc.includes('list')) {
        payload.query = 'search_term';
        payload.limit = 10;
        payload.offset = 0;
      }
    } else if (method === 'POST' || method === 'PUT') {
      const entityName = entities?.[0] || 'data';
      const feature = features?.[0] || {};
      const featureName = typeof feature === 'string' ? feature : (feature.name || 'Feature');

      payload.id = 'auto_generated_uuid';
      payload[entityName.toLowerCase().slice(0, -1) || 'item'] = {
        name: `${entityName} Name`,
        description: `${featureName} description`,
        status: 'active',
        metadata: { created: 'timestamp', updated: 'timestamp' }
      };
      payload.userId = 'authenticated_user_id';
    } else if (method === 'DELETE') {
      const param = path.match(/\{?:?(\w+)\}?/) || ['', 'id'];
      payload[param[1]] = 'resource_id_to_delete';
    }

    return Object.keys(payload).length > 0 ? payload : { message: 'Request payload', timestamp: 'ISO8601' };
  }

  function generateResponsePayload(endpoint, entities, features) {
    const method = endpoint.method?.toUpperCase() || 'GET';
    const desc = endpoint.desc?.toLowerCase() || '';
    const entityName = entities?.[0] || 'Data';

    const baseResponse = {
      success: true,
      timestamp: 'ISO8601_timestamp',
      requestId: 'correlation_uuid'
    };

    if (method === 'GET') {
      if (desc.includes('list') || desc.includes('search') || desc.includes('all')) {
        return {
          ...baseResponse,
          data: [
            {
              id: 'uuid_1',
              [entityName.toLowerCase().slice(0, -1) || 'item']: 'example_value',
              status: 'active',
              createdAt: 'ISO8601',
              updatedAt: 'ISO8601'
            }
          ],
          pagination: { limit: 10, offset: 0, total: 42 }
        };
      }
      return {
        ...baseResponse,
        data: {
          id: 'uuid',
          [entityName.toLowerCase().slice(0, -1) || 'item']: 'example_value',
          status: 'active',
          createdAt: 'ISO8601',
          updatedAt: 'ISO8601'
        }
      };
    } else if (method === 'POST') {
      return {
        ...baseResponse,
        data: {
          id: 'newly_created_uuid',
          [entityName.toLowerCase().slice(0, -1) || 'item']: 'created_value',
          status: 'pending',
          createdAt: 'ISO8601'
        },
        message: `${entityName} created successfully`
      };
    } else if (method === 'PUT') {
      return {
        ...baseResponse,
        data: {
          id: 'updated_uuid',
          [entityName.toLowerCase().slice(0, -1) || 'item']: 'updated_value',
          status: 'active',
          updatedAt: 'ISO8601'
        },
        message: `${entityName} updated successfully`
      };
    } else if (method === 'DELETE') {
      return {
        ...baseResponse,
        message: `${entityName} deleted successfully`,
        deletedId: 'resource_uuid'
      };
    }

    return baseResponse;
  }

  function generateArchitectureDiagram(techStack, frontend, api) {
    const frontend_tech = techStack?.find(t => t.layer?.toLowerCase().includes('frontend'))?.tech || 'React/Next.js';
    const backend_tech = techStack?.find(t => t.layer?.toLowerCase().includes('backend'))?.tech || 'Node.js/Express';
    const db_tech = techStack?.find(t => t.layer?.toLowerCase().includes('database'))?.tech || 'PostgreSQL';
    const cache_tech = techStack?.find(t => t.layer?.toLowerCase().includes('cache'))?.tech || 'Redis';

    const has_auth = (api?.authStrategy || '').toLowerCase().includes('jwt');
    const num_endpoints = (api?.endpoints || []).length;

    return `
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser                                                      │
│  (${frontend_tech})                                              │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTPS / WebSocket
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Rate Limiting │ ${has_auth ? 'JWT Auth' : 'Auth'} │ Request Validation              │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION SERVER                             │
├─────────────────────────────────────────────────────────────────┤
│  Backend: ${backend_tech.padEnd(45)}│
│  REST API (${String(num_endpoints).padEnd(2)} endpoints) │ Business Logic           │
│  Request Handlers │ Data Transformation │ Error Handling         │
└────────────────┬───────────────────────────────┬────────────────┘
                 │                               │
        ┌────────▼────────┐          ┌──────────▼──────────┐
        ▼                 ▼          ▼                     ▼
┌──────────────┐  ┌──────────────┐ ┌───────────┐  ┌──────────────┐
│  PRIMARY DB  │  │  CACHE LAYER │ │  QUEUE   │  │  FILE STORE  │
│              │  │              │ │  SERVICE │  │  (Cloud)     │
│ ${db_tech.padEnd(12)} │  │ ${cache_tech.padEnd(12)} │ │ Bull/Redis   │  │ S3/GCS       │
└──────────────┘  └──────────────┘ └───────────┘  └──────────────┘
        │                 │                               │
        └─────────────────┴───────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
┌──────────────────┐          ┌──────────────────────┐
│ EXTERNAL SERVICES│          │ MONITORING & LOGGING │
│  • Payment APIs  │          │  • Application Logs  │
│  • Email Service │          │  • Performance Metrics
│  • Analytics     │          │  • Error Tracking    │
└──────────────────┘          └──────────────────────┘
`;
  }

  // =========================================
  // FIELD DERIVATION HELPERS
  // =========================================
  function deriveValueProposition(g) {
    const analysis = g.businessAnalysis || {};
    const isObj = typeof analysis === 'object';
    const category = isObj ? analysis.category : String(analysis);
    const roles = (g.roles || [])[0] || 'Users';
    const problem = (g.prd?.problemStatement || '').substring(0, 100);

    if (problem) return `Delivers ${category} solution for ${roles} by addressing: ${problem}...`;
    if (category) return `Provides streamlined ${category} capabilities for ${roles}`;
    return 'AI-powered product that streamlines operations and improves efficiency';
  }

  function deriveBusinessModel(g) {
    const revenue = g.revenueModel || '';
    const category = (g.businessAnalysis && typeof g.businessAnalysis === 'object' ? g.businessAnalysis.category : g.businessAnalysis) || '';

    const models = [];
    if (revenue.toLowerCase().includes('subscription')) models.push('Subscription-based recurring revenue');
    if (revenue.toLowerCase().includes('freemium')) models.push('Freemium tier with premium features');
    if (revenue.toLowerCase().includes('transaction')) models.push('Transaction fees from marketplace activity');
    if (revenue.toLowerCase().includes('licensing')) models.push('Enterprise licensing model');

    if (models.length === 0) {
      if (category) models.push(`B2B ${category} licensing`);
      models.push('Subscription with usage-based tiers');
    }

    return models;
  }

  // =========================================
  // GEMINI RESPONSE → INTERNAL DATA SHAPE MERGER
  // =========================================
  /**
   * Takes the raw Gemini JSON (g) and maps every field it provides onto the
   * returned specification data model with safe defaults.
   */
  function mergeGeminiBlueprint(g, base, prompt) {
    const data = {};

    data.name = g.productName || 'AI Product';
    data.label = g.productLabel || 'Software Application';
    data.prompt = prompt;

    // ── Business Analysis ───────────────────────────────────────────────────
    const rawBA = g.businessAnalysis;
    const isBAObject = rawBA && typeof rawBA === 'object';

    data.businessAnalysis = {
      category    : (isBAObject ? rawBA.category : rawBA) || '',
      primaryRoles: Array.isArray(g.roles) ? g.roles 
                    : (isBAObject && Array.isArray(rawBA.primaryRoles) ? rawBA.primaryRoles : []),
      coreEntities: Array.isArray(g.entities) ? g.entities 
                    : (isBAObject && Array.isArray(rawBA.coreEntities) ? rawBA.coreEntities : []),
      revenueModel: g.revenueModel || (isBAObject ? rawBA.revenueModel : '') || '',
      competitors : Array.isArray(g.competitors) ? g.competitors 
                    : (isBAObject && Array.isArray(rawBA.competitors) ? rawBA.competitors : []),
    };

    // Also update executive summary target users
    data.executive = {
      targetUsers: data.businessAnalysis.primaryRoles,
      description: g.businessAnalysis && typeof g.businessAnalysis === 'string' ? g.businessAnalysis : (isBAObject ? rawBA.description : ''),
      valueProp: g.valueProp || deriveValueProposition(g),
      businessModel: Array.isArray(g.businessModel) ? g.businessModel : deriveBusinessModel(g)
    };

    // ── PRD ─────────────────────────────────────────────────────────────────
    if (g.prd) {
      const prd = g.prd;
      data.prd = {
        problemStatement: prd.problemStatement || '',
        goals           : Array.isArray(prd.goals) ? prd.goals : [],
        functional      : Array.isArray(prd.functional) ? prd.functional : [],
        nonFunctional   : Array.isArray(prd.nonFunctional) ? prd.nonFunctional : [],
        metrics         : Array.isArray(prd.metrics) ? prd.metrics : [],
        features        : Array.isArray(prd.features)
          ? prd.features.map(f => {
              if (typeof f === 'string') return { name: f, description: '' };
              return { name: f.name || 'Feature', description: f.description || '' };
            })
          : [],
      };
    } else {
      data.prd = { problemStatement: '', goals: [], functional: [], nonFunctional: [], metrics: [], features: [] };
    }

    // ── User Stories ────────────────────────────────────────────────────────
    if (Array.isArray(g.userStories)) {
      data.userStories = g.userStories.map(s => ({
        as  : s.as   || s.role  || 'User',
        want: s.want || s.story || 'accomplish a task',
        so  : Array.isArray(s.so) ? s.so.join('; ') : (s.so || ''),
      }));
    } else {
      data.userStories = [];
    }

    // ── Database ────────────────────────────────────────────────────────────
    if (g.database) {
      data.database = {
        sql  : g.database.sql   || '',
        nosql: g.database.nosql || '',
      };
    } else {
      data.database = { sql: '', nosql: '' };
    }

    // ── API Design ──────────────────────────────────────────────────────────
    if (g.api) {
      data.api = {
        authStrategy : g.api.authStrategy  || '',
        errorHandling: g.api.errorHandling || '',
        endpoints    : Array.isArray(g.api.endpoints)
          ? g.api.endpoints.map(ep => {
              const method   = ep.method   || 'GET';
              const path     = ep.path     || '/';
              const desc     = ep.desc || ep.description || '';
              const hasRequest = ep.request && Object.keys(ep.request).length > 0;
              const hasResponse = ep.response && Object.keys(ep.response).length > 0;

              return {
                method,
                path,
                desc,
                request : hasRequest ? ep.request : generateRequestPayload({ method, path, desc }, data.businessAnalysis.coreEntities, data.prd.features),
                response: hasResponse ? ep.response : generateResponsePayload({ method, path, desc }, data.businessAnalysis.coreEntities, data.prd.features)
              };
            })
          : [],
      };
    } else {
      data.api = { authStrategy: '', errorHandling: '', endpoints: [] };
    }

    // ── Frontend ────────────────────────────────────────────────────────────
    if (g.frontend) {
      data.frontend = {
        pages          : Array.isArray(g.frontend.pages)      ? g.frontend.pages      : [],
        components     : Array.isArray(g.frontend.components) ? g.frontend.components : [],
        navFlow        : g.frontend.navFlow         || '',
        folderStructure: g.frontend.folderStructure || '',
      };
    } else {
      data.frontend = { pages: [], components: [], navFlow: '', folderStructure: '' };
    }

    // ── Tech Stack ──────────────────────────────────────────────────────────
    if (Array.isArray(g.techStack)) {
      data.techStack = g.techStack.map(t => ({
        layer : t.layer  || 'Layer',
        tech  : t.tech   || 'Technology',
        reason: t.reason || '',
      }));
    } else {
      data.techStack = [];
    }

    // ── Roadmap ─────────────────────────────────────────────────────────────
    if (g.roadmap) {
      data.roadmap = {
        timeline: g.roadmap.timeline || '',
        mvp     : Array.isArray(g.roadmap.mvp)    ? g.roadmap.mvp    : [],
        phase2  : Array.isArray(g.roadmap.phase2) ? g.roadmap.phase2 : [],
        phase3  : Array.isArray(g.roadmap.phase3) ? g.roadmap.phase3 : [],
      };
    } else {
      data.roadmap = { timeline: '', mvp: [], phase2: [], phase3: [] };
    }

    // ── Vibe Coding ─────────────────────────────────────────────────────────
    if (g.vibeCoding) {
      data.vibeCoding = {
        frontend  : Array.isArray(g.vibeCoding.frontend)   ? g.vibeCoding.frontend   : [],
        backend   : Array.isArray(g.vibeCoding.backend)    ? g.vibeCoding.backend    : [],
        database  : Array.isArray(g.vibeCoding.database)   ? g.vibeCoding.database   : [],
        api       : Array.isArray(g.vibeCoding.api)        ? g.vibeCoding.api        : [],
        ai        : Array.isArray(g.vibeCoding.ai)         ? g.vibeCoding.ai         : [],
        testing   : Array.isArray(g.vibeCoding.testing)    ? g.vibeCoding.testing    : [],
        deployment: Array.isArray(g.vibeCoding.deployment)  ? g.vibeCoding.deployment : [],
      };
    } else {
      data.vibeCoding = { frontend: [], backend: [], database: [], api: [], ai: [], testing: [], deployment: [] };
    }

    // ── Architecture Diagram ────────────────────────────────────────────────
    if (g.diagram && g.diagram.trim()) {
      data.diagram = g.diagram;
    } else {
      data.diagram = generateArchitectureDiagram(data.techStack, data.frontend, data.api);
    }

    return data;
  }
  // (compileBlueprintFromPrompt removed)

  // =========================================
  // VIEW RENDERING / DOM POPULATION
  // =========================================
  function populateAnalysisView() {
    const analysis = generatedData?.businessAnalysis || {};

    // Basic text fields with safe fallbacks
    analysisCategory.textContent = analysis?.category ?? 'Not Available';
    analysisRevenue.textContent = analysis?.revenueModel ?? 'Not Available';

    // Helper to render arrays safely — never call .map on undefined
    const renderList = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return '<li>Not Available</li>';
      return arr.map(item => `<li>${escapeHTML(String(item))}</li>`).join('');
    };

    console.log("COMPETITORS", analysis.competitors);
    analysisCompetitors.innerHTML = renderList(analysis?.competitors || generatedData?.competitors || []);
    analysisRoles.innerHTML = renderList(analysis?.primaryRoles);
    analysisEntities.innerHTML = renderList(analysis?.coreEntities);
  }

  function populateBlueprintView() {
    // Debug: dump blueprint data to console to diagnose undefined fields
    try {
      console.log('RAW BLUEPRINT');
      console.log(JSON.stringify(generatedData, null, 2));
      console.log('USER STORIES');
      console.log(JSON.stringify(generatedData?.userStories || [], null, 2));
      console.log('FEATURES');
      console.log(JSON.stringify(generatedData?.prd?.features || [], null, 2));
    } catch (e) {
      console.warn('Failed to print debug blueprint logs', e);
    }
    specProductName.textContent = generatedData.name;
    specProductType.textContent = generatedData.label;
    
    renderExecutiveSection();
    renderPrdSection();
    renderStoriesSection();
    renderDatabaseSection();
    renderApiSection();
    renderFrontendSection();
    renderTechStackSection();
    renderRoadmapSection();
    renderVibeSection();
    renderDiagramSection();
    
    // Set default sub-tabs active classes
    document.querySelectorAll('#db-sub-tabs .tech-sub-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-type') === activeDbTab) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    
    document.querySelectorAll('#vibe-copier-tabs .vibe-pill-btn').forEach(btn => {
      if (btn.getAttribute('data-prompt') === activeVibePrompt) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    
    // Set first sidebar item and section container as active, and scroll to top
    sidebarNavBtns.forEach(b => b.classList.remove('active'));
    const firstTabBtn = document.querySelector('.sidebar-nav-btn[data-target="sec-executive"]');
    if (firstTabBtn) firstTabBtn.classList.add('active');

    sectionContainers.forEach(c => {
      if (c.id === 'sec-executive') c.classList.add('active');
      else c.classList.remove('active');
    });

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function renderExecutiveSection() {
    const container = document.querySelector('#sec-executive .section-content-render');
    const data = generatedData.executive || {};
    const analysis = generatedData.businessAnalysis || {};
    container.innerHTML = `
      <div class="info-grid">
        <div class="info-card">
          <h4>Business Category</h4>
          <p><strong>${escapeHTML(String(analysis.category || 'Not Available'))}</strong></p>
        </div>
        <div class="info-card">
          <h4>Revenue Model</h4>
          <p>${escapeHTML(String(analysis.revenueModel || 'Not Available'))}</p>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <h4>Primary User Roles</h4>
          <ul>
            ${(analysis.primaryRoles||[]).map(role => `<li>${escapeHTML(String(role))}</li>`).join('')}
          </ul>
        </div>
        <div class="info-card">
          <h4>Core Business Entities</h4>
          <ul>
            ${(analysis.coreEntities||[]).map(entity => `<li>${escapeHTML(String(entity))}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="info-card" style="margin: 1.5rem 0; width: 100%;">
        <h4>Product Description</h4>
        <p>${escapeHTML(String(data.description || 'Not Available'))}</p>
      </div>

      <div class="info-card" style="margin: 1.5rem 0; width: 100%;">
        <h4>Value Proposition</h4>
        <p>${escapeHTML(String(data.valueProp || 'Not Available'))}</p>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <h4>Target Users / System Roles</h4>
          <ul>
            ${(data.targetUsers||[]).map(user => `<li>${escapeHTML(String(user))}</li>`).join('')}
          </ul>
        </div>
        <div class="info-card">
          <h4>Business Model Hypotheses</h4>
          <ul>
            ${(data.businessModel||[]).length > 0 ? (data.businessModel||[]).map(model => `<li>${escapeHTML(String(model))}</li>`).join('') : '<li>Not Available</li>'}
          </ul>
        </div>
      </div>
    `;
  }

  function renderPrdSection() {
    const container = document.querySelector('#sec-prd .section-content-render');
    const data = generatedData.prd || {};
    container.innerHTML = `
      <div class="info-card" style="margin-bottom: 1.5rem; width: 100%;">
        <h4>Problem Statement</h4>
        <p>${escapeHTML(String(data.problemStatement || 'Not Available'))}</p>
      </div>
      
      <div class="info-grid">
        <div class="info-card">
          <h4>Strategic Goals</h4>
          <ul>
            ${(data.goals||[]).map(goal => `<li>${escapeHTML(String(goal))}</li>`).join('')}
          </ul>
        </div>
        <div class="info-card">
          <h4>Success Metrics (KPIs)</h4>
          <ul>
            ${(data.metrics||[]).map(kpi => `<li>${escapeHTML(String(kpi))}</li>`).join('')}
          </ul>
        </div>
      </div>

      <h4 class="quick-fill-label" style="margin-top: 2rem;">Core Features Checklist</h4>
      <ul class="specs-list">
        ${(data.features||[]).map(feat => {
          const name = typeof feat === 'string' ? feat : (feat && (feat.name || feat.title)) || 'Feature';
          const desc = (feat && (feat.description || feat.desc)) || '';
          return `
          <li class="specs-list-item">
            <div class="specs-list-title">${escapeHTML(String(name))}</div>
            <div class="specs-list-desc">${escapeHTML(String(desc))}</div>
          </li>
        `;
        }).join('')}
      </ul>

      <div class="info-grid" style="margin-top: 1.5rem;">
        <div class="info-card">
          <h4>Functional Requirements</h4>
          <ul>
            ${(data.functional||[]).map(req => `<li>${escapeHTML(String(req))}</li>`).join('')}
          </ul>
        </div>
        <div class="info-card">
          <h4>Non-Functional Requirements</h4>
          <ul>
            ${(data.nonFunctional||[]).map(req => `<li>${escapeHTML(String(req))}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  function renderStoriesSection() {
    const container = document.querySelector('#sec-stories .section-content-render');
    const rawStories = generatedData.userStories || [];

    function parseStory(story) {
      if (!story) return { as: 'User', want: 'do something', so: '' };
      if (typeof story === 'string') {
        const s = story.trim();
        const re = /As a\s+([^,]+),?\s*I want to\s+([^,\.]+)(?:[,\.\s]*(?:so that|so)\s*(.+))?/i;
        const m = s.match(re);
        if (m) return { as: m[1].trim(), want: m[2].trim(), so: (m[3] || '').trim() };
        const re2 = /^([^:]+):\s*(.+?)\s*(?:->\s*(.+))?$/;
        const m2 = s.match(re2);
        if (m2) return { as: m2[1].trim(), want: m2[2].trim(), so: (m2[3] || '').trim() };
        const wantIdx = s.toLowerCase().indexOf('i want');
        if (wantIdx !== -1) {
          const before = s.slice(0, wantIdx).replace(/^(As a|As an)\s*/i, '').trim();
          const rest = s.slice(wantIdx);
          const m3 = rest.match(/I want to\s+([^,\.]+)(?:[,\.\s]*(?:so that|so)\s*(.+))?/i);
          if (m3) return { as: before || 'User', want: m3[1].trim(), so: (m3[2] || '').trim() };
        }
        const parts = s.split(',');
        if (parts.length >= 2) return { as: parts[0].replace(/^(As a|As an)\s*/i, '').trim(), want: parts.slice(1).join(',').trim(), so: '' };
        return { as: 'User', want: s, so: '' };
      }
      if (typeof story === 'object') {
        const as = story.as || story.role || story.actor || 'User';
        const wantRaw = story.want || story.story || story.action || story.description || '';
        const so = story.so || story.reason || (Array.isArray(story.acceptance) ? story.acceptance.join('; ') : story.benefit || '');
        const want = String(wantRaw).replace(/^As a\s+[^,]+,?\s*(I want to\s*)?/i, '').trim();
        return { as: String(as).replace(/^(As a|As an)\s*/i, '').trim(), want, so: String(so).trim() };
      }
      return { as: 'User', want: String(story), so: '' };
    }

    container.innerHTML = `
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">The following backlog items represent the initial scope of the MVP launch. They are detailed enough to load directly into Jira or GitHub Issues:</p>
      
      ${(rawStories||[]).map((story, idx) => {
        const s = parseStory(story);
        return `
        <div class="user-story-card">
          <div class="user-story-badge">STORY-${(idx+1).toString().padStart(2, '0')}</div>
          <div class="user-story-text">
            <strong>As a</strong> ${escapeHTML(String(s.as || 'User'))}, <strong>I want to</strong> ${escapeHTML(String(s.want || 'do something'))}, <strong>so that</strong> ${escapeHTML(String(s.so || ''))}.
          </div>
        </div>
      `;
      }).join('')}
    `;
  }

  function formatSQL(sql) {
    if (!sql || !sql.trim()) return '';
    
    let cleaned = sql.replace(/\s+/g, ' ').trim();
    let statements = cleaned.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    let formattedStatements = statements.map(stmt => {
      const createTableRegex = /^CREATE\s+TABLE\s+([a-zA-Z0-9_]+)\s*\((.*)\)$/i;
      const match = stmt.match(createTableRegex);
      
      if (match) {
        const tableName = match[1];
        const columnsPart = match[2].trim();
        
        let columns = [];
        let currentColumn = '';
        let parenDepth = 0;
        
        for (let i = 0; i < columnsPart.length; i++) {
          const char = columnsPart[i];
          if (char === '(') parenDepth++;
          if (char === ')') parenDepth--;
          
          if (char === ',' && parenDepth === 0) {
            columns.push(currentColumn.trim());
            currentColumn = '';
          } else {
            currentColumn += char;
          }
        }
        if (currentColumn.trim()) {
          columns.push(currentColumn.trim());
        }
        
        let formattedColumns = columns.map(col => {
          let words = col.split(/\s+/);
          let formattedWords = words.map(word => {
            const upper = word.toUpperCase();
            const keywords = [
              'INT', 'INTEGER', 'SERIAL', 'PRIMARY', 'KEY', 'VARCHAR', 'CHAR', 'TEXT', 
              'BOOLEAN', 'TIMESTAMP', 'DATE', 'REFERENCES', 'NOT', 'NULL', 'UNIQUE', 
              'DEFAULT', 'FOREIGN', 'CHECK', 'CONSTRAINT'
            ];
            if (keywords.some(k => upper.startsWith(k))) {
              return upper;
            }
            return word;
          });
          return '    ' + formattedWords.join(' ');
        });
        
        return `CREATE TABLE ${tableName} (\n${formattedColumns.join(',\n')}\n);`;
      }
      
      let words = stmt.split(/\s+/);
      let formattedWords = words.map(word => {
        const upper = word.toUpperCase();
        const keywords = ['CREATE', 'TABLE', 'ALTER', 'ADD', 'DROP', 'INDEX', 'ON', 'INSERT', 'INTO', 'VALUES'];
        if (keywords.includes(upper)) return upper;
        return word;
      });
      return formattedWords.join(' ') + ';';
    });
    
    return formattedStatements.join('\n\n');
  }

  function getOrGenerateMongoSchema(db, entities) {
    let nosql = db.nosql || '';
    const isCode = nosql.includes('{') || nosql.includes('const ') || nosql.includes('schema') || nosql.includes('define');
    
    if (!nosql.trim() || !isCode) {
      const coreEntities = entities || generatedData.businessAnalysis?.coreEntities || generatedData.entities || [];
      const finalEntities = coreEntities.length > 0 ? coreEntities : ['User', 'Listing', 'Booking', 'Review'];
      
      let generated = '';
      finalEntities.forEach(entity => {
        const name = String(entity).trim();
        const singularName = name.charAt(0).toUpperCase() + name.slice(1).replace(/s$/, '');
        
        generated += `const ${singularName}Schema = {\n`;
        generated += `  _id: ObjectId,\n`;
        
        const lowerName = singularName.toLowerCase();
        if (lowerName === 'user' || lowerName === 'customer' || lowerName === 'member') {
          generated += `  email: String,\n`;
          generated += `  passwordHash: String,\n`;
          generated += `  createdAt: Date\n`;
        } else if (lowerName === 'booking' || lowerName === 'reservation' || lowerName === 'order') {
          generated += `  userId: ObjectId,\n`;
          generated += `  startDate: Date,\n`;
          generated += `  endDate: Date,\n`;
          generated += `  status: String,\n`;
          generated += `  totalPrice: Number\n`;
        } else if (lowerName === 'property' || lowerName === 'listing' || lowerName === 'room' || lowerName === 'house') {
          generated += `  ownerId: ObjectId,\n`;
          generated += `  title: String,\n`;
          generated += `  pricePerNight: Number\n`;
        } else if (lowerName === 'review' || lowerName === 'comment' || lowerName === 'rating') {
          generated += `  authorId: ObjectId,\n`;
          generated += `  rating: Number,\n`;
          generated += `  comment: String\n`;
        } else {
          generated += `  name: String,\n`;
          generated += `  description: String,\n`;
          generated += `  status: String\n`;
        }
        
        generated += `};\n\n`;
      });
      
      return generated.trim();
    }
    
    return nosql.trim();
  }

  function renderDatabaseSection() {
    const container = document.querySelector('#sec-database .section-content-render');
    const db = generatedData.database;
    
    if (activeDbTab === 'relational') {
      const sqlContent = formatSQL(db.sql);
      container.innerHTML = `
        <div class="code-display-box">
          <button class="btn-copy-section code-copy-overlay" onclick="copyCodeContent('db-sql-code')">Copy SQL</button>
          <pre id="db-sql-code"><code>${escapeHTML(sqlContent)}</code></pre>
        </div>
      `;
    } else {
      const nosqlContent = getOrGenerateMongoSchema(db, generatedData.businessAnalysis?.coreEntities);
      container.innerHTML = `
        <div class="code-display-box">
          <button class="btn-copy-section code-copy-overlay" onclick="copyCodeContent('db-nosql-code')">Copy Schema</button>
          <pre id="db-nosql-code"><code>${escapeHTML(nosqlContent)}</code></pre>
        </div>
      `;
    }
  }

  function renderApiSection() {
    const container = document.querySelector('#sec-api .section-content-render');
    const api = generatedData.api;
    const apiSection = api || {};
    console.log("API SECTION DATA", apiSection);
    container.innerHTML = `
      <div class="info-grid" style="margin-bottom: 2rem;">
        <div class="info-card">
          <h4>Authentication &amp; Security</h4>
          <p>${escapeHTML(String(api.authStrategy || 'Not Available'))}</p>
        </div>
        <div class="info-card">
          <h4>Error Response Standard</h4>
          <p>${escapeHTML(String(api.errorHandling || 'Not Available'))}</p>
        </div>
      </div>

      <h4 class="quick-fill-label">Core Endpoint Operations</h4>
      
      ${(api.endpoints||[]).map((ep, idx) => `
        <div class="specs-list-item" style="margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <span style="font-family: var(--font-code); font-size: 0.8rem; font-weight: 700; background: ${ep.method === 'POST' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)'}; color: ${ep.method === 'POST' ? '#34d399' : '#60a5fa'}; padding: 0.2rem 0.6rem; border-radius: 4px; border: 1px solid ${ep.method === 'POST' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'};">${ep.method}</span>
            <span style="font-family: var(--font-code); font-weight: 600; color: #ffffff;">${ep.path}</span>
            <span style="color: var(--text-muted); font-size: 0.85rem;">— ${ep.desc}</span>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.75rem;">
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 600; text-transform: uppercase;">Request Payload</div>
              <div class="code-display-box" style="padding: 0.75rem; font-size: 0.8rem;">
                <pre><code>${escapeHTML(String(JSON.stringify(ep.request || {}, null, 2)))}</code></pre>
              </div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 600; text-transform: uppercase;">Response (200 OK / 201 Created)</div>
              <div class="code-display-box" style="padding: 0.75rem; font-size: 0.8rem;">
                <pre><code>${escapeHTML(String(JSON.stringify(ep.response || {}, null, 2)))}</code></pre>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    `;
  }

  function renderFrontendSection() {
    const container = document.querySelector('#sec-frontend .section-content-render');
    const fe = generatedData.frontend || {};
    container.innerHTML = `
      <div class="info-grid">
        <div class="info-card">
          <h4>Pages &amp; Route Map</h4>
          <ul>
            ${(fe.pages||[]).map(page => `<li>${escapeHTML(String(page))}</li>`).join('')}
          </ul>
        </div>
        <div class="info-card">
          <h4>Key UI Components</h4>
          <ul>
            ${(fe.components||[]).map(comp => `<li>${escapeHTML(String(comp))}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="info-card" style="margin: 1.5rem 0; width: 100%;">
        <h4>Navigation &amp; Global State Flow</h4>
        <p>${escapeHTML(String(fe.navFlow || 'Not Available'))}</p>
      </div>

      <h4 class="quick-fill-label">Standard Folder Structure (Next.js App Router)</h4>
      <div class="code-display-box">
        <button class="btn-copy-section code-copy-overlay" onclick="copyCodeContent('fe-folder-code')">Copy Folder Tree</button>
        <pre id="fe-folder-code"><code>${escapeHTML(String(fe.folderStructure || 'Not Available'))}</code></pre>
      </div>
    `;
  }

  // Tech Stack, Roadmap, Vibe, Diagram sections same rendering helpers
  function renderTechStackSection() {
    const container = document.querySelector('#sec-techstack .section-content-render');
    const stack = generatedData.techStack || [];
    container.innerHTML = `
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Below is the recommended technology stack selected specifically for this application's requirements, focusing on developer productivity, performance, and scaling costs:</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem;">
        ${(stack||[]).map(tech => `
          <div class="feature-card" style="padding: 1.5rem; background: var(--bg-tertiary);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
              <h4 style="font-family: var(--font-heading); font-size: 1.1rem; color: #ffffff; font-weight: 600;">${escapeHTML(String(tech.layer || ''))}</h4>
              <span style="font-size: 0.8rem; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #a5b4fc; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 500;">${escapeHTML(String(tech.tech || ''))}</span>
            </div>
            <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">${escapeHTML(String(tech.reason || ''))}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderRoadmapSection() {
    const container = document.querySelector('#sec-roadmap .section-content-render');
    const data = generatedData.roadmap || {};
    container.innerHTML = `
      <div class="info-card" style="margin-bottom: 1.5rem; width: 100%;">
        <h4>Estimated Project Duration</h4>
        <p>Approx. <strong>${data.timeline}</strong> using 1 senior fullstack dev (or 2-3 devs collaborating with Vibe Coding tools).</p>
      </div>
      <div class="info-grid">
        <div class="info-card" style="border-top: 3px solid var(--secondary);">
          <h4>Phase 1: MVP Core (Weeks 1-3)</h4>
          <ul>
            ${(data.mvp||[]).map(item => `<li>${escapeHTML(String(item))}</li>`).join('')}
          </ul>
        </div>
        <div class="info-card" style="border-top: 3px solid var(--primary);">
          <h4>Phase 2: Scale &amp; UX (Weeks 4-6)</h4>
          <ul>
            ${(data.phase2||[]).map(item => `<li>${escapeHTML(String(item))}</li>`).join('')}
          </ul>
        </div>
        <div class="info-card" style="border-top: 3px solid var(--accent);">
          <h4>Phase 3: Optimization &amp; AI (Weeks 7+)</h4>
          <ul>
            ${(data.phase3||[]).map(item => `<li>${escapeHTML(String(item))}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  function renderVibeSection() {
    const container = document.querySelector('#sec-vibe .section-content-render');
    const prompts = generatedData.vibeCoding[activeVibePrompt] || [];

    const sectionLabels = {
      frontend: 'Frontend Development',
      backend: 'Backend Development',
      database: 'Database Design',
      api: 'API Implementation',
      ai: 'AI Features',
      testing: 'Testing',
      deployment: 'Deployment'
    };
    const sectionLabel = sectionLabels[activeVibePrompt] || activeVibePrompt;

    if (prompts.length === 0) {
      container.innerHTML = `
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">Select a category below, copy the pre-tuned prompt, and paste it directly into Cursor, Gemini, Claude, or Copilot Chat to implement your project code:</p>
        <div class="info-card" style="width:100%; text-align:center; padding:2rem;">
          <p style="color: var(--text-secondary);">No prompts generated for ${escapeHTML(sectionLabel)}.</p>
        </div>
      `;
      return;
    }

    const promptCards = prompts.map((p, i) => `
      <div class="prompt-copy-container" style="margin-bottom: 1rem;">
        <div class="prompt-box" id="vibe-prompt-${i}" style="font-size: 0.92rem; line-height: 1.6;">${escapeHTML(p)}</div>
        <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
          <button class="btn-outline-primary" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;" onclick="copyCodeContent('vibe-prompt-${i}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <p style="color: var(--text-secondary); margin-bottom: 1rem;">Select a category below, copy the pre-tuned prompt, and paste it directly into Cursor, Gemini, Claude, or Copilot Chat to implement your project code:</p>
      <h4 style="color: var(--text-primary); margin-bottom: 1rem;">${escapeHTML(sectionLabel)} — ${prompts.length} Prompts</h4>
      ${promptCards}
    `;
  }

  function renderDiagramSection() {
    const container = document.querySelector('#sec-diagram .section-content-render');
    const diag = generatedData.diagram || 'Not Available';
    container.innerHTML = `
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Below is the text-based systems architecture and flow diagram representing the request routing topology:</p>
      <div class="ascii-architecture-art">${escapeHTML(String(diag))}</div>
      <div class="info-card" style="width: 100%;">
        <h4>Architecture Details</h4>
        <ul>
          <li><strong>Client Layer:</strong> Users interact with a responsive Next.js frontend (styled using Tailwind CSS or standard modules).</li>
          <li><strong>CDN / Gateway:</strong> Vercel edge routes page requests and acts as static assets buffer.</li>
          <li><strong>Server Layer:</strong> Node.js / Express backend provides REST APIs, protected by JWT authentication middleware.</li>
          <li><strong>Data Layer:</strong> Primary relational data persisted in PostgreSQL. Hot endpoints caching and rate-limiting managed through Redis.</li>
          <li><strong>Third-Party Integrations:</strong> API request paths automatically route out to external services if payment, tracking, or AI layers are triggered.</li>
        </ul>
      </div>
    `;
  }

  // Helper to escape HTML characters
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================
  // MARKDOWN BLUEPRINT COMPILATION
  // =========================================
  function compileSectionMarkdown(sectionId) {
    if (!generatedData) return "";
    
    let md = "";
    
    switch(sectionId) {
      case 'sec-executive':
        md += `## 1. Executive Summary\n\n`;
        md += `* **Product Name**: ${generatedData.name}\n`;
        md += `* **Product Type**: ${generatedData.label}\n`;
        md += `* **Value Proposition**: ${generatedData.executive?.valueProp || 'Not Available'}\n\n`;
        md += `### Description\n${generatedData.executive?.description || 'Not Available'}\n\n`;
        md += `### Target Users / System Roles\n`;
        (generatedData.executive?.targetUsers||[]).forEach(u => md += `* ${u}\n`);
        md += `\n### Business Model Suggestions\n`;
        if ((generatedData.executive?.businessModel||[]).length > 0) {
          (generatedData.executive?.businessModel||[]).forEach(b => md += `* ${b}\n`);
        } else {
          md += `* Not Available\n`;
        }
        break;
        
      case 'sec-prd':
        md += `## 2. Product Requirements Document (PRD)\n\n`;
        md += `### Problem Statement\n${generatedData.prd.problemStatement}\n\n`;
        md += `### Goals\n`;
        (generatedData.prd.goals||[]).forEach(g => md += `* ${g}\n`);
        md += `\n### Core Features\n`;
        (generatedData.prd.features||[]).forEach(f => {
          if (typeof f === 'string') md += `* ${f}\n`;
          else md += `* **${f.name || 'Feature'}**: ${f.description || ''}\n`;
        });
        md += `\n### Functional Requirements\n`;
        (generatedData.prd.functional||[]).forEach(fr => md += `* ${fr}\n`);
        md += `\n### Non-Functional Requirements\n`;
        (generatedData.prd.nonFunctional||[]).forEach(nfr => md += `* ${nfr}\n`);
        md += `\n### Success Metrics\n`;
        (generatedData.prd.metrics||[]).forEach(m => md += `* ${m}\n`);
        break;
        
      case 'sec-stories':
        md += `## 3. User Stories\n\n`;
        (generatedData.userStories||[]).forEach((us, idx) => {
          const as = us.as || us.role || 'User';
          const want = us.want || us.story || '';
          const so = us.so || (Array.isArray(us.acceptance) ? us.acceptance.join('; ') : us.reason || '');
          md += `* **US-${(idx+1).toString().padStart(2,'0')}**: As a **${as}**, I want to **${want}**, so that **${so}**.\n`;
        });
        break;
        
      case 'sec-database':
        md += `## 4. Database Schema Design\n\n`;
        md += `### PostgreSQL Relational Schema\n\n\`\`\`sql\n${generatedData.database.sql}\n\`\`\`\n\n`;
        md += `### MongoDB Mongoose Schemas\n\n\`\`\`javascript\n${generatedData.database.nosql}\n\`\`\`\n`;
        break;
        
      case 'sec-api':
        md += `## 5. API Design Specification\n\n`;
        md += `* **Authentication**: ${generatedData.api?.authStrategy || 'Not Available'}\n`;
        md += `* **Error Handling**: ${generatedData.api?.errorHandling || 'Not Available'}\n\n`;
        md += `### Endpoints\n\n`;
        (generatedData.api?.endpoints||[]).forEach(ep => {
          md += `#### ${ep.method || 'GET'} ${ep.path || '/'}\n`;
          md += `*Description*: ${ep.desc || 'Not Available'}\n\n`;
          md += `**Request Body**:\n\`\`\`json\n${JSON.stringify(ep.request || {}, null, 2)}\n\`\`\`\n\n`;
          md += `**Response (200 OK / 201 Created)**:\n\`\`\`json\n${JSON.stringify(ep.response || {}, null, 2)}\n\`\`\`\n\n`;
        });
        break;
        
      case 'sec-frontend':
        md += `## 6. Frontend Architecture\n\n`;
        md += `### Key Pages\n`;
        (generatedData.frontend?.pages||[]).forEach(p => md += `* ${p}\n`);
        md += `\n### Core Components\n`;
        (generatedData.frontend?.components||[]).forEach(c => md += `* ${c}\n`);
        md += `\n### Navigation Flow\n${generatedData.frontend?.navFlow || 'Not Available'}\n\n`;
        md += `### Recommended Folder Structure\n\`\`\`\n${generatedData.frontend?.folderStructure || 'Not Available'}\n\`\`\`\n`;
        break;
        
      case 'sec-techstack':
        md += `## 7. Tech Stack Recommendation\n\n`;
        (generatedData.techStack||[]).forEach(t => {
          md += `### ${t.layer}\n`;
          md += `* **Technology**: ${t.tech}\n`;
          md += `* **Justification**: ${t.reason}\n\n`;
        });
        break;
        
      case 'sec-roadmap':
        md += `## 8. Development Roadmap\n\n`;
        md += `* **Timeline Estimate**: ${generatedData.roadmap.timeline}\n\n`;
        md += `### Phase 1: MVP Core\n`;
        (generatedData.roadmap.mvp||[]).forEach(item => md += `* ${item}\n`);
        md += `\n### Phase 2: Scale & UX Improvements\n`;
        (generatedData.roadmap.phase2||[]).forEach(item => md += `* ${item}\n`);
        md += `\n### Phase 3: Optimizations & Advanced AI Features\n`;
        (generatedData.roadmap.phase3||[]).forEach(item => md += `* ${item}\n`);
        break;
        
      case 'sec-vibe':
        md += `## 9. Vibe Coding Prompts\n\n`;
        const vibeLabels = {
          frontend: 'Frontend Development',
          backend: 'Backend Development',
          database: 'Database Design',
          api: 'API Implementation',
          ai: 'AI Features',
          testing: 'Testing',
          deployment: 'Deployment'
        };
        for (const [key, label] of Object.entries(vibeLabels)) {
          const items = generatedData.vibeCoding[key] || [];
          if (items.length > 0) {
            md += `### ${label}\n`;
            items.forEach((item, i) => md += `${i + 1}. ${item}\n`);
            md += `\n`;
          }
        }
        break;
        
      case 'sec-diagram':
        md += `## 10. Architecture Diagram\n\n\`\`\`text\n${generatedData.diagram || 'Not Available'}\n\`\`\`\n`;
        break;
    }
    
    return md;
  }

  function compileFullMarkdown() {
    if (!generatedData) return "";
    
    let md = `# Technical Product Blueprint: ${generatedData.name}\n`;
    md += `*Generated by OutcomeSpec AI on ${new Date().toLocaleDateString()}*\n\n`;
    md += `> **Original Prompt**: ${generatedData.prompt}\n\n`;
    md += `* * * * *\n\n`;
    
    const tabs = ['sec-executive', 'sec-prd', 'sec-stories', 'sec-database', 'sec-api', 'sec-frontend', 'sec-techstack', 'sec-roadmap', 'sec-vibe', 'sec-diagram'];
    
    tabs.forEach(tab => {
      md += compileSectionMarkdown(tab) + "\n\n* * * * *\n\n";
    });
    
    return md;
  }
});
