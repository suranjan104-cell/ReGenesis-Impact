#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# Publish the latest build to the LIVE external site (regenesisimpact.in).
#
# The custom domain is served by a Cloudflare Worker, which only updates
# when it is deployed. This script does that in one step. It opens your
# browser once to log in to the Cloudflare account you already own — that
# login IS the authentication; there are no tokens to create.
#
#   Usage:   bash deploy.sh
#            (or: npm run deploy)
#
# Takes ~30 seconds. Re-run it any time you want the domain to match the
# repo. To make this fully automatic on every push instead, add the two
# Cloudflare secrets described in AUTOMATION.md and it runs itself.
# ─────────────────────────────────────────────────────────────────────
set -e

echo "▸ Pulling the latest committed build…"
git pull --ff-only origin main || echo "  (skip: not on a clean main — deploying the working tree as-is)"

echo "▸ Deploying to Cloudflare (a browser window will open for login)…"
npx --yes wrangler deploy

echo ""
echo "✓ Done. https://regenesisimpact.in should now show the latest build."
echo "  If it looks cached, hard-refresh: Cmd/Ctrl + Shift + R."
