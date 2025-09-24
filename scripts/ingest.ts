#!/usr/bin/env node

import { runIngestionCLI } from '../src/lib/usage/ingest';

// Get command line arguments (skip 'node' and script name)
const args = process.argv.slice(2);

// Run the ingestion CLI
runIngestionCLI(args).catch(error => {
  console.error('Ingestion failed:', error);
  process.exit(1);
});
