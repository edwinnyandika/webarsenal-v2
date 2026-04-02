#!/usr/bin/env node
'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: fix-logger-imports.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (['node_modules', '.git', '.gemini', 'output'].includes(item)) continue;
      processDir(fullPath);
    } else if (item.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const oldReq = "const { HttpHistoryLogger } = require('../utils/http-history-logger');";
      const newReq = "const { HttpHistoryLogger } = require('../utils/http-history-logger');";
      
      if (content.includes(oldReq)) {
        content = content.split(oldReq).join(newReq);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[FIXED] ${fullPath}`);
      }
    }
  }
}

processDir(path.resolve(__dirname, '..'));
console.log('[*] Batch fix completed.');
