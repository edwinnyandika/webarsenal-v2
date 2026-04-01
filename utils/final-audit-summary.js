#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: final-audit-summary.js                              ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('final-audit-summary.js')
  .description('Provides a high-level summary of the entire recon process and results.')
  .version('3.0.0')
  .requiredOption('-f, --file <path>', 'Master JSON recon file')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'final-audit-summary.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(opts.file, 'utf8'));
    const modules = Object.keys(data);
    
    console.log(chalk.cyan(`[*] FINAL AUDIT SUMMARY FOR: ${opts.file}\n`));
    console.log(chalk.bold.green(`[✓] MODULES COMPLETED: ${modules.length}`));
    
    modules.forEach(m => {
       const findings = Array.isArray(data[m]) ? data[m].length : (typeof data[m] === 'object' ? Object.keys(data[m]).length : 'N/A');
       console.log(chalk.green(`    - ${m.padEnd(30)} | Findings: ${findings}`));
    });

    console.log(chalk.bold.magenta('\n╔══════════════════════════════════╗'));
    console.log(chalk.bold.magenta('║  AUDIT COMPLETE. READY FOR REPORT ║'));
    console.log(chalk.bold.magenta('╚══════════════════════════════════╝\n'));
    
  } catch (err) {
    console.error(chalk.red(`[x] Error summarizing audit: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
