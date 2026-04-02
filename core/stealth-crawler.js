#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: stealth-crawler.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */



/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: stealth-crawler.js                                 ║
 * ║  Category: core                                                 ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

program
  .name('stealth-crawler.js')
  .description('Human-mimicking crawler for bot-detection protected sites.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL')
  .option('-v, --visual', 'Run in non-headless mode (for manual interaction)', false)
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'stealth-crawler.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url.startsWith('http') ? opts.url : `https://${opts.url}`;
  console.log(chalk.cyan(`[*] Launching stealth browser for: ${targetUrl}`));
  
  const browser = await puppeteer.launch({ 
    headless: opts.visual ? false : "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  
  // Set random user agent and viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log(chalk.gray(`[*] Navigating with stealth...`));
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Simulate human behavior
    console.log(chalk.gray(`[*] Simulating human interaction...`));
    await page.mouse.move(100, 100);
    await page.mouse.wheel({ deltaY: 500 });
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    
    const title = await page.title();
    console.log(chalk.bold.green(`\n[✓] SUCCESS: Content Loaded - ${title}`));
    
    if (opts.visual) {
      console.log(chalk.yellow(`\n[*] Visual mode: Leaving browser open for 60s.`));
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  } catch (err) {
    console.error(chalk.red('\n[x] Execution Failed:'), err.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
