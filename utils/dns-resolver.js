#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: dns-resolver.js                                    ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const dns = require('dns').promises;
const fs = require('fs');

program
  .name('dns-resolver.js')
  .description('Resolves a list of subdomains to IP addresses.')
  .version('3.0.0')
  .requiredOption('-i, --input <file>', 'Input file containing subdomains')
  .option('-o, --output <file>', 'Output file for resolved data')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'dns-resolver.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.input)) {
    console.error(chalk.red(`[x] Input file not found: ${opts.input}`));
    process.exit(1);
  }
  
  const subdomains = fs.readFileSync(opts.input, 'utf8').split('\n').filter(Boolean).map(s => s.trim());
  console.log(chalk.cyan(`[*] Resolving ${subdomains.length} subdomains...\n`));
  
  const results = [];
  
  for (const sub of subdomains) {
    process.stdout.write(chalk.gray(`[*] Resolving: ${sub.padEnd(30)} `));
    try {
      const records = await dns.resolve4(sub);
      console.log(chalk.green('SUCCESS: ' + records.join(', ')));
      results.push({ subdomain: sub, ips: records });
    } catch (err) {
      console.log(chalk.red('FAILED'));
    }
  }
  
  if (opts.output) {
    fs.writeFileSync(opts.output, JSON.stringify(results, null, 2));
    console.log(chalk.bold.green(`\n[✓] Resolved data saved to: ${opts.output}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
