import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.js'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
