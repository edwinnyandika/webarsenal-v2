'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { once } = require('events');
const { getModuleById } = require('../lib/module-catalog');
const { runModule } = require('../lib/module-runner');

function createFixtureServer() {
  const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnSUs8AAAAASUVORK5CYII=', 'base64');

  return http.createServer((request, response) => {
    const cookie = request.headers.cookie || '';
    const isAuthed = cookie.includes('auth=1');

    if (request.method === 'POST' && request.url === '/login') {
      response.writeHead(302, {
        Location: '/private',
        'Set-Cookie': 'auth=1; Path=/',
      });
      response.end();
      return;
    }

    if (request.url === '/login') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end([
        '<html><body>',
        '<form method="post" action="/login">',
        '<input id="username" name="username">',
        '<input id="password" name="password" type="password">',
        '<button id="submit" type="submit">Login</button>',
        '</form>',
        '</body></html>',
      ].join(''));
      return;
    }

    if (request.url === '/private') {
      if (!isAuthed) {
        response.writeHead(302, { Location: '/login' });
        response.end();
        return;
      }

      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end([
        '<html><head><link rel="stylesheet" href="/site.css"></head><body>',
        '<h1>Private Workspace</h1>',
        '<a href="/private/next">Next</a>',
        '<img src="/hero.png" alt="Hero">',
        '<script>localStorage.setItem("session", "active");</script>',
        '</body></html>',
      ].join(''));
      return;
    }

    if (request.url === '/private/next') {
      if (!isAuthed) {
        response.writeHead(302, { Location: '/login' });
        response.end();
        return;
      }

      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<html><body><h1>Next Private Page</h1></body></html>');
      return;
    }

    if (request.url === '/browser') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end([
        '<html><head><script>',
        'window.addEventListener("DOMContentLoaded", () => {',
        '  const link = document.createElement("a");',
        '  link.href = "/dynamic";',
        '  link.textContent = "Dynamic";',
        '  document.body.appendChild(link);',
        '});',
        '</script></head><body><h1>Browser Root</h1></body></html>',
      ].join(''));
      return;
    }

    if (request.url === '/dynamic') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<html><body><h1>Dynamic Page</h1></body></html>');
      return;
    }

    if (request.url === '/actions') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end([
        '<html><body style="min-height: 2200px;">',
        '<div id="cookie-banner"><button id="dismiss-banner" type="button" onclick="this.parentElement.remove()">Dismiss</button></div>',
        '<button id="reveal-link" type="button">Reveal</button>',
        '<a class="pager" href="/page/2">Page 2</a>',
        '<script>',
        'document.getElementById("reveal-link").addEventListener("click", () => {',
        '  if (document.getElementById("revealed-link")) return;',
        '  const link = document.createElement("a");',
        '  link.id = "revealed-link";',
        '  link.href = "/revealed";',
        '  link.textContent = "Revealed";',
        '  document.body.appendChild(link);',
        '});',
        'window.addEventListener("scroll", () => {',
        '  if (window.scrollY < 200 || document.getElementById("scrolled-link")) return;',
        '  const link = document.createElement("a");',
        '  link.id = "scrolled-link";',
        '  link.href = "/scrolled";',
        '  link.textContent = "Scrolled";',
        '  document.body.appendChild(link);',
        '});',
        '</script>',
        '</body></html>',
      ].join(''));
      return;
    }

    if (request.url === '/revealed') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<html><body><h1>Revealed Page</h1></body></html>');
      return;
    }

    if (request.url === '/scrolled') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<html><body><h1>Scrolled Page</h1></body></html>');
      return;
    }

    if (request.url === '/page/2') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<html><body><h1>Page Two</h1></body></html>');
      return;
    }

    if (request.url === '/site.css') {
      response.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      response.end('body { color: #123456; }');
      return;
    }

    if (request.url === '/hero.png') {
      response.writeHead(200, { 'Content-Type': 'image/png' });
      response.end(pngBuffer);
      return;
    }

    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end('<html><body><h1>Home</h1></body></html>');
  });
}

async function withFixtureServer(callback) {
  const server = createFixtureServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await callback(baseUrl);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('authenticated browser capture logs in and saves workspace state', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webarsenal-auth-'));

  await withFixtureServer(async (baseUrl) => {
    const result = await runModule(getModuleById('scrapers/authenticated-browser-capture'), {
      url: `${baseUrl}/private`,
      loginUrl: `${baseUrl}/login`,
      username: 'demo',
      password: 'secret',
      usernameSelector: '#username',
      passwordSelector: '#password',
      submitSelector: '#submit',
      waitFor: 'h1',
      outputDir: path.join(tempDir, 'auth-workspace'),
      pageLimit: 2,
      depth: 1,
      scroll: true,
    });

    assert.equal(result.status, 'ok');
    assert.equal(result.crawledPages >= 1, true);
    assert.ok(fs.existsSync(path.join(result.workspaceDir, 'meta', 'storage-state.json')));
    const preview = fs.readFileSync(path.join(result.workspaceDir, 'html', 'editable-preview.html'), 'utf8');
    assert.match(preview, /Private Workspace/);
  });
});

test('login session recorder saves reusable auth artifacts', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webarsenal-session-'));

  await withFixtureServer(async (baseUrl) => {
    const result = await runModule(getModuleById('auth-helpers/login-session-recorder'), {
      url: `${baseUrl}/private`,
      loginUrl: `${baseUrl}/login`,
      username: 'demo',
      password: 'secret',
      usernameSelector: '#username',
      passwordSelector: '#password',
      submitSelector: '#submit',
      waitFor: 'h1',
      outputDir: path.join(tempDir, 'session-profile'),
    });

    assert.equal(result.status, 'ok');
    assert.equal(result.loggedIn, true);
    assert.ok(fs.existsSync(result.profilePath));
    assert.ok(fs.existsSync(result.storageStatePath));
    assert.ok(fs.existsSync(result.cookiesPath));
    assert.ok(fs.existsSync(result.localStoragePath));
    assert.ok(fs.existsSync(result.sessionStoragePath));
    assert.ok(fs.existsSync(result.htmlSnapshotPath));
  });
});

test('browser site crawler discovers JS-injected links and diff/qa tools work', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webarsenal-browser-'));

  await withFixtureServer(async (baseUrl) => {
    const workspaceDir = path.join(tempDir, 'browser-workspace');
    const crawlResult = await runModule(getModuleById('scrapers/browser-site-crawler'), {
      url: `${baseUrl}/browser`,
      outputDir: workspaceDir,
      pageLimit: 2,
      depth: 1,
      scroll: true,
    });

    assert.equal(crawlResult.status, 'ok');
    assert.equal(crawlResult.crawledPages >= 2, true);
    assert.ok(fs.existsSync(path.join(workspaceDir, 'pages', 'index.html')));

    const cssFile = path.join(workspaceDir, 'css', 'site.css');
    if (fs.existsSync(cssFile)) {
      fs.appendFileSync(cssFile, '\nbody { background: #ffffff; }\n', 'utf8');
    } else {
      fs.writeFileSync(cssFile, 'body { background: #ffffff; }\n', 'utf8');
    }

    const diffResult = await runModule(getModuleById('utils/workspace-diff-builder'), {
      dir: workspaceDir,
    });
    assert.equal(diffResult.status, 'ok');
    assert.equal(diffResult.summary.changed + diffResult.summary.added >= 1, true);
    assert.ok(fs.existsSync(path.join(workspaceDir, 'rebuild', 'changed')));

    const qaResult = await runModule(getModuleById('utils/workspace-qa-validator'), {
      dir: workspaceDir,
      timeout: 15000,
    });
    assert.equal(qaResult.status, 'ok');
    assert.equal(qaResult.missingAssetCount, 0);
    assert.equal(qaResult.visualComparison, null);
  });
});

test('browser action crawler follows click, scroll, and pagination routes', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webarsenal-actions-'));

  await withFixtureServer(async (baseUrl) => {
    const workspaceDir = path.join(tempDir, 'action-workspace');
    const crawlResult = await runModule(getModuleById('scrapers/browser-action-crawler'), {
      url: `${baseUrl}/actions`,
      outputDir: workspaceDir,
      pageLimit: 4,
      depth: 1,
      dismissSelectors: '#dismiss-banner',
      clickSelectors: '#reveal-link',
      paginationSelector: '.pager',
      scroll: true,
      scrollSteps: 3,
      timeout: 15000,
    });

    assert.equal(crawlResult.status, 'ok');
    assert.equal(crawlResult.crawledPages >= 4, true);
    assert.equal(crawlResult.visitedUrls.some((url) => url.includes('/revealed')), true);
    assert.equal(crawlResult.visitedUrls.some((url) => url.includes('/page/2')), true);
    assert.equal(crawlResult.visitedUrls.some((url) => url.includes('/scrolled')), true);

    fs.writeFileSync(path.join(workspaceDir, 'js', 'broken.js'), 'function () {\n', 'utf8');

    const integrityResult = await runModule(getModuleById('utils/workspace-integrity-validator'), {
      dir: workspaceDir,
    });
    assert.equal(integrityResult.status, 'ok');
    assert.equal(integrityResult.summary.jsIssues >= 1, true);
    assert.ok(fs.existsSync(path.join(workspaceDir, 'meta', 'integrity-report.json')));

    const packageResult = await runModule(getModuleById('exporters/cloned-site-package-exporter'), {
      dir: workspaceDir,
    });
    assert.equal(packageResult.status, 'ok');
    assert.ok(fs.existsSync(path.join(packageResult.siteRoot, 'index.html')));
    assert.ok(fs.existsSync(path.join(packageResult.siteRoot, 'html', 'editable-preview.html')));
    assert.ok(fs.existsSync(packageResult.manifestPath));
    assert.ok(fs.existsSync(packageResult.archivePath));
  });
});
