#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: port-info-grabber.js                                ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const net = require('net');

program
  .name('port-info-grabber.js')
  .description('Connects to a port and grabs the banner/info to identify services.')
  .version('3.0.0')
  .requiredOption('-i, --ip <ip>', 'IP address to target')
  .requiredOption('-p, --port <number>', 'Port to grab info from')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'port-info-grabber.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const ip = opts.ip;
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Grabbing information from: ${ip}:${port}\n`));
  
  const client = new net.Socket();
  client.setTimeout(5000);
  
  client.connect(port, ip, () => {
    console.log(chalk.green(`[✓] CONNECTED.`));
    // Some services wait for input, some send banner immediately
    client.write('HEAD / HTTP/1.0\r\n\r\n'); 
  });
  
  client.on('data', (data) => {
    console.log(chalk.bold.white(`[→] INFORMATION RECEIVED:`));
    console.log(chalk.gray(data.toString().substring(0, 500)));
    client.destroy();
  });
  
  client.on('error', (err) => {
    console.log(chalk.red(`[x] Error: ${err.message}`));
    client.destroy();
  });
  
  client.on('timeout', () => {
    console.log(chalk.yellow(`[-] No banner sent (Timeout).`));
    client.destroy();
  });
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
