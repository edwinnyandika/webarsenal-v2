#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: diff-reporter.js                                   ║
 * ║  Category: reporters                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('diff-reporter.js')
  .description('Compares two recon runs and highlights new findings.')
  .version('3.0.0')
  .requiredOption('-n, --new <file>', 'JSON file containing current recon data')
  .requiredOption('-o, --old <file>', 'JSON file containing previous recon data')
  .option('-f, --format <format>', 'Output format (md, json)', 'md')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'diff-reporter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.new) || !fs.existsSync(opts.old)) {
    console.error(chalk.red(`[x] One of the input files not found.`));
    process.exit(1);
  }
  
  const current = JSON.parse(fs.readFileSync(opts.new, 'utf8'));
  const previous = JSON.parse(fs.readFileSync(opts.old, 'utf8'));
  
  console.log(chalk.cyan(`[*] Comparing Current (${opts.new}) vs Previous (${opts.old})...\n`));
  
  const diffs = {
    newSubdomains: [],
    newEndpoints: [],
    newSecrets: []
  };
  
  // Diff Subdomains
  const currSubs = new Set(current.subdomains || []);
  const prevSubs = new Set(previous.subdomains || []);
  diffs.newSubdomains = Array.from(currSubs).filter(s => !prevSubs.has(s));
  
  // Diff Endpoints
  const currEnds = new Set(current.endpoints || []);
  const prevEnds = new Set(previous.endpoints || []);
  diffs.newEndpoints = Array.from(currEnds).filter(e => !prevEnds.has(e));
  
  // Output result
  if (diffs.newSubdomains.length === 0 && diffs.newEndpoints.length === 0) {
    console.log(chalk.green('[✓] No new assets discovered in this run.'));
  } else {
    if (diffs.newSubdomains.length > 0) {
      console.log(chalk.bold.red(`[!] NEW SUBDOMAINS FOUND (${diffs.newSubdomains.length}):`));
      diffs.newSubdomains.forEach(s => console.log(chalk.green(` + ${s}`)));
    }
    
    if (diffs.newEndpoints.length > 0) {
      console.log(chalk.bold.red(`\n[!] NEW ENDPOINTS FOUND (${diffs.newEndpoints.length}):`));
      diffs.newEndpoints.forEach(e => console.log(chalk.green(` + ${e}`)));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
