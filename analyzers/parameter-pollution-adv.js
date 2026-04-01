#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: parameter-pollution-adv.js                           ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('parameter-pollution-adv.js')
  .description('Advanced HTTP Parameter Pollution (HPP) tester with multiple payload combinations.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL')
  .option('-p, --param <name>', 'Parameter to pollute')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'parameter-pollution-adv.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = new URL(opts.url);
  const param = opts.param || Array.from(targetUrl.searchParams.keys())[0];
  
  if (!param) {
    console.log(chalk.yellow('[!] No parameter found or provided. Use -u <url?id=1>'));
    return;
  }
  
  console.log(chalk.cyan(`[*] Testing Advanced HPP for parameter: ${param}\n`));
  
  const payloads = [
    `${param}=orig&${param}=polluted`,
    `${param}[]=orig&${param}[]=polluted`,
    `${param}=orig%26${param}=polluted` // Encoded amp
  ];
  
  for (const payload of payloads) {
    const testUrl = new URL(opts.url);
    testUrl.search.replace(`${param}=`, `${payload}&`);
    
    try {
      const res = await axios.get(testUrl.href, { timeout: 10000, validateStatus: () => true });
      process.stdout.write(chalk.gray(`[*] Payload: ${payload}... `));
      
      if (res.data.includes('polluted')) {
        console.log(chalk.bold.green(`VULNERABLE (Reflected!)`));
      } else {
        console.log(chalk.red(`NOT REFLECTED`));
      }
    } catch (e) {
      console.log(chalk.red(`ERROR: ${e.message}`));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
