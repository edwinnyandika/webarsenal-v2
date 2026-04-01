#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: slack-notification-hook.js                            ║
 * ║  Category: reporters                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('slack-notification-hook.js')
  .description('Sends a formatted security alert to a Slack channel via a Webhook URL.')
  .version('4.0.0')
  .requiredOption('-w, --webhook <url>', 'Slack Webhook URL')
  .requiredOption('-m, --message <text>', 'Alert message to send')
  .option('-s, --severity <level>', 'Severity (info, warn, error)', 'info')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'slack-notification-hook.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const color = opts.severity === 'error' ? '#FF0000' : (opts.severity === 'warn' ? '#FFA500' : '#0000FF');
  
  const payload = {
    attachments: [
      {
        fallback: `WebArsenal Alert: ${opts.message}`,
        color: color,
        title: `WebArsenal Security Status: ${opts.severity.toUpperCase()}`,
        text: opts.message,
        footer: 'WebArsenal Security Toolkit'
      }
    ]
  };
  
  console.log(chalk.cyan(`[*] Sending notification to Slack...`));
  
  try {
    const res = await axios.post(opts.webhook, payload, { timeout: 10000, validateStatus: () => true });
    
    if (res.status === 200) {
       console.log(chalk.bold.green(`[✓] Slack notification sent successfully.`));
    } else {
       console.log(chalk.yellow(`[-] Slack API returned status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error sending Slack notification: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
