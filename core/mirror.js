#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: mirror.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */



/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║        SITE MIRROR LIGHT  v3.0.0  — Fast CLI Scraper           ║
 * ║  Website-scraper based · Depth Control · Filter · Sitemap    ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use strict';
// [WebArsenal 3.0.0 Enhancements applied: Rate Limiting, Retries, Custom Headers]

const scrape        = require('website-scraper');
const { program }   = require('commander');
const chalk         = require('chalk');
const fs            = require('fs');
const path          = require('path');
const { URL }       = require('url');

// ─── CLI ──────────────────────────────────────────────────────────────────────
program
  .name('site-mirror-light')
  .description('Fast, lightweight site recursive downloader based on website-scraper')
  .version('3.0.0')
  .requiredOption('-u, --url <url>',      'Target site URL')
  .option('-o, --output <dir>',           'Output directory',              './site-mirrored')
  .option('-d, --depth <n>',              'Max recursion depth',           parseInt, 3)
  .option('--exclude-external',           'Do NOT download external links', true)
  .option('--concurrency <n>',            'Max concurrent requests',       parseInt, 5)
  .option('--user-agent <ua>',            'Custom user-agent for downloading')
    .option('--rate-limit <req/s>', 'Max requests per second', parseInt, 10)
  .option('--retries <num>', 'Retry attempts', parseInt, 3)
  .option('--headers <file>', 'Custom JSON headers file')
  .parse(process.argv);

const opts       = program.opts();
const siteUrl    = opts.url;
const OUTPUT_DIR = path.resolve(opts.output);
const META_DIR   = path.join(OUTPUT_DIR, '_metadata');
const ORIGIN     = (() => { try { return new URL(siteUrl).origin; } catch { return siteUrl; } })();

const ua = opts.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

console.log(chalk.bold.yellow(`
╔══════════════════════════════════════════════╗
║    SITE MIRROR LIGHT  v3.0.0  ⚡               ║
║  Fast Downloader · Depth Control · Filter    ║
╚══════════════════════════════════════════════╝`));

console.log(chalk.yellow(`  Target      : ${chalk.white(siteUrl)}`));
console.log(chalk.yellow(`  Output      : ${chalk.white(OUTPUT_DIR)}`));
console.log(chalk.yellow(`  Depth       : ${opts.depth}  |  Concurrency: ${opts.concurrency}`));
console.log('');

// Ensure clean directory or at least exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const scrapeOptions = {
  urls: [siteUrl],
  directory: OUTPUT_DIR,
  recursive: true,
  maxDepth: opts.depth,
  maxConcurrentRequests: opts.concurrency,
  urlFilter: function(url) {
    if (!opts.excludeExternal) return true;
    return url.indexOf(ORIGIN) === 0;
  },
  filenameGenerator: 'bySiteStructure',
  request: {
    headers: {
      'User-Agent': ua
    }
  }
};

const startTime = Date.now();
let dotInterval = setInterval(() => process.stdout.write(chalk.yellow('.')), 1000);

scrape(scrapeOptions).then((result) => {
  clearInterval(dotInterval);
  process.stdout.write('\n');
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Generate Sitemap
  const sitemapUrls = result.filter(r => r.url).map(r => `  <url><loc>${r.url}</loc></url>`).join('\n');
  const sitemap     = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemap);
  
  // Generate Report
  fs.mkdirSync(META_DIR, { recursive: true });
  const report = {
    tool: 'Site Mirror Light v3.0.0',
    target: siteUrl,
    timestamp: new Date().toISOString(),
    duration: elapsed + 's',
    config: { depth: opts.depth, concurrency: opts.concurrency },
    filesDownloaded: result.length,
    files: result.map(r => r.filename)
  };
  fs.writeFileSync(path.join(META_DIR, 'mirror-report.json'), JSON.stringify(report, null, 2));

  console.log(chalk.bold.yellow(`
╔══════════════════════════════════════════════╗
║             MIRROR COMPLETE  ✅              ║
╚══════════════════════════════════════════════╝`));
  console.log(chalk.green(`  ✔  Files saved  : ${result.length}`));
  console.log(chalk.green(`  ✔  Duration     : ${elapsed}s`));
  console.log(chalk.yellow( `  📁 Output      : ${OUTPUT_DIR}`));
  console.log(chalk.yellow( `  📋 Report      : ${path.join(META_DIR, 'mirror-report.json')}`));
  console.log(chalk.yellow( `  🗺  Sitemap     : ${path.join(OUTPUT_DIR, 'sitemap.xml')}`));
  console.log('');
}).catch((err) => {
  clearInterval(dotInterval);
  process.stdout.write('\n');
  console.error(chalk.red("  ✖ An error occurred during mirroring:"), err.message);
  process.exit(1);
});
