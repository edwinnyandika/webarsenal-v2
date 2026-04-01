#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: api-key-validator.js                                ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('api-key-validator.js')
  .description('Tests found API keys against their respective services to verify if they are active.')
  .version('3.0.0')
  .requiredOption('-k, --key <key>', 'API key to validate')
  .requiredOption('-s, --service <name>', 'Service name (google, aws, github, stripe, slack, twilio, sendgrid)')
  .parse(process.argv);

const opts = program.opts();

const SERVICES = {
  "google": { url: `https://www.googleapis.com/customsearch/v1?key=${opts.key}`, method: 'GET' },
  "aws": { url: 'https://sts.amazonaws.com/?Action=GetCallerIdentity&Version=2011-06-15', method: 'GET', headers: { 'X-Amz-Date': new Date().toISOString() } },
  "github": { url: 'https://api.github.com/user', method: 'GET', headers: { 'Authorization': `token ${opts.key}` } },
  "stripe": { url: 'https://api.stripe.com/v1/charges', method: 'GET', headers: { 'Authorization': `Bearer ${opts.key}` } },
  "slack": { url: `https://slack.com/api/auth.test?token=${opts.key}`, method: 'GET' },
  "sendgrid": { url: 'https://api.sendgrid.com/v3/scopes', method: 'GET', headers: { 'Authorization': `Bearer ${opts.key}` } }
};

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'api-key-validator.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const service = SERVICES[opts.service.toLowerCase()];
  if (!service) {
    console.log(chalk.red(`[x] Service [${opts.service}] not supported yet.`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Validating key for ${opts.service}...\n`));
  
  try {
    const res = await axios({
      method: service.method,
      url: service.url,
      headers: service.headers,
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (res.status === 200) {
      console.log(chalk.bold.green(`\n[✓] KEY IS VALID AND ACTIVE!`));
      console.log(chalk.green(`    Discovery: Response status: ${res.status}`));
      console.log(chalk.green(`    Discovery: Data snippet: ${JSON.stringify(res.data).substring(0, 100)}`));
    } else {
      console.log(chalk.red(`\n[x] Key appears invalid or restricted. Status: ${res.status}`));
      console.log(chalk.gray(`    Error: ${JSON.stringify(res.data || 'No data')}`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error connecting to service: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
