import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Crucial: base must match the subroute where Express serves the PWA
export default defineConfig({
  plugins: [react()],
  base: '/app/'
});
