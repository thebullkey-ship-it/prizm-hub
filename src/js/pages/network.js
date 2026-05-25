/* =====================================================
   PRIZM Hub — P2P Network Page
   Module 6: peers table, version bar chart, inbound peers, my node
   ===================================================== */

const PageNetwork = (() => {
  let versionChart = null;
  let currentFilter = 1; // 1 = connected only, '' = all
  let refreshInterval = null;

  // ---- Peer state helpers ----
  function peerDot(state) {
    return `<span class="peer-dot ${Utils.peerStateClass(state)}"></span>`;
  }

  // ---- Peers Table ----
  function renderPeersTable(peers) {
    const t = I18n.t.bind(I18n);
    if (!peers || !peers.length) {
      return `<div class="empty-state"><div class="empty-state__icon">🌐</div><div class="empty-state__title">${Utils.esc(t('network.peersEmpty'))}</div></div>`;
    }

    const sorted = [...peers].sort((a, b) => (b.weight || 0) - (a.weight || 0));
    const rows = sorted.map(p => {
      const addr = p.announcedAddress || p.address || '—';
      const traffic = Utils.formatBytes(p.downloadedVolume) + ' / ' + Utils.formatBytes(p.uploadedVolume);
      return `<tr>
        <td class="text-mono text-sm">${Utils.esc(addr)}</td>
        <td>
          <div class="peer-state">
            ${peerDot(p.state)}
            <span class="text-sm">${Utils.peerStateLabel(p.state)}</span>
          </div>
        </td>
        <td class="text-mono text-sm">${Utils.esc(p.version || '—')}</td>
        <td class="text-faint text-sm">${Utils.esc(p.platform || '—')}</td>
        <td class="text-mono text-sm">${Utils.formatNum(p.weight || 0)}</td>
        <td class="text-faint text-sm">${traffic}</td>
        <td>
          ${p.isBlacklisted ? '<span class="badge badge--danger">' + Utils.esc(t('network.tag.blacklist')) + '</span>' : ''}
          ${p.inbound ? '<span class="badge badge--info">' + Utils.esc(t('network.tag.inbound')) + '</span>' : ''}
        </td>
      </tr>`;
    }).join('');

    return `<div class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>${Utils.esc(t('network.col.addr'))}</th><th>${Utils.esc(t('network.col.status'))}</th><th>${Utils.esc(t('network.col.version'))}</th><th>${Utils.esc(t('network.col.platform'))}</th><th>${Utils.esc(t('network.col.weight'))}</th><th>${Utils.esc(t('network.col.traffic'))}</th><th>${Utils.esc(t('network.col.tags'))}</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  // ---- Version Distribution Bar Chart ----
  function renderVersionChart(peers) {
    const canvas = document.getElementById('version-chart');
    if (!canvas || !peers.length) return;
    if (versionChart) { try { versionChart.destroy(); } catch(e){} }

    const versionMap = {};
    peers.forEach(p => {
      const v = p.version || 'unknown';
      versionMap[v] = (versionMap[v] || 0) + 1;
    });

    const sorted = Object.entries(versionMap).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([v]) => v);
    const data   = sorted.map(([, c]) => c);

    const def = Utils.chartDefaults();
    const t = I18n.t.bind(I18n);
    versionChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: t('network.chart.nodes'),
          data,
          backgroundColor: labels.map((_, i) =>
            `hsl(${270 + i * 25}, 70%, ${50 + i * 3}%)`
          ),
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { ...def.plugins, legend: { display: false } },
        scales: {
          x: { ...def.scales.x, beginAtZero: true, title: { display: true, text: t('network.chart.axisNodes'), color: '#52525b' } },
          y: { ...def.scales.y }
        }
      }
    });
  }

  // ---- My Node Info ----
  async function loadMyInfo() {
    const el = document.getElementById('my-node-info');
    if (!el) return;
    const t = I18n.t.bind(I18n);
    try {
      const info = await API.getMyInfo();
      el.innerHTML = `
        <div class="detail-grid">
          <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('network.detail.ip'))}</span><span class="detail-row__value mono">${Utils.esc(info.host || '—')}</span></div>
          <div class="detail-row"><span class="detail-row__label">${Utils.esc(t('network.detail.address'))}</span><span class="detail-row__value mono">${Utils.esc(info.address || '—')}</span></div>
        </div>`;
    } catch(e) {
      el.innerHTML = `<span class="text-faint text-sm">${Utils.esc(t('network.myNoData'))}</span>`;
    }
  }

  // ---- Stats Cards ----
  function renderNetworkStats(allPeers, connectedPeers) {
    const t = I18n.t.bind(I18n);
    const versions = new Set(allPeers.map(p => p.version).filter(Boolean));
    const totalTraffic = allPeers.reduce((s, p) => s + (p.downloadedVolume || 0), 0);
    return `<div class="stats-grid mb-6">
      <div class="stat-card" style="--accent-color:#10b981">
        <div class="stat-card__icon" style="background:rgba(16,185,129,0.15)">✅</div>
        <div class="stat-card__label">${Utils.esc(t('network.stat.connected'))}</div>
        <div class="stat-card__value" style="color:#10b981">${connectedPeers.length}</div>
        <div class="stat-card__sub">${Utils.esc(t('network.stat.connectedSub', { n: allPeers.length }))}</div>
      </div>
      <div class="stat-card" style="--accent-color:#9333ea">
        <div class="stat-card__icon" style="background:rgba(147,51,234,0.15)">🔢</div>
        <div class="stat-card__label">${Utils.esc(t('network.stat.versions'))}</div>
        <div class="stat-card__value" style="color:#9333ea">${versions.size}</div>
        <div class="stat-card__sub">${Utils.esc(t('network.stat.versionsSub'))}</div>
      </div>
      <div class="stat-card" style="--accent-color:#3b82f6">
        <div class="stat-card__icon" style="background:rgba(59,130,246,0.15)">📥</div>
        <div class="stat-card__label">${Utils.esc(t('network.stat.traffic'))}</div>
        <div class="stat-card__value" style="color:#3b82f6;font-size:20px">${Utils.formatBytes(totalTraffic)}</div>
        <div class="stat-card__sub">${Utils.esc(t('network.stat.trafficSub'))}</div>
      </div>
    </div>`;
  }

  async function loadPeers() {
    const tableBody = document.getElementById('peers-table-body');
    const statsEl   = document.getElementById('network-stats');

    try {
      const [allData, connData] = await Promise.all([
        API.getPeers(''),
        API.getPeers(1)
      ]);

      const allPeers  = allData.peers || [];
      const connPeers = connData.peers || [];

      if (statsEl) statsEl.innerHTML = renderNetworkStats(allPeers, connPeers);

      const displayPeers = currentFilter === 1 ? connPeers : allPeers;
      if (tableBody) tableBody.innerHTML = renderPeersTable(displayPeers);

      renderVersionChart(allPeers);
    } catch(err) {
      if (tableBody) tableBody.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__sub">${Utils.esc(err.message)}</div></div>`;
    }
  }

  function setFilter(f) {
    currentFilter = f;
    const btn1 = document.getElementById('filter-connected');
    const btn2 = document.getElementById('filter-all');
    if (btn1) btn1.classList.toggle('active', f === 1);
    if (btn2) btn2.classList.toggle('active', f === '');
    loadPeers();
  }

  async function render(params) {
    const outlet = document.getElementById('router-outlet');

    const t = I18n.t.bind(I18n);
    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('network.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('network.subtitle'))}</p>
      </div>

      <div id="network-stats">
        <div class="stats-grid mb-6">
          ${Array(3).fill('<div class="stat-card"><div class="skeleton skeleton-stat"></div></div>').join('')}
        </div>
      </div>

      <div class="grid-2-1 section-gap">
        <div class="card">
          <div class="card__header">
            <span class="card__title">${Utils.esc(t('network.listTitle'))}</span>
            <div class="flex gap-2">
              <button class="btn btn--ghost btn--sm active" id="filter-connected" onclick="PageNetwork.setFilter(1)">${Utils.esc(t('network.filterConn'))}</button>
              <button class="btn btn--ghost btn--sm" id="filter-all" onclick="PageNetwork.setFilter('')">${Utils.esc(t('network.filterAll'))}</button>
              <button class="btn btn--ghost btn--sm" onclick="PageNetwork.loadPeers()">⟳</button>
            </div>
          </div>
          <div id="peers-table-body">
            <div class="page-loading" style="height:160px"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="card">
          <div class="card__header">
            <span class="card__title">${Utils.esc(t('network.versionsTitle'))}</span>
          </div>
          <div class="chart-wrap" style="height:220px">
            <canvas id="version-chart"></canvas>
          </div>
          <div class="card__title mt-4 mb-4">${Utils.esc(t('network.myNode'))}</div>
          <div id="my-node-info">
            <div class="skeleton skeleton-text"></div>
          </div>
        </div>
      </div>
    `;

    await loadPeers();
    loadMyInfo();

    refreshInterval = setInterval(loadPeers, 5 * 60 * 1000); // refresh every 5 min

    return () => {
      clearInterval(refreshInterval);
      if (versionChart) { try { versionChart.destroy(); } catch(e){} versionChart = null; }
    };
  }

  return { render, loadPeers, setFilter };
})();
