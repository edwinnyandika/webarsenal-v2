#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: discord-webhook-notifier.js                          ║
 * ║  Category: reporters                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('discord-webhook-notifier.js')
  .description('Sends a security alert embed to a Discord channel via Webhook.')
  .version('4.0.0')
  .requiredOption('-w, --webhook <url>', 'Discord Webhook URL')
  .requiredOption('-m, --message <text>', 'Alert message to send')
  .option('-s, --severity <level>', 'Severity (info, warn, error)', 'info')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'discord-webhook-notifier.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const color = opts.severity === 'error' ? 15158528 : (opts.severity === 'warn' ? 16776960 : 3447003);
  
  const payload = {
    embeds: [
      {
        title: `WebArsenal Alert: ${opts.severity.toUpperCase()}`,
        description: opts.message,
        color: color,
        footer: { text: 'WebArsenal Security Toolkit' },
        timestamp: new Date().toISOString()
      }
    ]
  };
  
  console.log(chalk.cyan(`[*] Sending notification to Discord...`));
  
  try {
    const res = await axios.post(opts.webhook, payload, { timeout: 10000, validateStatus: () => true });
    
    if (res.status === 204) {
       console.log(chalk.bold.green(`[✓] Discord notification sent successfully.`));
    } else {
       console.log(chalk.yellow(`[-] Discord API returned status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error sending Discord notification: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
