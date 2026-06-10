// Cloudflare Worker entry point — serves the static site from the assets binding.
// Having an explicit entry point makes every wrangler deploy mode work
// (`wrangler deploy` and `wrangler versions upload`).
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
