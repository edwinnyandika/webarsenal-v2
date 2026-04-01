#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: s3-bucket-lister.js                                 ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const xml2js = require('xml2js');

program
  .name('s3-bucket-lister.js')
  .description('Lists all public files in an AWS S3 bucket and saves the file list.')
  .version('3.0.0')
  .requiredOption('-b, --bucket <name>', 'S3 bucket name')
  .option('-o, --output <file>', 'Output list to file')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 's3-bucket-lister.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const url = `https://${opts.bucket}.s3.amazonaws.com`;
  console.log(chalk.cyan(`[*] Listing files in bucket: ${opts.bucket}\n`));
  
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(res.data);
    
    if (result.ListBucketResult && result.ListBucketResult.Contents) {
      const files = result.ListBucketResult.Contents.map(item => item.Key[0]);
      console.log(chalk.bold.green(`[✓] Successfully retrieved ${files.length} files.`));
      
      files.slice(0, 20).forEach(file => console.log(chalk.gray(`     - ${file}`)));
      if (files.length > 20) console.log(chalk.gray(`     ... and ${files.length - 20} more.`));
      
      if (opts.output) {
        require('fs').writeFileSync(opts.output, files.join('\n'));
        console.log(chalk.blue(`\n[*] File list saved to: ${opts.output}`));
      }
    } else {
      console.log(chalk.yellow(`[-] Bucket is public but contains no files or listing is restricted.`));
    }
  } catch (err) {
    if (err.response && err.response.status === 403) {
      console.log(chalk.red(`[x] Access Denied: Bucket listing is private.`));
    } else {
      console.error(chalk.red(`[x] Error: ${err.message}`));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
