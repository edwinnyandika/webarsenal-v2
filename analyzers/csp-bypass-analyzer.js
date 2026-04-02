#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: csp-bypass-analyzer.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('analyzers/csp-bypass-analyzer');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-url>`);
    return;
  }

  console.log(`[*] Auditing CSP on ${url}...`);
  const findings = [];

  try {
    const startTime = Date.now();
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true
    });
    const duration = Date.now() - startTime;

    historyLogger.logRequest({
      tool: definition.id,
      method: 'GET',
      url,
      requestHeaders: {},
      statusCode: response.status,
      responseHeaders: response.headers,
      responseBody: '',
      durationMs: duration
    });

    const csp = response.headers['content-security-policy'];
    if (!csp) {
      findings.push({
        title: 'Missing Content-Security-Policy Header',
        severity: 'Medium',
        target: url,
        tool: definition.id,
        cvss: '5.0',
        evidence: 'No CSP header found in response headers.',
        remediation: 'Implement a strong Content-Security-Policy (CSP) to mitigate XSS and data injection attacks.'
      });
      console.log(`[!] CRITICAL: MISSING CSP HEADER: ${url}`);
    } else {
      console.log(`[*] CSP found: ${csp}`);
      
      const weaknesses = [];
      if (csp.includes('unsafe-inline')) weaknesses.push('unsafe-inline (allows inline script execution)');
      if (csp.includes('unsafe-eval')) weaknesses.push('unsafe-eval (allows dynamic code evaluation)');
      if (csp.includes('*')) weaknesses.push('Wildcard (*) in directives (allows any origin)');
      if (csp.includes('data:')) weaknesses.push('data: URI scheme (allows data-encoded scripts)');
      
      const bypassCdns = ['ajax.googleapis.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'yastatic.net'];
      const matchedCdns = bypassCdns.filter(cdn => csp.includes(cdn));
      if (matchedCdns.length > 0) {
        weaknesses.push(`Whitelist contains CDNs with known JSONP bypasses: ${matchedCdns.join(', ')}`);
      }

      if (weaknesses.length > 0) {
        findings.push({
          title: 'Weak Content-Security-Policy',
          severity: 'Low',
          target: url,
          tool: definition.id,
          cvss: '2.5',
          evidence: `Analysis found the following weaknesses: ${weaknesses.join('; ')}`,
          remediation: 'Refine the CSP by removing unsafe-inline/eval, avoiding wildcards, and whitelisting only specific trusted domains. Consider using nonce-based or hash-based CSP.'
        });
        console.log(`[!] CSP WEAKNESSES DETECTED: ${weaknesses.join('; ')}`);
      }
    }
  } catch (err) {
    console.error(`[-] Error auditing CSP on ${url}: ${err.message}`);
  }

  if (findings.length > 0) {
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No CSP weaknesses detected with the current rules.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
