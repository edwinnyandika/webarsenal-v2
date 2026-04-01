#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: oauth-redirect-fuzzer.js                           ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('oauth-redirect-fuzzer.js')
  .description('Fuzzes the redirect_uri parameter in OAuth flows to find open redirects or misconfigurations.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'OAuth authorization URL (e.g., https://auth.example.com/oauth/authorize?...)')
  .parse(process.argv);

const opts = program.opts();

const BYPASS_URIS = [
  "https://attacker.com",
  "https://victim.com.attacker.com",
  "https://attacker.com/victim.com",
  "//attacker.com",
  "https://victim.com%23.attacker.com"
];

async function testRedirect(url, redirectUri) {
  const testUrl = new URL(url);
  testUrl.searchParams.set('redirect_uri', redirectUri);
  try {
    const res = await axios.get(testUrl.href, { maxRedirects: 0, timeout: 5000, validateStatus: () => true });
    
    // Detection logic: Check if location header points to attacker
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      const location = res.headers.location;
      if (location.includes('attacker.com')) {
         return { success: true, location, uri: redirectUri };
      }
    }
  } catch (e) {}
  return { success: false };
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'oauth-redirect-fuzzer.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = new URL(opts.url);
  if (!targetUrl.searchParams.has('redirect_uri')) {
     console.log(chalk.red(`[x] redirect_uri parameter not found in URL.`));
     return;
  }
  
  console.log(chalk.cyan(`[*] Fuzzing OAuth redirect_uri for: ${targetUrl.hostname}\n`));
  
  for (const uri of BYPASS_URIS) {
    process.stdout.write(chalk.gray(`[*] Testing: ${uri}... `));
    const res = await testRedirect(targetUrl.href, uri);
    
    if (res.success) {
      console.log(chalk.bold.red(`VULNERABLE (Redirect to Attacker)`));
      console.log(chalk.red(`    Location: ${res.location}`));
    } else {
      console.log(chalk.green('BLOCKED/NO REDIRECT'));
    }
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
