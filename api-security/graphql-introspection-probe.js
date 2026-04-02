#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: graphql-introspection-probe.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('api-security/graphql-introspection-probe');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <graphql-endpoint>`);
    return;
  }

  console.log(`[*] Testing GraphQL introspection on ${url}...`);
  const findings = [];
  const introspectionQuery = `{"query": "{ __schema { queryType { name } } }"}`;

  try {
    const startTime = Date.now();
    const response = await axios.post(url, introspectionQuery, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      validateStatus: () => true
    });
    const duration = Date.now() - startTime;

    historyLogger.logRequest({
      tool: definition.id,
      method: 'POST',
      url,
      requestHeaders: { 'Content-Type': 'application/json' },
      requestBody: introspectionQuery,
      statusCode: response.status,
      responseHeaders: response.headers,
      responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      durationMs: duration
    });

    if (response.status === 200 && response.data?.data?.__schema) {
      findings.push({
        title: 'GraphQL Introspection Enabled',
        severity: 'Low',
        target: url,
        tool: definition.id,
        cvss: '2.3',
        evidence: {
          request: introspectionQuery,
          response: JSON.stringify(response.data).slice(0, 500)
        },
        remediation: 'Disable GraphQL introspection in production environments to prevent sensitive schema disclosure.'
      });
      console.log(`[!] GRAPHQL INTROSPECTION DETECTED: ${url}`);
    }
  } catch (err) {
    console.error(`[-] Error testing ${url}: ${err.message}`);
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} API security issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No GraphQL introspection detected.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
