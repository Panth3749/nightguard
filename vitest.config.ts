import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    alias: {
      '@nightguard/shared': path.resolve(__dirname, './packages/shared/src'),
      '@nightguard/security': path.resolve(__dirname, './packages/security/src'),
      '@nightguard/database': path.resolve(__dirname, './packages/database/src'),
      '@nightguard/router-adapters': path.resolve(__dirname, './packages/router-adapters/src'),
      '@nightguard/scheduler': path.resolve(__dirname, './packages/scheduler/src'),
    },
  },
});
