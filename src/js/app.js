/* =====================================================
   PRIZM Hub — Application Bootstrap & Global State
   ===================================================== */

const App = (() => {
  let healthInterval = null;
  let mobileMenuOpen = false;

  const THEME_ORDER = ['hub', 'slate', 'light'];
  const THEME_STORAGE = 'prizm-theme';

  function themeLabel(theme) {
    if (typeof I18n === 'undefined') {
      const fallback = { hub: 'Cosmos', slate: 'Slate', light: 'Light' };
      return fallback[theme] || theme;
    }
    return I18n.t('theme.' + theme);
  }

  function getTheme() {
    const t = document.documentElement.getAttribute('data-theme');
    if (THEME_ORDER.includes(t)) return t;
    return 'hub';
  }

  function syncThemeToggleButton() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const theme = getTheme();
    btn.setAttribute('data-theme-active', theme);
    btn.title = I18n.t('theme.toggleTitle', { name: themeLabel(theme) });
  }

  function applyTheme(name) {
    if (!THEME_ORDER.includes(name)) name = 'hub';
    document.documentElement.setAttribute('data-theme', name);
    try {
      localStorage.setItem(THEME_STORAGE, name);
    } catch (e) {}
    syncThemeToggleButton();
  }

  function initTheme() {
    let stored = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE);
    } catch (e) {}
    if (stored && THEME_ORDER.includes(stored)) {
      document.documentElement.setAttribute('data-theme', stored);
    }
    syncThemeToggleButton();
  }

  function cycleTheme() {
    const cur = getTheme();
    const i = THEME_ORDER.indexOf(cur);
    const next = THEME_ORDER[(i + 1) % THEME_ORDER.length];
    applyTheme(next);
    toast(I18n.t('theme.changed', { name: themeLabel(next) }), 'info', 2200);
  }

  // ---- Toast Notifications ----
  function toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    el.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${Utils.esc(message)}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(100%)';
      el.style.transition = 'all 0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // ---- Modal ----
  function openModal(title, bodyHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-overlay').classList.add('open');
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
  }

  // ---- Mobile sidebar overlay ----
  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
    const sb = document.getElementById('sidebar');
    const bd = document.getElementById('sidebar-backdrop');
    if (sb) sb.classList.toggle('is-open', mobileMenuOpen);
    if (bd) bd.classList.toggle('is-open', mobileMenuOpen);
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
    const sb = document.getElementById('sidebar');
    const bd = document.getElementById('sidebar-backdrop');
    if (sb) sb.classList.remove('is-open');
    if (bd) bd.classList.remove('is-open');
  }

  // ---- Status Indicator ----
  function setStatus(state, label) {
    const dot = document.getElementById('status-dot');
    const lbl = document.getElementById('status-label');
    dot.className = 'status-dot ' + state;
    lbl.textContent = label;
  }

  // Returns "• 178.159.39.2" suffix for the status label (proxy mode only)
  function nodeTag() {
    try {
      const peer = API.getCurrentNode && API.getCurrentNode();
      return peer ? ` • ${peer.host}` : '';
    } catch (_) { return ''; }
  }

  // ---- Health Check ----
  let _wasOffline = false;

  async function checkHealth() {
    try {
      const status = await API.getBlockchainStatus();
      if (_wasOffline) {
        const peer = API.getCurrentNode ? API.getCurrentNode() : null;
        const nodeInfo = peer ? ` (${peer.host})` : '';
        toast(I18n.t('status.reconnected') + nodeInfo, 'success', 3500);
        _wasOffline = false;
      }
      if (status.isScanning) {
        setStatus('syncing', I18n.t('status.syncing') + nodeTag());
      } else {
        const height = Utils.formatNum(status.numberOfBlocks);
        setStatus('connected', I18n.t('status.block', { height }) + nodeTag());
      }
    } catch (err) {
      _wasOffline = true;
      setStatus('error', I18n.t('status.offline'));
    }
  }

  // ---- Peer-change handler (fires when NodeManager switches active node) ----
  function initPeerChangeHandler() {
    if (typeof API === 'undefined' || !API.onPeerChange) return;
    API.onPeerChange((peer) => {
      toast(
        I18n.t('status.failover', { host: peer.host, label: peer.label }),
        'warning',
        4000,
      );
      // Immediately refresh status line with new node tag
      checkHealth();
    });
  }

  // ---- Global Search ----
  function handleGlobalSearch() {
    const query = document.getElementById('global-search').value.trim();
    if (!query) return;
    const type = Utils.detectSearchType(query);
    switch (type) {
      case 'block_height':
        Router.navigate('/explorer?height=' + query);
        break;
      case 'account_rs':
      case 'account_id':
        Router.navigate('/accounts?account=' + encodeURIComponent(query));
        break;
      case 'tx_id':
      case 'tx_hash':
        Router.navigate('/transactions?tx=' + encodeURIComponent(query));
        break;
      default:
        // Try as account search
        Router.navigate('/accounts?account=' + encodeURIComponent(query));
    }
    document.getElementById('global-search').value = '';
  }

  // ---- Global search on Enter ----
  function initSearch() {
    const input = document.getElementById('global-search');
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleGlobalSearch();
    });
  }

  // ---- Register Routes ----
  function registerRoutes() {
    Router.register('/stats/general',      PageStatsGeneral.render);
    Router.register('/stats/blocks',       PageStatsBlocks.render);
    Router.register('/stats/transactions',  PageStatsTransactions.render);
    Router.register('/exchanges',           PageExchanges.render);
    Router.register('/paramining',          PageParamining.render);
    Router.register('/paracalc',            PageParacalc.render);
    Router.register('/dashboard',          PageDashboard.render);
    Router.register('/explorer',           PageExplorer.render);
    Router.register('/accounts',           PageAccounts.render);
    Router.register('/transactions',       PageTransactions.render);
    Router.register('/forging',            PageForging.render);
    Router.register('/network',            PageNetwork.render);
    Router.register('/messages',           PageMessages.render);
    Router.register('/top100',             PageTop100.render);
    Router.register('/about',              PageAbout.render);
    Router.register('/',                   PageDashboard.render);
  }

  // ---- Bootstrap ----
  function init() {
    initTheme();
    registerRoutes();
    initSearch();
    initPeerChangeHandler();

    // Initial health check + periodic
    checkHealth();
    healthInterval = setInterval(checkHealth, 15000);

    // Start router
    Router.init();
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    toast, openModal, closeModal, toggleMobileMenu, closeMobileMenu, handleGlobalSearch,
    cycleTheme, initTheme, applyTheme, getTheme, syncThemeToggleButton, checkHealth,
  };
})();
