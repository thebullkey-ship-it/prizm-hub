/* =====================================================
   PRIZM Hub — Transaction Explorer Page
   Module 4: recent TXs, mempool, TX detail modal, type filter
   ===================================================== */

const PageTransactions = (() => {
  let currentFilter = 'all';
  let mempoolInterval = null;

  function filterTypes() {
    const t = I18n.t.bind(I18n);
    return {
      all:     { label: t('tx.filterAll'), type: null },
      payment: { label: t('tx.filterPayment'), type: 0 },
      message: { label: t('tx.filterMessage'), type: 1 },
      account: { label: t('tx.filterAccount'), type: 2 },
    };
  }

  function renderFilters(active) {
    const TX_TYPES = filterTypes();
    return `<div class="tabs mb-6">
      ${Object.entries(TX_TYPES).map(([key, ft]) =>
        `<button class="tab ${active === key ? 'active' : ''}" onclick="PageTransactions.setFilter('${key}')">${Utils.esc(ft.label)}</button>`
      ).join('')}
    </div>`;
  }

  // ---- TX Table ----
  function renderTxTable(txs) {
    const t = I18n.t.bind(I18n);
    const TX_TYPES = filterTypes();
    if (!txs || !txs.length) {
      return `<div class="empty-state"><div class="empty-state__icon">📋</div><div class="empty-state__title">${Utils.esc(t('tx.empty'))}</div></div>`;
    }

    const filtered = currentFilter === 'all'
      ? txs
      : txs.filter(tx => tx.type === TX_TYPES[currentFilter]?.type);

    if (!filtered.length) {
      return `<div class="empty-state"><div class="empty-state__icon">🔍</div><div class="empty-state__title">${Utils.esc(t('tx.emptyFiltered'))}</div></div>`;
    }

    const rows = filtered.map(tx => {
      const type = Utils.txTypeLabel(tx.type);
      const confirmed = tx.confirmations != null ? tx.confirmations : '—';
      return `<tr onclick="PageTransactions.openTxModal('${Utils.esc(tx.transaction)}')" style="cursor:pointer">
        <td><span class="addr" style="max-width:none">${Utils.shorten(tx.transaction, 10, 10)}</span></td>
        <td>${type.icon} ${type.label}</td>
        <td><span class="addr" onclick="event.stopPropagation();Router.navigate('/accounts?account=${Utils.esc(tx.senderRS || tx.sender)}')">${Utils.esc(Utils.shortenRS(tx.senderRS))}</span></td>
        <td><span class="addr" onclick="event.stopPropagation();Router.navigate('/accounts?account=${Utils.esc(tx.recipientRS || tx.recipient)}')">${Utils.esc(Utils.shortenRS(tx.recipientRS) || '—')}</span></td>
        <td class="text-mono">${Utils.formatPzm(tx.amountNQT)}</td>
        <td class="text-mono text-sm">${Utils.formatPzm(tx.feeNQT)}</td>
        <td class="text-faint text-sm">${Utils.formatBcTime(tx.timestamp, { relative: true })}</td>
        <td>${tx.block ? Utils.blockLink(tx.height) : '<span class="badge badge--warning">' + Utils.esc(t('tx.mempoolBadge')) + '</span>'}</td>
        <td><span class="badge badge--${Number(confirmed) > 10 ? 'success' : Number(confirmed) > 0 ? 'warning' : 'neutral'}">${confirmed}</span></td>
      </tr>`;
    }).join('');

    return `<div class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>${Utils.esc(t('tx.table.id'))}</th><th>${Utils.esc(t('tx.table.type'))}</th><th>${Utils.esc(t('tx.table.sender'))}</th><th>${Utils.esc(t('tx.table.recipient'))}</th><th>${Utils.esc(t('tx.table.amount'))}</th><th>${Utils.esc(t('tx.table.fee'))}</th><th>${Utils.esc(t('tx.table.time'))}</th><th>${Utils.esc(t('tx.table.block'))}</th><th>${Utils.esc(t('tx.table.conf'))}</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  // ---- Mempool Table ----
  function renderMempoolTable(txs) {
    const t = I18n.t.bind(I18n);
    if (!txs || !txs.length) {
      return `<div class="empty-state" style="padding:24px"><div class="empty-state__icon">✅</div><div class="empty-state__title">${Utils.esc(t('tx.mempool.emptyTitle'))}</div><div class="empty-state__sub">${Utils.esc(t('tx.mempool.emptySub'))}</div></div>`;
    }
    const rows = txs.map(tx => {
      const type = Utils.txTypeLabel(tx.type);
      return `<tr onclick="PageTransactions.openTxModal('${Utils.esc(tx.transaction)}')" style="cursor:pointer">
        <td><span class="addr">${Utils.shorten(tx.transaction)}</span></td>
        <td>${type.icon} ${type.label}</td>
        <td class="text-mono">${Utils.formatPzm(tx.amountNQT)}</td>
        <td class="text-mono text-sm">${Utils.formatPzm(tx.feeNQT)}</td>
        <td><span class="addr">${Utils.esc(Utils.shortenRS(tx.senderRS))}</span></td>
      </tr>`;
    }).join('');

    return `<div class="table-wrap">
      <table class="table">
        <thead><tr><th>${Utils.esc(t('tx.mempool.shortId'))}</th><th>${Utils.esc(t('tx.table.type'))}</th><th>${Utils.esc(t('tx.table.amount'))}</th><th>${Utils.esc(t('tx.table.fee'))}</th><th>${Utils.esc(t('tx.table.sender'))}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  // ---- TX Detail Modal ----
  async function openTxModal(txId) {
    App.openModal(I18n.t('tx.modalTitle'), `<div class="page-loading" style="height:160px"><div class="spinner"></div></div>`);
    try {
      const tx = await API.getTransaction({ transaction: txId });
      renderTxModal(tx);
    } catch (err) {
      document.getElementById('modal-body').innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">⚠️</div>
          <div class="empty-state__sub">${Utils.esc(err.message)}</div>
        </div>`;
    }
  }

  function renderTxModal(tx) {
    const t = I18n.t.bind(I18n);
    document.getElementById('modal-title').textContent = t('tx.modalTitle');
    const type = Utils.txTypeLabel(tx.type);
    document.getElementById('modal-body').innerHTML = `
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('explorer.table.txId'))}</span><span class="detail-row__value mono">${Utils.esc(tx.transaction)}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('tx.detail.hash'))}</span><span class="detail-row__value mono text-xs">${Utils.esc(tx.fullHash || '—')}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('tx.table.type'))}</span><span class="detail-row__value">${type.icon} ${type.label}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('explorer.detail.time'))}</span><span class="detail-row__value">${Utils.formatBcTime(tx.timestamp)}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('tx.table.sender'))}</span>
          <span class="detail-row__value"><span class="addr addr--full" onclick="App.closeModal();Router.navigate('/accounts?account=${Utils.esc(tx.senderRS)}')">${Utils.esc(tx.senderRS)}</span></span>
        </div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('tx.table.recipient'))}</span>
          <span class="detail-row__value">${tx.recipientRS ? `<span class="addr addr--full" onclick="App.closeModal();Router.navigate('/accounts?account=${Utils.esc(tx.recipientRS)}')">${Utils.esc(tx.recipientRS)}</span>` : '—'}</span>
        </div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('tx.table.amount'))}</span><span class="detail-row__value mono">${Utils.formatPzm(tx.amountNQT)}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('tx.table.fee'))}</span><span class="detail-row__value mono">${Utils.formatPzm(tx.feeNQT)}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('tx.detail.block'))}</span>
          <span class="detail-row__value">${tx.block ? `<span class="addr" onclick="App.closeModal();PageExplorer.openBlockById('${Utils.esc(tx.block)}')">#${Utils.formatNum(tx.height)}</span>` : '<span class="badge badge--warning">' + Utils.esc(t('tx.detail.unconfirmed')) + '</span>'}</span>
        </div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('tx.detail.confirms'))}</span><span class="detail-row__value">${tx.confirmations ?? '—'}</span></div>
        ${tx.attachment?.message ? `<div class="detail-row"><span class="detail-row__label">${Utils.esc(t('tx.detail.message'))}</span><span class="detail-row__value" style="color:var(--text-muted)">${Utils.esc(tx.attachment.message)}</span></div>` : ''}
      </div>
      <div style="margin-top:16px;display:flex;gap:8px">
        <button class="btn btn--outline btn--sm" onclick="Utils.copyToClipboard('${Utils.esc(tx.transaction)}','TX ID')">${Utils.esc(t('tx.copyId'))}</button>
        <button class="btn btn--ghost btn--sm" onclick="App.closeModal()">${Utils.esc(t('tx.close'))}</button>
      </div>
    `;
  }

  // ---- Load recent TXs from blocks ----
  async function loadRecentTxs() {
    const tableBody = document.getElementById('tx-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = `<div class="page-loading" style="height:160px"><div class="spinner"></div></div>`;

    try {
      // Get last 5 blocks with transactions
      const blocks = await API.getBlocks({ firstIndex: 0, lastIndex: 4, includeTransactions: true });
      const blockList = blocks.blocks || [];
      const allTxs = [];
      blockList.forEach(b => {
        const txs = b.transactions || [];
        txs.forEach(tx => {
          tx.blockHeight = b.height;
          allTxs.push(tx);
        });
      });
      allTxs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      tableBody.innerHTML = renderTxTable(allTxs);
      document.getElementById('tx-count-badge').textContent = allTxs.length;
    } catch(err) {
      tableBody.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__sub">${Utils.esc(err.message)}</div></div>`;
    }
  }

  // ---- Load mempool ----
  async function loadMempool() {
    const mempoolBody = document.getElementById('mempool-body');
    if (!mempoolBody) return;

    try {
      const data = await API.getExpectedTransactions();
      const txs = data.transactions || [];
      mempoolBody.innerHTML = renderMempoolTable(txs);
      const badge = document.getElementById('mempool-count');
      if (badge) badge.textContent = txs.length;
    } catch(err) {
      mempoolBody.innerHTML = `<div class="empty-state" style="padding:24px"><div class="empty-state__sub">${Utils.esc(err.message)}</div></div>`;
    }
  }

  function setFilter(key) {
    currentFilter = key;
    // Re-render filter tabs
    const filterContainer = document.getElementById('tx-filter-container');
    if (filterContainer) filterContainer.innerHTML = renderFilters(key);
    loadRecentTxs();
  }

  async function render(params) {
    const outlet = document.getElementById('router-outlet');
    const txParam = params && params.tx;

    const tr = I18n.t.bind(I18n);
    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(tr('tx.pageTitle'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(tr('tx.pageSubtitle'))}</p>
      </div>

      <div class="grid-2-1">
        <div class="card">
          <div class="card__header">
            <span class="card__title">${Utils.esc(tr('tx.recentTitle'))} <span class="badge badge--primary" id="tx-count-badge">—</span></span>
            <button class="btn btn--ghost btn--sm" onclick="PageTransactions.loadRecentTxs()">${Utils.esc(tr('tx.refresh'))}</button>
          </div>
          <div id="tx-filter-container">${renderFilters(currentFilter)}</div>
          <div id="tx-table-body">
            <div class="page-loading" style="height:160px"><div class="spinner"></div></div>
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <span class="card__title">${Utils.esc(tr('tx.mempoolTitle'))} <span class="badge badge--warning" id="mempool-count">—</span></span>
            <button class="btn btn--ghost btn--sm" onclick="PageTransactions.loadMempool()">⟳</button>
          </div>
          <div id="mempool-body">
            <div class="page-loading" style="height:120px"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    `;

    await Promise.all([loadRecentTxs(), loadMempool()]);

    // Auto-refresh mempool every 30 seconds
    mempoolInterval = setInterval(loadMempool, 30000);

    // If TX param in URL, auto-open modal
    if (txParam) {
      openTxModal(txParam);
    }

    return () => clearInterval(mempoolInterval);
  }

  return { render, openTxModal, loadRecentTxs, loadMempool, setFilter };
})();
