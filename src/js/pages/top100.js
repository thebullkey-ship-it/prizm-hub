/* =====================================================
   PRIZM Hub — Top 100 Wallets Page
   Source: https://api.prizm.vip/top100json
   ===================================================== */

const PageTop100 = (() => {
  let supplyWithPremine = null;

  function formatBalance(str) {
    const n = parseFloat(str);
    if (isNaN(n)) return str;
    const loc = typeof I18n !== 'undefined' ? I18n.getBcp47() : 'en-US';
    return n.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' PZM';
  }

  // Distribution donut chart
  let donutChart = null;
  function renderDonut(top10, totalSupply) {
    const canvas = document.getElementById('top100-donut');
    if (!canvas) return;
    if (donutChart) { try { donutChart.destroy(); } catch(e){} }

    const labels = top10.map(w => Utils.shortenRS(w.address));
    const data   = top10.map(w => parseFloat(w.balance));
    const rest   = totalSupply ? totalSupply - data.reduce((a,b) => a+b, 0) : null;
    if (rest && rest > 0) { labels.push(I18n.t('top100.chartOther')); data.push(rest); }

    const colors = [
      '#9333ea','#a855f7','#3b82f6','#10b981','#f59e0b',
      '#ef4444','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1'
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
        responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: {
          ...def.plugins,
          legend: {
            position: 'right',
            labels: { color: '#a1a1aa', font: { family: 'Inter', size: 11 }, padding: 10, boxWidth: 12 }
          },
          tooltip: {
            ...def.plugins.tooltip,
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed;
                const pct = totalSupply ? ((val / totalSupply) * 100).toFixed(3) : '?';
                return ` ${val.toLocaleString(I18n.getBcp47(), { maximumFractionDigits: 0 })} PZM (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  async function render(params) {
    const outlet = document.getElementById('router-outlet');

    const t = I18n.t.bind(I18n);
    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('top100.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('top100.subtitle'))}</p>
      </div>

      <div id="supply-stats-row" class="section-gap">
        <div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
          <div class="stat-card" style="--accent-color:#10b981"><div class="stat-card__icon" style="background:rgba(16,185,129,0.15)">💰</div><div class="stat-card__label">${Utils.esc(t('top100.supplyPremine'))}</div><div class="stat-card__value" id="t100-supply-pre" style="color:#10b981;font-size:17px">…</div></div>
          <div class="stat-card" style="--accent-color:#3b82f6"><div class="stat-card__icon" style="background:rgba(59,130,246,0.15)">📊</div><div class="stat-card__label">${Utils.esc(t('top100.supplyNo'))}</div><div class="stat-card__value" id="t100-supply-no" style="color:#3b82f6;font-size:17px">…</div></div>
          <div class="stat-card" style="--accent-color:#a855f7"><div class="stat-card__icon" style="background:rgba(168,85,247,0.15)">🎯</div><div class="stat-card__label">${Utils.esc(t('top100.final'))}</div><div class="stat-card__value" id="t100-supply-fin" style="color:#a855f7;font-size:17px">…</div></div>
          <div class="stat-card" style="--accent-color:#f59e0b"><div class="stat-card__icon" style="background:rgba(245,158,11,0.15)">👑</div><div class="stat-card__label">${Utils.esc(t('top100.topHolders'))}</div><div class="stat-card__value" id="t100-share" style="color:#f59e0b;font-size:17px">…</div><div class="stat-card__sub">${Utils.esc(t('top100.shareSub'))}</div></div>
        </div>
      </div>

      <div class="grid-2-1 section-gap">
        <div class="card">
          <div class="card__header">
            <span class="card__title">${Utils.esc(t('top100.balanceTitle'))}</span>
            <a href="https://api.prizm.vip/top100json" target="_blank" rel="noopener" class="btn btn--outline btn--sm">${Utils.esc(t('top100.rawJson'))}</a>
          </div>
          <div id="top100-table-body">
            <div class="page-loading" style="height:160px"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="card">
          <div class="card__header">
            <span class="card__title">${Utils.esc(t('top100.distTitle'))}</span>
          </div>
          <div class="chart-wrap" style="height:320px">
            <canvas id="top100-donut"></canvas>
          </div>
        </div>
      </div>

      <div class="card section-gap">
        <div class="card__header">
          <span class="card__title">${Utils.esc(t('top100.pm365'))}</span>
        </div>
        <div id="top100-p365-body">
          <div class="page-loading" style="height:120px"><div class="spinner"></div></div>
        </div>
      </div>
    `;

    // Load supply + top100 in parallel
    const [r1, r2, r3, r4] = await Promise.allSettled([
      API.getSupplyWithPremine(),
      API.getSupplyNoPremine(),
      API.getFinalSupply(),
      API.getTop100(),
    ]);

    const loc = I18n.getBcp47();
    const fmt = (v) => {
      const n = parseFloat(v);
      return isNaN(n) ? '—' : n.toLocaleString(loc, { maximumFractionDigits: 0 }) + ' PZM';
    };
    const setEl = (id, r) => {
      const el = document.getElementById(id);
      if (el) el.textContent = r.status === 'fulfilled' ? fmt(r.value) : '—';
    };
    setEl('t100-supply-pre', r1);
    setEl('t100-supply-no',  r2);
    setEl('t100-supply-fin', r3);

    supplyWithPremine = r1.status === 'fulfilled' ? parseFloat(r1.value) : null;

    const wallets = r4.status === 'fulfilled' ? (r4.value || []) : [];

    // Calculate top-100 share
    if (wallets.length && supplyWithPremine) {
      const top100Total = wallets.reduce((s, w) => s + parseFloat(w.balance || 0), 0);
      const pct = ((top100Total / supplyWithPremine) * 100).toFixed(2);
      const shareEl = document.getElementById('t100-share');
      if (shareEl) shareEl.textContent = pct + '%';
    }

    // Render table
    const tableBody = document.getElementById('top100-table-body');
    if (wallets.length) {
      const rows = wallets.map(w => {
        const rankClass = ['rank-1','rank-2','rank-3'][w.rank - 1] || 'rank-n';
        const priceUsd = parseFloat(w.price_usd);
        const balancePzm = parseFloat(w.balance);
        const usdVal = (!isNaN(priceUsd) && priceUsd > 0 && !isNaN(balancePzm))
          ? '$' + (priceUsd * balancePzm).toLocaleString('en-US', { maximumFractionDigits: 2 })
          : '—';
        return `<tr>
          <td><span class="rank-badge ${rankClass}">${w.rank}</span></td>
          <td>
            <span class="addr" style="max-width:none;font-size:12px" onclick="Router.navigate('/accounts?account=${Utils.esc(w.address)}')">${Utils.esc(w.address)}</span>
          </td>
          <td class="text-mono">${formatBalance(w.balance)}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;min-width:100px">
              <div class="progress-bar" style="flex:1">
                <div class="progress-bar__fill" style="width:${Math.min(100, parseFloat(w.percent) * 10)}%"></div>
              </div>
              <span class="text-xs text-muted">${w.percent}%</span>
            </div>
          </td>
          <td class="text-faint text-sm">${usdVal}</td>
        </tr>`;
      }).join('');

      tableBody.innerHTML = `<div class="table-wrap">
        <table class="table">
          <thead><tr><th>#</th><th>${Utils.esc(t('top100.th.addr'))}</th><th>${Utils.esc(t('top100.th.balance'))}</th><th>${Utils.esc(t('top100.th.share'))}</th><th>${Utils.esc(t('top100.th.usd'))}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

      // Draw chart with top 10
      renderDonut(wallets.slice(0, 10), supplyWithPremine);
    } else {
      tableBody.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__title">${Utils.esc(t('top100.unavailable'))}</div></div>`;
    }

    const p365El = document.getElementById('top100-p365-body');
    if (p365El) {
      const p365 = await API.tryTop100Paramining365();
      if (p365 && p365.length) {
        const rows = p365.map((w, i) => {
          const rank = w.rank != null ? w.rank : i + 1;
          const addr = w.address || w.accountRS || '—';
          const bal = w.balance != null ? formatBalance(String(w.balance)) : '—';
          const inc = w.income != null ? formatBalance(String(w.income)) : (w.paramining != null ? formatBalance(String(w.paramining)) : '—');
          return `<tr>
            <td><span class="rank-badge rank-n">${rank}</span></td>
            <td><span class="addr" style="font-size:12px" onclick="Router.navigate('/accounts?account=${Utils.esc(addr)}')">${Utils.esc(addr)}</span></td>
            <td class="text-mono">${bal}</td>
            <td class="text-mono">${inc}</td>
          </tr>`;
        }).join('');
        p365El.innerHTML = `<div class="table-wrap"><table class="table">
          <thead><tr><th>#</th><th>${Utils.esc(t('top100.th.wallet'))}</th><th>${Utils.esc(t('top100.th.balance'))}</th><th>${Utils.esc(t('top100.th.pm'))}</th></tr></thead>
          <tbody>${rows}</tbody></table></div>`;
      } else {
        p365El.innerHTML = `<p class="text-sm text-muted" style="padding:var(--sp-2) 0">${t('top100.pm365Note')}</p>`;
      }
    }

    return () => {
      if (donutChart) { try { donutChart.destroy(); } catch(e){} donutChart = null; }
    };
  }

  return { render };
})();
