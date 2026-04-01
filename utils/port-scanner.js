#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: port-scanner.js                                    ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const net = require('net');

program
  .name('port-scanner.js')
  .description('Lightweight port scanner for common web ports.')
  .version('3.0.0')
  .requiredOption('-u, --url <host>', 'Target host or IP')
  .option('-p, --ports <ports>', 'Comma-separated ports to scan', '80,443,8080,8443,3000,5000,9000')
  .parse(process.argv);

const opts = program.opts();

async function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'port-scanner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.url.startsWith('http') ? new URL(opts.url).hostname : opts.url;
  const ports = opts.ports.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
  
  console.log(chalk.cyan(`[*] Scanning ${host} for ${ports.length} ports...\n`));
  
  const results = [];
  for (const port of ports) {
    process.stdout.write(chalk.gray(`[*] Checking Port: ${String(port).padEnd(5)} `));
    const isOpen = await checkPort(host, port);
    if (isOpen) {
      console.log(chalk.bold.green('OPEN'));
      results.push(port);
    } else {
      console.log(chalk.red('CLOSED'));
    }
  }
  
  if (results.length > 0) {
    console.log(chalk.bold.green(`\n[✓] Found ${results.length} open port(s): ${results.join(', ')}`));
  } else {
    console.log(chalk.yellow('\n[!] No open ports discovered from list.'));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
