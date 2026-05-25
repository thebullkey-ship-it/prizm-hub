/* =====================================================
   PRIZM Hub — Статистика блоков (по балансу форжера, время)
   ===================================================== */

const PageStatsBlocks = (() => {
  async function render() {
    const outlet = document.getElementById('router-outlet');
    const remote = await API.tryStatsEndpoint('blocks');

    const jsonBlock = remote
      ? `<div class="card section-gap"><pre class="text-xs mono" style="overflow:auto;max-height:220px;color:var(--text-muted)">${Utils.esc(JSON.stringify(remote, null, 2))}</pre></div>`
      : '';

    const t = I18n.t.bind(I18n);
    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('statsBlocks.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('statsBlocks.subtitle'))}</p>
      </div>
      ${Utils.statsDateRangeBar()}
      ${Utils.statsApiPendingNote()}
      ${jsonBlock}
      <div class="card section-gap">
        <div class="card__header"><span class="card__title">${Utils.esc(t('statsBlocks.card1'))}</span></div>
        <div class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th rowspan="2">${Utils.esc(t('statsBlocks.th.forgingCat'))}</th><th colspan="2">${Utils.esc(t('statsBlocks.th.blocks'))}</th><th colspan="2">${Utils.esc(t('statsBlocks.th.fee'))}</th></tr>
              <tr class="subhead"><th>Σ</th><th>%</th><th>Σ</th><th>%</th></tr>
            </thead>
            <tbody><tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr></tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card__header"><span class="card__title">${Utils.esc(t('statsBlocks.card2'))}</span></div>
        <div class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th>${Utils.esc(t('statsBlocks.th.periods'))}</th><th colspan="2">${Utils.esc(t('statsBlocks.th.blocks2'))}</th><th>${Utils.esc(t('statsBlocks.th.pct'))}</th></tr>
              <tr class="subhead"><th></th><th>Σ</th><th>%</th><th></th></tr>
            </thead>
            <tbody><tr><td>—</td><td>—</td><td>—</td><td>—</td></tr></tbody>
          </table>
        </div>
      </div>`;

    return null;
  }

  return { render };
})();
