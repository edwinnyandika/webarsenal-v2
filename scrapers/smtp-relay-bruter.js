#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: smtp-relay-bruter.js                                ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const net = require('net');

program
  .name('smtp-relay-bruter.js')
  .description('Tests an SMTP server for open relay vulnerabilities by attempting to send a test message.')
  .version('4.0.0')
  .requiredOption('-u, --url <host>', 'SMTP server host (e.g. smtp.example.com)')
  .option('-p, --port <number>', 'SMTP port (default 25)', '25')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'smtp-relay-bruter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.url;
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Testing for open SMTP relay on: ${host}:${port}\n`));
  
  const socket = net.createConnection(port, host);
  socket.setTimeout(10000);
  
  socket.on('connect', () => {
    socket.write('HELO relaytest.com\r\n');
    socket.write('MAIL FROM:<test@relaytest.com>\r\n');
    socket.write('RCPT TO:<victim@external-domain.com>\r\n');
    socket.write('QUIT\r\n');
  });
  
  socket.on('data', (data) => {
    const response = data.toString();
    if (response.includes('250') && response.includes('OK')) {
       console.log(chalk.bold.red(`[!] VULNERABLE: Open relay candidate detected!`));
       console.log(chalk.red(`    Response: ${response.trim()}`));
    } else {
       console.log(chalk.green(`[✓] PROTECTED: SMTP server rejected relay attempt.`));
    }
    socket.destroy();
  });
  
  socket.on('error', (err) => {
    console.error(chalk.red(`[x] Error connecting to SMTP: ${err.message}`));
    socket.destroy();
  });
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
