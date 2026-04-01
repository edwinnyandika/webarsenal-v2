#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: idor-fuzzer.js                                     ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('idor-fuzzer.js')
  .description('Tests for Insecure Direct Object Reference vulnerabilities by fuzzing numerical IDs.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with an ID (e.g., https://api.example.com/user/100)')
  .option('-r, --range <number>', 'Range of IDs to test (+/- from original)', '20')
  .option('-h, --header <header>', 'Auth header (e.g., "Authorization: Bearer <token>")')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'idor-fuzzer.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const originalUrl = opts.url;
  const idMatch = originalUrl.match(/\/(\d+)(\/|\?|$)/);
  
  if (!idMatch) {
    console.log(chalk.red('[x] No numerical ID found in the URL.'));
    return;
  }
  
  const originalId = parseInt(idMatch[1]);
  const range = parseInt(opts.range);
  const headers = {};
  if (opts.header) {
    const [hKey, hVal] = opts.header.split(': ');
    headers[hKey] = hVal;
  }
  
  console.log(chalk.cyan(`[*] Fuzzing IDOR around original ID: ${originalId}\n`));
  
  // Baseline request
  try {
    const baseline = await axios.get(originalUrl, { headers, timeout: 5000, validateStatus: () => true });
    const baselineLength = JSON.stringify(baseline.data).length;
    console.log(chalk.gray(`[*] Baseline: ID ${originalId} | Status: ${baseline.status} | Size: ${baselineLength}`));
    
    for (let id = originalId - range; id <= originalId + range; id++) {
      if (id === originalId) continue;
      if (id < 0) continue;
      
      const testUrl = originalUrl.replace(originalId.toString(), id.toString());
      const res = await axios.get(testUrl, { headers, timeout: 5000, validateStatus: () => true });
      const currentLength = JSON.stringify(res.data).length;
      
      if (res.status === 200 && currentLength !== baselineLength) {
        console.log(chalk.bold.green(`[!] POTENTIAL IDOR: ID ${id} | Status: ${res.status} | Size: ${currentLength}`));
        console.log(chalk.green(`    URL: ${testUrl}`));
      } else {
        process.stdout.write(chalk.gray(`.`));
      }
    }
  } catch (err) {
    console.log(chalk.red(`[x] Error in baseline: ${err.message}`));
  }
  
  console.log(chalk.cyan('\n\n[*] Fuzzing complete.'));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
