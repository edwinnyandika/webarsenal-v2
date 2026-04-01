#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: bitbucket-pipeline-miner.js                         ║
 * ║  Category: integrations                                         ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('bitbucket-pipeline-miner.js')
  .description('Scans bitbucket-pipelines.yml for hardcoded environment variables or insecure pipe configurations.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to bitbucket-pipelines.yml')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'bitbucket-pipeline-miner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing Bitbucket Pipelines: ${opts.file}\n`));
  
  try {
    const content = fs.readFileSync(opts.file, 'utf8');
    
    if (content.includes('variables:')) {
       console.log(chalk.bold.green(`[✓] FOUND 'variables' BLOCK. Checking for exposures...`));
       const lines = content.split('\n');
       lines.forEach(l => {
         if (l.match(/(password|secret|key|token|AWS_)[\s:]+/i)) {
           console.log(chalk.bold.red(`    [!] POTENTIAL SECRET EXPOSURE: ${l.trim()}`));
         }
       });
    }
    
    if (content.includes('pipe:')) {
       console.log(chalk.yellow(`[*] Custom deployment pipe detected. Check pipe source and security.`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing Bitbucket Pipelines: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
