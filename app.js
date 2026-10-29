// Smart Waste Management System - Direct Access & OTP Verification Engine

const STORAGE_KEYS = {
  REQUESTS: 'ecopulse_requests',
  BINS: 'ecopulse_bins',
  COMPLAINTS: 'ecopulse_complaints',
  NEXT_REQ_ID: 'ecopulse_next_req_id',
  NEXT_BIN_ID: 'ecopulse_next_bin_id',
  AUTH_SESSION: 'ecopulse_session'
};

// Authorized Admin Credentials (Exclusive Admin Portal)
const ADMIN_CREDENTIALS = {
  email: "admin@smartwaste.gov",
  password: "Admin@2026"
};

// Universal fallback code that always works for any phone number
const UNIVERSAL_BACKUP_OTP = "123456";

// Default Seed Data
const defaultRequests = [
  { id: 1, location: "Downtown Mall, Gate 2", wasteType: "Plastic", status: "Pending", userPhone: "9876543210" },
  { id: 2, location: "Green Valley Apartments", wasteType: "Wet", status: "In Progress", userPhone: "9876543210" },
  { id: 3, location: "Tech Park Phase 1", wasteType: "E-Waste", status: "Collected", userPhone: "9123456780" },
  { id: 4, location: "Central Avenue, Sector 9", wasteType: "Dry", status: "Pending", userPhone: "admin@smartwaste.gov" }
];

const defaultBins = [
  { binId: 1, location: "City Center North", fillLevel: 88 },
  { binId: 2, location: "Metro Station Exit A", fillLevel: 42 },
  { binId: 3, location: "Riverfront Promenade", fillLevel: 92 },
  { binId: 4, location: "Botanical Gardens", fillLevel: 25 }
];

const defaultComplaints = [
  { id: 1, location: "Block 4 Market", problem: "Waste collection skipped yesterday, bin overflowing onto the walkway.", userPhone: "9876543210" },
  { id: 2, location: "Sunset Boulevard Corner", problem: "Foul odor coming from damaged bin lid.", userPhone: "admin@smartwaste.gov" }
];

// Load from LocalStorage
let requests = JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS)) || defaultRequests;
let bins = JSON.parse(localStorage.getItem(STORAGE_KEYS.BINS)) || defaultBins;
let complaints = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLAINTS)) || defaultComplaints;

let nextRequestId = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_REQ_ID)) || (Math.max(...requests.map(r => r.id), 0) + 1);
let nextBinId = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_BIN_ID)) || (Math.max(...bins.map(b => b.binId), 0) + 1);

// Active Session state: { role: 'ADMIN' | 'USER', identifier: '9876543210' | 'admin@smartwaste.gov' }
let currentSession = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH_SESSION)) || null;

// OTP Tracking state
let pendingPhoneNumber = '';
let activeGeneratedOtp = null;

function persistData() {
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  localStorage.setItem(STORAGE_KEYS.BINS, JSON.stringify(bins));
  localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
  localStorage.setItem(STORAGE_KEYS.NEXT_REQ_ID, nextRequestId.toString());
  localStorage.setItem(STORAGE_KEYS.NEXT_BIN_ID, nextBinId.toString());
}

function persistSession(session) {
  currentSession = session;
  if (session) {
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }
}

// ================= PORTAL SWITCHING =================

function switchLoginPortal(role) {
  const userBtn = document.getElementById('roleBtnUser');
  const adminBtn = document.getElementById('roleBtnAdmin');
  const citizenFlow = document.getElementById('citizenAuthFlow');
  const adminFlow = document.getElementById('adminAuthFlow');
  const subtitle = document.getElementById('authSubtitle');

  if (role === 'ADMIN') {
    adminBtn.className = 'role-tab admin-active';
    userBtn.className = 'role-tab';
    citizenFlow.classList.add('hidden');
    adminFlow.classList.remove('hidden');
    subtitle.textContent = 'Municipal Administration Access (Email & Password)';
  } else {
    userBtn.className = 'role-tab active';
    adminBtn.className = 'role-tab';
    adminFlow.classList.add('hidden');
    citizenFlow.classList.remove('hidden');
    subtitle.textContent = 'Citizen Access via Mobile Number & Verification Code';
  }
}

// ================= CITIZEN: INSTANT 1-CLICK LOGIN =================

function instantCitizenLogin() {
  const input = document.getElementById('mobileInput').value.trim();
  const phone = (/^\d{10}$/.test(input)) ? input : "9876543210";
  completeLogin('USER', phone);
}

// ================= CITIZEN: SEND REAL OTP =================

function handleSendRealOtp(e) {
  e.preventDefault();
  const phone = document.getElementById('mobileInput').value.trim();

  if (!/^\d{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit mobile phone number.', 'warning');
    return;
  }

  pendingPhoneNumber = phone;
  const fullPhoneNumber = `+91 ${phone}`;

  // Generate dynamic 6-digit code
  activeGeneratedOtp = Math.floor(100000 + Math.random() * 900000).toString();

  const btn = document.getElementById('btnSendOtp');
  const btnText = document.getElementById('btnSendOtpText');
  btn.disabled = true;
  btnText.textContent = 'Generating OTP code...';

  setTimeout(() => {
    btn.disabled = false;
    btnText.textContent = 'Get Login OTP';

    // Show on-device native alert dialog so you receive the code immediately
    window.alert(`[EcoPulse SMS Dispatch]\n\nYour 6-Digit Verification Code for ${fullPhoneNumber} is:\n\n👉  ${activeGeneratedOtp}\n\n(Or use universal bypass passcode: 123456)`);

    // Switch to OTP step
    document.getElementById('mobileForm').classList.add('hidden');
    document.getElementById('otpForm').classList.remove('hidden');
    document.getElementById('sentPhoneDisplay').textContent = fullPhoneNumber;

    setupOtpInputNavigation();
    showToast(`Verification code sent for ${fullPhoneNumber}!`, 'success');
  }, 400);
}

function fillUniversalOtp() {
  const digits = document.querySelectorAll('.otp-digit');
  for (let i = 0; i < UNIVERSAL_BACKUP_OTP.length; i++) {
    if (digits[i]) digits[i].value = UNIVERSAL_BACKUP_OTP[i];
  }
  showToast("Universal passcode 123456 applied!", "info");
}

function setupOtpInputNavigation() {
  const digits = document.querySelectorAll('.otp-digit');
  digits.forEach((input, idx) => {
    input.value = '';
    input.onkeyup = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        if (idx < digits.length - 1) digits[idx + 1].focus();
      } else if (e.key === 'Backspace') {
        if (idx > 0) digits[idx - 1].focus();
      }
    };
  });
  if (digits[0]) digits[0].focus();
}

// ================= CITIZEN: VERIFY OTP =================

function handleVerifyRealOtp(e) {
  e.preventDefault();
  const digits = document.querySelectorAll('.otp-digit');
  let enteredOtp = '';
  digits.forEach(d => enteredOtp += d.value.trim());

  if (enteredOtp.length !== 6) {
    showToast('Please enter all 6 digits of the OTP code.', 'warning');
    return;
  }

  // Accepts either the generated code OR the universal backup passcode 123456
  if (enteredOtp === activeGeneratedOtp || enteredOtp === UNIVERSAL_BACKUP_OTP) {
    completeLogin('USER', pendingPhoneNumber || "9876543210");
  } else {
    showToast('Incorrect OTP entered! Please use the code shown in the alert or enter 123456.', 'danger');
  }
}

function resendRealOtp() {
  activeGeneratedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  window.alert(`[EcoPulse New SMS]\n\nYour new Verification Code is:\n\n👉  ${activeGeneratedOtp}\n\n(Backup passcode: 123456)`);
  setupOtpInputNavigation();
  showToast('New verification code generated!', 'info');
}

function backToMobileStep() {
  document.getElementById('otpForm').classList.add('hidden');
  document.getElementById('mobileForm').classList.remove('hidden');
}

// ================= ADMIN: EMAIL & PASSWORD LOGIN =================

function handleAdminEmailLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmailInput').value.trim().toLowerCase();
  const password = document.getElementById('adminPasswordInput').value;

  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    completeLogin('ADMIN', email);
  } else {
    showToast('Invalid Admin credentials! Use: admin@smartwaste.gov & Admin@2026', 'danger');
  }
}

// ================= LOGIN COMPLETION & SESSION =================

function completeLogin(role, identifier) {
  const session = {
    role: role,
    identifier: identifier,
    loginAt: new Date().toLocaleTimeString()
  };

  persistSession(session);
  applyAuthUI();

  if (role === 'ADMIN') {
    showToast('Welcome, Municipal Administrator! Full city control active.', 'success');
  } else {
    showToast(`Welcome! Logged in as Citizen (+91 ${identifier}).`, 'success');
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to sign out?")) {
    persistSession(null);
    activeGeneratedOtp = null;
    applyAuthUI();
    showToast("Successfully signed out.", 'info');
  }
}

function applyAuthUI() {
  const authWrapper = document.getElementById('authWrapper');
  const mainApp = document.getElementById('mainAppContainer');
  const roleBadge = document.getElementById('sessionRoleBadge');
  const activeUserIdentifier = document.getElementById('activeUserIdentifier');
  const activeRoleTag = document.getElementById('activeRoleTag');
  const avatarRoleIcon = document.getElementById('avatarRoleIcon');

  if (!currentSession) {
    authWrapper.classList.remove('hidden');
    mainApp.classList.add('hidden');
    backToMobileStep();
    return;
  }

  // Logged in
  authWrapper.classList.add('hidden');
  mainApp.classList.remove('hidden');

  if (currentSession.role === 'ADMIN') {
    document.body.classList.remove('role-user');
    document.body.classList.add('role-admin');
    activeUserIdentifier.textContent = currentSession.identifier;
    roleBadge.textContent = 'MUNICIPAL ADMIN';
    roleBadge.className = 'badge-smart admin';
    activeRoleTag.textContent = 'Municipal Authority';
    avatarRoleIcon.className = 'user-avatar admin';
    avatarRoleIcon.innerHTML = '<i data-lucide="shield-check"></i>';
    document.getElementById('lbl-total-req').textContent = 'All City Requests';
    document.getElementById('stat-requests-scope').textContent = 'Across all registered citizens';
    document.getElementById('recentRequestsTitle').textContent = 'City-Wide Waste Requests';
  } else {
    document.body.classList.remove('role-admin');
    document.body.classList.add('role-user');
    activeUserIdentifier.textContent = `+91 ${currentSession.identifier}`;
    roleBadge.textContent = 'CITIZEN PORTAL';
    roleBadge.className = 'badge-smart';
    activeRoleTag.textContent = 'Citizen User';
    avatarRoleIcon.className = 'user-avatar';
    avatarRoleIcon.innerHTML = '<i data-lucide="user"></i>';
    document.getElementById('lbl-total-req').textContent = 'My Requests';
    document.getElementById('stat-requests-scope').textContent = 'Logged under your phone number';
    document.getElementById('recentRequestsTitle').textContent = 'Your Recent Requests';
  }

  renderAll();
  lucide.createIcons();
}

// ================= NAVIGATION =================
const tabButtons = document.querySelectorAll('.nav-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');

const tabMeta = {
  dashboard: {
    title: "Operational Dashboard",
    subtitle: "Real-time waste monitoring, request tracking, and smart bin telemetry."
  },
  requests: {
    title: "Collection Requests",
    subtitle: "Track pickup inquiries, check status, and submit service orders."
  },
  bins: {
    title: "Smart Waste Bins",
    subtitle: "Monitor IoT bin telemetry, register new bins, capacity meters, and overflow alerts."
  },
  complaints: {
    title: "Community Complaints",
    subtitle: "Public reports, illegal dumping escalations, and grievance resolution."
  }
};

function switchTab(targetTabId) {
  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === targetTabId);
  });

  tabPanes.forEach(pane => {
    pane.classList.toggle('active', pane.id === `${targetTabId}-tab`);
  });

  if (tabMeta[targetTabId]) {
    pageTitle.textContent = tabMeta[targetTabId].title;
    pageSubtitle.textContent = tabMeta[targetTabId].subtitle;
  }

  lucide.createIcons();
}

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
});

// Toast notification helper
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3800);
}

// Modal handling
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

function updateFillSlider(val) {
  const display = document.getElementById('fillLevelDisplay');
  display.textContent = `${val}%`;
  if (val >= 80) {
    display.className = 'font-bold text-danger';
  } else if (val >= 50) {
    display.className = 'font-bold text-warning';
  } else {
    display.className = 'font-bold text-success';
  }
}

// ================= RENDERERS =================

function getUserFilteredRequests() {
  if (!currentSession) return [];
  if (currentSession.role === 'ADMIN') return requests;
  return requests.filter(r => r.userPhone === currentSession.identifier);
}

function getUserFilteredComplaints() {
  if (!currentSession) return [];
  if (currentSession.role === 'ADMIN') return complaints;
  return complaints.filter(c => c.userPhone === currentSession.identifier);
}

// 1. Dashboard Renderer
function renderDashboard() {
  const userRequests = getUserFilteredRequests();
  const total = userRequests.length;
  const collected = userRequests.filter(r => r.status === 'Collected').length;
  const pending = total - collected;
  const urgentBins = bins.filter(b => b.fillLevel >= 80);

  document.getElementById('stat-total-requests').textContent = total;
  document.getElementById('stat-collected-requests').textContent = collected;
  document.getElementById('stat-pending-requests').textContent = pending;
  document.getElementById('stat-urgent-bins').textContent = urgentBins.length;
  document.getElementById('stat-total-bins-info').textContent = `Out of ${bins.length} monitored bins`;

  const rate = total > 0 ? Math.round((collected / total) * 100) : 0;
  document.getElementById('stat-completion-rate').textContent = `${rate}% resolution rate`;

  document.getElementById('badge-requests-count').textContent = pending;
  document.getElementById('badge-urgent-bins').textContent = urgentBins.length;
  document.getElementById('badge-complaints-count').textContent = getUserFilteredComplaints().length;

  // Urgent Bins Widget
  const urgentContainer = document.getElementById('urgent-bins-container');
  if (urgentBins.length === 0) {
    urgentContainer.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem 0;">
        <i data-lucide="check-circle" class="text-success"></i>
        <p>All smart bins are currently within safe capacity levels (&lt;80%).</p>
      </div>
    `;
  } else {
    urgentContainer.innerHTML = urgentBins.map(bin => `
      <div class="urgent-bin-item">
        <div class="urgent-bin-left">
          <span class="urgent-badge">${bin.fillLevel}%</span>
          <div>
            <div class="font-bold">${bin.location}</div>
            <div class="text-muted" style="font-size: 0.8rem;">Bin ID: #${bin.binId} &bull; Needs immediate collection</div>
          </div>
        </div>
        <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="emptyBin(${bin.binId})">
          <i data-lucide="check" style="width: 14px; height: 14px;"></i> Collect & Empty
        </button>
      </div>
    `).join('');
  }

  // Recent Requests Widget
  const recentContainer = document.getElementById('recent-requests-container');
  const recent = [...userRequests].reverse().slice(0, 4);

  if (recent.length === 0) {
    recentContainer.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem 0;">
        <i data-lucide="inbox"></i>
        <p>No recent requests logged under this account.</p>
      </div>
    `;
  } else {
    recentContainer.innerHTML = recent.map(req => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
        <div>
          <div style="font-weight: 600;">${req.location}</div>
          <div style="font-size: 0.8rem; color: var(--text-dim);">Req #${req.id} &bull; <span class="waste-pill ${req.wasteType}" style="padding: 1px 6px; font-size: 0.72rem;">${req.wasteType}</span></div>
        </div>
        <div>
          <span class="status-pill ${req.status.replace(/\s+/g, '-')}">
            <span class="status-dot"></span>
            ${req.status}
          </span>
        </div>
      </div>
    `).join('');
  }

  lucide.createIcons();
}

// 2. Collection Requests Table
function renderRequests() {
  const searchTerm = (document.getElementById('requestSearchInput')?.value || '').toLowerCase();
  const filter = document.getElementById('statusFilter')?.value || 'ALL';
  const tbody = document.getElementById('requestsTableBody');
  const emptyState = document.getElementById('requestsEmptyState');

  const userRequests = getUserFilteredRequests();
  const filtered = userRequests.filter(req => {
    const matchesSearch =
      req.id.toString().includes(searchTerm) ||
      req.location.toLowerCase().includes(searchTerm) ||
      req.wasteType.toLowerCase().includes(searchTerm) ||
      (req.userPhone && req.userPhone.includes(searchTerm));

    const matchesFilter = (filter === 'ALL') || (req.status === filter);
    return matchesSearch && matchesFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  const isAdmin = currentSession && currentSession.role === 'ADMIN';

  tbody.innerHTML = filtered.map(req => `
    <tr>
      <td class="req-id">#REQ-${String(req.id).padStart(4, '0')}</td>
      <td><strong>${req.location}</strong></td>
      <td><span class="waste-pill ${req.wasteType}">${req.wasteType}</span></td>
      <td><span class="phone-tag">${req.userPhone ? (req.userPhone.includes('@') ? req.userPhone : '+91 ' + req.userPhone) : '+91 9876543210'}</span></td>
      <td>
        <span class="status-pill ${req.status.replace(/\s+/g, '-')}">
          <span class="status-dot"></span>
          ${req.status}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          ${isAdmin ? `
            <select class="status-select" onchange="updateRequestStatus(${req.id}, this.value)">
              <option value="Pending" ${req.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="In Progress" ${req.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Collected" ${req.status === 'Collected' ? 'selected' : ''}>Collected</option>
            </select>
          ` : `
            <span class="text-muted" style="font-size: 0.8rem;">${req.status === 'Collected' ? 'Completed' : 'Tracked'}</span>
          `}
          ${(isAdmin || req.status === 'Pending') ? `
            <button class="btn-danger-outline" onclick="deleteRequest(${req.id})" title="Cancel or delete request">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

// 3. Smart Bins Grid (mirrors viewBins() & displays capacity alerts)
function renderBins() {
  const searchTerm = (document.getElementById('binSearchInput')?.value || '').toLowerCase();
  const grid = document.getElementById('binsGrid');
  const emptyState = document.getElementById('binsEmptyState');

  const filtered = bins.filter(b =>
    b.binId.toString().includes(searchTerm) ||
    b.location.toLowerCase().includes(searchTerm)
  );

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  grid.innerHTML = filtered.map(bin => {
    const isUrgent = bin.fillLevel >= 80;
    const isWarning = bin.fillLevel >= 50 && bin.fillLevel < 80;
    const barClass = isUrgent ? 'urgent' : (isWarning ? 'warning' : 'normal');

    return `
      <div class="bin-card ${isUrgent ? 'urgent' : ''}">
        <div class="bin-header">
          <div>
            <span class="bin-id-label">BIN ID: #${String(bin.binId).padStart(3, '0')}</span>
            <div class="bin-location">${bin.location}</div>
          </div>
          ${isUrgent ? '<span class="urgent-badge"><i data-lucide="alert-circle" style="width: 14px; height: 14px; vertical-align: middle;"></i> 80%+</span>' : ''}
        </div>

        <div class="fill-gauge-container">
          <div class="fill-info-row">
            <span class="text-muted">Fill Level</span>
            <span class="font-bold ${isUrgent ? 'text-danger' : (isWarning ? 'text-warning' : 'text-success')}">${bin.fillLevel}%</span>
          </div>
          <div class="fill-bar-bg">
            <div class="fill-bar-inner ${barClass}" style="width: ${bin.fillLevel}%;"></div>
          </div>
        </div>

        <div class="bin-footer">
          <div>
            ${isUrgent ? '<span class="text-danger font-bold">Alert: Bin needs collection!</span>' : '<span class="text-muted">Alert: Bin capacity normal.</span>'}
          </div>
          <div class="bin-actions">
            <button class="btn-icon" onclick="simulateFill(${bin.binId})" title="Simulate Fill (+15%)">
              <i data-lucide="trending-up"></i>
            </button>
            <button class="btn-icon" onclick="emptyBin(${bin.binId})" title="Empty Bin (0%)">
              <i data-lucide="rotate-ccw"></i>
            </button>
            <button class="btn-icon" onclick="deleteBin(${bin.binId})" title="Remove Bin">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// 4. Complaints List
function renderComplaints() {
  const searchTerm = (document.getElementById('complaintSearchInput')?.value || '').toLowerCase();
  const list = document.getElementById('complaintsList');
  const emptyState = document.getElementById('complaintsEmptyState');
  const isAdmin = currentSession && currentSession.role === 'ADMIN';

  const userComplaints = getUserFilteredComplaints();
  const filtered = userComplaints.filter(c =>
    (c.location && c.location.toLowerCase().includes(searchTerm)) ||
    (c.problem && c.problem.toLowerCase().includes(searchTerm))
  );

  if (filtered.length === 0) {
    list.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  list.innerHTML = filtered.map((c, index) => `
    <div class="complaint-card">
      <div>
        <div class="complaint-header">
          <span class="req-id">#CASE-${c.id || (index + 1)}</span>
          <span class="complaint-loc">${c.location}</span>
          ${isAdmin && c.userPhone ? `<span class="phone-tag">&bull; By ${c.userPhone.includes('@') ? c.userPhone : '+91 ' + c.userPhone}</span>` : ''}
        </div>
        <p class="complaint-desc">${c.problem}</p>
      </div>
      <div>
        <button class="btn-danger-outline" onclick="deleteComplaint(${index})" title="Resolve issue">
          <i data-lucide="check" style="width: 14px; height: 14px;"></i>
          <span>${isAdmin ? 'Resolve & Archive' : 'Withdraw'}</span>
        </button>
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

// ================= USER ACTIONS =================

// Add request
function handleCreateRequest(e) {
  e.preventDefault();
  const location = document.getElementById('reqLocation').value.trim();
  const wasteType = document.getElementById('reqType').value;

  if (!location) return;

  const newRequest = {
    id: nextRequestId++,
    location: location,
    wasteType: wasteType,
    status: "Pending",
    userPhone: currentSession ? currentSession.identifier : "9876543210"
  };

  requests.push(newRequest);
  persistData();
  closeModal('requestModal');
  e.target.reset();

  renderAll();
  showToast(`Request #${newRequest.id} registered successfully!`, 'success');
}

// Update Status (Admin feature)
function updateRequestStatus(id, newStatus) {
  const req = requests.find(r => r.id === id);
  if (req) {
    req.status = newStatus;
    persistData();
    renderAll();
    showToast(`Request #${id} status updated to "${newStatus}"`, 'info');
  }
}

// Delete Request
function deleteRequest(id) {
  requests = requests.filter(r => r.id !== id);
  persistData();
  renderAll();
  showToast(`Request #${id} cancelled/removed.`, 'info');
}

// Register Bin (Mirrors Java addBin() logic)
function handleCreateBin(e) {
  e.preventDefault();
  const location = document.getElementById('binLocation').value.trim();
  const fillLevel = parseInt(document.getElementById('binFill').value, 10);

  if (!location) {
    showToast('Please specify a bin location.', 'warning');
    return;
  }

  if (isNaN(fillLevel) || fillLevel < 0 || fillLevel > 100) {
    showToast('Fill level must be between 0 and 100.', 'warning');
    return;
  }

  const newBin = {
    binId: nextBinId++,
    location: location,
    fillLevel: fillLevel
  };

  bins.push(newBin);
  persistData();
  closeModal('binModal');
  e.target.reset();
  updateFillSlider(45);

  renderAll();
  showToast(`Waste bin #${newBin.binId} added successfully!`, 'success');

  // If user is on dashboard, switch to bins tab or highlight
  if (newBin.fillLevel >= 80) {
    showToast(`Alert: Bin #${newBin.binId} registered at ${newBin.fillLevel}% capacity (Needs collection!)`, 'warning');
  }
}

// Simulate fill increase (+15%)
function simulateFill(binId) {
  const bin = bins.find(b => b.binId === binId);
  if (bin) {
    bin.fillLevel = Math.min(100, bin.fillLevel + 15);
    persistData();
    renderAll();
    if (bin.fillLevel >= 80) {
      showToast(`Alert: Bin #${bin.binId} (${bin.location}) reached ${bin.fillLevel}%! Needs collection!`, 'danger');
    } else {
      showToast(`Bin #${bin.binId} capacity updated to ${bin.fillLevel}%.`, 'info');
    }
  }
}

// Empty Bin (0%)
function emptyBin(binId) {
  const bin = bins.find(b => b.binId === binId);
  if (bin) {
    bin.fillLevel = 0;
    persistData();
    renderAll();
    showToast(`Bin #${bin.binId} emptied & sanitized (0%). Alert normal.`, 'success');
  }
}

// Delete Bin
function deleteBin(binId) {
  bins = bins.filter(b => b.binId !== binId);
  persistData();
  renderAll();
  showToast(`Bin #${binId} removed from registry.`, 'info');
}

// Register Complaint
function handleCreateComplaint(e) {
  e.preventDefault();
  const location = document.getElementById('complaintLocation').value.trim();
  const problem = document.getElementById('complaintProblem').value.trim();

  if (!location || !problem) return;

  complaints.push({
    id: complaints.length + 1,
    location: location,
    problem: problem,
    userPhone: currentSession ? currentSession.identifier : "9876543210"
  });

  persistData();
  closeModal('complaintModal');
  e.target.reset();

  renderAll();
  showToast("Complaint registered successfully!", 'success');
}

// Delete/Resolve Complaint
function deleteComplaint(index) {
  complaints.splice(index, 1);
  persistData();
  renderAll();
  showToast("Complaint resolved.", 'info');
}

// Render Master
function renderAll() {
  renderDashboard();
  renderRequests();
  renderBins();
  renderComplaints();
}

// Initialization on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  switchLoginPortal('USER');
  applyAuthUI();
});
