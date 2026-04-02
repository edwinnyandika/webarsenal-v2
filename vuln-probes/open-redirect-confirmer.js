#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: open-redirect-confirmer.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { payloads } = require('../utils/payload-library');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/open-redirect-confirmer');
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

  console.log(`[*] Probing Open Redirect on ${url} across ${params.length} parameters...`);
  const findings = [];
  const redirectPayloads = payloads.openRedirect;

  for (const param of params) {
    for (const p of redirectPayloads) {
      const fuzzUrl = new URL(url);
      fuzzUrl.searchParams.set(param, p.payload);

      try {
        const startTime = Date.now();
        const response = await axios.get(fuzzUrl.toString(), {
          timeout: 10000,
          maxRedirects: 0,
          validateStatus: (status) => status >= 100 && status < 600
        });
        const duration = Date.now() - startTime;

        historyLogger.logRequest({
          tool: definition.id,
          method: 'GET',
          url: fuzzUrl.toString(),
          requestHeaders: {},
          statusCode: response.status,
          responseHeaders: response.headers,
          responseBody: '',
          durationMs: duration
        });

        const location = response.headers['location'] || '';

        if (response.status >= 300 && response.status < 400 && location.includes('evil.com')) {
          findings.push({
            title: `Open Redirect Confirmed (${p.description})`,
            severity: 'Medium',
            target: fuzzUrl.toString(),
            tool: definition.id,
            cvss: '6.1',
            evidence: {
              request: `GET ${fuzzUrl.toString()}`,
              response: `Status: ${response.status}\nLocation: ${location}`
            },
            remediation: 'Implement a whitelist for external redirects or use relative paths for internal navigation. Avoid user-controllable input in redirect destinations.'
          });
          console.log(`[!] CONFIRMED OPEN REDIRECT: ${fuzzUrl.toString()} -> ${location}`);
        }
      } catch (err) {
        // Skip connection errors
      }
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} Open Redirect issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No open redirects detected through direct response analysis.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
