#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: postmessage-logger.js                               ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const puppeteer = require('puppeteer');

program
  .name('postmessage-logger.js')
  .description('Audit for insecure postMessage listeners by monitoring message events in a headless browser.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL to audit')
  .option('-t, --timeout <ms>', 'Audit duration in ms', '10000')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'postmessage-logger.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  console.log(chalk.cyan(`[*] Auditing postMessage events for: ${opts.url}\n`));
  
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('message', (event) => {
      console.log('--- PostMessage Detected ---');
      console.log('Origin:', event.origin);
      console.log('Data:', JSON.stringify(event.data));
      console.log('Source:', event.source ? 'Window' : 'Null');
    });
  });

  page.on('console', msg => {
    if (msg.text().includes('PostMessage Detected')) {
       console.log(chalk.bold.red(`[!] ${msg.text()}`));
    } else {
       console.log(chalk.gray(`[Page Console] ${msg.text()}`));
    }
  });

  try {
    await page.goto(opts.url, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log(chalk.yellow(`[*] Monitoring for ${opts.timeout}ms...`));
    await new Promise(resolve => setTimeout(resolve, parseInt(opts.timeout)));
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing page: ${err.message}`));
  }

  await browser.close();
  console.log(chalk.cyan('\n[*] Audit complete.'));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
