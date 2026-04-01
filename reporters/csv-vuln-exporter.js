#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: csv-vuln-exporter.js                                ║
 * ║  Category: reporters                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('csv-vuln-exporter.js')
  .description('Exports vulnerabilities from a JSON recon file into a structured CSV format.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Recon JSON file')
  .option('-o, --output <path>', 'Output CSV filename', 'vulnerabilities.csv')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'csv-vuln-exporter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Exporting vulnerabilities from ${opts.file} to CSV...\n`));
  
  try {
    const data = JSON.parse(fs.readFileSync(opts.file, 'utf8'));
    const vulns = data.vulnerabilities || [];
    
    let csv = 'ID,Severity,Category,Description,Endpoint\n';
    vulns.forEach((v, idx) => {
       csv += `${idx + 1},${v.severity},${v.category},"${v.description.replace(/"/g, '""')}",${v.endpoint || ''}\n`;
    });
    
    fs.writeFileSync(opts.output, csv);
    console.log(chalk.bold.green(`[✓] SUCCESS: ${vulns.length} vulnerabilities exported to ${opts.output}`));
  } catch (err) {
    console.error(chalk.red(`[x] Error exporting CSV: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
