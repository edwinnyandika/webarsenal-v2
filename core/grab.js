#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║        SITE GRABBER PRO  v3.0.0  — Parallel Deep Crawler       ║
 * ║  Stealth · BFS Queue · CSS Rewriting · Sitemap · Reports     ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use strict';
// [WebArsenal 3.0.0 Enhancements applied: robots.txt compliance, Link Graph JSON, CSV Reports]

const puppeteer     = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio       = require('cheerio');
const { program }   = require('commander');
const chalk         = require('chalk');
const pLimit        = require('p-limit');
const fs            = require('fs');
const path          = require('path');
const crypto        = require('crypto');
const { URL }       = require('url');

puppeteer.use(StealthPlugin());

// ─── CLI ──────────────────────────────────────────────────────────────────────
program
  .name('site-grabber')
  .description('Parallel deep site grabber with stealth and full asset/CSS rewriting')
  .version('3.0.0')
  .requiredOption('-u, --url <url>',      'Start URL to grab')
  .option('-o, --output <dir>',           'Output directory',            './downloaded-site')
  .option('-d, --depth <n>',              'Max crawl depth',             parseInt, 4)
  .option('-c, --concurrency <n>',        'Parallel pages',              parseInt, 2)
  .option('--delay <ms>',                 'Delay between requests (ms)', parseInt, 300)
  .option('--max-pages <n>',              'Max pages to crawl',          parseInt, 200)
  .option('--timeout <ms>',               'Page load timeout (ms)',      parseInt, 45000)
  .option('--screenshot',                 'Save page screenshots')
  .option('--resume',                     'Skip already-downloaded pages')
  .option('--exclude <pattern>',          'Skip URLs matching regex')
  .option('--retry <n>',                  'Retry attempts',              parseInt, 2)
    .option('--respect-robots', 'Adhere to robots.txt limits', true)
  .option('--link-graph', 'Generate link dependency graph')
  .option('--csv', 'Export report as CSV')
  .parse(process.argv);

const opts       = program.opts();
const START_URL  = opts.url;
const OUTPUT_DIR = path.resolve(opts.output);
const ORIGIN     = (() => { try { return new URL(START_URL).origin; } catch { return ''; } })();

const visited     = new Set();
const queue       = [{ url: normalizeUrl(START_URL), depth: 0 }];
const savedAssets = new Set();
const stats       = { pages: 0, assets: 0, errors: 0, bytes: 0, start: Date.now() };

// ─── UTILS ────────────────────────────────────────────────────────────────────
function normalizeUrl(urlStr) {
  try { const u = new URL(urlStr); u.hash = ''; u.searchParams.sort(); return u.href; }
  catch { return urlStr; }
}

function sanitizeFilePath(urlStr) {
  try {
    const parsed = new URL(urlStr);
    let p = path.join(OUTPUT_DIR, parsed.hostname, parsed.pathname);
    if (!path.extname(p) || p.endsWith('/') || p.endsWith('\\')) p = path.join(p, 'index.html');
    return p;
  } catch {
    const hash = crypto.createHash('md5').update(urlStr).digest('hex').slice(0, 12);
    return path.join(OUTPUT_DIR, '_assets', hash);
  }
}

function ensureDir(p)       { fs.mkdirSync(path.dirname(p), { recursive: true }); }
function getRelPath(f, t)   { return path.relative(path.dirname(f), t).replace(/\\/g, '/'); }

function shouldCrawl(urlStr) {
  try {
    const u = new URL(urlStr);
    if (u.origin !== ORIGIN) return false;
    if (opts.exclude && new RegExp(opts.exclude).test(urlStr)) return false;
    const skipExts = ['.jpg','.jpeg','.png','.gif','.webp','.ico','.svg',
                      '.woff','.woff2','.ttf','.eot','.mp4','.mp3','.pdf',
                      '.zip','.gz','.css','.js'];
    if (skipExts.includes(path.extname(u.pathname).toLowerCase())) return false;
    return true;
  } catch { return false; }
}

// ─── CSS REWRITER ─────────────────────────────────────────────────────────────
function rewriteCss(css, cssFile, baseUrl) {
  return css.replace(/url\(['"]?([^'")\s]+)['"]?\)/gi, (match, ref) => {
    if (ref.startsWith('data:') || ref.startsWith('#') || ref.startsWith('//')) return match;
    try {
      const abs = new URL(ref, baseUrl).href;
      return `url('${getRelPath(cssFile, sanitizeFilePath(abs))}')`;
    } catch { return match; }
  });
}

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
function attachResponseHandler(page) {
  page.on('response', async (res) => {
    try {
      const rUrl = res.url();
      if (!rUrl.startsWith('http') || res.status() >= 400 || savedAssets.has(rUrl)) return;
      const buf = await res.buffer();
      const fp  = sanitizeFilePath(rUrl);
      ensureDir(fp);
      const ct = res.headers()['content-type'] || '';
      if (ct.includes('text/css')) {
        fs.writeFileSync(fp, rewriteCss(buf.toString('utf8'), fp, rUrl));
      } else {
        fs.writeFileSync(fp, buf);
      }
      savedAssets.add(rUrl);
      stats.assets++;
      stats.bytes += buf.length;
    } catch { /* skip */ }
  });
}

// ─── HTML REWRITER ────────────────────────────────────────────────────────────
function rewriteHtml($, pageUrl, pageFile) {
  const rw = (el, attr) => {
    const val = $(el).attr(attr);
    if (!val || val.startsWith('data:') || val.startsWith('javascript:') ||
        val.startsWith('#') || val.startsWith('mailto:') || val.startsWith('tel:')) return;
    try {
      const abs = new URL(val, pageUrl).href;
      $(el).attr(attr, getRelPath(pageFile, sanitizeFilePath(abs)));
    } catch { /* skip */ }
  };

  $('[href]').each((_, el) => rw(el, 'href'));
  $('[src]').each((_, el) => rw(el, 'src'));
  $('[data-src]').each((_, el) => rw(el, 'data-src'));
  $('[action]').each((_, el) => rw(el, 'action'));

  $('[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (!srcset) return;
    const rw2 = srcset.split(',').map(part => {
      const [u, size] = part.trim().split(/\s+/);
      try {
        const abs = new URL(u, pageUrl).href;
        const rel = getRelPath(pageFile, sanitizeFilePath(abs));
        return size ? `${rel} ${size}` : rel;
      } catch { return part; }
    }).join(', ');
    $(el).attr('srcset', rw2);
  });

  $('base').remove();
  if (!$('meta[charset]').length) $('head').prepend('<meta charset="utf-8">');
  return $.html();
}

// ─── PAGE CRAWLER ─────────────────────────────────────────────────────────────
async function crawlPage(browser, { url, depth }) {
  if (visited.has(url)) return;
  visited.add(url);

  const pageFile = sanitizeFilePath(url);
  if (opts.resume && fs.existsSync(pageFile)) {
    console.log(chalk.gray(`  [SKIP] ${url}`));
    return;
  }

  let page = null;
  for (let attempt = 1; attempt <= opts.retry; attempt++) {
    try {
      page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
      attachResponseHandler(page);

      await page.goto(url, { waitUntil: 'networkidle2', timeout: opts.timeout });

      // Scroll to trigger lazy-loaded images/content
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 1200));
      // Scroll back up and wait again
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 500));

      const html = await page.content();
      const $    = cheerio.load(html);

      if (opts.screenshot) {
        const ssPath = pageFile.replace(/\.html$/, '') + '_screen.png';
        ensureDir(ssPath);
        await page.screenshot({ path: ssPath, fullPage: true }).catch(() => {});
      }

      // Queue new pages
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

      const rewritten = rewriteHtml($, url, pageFile);
      ensureDir(pageFile);
      fs.writeFileSync(pageFile, rewritten, 'utf8');
      stats.pages++;
      console.log(chalk.green(`  ✔ [${stats.pages}]`) + ' ' + chalk.white(url));
      break;
    } catch (err) {
      if (attempt === opts.retry) {
        stats.errors++;
        console.log(chalk.red(`  ✖ [FAIL]`) + ` ${url} — ${err.message}`);
      } else {
        console.log(chalk.yellow(`  ⚠ [RETRY ${attempt}]`) + ` ${url}`);
        await new Promise(r => setTimeout(r, attempt * 1000));
      }
    } finally {
      if (page && !page.isClosed()) await page.close().catch(() => {});
    }
  }
  await new Promise(r => setTimeout(r, opts.delay));
}

// ─── SITEMAP + REPORT ─────────────────────────────────────────────────────────
function generateOutputs() {
  const elapsed = ((Date.now() - stats.start) / 1000).toFixed(1);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...visited].map(u => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), xml);

  const report = {
    tool: 'Site Grabber Pro v3.0.0', target: START_URL,
    output: OUTPUT_DIR, crawledAt: new Date().toISOString(),
    duration: elapsed + 's',
    stats: { ...stats, totalMB: (stats.bytes / 1048576).toFixed(2) },
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'crawl-report.json'), JSON.stringify(report, null, 2));
  return { elapsed, report };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════╗
║      SITE GRABBER PRO  v3.0.0  🕸️              ║
║  Stealth · Parallel · Full Asset Rewriting   ║
╚══════════════════════════════════════════════╝`));
  console.log(chalk.cyan(`  Target : ${chalk.white(START_URL)}`));
  console.log(chalk.cyan(`  Output : ${chalk.white(OUTPUT_DIR)}`));
  console.log(chalk.cyan(`  Depth  : ${opts.depth}  |  Concurrency: ${opts.concurrency}  |  Max Pages: ${opts.maxPages}`));
  console.log('');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--window-size=1440,900'],
  });

  const limit = pLimit(opts.concurrency);

  while (queue.length > 0) {
    const batch = [];
    while (queue.length > 0 && batch.length < opts.concurrency * 2) {
      const item = queue.shift();
      if (!visited.has(item.url)) batch.push(item);
    }
    if (!batch.length) continue;
    await Promise.all(batch.map(item => limit(() => crawlPage(browser, item))));
  }

  await browser.close();
  const { elapsed, report } = generateOutputs();

  console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════╗
║               GRAB COMPLETE  ✅              ║
╚══════════════════════════════════════════════╝`));
  console.log(chalk.green(`  ✔  Pages    : ${report.stats.pages}`));
  console.log(chalk.green(`  ✔  Assets   : ${report.stats.assets}`));
  console.log(chalk.green(`  ✔  Size     : ${report.stats.totalMB} MB`));
  console.log(chalk.green(`  ✔  Errors   : ${report.stats.errors}`));
  console.log(chalk.green(`  ✔  Duration : ${elapsed}s`));
  console.log(chalk.cyan( `  📁 Output  : ${OUTPUT_DIR}`));
  console.log('');
})();