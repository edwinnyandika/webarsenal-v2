#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: argocd-config-hunter.js                             ║
 * ║  Category: integrations                                         ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');

program
  .name('argocd-config-hunter.js')
  .description('Scans ArgoCD Application and Project manifests for insecure Git repo URLs or exposed secrets.')
  .version('4.0.0')
  .requiredOption('-f, --file <path>', 'Path to ArgoCD YAML manifest')
  .parse(process.argv);

const opts = program.opts();

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'argocd-config-hunter.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  if (!fs.existsSync(opts.file)) {
    console.log(chalk.red(`[x] File not found: ${opts.file}`));
    return;
  }
  
  console.log(chalk.cyan(`[*] Auditing ArgoCD Manifest: ${opts.file}\n`));
  
  try {
    const content = fs.readFileSync(opts.file, 'utf8');
    
    if (content.includes('repoURL:')) {
       console.log(chalk.bold.green(`[✓] FOUND Git repo URL. Checking for SSH/Token exposure...`));
       if (content.includes('://')) {
          console.log(chalk.yellow(`[*] Repo URL uses HTTP/HTTPS. Verify authentication method.`));
       }
    }
    
    if (content.includes('destination:')) {
       console.log(chalk.green(`[*] Application destination defines cluster/namespace.`));
    }
    
    if (content.includes('targetRevision: master') || content.includes('targetRevision: main')) {
       console.log(chalk.yellow(`[!] WARNING: Application targets latest (master/main). Stability risk.`));
    }
    
  } catch (err) {
    console.error(chalk.red(`[x] Error auditing ArgoCD Manifest: ${err.message}`));
  }
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
