#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: cors-misconfig-advanced.js                          ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('cors-misconfig-advanced.js')
  .description('Deep audit for CORS misconfigurations including reflective origins and null origin.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL')
  .parse(process.argv);

const opts = program.opts();

async function testOrigin(url, origin) {
  try {
    const res = await axios.get(url, {
      headers: { 'Origin': origin },
      timeout: 5000,
      validateStatus: () => true
    });
    
    const acao = res.headers['access-control-allow-origin'];
    const acac = res.headers['access-control-allow-credentials'];
    
    if (acao === origin) {
      return { success: true, acao, acac, origin };
    } else if (acao === '*') {
       return { success: true, acao, acac, origin };
    }
  } catch (e) {}
  return { success: false };
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'cors-misconfig-advanced.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  const parsedUrl = new URL(targetUrl);
  
  const TEST_ORIGINS = [
    'https://attacker.com',
    `https://${parsedUrl.hostname}.attacker.com`,
    `https://attacker${parsedUrl.hostname}`,
    'null',
    'https://localhost'
  ];
  
  console.log(chalk.cyan(`[*] Auditing CORS for: ${targetUrl}\n`));
  
  for (const origin of TEST_ORIGINS) {
    process.stdout.write(chalk.gray(`[*] Testing Origin: ${origin}... `));
    const res = await testOrigin(targetUrl, origin);
    
    if (res.success) {
      console.log(chalk.bold.red(`VULNERABLE!`));
      console.log(chalk.red(`    Allowed Origin: ${res.acao}`));
      console.log(chalk.red(`    Credentials Allowed: ${res.acac === 'true' ? 'YES (Critical)' : 'NO'}`));
    } else {
      console.log(chalk.green('REFUSED'));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
