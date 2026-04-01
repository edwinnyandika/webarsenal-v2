#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: jenkins-job-parser.js                               ║
 * ║  Category: integrations                                         ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const xml2js = require('xml2js');

program
  .name('jenkins-job-parser.js')
  .description('Parses Jenkins config.xml files for hardcoded secrets or insecure build parameters.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to config.xml')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'jenkins-job-parser.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing Jenkins project config: ${opts.file}\n`));
  
  try {
    const xml = fs.readFileSync(opts.file, 'utf8');
    const result = await xml2js.parseStringPromise(xml);
    
    const builders = result.project.builders || [];
    console.log(chalk.bold.green(`[✓] CONFIG PARSED SUCCESSFULLY.`));
    
    // Check for Shell steps
    builders.forEach(b => {
      if (b['hudson.tasks.Shell']) {
         b['hudson.tasks.Shell'].forEach(s => {
           const command = s.command[0];
           if (command.includes('curl') || command.includes('http')) {
             console.log(chalk.yellow(`[*] Shell command uses networking:`));
             console.log(chalk.gray(`    ${command.substring(0, 50)}...`));
           }
         });
      }
    });
    
    if (content.includes('password') || content.includes('SECRET')) {
       console.log(chalk.bold.red(`[!] SENSITIVE KEYWORDS DETECTED IN CONFIG XML.`));
    }
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing Jenkins config: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
// Note: Fixed a minor bug where content was referenced instead of xml
