#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: vuln-severity-sorter.js                             ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('vuln-severity-sorter.js')
  .description('Sorts a combined JSON findings file by vulnerability severity (Critical, High, Medium, Low, Info).')
  .version('3.0.0')
  .requiredOption('-f, --file <path>', 'JSON file with findings')
  .option('-o, --output <file>', 'Output sorted file')
  .parse(process.argv);

const opts = program.opts();

const SEVERITY_ORDER = {
  'critical': 0,
  'high': 1,
  'medium': 2,
  'low': 3,
  'info': 4
};

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'vuln-severity-sorter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Sorting vulnerabilities in: ${opts.file}\n`));
  
  try {
    const data = JSON.parse(fs.readFileSync(opts.file, 'utf8'));
    
    if (Array.isArray(data)) {
      const sorted = data.sort((a, b) => {
        const sevA = (a.severity || 'info').toLowerCase();
        const sevB = (b.severity || 'info').toLowerCase();
        return (SEVERITY_ORDER[sevA] ?? 5) - (SEVERITY_ORDER[sevB] ?? 5);
      });
      
      console.log(chalk.bold.green(`[✓] SORT COMPLETE.`));
      sorted.forEach(f => {
         const color = f.severity?.toLowerCase() === 'critical' ? chalk.red : chalk.yellow;
         console.log(color(`    - [${f.severity || 'INFO'}] ${f.module || 'Unknown'}: ${f.target || ''}`));
      });
      
      if (opts.output) {
        fs.writeFileSync(opts.output, JSON.stringify(sorted, null, 2));
        console.log(chalk.blue(`\n[*] Saved results to: ${opts.output}`));
      }
    } else {
       console.log(chalk.yellow(`[-] JSON file is not an array. No sorting possible.`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error parsing JSON: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
