/* =====================================================
   PRIZM Hub — Hash-based SPA Router
   Routes: #/stats/*, #/exchanges, #/paramining, #/paracalc,
           #/dashboard, #/explorer, #/accounts, #/transactions,
           #/forging, #/network, #/messages, #/top100, #/about
   ===================================================== */

const Router = (() => {
  const routes = {};
  let currentPage = null;
  let currentCleanup = null;

  function register(path, handler) {
    routes[path] = handler;
  }

  function navigate(path) {
    window.location.hash = '#' + path;
  }

  function getHash() {
    const hash = window.location.hash.replace('#', '') || '/dashboard';
    return hash;
  }

  function parseRoute(hash) {
    const [path, queryStr] = hash.split('?');
    const params = {};
    if (queryStr) {
      queryStr.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
    return { path, params };
  }

  async function dispatch() {
    const raw = getHash();
    const { path, params } = parseRoute(raw);

    // Update sidebar nav active state
    document.querySelectorAll('[data-nav-route]').forEach(el => {
      const r = el.getAttribute('data-nav-route') || '';
      if (!r) return;
      const active = path === r || (r !== '/dashboard' && path.startsWith(r + '/'));
      el.classList.toggle('active', active);
    });

    // Clean up previous page
    if (currentCleanup && typeof currentCleanup === 'function') {
      currentCleanup();
      currentCleanup = null;
    }

    // Destroy existing charts
    Chart.helpers && Object.values(Chart.instances || {}).forEach(c => {
      try { c.destroy(); } catch(e) {}
    });

    // Find matching route
    let handler = routes[path];
    if (!handler) {
      // Try prefix match for sub-routes
      for (const [route, fn] of Object.entries(routes)) {
        if (path.startsWith(route + '/')) { handler = fn; break; }
      }
    }
    if (!handler) handler = routes['/dashboard'];

    // Show loading state
    const outlet = document.getElementById('router-outlet');
    outlet.innerHTML = `<div class="page-loading"><div class="spinner"></div><p>${Utils.esc(I18n.t('common.loading'))}</p></div>`;

    currentPage = path;
    try {
      const cleanup = await handler(params, path);
      if (currentPage === path && cleanup) {
        currentCleanup = cleanup;
      }
    } catch (err) {
      console.error('Route error:', err);
      outlet.innerHTML = `
        <div class="empty-state" style="padding-top:80px">
          <div class="empty-state__icon">⚠️</div>
          <div class="empty-state__title">${Utils.esc(I18n.t('router.loadError'))}</div>
          <div class="empty-state__sub">${Utils.esc(err.message)}</div>
          <button class="btn btn--outline mt-4" onclick="Router.navigate('/dashboard')">${Utils.esc(I18n.t('router.toDashboard'))}</button>
        </div>`;
    }

    if (typeof App !== 'undefined' && typeof App.closeMobileMenu === 'function') {
      App.closeMobileMenu();
    }
  }

  function init() {
    window.addEventListener('hashchange', dispatch);
    dispatch();
  }

  return { register, navigate, init, dispatch, parseRoute };
})();
