#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: docker-registry-scanner.js                          ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('docker-registry-scanner.js')
  .description('Scans for publicly accessible Docker Registries.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target Docker Registry URL (e.g., https://registry.example.com)')
  .parse(process.argv);

const opts = program.opts();

async function checkRegistry(baseUrl) {
  const url = `${baseUrl}/v2/_catalog`;
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    
    if (res.status === 200) {
      console.log(chalk.bold.green(`[!] OPEN DOCKER REGISTRY FOUND: ${url}`));
      const repositories = res.data.repositories || [];
      if (repositories.length > 0) {
        console.log(chalk.green(`    Discovery: Found ${repositories.length} repositories:`));
        repositories.slice(0, 10).forEach(repo => console.log(chalk.gray(`     - ${repo}`)));
      }
      return true;
    } else if (res.status === 401 || res.status === 403) {
      console.log(chalk.yellow(`[+] Registry requires authentication: ${url}`));
      return false;
    }
  } catch (e) {
    console.log(chalk.red(`[x] Error checking registry: ${e.message}`));
  }
  return false;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'docker-registry-scanner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const baseUrl = opts.url.endsWith('/') ? opts.url.slice(0, -1) : opts.url;
  console.log(chalk.cyan(`[*] Auditing Docker Registry: ${baseUrl}\n`));
  await checkRegistry(baseUrl);
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
