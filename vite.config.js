import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The Firestore SDK alone is ~240 kB gzipped; that's expected, not a problem.
  build: { chunkSizeWarningLimit: 1000 },
})
