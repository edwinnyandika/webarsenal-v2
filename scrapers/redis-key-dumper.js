#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: redis-key-dumper.js                                 ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const net = require('net');

program
  .name('redis-key-dumper.js')
  .description('Identifies and dumps keys from an unauthenticated Redis instance.')
  .version('4.0.0')
  .requiredOption('-u, --url <host>', 'Redis host IP/hostname')
  .option('-p, --port <number>', 'Redis port (default 6379)', '6379')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'redis-key-dumper.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.url;
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Testing Redis authentication and key dumping on: ${host}:${port}\n`));
  
  const client = net.createConnection(port, host);
  client.setTimeout(5000);
  
  client.on('connect', () => {
    console.log(chalk.bold.green(`[✓] CONNECTED.`));
    // Test if AUTH is required
    client.write('INFO\r\n');
  });
  
  client.on('data', (data) => {
    const response = data.toString();
    if (response.includes('redis_version')) {
       console.log(chalk.bold.red(`[!] VULNERABLE: NO AUTH REQUIRED!`));
       console.log(chalk.red(`    Attempting to list keys (limit 10)...`));
       client.write('KEYS *\r\n');
    } else if (response.includes('NOAUTH')) {
       console.log(chalk.green(`[✓] PROTECTED: Redis requires authentication.`));
       client.destroy();
    } else {
       console.log(chalk.gray(`[→] Data Received:`));
       console.log(chalk.gray(response.substring(0, 300)));
       client.destroy();
    }
  });

  client.on('error', (err) => {
    console.error(chalk.red(`[x] Error connecting: ${err.message}`));
    client.destroy();
  });
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
