import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Builds into ../platform so the existing static deploys (Cloudflare Workers
// assets + gh-pages sync) serve the app at /platform with no pipeline changes.
// base './' keeps all asset URLs relative, so the app works whether the site
// is served at the domain root (regenesisimpact.in) or under a subpath
// (suranjan104-cell.github.io/ReGenesis-Impact/). HashRouter handles routing.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../platform',
    emptyOutDir: true,
  },
})
