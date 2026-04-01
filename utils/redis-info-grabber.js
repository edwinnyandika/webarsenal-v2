#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: redis-info-grabber.js                               ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const net = require('net');

program
  .name('redis-info-grabber.js')
  .description('Tests for Redis servers without authentication and attempts to grab server info.')
  .version('3.0.0')
  .requiredOption('-i, --host <host>', 'Redis server host')
  .option('-p, --port <number>', 'Redis server port', '6379')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'redis-info-grabber.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.host;
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Testing Redis on: ${host}:${port}\n`));
  
  const client = new net.Socket();
  client.setTimeout(10000);
  
  client.connect(port, host, () => {
    console.log(chalk.gray(`[*] Connected to ${host}:${port}`));
    client.write('INFO\r\n');
  });
  
  client.on('data', (data) => {
    const res = data.toString();
    if (res.includes('redis_version')) {
      console.log(chalk.bold.green(`\n[!] OPEN REDIS INSTANCE DETECTED!`));
      console.log(chalk.green(`    Discovery: Data preview:`));
      console.log(chalk.gray(res.substring(0, 500)));
      client.destroy();
    } else if (res.includes('NOAUTH') || res.includes('Authentication required')) {
      console.log(chalk.yellow(`\n[✓] Redis requires authentication. Server seems safe.`));
      client.destroy();
    }
  });

  client.on('error', (err) => {
    console.log(chalk.red(`[x] Connection error: ${err.message}`));
    client.destroy();
  });
  
  client.on('timeout', () => {
    console.log(chalk.red(`[x] Connection timeout.`));
    client.destroy();
  });
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
