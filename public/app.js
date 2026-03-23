'use strict';

// ===== State =====
let currentUser = null;
let modalContext = null; // { entity, id }

// ===== Role definitions =====
const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: 'fa-tachometer-alt', roles: ['admin','principal','bursar','clerk'] },
  { id: 'students',     label: 'Students',     icon: 'fa-user-graduate',  roles: ['admin','principal','clerk'] },
  { id: 'teachers',     label: 'Teachers',     icon: 'fa-chalkboard-teacher', roles: ['admin','principal'] },
  { id: 'attendance',   label: 'Attendance',   icon: 'fa-calendar-check', roles: ['admin','principal','bursar','clerk'] },
  { id: 'fees',         label: 'Fees',         icon: 'fa-money-bill-wave',roles: ['admin','bursar','clerk'] },
  { id: 'incomes',      label: 'Income',       icon: 'fa-arrow-circle-down', roles: ['admin','bursar'] },
  { id: 'expenses',     label: 'Expenses',     icon: 'fa-arrow-circle-up',   roles: ['admin','bursar'] },
  { id: 'budgets',      label: 'Budget',       icon: 'fa-chart-pie',      roles: ['admin','bursar'] },
  { id: 'cashbook',     label: 'Cashbook',     icon: 'fa-book-open',      roles: ['admin','bursar'] },
  { id: 'approvals',    label: 'Approvals',    icon: 'fa-check-circle',   roles: ['admin','principal','bursar'] },
  { id: 'staff',        label: 'Staff',        icon: 'fa-users',          roles: ['admin','principal'] },
  { id: 'assets',       label: 'Assets',       icon: 'fa-boxes',          roles: ['admin','principal'] },
  { id: 'audits',       label: 'Audits',       icon: 'fa-file-invoice',   roles: ['admin'] },
  { id: 'inspectorate', label: 'Inspectorate', icon: 'fa-search',         roles: ['admin'] },
  { id: 'districts',    label: 'Districts',    icon: 'fa-map-marker-alt', roles: ['admin'] },
  { id: 'links',        label: 'Links',        icon: 'fa-link',           roles: ['admin','principal','bursar','clerk'] },
  { id: 'settings',     label: 'Settings',     icon: 'fa-cog',            roles: ['admin'] },
];

// ===== API helpers =====
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  return res.json();
}

const getAll   = entity => api('GET', `/api/${entity}`);
const createOne = (entity, data) => api('POST', `/api/${entity}`, data);
const updateOne = (entity, id, data) => api('PUT', `/api/${entity}/${id}`, data);
const deleteOne = (entity, id) => api('DELETE', `/api/${entity}/${id}`);

// ===== Toast =====
function toast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  const el = document.createElement('div');
  el.className = `toast-msg ${type}`;
  el.innerHTML = `<i class="fa ${icon}"></i><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ===== Auth =====
async function doLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  if (!username || !password) {
    errEl.textContent = 'Please enter username and password.';
    errEl.style.display = 'block';
    return;
  }
  try {
    const res = await api('POST', '/api/login', { username, password });
    if (res.success) {
      currentUser = res.user;
      sessionStorage.setItem('user', JSON.stringify(res.user));
      initApp();
    } else {
      errEl.textContent = res.message || 'Invalid credentials';
      errEl.style.display = 'block';
    }
  } catch (e) {
    errEl.textContent = 'Server error. Please try again.';
    errEl.style.display = 'block';
  }
}

function doLogout() {
  sessionStorage.removeItem('user');
  currentUser = null;
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
}

// Allow Enter key on login
document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});
document.getElementById('login-username').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

// ===== App Init =====
async function initApp() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';

  // Topbar user info
  document.getElementById('topbar-user').textContent = currentUser.display || currentUser.username;
  document.getElementById('topbar-role').textContent = capitalize(currentUser.role);

  // Build sidebar
  buildSidebar();

  // Load meta for branding
  try {
    const meta = await api('GET', '/api/meta');
    applyMeta(meta);
  } catch (_) {}

  // Navigate to dashboard
  navigateTo('dashboard');
}

function applyMeta(meta) {
  const logoText = meta.logoText || 'PNG';
  const sysName  = meta.systemName || 'EduFinance PNG';
  const orgName  = meta.orgName || 'MAIMA EXPRESS';
  document.getElementById('sb-logo').textContent = logoText;
  document.getElementById('sb-system-name').textContent = sysName;
  document.getElementById('sb-org-name').textContent = orgName;
  document.getElementById('login-logo-text').textContent = logoText;
  document.getElementById('login-system-name').textContent = sysName;
  document.getElementById('login-system-desc').textContent = meta.systemDesc || 'School Financial Management System';
}

function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = '';
  NAV_ITEMS.forEach(item => {
    if (!item.roles.includes(currentUser.role)) return;
    const btn = document.createElement('button');
    btn.className = 'nav-item-btn';
    btn.dataset.section = item.id;
    btn.innerHTML = `<span class="nav-icon"><i class="fa ${item.icon}"></i></span>${item.label}`;
    btn.addEventListener('click', () => { navigateTo(item.id); closeSidebar(); });
    nav.appendChild(btn);
  });
}

function navigateTo(sectionId) {
  // Update active nav btn
  document.querySelectorAll('.nav-item-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.nav-item-btn[data-section="${sectionId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Hide all sections, show target
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(`section-${sectionId}`);
  if (sec) sec.classList.add('active');

  // Update page title
  const item = NAV_ITEMS.find(n => n.id === sectionId);
  document.getElementById('page-title').textContent = item ? item.label : sectionId;

  // Load section data
  loadSection(sectionId);
}

async function loadSection(id) {
  switch (id) {
    case 'dashboard':    await loadDashboard(); break;
    case 'students':     await loadTable('students'); break;
    case 'teachers':     await loadTable('teachers'); break;
    case 'attendance':   await loadTable('attendance'); break;
    case 'fees':         await loadTable('fees'); break;
    case 'incomes':      await loadTable('incomes'); break;
    case 'expenses':     await loadTable('expenses'); break;
    case 'budgets':      await loadTable('budgets'); break;
    case 'cashbook':     await loadTable('cashbook'); break;
    case 'approvals':    await loadTable('approvals'); break;
    case 'staff':        await loadTable('staff'); break;
    case 'assets':       await loadTable('assets'); break;
    case 'audits':       await loadTable('audits'); break;
    case 'inspectorate': await loadTable('inspectorate'); break;
    case 'districts':    await loadTable('districts'); break;
    case 'links':        await loadTable('links'); break;
    case 'settings':     await loadSettings(); break;
  }
}

// ===== Dashboard =====
async function loadDashboard() {
  try {
    const [students, teachers, fees, incomes, expenses, auditLog] = await Promise.all([
      getAll('students'), getAll('teachers'), getAll('fees'),
      getAll('incomes'), getAll('expenses'), getAll('auditLog')
    ]);

    const totalFees = fees.reduce((s, f) => s + Number(f.amount || 0), 0);
    const totalIncome = incomes.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const balance = totalIncome - totalExpenses;
    const outstanding = students.reduce((s, st) => s + (Number(st.totalFee || 0) - Number(st.paid || 0)), 0);

    document.getElementById('dash-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon"><i class="fa fa-user-graduate"></i></div>
        <div><div class="stat-label">Students</div><div class="stat-value">${students.length}</div></div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa fa-chalkboard-teacher"></i></div>
        <div><div class="stat-label">Teachers</div><div class="stat-value">${teachers.length}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fa fa-money-bill-wave"></i></div>
        <div><div class="stat-label">Fees Collected</div><div class="stat-value">K ${fmt(totalFees)}</div></div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><i class="fa fa-arrow-circle-down"></i></div>
        <div><div class="stat-label">Total Income</div><div class="stat-value">K ${fmt(totalIncome)}</div></div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><i class="fa fa-arrow-circle-up"></i></div>
        <div><div class="stat-label">Total Expenses</div><div class="stat-value">K ${fmt(totalExpenses)}</div></div>
      </div>
      <div class="stat-card ${balance >= 0 ? 'green' : 'red'}">
        <div class="stat-icon"><i class="fa fa-balance-scale"></i></div>
        <div><div class="stat-label">Balance</div><div class="stat-value">K ${fmt(balance)}</div></div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon"><i class="fa fa-exclamation-circle"></i></div>
        <div><div class="stat-label">Outstanding Fees</div><div class="stat-value">K ${fmt(outstanding)}</div></div>
      </div>
    `;

    const actEl = document.getElementById('dash-activity');
    const recent = [...auditLog].reverse().slice(0, 8);
    if (recent.length === 0) {
      actEl.innerHTML = '<li><div class="activity-dot"></div>No activity recorded yet.</li>';
    } else {
      actEl.innerHTML = recent.map(a =>
        `<li><div class="activity-dot"></div><span>${esc(a.action)}</span><span style="margin-left:auto;font-size:0.8rem;color:#94a3b8;">${esc(a.when || '')}</span></li>`
      ).join('');
    }
  } catch (e) {
    document.getElementById('dash-stats').innerHTML = '<p class="text-muted">Failed to load dashboard data.</p>';
  }
}

// ===== Generic Table Loader =====
async function loadTable(entity) {
  try {
    const data = await getAll(entity);
    renderTable(entity, data);
  } catch (e) {
    console.error('loadTable error', e);
  }
}

function renderTable(entity, data) {
  const tbody = document.querySelector(`#tbl-${entity} tbody`);
  if (!tbody) return;
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="20"><div class="empty-state"><i class="fa fa-inbox"></i><p>No records found.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((row, i) => renderRow(entity, row, i + 1)).join('');
}

function renderRow(entity, row, num) {
  const actions = `
    <button class="btn-action btn-edit" onclick='editRecord("${entity}", ${JSON.stringify(row.id)})'><i class="fa fa-edit"></i> Edit</button>
    <button class="btn-action btn-delete" onclick='deleteRecord("${entity}", ${JSON.stringify(row.id)})'><i class="fa fa-trash"></i></button>
  `;
  switch (entity) {
    case 'students':
      return `<tr><td>${num}</td><td>${esc(row.name)}</td><td>${esc(row.grade)}</td><td>K ${fmt(row.totalFee)}</td><td>K ${fmt(row.paid)}</td><td>K ${fmt(Number(row.totalFee||0) - Number(row.paid||0))}</td><td>${actions}</td></tr>`;
    case 'teachers':
      return `<tr><td>${num}</td><td>${esc(row.name)}</td><td>${esc(row.subject)}</td><td>${esc(row.contact)}</td><td>${actions}</td></tr>`;
    case 'attendance':
      return `<tr><td>${num}</td><td>${esc(row.student)}</td><td>${esc(row.date)}</td><td><span class="badge-status ${(row.status||'').toLowerCase()}">${esc(row.status)}</span></td><td>${actions}</td></tr>`;
    case 'fees':
      return `<tr><td>${num}</td><td>${esc(row.student)}</td><td>K ${fmt(row.amount)}</td><td>${esc(row.date)}</td><td>${actions}</td></tr>`;
    case 'incomes':
      return `<tr><td>${num}</td><td>${esc(row.source)}</td><td>K ${fmt(row.amount)}</td><td>${esc(row.date)}</td><td>${actions}</td></tr>`;
    case 'expenses':
      return `<tr><td>${num}</td><td>${esc(row.category)}</td><td>K ${fmt(row.amount)}</td><td>${esc(row.date)}</td><td>${actions}</td></tr>`;
    case 'budgets':
      return `<tr><td>${num}</td><td>${esc(row.name)}</td><td>K ${fmt(row.amount)}</td><td>K ${fmt(row.spent)}</td><td>K ${fmt(Number(row.amount||0) - Number(row.spent||0))}</td><td>${actions}</td></tr>`;
    case 'cashbook':
      return `<tr><td>${num}</td><td>${esc(row.type)}</td><td>${esc(row.description)}</td><td>K ${fmt(row.amount)}</td><td>${esc(row.date)}</td><td>${actions}</td></tr>`;
    case 'approvals':
      return `<tr><td>${num}</td><td>${esc(row.request)}</td><td>${esc(row.type)}</td><td>K ${fmt(row.amount)}</td><td><span class="badge-status ${(row.status||'').toLowerCase()}">${esc(row.status)}</span></td><td>${esc(row.created)}</td><td>${actions}</td></tr>`;
    case 'staff':
      return `<tr><td>${num}</td><td>${esc(row.name)}</td><td>${esc(row.role)}</td><td>${esc(row.staffId)}</td><td>${esc(row.phone)}</td><td>${esc(row.email)}</td><td>${actions}</td></tr>`;
    case 'assets':
      return `<tr><td>${num}</td><td>${esc(row.name)}</td><td>${esc(row.category)}</td><td>${esc(row.qty)}</td><td>${esc(row.status)}</td><td>${actions}</td></tr>`;
    case 'audits':
      return `<tr><td>${num}</td><td>${esc(row.period)}</td><td>${esc(row.auditor)}</td><td><span class="badge-status ${(row.status||'').toLowerCase()}">${esc(row.status)}</span></td><td>${esc(row.note)}</td><td>${actions}</td></tr>`;
    case 'inspectorate':
      return `<tr><td>${num}</td><td>${esc(row.name)}</td><td>${esc(row.position)}</td><td>${esc(row.phone)}</td><td>${esc(row.email)}</td><td>${actions}</td></tr>`;
    case 'districts':
      return `<tr><td>${num}</td><td>${esc(row.name)}</td><td>${esc(row.lgg)}</td><td>${esc(row.province)}</td><td>${actions}</td></tr>`;
    case 'links':
      return `<tr><td>${num}</td><td>${esc(row.name)}</td><td><a href="${esc(row.url)}" target="_blank" rel="noopener noreferrer">${esc(row.url)}</a></td><td>${actions}</td></tr>`;
    default:
      return `<tr><td>${num}</td><td colspan="10">${JSON.stringify(row)}</td><td>${actions}</td></tr>`;
  }
}

// ===== Modal =====
function buildModalForm(entity, row = {}) {
  const v = k => esc(row[k] || '');
  const n = k => row[k] != null ? Number(row[k]) : '';
  switch (entity) {
    case 'students': return `
      <div class="form-group"><label class="form-label">Name</label><input id="mf-name" class="form-control" value="${v('name')}" /></div>
      <div class="form-group"><label class="form-label">Grade</label><input id="mf-grade" class="form-control" value="${v('grade')}" /></div>
      <div class="form-group"><label class="form-label">Total Fee (K)</label><input id="mf-totalFee" type="number" class="form-control" value="${n('totalFee')}" /></div>
      <div class="form-group"><label class="form-label">Paid (K)</label><input id="mf-paid" type="number" class="form-control" value="${n('paid')}" /></div>`;
    case 'teachers': return `
      <div class="form-group"><label class="form-label">Name</label><input id="mf-name" class="form-control" value="${v('name')}" /></div>
      <div class="form-group"><label class="form-label">Subject</label><input id="mf-subject" class="form-control" value="${v('subject')}" /></div>
      <div class="form-group"><label class="form-label">Contact</label><input id="mf-contact" class="form-control" value="${v('contact')}" /></div>`;
    case 'attendance': return `
      <div class="form-group"><label class="form-label">Student</label><input id="mf-student" class="form-control" value="${v('student')}" /></div>
      <div class="form-group"><label class="form-label">Date</label><input id="mf-date" type="date" class="form-control" value="${v('date')}" /></div>
      <div class="form-group"><label class="form-label">Status</label>
        <select id="mf-status" class="form-select">
          ${['Present','Absent','Late','Excused'].map(s => `<option${v('status') === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select></div>`;
    case 'fees': return `
      <div class="form-group"><label class="form-label">Student</label><input id="mf-student" class="form-control" value="${v('student')}" /></div>
      <div class="form-group"><label class="form-label">Amount (K)</label><input id="mf-amount" type="number" class="form-control" value="${n('amount')}" /></div>
      <div class="form-group"><label class="form-label">Date</label><input id="mf-date" class="form-control" value="${v('date')}" /></div>`;
    case 'incomes': return `
      <div class="form-group"><label class="form-label">Source</label><input id="mf-source" class="form-control" value="${v('source')}" /></div>
      <div class="form-group"><label class="form-label">Amount (K)</label><input id="mf-amount" type="number" class="form-control" value="${n('amount')}" /></div>
      <div class="form-group"><label class="form-label">Date</label><input id="mf-date" type="date" class="form-control" value="${v('date')}" /></div>`;
    case 'expenses': return `
      <div class="form-group"><label class="form-label">Category</label><input id="mf-category" class="form-control" value="${v('category')}" /></div>
      <div class="form-group"><label class="form-label">Amount (K)</label><input id="mf-amount" type="number" class="form-control" value="${n('amount')}" /></div>
      <div class="form-group"><label class="form-label">Date</label><input id="mf-date" type="date" class="form-control" value="${v('date')}" /></div>`;
    case 'budgets': return `
      <div class="form-group"><label class="form-label">Name</label><input id="mf-name" class="form-control" value="${v('name')}" /></div>
      <div class="form-group"><label class="form-label">Allocated (K)</label><input id="mf-amount" type="number" class="form-control" value="${n('amount')}" /></div>
      <div class="form-group"><label class="form-label">Spent (K)</label><input id="mf-spent" type="number" class="form-control" value="${n('spent')}" /></div>`;
    case 'cashbook': return `
      <div class="form-group"><label class="form-label">Type</label>
        <select id="mf-type" class="form-select">
          ${['Receipt','Payment','Transfer'].map(s => `<option${v('type') === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Description</label><input id="mf-description" class="form-control" value="${v('description')}" /></div>
      <div class="form-group"><label class="form-label">Amount (K)</label><input id="mf-amount" type="number" class="form-control" value="${n('amount')}" /></div>
      <div class="form-group"><label class="form-label">Date</label><input id="mf-date" type="date" class="form-control" value="${v('date')}" /></div>`;
    case 'approvals': return `
      <div class="form-group"><label class="form-label">Request</label><input id="mf-request" class="form-control" value="${v('request')}" /></div>
      <div class="form-group"><label class="form-label">Type</label><input id="mf-type" class="form-control" value="${v('type')}" /></div>
      <div class="form-group"><label class="form-label">Amount (K)</label><input id="mf-amount" type="number" class="form-control" value="${n('amount')}" /></div>
      <div class="form-group"><label class="form-label">Status</label>
        <select id="mf-status" class="form-select">
          ${['Pending','Approved','Rejected'].map(s => `<option${v('status') === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Created</label><input id="mf-created" type="date" class="form-control" value="${v('created')}" /></div>`;
    case 'staff': return `
      <div class="form-group"><label class="form-label">Name</label><input id="mf-name" class="form-control" value="${v('name')}" /></div>
      <div class="form-group"><label class="form-label">Role</label><input id="mf-role" class="form-control" value="${v('role')}" /></div>
      <div class="form-group"><label class="form-label">Staff ID</label><input id="mf-staffId" class="form-control" value="${v('staffId')}" /></div>
      <div class="form-group"><label class="form-label">Phone</label><input id="mf-phone" class="form-control" value="${v('phone')}" /></div>
      <div class="form-group"><label class="form-label">Email</label><input id="mf-email" type="email" class="form-control" value="${v('email')}" /></div>`;
    case 'assets': return `
      <div class="form-group"><label class="form-label">Name</label><input id="mf-name" class="form-control" value="${v('name')}" /></div>
      <div class="form-group"><label class="form-label">Category</label><input id="mf-category" class="form-control" value="${v('category')}" /></div>
      <div class="form-group"><label class="form-label">Quantity</label><input id="mf-qty" type="number" class="form-control" value="${n('qty')}" /></div>
      <div class="form-group"><label class="form-label">Status</label>
        <select id="mf-status" class="form-select">
          ${['Good','Fair','Poor','Damaged'].map(s => `<option${v('status') === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select></div>`;
    case 'audits': return `
      <div class="form-group"><label class="form-label">Period</label><input id="mf-period" class="form-control" value="${v('period')}" /></div>
      <div class="form-group"><label class="form-label">Auditor</label><input id="mf-auditor" class="form-control" value="${v('auditor')}" /></div>
      <div class="form-group"><label class="form-label">Status</label>
        <select id="mf-status" class="form-select">
          ${['Clear','Pending','Issues Found'].map(s => `<option${v('status') === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Note</label><textarea id="mf-note" class="form-control" rows="2">${v('note')}</textarea></div>`;
    case 'inspectorate': return `
      <div class="form-group"><label class="form-label">Name</label><input id="mf-name" class="form-control" value="${v('name')}" /></div>
      <div class="form-group"><label class="form-label">Position</label><input id="mf-position" class="form-control" value="${v('position')}" /></div>
      <div class="form-group"><label class="form-label">Phone</label><input id="mf-phone" class="form-control" value="${v('phone')}" /></div>
      <div class="form-group"><label class="form-label">Email</label><input id="mf-email" type="email" class="form-control" value="${v('email')}" /></div>`;
    case 'districts': return `
      <div class="form-group"><label class="form-label">District Name</label><input id="mf-name" class="form-control" value="${v('name')}" /></div>
      <div class="form-group"><label class="form-label">LGG</label><input id="mf-lgg" class="form-control" value="${v('lgg')}" /></div>
      <div class="form-group"><label class="form-label">Province</label><input id="mf-province" class="form-control" value="${v('province')}" /></div>`;
    case 'links': return `
      <div class="form-group"><label class="form-label">Name</label><input id="mf-name" class="form-control" value="${v('name')}" /></div>
      <div class="form-group"><label class="form-label">URL</label><input id="mf-url" type="url" class="form-control" value="${v('url')}" /></div>`;
    default: return '<p>No form defined for this entity.</p>';
  }
}

function collectFormData(entity) {
  const gv = id => { const el = document.getElementById(id); return el ? el.value.trim() : undefined; };
  const gn = id => { const el = document.getElementById(id); return el ? Number(el.value) : undefined; };
  switch (entity) {
    case 'students':   return { name: gv('mf-name'), grade: gv('mf-grade'), totalFee: gn('mf-totalFee'), paid: gn('mf-paid') };
    case 'teachers':   return { name: gv('mf-name'), subject: gv('mf-subject'), contact: gv('mf-contact') };
    case 'attendance': return { student: gv('mf-student'), date: gv('mf-date'), status: gv('mf-status') };
    case 'fees':       return { student: gv('mf-student'), amount: gn('mf-amount'), date: gv('mf-date') };
    case 'incomes':    return { source: gv('mf-source'), amount: gn('mf-amount'), date: gv('mf-date') };
    case 'expenses':   return { category: gv('mf-category'), amount: gn('mf-amount'), date: gv('mf-date') };
    case 'budgets':    return { name: gv('mf-name'), amount: gn('mf-amount'), spent: gn('mf-spent') };
    case 'cashbook':   return { type: gv('mf-type'), description: gv('mf-description'), amount: gn('mf-amount'), date: gv('mf-date') };
    case 'approvals':  return { request: gv('mf-request'), type: gv('mf-type'), amount: gn('mf-amount'), status: gv('mf-status'), created: gv('mf-created') };
    case 'staff':      return { name: gv('mf-name'), role: gv('mf-role'), staffId: gv('mf-staffId'), phone: gv('mf-phone'), email: gv('mf-email') };
    case 'assets':     return { name: gv('mf-name'), category: gv('mf-category'), qty: gn('mf-qty'), status: gv('mf-status') };
    case 'audits':     return { period: gv('mf-period'), auditor: gv('mf-auditor'), status: gv('mf-status'), note: gv('mf-note') };
    case 'inspectorate': return { name: gv('mf-name'), position: gv('mf-position'), phone: gv('mf-phone'), email: gv('mf-email') };
    case 'districts':  return { name: gv('mf-name'), lgg: gv('mf-lgg'), province: gv('mf-province') };
    case 'links':      return { name: gv('mf-name'), url: gv('mf-url') };
    default: return {};
  }
}

function showAddModal(entity) {
  modalContext = { entity, id: null };
  document.getElementById('modal-title').textContent = `Add ${capitalize(entity.replace(/s$/, ''))}`;
  document.getElementById('modal-body').innerHTML = buildModalForm(entity, {});
  document.getElementById('modal-overlay').style.display = 'flex';
}

async function editRecord(entity, id) {
  try {
    const data = await getAll(entity);
    const row = data.find(r => String(r.id) === String(id));
    if (!row) { toast('Record not found', 'error'); return; }
    modalContext = { entity, id };
    document.getElementById('modal-title').textContent = `Edit ${capitalize(entity.replace(/s$/, ''))}`;
    document.getElementById('modal-body').innerHTML = buildModalForm(entity, row);
    document.getElementById('modal-overlay').style.display = 'flex';
  } catch (e) {
    toast('Failed to load record', 'error');
  }
}

async function deleteRecord(entity, id) {
  if (!confirm('Are you sure you want to delete this record?')) return;
  try {
    await deleteOne(entity, id);
    await logAudit(`Deleted record in ${entity} (id: ${id})`);
    toast('Record deleted successfully');
    await loadTable(entity);
  } catch (e) {
    toast('Failed to delete record', 'error');
  }
}

async function saveModal() {
  if (!modalContext) return;
  const { entity, id } = modalContext;
  const data = collectFormData(entity);
  try {
    if (id) {
      await updateOne(entity, id, data);
      await logAudit(`Updated record in ${entity} (id: ${id})`);
      toast('Record updated successfully');
    } else {
      await createOne(entity, data);
      await logAudit(`Created record in ${entity}`);
      toast('Record added successfully');
    }
    closeModal();
    await loadTable(entity);
  } catch (e) {
    toast('Failed to save record', 'error');
  }
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  modalContext = null;
}

function closeModalOnBackdrop(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

// ===== Settings =====
async function loadSettings() {
  try {
    const [school, meta] = await Promise.all([api('GET', '/api/school'), api('GET', '/api/meta')]);
    document.getElementById('set-school-name').value    = school.name || '';
    document.getElementById('set-school-code').value    = school.code || '';
    document.getElementById('set-school-address').value = school.address || '';
    document.getElementById('set-school-phone').value   = school.phone || '';
    document.getElementById('set-meta-orgName').value     = meta.orgName || '';
    document.getElementById('set-meta-systemName').value  = meta.systemName || '';
    document.getElementById('set-meta-systemDesc').value  = meta.systemDesc || '';
    document.getElementById('set-meta-province').value    = meta.province || '';
    document.getElementById('set-meta-logoText').value    = meta.logoText || '';
  } catch (e) {
    toast('Failed to load settings', 'error');
  }
}

async function saveSchool() {
  const body = {
    name:    document.getElementById('set-school-name').value.trim(),
    code:    document.getElementById('set-school-code').value.trim(),
    address: document.getElementById('set-school-address').value.trim(),
    phone:   document.getElementById('set-school-phone').value.trim(),
  };
  try {
    await api('PUT', '/api/school', body);
    await logAudit('Updated school settings');
    toast('School settings saved');
  } catch (e) {
    toast('Failed to save school settings', 'error');
  }
}

async function saveMeta() {
  const body = {
    orgName:    document.getElementById('set-meta-orgName').value.trim(),
    systemName: document.getElementById('set-meta-systemName').value.trim(),
    systemDesc: document.getElementById('set-meta-systemDesc').value.trim(),
    province:   document.getElementById('set-meta-province').value.trim(),
    logoText:   document.getElementById('set-meta-logoText').value.trim(),
  };
  try {
    const updated = await api('PUT', '/api/meta', body);
    await logAudit('Updated meta settings');
    applyMeta(updated);
    toast('Meta settings saved');
  } catch (e) {
    toast('Failed to save meta settings', 'error');
  }
}

// ===== Audit Log =====
async function logAudit(action) {
  try {
    await api('POST', '/api/auditLog', { action, user: currentUser ? currentUser.username : 'system' });
  } catch (_) { /* non-critical */ }
}

// ===== Sidebar Mobile Toggle =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('visible');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}

// ===== Utilities =====
function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmt(n) {
  const num = Number(n);
  if (isNaN(num)) return '0';
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

// ===== Startup: Check for existing session =====
(function checkSession() {
  const stored = sessionStorage.getItem('user');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      initApp();
    } catch (_) {
      sessionStorage.removeItem('user');
    }
  }
})();
