#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: cidr-expander.js                                   ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const ipaddr = require('ipaddr.js');

program
  .name('cidr-expander.js')
  .description('Expands CIDR ranges to individual IP addresses.')
  .version('3.0.0')
  .requiredOption('-c, --cidr <range>', 'CIDR range (e.g., 192.168.1.0/24)')
  .option('-o, --output <file>', 'Output file for IP list')
  .parse(process.argv);

const opts = program.opts();

function expandCIDR(cidr) {
  const [range, bits] = cidr.split('/');
  const addr = ipaddr.parse(range);
  const mask = parseInt(bits);
  
  if (addr.kind() !== 'ipv4') throw new Error('Only IPv4 is supported currently.');
  
  const start = addr.toByteArray();
  const end = [...start];
  const numAddrs = Math.pow(2, 32 - mask);
  
  const results = [];
  let current = addr.toIPv4Address();
  
  for (let i = 0; i < numAddrs; i++) {
    results.push(current.toString());
    const bytes = current.toByteArray();
    for (let j = 3; j >= 0; j--) {
      bytes[j]++;
      if (bytes[j] < 256) break;
      bytes[j] = 0;
    }
    current = new ipaddr.IPv4(bytes);
  }
  
  return results;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'cidr-expander.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Expanding CIDR: ${opts.cidr}`));
  
  try {
    const ips = expandCIDR(opts.cidr);
    console.log(chalk.green(`[✓] Expanded to ${ips.length} IP(s).`));
    
    if (ips.length <= 10) {
      ips.forEach(ip => console.log(chalk.white(` - ${ip}`)));
    } else {
      ips.slice(0, 10).forEach(ip => console.log(chalk.white(` - ${ip}`)));
      console.log(chalk.gray(` ... and ${ips.length - 10} more.`));
    }
    
    if (opts.output) {
      require('fs').writeFileSync(opts.output, ips.join('\n'));
      console.log(chalk.cyan(`\n[*] IP list saved to: ${opts.output}`));
    }
  } catch (err) {
    console.error(chalk.red('\n[x] Execution Failed:'), err.message);
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
