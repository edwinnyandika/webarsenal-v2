#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: internal-host-mapper.js                             ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('internal-host-mapper.js')
  .description('Attempts to map internal hostnames leaked in headers or scripts.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL to check')
  .parse(process.argv);

const opts = program.opts();

const INTERNAL_HOST_PATTERNS = [
  /\b[a-zA-Z0-9-]+\.local\b/g,
  /\b[a-zA-Z0-9-]+\.internal\b/g,
  /\b[a-zA-Z0-9-]+\.intranet\b/g,
  /\b[a-zA-Z0-9-]+\.corp\b/g,
  /\b[a-zA-Z0-9-]+\.lan\b/g,
  /\b[a-zA-Z0-9-]+\.priv\b/g
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'internal-host-mapper.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Mapping internal hostnames for: ${targetUrl}\n`));
  
  try {
    const res = await axios.get(targetUrl, { timeout: 10000, validateStatus: () => true });
    
    const combined = JSON.stringify(res.headers) + String(res.data);
    const discovered = new Set();
    
    for (const pattern of INTERNAL_HOST_PATTERNS) {
      const matches = combined.match(pattern) || [];
      matches.forEach(m => discovered.add(m));
    }
    
    if (discovered.size > 0) {
      console.log(chalk.bold.red(`[!] INTERNAL HOSTNAMES DISCOVERED!`));
      Array.from(discovered).forEach(host => console.log(chalk.red(`    - Found: ${host}`)));
    } else {
      console.log(chalk.green(`\n[+] No internal hostnames found in response headers or body.`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error mapping hosts: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
