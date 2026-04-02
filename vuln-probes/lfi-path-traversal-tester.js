#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: lfi-path-traversal-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { payloads } = require('../utils/payload-library');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/lfi-path-traversal-tester');
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

  console.log(`[*] Probing LFI/Path Traversal on ${url} across ${params.length} parameters...`);
  const findings = [];
  const lfiPayloads = payloads.pathTraversal;

  for (const param of params) {
    for (const p of lfiPayloads) {
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

        const body = String(response.data || '').toLowerCase();
        let confirmed = false;

        if (body.includes('root:x:0:0')) confirmed = true;
        if (body.includes('[extensions]') && body.includes('[fonts]')) confirmed = true;
        if (body.includes('/bin/bash') || body.includes('/usr/bin')) confirmed = true;

        if (confirmed) {
          findings.push({
            title: `LFI / Path Traversal Found (${p.description})`,
            severity: 'High',
            target: fuzzUrl.toString(),
            tool: definition.id,
            cvss: '8.1',
            evidence: {
              request: `GET ${fuzzUrl.toString()}`,
              response: `System file signature detected in response.`
            },
            remediation: 'Implement a strict whitelist of allowed filenames and directories. Use filesystem APIs that normalize paths and prevent traversal (e.g., path.basename in Node.js) or restrict application access with chroot/containers.'
          });
          console.log(`[!] LFI DETECTED: ${fuzzUrl.toString()} (Payload: ${p.payload})`);
          break;
        }
      } catch (err) {
        // Skip
      }
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} LFI issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No LFI detected via content analysis.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
