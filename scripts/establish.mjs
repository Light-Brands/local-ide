#!/usr/bin/env node

/**
 * Local IDE — Establish
 *
 * Validates the development environment after cloning.
 *
 * Usage:
 *   node scripts/establish.mjs          Full report with banner
 *   node scripts/establish.mjs --quick  Compact output (used by dev preflight)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import * as os from 'os';
import { execSync, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const quick = process.argv.includes('--quick');

// ---------------------------------------------------------------------------
// Colors (matches setup/wizard.mjs patterns)
// ---------------------------------------------------------------------------
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

const color = (col, text) => `${c[col]}${text}${c.reset}`;

// ---------------------------------------------------------------------------
// Result helpers
// ---------------------------------------------------------------------------
const results = [];

function pass(label, detail) {
  results.push({ status: 'pass', label, detail });
}

function warn(label, detail, hint) {
  results.push({ status: 'warn', label, detail, hint });
}

function fail(label, detail, hint) {
  results.push({ status: 'fail', label, detail, hint });
}

// ---------------------------------------------------------------------------
// Utility: find executable in PATH and common locations
// ---------------------------------------------------------------------------
function findExecutable(name, extraPaths = []) {
  // Try `which` first
  try {
    const p = execSync(`which ${name}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (p) return p;
  } catch { /* not found */ }

  // Try extra paths
  for (const p of extraPaths) {
    const resolved = p.replace('~', os.homedir());
    if (fs.existsSync(resolved)) return resolved;
  }

  return null;
}

function getVersion(bin, flag = '--version') {
  try {
    return execFileSync(bin, [flag], { encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Check 1: Node version
// ---------------------------------------------------------------------------
function checkNodeVersion() {
  const nvmrcPath = path.join(rootDir, '.nvmrc');
  let required = 20;
  if (fs.existsSync(nvmrcPath)) {
    const content = fs.readFileSync(nvmrcPath, 'utf8').trim();
    required = parseInt(content, 10);
  }

  const current = process.versions.node;
  const major = parseInt(current.split('.')[0], 10);

  if (major === required || major > required) {
    if (major > required) {
      warn('Node.js version', `v${current} (requires ${required})`, `Using newer Node ${major}; .nvmrc specifies ${required}`);
    } else {
      pass('Node.js version', `v${current}`);
    }
  } else {
    fail('Node.js version', `v${current} (requires >=${required})`, `Install Node ${required}: nvm install ${required}`);
  }
}

// ---------------------------------------------------------------------------
// Check 2: Dependencies
// ---------------------------------------------------------------------------
function checkDependencies() {
  const nodeModules = path.join(rootDir, 'node_modules');

  if (fs.existsSync(nodeModules)) {
    pass('Dependencies', 'node_modules up to date');
    return;
  }

  // node_modules missing — run npm install
  try {
    console.log(color('dim', '  Installing dependencies...'));
    execSync('npm install', { cwd: rootDir, stdio: 'inherit', timeout: 300000 });
    pass('Dependencies', 'Installed via npm install');
  } catch {
    fail('Dependencies', 'npm install failed', 'Run npm install manually and check for errors');
  }
}

// ---------------------------------------------------------------------------
// Check 3: Native modules
// ---------------------------------------------------------------------------
function checkNativeModules() {
  const modules = ['better-sqlite3', 'node-pty'];
  const script = modules.map(m => `require('${m}')`).join('; ');

  try {
    execFileSync(process.execPath, ['-e', script], {
      cwd: rootDir,
      encoding: 'utf8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    pass('Native modules', `${modules.join(', ')} OK`);
  } catch (err) {
    const msg = err.stderr || err.message || '';
    let hint = 'Run: npm rebuild';
    if (process.platform === 'darwin') {
      hint = 'Run: npm rebuild\nIf that fails: xcode-select --install && npm rebuild';
    } else if (process.platform === 'linux') {
      hint = 'Run: npm rebuild\nIf that fails: sudo apt-get install -y build-essential python3 && npm rebuild';
    }
    fail('Native modules', 'Compile/load failed', hint);
  }
}

// ---------------------------------------------------------------------------
// Check 4: Env file
// ---------------------------------------------------------------------------
function checkEnvFile() {
  const envLocal = path.join(rootDir, '.env.local');
  const envExample = path.join(rootDir, '.env.example');

  if (fs.existsSync(envLocal)) {
    pass('Environment file', '.env.local exists');
    return;
  }

  // Copy .env.example → .env.local
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envLocal);
    pass('Environment file', '.env.local created from .env.example');
  } else {
    pass('Environment file', '.env.local not needed (.env.example missing)');
  }
}

// ---------------------------------------------------------------------------
// Check 5: Data directory
// ---------------------------------------------------------------------------
function checkDataDir() {
  const dataDir = path.join(rootDir, '.local-ide', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  pass('Data directory', '.local-ide/data/ ready');
}

// ---------------------------------------------------------------------------
// Check 6: tmux
// ---------------------------------------------------------------------------
function checkTmux() {
  const bin = findExecutable('tmux', [
    '/opt/homebrew/bin/tmux',
    '/usr/local/bin/tmux',
    '/usr/bin/tmux',
  ]);

  if (bin) {
    const ver = getVersion(bin, '-V');
    pass('tmux', `${ver || 'found'} (${bin})`);
  } else {
    const hint = process.platform === 'darwin'
      ? 'Install: brew install tmux'
      : 'Install: sudo apt-get install tmux';
    warn('tmux', 'Not found (sessions won\'t persist)', hint);
  }
}

// ---------------------------------------------------------------------------
// Check 7: Claude CLI
// ---------------------------------------------------------------------------
function checkClaudeCli() {
  const bin = findExecutable('claude', [
    '/opt/homebrew/bin/claude',
    '/usr/local/bin/claude',
    path.join(os.homedir(), '.claude', 'bin', 'claude'),
  ]);

  if (bin) {
    const ver = getVersion(bin, '--version');
    pass('Claude CLI', `${ver || 'found'} (${bin})`);
  } else {
    warn('Claude CLI', 'Not found (chat won\'t work)', 'Install: https://docs.anthropic.com/en/docs/claude-cli');
  }
}

// ---------------------------------------------------------------------------
// Check 8: Ports
// ---------------------------------------------------------------------------
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function checkPorts() {
  const ports = [3000, 4000, 4001, 4002];
  const statuses = await Promise.all(ports.map(checkPort));

  const free = [];
  const busy = [];
  ports.forEach((p, i) => {
    (statuses[i] ? free : busy).push(p);
  });

  if (busy.length === 0) {
    pass('Ports', `${ports.join(', ')} available`);
  } else {
    warn(
      'Ports',
      `${busy.join(', ')} in use`,
      `Free these ports or update .env.local with alternatives`,
    );
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
function printBanner() {
  console.log('');
  console.log(color('blue', '  ┌─────────────────────────────────────────┐'));
  console.log(color('blue', '  │') + color('bright', '   LOCAL IDE — ESTABLISH                 ') + color('blue', '│'));
  console.log(color('blue', '  └─────────────────────────────────────────┘'));
  console.log('');
}

function printResults() {
  const statusTag = {
    pass: color('green', '  PASS'),
    warn: color('yellow', '  WARN'),
    fail: color('red', '  FAIL'),
  };

  for (const r of results) {
    const tag = statusTag[r.status];
    const label = r.label.padEnd(22);
    console.log(`${tag}  ${label} ${r.detail}`);
    if (r.hint) {
      for (const line of r.hint.split('\n')) {
        console.log(`${color('dim', '        → ' + line)}`);
      }
    }
  }

  console.log('');
  const passed = results.filter(r => r.status === 'pass').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;

  const parts = [];
  parts.push(color('green', `${passed} passed`));
  if (warned) parts.push(color('yellow', `${warned} warning${warned > 1 ? 's' : ''}`));
  if (failed) parts.push(color('red', `${failed} failed`));
  console.log(`  ${parts.join(', ')}`);

  if (failed === 0) {
    console.log(color('green', '  Ready! Run: npm run dev'));
  } else {
    console.log(color('red', '  Fix the failures above, then re-run: npm run establish'));
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // Run synchronous checks
  checkNodeVersion();
  checkDependencies();
  checkNativeModules();
  checkEnvFile();
  checkDataDir();
  checkTmux();
  checkClaudeCli();

  // Run async checks
  await checkPorts();

  const hasFail = results.some(r => r.status === 'fail');

  if (quick) {
    if (hasFail) {
      // Show full report on failure even in quick mode
      printBanner();
      printResults();
      process.exit(1);
    } else {
      console.log(color('green', '  Environment OK'));
      process.exit(0);
    }
  } else {
    printBanner();
    printResults();
    process.exit(hasFail ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(color('red', `  Establish failed: ${err.message}`));
  process.exit(1);
});
