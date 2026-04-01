#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: shodan-ip-history.js                                ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('shodan-ip-history.js')
  .description('Queries Shodan for the historical IP addresses associated with a host.')
  .version('3.0.0')
  .requiredOption('-i, --ip <ip>', 'IP address to query')
  .requiredOption('-k, --key <api_key>', 'Shodan API Key')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'shodan-ip-history.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const ip = opts.ip;
  const key = opts.key;
  const url = `https://api.shodan.io/shodan/host/${ip}/history?key=${key}`;
  
  console.log(chalk.cyan(`[*] Fetching Shodan IP history for: ${ip}\n`));
  
  try {
    const res = await axios.get(url, { timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200 && Array.isArray(res.data)) {
       const history = res.data;
       console.log(chalk.bold.green(`[✓] HISTORY RETRIEVED.`));
       console.log(chalk.green(`[*] Found ${history.length} historical records.`));
       
       history.slice(0, 10).forEach(record => {
         console.log(chalk.gray(`     - [${record.timestamp}] Port: ${record.port}, Product: ${record.product || 'Unknown'}`));
       });
    } else {
      console.log(chalk.red(`[-] No history data found or API key is invalid. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying Shodan history: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
