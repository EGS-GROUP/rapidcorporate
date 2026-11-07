import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Crucial: base must match the subroute where Express serves the admin dashboard
export default defineConfig({
  plugins: [react()],
  base: '/admin/'
});
