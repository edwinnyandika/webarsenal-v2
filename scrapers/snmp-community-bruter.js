#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: snmp-community-bruter.js                            ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const dgram = require('dgram');

program
  .name('snmp-community-bruter.js')
  .description('Brute-forces SNMP community strings to identify open network management interfaces.')
  .version('4.0.0')
  .requiredOption('-i, --ip <ip>', 'Target IP address')
  .option('-p, --port <number>', 'SNMP port (default 161)', '161')
  .parse(process.argv);

const opts = program.opts();

const COMMUNITY_STRINGS = ['public', 'private', 'admin', 'manager', 'monitor', 'internal'];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'snmp-community-bruter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const ip = opts.ip;
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Brute-forcing SNMP community strings on: ${ip}:${port}\n`));
  
  const socket = dgram.createSocket('udp4');
  
  COMMUNITY_STRINGS.forEach(community => {
    process.stdout.write(chalk.gray(`[*] Testing: ${community}... `));
    
    // Simulate SNMP GET request packet (Simplified)
    const packet = Buffer.from([0x30, 0x26, 0x02, 0x01, 0x01, 0x04, community.length, ...Buffer.from(community), 0xa0, 0x19, 0x02, 0x04, 0x00, 0x00, 0x00, 0x00, 0x02, 0x01, 0x00, 0x02, 0x01, 0x00, 0x30, 0x0b, 0x30, 0x09, 0x06, 0x05, 0x2b, 0x06, 0x01, 0x02, 0x01, 0x05, 0x00]);
    
    socket.send(packet, port, ip, (err) => {
      if (err) console.log(chalk.red('FAIL'));
    });
  });
  
  socket.on('message', (msg, rinfo) => {
    console.log(chalk.bold.red(`[!] SUCCESS: SNMP device replied at ${rinfo.address}!`));
    socket.close();
    process.exit(0);
  });
  
  setTimeout(() => {
    console.log(chalk.yellow(`\n\n[-] No replies received (Simulation/Timeout).`));
    socket.close();
  }, 5000);
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
