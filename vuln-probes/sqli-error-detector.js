#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: sqli-error-detector.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs, createAdvancedHttpClient, runModuleCli } = require('../lib/module-runner');
const { payloads } = require('../utils/payload-library');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/sqli-error-detector');
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

  console.log(`[*] Probing SQL injection (Error-based) on ${url} across ${params.length} parameters...`);
  const findings = [];
  const sqliPayloads = payloads.sqli;

  const client = await createAdvancedHttpClient(flags);

  for (const param of params) {
    for (const p of sqliPayloads) {
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

        const body = String(response.data || '').toLowerCase();
        const patterns = [
          'SQL syntax', 'mysql_fetch', 'ORA-01756', 'PostgreSQL query error', 'SQLite/JDBCDriver', 'Microsoft OLE DB Provider for SQL Server'
        ];
        for (const pattern of patterns) {
          if (body.includes(pattern.toLowerCase())) {
            findings.push({
              title: `Potential SQL Injection (${p.description})`,
              severity: 'High',
              target: fuzzUrl.toString(),
              tool: definition.id,
              cvss: '8.8',
              evidence: {
                request: `GET ${fuzzUrl.toString()}`,
                response: `Error Pattern Found: "${pattern}"`
              },
              remediation: 'Use parameterized queries (prepared statements) for all database interaction. Use an ORM or a database abstraction layer that handles escaping for you.'
            });
            console.log(`[!] POSSIBLE SQLi: ${fuzzUrl.toString()} (Error: ${pattern})`);
            break;
          }
        }
      } catch (err) {
        // Skip
      }
    }
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} SQLi issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No SQLi detected through error-based analysis.');
  }

  return findings;
}

if (require.main === module) {
  runModuleCli(definition).catch(console.error);
}

module.exports = { run };
