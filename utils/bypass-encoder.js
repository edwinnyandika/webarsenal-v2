'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: bypass-encoder.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




/**
 * ╔═════════════════════════════════════════════════════════════════╗
 * ║  WebArsenal: bypass-encoder.js                                  ║
 * ║  Purpose: Encodes payloads in multiple formats for WAF bypass    ║
 * ╚═════════════════════════════════════════════════════════════════╝
 */

function encode(payload, method) {
  switch (method) {
    case 'url':
      return encodeURIComponent(payload);
    case 'double-url':
      return encodeURIComponent(encodeURIComponent(payload));
    case 'html-entities':
      return payload.replace(/[\u00A0-\u9999<>\&]/gim, i => '&#' + i.charCodeAt(0) + ';');
    case 'unicode':
      return payload.split('').map(char => {
        const hex = char.charCodeAt(0).toString(16).padStart(4, '0');
        return '\\u' + hex;
      }).join('');
    case 'base64':
      return Buffer.from(payload).toString('base64');
    case 'hex':
      return payload.split('').map(char => {
        const hex = char.charCodeAt(0).toString(16).padStart(2, '0');
        return '\\x' + hex;
      }).join('');
    default:
      return payload;
  }
}

function encodeAll(payload) {
  const methods = ['url', 'double-url', 'html-entities', 'unicode', 'base64', 'hex'];
  const results = {};
  for (const method of methods) {
    results[method] = encode(payload, method);
  }
  return results;
}

function run(argv = process.argv) {
  const payloadArg = argv.find(a => a.startsWith('--payload='));
  const payload = payloadArg ? payloadArg.split('=')[1] : '<script>alert(1)</script>';

  const results = encodeAll(payload);
  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) {
  run();
}

module.exports = { encode, encodeAll, run };
