#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: drone-ci-scanner.js                                 ║
 * ║  Category: integrations                                         ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('drone-ci-scanner.js')
  .description('Analyzes .drone.yml for insecure secrets management or privileged containers.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to .drone.yml')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'drone-ci-scanner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing Drone CI config: ${opts.file}\n`));
  
  try {
    const content = fs.readFileSync(opts.file, 'utf8');
    
    if (content.includes('privileged: true')) {
       console.log(chalk.bold.red(`[!] SECURITY RISK: Privileged pipeline steps detected.`));
    }
    
    if (content.includes('from_secret:')) {
       console.log(chalk.green(`[✓] FOUND 'from_secret' (proper secret handling).`));
    } else {
       console.log(chalk.yellow(`[!] WARNING: Content might contain hardcoded secrets.`));
       const lines = content.split('\n');
       lines.forEach(l => {
         if (l.match(/(password|secret|key|token)[\s:]+/i)) {
           console.log(chalk.bold.red(`    [!] LEAKED SECRET: ${l.trim()}`));
         }
       });
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing Drone CI config: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
