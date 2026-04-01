#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: certificate-transparency-miner.js                  ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('certificate-transparency-miner.js')
  .description('Queries crt.sh for subdomain discovery via Certificate Transparency logs.')
  .version('3.0.0')
  .requiredOption('-d, --domain <domain>', 'Domain to query (e.g. example.com)')
  .option('-o, --output <file>', 'Output JSON file')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'certificate-transparency-miner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const domain = opts.domain;
  const url = `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`;
  
  console.log(chalk.cyan(`[*] Querying crt.sh for CT logs of: ${domain}\n`));
  
  try {
    const res = await axios.get(url, { timeout: 30000, validateStatus: () => true });
    
    if (res.status === 200 && Array.isArray(res.data)) {
      const subdomains = [...new Set(res.data.map(item => item.name_value.split('\n')).flat())];
      console.log(chalk.bold.green(`[✓] DISCOVERY COMPLETE.`));
      console.log(chalk.green(`[*] Found ${subdomains.length} subdomains in CT logs.`));
      
      console.log(chalk.cyan(`\n[→] Samples:`));
      subdomains.slice(0, 20).forEach(sub => console.log(chalk.gray(`     - ${sub}`)));
      
      if (opts.output) {
        require('fs').writeFileSync(opts.output, JSON.stringify(subdomains, null, 2));
        console.log(chalk.blue(`\n[*] Saved results to: ${opts.output}`));
      }
    } else {
      console.log(chalk.red(`[-] No data found or crt.sh is down. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying crt.sh: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
