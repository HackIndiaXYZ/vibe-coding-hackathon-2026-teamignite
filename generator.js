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
  let activeVibePrompt = 'setup';

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
      
      // Remove active states from buttons
      sidebarNavBtns.forEach(b => b.classList.remove('active'));
      // Add active state to clicked button
      btn.classList.add('active');
      
      // Hide all section containers
      sectionContainers.forEach(c => c.classList.remove('active'));
      // Show target container
      const targetContainer = document.getElementById(target);
      targetContainer.classList.add('active');
      
      activeTabId = target;
      window.scrollTo({ top: document.querySelector('.blueprint-layout').offsetTop - 20, behavior: 'smooth' });
    });
  });

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
  // SIMULATION ENGINE
  // =========================================
  function startSimulation(prompt) {
    const steps = [
      { id: 'step-0', title: 'Performing business domain analysis and idea classification...', duration: 1000 },
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
    
    let currentStepIndex = 0;
    
    function runNextStep() {
      if (currentStepIndex >= steps.length) {
        // Simulation finished, build data and present analysis before generating the full blueprint
        progressbarFill.style.width = '100%';
        setTimeout(() => {
          generatedData = compileBlueprintFromPrompt(prompt);
          populateAnalysisView();
          
          loadingView.classList.remove('active');
          analysisView.classList.add('active');
        }, 300);
        return;
      }
      
      const step = steps[currentStepIndex];
      const stepEl = document.getElementById(step.id);
      
      // Mark active
      stepEl.classList.add('active');
      loadingTitle.textContent = step.title;
      
      // Update progress bar percentage
      const percent = Math.floor((currentStepIndex / steps.length) * 100);
      progressbarFill.style.width = `${percent}%`;
      
      setTimeout(() => {
        // Mark completed
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
  }

  // Domain-specific generators (Task Management)
  function generatePRD(semantic) {
    // Unified PRD generator for supported domains.
    // Returns a domain-specific PRD structure with no generic enterprise phrases.
    const domain = (semantic.domainName || '').toLowerCase();

    const prdFor = (problemStatement, goals, features, functional, nonFunctional, metrics, roadmap) => ({
      problemStatement,
      goals,
      features,
      functional,
      nonFunctional,
      successMetrics: metrics,
      roadmap
    });

    if (domain.includes('task management') || domain.includes('todo') || domain.includes('to-do')) {
      return prdFor(
        'Teams and individuals need a lightweight, collaborative task tool to keep priorities visible and handoffs clear.',
        [
          'Organize work into projects and prioritized tasks',
          'Clarify ownership and due dates to reduce blockers',
          'Provide lightweight collaboration and status signals'
        ],
        [
          'Project boards and nested task lists',
          'Task assignment, due dates, priorities, and recurring tasks',
          'Comments, attachments, and activity history'
        ],
        [
          'Create, update, and move tasks across workflow stages',
          'Assign tasks to users and set due dates',
          'Search, filter, and bulk edit tasks'
        ],
        [
          'Responsive UI rendering for large lists (<300ms)',
          'Offline edits and sync for basic operations',
          'Role-based access controls at workspace level'
        ],
        [
          'Tasks completed per week',
          'Percent of tasks with assignees and due dates',
          'Weekly active teams'
        ],
        {
          mvp: ['User auth, project & task CRUD, basic notifications'],
          phase2: ['Realtime collaboration, recurring tasks, calendar integrations'],
          phase3: ['Enterprise SSO, advanced reporting and automation']
        }
      );
    }

    if (domain.includes('vacation rental') || domain.includes('airbnb') || domain.includes('property')) {
      return prdFor(
        'Travelers and hosts need a trustworthy marketplace to list, discover, and book stays with clear availability and secure payments.',
        [
          'Enable fast discovery by location and date',
          'Simplify host onboarding and calendar management',
          'Safeguard payments and dispute resolution'
        ],
        [
          'Property listing creation with calendar and photos',
          'Search & filter with map and availability',
          'Booking flow with confirmation and receipts'
        ],
        [
          'Host can list and manage availability',
          'Guest can search and book with instant confirmation',
          'Payments captured and refunds handled per policy'
        ],
        [
          'Sub-second geospatial search for common queries',
          'Media served via CDN; images optimized',
          'PCI-compliant payment handling'
        ],
        [
          'Search-to-booking conversion rate',
          'Host activation within 7 days',
          'Average time-to-confirmation'
        ],
        {
          mvp: ['Search by location & date, host listing CRUD, basic booking & payment'],
          phase2: ['Host verification, messaging, promotions'],
          phase3: ['Dynamic pricing and advanced host analytics']
        }
      );
    }

    if (domain.includes('ride') || domain.includes('ride-sharing') || domain.includes('taxi') || domain.includes('uber')) {
      return prdFor(
        'Riders and drivers need a reliable platform to request and fulfill trips with accurate ETAs, clear fares, and safety features.',
        [
          'Match riders with nearby drivers quickly',
          'Provide transparent fare estimates and receipts',
          'Offer safety and driver verification features'
        ],
        [
          'Ride request and driver assignment',
          'Real-time location tracking and ETA',
          'Fare estimation and trip receipts'
        ],
        [
          'Riders can request rides with pickup/dropoff locations',
          'Drivers can accept requests and view trip details',
          'ETA and route updates available in real time'
        ],
        [
          'Low-latency location updates when active',
          'Dispatch service designed to scale during peak demand',
          'Secure storage of driver documents and PII'
        ],
        [
          'Average pickup ETA',
          'Driver acceptance rate',
          'Trips completed per hour'
        ],
        {
          mvp: ['Driver onboarding, basic ride request/accept flow, ETA tracking'],
          phase2: ['Dynamic dispatch & pricing, driver incentives'],
          phase3: ['Pooling, multi-modal routing, advanced analytics']
        }
      );
    }

    if (domain.includes('professional') || domain.includes('network') || domain.includes('linkedin')) {
      return prdFor(
        'Professionals need a place to showcase experience, discover opportunities, and build meaningful connections.',
        [
          'Enable professional profile creation and discovery',
          'Support job postings and applications',
          'Facilitate direct messaging and community engagement'
        ],
        [
          'Profile pages with experience, skills, and endorsements',
          'Connection requests and network graph',
          'Job listings, applications, and recruiter tools'
        ],
        [
          'Users can create and edit profiles',
          'Members can connect and message each other',
          'Recruiters can post jobs and manage applicants'
        ],
        [
          'Profile search responses under 300ms',
          'Rate limits on messaging to reduce spam',
          'GDPR-compliant export and data controls'
        ],
        [
          'Connections created per user',
          'Jobs posted and application-to-hire rate',
          'Message engagement metrics'
        ],
        {
          mvp: ['Profile creation, connections, basic feed, job posting & applications'],
          phase2: ['Messaging, recommendations, premium subscriptions'],
          phase3: ['Enterprise recruiting suite, analytics & AI matching']
        }
      );
    }

    if (domain.includes('e-commerce') || domain.includes('shop') || domain.includes('checkout') || domain.includes('amazon')) {
      return prdFor(
        'Buyers and sellers need clear product discovery, straightforward checkout, and reliable order fulfillment.',
        [
          'Provide searchable product listings',
          'Deliver a clear, secure checkout experience',
          'Enable sellers to manage inventory and orders'
        ],
        [
          'Seller product listings with inventory controls',
          'Cart and checkout with payment integrations',
          'Order management and shipment tracking'
        ],
        [
          'Add to cart and complete checkout with confirmation',
          'Sellers can update inventory and process orders',
          'Order status updated until delivery'
        ],
        [
          'Catalog queries return under 300ms',
          'Secure payment integration',
          'Scalable media and CDN hosting'
        ],
        [
          'Conversion rate',
          'Average order value',
          'Fulfillment success rate'
        ],
        {
          mvp: ['Product listings, cart & checkout, basic order management'],
          phase2: ['Seller analytics, promotions'],
          phase3: ['Fulfillment services and multi-vendor settlement']
        }
      );
    }

    if (domain.includes('food delivery') || domain.includes('restaurant') || domain.includes('ubereats') || domain.includes('swiggy')) {
      return prdFor(
        'Customers want fast menu discovery and timely delivery while restaurants need reliable order intake and fulfillment tools.',
        [
          'Make restaurant menus discoverable and orderable',
          'Assign delivery partners reliably',
          'Provide accurate ETAs and order tracking'
        ],
        [
          'Menu browsing and order placement',
          'Restaurant order dashboard',
          'Delivery assignment and tracking'
        ],
        [
          'Place orders and receive confirmations',
          'Restaurants accept and manage orders',
          'Delivery agents receive assignments and update ETAs'
        ],
        [
          'Low-latency order routing during peaks',
          'Realtime courier tracking for customers',
          'Scalable peak-hour order processing'
        ],
        [
          'Orders per hour',
          'Average delivery time',
          'Order completion rate'
        ],
        {
          mvp: ['Menu & ordering, restaurant dashboard, delivery assignment'],
          phase2: ['Batching & routing optimizations, promotions'],
          phase3: ['Predictive demand forecasting, dark-kitchen integrations']
        }
      );
    }

    // Fallback generic SaaS PRD built from entities and roles but without enterprise buzzwords
    return prdFor(
      `Deliver a focused MVP for ${semantic.domainName || 'the product'} addressing core user workflows.`,
      ['Deliver core MVP features quickly', 'Ensure secure data handling', 'Design for incremental scaling'],
      (semantic.entities || []).slice(0,6).map(e => `${e.name} management`),
      ['Core CRUD for primary entities', 'Authentication & role-based access control', 'Admin export/import for data'],
      ['API latency targets under 300ms', 'Encrypted data at rest', 'Automated backups'],
      ['MAU', 'Time-to-first-successful-transaction'],
      { mvp: ['Core CRUD', 'Authentication', 'Basic dashboard'], phase2: ['Integrations', 'Improved UX'], phase3: ['Scale & perf'] }
    );
  }

  function generateUserStories(semantic) {
    const domain = (semantic.domainName || '').toLowerCase();

    // Helper to build story objects consistently
    const S = (id, role, want, so, acceptance) => ({ id, role, story: `As a ${role}, I want to ${want} so that ${so}`, acceptance: acceptance || [] });

    if (domain.includes('task management') || domain.includes('todo') || domain.includes('to-do')) {
      return [
        S('TM-01', 'Member', 'create a task with title, description, and due date', 'I have clear work to do', ['Task appears in project list', 'Due date editable']),
        S('TM-02', 'Member', 'assign a task to a teammate', 'responsibilities are clear', ['Assignee appears on task', 'Assignee notified']),
        S('TM-03', 'Project Manager', 'view overdue tasks across projects', 'I can reallocate resources', ['Overdue filter works', 'Exportable list']),
        S('TM-04', 'Admin', 'manage workspace roles and permissions', 'access is controlled', ['Role UI available', 'Permissions enforced on API'])
      ];
    }

    if (domain.includes('vacation rental') || domain.includes('airbnb') || domain.includes('property')) {
      return [
        S('VR-01', 'Guest', 'search properties by location, date range, and filters', 'I can find stays that match my needs', ['Search filters apply', 'Availability respected']),
        S('VR-02', 'Guest', 'book a property with secure payment and confirmation', 'my trip is guaranteed', ['Booking confirmed', 'Receipt sent']),
        S('VR-03', 'Host', 'create and manage a listing with calendar availability', 'guests can book accurate dates', ['Listing visible in search', 'Calendar blocks/unblocks correctly']),
        S('VR-04', 'Ops', 'resolve disputes and refunds per policy', 'platform trust is preserved', ['Dispute queue', 'Audit trail of actions'])
      ];
    }

    if (domain.includes('ride') || domain.includes('ride-sharing') || domain.includes('taxi') || domain.includes('uber')) {
      return [
        S('RS-01', 'Rider', 'request a ride and see nearby drivers', 'I can get picked up quickly', ['Nearby drivers shown', 'Request accepted or queued']),
        S('RS-02', 'Driver', 'receive ride requests and view fare details', 'I can decide to accept based on fare', ['Request shows fare', 'Accept/reject works']),
        S('RS-03', 'Rider', 'track my route and ETA in real time', 'I know when to be ready', ['Live tracking updates', 'ETA recalculates on route changes']),
        S('RS-04', 'Operations', 'monitor trip completions and supply levels', 'we can rebalance drivers', ['Dashboard shows live metrics', 'Alerts for low supply'])
      ];
    }

    if (domain.includes('professional') || domain.includes('network') || domain.includes('linkedin')) {
      return [
        S('PN-01', 'Member', 'create a professional profile with experience and skills', 'recruiters and peers can discover me', ['Profile saved', 'Searchable by keywords']),
        S('PN-02', 'Member', 'connect with other professionals', 'I can grow my network', ['Connection invites sent', 'Mutual connections visible']),
        S('PN-03', 'Recruiter', 'post job listings and review applicants', 'I can hire qualified candidates', ['Job visible in search', 'Applications listed']),
        S('PN-04', 'Member', 'message connections directly', 'I can communicate privately', ['Message delivered', 'Threading supported'])
      ];
    }

    if (domain.includes('e-commerce') || domain.includes('shop') || domain.includes('checkout') || domain.includes('amazon')) {
      return [
        S('EC-01', 'Buyer', 'search and filter products', 'I can find suitable items', ['Filters apply', 'Results ranked']),
        S('EC-02', 'Buyer', 'add items to cart and checkout securely', 'I can complete my purchase', ['Cart persists', 'Payment confirmed']),
        S('EC-03', 'Seller', 'manage inventory and list products', 'customers can buy available items', ['Listing updated', 'Stock decremented at purchase']),
        S('EC-04', 'Logistics', 'update shipment status and tracking', 'buyers can follow deliveries', ['Tracking visible', 'Status timeline'])
      ];
    }

    // Generic fallback: synthesize stories from roles and top features
    const roles = semantic.roles && semantic.roles.length ? semantic.roles.slice(0,4) : ['User'];
    const features = (semantic.coreEntities && semantic.coreEntities.length) ? semantic.coreEntities.slice(0,4) : ['Primary Resource'];
    const out = [];
    for (let i = 0; i < Math.min(4, roles.length); i++) {
      out.push({ id: `GEN-${i+1}`, role: roles[i], story: `As a ${roles[i]}, I want to interact with ${features[i] || features[0]} so that I can accomplish domain-specific tasks.`, acceptance: [] });
    }
    return out;
  }

  function generateRoadmap(semantic) {
    const domain = (semantic.domainName || '').toLowerCase();

    if (domain.includes('task management') || domain.includes('todo') || domain.includes('to-do')) {
      return {
        mvp: ['User auth, project & task CRUD, basic notifications'],
        phase2: ['Realtime comments and presence, recurring tasks, calendar sync'],
        phase3: ['Advanced reporting, automation rules, enterprise integrations']
      };
    }

    if (domain.includes('vacation rental') || domain.includes('airbnb') || domain.includes('property')) {
      return {
        mvp: ['Host listing onboarding, calendar availability, search & basic booking'],
        phase2: ['Host verification & payouts, messaging, promotions'],
        phase3: ['Dynamic pricing, partner integrations, mobile apps']
      };
    }

    if (domain.includes('ride') || domain.includes('ride-sharing') || domain.includes('taxi') || domain.includes('uber')) {
      return {
        mvp: ['Driver onboarding, ride request/accept, ETA tracking'],
        phase2: ['Dispatch optimizations, dynamic pricing & driver incentives'],
        phase3: ['Pooling, multi-modal routing, operator dashboards']
      };
    }

    if (domain.includes('professional') || domain.includes('network') || domain.includes('linkedin')) {
      return {
        mvp: ['Profile pages, connections, basic feed, job posting & application flows'],
        phase2: ['Messaging, search improvements, premium subscriptions'],
        phase3: ['Enterprise recruiting features, AI-powered recommendations']
      };
    }

    // Generic fallback roadmap
    return {
      mvp: ['Core CRUD APIs, authentication, basic UI flows'],
      phase2: ['Improved UX, integrations, notifications'],
      phase3: ['Scaling & analytics, optional AI enhancements']
    };
  }

  function generateDatabaseSchemas(semantic) {
    if (semantic.domainName !== 'Task Management Application') return null;

    const sql = `-- PostgreSQL schema for Task Management

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'End User',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  priority VARCHAR(20) DEFAULT 'normal',
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
`;

    const nosql = `// Mongoose Schemas for Task Management
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  fullName: { type: String },
  role: { type: String, enum: ['End User','Project Manager','Admin'], default: 'End User' }
}, { timestamps: true });

const ProjectSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const TaskSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['todo','in_progress','done','blocked'], default: 'todo' },
  priority: { type: String, enum: ['low','normal','high'], default: 'normal' },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date
}, { timestamps: true });

const CommentSchema = new Schema({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User' },
  body: { type: String, required: true }
}, { timestamps: true });

module.exports = { UserSchema, ProjectSchema, TaskSchema, CommentSchema };
`;

    return { sql, nosql };
  }

  function generateApiDesign(semantic) {
    if (semantic.domainName !== 'Task Management Application') return null;

    const endpoints = [
      { method: 'POST', path: '/api/auth/login', description: 'Authenticate user and return JWT token' },
      { method: 'GET', path: '/api/projects', description: 'List projects visible to user' },
      { method: 'POST', path: '/api/projects', description: 'Create a new project (auth: Project Manager or Admin)' },
      { method: 'GET', path: '/api/projects/:id/tasks', description: 'List tasks for a project with filters (status, assignee, dueDate)' },
      { method: 'POST', path: '/api/projects/:id/tasks', description: 'Create a new task within a project' },
      { method: 'PATCH', path: '/api/tasks/:id', description: 'Update task fields (status, assignee, priority, due_date)' },
      { method: 'POST', path: '/api/tasks/:id/comments', description: 'Add a comment to a task' }
    ];

    const authStrategy = 'JWT tokens with role claims (End User, Project Manager, Admin). Protect create/update endpoints; allow read endpoints for authorized members.';
    const errorHandling = 'Consistent JSON error envelopes: { error: true, code: "ERR_CODE", message: "human readable" }; use 400/401/403/404/500 status codes appropriately.';

    return { endpoints, authStrategy, errorHandling };
  }

  // =========================================
  // DOMAIN CLASSIFIER & SPECIFICATION COMPILER
  // =========================================
  function extractSemanticDetails(prompt) {
    const normalized = prompt.toLowerCase();
    
    let domainName = "";
    let roles = [];
    let entities = [];
    let integrations = [];
    let coreEntities = [];
    let revenueModel = "Platform commission with transaction fees and optional premium service tiers.";
    let competitors = [];

    // --- Explicit domain detection (override fallback) ---
    // Map common user phrases to well-known domain blueprints
    if (normalized.includes('todo app') || normalized.includes('to-do') || normalized.includes('task management')) {
      domainName = "Task Management Application";
      roles = ["End User", "Project Manager", "Admin"];
      coreEntities = ["Tasks", "Projects", "Comments", "Users"];
      revenueModel = "Freemium subscriptions with paid Team and Enterprise tiers.";
      entities = [
        { name: "Task", tableName: "tasks", fields: [ { name: "owner_id", type: "UUID", refTable: "users" }, { name: "title", type: "VARCHAR(255)" }, { name: "description", type: "TEXT" }, { name: "status", type: "VARCHAR(50)" } ] },
        { name: "Project", tableName: "projects", fields: [ { name: "owner_id", type: "UUID", refTable: "users" }, { name: "name", type: "VARCHAR(255)" } ] }
      ];
      competitors = ["Trello", "Asana", "ClickUp", "Jira", "Notion"];
      return { domainName, roles, entities, integrations, coreEntities, revenueModel, competitors };
    }

    if (normalized.includes('airbnb clone') || normalized.includes('vacation rental') || normalized.includes('airbnb')) {
      domainName = "Vacation Rental Marketplace";
      roles = ["Guest Renter", "Host Property Owner", "Platform Operations Lead"];
      coreEntities = ["Guests", "Hosts", "Properties", "Bookings", "Reviews", "Payments"];
      revenueModel = "Commission per booking plus premium host services.";
      // keep falling through to existing entity logic later when applicable
    }

    if (normalized.includes('uber clone') || normalized.includes('ride-sharing') || normalized.includes('taxi') || normalized.includes('cab booking')) {
      domainName = "Ride Sharing Marketplace";
      roles = ["Rider", "Driver", "Dispatcher"];
      coreEntities = ["Drivers", "Rides", "Payments", "Vehicles"];
      revenueModel = "Per-ride commission and surge pricing fees.";
    }

    if (normalized.includes('linkedin clone') || normalized.includes('professional networking') || normalized.includes('linkedin')) {
      domainName = "Professional Networking Platform";
      roles = ["Job Seeker", "Recruiter", "Professional"];
      coreEntities = ["Profiles", "Connections", "Jobs", "Messages"];
      revenueModel = "Premium subscriptions and enterprise hiring plans.";
    }

    if (normalized.includes('amazon clone') || normalized.includes('ecommerce') || normalized.includes('e-commerce') || normalized.includes('amazon')) {
      domainName = "E-commerce Marketplace";
      roles = ["Buyer", "Seller", "Marketplace Admin"];
      coreEntities = ["Products", "Orders", "Carts", "Payments"];
      revenueModel = "Transaction fees, listing fees, and premium seller services.";
    }
    // --- end explicit detection ---
    
    // 1. Vacation Rental Marketplace (Airbnb style)
    if (normalized.includes('airbnb') || normalized.includes('vacation rental') || normalized.includes('hotel') || normalized.includes('room booking') || normalized.includes('stay') || normalized.includes('property booking')) {
      domainName = "Vacation Rental Marketplace";
      roles = ["Guest Renter", "Host Property Owner", "Platform Operations Lead"];
      coreEntities = ["Guests", "Hosts", "Properties", "Bookings", "Reviews", "Payments", "Availability Calendars", "Wishlists"];
      revenueModel = "Commission per booking plus premium host services and promotional listing upgrades.";
      entities = [
        {
          name: "PropertyListing",
          tableName: "property_listings",
          fields: [
            { name: "host_id", type: "UUID", refTable: "users", description: "Host account profile owning the listing" },
            { name: "title", type: "VARCHAR(255)", description: "Title of the vacation property" },
            { name: "description", type: "TEXT", description: "Detailed description of rooms, amenities, and location" },
            { name: "price_per_night", type: "DECIMAL(10,2)", description: "Cost per single night stay in USD" },
            { name: "max_guests", type: "INT", description: "Maximum accommodation capacity limit" },
            { name: "latitude", type: "DOUBLE PRECISION", description: "Geographic latitude of property" },
            { name: "longitude", type: "DOUBLE PRECISION", description: "Geographic longitude of property" },
            { name: "status", type: "VARCHAR(50)", description: "Listing status: 'Active', 'Blocked', 'Archived'" }
          ]
        },
        {
          name: "Reservation",
          tableName: "reservations",
          fields: [
            { name: "listing_id", type: "UUID", refTable: "property_listings", description: "Booked property listing reference" },
            { name: "guest_id", type: "UUID", refTable: "users", description: "Guest customer placing the booking" },
            { name: "start_date", type: "DATE", description: "Check-in calendar date" },
            { name: "end_date", type: "DATE", description: "Check-out calendar date" },
            { name: "total_price", type: "DECIMAL(10,2)", description: "Sum price calculation of stay duration" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'" }
          ]
        },
        {
          name: "BookingCancellation",
          tableName: "cancellations",
          fields: [
            { name: "reservation_id", type: "UUID", refTable: "reservations", description: "Reference to the cancelled stay booking" },
            { name: "cancelled_by_id", type: "UUID", refTable: "users", description: "User ID who triggered the cancellation" },
            { name: "refund_amount", type: "DECIMAL(10,2)", description: "Refund amount issued for the cancelled booking" },
            { name: "reason", type: "TEXT", description: "Cancellation explanation details" }
          ]
        },
        {
          name: "Payment",
          tableName: "payments",
          fields: [
            { name: "reservation_id", type: "UUID", refTable: "reservations", description: "Booking reference for payment settlement" },
            { name: "amount", type: "DECIMAL(10,2)", description: "Total payment amount for the reservation" },
            { name: "payment_method", type: "VARCHAR(100)", description: "Payment method type: 'Card', 'Wallet', 'GiftCard'" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Authorized', 'Captured', 'Refunded'" }
          ]
        },
        {
          name: "Review",
          tableName: "reviews",
          fields: [
            { name: "reservation_id", type: "UUID", refTable: "reservations", description: "Reference to the completed stay reservation" },
            { name: "reviewer_id", type: "UUID", refTable: "users", description: "Author submitting review rating" },
            { name: "rating", type: "INT", description: "Review rating score rank (1 to 5)" },
            { name: "comment", type: "TEXT", description: "Review summary text feedback" }
          ]
        }
      ];
    }
    // 2. Ride-Sharing Marketplace (Uber style)
    else if (normalized.includes('uber') || normalized.includes('ride-sharing') || normalized.includes('taxi') || normalized.includes('cab booking') || normalized.includes('ride sharing') || normalized.includes('driver matching')) {
      domainName = "Ride-Sharing Marketplace";
      roles = ["Rider Customer", "Driver Partner", "Fleet Operations Manager"];
      coreEntities = ["Riders", "Drivers", "Rides", "Vehicles", "Payments", "Ratings"];
      revenueModel = "A commission-based fare share model with surge pricing and driver payout fees.";
      entities = [
        {
          name: "DriverProfile",
          tableName: "driver_profiles",
          fields: [
            { name: "driver_id", type: "UUID", refTable: "users", description: "Link to user profile registered as a driver" },
            { name: "license_number", type: "VARCHAR(100)", description: "Driver license ID" },
            { name: "vehicle_info", type: "TEXT", description: "Vehicle model, make, color, and plate" },
            { name: "is_online", type: "BOOLEAN", description: "Availability toggle to receive dispatch offers" },
            { name: "rating_avg", type: "DECIMAL(3,2)", description: "Average rider feedback rating score" }
          ]
        },
        {
          name: "Ride",
          tableName: "rides",
          fields: [
            { name: "rider_id", type: "UUID", refTable: "users", description: "Rider user reference placing the request" },
            { name: "driver_id", type: "UUID", refTable: "users", description: "Assigned driver user reference" },
            { name: "pickup_latitude", type: "DOUBLE PRECISION", description: "Pickup location latitude" },
            { name: "pickup_longitude", type: "DOUBLE PRECISION", description: "Pickup location longitude" },
            { name: "dropoff_latitude", type: "DOUBLE PRECISION", description: "Destination location latitude" },
            { name: "dropoff_longitude", type: "DOUBLE PRECISION", description: "Destination location longitude" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Requested', 'Accepted', 'Arrived', 'InTransit', 'Completed', 'Cancelled'" }
          ]
        },
        {
          name: "Vehicle",
          tableName: "vehicles",
          fields: [
            { name: "driver_id", type: "UUID", refTable: "users", description: "Driver assigned to this vehicle" },
            { name: "make", type: "VARCHAR(100)", description: "Vehicle manufacturer" },
            { name: "model", type: "VARCHAR(100)", description: "Vehicle model name" },
            { name: "license_plate", type: "VARCHAR(50)", description: "Vehicle registration plate" },
            { name: "capacity", type: "INT", description: "Passenger seating capacity" }
          ]
        },
        {
          name: "Payment",
          tableName: "payments",
          fields: [
            { name: "ride_id", type: "UUID", refTable: "rides", description: "Reference to the completed ride" },
            { name: "amount", type: "DECIMAL(10,2)", description: "Final fare amount" },
            { name: "tip_amount", type: "DECIMAL(10,2)", description: "Driver tip amount" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Authorized', 'Captured', 'Refunded'" }
          ]
        },
        {
          name: "Rating",
          tableName: "ratings",
          fields: [
            { name: "ride_id", type: "UUID", refTable: "rides", description: "Reference to the corresponding ride" },
            { name: "reviewer_role", type: "VARCHAR(50)", description: "Reviewer identity: 'Rider' or 'Driver'" },
            { name: "score", type: "INT", description: "Rating score rank (1 to 5)" },
            { name: "comment", type: "TEXT", description: "Feedback notes" }
          ]
        }
      ];
    }
    // 3. Food Delivery Marketplace (Swiggy style)
    else if (normalized.includes('swiggy') || normalized.includes('doordash') || normalized.includes('ubereats') || normalized.includes('food delivery') || normalized.includes('restaurant booking') || normalized.includes('delivery app')) {
      domainName = "Food Delivery Marketplace";
      roles = ["Customer", "Restaurant Partner", "Delivery Agent", "Operations Manager"];
      coreEntities = ["Customers", "Restaurants", "Menu Items", "Orders", "Deliveries", "Payments", "Reviews"];
      revenueModel = "Order commissions plus delivery fees and restaurant service charges.";
      entities = [
        {
          name: "Restaurant",
          tableName: "restaurants",
          fields: [
            { name: "owner_id", type: "UUID", refTable: "users", description: "Manager account owner ID reference" },
            { name: "name", type: "VARCHAR(255)", description: "Restaurant business name" },
            { name: "cuisine_type", type: "VARCHAR(100)", description: "Cuisine classification tag (e.g. Italian, Indian)" },
            { name: "address", type: "TEXT", description: "Physical street location of kitchen" },
            { name: "is_open", type: "BOOLEAN", description: "Active operations ordering toggle" }
          ]
        },
        {
          name: "MenuItem",
          tableName: "menu_items",
          fields: [
            { name: "restaurant_id", type: "UUID", refTable: "restaurants", description: "Link to parent kitchen restaurant" },
            { name: "name", type: "VARCHAR(255)", description: "Dish or item title" },
            { name: "description", type: "TEXT", description: "Detailed dish preparation explanation" },
            { name: "price", type: "DECIMAL(10,2)", description: "Cost per single serving in USD" }
          ]
        },
        {
          name: "Order",
          tableName: "orders",
          fields: [
            { name: "customer_id", type: "UUID", refTable: "users", description: "Customer placing the order" },
            { name: "restaurant_id", type: "UUID", refTable: "restaurants", description: "Target kitchen preparing the food" },
            { name: "delivery_agent_id", type: "UUID", refTable: "users", description: "Assigned courier courier" },
            { name: "total_price", type: "DECIMAL(10,2)", description: "Total checkout invoice cost" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Created', 'Preparing', 'ReadyForPickup', 'InTransit', 'Delivered', 'Cancelled'" }
          ]
        },
        {
          name: "DeliveryAssignment",
          tableName: "deliveries",
          fields: [
            { name: "order_id", type: "UUID", refTable: "orders", description: "Reference to the delivery order" },
            { name: "delivery_agent_id", type: "UUID", refTable: "users", description: "Assigned courier for the order" },
            { name: "pickup_time", type: "TIMESTAMP", description: "Time courier picked up the order" },
            { name: "dropoff_time", type: "TIMESTAMP", description: "Time courier completed the dropoff" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Assigned', 'PickedUp', 'InTransit', 'Delivered'" }
          ]
        },
        {
          name: "Payment",
          tableName: "payments",
          fields: [
            { name: "order_id", type: "UUID", refTable: "orders", description: "Reference to the paid order" },
            { name: "amount", type: "DECIMAL(10,2)", description: "Total amount paid by the customer" },
            { name: "fee_type", type: "VARCHAR(50)", description: "Fee type: 'Delivery', 'Service', 'Tax'" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Authorized', 'Settled', 'Refunded'" }
          ]
        }
      ];
    }
    // 4. Professional Social Network (LinkedIn style)
    else if (normalized.includes('linkedin') || normalized.includes('social network') || normalized.includes('professional network') || normalized.includes('connections') || normalized.includes('job board') || normalized.includes('posts')) {
      domainName = "Professional Networking Platform";
      roles = ["Member", "Recruiter", "Community Moderator"];
      coreEntities = ["Members", "Profiles", "Posts", "Connections", "Jobs", "Messages"];
      revenueModel = "Premium subscriptions and sponsored job postings with talent sourcing fees.";
      entities = [
        {
          name: "MemberProfile",
          tableName: "profiles",
          fields: [
            { name: "member_id", type: "UUID", refTable: "users", description: "Account identity owner reference" },
            { name: "headline", type: "VARCHAR(255)", description: "Job title and career headline" },
            { name: "summary", type: "TEXT", description: "Career summary profile description" },
            { name: "industry", type: "VARCHAR(150)", description: "Industrial domain categorization" },
            { name: "skills_list", type: "TEXT[]", description: "Certified professional capabilities array" }
          ]
        },
        {
          name: "Connection",
          tableName: "connections",
          fields: [
            { name: "requester_id", type: "UUID", refTable: "users", description: "Member initiating invitation request" },
            { name: "receiver_id", type: "UUID", refTable: "users", description: "Member receiving invitation request" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Pending', 'Accepted', 'Blocked'" }
          ]
        },
        {
          name: "Post",
          tableName: "posts",
          fields: [
            { name: "author_id", type: "UUID", refTable: "users", description: "Member posting the text block" },
            { name: "content_text", type: "TEXT", description: "Text content and description of post update" },
            { name: "media_url", type: "TEXT", description: "Linked photo or document URL" },
            { name: "likes_count", type: "INT", description: "Aggregated member recommendation counts" }
          ]
        },
        {
          name: "Message",
          tableName: "messages",
          fields: [
            { name: "sender_id", type: "UUID", refTable: "users", description: "Member posting message text" },
            { name: "receiver_id", type: "UUID", refTable: "users", description: "Target recipient member profile" },
            { name: "content_text", type: "TEXT", description: "Direct message content string" }
          ]
        },
        {
          name: "JobListing",
          tableName: "jobs",
          fields: [
            { name: "employer_id", type: "UUID", refTable: "users", description: "Recruiter or employer posting the job" },
            { name: "title", type: "VARCHAR(255)", description: "Job title" },
            { name: "description", type: "TEXT", description: "Job responsibilities and qualifications" },
            { name: "location", type: "VARCHAR(255)", description: "Job location or remote indication" },
            { name: "employment_type", type: "VARCHAR(50)", description: "Type: 'Full-time', 'Contract', 'Part-time'" }
          ]
        }
      ];
    }
    // 5. E-Commerce Marketplace (Amazon style)
    else if (normalized.includes('amazon') || normalized.includes('e-commerce') || normalized.includes('ecommerce') || normalized.includes('online shop') || normalized.includes('checkout store')) {
      domainName = "E-Commerce Marketplace";
      roles = ["Shopper", "Seller", "Logistics Manager"];
      coreEntities = ["Products", "Carts", "Orders", "Payments", "Shipments", "Reviews"];
      revenueModel = "Marketplace commissions plus fulfillment and promotional listing fees.";
      entities = [
        {
          name: "ProductListing",
          tableName: "products",
          fields: [
            { name: "seller_id", type: "UUID", refTable: "users", description: "Merchant account selling the item" },
            { name: "title", type: "VARCHAR(255)", description: "Designation title of product" },
            { name: "description", type: "TEXT", description: "Specifications, material, and details text" },
            { name: "price", type: "DECIMAL(10,2)", description: "Standard listing price in USD" },
            { name: "stock_quantity", type: "INT", description: "Stock inventory count" }
          ]
        },
        {
          name: "ShoppingSession",
          tableName: "carts",
          fields: [
            { name: "buyer_id", type: "UUID", refTable: "users", description: "Shopper owner profile" },
            { name: "items_json", type: "JSONB", description: "Temporary shopping catalog items list" }
          ]
        },
        {
          name: "Order",
          tableName: "orders",
          fields: [
            { name: "buyer_id", type: "UUID", refTable: "users", description: "Customer buyer details" },
            { name: "total_amount", type: "DECIMAL(10,2)", description: "Grand checkout cost size" },
            { name: "shipping_address", type: "TEXT", description: "Physical shipping address details" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Paid', 'Shipped', 'Delivered', 'Returned'" }
          ]
        },
        {
          name: "Review",
          tableName: "reviews",
          fields: [
            { name: "product_id", type: "UUID", refTable: "products", description: "Product item reviewed" },
            { name: "reviewer_id", type: "UUID", refTable: "users", description: "Shopper buyer posting review" },
            { name: "rating", type: "INT", description: "Product rating score range (1 to 5)" },
            { name: "comment", type: "TEXT", description: "Product review detail text" }
          ]
        },
        {
          name: "Shipment",
          tableName: "shipments",
          fields: [
            { name: "order_id", type: "UUID", refTable: "orders", description: "Related order for shipment" },
            { name: "carrier", type: "VARCHAR(100)", description: "Shipping carrier name" },
            { name: "tracking_number", type: "VARCHAR(100)", description: "Carrier tracking number" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Pending', 'Shipped', 'InTransit', 'Delivered'" }
          ]
        }
      ];
    }
    // 6. Fintech Payment Ledger (Stripe style)
    else if (normalized.includes('stripe') || normalized.includes('fintech') || normalized.includes('ledger') || normalized.includes('payments api') || normalized.includes('payouts') || normalized.includes('wallet')) {
      domainName = "Digital Ledger & Payments API";
      roles = ["Merchant Business", "Payer Customer", "Financial Compliance Auditor"];
      entities = [
        {
          name: "MerchantWallet",
          tableName: "wallets",
          fields: [
            { name: "merchant_id", type: "UUID", refTable: "users", description: "Account owner merchant link" },
            { name: "balance", type: "DECIMAL(16,4)", description: "Wallet ledger balance in account currency" },
            { name: "currency", type: "VARCHAR(10)", description: "System currency code (e.g. USD, EUR)" },
            { name: "stripe_account_id", type: "VARCHAR(100)", description: "Stripe payout merchant ID mapping" }
          ]
        },
        {
          name: "PaymentTransaction",
          tableName: "transactions",
          fields: [
            { name: "wallet_id", type: "UUID", refTable: "wallets", description: "Target recipient ledger wallet" },
            { name: "amount", type: "DECIMAL(16,4)", description: "Financial checkout charge size" },
            { name: "currency", type: "VARCHAR(10)", description: "Transaction currency unit" },
            { name: "source_type", type: "VARCHAR(50)", description: "Options: 'CreditCard', 'BankTransfer'" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Authorized', 'Settled', 'Failed'" }
          ]
        },
        {
          name: "Payout",
          tableName: "payouts",
          fields: [
            { name: "wallet_id", type: "UUID", refTable: "wallets", description: "Source ledger wallet" },
            { name: "amount", type: "DECIMAL(16,4)", description: "Transferred bank settlement volume" },
            { name: "bank_account_info", type: "TEXT", description: "Masked bank account details" }
          ]
        },
        {
          name: "Refund",
          tableName: "refunds",
          fields: [
            { name: "transaction_id", type: "UUID", refTable: "transactions", description: "Reference to original charge transaction" },
            { name: "amount", type: "DECIMAL(16,4)", description: "Refund payload volume size" },
            { name: "reason", type: "TEXT", description: "Refund compliance request notes" }
          ]
        }
      ];
    }
    // 7. Collaborative Workspace (Notion style)
    else if (normalized.includes('notion') || normalized.includes('document workspace') || normalized.includes('pages') || normalized.includes('wiki') || normalized.includes('collaborative workspace')) {
      domainName = "Collaborative SaaS Document Workspace";
      roles = ["Workspace Owner", "Workspace Editor", "Workspace Viewer"];
      entities = [
        {
          name: "Workspace",
          tableName: "workspaces",
          fields: [
            { name: "owner_id", type: "UUID", refTable: "users", description: "User creating and billing the workspace" },
            { name: "name", type: "VARCHAR(150)", description: "Designation title of organization wiki" },
            { name: "plan_tier", type: "VARCHAR(50)", description: "Subscription level: 'Free', 'Pro', 'Enterprise'" }
          ]
        },
        {
          name: "DocumentPage",
          tableName: "pages",
          fields: [
            { name: "workspace_id", type: "UUID", refTable: "workspaces", description: "Parent workspace link" },
            { name: "parent_page_id", type: "UUID", refTable: "pages", description: "Self reference mapping parent wiki page" },
            { name: "title", type: "VARCHAR(255)", description: "Title heading of page" },
            { name: "content_json", type: "JSONB", description: "Rich text block structure editor payload" }
          ]
        },
        {
          name: "Comment",
          tableName: "comments",
          fields: [
            { name: "page_id", type: "UUID", refTable: "pages", description: "Target document page" },
            { name: "author_id", type: "UUID", refTable: "users", description: "Teammate commenting" },
            { name: "content_text", type: "TEXT", description: "Comment content detail string" }
          ]
        },
        {
          name: "Membership",
          tableName: "memberships",
          fields: [
            { name: "workspace_id", type: "UUID", refTable: "workspaces", description: "Target workspace wiki" },
            { name: "user_id", type: "UUID", refTable: "users", description: "Invited workspace collaborator" },
            { name: "member_role", type: "VARCHAR(50)", description: "Options: 'Owner', 'Editor', 'Viewer'" }
          ]
        }
      ];
    }
    // 8. AI Coaching & Scheduling Platform (Fitness Coach style)
    else if (normalized.includes('fitness') || normalized.includes('coach') || normalized.includes('gym') || normalized.includes('trainer') || normalized.includes('workout') || normalized.includes('meal')) {
      domainName = "AI Fitness Coaching Platform";
      roles = ["Client", "Coach", "Health Auditor"];
      coreEntities = ["Clients", "Programs", "Workouts", "Progress Entries", "Nutrition Plans"];
      revenueModel = "Subscription coaching plans with premium program upgrades and analytics add-ons.";
      entities = [
        {
          name: "ClientProfile",
          tableName: "client_profiles",
          fields: [
            { name: "client_id", type: "UUID", refTable: "users", description: "Account owner client user profile link" },
            { name: "goals_summary", type: "TEXT", description: "Weight, calorie limits, or fitness targets overview" },
            { name: "allergies_list", type: "TEXT[]", description: "Allergies array preventing dietary choices" },
            { name: "injury_logs", type: "TEXT[]", description: "Injuries list restricting workout exercises" }
          ]
        },
        {
          name: "CoachingProgram",
          tableName: "coaching_programs",
          fields: [
            { name: "client_id", type: "UUID", refTable: "users", description: "Reference to target program client" },
            { name: "week_number", type: "INT", description: "Chronological week index of coaching program" },
            { name: "dietary_instructions", type: "JSONB", description: "Daily macros, ingredients, and recipes objects" },
            { name: "is_active", type: "BOOLEAN", description: "Active program monitoring index" }
          ]
        },
        {
          name: "WorkoutSchedule",
          tableName: "workout_schedules",
          fields: [
            { name: "program_id", type: "UUID", refTable: "coaching_programs", description: "Reference to parent week program" },
            { name: "day_of_week", type: "VARCHAR(50)", description: "Day label (e.g. 'Monday')" },
            { name: "exercises_json", type: "JSONB", description: "List of exercise items containing sets and reps" },
            { name: "is_completed", type: "BOOLEAN", description: "Completion tracker indicator" }
          ]
        },
        {
          name: "ProgressEntry",
          tableName: "progress_entries",
          fields: [
            { name: "client_id", type: "UUID", refTable: "users", description: "Reference to client progress profile" },
            { name: "entry_date", type: "DATE", description: "Entry recording calendar date" },
            { name: "recorded_weight", type: "DECIMAL(5,2)", description: "Weight index indicator" },
            { name: "compliance_score", type: "DECIMAL(5,2)", description: "Program adherence score" }
          ]
        }
      ];
    }
    // DYNAMIC PARSER FALLBACKS (Enforcing strict, domain-appropriate names instead of generic "Records")
    else {
      // Is it a Marketplace?
      if (normalized.includes('buy') || normalized.includes('sell') || normalized.includes('trade') || normalized.includes('marketplace') || normalized.includes('shop') || normalized.includes('catalog') || normalized.includes('store') || normalized.includes('product')) {
        domainName = "Peer-to-Peer Product Marketplace";
        roles = ["Merchant Seller", "Customer Buyer", "Platform Moderator"];
        entities = [
          {
            name: "ProductListing",
            tableName: "product_listings",
            fields: [
              { name: "seller_id", type: "UUID", refTable: "users", description: "Merchant account listing the item" },
              { name: "title", type: "VARCHAR(255)", description: "Designation title of product" },
              { name: "description", type: "TEXT", description: "Details specifications text" },
              { name: "price", type: "DECIMAL(10,2)", description: "Listing cost value in USD" }
            ]
          },
          {
            name: "OrderTransaction",
            tableName: "orders",
            fields: [
              { name: "listing_id", type: "UUID", refTable: "product_listings", description: "Reference to parent product item" },
              { name: "buyer_id", type: "UUID", refTable: "users", description: "Shopper buyer user profile link" },
              { name: "stripe_payment_id", type: "VARCHAR(255)", description: "Payment gateway validation charge ID" },
              { name: "status", type: "VARCHAR(50)", description: "Status: 'Authorized', 'Settled', 'Refunded'" }
            ]
          },
          {
            name: "EscrowPayment",
            tableName: "payments",
            fields: [
              { name: "order_id", type: "UUID", refTable: "orders", description: "Reference to corresponding order" },
              { name: "amount", type: "DECIMAL(10,2)", description: "Ledger transaction charge volume" },
              { name: "payout_status", type: "VARCHAR(50)", description: "Options: 'Held', 'Released', 'Refunded'" }
            ]
          },
          {
            name: "CustomerReview",
            tableName: "reviews",
            fields: [
              { name: "listing_id", type: "UUID", refTable: "product_listings", description: "Product reviewed" },
              { name: "reviewer_id", type: "UUID", refTable: "users", description: "Shopper buyer posting review" },
              { name: "rating", type: "INT", description: "Product rating score rank (1 to 5)" }
            ]
          }
        ];
      }
      // Is it a Booking/Scheduling platform?
      else if (normalized.includes('book') || normalized.includes('reserve') || normalized.includes('calendar') || normalized.includes('schedule') || normalized.includes('appointment') || normalized.includes('date') || normalized.includes('slot') || normalized.includes('loan')) {
        domainName = "On-Demand Resource Booking Hub";
        roles = ["Renter", "Resource Provider", "Operations Administrator"];
        coreEntities = ["Resources", "Reservations", "Payments", "Availability Schedules"];
        revenueModel = "Booking convenience fees and service charges on confirmed reservations.";
        entities = [
          {
            name: "ResourceListing",
            tableName: "resource_listings",
            fields: [
              { name: "owner_id", type: "UUID", refTable: "users", description: "Host account owner reference" },
              { name: "title", type: "VARCHAR(255)", description: "Designation title of booked resource" },
              { name: "hourly_rate", type: "DECIMAL(10,2)", description: "Charge fee size per single hour" }
            ]
          },
          {
            name: "ReservationBooking",
            tableName: "reservations",
            fields: [
              { name: "resource_id", type: "UUID", refTable: "resource_listings", description: "Booked resource reference" },
              { name: "renter_id", type: "UUID", refTable: "users", description: "Renter customer user profile link" },
              { name: "start_time", type: "TIMESTAMP", description: "Booking calendar start date and hour" },
              { name: "end_time", type: "TIMESTAMP", description: "Booking calendar end date and hour" },
              { name: "status", type: "VARCHAR(50)", description: "Status: 'Reserved', 'Active', 'Completed', 'Cancelled'" }
            ]
          },
          {
            name: "BookingCancellation",
            tableName: "cancellations",
            fields: [
              { name: "reservation_id", type: "UUID", refTable: "reservations", description: "Reference to cancelled booking" },
              { name: "cancelled_by_id", type: "UUID", refTable: "users", description: "User who cancelled reservation" },
              { name: "refund_amount", type: "DECIMAL(10,2)", description: "Refund payload invoice volume" }
            ]
          },
          {
            name: "AvailabilitySchedule",
            tableName: "availability_schedules",
            fields: [
              { name: "resource_id", type: "UUID", refTable: "resource_listings", description: "Parent resource" },
              { name: "day_of_week", type: "VARCHAR(50)", description: "Day label (e.g. 'Monday')" },
              { name: "open_hour", type: "VARCHAR(10)", description: "Opening hour stamp" },
              { name: "close_hour", type: "VARCHAR(10)", description: "Closing hour stamp" }
            ]
          }
        ];
      }
      // Is it a Social network?
      else if (normalized.includes('social') || normalized.includes('friend') || normalized.includes('network') || normalized.includes('connect') || normalized.includes('profile') || normalized.includes('chat') || normalized.includes('message') || normalized.includes('post')) {
        domainName = "Social Networking & Media Platform";
        roles = ["Network Member", "Content Moderator", "System Administrator"];
        coreEntities = ["Members", "Connections", "Posts", "Messages"];
        revenueModel = "Ad-supported community access with premium membership upgrades.";
        entities = [
          {
            name: "MemberProfile",
            tableName: "member_profiles",
            fields: [
              { name: "member_id", type: "UUID", refTable: "users", description: "Account identity owner reference" },
              { name: "display_name", type: "VARCHAR(150)", description: "Public screen name of member" },
              { name: "bio", type: "TEXT", description: "Profile bio description" }
            ]
          },
          {
            name: "MemberConnection",
            tableName: "connections",
            fields: [
              { name: "requester_id", type: "UUID", refTable: "users", description: "Initiating member" },
              { name: "receiver_id", type: "UUID", refTable: "users", description: "Target member accepting connection" },
              { name: "status", type: "VARCHAR(50)", description: "Status: 'Pending', 'Connected', 'Blocked'" }
            ]
          },
          {
            name: "MemberPost",
            tableName: "posts",
            fields: [
              { name: "author_id", type: "UUID", refTable: "users", description: "Member posting content" },
              { name: "content_text", type: "TEXT", description: "Main text feed paragraph" },
              { name: "media_url", type: "TEXT", description: "Link hosting photo media" }
            ]
          },
          {
            name: "DirectMessage",
            tableName: "messages",
            fields: [
              { name: "sender_id", type: "UUID", refTable: "users", description: "Member posting message text" },
              { name: "receiver_id", type: "UUID", refTable: "users", description: "Recipient member profile link" },
              { name: "content_text", type: "TEXT", description: "Direct message content string" }
            ]
          }
        ];
      }
      // Fallback SaaS
      else {
        domainName = "B2B SaaS Hub & Portal";
        roles = ["Account Owner", "Staff Teammate", "System Auditor"];
        coreEntities = ["Organizations", "Memberships", "Integrations", "Reports"];
        revenueModel = "Subscription tiers and enterprise onboarding fees.";
        entities = [
          {
            name: "OrganizationProfile",
            tableName: "organizations",
            fields: [
              { name: "name", type: "VARCHAR(255)", description: "B2B company or organization name" },
              { name: "billing_tier", type: "VARCHAR(50)", description: "SaaS plan: 'Standard', 'Premium', 'Enterprise'" }
            ]
          },
          {
            name: "StaffMembership",
            tableName: "memberships",
            fields: [
              { name: "org_id", type: "UUID", refTable: "organizations", description: "Parent organization link" },
              { name: "user_id", type: "UUID", refTable: "users", description: "Teammate account reference" },
              { name: "member_role", type: "VARCHAR(50)", description: "Teammate permission level: 'Admin', 'Staff'" }
            ]
          },
          {
            name: "IntegrationConnector",
            tableName: "integrations",
            fields: [
              { name: "org_id", type: "UUID", refTable: "organizations", description: "Parent organization link" },
              { name: "service_name", type: "VARCHAR(150)", description: "Name of external service (e.g. Stripe, Twilio)" },
              { name: "sync_status", type: "VARCHAR(50)", description: "Integration sync status: 'Connected', 'Disconnected'" }
            ]
          },
          {
            name: "SaaSReport",
            tableName: "reports",
            fields: [
              { name: "org_id", type: "UUID", refTable: "organizations", description: "Parent organization link" },
              { name: "created_by", type: "UUID", refTable: "users", description: "Staff teammate who generated report" },
              { name: "title", type: "VARCHAR(255)", description: "Designation title of report" },
              { name: "configuration_json", type: "JSONB", description: "Metric settings object layout configurations" }
            ]
          }
        ];
      }
    }
    
    // Populate competitors based on detected domain (top 3-5)
    if (!competitors || competitors.length === 0) {
      switch ((domainName || '').toLowerCase()) {
        case 'ride sharing marketplace':
          competitors = ['Uber', 'Lyft', 'Ola', 'Rapido', 'Bolt'];
          break;
        case 'vacation rental marketplace':
          competitors = ['Airbnb', 'Vrbo', 'Booking.com', 'Agoda', 'Expedia'];
          break;
        case 'professional networking platform':
          competitors = ['LinkedIn', 'Indeed', 'Glassdoor', 'AngelList'];
          break;
        case 'e-commerce marketplace':
          competitors = ['Amazon', 'Flipkart', 'eBay', 'Etsy', 'Walmart Marketplace'];
          break;
        case 'food delivery marketplace':
          competitors = ['Swiggy', 'Zomato', 'Uber Eats', 'DoorDash'];
          break;
        case 'task management application':
          competitors = ['Trello', 'Asana', 'ClickUp', 'Jira', 'Notion'];
          break;
        case 'collaborative saas document workspace':
          competitors = ['Notion', 'Confluence', 'Dropbox Paper', 'Coda', 'Quip'];
          break;
        default:
          // Keyword-based fallback: derive reasonable competitors from prompt keywords
          if (normalized.includes('ride') || normalized.includes('taxi') || normalized.includes('driver')) competitors = ['Uber', 'Lyft', 'Ola'];
          else if (normalized.includes('rental') || normalized.includes('stay') || normalized.includes('property')) competitors = ['Airbnb', 'Vrbo', 'Booking.com'];
          else if (normalized.includes('shop') || normalized.includes('e-commerce') || normalized.includes('product')) competitors = ['Amazon', 'eBay', 'Etsy'];
          else if (normalized.includes('food') || normalized.includes('restaurant') || normalized.includes('delivery')) competitors = ['Swiggy', 'Zomato', 'Uber Eats'];
          else if (normalized.includes('task') || normalized.includes('todo') || normalized.includes('project')) competitors = ['Trello', 'Asana', 'ClickUp'];
          else if (normalized.includes('network') || normalized.includes('linkedin') || normalized.includes('job')) competitors = ['LinkedIn', 'Indeed', 'Glassdoor'];
          else competitors = ['GenericApp A', 'GenericApp B', 'GenericApp C'];
      }
      // trim to top 5
      competitors = competitors.slice(0,5);
    }

    // Evaluate integrations from tags
    if (normalized.includes('payment') || normalized.includes('buy') || normalized.includes('sell') || normalized.includes('checkout') || normalized.includes('stripe') || normalized.includes('billing') || normalized.includes('price')) {
      integrations.push('Stripe Connect Payments');
    }
    if (normalized.includes('chat') || normalized.includes('message') || normalized.includes('messenger') || normalized.includes('realtime') || normalized.includes('websocket') || normalized.includes('live')) {
      integrations.push('Socket.io WebSocket Server');
      integrations.push('Twilio Messaging Gateway');
    }
    if (normalized.includes('map') || normalized.includes('gps') || normalized.includes('tracking') || normalized.includes('near') || normalized.includes('distance') || normalized.includes('route')) {
      integrations.push('Mapbox GL Maps SDK');
      integrations.push('PostGIS Spatial Databases');
    }
    if (normalized.includes('ai') || normalized.includes('agent') || normalized.includes('gemini') || normalized.includes('gpt') || normalized.includes('coach') || normalized.includes('claude')) {
      integrations.push('Gemini Pro Agent API');
    }
    if (normalized.includes('chart') || normalized.includes('dashboard') || normalized.includes('analytics') || normalized.includes('graph') || normalized.includes('report')) {
      integrations.push('Recharts Chart Library');
    }
    if (normalized.includes('file') || normalized.includes('pdf') || normalized.includes('upload') || normalized.includes('image')) {
      integrations.push('AWS S3 Storage buckets');
    }
    
    return {
      domainName,
      roles,
      entities,
      integrations,
      coreEntities,
      revenueModel,
      competitors
    };
  }

  function compileBlueprintFromPrompt(prompt) {
    // Log raw model response (simulated here as we run local analysis)
    if (window.debugLog) window.debugLog('Raw model response (simulated)', prompt);

    // 1. Run Semantic Analyzer
    const semantic = extractSemanticDetails(prompt);

    // Log parsed analysis object
    if (window.debugLog) window.debugLog('Parsed analysis object', semantic);
    
    // Domain requirements helper — returns domain-specific PRD templates
    const domainReqs = (function() {
      function safeDomain() { return (semantic.domainName || '').toLowerCase(); }
      const d = safeDomain();
      // default structure
      const base = {
        problemStatement: `A concise product gap statement for ${semantic.domainName || 'the domain'}.`,
        goals: [],
        features: [],
        functional: [],
        nonFunctional: [],
        metrics: [],
        roadmap: { timeline: '6-8 Weeks', mvp: [], phase2: [], phase3: [] }
      };

      if (d.includes('vacation rental') || d.includes('airbnb')) {
        base.problemStatement = 'Guests find it hard to discover available properties by location and date; hosts need simple listing management and reliable booking flows.';
        base.goals = ['Enable fast property discovery by date & location', 'Provide hosts with easy listing management', 'Secure and reliable booking & payment flows'];
        base.features = ['Search properties by location, date range, and filters', 'Host listing creation with photos, pricing, and availability calendar', 'Booking workflow with availability checks and confirmations', 'Reviews and ratings for guests and hosts', 'Secure payment processing and payouts'];
        base.functional = ['Guests can search properties by location and dates', 'Hosts can create and manage listings with availability calendars', 'Guests can book available properties with an end-to-end checkout flow', 'Users can leave reviews after completed stays', 'Payments are processed securely with receipts and refunds flow'];
        base.nonFunctional = ['Search responses should return results under 300ms for common queries', 'Property images and media served via CDN', 'Payment data handled using PCI-compliant providers and encrypted at rest', 'System supports eventual consistency for large availability updates'];
        base.metrics = ['Booking conversion rate (search -> booking)', 'Average time-to-confirmation for bookings', 'Guest and host NPS / average rating', 'Payment success rate'];
        base.roadmap.mvp = ['Search by location & date', 'Host listing CRUD + availability calendar', 'Basic booking & payment flow', 'Guest reviews'];
        base.roadmap.phase2 = ['Smart pricing suggestions', 'Host analytics dashboard', 'Promotions & featured listings'];
        base.roadmap.phase3 = ['Multi-currency payouts', 'Advanced fraud detection', 'Mobile apps and native push'];
        return base;
      }

      if (d.includes('ride-sharing') || d.includes('ride sharing') || d.includes('uber')) {
        base.problemStatement = 'Riders need quick requests and real-time tracking while drivers require efficient matching and clear payouts.';
        base.goals = ['Fast ride matching', 'Reliable ETA and tracking', 'Transparent fares and driver payouts'];
        base.features = ['Ride request and driver assignment flow', 'Real-time ETA and driver tracking', 'Fare estimation and surge handling', 'Ratings and driver incentives'];
        base.functional = ['Riders can request rides with pickup and dropoff locations', 'Drivers can accept or reject ride requests', 'ETA is calculated and shown to riders in real time', 'Fare estimation is shown before booking', 'Riders and drivers can rate each other after trips'];
        base.nonFunctional = ['Location updates should be real-time (sub-second when active)', 'High availability for dispatch services (99.95% uptime)', 'Secure handling of user PII and driver documents'];
        base.metrics = ['Average rider wait time', 'Driver acceptance rate', 'Trips completed per hour', 'Cancellation rate'];
        base.roadmap.mvp = ['Rider request + driver matching', 'Real-time location tracking', 'Basic fare estimation', 'Ratings'];
        base.roadmap.phase2 = ['Dynamic pricing (surge)', 'Driver incentives & wallet', 'Routing optimizations'];
        base.roadmap.phase3 = ['Shared rides & pooling', 'Advanced safety controls', 'Operator dashboards'];
        return base;
      }

      if (d.includes('professional networking') || d.includes('linkedin')) {
        base.problemStatement = 'Professionals need a place to showcase profiles, discover opportunities, and message peers.';
        base.goals = ['Enable professional profile discovery', 'Support job posting & applications', 'Facilitate messaging between connections'];
        base.features = ['Profile creation with experience and skills', 'Connection requests and network graph', 'Job listings and application flow', 'In-app messaging between connections'];
        base.functional = ['Users can create and edit profiles', 'Users can connect with other professionals', 'Recruiters can post jobs and manage applicants', 'Users can apply for jobs through the platform', 'Messaging between connections with basic threading'];
        base.nonFunctional = ['Profile searches return results under 300ms', 'Rate limits on messaging to prevent spam', 'GDPR-compliant data export for user accounts'];
        base.metrics = ['Connections created per user', 'Jobs posted and application rates', 'Message engagement rates'];
        base.roadmap.mvp = ['Profile pages', 'Connections & basic feed', 'Job posting & applications', 'Messaging'];
        base.roadmap.phase2 = ['Advanced search & recommendations', 'Premium subscriptions', 'Employer analytics'];
        base.roadmap.phase3 = ['Enterprise recruiting suite', 'Career coaching integrations'];
        return base;
      }

      // Task management
      if (d.includes('task management') || d.includes('todo') || d.includes('to-do')) {
        base.problemStatement = 'Teams need simple task tracking, project grouping, and clear assignment workflows.';
        base.goals = ['Organize tasks into projects', 'Assign ownership and due dates', 'Provide lightweight collaboration tools'];
        base.features = ['Task CRUD with due dates and assignees','Project boards and lists','Comments and simple attachments'];
        base.functional = ['Create and assign tasks', 'Move tasks across workflow stages', 'Search and filter tasks by project and assignee'];
        base.nonFunctional = ['Fast board updates (<200ms)', 'Offline support for basic edits', 'Access controls per workspace'];
        base.metrics = ['Tasks completed per week','Active projects count','Average time-to-complete'];
        base.roadmap.mvp = ['Task CRUD','Project boards','Assign & notifications'];
        base.roadmap.phase2 = ['Recurring tasks','Integrations (calendar, slack)'];
        base.roadmap.phase3 = ['Enterprise SSO','Advanced reporting'];
        return base;
      }

      if (d.includes('e-commerce') || d.includes('amazon') || d.includes('shop')) {
        base.problemStatement = 'Buyers and sellers need reliable listings, checkout, and fulfillment tracking.';
        base.goals = ['Provide searchable product listings','Support secure checkout','Enable seller dashboards'];
        base.features = ['Sellers can list products with inventory','Buyers can add to cart and checkout','Order fulfillment tracking'];
        base.functional = ['Sellers can list products with inventory', 'Buyers can add to cart and checkout', 'Order fulfillment tracking'];
        base.nonFunctional = ['Catalog queries under 300ms','Secure payment integration','Scalable media hosting'];
        base.metrics = ['Conversion rate','Average order value','Fulfillment success rate'];
        base.roadmap.mvp = ['Product listings','Cart & checkout','Order management'];
        base.roadmap.phase2 = ['Seller analytics','Promotions & coupons'];
        base.roadmap.phase3 = ['Marketplace fulfillment','Multi-vendor settlement'];
        return base;
      }

      if (d.includes('food delivery') || d.includes('swiggy') || d.includes('restaurant')) {
        base.problemStatement = 'Customers need quick ordering and reliable delivery while restaurants need order management.';
        base.goals = ['Fast menu discovery','Reliable courier assignment','Accurate ETAs'];
        base.features = ['Customers can browse menus and place orders','Restaurants receive and accept orders','Delivery agents are assigned and tracked'];
        base.functional = ['Customers can browse menus and place orders','Restaurants receive and accept orders','Delivery agents are assigned and tracked'];
        base.nonFunctional = ['Low-latency order routing','Real-time tracking for couriers','Scalable peak-hour ordering'];
        base.metrics = ['Orders per hour','Average delivery time','Order success rate'];
        base.roadmap.mvp = ['Menu & ordering','Restaurant dashboard','Courier assignment'];
        base.roadmap.phase2 = ['Batching & routing optimizations','Promotions'];
        base.roadmap.phase3 = ['Dark kitchens integrations','Predictive demand forecasting'];
        return base;
      }

      // default SaaS
      base.problemStatement = `Provide a focused MVP addressing core ${semantic.domainName || 'product'} workflows.`;
      base.goals = ['Deliver core MVP features quickly', 'Ensure secure data handling', 'Design for incremental scaling'];
      base.features = semantic.entities.map(e => `${e.name} management`);
      base.functional = ['Users can perform core CRUD on primary entities', 'Authentication and role-based access control', 'Export/import data for admins'];
      base.nonFunctional = ['API latency targets under 300ms','Encrypted data at rest','Automated backups'];
      base.metrics = ['MAU','Time-to-first-successful-transaction'];
      base.roadmap.mvp = ['Core CRUD','Authentication','Basic dashboard'];
      base.roadmap.phase2 = ['Integrations','Improved UX'];
      base.roadmap.phase3 = ['Scale & performance optimizations'];
      return base;
    })();
    
    // Dynamic Name Synthesizer
    let name = "OutcomeSpec App";
    const titleWords = semantic.domainName.split(' ');
    if (titleWords.length >= 2) {
      name = titleWords[0] + titleWords[1].replace(/&/g, '') + ' AI';
    }
    
    // Clean name formatting
    name = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
    
    // Setup initial data structure
    const data = {
      name,
      label: semantic.domainName,
      prompt,
      businessAnalysis: {
        category: semantic.domainName,
        primaryRoles: semantic.roles,
        coreEntities: semantic.coreEntities,
        revenueModel: semantic.revenueModel,
        competitors: semantic.competitors || []
      },
      executive: {
        description: `This blueprint outlines the development architecture for **${name}**, a platform specifically designed for **${semantic.domainName.toLowerCase()}** in response to the product requirements. The blueprint maps domain entities to micro-endpoints, database configurations, and interactive mock pipelines.`,
        valueProp: `A secure, modular developer blueprint streamlining ${semantic.domainName.toLowerCase()} operations using a decoupled stack and structured process flows.`,
        targetUsers: semantic.roles,
        businessModel: [
          semantic.revenueModel,
          "Tiered subscriptions and service add-ons for growth stage customers",
          "Premium analytics and integration packs for advanced enterprise operations"
        ]
      },
      prd: {
        problemStatement: domainReqs.problemStatement,
        goals: domainReqs.goals,
        features: domainReqs.features.length ? domainReqs.features.map((f,i)=> ({ name: f, description: f })) : semantic.entities.map(e => ({ name: `${e.name} management`, description: `End-to-end management of ${e.name} including creation, validation, and status updates across ${e.tableName}.` })),
        functional: domainReqs.functional,
        nonFunctional: domainReqs.nonFunctional,
        metrics: domainReqs.metrics
      },
      userStories: [],
      database: {
        sql: "",
        nosql: ""
      },
      api: {
        authStrategy: "Stateless JSON Web Tokens (JWT) stored in secure, HttpOnly cookie headers. Includes bcrypt password hashing, token validation middleware, and cors controls.",
        errorHandling: "Unified API wrappers returning error status strings, diagnostic traces, and troubleshooting payload schemas.",
        endpoints: []
      },
      frontend: {
        pages: [],
        components: [],
        navFlow: "",
        folderStructure: ""
      },
      techStack: [],
      roadmap: {
        timeline: "6-8 Weeks",
        mvp: [],
        phase2: [],
        phase3: []
      },
      vibeCoding: {
        setup: "",
        db: "",
        backend: "",
        frontend: "",
        deploy: ""
      },
      diagram: ""
    };

    // 2. Compile SQL Schema
    let sql = `-- PostgreSQL Relational Schema for ${name}
-- Generated by OutcomeSpec AI Engine
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (Base Identity Table)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(50) DEFAULT 'Customer', -- User types: ${semantic.roles.map(r => `'${r}'`).join(', ')}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

    semantic.entities.forEach(e => {
      sql += `\n-- ${e.name} Table\nCREATE TABLE ${e.tableName} (\n    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`;
      
      e.fields.forEach(f => {
        let fieldStr = `,\n    ${f.name} ${f.type}`;
        if (f.refTable) {
          fieldStr += ` REFERENCES ${f.refTable}(id) ON DELETE CASCADE`;
        } else {
          fieldStr += ` NOT NULL`;
        }
        sql += fieldStr;
      });
      
      sql += `,\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n);\n`;
      
      // Indexing on foreign keys or status
      e.fields.forEach(f => {
        if (f.refTable || f.name.includes('status') || f.name.includes('type')) {
          sql += `CREATE INDEX idx_${e.tableName}_${f.name} ON ${e.tableName}(${f.name});\n`;
        }
      });
    });
    
    data.database.sql = sql;

    // 3. Compile NoSQL Schema
    let nosql = `// MongoDB Mongoose Schemas for ${name}
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  userRole: { type: String, enum: [${semantic.roles.map(r => `'${r}'`).join(', ')}], default: 'Customer' }
}, { timestamps: true });
`;

    semantic.entities.forEach(e => {
      nosql += `\n// ${e.name} Mongoose Schema\nconst ${e.name}Schema = new Schema({\n`;
      const fieldLines = e.fields.map(f => {
        let definition = `  ${f.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())}: `;
        if (f.refTable) {
          const modelName = f.refTable === 'users' ? 'User' : f.refTable.charAt(0).toUpperCase() + f.refTable.slice(1, -1);
          definition += `{ type: Schema.Types.ObjectId, ref: '${modelName}', required: true, index: true }`;
        } else if (f.type.includes('JSONB')) {
          definition += `Schema.Types.Mixed`;
        } else if (f.type.includes('INT') || f.type.includes('DECIMAL') || f.type.includes('DOUBLE')) {
          definition += `{ type: Number, required: true }`;
        } else if (f.type.includes('BOOLEAN')) {
          definition += `{ type: Boolean, default: false }`;
        } else {
          definition += `{ type: String, required: true }`;
        }
        return definition;
      });
      
      nosql += fieldLines.join(',\n');
      nosql += `\n}, { timestamps: true });\n`;
      
      // Mongoose indexes
      e.fields.forEach(f => {
        if (f.name.includes('status') || f.name.includes('type')) {
          const jsName = f.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          nosql += `${e.name}Schema.index({ ${jsName}: 1 });\n`;
        }
      });
      
      nosql += `\nconst ${e.name} = mongoose.model('${e.name}', ${e.name}Schema);\n`;
    });
    
    nosql += `\nmodule.exports = {\n  User: mongoose.model('User', UserSchema),\n`;
    nosql += semantic.entities.map(e => `  ${e.name}`).join(',\n');
    nosql += `\n};`;
    
    data.database.nosql = nosql;

    // 4. Compile API Endpoints
    data.api.endpoints.push({
      method: "POST",
      path: "/api/auth/register",
      desc: `Register a new profile and assign client roles`,
      request: { email: "dev@outcomespec.io", password: "SecurePass123!", fullName: "Taylor Green", role: semantic.roles[0] },
      response: { success: true, message: "User profile successfully instantiated", user: { id: "u_uuid_99812", email: "dev@outcomespec.io", role: semantic.roles[0] } }
    });

    semantic.entities.forEach(e => {
      // POST route
      const mockReq = {};
      e.fields.forEach(f => {
        if (f.name !== 'owner_id' && f.name !== 'creator_id' && !f.refTable) {
          mockReq[f.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())] = f.type.includes('INT') || f.type.includes('DECIMAL') ? 100 : (f.type.includes('BOOLEAN') ? true : "Sample value");
        }
      });
      
      data.api.endpoints.push({
        method: "POST",
        path: `/api/${e.tableName}`,
        desc: `Create a new ${e.name} resource (Authenticated)`,
        request: mockReq,
        response: { success: true, message: `${e.name} resource created`, resourceId: `uuid_${e.tableName.slice(0, -1)}_772` }
      });
      data.api.endpoints.push({
        method: "GET",
        path: `/api/${e.tableName}`,
        desc: `Query and filter ${e.name} database lists`,
        request: { limit: 15, status: "Active" },
        response: { success: true, results: [{ id: `uuid_${e.tableName.slice(0, -1)}_772`, ...mockReq }] }
      });
    });

    // 5. User stories are generated via domain-specific templates (see generateUserStories)

    // 6. Compile Frontend Architecture
    data.frontend.pages.push("/ - Landing portal explaining solutions features");
    data.frontend.pages.push("/auth/login - Credentials gateway and security entry");
    semantic.entities.forEach(e => {
      data.frontend.pages.push(`/${e.tableName} - Catalog query screen for ${e.name} data lists`);
      data.frontend.pages.push(`/${e.tableName}/[id] - Detail viewport showing individual ${e.name} attributes`);
    });
    
    data.frontend.components.push("AppShell.tsx - Header, sidebar, status dashboard layouts wrapper");
    semantic.entities.forEach(e => {
      data.frontend.components.push(`${e.name}Grid.tsx - Responsive card layout with filter bindings`);
      data.frontend.components.push(`New${e.name}Form.tsx - Modal validations layout compiling new entity inputs`);
    });
    
    data.frontend.navFlow = `User lands -> Logins -> Assigned role "${semantic.roles[0]}" -> Accesses dashboard -> Clicks catalog "${semantic.entities[0].tableName}" -> Queries listing items -> Clicks individual resource -> Enters workflow action -> System updates database.`;
    
    let folderTree = `src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── auth/
│   │   └── login/
│   │       └── page.tsx\n`;
    semantic.entities.forEach(e => {
      folderTree += `│   ├── ${e.tableName}/\n│   │   ├── page.tsx\n│   │   └── [id]/\n│   │       └── page.tsx\n`;
    });
    folderTree += `├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── dialog.tsx\n`;
    semantic.entities.forEach(e => {
      folderTree += `│   ├── ${e.name}Grid.tsx\n│   ├── New${e.name}Form.tsx\n`;
    });
    folderTree += `└── lib/
    ├── api.ts
    └── utils.ts`;
    
    data.frontend.folderStructure = folderTree;

    // 7. Compile Tech Stack Recommendation
    data.techStack.push({ layer: "Frontend Layer", tech: "Next.js 14 (App Router)", reason: "Enables Server-Side Rendering (SSR) for fast loading performance, coupled with file-system routing." });
    data.techStack.push({ layer: "Styling Framework", tech: "Tailwind CSS", reason: "Speeds up UI layout composition using pre-configured design tokens, avoiding custom stylesheet bloat." });
    data.techStack.push({ layer: "Backend Server", tech: "Node.js Express", reason: "Standard modular development ecosystem offering fast processing speeds and high concurrency for REST routes." });
    
    const dbName = semantic.integrations.includes('PostGIS Spatial Databases') ? "PostgreSQL with PostGIS" : "PostgreSQL";
    data.techStack.push({ layer: "Primary Database", tech: dbName, reason: `Safeguards relational schemas using foreign key integrity and ACID guarantees, with optimized indices on keys.` });
    
    data.techStack.push({ layer: "In-Memory Caching", tech: "Redis", reason: "Caches database query events, session state, and rate-limiting metrics." });

    semantic.integrations.forEach(integration => {
      if (integration.includes('Stripe')) {
        data.techStack.push({ layer: "Payment Integrations", tech: "Stripe Connect API", reason: "Processes secure customer payments, handles checkout escrows, and routes payouts." });
      }
      if (integration.includes('Socket.io')) {
        data.techStack.push({ layer: "Realtime Messaging", tech: "Socket.io WebSockets", reason: "Synchronizes chat strings and vehicle location coordinates instantly between connected nodes." });
      }
      if (integration.includes('Gemini')) {
        data.techStack.push({ layer: "AI Intelligence", tech: "Gemini Pro API", reason: "Parses user goals, classifies input strings, and automates text generation workflows." });
      }
    });

    // 8. Compile Roadmap
    data.roadmap.mvp = [
      "Initialize multi-tenant database models mapping user roles",
      `Build Express routes to create, read, and delete ${semantic.entities[0].tableName}`,
      "Connect authentication security middleware checking session tokens",
      `Develop frontend pages listing searchable ${semantic.entities[0].tableName} cards`
    ];
    data.roadmap.phase2 = [
      `Add support for secondary entity workflows (e.g. ${semantic.entities[1] ? semantic.entities[1].tableName : 'related resources'})`,
      "Integrate domain-appropriate validation and payment flows",
      "Deploy background workers for async tasks, retries, and notifications"
    ];
    data.roadmap.phase3 = [
      "Configure automated email schedulers reporting usage statistics",
      "Add analytical dashboards rendering progress graphs"
    ];

    // 9. Compile Vibe Prompts
    data.vibeCoding.setup = `You are a Lead Software Architect. We are bootstrapping the development files for "${name}", a platform for ${semantic.domainName.toLowerCase()}.
Please write the complete repository scaffolding script for our Next.js App Router frontend and Node.js Express backend. Include TS configs, package.json files containing core libraries, and a Tailwind config using deep space dark theme values (deep charcoal backgrounds, electric blue accent highlights, thin borders).`;

    data.vibeCoding.db = `You are a Senior SQL Developer. We need to initialize the PostgreSQL database schema for "${name}".
Please write the SQL script constructing the following tables:
- users (role matching user types: ${semantic.roles.join(', ')})
${semantic.entities.map(e => `- ${e.tableName} (with keys mapping foreign relations)`).join('\n')}
Include proper indexes, constraint validations, and cascade deletion rules.`;

    data.vibeCoding.backend = `You are a Backend Software Architect. We are writing the API services for "${name}".
Please write the Node.js Express script initializing the server, database connection middleware, JWT token verification filters, and the API routes for:
${semantic.entities.map(e => `1. POST /api/${e.tableName} (creating resources)\n2. GET /api/${e.tableName} (querying lists with filter flags)`).join('\n')}
Include structural mock JSON error schemas.`;

    data.vibeCoding.frontend = `You are a Creative Frontend Engineer. We need to build the resource overview page for our Next.js application "${name}".
Please write the React components for:
1. ${semantic.entities[0].name}Card (displaying title, description, status indicator, and dynamic fields using glassmorphic styling)
2. ${semantic.entities[0].name}Grid (binding a search form filter to the cards list)
Ensure styling looks stunning, fits our dark-mode design system, and has smooth micro-interactions.`;

    data.vibeCoding.deploy = `You are a DevOps Engineer. We need to containerize the services for "${name}".
Please write a multi-stage Dockerfile for our Next.js frontend, an Express API Dockerfile, and a docker-compose.yml compiling the services alongside PostgreSQL and Redis nodes. Include template environment configuration parameters.`;

    // 10. Compile ASCII Diagram
    let integrationsBox = "";
    if (semantic.integrations.length > 0) {
      integrationsBox = `
                                                                 │
                                                                 ▼
                                                         ┌───────────────┐
                                                         │ External APIs │
                                                         │ ${semantic.integrations.slice(0,2).map(i => i.split(' ')[0]).join(' / ')} │
                                                         └───────────────┘`;
    }

    data.diagram = `
  [ USER CLIENT ] ◄════════════ REST API Requests (HTTPS) ════════════┐
          │                                                           │
          ▼ (Static Assets Request)                                   ▼
   ┌─────────────┐                                             ┌─────────────┐
   │ Vercel CDN  │                                             │ Express API │
   │ Frontend SSR│                                             │ Server Node │
   └──────┬──────┘                                             └──────┬──────┘
          │                                                           │
          ▼                                                           ▼
 ┌────────────────┐ ◄══════ Query ${semantic.entities[0].tableName} ══════════════ ┌─────────────┐
 │ Next.js Client │                                            │ PostgreSQL  │
 │ (Tailwind UI)  │                                            │ Database DB │
 └────────────────┘                                            └──────┬──────┘
                                                                      │
                                                                      ▼
                                                               ┌─────────────┐
                                                               │ Redis Cache │
                                                               │ Key-Value DB│
                                                               └──────┬──────┘${integrationsBox}
    `;

    // If domain-specific generators exist, override generic templates
    const prd = generatePRD(semantic);
    if (prd) {
      // map fields from domain PRD into data.prd
      data.prd.problemStatement = prd.problemStatement || data.prd.problemStatement;
      data.prd.goals = prd.goals || data.prd.goals;
      // Normalize features: accept array of strings or array of {name,description}
      if (Array.isArray(prd.features)) {
        data.prd.features = prd.features.map(f => {
          if (!f) return { name: 'Not Available', description: '' };
          if (typeof f === 'string') return { name: f, description: '' };
          return { name: f.name || f.title || 'Feature', description: f.description || f.desc || '' };
        });
      } else {
        data.prd.features = data.prd.features;
      }
      data.prd.nonFunctional = prd.nonFunctional || data.prd.nonFunctional;
      data.prd.metrics = prd.successMetrics || data.prd.metrics || prd.metrics;
    }

    const stories = generateUserStories(semantic);
    if (Array.isArray(stories) && stories.length) {
      // Normalize stories to shape: { as, want, so }
      data.userStories = stories.map(s => {
        if (!s) return { as: 'User', want: 'do something', so: '' };
        const as = s.as || s.role || s.actor || s.responsible || 'User';
        const want = s.want || s.story || s.wantTo || s.action || 'accomplish a task';
        let so = s.so || s.reason || s.acceptance || '';
        if (Array.isArray(so)) so = so.join('; ');
        return { as, want, so };
      });
    }

    const roadmapGen = generateRoadmap(semantic);
    if (roadmapGen) {
      data.roadmap.mvp = roadmapGen.mvp || data.roadmap.mvp;
      data.roadmap.phase2 = roadmapGen.phase2 || data.roadmap.phase2;
      data.roadmap.phase3 = roadmapGen.phase3 || data.roadmap.phase3;
    }

    const db = generateDatabaseSchemas(semantic);
    if (db) {
      data.database.sql = db.sql;
      data.database.nosql = db.nosql;
    }

    const api = generateApiDesign(semantic);
    if (api) {
      data.api.endpoints = api.endpoints;
      data.api.authStrategy = api.authStrategy;
      data.api.errorHandling = api.errorHandling;
    }

    // Log compiled blueprint object for debugging
    if (window.debugLog) window.debugLog('Parsed blueprint object', data);

    // Expose for debugging in browser context
    try { window._lastGeneratedData = data; } catch (e) { /* ignore if not accessible */ }

    return data;
  }

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
    
    // Trigger click on first sidebar item to sync view
    const firstTabBtn = document.querySelector('.sidebar-nav-btn[data-target="sec-executive"]');
    firstTabBtn.click();
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
            ${(data.businessModel||[]).map(model => `<li>${escapeHTML(String(model))}</li>`).join('')}
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

  function renderDatabaseSection() {
    const container = document.querySelector('#sec-database .section-content-render');
    const db = generatedData.database;
    
    if (activeDbTab === 'relational') {
      container.innerHTML = `
        <p style="color: var(--text-secondary); margin-bottom: 1.25rem;">We recommend <strong>PostgreSQL</strong> as the primary relational database. This schema defines structural tables, composite primary keys, foreign key constraints, and performance indexes:</p>
        <div class="code-display-box">
          <button class="btn-copy-section code-copy-overlay" onclick="copyCodeContent('db-sql-code')">Copy SQL</button>
          <pre id="db-sql-code"><code>${escapeHTML(db.sql)}</code></pre>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="code-display-box">
          <button class="btn-copy-section code-copy-overlay" onclick="copyCodeContent('db-nosql-code')">Copy Schema</button>
          <pre id="db-nosql-code"><code>${escapeHTML(db.nosql || '')}</code></pre>
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
          <p>${api.authStrategy}</p>
        </div>
        <div class="info-card">
          <h4>Error Response Standard</h4>
          <p>${api.errorHandling}</p>
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
        <p>${escapeHTML(String(fe.navFlow || ''))}</p>
      </div>

      <h4 class="quick-fill-label">Standard Folder Structure (Next.js App Router)</h4>
      <div class="code-display-box">
        <button class="btn-copy-section code-copy-overlay" onclick="copyCodeContent('fe-folder-code')">Copy Folder Tree</button>
        <pre id="fe-folder-code"><code>${escapeHTML(String(fe.folderStructure || ''))}</code></pre>
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
    const prompt = generatedData.vibeCoding[activeVibePrompt];
    container.innerHTML = `
      <p style="color: var(--text-secondary); margin-bottom: 1rem;">Select a stage below, copy the pre-tuned prompt, and paste it directly into Cursor, Gemini, Claude, or Copilot Chat to initialize your project code:</p>
      <div class="prompt-copy-container">
        <div class="prompt-box" id="vibe-active-prompt">${escapeHTML(prompt)}</div>
        <div style="display: flex; justify-content: flex-end;">
          <button class="btn-outline-primary" style="padding: 0.75rem 1.75rem; font-size: 0.95rem;" onclick="copyCodeContent('vibe-active-prompt')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy Prompt</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderDiagramSection() {
    const container = document.querySelector('#sec-diagram .section-content-render');
    const diag = generatedData.diagram;
    container.innerHTML = `
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Below is the text-based systems architecture and flow diagram representing the request routing topology:</p>
      <div class="ascii-architecture-art">${diag}</div>
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
        md += `* **Value Proposition**: ${generatedData.executive.valueProp}\n\n`;
        md += `### Description\n${generatedData.executive.description}\n\n`;
        md += `### Target Users / System Roles\n`;
        (generatedData.executive.targetUsers||[]).forEach(u => md += `* ${u}\n`);
        md += `\n### Business Model Suggestions\n`;
        (generatedData.executive.businessModel||[]).forEach(b => md += `* ${b}\n`);
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
        md += `* **Authentication**: ${generatedData.api.authStrategy}\n`;
        md += `* **Error Handling**: ${generatedData.api.errorHandling}\n\n`;
        md += `### Endpoints\n\n`;
        (generatedData.api.endpoints||[]).forEach(ep => {
          md += `#### ${ep.method || 'GET'} ${ep.path || '/'}\n`;
          md += `*Description*: ${ep.desc || ''}\n\n`;
          md += `**Request Body**:\n\`\`\`json\n${JSON.stringify(ep.request || {}, null, 2)}\n\`\`\`\n\n`;
          md += `**Response (200 OK / 201 Created)**:\n\`\`\`json\n${JSON.stringify(ep.response || {}, null, 2)}\n\`\`\`\n\n`;
        });
        break;
        
      case 'sec-frontend':
        md += `## 6. Frontend Architecture\n\n`;
        md += `### Key Pages\n`;
        (generatedData.frontend.pages||[]).forEach(p => md += `* ${p}\n`);
        md += `\n### Core Components\n`;
        (generatedData.frontend.components||[]).forEach(c => md += `* ${c}\n`);
        md += `\n### Navigation Flow\n${generatedData.frontend.navFlow}\n\n`;
        md += `### Recommended Folder Structure\n\`\`\`\n${generatedData.frontend.folderStructure}\n\`\`\`\n`;
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
        md += `### Project Setup\n\`\`\`text\n${generatedData.vibeCoding.setup}\n\`\`\`\n\n`;
        md += `### Database Setup\n\`\`\`text\n${generatedData.vibeCoding.db}\n\`\`\`\n\n`;
        md += `### Backend setup\n\`\`\`text\n${generatedData.vibeCoding.backend}\n\`\`\`\n\n`;
        md += `### Frontend Setup\n\`\`\`text\n${generatedData.vibeCoding.frontend}\n\`\`\`\n\n`;
        md += `### Deployment Setup\n\`\`\`text\n${generatedData.vibeCoding.deploy}\n\`\`\`\n`;
        break;
        
      case 'sec-diagram':
        md += `## 10. Architecture Diagram\n\n\`\`\`text\n${generatedData.diagram}\n\`\`\`\n`;
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
