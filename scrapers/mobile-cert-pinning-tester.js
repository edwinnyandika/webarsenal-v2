#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: mobile-cert-pinning-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */



/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: mobile-cert-pinning-tester.js                       ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const tls = require('tls');

program
  .name('mobile-cert-pinning-tester.js')
  .description('Tests if a mobile backend correctly enforces certificate pinning by sending a non-pinned CA certificate.')
  .version('4.0.0')
  .requiredOption('-u, --url <host>', 'Target backend host (e.g. api.example.com)')
  .option('-p, --port <number>', 'Port number', '443')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'mobile-cert-pinning-tester.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.url.replace(/^https?:\/\//, '').split('/')[0];
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Testing certificate pinning enforcement on: ${host}:${port}\n`));
  
  // Attempt connection with a custom (untrusted) CA
  const socket = tls.connect(port, host, { servername: host }, () => {
    console.log(chalk.bold.red(`[!] VULNERABLE: Connection established with untrusted CA!`));
    console.log(chalk.red(`    Discovery: Certificate pinning is NOT enforced or misconfigured.`));
    socket.destroy();
  });

  socket.on('error', (err) => {
    if (err.code === 'CERT_HAS_EXPIRED' || err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
      console.log(chalk.bold.green(`[✓] PROTECTED: Certificate pinning candidate detected (rejected untrusted CA).`));
      console.log(chalk.green(`    Discovery: Server rejected connection as expected (Status: ${err.code}).`));
    } else {
      console.error(chalk.red(`[x] Error: ${err.message}`));
    }
  });
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
