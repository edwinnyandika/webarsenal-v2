#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: circle-ci-leak-hunter.js                            ║
 * ║  Category: integrations                                         ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('circle-ci-leak-hunter.js')
  .description('Scans .circleci/config.yml for exposed environment variables or hardcoded secrets.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to .circleci/config.yml')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'circle-ci-leak-hunter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing CircleCI config: ${opts.file}\n`));
  
  try {
    const content = fs.readFileSync(opts.file, 'utf8');
    
    if (content.includes('environment:')) {
       console.log(chalk.bold.green(`[✓] FOUND 'environment' BLOCK. Checking for leaks...`));
       const lines = content.split('\n');
       lines.forEach(l => {
         if (l.match(/(password|secret|key|token)[\s:]+/i)) {
           console.log(chalk.bold.red(`    [!] LEAKED SECRET: ${l.trim()}`));
         }
       });
    }
    
    if (content.includes('setup_remote_docker')) {
       console.log(chalk.yellow(`[*] Job uses setup_remote_docker (Check for privileged actions).`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing CircleCI config: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
