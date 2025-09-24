#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Get command line arguments (skip 'node' and script name)
const args = process.argv.slice(2);

try {
  // Use ts-node to run the TypeScript file
  const scriptPath = path.join(__dirname, '..', 'src', 'lib', 'usage', 'ingest.ts');
  const command = `npx ts-node --project tsconfig.json "${scriptPath}" ${args.join(' ')}`;
  
  execSync(command, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
} catch (error) {
  console.error('Ingestion failed:', error.message);
  process.exit(1);
}
