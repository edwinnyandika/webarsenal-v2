#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: jenkins-plugin-scanner.js                           ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('jenkins-plugin-scanner.js')
  .description('Scans a Jenkins instance for installed plugins and their versions via the API.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target Jenkins URL')
  .option('-p, --proxy <url>', 'Use a proxy for the request')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'jenkins-plugin-scanner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const baseUrl = opts.url.endsWith('/') ? opts.url : `${opts.url}/`;
  const url = `${baseUrl}pluginManager/api/json?depth=1`;
  
  console.log(chalk.cyan(`[*] Requesting plugin metadata from: ${url}\n`));
  
  try {
    const res = await axios.get(url, { timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200 && res.data.plugins) {
      const plugins = res.data.plugins;
      console.log(chalk.bold.green(`[✓] Successfully retrieved ${plugins.length} plugins.`));
      
      plugins.slice(0, 20).forEach(p => {
        const hasVulns = p.hasDependenciesWithVulns || p.vulnerabilities?.length > 0;
        const color = hasVulns ? chalk.red : chalk.gray;
        console.log(color(`     - ${p.shortName} (${p.version}) ${hasVulns ? '[VULNERABLE]' : ''}`));
      });
      
    } else if (res.status === 401 || res.status === 403) {
      console.log(chalk.yellow(`[+] Plugin manager access restricted (Status: ${res.status}).`));
    } else {
      console.log(chalk.red(`[-] No plugin data found. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error scanning Jenkins plugins: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
