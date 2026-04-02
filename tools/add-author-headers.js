#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: add-author-headers.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */


const fs = require('fs');
const path = require('path');

function getHeader(filePath) {
  const fileName = path.basename(filePath);
  return ``;
}

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (['node_modules', '.git', '.gemini', 'output', 'tmp'].includes(item)) continue;
      processDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove any existing WebArsenal headers first
      const existingHeaderRegex = /\/\*\*[\s\S]*?WebArsenal[\s\S]*?╚════════════════════════════════════════════════════════════════════════════╝[\s\S]*?\*\//g;
      
      content = content.replace(existingHeaderRegex, '').trimStart();

      const header = getHeader(fullPath);
      
      // Ensure we preserve hashbang and use strict
      const lines = content.split('\n');
      let insertIndex = 0;
      if (lines[0] && lines[0].startsWith('#!')) {
        insertIndex = 1;
        if (lines[1] && lines[1].includes('use strict')) {
          insertIndex = 2;
        }
      } else if (lines[0] && lines[0].includes('use strict')) {
        insertIndex = 1;
      }

      lines.splice(insertIndex, 0, header, '');
      const newContent = lines.join('\n');
      fs.writeFileSync(fullPath, newContent, 'utf8');
      console.log(`[REBRANDED] ${fullPath}`);
    }
  }
}

const rootDir = path.resolve(__dirname, '..');
processDir(rootDir);
console.log('[*] Arsenal successfully rebranded to: De{c0}ded by Edwin Dev');
