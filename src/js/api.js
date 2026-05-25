/* =====================================================
   PRIZM Hub — API Client with Multi-Peer NodeManager
   ===================================================== */

const API = (() => {

  // ── Known PRIZM node peers (mirrors server.js PEERS list) ───────────────────
  // Used for display, direct-mode failover, and /prizm-node status queries.
  const PEERS = [
    { host: '178.159.39.2',   port: 9976, label: 'Volkonskii'    },
    { host: '217.25.230.163', port: 9976, label: 'Lir'           },
    { host: '91.122.105.234', port: 9976, label: 'Linux amd64 A' },
    { host: '188.120.245.83', port: 9976, label: 'Linux amd64 B' },
    { host: '81.177.166.142', port: 9976, label: 'Pzm'           },
    { host: '62.113.118.11',  port: 9976, label: 'Linux amd64 C' },
    { host: '62.183.98.33',   port: 9976, label: 'PrizmSpaceDVS' },
    { host: '5.141.22.122',   port: 9976, label: 'trenina'       },
    { host: '31.192.111.76',  port: 9976, label: 'DaoFamily'     },
    { host: '85.234.29.70',   port: 9976, label: 'RedyVokson'    },
  ];

  // ── Node Manager ─────────────────────────────────────────────────────────────
  // Tracks which PRIZM node is currently active.
  // - Proxy mode (localhost): server.js handles failover; we poll /prizm-node for info.
  // - Direct mode: we rotate through PEERS ourselves on fetch failures.
  const NodeManager = (() => {
    const isProxy = window.location.protocol !== 'file:';

    let activePeer    = { ...PEERS[0] };
    let directPeerIdx = 0;
    const listeners   = [];

    function notify(peer) {
      activePeer = { ...peer };
      listeners.forEach(fn => { try { fn(peer); } catch (_) {} });
    }

    // Fetch active node info from the local proxy server
    async function fetchProxyNode() {
      try {
        const ctrl = new AbortController();
        const tid  = setTimeout(() => ctrl.abort(), 3000);
        const res  = await fetch('/prizm-node', {
          signal: ctrl.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(tid);
        if (!res.ok) return;
        const data = await res.json();
        const found = PEERS.find(p => p.host === data.host)
          || { host: data.host, port: data.port, label: data.label || data.host };
        if (found.host !== activePeer.host) notify(found);
        else activePeer = { ...found };
      } catch (_) {}
    }

    // Called when a direct-mode request fails — advances to the next peer
    function advanceDirect() {
      directPeerIdx = (directPeerIdx + 1) % PEERS.length;
      const peer = PEERS[directPeerIdx];
      if (peer.host !== activePeer.host) notify(peer);
    }

    // Start background polling of /prizm-node (proxy mode only)
    let _pollingStarted = false;
    function startPolling() {
      if (!isProxy || _pollingStarted) return;
      _pollingStarted = true;
      fetchProxyNode();                            // immediate first fetch
      setInterval(fetchProxyNode, 15000);          // then every 15 s
    }

    return {
      get isProxy() { return isProxy; },
      get activePeer() { return activePeer; },
      get directPeerIdx() { return directPeerIdx; },
      onPeerChange(fn) { listeners.push(fn); },
      advanceDirect,
      startPolling,
      refreshProxyInfo: fetchProxyNode,
    };
  })();

  // ── Base URL logic ────────────────────────────────────────────────────────────
  // Proxy mode  → '/prizm'  (server.js forwards to the active PRIZM node)
  // Direct mode → 'http://{peer}:{port}/prizm'
  function getBase() {
    if (NodeManager.isProxy) return '/prizm';
    const p = PEERS[NodeManager.directPeerIdx];
    return `http://${p.host}:${p.port}/prizm`;
  }

  let corsError = false;

  // ── Core fetch with direct-mode failover ──────────────────────────────────────
  async function get(params, _attempt) {
    _attempt = _attempt || 0;
    const base = getBase();
    const reqUrl = new URL(base, window.location.href);
    Object.entries(params).forEach(([k, v]) => reqUrl.searchParams.set(k, v));

    try {
      const controller = new AbortController();
      const timerId    = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(reqUrl.toString(), {
        method:  'GET',
        headers: { Accept: 'application/json' },
        signal:  controller.signal,
      });
      clearTimeout(timerId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.errorCode && data.errorCode !== 1) {
        throw new Error(data.errorDescription || `API error ${data.errorCode}`);
      }
      corsError = false;
      return data;

    } catch (err) {
      const isNetwork = err instanceof TypeError || err.name === 'AbortError';

      // In direct mode: try next peer on network failure (up to PEERS.length times)
      if (!NodeManager.isProxy && isNetwork && _attempt < PEERS.length - 1) {
        NodeManager.advanceDirect();
        return get(params, _attempt + 1);
      }

      // Show CORS / offline banner
      if (isNetwork) {
        if (!corsError) {
          corsError = true;
          const banner = document.getElementById('cors-banner');
          if (banner) banner.style.display = 'block';
        }
      }

      // Refresh proxy node info so status bar updates after proxy-side failover
      if (NodeManager.isProxy) {
        NodeManager.refreshProxyInfo();
      }

      throw err;
    }
  }

  // ── Server / Network Info ────────────────────────────────────────────────────
  const getBlockchainStatus = () => get({ requestType: 'getBlockchainStatus' });
  const getState            = () => get({ requestType: 'getState' });
  const getTime             = () => get({ requestType: 'getTime' });
  const getConstants        = () => get({ requestType: 'getConstants' });
  const getMyInfo           = () => get({ requestType: 'getMyInfo' });

  // ── Blocks ───────────────────────────────────────────────────────────────────
  const getBlock = (params = {}) => get({ requestType: 'getBlock', ...params });
  const getBlocks = ({ firstIndex = 0, lastIndex = 19, includeTransactions = false } = {}) =>
    get({ requestType: 'getBlocks', firstIndex, lastIndex, includeTransactions });
  const getBlockId = (height) => get({ requestType: 'getBlockId', height });

  // ── Transactions ─────────────────────────────────────────────────────────────
  const getTransaction = (params = {}) => get({ requestType: 'getTransaction', ...params });
  const getExpectedTransactions = () => get({ requestType: 'getExpectedTransactions' });
  const getBlockchainTransactions = (params = {}) =>
    get({ requestType: 'getBlockchainTransactions', ...params });

  // ── Accounts ─────────────────────────────────────────────────────────────────
  const getAccount = (account) => get({ requestType: 'getAccount', account });
  const getBalance = (account) => get({ requestType: 'getBalance', account });
  const getGuaranteedBalance = (account, numberOfConfirmations = 1440) =>
    get({ requestType: 'getGuaranteedBalance', account, numberOfConfirmations });
  const getAccountLedger = ({ account, firstIndex = 0, lastIndex = 49 } = {}) =>
    get({ requestType: 'getAccountLedger', account, firstIndex, lastIndex });
  const getAccountBlocks = ({ account, firstIndex = 0, lastIndex = 19 } = {}) =>
    get({ requestType: 'getAccountBlocks', account, firstIndex, lastIndex });
  const getAccountBlockCount = (account) =>
    get({ requestType: 'getAccountBlockCount', account });
  const searchAccounts = (query) => get({ requestType: 'searchAccounts', query });

  // ── Forging ──────────────────────────────────────────────────────────────────
  const getNextBlockGenerators = (limit = 10) =>
    get({ requestType: 'getNextBlockGenerators', limit });
  const getForging = () => get({ requestType: 'getForging' });

  // ── Peers ────────────────────────────────────────────────────────────────────
  const getPeers = (state = '') => {
    const params = { requestType: 'getPeers', includePeerInfo: true };
    if (state !== '') params.state = state;
    return get(params);
  };
  const getPeer = (peer) => get({ requestType: 'getPeer', peer });
  const getInboundPeers = () => get({ requestType: 'getInboundPeers', includePeerInfo: true });

  // ── Messages ─────────────────────────────────────────────────────────────────
  const getAllPrunableMessages = ({ firstIndex = 0, lastIndex = 49 } = {}) =>
    get({ requestType: 'getAllPrunableMessages', firstIndex, lastIndex });
  const getPrunableMessages = ({ account, firstIndex = 0, lastIndex = 49 } = {}) =>
    get({ requestType: 'getPrunableMessages', account, firstIndex, lastIndex });

  // ── Utilities ────────────────────────────────────────────────────────────────
  const rsConvert  = (account) => get({ requestType: 'rsConvert', account });
  const longConvert = (id)     => get({ requestType: 'longConvert', id });

  // ── External API (api.prizm.vip via /ext-api proxy) ──────────────────────────
  async function extGet(path) {
    const ctrl  = new AbortController();
    const tid   = setTimeout(() => ctrl.abort(), 10000);
    const res   = await fetch('/ext-api' + path, { signal: ctrl.signal });
    clearTimeout(tid);
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
  }

  async function extGetSilent(path) {
    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 8000);
      const res  = await fetch('/ext-api' + path, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!res.ok) return null;
      const text = await res.text();
      try { return JSON.parse(text); } catch { return null; }
    } catch { return null; }
  }

  const STATS_PATHS = {
    general:      ['/stats_general.json', '/general.json', '/prizm_stats_general.json'],
    blocks:       ['/stats_blocks.json', '/block_stats.json'],
    paramining:   ['/stats_paramining.json', '/paramining_stats.json'],
    exchanges:    ['/exchanges.json', '/exchangers.json'],
    transactions: ['/stats_transactions.json', '/tx_stats.json'],
  };

  async function tryStatsEndpoint(key) {
    const paths = STATS_PATHS[key] || [];
    for (const p of paths) {
      const j = await extGetSilent(p);
      if (j && typeof j === 'object' && !Array.isArray(j)) return j;
      if (Array.isArray(j) && j.length) return { rows: j };
    }
    return null;
  }

  async function tryTop100Paramining365() {
    const paths = ['/top100_paramining_365.json', '/top100json_365', '/top365json'];
    for (const p of paths) {
      const j = await extGetSilent(p);
      if (Array.isArray(j) && j.length) return j;
    }
    return null;
  }

  const getSupplyWithPremine = () => extGet('/available_supply_with_premine');
  const getSupplyNoPremine   = () => extGet('/available_supply');
  const getFinalSupply       = () => extGet('/final_supply');
  const getTop100            = () => extGet('/top100json');

  // Start polling proxy node info after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NodeManager.startPolling());
  } else {
    NodeManager.startPolling();
  }

  return {
    // Standard API methods
    getBlockchainStatus, getState, getTime, getConstants, getMyInfo,
    getBlock, getBlocks, getBlockId,
    getTransaction, getExpectedTransactions, getBlockchainTransactions,
    getAccount, getBalance, getGuaranteedBalance,
    getAccountLedger, getAccountBlocks, getAccountBlockCount, searchAccounts,
    getNextBlockGenerators, getForging,
    getPeers, getPeer, getInboundPeers,
    getAllPrunableMessages, getPrunableMessages,
    rsConvert, longConvert,
    getSupplyWithPremine, getSupplyNoPremine, getFinalSupply, getTop100,
    extGet, extGetSilent, tryStatsEndpoint, tryTop100Paramining365,
    // Node management
    NodeManager,
    PEERS,
    /** Returns the currently-active peer object { host, port, label } */
    getCurrentNode: () => NodeManager.activePeer,
    /** Register callback invoked when the active peer changes */
    onPeerChange: (fn) => NodeManager.onPeerChange(fn),
  };
})();
