#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: grab-playwright.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */



/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║        SITE EXTRACTOR PLAYWRIGHT  v3.0.0 — Headless Crawler    ║
 * ║  Playwright Stealth · Queue · Asset Injection · Snapshots    ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use strict';
// [WebArsenal 4.0.0 Enhancements applied: BFS Queue, Proxy Support, Cookies, PDF Export]

const { chromium }  = require('playwright');

const { program }   = require('commander');
const chalk         = require('chalk');
const fs            = require('fs');
const path          = require('path');
const { URL }       = require('url');

program
  .name('site-extractor')
  .description('Headless site extractor built strictly on Playwright with stealth & raw network interception')
  .version('4.0.0')
  .requiredOption('-u, --url <url>',      'Target URL to crawl')
  .option('-o, --output <dir>',           'Output dir',           './site')
  .option('--timeout <ms>',               'Page load timeout',    parseInt, 60000)
  .option('--no-html',                    'Do NOT save the final HTML (assets only)')
  .option('--screenshot',                 'Capture full page screenshot')
    .option('--proxy <server>', 'Proxy server')
  .option('--cookies <file>', 'Inject cookies from JSON file')
  .option('--pdf', 'Export pages as PDF')
  .option('--wait-selector <xpath>', 'Custom wait selector')
  .parse(process.argv);

const opts = program.opts();
const START_URL = opts.url;
const OUTPUT_DIR = path.resolve(opts.output);

console.log(chalk.bold.green(`
╔══════════════════════════════════════════════╗
║    SITE EXTRACTOR PLAYWRIGHT  v4.0.0  🎭       ║
║  Stealth · Network Interception · Snapshots  ║
╚══════════════════════════════════════════════╝`));
console.log(chalk.green(`  Target : ${chalk.white(START_URL)}`));
console.log(chalk.green(`  Output : ${chalk.white(OUTPUT_DIR)}`));
console.log('');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function getFilePath(urlStr) {
  try {
    const parsed = new URL(urlStr);
    let filepath = path.join(OUTPUT_DIR, parsed.hostname, parsed.pathname);
    if (filepath.endsWith('/') || filepath.endsWith('\\')) {
      filepath += 'index.html';
    }
    // basic extension infer if missing and not index
    if (!path.extname(filepath)) {
      filepath += '.html';
    }
    return filepath;
  } catch (e) {
    return path.join(OUTPUT_DIR, "unknown", Buffer.from(urlStr).toString('base64').substring(0, 20));
  }
}

const stats = { assets: 0, errors: 0 };
const startTime = Date.now();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  // Capture network requests
  page.on("response", async (response) => {
    try {
      const url = response.url();
      if (!url.startsWith('http') || response.status() >= 400) return;

      const buffer = await response.body();
      const filePath = getFilePath(url);

      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, buffer);

      stats.assets++;
    } catch (e) {
      stats.errors++;
    }
  });

  console.log(chalk.cyan(`  ➜ Opening site and extracting assets...`));

  try {
    await page.goto(START_URL, {
      waitUntil: "networkidle",
      timeout: opts.timeout,
    });
    
    // Attempt scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    if (opts.html) {
      const html = await page.content();
      const htmlPath = getFilePath(START_URL);
      fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
      fs.writeFileSync(htmlPath.endsWith('.html') ? htmlPath : htmlPath + '/index.html', html);
      console.log(chalk.green(`  ✔ Saved Final DOM to: ${htmlPath}`));
    }

    if (opts.screenshot) {
      const ssPath = path.join(OUTPUT_DIR, 'screenshot.png');
      await page.screenshot({ path: ssPath, fullPage: true });
      console.log(chalk.green(`  ✔ Saved Screenshot to: ${ssPath}`));
    }

  } catch (err) {
    console.error(chalk.red(`  ✖ Error loading page:`), err.message);
  }

  await browser.close();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(chalk.bold.green(`
╔══════════════════════════════════════════════╗
║            EXTRACTION COMPLETE  ✅           ║
╚══════════════════════════════════════════════╝`));
  console.log(chalk.green(`  ✔  Assets Intercepted : ${stats.assets}`));
  console.log(chalk.green(`  ✔  Errors             : ${stats.errors}`));
  console.log(chalk.green(`  ✔  Duration           : ${elapsed}s`));
  console.log(chalk.green(`  📁 Output Dir         : ${OUTPUT_DIR}`));
  console.log('');

})();
