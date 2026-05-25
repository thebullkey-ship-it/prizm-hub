/* =====================================================
   PRIZM Hub — Dashboard Page
   Module 1: KPI widgets, recent blocks, next forger,
             block time sparkline
   ===================================================== */

const PageDashboard = (() => {
  let refreshInterval = null;
  let blockTimeChart = null;

  // ---- Render skeleton ----
  function skeleton() {
    return `
      <div class="stats-grid" id="kpi-grid">
        ${Array(6).fill('<div class="stat-card"><div class="skeleton skeleton-stat"></div></div>').join('')}
      </div>
      <div class="grid-2-1 section-gap">
        <div class="card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div>
        <div class="card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-stat"></div></div>
      </div>
    `;
  }

  // ---- KPI Cards ----
  function renderKpi(state, status) {
    const t = I18n.t.bind(I18n);
    const kpis = [
      {
        icon: '⛓️',
        label: t('dashboard.kpi.height'),
        value: Utils.formatNum(state.numberOfBlocks),
        sub: t('dashboard.kpi.version', { v: status.version || '—' }),
        color: '#9333ea',
        iconBg: 'rgba(147,51,234,0.15)'
      },
      {
        icon: '🔄',
        label: t('dashboard.kpi.txs'),
        value: Utils.formatNum(state.numberOfTransactions),
        sub: t('dashboard.kpi.txsSub'),
        color: '#3b82f6',
        iconBg: 'rgba(59,130,246,0.15)'
      },
      {
        icon: '👥',
        label: t('dashboard.kpi.accounts'),
        value: Utils.formatNum(state.numberOfAccounts),
        sub: t('dashboard.kpi.accountsSub'),
        color: '#10b981',
        iconBg: 'rgba(16,185,129,0.15)'
      },
      {
        icon: '⚡',
        label: t('dashboard.kpi.forgers'),
        value: Utils.formatNum(state.numberOfUnlockedAccounts),
        sub: t('dashboard.kpi.forgersSub'),
        color: '#f59e0b',
        iconBg: 'rgba(245,158,11,0.15)'
      },
      {
        icon: '🌐',
        label: t('dashboard.kpi.peers'),
        value: Utils.formatNum(state.numberOfPeers),
        sub: t('dashboard.kpi.peersSub', { n: state.numberOfConnectedPeers || '—' }),
        color: '#a855f7',
        iconBg: 'rgba(168,85,247,0.15)'
      },
      {
        icon: '💎',
        label: t('dashboard.kpi.stake'),
        value: Utils.formatNum(state.totalEffectiveBalancePrizm),
        sub: t('dashboard.kpi.stakeSub'),
        color: '#ec4899',
        iconBg: 'rgba(236,72,153,0.15)'
      },
    ];

    return `<div class="stats-grid" id="kpi-grid">
      ${kpis.map(k => `
        <div class="stat-card" style="--accent-color:${k.color}">
          <div class="stat-card__icon" style="background:${k.iconBg}">${k.icon}</div>
          <div class="stat-card__label">${k.label}</div>
          <div class="stat-card__value" style="color:${k.color}">${Utils.esc(k.value)}</div>
          <div class="stat-card__sub">${Utils.esc(k.sub)}</div>
        </div>
      `).join('')}
    </div>`;
  }

  // ---- Recent Blocks Table ----
  function renderBlocksTable(blocks) {
    const t = I18n.t.bind(I18n);
    if (!blocks || !blocks.length) {
      return `<div class="empty-state"><div class="empty-state__icon">📦</div><div class="empty-state__title">${Utils.esc(t('dashboard.noData'))}</div></div>`;
    }
    const rows = blocks.map(b => {
      const txCount = b.numberOfTransactions || 0;
      const fee = Utils.formatPzm(b.totalFeeNQT);
      const vol = Utils.formatPzm(b.totalAmountNQT);
      const forger = Utils.shortenRS(b.generatorRS) || Utils.shorten(b.generator);
      return `<tr class="table--clickable" onclick="PageExplorer.openBlockById('${Utils.esc(b.block)}')">
        <td>${Utils.blockLink(b.height)}</td>
        <td class="text-faint text-sm">${Utils.formatBcTime(b.timestamp, { relative: true })}</td>
        <td><span class="badge badge--${txCount > 0 ? 'primary' : 'neutral'}">${txCount} TX</span></td>
        <td class="text-mono">${Utils.esc(vol)}</td>
        <td class="text-mono text-sm">${Utils.esc(fee)}</td>
        <td><span class="addr" onclick="event.stopPropagation();Router.navigate('/accounts?account=${Utils.esc(b.generatorRS || b.generator)}')">${Utils.esc(forger)}</span></td>
      </tr>`;
    }).join('');

    return `
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>${Utils.esc(t('dashboard.blocks.col.height'))}</th><th>${Utils.esc(t('dashboard.blocks.col.time'))}</th><th>${Utils.esc(t('dashboard.blocks.col.tx'))}</th><th>${Utils.esc(t('dashboard.blocks.col.vol'))}</th><th>${Utils.esc(t('dashboard.blocks.col.fee'))}</th><th>${Utils.esc(t('dashboard.blocks.col.forger'))}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  // ---- Next Forger Widget ----
  function renderNextForger(generators) {
    const t = I18n.t.bind(I18n);
    if (!generators || !generators.length) {
      return `<div class="empty-state"><div class="empty-state__icon">⚡</div><div class="empty-state__title">${Utils.esc(t('dashboard.noData'))}</div></div>`;
    }
    const items = generators.slice(0, 5).map((g, i) => {
      const deadline = Math.max(0, Math.round(g.deadline || 0));
      const rs = g.accountRS || g.account;
      const rankClass = ['rank-1','rank-2','rank-3'][i] || 'rank-n';
      return `<div class="feed-item">
        <div class="rank-badge ${rankClass}">${i + 1}</div>
        <div class="feed-item__main">
          <div class="feed-item__title">
            <span class="addr" onclick="Router.navigate('/accounts?account=${Utils.esc(rs)}')">${Utils.esc(Utils.shortenRS(g.accountRS))}</span>
          </div>
          <div class="feed-item__sub">${Utils.esc(t('dashboard.nextForger.stake', { n: Utils.formatNum(g.effectiveBalancePrizm) }))}</div>
        </div>
        <div class="feed-item__right">
          <div class="countdown">${Utils.countdown(deadline)}</div>
          <div class="feed-item__time">${Utils.esc(t('dashboard.nextForger.deadline'))}</div>
        </div>
      </div>`;
    }).join('');

    return items;
  }

  // ---- Block Time Chart ----
  function renderBlockTimeChart(blocks) {
    const canvas = document.getElementById('block-time-chart');
    if (!canvas || !blocks || blocks.length < 2) return;

    if (blockTimeChart) { try { blockTimeChart.destroy(); } catch(e){} }

    const times = [];
    const labels = [];
    for (let i = 1; i < blocks.length; i++) {
      const dt = blocks[i - 1].timestamp - blocks[i].timestamp;
      times.push(Math.abs(dt));
      labels.push(`#${Utils.formatNum(blocks[i].height)}`);
    }

    const defaults = Utils.chartDefaults();
    blockTimeChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: I18n.t('dashboard.chart.blockTime'),
          data: times,
          borderColor: '#9333ea',
          backgroundColor: 'rgba(147,51,234,0.1)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#9333ea',
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { ...defaults.plugins, legend: { display: false } },
        scales: {
          ...defaults.scales,
          y: { ...defaults.scales.y, beginAtZero: true, title: { display: false } }
        }
      }
    });
  }

  // ---- Full page render ----
  async function render(params) {
    const outlet = document.getElementById('router-outlet');

    // Fetch data in parallel — use allSettled so one failure doesn't block all
    let state, status, blocks, generators;
    try {
      const [r0, r1, r2, r3] = await Promise.allSettled([
        API.getState(),
        API.getBlockchainStatus(),
        API.getBlocks({ firstIndex: 0, lastIndex: 14 }),
        API.getNextBlockGenerators(5).catch(() => ({ generators: [] })),
      ]);

      // At minimum we need state and status
      if (r0.status === 'rejected' && r1.status === 'rejected') {
        throw new Error(r0.reason?.message || 'No connection');
      }

      state      = r0.status === 'fulfilled' ? r0.value : {};
      status     = r1.status === 'fulfilled' ? r1.value : {};
      blocks     = r2.status === 'fulfilled' ? r2.value : { blocks: [] };
      generators = r3.status === 'fulfilled' ? r3.value : { generators: [] };
    } catch (err) {
      const t = I18n.t.bind(I18n);
      outlet.innerHTML = `<div class="empty-state" style="padding-top:80px">
        <div class="empty-state__icon">📡</div>
        <div class="empty-state__title">${Utils.esc(t('dashboard.error.node'))}</div>
        <div class="empty-state__sub">${Utils.esc(t('dashboard.error.nodeHint'))}</div>
        <button class="btn btn--primary mt-4" onclick="Router.dispatch()">${Utils.esc(t('dashboard.retry'))}</button>
      </div>`;
      return;
    }

    const blocksList = blocks.blocks || [];
    const genList = generators.generators || [];
    const t = I18n.t.bind(I18n);

    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('dashboard.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('dashboard.subtitle'))}</p>
      </div>

      ${renderKpi(state, status)}

      <div id="supply-row" class="section-gap">
        <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
          <div class="stat-card" style="--accent-color:#10b981"><div class="stat-card__icon" style="background:rgba(16,185,129,0.15)">💰</div><div class="stat-card__label">${Utils.esc(t('dashboard.supply.premine'))}</div><div class="stat-card__value" id="supply-premine" style="color:#10b981;font-size:18px">…</div><div class="stat-card__sub">${Utils.esc(t('dashboard.supply.premineSub'))}</div></div>
          <div class="stat-card" style="--accent-color:#3b82f6"><div class="stat-card__icon" style="background:rgba(59,130,246,0.15)">📊</div><div class="stat-card__label">${Utils.esc(t('dashboard.supply.noPremine'))}</div><div class="stat-card__value" id="supply-no-premine" style="color:#3b82f6;font-size:18px">…</div><div class="stat-card__sub">${Utils.esc(t('dashboard.supply.noPremineSub'))}</div></div>
          <div class="stat-card" style="--accent-color:#a855f7"><div class="stat-card__icon" style="background:rgba(168,85,247,0.15)">🎯</div><div class="stat-card__label">${Utils.esc(t('dashboard.supply.final'))}</div><div class="stat-card__value" id="supply-final" style="color:#a855f7;font-size:18px">…</div><div class="stat-card__sub">${Utils.esc(t('dashboard.supply.finalSub'))}</div></div>
        </div>
      </div>

      <div class="grid-2-1 section-gap">
        <div class="card">
          <div class="card__header">
            <span class="card__title">${Utils.esc(t('dashboard.card.recentBlocks'))}</span>
            <a href="#/explorer" class="card__action">${Utils.esc(t('dashboard.card.allBlocks'))}</a>
          </div>
          ${renderBlocksTable(blocksList)}
        </div>
        <div class="card">
          <div class="card__header">
            <span class="card__title">${Utils.esc(t('dashboard.card.nextForgers'))}</span>
            <a href="#/forging" class="card__action">${Utils.esc(t('dashboard.card.allForgers'))}</a>
          </div>
          <div id="next-forgers-list">
            ${renderNextForger(genList)}
          </div>
        </div>
      </div>

      <div class="card section-gap">
        <div class="card__header">
          <span class="card__title">${Utils.esc(t('dashboard.card.blockTime'))}</span>
          <span class="text-faint text-sm">${Utils.esc(t('dashboard.card.blockTimeHint', { n: blocksList.length - 1 }))}</span>
        </div>
        <div class="chart-wrap" style="height:200px">
          <canvas id="block-time-chart"></canvas>
        </div>
      </div>
    `;

    renderBlockTimeChart(blocksList);

    // Load supply stats async (non-blocking)
    loadSupplyStats();

    // Auto-refresh every 15 seconds
    refreshInterval = setInterval(async () => {
      try {
        const [rs, rss, rb, rg] = await Promise.allSettled([
          API.getState(),
          API.getBlockchainStatus(),
          API.getBlocks({ firstIndex: 0, lastIndex: 14 }),
          API.getNextBlockGenerators(5).catch(() => ({ generators: [] })),
        ]);
        const newState  = rs.status  === 'fulfilled' ? rs.value  : null;
        const newStatus = rss.status === 'fulfilled' ? rss.value : null;
        const newBlocks = rb.status  === 'fulfilled' ? rb.value  : null;
        const newGen    = rg.status  === 'fulfilled' ? rg.value  : { generators: [] };
        if (!newState && !newStatus) return;
        // Update KPI grid
        if (newState && newStatus) {
          const kpiEl = document.getElementById('kpi-grid');
          if (kpiEl) kpiEl.outerHTML = renderKpi(newState, newStatus);
        }
        // Update forgers
        const forgerEl = document.getElementById('next-forgers-list');
        if (forgerEl) forgerEl.innerHTML = renderNextForger(newGen.generators || []);
        // Update chart
        if (newBlocks) renderBlockTimeChart(newBlocks.blocks || []);
      } catch (e) { /* silently skip */ }
    }, 15000);

    // Return cleanup
    return () => {
      clearInterval(refreshInterval);
      if (blockTimeChart) { try { blockTimeChart.destroy(); } catch(e){} blockTimeChart = null; }
    };
  }

  // ---- Supply Stats ----
  async function loadSupplyStats() {
    try {
      const [s1, s2, s3] = await Promise.allSettled([
        API.getSupplyWithPremine(),
        API.getSupplyNoPremine(),
        API.getFinalSupply(),
      ]);
      const loc = I18n.getBcp47();
      const fmt = (v) => {
        const n = parseFloat(v);
        if (isNaN(n)) return '—';
        return n.toLocaleString(loc, { maximumFractionDigits: 0 }) + ' PZM';
      };
      const set = (id, r) => {
        const el = document.getElementById(id);
        if (el) el.textContent = r.status === 'fulfilled' ? fmt(r.value) : '—';
      };
      set('supply-premine',    s1);
      set('supply-no-premine', s2);
      set('supply-final',      s3);
    } catch(e) { /* non-critical */ }
  }

  return { render };
})();
