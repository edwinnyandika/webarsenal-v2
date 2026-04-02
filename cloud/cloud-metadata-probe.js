#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: cloud-metadata-probe.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { payloads } = require('../utils/payload-library');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('cloud/cloud-metadata-probe');
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

  console.log(`[*] Probing cloud metadata exposure on ${url} across ${params.length} parameters...`);
  const findings = [];
  const cloudMetadataPayloads = payloads.ssrf.filter(p => p.context !== 'internal');

  for (const param of params) {
    for (const p of cloudMetadataPayloads) {
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

        if (p.context === 'aws' && (bodyStr.includes('instance-id') || bodyStr.includes('latest/meta-data'))) confirmed = true;
        if (p.context === 'gcp' && bodyStr.includes('computemetadata')) confirmed = true;
        if (p.context === 'azure' && bodyStr.includes('latest/meta-data')) confirmed = true;

        if (confirmed) {
          findings.push({
            title: `Cloud Metadata Exposure (${p.description})`,
            severity: 'Critical',
            target: fuzzUrl.toString(),
            tool: definition.id,
            cvss: '9.3',
            evidence: {
              request: `GET ${fuzzUrl.toString()}`,
              response: `Status: ${response.status}\nBody contains metadata fingerprint: "${p.description}"`
            },
            remediation: 'Disable metadata endpoints if they are not required or update your application to enforce IMDSv2 (Session-based) metadata access. Ensure outbound SSRF protection is enabled.'
          });
          console.log(`[!] CRITICAL: CLOUD METADATA DISCLOSURE: ${fuzzUrl.toString()} (Service: ${p.context})`);
          break; // Stop fuzzing other payloads for this parameter if metadata is found
        }
      } catch (err) {
        // Skip
      }
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} cloud metadata exposure issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No cloud metadata exposure detected.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
