#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: smart-contract-scanner.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const axios = require('axios');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');
const { HttpHistoryLogger } = require('../utils/http-history-logger');

const definition = getModuleById('web3/smart-contract-scanner');
const historyLogger = new HttpHistoryLogger();

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const url = flags.url;

  if (!url) {
    console.log(`Usage: node ${definition.filePath} --url <target-dapp-url>`);
    return;
  }

  console.log(`[*] Scanning for Web3/Smart Contract interactions on ${url}...`);
  const findings = [];
  const web3Keywords = [
    'ethereum', 'bsc', 'polygon', 'avalanche', 'solana', 'walletconnect', 'metamask',
    'web3.js', 'ethers.js', 'contractaddress', 'abi', 'bytecode', 'rpc', 'infura', 'alchemy'
  ];

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
      responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      durationMs: duration
    });

    const bodyStr = String(response.data || '').toLowerCase();
    const detectedKeywords = web3Keywords.filter(kw => bodyStr.includes(kw));

    if (detectedKeywords.length > 0) {
      findings.push({
        title: 'Web3 / Smart Contract Interaction Detected',
        severity: 'Informational',
        target: url,
        tool: definition.id,
        cvss: '0.0',
        evidence: {
          request: `GET ${url}`,
          response: `Keywords found: ${detectedKeywords.join(', ')}`
        },
        remediation: 'Monitor for common smart contract vulnerabilities like reentrancy, integer overflow, and unauthorized access to administrative functions.'
      });
      console.log(`[+] DISCOVERED WEB3 INTERACTION: ${url} (Keywords: ${detectedKeywords.join(', ')})`);
    }

    // Step 2: Check for Ethereum Address pattern
    const ethAddressPattern = /0x[a-fA-F0-9]{40}/g;
    const matchedAddresses = bodyStr.match(ethAddressPattern);
    if (matchedAddresses && matchedAddresses.length > 0) {
      const uniqueAddresses = [...new Set(matchedAddresses)];
      findings.push({
        title: 'Potential Ethereum Smart Contract Addresses Found',
        severity: 'Low',
        target: url,
        tool: definition.id,
        cvss: '2.0',
        evidence: {
          addresses: uniqueAddresses
        },
        remediation: 'Verify if these addresses point to legitimate smart contracts and audit them for known vulnerabilities (e.g., Slither or Mythril).'
      });
      console.log(`[+] DISCOVERED POTENTIAL CONTRACT ADDRESSES: ${uniqueAddresses.join(', ')}`);
    }
  } catch (err) {
    console.error(`[-] Error scanning ${url}: ${err.message}`);
  }

  if (findings.length > 0) {
    console.log(`[+] Found ${findings.length} Web3 security items!`);
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    console.log('[-] No obvious Web3 interactions detected.');
  }

  return findings;
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
