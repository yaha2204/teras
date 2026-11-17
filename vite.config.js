import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    // Di lokal, /api/auth/* diteruskan ke backend PostgreSQL (port 3333).
    // Di Vercel, rute yang sama dilayani oleh function di folder api/.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3333',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
