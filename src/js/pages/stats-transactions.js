/* =====================================================
   PRIZM Hub — Статистика транзакций + неактивные кошельки
   ===================================================== */

const PageStatsTransactions = (() => {
  async function render() {
    const outlet = document.getElementById('router-outlet');
    const remote = await API.tryStatsEndpoint('transactions');
    const jsonBlock = remote
      ? `<div class="card section-gap"><pre class="text-xs mono" style="overflow:auto;max-height:220px;color:var(--text-muted)">${Utils.esc(JSON.stringify(remote, null, 2))}</pre></div>`
      : '';

    const t = I18n.t.bind(I18n);
    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('statsTx.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('statsTx.subtitle'))}</p>
      </div>
      ${Utils.statsDateRangeBar()}
      ${Utils.statsApiPendingNote()}
      ${jsonBlock}
      <div class="card section-gap">
        <div class="card__header"><span class="card__title">${Utils.esc(t('statsTx.cardTitle'))}</span></div>
        <div class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr>
                <th>${Utils.esc(t('statsTx.th.cat'))}</th>
                <th>${Utils.esc(t('statsTx.th.count'))}</th>
                <th>${Utils.esc(t('statsTx.th.sum'))}</th>
                <th>${Utils.esc(t('statsTx.th.cFromGenesis'))}</th>
                <th>${Utils.esc(t('statsTx.th.sFromGenesis'))}</th>
              </tr>
            </thead>
            <tbody><tr><td>—</td><td>—</td><td class="text-success">—</td><td>—</td><td class="text-success">—</td></tr></tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card__header"><span class="card__title">${Utils.esc(t('statsTx.inactiveTitle'))}</span></div>
        <div class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th rowspan="2">${Utils.esc(t('statsTx.th.balCat'))}</th><th colspan="2">${Utils.esc(t('statsTx.th.wallets2'))}</th><th colspan="2">${Utils.esc(t('statsTx.th.balance2'))}</th></tr>
              <tr class="subhead"><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th></tr>
            </thead>
            <tbody><tr><td>—</td><td>—</td><td class="delta--up">—</td><td>—</td><td class="delta--down">—</td></tr></tbody>
          </table>
        </div>
      </div>`;

    return null;
  }

  return { render };
})();
