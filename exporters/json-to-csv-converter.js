#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: json-to-csv-converter.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const fs = require('fs');
const { getModuleById } = require('../lib/module-catalog');
const { parseArgs } = require('../lib/module-runner');

const definition = getModuleById('exporters/json-to-csv-converter');

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const inputPath = flags.input || null;
  const outputPath = flags.output || 'findings.csv';

  if (!inputPath) {
    console.log(`Usage: node ${definition.filePath} --input <findings.json> --output <findings.csv>`);
    return;
  }

  console.log(`[*] Converting findings from ${inputPath} to CSV...`);

  try {
    const rawData = fs.readFileSync(inputPath, 'utf8');
    const findings = JSON.parse(rawData);

    if (!Array.isArray(findings) || findings.length === 0) {
      console.log('[-] No findings found in the input JSON.');
      return;
    }

    const headers = ['Title', 'Severity', 'Target', 'Tool', 'CVSS', 'Remediation'];
    const csvRows = [headers.join(',')];

    findings.forEach(f => {
      const row = [
        `"${f.title || ''}"`,
        `"${f.severity || ''}"`,
        `"${f.target || ''}"`,
        `"${f.tool || ''}"`,
        `"${f.cvss || ''}"`,
        `"${(f.remediation || '').replace(/"/g, '""')}"` // Escape quotes for CSV
      ];
      csvRows.push(row.join(','));
    });

    fs.writeFileSync(outputPath, csvRows.join('\n'));
    console.log(`[+] CSV findings successfully written to ${outputPath}`);
    return { status: 'ok', csvPath: outputPath };

  } catch (err) {
    console.error(`[-] Error converting findings to CSV: ${err.message}`);
  }
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
