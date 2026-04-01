#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: clickjacking-auditor.js                              ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('clickjacking-auditor.js')
  .description('Audits for clickjacking vulnerabilities by checking X-Frame-Options and Content-Security-Policy headers.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL to audit')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'clickjacking-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Auditing for clickjacking on: ${targetUrl}\n`));
  
  try {
    const res = await axios.get(targetUrl, { timeout: 10000, validateStatus: () => true });
    const xfo = res.headers['x-frame-options'];
    const csp = res.headers['content-security-policy'];
    
    let vulnerable = true;
    
    if (xfo) {
       console.log(chalk.green(`[*] X-Frame-Options: ${xfo}`));
       if (['DENY', 'SAMEORIGIN'].includes(xfo.toUpperCase())) {
         vulnerable = false;
       }
    } else {
       console.log(chalk.red(`[-] Missing X-Frame-Options header.`));
    }
    
    if (csp) {
      console.log(chalk.green(`[*] Content-Security-Policy (frame-ancestors): ${csp.includes('frame-ancestors') ? 'Defined' : 'Missing'}`));
      if (csp.includes('frame-ancestors \'none\'') || csp.includes('frame-ancestors \'self\'')) {
        vulnerable = false;
      }
    } else {
       console.log(chalk.red(`[-] Missing Content-Security-Policy header.`));
    }
    
    if (vulnerable) {
      console.log(chalk.bold.red(`\n[!] VULNERABLE TO CLICKJACKING!`));
      console.log(chalk.red(`    Site allows framing (missing/broad protection).`));
    } else {
      console.log(chalk.bold.green(`\n[✓] PROTECTED: Site restricts framing via headers.`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing site: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
