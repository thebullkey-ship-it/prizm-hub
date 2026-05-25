/* PRIZM Hub — Обменники */
const PageExchanges = (() => {
  let unbind = null;

  function paint() {
    const root = document.getElementById('stats-ex-root');
    if (!root || !StatsEngine.state.bazeAvailable) return;
    const { exchangers, draw } = StatsEngine.renderExchangers();
    const t = I18n.t.bind(I18n);
    const exTable = (titleKey, rows) => `
      <div class="card ${titleKey === 'exchanges.drawTitle' ? 'section-gap' : ''}">
        <div class="card__header"><span class="card__title">${Utils.esc(t(titleKey))}</span></div>
        <div class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th>${Utils.esc(t('exchanges.th.name'))}</th><th>${Utils.esc(t('exchanges.th.balance'))}</th><th>${Utils.esc(t('exchanges.th.income'))}</th><th>${Utils.esc(t('exchanges.th.month'))}</th><th>%</th><th>${Utils.esc(t('exchanges.th.out'))}</th></tr>
            </thead>
            <tbody>${StatsUI.tableBody(rows, 6)}</tbody>
          </table>
        </div>
      </div>`;
    root.innerHTML = exTable('exchanges.cardTitle', exchangers)
      + (draw.length > 1 ? exTable('exchanges.drawTitle', draw) : '');
  }

  async function render() {
    const outlet = document.getElementById('router-outlet');
    const t = I18n.t.bind(I18n);
    await StatsEngine.ensureReady();
    const st = StatsEngine.state;

    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('exchanges.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('exchanges.subtitle'))}</p>
      </div>
      ${StatsUI.dateRangeBar(st)}
      ${st.bazeAvailable ? '' : StatsUI.dataMissingBanner()}
      <div id="stats-ex-root"></div>`;

    StatsUI.bindDateBar(st, () => { StatsEngine.clearRendered(); paint(); });
    if (st.bazeAvailable) paint();
    unbind = StatsEngine.onRange(() => paint());
    return () => { if (unbind) unbind(); };
  }

  return { render };
})();
