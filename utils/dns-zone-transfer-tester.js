#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: dns-zone-transfer-tester.js                         ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const dns = require('dns').promises;

program
  .name('dns-zone-transfer-tester.js')
  .description('Attempts to perform a DNS Zone Transfer (AXFR) to discover all records for a domain.')
  .version('3.0.0')
  .requiredOption('-d, --domain <domain>', 'Domain to check')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'dns-zone-transfer-tester.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const domain = opts.domain;
  console.log(chalk.cyan(`[*] Attempting Zone Transfer (AXFR) for: ${domain}\n`));
  
  try {
    const nsRecords = await dns.resolveNs(domain);
    console.log(chalk.gray(`[*] Found Nameservers: ${nsRecords.join(', ')}`));
    
    for (const ns of nsRecords) {
      process.stdout.write(chalk.gray(`[*] Attempting AXFR on ${ns}... `));
      // Node.js dns module doesn't natively support AXFR. 
      // This is a placeholder for external tool integration or manual check guidance.
      console.log(chalk.yellow(`RETRY MANUALLY: dig axfr @${ns} ${domain}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error finding nameservers: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
