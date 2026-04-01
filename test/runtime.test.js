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

const FIXTURE_HTML = `<!doctype html>
<html>
  <head>
    <title>Fixture Page</title>
    <meta name="description" content="Fixture description">
    <link rel="canonical" href="https://example.com/fixture">
  </head>
  <body>
    <h1>Fixture Heading</h1>
    <h2>Section Heading</h2>
    <a href="/docs">Docs</a>
    <a href="https://openai.com/">OpenAI</a>
    <img src="/hero.png" alt="Hero image">
    <form action="/login" method="post">
      <input name="email" type="email">
      <input name="password" type="password">
    </form>
    <p>hello@example.com</p>
  </body>
</html>`;

function createServer() {
  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(FIXTURE_HTML);
  });

  return server;
}

async function withServer(callback) {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/`;

  try {
    await callback(url);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('scraper and analyzer modules return structured results', async () => {
  await withServer(async (url) => {
    const scraperResult = await runModule(getModuleById('scrapers/spa-scraper'), { url, limit: 5 });
    assert.equal(scraperResult.status, 'ok');
    assert.equal(scraperResult.summary.linkCount, 2);
    assert.equal(scraperResult.data.title, 'Fixture Page');

    const analyzerResult = await runModule(getModuleById('analyzers/seo-auditor'), { url });
    assert.equal(analyzerResult.status, 'ok');
    assert.equal(analyzerResult.summary.headingCount, 2);
    assert.equal(analyzerResult.score, 100);
  });
});

test('exporter, monitor, auth, integration, and utility modules run without error', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webarsenal-'));
  const jsonPath = path.join(tempDir, 'records.json');
  const csvPath = path.join(tempDir, 'records.csv');
  const sqlitePath = path.join(tempDir, 'records.sqlite');
  const statePath = path.join(tempDir, 'change-state.json');

  fs.writeFileSync(jsonPath, JSON.stringify([{ name: 'alpha', url: 'https://example.com' }], null, 2));

  const exportResult = await runModule(getModuleById('exporters/to-csv'), {
    input: jsonPath,
    output: csvPath,
  });
  assert.equal(exportResult.status, 'ok');
  assert.equal(fs.existsSync(csvPath), true);

  const sqliteResult = await runModule(getModuleById('exporters/to-sqlite'), {
    input: jsonPath,
    output: sqlitePath,
  });
  assert.equal(sqliteResult.status, 'ok');
  assert.equal(fs.existsSync(sqlitePath), true);

  await withServer(async (url) => {
    const monitorFirst = await runModule(getModuleById('monitors/change-detector'), {
      url,
      stateFile: statePath,
    });
    assert.equal(monitorFirst.changed, true);

    const monitorSecond = await runModule(getModuleById('monitors/change-detector'), {
      url,
      stateFile: statePath,
    });
    assert.equal(monitorSecond.changed, false);
  });

  const authResult = await runModule(getModuleById('auth-helpers/totp-generator'), {
    secret: 'shared-secret',
  });
  assert.match(authResult.otp, /^\d{6}$/);

  const integrationResult = await runModule(getModuleById('integrations/slack-alerter'), {
    message: 'Toolkit complete',
  });
  assert.equal(integrationResult.status, 'dry-run');

  const utilityResult = await runModule(getModuleById('utils/url-normalizer'), {
    url: 'https://example.com?b=2&a=1#fragment',
  });
  assert.equal(utilityResult.normalizedUrl, 'https://example.com/?a=1&b=2');
});
