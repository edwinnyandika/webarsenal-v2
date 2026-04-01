#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: open-s3-hunter.js                                  ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const cheerio = require('cheerio');

program
  .name('open-s3-hunter.js')
  .description('Brute-forces and checks for publicly accessible AWS S3 buckets.')
  .version('3.0.0')
  .requiredOption('-b, --bucket <name>', 'Base bucket name to test')
  .option('-w, --wordlist <file>', 'Wordlist for bucket name permutations')
  .parse(process.argv);

const opts = program.opts();

const SUFFIXES = [
  "dev", "prod", "staging", "test", "public", "private", "backup", "archive", "data", "static", "assets", "logs"
];

async function checkBucket(name) {
  const url = `https://${name}.s3.amazonaws.com`;
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    
    if (res.status === 200) {
      console.log(chalk.bold.green(`[!] PUBLIC BUCKET FOUND: ${url}`));
      const $ = cheerio.load(res.data, { xmlMode: true });
      const keys = $('Key').map((_, el) => $(el).text()).get();
      if (keys.length > 0) {
        console.log(chalk.green(`    Discovery: Found ${keys.length} files.`));
        keys.slice(0, 5).forEach(key => console.log(chalk.gray(`     - ${key}`)));
      }
      return true;
    } else if (res.status === 403) {
      // Access Denied - bucket exists but restricted
      return false;
    }
  } catch (e) {}
  return false;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'open-s3-hunter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Testing permutations for bucket: ${opts.bucket}\n`));
  
  await checkBucket(opts.bucket);
  
  for (const suffix of SUFFIXES) {
    const name1 = `${opts.bucket}-${suffix}`;
    const name2 = `${opts.bucket}.${suffix}`;
    process.stdout.write(chalk.gray(`[*] Checking: ${name1}... `));
    await checkBucket(name1) ? null : process.stdout.write(chalk.red('NOT FOUND/ACCESS DENIED\n'));
    process.stdout.write(chalk.gray(`[*] Checking: ${name2}... `));
    await checkBucket(name2) ? null : process.stdout.write(chalk.red('NOT FOUND/ACCESS DENIED\n'));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
