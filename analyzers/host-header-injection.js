#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: host-header-injection.js                            ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('host-header-injection.js')
  .description('Tests for Host Header Injection vulnerabilities by sending malicious Host headers.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'host-header-injection.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  const maliciousHost = 'evil.com';
  
  console.log(chalk.cyan(`[*] Testing Host Header Injection for: ${targetUrl}\n`));
  
  try {
    const res = await axios.get(targetUrl, {
      headers: { 'Host': maliciousHost },
      timeout: 10000,
      validateStatus: () => true
    });
    
    // Check if response contains malicious host or redirects there
    const body = String(res.data);
    const location = res.headers['location'] || '';
    
    if (body.includes(maliciousHost) || location.includes(maliciousHost)) {
      console.log(chalk.bold.red(`[!] VULNERABLE TO HOST HEADER INJECTION!`));
      console.log(chalk.red(`    Discovery: Malicious host '${maliciousHost}' reflected in response.`));
      if (location) console.log(chalk.red(`    Redirect Target: ${location}`));
    } else {
      console.log(chalk.green(`\n[✓] Standard Host header handling. No obvious injection detected.`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error testing Host header: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
