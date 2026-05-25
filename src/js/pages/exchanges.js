/* =====================================================
   PRIZM Hub — Обменники
   ===================================================== */

const PageExchanges = (() => {
  async function render() {
    const outlet = document.getElementById('router-outlet');
    const remote = await API.tryStatsEndpoint('exchanges');

    const list = Array.isArray(remote?.items)
      ? remote.items.map((x) => `<li>${Utils.esc(typeof x === 'string' ? x : JSON.stringify(x))}</li>`).join('')
      : '';

    const t = I18n.t.bind(I18n);
    outlet.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">${Utils.esc(t('exchanges.title'))}</h1>
        <p class="page-header__subtitle">${Utils.esc(t('exchanges.subtitle'))}</p>
      </div>
      ${Utils.statsApiPendingNote()}
      <div class="card">
        ${remote && list
          ? `<ul class="text-sm text-muted" style="padding-left:1.2rem;line-height:1.8">${list}</ul>`
          : `<p class="text-muted text-sm">${t('exchanges.pending')}</p>`}
        ${remote && typeof remote === 'object' && !list
          ? `<pre class="text-xs mono mt-4" style="overflow:auto;max-height:240px">${Utils.esc(JSON.stringify(remote, null, 2))}</pre>`
          : ''}
      </div>`;

    return null;
  }

  return { render };
})();
