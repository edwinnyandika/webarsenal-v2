#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: dedup-urls.js                                      ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('dedup-urls.js')
  .description('Deduplicates URLs by path and parameters.')
  .version('3.0.0')
  .requiredOption('-i, --input <file>', 'Input file containing URLs')
  .option('-o, --output <file>', 'Output file for deduped URLs')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'dedup-urls.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.input)) {
    console.error(chalk.red(`[x] Input file not found: ${opts.input}`));
    process.exit(1);
  }
  
  const urls = fs.readFileSync(opts.input, 'utf8').split('\n').filter(Boolean).map(u => u.trim());
  console.log(chalk.cyan(`[*] Processing ${urls.length} URLs for deduplication...\n`));
  
  const uniqueUrls = new Set();
  const patterns = new Set();
  
  urls.forEach(url => {
    try {
      const u = new URL(url);
      const hostPath = u.hostname + u.pathname;
      const params = Array.from(u.searchParams.keys()).sort().join(',');
      const pattern = `${hostPath}?${params}`;
      
      if (!patterns.has(pattern)) {
        patterns.add(pattern);
        uniqueUrls.add(url);
      }
    } catch (e) {
       uniqueUrls.add(url); // Add as-is if parsing fails
    }
  });
  
  console.log(chalk.green(`[✓] SUCCESS: Deduplicated from ${urls.length} to ${uniqueUrls.size} unique URL patterns.`));
  
  if (opts.output) {
    fs.writeFileSync(opts.output, Array.from(uniqueUrls).join('\n'));
    console.log(chalk.cyan(`\n[*] Deduped list saved to: ${opts.output}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
