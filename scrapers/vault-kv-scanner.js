#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: vault-kv-scanner.js                                 ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('vault-kv-scanner.js')
  .description('Scans for publicly accessible HashiCorp Vault KV stores.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target Vault URL (e.g., http://vault.example.com:8200)')
  .parse(process.argv);

const opts = program.opts();

async function checkVault(baseUrl) {
  const url = `${baseUrl}/v1/sys/health`;
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    
    if (res.status === 200 && res.data.initialized) {
      console.log(chalk.bold.green(`[!] HASHICORP VAULT DETECTED: ${baseUrl}`));
      console.log(chalk.green(`    Discovery: Initialized: ${res.data.initialized}, Sealed: ${res.data.sealed}`));
      
      const res2 = await axios.get(`${baseUrl}/v1/secret/metadata/`, { timeout: 5000, validateStatus: () => true });
      if (res2.status === 200) {
        console.log(chalk.bold.red(`    CRITICAL: Unauthenticated metadata listing allowed on /v1/secret/metadata/!`));
      }
      return true;
    } else if (res.status === 403) {
      console.log(chalk.yellow(`[+] Vault exists but restricted: ${baseUrl}`));
      return false;
    }
  } catch (e) {
    console.log(chalk.red(`[x] Error checking vault: ${e.message}`));
  }
  return false;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'vault-kv-scanner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const baseUrl = opts.url.endsWith('/') ? opts.url.slice(0, -1) : opts.url;
  console.log(chalk.cyan(`[*] Auditing HashiCorp Vault: ${baseUrl}\n`));
  await checkVault(baseUrl);
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
