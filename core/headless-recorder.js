#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: headless-recorder.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */



/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: headless-recorder.js                               ║
 * ║  Category: core                                                 ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const puppeteer = require('puppeteer');
const fs = require('fs');

program
  .name('headless-recorder.js')
  .description('Records a full HAR (HTTP Archive) of a browsing session.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'URL to record')
  .option('-o, --output <file>', 'Output HAR file', 'session.har')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'headless-recorder.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url.startsWith('http') ? opts.url : `https://${opts.url}`;
  console.log(chalk.cyan(`[*] Launching browser to record HAR for: ${targetUrl}`));
  
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Note: For a true HAR, we'd use puppeteer-har or complex CDP.
  // Here we implement a simplified capture of all request/response metadata.
  const logs = [];
  
  page.on('response', async res => {
    logs.push({
      url: res.url(),
      status: res.status(),
      method: res.request().method(),
      headers: res.headers()
    });
  });
  
  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log(chalk.green(`\n[✓] SUCCESS: Captured ${logs.length} requests.`));
    
    fs.writeFileSync(opts.output, JSON.stringify(logs, null, 2));
    console.log(chalk.cyan(`\n[*] Session log saved to: ${opts.output}`));
    
  } catch (err) {
    console.error(chalk.red('\n[x] Execution Failed:'), err.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
