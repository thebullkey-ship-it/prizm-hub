/* =====================================================
   PRIZM Hub — Forging Monitor Page
   Module 5: next generators, leaderboard, donut chart
   ===================================================== */

const PageForging = (() => {
  let donutChart = null;
  let countdownInterval = null;
  let refreshInterval = null;
  let generatorsCache = [];

  // ---- Next Block Generators Table ----
  function renderGeneratorsTable(generators, startTs) {
    const t = I18n.t.bind(I18n);
    if (!generators || !generators.length) {
      return `<div class="empty-state"><div class="empty-state__icon">⚡</div><div class="empty-state__title">${Utils.esc(t('forging.emptyGens'))}</div></div>`;
    }
    const rows = generators.map((g, i) => {
      const deadline = Math.max(0, Math.round(g.deadline || 0));
      const hitTime  = g.hitTime ? Utils.formatBcTime(g.hitTime) : '—';
      const rankClass = ['rank-1','rank-2','rank-3'][i] || 'rank-n';
      const prob = g.effectiveBalancePrizm ? ((g.effectiveBalancePrizm / (startTs || 1)) * 100).toFixed(2) : '—';
      return `<tr>
        <td><span class="rank-badge ${rankClass}">${i + 1}</span></td>
        <td>
          <span class="addr" onclick="Router.navigate('/accounts?account=${Utils.esc(g.accountRS || g.account)}')">${Utils.esc(Utils.shortenRS(g.accountRS))}</span>
        </td>
        <td class="text-mono">${Utils.formatNum(g.effectiveBalancePrizm)} PZM</td>
        <td><span class="countdown" id="cd-${i}">${Utils.countdown(deadline)}</span></td>
        <td class="text-faint text-sm">${hitTime}</td>
        <td>
          <div style="min-width:80px">
            <div class="progress-bar">
              <div class="progress-bar__fill" style="width:${Math.min(100, (10000 / (deadline + 1)))}%"></div>
            </div>
          </div>
        </td>
      </tr>`;
    }).join('');

    return `<div class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>#</th><th>${Utils.esc(t('forging.table.forger'))}</th><th>${Utils.esc(t('forging.table.stake'))}</th><th>${Utils.esc(t('forging.table.deadline'))}</th><th>${Utils.esc(t('forging.table.blockTime'))}</th><th>${Utils.esc(t('forging.table.ready'))}</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  // ---- Live countdown ticker ----
  function startCountdowns(generators) {
    if (countdownInterval) clearInterval(countdownInterval);
    const deadlines = generators.map(g => Math.max(0, Math.round(g.deadline || 0)));
    const startTime = Date.now();

    countdownInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      deadlines.forEach((d, i) => {
        const el = document.getElementById(`cd-${i}`);
        if (el) {
          const remaining = Math.max(0, d - elapsed);
          el.textContent = Utils.countdown(remaining);
          if (remaining <= 10) el.style.color = 'var(--color-danger)';
          else if (remaining <= 30) el.style.color = 'var(--color-warning)';
          else el.style.color = 'var(--color-warning)';
        }
      });
    }, 1000);
  }

  // ---- Forging Share Donut Chart ----
  function renderDonutChart(generators) {
    const canvas = document.getElementById('forging-donut');
    if (!canvas || !generators.length) return;
    if (donutChart) { try { donutChart.destroy(); } catch(e){} }

    const top8 = generators.slice(0, 8);
    const labels = top8.map(g => Utils.shortenRS(g.accountRS) || Utils.shorten(g.account));
    const data   = top8.map(g => g.effectiveBalancePrizm || 0);

    const colors = [
      '#9333ea','#a855f7','#3b82f6','#10b981',
      '#f59e0b','#ef4444','#ec4899','#06b6d4'
    ];

    const def = Utils.chartDefaults();
    donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: (typeof getComputedStyle !== 'undefined'
            && getComputedStyle(document.documentElement).getPropertyValue('--chart-border').trim()) || '#080810',
          borderWidth: 3,
          hoverOffset: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          ...def.plugins,
          legend: {
            position: 'right',
            labels: { color: '#a1a1aa', font: { family: 'Inter', size: 11 }, padding: 12, boxWidth: 12 }
          }
        }
      }
    });
  }

  // ---- Top Forgers Leaderboard (from recent blocks) ----
  async function loadLeaderboard() {
    const el = document.getElementById('leaderboard-body');
    if (!el) return;
    el.innerHTML = `<div class="page-loading" style="height:120px"><div class="spinner"></div></div>`;

    try {
      const t = I18n.t.bind(I18n);
      // Get last 100 blocks to calculate who forged most
      const data = await API.getBlocks({ firstIndex: 0, lastIndex: 99 });
      const blocks = data.blocks || [];
      const forgerMap = {};

      blocks.forEach(b => {
        const k = b.generatorRS || b.generator;
        if (!forgerMap[k]) forgerMap[k] = { rs: b.generatorRS, id: b.generator, count: 0, totalFee: 0 };
        forgerMap[k].count++;
        forgerMap[k].totalFee += Number(b.totalFeeNQT || 0);
      });

      const sorted = Object.values(forgerMap).sort((a, b) => b.count - a.count).slice(0, 15);

      if (!sorted.length) {
        el.innerHTML = `<div class="empty-state"><div class="empty-state__title">${Utils.esc(I18n.t('forging.empty'))}</div></div>`;
        return;
      }

      const rows = sorted.map((f, i) => {
        const rankClass = ['rank-1','rank-2','rank-3'][i] || 'rank-n';
        const pct = ((f.count / blocks.length) * 100).toFixed(1);
        return `<tr>
          <td><span class="rank-badge ${rankClass}">${i + 1}</span></td>
          <td><span class="addr" onclick="Router.navigate('/accounts?account=${Utils.esc(f.rs || f.id)}')">${Utils.esc(Utils.shortenRS(f.rs) || Utils.shorten(f.id))}</span></td>
          <td class="text-mono">${f.count}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;min-width:100px">
              <div class="progress-bar" style="flex:1">
                <div class="progress-bar__fill" style="width:${pct}%"></div>
              </div>
              <span class="text-xs text-muted">${pct}%</span>
            </div>
          </td>
          <td class="text-mono text-sm">${Utils.formatPzm(f.totalFee)}</td>
        </tr>`;
      }).join('');

      el.innerHTML = `<div class="table-wrap">
        <table class="table">
          <thead><tr><th>#</th><th>${Utils.esc(t('forging.table.forger'))}</th><th>${Utils.esc(t('forging.blocksFrom', { n: blocks.length }))}</th><th>${Utils.esc(t('forging.share'))}</th><th>${Utils.esc(t('forging.fees'))}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    } catch(err) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__sub">${Utils.esc(err.message)}</div></div>`;
    }
  }

  // ---- Load generators ----
  async function loadGenerators() {
    try {
      const data = await API.getNextBlockGenerators(20);
      generatorsCache = data.generators || [];
      const el = document.getElementById('generators-table');
      if (el) el.innerHTML = renderGeneratorsTable(generatorsCache, data.effectiveBalanceSum);
      startCountdowns(generatorsCache);
      renderDonutChart(generatorsCache);
    } catch(err) {
      const el = document.getElementById('generators-table');
      if (el) el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__sub">${Utils.esc(err.message)}</div></div>`;
    }
  }

  async function render(params) {
    const outlet = document.getElementById('router-outlet');

    const t = I18n.t.bind(I18n);
    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('forging.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('forging.subtitle'))}</p>
      </div>

      <div class="grid-2-1 section-gap">
        <div class="card">
          <div class="card__header">
            <span class="card__title">${Utils.esc(t('forging.next'))}</span>
            <button class="btn btn--ghost btn--sm" onclick="PageForging.loadGenerators()">${Utils.esc(t('forging.refresh'))}</button>
          </div>
          <div id="generators-table">
            <div class="page-loading" style="height:160px"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="card">
          <div class="card__header">
            <span class="card__title">${Utils.esc(t('forging.stakeDist'))}</span>
          </div>
          <div class="chart-wrap" style="height:260px">
            <canvas id="forging-donut"></canvas>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card__header">
          <span class="card__title">${Utils.esc(t('forging.topTitle'))}</span>
        </div>
        <div id="leaderboard-body">
          <div class="page-loading" style="height:120px"><div class="spinner"></div></div>
        </div>
      </div>
    `;

    await Promise.all([loadGenerators(), loadLeaderboard()]);

    // Refresh generators every 30 seconds
    refreshInterval = setInterval(loadGenerators, 30000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(refreshInterval);
      if (donutChart) { try { donutChart.destroy(); } catch(e){} donutChart = null; }
    };
  }

  return { render, loadGenerators };
})();
