#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: snmp-walker.js                                      ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const dgram = require('dgram');

program
  .name('snmp-walker.js')
  .description('Tests for SNMP services and attempts to walk common OIDs using the "public" community string.')
  .version('3.0.0')
  .requiredOption('-i, --host <host>', 'SNMP server host')
  .option('-p, --port <number>', 'SNMP server port', '161')
  .option('-c, --community <name>', 'Community string', 'public')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'snmp-walker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.host;
  const port = parseInt(opts.port);
  const community = opts.community;
  
  console.log(chalk.cyan(`[*] Testing SNMP (v1/v2c) on: ${host}:${port} [Community: ${community}]\n`));
  
  const client = dgram.createSocket('udp4');
  client.setTimeout(5000);
  
  // Minimal SNMP GetRequest for sysDescr (.1.3.6.1.2.1.1.1.0)
  const snmpGet = Buffer.concat([
    Buffer.from([0x30, 0x24]), // Sequence
    Buffer.from([0x02, 0x01, 0x00]), // Version (v1)
    Buffer.concat([
      Buffer.from([0x04]), Buffer.from([community.length]), Buffer.from(community, 'ascii') // Community string
    ]),
    Buffer.from([0xa0, 0x19]), // GetRequest
    Buffer.from([0x02, 0x04, 0x00, 0x00, 0x00, 0x01]), // Request ID
    Buffer.from([0x02, 0x01, 0x00]), // Error Status
    Buffer.from([0x02, 0x01, 0x00]), // Error Index
    Buffer.from([0x30, 0x0b, 0x30, 0x09, 0x06, 0x08, 0x2b, 0x06, 0x01, 0x02, 0x01, 0x01, 0x01, 0x00, 0x05, 0x00]) // sysDescr OID
  ]);
  
  client.send(snmpGet, port, host, (err) => {
    if (err) {
      console.log(chalk.red(`[x] Error: ${err.message}`));
      client.close();
    }
  });

  client.on('message', (msg, rinfo) => {
    console.log(chalk.bold.green(`[!] SNMP SERVICE DETECTED AND ACCESSIBLE!`));
    console.log(chalk.green(`    Discovery: Response from ${rinfo.address}:${rinfo.port}`));
    client.close();
  });
  
  setTimeout(() => { if (!client._closed) { client.close(); console.log(chalk.yellow('[-] No response or timeout.')); } }, 3000);
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
