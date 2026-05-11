import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    proxy: {
      '/auth':          { target: 'http://localhost:5000', changeOrigin: true },
      '/products':      { target: 'http://localhost:5000', changeOrigin: true },
      '/orders':        { target: 'http://localhost:5000', changeOrigin: true },
      '/payments':      { target: 'http://localhost:5000', changeOrigin: true },
      '/notifications': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  build: { outDir: 'dist' },
});
