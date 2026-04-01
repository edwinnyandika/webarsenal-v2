#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: ssl-cipher-auditor.js                               ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const tls = require('tls');

program
  .name('ssl-cipher-auditor.js')
  .description('Audits the SSL/TLS configuration of a target for weak ciphers and protocols.')
  .version('3.0.0')
  .requiredOption('-u, --url <host>', 'Target host (e.g., example.com)')
  .option('-p, --port <number>', 'Port number', '443')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'ssl-cipher-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.url.replace(/^https?:\/\//, '').split('/')[0];
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Auditing SSL/TLS for: ${host}:${port}\n`));
  
  const socket = tls.connect(port, host, { servername: host, rejectUnauthorized: false }, () => {
    const cipher = socket.getCipher();
    const protocol = socket.getProtocol();
    
    console.log(chalk.bold.green(`[✓] CONNECTION SUCCESSFUL.`));
    console.log(chalk.green(`    - Cipher: ${cipher.name} (${cipher.version})`));
    console.log(chalk.green(`    - Protocol: ${protocol}`));
    
    // Simple heuristic for weak protocols
    if (protocol === 'TLSv1' || protocol === 'TLSv1.1' || protocol === 'SSLv3') {
       console.log(chalk.bold.red(`[!] WEAK PROTOCOL DETECTED: ${protocol}`));
    }
    
    if (cipher.name.includes('CBC') || cipher.name.includes('RC4') || cipher.name.includes('DES')) {
       console.log(chalk.bold.red(`[!] WEAK CIPHER DETECTED: ${cipher.name}`));
    }
    
    socket.destroy();
  });

  socket.on('error', (err) => {
    console.error(chalk.red(`[x] Error connecting: ${err.message}`));
  });
  
  socket.setTimeout(10000, () => {
    console.log(chalk.red(`[x] Connection timeout.`));
    socket.destroy();
  });
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
