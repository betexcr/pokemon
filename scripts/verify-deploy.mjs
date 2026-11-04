#!/usr/bin/env node
/**
 * Pre-push check that mirrors what Vercel does on deploy.
 * Usage: npm run verify:deploy            (lockfile checks + production build)
 *        npm run verify:deploy -- --no-build   (lockfile checks only, ~5s)
 * See docs/VERCEL_DEPLOYMENT.md.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  failures.push(msg);
  console.error(`  ✗ ${msg}`);
};

console.log('Vercel deploy preflight');

// 1. Exactly one lockfile: Vercel picks the package manager from the lockfile it finds.
const foreignLocks = ['bun.lock', 'bun.lockb', 'yarn.lock', 'pnpm-lock.yaml'].filter((f) => existsSync(f));
if (!existsSync('package-lock.json')) fail('package-lock.json is missing (run `npm install`).');
else ok('package-lock.json present');
if (foreignLocks.length) fail(`Remove other lockfiles (${foreignLocks.join(', ')}); this project uses npm only.`);
else ok('no bun/yarn/pnpm lockfiles');

// 2. Lockfile in sync with package.json: Vercel runs `npm ci` (vercel.json installCommand).
try {
  execSync('npm ci --dry-run --ignore-scripts --no-audit --no-fund', { stdio: 'pipe' });
  ok('package-lock.json is in sync with package.json (npm ci would succeed)');
} catch (error) {
  const out = `${error.stdout ?? ''}${error.stderr ?? ''}`.split('\n').filter((l) => /npm error/.test(l)).slice(0, 6).join('\n');
  fail(`package-lock.json is out of sync with package.json; run \`npm install\` and commit the lockfile.\n${out}`);
}

// 3. Node major matches engines (Vercel uses engines.node).
const engines = JSON.parse(readFileSync('package.json', 'utf8')).engines?.node ?? '';
const wantMajor = engines.match(/^(\d+)/)?.[1];
const haveMajor = process.versions.node.split('.')[0];
if (wantMajor && wantMajor !== haveMajor) {
  console.warn(`  ! Local Node ${process.versions.node} differs from engines.node "${engines}" used on Vercel.`);
} else {
  ok(`Node ${process.versions.node} matches engines.node "${engines}"`);
}

if (failures.length) {
  console.error(`\n${failures.length} preflight check(s) failed. Fix them before pushing.`);
  process.exit(1);
}

// 4. Production build (same command Vercel runs).
if (!process.argv.includes('--no-build')) {
  console.log('\nRunning `npm run build` …');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch {
    console.error('\nBuild failed. Vercel would fail the same way.');
    process.exit(1);
  }
}

console.log('\nDeploy preflight passed.');
