/* Runs before first paint, synchronously, so a saved theme never flashes the
   other one. External rather than inline because the CSP forbids inline script. */
try {
  var t = localStorage.getItem('rg_ws_theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch (e) { /* storage blocked: follow the system setting */ }
