#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: asn-ip-extractor.js                                 ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('asn-ip-extractor.js')
  .description('Extracts all IP ranges associated with an Autonomous System Number (ASN).')
  .version('3.0.0')
  .requiredOption('-a, --asn <number>', 'ASN to query (e.g., AS15169 for Google)')
  .option('-o, --output <file>', 'Output list to file')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'asn-ip-extractor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const asn = opts.asn.toUpperCase().startsWith('AS') ? opts.asn.toUpperCase() : `AS${opts.asn}`;
  const url = `https://api.bgpview.io/asn/${asn.replace('AS', '')}/prefixes`;
  
  console.log(chalk.cyan(`[*] Fetching IP prefixes for: ${asn}\n`));
  
  try {
    const res = await axios.get(url, { timeout: 20000, validateStatus: () => true });
    
    if (res.status === 200 && res.data.data) {
      const prefixes = res.data.data.ipv4_prefixes.map(p => p.prefix);
      console.log(chalk.bold.green(`[✓] EXTRACTION COMPLETE.`));
      console.log(chalk.green(`[*] Found ${prefixes.length} IPv4 prefixes for ${asn}.`));
      
      console.log(chalk.cyan(`\n[→] Samples:`));
      prefixes.slice(0, 15).forEach(p => console.log(chalk.gray(`     - ${p}`)));
      
      if (opts.output) {
        require('fs').writeFileSync(opts.output, prefixes.join('\n'));
        console.log(chalk.blue(`\n[*] Saved results to: ${opts.output}`));
      }
    } else {
      console.log(chalk.red(`[-] No data found or BGPView API is down. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying BGPView: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
