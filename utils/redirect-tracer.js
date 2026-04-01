#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: redirect-tracer.js                                 ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('redirect-tracer.js')
  .description('Follows all redirects from a target and flags open redirects.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Start URL')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'redirect-tracer.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  let currentUrl = opts.url.startsWith('http') ? opts.url : `https://${opts.url}`;
  console.log(chalk.cyan(`[*] Tracing redirects for: ${currentUrl}\n`));
  
  let hop = 0;
  const chain = [];
  
  while (hop < 10) {
    hop++;
    process.stdout.write(chalk.gray(` [Hop ${hop}] Checking: ${currentUrl.substring(0, 50)}... `));
    
    try {
      const res = await axios.get(currentUrl, { 
        maxRedirects: 0, 
        validateStatus: (status) => status >= 200 && status < 400 
      });
      
      chain.push({ url: currentUrl, status: res.status });
      
      if (res.status >= 300 && res.status < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, currentUrl).toString();
        console.log(chalk.yellow(`${res.status} → ${new URL(nextUrl).hostname}`));
        currentUrl = nextUrl;
      } else {
        console.log(chalk.green(`${res.status} (Final)`));
        break;
      }
    } catch (err) {
      console.log(chalk.red(`ERROR: ${err.message}`));
      break;
    }
  }
  
  if (chain.length > 1) {
    console.log(chalk.bold.cyan(`\n[*] Redirect Chain Summary:`));
    chain.forEach((c, i) => console.log(chalk.white(`  ${i + 1}. [${c.status}] ${c.url}`)));
    
    const finalUrl = chain[chain.length - 1].url;
    const startHost = new URL(opts.url.startsWith('http') ? opts.url : `https://${opts.url}`).hostname;
    const finalHost = new URL(finalUrl).hostname;
    
    if (startHost !== finalHost && !finalHost.endsWith(startHost.split('.').slice(-2).join('.'))) {
       console.log(chalk.bold.red(`\n[!] POTENTIAL OPEN REDIRECT: Redirected off-domain to ${finalHost}`));
    }
  } else {
    console.log(chalk.green('\n[✓] No redirects detected.'));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
