// Cloudflare Worker entry point — serves the static site from the assets
// binding and attaches security headers on every response. The meta CSP in
// index.html covers GitHub Pages; these headers cover the custom domain and
// add protections that meta tags can't express (frame-ancestors, HSTS).
/* Permanent redirects for pages that have been retired.
   The India guides were removed when the product repositioned to Europe. They
   had been indexed, so deleting them without a redirect would have traded a
   positioning problem for two dead results and the search equity attached to
   them. Each points at the nearest surviving guide on the same subject. */
const GONE = {
  '/guides/brsr-core-assurance-india.html': '/guides/sustainability-assurance-issa-5000.html',
  '/guides/blue-carbon-credits-india.html': '/guides/carbon-credits-buyers-guide.html',
};

export default {
  async fetch(request, env) {
    const { pathname, origin } = new URL(request.url);
    const moved = GONE[pathname];
    if (moved) return Response.redirect(origin + moved, 301);

    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    headers.set('X-Frame-Options', 'DENY');                    // no clickjacking iframes
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    headers.set('Permissions-Policy', 'camera=(), geolocation=(), payment=(), usb=()');
    headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups'); // print popups still work
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  },
};
