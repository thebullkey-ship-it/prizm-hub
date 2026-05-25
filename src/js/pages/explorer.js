/* =====================================================
   PRIZM Hub — Blockchain Explorer Page
   Module 2: paginated blocks, block detail, TPS chart
   ===================================================== */

const PageExplorer = (() => {
  let currentPage = 0;
  const PAGE_SIZE = 20;
  let tpsChart = null;
  let forgerChart = null;

  // ---- Blocks Table ----
  function renderBlocksTable(blocks) {
    const t = I18n.t.bind(I18n);
    if (!blocks || !blocks.length) {
      return `<div class="empty-state"><div class="empty-state__icon">📦</div><div class="empty-state__title">${Utils.esc(t('explorer.notFound'))}</div></div>`;
    }
    const rows = blocks.map(b => {
      const txCount = b.numberOfTransactions || 0;
      return `<tr onclick="PageExplorer.openBlockById('${Utils.esc(b.block)}')" style="cursor:pointer">
        <td class="text-mono">${Utils.blockLink(b.height)}</td>
        <td class="text-faint text-sm">${Utils.formatBcTime(b.timestamp)}</td>
        <td class="text-faint text-sm">${Utils.formatBcTime(b.timestamp, { relative: true })}</td>
        <td><span class="badge badge--${txCount > 0 ? 'primary' : 'neutral'}">${txCount}</span></td>
        <td class="text-mono">${Utils.formatPzm(b.totalAmountNQT)}</td>
        <td class="text-mono text-sm">${Utils.formatPzm(b.totalFeeNQT)}</td>
        <td><span class="addr" onclick="event.stopPropagation();Router.navigate('/accounts?account=${Utils.esc(b.generatorRS || b.generator)}')">${Utils.esc(Utils.shortenRS(b.generatorRS))}</span></td>
        <td class="text-faint text-sm">${b.payloadLength || 0} B</td>
      </tr>`;
    }).join('');

    return `<div class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>${Utils.esc(t('explorer.col.height'))}</th><th>${Utils.esc(t('explorer.col.date'))}</th><th>${Utils.esc(t('explorer.col.when'))}</th><th>TX</th><th>${Utils.esc(t('explorer.col.vol'))}</th><th>${Utils.esc(t('explorer.col.fee'))}</th><th>${Utils.esc(t('dashboard.blocks.col.forger'))}</th><th>${Utils.esc(t('explorer.col.size'))}</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  // ---- TPS Chart (last 50 blocks) ----
  async function renderTpsChart(blocks) {
    const canvas = document.getElementById('tps-chart');
    if (!canvas) return;
    if (tpsChart) { try { tpsChart.destroy(); } catch(e){} }
    if (!blocks || blocks.length < 2) return;

    const labels = [];
    const tpsData = [];
    const volData = [];

    for (let i = 0; i < blocks.length - 1; i++) {
      const b = blocks[i];
      const dt = Math.abs(b.timestamp - blocks[i + 1].timestamp) || 60;
      const tps = (b.numberOfTransactions || 0) / dt;
      labels.push(`#${Utils.formatNum(b.height)}`);
      tpsData.push(parseFloat(tps.toFixed(4)));
      volData.push(Utils.nqtToPzm(b.totalAmountNQT));
    }

    const def = Utils.chartDefaults();
    const t = I18n.t.bind(I18n);
    tpsChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: t('explorer.chart.tps'),
            data: tpsData,
            backgroundColor: 'rgba(147,51,234,0.6)',
            borderColor: '#9333ea',
            borderWidth: 1,
            yAxisID: 'y',
          },
          {
            label: t('explorer.chart.vol'),
            data: volData,
            type: 'line',
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: def.plugins,
        scales: {
          x: { ...def.scales.x, ticks: { ...def.scales.x.ticks, maxTicksLimit: 10, maxRotation: 0 } },
          y: { ...def.scales.y, beginAtZero: true, title: { display: true, text: t('explorer.chart.axisTps'), color: '#52525b' } },
          y1: { type: 'linear', position: 'right', beginAtZero: true, grid: { display: false }, ticks: { color: '#52525b', font: { size: 11 } }, title: { display: true, text: t('explorer.chart.axisVol'), color: '#52525b' } }
        }
      }
    });
  }

  // ---- Block Detail Modal ----
  async function openBlockById(blockId) {
    App.openModal(I18n.t('explorer.modal.block'), `<div class="page-loading" style="height:160px"><div class="spinner"></div></div>`);
    try {
      const b = await API.getBlock({ block: blockId, includeTransactions: true });
      renderBlockModal(b);
    } catch (err) {
      document.getElementById('modal-body').innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__sub">${Utils.esc(err.message)}</div></div>`;
    }
  }

  async function openBlockByHeight(height) {
    App.openModal(I18n.t('explorer.modal.block'), `<div class="page-loading" style="height:160px"><div class="spinner"></div></div>`);
    try {
      const b = await API.getBlock({ height, includeTransactions: true });
      renderBlockModal(b);
    } catch (err) {
      document.getElementById('modal-body').innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__sub">${Utils.esc(err.message)}</div></div>`;
    }
  }

  function renderBlockModal(b) {
    const t = I18n.t.bind(I18n);
    document.getElementById('modal-title').textContent = t('explorer.modal.blockTitle', { h: Utils.formatNum(b.height) });
    const txs = b.transactions || [];
    const txRows = txs.length ? txs.map(tx => `
      <tr onclick="PageTransactions.openTxModal('${Utils.esc(tx.transaction)}')" style="cursor:pointer">
        <td><span class="addr">${Utils.shorten(tx.transaction)}</span></td>
        <td>${Utils.txTypeLabel(tx.type).icon} ${Utils.txTypeLabel(tx.type).label}</td>
        <td class="text-mono">${Utils.formatPzm(tx.amountNQT)}</td>
        <td class="text-mono text-sm">${Utils.formatPzm(tx.feeNQT)}</td>
        <td><span class="addr">${Utils.esc(Utils.shortenRS(tx.recipientRS))}</span></td>
      </tr>`).join('') : `<tr><td colspan="5" class="text-center text-faint">${Utils.esc(t('explorer.modal.noTx'))}</td></tr>`;

    document.getElementById('modal-body').innerHTML = `
      <div class="detail-grid mb-6">
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('explorer.detail.blockId'))}</span><span class="detail-row__value mono">${Utils.esc(b.block)}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('explorer.detail.height'))}</span><span class="detail-row__value">${Utils.formatNum(b.height)}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('explorer.detail.time'))}</span><span class="detail-row__value">${Utils.formatBcTime(b.timestamp)}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('explorer.detail.forger'))}</span>
          <span class="detail-row__value"><span class="addr addr--full" onclick="Router.navigate('/accounts?account=${Utils.esc(b.generatorRS)}')">${Utils.esc(b.generatorRS)}</span></span>
        </div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('explorer.detail.txs'))}</span><span class="detail-row__value">${b.numberOfTransactions}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('explorer.detail.vol'))}</span><span class="detail-row__value mono">${Utils.formatPzm(b.totalAmountNQT)}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('explorer.detail.fees'))}</span><span class="detail-row__value mono">${Utils.formatPzm(b.totalFeeNQT)}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('explorer.detail.reward'))}</span><span class="detail-row__value mono">${Utils.formatPzm(b.blockReward)}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('explorer.detail.prev'))}</span><span class="detail-row__value mono text-sm">${Utils.esc(b.previousBlock)}</span></div>
        <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('explorer.detail.size'))}</span><span class="detail-row__value">${Utils.esc(t('explorer.detail.bytes', { n: b.payloadLength }))}</span></div>
      </div>
      ${txs.length ? `
        <div class="card__title mb-4">${Utils.esc(t('explorer.detail.txsTitle', { n: txs.length }))}</div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>${Utils.esc(t('explorer.table.txId'))}</th><th>${Utils.esc(t('explorer.table.type'))}</th><th>${Utils.esc(t('explorer.table.amount'))}</th><th>${Utils.esc(t('explorer.table.fee'))}</th><th>${Utils.esc(t('explorer.table.recipient'))}</th></tr></thead>
            <tbody>${txRows}</tbody>
          </table>
        </div>` : ''}
    `;
  }

  // ---- Main render ----
  async function render(params, path) {
    const outlet = document.getElementById('router-outlet');

    // Check for direct height lookup from URL
    const heightParam = params && params.height;

    const t = I18n.t.bind(I18n);
    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('explorer.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('explorer.subtitle'))}</p>
      </div>
      <div class="card section-gap">
        <div class="card__header">
          <span class="card__title">${Utils.esc(t('explorer.activity'))}</span>
        </div>
        <div class="chart-wrap" style="height:220px">
          <canvas id="tps-chart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card__header">
          <span class="card__title">${Utils.esc(t('explorer.recentBlocks'))}</span>
          <div class="flex gap-2">
            <button class="btn btn--ghost btn--sm" id="prev-page-btn" onclick="PageExplorer.prevPage()" disabled>${Utils.esc(t('explorer.prev'))}</button>
            <span class="pagination__info" id="page-info">${Utils.esc(t('pagination.pageOnly', { n: 1 }))}</span>
            <button class="btn btn--ghost btn--sm" id="next-page-btn" onclick="PageExplorer.nextPage()">${Utils.esc(t('explorer.next'))}</button>
          </div>
        </div>
        <div id="blocks-table-body">
          <div class="page-loading" style="height:160px"><div class="spinner"></div></div>
        </div>
      </div>
    `;

    // Load blocks for chart and table
    await loadPage(0);

    // Load 50 blocks for TPS chart
    try {
      const big = await API.getBlocks({ firstIndex: 0, lastIndex: 49 });
      renderTpsChart(big.blocks || []);
    } catch(e) {}

    // If height param, auto-open block
    if (heightParam) {
      openBlockByHeight(parseInt(heightParam));
    }
  }

  async function loadPage(page) {
    currentPage = page;
    const firstIndex = page * PAGE_SIZE;
    const lastIndex  = firstIndex + PAGE_SIZE - 1;
    const tableBody = document.getElementById('blocks-table-body');
    if (tableBody) tableBody.innerHTML = `<div class="page-loading" style="height:160px"><div class="spinner"></div></div>`;

    try {
      const data = await API.getBlocks({ firstIndex, lastIndex });
      const blocks = data.blocks || [];
      if (tableBody) tableBody.innerHTML = renderBlocksTable(blocks);

      const prevBtn = document.getElementById('prev-page-btn');
      const nextBtn = document.getElementById('next-page-btn');
      const pageInfo = document.getElementById('page-info');
      if (prevBtn) prevBtn.disabled = page === 0;
      if (nextBtn) nextBtn.disabled = blocks.length < PAGE_SIZE;
      if (pageInfo) pageInfo.textContent = I18n.t('pagination.pageOnly', { n: page + 1 });
    } catch(err) {
      if (tableBody) tableBody.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__sub">${Utils.esc(err.message)}</div></div>`;
    }
  }

  function prevPage() { if (currentPage > 0) loadPage(currentPage - 1); }
  function nextPage() { loadPage(currentPage + 1); }

  return { render, openBlockById, openBlockByHeight, prevPage, nextPage };
})();
