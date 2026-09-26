import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/* The built app/ is committed and served as-is; CI runs the repository's
   tests without installing this toolchain, so it cannot rebuild — but it can
   check. Every build stamps a hash of everything it was built from, and
   test/workspace.mjs recomputes it: an edit to src/ without a rebuild fails
   there instead of shipping a stale app. The same function lives in the test. */
const INPUTS = ['src', 'public', 'index.html', 'package.json', 'vite.config.ts', 'tsconfig.json'];
function walk(p: string): string[] {
  return statSync(p).isDirectory() ? readdirSync(p).sort().flatMap(f => walk(join(p, f))) : [p];
}
function sourceHash(root: string) {
  const h = createHash('sha256');
  for (const f of INPUTS.flatMap(i => walk(join(root, i)))) {
    h.update(relative(root, f).split('\\').join('/') + '\0');
    h.update(readFileSync(f)); h.update('\0');
  }
  return h.digest('hex');
}
const stamp = (): Plugin => ({
  name: 'rg-build-stamp',
  closeBundle() {
    writeFileSync(join(__dirname, '../app/build-info.json'),
      JSON.stringify({ source_sha256: sourceHash(__dirname), inputs: INPUTS }, null, 2) + '\n');
  },
});

// Built into ../app and committed, the same arrangement as platform-app/ →
// platform/. The worker serves it at /app/ with no build step of its own.
// Relative base, so it also works on the GitHub Pages mirror, which serves
// the repository under a sub-path.
export default defineConfig({
  base: './',
  plugins: [react(), stamp()],
  build: {
    outDir: '../app',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false,
  },
});
