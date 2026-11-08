import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  // Els JSON de dades es poden importar directament com a mòduls
  // (Vite els serveix i els serialitza automàticament)
});