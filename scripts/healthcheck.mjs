#!/usr/bin/env node

/**
 * Local IDE — Health Check
 *
 * Pings all 4 service endpoints and reports status.
 *
 * Usage:
 *   node scripts/healthcheck.mjs
 *   npm run health
 */

import * as http from 'http';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

const color = (col, text) => `${c[col]}${text}${c.reset}`;

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
const services = [
  { name: 'App Server', port: 3000, path: '/', expectJson: false },
  { name: 'IDE Server', port: 4000, path: '/', expectJson: false },
  { name: 'Terminal Server', port: 4001, path: '/health', expectJson: true },
  { name: 'Chat Server', port: 4002, path: '/health', expectJson: true },
];

// ---------------------------------------------------------------------------
// Ping a single service
// ---------------------------------------------------------------------------
function ping(service) {
  return new Promise((resolve) => {
    const timeout = 3000;
    const url = `http://localhost:${service.port}${service.path}`;

    const req = http.get(url, { timeout }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 500) {
          resolve({ ...service, up: false, detail: `${res.statusCode}` });
          return;
        }

        let detail = `${res.statusCode}`;
        if (service.expectJson) {
          try {
            const json = JSON.parse(body);
            const parts = [json.status || 'ok'];
            if (json.sessions !== undefined) {
              parts.push(`${json.sessions} session${json.sessions !== 1 ? 's' : ''}`);
            }
            detail = parts.join(', ');
          } catch {
            detail = `${res.statusCode}`;
          }
        }

        resolve({ ...service, up: true, detail });
      });
    });

    req.on('error', (err) => {
      const reason = err.code === 'ECONNREFUSED' ? 'refused' : err.message;
      resolve({ ...service, up: false, detail: reason });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ...service, up: false, detail: 'timeout' });
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('');

  const results = await Promise.all(services.map(ping));

  for (const r of results) {
    const tag = r.up ? color('green', '  UP  ') : color('red', '  DOWN');
    const name = r.name.padEnd(18);
    const port = `:${r.port}`;
    console.log(`${tag}  ${name} ${color('dim', port)}  (${r.detail})`);
  }

  console.log('');
  const upCount = results.filter(r => r.up).length;
  const total = results.length;
  const summary = `${upCount}/${total} services running`;
  console.log(`  ${upCount === total ? color('green', summary) : color('yellow', summary)}`);
  console.log('');

  process.exit(upCount === total ? 0 : 1);
}

main().catch((err) => {
  console.error(color('red', `  Health check failed: ${err.message}`));
  process.exit(1);
});
