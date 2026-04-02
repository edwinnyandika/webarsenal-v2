#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const mime = require('mime-types');

function parseArgs(argv) {
  const flags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('--')) {
      continue;
    }

    const key = item.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }

  return flags;
}

function normalizePort(value, fallback = 4321) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 65535 ? parsed : fallback;
}

function resolveSafePath(rootDir, requestPath) {
  const decodedPath = decodeURIComponent(String(requestPath || '/').split('?')[0]);
  const relativePath = decodedPath === '/'
    ? (fs.existsSync(path.join(rootDir, 'html', 'editable-preview.html')) ? 'html/editable-preview.html' : 'html/index.html')
    : decodedPath.replace(/^\/+/, '');
  const absolutePath = path.resolve(rootDir, relativePath);

  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }

  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
    const nestedIndex = path.join(absolutePath, 'index.html');
    if (fs.existsSync(nestedIndex)) {
      return nestedIndex;
    }
  }

  return absolutePath;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const rootDir = path.resolve(options.dir || process.cwd());
  const port = normalizePort(options.port, 4321);

  const server = http.createServer((request, response) => {
    const targetPath = resolveSafePath(rootDir, request.url || '/');

    if (!targetPath || !fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const contentType = mime.lookup(targetPath) || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': `${contentType}${String(contentType).startsWith('text/') ? '; charset=utf-8' : ''}` });
    fs.createReadStream(targetPath).pipe(response);
  });

  server.listen(port, '127.0.0.1', () => {
    process.stdout.write(`Serving ${rootDir} at http://127.0.0.1:${port}/\n`);
  });
}

if (require.main === module) {
  main();
}
