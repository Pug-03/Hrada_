import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // Recharts and Framer Motion are large and change rarely; splitting
        // them out keeps the app chunk small and cacheable between edits.
        advancedChunks: {
          groups: [
            { name: 'charts', test: /node_modules\/(recharts|d3-|victory|internmap|robust-predicates|delaunator)/ },
            { name: 'motion', test: /node_modules\/(framer-motion|motion-dom|motion-utils)/ },
            { name: 'react', test: /node_modules\/(react|react-dom|scheduler|react-router)/ },
          ],
        },
      },
    },
  },
})
