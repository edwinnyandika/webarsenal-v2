#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: sub-domain-diff.js                                  ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('sub-domain-diff.js')
  .description('Compares two subdomain lists and highlights new or removed subdomains.')
  .version('3.0.0')
  .requiredOption('-1, --old <file>', 'Old subdomain list')
  .requiredOption('-2, --new <file>', 'New subdomain list')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'sub-domain-diff.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.old) || !fs.existsSync(opts.new)) {
    console.log(chalk.red(`[x] One or both files not found.`));
    return;
  }
  
  const oldSubs = new Set(fs.readFileSync(opts.old, 'utf8').split('\n').filter(Boolean).map(s => s.trim()));
  const newSubs = new Set(fs.readFileSync(opts.new, 'utf8').split('\n').filter(Boolean).map(s => s.trim()));
  
  const added = [...newSubs].filter(s => !oldSubs.has(s));
  const removed = [...oldSubs].filter(s => !newSubs.has(s));
  
  console.log(chalk.cyan(`[*] Comparing subdomain lists:\n    Old: ${oldSubs.size} | New: ${newSubs.size}\n`));
  
  if (added.length > 0) {
    console.log(chalk.bold.green(`[+] NEW SUBDOMAINS FOUND (${added.length}):`));
    added.forEach(s => console.log(chalk.green(`    + ${s}`)));
  }
  
  if (removed.length > 0) {
    console.log(chalk.bold.red(`\n[-] REMOVED SUBDOMAINS (${removed.length}):`));
    removed.forEach(s => console.log(chalk.red(`    - ${s}`)));
  }
  
  if (added.length === 0 && removed.length === 0) {
    console.log(chalk.bold.green(`[✓] NO CHANGES DETECTED.`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
