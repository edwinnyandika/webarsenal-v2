#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: hmac-bypass-tester.js                               ║
 * ║  Category: auth-helpers                                         ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('hmac-bypass-tester.js')
  .description('Tests for HMAC signature bypass vulnerabilities by tampering with the payload.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with signature')
  .option('-s, --signature <sig>', 'Signature parameter name', 'sig')
  .parse(process.argv);

const opts = program.opts();

async function testBypass(url) {
  try {
    const res = await axios.get(url, { timeout: 5000, validateStatus: () => true });
    return res.status;
  } catch (e) {
    return 'ERROR';
  }
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'hmac-bypass-tester.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const originalUrl = opts.url;
  const parsedUrl = new URL(originalUrl);
  const signatureParam = opts.signature;
  
  if (!parsedUrl.searchParams.has(signatureParam)) {
    console.log(chalk.red(`[x] Signature parameter [${signatureParam}] not found in URL.`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Original Status Code: ${await testBypass(originalUrl)}`));
  
  const BYPASS_ATTEMPTS = [
    { name: "NULL Signature", modifier: (u) => u.searchParams.set(signatureParam, "") },
    { name: "Missing Signature", modifier: (u) => u.searchParams.delete(signatureParam) },
    { name: "Malformed Signature", modifier: (u) => u.searchParams.set(signatureParam, "invalid") },
    { name: "Double Parameter", modifier: (u) => u.searchParams.append(signatureParam, "duplicate") }
  ];
  
  for (const attempt of BYPASS_ATTEMPTS) {
    const testUrl = new URL(originalUrl);
    attempt.modifier(testUrl);
    process.stdout.write(chalk.gray(`[*] Testing ${attempt.name}: ${testUrl.href.substring(0, 50)}... `));
    
    const status = await testBypass(testUrl.href);
    if (status === 200) {
      console.log(chalk.bold.red(`VULNERABLE (Status 200)`));
    } else {
      console.log(chalk.green(`BLOCKED (Status ${status})`));
    }
  }
  
  console.log(chalk.cyan('\n[*] Tests complete.'));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
