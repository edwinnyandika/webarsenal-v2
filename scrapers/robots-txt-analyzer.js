#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: robots-txt-analyzer.js                               ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('robots-txt-analyzer.js')
  .description('Parses robots.txt to find disallowed paths that may contain sensitive data.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target base URL (e.g., https://example.com)')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'robots-txt-analyzer.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const baseUrl = opts.url.endsWith('/') ? opts.url : `${opts.url}/`;
  const robotsUrl = `${baseUrl}robots.txt`;
  
  console.log(chalk.cyan(`[*] Fetching and analyzing: ${robotsUrl}\n`));
  
  try {
    const res = await axios.get(robotsUrl, { timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200) {
      console.log(chalk.bold.green(`[✓] robots.txt FOUND.`));
      const lines = res.data.split('\n');
      const disallowed = lines.filter(l => l.toLowerCase().startsWith('disallow:')).map(l => l.split(':')[1].trim());
      const sitemaps = lines.filter(l => l.toLowerCase().startsWith('sitemap:')).map(l => l.split(':')[1].trim());
      
      if (disallowed.length > 0) {
        console.log(chalk.green(`[*] Found ${disallowed.length} disallowed paths:`));
        disallowed.forEach(d => console.log(chalk.gray(`     - ${d}`)));
      }
      
      if (sitemaps.length > 0) {
        console.log(chalk.blue(`\n[*] Found ${sitemaps.length} sitemaps:`));
        sitemaps.forEach(s => console.log(chalk.gray(`     - ${s}`)));
      }
      
      const sensitive = disallowed.filter(d => ['admin', 'api', 'backup', 'config', 'dev', 'private', 'staging'].some(s => d.includes(s)));
      if (sensitive.length > 0) {
        console.log(chalk.bold.red(`\n[!] POTENTIALLY SENSITIVE PATHS DISCOVERED:`));
        sensitive.forEach(s => console.log(chalk.red(`    - ${s}`)));
      }
    } else {
      console.log(chalk.yellow(`[-] robots.txt not found or inaccessible. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error fetching robots.txt: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
