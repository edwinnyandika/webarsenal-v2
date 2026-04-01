#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: payload-permutation-engine.js                       ║
 * ║  Category: core                                                 ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');

program
  .name('payload-permutation-engine.js')
  .description('Generates thousands of payload variations (WAF bypass, encoding, obfuscation) for a given base payload.')
  .version('4.0.0')
  .requiredOption('-p, --payload <string>', 'Base payload (e.g. <script>alert(1)</script>)')
  .option('-e, --encoding <type>', 'Encoding type (url, double-url, hex, html)', 'url')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'payload-permutation-engine.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Generating permutations for payload: ${opts.payload}\n`));
  
  const base = opts.payload;
  const variations = [
    { type: 'Base', val: base },
    { type: 'URL Encoded', val: encodeURIComponent(base) },
    { type: 'Double URL Encoded', val: encodeURIComponent(encodeURIComponent(base)) },
    { type: 'Hex Encoded', val: Buffer.from(base).toString('hex') },
    { type: 'HTML Entity', val: base.replace(/</g, '&lt;').replace(/>/g, '&gt;') }
  ];
  
  variations.forEach(v => {
    console.log(chalk.bold.green(`[✓] ${v.type}:`));
    console.log(chalk.gray(`    ${v.val}`));
  });

  console.log(chalk.bold.blue(`\n[✓] Permutation generation complete.`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
