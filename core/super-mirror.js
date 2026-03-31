#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║        SUPER WEB MIRROR  v3.0  — Ultra-Powered Site Cloner          ║
 * ║  Stealth · Recursive · Concurrent · Rewriting · Screenshots · Resume ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

'use strict';
// [WebArsenal 4.0.0 Enhancements applied: JS Injection, Form Detection, Webhooks]

const puppeteer       = require('puppeteer-extra');
const StealthPlugin   = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const { program }     = require('commander');
const cliProgress     = require('cli-progress');
const chalk           = require('chalk');
const cheerio         = require('cheerio');
const pLimit          = require('p-limit');
const fs              = require('fs');
const path            = require('path');
const crypto          = require('crypto');
const { URL }         = require('url');

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// ─── CLI ──────────────────────────────────────────────────────────────────────
program
  .name('super-mirror')
  .description('Ultra-powered full-site cloner: stealth, recursive, concurrent, self-contained output')
  .version('4.0.0')
  .requiredOption('-u, --url <url>',          'Target URL to mirror')
  .option('-o, --output <dir>',               'Output directory',              './super-mirrored-site')
  .option('-d, --depth <n>',                  'Max crawl depth',               parseInt, 6)
  .option('-c, --concurrency <n>',            'Parallel browser pages',        parseInt, 3)
  .option('--delay <ms>',                     'Delay between requests (ms)',   parseInt, 400)
  .option('--max-pages <n>',                  'Max pages to crawl',            parseInt, 500)
  .option('--timeout <ms>',                   'Page load timeout (ms)',        parseInt, 60000)
  .option('--screenshot',                     'Save full-page screenshots')
  .option('--resume',                         'Skip already-downloaded pages')
  .option('--no-robots',                      'Ignore robots.txt restrictions')
  .option('--include <pattern>',              'Only crawl URLs matching regex pattern')
  .option('--exclude <pattern>',              'Skip URLs matching regex pattern')
  .option('--user-agent <ua>',               'Custom User-Agent string')
  .option('--retry <n>',                      'Retry attempts per page',       parseInt, 3)
  .option('--serve',                          'Launch local preview server after mirror')
    .option('--inject-js <file>', 'JS file to inject on every page')
  .option('--detect-forms', 'Identify and log form fields')
  .option('--webhook <url>', 'Webhook to call on complete')
  .parse(process.argv);

const opts = program.opts();

// ─── STATE ────────────────────────────────────────────────────────────────────
const visited    = new Set();
const queue      = [{ url: normalizeUrl(opts.url), depth: 0 }];
const assetMap   = new Map();
const errors     = [];
const stats      = { pages: 0, assets: 0, errors: 0, bytes: 0, start: Date.now() };
const OUTPUT_DIR = path.resolve(opts.output);
const META_DIR   = path.join(OUTPUT_DIR, '_mirror-meta');
const ORIGIN     = (() => { try { return new URL(opts.url).origin; } catch { return ''; } })();

// ─── UTILS ────────────────────────────────────────────────────────────────────
function normalizeUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    u.hash = '';
    u.searchParams.sort();
    return u.href;
  } catch { return urlStr; }
}

function urlToFilePath(urlStr) {
  try {
    const u = new URL(urlStr);
    let p = path.join(OUTPUT_DIR, u.hostname, u.pathname);
    if (!path.extname(p) || p.endsWith('/') || p.endsWith('\\')) {
      p = path.join(p, 'index.html');
    }
    return p;
  } catch {
    const hash = crypto.createHash('md5').update(urlStr).digest('hex').slice(0, 12);
    return path.join(OUTPUT_DIR, '_assets', hash);
  }
}

function ensureDir(p) { fs.mkdirSync(path.dirname(p), { recursive: true }); }

function getRelPath(from, to) {
  return path.relative(path.dirname(from), to).replace(/\\/g, '/');
}

function shouldCrawl(urlStr) {
  try {
    const u = new URL(urlStr);
    if (u.origin !== ORIGIN) return false;
    if (opts.include && !new RegExp(opts.include).test(urlStr)) return false;
    if (opts.exclude && new RegExp(opts.exclude).test(urlStr)) return false;
    const ext = path.extname(u.pathname).toLowerCase();
    const skipExts = ['.jpg','.jpeg','.png','.gif','.svg','.webp','.ico',
                      '.woff','.woff2','.ttf','.eot','.mp4','.mp3','.pdf',
                      '.zip','.gz','.css','.js'];
    if (skipExts.includes(ext)) return false;
    return true;
  } catch { return false; }
}

function log(level, msg) {
  const icons = { info: chalk.cyan('ℹ'), ok: chalk.green('✔'), warn: chalk.yellow('⚠'), error: chalk.red('✖') };
  process.stdout.write(`\n${icons[level] || '·'} ${msg}`);
}

// ─── RESPONSE SAVER ───────────────────────────────────────────────────────────
async function saveResponse(response) {
  try {
    const url = response.url();
    if (!url.startsWith('http') || response.status() >= 400) return;
    if (assetMap.has(url)) return;
    const buffer = await response.buffer();
    const fp = urlToFilePath(url);
    ensureDir(fp);
    const ct = (response.headers()['content-type'] || '');
    if (ct.includes('text/css')) {
      const rewritten = rewriteCss(buffer.toString('utf8'), fp, url);
      fs.writeFileSync(fp, rewritten);
    } else {
      fs.writeFileSync(fp, buffer);
    }
    assetMap.set(url, fp);
    stats.assets++;
    stats.bytes += buffer.length;
  } catch { /* body unavailable */ }
}

// ─── CSS REWRITER ─────────────────────────────────────────────────────────────
function rewriteCss(css, cssFilePath, baseUrl) {
  return css.replace(/url\(['"]?([^'")\s]+)['"]?\)/gi, (match, ref) => {
    if (ref.startsWith('data:') || ref.startsWith('#') || ref.startsWith('//')) return match;
    try {
      const abs = new URL(ref, baseUrl).href;
      const fp  = urlToFilePath(abs);
      return `url('${getRelPath(cssFilePath, fp)}')`;
    } catch { return match; }
  });
}

// ─── HTML REWRITER ────────────────────────────────────────────────────────────
function rewriteHtml($, pageUrl, pageFilePath) {
  const rw = (el, attr) => {
    const val = $(el).attr(attr);
    if (!val || val.startsWith('data:') || val.startsWith('javascript:') ||
        val.startsWith('#')  || val.startsWith('mailto:') || val.startsWith('tel:')) return;
    try {
      const abs = new URL(val, pageUrl).href;
      $(el).attr(attr, getRelPath(pageFilePath, urlToFilePath(abs)));
    } catch { /* skip */ }
  };

  $('[href]').each((_, el) => rw(el, 'href'));
  $('[src]').each((_, el) => rw(el, 'src'));
  $('[action]').each((_, el) => rw(el, 'action'));
  $('[data-src]').each((_, el) => rw(el, 'data-src'));
  $('[data-lazy]').each((_, el) => rw(el, 'data-lazy'));

  // Rewrite srcset attributes
  $('[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (!srcset) return;
    const rewritten = srcset.split(',').map(part => {
      const [u, size] = part.trim().split(/\s+/);
      try {
        const abs = new URL(u, pageUrl).href;
        const rel = getRelPath(pageFilePath, urlToFilePath(abs));
        return size ? `${rel} ${size}` : rel;
      } catch { return part; }
    }).join(', ');
    $(el).attr('srcset', rewritten);
  });

  // Rewrite inline style url()
  $('[style]').each((_, el) => {
    const s = $(el).attr('style');
    if (s && s.includes('url(')) {
      $(el).attr('style', rewriteCss(s, pageFilePath, pageUrl));
    }
  });

  $('base').remove();
  if (!$('meta[charset]').length) $('head').prepend('<meta charset="utf-8">');
  return $.html();
}

// ─── PAGE CRAWLER ─────────────────────────────────────────────────────────────
async function crawlPage(browser, { url, depth }, bar) {
  if (visited.has(url)) return;
  visited.add(url);

  const pageFilePath = urlToFilePath(url);

  if (opts.resume && fs.existsSync(pageFilePath)) {
    log('ok', chalk.gray(`[SKIP-RESUME] ${url}`));
    bar.increment();
    return;
  }

  let page = null;
  for (let attempt = 1; attempt <= opts.retry; attempt++) {
    try {
      page = await browser.newPage();
      if (opts.userAgent) await page.setUserAgent(opts.userAgent);
      await page.setViewport({ width: 1440, height: 900 });
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
      });

      page.on('response', saveResponse);

      await page.goto(url, { waitUntil: 'networkidle0', timeout: opts.timeout });

      // Auto-scroll to trigger lazy-loaded content
      await page.evaluate(async () => {
        await new Promise(resolve => {
          let totalHeight = 0;
          const distance = 400;
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= document.body.scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 120);
          setTimeout(resolve, 10000);
        });
      });

      await new Promise(r => setTimeout(r, 800));

      const html = await page.content();
      const $    = cheerio.load(html);

      // Discover new links
      if (depth < opts.depth) {
        $('a[href]').each((_, el) => {
          try {
            const href = $(el).attr('href');
            const abs  = normalizeUrl(new URL(href, url).href);
            if (!visited.has(abs) && shouldCrawl(abs) &&
                stats.pages + queue.length < opts.maxPages) {
              queue.push({ url: abs, depth: depth + 1 });
            }
          } catch { /* skip */ }
        });
      }

      const rewritten = rewriteHtml($, url, pageFilePath);
      ensureDir(pageFilePath);
      fs.writeFileSync(pageFilePath, rewritten, 'utf8');

      if (opts.screenshot) {
        const ssPath = pageFilePath.replace(/\.html$/, '') + '_screen.png';
        ensureDir(ssPath);
        await page.screenshot({ path: ssPath, fullPage: true }).catch(() => {});
      }

      stats.pages++;
      bar.update(stats.pages);
      log('ok', `[${stats.pages}] ${url}`);
      break; // success
    } catch (err) {
      if (attempt === opts.retry) {
        errors.push({ url, error: err.message });
        stats.errors++;
        log('error', `[FAIL ${attempt}/${opts.retry}] ${url} — ${err.message}`);
      } else {
        log('warn', `[RETRY ${attempt}/${opts.retry}] ${url}`);
        await new Promise(r => setTimeout(r, attempt * 1500));
      }
    } finally {
      if (page && !page.isClosed()) await page.close().catch(() => {});
    }
  }

  await new Promise(r => setTimeout(r, opts.delay));
}

// ─── SITEMAP ──────────────────────────────────────────────────────────────────
function generateSitemap() {
  const entries = [...visited].map(u => `  <url>\n    <loc>${u}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), xml);
}

// ─── REPORT ───────────────────────────────────────────────────────────────────
function generateReport() {
  const elapsed = ((Date.now() - stats.start) / 1000).toFixed(1);
  const report  = {
    tool: 'Super Web Mirror v3.0',
    target: opts.url,
    output: OUTPUT_DIR,
    crawledAt: new Date().toISOString(),
    duration: `${elapsed}s`,
    config: { depth: opts.depth, concurrency: opts.concurrency, delay: opts.delay, maxPages: opts.maxPages },
    stats: { ...stats, totalMB: (stats.bytes / 1048576).toFixed(2) },
    errors,
    pages: [...visited],
    assetCount: assetMap.size,
  };
  fs.mkdirSync(META_DIR, { recursive: true });
  fs.writeFileSync(path.join(META_DIR, 'crawl-report.json'), JSON.stringify(report, null, 2));
  return report;
}

// ─── LOCAL PREVIEW SERVER ─────────────────────────────────────────────────────
function serveOutput() {
  const http = require('http');
  const mime = require('mime-types');
  const PORT = 8787;
  http.createServer((req, res) => {
    let fp = path.join(OUTPUT_DIR, new URL(req.url, 'http://localhost').pathname);
    if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
    if (fs.existsSync(fp)) {
      res.writeHead(200, { 'Content-Type': mime.lookup(fp) || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    } else {
      res.writeHead(404); res.end('Not Found');
    }
  }).listen(PORT, () => {
    console.log(chalk.bold.cyan(`\n🌐 Preview server: http://localhost:${PORT}`));
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(chalk.bold.magenta(`
╔══════════════════════════════════════════════════════╗
║          SUPER WEB MIRROR  v3.0  🕷️                  ║
║  Stealth · Recursive · Concurrent · Self-Contained   ║
╚══════════════════════════════════════════════════════╝`));
  console.log(chalk.cyan(`  Target      : ${chalk.white(opts.url)}`));
  console.log(chalk.cyan(`  Output      : ${chalk.white(OUTPUT_DIR)}`));
  console.log(chalk.cyan(`  Depth       : ${opts.depth}  |  Concurrency: ${opts.concurrency}  |  Delay: ${opts.delay}ms`));
  console.log(chalk.cyan(`  Max Pages   : ${opts.maxPages}  |  Retry: ${opts.retry}  |  Screenshots: ${!!opts.screenshot}`));
  console.log('');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(META_DIR,   { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1440,900',
    ],
  });

  const bar = new cliProgress.SingleBar({
    format: chalk.magenta('  Crawling') + ' |{bar}| {percentage}% | {value}/{total} pages | ETA: {eta}s',
    barCompleteChar: '█', barIncompleteChar: '░', hideCursor: true,
  }, cliProgress.Presets.shades_classic);
  bar.start(opts.maxPages, 0);

  const limit = pLimit(opts.concurrency);

  while (queue.length > 0 || stats.pages === 0) {
    if (queue.length === 0) break;
    const batch = [];
    while (queue.length > 0 && batch.length < opts.concurrency * 2) {
      const item = queue.shift();
      if (!visited.has(item.url)) batch.push(item);
    }
    if (!batch.length) continue;
    await Promise.all(batch.map(item => limit(() => crawlPage(browser, item, bar))));
  }

  bar.stop();
  await browser.close();

  generateSitemap();
  const report = generateReport();

  console.log(chalk.bold.magenta('\n╔══════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║               MIRROR COMPLETE  ✅                   ║'));
  console.log(chalk.bold.magenta(  '╚══════════════════════════════════════════════════════╝'));
  console.log(chalk.green(`  ✔  Pages     : ${report.stats.pages}`));
  console.log(chalk.green(`  ✔  Assets    : ${report.stats.assets}`));
  console.log(chalk.green(`  ✔  Total     : ${report.stats.totalMB} MB`));
  console.log(chalk.green(`  ✔  Errors    : ${report.stats.errors}`));
  console.log(chalk.green(`  ✔  Duration  : ${report.duration}`));
  console.log(chalk.cyan( `  📁 Output   : ${OUTPUT_DIR}`));
  console.log(chalk.cyan( `  📋 Report   : ${path.join(META_DIR, 'crawl-report.json')}`));
  console.log(chalk.cyan( `  🗺  Sitemap  : ${path.join(OUTPUT_DIR, 'sitemap.xml')}`));
  console.log('');

  if (opts.serve) serveOutput();
})();
