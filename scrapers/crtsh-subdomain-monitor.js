#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: crtsh-subdomain-monitor.js                          ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('crtsh-subdomain-monitor.js')
  .description('Monitors crt.sh for new certificates issued to a domain (simulated live monitor).')
  .version('3.0.0')
  .requiredOption('-d, --domain <domain>', 'Domain to monitor')
  .option('-i, --interval <ms>', 'Check interval in ms', '60000')
  .parse(process.argv);

const opts = program.opts();

async function checkCrtsh(domain) {
  const url = `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`;
  try {
    const res = await axios.get(url, { timeout: 20000, validateStatus: () => true });
    if (res.status === 200 && Array.isArray(res.data)) {
      const subdomains = [...new Set(res.data.map(item => item.name_value.split('\n')).flat())];
      console.log(chalk.green(`[✓] Sync complete. Current subdomain count: ${subdomains.length}`));
      return subdomains;
    }
  } catch (e) {
    console.log(chalk.red(`[x] Error querying crt.sh: ${e.message}`));
  }
  return [];
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'crtsh-subdomain-monitor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const domain = opts.domain;
  console.log(chalk.cyan(`[*] Starting CT log monitor for: ${domain}\n`));
  
  let knownSubdomains = new Set(await checkCrtsh(domain));
  
  console.log(chalk.yellow(`[*] Waiting for new certificates... (Press Ctrl+C to stop)`));
  
  setInterval(async () => {
    const currentSubdomains = await checkCrtsh(domain);
    const newItems = currentSubdomains.filter(s => !knownSubdomains.has(s));
    
    if (newItems.length > 0) {
      console.log(chalk.bold.red(`\n[!] NEW SUBDOMAINS DETECTED!`));
      newItems.forEach(s => {
        console.log(chalk.red(`    - ${s}`));
        knownSubdomains.add(s);
      });
    }
  }, parseInt(opts.interval));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
