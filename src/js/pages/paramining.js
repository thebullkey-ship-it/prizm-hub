/* PRIZM Hub — Парамайнинг */
const PageParamining = (() => {
  let unbind = null;

  function parBlock(titleKey, rows) {
    const t = I18n.t.bind(I18n);
    return `<div class="card section-gap">
      <div class="card__header"><span class="card__title">${Utils.esc(t(titleKey))}</span></div>
      <div class="stats-table-wrap">
        <table class="stats-table">
          <thead>
            <tr><th rowspan="2">${Utils.esc(t('paramining.th.cat'))}</th><th colspan="2">${Utils.esc(t('paramining.th.wallets'))}</th><th colspan="2">${Utils.esc(t('paramining.th.balance'))}</th><th colspan="2">${Utils.esc(t('paramining.th.pm'))}</th><th colspan="2">${Utils.esc(t('paramining.th.forecast'))}</th></tr>
            <tr class="subhead"><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th></tr>
          </thead>
          <tbody>${StatsUI.tableBody(rows, 9)}</tbody>
        </table>
      </div>
    </div>`;
  }

  function paint() {
    const root = document.getElementById('stats-par-root');
    if (!root || !StatsEngine.state.bazeAvailable) return;
    const p = StatsEngine.renderParTables();
    root.innerHTML = [
      parBlock('paramining.b1', p.general || []),
      parBlock('paramining.b2', p.hold || []),
      parBlock('paramining.b3', p.red || []),
      parBlock('paramining.b4', p.green || []),
      parBlock('paramining.b5', p.forg || []),
    ].join('');
  }

  async function render() {
    const outlet = document.getElementById('router-outlet');
    await StatsEngine.ensureReady();
    const st = StatsEngine.state;
    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(I18n.t('paramining.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(I18n.t('paramining.subtitle'))}</p>
      </div>
      ${StatsUI.dateRangeBar(st)}
      ${st.bazeAvailable ? '' : StatsUI.dataMissingBanner()}
      <div id="stats-par-root"></div>`;
    StatsUI.bindDateBar(st, () => { StatsEngine.clearRendered(); paint(); });
    if (st.bazeAvailable) paint();
    unbind = StatsEngine.onRange(() => paint());
    return () => { if (unbind) unbind(); };
  }

  return { render };
})();
