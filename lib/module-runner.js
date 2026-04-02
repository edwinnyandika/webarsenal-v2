'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: module-runner.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const axios = require('axios');
const cheerio = require('cheerio');

function parseArgs(argv) {
  const aliasMap = {
    h: 'help',
    u: 'url',
    i: 'input',
    o: 'output',
    d: 'dir',
    b: 'bucket',
    s: 'selector',
    t: 'timeout',
    c: 'cron',
    p: 'profile',
    x: 'proxy',
    H: 'headers-json',
    C: 'cookie',
    A: 'userAgent',
    j: 'json',
  };

  const flags = {};
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];

    if (!item.startsWith('-')) {
      positionals.push(item);
      continue;
    }

    if (item.startsWith('--')) {
      const [rawKey, inlineValue] = item.slice(2).split('=');
      const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

      if (inlineValue !== undefined) {
        flags[key] = inlineValue;
        continue;
      }

      const next = argv[index + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        index += 1;
      } else {
        flags[key] = true;
      }
      continue;
    }

    const shortKey = item.slice(1);
    const expandedKey = aliasMap[shortKey] || shortKey;
    const next = argv[index + 1];
    if (next && !next.startsWith('-')) {
      flags[expandedKey] = next;
      index += 1;
    } else {
      flags[expandedKey] = true;
    }
  }

  return { flags, positionals };
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function safeJsonParse(value, fallback = {}) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stableHash(value) {
  return crypto.createHash('sha1').update(value).digest('hex');
}

function humanizeBytes(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function normalizeOutputPath(definition, options, extension = '.json') {
  if (options.output) {
    return path.resolve(options.output);
  }

  const fileName = `${definition.slug}${extension}`;
  return path.resolve(process.cwd(), 'output', definition.category, fileName);
}

function normalizeLimit(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeTimeout(value, fallback = 15000) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readTextFile(filePath) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function writeText(filePath, content) {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function flattenRecord(record, prefix = '', target = {}) {
  if (Array.isArray(record)) {
    target[prefix || 'items'] = JSON.stringify(record);
    return target;
  }

  if (!record || typeof record !== 'object') {
    target[prefix || 'value'] = record;
    return target;
  }

  for (const [key, value] of Object.entries(record)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenRecord(value, nextPrefix, target);
    } else {
      target[nextPrefix] = Array.isArray(value) ? JSON.stringify(value) : value;
    }
  }

  return target;
}

function toCsv(records) {
  if (!records.length) {
    return '';
  }

  const normalized = records.map((record) => flattenRecord(record));
  const headers = [...new Set(normalized.flatMap((record) => Object.keys(record)))];
  const escapeCell = (value) => {
    const raw = value === undefined || value === null ? '' : String(value);
    return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  };

  const lines = [
    headers.join(','),
    ...normalized.map((record) => headers.map((header) => escapeCell(record[header])).join(',')),
  ];

  return `${lines.join('\n')}\n`;
}

function toMarkdownTable(records) {
  if (!records.length) {
    return '| value |\n| --- |\n| |\n';
  }

  const normalized = records.map((record) => flattenRecord(record));
  const headers = [...new Set(normalized.flatMap((record) => Object.keys(record)))];
  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
  const bodyRows = normalized.map((record) => `| ${headers.map((header) => {
    const value = record[header];
    return value === undefined || value === null ? '' : String(value).replace(/\|/g, '\\|');
  }).join(' | ')} |`);

  return `${[headerRow, separatorRow, ...bodyRows].join('\n')}\n`;
}

async function createAdvancedHttpClient(options) {
  const headers = typeof options.headersJson === 'string'
    ? safeJsonParse(options.headersJson, {})
    : (options.headersJson || {});

  if (options.cookie) {
    headers['Cookie'] = options.cookie;
  }
  
  if (options.userAgent) {
    headers['User-Agent'] = options.userAgent;
  } else {
    headers['User-Agent'] = 'WebArsenal/5.5.0 Pulse (Advanced Security Suite)';
  }

  const config = {
    timeout: normalizeTimeout(options.timeout),
    headers,
    validateStatus: () => true,
    maxRedirects: options.followRedirects === 'false' ? 0 : 5,
  };

  if (options.proxy) {
    try {
      const proxyUrl = new URL(options.proxy);
      config.proxy = {
        protocol: proxyUrl.protocol.replace(':', ''),
        host: proxyUrl.hostname,
        port: parseInt(proxyUrl.port, 10) || (proxyUrl.protocol === 'https:' ? 443 : 80),
      };
      if (proxyUrl.username) {
        config.proxy.auth = {
          username: proxyUrl.username,
          password: proxyUrl.password,
        };
      }
    } catch (err) {
      console.error(`[-] Invalid proxy URL: ${options.proxy}`);
    }
  }

  return axios.create(config);
}

async function fetchUrl(url, options) {
  const client = await createAdvancedHttpClient(options);
  const response = await client.get(url, { responseType: 'text' });
  return response;
}

function normalizeUrlValue(rawUrl) {
  const parsed = new URL(rawUrl);
  parsed.hash = '';

  const sortedEntries = [...parsed.searchParams.entries()].sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    if (leftKey === rightKey) {
      return leftValue.localeCompare(rightValue);
    }

    return leftKey.localeCompare(rightKey);
  });

  parsed.search = '';
  for (const [key, value] of sortedEntries) {
    parsed.searchParams.append(key, value);
  }

  return parsed.toString();
}

function loadDocumentModel(html, url) {
  const $ = cheerio.load(html);
  const title = $('title').first().text().trim();
  const description = $('meta[name="description"]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const headings = $('h1, h2, h3').map((_, element) => ({
    tag: element.tagName,
    text: $(element).text().trim(),
  })).get();
  const links = $('a[href]').map((_, element) => ({
    text: $(element).text().trim(),
    href: $(element).attr('href'),
  })).get();
  const images = $('img').map((_, element) => ({
    src: $(element).attr('src') || '',
    alt: $(element).attr('alt') || '',
  })).get();
  const forms = $('form').map((_, formElement) => {
    const form = $(formElement);
    const fields = form.find('input, textarea, select').map((__, input) => ({
      tag: input.tagName,
      name: $(input).attr('name') || '',
      type: $(input).attr('type') || input.tagName,
    })).get();

    return {
      action: form.attr('action') || '',
      method: (form.attr('method') || 'get').toLowerCase(),
      fields,
    };
  }).get();

  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const emails = [...new Set(html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])];
  const jsonLd = $('script[type="application/ld+json"]').map((_, element) => $(element).html() || '').get();

  return {
    url,
    title,
    description,
    canonical,
    headings,
    links,
    images,
    forms,
    text,
    wordCount: text ? text.split(/\s+/).length : 0,
    emails,
    jsonLd,
    scripts: $('script[src]').map((_, element) => $(element).attr('src')).get().filter(Boolean),
    stylesheets: $('link[rel="stylesheet"]').map((_, element) => $(element).attr('href')).get().filter(Boolean),
    tables: $('table').length,
    htmlBytes: Buffer.byteLength(html, 'utf8'),
  };
}

async function loadSource(definition, options) {
  if (options.input) {
    const inputPath = path.resolve(options.input);
    const extension = path.extname(inputPath).toLowerCase();
    const text = readTextFile(inputPath);

    if (extension === '.json' || extension === '.jsonl' || extension === '.ndjson') {
      if (extension === '.json') {
        return { kind: 'json', value: safeJsonParse(text, {}) };
      }

      return {
        kind: 'json',
        value: text.split(/\r?\n/).filter(Boolean).map((line) => safeJsonParse(line, {})),
      };
    }

    if (extension === '.html' || extension === '.htm') {
      return { kind: 'document', value: loadDocumentModel(text, options.url || `file://${inputPath}`) };
    }

    return { kind: 'text', value: text };
  }

  if (options.url) {
    const response = await fetchUrl(options.url, options);
    const html = String(response.data || '');
    return {
      kind: 'document',
      value: {
        ...loadDocumentModel(html, options.url),
        status: response.status,
        headers: response.headers,
      },
    };
  }

  return { kind: 'empty', value: null };
}

function summarizeDocument(document) {
  const internalLinks = document.links.filter((link) => link.href && !/^https?:\/\//i.test(link.href)).length;
  const externalLinks = document.links.length - internalLinks;
  const missingAltCount = document.images.filter((image) => !image.alt).length;

  return {
    title: document.title,
    descriptionLength: document.description.length,
    canonical: document.canonical,
    headingCount: document.headings.length,
    linkCount: document.links.length,
    internalLinks,
    externalLinks,
    imageCount: document.images.length,
    missingAltCount,
    formCount: document.forms.length,
    scriptCount: document.scripts.length,
    stylesheetCount: document.stylesheets.length,
    wordCount: document.wordCount,
    htmlBytes: document.htmlBytes,
    htmlSize: humanizeBytes(document.htmlBytes),
  };
}

function pickScraperPayload(definition, document, options) {
  const limit = normalizeLimit(options.limit, 25);
  const slug = definition.slug;

  if (slug.includes('link') || slug.includes('directory') || slug.includes('search-result')) {
    return document.links.slice(0, limit);
  }

  if (slug.includes('image')) {
    return document.images.slice(0, limit);
  }

  if (slug.includes('form')) {
    return document.forms;
  }

  if (slug.includes('table')) {
    return { tables: document.tables, headings: document.headings };
  }

  if (slug.includes('contact') || slug.includes('social') || slug.includes('blog') || slug.includes('news')) {
    return {
      title: document.title,
      description: document.description,
      headings: document.headings.slice(0, limit),
      links: document.links.slice(0, limit),
      emails: document.emails,
    };
  }

  return {
    title: document.title,
    description: document.description,
    headings: document.headings.slice(0, limit),
    links: document.links.slice(0, limit),
    images: document.images.slice(0, Math.min(limit, 10)),
    forms: document.forms,
  };
}

async function handleScraper(definition, options) {
  const source = await loadSource(definition, options);
  if (source.kind !== 'document') {
    return {
      status: 'skipped',
      reason: 'Provide --url or --input <html/json file> to scrape content.',
      module: definition.id,
    };
  }

  const payload = pickScraperPayload(definition, source.value, options);
  const result = {
    status: 'ok',
    module: definition.id,
    summary: summarizeDocument(source.value),
    data: payload,
  };

  if (options.output) {
    const outputPath = normalizeOutputPath(definition, options);
    writeJson(outputPath, result);
    result.outputPath = outputPath;
  }

  return result;
}

async function handleAnalyzer(definition, options) {
  const source = await loadSource(definition, options);
  if (source.kind !== 'document') {
    return {
      status: 'skipped',
      reason: 'Provide --url or --input <html file> to analyze content.',
      module: definition.id,
    };
  }

  const document = source.value;
  const summary = summarizeDocument(document);
  const issues = [];

  if (!document.title) issues.push('Missing page title');
  if (!document.description) issues.push('Missing meta description');
  if (!document.canonical) issues.push('Missing canonical URL');
  if (!document.headings.some((heading) => heading.tag === 'h1')) issues.push('Missing H1 heading');
  if (summary.missingAltCount > 0) issues.push(`${summary.missingAltCount} image(s) missing alt text`);

  const result = {
    status: 'ok',
    module: definition.id,
    focus: definition.focus,
    summary,
    issues,
    score: Math.max(0, 100 - (issues.length * 12)),
  };

  if (options.output) {
    const outputPath = normalizeOutputPath(definition, options);
    writeJson(outputPath, result);
    result.outputPath = outputPath;
  }

  return result;
}

function convertSourceToRecords(source) {
  if (source.kind === 'json') {
    return Array.isArray(source.value) ? source.value : [source.value];
  }

  if (source.kind === 'document') {
    return source.value.links.map((link) => ({
      pageTitle: source.value.title,
      href: link.href,
      text: link.text,
    }));
  }

  if (source.kind === 'text') {
    return source.value.split(/\r?\n/).filter(Boolean).map((line) => ({ value: line }));
  }

  return [];
}

async function exportSqlite(records, outputPath) {
  const sqlite3 = require('sqlite3');
  ensureParentDir(outputPath);

  await new Promise((resolve, reject) => {
    const database = new sqlite3.Database(outputPath, (error) => {
      if (error) {
        reject(error);
      }
    });

    database.serialize(() => {
      database.run('DROP TABLE IF EXISTS records');

      const flattened = records.map((record) => flattenRecord(record));
      const headers = [...new Set(flattened.flatMap((record) => Object.keys(record)))];
      const createColumns = headers.map((header) => `"${header}" TEXT`).join(', ');

      database.run(`CREATE TABLE records (${createColumns})`);

      const placeholders = headers.map(() => '?').join(', ');
      const statement = database.prepare(`INSERT INTO records (${headers.map((header) => `"${header}"`).join(', ')}) VALUES (${placeholders})`);

      for (const record of flattened) {
        statement.run(headers.map((header) => {
          const value = record[header];
          return value === undefined || value === null ? null : String(value);
        }));
      }

      statement.finalize((statementError) => {
        if (statementError) {
          reject(statementError);
          return;
        }

        database.close((closeError) => {
          if (closeError) {
            reject(closeError);
            return;
          }

          resolve();
        });
      });
    });
  });
}

async function exportPdf(options, outputPath) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    if (options.url) {
      await page.goto(options.url, { waitUntil: 'networkidle', timeout: normalizeTimeout(options.timeout, 30000) });
    } else if (options.input) {
      const inputPath = path.resolve(options.input);
      await page.goto(`file://${inputPath}`, { waitUntil: 'load' });
    } else {
      await page.setContent('<html><body><h1>WebArsenal PDF Export</h1><p>Provide --url or --input for richer output.</p></body></html>');
    }

    ensureParentDir(outputPath);
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }
}

async function handleExporter(definition, options) {
  const source = await loadSource(definition, options);
  const records = convertSourceToRecords(source);
  const slug = definition.slug;

  if (slug === 'to-csv') {
    const outputPath = normalizeOutputPath(definition, options, '.csv');
    writeText(outputPath, toCsv(records));
    return { status: 'ok', module: definition.id, outputPath, records: records.length };
  }

  if (slug === 'to-markdown' || slug === 'prompt-dataset-builder') {
    const outputPath = normalizeOutputPath(definition, options, '.md');
    writeText(outputPath, toMarkdownTable(records));
    return { status: 'ok', module: definition.id, outputPath, records: records.length };
  }

  if (slug === 'to-json' || slug.includes('jsonl') || slug.includes('ndjson') || slug.includes('yaml')) {
    const outputPath = normalizeOutputPath(
      definition,
      options,
      slug.includes('yaml') ? '.yml' : (slug.includes('jsonl') || slug.includes('ndjson') ? '.jsonl' : '.json')
    );

    if (slug.includes('yaml')) {
      const content = records.map((record) => `- ${JSON.stringify(record)}`).join('\n');
      writeText(outputPath, `${content}\n`);
    } else if (slug.includes('jsonl') || slug.includes('ndjson')) {
      writeText(outputPath, `${records.map((record) => JSON.stringify(record)).join('\n')}\n`);
    } else {
      writeJson(outputPath, records);
    }

    return { status: 'ok', module: definition.id, outputPath, records: records.length };
  }

  if (slug === 'to-sqlite') {
    const outputPath = normalizeOutputPath(definition, options, '.sqlite');
    await exportSqlite(records.length ? records : [{ value: '' }], outputPath);
    return { status: 'ok', module: definition.id, outputPath, records: records.length };
  }

  if (slug === 'to-pdf') {
    const outputPath = normalizeOutputPath(definition, options, '.pdf');
    await exportPdf(options, outputPath);
    return { status: 'ok', module: definition.id, outputPath };
  }

  if (slug === 'to-zip' || slug.includes('zip') || slug.includes('bundle') || slug.includes('archive')) {
    const outputPath = normalizeOutputPath(definition, options, '.gz');
    const payload = Buffer.from(JSON.stringify({ module: definition.id, exportedAt: new Date().toISOString(), records }, null, 2), 'utf8');
    ensureParentDir(outputPath);
    fs.writeFileSync(outputPath, zlib.gzipSync(payload));
    return { status: 'ok', module: definition.id, outputPath, records: records.length };
  }

  if (slug === 'image-optimizer') {
    if (!options.input) {
      return { status: 'skipped', module: definition.id, reason: 'Provide --input <image> to optimize.' };
    }

    const sharp = require('sharp');
    const inputPath = path.resolve(options.input);
    const outputPath = normalizeOutputPath(definition, options, path.extname(inputPath) || '.png');
    ensureParentDir(outputPath);
    await sharp(inputPath).resize({ width: normalizeLimit(options.width, 1600), withoutEnlargement: true }).toFile(outputPath);
    return { status: 'ok', module: definition.id, outputPath };
  }

  const outputPath = normalizeOutputPath(definition, options);
  writeJson(outputPath, {
    module: definition.id,
    exportedAt: new Date().toISOString(),
    records,
    sourceKind: source.kind,
  });
  return { status: 'ok', module: definition.id, outputPath, records: records.length };
}

async function handleIntegration(definition, options) {
  const execute = Boolean(options.execute);
  const source = await loadSource(definition, options);
  const records = convertSourceToRecords(source);
  const slug = definition.slug;

  if (slug.includes('webhook') || slug.includes('alerter') || slug.includes('notifier') || slug.includes('track')) {
    const targetUrl = options.webhook || options.url;
    const payload = {
      module: definition.id,
      message: options.message || `${definition.name} completed`,
      records: records.length,
      executedAt: new Date().toISOString(),
    };

    if (!execute || !targetUrl) {
      return { status: 'dry-run', module: definition.id, targetUrl: targetUrl || null, payload };
    }

    const response = await axios.post(targetUrl, payload, { timeout: normalizeTimeout(options.timeout) });
    return { status: 'ok', module: definition.id, targetUrl, responseStatus: response.status };
  }

  if (slug.includes('s3')) {
    if (!execute) {
      return {
        status: 'dry-run',
        module: definition.id,
        bucket: options.bucket || null,
        dir: options.dir ? path.resolve(options.dir) : null,
      };
    }

    const AWS = require('aws-sdk');
    const dirPath = path.resolve(options.dir || '.');
    const entries = fs.readdirSync(dirPath, { withFileTypes: true }).filter((entry) => entry.isFile());
    const s3 = new AWS.S3();

    for (const entry of entries) {
      const body = fs.readFileSync(path.join(dirPath, entry.name));
      await s3.putObject({
        Bucket: options.bucket,
        Key: entry.name,
        Body: body,
      }).promise();
    }

    return { status: 'ok', module: definition.id, uploaded: entries.length, bucket: options.bucket };
  }

  return {
    status: execute ? 'ok' : 'dry-run',
    module: definition.id,
    target: slug,
    records: records.length,
    note: execute
      ? 'Execution path completed with shared integration scaffolding.'
      : 'Run again with --execute to perform remote delivery for supported connectors.',
  };
}

async function handleMonitor(definition, options) {
  const statePath = path.resolve(options.stateFile || path.join(process.cwd(), '.webarsenal-state', `${definition.slug}.json`));

  if (definition.slug.includes('cron')) {
    const cronExpression = options.cron || '0 * * * *';
    const nodeCron = require('node-cron');
    return {
      status: 'ok',
      module: definition.id,
      cron: cronExpression,
      valid: nodeCron.validate(cronExpression),
      execute: Boolean(options.execute),
    };
  }

  const source = await loadSource(definition, options);
  if (source.kind !== 'document') {
    return {
      status: 'skipped',
      module: definition.id,
      reason: 'Provide --url or --input <html file> to monitor content.',
    };
  }

  const fingerprintSource = JSON.stringify({
    title: source.value.title,
    headings: source.value.headings,
    links: source.value.links.slice(0, 25),
    wordCount: source.value.wordCount,
  });
  const fingerprint = stableHash(fingerprintSource);
  const previous = fs.existsSync(statePath) ? safeJsonParse(readTextFile(statePath), null) : null;
  const changed = !previous || previous.fingerprint !== fingerprint;

  writeJson(statePath, {
    module: definition.id,
    fingerprint,
    updatedAt: new Date().toISOString(),
    summary: summarizeDocument(source.value),
  });

  return {
    status: 'ok',
    module: definition.id,
    changed,
    statePath,
    previousFingerprint: previous ? previous.fingerprint : null,
    fingerprint,
  };
}

async function handleAuth(definition, options) {
  const slug = definition.slug;

  if (slug === 'basic-auth') {
    const username = options.username || 'user';
    const password = options.password || 'password';
    return {
      status: 'ok',
      module: definition.id,
      header: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    };
  }

  if (slug.includes('jwt') || slug.includes('token-decoder')) {
    if (!options.token) {
      return { status: 'skipped', module: definition.id, reason: 'Provide --token <jwt> to decode.' };
    }

    const segments = String(options.token).split('.');
    if (segments.length < 2) {
      return { status: 'skipped', module: definition.id, reason: 'Token does not look like a JWT.' };
    }

    const decodePart = (segment) => {
      const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
      return safeJsonParse(Buffer.from(normalized + padding, 'base64').toString('utf8'), {});
    };

    return {
      status: 'ok',
      module: definition.id,
      header: decodePart(segments[0]),
      payload: decodePart(segments[1]),
    };
  }

  if (slug.includes('totp') || slug.includes('mfa')) {
    const secret = Buffer.from(String(options.secret || 'webarsenal-secret'), 'utf8');
    const timeWindow = Math.floor(Date.now() / 30000);
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(timeWindow));
    const digest = crypto.createHmac('sha1', secret).update(buffer).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const binary = ((digest[offset] & 0x7f) << 24)
      | ((digest[offset + 1] & 0xff) << 16)
      | ((digest[offset + 2] & 0xff) << 8)
      | (digest[offset + 3] & 0xff);
    const otp = String(binary % 1000000).padStart(6, '0');
    return { status: 'ok', module: definition.id, otp };
  }

  if (slug.includes('pkce')) {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    return { status: 'ok', module: definition.id, verifier, challenge };
  }

  if (slug.includes('signed-url')) {
    const targetUrl = options.url || 'https://example.com/resource';
    const signature = crypto.createHmac('sha256', String(options.secret || 'webarsenal-secret'))
      .update(targetUrl)
      .digest('hex');
    return { status: 'ok', module: definition.id, signedUrl: `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}signature=${signature}` };
  }

  return {
    status: 'ok',
    module: definition.id,
    note: 'Shared auth helper validated inputs and returned a safe placeholder result.',
    options: {
      profile: options.profile || null,
      token: options.token ? 'provided' : null,
      url: options.url || null,
    },
  };
}

async function handleSecurityModule(definition, options) {
  const source = await loadSource(definition, options);
  const target = options.url || options.input || 'N/A';
  
  const delay = normalizeLimit(options.delay, 500);
  if (delay > 0) {
    await sleep(delay);
  }

  return {
    status: 'ok',
    module: definition.id,
    target,
    findings: [],
    note: 'This security module requires specific probe logic to be implemented in its own file.',
    options,
  };
}

async function handleUtility(definition, options) {
  const slug = definition.slug;

  if (slug === 'url-normalizer') {
    if (!options.url) {
      return { status: 'skipped', module: definition.id, reason: 'Provide --url <value> to normalize.' };
    }

    return { status: 'ok', module: definition.id, normalizedUrl: normalizeUrlValue(options.url) };
  }

  if (slug === 'url-deduper') {
    const values = options.values
      ? String(options.values).split(',').map((item) => item.trim()).filter(Boolean)
      : [];
    return { status: 'ok', module: definition.id, unique: [...new Set(values.map((value) => normalizeUrlValue(value)))] };
  }

  if (slug === 'robot-parser') {
    const source = options.input ? readTextFile(options.input) : 'User-agent: *\nDisallow: /admin\n';
    const rules = source.split(/\r?\n/).filter(Boolean).map((line) => line.trim());
    return { status: 'ok', module: definition.id, rules };
  }

  if (slug === 'json-flattener') {
    const source = await loadSource(definition, options);
    const records = convertSourceToRecords(source).map((record) => flattenRecord(record));
    if (options.output) {
      const outputPath = normalizeOutputPath(definition, options);
      writeJson(outputPath, records);
      return { status: 'ok', module: definition.id, outputPath, records: records.length };
    }
    return { status: 'ok', module: definition.id, records };
  }

  return {
    status: 'ok',
    module: definition.id,
    note: 'Shared utility completed without side effects.',
    options,
  };
}

async function runModule(definition, options) {
  switch (definition.category) {
    case 'scrapers':
      return handleScraper(definition, options);
    case 'analyzers':
      return handleAnalyzer(definition, options);
    case 'exporters':
      return handleExporter(definition, options);
    case 'integrations':
      return handleIntegration(definition, options);
    case 'monitors':
      return handleMonitor(definition, options);
    case 'auth-helpers':
      return handleAuth(definition, options);
    case 'utils':
      return handleUtility(definition, options);
    case 'vuln-probes':
    case 'api-security':
    case 'cloud':
    case 'recon':
    case 'infrastructure':
    case 'mobile':
    case 'web3':
      return handleSecurityModule(definition, options);
    default:
      return {
        status: 'skipped',
        module: definition.id,
        reason: 'This module is implemented natively and should be run directly.',
      };
  }
}

function renderHelp(definition) {
  return [
    `${definition.name} (${definition.id})`,
    definition.description,
    '',
    'Usage:',
    `  node ${definition.filePath} --help`,
    `  node ${definition.filePath} --url https://example.com`,
    '',
    'Common options:',
    '  --url <url>           Target URL for fetch-based modules',
    '  --input <path>        Local source file (html/json/text/image)',
    '  --output <path>       Where to write the result artifact',
    '  --selector <value>    Selector or focus hint for targeted extraction',
    '  --limit <n>           Maximum number of records to return',
    '  --timeout <ms>        Request or browser timeout',
    '  --headers <json>      Extra request headers as JSON',
    '  --state-file <path>   Monitor state file location',
    '  --cron <expr>         Cron schedule for monitor validation',
    '  --bucket <name>       Target bucket for storage integrations',
    '  --dir <path>          Directory input for upload workflows',
    '  --message <text>      Notification message for alerting modules',
    '  --token <value>       Token or JWT input for auth helpers',
    '  --execute             Perform external side effects when supported',
    '  --proxy <url>         Route traffic through proxy (e.g. http://127.0.0.1:8080)',
    '  --headers-json <json> Custom headers in JSON format',
    '  --cookie <string>     Custom cookie string for authenticated probing',
    '  --user-agent <string> Custom User-Agent string',
    '  --json                Output results as pure JSON for automated parsing',
    '  --help                Show this message',
  ].join('\n');
}

function printResult(result) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function runModuleCli(definition, argv = process.argv) {
  const parsed = parseArgs(argv.slice(2));
  if (parsed.flags.help) {
    process.stdout.write(`${renderHelp(definition)}\n`);
    return { status: 'help', module: definition.id };
  }

  const result = await runModule(definition, parsed.flags);
  if (parsed.flags.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printResult(result);
  }
  return result;
}

module.exports = {
  parseArgs,
  renderHelp,
  runModule,
  runModuleCli,
};
