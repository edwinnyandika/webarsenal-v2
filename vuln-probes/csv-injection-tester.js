#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: csv-injection-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/csv-injection-tester');
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

  console.log(`[*] Probing CSV Injection on ${url} across ${params.length} parameters...`);
  const findings = [];
  const csvPayloads = [
    { payload: '=SUM(1+2)', description: 'Formula-based CSV injection' },
    { payload: '@SUM(1+2)', description: 'A-sign formula injection' },
    { payload: '+SUM(1+2)', description: 'Plus-sign formula injection' },
    { payload: '-SUM(1+2)', description: 'Minus-sign formula injection' }
  ];

  for (const param of params) {
    for (const p of csvPayloads) {
      const fuzzUrl = new URL(url);
      fuzzUrl.searchParams.set(param, p.payload);

      try {
        const startTime = Date.now();
        const response = await axios.get(fuzzUrl.toString(), { timeout: 10000, validateStatus: () => true });
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

        const body = String(response.data || '').toLowerCase();
        if (body.includes(p.payload.toLowerCase())) {
          findings.push({
            title: `Potential CSV Injection (${p.description})`,
            severity: 'Medium',
            target: fuzzUrl.toString(),
            tool: definition.id,
            cvss: '4.5',
            evidence: {
              request: `GET ${fuzzUrl.toString()}`,
              response: `Injected CSV formula reflected in response.`
            },
            remediation: 'Prefix all user-controllable data with an apostrophe (\') if it starts with =, +, -, @, or \r when exporting to CSV/Excel. Alternatively, sanitize input by removing or encoding these special characters.'
          });
          console.log(`[!] POSSIBLE CSV INJECTION: ${fuzzUrl.toString()}`);
          break;
        }
      } catch (err) {
        // Skip
      }
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} CSV issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No CSV issues detected via direct reflection.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
