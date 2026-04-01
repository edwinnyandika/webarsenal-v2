#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: wayback-machine-url-miner.js                       ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('wayback-machine-url-miner.js')
  .description('Queries the Wayback Machine for historical URLs for a given domain.')
  .version('3.0.0')
  .requiredOption('-d, --domain <domain>', 'Domain to query (e.g., example.com)')
  .option('-o, --output <file>', 'Output list to file')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'wayback-machine-url-miner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const domain = opts.domain;
  const url = `http://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}/*&output=text&fl=original&collapse=urlkey`;
  
  console.log(chalk.cyan(`[*] Fetching historical URLs from Wayback Machine for: ${domain}\n`));
  
  try {
    const res = await axios.get(url, { timeout: 30000, validateStatus: () => true });
    
    if (res.status === 200 && res.data) {
      const urls = res.data.split('\n').filter(Boolean);
      console.log(chalk.bold.green(`[✓] DISCOVERY COMPLETE.`));
      console.log(chalk.green(`[*] Found ${urls.length} unique historical URLs.`));
      
      console.log(chalk.cyan(`\n[→] Samples:`));
      urls.slice(0, 20).forEach(u => console.log(chalk.gray(`     - ${u}`)));
      
      if (opts.output) {
        require('fs').writeFileSync(opts.output, urls.join('\n'));
        console.log(chalk.blue(`\n[*] Saved results to: ${opts.output}`));
      }
    } else {
      console.log(chalk.red(`[-] No data found or Wayback Machine is inaccessible. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying Wayback Machine: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
