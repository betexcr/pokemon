import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Mirror the tsconfig `@/*` → `src/*` path alias so modules using `@/` imports are testable.
export default defineConfig({
  // tsconfig uses `jsx: preserve` for Next; tests need the automatic runtime (components omit `import React`).
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
