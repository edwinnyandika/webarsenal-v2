#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: dns-dmarc-auditor.js                                ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const dns = require('dns').promises;

program
  .name('dns-dmarc-auditor.js')
  .description('Analyzes DMARC records for security and enforcement level.')
  .version('3.0.0')
  .requiredOption('-d, --domain <domain>', 'Domain to check')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'dns-dmarc-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const dmarcDomain = `_dmarc.${opts.domain}`;
  console.log(chalk.cyan(`[*] Querying DMARC record for: ${opts.domain}\n`));
  
  try {
    const txtRecords = await dns.resolveTxt(dmarcDomain);
    const dmarcRecord = txtRecords.flat().find(r => r.startsWith('v=DMARC1'));
    
    if (dmarcRecord) {
      console.log(chalk.bold.green(`[✓] DMARC RECORD FOUND: ${dmarcRecord}`));
      
      const pMatch = dmarcRecord.match(/p=([^;]+)/);
      const policy = pMatch ? pMatch[1].trim() : 'none';
      
      if (policy === 'reject') {
        console.log(chalk.green(`[✓] Policy (p): REJECT - Enforced security.`));
      } else if (policy === 'quarantine') {
        console.log(chalk.yellow(`[!] Policy (p): QUARANTINE - Partial security.`));
      } else {
        console.log(chalk.red(`[!] Policy (p): ${policy.toUpperCase()} - NO ENFORCEMENT.`));
      }
      
      const ruaMatch = dmarcRecord.match(/rua=([^;]+)/);
      if (ruaMatch) console.log(chalk.gray(`[*] Reporting URI (rua): ${ruaMatch[1]}`));
      else console.log(chalk.yellow(`[-] No reporting URI found.`));
      
    } else {
      console.log(chalk.red(`[-] No DMARC record found for ${opts.domain}.`));
    }
  } catch (err) {
    if (err.code === 'ENOTFOUND') {
      console.log(chalk.red(`[-] No DMARC record found for ${opts.domain}.`));
    } else {
      console.error(chalk.red(`[x] Error querying DNS: ${err.message}`));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
