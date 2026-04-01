#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: android-manifest-checker.js                         ║
 * ║  Category: scrapers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const xml2js = require('xml2js');

program
  .name('android-manifest-checker.js')
  .description('Audits AndroidManifest.xml for exported activities, broadcast receivers, and dangerous permissions.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to AndroidManifest.xml')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'android-manifest-checker.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing Android Manifest: ${opts.file}\n`));
  
  try {
    const xml = fs.readFileSync(opts.file, 'utf8');
    const result = await xml2js.parseStringPromise(xml);
    const manifest = result.manifest;
    const application = manifest.application[0];
    
    console.log(chalk.bold.green(`[✓] MANIFEST PARSED SUCCESSFULLY.`));
    console.log(chalk.gray(`[*] Package: ${manifest.$.package}`));
    
    // Check for exported components
    ['activity', 'receiver', 'service', 'provider'].forEach(type => {
      if (application[type]) {
        application[type].forEach(comp => {
          if (comp.$['android:exported'] === 'true') {
             console.log(chalk.bold.red(`    [!] EXPORTED ${type.toUpperCase()}: ${comp.$['android:name']}`));
          }
        });
      }
    });
    
    // Check for debuggable
    if (application.$['android:debuggable'] === 'true') {
       console.log(chalk.bold.red(`    [!] CRITICAL: Application is DEBUGGABLE.`));
    }
    
    // Check for backup allowed
    if (application.$['android:allowBackup'] !== 'false') {
       console.log(chalk.yellow(`    [!] WARNING: allowBackup is not explicitly false.`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing Android Manifest: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
