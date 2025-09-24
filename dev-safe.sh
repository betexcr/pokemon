#!/bin/bash

# Safe development script that doesn't interfere with builds
echo "🚀 Starting Pokemon App Development (Build-Safe Mode)"

# Clean up any problematic build artifacts
echo "🧹 Cleaning up build artifacts..."
rm -rf .next
rm -rf out
rm -rf .next-dev
rm -rf .next-build

# Remove any temporary build manifest files that might be causing issues
find . -name "_buildManifest.js.tmp.*" -delete 2>/dev/null || true
find . -name "*.tmp.*" -path "*/.next/*" -delete 2>/dev/null || true

# Set environment variables for development
export NODE_ENV=development

# Start development server
echo "🔧 Starting development server on port 3000..."
echo "🌐 Your app will be available at: http://localhost:3000"
echo "🛑 Press Ctrl+C to stop"

# Run dev server with clean environment
bun run dev

echo "👋 Development server stopped"
