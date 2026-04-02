/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ De{c0}ded Hub v5.5.0 - Unified Root Application Shell                         ║
 * ║ Developed by: De{c0}ded by Edwin Dev                                         ║
 * ║ Module: layout.js (Root Version)                                           ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

const SECURITY_ICONS = {
  recon: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 16-3.89-3.89"/><path d="M11.7 9A2.9 2.9 0 1 0 9 11.7"/></svg>`,
  vuln: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  api: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6" y2="6"/><line x1="6" y1="18" x2="6" y2="18"/></svg>`,
  infra: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  vault: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  pulse: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`
};

document.addEventListener('DOMContentLoaded', () => {
  console.log("DE{C0}DED HUB CORE INIT: OK");
  initShell();
  initSPA();
  initTelemetryLoop();
});

function initShell() {
  if (document.querySelector('.app-shell')) return;

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const initialContent = document.body.innerHTML;
  document.body.innerHTML = '';

  const shellHTML = `
    <div class="app-shell fade-in">
      
      <!-- ELITE SIDEBAR -->
      <aside class="sidebar glass">
        <div class="brand">De{c0}ded Hub</div>
        
        <nav class="nav-section">
          <a href="index.html" class="nav-link ${currentPath === 'index.html' ? 'active' : ''}">
            ${SECURITY_ICONS.pulse} Home Core
          </a>
          <a href="dashboard.html" class="nav-link ${currentPath === 'dashboard.html' ? 'active' : ''}">
            ${SECURITY_ICONS.vault} Module Vault
          </a>
          <a href="docs.html" class="nav-link ${currentPath === 'docs.html' ? 'active' : ''}">
            ${SECURITY_ICONS.infra} Documentation
          </a>
          <a href="about.html" class="nav-link ${currentPath === 'about.html' ? 'active' : ''}">
            ${SECURITY_ICONS.recon} The Architect
          </a>
          <a href="contact.html" class="nav-link ${currentPath === 'contact.html' ? 'active' : ''}">
            ${SECURITY_ICONS.api} Secure Channel
          </a>
        </nav>

        <div style="flex: 1;"></div>

        <div class="glass" style="padding: 2rem; border-radius: 4px; font-size: 0.6rem; color: var(--fog); letter-spacing: 0.1em;">
          <div style="color: var(--fire); font-weight: 800; margin-bottom: 12px; font-size: 0.65rem;">CORE_INTEGRITY: 100%</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>NODE_SYNC</span>
            <span style="color: #5af78e;">ACTIVE</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>PLATFORM</span>
            <span>V5.5.0-FIRE</span>
          </div>
        </div>
      </aside>

      <!-- CONTENT SURFACE -->
      <main class="content-surface" id="mainSurface">
        ${initialContent}
      </main>

      <!-- MASTER TELEMETRY HUD -->
      <section class="telemetry-hud glass">
        <div class="hud-title">
          <span>Master Telemetry HUD</span>
        </div>
        
        <div class="hud-stats">
          <div class="stat-box glass">
            <div class="stat-val">552</div>
            <div class="stat-lbl">Modules</div>
          </div>
          <div class="stat-box glass">
            <div class="stat-val" id="activeNodes">12</div>
            <div class="stat-lbl">Nodes</div>
          </div>
          <div class="stat-box glass">
            <div class="stat-val" id="integrityHUD">100%</div>
            <div class="stat-lbl">Uptime</div>
          </div>
        </div>

        <div class="hud-body" id="hudBody">
          <div class="hud-line">
            <span class="hud-time">[${new Date().toLocaleTimeString()}]</span>
            <span class="hud-text status">DE{C0}DED_SHELL_DEPLOYED.</span>
          </div>
        </div>

        <div class="glass" style="margin-top: 2rem; padding: 2rem; border-radius: 4px;">
          <div style="color: var(--fire); font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 15px;">Live Intelligence</div>
          <div id="intelFeed" style="font-family: var(--ff-m); font-size: 0.65rem; color: var(--paper); line-height: 1.8;">
            <!-- Generated by loop -->
          </div>
        </div>
      </section>

    </div>
  `;

  document.body.insertAdjacentHTML('afterbegin', shellHTML);
}

function initTelemetryLoop() {
  const body = document.getElementById('hudBody');
  const feed = document.getElementById('intelFeed');
  
  const logs = [
    "RECON_INIT: subnet_proxy_chain_set",
    "NODE_HEALTH: cluster_v4_online",
    "BYPASS_SEQ: waf_cookie_inject_success",
    "VULN_SCAN: path_traversal_found",
    "EXFIL_PIPE: data_stream_to_sqli_vault",
    "SHELL_SYSCALL: root_access_confirmed"
  ];

  const intel = [
    "S3_BUCKET_LEAK: customer-data-v2",
    "IDOR_EXPLOIT: /api/v1/user/metadata",
    "SSTI_DETECT: jinja2_payload_executed",
    "JWT_CRACK: algorithm_none_allowed"
  ];

  setInterval(() => {
    const line = document.createElement('div');
    line.className = 'hud-line';
    line.innerHTML = `
      <span class="hud-time">[${new Date().toLocaleTimeString()}]</span>
      <span class="hud-text">${logs[Math.floor(Math.random() * logs.length)]}</span>
    `;
    body.prepend(line);
    if (body.children.length > 20) body.lastElementChild.remove();
  }, 4000);

  setInterval(() => {
    const item = document.createElement('div');
    item.style.color = 'var(--fire)';
    item.textContent = `> ${intel[Math.floor(Math.random() * intel.length)]}`;
    feed.prepend(item);
    if (feed.children.length > 5) feed.lastElementChild.remove();
  }, 7000);

  setInterval(() => {
    const integrity = document.getElementById('integrityHUD');
    const nodes = document.getElementById('activeNodes');
    if (integrity) integrity.textContent = `${98 + Math.floor(Math.random() * 2)}%`;
    if (nodes) nodes.textContent = 10 + Math.floor(Math.random() * 8);
  }, 5000);
}

function initSPA() {
  document.addEventListener('click', async e => {
    const link = e.target.closest('a');
    if (link && link.href.startsWith(window.location.origin) && !link.getAttribute('target')) {
      e.preventDefault();
      const href = link.getAttribute('href');
      const filename = href.split('/').pop() || 'index.html';
      await navigateTo(filename);
    }
  });

  window.addEventListener('popstate', async () => {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    await loadPage(filename, false);
  });
}

async function navigateTo(filename) {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  if (filename === current) return;
  await loadPage(filename);
  window.history.pushState({}, '', filename);
}

async function loadPage(filename, animate = true) {
  const surface = document.getElementById('mainSurface');
  if (animate) surface.style.opacity = '0';

  try {
    const response = await fetch(filename);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newPageMain = doc.querySelector('main');
    
    if (newPageMain) {
      setTimeout(() => {
        surface.innerHTML = newPageMain.innerHTML;
        document.title = doc.title;
        updateNavActive(filename);
        surface.style.opacity = '1';
        executeScripts(doc);
      }, animate ? 300 : 0);
    }
  } catch (err) {
    console.error('SPA FAIL:', err);
    window.location.href = filename;
  }
}

function updateNavActive(filename) {
  document.querySelectorAll('.nav-link').forEach(a => {
    const h = a.getAttribute('href');
    a.classList.toggle('active', h === filename);
  });
}

function executeScripts(doc) {
  const scripts = doc.querySelectorAll('script');
  scripts.forEach(s => {
    if (s.src && (s.src.includes('layout.js') || s.src.includes('catalog.js'))) return;
    const newScript = document.createElement('script');
    Array.from(s.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
    newScript.textContent = s.textContent;
    document.body.appendChild(newScript);
  });
}
