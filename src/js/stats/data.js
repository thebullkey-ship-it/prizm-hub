/** Load historical JSON from /baze/ (static files on server). */
const StatsData = (() => {
  const cache = {};

  async function fetchBaze(path) {
    const key = path.replace(/^\/+/, '');
    if (cache[key] !== undefined) return cache[key];
    const url = '/baze/' + key;
    try {
      const res = await fetch(url, { cache: 'no-cache', headers: { Accept: 'application/json' } });
      if (!res.ok) {
        cache[key] = null;
        return null;
      }
      const ct = res.headers.get('content-type') || '';
      const text = await res.text();
      if (ct.includes('text/html') || text.trim().startsWith('<!')) {
        cache[key] = null;
        return null;
      }
      const json = JSON.parse(text);
      cache[key] = json;
      return json;
    } catch (_) {
      cache[key] = null;
      return null;
    }
  }

  function clearCache() {
    Object.keys(cache).forEach((k) => delete cache[k]);
  }

  /** paraindicator.top serves day-keyed objects at root; legacy code used `.data`. */
  function wrapDaySeries(json) {
    if (!json || typeof json !== 'object') return null;
    if (json.data && typeof json.data === 'object') return json;
    return { data: json };
  }

  async function loadExchangersHistory() {
    return wrapDaySeries(await fetchBaze('exchangers_history'));
  }

  async function loadMainHistory() {
    const cats = StatsConstants.MAIN_TABLE_CATEGORIES;
    const out = {};
    await Promise.all(cats.map(async (name) => {
      out[name] = await fetchBaze('history/' + name);
    }));
    return out;
  }

  async function loadBlocksHistory() { return wrapDaySeries(await fetchBaze('blocks_history')); }
  async function loadTimeBlocksHistory() { return wrapDaySeries(await fetchBaze('block_times_history')); }
  async function loadTransactionsHistory() { return wrapDaySeries(await fetchBaze('transactions_history')); }
  async function loadOldWalletsHistory() { return wrapDaySeries(await fetchBaze('old_wallets_history')); }
  async function loadParHistory() { return wrapDaySeries(await fetchBaze('par_history')); }
  async function loadTop100() {
    const top100 = await fetchBaze('top100');
    const top100All = await fetchBaze('top100All');
    return { top100, top100All };
  }
  async function loadMainWallets() { return fetchBaze('mainWallets'); }

  return {
    fetchBaze, clearCache,
    loadExchangersHistory, loadMainHistory, loadBlocksHistory, loadTimeBlocksHistory,
    loadTransactionsHistory, loadOldWalletsHistory, loadParHistory, loadTop100, loadMainWallets,
  };
})();
