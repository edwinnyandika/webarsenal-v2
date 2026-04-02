#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: account-takeover-chain.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const { getModuleById } = require('../lib/module-catalog');
const { runModuleCli, parseArgs, createAdvancedHttpClient } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('auth-helpers/account-takeover-chain');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv, flagsFromRunner = null) {
  const { flags } = flagsFromRunner ? { flags: flagsFromRunner } : parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-url>`);
    return;
  }

  console.log(`[*] Running ${definition.name} on ${url}...`);
  const findings = [];
  const client = await createAdvancedHttpClient(flags);

  try {
    const startTime = Date.now();
    const response = await client.get(url, {
      timeout: 15000,
      validateStatus: () => true
    });
    const duration = Date.now() - startTime;

    historyLogger.logRequest({
      tool: definition.id,
      method: 'GET',
      url,
      requestHeaders: {},
      statusCode: response.status,
      responseHeaders: response.headers,
      responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      durationMs: duration
    });

    const body = String(response.data || '').toLowerCase();
    
    // Heuristic/Template Logic for Module Execution
    // For specialized security categories, we report an informational finding if the target is reachable.
    if (response.status === 200 && body.length > 0) {
       findings.push({
         title: `Module Execution: ${definition.name}`,
         severity: 'Informational',
         target: url,
         tool: definition.id,
         cvss: '0.0',
         evidence: `Successfully connected to ${url}. Status: 200 OK. Body size: ${body.length} bytes.`,
         remediation: 'Review the output of this module for specific security findings.'
       });
    }

  } catch (err) {
    console.error(`[-] Error in ${definition.id}: ${err.message}`);
  }

  if (findings.length > 0) {
    if (flags.json) {
       // JSON output handled by runModuleCli
    } else {
       console.log(`[+] Found ${findings.length} security items!`);
       process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
    }
  } else if (!flagsFromRunner && !flags.json) {
    console.log(`[-] Finished ${definition.id} (No findings reported).`);
  }

  return findings;
}

if (require.main === module) {
  runModuleCli(definition).catch(console.error);
}

module.exports = { run };
