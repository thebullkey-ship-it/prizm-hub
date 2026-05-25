/* =====================================================
   PRIZM Hub — Статистика «Общая» (агрегаты по балансам)
   ===================================================== */

const PageStatsGeneral = (() => {
  function emptyRow() {
    return `<tr><td>—</td><td>—</td><td class="delta--up">—</td><td>—</td><td class="delta--down">—</td><td>—</td><td class="delta--up">—</td></tr>`;
  }

  async function render() {
    const outlet = document.getElementById('router-outlet');
    const remote = await API.tryStatsEndpoint('general');

    const t = I18n.t.bind(I18n);
    const jsonBlock = remote
      ? `<div class="card section-gap"><div class="card__header"><span class="card__title">${Utils.esc(t('statsGen.rawApi'))}</span></div>
          <pre class="text-xs mono" style="overflow:auto;max-height:280px;color:var(--text-muted)">${Utils.esc(JSON.stringify(remote, null, 2))}</pre></div>`
      : '';

    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('statsGen.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('statsGen.subtitle'))}</p>
      </div>
      ${Utils.statsDateRangeBar()}
      ${Utils.statsApiPendingNote()}
      ${jsonBlock}
      <div class="card section-gap">
        <div class="card__header"><span class="card__title">${Utils.esc(t('statsGen.card1'))}</span></div>
        <div class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th rowspan="2">${Utils.esc(t('statsGen.th.balCat'))}</th><th colspan="2">${Utils.esc(t('statsGen.th.wallets'))}</th><th colspan="2">${Utils.esc(t('statsGen.th.balance'))}</th><th colspan="2">${Utils.esc(t('statsGen.th.pm'))}</th></tr>
              <tr class="subhead"><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th></tr>
            </thead>
            <tbody>${emptyRow()}</tbody>
          </table>
        </div>
      </div>
      <div class="card section-gap">
        <div class="card__header"><span class="card__title">${Utils.esc(t('statsGen.card2'))}</span></div>
        <div class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th rowspan="2">${Utils.esc(t('statsGen.th.cat'))}</th><th colspan="2">${Utils.esc(t('statsGen.th.count'))}</th><th colspan="2">${Utils.esc(t('statsGen.th.balance'))}</th><th colspan="2">${Utils.esc(t('statsGen.th.pm'))}</th></tr>
              <tr class="subhead"><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th></tr>
            </thead>
            <tbody>${emptyRow()}</tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card__header"><span class="card__title">${Utils.esc(t('statsGen.card3'))}</span></div>
        <div class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th rowspan="2">${Utils.esc(t('statsGen.th.cat'))}</th><th colspan="2">${Utils.esc(t('statsGen.th.count'))}</th><th colspan="2">${Utils.esc(t('statsGen.th.balance'))}</th><th colspan="2">${Utils.esc(t('statsGen.th.pm'))}</th></tr>
              <tr class="subhead"><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th></tr>
            </thead>
            <tbody>${emptyRow()}</tbody>
          </table>
        </div>
      </div>`;

    return null;
  }

  return { render };
})();
