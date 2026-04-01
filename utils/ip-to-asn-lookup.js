#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: ip-to-asn-lookup.js                                 ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('ip-to-asn-lookup.js')
  .description('Lookup the Autonomous System Number (ASN) and organization for a given IP address.')
  .version('3.0.0')
  .requiredOption('-i, --ip <ip>', 'IP address to query')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'ip-to-asn-lookup.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const ip = opts.ip;
  const url = `https://api.bgpview.io/ip/${ip}`;
  
  console.log(chalk.cyan(`[*] Looking up ASN for IP: ${ip}\n`));
  
  try {
    const res = await axios.get(url, { timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200 && res.data.data) {
      const data = res.data.data;
      console.log(chalk.bold.green(`[✓] LOOKUP COMPLETE.`));
      
      const asns = data.prefixes.map(p => p.asn.asn);
      const uniqueAsns = [...new Set(asns)];
      
      console.log(chalk.green(`[*] ASNs: ${uniqueAsns.join(', ')}`));
      console.log(chalk.green(`[*] PTR: ${data.ptr_record || 'None'}`));
      
      if (data.prefixes.length > 0) {
        console.log(chalk.green(`[*] Org: ${data.prefixes[0].asn.name}`));
        console.log(chalk.green(`[*] Description: ${data.prefixes[0].asn.description}`));
      }
    } else {
      console.log(chalk.red(`[-] No data found for IP ${ip}. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying BGPView: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
