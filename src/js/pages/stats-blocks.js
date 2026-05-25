/* PRIZM Hub — Статистика блоков */
const PageStatsBlocks = (() => {
  let unbind = null;

  function paint() {
    const root = document.getElementById('stats-blocks-root');
    if (!root || !StatsEngine.state.bazeAvailable) return;
    const { blocks, time } = StatsEngine.renderBlocks();
    const t = I18n.t.bind(I18n);
    root.innerHTML = `
      <div class="card section-gap">
        <div class="card__header"><span class="card__title">${Utils.esc(t('statsBlocks.card1'))}</span></div>
        <div class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th rowspan="2">${Utils.esc(t('statsBlocks.th.forgingCat'))}</th><th colspan="2">${Utils.esc(t('statsBlocks.th.blocks'))}</th><th colspan="2">${Utils.esc(t('statsBlocks.th.fee'))}</th></tr>
              <tr class="subhead"><th>Σ</th><th>%</th><th>Σ</th><th>%</th></tr>
            </thead>
            <tbody>${StatsUI.tableBody(blocks, 5)}</tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card__header"><span class="card__title">${Utils.esc(t('statsBlocks.card2'))}</span></div>
        <div class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th>${Utils.esc(t('statsBlocks.th.periods'))}</th><th colspan="2">${Utils.esc(t('statsBlocks.th.blocks2'))}</th><th>${Utils.esc(t('statsBlocks.th.pct'))}</th></tr>
              <tr class="subhead"><th></th><th>Σ</th><th>%</th><th>Σ%</th></tr>
            </thead>
            <tbody>${StatsUI.tableBody(time, 4)}</tbody>
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
        <h1 class="page-header__title">${Utils.esc(t('statsBlocks.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('statsBlocks.subtitle'))}</p>
      </div>
      ${StatsUI.dateRangeBar(st)}
      ${st.bazeAvailable ? '' : StatsUI.dataMissingBanner()}
      <div id="stats-blocks-root"></div>`;

    StatsUI.bindDateBar(st, () => {
      StatsEngine.clearRendered();
      paint();
    });
    if (st.bazeAvailable) paint();
    unbind = StatsEngine.onRange(() => paint());
    return () => { if (unbind) unbind(); };
  }

  return { render };
})();
