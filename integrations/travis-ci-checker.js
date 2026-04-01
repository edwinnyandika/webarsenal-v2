#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: travis-ci-checker.js                                ║
 * ║  Category: integrations                                         ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('travis-ci-checker.js')
  .description('Analyzes .travis.yml files for secure environment variable management (encrypted vs plain text).')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to .travis.yml')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'travis-ci-checker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing Travis CI config: ${opts.file}\n`));
  
  try {
    const content = fs.readFileSync(opts.file, 'utf8');
    
    if (content.includes('env:')) {
       if (content.includes('secure:')) {
         console.log(chalk.green(`[✓] FOUND 'secure' (encrypted) environment variables. Proper practice detected.`));
       } else {
         console.log(chalk.bold.red(`[!] WARNING: Environment variables are likely UNENCRYPTED.`));
         const lines = content.split('\n');
         lines.forEach(l => {
           if (l.match(/(password|key|token)[\s:]+/gi)) {
             console.log(chalk.red(`    [!] POTENTIAL LEAK: ${l.trim()}`));
           }
         });
       }
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing Travis CI config: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
