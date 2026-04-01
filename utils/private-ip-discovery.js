#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: private-ip-discovery.js                              ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('private-ip-discovery.js')
  .description('Scans headers and response body for private IP address information leaks.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL to check')
  .parse(process.argv);

const opts = program.opts();

const RE_PRIVATE_IP = /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g;

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'private-ip-discovery.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Scanning for private IP leaks in: ${targetUrl}\n`));
  
  try {
    const res = await axios.get(targetUrl, { timeout: 10000, validateStatus: () => true });
    
    // Check headers
    const headerString = JSON.stringify(res.headers);
    const leakedHeaders = headerString.match(RE_PRIVATE_IP) || [];
    
    if (leakedHeaders.length > 0) {
      console.log(chalk.bold.red(`[!] PRIVATE IP LEAK IN HEADERS!`));
      [...new Set(leakedHeaders)].forEach(ip => console.log(chalk.red(`    - Found: ${ip}`)));
    }
    
    // Check body
    const bodyString = String(res.data);
    const leakedBody = bodyString.match(RE_PRIVATE_IP) || [];
    
    if (leakedBody.length > 0) {
       console.log(chalk.bold.red(`[!] PRIVATE IP LEAK IN RESPONSE BODY!`));
       [...new Set(leakedBody)].forEach(ip => console.log(chalk.red(`    - Found: ${ip}`)));
    } else {
      console.log(chalk.green(`\n[+] No obvious private IP leaks found.`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error scanning for private IPs: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
