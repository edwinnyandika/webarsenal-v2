#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: couchdb-user-auditor.js                             ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('couchdb-user-auditor.js')
  .description('Audits a CouchDB instance for unauthenticated access to the "_users" or "_all_dbs" endpoints.')
  .version('4.0.0')
  .requiredOption('-u, --url <host>', 'CouchDB host (e.g. http://localhost:5984)')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'couchdb-user-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const target = opts.url;
  console.log(chalk.cyan(`[*] Auditing CouchDB instance: ${target}\n`));
  
  const endpoints = ['/_all_dbs', '/_users', '/_config'];
  
  for (const ep of endpoints) {
    process.stdout.write(chalk.gray(`[*] Testing ${ep}... `));
    try {
      const res = await axios.get(`${target}${ep}`, { timeout: 10000, validateStatus: () => true });
      if (res.status === 200) {
        console.log(chalk.bold.red(`VULNERABLE (UNAUTHENTICATED ACCESS)`));
        console.log(chalk.red(`    [!] CRITICAL: Endpoint ${ep} is publicly readable.`));
      } else {
        console.log(chalk.green(`PROTECTED (${res.status})`));
      }
    } catch (e) {
      console.log(chalk.gray(`FAIL/TIMEOUT`));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
