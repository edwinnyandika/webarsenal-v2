#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: mobile-plist-auditor.js                             ║
 * ║  Category: scrapers                                             ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const plist = require('plist');

program
  .name('mobile-plist-auditor.js')
  .description('Audits iOS Info.plist files for hardcoded API keys, sensitive permissions, and internal URLs.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to Info.plist file')
  .parse(process.argv);

const opts = program.opts();

const SENSITIVE_KEYS = [
  'NSAppTransportSecurity', 'NSCameraUsageDescription', 'NSLocationWhenInUseUsageDescription',
  'API_KEY', 'SECRET_KEY', 'AWS_ACCESS_KEY', 'STRIPE_KEY'
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'mobile-plist-auditor.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing iOS Plist file: ${opts.file}\n`));
  
  try {
    const content = fs.readFileSync(opts.file, 'utf8');
    const data = plist.parse(content);
    
    console.log(chalk.bold.green(`[✓] PLIST PARSED SUCCESSFULLY.`));
    
    // Check for sensitive keys
    SENSITIVE_KEYS.forEach(key => {
      if (data[key]) {
        console.log(chalk.bold.red(`    [!] FINDING: ${key} is present.`));
        console.log(chalk.gray(`        Value: ${JSON.stringify(data[key]).substring(0, 50)}...`));
      }
    });
    
    // Check for App Transport Security (Allow Arbitrary Loads)
    if (data.NSAppTransportSecurity && data.NSAppTransportSecurity.NSAllowsArbitraryLoads) {
       console.log(chalk.bold.red(`    [!] CRITICAL: NSAllowsArbitraryLoads is TRUE. (SSL/TLS bypassed)`));
    }
    
    // Scan values for URLs
    const flatValues = JSON.stringify(data);
    const urls = flatValues.match(/https?:\/\/[^\s"']+/g) || [];
    if (urls.length > 0) {
      console.log(chalk.yellow(`\n[*] EXTRACTED URLs (${urls.length}):`));
      [...new Set(urls)].forEach(u => console.log(chalk.gray(`     - ${u}`)));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error parsing Plist: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
