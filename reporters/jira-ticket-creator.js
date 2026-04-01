#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: jira-ticket-creator.js                               ║
 * ║  Category: reporters                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('jira-ticket-creator.js')
  .description('Automatically creates a Jira security ticket for a given vulnerability.')
  .version('4.0.0')
  .requiredOption('-u, --url <jiraHost>', 'Jira Host URL')
  .requiredOption('-p, --project <key>', 'Jira Project Key')
  .requiredOption('-t, --token <auth>', 'Jira API Token')
  .requiredOption('-s, --summary <text>', 'Ticket summary')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'jira-ticket-creator.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const payload = {
    fields: {
      project: { key: opts.project },
      summary: opts.summary,
      description: 'WebArsenal discovered a potential security vulnerability. Please investigate.',
      issuetype: { name: 'Bug' },
      labels: ['security', 'webarsenal']
    }
  };
  
  console.log(chalk.cyan(`[*] Creating Jira ticket in project: ${opts.project}...`));
  
  try {
    const res = await axios.post(`${opts.url}/rest/api/2/issue`, payload, {
      headers: { 'Authorization': `Basic ${opts.token}`, 'Content-Type': 'application/json' },
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (res.status === 201) {
       console.log(chalk.bold.green(`[✓] Jira ticket created successfully: ${res.data.key}`));
    } else {
       console.log(chalk.yellow(`[-] Jira API returned status: ${res.status}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error creating Jira ticket: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
