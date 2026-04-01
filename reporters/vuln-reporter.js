#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: vuln-reporter.js                                   ║
 * ║  Category: reporters                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('vuln-reporter.js')
  .description('Generates formatted bug bounty submission report.')
  .version('3.0.0')
  .requiredOption('-t, --title <title>', 'Vulnerability title')
  .requiredOption('-v, --vuln <type>', 'Vulnerability type (e.g., XSS, IDOR, SQLi)')
  .option('-s, --severity <level>', 'Severity level (Critical, High, Medium, Low)', 'Medium')
  .option('-u, --url <url>', 'Vulnerable URL/Endpoint')
  .option('-p, --poc <poc>', 'Proof of Concept steps/payload')
  .option('-o, --output <file>', 'Output report file name', 'bug-report.md')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'vuln-reporter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Generating Bug Bounty report: ${opts.title}`));
  
  let md = `# [${opts.severity}] ${opts.title}\n\n`;
  md += `## 📝 Description\n\n`;
  md += `**Vulnerability Type:** ${opts.vuln}\n`;
  md += `**Severity:** ${opts.severity}\n`;
  md += `**Target URL:** ${opts.url || 'N/A'}\n\n`;
  
  md += `## 🧪 Proof of Concept (PoC)\n\n`;
  md += `${opts.poc || 'No PoC provided.'}\n\n`;
  
  md += `## 🛡️ Remediation\n\n`;
  md += `[Remediation guide based on ${opts.vuln}]\n\n`;
  
  md += `## 📊 Impact\n\n`;
  md += `[Impact description for ${opts.severity} ${opts.vuln}]\n\n`;
  
  md += `**Reported by:** WebArsenal v3.0.0 Recon Automation\n`;
  
  try {
    fs.writeFileSync(opts.output, md);
    console.log(chalk.bold.green(`\n[✓] SUCCESS: Bug Report saved to: ${opts.output}`));
  } catch (err) {
    console.error(chalk.red(`\n[x] Failed to save Report: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
