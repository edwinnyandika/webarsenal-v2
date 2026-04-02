#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: crlf-injection-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/crlf-injection-tester');
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

  console.log(`[*] Probing CRLF Injection on ${url} across ${params.length} parameters...`);
  const findings = [];
  const crlfPayloads = [
    { payload: '%0D%0ASet-Cookie: webarsenal=polluted', description: 'CRLF-based Set-Cookie injection' },
    { payload: '%0D%0AX-Injected: webarsenal', description: 'CRLF-based X-Injected header' },
    { payload: '\\r\\nSet-Cookie: webarsenal=polluted', description: 'Slash-encoded CRLF' }
  ];

  for (const param of params) {
    for (const p of crlfPayloads) {
      const fuzzUrl = new URL(url);
      fuzzUrl.searchParams.set(param, p.payload);

      try {
        const startTime = Date.now();
        const response = await axios.get(fuzzUrl.toString(), {
          timeout: 10000,
          validateStatus: () => true,
          maxRedirects: 0
        });
        const duration = Date.now() - startTime;

        historyLogger.logRequest({
          tool: definition.id,
          beginTime: startTime,
          method: 'GET',
          url: fuzzUrl.toString(),
          requestHeaders: {},
          statusCode: response.status,
          responseHeaders: response.headers,
          responseBody: '',
          durationMs: duration
        });

        const headers = response.headers;
        if (headers['set-cookie']?.includes('webarsenal=polluted') || headers['x-injected']?.includes('webarsenal')) {
          findings.push({
            title: `Potential CRLF Injection (${p.description})`,
            severity: 'Medium',
            target: fuzzUrl.toString(),
            tool: definition.id,
            cvss: '6.1',
            evidence: {
              request: `GET ${fuzzUrl.toString()}`,
              response: `Injected header detected: ${JSON.stringify(headers)}`
            },
            remediation: 'Sanitize all user input by removing or encoding Carriage Return (%0D) and Line Feed (%0A) characters before reflecting them in response headers.'
          });
          console.log(`[!] POSSIBLE CRLF INJECTION: ${fuzzUrl.toString()}`);
          break;
        }
      } catch (err) {
        // Skip
      }
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} CRLF issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No CRLF issues detected via direct header analysis.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
