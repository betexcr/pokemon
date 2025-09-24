#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Pokemon App Development Environment');
console.log('📋 This will run dev server and build processes simultaneously');

// Function to run a command and handle its output
function runCommand(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    ...options
  });

  child.on('error', (error) => {
    console.error(`❌ Error running ${command}:`, error.message);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.log(`⚠️  ${command} exited with code ${code}`);
    }
  });

  return child;
}

// Function to check if port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(false);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(true);
    });
  });
}

async function main() {
  try {
    // Check if dev port is available
    const devPort = 3000;
    const buildPort = 3001;
    
    if (await isPortInUse(devPort)) {
      console.log(`⚠️  Port ${devPort} is in use, using port ${buildPort} for dev server`);
    }

    // Start development server
    console.log('🔧 Starting development server...');
    const devProcess = runCommand('bun', ['run', 'dev'], {
      env: { ...process.env, NODE_ENV: 'development' }
    });

    // Wait a moment for dev server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Start background build process
    console.log('🔨 Starting background build process...');
    const buildProcess = runCommand('bun', ['run', 'build:background']);

    // Handle cleanup on exit
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development environment...');
      devProcess.kill('SIGINT');
      buildProcess.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down development environment...');
      devProcess.kill('SIGTERM');
      buildProcess.kill('SIGTERM');
      process.exit(0);
    });

    console.log('✅ Development environment is running!');
    console.log(`🌐 Dev server: http://localhost:${devPort}`);
    console.log('📝 Build logs: build.log');
    console.log('🛑 Press Ctrl+C to stop both processes');

  } catch (error) {
    console.error('❌ Failed to start development environment:', error.message);
    process.exit(1);
  }
}

main();
