/**
 * WEBARSENAL UNIFIED LAYOUT ENGINE v1.2.0 (UNIVERSAL NAVIGATION)
 * (c) 2026 de{c0}de by edwin dev
 */

const ICONS = {
    shield: `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    search: `<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    terminal: `<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
    zap: `<svg class="icon-svg" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    layers: `<svg class="icon-svg" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    link: `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    info: `<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
};

document.addEventListener('DOMContentLoaded', () => {
    initLayout();
    syncGlobalHUD();
    initTransitions();
    initSPA();
});

function initLayout() {
    if (document.querySelector('nav')) return;

    const currentPath = window.location.pathname;
    
    const header = `
    <nav>
        <a href="index.html" class="logo spa-link">Web<span>Arsenal</span></a>
        <ul class="n-links">
            <li><a href="index.html" class="spa-link ${currentPath.includes('index') || currentPath === '/' ? 'active' : ''}">Home</a></li>
            <li><a href="dashboard.html" class="spa-link ${currentPath.includes('dashboard') ? 'active' : ''}">Vault</a></li>
            <li><a href="modules.html" class="spa-link ${currentPath.includes('modules') ? 'active' : ''}">Modules</a></li>
            <li><a href="docs.html" class="spa-link ${currentPath.includes('docs') ? 'active' : ''}">Docs</a></li>
            <li><a href="about.html" class="spa-link ${currentPath.includes('about') ? 'active' : ''}">About</a></li>
        </ul>
        <div class="h-hud">
            <div id="intelCluster" style="display:flex; gap:1.5rem; margin-right:2rem; font-size:0.55rem; color:var(--fog); letter-spacing:0.1em; text-transform:uppercase; border-right:1px solid rgba(242,240,232,0.1); padding-right:1.5rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">${ICONS.search} Scans: <span id="activeScans" style="color:var(--fire); font-weight:800;">12</span></div>
                <div style="display:flex; align-items:center; gap:0.5rem;">${ICONS.shield} Threats: <span id="detectedThreats" style="color:var(--fire); font-weight:800;">1,293</span></div>
            </div>
            <div id="pipelineBadge" class="hud-badge" style="display:none;">Pipeline Active</div>
            <div class="hud-count">413 Modules</div>
            ${!currentPath.includes('dashboard') ? '<a href="dashboard.html" class="btn-fire spa-link" style="padding: 0.5rem 1rem; font-size: 0.6rem; margin-left:1rem;">Launch Vault</a>' : '<div class="toolkit-trigger" onclick="toggleSidebar()" id="pipelineCounter">ToolKit Builder (0)</div>'}
        </div>
    </nav>
    <div id="cursor"></div>
    <div id="page-loader" style="position:fixed; top:0; left:0; width:0; height:2px; background:var(--fire); z-index:10001; transition: width 0.4s ease;"></div>
    `;

    const footer = `
    <footer>
        <div class="ft-brand">WebArsenal</div>
        <div style="font-size: 0.65rem; color: var(--fog); margin-top: 1.5rem; letter-spacing: 0.15em;">
            CONSULT LOCAL LAWS BEFORE ACTIVE DEPLOYMENT | © 2026 DE{C0}DE BY EDWIN DEV
        </div>
    </footer>
    `;

    document.body.insertAdjacentHTML('afterbegin', header);
    if (!document.querySelector('footer')) {
        document.body.insertAdjacentHTML('beforeend', footer);
    }
    
    initCommander();
    initToaster();
    initIntelLoop();

    const cursor = document.getElementById('cursor');
    document.addEventListener('mousemove', e => {
        if(cursor) {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        }
    });
}

function initIntelLoop() {
    setInterval(() => {
        const scans = document.getElementById('activeScans');
        const threats = document.getElementById('detectedThreats');
        if (scans) scans.textContent = Math.floor(Math.random() * 5 + 10);
        if (threats) threats.textContent = (parseInt(threats.textContent.replace(',','')) + Math.floor(Math.random() * 3)).toLocaleString();
    }, 3000);
}

function initCommander() {
    const html = `
    <div id="commander">
        <div class="com-wrap">
            <input type="text" id="comSearch" placeholder="SEARCH THE ARSENAL (413+ MODULES)..." autocomplete="off">
            <div class="com-results" id="comResults"></div>
            <div style="margin-top:1.5rem; text-align:center; font-size:0.6rem; color:var(--fog); letter-spacing:0.1em;">
                [ESC] TO CLOSE | [ENTER] TO NAVIGATE | [CTRL+K] TO TRIGGER
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    const commander = document.getElementById('commander');
    const search = document.getElementById('comSearch');
    const results = document.getElementById('comResults');

    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            commander.classList.add('open');
            search.focus();
        }
        if (e.key === 'Escape') {
            commander.classList.remove('open');
        }
    });

    search.addEventListener('input', e => {
        const query = e.target.value.toLowerCase();
        if (!query) { results.innerHTML = ''; return; }
        
        let filtered = [
            { name: 'Command Vault', cat: 'Core', url: 'dashboard.html', icon: ICONS.terminal },
            { name: 'Module Catalog', cat: 'Index', url: 'modules.html', icon: ICONS.layers },
            { name: 'Documentation', cat: 'Docs', url: 'docs.html', icon: ICONS.info },
            { name: 'About The Creator', cat: 'About', url: 'about.html', icon: ICONS.info },
            { name: 'Contact Architect', cat: 'Contact', url: 'contact.html', icon: ICONS.info }
        ].filter(p => p.name.toLowerCase().includes(query));
        
        if (window.MODULES && query.length > 1) {
            const mods = window.MODULES.filter(m => m.Name.toLowerCase().includes(query))
                                     .slice(0, 8)
                                     .map(m => ({ name: m.Name, cat: m.Category, url: 'dashboard.html', icon: ICONS.zap }));
            filtered = [...filtered, ...mods];
        }

        results.innerHTML = filtered.map(p => `
            <a href="${p.url}" class="com-item spa-link" onclick="document.getElementById('commander').classList.remove('open');">
                <div style="display:flex; align-items:center; gap:1rem;">
                    <div style="color:var(--fire); opacity:0.8;">${p.icon}</div>
                    <span class="name">${p.name}</span>
                </div>
                <span class="cat">${p.cat}</span>
            </a>
        `).join('');
    });
}

function initToaster() {
    document.body.insertAdjacentHTML('beforeend', '<div id="toaster"></div>');
}

window.showToast = function(msg, duration = 4000) {
    const container = document.getElementById('toaster');
    const id = 'toast-' + Date.now();
    const html = `
        <div class="toast" id="${id}">
            <div style="color:var(--fire); font-weight:800;">[STATUS]</div>
            <div style="font-size:0.75rem;">${msg}</div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.remove();
    }, duration);
}

function syncGlobalHUD() {
    const pipeline = JSON.parse(localStorage.getItem('webarsenal_pipeline') || '[]');
    const badge = document.getElementById('pipelineBadge');
    const counter = document.getElementById('pipelineCounter');

    if (pipeline.length > 0) {
        if (badge) badge.style.display = 'block';
        if (counter) counter.textContent = `ToolKit Builder (${pipeline.length})`;
    } else {
        if (badge) badge.style.display = 'none';
        if (counter) counter.textContent = `ToolKit Builder (0)`;
    }
}

function initTransitions() {
    document.body.classList.add('fade-in');
    const reveal = new IntersectionObserver(entries => {
        entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));
}

// --- SPA ENGINE ---

function initSPA() {
    document.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (link && link.href && 
            link.href.startsWith(window.location.origin) && 
            !link.getAttribute('target') &&
            !link.href.includes('#')) {
            
            e.preventDefault();
            const urlPath = new URL(link.href).pathname;
            const filename = urlPath === '/' ? 'index.html' : urlPath.split('/').pop();
            navigateTo(filename);
        }
    });

    window.addEventListener('popstate', () => {
        const urlPath = window.location.pathname;
        const filename = urlPath === '/' ? 'index.html' : urlPath.split('/').pop();
        loadPage(filename, false);
    });
}

async function navigateTo(filename) {
    if (filename === window.location.pathname.split('/').pop()) return;
    await loadPage(filename);
    window.history.pushState({}, '', filename);
}

async function loadPage(filename, animate = true) {
    const loader = document.getElementById('page-loader');
    const main = document.querySelector('main');
    
    if (animate) {
        loader.style.width = '30%';
        main.style.opacity = '0';
    }

    try {
        const response = await fetch(filename);
        if (!response.ok) throw new Error('Network response was not ok');
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newMain = doc.querySelector('main');

        if (newMain) {
            if (animate) loader.style.width = '70%';
            document.title = doc.title;

            setTimeout(() => {
                main.innerHTML = newMain.innerHTML;
                main.className = newMain.className;
                if (newMain.getAttribute('style')) {
                    main.setAttribute('style', newMain.getAttribute('style'));
                }

                updateNavActive(filename);
                executeScripts(doc);
                syncGlobalHUD();
                initTransitions();

                if (animate) {
                    loader.style.width = '100%';
                    setTimeout(() => { 
                        loader.style.width = '0';
                        main.style.opacity = '1';
                    }, 400);
                }
            }, 300);
        }
    } catch (err) {
        console.error('SPA Loading Error:', err);
        window.location.href = filename;
    }
}

function updateNavActive(filename) {
    document.querySelectorAll('.n-links a').forEach(a => {
        const h = a.getAttribute('href');
        a.classList.remove('active');
        if (h === filename || (filename === 'index.html' && h === 'index.html')) {
            a.classList.add('active');
        }
    });
}

function executeScripts(doc) {
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(oldScript => {
        if (oldScript.src && (oldScript.src.includes('layout.js'))) return;
        
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript);
    });
}

window.toggleSidebar = function() {
    const sb = document.getElementById('sidebar');
    if(sb) sb.classList.toggle('open');
}
