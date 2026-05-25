/* =====================================================
   PRIZM Hub — Utility Functions
   ===================================================== */

const Utils = (() => {

  // PRIZM genesis block epoch (seconds since Unix epoch)
  // We fetch it lazily from the API; fallback to known value
  let GENESIS_TS_MS = 1459382400000; // 2016-03-31 00:00:00 UTC (approximate)

  function setGenesisTs(epochSecondsFromApiGetTime, blockchainTimestamp) {
    // The API getTime returns seconds from genesis. If we also know wall clock,
    // we can calculate: genesisMs = Date.now() - blockchainTimestamp * 1000
    // But we rely on a simpler heuristic: use getBlock height=0 timestamp field
    // which is 0 by convention. We'll keep the default.
  }

  function setGenesisFromBlock0(block0TimestampSeconds) {
    // Genesis block has timestamp=0, so genesis = now - (currentBcTime * 1000)
    // Unused but kept for future calibration
  }

  /** Convert blockchain seconds (from genesis) to JavaScript Date */
  function bcTimeToDate(seconds) {
    return new Date(GENESIS_TS_MS + seconds * 1000);
  }

  /** Format blockchain seconds to human-readable string */
  function formatBcTime(seconds, opts = {}) {
    if (seconds == null) return '—';
    const d = bcTimeToDate(seconds);
    if (opts.relative) return timeAgo(d);
    return d.toLocaleString(typeof I18n !== 'undefined' ? I18n.getBcp47() : 'en-US', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  /** Time-ago string */
  function timeAgo(date) {
    const now = Date.now();
    const diff = Math.floor((now - date.getTime()) / 1000);
    const T = typeof I18n !== 'undefined' ? I18n.t.bind(I18n) : null;
    if (diff < 60)   return T ? T('time.secAgo', { n: diff }) : `${diff}s ago`;
    if (diff < 3600) return T ? T('time.minAgo', { n: Math.floor(diff / 60) }) : `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return T ? T('time.hourAgo', { n: Math.floor(diff / 3600) }) : `${Math.floor(diff / 3600)} h ago`;
    return T ? T('time.dayAgo', { n: Math.floor(diff / 86400) }) : `${Math.floor(diff / 86400)} d ago`;
  }

  /** Convert NQT to PRIZM (1 PZM = 100 NQT) */
  function nqtToPzm(nqt) {
    if (nqt == null || nqt === '') return 0;
    return Number(nqt) / 100;
  }

  /** Format NQT as PZM with commas */
  function formatPzm(nqt, decimals = 2) {
    const pzm = nqtToPzm(nqt);
    if (pzm === 0) return '0 PZM';
    const loc = typeof I18n !== 'undefined' ? I18n.getBcp47() : 'en-US';
    return pzm.toLocaleString(loc, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + ' PZM';
  }

  /** Format large numbers with suffix (K, M, B) */
  function formatNum(n) {
    n = Number(n);
    if (isNaN(n)) return '—';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    const loc = typeof I18n !== 'undefined' ? I18n.getBcp47() : 'en-US';
    return n.toLocaleString(loc);
  }

  /** Shorten a hash or address for display */
  function shorten(str, front = 8, back = 8) {
    if (!str) return '—';
    if (str.length <= front + back + 3) return str;
    return `${str.slice(0, front)}...${str.slice(-back)}`;
  }

  /** Shorten Reed-Solomon address (PRIZM-XXXX-XXXX-XXXX-XXXXX) */
  function shortenRS(rs) {
    if (!rs) return '—';
    if (!rs.startsWith('PRIZM-')) return shorten(rs);
    const parts = rs.split('-');
    if (parts.length < 3) return rs;
    return `${parts[0]}-${parts[1]}-...-${parts[parts.length - 1]}`;
  }

  /** Determine TX type label */
  function txTypeLabel(type, subtype) {
    const T = typeof I18n !== 'undefined' ? I18n.t.bind(I18n) : null;
    const map = {
      '0': { label: T ? T('tx.type0') : 'Payment', icon: '💸' },
      '1': { label: T ? T('tx.type1') : 'Message', icon: '💬' },
      '2': { label: T ? T('tx.type2') : 'Account', icon: '👤' },
    };
    return map[String(type)] || { label: `Type ${type}`, icon: '📄' };
  }

  /** Peer state label */
  function peerStateLabel(state) {
    const T = typeof I18n !== 'undefined' ? I18n.t.bind(I18n) : null;
    const map = T
      ? { 0: T('peer.state0'), 1: T('peer.state1'), 2: T('peer.state2') }
      : { 0: 'Disconnected', 1: 'Connected', 2: 'Disconnected' };
    return map[state] ?? (T ? T('peer.unknown') : 'Unknown');
  }

  /** Peer state CSS class */
  function peerStateClass(state) {
    const map = { 0: 'peer-dot--none', 1: 'peer-dot--connected', 2: 'peer-dot--disconnected' };
    return map[state] ?? 'peer-dot--none';
  }

  /** Format bytes to KB/MB */
  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1048576).toFixed(2)} MB`;
  }

  /** Copy text to clipboard and show toast */
  function copyToClipboard(text, label) {
    const def = typeof I18n !== 'undefined' ? I18n.t('copy.defaultLabel') : 'Copied';
    const lbl = label != null ? label : def;
    const msg = typeof I18n !== 'undefined' ? I18n.t('copy.done', { label: lbl }) : `${lbl}: copied`;
    navigator.clipboard.writeText(text).then(() => {
      App.toast(msg, 'success');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      App.toast(msg, 'success');
    });
  }

  /** HTML-escape a string */
  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Create a clickable address span */
  function addrLink(rs, numeric, opts = {}) {
    const display = opts.full ? esc(rs || numeric) : esc(shortenRS(rs) || shorten(numeric));
    const target = rs || numeric || '';
    return `<span class="addr" title="${esc(rs || numeric)}" onclick="Router.navigate('/accounts?account=${esc(target)}')">${display}</span>`;
  }

  /** Create a clickable hash span */
  function txLink(txId) {
    return `<span class="addr" title="${esc(txId)}" onclick="PageTransactions.openTxModal('${esc(txId)}')">${shorten(txId)}</span>`;
  }

  /** Create a clickable block height span */
  function blockLink(height) {
    return `<span class="addr" onclick="PageExplorer.openBlockByHeight(${height})">#${formatNum(height)}</span>`;
  }

  /** Countdown string from seconds */
  function countdown(seconds) {
    if (seconds <= 0) return typeof I18n !== 'undefined' ? I18n.t('time.countdownSec', { s: 0 }) : '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (typeof I18n !== 'undefined') {
      if (m > 0) return I18n.t('time.countdown', { m, s });
      return I18n.t('time.countdownSec', { s });
    }
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  /** Debounce function */
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  /** Detect if input looks like a RS address, TX hash, or block height */
  function detectSearchType(query) {
    query = query.trim();
    if (/^PRIZM-/i.test(query))        return 'account_rs';
    if (/^\d{15,20}$/.test(query))     return 'account_id';
    if (/^\d{1,10}$/.test(query))      return 'block_height';
    if (/^[0-9a-f]{64}$/i.test(query)) return 'tx_hash';
    if (/^\d{10,20}$/.test(query))     return 'tx_id';
    return 'unknown';
  }

  /** Generate chart defaults compatible with dark theme */
  const CHART_FONT =
    "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif";

  function chartDefaults() {
    return {
      color: '#a1a1aa',
      borderColor: 'rgba(147,51,234,0.2)',
      plugins: {
        legend: { labels: { color: '#a1a1aa', font: { family: CHART_FONT, size: 12 } } },
        tooltip: {
          backgroundColor: 'rgba(13,13,24,0.92)',
          borderColor: 'rgba(147,51,234,0.35)',
          borderWidth: 1,
          titleColor: '#f4f4f5',
          bodyColor: '#a1a1aa',
          padding: 12,
        }
      },
      scales: {
        x: {
          ticks: { color: '#52525b', font: { family: CHART_FONT, size: 11 } },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          ticks: { color: '#52525b', font: { family: CHART_FONT, size: 11 } },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    };
  }

  /** Date range bar (read-only until stats API accepts range) */
  function statsDateRangeBar(dateFrom, dateTo) {
    const a = dateFrom || new Date().toISOString().slice(0, 10);
    const b = dateTo || a;
    const T = typeof I18n !== 'undefined' ? I18n.t.bind(I18n) : (k) => k;
    return `<div class="stats-date-bar card card--flat">
      <div class="stats-date-bar__row">
        <span class="text-sm text-muted">${esc(T('stats.period'))}</span>
        <label class="text-sm">${esc(T('stats.dateFrom'))} <input type="date" class="input-inline" value="${esc(a)}" readonly /></label>
        <label class="text-sm">${esc(T('stats.dateTo'))} <input type="date" class="input-inline" value="${esc(b)}" readonly /></label>
      </div>
      <p class="text-xs text-faint stats-date-bar__hint">${T('stats.dateHint')}</p>
    </div>`;
  }

  function statsApiPendingNote() {
    const T = typeof I18n !== 'undefined' ? I18n.t.bind(I18n) : (k) => k;
    return `<div class="card card--flat stats-pending">
      <p class="text-sm text-muted">${T('stats.apiPending')}</p>
    </div>`;
  }

  function deltaClass(n) {
    if (n == null || n === '') return '';
    const v = Number(n);
    if (Number.isNaN(v)) return '';
    if (v > 0) return 'delta--up';
    if (v < 0) return 'delta--down';
    return '';
  }

  function paginationBar({ page, pageCount, basePath }) {
    if (!pageCount || pageCount <= 1) return '';
    const p = Math.max(1, Math.min(page, pageCount));
    const prev = Math.max(1, p - 1);
    const next = Math.min(pageCount, p + 1);
    const path = String(basePath || '/');
    const T = typeof I18n !== 'undefined' ? I18n.t.bind(I18n) : null;
    const pageLbl = T ? T('pagination.page', { cur: p, total: pageCount }) : `Pg. ${p} / ${pageCount}`;
    const backLbl = T ? T('pagination.back') : 'Back';
    const fwdLbl = T ? T('pagination.forward') : 'Next';
    return `<div class="pagination-bar">
      <span class="text-xs text-muted">${esc(pageLbl)}</span>
      <div class="flex gap-2">
        <button type="button" class="btn btn--sm btn--outline" ${p <= 1 ? 'disabled' : ''} onclick="Router.navigate('${path}?p=${prev}')">${esc(backLbl)}</button>
        <button type="button" class="btn btn--sm btn--outline" ${p >= pageCount ? 'disabled' : ''} onclick="Router.navigate('${path}?p=${next}')">${esc(fwdLbl)}</button>
      </div>
    </div>`;
  }

  return {
    bcTimeToDate, formatBcTime, timeAgo, nqtToPzm, formatPzm, formatNum,
    shorten, shortenRS, txTypeLabel, peerStateLabel, peerStateClass,
    formatBytes, copyToClipboard, esc, addrLink, txLink, blockLink,
    countdown, debounce, detectSearchType, chartDefaults,
    setGenesisTs, GENESIS_TS_MS,
    statsDateRangeBar, statsApiPendingNote, deltaClass, paginationBar,
  };
})();
