/* =====================================================
   PRIZM Hub — Парамайнинг (агрегированные таблицы)
   ===================================================== */

const PageParamining = (() => {
  function block(titleKey) {
    const t = I18n.t.bind(I18n);
    return `<div class="card section-gap">
      <div class="card__header"><span class="card__title">${Utils.esc(t(titleKey))}</span></div>
      <div class="stats-table-wrap">
        <table class="stats-table">
          <thead>
            <tr><th rowspan="2">${Utils.esc(t('paramining.th.cat'))}</th><th colspan="2">${Utils.esc(t('paramining.th.wallets'))}</th><th colspan="2">${Utils.esc(t('paramining.th.balance'))}</th><th colspan="2">${Utils.esc(t('paramining.th.pm'))}</th><th colspan="2">${Utils.esc(t('paramining.th.forecast'))}</th></tr>
            <tr class="subhead"><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th><th>Σ</th><th>Δ</th></tr>
          </thead>
          <tbody><tr><td>—</td><td>—</td><td class="delta--up">—</td><td>—</td><td class="delta--down">—</td><td>—</td><td class="delta--up">—</td><td>—</td><td class="delta--down">—</td></tr></tbody>
        </table>
      </div>
    </div>`;
  }

  async function render() {
    const outlet = document.getElementById('router-outlet');
    const remote = await API.tryStatsEndpoint('paramining');
    const jsonBlock = remote
      ? `<div class="card section-gap"><pre class="text-xs mono" style="overflow:auto;max-height:200px;color:var(--text-muted)">${Utils.esc(JSON.stringify(remote, null, 2))}</pre></div>`
      : '';

    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(I18n.t('paramining.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(I18n.t('paramining.subtitle'))}</p>
      </div>
      ${Utils.statsDateRangeBar()}
      ${Utils.statsApiPendingNote()}
      ${jsonBlock}
      ${block('paramining.b1')}
      ${block('paramining.b2')}
      ${block('paramining.b3')}
      ${block('paramining.b4')}
      ${block('paramining.b5')}`;

    return null;
  }

  return { render };
})();
