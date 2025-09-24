# Pokemon App Development Guide

## Problem Solved
Your build process was breaking the `bun dev` run because both development and production builds were using the same configuration and potentially conflicting directories.

## Solutions Available

### 1. No Turbopack Mode (Recommended - Fixes Build Manifest Errors)
```bash
bun run dev:no-turbo
```
- **This is the best solution** - avoids Turbopack build manifest issues entirely
- Runs on port 3001 if 3000 is busy
- Clean development environment without build conflicts

### 2. Safe Development Mode
```bash
bun run dev:safe
```
- Uses Turbopack but with cleanup
- May still have build manifest errors (use dev:no-turbo instead)
- Won't interfere with production builds

### 3. Clean Development Mode
```bash
bun run dev:clean
```
- Removes all build artifacts before starting
- Fresh start every time
- Good for troubleshooting

### 4. Isolated Development Mode
```bash
bun run dev:isolated
```
- Runs on port 3001 instead of 3000
- Explicitly sets NODE_ENV=development
- Good when port 3000 is occupied

### 5. Development with Background Build
```bash
bun run dev:with-build
```
- Runs both dev server and build process simultaneously
- Build runs in background and logs to `build.log`
- Good for testing while building

## Build Commands

### Production Build
```bash
bun run build:prod
```
- Creates static export in `out/` directory
- Ready for deployment

### Background Build
```bash
bun run build:background
```
- Runs build in background
- Logs output to `build.log`
- Won't block your terminal

## Configuration Changes Made

1. **Next.js Config**: Modified to only use static export in production, not development
2. **Package Scripts**: Added multiple development modes
3. **Build Separation**: Development and production builds use different configurations

## Quick Start

For normal development work (recommended):
```bash
bun run dev:no-turbo
```

Your app will be available at: http://localhost:3000 (or 3001 if 3000 is busy)

## Troubleshooting

If you experience build manifest errors or other Next.js issues:
1. **Best solution**: `bun run dev:no-turbo` - Avoids Turbopack build manifest issues entirely
2. **If you need Turbopack**: `bun run fix:build` then `bun run dev:safe`
3. **Alternative**: `bun run dev:fix` - This runs both fix and dev in one command
4. **If port 3000 is busy**: `bun run dev:isolated` - Runs on port 3001
5. **For simultaneous dev and build**: `bun run dev:with-build`

## Common Issues Fixed

- ✅ Build manifest temporary file errors (`_buildManifest.js.tmp.*`)
- ✅ Directory conflicts between dev and production builds
- ✅ Lock file issues preventing server startup
- ✅ Stale build artifacts causing compilation errors

## File Structure
- `.next-dev/` - Development build artifacts (safe mode)
- `.next/` - Standard Next.js build artifacts
- `out/` - Production static export
- `build.log` - Background build logs
