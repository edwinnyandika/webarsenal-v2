#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: soap-wsdl-parser.js                                 ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');
const cheerio = require('cheerio');

program
  .name('soap-wsdl-parser.js')
  .description('Analyzes SOAP WSDL files for endpoint and method discovery.')
  .version('3.0.0')
  .requiredOption('-u, --url <wsdl>', 'Target WSDL URL (e.g., https://api.example.com/Service?wsdl)')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'soap-wsdl-parser.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = opts.url;
  console.log(chalk.cyan(`[*] Parsing WSDL from: ${targetUrl}\n`));
  
  try {
    const res = await axios.get(targetUrl, { timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200 && res.data.includes('<wsdl:definitions')) {
      console.log(chalk.bold.green(`[✓] VALID WSDL FOUND.`));
      const $ = cheerio.load(res.data, { xmlMode: true });
      
      const methods = $('wsdl\\:operation, operation').map((_, el) => $(el).attr('name')).get();
      const endpoints = $('soap\\:address, address').map((_, el) => $(el).attr('location')).get();
      
      if (methods.length > 0) {
        console.log(chalk.green(`[*] Discovered ${methods.length} methods:`));
        methods.slice(0, 15).forEach(m => console.log(chalk.gray(`     - ${m}`)));
      }
      
      if (endpoints.length > 0) {
        console.log(chalk.green(`[*] Discovered ${endpoints.length} endpoints:`));
        endpoints.forEach(e => console.log(chalk.gray(`     - ${e}`)));
      }
    } else {
      console.log(chalk.red(`[-] Invalid or missing WSDL content. Status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error fetching WSDL: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
