#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: gcp-bucket-hunter.js                               ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('gcp-bucket-hunter.js')
  .description('Checks for publicly accessible Google Cloud Storage (GCP) buckets.')
  .version('3.0.0')
  .requiredOption('-b, --bucket <name>', 'Base bucket name to test')
  .parse(process.argv);

const opts = program.opts();

async function checkGCP(name) {
  const url = `https://storage.googleapis.com/${name}`;
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    
    if (res.status === 200) {
      console.log(chalk.bold.green(`[!] PUBLIC GCP BUCKET FOUND: ${url}`));
      if (res.data && res.data.includes('<Contents>')) {
        console.log(chalk.green(`    Discovery: Bucket indexing is enabled.`));
      }
      return true;
    } else if (res.status === 403) {
      return false;
    }
  } catch (e) {}
  return false;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'gcp-bucket-hunter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Auditing GCP bucket: ${opts.bucket}\n`));
  await checkGCP(opts.bucket);
  
  const commonSuffixes = ["-dev", "-prod", "-backup", "-static", "-assets"];
  for (const suffix of commonSuffixes) {
    const name = `${opts.bucket}${suffix}`;
    process.stdout.write(chalk.gray(`[*] Checking: ${name}... `));
    const isPublic = await checkGCP(name);
    if (!isPublic) {
      process.stdout.write(chalk.red('NOT FOUND/ACCESS DENIED\n'));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
