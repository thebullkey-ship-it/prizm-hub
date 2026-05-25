/* =====================================================
   PRIZM Hub — Паракалькулятор (аккаунт ноды + макет прогноза)
   ===================================================== */

const PageParacalc = (() => {
  const PAGE_SIZE = 25;

  function fieldRow(label, value) {
    return `<div class="detail-row"><span class="detail-row__label">${Utils.esc(label)}</span><span class="detail-row__value text-mono">${value}</span></div>`;
  }

  function formatNqt(nqt) {
    if (nqt == null || nqt === '') return '—';
    return Utils.formatPzm(nqt, 2);
  }

  async function render(params) {
    const outlet = document.getElementById('router-outlet');
    const t = I18n.t.bind(I18n);
    const account = (params.account || '').trim();
    const page = Math.max(1, parseInt(params.p, 10) || 1);

    let errMsg = '';
    let acc = null;
    if (account) {
      try {
        acc = await API.getAccount(account);
      } catch (e) {
        errMsg = e.message || String(e);
      }
    }

    const gridLeft = acc
      ? [
          fieldRow(t('paracalc.f.confirmed'), formatNqt(acc.balanceNQT)),
          fieldRow(t('paracalc.f.hold'), '—'),
          fieldRow(t('paracalc.f.struct'), '—'),
          fieldRow(t('paracalc.f.pmCur'), '—'),
          fieldRow(t('paracalc.f.pmGreen'), '—'),
          fieldRow(t('paracalc.f.pmMax'), '—'),
          fieldRow(t('paracalc.f.forged'), formatNqt(acc.forgedBalanceNQT)),
        ].join('')
      : `<p class="text-muted text-sm">${Utils.esc(t('paracalc.hintLoad'))}</p>`;

    const gridRight = acc
      ? [
          fieldRow(t('paracalc.f.unconfirmed'), formatNqt(acc.unconfirmedBalanceNQT)),
          fieldRow(t('paracalc.f.dailyEm'), '—'),
          fieldRow(t('paracalc.f.genesisBal'), '—'),
          fieldRow(t('paracalc.f.holdSince'), '—'),
          fieldRow(t('paracalc.f.greenEnd'), '—'),
          fieldRow(t('paracalc.f.pmMaxDate'), '—'),
          fieldRow(t('paracalc.f.blocksToHold'), '—'),
        ].join('')
      : '';

    const totalForecastRows = 120;
    const pageCount = Math.ceil(totalForecastRows / PAGE_SIZE);
    const start = (page - 1) * PAGE_SIZE;
    const rows = [];
    const dateLoc = I18n.getBcp47();
    for (let i = 0; i < PAGE_SIZE && start + i < totalForecastRows; i++) {
      const dayNum = start + i + 1;
      const d = new Date();
      d.setDate(d.getDate() + dayNum);
      const dateStr = d.toLocaleDateString(dateLoc);
      rows.push(`<tr><td>${dayNum}</td><td>${dateStr}</td><td class="text-faint">0,00</td><td class="text-faint">0,00</td><td class="text-success">—</td></tr>`);
    }

    const accQ = account ? '&account=' + encodeURIComponent(account) : '';
    const pag = pageCount > 1
      ? `<div class="pagination-bar">
          <span class="text-xs text-muted">${Utils.esc(t('pagination.page', { cur: page, total: pageCount }))}</span>
          <div class="flex gap-2">
            <button type="button" class="btn btn--sm btn--outline" ${page <= 1 ? 'disabled' : ''} onclick="Router.navigate('/paracalc?p=${page - 1}${accQ}')">${Utils.esc(t('pagination.back'))}</button>
            <button type="button" class="btn btn--sm btn--outline" ${page >= pageCount ? 'disabled' : ''} onclick="Router.navigate('/paracalc?p=${page + 1}${accQ}')">${Utils.esc(t('pagination.forward'))}</button>
          </div>
        </div>`
      : '';

    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('paracalc.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('paracalc.subtitle'))}</p>
      </div>

      <div class="card section-gap">
        <div class="card__header">
          <span class="card__title">${Utils.esc(t('paracalc.account'))}</span>
        </div>
        <div class="flex gap-3 mb-4" style="flex-wrap:wrap;align-items:center">
          <input type="text" id="paracalc-rs" class="search-input" style="width:min(420px,100%)" placeholder="PRIZM-XXXX-...." value="${Utils.esc(account)}" />
          <button type="button" class="btn btn--primary" id="paracalc-load">${Utils.esc(t('paracalc.load'))}</button>
        </div>
        ${errMsg ? `<div class="empty-state" style="padding:var(--sp-4) 0"><div class="empty-state__sub text-danger">${Utils.esc(errMsg)}</div></div>` : ''}
        ${acc ? `<div class="grid-2" style="gap:var(--sp-6)">
          <div>${gridLeft}</div>
          <div>${gridRight}</div>
        </div>` : ''}
      </div>

      <div class="card">
        <div class="card__header"><span class="card__title">${Utils.esc(t('paracalc.forecast'))}</span></div>
        <p class="text-xs text-faint mb-3">${Utils.esc(t('paracalc.demoPag', { n: PAGE_SIZE }))}</p>
        <div class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th>${Utils.esc(t('paracalc.th.day'))}</th><th>${Utils.esc(t('paracalc.th.date'))}</th><th>${Utils.esc(t('paracalc.th.pm'))}</th><th>${Utils.esc(t('paracalc.th.pairs'))}</th><th>${Utils.esc(t('paracalc.th.genesisBal'))}</th></tr>
            </thead>
            <tbody>${rows.join('')}</tbody>
          </table>
        </div>
        ${pag}
      </div>`;

    const loadBtn = document.getElementById('paracalc-load');
    const inp = document.getElementById('paracalc-rs');
    if (loadBtn && inp) {
      const go = () => {
        const v = inp.value.trim();
        if (!v) return;
        Router.navigate('/paracalc?account=' + encodeURIComponent(v));
      };
      loadBtn.onclick = go;
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') go();
      });
    }

    return null;
  }

  return { render };
})();
