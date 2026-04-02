#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: ssti-detector.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { payloads } = require('../utils/payload-library');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/ssti-detector');
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

  console.log(`[*] Probing SSTI on ${url} across ${params.length} parameters...`);
  const findings = [];
  const sstiPayloads = payloads.ssti;

  for (const param of params) {
    for (const p of sstiPayloads) {
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

        const bodyStr = String(response.data || '');
        if (bodyStr.includes('49')) {
          findings.push({
            title: `Potential SSTI (${p.description})`,
            severity: 'High',
            target: fuzzUrl.toString(),
            tool: definition.id,
            cvss: '8.5',
            evidence: {
              request: `GET ${fuzzUrl.toString()}`,
              response: `Expression "${p.payload}" evaluated to "49" in response.`
            },
            remediation: 'Implement strict input validation and use a safe templating approach (e.g., passing data via a context object, not directly into the template source). Use sandboxed template engines or disable powerful features.'
          });
          console.log(`[!] SSTI DETECTED: ${fuzzUrl.toString()} (Payload: ${p.payload})`);
          break;
        }
      } catch (err) {
        // Skip
      }
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} SSTI issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No SSTI detected via evaluation analysis.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
