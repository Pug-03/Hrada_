import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serves this repo from /Hrada_/, not from the domain root, so
  // every built asset URL needs that prefix — otherwise the deployed page
  // requests /assets/... at the domain root and gets a 404 from Pages' own
  // catch-all. Vite rewrites index.html's asset references and every
  // import.meta.url-based path to match this automatically at build time.
  base: '/Hrada_/',
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
