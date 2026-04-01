#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: invisible-param-finder.js                          ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('invisible-param-finder.js')
  .description('Tests for HTTP Parameter Pollution (HPP) by injecting duplicate parameters.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with parameters (e.g., https://api.example.com/search?q=test)')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'invisible-param-finder.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = new URL(opts.url);
  const params = Array.from(targetUrl.searchParams.keys());
  
  if (params.length === 0) {
    console.log(chalk.yellow('[!] No parameters found. Use -u <url?id=1>'));
    return;
  }
  
  console.log(chalk.cyan(`[*] Fuzzing ${params.length} parameters for HPP...\n`));
  
  for (const param of params) {
    console.log(chalk.bold.white(`[→] Testing Parameter: ${param}`));
    
    // Attempt 1: Double the parameter
    const testUrl1 = new URL(targetUrl.href);
    testUrl1.searchParams.append(param, 'hpp-second');
    
    console.log(chalk.gray(`  - Testing: ${testUrl1.href.substring(0, 50)}... `));
    try {
      const res1 = await axios.get(testUrl1.href, { timeout: 5000, validateStatus: () => true });
      if (res1.status === 200) {
        console.log(chalk.green('ACCEPTED'));
      } else {
        console.log(chalk.red(`REJECTED (${res1.status})`));
      }
    } catch (e) {
      console.log(chalk.red(`ERROR: ${e.message}`));
    }
  }
  
  console.log(chalk.cyan('\n[*] Tests complete.'));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
