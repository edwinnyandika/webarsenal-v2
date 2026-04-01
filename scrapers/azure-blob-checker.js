#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: azure-blob-checker.js                               ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('azure-blob-checker.js')
  .description('Checks for publicly accessible Azure Blob Storage containers.')
  .version('3.0.0')
  .requiredOption('-a, --account <account>', 'Azure Storage Account name')
  .option('-c, --container <container>', 'Container name (default: "public", "assets")')
  .parse(process.argv);

const opts = program.opts();

const COMMON_CONTAINERS = ["public", "assets", "data", "backup", "logs", "scripts"];

async function checkAzure(account, container) {
  const url = `https://${account}.blob.core.windows.net/${container}?restype=container&comp=list`;
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    
    if (res.status === 200) {
      console.log(chalk.bold.green(`[!] PUBLIC AZURE CONTAINER FOUND: ${url}`));
      return true;
    } else if (res.status === 403) {
      return false;
    }
  } catch (e) {}
  return false;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'azure-blob-checker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const containers = opts.container ? [opts.container] : COMMON_CONTAINERS;
  console.log(chalk.cyan(`[*] Auditing Azure account: ${opts.account}\n`));
  
  for (const container of containers) {
    process.stdout.write(chalk.gray(`[*] Checking container: ${container}... `));
    const isPublic = await checkAzure(opts.account, container);
    if (!isPublic) {
      console.log(chalk.red('NOT FOUND/ACCESS DENIED\n'));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
