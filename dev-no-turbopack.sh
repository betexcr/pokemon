#!/bin/bash

# Development script without Turbopack to avoid build manifest issues
echo "🚀 Starting Pokemon App Development (No Turbopack Mode)"

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

# Start development server without Turbopack
echo "🔧 Starting development server on port 3000 (without Turbopack)..."
echo "🌐 Your app will be available at: http://localhost:3000"
echo "🛑 Press Ctrl+C to stop"

# Run dev server without Turbopack to avoid build manifest issues
next dev

echo "👋 Development server stopped"
