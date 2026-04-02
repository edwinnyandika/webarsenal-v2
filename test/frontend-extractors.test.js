'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawnSync } = require('node:child_process');
const { spawn } = require('node:child_process');
const { getModuleById } = require('../lib/module-catalog');
const { runModule } = require('../lib/module-runner');

test('html-css-js scraper extracts html, css, and js from local input', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webarsenal-frontend-'));
  const htmlPath = path.join(tempDir, 'fixture.html');
  const cssPath = path.join(tempDir, 'site.css');
  const jsPath = path.join(tempDir, 'site.js');
  const outputDir = path.join(tempDir, 'workspace');

  fs.writeFileSync(cssPath, [
    ':root { --brand: #123456; }',
    '@font-face { font-family: "Fixture Sans"; src: url("fixture.woff2") format("woff2"); }',
    '.hero { color: #aa2200; font-family: "Fixture Sans"; }',
  ].join('\n'), 'utf8');

  fs.writeFileSync(jsPath, [
    'fetch("/api/demo", { method: "POST" });',
    'axios.get("/api/list");',
  ].join('\n'), 'utf8');

  fs.writeFileSync(htmlPath, [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<title>Fixture</title>',
    '<link rel="stylesheet" href="site.css">',
    '<style>:root { --brand: #123456; } .hero { color: red; } @media screen and (max-width: 600px) { .hero { color: blue; } }</style>',
    '</head>',
    '<body>',
    '<!-- hero section -->',
    '<section id="hero-block" class="hero card hero" style="padding: 10px">Hello world</section>',
    '<section class="hero card">Another hero</section>',
    '<script src="site.js"></script>',
    '<script>const route = "/api/demo"; const framework = "React";</script>',
    '</body>',
    '</html>',
  ].join('\n'), 'utf8');

  const result = spawnSync(process.execPath, ['scrapers/html-css-js-scraper.js', '--input', htmlPath, '--output-dir', outputDir, '--json'], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);

  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.status, 'ok');
  assert.equal(parsed.summary.stylesheetCount, 1);
  assert.equal(parsed.summary.scriptCount, 1);
  assert.equal(parsed.data.html.comments[0], 'hero section');
  assert.equal(parsed.data.css.stylesheets.length, 1);
  assert.equal(parsed.data.css.inlineStyles.length, 1);
  assert.equal(parsed.data.js.scripts.length, 1);
  assert.equal(parsed.data.js.inlineScripts.length, 1);
  assert.equal(parsed.workspaceDir, outputDir);
  assert.ok(fs.existsSync(path.join(outputDir, 'html', 'index.html')));
  assert.ok(fs.existsSync(path.join(outputDir, 'html', 'editable-preview.html')));
  assert.ok(fs.existsSync(path.join(outputDir, 'css', 'site.css')));
  assert.ok(fs.existsSync(path.join(outputDir, 'css', 'inline-style-1.css')));
  assert.ok(fs.existsSync(path.join(outputDir, 'js', 'site.js')));
  assert.ok(fs.existsSync(path.join(outputDir, 'js', 'inline-script-1.js')));
  assert.ok(fs.existsSync(path.join(outputDir, 'meta', 'manifest.json')));
  assert.ok(fs.existsSync(path.join(outputDir, '.vscode', 'settings.json')));
  assert.ok(fs.existsSync(path.join(outputDir, '.vscode', 'extensions.json')));

  const editablePreview = fs.readFileSync(path.join(outputDir, 'html', 'editable-preview.html'), 'utf8');
  assert.match(editablePreview, /\.\.\/css\/site\.css/);
  assert.match(editablePreview, /\.\.\/js\/site\.js/);
});

test('frontend analysis extractors expose colors, api calls, and components', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webarsenal-analysis-'));
  const htmlPath = path.join(tempDir, 'fixture.html');
  const cssPath = path.join(tempDir, 'site.css');
  const jsPath = path.join(tempDir, 'site.js');

  fs.writeFileSync(cssPath, [
    ':root { --brand: #123456; --accent: rgb(0, 128, 255); }',
    '.hero { color: #aa2200; font-family: "Fixture Sans"; }',
  ].join('\n'), 'utf8');
  fs.writeFileSync(jsPath, [
    'fetch("/api/demo", { method: "POST" });',
    'axios.get("/api/list");',
  ].join('\n'), 'utf8');
  fs.writeFileSync(htmlPath, [
    '<html><head><link rel="stylesheet" href="site.css"></head><body>',
    '<div id="hero" class="hero card">One</div>',
    '<div id="hero-secondary" class="hero card">Two</div>',
    '<script src="site.js"></script>',
    '</body></html>',
  ].join('\n'), 'utf8');

  const colorResult = spawnSync(process.execPath, ['scrapers/css-color-token-extractor.js', '--input', htmlPath, '--json'], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
  });
  assert.equal(colorResult.status, 0, colorResult.stderr);
  const colors = JSON.parse(colorResult.stdout);
  assert.equal(colors.status, 'ok');
  assert.match(JSON.stringify(colors.data.colors), /#123456/);

  const apiResult = spawnSync(process.execPath, ['scrapers/js-api-call-extractor.js', '--input', htmlPath, '--json'], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
  });
  assert.equal(apiResult.status, 0, apiResult.stderr);
  const apiCalls = JSON.parse(apiResult.stdout);
  assert.equal(apiCalls.status, 'ok');
  assert.match(JSON.stringify(apiCalls.data.apiCalls), /\/api\/demo/);
  assert.match(JSON.stringify(apiCalls.data.apiCalls), /\/api\/list/);

  const componentResult = spawnSync(process.execPath, ['scrapers/component-class-extractor.js', '--input', htmlPath, '--json'], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
  });
  assert.equal(componentResult.status, 0, componentResult.stderr);
  const components = JSON.parse(componentResult.stdout);
  assert.equal(components.status, 'ok');
  assert.match(JSON.stringify(components.data.components), /hero/);
});

test('workspace preview server serves generated files', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webarsenal-serve-'));
  const htmlDir = path.join(tempDir, 'html');
  fs.mkdirSync(htmlDir, { recursive: true });
  fs.writeFileSync(path.join(htmlDir, 'index.html'), '<h1>Preview OK</h1>', 'utf8');

  const port = 4387;
  const child = spawn(process.execPath, ['tools/serve-workspace.js', '--dir', tempDir, '--port', String(port)], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'ignore',
  });

  try {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const body = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/`, (response) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => resolve(data));
      }).on('error', reject);
    });

    assert.match(body, /Preview OK/);
  } finally {
    child.kill();
  }
});

test('full site tools download pages, code, and images into a workspace', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webarsenal-site-'));
  const outputDir = path.join(tempDir, 'site-workspace');
  const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnSUs8AAAAASUVORK5CYII=', 'base64');
  const server = http.createServer((request, response) => {
    if (request.url === '/site.css') {
      response.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      response.end('.hero { background-image: url("/hero.png"); color: #123456; }');
      return;
    }

    if (request.url === '/site.js') {
      response.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      response.end('fetch("/api/demo");');
      return;
    }

    if (request.url === '/hero.png') {
      response.writeHead(200, { 'Content-Type': 'image/png' });
      response.end(pngBuffer);
      return;
    }

    if (request.url === '/about') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<html><head><link rel="stylesheet" href="/site.css"></head><body><a href="/">Home</a><img src="/hero.png" alt="Hero"></body></html>');
      return;
    }

    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end([
      '<html>',
      '<head><link rel="stylesheet" href="/site.css"><script src="/site.js"></script></head>',
      '<body>',
      '<a href="/about">About</a>',
      '<img src="/hero.png" alt="Hero">',
      '<section class="hero">Welcome</section>',
      '</body>',
      '</html>',
    ].join(''));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/`;

  try {
    const parsed = await runModule(getModuleById('scrapers/full-site-workspace-builder'), {
      url,
      outputDir,
      pageLimit: 2,
      depth: 1,
    });
    assert.equal(parsed.status, 'ok');
    assert.equal(parsed.crawledPages >= 2, true);
    assert.equal(parsed.downloadedAssets >= 1, true);
    assert.ok(fs.existsSync(path.join(outputDir, 'html', 'editable-preview.html')));
    assert.ok(fs.existsSync(path.join(outputDir, 'css', 'site.css')));
    assert.ok(fs.existsSync(path.join(outputDir, 'js', 'site.js')));
    assert.ok(fs.existsSync(path.join(outputDir, 'images', 'hero.png')));
    assert.ok(fs.existsSync(path.join(outputDir, 'pages', 'index.html')));
    const manifest = JSON.parse(fs.readFileSync(path.join(outputDir, 'meta', 'manifest.json'), 'utf8'));
    assert.equal(Array.isArray(manifest.pages), true);
    assert.equal(manifest.pages.length >= 2, true);
  } finally {
    server.close();
  }
});
