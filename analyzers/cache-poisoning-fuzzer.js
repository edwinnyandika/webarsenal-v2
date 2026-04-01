#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: cache-poisoning-fuzzer.js                           ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('cache-poisoning-fuzzer.js')
  .description('Tests for Web Cache Poisoning by injecting unkeyed headers.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL')
  .parse(process.argv);

const opts = program.opts();

const UNKEYED_HEADERS = [
  { 'X-Forwarded-Host': 'attacker.com' },
  { 'X-Forwarded-Scheme': 'http' },
  { 'X-Original-URL': '/admin' },
  { 'X-Rewrite-URL': '/admin' },
  { 'X-Forwarded-Proto': 'http' }
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'cache-poisoning-fuzzer.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Fuzzing for Cache Poisoning: ${targetUrl}\n`));
  
  for (const header of UNKEYED_HEADERS) {
    const headerName = Object.keys(header)[0];
    const headerValue = header[headerName];
    
    process.stdout.write(chalk.gray(`[*] Testing ${headerName}: ${headerValue}... `));
    
    try {
      const res = await axios.get(targetUrl, { headers: header, timeout: 5000, validateStatus: () => true });
      
      const body = String(res.data);
      const cacheStatus = res.headers['x-cache'] || res.headers['cf-cache-status'] || 'UNKNOWN';
      const reflected = body.includes(headerValue);
      
      if (reflected) {
        console.log(chalk.bold.red(`REFLECTED!`));
        console.log(chalk.red(`    Header: ${headerName}: ${headerValue}`));
        console.log(chalk.red(`    Cache Status: ${cacheStatus}`));
        console.log(chalk.red(`    [!] SECURITY RISK: Potential Web Cache Poisoning if reflected in cached response.`));
      } else {
        console.log(chalk.green('NOT REFLECTED'));
      }
    } catch (e) {
      console.log(chalk.red(`ERROR: ${e.message}`));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
