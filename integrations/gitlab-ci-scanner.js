#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: gitlab-ci-scanner.js                                ║
 * ║  Category: integrations                                         ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('gitlab-ci-scanner.js')
  .description('Analyzes GitLab CI configuration files for over-privileged runners or exposed tokens.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to .gitlab-ci.yml')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'gitlab-ci-scanner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing GitLab CI config: ${opts.file}\n`));
  
  try {
    const content = fs.readFileSync(opts.file, 'utf8');
    
    if (content.includes('privileged: true')) {
       console.log(chalk.bold.red(`[!] SECURITY RISK: Privileged Docker runners detected.`));
    }
    
    if (content.includes('GIT_STRATEGY: none')) {
       console.log(chalk.yellow(`[*] Job uses GIT_STRATEGY: none (Possible security optimization).`));
    }
    
    if (content.includes('artifacts:') && content.includes('expire_in: never')) {
       console.log(chalk.yellow(`[!] WARNING: Artifacts never expire. Check for sensitive output.`));
    }
    
    const tokenRegex = /CI_JOB_TOKEN|GLPAT-[0-9a-zA-Z_\-]{20}/g;
    if (content.match(tokenRegex)) {
       console.log(chalk.bold.red(`[!] POTENTIAL TOKEN EXPOSURE IN CONFIG!`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing GitLab config: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
