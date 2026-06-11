import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Builds into ../platform so the existing static deploys (Cloudflare Workers
// assets + gh-pages sync) serve the app at /platform with no pipeline changes.
export default defineConfig({
  plugins: [react()],
  base: '/platform/',
  build: {
    outDir: '../platform',
    emptyOutDir: true,
  },
})
