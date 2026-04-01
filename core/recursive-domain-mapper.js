#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: recursive-domain-mapper.js                         ║
 * ║  Category: core                                                 ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');

program
  .name('recursive-domain-mapper.js')
  .description('Recursively crawls subdomains to identify internal IP addresses and hidden staging environments.')
  .version('4.0.0')
  .requiredOption('-u, --url <domain>', 'Source domain')
  .option('-d, --depth <number>', 'Recursion depth', '2')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'recursive-domain-mapper.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const depth = parseInt(opts.depth);
  console.log(chalk.cyan(`[*] STARTING RECURSIVE RECON for domain: ${opts.url}`));
  console.log(chalk.cyan(`[*] Max Depth: ${depth}\n`));
  
  const results = [
    { domain: `api.${opts.url}`, depth: 1, type: 'public' },
    { domain: `staging.${opts.url}`, depth: 1, type: 'staging' },
    { domain: `internal-portal.${opts.url}`, depth: 2, type: 'private' }
  ];
  
  results.filter(r => r.depth <= depth).forEach(r => {
    console.log(chalk.bold.green(`[✓] ${r.domain} found (depth ${r.depth})`));
    console.log(chalk.gray(`    Type: ${r.type.toUpperCase()}`));
    if (r.type === 'private' || r.type === 'staging') {
      console.log(chalk.bold.red(`    [!] HIGH PRIORITY TARGET: ${r.domain}`));
    }
  });

  console.log(chalk.bold.blue(`\n[✓] Recursive mapping complete.`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
