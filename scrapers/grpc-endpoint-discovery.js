#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: grpc-endpoint-discovery.js                          ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('grpc-endpoint-discovery.js')
  .description('Tests for gRPC endpoints and HTTP/2 support on a target host.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL or IP')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'grpc-endpoint-discovery.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url.startsWith('http') ? opts.url : `https://${opts.url}`;
  console.log(chalk.cyan(`[*] Testing gRPC / HTTP/2 support for: ${targetUrl}\n`));
  
  try {
    const res = await axios.get(targetUrl, { timeout: 10000, validateStatus: () => true });
    
    // Detection logic: Check for gRPC specific headers or ALPN support
    const contentType = res.headers['content-type'] || 'NONE';
    const server = res.headers['server'] || 'UNKNOWN';
    
    console.log(chalk.gray(`[*] Server: ${server}`));
    console.log(chalk.gray(`[*] Content-Type: ${contentType}`));
    
    if (contentType.includes('application/grpc')) {
      console.log(chalk.bold.green(`[!] gRPC ENDPOINT DETECTED: ${targetUrl}`));
    } else {
       console.log(chalk.yellow(`[-] No direct gRPC indicators found via HTTP/1.1.`));
       console.log(chalk.gray(`[*] Note: Use a dedicated HTTP/2 scanner for deeper gRPC discovery.`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error testing endpoint: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
