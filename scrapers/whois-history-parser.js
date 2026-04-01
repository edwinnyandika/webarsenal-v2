#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: whois-history-parser.js                             ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('whois-history-parser.js')
  .description('Queries ViewDNS for historical WHOIS records of a domain.')
  .version('3.0.0')
  .requiredOption('-d, --domain <domain>', 'Domain to query')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'whois-history-parser.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const domain = opts.domain;
  const url = `https://viewdns.info/whoishistory/?domain=${encodeURIComponent(domain)}`;
  
  console.log(chalk.cyan(`[*] Querying ViewDNS for WHOIS history of: ${domain}\n`));
  
  try {
    const res = await axios.get(url, {
       headers: { 'User-Agent': 'Mozilla/5.0' },
       timeout: 10000,
       validateStatus: () => true
    });
    
    if (res.status === 200 && res.data.includes('WHOIS History')) {
      console.log(chalk.bold.green(`[✓] HISTORY FOUND.`));
      console.log(chalk.green(`[*] View full history at: ${url}`));
    } else {
      console.log(chalk.red(`[-] No history data found or rate-limited. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying ViewDNS: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
