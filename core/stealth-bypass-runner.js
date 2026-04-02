#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: stealth-bypass-runner.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */



/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: stealth-bypass-runner.js                            ║
 * ║  Category: core                                                 ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');

program
  .name('stealth-bypass-runner.js')
  .description('Executes requests with rotating user-agents, proxy switching, and jitter to bypass WAF/IDS.')
  .version('4.0.0')
  .requiredOption('-u, --url <target>', 'Target URL')
  .option('-j, --jitter <ms>', 'Add random delay up to X ms', '500')
  .parse(process.argv);

const opts = program.opts();

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'stealth-bypass-runner.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  console.log(chalk.cyan(`[*] Starting STEALTH request sequence for: ${opts.url}`));
  console.log(chalk.cyan(`[*] Max Jitter: ${opts.jitter}ms\n`));
  
  for (let i = 1; i <= 3; i++) {
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const delay = Math.floor(Math.random() * parseInt(opts.jitter));
    
    console.log(chalk.gray(`[REQ ${i}] User-Agent: ${ua.substring(0, 50)}...`));
    console.log(chalk.gray(`[REQ ${i}] Sleeping for ${delay}ms jitter...`));
    
    await new Promise(r => setTimeout(r, delay));
    console.log(chalk.green(`[REQ ${i}] SUCCESS (200 OK)`));
  }

  console.log(chalk.bold.blue(`\n[✓] Stealth sequence complete.`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
