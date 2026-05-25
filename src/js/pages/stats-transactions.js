/* PRIZM Hub — Статистика транзакций */
const PageStatsTransactions = (() => {
  let unbind = null;

  function paint() {
    const root = document.getElementById('stats-tx-root');
    if (!root || !StatsEngine.state.bazeAvailable) return;
    const tx = StatsEngine.renderTransactions();
    const old = StatsEngine.renderOldWallets();
    const t = I18n.t.bind(I18n);
    root.innerHTML = `
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
            <tbody>${StatsUI.tableBody(tx.rows, 5)}</tbody>
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
            <tbody>${StatsUI.tableBody(old.rows, 5)}</tbody>
          </table>
        </div>
      </div>`;
  }

  async function render() {
    const outlet = document.getElementById('router-outlet');
    const t = I18n.t.bind(I18n);
    await StatsEngine.ensureReady();
    const st = StatsEngine.state;
    StatsEngine.renderMainTables(false);

    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('statsTx.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('statsTx.subtitle'))}</p>
      </div>
      ${StatsUI.dateRangeBar(st)}
      ${st.bazeAvailable ? '' : StatsUI.dataMissingBanner()}
      <div id="stats-tx-root"></div>`;

    StatsUI.bindDateBar(st, () => { StatsEngine.clearRendered(); paint(); });
    if (st.bazeAvailable) paint();
    unbind = StatsEngine.onRange(() => paint());
    return () => { if (unbind) unbind(); };
  }

  return { render };
})();
