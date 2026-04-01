#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: error-detail-miner.js                               ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('error-detail-miner.js')
  .description('Triggers error states and analyzes stack traces or detailed error messages for info leaks.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL to audit')
  .parse(process.argv);

const opts = program.opts();

const ERROR_TRIGGER_PAYLOADS = ["'", "\"", "%00", "../", "{}"];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'error-detail-miner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Triggering error states for: ${targetUrl}\n`));
  
  for (const payload of ERROR_TRIGGER_PAYLOADS) {
    const testUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}error_test=${payload}`;
    process.stdout.write(chalk.gray(`[*] Testing payload: ${payload}... `));
    
    try {
      const res = await axios.get(testUrl, { timeout: 10000, validateStatus: () => true });
      const body = String(res.data);
      
      if (res.status >= 500) {
        console.log(chalk.bold.red(`500 INTERNAL SERVER ERROR`));
        if (body.includes('Stack Trace') || body.includes('at ') || body.includes('line ')) {
          console.log(chalk.red(`    [!] LEAKED STACK TRACE DETECTED!`));
          console.log(chalk.gray(`    Snippet: ${body.substring(0, 200)}...`));
        }
      } else if (res.status === 404) {
        console.log(chalk.yellow(`404 NOT FOUND`));
      } else {
        console.log(chalk.green(`200 OK`));
      }
    } catch (e) {
      console.log(chalk.red(`ERROR: ${e.message}`));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
