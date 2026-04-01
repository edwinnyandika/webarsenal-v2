#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: session-timeout-checker.js                         ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('session-timeout-checker.js')
  .description('Tests for long-lived sessions by checking if a session remains valid after a period of time.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with an active session')
  .option('-h, --header <header>', 'Auth header (e.g., "Authorization: Bearer <token>")')
  .option('-w, --wait <ms>', 'Wait time in milliseconds', '10000')
  .parse(process.argv);

const opts = program.opts();

async function testSession(url, headers) {
  try {
    const res = await axios.get(url, { headers, timeout: 5000, validateStatus: () => true });
    return res.status;
  } catch (e) {
    return 'ERROR';
  }
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'session-timeout-checker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const headers = {};
  if (opts.header) {
    const [hKey, hVal] = opts.header.split(': ');
    headers[hKey] = hVal;
  }
  
  console.log(chalk.cyan(`[*] Testing session validity for: ${opts.url}\n`));
  
  const status1 = await testSession(opts.url, headers);
  console.log(chalk.gray(`[*] INITIAL STATUS: ${status1}`));
  
  if (status1 !== 200) {
    console.log(chalk.red(`[x] Initial request failed. Cannot proceed with session timeout test.`));
    return;
  }
  
  const waitTime = parseInt(opts.wait);
  console.log(chalk.yellow(`[*] Waiting for ${waitTime}ms to test for inactivity timeout...`));
  await new Promise(resolve => setTimeout(resolve, waitTime));
  
  const status2 = await testSession(opts.url, headers);
  console.log(chalk.gray(`[*] FINAL STATUS: ${status2}`));
  
  if (status2 === 200) {
    console.log(chalk.bold.green(`[✓] Session is still valid. (Long-lived session detected)`));
  } else {
    console.log(chalk.bold.red(`[!] Session invalidated. (Possibly timed out)`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
