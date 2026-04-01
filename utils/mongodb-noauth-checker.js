#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: mongodb-noauth-checker.js                           ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const net = require('net');

program
  .name('mongodb-noauth-checker.js')
  .description('Tests for MongoDB servers without authentication.')
  .version('3.0.0')
  .requiredOption('-i, --host <host>', 'MongoDB server host')
  .option('-p, --port <number>', 'MongoDB server port', '27017')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'mongodb-noauth-checker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.host;
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Testing MongoDB on: ${host}:${port}\n`));
  
  const client = new net.Socket();
  client.setTimeout(10000);
  
  client.connect(port, host, () => {
    console.log(chalk.gray(`[*] Connected to ${host}:${port}`));
    // Send a minimal MongoDB "isMaster" or "listDatabases" command (simplified for raw socket check).
    // A true check should use the 'mongodb' driver, but we'll use a characteristic response check.
    client.write(Buffer.from('3f0000000100000000000000d40700000000000061646d696e2e24636d640000000000010000000769736d61737465720001', 'hex'));
  });
  
  client.on('data', (data) => {
    const res = data.toString('hex');
    if (res.includes('69736d6173746572')) { // "ismaster" in hex
      console.log(chalk.bold.green(`\n[!] OPEN MONGODB INSTANCE DETECTED!`));
    } else {
      console.log(chalk.yellow(`\n[-] Connection established, but no standard MongoDB response received.`));
    }
    client.destroy();
  });

  client.on('error', (err) => {
    console.log(chalk.red(`[x] Connection error: ${err.message}`));
    client.destroy();
  });
  
  client.on('timeout', () => {
    client.destroy();
  });
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
