#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: port-scanner-pro.js                                ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const net = require('net');

program
  .name('port-scanner-pro.js')
  .description('High-speed parallel TCP port scanner.')
  .version('3.0.1')
  .requiredOption('-i, --host <host>', 'Target host IP or domain')
  .option('-p, --ports <range>', 'Port range (e.g., 1-1024 or 80,443,8080)', '1-1024')
  .option('-t, --timeout <ms>', 'Connection timeout in ms', '1000')
  .option('-c, --concurrency <number>', 'Number of parallel scans', '100')
  .parse(process.argv);

const opts = program.opts();

function parsePorts(portsStr) {
  if (portsStr.includes('-')) {
    const [start, end] = portsStr.split('-').map(Number);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  return portsStr.split(',').map(Number);
}

function checkPort(host, port, timeout) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve({ port, open: true });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ port, open: false });
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve({ port, open: false });
    });
    
    socket.connect(port, host);
  });
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'port-scanner-pro.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const ports = parsePorts(opts.ports);
  const concurrency = parseInt(opts.concurrency);
  const timeout = parseInt(opts.timeout);
  
  console.log(chalk.cyan(`[*] Scanning ${ports.length} ports on ${opts.host} (Concurrency: ${concurrency})...\n`));
  
  const openPorts = [];
  for (let i = 0; i < ports.length; i += concurrency) {
    const chunk = ports.slice(i, i + concurrency);
    const results = await Promise.all(chunk.map(p => checkPort(opts.host, p, timeout)));
    results.filter(r => r.open).forEach(r => {
      console.log(chalk.bold.green(`[+] Port ${r.port} is OPEN`));
      openPorts.push(r.port);
    });
  }
  
  console.log(chalk.cyan(`\n[*] Scan complete. Found ${openPorts.length} open ports.`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
