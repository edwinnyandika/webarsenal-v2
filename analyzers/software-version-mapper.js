#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: software-version-mapper.js                          ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('software-version-mapper.js')
  .description('Maps detected software versions to known CVE databases (Simulated).')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'software-version-mapper.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Mapping software versions for: ${targetUrl}\n`));
  
  try {
    const res = await axios.get(targetUrl, { timeout: 5000, validateStatus: () => true });
    const headers = res.headers;
    const server = headers['server'] || 'Unknown';
    
    console.log(chalk.gray(`[*] Detected Server: ${server}`));
    
    // Simple regex to extract version
    const versionMatch = server.match(/[\d.]+/);
    if (versionMatch) {
      const version = versionMatch[0];
      console.log(chalk.cyan(`[*] Extracted Version: ${version}`));
      
      // Simulated CVE lookup
      if (version.startsWith('2.4')) {
        console.log(chalk.yellow(`[!] Note: Apache 2.4.x has multiple known vulnerabilities. Cross-reference with NIST.`));
      } else if (version.startsWith('1.')) {
        console.log(chalk.red(`[!] CRITICAL: Nginx 1.x (Very old) detected. Upgrade recommended.`));
      }
    } else {
      console.log(chalk.yellow(`[-] No version number found in server header.`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error mapping versions: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
