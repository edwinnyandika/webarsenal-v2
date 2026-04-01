#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: cookie-security-mapper.js                           ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('cookie-security-mapper.js')
  .description('Visualizes and audits cookie security attributes (HttpOnly, Secure, SameSite).')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL to audit')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'cookie-security-mapper.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Mapping cookie security for: ${targetUrl}\n`));
  
  try {
    const res = await axios.get(targetUrl, { timeout: 10000, validateStatus: () => true });
    const cookies = res.headers['set-cookie'] || [];
    
    if (cookies.length === 0) {
      console.log(chalk.yellow(`[-] No cookies found in the response headers.`));
      return;
    }
    
    console.log(chalk.cyan(`[→] Audit Detail:`));
    cookies.forEach((cookie, index) => {
      const parts = cookie.split(';').map(p => p.trim());
      const name = parts[0].split('=')[0];
      const attributes = parts.slice(1);
      
      const isHttpOnly = attributes.some(a => a.toLowerCase() === 'httponly');
      const isSecure = attributes.some(a => a.toLowerCase() === 'secure');
      const sameSite = attributes.find(a => a.toLowerCase().startsWith('samesite=')) || 'Missing';
      
      console.log(chalk.bold.white(`\n    [${index + 1}] Cookie: ${name}`));
      console.log(chalk.gray(`        - Full String: ${cookie.substring(0, 50)}...`));
      
      console.log(`${isHttpOnly ? chalk.green('        [✓] HttpOnly') : chalk.red('        [!] Missing HttpOnly')}`);
      console.log(`${isSecure ? chalk.green('        [✓] Secure') : chalk.red('        [!] Missing Secure')}`);
      console.log(`${sameSite !== 'Missing' ? chalk.green('        [✓] ' + sameSite) : chalk.red('        [!] Missing SameSite')}`);
      
      if (!isHttpOnly || !isSecure) {
        console.log(chalk.yellow(`        (Risk: Potential session hijacking/XSS data leak)`));
      }
    });
    
  } catch (err) {
    console.error(chalk.red(`[x] Error mapping cookies: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
