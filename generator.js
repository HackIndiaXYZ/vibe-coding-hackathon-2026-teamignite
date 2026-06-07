// OutcomeSpec AI - Core Application Logic & Semantic Compiler Engine

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

    // Switch view to loading
    inputView.classList.remove('active');
    loadingView.classList.add('active');
    
    // Begin step simulation
    startSimulation(rawPrompt);
  });

  // Reset Button Handler
  newSpecBtn.addEventListener('click', () => {
    blueprintView.classList.remove('active');
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
      { id: 'step-0', title: 'Analyzing product idea and key requirements...', duration: 1000 },
      { id: 'step-1', title: 'Designing product requirements document...', duration: 1200 },
      { id: 'step-2', title: 'Creating SQL & NoSQL database schemas...', duration: 1200 },
      { id: 'step-3', title: 'Designing RESTful API specifications...', duration: 1200 },
      { id: 'step-4', title: 'Building frontend & backend architecture plans...', duration: 1200 },
      { id: 'step-5', title: 'Preparing final development roadmap & vibe prompts...', duration: 1000 }
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
        // Simulation finished, build data and present
        progressbarFill.style.width = '100%';
        setTimeout(() => {
          generatedData = compileBlueprintFromPrompt(prompt);
          populateBlueprintView();
          
          loadingView.classList.remove('active');
          blueprintView.classList.add('active');
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

  // =========================================
  // SEMANTIC EXTRACTION ENGINE (NLP SIMULATION)
  // =========================================
  function extractSemanticDetails(prompt) {
    const normalized = prompt.toLowerCase();
    
    let domainName = "Custom Software Architecture";
    let roles = ["User", "Administrator"];
    let entities = [];
    let integrations = [];
    
    // Core Domain Maps
    if (normalized.includes('sitter') || normalized.includes('pet') || normalized.includes('dog') || normalized.includes('cat') || normalized.includes('animal') || normalized.includes('vet')) {
      domainName = "Pet Care & Service Booking Hub";
      roles = ["Pet Owner", "Pet Sitter", "Clinic Veterinarian", "System Administrator"];
      entities = [
        {
          name: "Pet",
          tableName: "pets",
          fields: [
            { name: "owner_id", type: "UUID", refTable: "users", description: "Reference to user owner who owns the pet" },
            { name: "name", type: "VARCHAR(100)", description: "Name of the pet" },
            { name: "species", type: "VARCHAR(50)", description: "Species (dog, cat, bird, etc.)" },
            { name: "breed", type: "VARCHAR(100)", description: "Specific breed details" },
            { name: "age", type: "INT", description: "Age of pet in years" },
            { name: "medical_records", type: "JSONB", description: "Allergies, vaccination stamps, and surgeries history" }
          ]
        },
        {
          name: "SitterProfile",
          tableName: "sitter_profiles",
          fields: [
            { name: "sitter_id", type: "UUID", refTable: "users", description: "Link to user profile registered as a sitter" },
            { name: "hourly_rate", type: "DECIMAL(10,2)", description: "Standard fee rate charged hourly" },
            { name: "rating_avg", type: "DECIMAL(3,2)", description: "Aggregated review score from owners" },
            { name: "bio", type: "TEXT", description: "Introductory overview details" }
          ]
        },
        {
          name: "Booking",
          tableName: "bookings",
          fields: [
            { name: "pet_id", type: "UUID", refTable: "pets", description: "Reference to the pet being cared for" },
            { name: "sitter_id", type: "UUID", refTable: "users", description: "Reference to the hired sitter" },
            { name: "start_time", type: "TIMESTAMP", description: "Time the sitting begins" },
            { name: "end_time", type: "TIMESTAMP", description: "Time the sitting ends" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Requested', 'Approved', 'Active', 'Completed', 'Cancelled'" }
          ]
        },
        {
          name: "Review",
          tableName: "reviews",
          fields: [
            { name: "booking_id", type: "UUID", refTable: "bookings", description: "Reference to the corresponding booking" },
            { name: "reviewer_id", type: "UUID", refTable: "users", description: "Owner submitting feedback rating" },
            { name: "score", type: "INT", description: "Numerical score (1 to 5)" },
            { name: "commentary", type: "TEXT", description: "Text feedback summary details" }
          ]
        }
      ];
    } else if (normalized.includes('car') || normalized.includes('vehicle') || normalized.includes('rental') || normalized.includes('fleet') || normalized.includes('drive') || normalized.includes('ride')) {
      domainName = "On-Demand Vehicle Rental & Telemetry Fleet Platform";
      roles = ["Renter Client", "Fleet Owner Manager", "Mechanic Auditor", "System Operator"];
      entities = [
        {
          name: "Vehicle",
          tableName: "vehicles",
          fields: [
            { name: "make", type: "VARCHAR(100)", description: "Manufacturer (e.g. Tesla, Ford)" },
            { name: "model", type: "VARCHAR(100)", description: "Model variant name" },
            { name: "license_plate", type: "VARCHAR(30)", description: "Registration plate identifier" },
            { name: "daily_fee", type: "DECIMAL(10,2)", description: "Standard lease cost per calendar day" },
            { name: "gps_lat", type: "DOUBLE PRECISION", description: "Last logged latitude geo coordinates" },
            { name: "gps_lon", type: "DOUBLE PRECISION", description: "Last logged longitude geo coordinates" },
            { name: "battery_status_percent", type: "INT", description: "Current fuel or battery percentage" }
          ]
        },
        {
          name: "RentalBooking",
          tableName: "rental_bookings",
          fields: [
            { name: "vehicle_id", type: "UUID", refTable: "vehicles", description: "Reference to the booked vehicle" },
            { name: "renter_id", type: "UUID", refTable: "users", description: "Reference to renter user ID" },
            { name: "checkout_time", type: "TIMESTAMP", description: "Renter keys release log time" },
            { name: "checkin_time", type: "TIMESTAMP", description: "Renter keys return log time" },
            { name: "total_fare", type: "DECIMAL(10,2)", description: "Fulfillment checkout invoice amount" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Reserved', 'Active', 'Returned', 'Disputed'" }
          ]
        },
        {
          name: "DamageReport",
          tableName: "damage_reports",
          fields: [
            { name: "booking_id", type: "UUID", refTable: "rental_bookings", description: "Reference to the booking transaction" },
            { name: "reporter_id", type: "UUID", refTable: "users", description: "Reference to reporting user (renter/owner)" },
            { name: "notes", type: "TEXT", description: "Explanation details of damage" },
            { name: "photo_url", type: "TEXT", description: "Hosting path to snapshot evidence" }
          ]
        }
      ];
    } else if (normalized.includes('nft') || normalized.includes('bid') || normalized.includes('artwork') || normalized.includes('auction') || normalized.includes('crypto')) {
      domainName = "Digital Art NFT Bidding Marketplace";
      roles = ["Digital Artist", "Collector Buyer", "Market Curator"];
      entities = [
        {
          name: "Artwork",
          tableName: "artworks",
          fields: [
            { name: "artist_id", type: "UUID", refTable: "users", description: "Reference to the artist user profile" },
            { name: "title", type: "VARCHAR(255)", description: "Heading of digital artwork" },
            { name: "token_hash", type: "VARCHAR(66)", description: "Decentralized blockchain registry hash" },
            { name: "image_cdn_url", type: "TEXT", description: "High resolution hosting path link" },
            { name: "reserve_fee", type: "DECIMAL(18,4)", description: "Bidding start floor value in crypto/USD" }
          ]
        },
        {
          name: "Auction",
          tableName: "auctions",
          fields: [
            { name: "artwork_id", type: "UUID", refTable: "artworks", description: "Reference to listed digital asset" },
            { name: "bidding_start", type: "TIMESTAMP", description: "Time bidding room opens" },
            { name: "bidding_end", type: "TIMESTAMP", description: "Time bidding room locks" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Upcoming', 'Live', 'Settled', 'Closed'" }
          ]
        },
        {
          name: "Bid",
          tableName: "bids",
          fields: [
            { name: "auction_id", type: "UUID", refTable: "auctions", description: "Reference to active auction room" },
            { name: "bidder_id", type: "UUID", refTable: "users", description: "Reference to bidding collector profile" },
            { name: "bid_amount", type: "DECIMAL(18,4)", description: "Staked bidding token volume" },
            { name: "placed_time", type: "TIMESTAMP", description: "Time transaction log was indexed" }
          ]
        }
      ];
    } else if (normalized.includes('prescription') || normalized.includes('doctor') || normalized.includes('patient') || normalized.includes('clinic') || normalized.includes('appointment') || normalized.includes('medical')) {
      domainName = "Clinical Appointment & Digital Prescription System";
      roles = ["Practitioner Doctor", "Medical Patient", "Reception Desk Admin", "Pharmacy Pharmacist"];
      entities = [
        {
          name: "Clinic",
          tableName: "clinics",
          fields: [
            { name: "name", type: "VARCHAR(255)", description: "Clinic facility branch name" },
            { name: "address", type: "TEXT", description: "Clinic physical coordinates" },
            { name: "contact_number", type: "VARCHAR(20)", description: "Direct telephone switchboard number" }
          ]
        },
        {
          name: "Appointment",
          tableName: "appointments",
          fields: [
            { name: "patient_id", type: "UUID", refTable: "users", description: "Patient user reference" },
            { name: "doctor_id", type: "UUID", refTable: "users", description: "Practitioner user reference" },
            { name: "clinic_id", type: "UUID", refTable: "clinics", description: "Clinic facility unit" },
            { name: "booking_time", type: "TIMESTAMP", description: "Date and hour scheduled" },
            { name: "symptoms_summary", type: "TEXT", description: "Pre-appointment medical complaints notes" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Booked', 'Completed', 'Absent', 'Cancelled'" }
          ]
        },
        {
          name: "Prescription",
          tableName: "prescriptions",
          fields: [
            { name: "appointment_id", type: "UUID", refTable: "appointments", description: "Reference to the clinical diagnosis session" },
            { name: "doctor_id", type: "UUID", refTable: "users", description: "Issuing clinician" },
            { name: "patient_id", type: "UUID", refTable: "users", description: "Target recipient patient" },
            { name: "drug_name", type: "VARCHAR(255)", description: "Pharmaceutical drug designation" },
            { name: "dosage_instructions", type: "TEXT", description: "Volume limits, schedules, and pharmacist cautions" },
            { name: "is_dispensed", type: "BOOLEAN", description: "Pharmacy fulfillment checkout indicator" }
          ]
        }
      ];
    } else {
      // DYNAMIC NLP GENERATOR FALLBACK
      // Split nouns
      const keywords = prompt
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['build', 'create', 'make', 'develop', 'want', 'with', 'using', 'that', 'should', 'need', 'platform', 'system', 'website', 'software', 'service', 'online', 'feature', 'page', 'user', 'profile'].includes(w.toLowerCase()));
      
      const distinctNouns = Array.from(new Set(keywords)).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      
      const rootNoun = distinctNouns[0] || "Item";
      const secondaryNoun = distinctNouns[1] || "Process";
      const tertiaryNoun = distinctNouns[2] || "Log";
      
      domainName = `${rootNoun} Management & tracking Engine`;
      roles = [`${rootNoun} Creator`, `${rootNoun} Client`, "Central Coordinator"];
      
      entities = [
        {
          name: rootNoun,
          tableName: rootNoun.toLowerCase() + "s",
          fields: [
            { name: "creator_id", type: "UUID", refTable: "users", description: "Owner user account ID reference" },
            { name: "title", type: "VARCHAR(255)", description: `Title or name descriptor of the ${rootNoun}` },
            { name: "description", type: "TEXT", description: `Full details content regarding the ${rootNoun}` },
            { name: "status", type: "VARCHAR(50)", description: "Operational status tag tracking" }
          ]
        },
        {
          name: secondaryNoun,
          tableName: secondaryNoun.toLowerCase() + "s",
          fields: [
            { name: `${rootNoun.toLowerCase()}_id`, type: "UUID", refTable: rootNoun.toLowerCase() + "s", description: `Reference to the parent ${rootNoun}` },
            { name: "operator_id", type: "UUID", refTable: "users", description: "Assigned operator user ID reference" },
            { name: "notes", type: "TEXT", description: `Logs and details of the ${secondaryNoun}` },
            { name: "total_amount", type: "DECIMAL(10,2)", description: "Transaction cost value if applicable" }
          ]
        },
        {
          name: tertiaryNoun,
          tableName: tertiaryNoun.toLowerCase() + "s",
          fields: [
            { name: `${secondaryNoun.toLowerCase()}_id`, type: "UUID", refTable: secondaryNoun.toLowerCase() + "s", description: `Reference to parent ${secondaryNoun}` },
            { name: "rating_score", type: "INT", description: "Numerical feedback value" },
            { name: "commentary", type: "TEXT", description: "Detailed feedback description text" }
          ]
        }
      ];
    }
    
    // Scan integrations from tags
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
      integrations
    };
  }

  // =========================================
  // BLUEPRINT COMPILER
  // =========================================
  function compileBlueprintFromPrompt(prompt) {
    // 1. Run Semantic Analyzer
    const semantic = extractSemanticDetails(prompt);
    
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
      executive: {
        description: `This blueprint outlines the development architecture for **${name}**, a platform specifically designed for **${semantic.domainName.toLowerCase()}** in response to the product requirements. The blueprint maps domain entities to micro-endpoints, database configurations, and interactive mock pipelines.`,
        valueProp: `A secure, modular developer blueprint streamlining ${semantic.domainName.toLowerCase()} operations using a decoupled stack and structured records workflows.`,
        targetUsers: semantic.roles,
        businessModel: [
          "Transaction fee share model (take rate: 3% to 5%)",
          "Tiered SaaS platform subscriptions starting at $29/mo",
          "Advanced analytics dashboards offered as client add-ons"
        ]
      },
      prd: {
        problemStatement: `Current solutions in ${semantic.domainName.toLowerCase()} fail to provide structured workflows, resulting in fragmented transaction tracking, high operational latency, and communication overhead.`,
        goals: [
          `Provide an intuitive central directory for managing core ${semantic.entities[0].tableName} assets`,
          "Minimize task execution times through real-time telemetry updates and integration layers",
          "Establish high security checks safeguarding sensitive client and transaction data records"
        ],
        features: semantic.entities.map(e => ({
          name: `${e.name} Lifecycle Operations`,
          description: `Comprehensive interface to create, list, inspect status modifications, and execute queries on ${e.tableName} logs.`
        })),
        functional: [
          "Users must register and complete role mapping audits.",
          `System must support searching and filtering ${semantic.entities[0].tableName} listings using parameter fields.`,
          `Status changes on ${semantic.entities[1] ? semantic.entities[1].tableName : 'bookings'} trigger webhook notification callbacks.`,
          "Double entry balance audits are conducted on transaction records before ledger settlements."
        ],
        nonFunctional: [
          "Web application views must load charts and tables in under 300ms.",
          "Credentials and user data fields must be encrypted at rest using AES-256 protocols.",
          "Operational API servers must recover states from database backups under 2 minutes."
        ],
        metrics: [
          `Fulfillment success index of ${semantic.entities[1] ? semantic.entities[1].tableName : 'bookings'}`,
          "Monthly Active Users (MAU) transaction volume growth rates",
          "API route latency times under heavy transaction loads"
        ]
      },
      userStories: [],
      database: {
        sql: "",
        nosql: ""
      },
      api: {
        authStrategy: "Stateless JSON Web Tokens (JWT) stored in secure, HttpOnly cookie headers. Includes bcrypt password hashing, token validation middleware, and cors controls.",
        errorHandling: "Unified API wrappers returning error status strings, diagnostic logs, and troubleshooting payload schemas.",
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
        desc: `Instantiate a new ${e.name} record (Authenticated)`,
        request: mockReq,
        response: { success: true, message: `${e.name} record registered`, recordId: `uuid_${e.tableName.slice(0, -1)}_772` }
      });
      
      // GET route
      data.api.endpoints.push({
        method: "GET",
        path: `/api/${e.tableName}`,
        desc: `Query and filter ${e.name} database lists`,
        request: { limit: 15, status: "Active" },
        response: { success: true, results: [{ id: `uuid_${e.tableName.slice(0, -1)}_772`, ...mockReq }] }
      });
    });

    // 5. Compile User Stories
    const defaultVerbList = ["search and review listing elements of", "schedule and instantiate booking requests for", "log audit data updates on", "view dashboard reports of"];
    semantic.roles.forEach((role, rIdx) => {
      semantic.entities.forEach((entity, eIdx) => {
        const verb = defaultVerbList[(rIdx + eIdx) % defaultVerbList.length];
        data.userStories.push({
          as: role,
          want: `${verb} ${entity.tableName}`,
          so: `I can manage operational tasks, ensure data consistency, and review compliance logs without manual intervention`
        });
      });
    });

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
      data.frontend.components.push(`New${e.name}Form.tsx - Modal validations layout compiling new records inputs`);
    });
    
    data.frontend.navFlow = `User lands -> Logins -> Assigned role "${semantic.roles[0]}" -> Accesses dashboard -> Clicks catalog "${semantic.entities[0].tableName}" -> Queries listing items -> Clicks individual record -> Enters workflow action -> System updates database.`;
    
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
    
    data.techStack.push({ layer: "In-Memory Caching", tech: "Redis", reason: "Caches database query logs, session data records, and rate-limiting metrics." });

    semantic.integrations.forEach(integration => {
      if (integration.includes('Stripe')) {
        data.techStack.push({ layer: "Payment Integrations", tech: "Stripe Connect API", reason: "Processes secure customer payments, handles checkout escrows, and routes developer payouts." });
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
      `Deploy tracking lists for secondary entities: ${semantic.entities[1] ? semantic.entities[1].tableName : 'bookings'}`,
      "Integrate validation checks on checkout actions",
      "Deploy background worker tasks managing automated system alerts"
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
${semantic.entities.map(e => `1. POST /api/${e.tableName} (creating records)\n2. GET /api/${e.tableName} (querying lists with filter flags)`).join('\n')}
Include structural mock JSON error schemas.`;

    data.vibeCoding.frontend = `You are a Creative Frontend Engineer. We need to build the records overview page for our Next.js application "${name}".
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

    return data;
  }

  // =========================================
  // VIEW RENDERING / DOM POPULATION
  // =========================================
  function populateBlueprintView() {
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
    const data = generatedData.executive;
    container.innerHTML = `
      <div class="info-grid">
        <div class="info-card">
          <h4>Product Name</h4>
          <p><strong>${generatedData.name}</strong></p>
        </div>
        <div class="info-card">
          <h4>Primary Value Proposition</h4>
          <p>${data.valueProp}</p>
        </div>
      </div>
      
      <div class="info-card" style="margin-bottom: 1.5rem; width: 100%;">
        <h4>Product Description</h4>
        <p>${data.description}</p>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <h4>Target Users / System Roles</h4>
          <ul>
            ${data.targetUsers.map(user => `<li>${user}</li>`).join('')}
          </ul>
        </div>
        <div class="info-card">
          <h4>Business Model Hypotheses</h4>
          <ul>
            ${data.businessModel.map(model => `<li>${model}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  function renderPrdSection() {
    const container = document.querySelector('#sec-prd .section-content-render');
    const data = generatedData.prd;
    container.innerHTML = `
      <div class="info-card" style="margin-bottom: 1.5rem; width: 100%;">
        <h4>Problem Statement</h4>
        <p>${data.problemStatement}</p>
      </div>
      
      <div class="info-grid">
        <div class="info-card">
          <h4>Strategic Goals</h4>
          <ul>
            ${data.goals.map(goal => `<li>${goal}</li>`).join('')}
          </ul>
        </div>
        <div class="info-card">
          <h4>Success Metrics (KPIs)</h4>
          <ul>
            ${data.metrics.map(kpi => `<li>${kpi}</li>`).join('')}
          </ul>
        </div>
      </div>

      <h4 class="quick-fill-label" style="margin-top: 2rem;">Core Features Checklist</h4>
      <ul class="specs-list">
        ${data.features.map(feat => `
          <li class="specs-list-item">
            <div class="specs-list-title">${feat.name}</div>
            <div class="specs-list-desc">${feat.description}</div>
          </li>
        `).join('')}
      </ul>

      <div class="info-grid" style="margin-top: 1.5rem;">
        <div class="info-card">
          <h4>Functional Requirements</h4>
          <ul>
            ${data.functional.map(req => `<li>${req}</li>`).join('')}
          </ul>
        </div>
        <div class="info-card">
          <h4>Non-Functional Requirements</h4>
          <ul>
            ${data.nonFunctional.map(req => `<li>${req}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  function renderStoriesSection() {
    const container = document.querySelector('#sec-stories .section-content-render');
    const data = generatedData.userStories;
    container.innerHTML = `
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">The following backlog items represent the initial scope of the MVP launch. They are detailed enough to load directly into Jira or GitHub Issues:</p>
      
      ${data.map((story, idx) => `
        <div class="user-story-card">
          <div class="user-story-badge">STORY-${(idx+1).toString().padStart(2, '0')}</div>
          <div class="user-story-text">
            <strong>As a</strong> ${story.as}, <strong>I want to</strong> ${story.want}, <strong>so that</strong> ${story.so}.
          </div>
        </div>
      `).join('')}
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
        <p style="color: var(--text-secondary); margin-bottom: 1.25rem;">For high scalability, unstructured data, or rapid prototyping, we recommend <strong>MongoDB</strong> with Mongoose schema validation objects in Node.js:</p>
        <div class="code-display-box">
          <button class="btn-copy-section code-copy-overlay" onclick="copyCodeContent('db-nosql-code')">Copy Schema</button>
          <pre id="db-nosql-code"><code>${escapeHTML(db.nosql)}</code></pre>
        </div>
      `;
    }
  }

  function renderApiSection() {
    const container = document.querySelector('#sec-api .section-content-render');
    const api = generatedData.api;
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
      
      ${api.endpoints.map((ep, idx) => `
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
                <pre><code>${escapeHTML(JSON.stringify(ep.request, null, 2))}</code></pre>
              </div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 600; text-transform: uppercase;">Response (200 OK / 201 Created)</div>
              <div class="code-display-box" style="padding: 0.75rem; font-size: 0.8rem;">
                <pre><code>${escapeHTML(JSON.stringify(ep.response, null, 2))}</code></pre>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    `;
  }

  function renderFrontendSection() {
    const container = document.querySelector('#sec-frontend .section-content-render');
    const fe = generatedData.frontend;
    container.innerHTML = `
      <div class="info-grid">
        <div class="info-card">
          <h4>Pages &amp; Route Map</h4>
          <ul>
            ${fe.pages.map(page => `<li>${page}</li>`).join('')}
          </ul>
        </div>
        <div class="info-card">
          <h4>Key UI Components</h4>
          <ul>
            ${fe.components.map(comp => `<li>${comp}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="info-card" style="margin: 1.5rem 0; width: 100%;">
        <h4>Navigation &amp; Global State Flow</h4>
        <p>${fe.navFlow}</p>
      </div>

      <h4 class="quick-fill-label">Standard Folder Structure (Next.js App Router)</h4>
      <div class="code-display-box">
        <button class="btn-copy-section code-copy-overlay" onclick="copyCodeContent('fe-folder-code')">Copy Folder Tree</button>
        <pre id="fe-folder-code"><code>${fe.folderStructure}</code></pre>
      </div>
    `;
  }

  function renderTechStackSection() {
    const container = document.querySelector('#sec-techstack .section-content-render');
    const stack = generatedData.techStack;
    container.innerHTML = `
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Below is the recommended technology stack selected specifically for this application's requirements, focusing on developer productivity, performance, and scaling costs:</p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem;">
        ${stack.map(tech => `
          <div class="feature-card" style="padding: 1.5rem; background: var(--bg-tertiary);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
              <h4 style="font-family: var(--font-heading); font-size: 1.1rem; color: #ffffff; font-weight: 600;">${tech.layer}</h4>
              <span style="font-size: 0.8rem; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #a5b4fc; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 500;">${tech.tech}</span>
            </div>
            <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">${tech.reason}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderRoadmapSection() {
    const container = document.querySelector('#sec-roadmap .section-content-render');
    const data = generatedData.roadmap;
    container.innerHTML = `
      <div class="info-card" style="margin-bottom: 1.5rem; width: 100%;">
        <h4>Estimated Project Duration</h4>
        <p>Approx. <strong>${data.timeline}</strong> using 1 senior fullstack dev (or 2-3 devs collaborating with Vibe Coding tools).</p>
      </div>

      <div class="info-grid">
        <div class="info-card" style="border-top: 3px solid var(--secondary);">
          <h4>Phase 1: MVP Core (Weeks 1-3)</h4>
          <ul>
            ${data.mvp.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        <div class="info-card" style="border-top: 3px solid var(--primary);">
          <h4>Phase 2: Scale &amp; UX (Weeks 4-6)</h4>
          <ul>
            ${data.phase2.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        <div class="info-card" style="border-top: 3px solid var(--accent);">
          <h4>Phase 3: Optimization &amp; AI (Weeks 7+)</h4>
          <ul>
            ${data.phase3.map(item => `<li>${item}</li>`).join('')}
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

  // Copy helper inside code block (pulls innerText of element)
  window.copyCodeContent = function(elId) {
    const codeEl = document.getElementById(elId);
    navigator.clipboard.writeText(codeEl.innerText).then(() => {
      showToast('Copied to clipboard successfully!');
    }).catch(err => {
      showToast('Failed to copy text.', 'error');
    });
  };

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
        md += `### Target Users\n`;
        generatedData.executive.targetUsers.forEach(u => md += `* ${u}\n`);
        md += `\n### Business Model Suggestions\n`;
        generatedData.executive.businessModel.forEach(b => md += `* ${b}\n`);
        break;
        
      case 'sec-prd':
        md += `## 2. Product Requirements Document (PRD)\n\n`;
        md += `### Problem Statement\n${generatedData.prd.problemStatement}\n\n`;
        md += `### Goals\n`;
        generatedData.prd.goals.forEach(g => md += `* ${g}\n`);
        md += `\n### Core Features\n`;
        generatedData.prd.features.forEach(f => md += `* **${f.name}**: ${f.description}\n`);
        md += `\n### Functional Requirements\n`;
        generatedData.prd.functional.forEach(fr => md += `* ${fr}\n`);
        md += `\n### Non-Functional Requirements\n`;
        generatedData.prd.nonFunctional.forEach(nfr => md += `* ${nfr}\n`);
        md += `\n### Success Metrics\n`;
        generatedData.prd.metrics.forEach(m => md += `* ${m}\n`);
        break;
        
      case 'sec-stories':
        md += `## 3. User Stories\n\n`;
        generatedData.userStories.forEach((us, idx) => {
          md += `* **US-${(idx+1).toString().padStart(2,'0')}**: As a **${us.as}**, I want to **${us.want}**, so that **${us.so}**.\n`;
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
        generatedData.api.endpoints.forEach(ep => {
          md += `#### ${ep.method} ${ep.path}\n`;
          md += `*Description*: ${ep.desc}\n\n`;
          md += `**Request Body**:\n\`\`\`json\n${JSON.stringify(ep.request, null, 2)}\n\`\`\`\n\n`;
          md += `**Response (200 OK / 201 Created)**:\n\`\`\`json\n${JSON.stringify(ep.response, null, 2)}\n\`\`\`\n\n`;
        });
        break;
        
      case 'sec-frontend':
        md += `## 6. Frontend Architecture\n\n`;
        md += `### Key Pages\n`;
        generatedData.frontend.pages.forEach(p => md += `* ${p}\n`);
        md += `\n### Core Components\n`;
        generatedData.frontend.components.forEach(c => md += `* ${c}\n`);
        md += `\n### Navigation Flow\n${generatedData.frontend.navFlow}\n\n`;
        md += `### Recommended Folder Structure\n\`\`\`\n${generatedData.frontend.folderStructure}\n\`\`\`\n`;
        break;
        
      case 'sec-techstack':
        md += `## 7. Tech Stack Recommendation\n\n`;
        generatedData.techStack.forEach(t => {
          md += `### ${t.layer}\n`;
          md += `* **Technology**: ${t.tech}\n`;
          md += `* **Justification**: ${t.reason}\n\n`;
        });
        break;
        
      case 'sec-roadmap':
        md += `## 8. Development Roadmap\n\n`;
        md += `* **Timeline Estimate**: ${generatedData.roadmap.timeline}\n\n`;
        md += `### Phase 1: MVP Core\n`;
        generatedData.roadmap.mvp.forEach(item => md += `* ${item}\n`);
        md += `\n### Phase 2: Scale & UX Improvements\n`;
        generatedData.roadmap.phase2.forEach(item => md += `* ${item}\n`);
        md += `\n### Phase 3: Optimizations & Advanced AI Features\n`;
        generatedData.roadmap.phase3.forEach(item => md += `* ${item}\n`);
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
