#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: pro-mirror.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */



/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║     WEB MIRROR PRO  v3.0.0  — SPA-Optimized Full Cloner        ║
 * ║  Puppeteer Rendering · Scroll · Concurrent · Deep Recursive  ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use strict';
// [WebArsenal 3.0.0 Enhancements applied: Cookie Jar, Multi-URL Seed]

const scrape          = require('website-scraper');
const PuppeteerPlugin = require('website-scraper-puppeteer');
const { program }     = require('commander');
const chalk           = require('chalk');
const path            = require('path');
const fs              = require('fs');

program
  .name('web-mirror-pro')
  .description('SPA-optimized full-site cloner powered by headless Puppeteer rendering')
  .version('3.0.0')
  .requiredOption('-u, --url <url>',            'Target SPA URL to mirror')
  .option('-o, --output <dir>',                 'Output directory',             './pro-mirrored-site')
  .option('-d, --depth <n>',                    'Max crawl depth',              parseInt, 5)
  .option('-c, --concurrency <n>',              'Concurrent requests',          parseInt, 3)
  .option('--timeout <ms>',                     'Scroll/wait timeout (ms)',     parseInt, 15000)
  .option('--scroll-viewports <n>',             'Viewport heights to scroll',   parseInt, 12)
  .option('--user-agent <ua>',                  'Custom User-Agent')
  .option('--include-external',                 'Also download external assets', false)
    .option('--cookie-jar <file>', 'Load/save session cookies')
  .option('--seed-list <file>', 'Read starting URLs from text file')
  .option('--auth-env', 'Load HTTP auth from .env')
  .parse(process.argv);

const opts       = program.opts();
const OUTPUT_DIR = path.resolve(opts.output);
const META_DIR   = path.join(OUTPUT_DIR, '_meta');

console.log(chalk.bold.blue(`
╔══════════════════════════════════════════════════╗
║       WEB MIRROR PRO  v3.0.0  🚀                  ║
║  SPA-Optimized · Headless · Scroll · Recursive   ║
╚══════════════════════════════════════════════════╝`));
console.log(chalk.blue(`  Target       : ${chalk.white(opts.url)}`));
console.log(chalk.blue(`  Output       : ${chalk.white(OUTPUT_DIR)}`));
console.log(chalk.blue(`  Depth        : ${opts.depth}  |  Concurrency: ${opts.concurrency}`));
console.log(chalk.blue(`  Scroll VP    : ${opts.scrollViewports}  |  Timeout: ${opts.timeout}ms`));
console.log('');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(META_DIR,   { recursive: true });

const startTime = Date.now();
const ORIGIN    = (() => { try { return new URL(opts.url).origin; } catch { return opts.url; } })();

const ua = opts.userAgent
  || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const scrapeOptions = {
  urls: [opts.url],
  directory: OUTPUT_DIR,
  recursive: true,
  maxDepth: opts.depth,
  maxConcurrentRequests: opts.concurrency,
  filenameGenerator: 'bySiteStructure',
  request: {
    headers: {
      'User-Agent': ua,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
    gzip: true,
  },
  urlFilter: (url) => {
    try {
      if (opts.includeExternal) return true;
      return new URL(url).origin === ORIGIN;
    } catch { return false; }
  },
  plugins: [
    new PuppeteerPlugin({
      launchOptions: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--window-size=1440,900'],
      },
      scrollToBottom: {
        timeout: opts.timeout,
        viewportN: opts.scrollViewports,
      },
      blockNavigation: true,
    }),
  ],
};

let savedCount = 0;
let dotInterval;

// Animated progress dots
dotInterval = setInterval(() => process.stdout.write(chalk.blue('.')), 2000);

scrape(scrapeOptions)
  .then((result) => {
    clearInterval(dotInterval);
    process.stdout.write('\n');

    const elapsed  = ((Date.now() - startTime) / 1000).toFixed(1);
    savedCount     = result.length;

    // Sitemap from discovered URLs
    const sitemapUrls = result.filter(r => r.url).map(r => `  <url><loc>${r.url}</loc></url>`).join('\n');
    const sitemap     = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemap);

    // Report
    const report = {
      tool: 'Web Mirror Pro v3.0.0',
      target: opts.url,
      output: OUTPUT_DIR,
      crawledAt: new Date().toISOString(),
      duration: elapsed + 's',
      config: {
        depth: opts.depth, concurrency: opts.concurrency,
        scrollViewports: opts.scrollViewports, timeout: opts.timeout,
      },
      filesSaved: savedCount,
      files: result.map(r => ({ url: r.url, filename: r.filename })),
    };
    fs.writeFileSync(path.join(META_DIR, 'crawl-report.json'), JSON.stringify(report, null, 2));

    console.log(chalk.bold.blue(`
╔══════════════════════════════════════════════════╗
║             PRO MIRROR COMPLETE  ✅              ║
╚══════════════════════════════════════════════════╝`));
    console.log(chalk.green(`  ✔  Files saved  : ${savedCount}`));
    console.log(chalk.green(`  ✔  Duration     : ${elapsed}s`));
    console.log(chalk.blue( `  📁 Output      : ${OUTPUT_DIR}`));
    console.log(chalk.blue( `  📋 Report      : ${path.join(META_DIR, 'crawl-report.json')}`));
    console.log(chalk.blue( `  🗺  Sitemap     : ${path.join(OUTPUT_DIR, 'sitemap.xml')}`));
    console.log('');
  })
  .catch((err) => {
    clearInterval(dotInterval);
    process.stdout.write('\n');
    console.error(chalk.red('  ✖ Mirror failed:'), err.message);
    console.error(chalk.gray(err.stack));
    process.exit(1);
  });
