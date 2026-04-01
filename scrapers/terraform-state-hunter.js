#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: terraform-state-hunter.js                           ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('terraform-state-hunter.js')
  .description('Scans for exposed Terraform state files (.tfstate) which often contain secrets.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL')
  .parse(process.argv);

const opts = program.opts();

const TF_PATHS = [
  "terraform.tfstate", "terraform.tfstate.backup", ".terraform/terraform.tfstate",
  "terraform.tfvars", ".tfstate", "terraform.tfstate.lock.info"
];

async function checkPath(baseUrl, path) {
  const url = new URL(path, baseUrl).toString();
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    
    if (res.status === 200 && (res.data.version || res.data.serial)) {
      console.log(chalk.bold.red(`[!] EXPOSED TERRAFORM STATE FOUND: ${url} [Status: ${res.status}]`));
      console.log(chalk.red(`    Discovery: Data preview: ${JSON.stringify(res.data).substring(0, 100)}...`));
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
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'terraform-state-hunter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const baseUrl = opts.url.endsWith('/') ? opts.url : `${opts.url}/`;
  console.log(chalk.cyan(`[*] Scanning for Terraform state leaks on: ${baseUrl}\n`));
  
  for (const path of TF_PATHS) {
    process.stdout.write(chalk.gray(`[*] Checking: ${path}... `));
    const found = await checkPath(baseUrl, path);
    if (!found) {
      process.stdout.write(chalk.red('NOT FOUND/ACCESS DENIED\n'));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
