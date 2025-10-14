import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const port = process.env.PORT ?? '3002';
const cmd = process.env.DEV_CMD ?? 'bun';
const args = process.env.DEV_ARGS ? process.env.DEV_ARGS.split(' ') : ['run', 'dev', '--', '--port', port];

const child = spawn(cmd, args, {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: port,
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

