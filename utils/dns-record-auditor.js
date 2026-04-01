#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: dns-record-auditor.js                               ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const dns = require('dns').promises;

program
  .name('dns-record-auditor.js')
  .description('Queries and audits common DNS records (A, AAAA, MX, TXT, NS, CNAME).')
  .version('3.0.0')
  .requiredOption('-d, --domain <domain>', 'Domain to target')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'dns-record-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const domain = opts.domain;
  console.log(chalk.cyan(`[*] Auditing DNS records for: ${domain}\n`));
  
  const recordTypes = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME'];
  
  for (const type of recordTypes) {
    process.stdout.write(chalk.gray(`[*] Querying ${type}... `));
    try {
      let records;
      if (type === 'A') records = await dns.resolve4(domain);
      else if (type === 'AAAA') records = await dns.resolve6(domain);
      else if (type === 'MX') records = await dns.resolveMx(domain);
      else if (type === 'TXT') records = await dns.resolveTxt(domain);
      else if (type === 'NS') records = await dns.resolveNs(domain);
      else if (type === 'CNAME') records = await dns.resolveCname(domain);
      
      console.log(chalk.green(`DONE (${records.length} found)`));
      records.forEach(r => {
        if (typeof r === 'string') console.log(chalk.gray(`     - ${r}`));
        else console.log(chalk.gray(`     - ${JSON.stringify(r)}`));
      });
    } catch (e) {
      console.log(chalk.red(`NOT FOUND / ERROR`));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
