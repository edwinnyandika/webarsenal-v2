#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: cookie-attribute-auditor.js                         ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('cookie-attribute-auditor.js')
  .description('Analyzes cookies for security attributes (HttpOnly, Secure, SameSite).')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL to check')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'cookie-attribute-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url.startsWith('http') ? opts.url : `https://${opts.url}`;
  console.log(chalk.cyan(`[*] Auditing cookies for: ${targetUrl}\n`));
  
  try {
    const res = await axios.get(targetUrl, { timeout: 10000, validateStatus: () => true });
    const cookies = res.headers['set-cookie'] || [];
    
    if (cookies.length === 0) {
      console.log(chalk.yellow('[!] No cookies found in the response.'));
      return;
    }
    
    console.log(chalk.cyan(`[*] Found ${cookies.length} cookie(s). Analyzing attributes...\n`));
    
    cookies.forEach((cookie, index) => {
      console.log(chalk.bold.white(`[${index + 1}] Cookie: ${cookie.split(';')[0]}`));
      
      const isHttpOnly = /httponly/i.test(cookie);
      const isSecure = /secure/i.test(cookie);
      const isSameSite = /samesite/i.test(cookie);
      
      const httpOnlyStatus = isHttpOnly ? chalk.green('YES') : chalk.red('NO (Vulnerable)');
      const secureStatus = isSecure ? chalk.green('YES') : chalk.red('NO (Vulnerable)');
      const sameSiteStatus = isSameSite ? chalk.green('YES') : chalk.yellow('NOT SET');
      
      console.log(chalk.gray(`    - HttpOnly:   ${httpOnlyStatus}`));
      console.log(chalk.gray(`    - Secure:     ${secureStatus}`));
      console.log(chalk.gray(`    - SameSite:   ${sameSiteStatus}`));
      
      if (!isHttpOnly) console.log(chalk.red(`    [!] SECURITY RISK: Cookie can be accessed via JavaScript.`));
      if (!isSecure && targetUrl.startsWith('https')) console.log(chalk.red(`    [!] SECURITY RISK: Cookie can be transmitted over unencrypted connection.`));
    });
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing cookies: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
