#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: html-report-generator.js                            ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('html-report-generator.js')
  .description('Generates a professional, interactive HTML report from JSON recon data.')
  .version('3.0.0')
  .requiredOption('-f, --file <path>', 'JSON recon results file')
  .requiredOption('-o, --output <file>', 'Output HTML report file')
  .parse(process.argv);

const opts = program.opts();

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebArsenal Recon Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
        h1 { color: #38bdf8; border-bottom: 2px solid #334155; padding-bottom: 10px; }
        .card { background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
        .badge-high { background: #ef4444; color: white; }
        .badge-info { background: #3b82f6; color: white; }
        pre { background: #000; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 0.9rem; border: 1px solid #334155; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #334155; }
        th { background: #334155; color: #38bdf8; }
    </style>
</head>
<body>
    <h1>WebArsenal Recon Report</h1>
    <p>Generated on: {{DATE}}</p>
    <div class="card">
        <h2>Summary</h2>
        <p>Total Items Scanned: {{TOTAL}}</p>
    </div>
    <div class="card">
        <h2>Detailed Findings</h2>
        <pre>{{DATA}}</pre>
    </div>
</body>
</html>
`;

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'html-report-generator.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Generating HTML report from: ${opts.file}\n`));
  
  try {
    const data = JSON.parse(fs.readFileSync(opts.file, 'utf8'));
    const total = Array.isArray(data) ? data.length : 'N/A';
    
    let report = HTML_TEMPLATE
      .replace('{{DATE}}', new Date().toISOString())
      .replace('{{TOTAL}}', total)
      .replace('{{DATA}}', JSON.stringify(data, null, 2));
      
    fs.writeFileSync(opts.output, report);
    console.log(chalk.bold.green(`[✓] REPORT GENERATED: ${opts.output}`));
    
  } catch (err) {
    console.error(chalk.red(`[x] Error generating report: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
