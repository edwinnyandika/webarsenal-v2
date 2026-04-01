#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: google-dorker.js                                    ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const cheerio = require('cheerio');

program
  .name('google-dorker.js')
  .description('Performs automated Google search dorking using search engine result parsing.')
  .version('3.0.0')
  .requiredOption('-q, --query <dork>', 'Search query / dork (e.g., "site:example.com intitle:index.of")')
  .option('-p, --pages <number>', 'Number of pages to scan', '1')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'google-dorker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const query = opts.query;
  const numPages = parseInt(opts.pages);
  
  console.log(chalk.cyan(`[*] Performing Google dorking for: ${query}\n`));
  
  for (let page = 0; page < numPages; page++) {
    const start = page * 10;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${start}`;
    
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000,
        validateStatus: () => true
      });
      
      const $ = cheerio.load(res.data);
      const links = [];
      
      $('div.g a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.startsWith('http')) links.push(href);
      });
      
      if (links.length > 0) {
        console.log(chalk.bold.green(`[✓] Page ${page + 1}: Found ${links.length} results.`));
        [...new Set(links)].forEach(l => console.log(chalk.gray(`     - ${l}`)));
      } else {
        console.log(chalk.yellow(`[-] Page ${page + 1}: No results found or CAPTCHA triggered.`));
      }
      
      // Delay to avoid being blocked
      if (page < numPages - 1) await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (err) {
      console.error(chalk.red(`[x] Error querying Google: ${err.message}`));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
