#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: common-crawl-miner.js                               ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('common-crawl-miner.js')
  .description('Queries the Common Crawl index for historical URLs and subdomains of a target.')
  .version('3.0.0')
  .requiredOption('-d, --domain <domain>', 'Domain to query (e.g., *.example.com)')
  .option('-o, --output <file>', 'Output list to file')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'common-crawl-miner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const domain = opts.domain;
  const indexUrl = `https://index.commoncrawl.org/CC-MAIN-2023-50-index?url=${encodeURIComponent(domain)}/*&output=json`;
  
  console.log(chalk.cyan(`[*] Querying Common Crawl for: ${domain}\n`));
  
  try {
    const res = await axios.get(indexUrl, { timeout: 30000, validateStatus: () => true });
    
    if (res.status === 200 && res.data) {
       // Common Crawl returns a JSON stream (one object per line)
       const lines = res.data.split('\n').filter(Boolean);
       const urls = lines.map(line => JSON.parse(line).url);
       
       console.log(chalk.bold.green(`[✓] DISCOVERY COMPLETE.`));
       console.log(chalk.green(`[*] Found ${urls.length} unique URLs in Common Crawl.`));
       
       console.log(chalk.cyan(`\n[→] Samples:`));
       urls.slice(0, 20).forEach(u => console.log(chalk.gray(`     - ${u}`)));
       
       if (opts.output) {
         require('fs').writeFileSync(opts.output, urls.join('\n'));
         console.log(chalk.blue(`\n[*] Saved results to: ${opts.output}`));
       }
    } else if (res.status === 404) {
      console.log(chalk.yellow(`[-] No data found in this Common Crawl index for: ${domain}`));
    } else {
      console.log(chalk.red(`[-] Error querying Common Crawl. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying Common Crawl: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
