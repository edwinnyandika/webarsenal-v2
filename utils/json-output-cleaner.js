#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: json-output-cleaner.js                               ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('json-output-cleaner.js')
  .description('Cleans and deduplicates large JSON recon output files.')
  .version('3.0.0')
  .requiredOption('-f, --file <path>', 'JSON file to clean')
  .option('-o, --output <file>', 'Output cleaned file')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'json-output-cleaner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Cleaning JSON recon file: ${opts.file}\n`));
  
  try {
    const data = JSON.parse(fs.readFileSync(opts.file, 'utf8'));
    
    if (Array.isArray(data)) {
      const originalCount = data.length;
      const uniqueData = [...new Set(data.map(item => JSON.stringify(item)))].map(item => JSON.parse(item));
      const cleanedCount = uniqueData.length;
      
      console.log(chalk.bold.green(`[✓] CLEAN COMPLETE.`));
      console.log(chalk.green(`[*] Found ${originalCount - cleanedCount} duplicate objects.`));
      console.log(chalk.green(`[*] Saved ${cleanedCount} unique objects.`));
      
      if (opts.output) {
        fs.writeFileSync(opts.output, JSON.stringify(uniqueData, null, 2));
        console.log(chalk.blue(`\n[*] Saved results to: ${opts.output}`));
      }
    } else {
       console.log(chalk.yellow(`[-] JSON file is not an array. No cleaning needed.`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error parsing JSON: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
