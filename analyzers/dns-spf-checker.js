#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: dns-spf-checker.js                                  ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const dns = require('dns').promises;

program
  .name('dns-spf-checker.js')
  .description('Analyzes SPF records for loose configurations that allow email spoofing.')
  .version('3.0.0')
  .requiredOption('-d, --domain <domain>', 'Domain to check')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'dns-spf-checker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const domain = opts.domain;
  console.log(chalk.cyan(`[*] Querying SPF records for: ${domain}\n`));
  
  try {
    const txtRecords = await dns.resolveTxt(domain);
    const spfRecord = txtRecords.flat().find(r => r.startsWith('v=spf1'));
    
    if (spfRecord) {
      console.log(chalk.bold.green(`[✓] SPF RECORD FOUND: ${spfRecord}`));
      
      if (spfRecord.includes('+all')) {
        console.log(chalk.bold.red(`[!] CRITICAL: SPF allows '+' (all) - Domain can be spoofed by anyone.`));
      } else if (spfRecord.includes('~all')) {
        console.log(chalk.yellow(`[!] WARNING: SPF uses '~all' (SoftFail) - Spoofed mail might still be delivered.`));
      } else if (spfRecord.includes('-all')) {
        console.log(chalk.green(`[✓] SPF uses '-all' (HardFail) - Good security.`));
      } else {
        console.log(chalk.yellow(`[-] No 'all' mechanism found in SPF record.`));
      }
    } else {
      console.log(chalk.red(`[-] No SPF record found for ${domain}.`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying DNS: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
