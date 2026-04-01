/**
 * WEBARSENAL UNIFIED LAYOUT ENGINE v1.1.0 (SPA EDITION)
 * (c) 2026 de{c0}de by edwin dev
 */

document.addEventListener('DOMContentLoaded', () => {
    initLayout();
    syncGlobalHUD();
    initTransitions();
    initSPA();
});

function initLayout() {
    if (document.querySelector('nav')) return; // Avoid double injection

    const currentPath = window.location.pathname;
    const isVault = currentPath.includes('vault') || currentPath.includes('dashboard');
    
    const header = `
    <nav>
        <a href="/" class="logo spa-link">Web<span>Arsenal</span></a>
        <ul class="n-links">
            <li><a href="/" class="spa-link ${currentPath === '/' || currentPath.includes('index') ? 'active' : ''}">Home</a></li>
            <li><a href="/vault" class="spa-link ${isVault ? 'active' : ''}">Vault</a></li>
            <li><a href="/modules" class="spa-link ${currentPath.includes('modules') ? 'active' : ''}">Modules</a></li>
            <li><a href="/docs" class="spa-link ${currentPath.includes('docs') ? 'active' : ''}">Docs</a></li>
            <li><a href="/about" class="spa-link ${currentPath.includes('about') ? 'active' : ''}">About</a></li>
        </ul>
        <div class="h-hud">
            <div id="intelCluster" style="display:flex; gap:1.5rem; margin-right:2rem; font-size:0.55rem; color:var(--fog); letter-spacing:0.1em; text-transform:uppercase; border-right:1px solid rgba(242,240,232,0.1); padding-right:1.5rem;">
                <div>Scans: <span id="activeScans" style="color:var(--fire); font-weight:800;">12</span></div>
                <div>Threats: <span id="detectedThreats" style="color:var(--fire); font-weight:800;">1,293</span></div>
            </div>
            <div id="pipelineBadge" class="hud-badge" style="display:none;">Pipeline Active</div>
            <div class="hud-count">320 Modules</div>
            ${!isVault ? '<a href="/vault" class="btn-fire spa-link" style="padding: 0.5rem 1rem; font-size: 0.6rem; margin-left:1rem;">Launch Vault</a>' : '<div class="toolkit-trigger" onclick="toggleSidebar()" id="pipelineCounter">ToolKit Builder (0)</div>'}
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
    
    // Inject Commander & Toaster
    initCommander();
    initToaster();
    initIntelLoop();

    // Init Cursor (Global)
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
            <input type="text" id="comSearch" placeholder="SEARCH THE ARSENAL (320+ MODULES)..." autocomplete="off">
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
            { name: 'Command Vault', cat: 'Core', url: '/vault' },
            { name: 'Module Catalog', cat: 'Index', url: '/modules' },
            { name: 'Documentation', cat: 'Docs', url: '/docs' },
            { name: 'Contact Architect', cat: 'Social', url: '/contact' }
        ].filter(p => p.name.toLowerCase().includes(query));
        
        // Dynamic search from actual modules if available
        if (window.MODULES && query.length > 1) {
            const mods = window.MODULES.filter(m => m.Name.toLowerCase().includes(query))
                                     .slice(0, 10)
                                     .map(m => ({ name: m.Name, cat: m.Category, url: '/vault' }));
            filtered = [...filtered, ...mods];
        }

        results.innerHTML = filtered.map(p => `
            <div class="com-item" onclick="navigateTo('${p.url}'); document.getElementById('commander').classList.remove('open');">
                <span class="name">${p.name}</span>
                <span class="cat">${p.cat}</span>
            </div>
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
            const url = new URL(link.href).pathname;
            navigateTo(url);
        }
    });

    window.addEventListener('popstate', () => {
        loadPage(window.location.pathname, false);
    });
}

async function navigateTo(url) {
    if (url === window.location.pathname) return;
    await loadPage(url);
    window.history.pushState({}, '', url);
}

async function loadPage(url, animate = true) {
    const loader = document.getElementById('page-loader');
    const main = document.querySelector('main');
    
    if (animate) {
        loader.style.width = '30%';
        main.style.opacity = '0';
    }

    try {
        // Resolve internal paths for local file access if needed
        let fetchUrl = url === '/' ? '/index.html' : (url.endsWith('.html') ? url : url + '.html');
        if (fetchUrl === '/vault.html') fetchUrl = '/dashboard.html';

        const response = await fetch(fetchUrl);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newMain = doc.querySelector('main');

        if (newMain) {
            if (animate) loader.style.width = '70%';
            
            // Update Title
            document.title = doc.title;

            // Wait a moment for fade out
            setTimeout(() => {
                main.innerHTML = newMain.innerHTML;
                main.className = newMain.className;
                if (newMain.getAttribute('style')) {
                    main.setAttribute('style', newMain.getAttribute('style'));
                }

                // Update Nav Active State
                updateNavActive(url);

                // Re-run Scripts
                executeScripts(doc);

                // Re-init HUD and Transitions
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
        window.location.href = url; // Fallback
    }
}

function updateNavActive(url) {
    document.querySelectorAll('.n-links a').forEach(a => {
        const h = a.getAttribute('href');
        a.classList.remove('active');
        if (h === url || (url === '/' && h === '/') || (url === '/vault' && h === '/vault')) {
            a.classList.add('active');
        }
    });
}

function executeScripts(doc) {
    // Extract script tags and execute them
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(oldScript => {
        if (oldScript.src && oldScript.src.includes('layout.js')) return; // Don't re-run layout
        
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript);
        // Optional: remove them after execution if they are one-offs
        // newScript.parentNode.removeChild(newScript); 
    });
}

window.toggleSidebar = function() {
    const sb = document.getElementById('sidebar');
    if(sb) sb.classList.toggle('open');
}
