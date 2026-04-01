/**
 * WEBARSENAL UNIFIED LAYOUT ENGINE v1.0.0
 * (c) 2026 de{c0}de by edwin dev
 */

document.addEventListener('DOMContentLoaded', () => {
    initLayout();
    syncGlobalHUD();
    initTransitions();
});

function initLayout() {
    // 1. INJECT UNIFIED HEADER
    const currentPath = window.location.pathname;
    const isVault = currentPath.includes('vault') || currentPath.includes('dashboard');
    
    const header = `
    <nav>
        <a href="/" class="logo">Web<span>Arsenal</span></a>
        <ul class="n-links">
            <li><a href="/" class="${currentPath === '/' || currentPath.includes('index') ? 'active' : ''}">Home</a></li>
            <li><a href="/vault" class="${isVault ? 'active' : ''}">Vault</a></li>
            <li><a href="/modules" class="${currentPath.includes('modules') ? 'active' : ''}">Modules</a></li>
            <li><a href="/docs" class="${currentPath.includes('docs') ? 'active' : ''}">Docs</a></li>
            <li><a href="/about" class="${currentPath.includes('about') ? 'active' : ''}">About</a></li>
        </ul>
        <div class="h-hud">
            <div id="pipelineBadge" class="hud-badge" style="display:none;">Pipeline Active</div>
            <div class="hud-count">320 Modules</div>
            ${!isVault ? '<a href="/vault" class="btn-fire" style="padding: 0.5rem 1rem; font-size: 0.6rem; margin-left:1rem;">Launch Vault</a>' : '<div class="toolkit-trigger" onclick="toggleSidebar()" id="pipelineCounter">ToolKit Builder (0)</div>'}
        </div>
    </nav>
    <div id="cursor"></div>
    `;

    // 2. INJECT UNIFIED FOOTER
    const footer = `
    <footer>
        <div class="ft-brand">WebArsenal</div>
        <div style="font-size: 0.65rem; color: var(--fog); margin-top: 1.5rem; letter-spacing: 0.15em;">
            CONSULT LOCAL LAWS BEFORE ACTIVE DEPLOYMENT | © 2026 DE{C0}DE BY EDWIN DEV
        </div>
    </footer>
    `;

    document.body.insertAdjacentHTML('afterbegin', header);
    document.body.insertAdjacentHTML('beforeend', footer);

    // Init Cursor (Global)
    const cursor = document.getElementById('cursor');
    document.addEventListener('mousemove', e => {
        if(cursor) {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        }
    });
}

function syncGlobalHUD() {
    const pipeline = JSON.parse(localStorage.getItem('webarsenal_pipeline') || '[]');
    const badge = document.getElementById('pipelineBadge');
    const counter = document.getElementById('pipelineCounter');

    if (pipeline.length > 0) {
        if (badge) badge.style.display = 'block';
        if (counter) counter.textContent = `ToolKit Builder (${pipeline.length})`;
    }
}

function initTransitions() {
    document.body.classList.add('fade-in');
    
    // Intersection Observer for scroll reveals
    const reveal = new IntersectionObserver(entries => {
        entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));
}

// Global toggle for sidebar (needed for dashboard)
window.toggleSidebar = function() {
    const sb = document.getElementById('sidebar');
    if(sb) sb.classList.toggle('open');
}
