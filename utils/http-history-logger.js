'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: http-history-logger.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

class HttpHistoryLogger {
  constructor(dbPath) {
    this.dbPath = dbPath || path.resolve(process.env.HOME || process.env.USERPROFILE, '.webarsenal', 'history.db');
    this.ensureDir();
    this.db = new sqlite3.Database(this.dbPath);
    this.init();
  }

  ensureDir() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  init() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          tool TEXT,
          method TEXT,
          url TEXT,
          request_headers TEXT,
          request_body TEXT,
          status_code INTEGER,
          response_headers TEXT,
          response_body TEXT,
          duration_ms INTEGER
        )
      `);
    });
  }

  logRequest(data) {
    const { tool, method, url, requestHeaders, requestBody, statusCode, responseHeaders, responseBody, durationMs } = data;
    this.db.serialize(() => {
      const stmt = this.db.prepare(`
        INSERT INTO history (tool, method, url, request_headers, request_body, status_code, response_headers, response_body, duration_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        tool || 'unknown',
        method || 'GET',
        url,
        JSON.stringify(requestHeaders || {}),
        requestBody || '',
        statusCode || 0,
        JSON.stringify(responseHeaders || {}),
        responseBody || '',
        durationMs || 0
      );
      stmt.finalize();
    });
  }

  query(filter, callback) {
    this.db.all(`SELECT * FROM history WHERE ${filter}`, [], (err, rows) => {
      callback(err, rows);
    });
  }

  close() {
    this.db.close();
  }

  static async run(argv = process.argv) {
    const logger = new HttpHistoryLogger();
    return new Promise((resolve, reject) => {
      logger.query('1=1', (err, rows) => {
        if (err) {
          console.error(`[-] History query failed: ${err.message}`);
          reject(err);
        } else {
          console.log(`[*] Total history records: ${rows.length}`);
          if (rows.length > 0) {
            console.log(JSON.stringify(rows.slice(-5), null, 2));
          }
          resolve(rows);
        }
        logger.close();
      });
    });
  }
}

async function run(argv = process.argv) {
  return HttpHistoryLogger.run(argv);
}

module.exports = { HttpHistoryLogger, run };
