'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: finding-deduplicator.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const fs = require('fs');
const path = require('path');
const { parseArgs } = require('../lib/module-runner');

async function run(argv = process.argv) {
  const { flags } = parseArgs(argv.slice(2));
  const inputDir = path.resolve(flags.input || 'output/findings');
  const outputFile = path.resolve(flags.output || 'output/findings/merged.json');

  if (!fs.existsSync(inputDir)) {
    console.error(`Input directory does not exist: ${inputDir}`);
    process.exit(1);
  }

  const findings = [];
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json') && f !== 'merged.json');

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(content)) {
        findings.push(...content);
      } else {
        findings.push(content);
      }
    } catch (err) {
      console.warn(`Skipping invalid JSON file: ${file}`);
    }
  }

  const seen = new Set();
  const uniqueFindings = findings.filter(f => {
    const key = `${f.tool || ''}|${f.target || ''}|${f.title || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (!fs.existsSync(path.dirname(outputFile))) {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(uniqueFindings, null, 2));
  console.log(`Merged ${findings.length} findings into ${uniqueFindings.length} unique results.`);
  console.log(`Output written to: ${outputFile}`);
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
