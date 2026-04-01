#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: scope-mapper.js                                    ║
 * ║  Category: reporters                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('scope-mapper.js')
  .description('Visualizes in-scope vs out-of-scope assets as a map.')
  .version('3.0.0')
  .requiredOption('-i, --input <file>', 'JSON file containing all discovered assets')
  .requiredOption('-s, --scope <file>', 'File containing scope rules')
  .parse(process.argv);

const opts = program.opts();

function parseScope(scopeFile) {
  const lines = fs.readFileSync(scopeFile, 'utf8').split('\n').map(l => l.trim()).filter(l => l !== '' && !l.startsWith('#'));
  const include = [];
  const exclude = [];
  lines.forEach(line => {
    if (line.startsWith('!')) {
      exclude.push(new RegExp('^' + line.substring(1).replace(/\./g, '\\.').replace(/\*/g, '.*') + '$', 'i'));
    } else {
      include.push(new RegExp('^' + line.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$', 'i'));
    }
  });
  return { include, exclude };
}

function isScopeMatch(target, scope) {
  const host = target.startsWith('http') ? new URL(target).hostname : target;
  const excluded = scope.exclude.some(re => re.test(host));
  if (excluded) return false;
  const included = scope.include.some(re => re.test(host));
  return included;
}

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'scope-mapper.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.input) || !fs.existsSync(opts.scope)) {
    console.error(chalk.red(`[x] Input or scope file not found.`));
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(opts.input, 'utf8'));
  const scope = parseScope(opts.scope);
  const assets = new Set([...(data.subdomains || []), ...(data.endpoints?.map(e => new URL(e).hostname) || [])]);
  
  console.log(chalk.cyan(`[*] Visualizing scope for ${assets.size} unique assets:\n`));
  
  assets.forEach(asset => {
    const isMatch = isScopeMatch(asset, scope);
    const prefix = isMatch ? chalk.green('[+]') : chalk.red('[-] ');
    const label = isMatch ? chalk.bold.white(asset) : chalk.gray(asset);
    
    console.log(`${prefix} ${label.padEnd(40)} | ${isMatch ? chalk.bgGreen.black(' IN-SCOPE ') : chalk.bgRed.black(' OUT-OF-SCOPE ')}`);
  });
  
  console.log(chalk.gray(`\n[*] DONE.`));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
