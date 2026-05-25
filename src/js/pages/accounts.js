/* =====================================================
   PRIZM Hub — Account Analytics Page
   Module 3: search, balance cards, TX history,
             ledger chart, forging stats
   ===================================================== */

const PageAccounts = (() => {
  let ledgerChart = null;
  let txPage = 0;
  const TX_PAGE_SIZE = 20;
  let currentAccount = null;

  // ---- Search form ----
  function renderSearchForm(query = '') {
    const t = I18n.t.bind(I18n);
    return `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('accounts.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('accounts.subtitle'))}</p>
      </div>
      <div class="card section-gap">
        <div class="search-bar">
          <input class="input" id="account-input" placeholder="${Utils.esc(t('accounts.placeholder'))}"
            value="${Utils.esc(query)}" onkeydown="if(event.key==='Enter')PageAccounts.search()" />
          <button class="btn btn--primary" onclick="PageAccounts.search()">${Utils.esc(t('accounts.find'))}</button>
        </div>
        <div id="search-results"></div>
      </div>
      <div id="account-profile"></div>
    `;
  }

  async function search() {
    const q = document.getElementById('account-input').value.trim();
    if (!q) return;
    const resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = `<div class="flex-center" style="padding:24px"><div class="spinner"></div></div>`;

    // Try exact account lookup first
    try {
      const acc = await API.getAccount(q);
      if (acc && (acc.account || acc.accountRS)) {
        resultsEl.innerHTML = '';
        loadAccountProfile(acc.accountRS || acc.account);
        return;
      }
    } catch (e) {}

    // Try search by name
    try {
      const res = await API.searchAccounts(q);
      const accs = res.accounts || [];
      if (accs.length === 0) {
        resultsEl.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🔍</div><div class="empty-state__title">${Utils.esc(I18n.t('accounts.notFound'))}</div></div>`;
        return;
      }
      const t = I18n.t.bind(I18n);
      resultsEl.innerHTML = `
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>${Utils.esc(t('accounts.table.addr'))}</th><th>${Utils.esc(t('accounts.table.name'))}</th><th>${Utils.esc(t('accounts.table.desc'))}</th></tr></thead>
            <tbody>
              ${accs.map(a => `<tr onclick="PageAccounts.loadAccountProfile('${Utils.esc(a.accountRS || a.account)}')" style="cursor:pointer">
                <td><span class="addr">${Utils.esc(Utils.shortenRS(a.accountRS))}</span></td>
                <td>${Utils.esc(a.name || '—')}</td>
                <td class="text-faint text-sm">${Utils.esc((a.description || '').slice(0, 60))}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch (err) {
      resultsEl.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__sub">${Utils.esc(err.message)}</div></div>`;
    }
  }

  // ---- Balance Cards ----
  function renderBalanceCards(acc) {
    const t = I18n.t.bind(I18n);
    const cards = [
      { label: t('accounts.balance.confirmed'), value: Utils.formatPzm(acc.balanceNQT), icon: '✅', color: '#10b981' },
      { label: t('accounts.balance.unconfirmed'), value: Utils.formatPzm(acc.unconfirmedBalanceNQT), icon: '⏳', color: '#f59e0b' },
      { label: t('accounts.balance.effective'), value: `${Utils.formatNum(acc.effectiveBalancePrizm)} PZM`, icon: '⚡', color: '#9333ea' },
      { label: t('accounts.balance.forged'), value: Utils.formatPzm(acc.forgedBalanceNQT), icon: '💰', color: '#3b82f6' },
    ];
    return `<div class="stats-grid mb-6">
      ${cards.map(c => `
        <div class="stat-card" style="--accent-color:${c.color}">
          <div class="stat-card__icon" style="background:${c.color}22">${c.icon}</div>
          <div class="stat-card__label">${Utils.esc(c.label)}</div>
          <div class="stat-card__value" style="color:${c.color};font-size:18px">${Utils.esc(c.value)}</div>
        </div>`).join('')}
    </div>`;
  }

  // ---- TX History Table ----
  function renderTxTable(txs, accRS) {
    const t = I18n.t.bind(I18n);
    if (!txs || !txs.length) {
      return `<div class="empty-state"><div class="empty-state__icon">📋</div><div class="empty-state__title">${Utils.esc(t('accounts.tx.empty'))}</div></div>`;
    }
    const rows = txs.map(tx => {
      const isOut = tx.senderRS === accRS || tx.sender === accRS;
      const type = Utils.txTypeLabel(tx.type);
      const counterpart = isOut
        ? (tx.recipientRS || tx.recipient || '—')
        : (tx.senderRS || tx.sender || '—');
      return `<tr onclick="PageTransactions.openTxModal('${Utils.esc(tx.transaction)}')" style="cursor:pointer">
        <td><span class="addr">${Utils.shorten(tx.transaction)}</span></td>
        <td>${type.icon} ${type.label}</td>
        <td><span class="badge badge--${isOut ? 'danger' : 'success'}">${isOut ? Utils.esc(t('accounts.tx.dirOut')) : Utils.esc(t('accounts.tx.dirIn'))}</span></td>
        <td class="text-mono">${Utils.formatPzm(tx.amountNQT)}</td>
        <td class="text-mono text-sm">${Utils.formatPzm(tx.feeNQT)}</td>
        <td><span class="addr" onclick="event.stopPropagation();Router.navigate('/accounts?account=${Utils.esc(counterpart)}')">${Utils.esc(Utils.shortenRS(counterpart))}</span></td>
        <td class="text-faint text-sm">${Utils.formatBcTime(tx.timestamp, { relative: true })}</td>
        <td><span class="badge badge--${tx.confirmations > 0 ? 'success' : 'warning'}">${tx.confirmations || 0}</span></td>
      </tr>`;
    }).join('');

    return `<div class="table-wrap">
      <table class="table">
        <thead><tr><th>${Utils.esc(t('accounts.tx.col.id'))}</th><th>${Utils.esc(t('accounts.tx.col.type'))}</th><th>${Utils.esc(t('accounts.tx.col.dir'))}</th><th>${Utils.esc(t('accounts.tx.col.amount'))}</th><th>${Utils.esc(t('accounts.tx.col.fee'))}</th><th>${Utils.esc(t('accounts.tx.col.cp'))}</th><th>${Utils.esc(t('accounts.tx.col.time'))}</th><th>${Utils.esc(t('accounts.tx.col.conf'))}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  // ---- Ledger Chart ----
  async function renderLedgerChart(account) {
    const canvas = document.getElementById('ledger-chart');
    if (!canvas) return;
    if (ledgerChart) { try { ledgerChart.destroy(); } catch(e){} }

    try {
      const data = await API.getAccountLedger({ account, firstIndex: 0, lastIndex: 99 });
      const entries = (data.entries || []).reverse();
      if (!entries.length) return;

      const labels = entries.map(e => Utils.formatBcTime(e.timestamp, { relative: false }).slice(0, 10));
      const balances = entries.map(e => Utils.nqtToPzm(e.balance));

      const def = Utils.chartDefaults();
      ledgerChart = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: I18n.t('accounts.chart.balance'),
            data: balances,
            borderColor: '#9333ea',
            backgroundColor: 'rgba(147,51,234,0.12)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            fill: true,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { ...def.plugins, legend: { display: false } },
          scales: {
            x: { ...def.scales.x, ticks: { ...def.scales.x.ticks, maxTicksLimit: 6, maxRotation: 0 } },
            y: { ...def.scales.y, beginAtZero: false }
          }
        }
      });
    } catch(e) { /* silently skip */ }
  }

  // ---- Load full account profile ----
  async function loadAccountProfile(address) {
    currentAccount = address;
    txPage = 0;
    const profileEl = document.getElementById('account-profile');
    if (!profileEl) return;
    profileEl.innerHTML = `<div class="page-loading" style="height:200px"><div class="spinner"></div></div>`;

    try {
      const [acc, blockCount] = await Promise.all([
        API.getAccount(address),
        API.getAccountBlockCount(address).catch(() => ({ numberOfBlocks: 0 }))
      ]);

      const t = I18n.t.bind(I18n);
      profileEl.innerHTML = `
        <div class="card section-gap">
          <div class="card__header">
            <div>
              <div class="flex gap-3 mb-4" style="align-items:center">
                <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#9333ea,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:20px">👤</div>
                <div>
                  <div style="font-size:16px;font-weight:700">${Utils.esc(acc.name || t('accounts.profile.defaultName'))}</div>
                  <div class="addr addr--full" style="cursor:pointer;font-size:12px" onclick="Utils.copyToClipboard('${Utils.esc(acc.accountRS)}')" title="${Utils.esc(t('accounts.profile.copyTitle'))}">${Utils.esc(acc.accountRS)}</div>
                </div>
              </div>
              ${acc.description ? `<p class="text-muted text-sm" style="margin-bottom:12px">${Utils.esc(acc.description)}</p>` : ''}
            </div>
            <div class="flex gap-2">
              <button class="btn btn--outline btn--sm" onclick="Router.navigate('/messages?account=${Utils.esc(acc.accountRS)}')">${Utils.esc(t('accounts.profile.messagesBtn'))}</button>
              <span class="badge badge--${blockCount.numberOfBlocks > 0 ? 'success' : 'neutral'}">${Utils.esc(t('accounts.profile.blocksBadge', { n: Utils.formatNum(blockCount.numberOfBlocks) }))}</span>
            </div>
          </div>

          ${renderBalanceCards(acc)}

          <div class="grid-1-2">
            <div>
              <div class="card__title mb-4">${Utils.esc(t('accounts.profile.balanceDyn'))}</div>
              <div class="chart-wrap" style="height:200px">
                <canvas id="ledger-chart"></canvas>
              </div>
            </div>
            <div>
              <div class="card__title mb-4">${Utils.esc(t('accounts.profile.details'))}</div>
              <div class="detail-grid">
                <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('accounts.profile.numericId'))}</span><span class="detail-row__value mono">${Utils.esc(acc.account)}</span></div>
                <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('accounts.profile.pubkey'))}</span><span class="detail-row__value mono text-xs truncate">${Utils.esc(acc.publicKey || '—')}</span></div>
                <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('accounts.profile.guaranteed'))}</span><span class="detail-row__value mono">${Utils.formatPzm(acc.guaranteedBalanceNQT)}</span></div>
                <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('accounts.profile.forgedBlocks'))}</span><span class="detail-row__value">${Utils.formatNum(blockCount.numberOfBlocks)}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="card" id="tx-card">
          <div class="card__header">
            <span class="card__title">${Utils.esc(t('accounts.historyTitle'))}</span>
            <div class="flex gap-2">
              <button class="btn btn--ghost btn--sm" id="tx-prev-btn" onclick="PageAccounts.loadTxPage(-1)" disabled>${Utils.esc(t('explorer.prev'))}</button>
              <span class="pagination__info" id="tx-page-info">${Utils.esc(t('pagination.pageOnly', { n: 1 }))}</span>
              <button class="btn btn--ghost btn--sm" id="tx-next-btn" onclick="PageAccounts.loadTxPage(1)">${Utils.esc(t('explorer.next'))}</button>
            </div>
          </div>
          <div id="tx-table-body">
            <div class="page-loading" style="height:120px"><div class="spinner"></div></div>
          </div>
        </div>
      `;

      // Load ledger chart and first tx page in parallel
      await Promise.all([
        renderLedgerChart(acc.accountRS || address),
        loadTxPage(0, acc.accountRS || address, true)
      ]);

    } catch (err) {
      profileEl.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__title">${Utils.esc(I18n.t('accounts.loadError'))}</div><div class="empty-state__sub">${Utils.esc(err.message)}</div></div>`;
    }
  }

  async function loadTxPage(direction, address, isFirst = false) {
    if (!isFirst) txPage = Math.max(0, txPage + direction);
    const addr = address || currentAccount;
    if (!addr) return;

    const tableBody = document.getElementById('tx-table-body');
    if (tableBody) tableBody.innerHTML = `<div class="page-loading" style="height:120px"><div class="spinner"></div></div>`;

    const firstIndex = txPage * TX_PAGE_SIZE;
    const lastIndex  = firstIndex + TX_PAGE_SIZE - 1;

    try {
      const data = await API.getBlockchainTransactions({ account: addr, firstIndex, lastIndex });
      const txs = data.transactions || [];
      if (tableBody) {
        const accData = await API.getAccount(addr).catch(() => ({ accountRS: addr }));
        tableBody.innerHTML = renderTxTable(txs, accData.accountRS || addr);
      }

      const prevBtn = document.getElementById('tx-prev-btn');
      const nextBtn = document.getElementById('tx-next-btn');
      const info    = document.getElementById('tx-page-info');
      if (prevBtn) prevBtn.disabled = txPage === 0;
      if (nextBtn) nextBtn.disabled = txs.length < TX_PAGE_SIZE;
      if (info)    info.textContent = I18n.t('pagination.pageOnly', { n: txPage + 1 });
    } catch(err) {
      if (tableBody) tableBody.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__sub">${Utils.esc(err.message)}</div></div>`;
    }
  }

  async function render(params) {
    const outlet = document.getElementById('router-outlet');
    const accountParam = params && params.account;

    outlet.innerHTML = renderSearchForm(accountParam || '');

    if (accountParam) {
      document.getElementById('account-input').value = accountParam;
      loadAccountProfile(accountParam);
    }
  }

  return { render, search, loadAccountProfile, loadTxPage };
})();
