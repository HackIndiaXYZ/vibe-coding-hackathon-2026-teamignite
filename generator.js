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
  // DOMAIN CLASSIFIER & SPECIFICATION COMPILER
  // =========================================
  function extractSemanticDetails(prompt) {
    const normalized = prompt.toLowerCase();
    
    let domainName = "";
    let roles = [];
    let entities = [];
    let integrations = [];
    
    // 1. Vacation Rental Marketplace (Airbnb style)
    if (normalized.includes('airbnb') || normalized.includes('vacation rental') || normalized.includes('hotel') || normalized.includes('room booking') || normalized.includes('stay') || normalized.includes('property booking')) {
      domainName = "Vacation Rental Marketplace";
      roles = ["Guest Renter", "Host Property Owner", "Operations Auditor"];
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
          name: "Cancellation",
          tableName: "cancellations",
          fields: [
            { name: "reservation_id", type: "UUID", refTable: "reservations", description: "Reference to the cancelled stay booking" },
            { name: "cancelled_by_id", type: "UUID", refTable: "users", description: "User ID who triggered the cancellation" },
            { name: "refund_amount", type: "DECIMAL(10,2)", description: "Stripe escrow refund payload amount" },
            { name: "reason", type: "TEXT", description: "Cancellation explanation details" }
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
      domainName = "Ride-Sharing & Telemetry Marketplace";
      roles = ["Rider Customer", "Driver Partner", "Platform Dispatcher"];
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
          name: "RideRequest",
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
          name: "Transaction",
          tableName: "transactions",
          fields: [
            { name: "ride_id", type: "UUID", refTable: "rides", description: "Reference to the completed ride ticket" },
            { name: "amount", type: "DECIMAL(10,2)", description: "Fare calculation invoice size" },
            { name: "tip_amount", type: "DECIMAL(10,2)", description: "Rider tip amount (optional)" },
            { name: "stripe_payment_id", type: "VARCHAR(255)", description: "Stripe payout payment intent" },
            { name: "status", type: "VARCHAR(50)", description: "Status: 'Authorized', 'Settled', 'Refunded'" }
          ]
        },
        {
          name: "Review",
          tableName: "reviews",
          fields: [
            { name: "ride_id", type: "UUID", refTable: "rides", description: "Reference to the corresponding ride" },
            { name: "reviewer_role", type: "VARCHAR(50)", description: "Reviewer identifier: 'Rider' or 'Driver'" },
            { name: "rating", type: "INT", description: "Rating score rank (1 to 5)" },
            { name: "comment", type: "TEXT", description: "Text feedback notes" }
          ]
        }
      ];
    }
    // 3. Food Delivery Marketplace (Swiggy style)
    else if (normalized.includes('swiggy') || normalized.includes('doordash') || normalized.includes('ubereats') || normalized.includes('food delivery') || normalized.includes('restaurant booking') || normalized.includes('delivery app')) {
      domainName = "Food Delivery & Logistics Marketplace";
      roles = ["Customer Consumer", "Restaurant Partner", "Delivery Agent", "Operations Manager"];
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
          name: "DeliveryReceipt",
          tableName: "deliveries",
          fields: [
            { name: "order_id", type: "UUID", refTable: "orders", description: "Reference to the delivery order" },
            { name: "dropoff_photo_url", type: "TEXT", description: "Dropoff proof photo attachment URL" },
            { name: "delivery_time", type: "TIMESTAMP", description: "Fulfillment delivery closure timestamp" }
          ]
        }
      ];
    }
    // 4. Professional Social Network (LinkedIn style)
    else if (normalized.includes('linkedin') || normalized.includes('social network') || normalized.includes('professional network') || normalized.includes('connections') || normalized.includes('job board') || normalized.includes('posts')) {
      domainName = "Professional Social Networking Platform";
      roles = ["Professional Member", "Company Recruiter", "System Moderator"];
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
        }
      ];
    }
    // 5. E-Commerce Marketplace (Amazon style)
    else if (normalized.includes('amazon') || normalized.includes('e-commerce') || normalized.includes('ecommerce') || normalized.includes('online shop') || normalized.includes('checkout store')) {
      domainName = "B2C E-Commerce Marketplace";
      roles = ["Shopper Buyer", "Merchant Seller", "Logistics Operations Manager"];
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
      domainName = "AI Fitness & Coaching Platform";
      roles = ["Fitness Client", "AI Coaching Agent", "Human Trainer Auditor"];
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
          name: "ProgressLog",
          tableName: "progress_logs",
          fields: [
            { name: "client_id", type: "UUID", refTable: "users", description: "Reference to client logs profile" },
            { name: "log_date", type: "DATE", description: "Log recording calendar date" },
            { name: "recorded_weight", type: "DECIMAL(5,2)", description: "Weight index indicator" },
            { name: "compliance_score", type: "DECIMAL(5,2)", description: "Schedules checks compliance metrics" }
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
        roles = ["Renter Customer", "Host Owner Provider", "Operations Administrator"];
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
            name: "CancellationRecord",
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
        roles = ["Account Administrator", "Staff Teammate", "System Auditor"];
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
      integrations
    };
  }

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
    const defaultVerbList = ["search and review listing elements of", "schedule and instantiate booking requests for", "log updates on", "view dashboard reports of"];
    semantic.roles.forEach((role, rIdx) => {
      semantic.entities.forEach((entity, eIdx) => {
        const verb = defaultVerbList[(rIdx + eIdx) % defaultVerbList.length];
        data.userStories.push({
          as: role,
          want: `${verb} ${entity.tableName}`,
          so: `I can manage operational tasks, ensure data consistency, and review compliance checks without manual intervention`
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

  // Tech Stack, Roadmap, Vibe, Diagram sections same rendering helpers
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
