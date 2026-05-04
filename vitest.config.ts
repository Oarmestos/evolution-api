import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/main.ts'],
    },
  },
  resolve: {
    alias: {
      '@api': resolve(__dirname, 'src/api'),
      '@api/(.*)': resolve(__dirname, 'src/api/$1'),
      '@cache': resolve(__dirname, 'src/cache'),
      '@cache/(.*)': resolve(__dirname, 'src/cache/$1'),
      '@config': resolve(__dirname, 'src/config'),
      '@config/(.*)': resolve(__dirname, 'src/config/$1'),
      '@exceptions': resolve(__dirname, 'src/exceptions'),
      '@libs': resolve(__dirname, 'src/libs'),
      '@libs/(.*)': resolve(__dirname, 'src/libs/$1'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@utils/(.*)': resolve(__dirname, 'src/utils/$1'),
      '@validate': resolve(__dirname, 'src/validate'),
      '@validate/(.*)': resolve(__dirname, 'src/validate/$1'),
      '@dto': resolve(__dirname, 'src/dto'),
      '@dto/(.*)': resolve(__dirname, 'src/dto/$1'),
      '@types': resolve(__dirname, 'src/@types'),
      '@types/(.*)': resolve(__dirname, 'src/@types/$1'),
    },
  },
});
