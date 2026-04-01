#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: firebase-db-auditor.js                              ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('firebase-db-auditor.js')
  .description('Checks for publicly accessible Firebase Realtime Databases.')
  .version('3.0.0')
  .requiredOption('-n, --name <project>', 'Firebase project name (e.g., example-app)')
  .parse(process.argv);

const opts = program.opts();

async function checkFirebase(name) {
  const url = `https://${name}.firebaseio.com/.json`;
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    
    if (res.status === 200 && res.data !== null) {
      console.log(chalk.bold.green(`[!] OPEN FIREBASE DATABASE FOUND: ${url}`));
      const snippet = JSON.stringify(res.data).substring(0, 500);
      console.log(chalk.green(`    Discovery: Data preview: ${snippet}...`));
      return true;
    } else if (res.status === 401 || res.status === 403) {
      console.log(chalk.yellow(`[+] Firebase exists but restricted: ${url}`));
      return false;
    } else if (res.status === 404) {
      console.log(chalk.red(`[-] No Firebase DB found at: ${url}`));
      return false;
    }
  } catch (e) {
    console.log(chalk.red(`[x] Error checking: ${e.message}`));
  }
  return false;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'firebase-db-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Auditing Firebase project: ${opts.name}\n`));
  await checkFirebase(opts.name);
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
