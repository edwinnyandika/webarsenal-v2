#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: nmap-xml-parser.js                                  ║
 * ║  Category: utils                                                ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const xml2js = require('xml2js');

program
  .name('nmap-xml-parser.js')
  .description('Converts Nmap XML output to WebArsenal standard JSON format.')
  .version('3.0.0')
  .requiredOption('-f, --file <path>', 'Nmap XML file to parse')
  .option('-o, --output <file>', 'Output JSON file')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'nmap-xml-parser.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  const content = fs.readFileSync(opts.file, 'utf8');
  const parser = new xml2js.Parser();
  
  try {
    const result = await parser.parseStringPromise(content);
    const hosts = result.nmaprun.host || [];
    
    const parsedData = hosts.map(h => {
      const ports = (h.ports[0].port || []).map(p => ({
        portid: p.$.portid,
        protocol: p.$.protocol,
        state: p.state[0].$.state,
        service: p.service ? p.service[0].$.name : 'unknown'
      }));
      
      return {
        address: h.address[0].$.addr,
        status: h.status[0].$.state,
        ports: ports
      };
    });
    
    console.log(chalk.bold.green(`[✓] SUCCESS: Parsed ${hosts.length} hosts.`));
    parsedData.forEach(h => {
      console.log(chalk.green(`    - Host: ${h.address} (${h.ports.length} ports)`));
    });
    
    if (opts.output) {
      fs.writeFileSync(opts.output, JSON.stringify(parsedData, null, 2));
      console.log(chalk.blue(`\n[*] Saved results to: ${opts.output}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error parsing Nmap XML: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
