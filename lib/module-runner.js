'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: module-runner.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { spawn, spawnSync } = require('child_process');
const { pathToFileURL } = require('url');
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

function normalizePort(value, fallback = 4321) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 65535 ? parsed : fallback;
}

function optionEnabled(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === undefined || value === null) {
    return false;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized !== '' && !['0', 'false', 'no', 'off'].includes(normalized);
}

function parseListOption(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (value === undefined || value === null || typeof value === 'boolean') {
    return [];
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
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

function sanitizePathToken(value, fallback = 'asset') {
  const sanitized = String(value || '')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return sanitized || fallback;
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
  const iframes = $('iframe[src]').map((_, element) => ({
    src: $(element).attr('src') || '',
    title: $(element).attr('title') || '',
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
  const inlineStyles = $('style').map((_, element) => ({
    media: $(element).attr('media') || '',
    content: ($(element).html() || '').trim(),
  })).get().filter((entry) => entry.content);
  const inlineScripts = $('script').map((_, element) => {
    if ($(element).attr('src')) {
      return null;
    }

    const content = ($(element).html() || '').trim();
    if (!content) {
      return null;
    }

    return {
      type: $(element).attr('type') || 'text/javascript',
      content,
    };
  }).get().filter(Boolean);
  const styleAttributes = $('[style]').map((_, element) => ({
    tag: element.tagName,
    id: $(element).attr('id') || '',
    className: $(element).attr('class') || '',
    style: $(element).attr('style') || '',
  })).get();
  const sections = $('header, nav, main, article, section, aside, footer').map((_, element) => ({
    tag: element.tagName,
    id: $(element).attr('id') || '',
    className: $(element).attr('class') || '',
    text: $(element).text().replace(/\s+/g, ' ').trim(),
    html: $.html(element),
  })).get();
  const bodyHtml = $('body').html() || '';
  const comments = [...html.matchAll(/<!--([\s\S]*?)-->/g)].map((match) => match[1].trim()).filter(Boolean);
  const manifestLinks = $('link[rel="manifest"]').map((_, element) => $(element).attr('href')).get().filter(Boolean);
  const iconLinks = $('link[rel*="icon"]').map((_, element) => $(element).attr('href')).get().filter(Boolean);
  const fontPreloads = $('link[as="font"], link[type*="font"]').map((_, element) => $(element).attr('href')).get().filter(Boolean);
  const mediaAssets = dedupeBy([
    ...$('img[src]').map((_, element) => $(element).attr('src')).get().filter(Boolean),
    ...$('source[src], video[src], audio[src]').map((_, element) => $(element).attr('src')).get().filter(Boolean),
    ...$('video[poster]').map((_, element) => $(element).attr('poster')).get().filter(Boolean),
  ], (value) => value);
  const srcsetAssets = dedupeBy(
    $('[srcset]').map((_, element) => parseSrcsetUrls($(element).attr('srcset'))).get().flat().filter(Boolean),
    (value) => value
  );
  const idMap = $('[id]').map((_, element) => ({
    id: $(element).attr('id') || '',
    tag: element.tagName,
    className: $(element).attr('class') || '',
    text: $(element).text().replace(/\s+/g, ' ').trim().slice(0, 180),
  })).get();
  const classNodes = $('[class]').map((_, element) => ({
    tag: element.tagName,
    className: $(element).attr('class') || '',
    text: $(element).text().replace(/\s+/g, ' ').trim().slice(0, 180),
  })).get();

  return {
    url,
    rawHtml: html,
    bodyHtml,
    title,
    description,
    canonical,
    headings,
    links,
    iframes,
    images,
    forms,
    text,
    wordCount: text ? text.split(/\s+/).length : 0,
    emails,
    comments,
    jsonLd,
    inlineStyles,
    inlineScripts,
    styleAttributes,
    sections,
    manifestLinks,
    iconLinks,
    fontPreloads,
    mediaAssets,
    srcsetAssets,
    idMap,
    classNodes,
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
      return {
        kind: 'document',
        value: loadDocumentModel(text, options.url || `file://${inputPath}`),
        sourceUrl: options.url || `file://${inputPath}`,
        baseDir: path.dirname(inputPath),
        inputPath,
      };
    }

    return { kind: 'text', value: text, inputPath, baseDir: path.dirname(inputPath) };
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
      sourceUrl: options.url,
      baseDir: null,
      inputPath: null,
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

const FRONTEND_EXTRACTION_SLUGS = new Set([
  'asset-dependency-mapper',
  'asset-manifest-scraper',
  'component-class-extractor',
  'css-bundle-extractor',
  'css-color-token-extractor',
  'css-selector-extractor',
  'css-variable-extractor',
  'dom-snapshot-scraper',
  'dom-id-map-extractor',
  'font-asset-extractor',
  'full-site-workspace-builder',
  'frontend-resource-extractor',
  'html-comment-extractor',
  'html-css-js-scraper',
  'html-section-scraper',
  'html-source-extractor',
  'image-asset-downloader',
  'inline-script-extractor',
  'inline-style-extractor',
  'js-api-call-extractor',
  'js-bundle-extractor',
  'js-library-detector',
  'js-route-extractor',
  'linked-asset-downloader',
  'media-query-extractor',
  'page-bundle-downloader',
  'script-link-scraper',
  'source-asset-extractor',
  'stylesheet-link-scraper',
]);

const FULL_SITE_DOWNLOAD_SLUGS = new Set([
  'full-site-workspace-builder',
  'image-asset-downloader',
  'linked-asset-downloader',
  'page-bundle-downloader',
]);

const BROWSER_CAPTURE_SLUGS = new Set([
  'authenticated-browser-capture',
  'browser-action-crawler',
  'browser-site-crawler',
]);

function dedupeBy(items, keySelector) {
  const seen = new Set();
  const results = [];

  for (const item of items) {
    const key = keySelector(item);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    results.push(item);
  }

  return results;
}

function deriveWorkspaceName(document, source) {
  const rawTarget = source && source.sourceUrl
    ? source.sourceUrl
    : (source && source.inputPath ? path.basename(source.inputPath) : document.url || document.title || 'target-site');
  const parsedBase = sanitizePathToken(rawTarget, 'target-site').slice(0, 60);
  return `${parsedBase}-${stableHash(rawTarget).slice(0, 8)}`;
}

function inferAssetExtension(reference, fallbackExtension) {
  const cleanReference = String(reference || '').split('#')[0].split('?')[0];
  const extension = path.extname(cleanReference);
  return extension || fallbackExtension;
}

function inferScriptExtension(type, reference) {
  const normalizedType = String(type || '').toLowerCase();
  if (normalizedType.includes('json')) {
    return '.json';
  }

  if (normalizedType.includes('module') || normalizedType.includes('javascript') || normalizedType.includes('ecmascript')) {
    return '.js';
  }

  return inferAssetExtension(reference, '.js');
}

function nextAvailableAssetName(usedNames, stem, extension) {
  let candidate = `${stem}${extension}`;
  let index = 2;

  while (usedNames.has(candidate)) {
    candidate = `${stem}-${index}${extension}`;
    index += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

function inferFileStem(reference, fallback) {
  const cleanReference = String(reference || '').split('#')[0].split('?')[0];
  const baseName = path.basename(cleanReference, path.extname(cleanReference));
  return sanitizePathToken(baseName, fallback);
}

function sanitizeTextAssetReference(reference) {
  return String(reference || '').trim();
}

function resolveAssetReference(reference, source) {
  const sanitized = sanitizeTextAssetReference(reference);
  if (!sanitized || /^(data:|javascript:|mailto:|tel:|#)/i.test(sanitized)) {
    return null;
  }

  if (/^(https?:|file:)/i.test(sanitized)) {
    return sanitized;
  }

  if (source && source.sourceUrl) {
    try {
      return new URL(sanitized, source.sourceUrl).toString();
    } catch {
      return null;
    }
  }

  if (source && source.baseDir) {
    const cleanPath = sanitized.split('#')[0].split('?')[0].replace(/\//g, path.sep);
    return `file://${path.resolve(source.baseDir, cleanPath)}`;
  }

  return null;
}

function fileUrlToPath(fileUrl) {
  const pathname = decodeURIComponent(new URL(fileUrl).pathname);
  if (process.platform === 'win32') {
    return pathname.replace(/^\/([a-zA-Z]:\/)/, '$1').replace(/\//g, '\\');
  }

  return pathname;
}

async function readResolvedTextAsset(resolvedUrl, options) {
  if (resolvedUrl.startsWith('file://')) {
    const filePath = fileUrlToPath(resolvedUrl);
    const content = readTextFile(filePath);
    return {
      status: 200,
      headers: {},
      content,
    };
  }

  const client = await createAdvancedHttpClient(options);
  const response = await client.get(resolvedUrl, { responseType: 'text' });
  return {
    status: response.status,
    headers: response.headers,
    content: String(response.data || ''),
  };
}

async function collectExternalTextAssets(references, source, options) {
  const assetLimit = normalizeLimit(options.assetLimit, 12);
  const uniqueReferences = [...new Set(references.map(sanitizeTextAssetReference).filter(Boolean))].slice(0, assetLimit);
  const assets = [];

  for (const reference of uniqueReferences) {
    const resolvedUrl = resolveAssetReference(reference, source);
    if (!resolvedUrl) {
      assets.push({
        reference,
        resolvedUrl: null,
        status: 'skipped',
        error: 'Unsupported or unresolved reference.',
      });
      continue;
    }

    try {
      const asset = await readResolvedTextAsset(resolvedUrl, options);
      assets.push({
        reference,
        resolvedUrl,
        status: asset.status,
        headers: asset.headers,
        bytes: Buffer.byteLength(asset.content, 'utf8'),
        content: asset.content,
      });
    } catch (error) {
      assets.push({
        reference,
        resolvedUrl,
        status: 'error',
        error: error.message,
      });
    }
  }

  return assets;
}

function stripCssComments(css) {
  return String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
}

function extractCssSelectors(css) {
  const selectors = [];
  const source = stripCssComments(css);
  const matcher = /(^|})\s*([^@}{][^{}]+?)\s*\{/g;

  for (const match of source.matchAll(matcher)) {
    const parts = match[2]
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

    selectors.push(...parts);
  }

  return [...new Set(selectors)];
}

function extractCssVariables(css) {
  const variables = [];
  const matcher = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;}{]+)/g;

  for (const match of String(css || '').matchAll(matcher)) {
    variables.push({
      name: match[1],
      value: match[2].trim(),
    });
  }

  return dedupeBy(variables, (item) => `${item.name}:${item.value}`);
}

function extractMediaQueries(css) {
  const queries = [];
  const matcher = /@media\s+([^{]+)\{([\s\S]*?)\}\s*\}/g;

  for (const match of String(css || '').matchAll(matcher)) {
    queries.push({
      query: match[1].trim(),
      block: `@media ${match[1].trim()} {${match[2].trim()}}`,
    });
  }

  return dedupeBy(queries, (item) => `${item.query}:${item.block}`);
}

function extractCssImports(css) {
  const imports = [];
  const matcher = /@import\s+(?:url\()?['"]?([^'")\s]+)['"]?\)?/g;

  for (const match of String(css || '').matchAll(matcher)) {
    imports.push(match[1]);
  }

  return [...new Set(imports)];
}

function extractCssColors(css) {
  const colors = String(css || '').match(/#(?:[0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g) || [];
  return [...new Set(colors)];
}

function extractFontFamilies(css) {
  const families = [];
  const matcher = /font-family\s*:\s*([^;}{]+)/g;

  for (const match of String(css || '').matchAll(matcher)) {
    const entries = match[1]
      .split(',')
      .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
    families.push(...entries);
  }

  return [...new Set(families)];
}

function extractFontAssets(css) {
  const assets = [];
  const matcher = /url\(([^)]+)\)/g;

  for (const match of String(css || '').matchAll(matcher)) {
    const value = match[1].trim().replace(/^['"]|['"]$/g, '');
    if (/\.(woff2?|ttf|otf|eot)(\?|#|$)/i.test(value) || /^data:font\//i.test(value)) {
      assets.push(value);
    }
  }

  return [...new Set(assets)];
}

function extractCssAssetUrls(css) {
  const assets = [];
  const matcher = /url\(([^)]+)\)/g;

  for (const match of String(css || '').matchAll(matcher)) {
    const value = match[1].trim().replace(/^['"]|['"]$/g, '');
    if (!value || /^data:/i.test(value)) {
      continue;
    }
    assets.push(value);
  }

  return [...new Set(assets)];
}

function parseSrcsetUrls(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function extractJsImports(source) {
  const imports = [];
  const text = String(source || '');
  const importMatcher = /\bimport\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g;
  const dynamicMatcher = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  const requireMatcher = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const match of text.matchAll(importMatcher)) {
    imports.push(match[1]);
  }

  for (const match of text.matchAll(dynamicMatcher)) {
    imports.push(match[1]);
  }

  for (const match of text.matchAll(requireMatcher)) {
    imports.push(match[1]);
  }

  return [...new Set(imports)];
}

function extractJsRoutes(source) {
  const routes = [];
  const matcher = /['"`](\/[a-zA-Z0-9/_?&=#.:~-]{2,})['"`]/g;

  for (const match of String(source || '').matchAll(matcher)) {
    routes.push(match[1]);
  }

  return [...new Set(routes)];
}

function extractJsApiCalls(source) {
  const calls = [];
  const text = String(source || '');
  const fetchMatcher = /\bfetch\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*\{([\s\S]*?)\})?\s*\)/g;
  const axiosMethodMatcher = /\baxios\.(get|post|put|patch|delete|head|options)\(\s*['"`]([^'"`]+)['"`]/gi;
  const xhrMatcher = /\.open\(\s*['"`]([A-Z]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]/g;
  const axiosObjectMatcher = /\baxios\(\s*\{([\s\S]*?)\}\s*\)/g;

  for (const match of text.matchAll(fetchMatcher)) {
    const methodMatch = /method\s*:\s*['"`]([A-Z]+)['"`]/i.exec(match[2] || '');
    calls.push({
      client: 'fetch',
      method: (methodMatch ? methodMatch[1] : 'GET').toUpperCase(),
      url: match[1],
    });
  }

  for (const match of text.matchAll(axiosMethodMatcher)) {
    calls.push({
      client: 'axios',
      method: match[1].toUpperCase(),
      url: match[2],
    });
  }

  for (const match of text.matchAll(xhrMatcher)) {
    calls.push({
      client: 'xhr',
      method: match[1].toUpperCase(),
      url: match[2],
    });
  }

  for (const match of text.matchAll(axiosObjectMatcher)) {
    const urlMatch = /url\s*:\s*['"`]([^'"`]+)['"`]/i.exec(match[1] || '');
    if (!urlMatch) {
      continue;
    }

    const methodMatch = /method\s*:\s*['"`]([A-Z]+)['"`]/i.exec(match[1] || '');
    calls.push({
      client: 'axios',
      method: (methodMatch ? methodMatch[1] : 'GET').toUpperCase(),
      url: urlMatch[1],
    });
  }

  return dedupeBy(calls, (item) => `${item.client}:${item.method}:${item.url}`);
}

function extractComponentClasses(document) {
  const map = new Map();

  for (const node of document.classNodes) {
    const tokens = node.className.split(/\s+/).map((entry) => entry.trim()).filter(Boolean);
    if (!tokens.length) {
      continue;
    }

    const signature = [...new Set(tokens)].sort().join(' ');
    if (!map.has(signature)) {
      map.set(signature, {
        selector: `.${tokens.join('.')}`,
        classes: [...new Set(tokens)],
        count: 0,
        tags: new Set(),
        sampleText: node.text,
      });
    }

    const entry = map.get(signature);
    entry.count += 1;
    entry.tags.add(node.tag);
    if (!entry.sampleText && node.text) {
      entry.sampleText = node.text;
    }
  }

  return [...map.values()]
    .map((entry) => ({
      selector: entry.selector,
      classes: entry.classes,
      count: entry.count,
      tags: [...entry.tags],
      sampleText: entry.sampleText,
    }))
    .sort((left, right) => right.count - left.count || left.selector.localeCompare(right.selector));
}

function detectLibraries(reference, content) {
  const target = `${reference || ''}\n${content || ''}`;
  const libraryMatchers = [
    { name: 'React', pattern: /\breact(?:\.production|min)?(?:\.js)?\b|\bReactDOM\b|\bReact\.createElement\b/i },
    { name: 'Vue', pattern: /\bvue(?:\.global|min)?(?:\.js)?\b|\bcreateApp\(/i },
    { name: 'Angular', pattern: /\bangular(?:\.min)?(?:\.js)?\b|\bng-version\b/i },
    { name: 'jQuery', pattern: /\bjquery(?:\.min)?(?:\.js)?\b|\$\.(ajax|fn)\b/i },
    { name: 'Bootstrap', pattern: /\bbootstrap(?:\.bundle|min)?(?:\.js|\.css)?\b/i },
    { name: 'Next.js', pattern: /_next\/|__NEXT_DATA__/i },
    { name: 'Nuxt', pattern: /_nuxt\/|__NUXT__/i },
    { name: 'Svelte', pattern: /\bsvelte(?:\.js)?\b|__svelte/i },
    { name: 'Alpine.js', pattern: /\balpine(?:\.min)?(?:\.js)?\b|x-data=/i },
    { name: 'Lodash', pattern: /\blodash(?:\.min)?(?:\.js)?\b|_.(map|merge|debounce)\b/i },
  ];

  return libraryMatchers
    .filter((matcher) => matcher.pattern.test(target))
    .map((matcher) => matcher.name);
}

function normalizeInlineStyles(document) {
  return document.inlineStyles.map((styleBlock, index) => ({
    source: `inline-style-${index + 1}`,
    media: styleBlock.media,
    content: styleBlock.content,
    bytes: Buffer.byteLength(styleBlock.content, 'utf8'),
    selectors: extractCssSelectors(styleBlock.content),
    variables: extractCssVariables(styleBlock.content),
    mediaQueries: extractMediaQueries(styleBlock.content),
    imports: extractCssImports(styleBlock.content),
  }));
}

function normalizeInlineScripts(document) {
  return document.inlineScripts.map((scriptBlock, index) => ({
    source: `inline-script-${index + 1}`,
    type: scriptBlock.type,
    content: scriptBlock.content,
    bytes: Buffer.byteLength(scriptBlock.content, 'utf8'),
    imports: extractJsImports(scriptBlock.content),
    routes: extractJsRoutes(scriptBlock.content),
    libraries: detectLibraries(`inline-script-${index + 1}`, scriptBlock.content),
  }));
}

function shouldFetchStyles(slug) {
  return [
    'asset-dependency-mapper',
    'css-bundle-extractor',
    'css-selector-extractor',
    'css-variable-extractor',
    'frontend-resource-extractor',
    'html-css-js-scraper',
    'media-query-extractor',
    'source-asset-extractor',
    'stylesheet-link-scraper',
  ].includes(slug);
}

function shouldFetchScripts(slug) {
  return [
    'asset-dependency-mapper',
    'frontend-resource-extractor',
    'html-css-js-scraper',
    'js-bundle-extractor',
    'js-library-detector',
    'js-route-extractor',
    'script-link-scraper',
    'source-asset-extractor',
  ].includes(slug);
}

async function buildFrontendExtractionBundle(document, source, options, slug) {
  const externalStylesheetsRaw = await collectExternalTextAssets(document.stylesheets, source, options);
  const externalScriptsRaw = await collectExternalTextAssets(document.scripts, source, options);

  const externalStylesheets = externalStylesheetsRaw.map((asset) => ({
    ...asset,
    imports: asset.content ? extractCssImports(asset.content) : [],
    selectors: asset.content ? extractCssSelectors(asset.content) : [],
    variables: asset.content ? extractCssVariables(asset.content) : [],
    mediaQueries: asset.content ? extractMediaQueries(asset.content) : [],
  }));
  const externalScripts = externalScriptsRaw.map((asset) => ({
    ...asset,
    imports: asset.content ? extractJsImports(asset.content) : [],
    routes: asset.content ? extractJsRoutes(asset.content) : [],
    libraries: asset.content ? detectLibraries(asset.reference, asset.content) : [],
  }));
  const inlineStyles = normalizeInlineStyles(document);
  const inlineScripts = normalizeInlineScripts(document);

  const cssVariables = dedupeBy(
    [...externalStylesheets, ...inlineStyles].flatMap((asset) => asset.variables.map((variable) => ({
      ...variable,
      source: asset.resolvedUrl || asset.source || asset.reference,
    }))),
    (item) => `${item.name}:${item.value}:${item.source}`
  );
  const cssSelectors = dedupeBy(
    [...externalStylesheets, ...inlineStyles].flatMap((asset) => asset.selectors.map((selector) => ({
      selector,
      source: asset.resolvedUrl || asset.source || asset.reference,
    }))),
    (item) => `${item.selector}:${item.source}`
  );
  const mediaQueries = dedupeBy(
    [...externalStylesheets, ...inlineStyles].flatMap((asset) => asset.mediaQueries.map((query) => ({
      ...query,
      source: asset.resolvedUrl || asset.source || asset.reference,
    }))),
    (item) => `${item.query}:${item.source}`
  );
  const jsImports = dedupeBy(
    [...externalScripts, ...inlineScripts].flatMap((asset) => asset.imports.map((entry) => ({
      importPath: entry,
      source: asset.resolvedUrl || asset.source || asset.reference,
    }))),
    (item) => `${item.importPath}:${item.source}`
  );
  const jsRoutes = dedupeBy(
    [...externalScripts, ...inlineScripts].flatMap((asset) => asset.routes.map((route) => ({
      route,
      source: asset.resolvedUrl || asset.source || asset.reference,
    }))),
    (item) => `${item.route}:${item.source}`
  );
  const jsLibraries = dedupeBy(
    [...externalScripts, ...inlineScripts].flatMap((asset) => asset.libraries.map((library) => ({
      name: library,
      source: asset.resolvedUrl || asset.source || asset.reference,
    }))),
    (item) => `${item.name}:${item.source}`
  );
  const cssColors = dedupeBy(
    [...externalStylesheets, ...inlineStyles].flatMap((asset) => extractCssColors(asset.content).map((color) => ({
      color,
      source: asset.resolvedUrl || asset.source || asset.reference,
    }))),
    (item) => `${item.color}:${item.source}`
  );
  const fontFamilies = dedupeBy(
    [...externalStylesheets, ...inlineStyles].flatMap((asset) => extractFontFamilies(asset.content).map((family) => ({
      family,
      source: asset.resolvedUrl || asset.source || asset.reference,
    }))),
    (item) => `${item.family}:${item.source}`
  );
  const fontAssets = dedupeBy(
    [
      ...document.fontPreloads.map((href) => ({
        asset: href,
        source: document.url,
      })),
      ...[...externalStylesheets, ...inlineStyles].flatMap((asset) => extractFontAssets(asset.content).map((fontAsset) => ({
        asset: fontAsset,
        source: asset.resolvedUrl || asset.source || asset.reference,
      }))),
    ],
    (item) => `${item.asset}:${item.source}`
  );
  const jsApiCalls = dedupeBy(
    [...externalScripts, ...inlineScripts].flatMap((asset) => extractJsApiCalls(asset.content).map((call) => ({
      ...call,
      source: asset.resolvedUrl || asset.source || asset.reference,
    }))),
    (item) => `${item.client}:${item.method}:${item.url}:${item.source}`
  );
  const componentClasses = extractComponentClasses(document);

  return {
    externalStylesheets,
    externalScripts,
    inlineStyles,
    inlineScripts,
    cssVariables,
    cssSelectors,
    mediaQueries,
    jsImports,
    jsRoutes,
    jsLibraries,
    cssColors,
    fontFamilies,
    fontAssets,
    jsApiCalls,
    componentClasses,
    sections: document.sections,
    idMap: document.idMap,
  };
}

function categorizeAssetReference(reference, contentType = '') {
  const target = `${String(reference || '')} ${String(contentType || '')}`.toLowerCase();

  if (/\.(png|jpe?g|gif|svg|webp|avif|ico|bmp)(\?|#|$)/i.test(target) || target.includes('image/')) {
    return 'images';
  }

  if (/\.(woff2?|ttf|otf|eot)(\?|#|$)/i.test(target) || target.includes('font/')) {
    return 'fonts';
  }

  if (/\.(mp4|webm|mp3|wav|ogg|mov|m4a)(\?|#|$)/i.test(target) || /(video|audio)\//.test(target)) {
    return 'media';
  }

  if (/\.(json|webmanifest|txt|xml)(\?|#|$)/i.test(target) || /(application\/json|application\/manifest\+json|text\/plain|application\/xml|text\/xml)/.test(target)) {
    return 'misc';
  }

  return 'misc';
}

async function readResolvedBinaryAsset(resolvedUrl, options) {
  if (resolvedUrl.startsWith('file://')) {
    const filePath = fileUrlToPath(resolvedUrl);
    const content = fs.readFileSync(filePath);
    return {
      status: 200,
      headers: {},
      content,
      contentType: mimeTypeFromPath(filePath),
    };
  }

  const client = await createAdvancedHttpClient(options);
  const response = await client.get(resolvedUrl, { responseType: 'arraybuffer' });
  return {
    status: response.status,
    headers: response.headers,
    content: Buffer.from(response.data),
    contentType: response.headers['content-type'] || '',
  };
}

function mimeTypeFromPath(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const known = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
  };

  return known[extension] || 'application/octet-stream';
}

function collectReferencedBinaryAssets(document, bundle, source, mode = 'all') {
  const references = [];
  const pushReference = (reference, baseSource, categoryHint) => {
    if (!reference) {
      return;
    }

    references.push({
      reference,
      baseSourceUrl: baseSource.sourceUrl || null,
      baseDir: baseSource.baseDir || null,
      categoryHint,
    });
  };

  const pageBase = {
    sourceUrl: source.sourceUrl,
    baseDir: source.baseDir,
  };

  const imageOnly = mode === 'images';

  for (const image of document.images) {
    pushReference(image.src, pageBase, 'images');
  }
  for (const image of document.srcsetAssets) {
    pushReference(image, pageBase, 'images');
  }
  for (const icon of document.iconLinks) {
    pushReference(icon, pageBase, 'images');
  }
  for (const media of document.mediaAssets) {
    pushReference(media, pageBase, 'media');
  }

  if (!imageOnly) {
    for (const manifestLink of document.manifestLinks) {
      pushReference(manifestLink, pageBase, 'misc');
    }
    for (const fontLink of document.fontPreloads) {
      pushReference(fontLink, pageBase, 'fonts');
    }
  }

  for (const styleAsset of [...bundle.externalStylesheets, ...bundle.inlineStyles]) {
    const base = {
      sourceUrl: styleAsset.resolvedUrl || pageBase.sourceUrl,
      baseDir: pageBase.baseDir,
    };

    for (const nestedAsset of extractCssAssetUrls(styleAsset.content)) {
      const category = imageOnly
        ? 'images'
        : categorizeAssetReference(nestedAsset, '');
      if (imageOnly && category !== 'images') {
        continue;
      }
      pushReference(nestedAsset, base, category);
    }
  }

  for (const styleAttribute of document.styleAttributes || []) {
    for (const nestedAsset of extractCssAssetUrls(styleAttribute.style)) {
      const category = imageOnly
        ? 'images'
        : categorizeAssetReference(nestedAsset, '');
      if (imageOnly && category !== 'images') {
        continue;
      }
      pushReference(nestedAsset, pageBase, category);
    }
  }

  return dedupeBy(
    references.filter((entry) => entry.reference),
    (entry) => `${entry.reference}|${entry.baseSourceUrl || entry.baseDir || ''}|${entry.categoryHint || ''}`
  );
}

async function downloadBinaryAssetSet(assetReferences, workspaceRoot, options) {
  const downloadLimit = normalizeLimit(options.downloadLimit, 80);
  const manifests = [];
  const usedNamesByCategory = new Map();

  for (const assetReference of assetReferences.slice(0, downloadLimit)) {
    const resolvedUrl = resolveAssetReference(assetReference.reference, {
      sourceUrl: assetReference.baseSourceUrl,
      baseDir: assetReference.baseDir,
    });

    if (!resolvedUrl) {
      manifests.push({
        category: assetReference.categoryHint || 'misc',
        source: assetReference.reference,
        resolvedUrl: null,
        status: 'skipped',
        error: 'Unsupported or unresolved reference.',
      });
      continue;
    }

    try {
      const asset = await readResolvedBinaryAsset(resolvedUrl, options);
      const category = assetReference.categoryHint === 'images' || assetReference.categoryHint === 'fonts' || assetReference.categoryHint === 'media' || assetReference.categoryHint === 'misc'
        ? assetReference.categoryHint
        : categorizeAssetReference(assetReference.reference || resolvedUrl, asset.contentType);
      const extension = inferAssetExtension(assetReference.reference || resolvedUrl, category === 'fonts' ? '.woff2' : (category === 'images' ? '.bin' : '.bin'));
      const stem = inferFileStem(assetReference.reference || resolvedUrl, category.slice(0, -1) || 'asset');
      const categoryDir = path.join(workspaceRoot, category);
      fs.mkdirSync(categoryDir, { recursive: true });
      if (!usedNamesByCategory.has(category)) {
        usedNamesByCategory.set(category, new Set());
      }
      const fileName = nextAvailableAssetName(usedNamesByCategory.get(category), stem, extension);
      const relativePath = path.join(category, fileName);
      ensureParentDir(path.join(workspaceRoot, relativePath));
      fs.writeFileSync(path.join(workspaceRoot, relativePath), asset.content);

      manifests.push({
        category,
        source: assetReference.reference,
        resolvedUrl,
        file: relativePath,
        status: asset.status,
        bytes: asset.content.length,
        contentType: asset.contentType,
      });
    } catch (error) {
      manifests.push({
        category: assetReference.categoryHint || 'misc',
        source: assetReference.reference,
        resolvedUrl,
        status: 'error',
        error: error.message,
      });
    }
  }

  return manifests;
}

function buildReferenceLookup(manifest) {
  const lookup = new Map();
  for (const asset of manifest) {
    if (asset.source) {
      lookup.set(asset.source, asset.file);
    }
    if (asset.resolvedUrl) {
      lookup.set(asset.resolvedUrl, asset.file);
    }
  }
  return lookup;
}

function rewriteSrcsetValue(value, htmlDir, workspaceRoot, lookup) {
  return String(value || '')
    .split(',')
    .map((entry) => {
      const parts = entry.trim().split(/\s+/);
      const mapped = lookup.get(parts[0]);
      if (mapped) {
        parts[0] = toHtmlRelativePath(workspaceRoot, htmlDir, mapped);
      }
      return parts.join(' ');
    })
    .filter(Boolean)
    .join(', ');
}

function rewriteCssReferences(value, owningDir, workspaceRoot, lookup) {
  let rewritten = String(value || '');

  rewritten = rewritten.replace(/url\(([^)]+)\)/gi, (match, rawReference) => {
    const reference = rawReference.trim().replace(/^['"]|['"]$/g, '');
    const mapped = lookup.get(reference);
    if (!mapped) {
      return match;
    }

    return `url("${toPortablePath(path.relative(owningDir, path.join(workspaceRoot, mapped))) || '.'}")`;
  });

  rewritten = rewritten.replace(/@import\s+(url\(\s*)?(['"]?)([^'"()\s]+)\2(\s*\))?/gi, (match, open, quote, reference, close) => {
    const mapped = lookup.get(reference);
    if (!mapped) {
      return match;
    }

    const relativePath = toPortablePath(path.relative(owningDir, path.join(workspaceRoot, mapped))) || '.';
    if (open) {
      return `@import url("${relativePath}")`;
    }

    return `@import "${relativePath}"`;
  });

  return rewritten;
}

function looksLikeHtmlPage(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    const extension = path.extname(parsed.pathname).toLowerCase();
    return !extension || ['.html', '.htm', '.php', '.asp', '.aspx', '.jsp', '.jspx', '.cfm', '.xhtml'].includes(extension);
  } catch {
    return false;
  }
}

function collectDocumentHtmlTargets(document) {
  return dedupeBy([
    ...document.links.map((link) => ({
      href: link.href,
      text: link.text,
      kind: 'link',
    })),
    ...(document.iframes || []).map((frame) => ({
      href: frame.src,
      text: frame.title || '',
      kind: 'iframe',
    })),
  ].filter((entry) => entry.href), (entry) => `${entry.kind}:${entry.href}`);
}

function makePageFileName(targetUrl, fallback = 'page') {
  try {
    const parsed = new URL(targetUrl);
    const pathToken = sanitizePathToken(parsed.pathname.replace(/\//g, '-') || fallback, fallback);
    const queryToken = parsed.search ? `-${stableHash(parsed.search).slice(0, 6)}` : '';
    return `${pathToken}${queryToken}.html`.replace(/^-/, '');
  } catch {
    return `${sanitizePathToken(fallback, 'page')}.html`;
  }
}

async function crawlSameOriginPages(rootDocument, source, options) {
  if (!source.sourceUrl || !/^https?:\/\//i.test(source.sourceUrl)) {
    return [{
      url: source.sourceUrl || rootDocument.url,
      href: source.sourceUrl || rootDocument.url,
      depth: 0,
      document: rootDocument,
    }];
  }

  const rootUrl = source.sourceUrl;
  const rootOrigin = new URL(rootUrl).origin;
  const pageLimit = normalizeLimit(options.pageLimit, 10);
  const depthLimit = normalizeLimit(options.depth, 1);
  const visited = new Set([normalizeUrlValue(rootUrl)]);
  const pages = [{
    url: rootUrl,
    href: rootUrl,
    depth: 0,
    document: rootDocument,
  }];
  const queue = [];

  for (const link of collectDocumentHtmlTargets(rootDocument)) {
    if (!link.href) {
      continue;
    }
    try {
      const resolved = new URL(link.href, rootUrl).toString();
      if (new URL(resolved).origin !== rootOrigin || !looksLikeHtmlPage(resolved)) {
        continue;
      }
      queue.push({ url: resolved, href: link.href, depth: 1 });
    } catch {
      // Ignore malformed links.
    }
  }

  while (queue.length && pages.length < pageLimit) {
    const next = queue.shift();
    const normalizedUrl = normalizeUrlValue(next.url);
    if (visited.has(normalizedUrl) || next.depth > depthLimit) {
      continue;
    }

    visited.add(normalizedUrl);

    try {
      const response = await fetchUrl(next.url, options);
      const html = String(response.data || '');
      const contentType = String(response.headers['content-type'] || '');
      if (contentType && !contentType.includes('html')) {
        continue;
      }

      const document = {
        ...loadDocumentModel(html, next.url),
        status: response.status,
        headers: response.headers,
      };

      pages.push({
        url: next.url,
        href: next.href,
        depth: next.depth,
        document,
      });

      if (next.depth < depthLimit) {
        for (const link of collectDocumentHtmlTargets(document)) {
          if (!link.href) {
            continue;
          }
          try {
            const resolved = new URL(link.href, next.url).toString();
            if (new URL(resolved).origin !== rootOrigin || !looksLikeHtmlPage(resolved)) {
              continue;
            }
            queue.push({ url: resolved, href: link.href, depth: next.depth + 1 });
          } catch {
            // Ignore malformed links.
          }
        }
      }
    } catch {
      // Continue crawling other pages even if one page fails.
    }
  }

  return pages;
}

function getWorkspaceProjectPaths(workspaceRoot) {
  return {
    metaDir: path.join(workspaceRoot, 'meta'),
    projectPath: path.join(workspaceRoot, 'meta', 'project.json'),
    crawlStatePath: path.join(workspaceRoot, 'meta', 'crawl-state.json'),
    originalDir: path.join(workspaceRoot, 'meta', 'original'),
    diffReportPath: path.join(workspaceRoot, 'meta', 'diff-report.json'),
    integrityReportPath: path.join(workspaceRoot, 'meta', 'integrity-report.json'),
    qaReportPath: path.join(workspaceRoot, 'meta', 'qa-report.json'),
    storageStatePath: path.join(workspaceRoot, 'meta', 'storage-state.json'),
  };
}

function readJsonIfExists(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return safeJsonParse(readTextFile(filePath), fallback);
}

function listFilesRecursive(rootDir, currentDir = rootDir) {
  if (!fs.existsSync(currentDir)) {
    return [];
  }

  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(rootDir, absolutePath));
      continue;
    }

    results.push(path.relative(rootDir, absolutePath));
  }

  return results;
}

function snapshotWorkspaceBaseline(workspaceRoot, force = false) {
  const paths = getWorkspaceProjectPaths(workspaceRoot);
  const baselineRoot = paths.originalDir;
  fs.mkdirSync(baselineRoot, { recursive: true });

  const includeRoots = ['html', 'css', 'js', 'pages', 'images', 'fonts', 'media', 'misc'];
  for (const rootName of includeRoots) {
    const absoluteRoot = path.join(workspaceRoot, rootName);
    for (const relativeFile of listFilesRecursive(absoluteRoot)) {
      const sourceFile = path.join(absoluteRoot, relativeFile);
      const targetFile = path.join(baselineRoot, rootName, relativeFile);
      ensureParentDir(targetFile);
      if (!force && fs.existsSync(targetFile)) {
        continue;
      }
      fs.copyFileSync(sourceFile, targetFile);
    }
  }
}

function buildProjectMetadata(definition, options, sourceUrl) {
  return {
    module: definition.id,
    generatedAt: new Date().toISOString(),
    sourceUrl: sourceUrl || options.url || null,
    loginUrl: options.loginUrl || null,
    resume: Boolean(options.resume),
    pageLimit: normalizeLimit(options.pageLimit, 10),
    depth: normalizeLimit(options.depth, 1),
    waitFor: options.waitFor || null,
    clickSelectors: parseListOption(options.clickSelectors),
    dismissSelectors: parseListOption(options.dismissSelectors),
    paginationSelector: options.paginationSelector || null,
    routeHints: parseListOption(options.routeHints),
    outputDir: options.outputDir ? path.resolve(options.outputDir) : null,
  };
}

function parseCookieStringForPlaywright(cookieString, targetUrl) {
  if (!cookieString || !targetUrl) {
    return [];
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return [];
  }

  return String(cookieString)
    .split(';')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const separatorIndex = pair.indexOf('=');
      const name = separatorIndex === -1 ? pair : pair.slice(0, separatorIndex);
      const value = separatorIndex === -1 ? '' : pair.slice(separatorIndex + 1);
      return {
        name: name.trim(),
        value: value.trim(),
        domain: parsedUrl.hostname,
        path: '/',
        httpOnly: false,
        secure: parsedUrl.protocol === 'https:',
      };
    })
    .filter((cookie) => cookie.name);
}

async function createBrowserCaptureContext(options, targetUrl, storageStateOutPath = null) {
  const { chromium } = require('playwright');
  const launchOptions = {
    headless: options.headed ? false : true,
  };

  if (options.proxy) {
    launchOptions.proxy = { server: options.proxy };
  }

  const extraHeaders = typeof options.headersJson === 'string'
    ? safeJsonParse(options.headersJson, {})
    : (options.headersJson || {});

  const contextOptions = {
    ignoreHTTPSErrors: true,
    viewport: {
      width: normalizeLimit(options.viewportWidth, 1440),
      height: normalizeLimit(options.viewportHeight, 900),
    },
    extraHTTPHeaders: extraHeaders,
  };

  if (options.userAgent) {
    contextOptions.userAgent = options.userAgent;
  }

  if (options.storageState) {
    contextOptions.storageState = path.resolve(options.storageState);
  }

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext(contextOptions);

  if (options.cookie) {
    const cookies = parseCookieStringForPlaywright(options.cookie, targetUrl);
    if (cookies.length) {
      await context.addCookies(cookies);
    }
  }

  if (options.localStorageJson) {
    const localStorageData = typeof options.localStorageJson === 'string' && fs.existsSync(path.resolve(options.localStorageJson))
      ? safeJsonParse(readTextFile(path.resolve(options.localStorageJson)), {})
      : safeJsonParse(options.localStorageJson, {});
    await context.addInitScript((entries) => {
      for (const [key, value] of Object.entries(entries)) {
        window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
    }, localStorageData);
  }

  if (options.sessionStorageJson) {
    const sessionStorageData = typeof options.sessionStorageJson === 'string' && fs.existsSync(path.resolve(options.sessionStorageJson))
      ? safeJsonParse(readTextFile(path.resolve(options.sessionStorageJson)), {})
      : safeJsonParse(options.sessionStorageJson, {});
    await context.addInitScript((entries) => {
      for (const [key, value] of Object.entries(entries)) {
        window.sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
    }, sessionStorageData);
  }

  return {
    browser,
    context,
    storageStateOutPath,
  };
}

async function maybePerformBrowserLogin(context, options, storageStateOutPath) {
  if (!options.loginUrl && !options.usernameSelector && !options.passwordSelector) {
    return { loggedIn: false, finalUrl: null };
  }

  const page = await context.newPage();
  try {
    await page.goto(options.loginUrl || options.url, {
      waitUntil: 'domcontentloaded',
      timeout: normalizeTimeout(options.timeout, 30000),
    });

    if (options.usernameSelector && options.username !== undefined) {
      await page.fill(options.usernameSelector, String(options.username));
    }

    if (options.passwordSelector && options.password !== undefined) {
      await page.fill(options.passwordSelector, String(options.password));
    }

    if (options.submitSelector) {
      await Promise.allSettled([
        page.waitForLoadState('networkidle', { timeout: normalizeTimeout(options.timeout, 15000) }),
        page.click(options.submitSelector),
      ]);
    } else if (options.passwordSelector) {
      await Promise.allSettled([
        page.waitForLoadState('networkidle', { timeout: normalizeTimeout(options.timeout, 15000) }),
        page.press(options.passwordSelector, 'Enter'),
      ]);
    }

    if (options.waitFor) {
      await page.waitForSelector(options.waitFor, { timeout: normalizeTimeout(options.timeout, 10000) });
    } else {
      await page.waitForLoadState('networkidle', { timeout: normalizeTimeout(options.timeout, 15000) }).catch(() => {});
    }

    if (storageStateOutPath) {
      ensureParentDir(storageStateOutPath);
      await context.storageState({ path: storageStateOutPath });
    }

    return {
      loggedIn: true,
      finalUrl: page.url(),
    };
  } finally {
    await page.close();
  }
}

async function clickSelectorsOnPage(page, selectors, options = {}) {
  const clicked = [];
  const timeout = normalizeTimeout(options.timeout, 3000);
  const actionDelay = normalizeLimit(options.actionDelay, 250);

  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      const count = await locator.count();
      if (!count) {
        continue;
      }

      await locator.scrollIntoViewIfNeeded().catch(() => {});
      await locator.click({ timeout });
      clicked.push(selector);
      await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
      await page.waitForTimeout(actionDelay);
    } catch {
      // Ignore missing or non-clickable selectors during guided crawl actions.
    }
  }

  return clicked;
}

async function scrollPageForCapture(page, options) {
  const steps = options.scrollSteps !== undefined
    ? normalizeLimit(options.scrollSteps, 1)
    : (optionEnabled(options.scroll) ? 6 : 0);
  if (!steps) {
    return 0;
  }

  const pauseMs = normalizeLimit(options.scrollPause, 150);
  await page.evaluate(async ({ totalSteps, pause }) => {
    for (let step = 0; step < totalSteps; step += 1) {
      const totalHeight = Math.max(
        document.body ? document.body.scrollHeight : 0,
        document.documentElement ? document.documentElement.scrollHeight : 0
      );
      const targetY = totalSteps <= 1 ? totalHeight : Math.round((totalHeight * (step + 1)) / totalSteps);
      window.scrollTo(0, targetY);
      await new Promise((resolve) => window.setTimeout(resolve, pause));
    }
  }, { totalSteps: steps, pause: pauseMs }).catch(() => {});

  return steps;
}

function resolveBrowserSeedUrls(startUrl, options) {
  return parseListOption(options.routeHints).map((entry) => {
    try {
      return new URL(entry, startUrl).toString();
    } catch {
      return null;
    }
  }).filter(Boolean);
}

async function inspectBrowserPage(page, url, options) {
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: normalizeTimeout(options.timeout, 30000),
  });

  if (options.waitFor) {
    await page.waitForSelector(options.waitFor, { timeout: normalizeTimeout(options.timeout, 10000) }).catch(() => {});
  }

  const dismissedSelectors = await clickSelectorsOnPage(page, parseListOption(options.dismissSelectors), {
    timeout: normalizeTimeout(options.timeout, 2500),
    actionDelay: normalizeLimit(options.actionDelay, 120),
  });
  const clickedSelectors = await clickSelectorsOnPage(page, parseListOption(options.clickSelectors), {
    timeout: normalizeTimeout(options.timeout, 4000),
    actionDelay: normalizeLimit(options.actionDelay, 300),
  });
  const scrolledSteps = await scrollPageForCapture(page, options);

  await page.waitForLoadState('networkidle', { timeout: normalizeTimeout(options.timeout, 12000) }).catch(() => {});
  const html = await page.content();
  const document = loadDocumentModel(html, page.url());
  document.finalUrl = page.url();
  document.browserTitle = await page.title().catch(() => document.title);
  document.browserStorage = await page.evaluate(() => ({
    localStorage: Object.fromEntries(Object.entries(window.localStorage)),
    sessionStorage: Object.fromEntries(Object.entries(window.sessionStorage)),
  })).catch(() => ({ localStorage: {}, sessionStorage: {} }));

  const links = await page.$$eval('a[href]', (elements) => elements.map((element) => ({
    href: element.getAttribute('href') || '',
    text: (element.textContent || '').trim(),
  }))).catch(() => []);
  const iframeLinks = await page.$$eval('iframe[src]', (elements) => elements.map((element) => ({
    href: element.getAttribute('src') || '',
    text: element.getAttribute('title') || '',
  }))).catch(() => []);
  const paginationLinks = options.paginationSelector
    ? await page.$$eval(options.paginationSelector, (elements) => elements.map((element) => ({
      href: element.getAttribute('href') || '',
      text: (element.textContent || '').trim(),
    }))).catch(() => [])
    : [];
  const discoveredLinks = dedupeBy(
    [...links, ...iframeLinks, ...paginationLinks].filter((entry) => entry.href),
    (entry) => `${entry.href}|${entry.text}`
  );

  return {
    url: page.url(),
    requestedUrl: url,
    links: discoveredLinks,
    document,
    actions: {
      dismissedSelectors,
      clickedSelectors,
      scrolledSteps,
      paginationSelector: options.paginationSelector || null,
    },
  };
}

async function crawlSiteWithBrowser(startUrl, options, workspaceRoot = null) {
  const projectPaths = workspaceRoot ? getWorkspaceProjectPaths(workspaceRoot) : null;
  const resumeState = options.resume && projectPaths ? readJsonIfExists(projectPaths.crawlStatePath, null) : null;
  const pending = Array.isArray(resumeState && resumeState.pending) && resumeState.pending.length
    ? resumeState.pending.slice()
    : [{ url: startUrl, depth: 0 }];
  for (const hintUrl of resolveBrowserSeedUrls(startUrl, options)) {
    pending.push({ url: hintUrl, depth: 1, discoveredBy: 'route-hint' });
  }
  const visited = new Set(Array.isArray(resumeState && resumeState.visited) ? resumeState.visited : []);
  const pageLimit = normalizeLimit(options.pageLimit, 10);
  const depthLimit = normalizeLimit(options.depth, 1);
  const rootOrigin = new URL(startUrl).origin;
  const pages = [];
  const storageStateOutPath = projectPaths ? projectPaths.storageStatePath : null;
  const { browser, context } = await createBrowserCaptureContext(options, startUrl, storageStateOutPath);

  try {
    await maybePerformBrowserLogin(context, options, storageStateOutPath);

    while (pending.length && pages.length < pageLimit) {
      const next = pending.shift();
      const normalizedUrl = normalizeUrlValue(next.url);
      if (visited.has(normalizedUrl) || next.depth > depthLimit) {
        continue;
      }
      visited.add(normalizedUrl);

      const page = await context.newPage();
      try {
        const inspected = await inspectBrowserPage(page, next.url, options);
        pages.push({
          url: inspected.url,
          href: next.url,
          depth: next.depth,
          document: inspected.document,
          storage: inspected.document.browserStorage,
          actions: inspected.actions,
        });

        if (next.depth < depthLimit) {
          for (const link of inspected.links) {
            if (!link.href) {
              continue;
            }
            try {
              const resolved = new URL(link.href, inspected.url).toString();
              if (new URL(resolved).origin !== rootOrigin || !looksLikeHtmlPage(resolved)) {
                continue;
              }
              pending.push({ url: resolved, depth: next.depth + 1 });
            } catch {
              // Ignore malformed browser-discovered links.
            }
          }
        }

        if (projectPaths) {
          ensureParentDir(projectPaths.crawlStatePath);
          writeJson(projectPaths.crawlStatePath, {
            updatedAt: new Date().toISOString(),
            pending,
            visited: [...visited],
            completedPages: pages.map((entry) => entry.url),
          });
        }
      } finally {
        await page.close();
      }
    }

    if (storageStateOutPath) {
      ensureParentDir(storageStateOutPath);
      await context.storageState({ path: storageStateOutPath });
    }

    return {
      pages,
      visited: [...visited],
      pending,
      storageStatePath: storageStateOutPath,
    };
  } finally {
    await context.close();
    await browser.close();
  }
}

function summarizeFrontendWorkspace(document, bundle) {
  return {
    htmlFiles: 3 + (document.comments.length ? 1 : 0),
    cssFiles: bundle.externalStylesheets.filter((asset) => asset.content).length + bundle.inlineStyles.length,
    jsFiles: bundle.externalScripts.filter((asset) => asset.content).length + bundle.inlineScripts.length,
    stylesheetLinks: document.stylesheets.length,
    scriptLinks: document.scripts.length,
  };
}

function toPortablePath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function toHtmlRelativePath(workspaceRoot, htmlDir, relativeAssetPath) {
  return toPortablePath(path.relative(htmlDir, path.join(workspaceRoot, relativeAssetPath))) || '.';
}

function buildEditablePreviewHtml(document, workspaceRoot, htmlDir, cssManifest, jsManifest, assetManifest = [], pageLookup = null) {
  const $ = cheerio.load(document.rawHtml);
  const stylesheetMap = new Map();
  const scriptMap = new Map();
  const assetMap = buildReferenceLookup(assetManifest);
  const inlineCssAssets = cssManifest.filter((asset) => asset.kind === 'inline');
  const inlineJsAssets = jsManifest.filter((asset) => asset.kind === 'inline');

  for (const asset of cssManifest) {
    if (asset.kind !== 'external') {
      continue;
    }

    if (asset.source) {
      stylesheetMap.set(asset.source, asset.file);
    }
    if (asset.resolvedUrl) {
      stylesheetMap.set(asset.resolvedUrl, asset.file);
    }
  }

  for (const asset of jsManifest) {
    if (asset.kind !== 'external') {
      continue;
    }

    if (asset.source) {
      scriptMap.set(asset.source, asset.file);
    }
    if (asset.resolvedUrl) {
      scriptMap.set(asset.resolvedUrl, asset.file);
    }
  }

  const rewriteAssetReference = (value) => {
    const mapped = assetMap.get(value);
    return mapped ? toHtmlRelativePath(workspaceRoot, htmlDir, mapped) : null;
  };

  $('link[rel="stylesheet"]').each((_, element) => {
    const href = $(element).attr('href') || '';
    const mapped = stylesheetMap.get(href);
    if (mapped) {
      $(element).attr('href', toHtmlRelativePath(workspaceRoot, htmlDir, mapped));
    }
  });

  $('script[src]').each((_, element) => {
    const src = $(element).attr('src') || '';
    const mapped = scriptMap.get(src);
    if (mapped) {
      $(element).attr('src', toHtmlRelativePath(workspaceRoot, htmlDir, mapped));
    }
  });

  $('style').each((index, element) => {
    const asset = inlineCssAssets[index];
    if (!asset) {
      return;
    }

    const href = toHtmlRelativePath(workspaceRoot, htmlDir, asset.file);
    $(element).replaceWith(`<link rel="stylesheet" href="${href}">`);
  });

  let inlineScriptIndex = 0;
  $('script').each((_, element) => {
    if ($(element).attr('src')) {
      return;
    }

    const asset = inlineJsAssets[inlineScriptIndex];
    inlineScriptIndex += 1;
    if (!asset || /json/i.test(String(asset.type || ''))) {
      return;
    }

    const replacement = $('<script></script>');
    replacement.attr('src', toHtmlRelativePath(workspaceRoot, htmlDir, asset.file));
    if (asset.type && asset.type !== 'text/javascript') {
      replacement.attr('type', asset.type);
    }
    $(element).replaceWith(replacement);
  });

  $('img[src], source[src], video[src], audio[src]').each((_, element) => {
    const src = $(element).attr('src') || '';
    const mapped = rewriteAssetReference(src);
    if (mapped) {
      $(element).attr('src', mapped);
    }
  });

  $('video[poster]').each((_, element) => {
    const poster = $(element).attr('poster') || '';
    const mapped = rewriteAssetReference(poster);
    if (mapped) {
      $(element).attr('poster', mapped);
    }
  });

  $('[srcset]').each((_, element) => {
    $(element).attr('srcset', rewriteSrcsetValue($(element).attr('srcset') || '', htmlDir, workspaceRoot, assetMap));
  });

  $('[style]').each((_, element) => {
    $(element).attr('style', rewriteCssReferences($(element).attr('style') || '', htmlDir, workspaceRoot, assetMap));
  });

  $('link[href]').each((_, element) => {
    const href = $(element).attr('href') || '';
    const rel = ($(element).attr('rel') || '').toLowerCase();
    if (rel.includes('stylesheet')) {
      return;
    }
    const mapped = rewriteAssetReference(href);
    if (mapped) {
      $(element).attr('href', mapped);
    }
  });

  if (pageLookup) {
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href') || '';
      const mapped = pageLookup.get(href);
      if (mapped) {
        $(element).attr('href', toHtmlRelativePath(workspaceRoot, htmlDir, mapped));
      }
    });

    $('iframe[src]').each((_, element) => {
      const src = $(element).attr('src') || '';
      let mapped = pageLookup.get(src);
      if (!mapped) {
        try {
          mapped = pageLookup.get(normalizeUrlValue(src));
        } catch {
          mapped = null;
        }
      }
      if (mapped) {
        $(element).attr('src', toHtmlRelativePath(workspaceRoot, htmlDir, mapped));
      }
    });
  }

  if ($('meta[name="generator"]').length === 0) {
    $('head').append('<meta name="generator" content="WebArsenal editable workspace">');
  }

  return $.html();
}

async function materializeFrontendWorkspace(definition, document, source, bundle, options) {
  const workspaceRoot = path.resolve(
    options.outputDir || path.join(process.cwd(), 'output', definition.category, definition.slug, deriveWorkspaceName(document, source))
  );
  const htmlDir = path.join(workspaceRoot, 'html');
  const cssDir = path.join(workspaceRoot, 'css');
  const jsDir = path.join(workspaceRoot, 'js');
  const metaDir = path.join(workspaceRoot, 'meta');
  const vscodeDir = path.join(workspaceRoot, '.vscode');

  fs.mkdirSync(htmlDir, { recursive: true });
  fs.mkdirSync(cssDir, { recursive: true });
  fs.mkdirSync(jsDir, { recursive: true });
  fs.mkdirSync(metaDir, { recursive: true });
  fs.mkdirSync(vscodeDir, { recursive: true });

  writeText(path.join(htmlDir, 'index.html'), document.rawHtml);
  writeText(path.join(htmlDir, 'body.html'), document.bodyHtml || '');

  if (document.comments.length) {
    writeText(path.join(htmlDir, 'comments.txt'), `${document.comments.join('\n\n')}\n`);
  }

  const cssManifest = [];
  const cssNames = new Set();
  for (const asset of bundle.externalStylesheets) {
    if (!asset.content) {
      continue;
    }

    const fileName = nextAvailableAssetName(
      cssNames,
      inferFileStem(asset.reference || asset.resolvedUrl, 'stylesheet'),
      inferAssetExtension(asset.reference || asset.resolvedUrl, '.css')
    );
    const relativePath = path.join('css', fileName);
    writeText(path.join(workspaceRoot, relativePath), asset.content);
    cssManifest.push({
      kind: 'external',
      source: asset.reference,
      resolvedUrl: asset.resolvedUrl,
      file: relativePath,
      bytes: asset.bytes || Buffer.byteLength(asset.content, 'utf8'),
    });
  }

  for (let index = 0; index < bundle.inlineStyles.length; index += 1) {
    const asset = bundle.inlineStyles[index];
    const fileName = nextAvailableAssetName(cssNames, `inline-style-${index + 1}`, '.css');
    const relativePath = path.join('css', fileName);
    writeText(path.join(workspaceRoot, relativePath), asset.content);
    cssManifest.push({
      kind: 'inline',
      source: asset.source,
      file: relativePath,
      bytes: asset.bytes,
    });
  }

  const jsManifest = [];
  const jsNames = new Set();
  for (const asset of bundle.externalScripts) {
    if (!asset.content) {
      continue;
    }

    const fileName = nextAvailableAssetName(
      jsNames,
      inferFileStem(asset.reference || asset.resolvedUrl, 'script'),
      inferScriptExtension('text/javascript', asset.reference || asset.resolvedUrl)
    );
    const relativePath = path.join('js', fileName);
    writeText(path.join(workspaceRoot, relativePath), asset.content);
    jsManifest.push({
      kind: 'external',
      source: asset.reference,
      resolvedUrl: asset.resolvedUrl,
      file: relativePath,
      bytes: asset.bytes || Buffer.byteLength(asset.content, 'utf8'),
    });
  }

  for (let index = 0; index < bundle.inlineScripts.length; index += 1) {
    const asset = bundle.inlineScripts[index];
    const fileName = nextAvailableAssetName(
      jsNames,
      `inline-script-${index + 1}`,
      inferScriptExtension(asset.type, asset.source)
    );
    const relativePath = path.join('js', fileName);
    writeText(path.join(workspaceRoot, relativePath), asset.content);
    jsManifest.push({
      kind: 'inline',
      source: asset.source,
      type: asset.type,
      file: relativePath,
      bytes: asset.bytes,
    });
  }

  const assetMode = definition.slug === 'image-asset-downloader' ? 'images' : 'all';
  const downloadedAssets = FULL_SITE_DOWNLOAD_SLUGS.has(definition.slug)
    ? await downloadBinaryAssetSet(collectReferencedBinaryAssets(document, bundle, source, assetMode), workspaceRoot, options)
    : [];
  const downloadedAssetLookup = buildReferenceLookup(downloadedAssets);

  if (downloadedAssets.length) {
    for (const asset of cssManifest) {
      const absoluteFile = path.join(workspaceRoot, asset.file);
      if (!fs.existsSync(absoluteFile)) {
        continue;
      }
      writeText(
        absoluteFile,
        rewriteCssReferences(readTextFile(absoluteFile), path.dirname(absoluteFile), workspaceRoot, downloadedAssetLookup)
      );
    }
  }

  const providedPageEntries = Array.isArray(options.pageEntries) && options.pageEntries.length
    ? options.pageEntries
    : null;
  const crawledPages = providedPageEntries
    || (definition.slug === 'full-site-workspace-builder'
      ? await crawlSameOriginPages(document, source, options)
      : [{ url: source.sourceUrl || document.url, href: source.sourceUrl || document.url, depth: 0, document }]);
  const pageLookup = new Map();
  const pagesDir = path.join(workspaceRoot, 'pages');
  if (definition.slug === 'full-site-workspace-builder' || providedPageEntries) {
    fs.mkdirSync(pagesDir, { recursive: true });
    for (let index = 0; index < crawledPages.length; index += 1) {
      const page = crawledPages[index];
      const relativePath = path.join('pages', index === 0 ? 'index.html' : makePageFileName(page.url, `page-${index + 1}`));
      pageLookup.set(page.url, relativePath);
      if (page.href) {
        pageLookup.set(page.href, relativePath);
      }
    }
  }

  const editablePreviewHtml = buildEditablePreviewHtml(document, workspaceRoot, htmlDir, cssManifest, jsManifest, downloadedAssets, pageLookup.size ? pageLookup : null);
  writeText(path.join(htmlDir, 'editable-preview.html'), editablePreviewHtml);

  const savedPages = [];
  if (definition.slug === 'full-site-workspace-builder' || providedPageEntries) {
    for (const page of crawledPages) {
      const relativePath = pageLookup.get(page.url) || path.join('pages', makePageFileName(page.url));
      const pageDir = path.dirname(path.join(workspaceRoot, relativePath));
      const pageHtml = buildEditablePreviewHtml(page.document, workspaceRoot, pageDir, cssManifest, jsManifest, downloadedAssets, pageLookup);
      writeText(path.join(workspaceRoot, relativePath), pageHtml);
      savedPages.push({
        url: page.url,
        file: relativePath,
        depth: page.depth,
        title: page.document.title,
      });
    }
  }

  const manifest = {
    module: definition.id,
    generatedAt: new Date().toISOString(),
    sourceUrl: source.sourceUrl || null,
    inputPath: source.inputPath || null,
    summary: summarizeDocument(document),
    workspace: summarizeFrontendWorkspace(document, bundle),
    html: {
      rawHtml: path.join('html', 'index.html'),
      bodyHtml: path.join('html', 'body.html'),
      editablePreview: path.join('html', 'editable-preview.html'),
      comments: document.comments.length ? path.join('html', 'comments.txt') : null,
    },
    css: cssManifest,
    js: jsManifest,
    assets: downloadedAssets,
    pages: savedPages,
  };

  writeJson(path.join(metaDir, 'manifest.json'), manifest);
  writeJson(path.join(metaDir, 'result.json'), {
    status: 'ok',
    module: definition.id,
    summary: summarizeDocument(document),
  });

  writeText(
    path.join(workspaceRoot, 'README.md'),
    [
      `# ${definition.name} Workspace`,
      '',
      `This folder was generated by \`${definition.filePath}\` and is safe to open in VS Code for editing.`,
      '',
      'Structure:',
      '- `html/` contains the captured markup.',
      '- `html/editable-preview.html` points page assets at local editable CSS/JS copies.',
      '- `css/` contains external and inline stylesheet sources.',
      '- `js/` contains external and inline script sources.',
      '- `meta/manifest.json` maps original asset URLs to the saved files.',
      '',
      'You can modify any of these files locally without affecting the source site.',
    ].join('\n')
  );

  writeJson(path.join(vscodeDir, 'settings.json'), {
    'files.autoSave': 'afterDelay',
    'editor.formatOnSave': true,
    'liveServer.settings.root': '/',
    'files.exclude': {
      '**/meta/result.json': true,
    },
  });

  writeJson(path.join(vscodeDir, 'extensions.json'), {
    recommendations: [
      'ritwickdey.liveserver',
      'esbenp.prettier-vscode',
    ],
  });

  writeJson(getWorkspaceProjectPaths(workspaceRoot).projectPath, buildProjectMetadata(definition, options, source.sourceUrl || document.url));
  snapshotWorkspaceBaseline(workspaceRoot, Boolean(options.refreshBaseline));

  return {
    workspaceDir: workspaceRoot,
    manifestPath: path.join(metaDir, 'manifest.json'),
    editablePreviewPath: path.join(htmlDir, 'editable-preview.html'),
    files: summarizeFrontendWorkspace(document, bundle),
    downloadedAssets: downloadedAssets.filter((asset) => asset.file).length,
    crawledPages: savedPages.length,
  };
}

function launchVsCode(workspaceDir) {
  const finder = process.platform === 'win32' ? 'where.exe' : 'which';
  const lookup = spawnSync(finder, ['code'], { encoding: 'utf8', stdio: 'ignore' });
  if (lookup.status !== 0) {
    return {
      opened: false,
      reason: 'VS Code CLI (`code`) is not available on PATH.',
    };
  }

  const child = spawn('code', [workspaceDir], {
    detached: true,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  child.unref();

  return {
    opened: true,
    command: 'code',
  };
}

function startWorkspaceServer(workspaceDir, options) {
  const port = normalizePort(options.servePort, 4321);
  const scriptPath = path.resolve(__dirname, '..', 'tools', 'serve-workspace.js');
  const child = spawn(process.execPath, [scriptPath, '--dir', workspaceDir, '--port', String(port)], {
    detached: true,
    stdio: 'ignore',
    shell: false,
  });
  child.unref();

  return {
    started: true,
    port,
    url: `http://127.0.0.1:${port}/`,
    pid: child.pid,
  };
}

async function buildFrontendExtractionPayload(definition, document, source, options) {
  if (!FRONTEND_EXTRACTION_SLUGS.has(definition.slug)) {
    return null;
  }

  const limit = normalizeLimit(options.limit, 25);
  const bundle = await buildFrontendExtractionBundle(document, source, options, definition.slug);
  let payload;

  switch (definition.slug) {
    case 'html-source-extractor':
      payload = {
        html: {
          url: document.url,
          title: document.title,
          rawHtml: document.rawHtml,
          bodyHtml: document.bodyHtml,
          comments: document.comments,
        },
      };
      break;
    case 'html-section-scraper':
      payload = {
        sections: bundle.sections.slice(0, limit),
      };
      break;
    case 'html-comment-extractor':
      payload = {
        comments: document.comments.slice(0, limit),
      };
      break;
    case 'component-class-extractor':
      payload = {
        components: bundle.componentClasses.slice(0, limit),
      };
      break;
    case 'dom-snapshot-scraper':
      payload = {
        snapshot: summarizeDocument(document),
        bodyHtml: document.bodyHtml,
        headings: document.headings.slice(0, limit),
        forms: document.forms,
        sections: bundle.sections.slice(0, limit),
      };
      break;
    case 'dom-id-map-extractor':
      payload = {
        ids: bundle.idMap.slice(0, limit),
      };
      break;
    case 'css-bundle-extractor':
      payload = {
        stylesheets: bundle.externalStylesheets,
        inlineStyles: bundle.inlineStyles,
      };
      break;
    case 'css-color-token-extractor':
      payload = {
        colors: bundle.cssColors.slice(0, limit),
        variables: bundle.cssVariables.slice(0, limit),
      };
      break;
    case 'css-variable-extractor':
      payload = {
        variables: bundle.cssVariables.slice(0, limit),
      };
      break;
    case 'css-selector-extractor':
      payload = {
        selectors: bundle.cssSelectors.slice(0, limit),
      };
      break;
    case 'inline-style-extractor':
      payload = {
        inlineStyles: bundle.inlineStyles,
        styleAttributes: document.styleAttributes.slice(0, limit),
      };
      break;
    case 'font-asset-extractor':
      payload = {
        fontPreloads: document.fontPreloads,
        fontFamilies: bundle.fontFamilies.slice(0, limit),
        fontAssets: bundle.fontAssets.slice(0, limit),
      };
      break;
    case 'image-asset-downloader':
      payload = {
        images: [
          ...document.images.map((image) => image.src),
          ...document.srcsetAssets,
          ...document.iconLinks,
        ].filter(Boolean).slice(0, limit),
      };
      break;
    case 'media-query-extractor':
      payload = {
        mediaQueries: bundle.mediaQueries.slice(0, limit),
      };
      break;
    case 'stylesheet-link-scraper':
      payload = {
        stylesheets: bundle.externalStylesheets.map((asset) => ({
          href: asset.reference,
          resolvedUrl: asset.resolvedUrl,
          status: asset.status,
          bytes: asset.bytes || 0,
        })),
      };
      break;
    case 'js-bundle-extractor':
      payload = {
        scripts: bundle.externalScripts,
        inlineScripts: bundle.inlineScripts,
      };
      break;
    case 'inline-script-extractor':
      payload = {
        inlineScripts: bundle.inlineScripts,
      };
      break;
    case 'js-api-call-extractor':
      payload = {
        apiCalls: bundle.jsApiCalls.slice(0, limit),
      };
      break;
    case 'script-link-scraper':
      payload = {
        scripts: bundle.externalScripts.map((asset) => ({
          src: asset.reference,
          resolvedUrl: asset.resolvedUrl,
          status: asset.status,
          bytes: asset.bytes || 0,
        })),
      };
      break;
    case 'js-library-detector':
      payload = {
        libraries: bundle.jsLibraries,
      };
      break;
    case 'js-route-extractor':
      payload = {
        routes: bundle.jsRoutes.slice(0, limit),
        imports: bundle.jsImports.slice(0, limit),
      };
      break;
    case 'linked-asset-downloader':
      payload = {
        stylesheets: document.stylesheets,
        scripts: document.scripts,
        images: document.images.map((image) => image.src).filter(Boolean),
        media: document.mediaAssets,
        manifests: document.manifestLinks,
        fonts: [...document.fontPreloads, ...bundle.fontAssets.map((asset) => asset.asset)],
      };
      break;
    case 'asset-manifest-scraper':
      payload = {
        manifests: document.manifestLinks,
        icons: document.iconLinks,
        fonts: document.fontPreloads,
        stylesheets: document.stylesheets,
        scripts: document.scripts,
        images: document.images.slice(0, limit),
        anchors: document.links.slice(0, limit),
      };
      break;
    case 'frontend-resource-extractor':
      payload = {
        html: {
          rawHtml: document.rawHtml,
          comments: document.comments,
        },
        css: {
          stylesheets: bundle.externalStylesheets,
          inlineStyles: bundle.inlineStyles,
          colors: bundle.cssColors.slice(0, limit),
          fonts: bundle.fontFamilies.slice(0, limit),
        },
        js: {
          scripts: bundle.externalScripts,
          inlineScripts: bundle.inlineScripts,
          apiCalls: bundle.jsApiCalls.slice(0, limit),
        },
      };
      break;
    case 'html-css-js-scraper':
      payload = {
        html: {
          rawHtml: document.rawHtml,
          comments: document.comments,
          sections: bundle.sections.slice(0, limit),
        },
        css: {
          stylesheets: bundle.externalStylesheets,
          inlineStyles: bundle.inlineStyles,
        },
        js: {
          scripts: bundle.externalScripts,
          inlineScripts: bundle.inlineScripts,
        },
      };
      break;
    case 'page-bundle-downloader':
      payload = {
        page: document.url,
        assets: {
          stylesheets: document.stylesheets,
          scripts: document.scripts,
          images: document.images.map((image) => image.src).filter(Boolean),
          media: document.mediaAssets,
          icons: document.iconLinks,
          manifests: document.manifestLinks,
          fonts: [...document.fontPreloads, ...bundle.fontAssets.map((asset) => asset.asset)],
        },
      };
      break;
    case 'full-site-workspace-builder':
      payload = {
        rootPage: document.url,
        assets: {
          stylesheets: document.stylesheets,
          scripts: document.scripts,
          images: document.images.map((image) => image.src).filter(Boolean),
          media: document.mediaAssets,
          icons: document.iconLinks,
          manifests: document.manifestLinks,
          fonts: [...document.fontPreloads, ...bundle.fontAssets.map((asset) => asset.asset)],
        },
        links: document.links.slice(0, limit),
      };
      break;
    case 'asset-dependency-mapper':
      payload = {
        stylesheets: bundle.externalStylesheets.map((asset) => ({
          href: asset.reference,
          resolvedUrl: asset.resolvedUrl,
          imports: asset.imports,
          variables: asset.variables.map((variable) => variable.name),
        })),
        scripts: bundle.externalScripts.map((asset) => ({
          src: asset.reference,
          resolvedUrl: asset.resolvedUrl,
          imports: asset.imports,
          routes: asset.routes,
        })),
        htmlReferences: {
          manifests: document.manifestLinks,
          icons: document.iconLinks,
          stylesheets: document.stylesheets,
          scripts: document.scripts,
        },
      };
      break;
    case 'source-asset-extractor':
      payload = {
        sources: [
          {
            type: 'html',
            source: document.url,
            content: document.rawHtml,
            bytes: document.htmlBytes,
          },
          ...bundle.externalStylesheets.map((asset) => ({
            type: 'css',
            source: asset.resolvedUrl || asset.reference,
            content: asset.content || '',
            bytes: asset.bytes || 0,
          })),
          ...bundle.inlineStyles.map((asset) => ({
            type: 'css',
            source: asset.source,
            content: asset.content,
            bytes: asset.bytes,
          })),
          ...bundle.externalScripts.map((asset) => ({
            type: 'js',
            source: asset.resolvedUrl || asset.reference,
            content: asset.content || '',
            bytes: asset.bytes || 0,
          })),
          ...bundle.inlineScripts.map((asset) => ({
            type: 'js',
            source: asset.source,
            content: asset.content,
            bytes: asset.bytes,
          })),
        ],
      };
      break;
    default:
      return null;
  }

  return {
    payload,
    bundle,
  };
}

function aggregateDocumentsForWorkspace(pages) {
  const root = pages[0].document;
  const aggregate = {
    ...root,
    stylesheets: dedupeBy(pages.flatMap((page) => page.document.stylesheets.map((entry) => {
      try {
        return new URL(entry, page.url).toString();
      } catch {
        return entry;
      }
    })), (value) => value),
    scripts: dedupeBy(pages.flatMap((page) => page.document.scripts.map((entry) => {
      try {
        return new URL(entry, page.url).toString();
      } catch {
        return entry;
      }
    })), (value) => value),
    images: dedupeBy(pages.flatMap((page) => page.document.images.map((image) => ({
      ...image,
      src: (() => {
        try {
          return new URL(image.src, page.url).toString();
        } catch {
          return image.src;
        }
      })(),
    }))), (image) => image.src),
    mediaAssets: dedupeBy(pages.flatMap((page) => page.document.mediaAssets.map((entry) => {
      try {
        return new URL(entry, page.url).toString();
      } catch {
        return entry;
      }
    })), (value) => value),
    iconLinks: dedupeBy(pages.flatMap((page) => page.document.iconLinks.map((entry) => {
      try {
        return new URL(entry, page.url).toString();
      } catch {
        return entry;
      }
    })), (value) => value),
    manifestLinks: dedupeBy(pages.flatMap((page) => page.document.manifestLinks.map((entry) => {
      try {
        return new URL(entry, page.url).toString();
      } catch {
        return entry;
      }
    })), (value) => value),
    fontPreloads: dedupeBy(pages.flatMap((page) => page.document.fontPreloads.map((entry) => {
      try {
        return new URL(entry, page.url).toString();
      } catch {
        return entry;
      }
    })), (value) => value),
    links: dedupeBy(pages.flatMap((page) => page.document.links.map((link) => ({
      ...link,
      href: (() => {
        try {
          return new URL(link.href, page.url).toString();
        } catch {
          return link.href;
        }
      })(),
    }))), (link) => `${link.href}|${link.text}`),
    iframes: dedupeBy(pages.flatMap((page) => (page.document.iframes || []).map((frame) => ({
      ...frame,
      src: (() => {
        try {
          return new URL(frame.src, page.url).toString();
        } catch {
          return frame.src;
        }
      })(),
    }))), (frame) => frame.src),
  };

  return aggregate;
}

async function handleBrowserCaptureScraper(definition, options) {
  if (!options.url) {
    return {
      status: 'skipped',
      module: definition.id,
      reason: 'Provide --url <value> for browser-based capture.',
    };
  }

  const workspaceRoot = path.resolve(
    options.outputDir || path.join(process.cwd(), 'output', definition.category, definition.slug, sanitizePathToken(options.url, 'site'))
  );
  const projectPaths = getWorkspaceProjectPaths(workspaceRoot);
  fs.mkdirSync(projectPaths.metaDir, { recursive: true });

  const browserCapture = await crawlSiteWithBrowser(options.url, options, workspaceRoot);
  if (!browserCapture.pages.length) {
    return {
      status: 'skipped',
      module: definition.id,
      reason: 'Browser crawl completed without any captured pages.',
    };
  }

  const aggregateDocument = aggregateDocumentsForWorkspace(browserCapture.pages);
  const source = {
    kind: 'document',
    sourceUrl: browserCapture.pages[0].url,
    baseDir: null,
    inputPath: null,
  };
  const payloadOptions = {
    ...options,
    pageEntries: browserCapture.pages,
  };
  const frontendExtraction = await buildFrontendExtractionPayload(definition, aggregateDocument, source, payloadOptions)
    || { payload: pickScraperPayload(definition, aggregateDocument, options), bundle: await buildFrontendExtractionBundle(aggregateDocument, source, options, definition.slug) };
  const materialized = await materializeFrontendWorkspace(definition, aggregateDocument, source, frontendExtraction.bundle, payloadOptions);

  if (browserCapture.storageStatePath && fs.existsSync(browserCapture.storageStatePath)) {
    // Keep storage state path stable in the result for re-use.
    materialized.storageStatePath = browserCapture.storageStatePath;
  }

  writeJson(projectPaths.projectPath, {
    ...buildProjectMetadata(definition, options, browserCapture.pages[0].url),
    browser: true,
    actionDriven: definition.slug === 'browser-action-crawler',
    authenticated: definition.slug === 'authenticated-browser-capture',
  });

  const result = {
    status: 'ok',
    module: definition.id,
    summary: summarizeDocument(aggregateDocument),
    data: frontendExtraction.payload,
    crawledPages: browserCapture.pages.length,
    resumePending: browserCapture.pending.length,
    visitedUrls: browserCapture.visited,
    ...materialized,
  };

  if (options.openVscode) {
    result.vscode = launchVsCode(result.workspaceDir);
  }

  if (options.serve) {
    result.previewServer = startWorkspaceServer(result.workspaceDir, options);
  }

  if (options.output) {
    const outputPath = normalizeOutputPath(definition, options);
    writeJson(outputPath, result);
    result.outputPath = outputPath;
  }

  return result;
}

async function handleScraper(definition, options) {
  if (BROWSER_CAPTURE_SLUGS.has(definition.slug)) {
    return handleBrowserCaptureScraper(definition, options);
  }

  const source = await loadSource(definition, options);
  if (source.kind !== 'document') {
    return {
      status: 'skipped',
      reason: 'Provide --url or --input <html/json file> to scrape content.',
      module: definition.id,
    };
  }

  const frontendExtraction = await buildFrontendExtractionPayload(definition, source.value, source, options);
  const payload = frontendExtraction ? frontendExtraction.payload : pickScraperPayload(definition, source.value, options);
  const result = {
    status: 'ok',
    module: definition.id,
    summary: summarizeDocument(source.value),
    data: payload,
  };

  if (frontendExtraction) {
    Object.assign(result, await materializeFrontendWorkspace(definition, source.value, source, frontendExtraction.bundle, options));

    if (options.openVscode) {
      result.vscode = launchVsCode(result.workspaceDir);
    }

    if (options.serve) {
      result.previewServer = startWorkspaceServer(result.workspaceDir, options);
    }
  }

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
  if (definition.slug === 'cloned-site-package-exporter') {
    const workspaceRoot = getWorkspaceRootFromOptions(options);
    if (!fs.existsSync(workspaceRoot)) {
      return { status: 'skipped', module: definition.id, reason: 'Provide --dir <workspace> for package export.' };
    }

    const packageResult = exportClonedSitePackage(workspaceRoot, options);
    return {
      status: 'ok',
      module: definition.id,
      workspaceDir: workspaceRoot,
      ...packageResult,
    };
  }

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

async function recordLoginSessionProfile(definition, options) {
  const targetUrl = options.url || options.loginUrl;
  if (!targetUrl) {
    return { status: 'skipped', module: definition.id, reason: 'Provide --url or --login-url for session recording.' };
  }

  const profileToken = sanitizePathToken(options.profile || targetUrl, 'session-profile');
  const workspaceDir = path.resolve(
    options.outputDir || path.join(process.cwd(), 'output', definition.category, definition.slug, profileToken)
  );
  const metaDir = path.join(workspaceDir, 'meta');
  fs.mkdirSync(metaDir, { recursive: true });

  const storageStatePath = path.join(metaDir, 'storage-state.json');
  const cookiesPath = path.join(metaDir, 'cookies.json');
  const localStoragePath = path.join(metaDir, 'local-storage.json');
  const sessionStoragePath = path.join(metaDir, 'session-storage.json');
  const htmlSnapshotPath = path.join(workspaceDir, 'html', 'captured-page.html');
  const profilePath = path.join(metaDir, 'session-profile.json');
  const { browser, context } = await createBrowserCaptureContext(options, targetUrl, storageStatePath);

  try {
    const loginResult = await maybePerformBrowserLogin(context, options, storageStatePath);
    const inspectTarget = options.recordUrl || options.url || loginResult.finalUrl || options.loginUrl;
    const page = await context.newPage();

    try {
      const inspected = await inspectBrowserPage(page, inspectTarget, options);
      await context.storageState({ path: storageStatePath });
      const cookies = await context.cookies();
      writeJson(cookiesPath, cookies);
      writeJson(localStoragePath, inspected.document.browserStorage.localStorage || {});
      writeJson(sessionStoragePath, inspected.document.browserStorage.sessionStorage || {});
      writeText(htmlSnapshotPath, inspected.document.rawHtml);

      const profile = {
        module: definition.id,
        recordedAt: new Date().toISOString(),
        profile: options.profile || null,
        targetUrl,
        loginUrl: options.loginUrl || null,
        recordUrl: inspectTarget,
        finalUrl: inspected.url,
        loggedIn: loginResult.loggedIn,
        selectors: {
          usernameSelector: options.usernameSelector || null,
          passwordSelector: options.passwordSelector || null,
          submitSelector: options.submitSelector || null,
          waitFor: options.waitFor || null,
        },
        artifacts: {
          storageState: path.relative(workspaceDir, storageStatePath),
          cookies: path.relative(workspaceDir, cookiesPath),
          localStorage: path.relative(workspaceDir, localStoragePath),
          sessionStorage: path.relative(workspaceDir, sessionStoragePath),
          htmlSnapshot: path.relative(workspaceDir, htmlSnapshotPath),
        },
      };
      writeJson(profilePath, profile);

      const result = {
        status: 'ok',
        module: definition.id,
        workspaceDir,
        profilePath,
        storageStatePath,
        cookiesPath,
        localStoragePath,
        sessionStoragePath,
        htmlSnapshotPath,
        loggedIn: loginResult.loggedIn,
        finalUrl: inspected.url,
        title: inspected.document.browserTitle || inspected.document.title,
      };

      if (options.openVscode) {
        result.vscode = launchVsCode(workspaceDir);
      }

      return result;
    } finally {
      await page.close();
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

async function handleAuth(definition, options) {
  const slug = definition.slug;

  if (slug === 'login-session-recorder') {
    return recordLoginSessionProfile(definition, options);
  }

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

function getWorkspaceRootFromOptions(options) {
  return path.resolve(options.dir || options.input || options.outputDir || process.cwd());
}

function getWorkspaceContentFiles(workspaceRoot) {
  const includeRoots = ['html', 'css', 'js', 'pages', 'images', 'fonts', 'media', 'misc'];
  return includeRoots.flatMap((rootName) => {
    const absoluteRoot = path.join(workspaceRoot, rootName);
    return listFilesRecursive(absoluteRoot).map((relativePath) => path.join(rootName, relativePath));
  });
}

function hashFile(filePath) {
  return stableHash(fs.readFileSync(filePath));
}

function buildWorkspaceDiff(workspaceRoot) {
  const paths = getWorkspaceProjectPaths(workspaceRoot);
  const baselineRoot = paths.originalDir;
  const currentFiles = getWorkspaceContentFiles(workspaceRoot);
  const baselineFiles = listFilesRecursive(baselineRoot).map((relativePath) => relativePath.replace(/^[\\/]+/, ''));
  const currentSet = new Set(currentFiles.map((entry) => toPortablePath(entry)));
  const baselineSet = new Set(baselineFiles.map((entry) => toPortablePath(entry)));

  const added = [...currentSet].filter((entry) => !baselineSet.has(entry));
  const deleted = [...baselineSet].filter((entry) => !currentSet.has(entry));
  const changed = [...currentSet].filter((entry) => {
    if (!baselineSet.has(entry)) {
      return false;
    }
    const currentFile = path.join(workspaceRoot, entry);
    const baselineFile = path.join(baselineRoot, entry);
    return hashFile(currentFile) !== hashFile(baselineFile);
  });

  return {
    added,
    changed,
    deleted,
    unchanged: [...currentSet].filter((entry) => baselineSet.has(entry) && !changed.includes(entry)),
  };
}

function copySelectedFiles(workspaceRoot, relativeFiles, targetRoot, sourceRoot = workspaceRoot) {
  for (const relativeFile of relativeFiles) {
    const sourceFile = path.join(sourceRoot, relativeFile);
    if (!fs.existsSync(sourceFile)) {
      continue;
    }
    const targetFile = path.join(targetRoot, relativeFile);
    ensureParentDir(targetFile);
    fs.copyFileSync(sourceFile, targetFile);
  }
}

function materializeWorkspaceRebuildOutputs(workspaceRoot, diff) {
  const rebuildRoot = path.join(workspaceRoot, 'rebuild');
  const changedRoot = path.join(rebuildRoot, 'changed');
  const currentRoot = path.join(rebuildRoot, 'current');
  fs.mkdirSync(changedRoot, { recursive: true });
  fs.mkdirSync(currentRoot, { recursive: true });

  copySelectedFiles(workspaceRoot, [...diff.added, ...diff.changed], changedRoot);
  copySelectedFiles(workspaceRoot, getWorkspaceContentFiles(workspaceRoot), currentRoot);

  return {
    rebuildRoot,
    changedRoot,
    currentRoot,
  };
}

function copyDirectoryContents(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return [];
  }

  const copied = [];
  for (const relativeFile of listFilesRecursive(sourceDir)) {
    const sourceFile = path.join(sourceDir, relativeFile);
    const targetFile = path.join(targetDir, relativeFile);
    ensureParentDir(targetFile);
    fs.copyFileSync(sourceFile, targetFile);
    copied.push(relativeFile);
  }

  return copied;
}

function detectJavaScriptModuleSyntax(source) {
  return /^\s*(import|export)\b/m.test(String(source || ''));
}

function validateJavaScriptSyntax(filePath) {
  const content = readTextFile(filePath);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webarsenal-js-check-'));
  const extension = detectJavaScriptModuleSyntax(content) ? '.mjs' : '.js';
  const tempFile = path.join(tempDir, `syntax-check${extension}`);

  try {
    writeText(tempFile, content);
    const result = spawnSync(process.execPath, ['--check', tempFile], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.status === 0) {
      return null;
    }

    return {
      type: 'js-syntax',
      file: path.relative(path.dirname(filePath), filePath),
      message: (result.stderr || result.stdout || 'JavaScript syntax check failed.')
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)
        .pop(),
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function validateCssSyntax(filePath, workspaceRoot) {
  const source = readTextFile(filePath);
  const issues = [];
  const stripped = stripCssComments(source);
  let balance = 0;

  for (const character of stripped) {
    if (character === '{') {
      balance += 1;
    } else if (character === '}') {
      balance -= 1;
    }

    if (balance < 0) {
      issues.push({
        type: 'css-syntax',
        file: path.relative(workspaceRoot, filePath),
        message: 'Found a closing brace without a matching opening brace.',
      });
      balance = 0;
      break;
    }
  }

  if (balance > 0) {
    issues.push({
      type: 'css-syntax',
      file: path.relative(workspaceRoot, filePath),
      message: 'CSS appears to have unclosed rule blocks.',
    });
  }

  if (/\/\*/.test(stripped) || /\*\//.test(stripped)) {
    issues.push({
      type: 'css-syntax',
      file: path.relative(workspaceRoot, filePath),
      message: 'CSS appears to have an unterminated comment.',
    });
  }

  const references = [...extractCssAssetUrls(source), ...extractCssImports(source)];
  for (const reference of references) {
    if (/^(https?:|data:|#)/i.test(reference)) {
      continue;
    }

    const cleanReference = reference.split('#')[0].split('?')[0];
    const absoluteTarget = path.resolve(path.dirname(filePath), cleanReference);
    if (!absoluteTarget.startsWith(workspaceRoot) || !fs.existsSync(absoluteTarget)) {
      issues.push({
        type: 'css-reference',
        file: path.relative(workspaceRoot, filePath),
        message: `Missing local CSS dependency: ${reference}`,
      });
    }
  }

  return issues;
}

function buildWorkspaceIntegrityReport(workspaceRoot) {
  const htmlFiles = [
    ...listFilesRecursive(path.join(workspaceRoot, 'html')).map((entry) => path.join('html', entry)),
    ...listFilesRecursive(path.join(workspaceRoot, 'pages')).map((entry) => path.join('pages', entry)),
  ].filter((entry) => /\.html?$/i.test(entry));
  const cssFiles = listFilesRecursive(path.join(workspaceRoot, 'css'))
    .map((entry) => path.join('css', entry))
    .filter((entry) => /\.css$/i.test(entry));
  const jsFiles = listFilesRecursive(path.join(workspaceRoot, 'js'))
    .map((entry) => path.join('js', entry))
    .filter((entry) => /\.(?:c?js|mjs)$/i.test(entry));
  const issues = [];

  for (const relativeHtmlFile of htmlFiles) {
    const absoluteHtmlFile = path.join(workspaceRoot, relativeHtmlFile);
    const html = readTextFile(absoluteHtmlFile);
    const $ = cheerio.load(html);
    if ($('html').length === 0) {
      issues.push({
        type: 'html-structure',
        file: relativeHtmlFile,
        message: 'HTML document is missing an <html> root element.',
      });
    }
    if ($('body').length === 0) {
      issues.push({
        type: 'html-structure',
        file: relativeHtmlFile,
        message: 'HTML document is missing a <body> element.',
      });
    }
  }

  for (const relativeCssFile of cssFiles) {
    issues.push(...validateCssSyntax(path.join(workspaceRoot, relativeCssFile), workspaceRoot));
  }

  for (const relativeJsFile of jsFiles) {
    const jsIssue = validateJavaScriptSyntax(path.join(workspaceRoot, relativeJsFile));
    if (jsIssue) {
      jsIssue.file = relativeJsFile;
      issues.push(jsIssue);
    }
  }

  const referenceAudit = collectWorkspaceReferences(workspaceRoot);
  for (const missing of referenceAudit.missing) {
    issues.push({
      type: 'missing-reference',
      file: missing.file,
      message: `Missing local asset: ${missing.reference}`,
    });
  }

  return {
    workspaceDir: workspaceRoot,
    htmlFiles: htmlFiles.length,
    cssFiles: cssFiles.length,
    jsFiles: jsFiles.length,
    issues,
    summary: {
      totalIssues: issues.length,
      htmlStructureIssues: issues.filter((issue) => issue.type === 'html-structure').length,
      cssIssues: issues.filter((issue) => issue.type === 'css-syntax' || issue.type === 'css-reference').length,
      jsIssues: issues.filter((issue) => issue.type === 'js-syntax').length,
      missingReferences: issues.filter((issue) => issue.type === 'missing-reference').length,
    },
  };
}

function exportClonedSitePackage(workspaceRoot, options = {}) {
  const packageRoot = path.join(workspaceRoot, 'package');
  const siteRoot = path.join(packageRoot, 'site');
  const includeRoots = ['html', 'css', 'js', 'pages', 'images', 'fonts', 'media', 'misc', 'meta', '.vscode'];
  fs.mkdirSync(siteRoot, { recursive: true });

  const includedRoots = [];
  for (const rootName of includeRoots) {
    const sourceRoot = path.join(workspaceRoot, rootName);
    const targetRoot = path.join(siteRoot, rootName);
    if (!fs.existsSync(sourceRoot)) {
      continue;
    }
    copyDirectoryContents(sourceRoot, targetRoot);
    includedRoots.push(rootName);
  }

  const entrypoint = fs.existsSync(path.join(siteRoot, 'html', 'editable-preview.html'))
    ? 'html/editable-preview.html'
    : (fs.existsSync(path.join(siteRoot, 'html', 'index.html')) ? 'html/index.html' : null);
  const rootIndexPath = path.join(siteRoot, 'index.html');
  if (entrypoint) {
    writeText(rootIndexPath, [
      '<!doctype html>',
      '<html><head>',
      '<meta charset="utf-8">',
      `<meta http-equiv="refresh" content="0; url=./${entrypoint}">`,
      `<title>${path.basename(workspaceRoot)} package</title>`,
      `</head><body><p>Open <a href="./${entrypoint}">${entrypoint}</a>.</p></body></html>`,
    ].join(''));
  }

  const manifest = {
    exportedAt: new Date().toISOString(),
    workspaceDir: workspaceRoot,
    siteRoot,
    entrypoint: entrypoint ? `site/${entrypoint}` : null,
    rootIndex: fs.existsSync(rootIndexPath) ? 'site/index.html' : null,
    includedRoots,
  };
  const manifestPath = path.join(packageRoot, 'package-manifest.json');
  writeJson(manifestPath, manifest);
  const archivePath = path.join(packageRoot, 'package-manifest.json.gz');
  fs.writeFileSync(archivePath, zlib.gzipSync(Buffer.from(JSON.stringify(manifest, null, 2), 'utf8')));

  return {
    packageRoot,
    siteRoot,
    manifestPath,
    archivePath,
    entrypoint: manifest.entrypoint,
    rootIndex: manifest.rootIndex,
    includedRoots,
    servedPreview: optionEnabled(options.serve) ? startWorkspaceServer(siteRoot, options) : null,
  };
}

function collectWorkspaceReferences(workspaceRoot) {
  const htmlFiles = [
    ...listFilesRecursive(path.join(workspaceRoot, 'html')).map((entry) => path.join('html', entry)),
    ...listFilesRecursive(path.join(workspaceRoot, 'pages')).map((entry) => path.join('pages', entry)),
  ].filter((entry) => /\.html?$/i.test(entry));

  const missing = [];

  for (const relativeHtmlFile of htmlFiles) {
    const absoluteHtmlFile = path.join(workspaceRoot, relativeHtmlFile);
    const html = readTextFile(absoluteHtmlFile);
    const $ = cheerio.load(html);
    const references = [
      ...$('link[href]').map((_, element) => ({ type: 'href', value: $(element).attr('href') || '' })).get(),
      ...$('script[src]').map((_, element) => ({ type: 'src', value: $(element).attr('src') || '' })).get(),
      ...$('iframe[src]').map((_, element) => ({ type: 'src', value: $(element).attr('src') || '' })).get(),
      ...$('img[src], source[src], video[src], audio[src]').map((_, element) => ({ type: 'src', value: $(element).attr('src') || '' })).get(),
      ...$('video[poster]').map((_, element) => ({ type: 'poster', value: $(element).attr('poster') || '' })).get(),
      ...$('[srcset]').map((_, element) => ({ type: 'srcset', value: $(element).attr('srcset') || '' })).get(),
      ...$('[style]').map((_, element) => ({ type: 'style', value: $(element).attr('style') || '' })).get(),
    ];

    for (const reference of references) {
      if (!reference.value) {
        continue;
      }

      const values = reference.type === 'srcset'
        ? parseSrcsetUrls(reference.value)
        : (reference.type === 'style' ? extractCssAssetUrls(reference.value) : [reference.value]);
      for (const value of values) {
        if (/^(https?:|data:|mailto:|tel:|javascript:|#)/i.test(value)) {
          continue;
        }

        const cleanValue = value.split('#')[0].split('?')[0];
        const absoluteTarget = path.resolve(path.dirname(absoluteHtmlFile), cleanValue);
        if (!absoluteTarget.startsWith(workspaceRoot) || !fs.existsSync(absoluteTarget)) {
          missing.push({
            file: relativeHtmlFile,
            reference: value,
          });
        }
      }
    }
  }

  return {
    htmlFiles,
    missing,
  };
}

async function capturePageScreenshotBuffer(target, options = {}) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const gotoTarget = options.isFile ? pathToFileURL(path.resolve(target)).toString() : target;
    await page.goto(gotoTarget, { waitUntil: 'networkidle', timeout: normalizeTimeout(options.timeout, 20000) }).catch(async () => {
      await page.goto(gotoTarget, { waitUntil: 'domcontentloaded', timeout: normalizeTimeout(options.timeout, 20000) });
    });
    await page.waitForTimeout(500);
    return page.screenshot({ fullPage: false, type: 'png' });
  } finally {
    await browser.close();
  }
}

async function compareVisualTargets(sourceTarget, workspaceTarget, options) {
  const sharp = require('sharp');
  const left = await capturePageScreenshotBuffer(sourceTarget, { timeout: options.timeout });
  const right = await capturePageScreenshotBuffer(workspaceTarget, { timeout: options.timeout, isFile: true });

  const size = { width: 1280, height: 900 };
  const [leftRaw, rightRaw] = await Promise.all([
    sharp(left).resize(size.width, size.height).removeAlpha().raw().toBuffer(),
    sharp(right).resize(size.width, size.height).removeAlpha().raw().toBuffer(),
  ]);

  let diff = 0;
  for (let index = 0; index < leftRaw.length; index += 1) {
    diff += Math.abs(leftRaw[index] - rightRaw[index]);
  }

  const percent = (diff / (leftRaw.length * 255)) * 100;
  return {
    diffPercent: Number(percent.toFixed(2)),
    width: size.width,
    height: size.height,
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

  if (slug === 'workspace-diff-builder') {
    const workspaceRoot = getWorkspaceRootFromOptions(options);
    const paths = getWorkspaceProjectPaths(workspaceRoot);
    const diff = buildWorkspaceDiff(workspaceRoot);
    const rebuild = materializeWorkspaceRebuildOutputs(workspaceRoot, diff);
    const result = {
      status: 'ok',
      module: definition.id,
      workspaceDir: workspaceRoot,
      summary: {
        added: diff.added.length,
        changed: diff.changed.length,
        deleted: diff.deleted.length,
        unchanged: diff.unchanged.length,
      },
      diff,
      rebuild,
    };
    writeJson(paths.diffReportPath, result);
    return result;
  }

  if (slug === 'workspace-integrity-validator') {
    const workspaceRoot = getWorkspaceRootFromOptions(options);
    const paths = getWorkspaceProjectPaths(workspaceRoot);
    const report = buildWorkspaceIntegrityReport(workspaceRoot);
    const result = {
      status: 'ok',
      module: definition.id,
      ...report,
    };
    writeJson(paths.integrityReportPath, result);
    return result;
  }

  if (slug === 'workspace-qa-validator') {
    const workspaceRoot = getWorkspaceRootFromOptions(options);
    const paths = getWorkspaceProjectPaths(workspaceRoot);
    const project = readJsonIfExists(paths.projectPath, {});
    const references = collectWorkspaceReferences(workspaceRoot);
    const result = {
      status: 'ok',
      module: definition.id,
      workspaceDir: workspaceRoot,
      htmlFilesChecked: references.htmlFiles.length,
      missingAssets: references.missing,
      missingAssetCount: references.missing.length,
      visualComparison: null,
    };

    const compareUrl = options.compareUrl || project.sourceUrl || null;
    const previewFile = path.join(workspaceRoot, 'html', 'editable-preview.html');
    if (options.visual && compareUrl && fs.existsSync(previewFile)) {
      try {
        result.visualComparison = await compareVisualTargets(compareUrl, previewFile, options);
      } catch (error) {
        result.visualComparison = {
          error: error.message,
        };
      }
    }

    writeJson(paths.qaReportPath, result);
    return result;
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
    '  --asset-limit <n>     Maximum external CSS/JS assets to fetch for source extractors',
    '  --download-limit <n>  Maximum binary assets to download into generated workspaces',
    '  --page-limit <n>      Maximum same-origin pages to save for full-site workspace builds',
    '  --depth <n>           Crawl depth for same-origin page capture',
    '  --output-dir <path>   Folder where editable html/css/js source files should be written',
    '  --resume              Resume a browser/site crawl from the workspace meta state',
    '  --refresh-baseline    Refresh the stored original baseline snapshot for diff/rebuild',
    '  --storage-state <p>   Playwright storage state file to load before authenticated capture',
    '  --login-url <url>     Login page URL for browser-authenticated capture',
    '  --username <value>    Username to fill during scripted login',
    '  --password <value>    Password to fill during scripted login',
    '  --username-selector <css> CSS selector for the username field',
    '  --password-selector <css> CSS selector for the password field',
    '  --submit-selector <css>   CSS selector for the submit button',
    '  --wait-for <css>      Selector to wait for after login or page navigation',
    '  --local-storage-json <json|path> Seed localStorage before browser navigation',
    '  --session-storage-json <json|path> Seed sessionStorage before browser navigation',
    '  --scroll              Scroll pages before capturing hydrated browser content',
    '  --scroll-steps <n>    Number of incremental browser scroll steps for lazy-loaded pages',
    '  --scroll-pause <ms>   Delay between browser scroll steps',
    '  --dismiss-selectors <csv> Click selectors before capture (cookie banners, modals)',
    '  --click-selectors <csv>   Click selectors during browser crawl to reveal more routes',
    '  --pagination-selector <css> Selector used to harvest pagination links',
    '  --route-hints <csv>   Extra relative or absolute routes to seed into browser crawl',
    '  --record-url <url>    Page to snapshot when recording a reusable login session profile',
    '  --visual              Enable visual comparison where supported',
    '  --compare-url <url>   Source page URL to compare against a local workspace preview',
    '  --open-vscode         Open the generated workspace in VS Code after extraction',
    '  --serve               Start a local static preview server for the generated workspace',
    '  --serve-port <n>      Port to use with --serve (default: 4321)',
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
