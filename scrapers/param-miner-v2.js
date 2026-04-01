#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: param-miner-v2.js                                  ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('param-miner-v2.js')
  .description('Advanced parameter discovery using wordlists and response size comparison.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL to mine')
  .option('-w, --wordlist <file>', 'Custom wordlist for parameter names')
  .parse(process.argv);

const opts = program.opts();

const COMMON_PARAMS = [
  "admin", "debug", "test", "id", "user", "file", "path", "url", "cmd", "config", "mode", "version", "dev", "true", "false",
  "apiKey", "secret", "token", "userId", "email", "reset", "password", "username", "profile", "settings", "view", "edit",
  "redirect", "dest", "source", "callback", "json", "xml", "format", "lang", "page", "limit", "offset", "sort", "order",
  "filter", "query", "search", "q", "s", "f", "p"
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'param-miner-v2.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  
  // Baseline request
  try {
    const baseline = await axios.get(targetUrl, { timeout: 5000, validateStatus: () => true });
    const baselineLength = JSON.stringify(baseline.data).length;
    console.log(chalk.gray(`[*] Baseline: ${targetUrl} | Status: ${baseline.status} | Size: ${baselineLength}`));
    
    const params = opts.wordlist ? fs.readFileSync(opts.wordlist, 'utf8').split('\n').filter(Boolean) : COMMON_PARAMS;
    console.log(chalk.cyan(`[*] Mining for hidden parameters with ${params.length} words...\n`));
    
    for (const param of params) {
      const testUrl = new URL(targetUrl);
      testUrl.searchParams.set(param, 'webarsenal-fuzz');
      
      const res = await axios.get(testUrl.href, { timeout: 5000, validateStatus: () => true });
      const currentLength = JSON.stringify(res.data).length;
      
      if (res.status === 200 && currentLength !== baselineLength) {
        console.log(chalk.bold.green(`[!] DISCOVERED PARAMETER: ${param} | Status: ${res.status} | Size: ${currentLength}`));
        console.log(chalk.green(`    URL: ${testUrl.href}`));
      } else {
        process.stdout.write(chalk.gray(`.`));
      }
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error in baseline: ${err.message}`));
  }
  
  console.log(chalk.cyan('\n\n[*] Mining complete.'));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
