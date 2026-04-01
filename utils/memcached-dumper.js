#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: memcached-dumper.js                                 ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const net = require('net');

program
  .name('memcached-dumper.js')
  .description('Checks for publicly accessible Memcached servers and attempts to dump slab stats.')
  .version('3.0.0')
  .requiredOption('-i, --host <host>', 'Memcached server host')
  .option('-p, --port <number>', 'Memcached server port', '11211')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'memcached-dumper.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.host;
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Auditing Memcached on: ${host}:${port}\n`));
  
  const client = new net.Socket();
  client.setTimeout(10000);
  
  client.connect(port, host, () => {
    console.log(chalk.gray(`[*] Connected to ${host}:${port}`));
    client.write('stats items\r\n');
  });
  
  client.on('data', (data) => {
    const res = data.toString();
    if (res.includes('STAT items')) {
      console.log(chalk.bold.green(`\n[!] OPEN MEMCACHED SERVICE DETECTED!`));
      console.log(chalk.green(`    Discovery: Stats data preview:`));
      console.log(chalk.gray(res.substring(0, 500)));
      client.destroy();
    } else {
      console.log(chalk.yellow(`\n[-] Connection established, but no STAT response received.`));
      client.destroy();
    }
  });

  client.on('error', (err) => {
    console.log(chalk.red(`[x] Error checking node: ${err.message}`));
    client.destroy();
  });
  
  client.on('timeout', () => {
    client.destroy();
  });
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
