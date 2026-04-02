#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: smtp-relay-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */



/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: smtp-relay-tester.js                                ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const net = require('net');

program
  .name('smtp-relay-tester.js')
  .description('Tests an SMTP server for open relay vulnerabilities.')
  .version('3.0.0')
  .requiredOption('-i, --host <host>', 'SMTP server host')
  .option('-p, --port <number>', 'SMTP server port', '25')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'smtp-relay-tester.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.host;
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Testing SMTP Open Relay on: ${host}:${port}\n`));
  
  const client = new net.Socket();
  client.setTimeout(10000);
  
  client.connect(port, host, () => {
    console.log(chalk.gray(`[*] Connected to ${host}:${port}`));
    client.write('HELO relaytest.com\r\n');
  });
  
  client.on('data', (data) => {
    const res = data.toString();
    console.log(chalk.gray(`[→] ${res.trim()}`));
    
    if (res.startsWith('250')) {
      if (res.includes('HELO')) {
        client.write('MAIL FROM:<test@relaytest.com>\r\n');
      } else if (res.includes('Sender OK')) {
        client.write('RCPT TO:<attacker@external.com>\r\n');
      }
    } else if (res.startsWith('550') || res.includes('Relay denied')) {
      console.log(chalk.green(`\n[✓] Relay Denied. Server seems safe.`));
      client.destroy();
    } else if (res.startsWith('250') && res.includes('Recipient OK')) {
       console.log(chalk.bold.red(`\n[!] VULNERABLE TO OPEN RELAY!`));
       client.destroy();
    }
  });

  client.on('timeout', () => {
    console.log(chalk.red(`[x] Connection timeout.`));
    client.destroy();
  });
  
  client.on('error', (err) => {
    console.log(chalk.red(`[x] Connection error: ${err.message}`));
    client.destroy();
  });
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
