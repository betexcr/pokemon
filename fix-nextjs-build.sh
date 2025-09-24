#!/bin/bash

# Fix Next.js build manifest issues
echo "🔧 Fixing Next.js build manifest issues..."

# Stop any running Next.js processes
echo "🛑 Stopping any running Next.js processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "next build" 2>/dev/null || true
pkill -f "turbopack" 2>/dev/null || true

# Wait for processes to fully stop
sleep 2

# Clean up all build directories
echo "🧹 Cleaning up build directories..."
# Force remove with sudo if needed (but try without first)
rm -rf .next 2>/dev/null || sudo rm -rf .next 2>/dev/null || true
rm -rf out 2>/dev/null || true
rm -rf .next-dev 2>/dev/null || true
rm -rf .next-build 2>/dev/null || true

# Remove problematic temporary files
echo "🗑️  Removing temporary build files..."
find . -name "_buildManifest.js.tmp.*" -delete 2>/dev/null || true
find . -name "*.tmp.*" -path "*/.next*" -delete 2>/dev/null || true
find . -name ".next*" -type d -exec rm -rf {} + 2>/dev/null || true

# Clear any lock files
echo "🔓 Clearing lock files..."
rm -f .next/cache/webpack/client-development.pid 2>/dev/null || true
rm -f .next/cache/webpack/server-development.pid 2>/dev/null || true

# Clear node modules cache if it exists
if [ -d "node_modules/.cache" ]; then
    echo "🗑️  Clearing node modules cache..."
    rm -rf node_modules/.cache
fi

# Clear any turbopack cache
if [ -d "node_modules/.turbo" ]; then
    echo "🗑️  Clearing turbopack cache..."
    rm -rf node_modules/.turbo
fi

# Create a clean .next-dev directory for development
echo "📁 Creating clean development build directory..."
mkdir -p .next-dev

echo "✅ Next.js build issues fixed!"
echo "🚀 You can now run: bun run dev:safe"
