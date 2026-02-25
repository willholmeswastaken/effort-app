import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**', 'components/**', 'lib/**'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        'coverage/**',
        '*.config.ts',
        '*.config.mjs',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        'lib/db/schema.ts', // Usually excluded as it's just definitions
      ],
      // @ts-ignore - 'all' exists in vitest but types might be outdated or strict
      all: true,
    },
  },
});
