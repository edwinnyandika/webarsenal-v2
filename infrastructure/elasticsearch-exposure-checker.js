#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: elasticsearch-exposure-checker.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('infrastructure/elasticsearch-exposure-checker');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-elasticsearch-url:9200>`);
    return;
  }

  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  console.log(`[*] Testing exposure on ElasticSearch: ${baseUrl}...`);
  const findings = [];
  const endpoints = [
    '/_cat/indices?v',
    '/_cluster/health',
    '/_nodes/settings',
    '/_aliases'
  ];

  for (const endpoint of endpoints) {
    const targetUrl = `${baseUrl}${endpoint}`;
    try {
      const startTime = Date.now();
      const response = await axios.get(targetUrl, {
        timeout: 10000,
        validateStatus: () => true
      });
      const duration = Date.now() - startTime;

      historyLogger.logRequest({
        tool: definition.id,
        method: 'GET',
        url: targetUrl,
        requestHeaders: {},
        statusCode: response.status,
        responseHeaders: response.headers,
        responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        durationMs: duration
      });

      const bodyStr = String(response.data || '').toLowerCase();
      if (response.status === 200 && (bodyStr.includes('health') || bodyStr.includes('index') || bodyStr.includes('node'))) {
        findings.push({
          title: `Exposed ElasticSearch Endpoint (${endpoint})`,
          severity: 'High',
          target: targetUrl,
          tool: definition.id,
          cvss: '7.5',
          evidence: {
            request: `GET ${targetUrl}`,
            response: `Status: ${response.status}\nBody contains metadata or cluster info.`
          },
          remediation: 'Restrict public access to ElasticSearch using firewall rules (Security Groups) or implement authentication via X-Pack or an Nginx reverse proxy.'
        });
        console.log(`[!] CRITICAL: EXPOSED ELASTICSEARCH: ${targetUrl}`);
      }
    } catch (err) {
      // Skip
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} ElasticSearch issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No obvious ElasticSearch exposure detected.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
