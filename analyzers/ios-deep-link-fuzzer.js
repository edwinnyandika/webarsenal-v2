#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: ios-deep-link-fuzzer.js                             ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');

program
  .name('ios-deep-link-fuzzer.js')
  .description('Identifies and generates payloads to fuzz iOS custom URL schemes.')
  .version('4.0.0')
  .requiredOption('-s, --scheme <name>', 'Custom URL scheme (e.g. "my-app")')
  .option('-p, --payload <text>', 'Base payload to fuzz', 'test')
  .parse(process.argv);

const opts = program.opts();

const FUZZING_SUFFIXES = [
  '://auth?token=', '://admin', '://config?dev=true', '://login?user=admin',
  '://reset-password?token=', '://open?url=javascript:alert(1)'
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'ios-deep-link-fuzzer.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const scheme = opts.scheme;
  console.log(chalk.cyan(`[*] Generating deep link fuzzing payloads for: ${scheme}://\n`));
  
  FUZZING_SUFFIXES.forEach(suff => {
    const fullLink = `${scheme}${suff}${opts.payload}`;
    console.log(chalk.green(`[→] PAYLOAD: ${fullLink}`));
    // In a real environment, this might trigger the actual app opening via xcrun simctl
    console.log(chalk.gray(`    (Simulate with: xcrun simctl openurl booted "${fullLink}")`));
  });
  
  console.log(chalk.bold.blue(`\n[✓] Payload generation complete.`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
