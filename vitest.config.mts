import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /*
     * jsdom gives tests a small browser-like environment. It supports the DOM
     * and localStorage, but it does not actually play audio.
     */
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    clearMocks: true,
  },
});
