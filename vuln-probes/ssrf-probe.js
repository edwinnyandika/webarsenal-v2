#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: ssrf-probe.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs, createAdvancedHttpClient, runModuleCli } = require('../lib/module-runner');
const { payloads } = require('../utils/payload-library');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/ssrf-probe');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv, flagsFromRunner = null) {
  const { flags } = flagsFromRunner ? { flags: flagsFromRunner } : parseArgs(argv.slice(2));
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

  console.log(`[*] Probing SSRF on ${url} across ${params.length} parameters...`);
  const findings = [];
  const ssrfPayloads = payloads.ssrf;

  const client = await createAdvancedHttpClient(flags);

  for (const param of params) {
    for (const p of ssrfPayloads) {
      const fuzzUrl = new URL(url);
      fuzzUrl.searchParams.set(param, p.payload);

      try {
        const startTime = Date.now();
        const response = await client.get(fuzzUrl.toString());
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

        if (p.context === 'aws' && bodyStr.includes('instance-id')) confirmed = true;
        if (p.context === 'gcp' && bodyStr.includes('computemetadata')) confirmed = true;
        if (p.context === 'internal' && response.status === 200 && !bodyStr.includes('not found')) confirmed = true;

        if (confirmed) {
          findings.push({
            title: `Potential SSRF (${p.description})`,
            severity: 'High',
            target: fuzzUrl.toString(),
            tool: definition.id,
            cvss: '8.3',
            evidence: {
              request: `GET ${fuzzUrl.toString()}`,
              response: `Status: ${response.status}\nBody Snippet: ${bodyStr.slice(0, 500)}`
            },
            remediation: 'Implement a strict whitelist for allowed URLs or domains. Use a dedicated proxy for outbound requests and restrict local network access.'
          });
          console.log(`[!] POSSIBLE SSRF: ${fuzzUrl.toString()}`);
        }
      } catch (err) {
        // Expected for some SSRF (e.g., timeout)
      }
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} SSRF issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No SSRF detected via direct response analysis.');
  }

  return findings;
}

if (require.main === module) {
  runModuleCli(definition).catch(console.error);
}

module.exports = { run };
