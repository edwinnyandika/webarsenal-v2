#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: tftp-scanner.js                                     ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const dgram = require('dgram');

program
  .name('tftp-scanner.js')
  .description('Tests for TFTP servers and attempts to retrieve common config files.')
  .version('3.0.0')
  .requiredOption('-i, --host <host>', 'TFTP server host')
  .option('-p, --port <number>', 'TFTP server port', '69')
  .parse(process.argv);

const opts = program.opts();

const COMMON_CONFIGS = ["config", "running-config", "startup-config", "boot.ini", "vxworks", "cisco-config"];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'tftp-scanner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.host;
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Testing TFTP on: ${host}:${port}\n`));
  
  for (const filename of COMMON_CONFIGS) {
    const client = dgram.createSocket('udp4');
    const readReq = Buffer.concat([
      Buffer.from([0, 1]), // Opcode: Read Request
      Buffer.from(filename, 'ascii'),
      Buffer.from([0]),
      Buffer.from('octet', 'ascii'),
      Buffer.from([0])
    ]);
    
    process.stdout.write(chalk.gray(`[*] Attempting to fetch: ${filename}... `));
    
    client.send(readReq, port, host, (err) => {
      if (err) {
        console.log(chalk.red(`[x] Error: ${err.message}`));
        client.close();
      }
    });

    client.on('message', (msg, rinfo) => {
      if (msg[1] === 3) { // Opcode: Data
        console.log(chalk.bold.green(`VULNERABLE (File Found!)`));
        client.close();
      } else if (msg[1] === 5) { // Opcode: Error
        console.log(chalk.red(`NOT FOUND/ACCESS DENIED`));
        client.close();
      }
    });
    
    setTimeout(() => { if (!client._closed) { client.close(); console.log(chalk.yellow('TIMEOUT')); } }, 3000);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(chalk.cyan('\n[*] Scan complete.'));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
