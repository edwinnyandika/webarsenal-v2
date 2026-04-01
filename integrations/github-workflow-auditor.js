#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: github-workflow-auditor.js                          ║
 * ║  Category: integrations                                         ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('github-workflow-auditor.js')
  .description('Audits GitHub Actions workflow files for command injection and insecure secret management.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to .github/workflows/file.yml')
  .parse(process.argv);

const opts = program.opts();

const INJECTION_SINKS = [
  '${{ github.event.issue.title }}', '${{ github.event.pull_request.title }}',
  '${{ github.event.comment.body }}', '${{ github.event.head_commit.message }}'
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'github-workflow-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing GitHub Workflow: ${opts.file}\n`));
  
  try {
    const content = fs.readFileSync(opts.file, 'utf8');
    
    INJECTION_SINKS.forEach(sink => {
      if (content.includes(sink)) {
        console.log(chalk.bold.red(`[!] POTENTIAL COMMAND INJECTION SINK FOUND: ${sink}`));
        console.log(chalk.red(`    Vulnerability: Direct interpolation of user-controlled data into shell scripts.`));
      }
    });
    
    if (content.includes('actions/checkout') && !content.includes('persist-credentials: false')) {
       console.log(chalk.yellow(`[!] WARNING: Checkout action detected without persist-credentials: false.`));
    }
    
    if (content.match(/secrets\.[a-zA-Z0-9_]+\s*>>/)) {
       console.log(chalk.bold.red(`[!] WARNING: Secrets being written to a file detected.`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing workflow: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
