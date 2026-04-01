#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: memcached-item-sniffer.js                           ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const net = require('net');

program
  .name('memcached-item-sniffer.js')
  .description('Identifies and dumps slab items from an unprotected Memcached instance.')
  .version('4.0.0')
  .requiredOption('-u, --url <host>', 'Memcached host IP/hostname')
  .option('-p, --port <number>', 'Memcached port (default 11211)', '11211')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'memcached-item-sniffer.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.url;
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Sniffing Memcached items on: ${host}:${port}\n`));
  
  const client = net.createConnection(port, host);
  client.setTimeout(5000);
  
  client.on('connect', () => {
    console.log(chalk.bold.green(`[✓] CONNECTED.`));
    client.write('stats items\r\n');
  });
  
  client.on('data', (data) => {
    const response = data.toString();
    if (response.includes('STAT items:')) {
       console.log(chalk.bold.red(`[!] VULNERABLE: UNPROTECTED MEMCACHED ACCESS!`));
       console.log(chalk.gray(`    (Discovery: Items list extracted)`));
       console.log(chalk.gray(response.substring(0, 300)));
    } else {
       console.log(chalk.green(`[✓] Connection closed (Protected or empty).`));
    }
    client.destroy();
  });

  client.on('error', (err) => {
    console.error(chalk.red(`[x] Error: ${err.message}`));
    client.destroy();
  });
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
