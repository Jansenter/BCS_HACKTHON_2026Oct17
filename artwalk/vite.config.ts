import { defineConfig, loadEnv } from 'vite';
import { createNearbyHandler } from './server/nearby.mjs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), tailwindcss(), {
    name: 'artwalk-nearby-api',
    configureServer(server) {
      server.middlewares.use(createNearbyHandler({ env: loadEnv(mode, '.', '') }));
    },
  }],
  build: { chunkSizeWarningLimit: 900 },
}));
