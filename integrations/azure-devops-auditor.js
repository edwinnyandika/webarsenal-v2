#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: azure-devops-auditor.js                             ║
 * ║  Category: integrations                                         ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('azure-devops-auditor.js')
  .description('Audits azure-pipelines.yml for insecure variable groups or exposed build secrets.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to azure-pipelines.yml')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'azure-devops-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing Azure DevOps Pipeline: ${opts.file}\n`));
  
  try {
    const content = fs.readFileSync(opts.file, 'utf8');
    
    if (content.includes('variables:')) {
       console.log(chalk.bold.green(`[✓] FOUND 'variables' BLOCK. Checking for exposures...`));
       const lines = content.split('\n');
       lines.forEach(l => {
         if (l.match(/(password|secret|key|token|PAT)[\s:]+/i)) {
           console.log(chalk.bold.red(`    [!] POTENTIAL SECRET EXPOSURE: ${l.trim()}`));
         }
       });
    }
    
    if (content.includes('group:')) {
       console.log(chalk.yellow(`[*] Pipeline uses variable groups (Check permissions on Azure DevOps for groups).`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing Azure DevOps Pipeline: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
