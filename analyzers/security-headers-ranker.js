#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: security-headers-ranker.js                          ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('security-headers-ranker.js')
  .description('Scores a target website based on the presence and quality of its security headers.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL to rank')
  .parse(process.argv);

const opts = program.opts();

const SECURITY_HEADERS = {
  "Content-Security-Policy": 25,
  "Strict-Transport-Security": 20,
  "X-Frame-Options": 15,
  "X-Content-Type-Options": 10,
  "Referrer-Policy": 10,
  "Permissions-Policy": 10,
  "X-XSS-Protection": 10
};

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'security-headers-ranker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Ranking security headers for: ${targetUrl}\n`));
  
  try {
    const res = await axios.get(targetUrl, { timeout: 10000, validateStatus: () => true });
    const headers = res.headers;
    let score = 0;
    
    console.log(chalk.cyan(`[→] Audit Detail:`));
    for (const [header, weight] of Object.entries(SECURITY_HEADERS)) {
      if (headers[header.toLowerCase()]) {
        console.log(chalk.green(`    [+] Found ${header} (+${weight})`));
        score += weight;
      } else {
        console.log(chalk.red(`    [-] Missing ${header} (+0)`));
      }
    }
    
    let grade = 'F';
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 40) grade = 'D';
    
    const color = score >= 70 ? chalk.green : (score >= 40 ? chalk.yellow : chalk.red);
    
    console.log(chalk.bold.magenta('\n╔══════════════════════════════════╗'));
    console.log(chalk.bold.magenta(`║  FINAL SCORE: ${score}/100 [GRADE: ${grade}]  ║`));
    console.log(chalk.bold.magenta('╚══════════════════════════════════╝\n'));
    
    if (score < 60) {
      console.log(color(`[!] RECOMMENDATION: Implement missing headers to improve site security.`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error ranking site headers: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
