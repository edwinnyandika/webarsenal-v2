#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: aws-iam-policy-auditor.js                           ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('aws-iam-policy-auditor.js')
  .description('Analyzes AWS IAM policy documents for overly permissive (star) actions.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to IAM policy JSON')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'aws-iam-policy-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing IAM Policy: ${opts.file}\n`));
  
  try {
    const policy = JSON.parse(fs.readFileSync(opts.file, 'utf8'));
    const statements = policy.Statement || [];
    
    statements.forEach((stmt, idx) => {
       if (stmt.Effect === 'Allow') {
          const action = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          const resource = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];
          
          if (action.includes('*')) {
             console.log(chalk.bold.red(`    [!] CRITICAL: Wildcard ACTION (*) detected in statement ${idx + 1}.`));
          }
          if (resource.includes('*')) {
             console.log(chalk.bold.red(`    [!] CRITICAL: Wildcard RESOURCE (*) detected in statement ${idx + 1}.`));
          }
       }
    });

  } catch (err) {
    console.error(chalk.red(`[x] Error auditing IAM policy: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
