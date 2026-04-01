#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: recon-data-merger.js                                ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('recon-data-merger.js')
  .description('Merges multiple JSON recon files from different modules into a single master report.')
  .version('3.0.0')
  .requiredOption('-d, --dir <path>', 'Directory containing JSON recon files')
  .option('-o, --output <file>', 'Output master JSON file', 'master_recon.json')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'recon-data-merger.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.dir)) {
    console.log(chalk.red(`[x] Directory not found: ${opts.dir}`));
    return;
  }
  
  const files = fs.readdirSync(opts.dir).filter(f => f.endsWith('.json') && f !== opts.output);
  console.log(chalk.cyan(`[*] Merging ${files.length} recon files from: ${opts.dir}\n`));
  
  let masterData = {};
  
  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(`${opts.dir}/${file}`, 'utf8'));
      const moduleName = file.replace('.json', '');
      masterData[moduleName] = data;
      console.log(chalk.green(`    [+] Merged: ${file}`));
    } catch (e) {
      console.log(chalk.red(`    [x] Error parsing: ${file}`));
    }
  });
  
  fs.writeFileSync(opts.output, JSON.stringify(masterData, null, 2));
  console.log(chalk.bold.green(`\n[✓] MERGE COMPLETE. Master report saved to: ${opts.output}`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
