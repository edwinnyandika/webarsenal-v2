#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: azure-storage-miner.js                               ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('azure-storage-miner.js')
  .description('Deep scan for Azure Blobs, Tables, and Queues exposure.')
  .version('3.0.0')
  .requiredOption('-a, --account <account>', 'Azure Storage Account name')
  .parse(process.argv);

const opts = program.opts();

async function checkAzureService(account, service, container = '$root') {
  let url;
  if (service === 'blob') url = `https://${account}.blob.core.windows.net/${container}?restype=container&comp=list`;
  else if (service === 'table') url = `https://${account}.table.core.windows.net/Tables`;
  else if (service === 'queue') url = `https://${account}.queue.core.windows.net/`;

  try {
    const res = await axios.get(url, { timeout: 10000, validateStatus: () => true });
    if (res.status === 200) {
      console.log(chalk.bold.green(`[!] PUBLIC AZURE ${service.toUpperCase()} FOUND: ${url}`));
      return true;
    }
  } catch (e) {}
  return false;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'azure-storage-miner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Auditing Azure account services for: ${opts.account}\n`));
  
  const services = ['blob', 'table', 'queue'];
  for (const service of services) {
    process.stdout.write(chalk.gray(`[*] Checking ${service}... `));
    const found = await checkAzureService(opts.account, service);
    if (!found) {
      process.stdout.write(chalk.red('NOT FOUND/ACCESS DENIED\n'));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
