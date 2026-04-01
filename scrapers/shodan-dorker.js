#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: shodan-dorker.js                                    ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('shodan-dorker.js')
  .description('Performs automated Shodan dorking to find vulnerable devices or exposed infrastructure.')
  .version('3.0.0')
  .requiredOption('-q, --query <dork>', 'Search query / dork (e.g., "title:dashboard country:US")')
  .requiredOption('-k, --key <api_key>', 'Shodan API Key')
  .option('-p, --page <number>', 'Page number', '1')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'shodan-dorker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const query = opts.query;
  const key = opts.key;
  const page = parseInt(opts.page);
  const url = `https://api.shodan.io/shodan/host/search?key=${key}&query=${encodeURIComponent(query)}&page=${page}`;
  
  console.log(chalk.cyan(`[*] Performing Shodan dorking for: ${query} (Page ${page})\n`));
  
  try {
    const res = await axios.get(url, { timeout: 20000, validateStatus: () => true });
    
    if (res.status === 200 && res.data && res.data.matches) {
       const matches = res.data.matches;
       console.log(chalk.bold.green(`[✓] SEARCH COMPLETE. Found ${res.data.total} total results.`));
       console.log(chalk.green(`[*] Showing ${matches.length} results from page ${page}.\n`));
       
       matches.forEach(m => {
         console.log(chalk.gray(`     - IP: ${m.ip_str} | Port: ${m.port} | Org: ${m.org || 'Unknown'}`));
       });
    } else {
      console.log(chalk.red(`[-] No data found or API key is invalid. Status: ${res.status}`));
      if (res.data && res.data.error) console.log(chalk.red(`    Error: ${res.data.error}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error querying Shodan: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
