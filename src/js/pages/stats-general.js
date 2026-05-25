/* PRIZM Hub — Статистика «Общая» */
const PageStatsGeneral = (() => {
  let unbind = null;

  function tableCard(titleKey, tbodyHtml, colCount) {
    const t = I18n.t.bind(I18n);
    return `<div class="card section-gap">
      <div class="card__header"><span class="card__title">${Utils.esc(t(titleKey))}</span></div>
      <div class="stats-table-wrap">
        <table class="stats-table">
          <thead>
            <tr><th rowspan="2">${Utils.esc(t('statsGen.th.balCat'))}</th><th colspan="2">${Utils.esc(t('statsGen.th.wallets'))}</th><th colspan="2">${Utils.esc(t('statsGen.th.balance'))}</th><th colspan="2">${Utils.esc(t('statsGen.th.pm'))}</th></tr>
            <tr class="subhead"><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th></tr>
          </thead>
          <tbody>${tbodyHtml}</tbody>
        </table>
      </div>
    </div>`;
  }

  function paint() {
    const outlet = document.getElementById('router-outlet');
    if (!outlet || !StatsEngine.state.bazeAvailable) return;
    const data = StatsEngine.renderMainTables(false);
    const holdPct = StatsEngine.state.prevHoldSum
      ? ((StatsEngine.state.holdSum - StatsEngine.state.prevHoldSum) / StatsEngine.state.prevHoldSum * 100).toFixed(2)
      : '—';
    const holdNote = `<p class="text-sm text-muted mb-3">${Utils.esc(I18n.t('stats.holdSum'))}: ${StatsFormat.numberFormat(StatsEngine.state.holdSum / 100, 2)} PZM · Δ ${holdPct}%</p>`;
    const cards = [
      tableCard('statsGen.card1', StatsUI.tableBody(data.general, 7)),
      holdNote + tableCard('statsGen.card2', StatsUI.tableBody(data.hold, 7)),
      tableCard('statsGen.card3', StatsUI.tableBody(data.forg, 7)),
    ].join('');
    const existing = outlet.querySelector('#stats-general-tables');
    if (existing) existing.innerHTML = cards;
  }

  async function render() {
    const outlet = document.getElementById('router-outlet');
    const t = I18n.t.bind(I18n);
    await StatsEngine.ensureReady();
    const st = StatsEngine.state;

    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('statsGen.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('statsGen.subtitle'))}</p>
      </div>
      ${StatsUI.dateRangeBar(st)}
      ${st.bazeAvailable ? '' : StatsUI.dataMissingBanner()}
      <div id="stats-general-tables">${st.bazeAvailable ? '<div class="page-loading"><div class="spinner"></div></div>' : ''}</div>`;

    StatsUI.bindDateBar(st, () => {
      StatsEngine.state.dayFrom = StatsDates.getDayFrom();
      StatsEngine.state.dayTo = StatsDates.getDayTo();
      StatsEngine.clearRendered();
      paint();
    });

    if (st.bazeAvailable) paint();

    unbind = StatsEngine.onRange(() => paint());

    return () => { if (unbind) unbind(); };
  }

  return { render };
})();
