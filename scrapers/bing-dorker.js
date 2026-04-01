#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: bing-dorker.js                                      ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const cheerio = require('cheerio');

program
  .name('bing-dorker.js')
  .description('Performs automated Bing search dorking to find sensitive files or directories.')
  .version('3.0.0')
  .requiredOption('-q, --query <dork>', 'Search query / dork (e.g., "site:example.com ext:pdf")')
  .option('-p, --pages <number>', 'Number of pages to scan', '1')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'bing-dorker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const query = opts.query;
  const numPages = parseInt(opts.pages);
  
  console.log(chalk.cyan(`[*] Performing Bing dorking for: ${query}\n`));
  
  for (let page = 0; page < numPages; page++) {
    const offset = page * 10 + 1;
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&first=${offset}`;
    
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000,
        validateStatus: () => true
      });
      
      const $ = cheerio.load(res.data);
      const links = [];
      
      $('li.b_algo h2 a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) links.push(href);
      });
      
      if (links.length > 0) {
        console.log(chalk.bold.green(`[✓] Page ${page + 1}: Found ${links.length} results.`));
        links.forEach(l => console.log(chalk.gray(`     - ${l}`)));
      } else {
        console.log(chalk.yellow(`[-] Page ${page + 1}: No results found or blocked.`));
      }
      
      // Delay to avoid being blocked
      if (page < numPages - 1) await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (err) {
      console.error(chalk.red(`[x] Error querying Bing: ${err.message}`));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
