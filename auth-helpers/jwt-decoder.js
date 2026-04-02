#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: jwt-decoder.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('auth-helpers/jwt-decoder');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const token = flags.token || null;

  if (!token) {
    console.log(`Usage: node ${definition.filePath} --token <jwt-to-decode>`);
    return;
  }

  console.log(`[*] Decoding JWT: ${token.slice(0, 50)}...`);
  const findings = [];
  const segments = token.split('.');

  if (segments.length < 2) {
    console.log('[-] Provided token does not look like a full JWT.');
    return;
  }

  try {
    const header = JSON.parse(Buffer.from(segments[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'));

    console.log(`[+] Header: ${JSON.stringify(header, null, 2)}`);
    console.log(`[+] Payload: ${JSON.stringify(payload, null, 2)}`);

    if (header.alg === 'none') {
      findings.push({
        title: 'JWT Algorithm None Vulnerability (alg:none)',
        severity: 'Critical',
        target: 'Provided Token',
        tool: definition.id,
        cvss: '9.8',
        evidence: `Alg header set to "none": ${JSON.stringify(header)}`,
        remediation: 'Disable the "none" algorithm in your JWT validation library.'
      });
      console.log(`[!] CRITICAL: JWT ALG:NONE DETECTED!`);
    }

    if (payload.exp && Date.now() > payload.exp * 1000) {
      findings.push({
        title: 'Expired JWT Token',
        severity: 'Informational',
        target: 'Provided Token',
        tool: definition.id,
        cvss: '0.0',
        evidence: `Token expired at: ${new Date(payload.exp * 1000).toISOString()}`,
        remediation: 'Refresh tokens when they expire to maintain secure sessions.'
      });
      console.log(`[!] INFORMATIONAL: JWT TOKEN EXPIRED.`);
    }

    if (!payload.exp) {
      findings.push({
        title: 'JWT Token Without Expiration',
        severity: 'Medium',
        target: 'Provided Token',
        tool: definition.id,
        cvss: '4.5',
        evidence: 'Token missing "exp" claim.',
        remediation: 'Always include an "exp" (expiration) claim in JWT tokens to limit the impact of token leakage.'
      });
      console.log(`[!] MEDIUM: JWT TOKEN MISSING EXPIRATION CLAM.`);
    }

  } catch (err) {
    console.error(`[-] Error decoding JWT: ${err.message}`);
  }

  if (findings.length > 0) {
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No common JWT vulnerabilities detected via decoding.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
