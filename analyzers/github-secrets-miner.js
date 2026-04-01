#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: github-secrets-miner.js                             ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('github-secrets-miner.js')
  .description('Scans for exposed .git/config, .env, and other sensitive files on a target.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL')
  .parse(process.argv);

const opts = program.opts();

const SECRET_PATHS = [
  ".git/config", ".env", ".env.local", ".env.production", ".env.example", ".git/HEAD",
  "config/database.yml", "wp-config.php", "config.json", ".ssh/id_rsa", ".ssh/config",
  ".aws/credentials", ".docker/config.json", "npm-debug.log", "yarn-error.log"
];

async function checkPath(baseUrl, path) {
  const url = new URL(path, baseUrl).toString();
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    
    if (res.status === 200) {
      console.log(chalk.bold.red(`[!] SENSITIVE FILE FOUND: ${url} [Status: ${res.status}]`));
      if (res.data && String(res.data).length > 20) {
        console.log(chalk.red(`    Discovery: Data preview: ${String(res.data).substring(0, 100).replace(/\n/g, ' ')}...`));
      }
      return true;
    } else if (res.status === 403) {
      console.log(chalk.yellow(`[+] Forbidden path (exists?): ${url}`));
      return false;
    }
  } catch (e) {}
  return false;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'github-secrets-miner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const baseUrl = opts.url.endsWith('/') ? opts.url : `${opts.url}/`;
  console.log(chalk.cyan(`[*] Mining for secrets on: ${baseUrl}\n`));
  
  for (const path of SECRET_PATHS) {
    process.stdout.write(chalk.gray(`[*] Checking: ${path}... `));
    const found = await checkPath(baseUrl, path);
    if (!found) {
      process.stdout.write(chalk.red('NOT FOUND/ACCESS DENIED\n'));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
