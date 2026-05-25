const StatsUI = (() => {
  function tableBody(rows, columns) {
    if (!rows.length) {
      return `<tr><td colspan="${columns}" class="text-muted text-center">${Utils.esc(I18n.t('stats.noData'))}</td></tr>`;
    }
    return rows.map((row) => {
      const totalCls = row.categories === 'total' || row.categories === 'from1K' ? ' row-total' : '';
      const cells = row._cells.map((c) => {
        const cls = [c.class, totalCls].filter(Boolean).join(' ');
        return `<td class="${cls}">${Utils.esc(c.text)}</td>`;
      }).join('');
      const cat = Utils.esc(StatsFormat.categoryLabel(row.categories) || row.categories);
      return `<tr class="${totalCls}"><td>${cat}</td>${cells}</tr>`;
    }).join('');
  }

  function dateRangeBar(state, onApply) {
    const T = I18n.t.bind(I18n);
    const df = state.dateFrom.toISOString().slice(0, 10);
    const dt = state.dateTo.toISOString().slice(0, 10);
    const min = '2018-07-28';
    const max = state.lastDate.toISOString().slice(0, 10);
    const periods = ['today', 'yesterday', 'week', 'all'].map((p) =>
      `<button type="button" class="btn btn--sm ${state.period === p ? 'btn--primary' : 'btn--outline'}" data-stats-period="${p}">${Utils.esc(T('stats.period.' + p))}</button>`
    ).join('');
    return `<div class="stats-date-bar card card--flat" id="stats-date-bar">
      <div class="stats-date-bar__row flex-wrap gap-2" style="align-items:center">
        <span class="text-sm text-muted">${Utils.esc(T('stats.period'))}</span>
        <div class="flex gap-1 flex-wrap">${periods}</div>
        <label class="text-sm">${Utils.esc(T('stats.dateFrom'))} <input type="date" id="stats-date-from" class="input-inline" value="${df}" min="${min}" max="${dt}" /></label>
        <label class="text-sm">${Utils.esc(T('stats.dateTo'))} <input type="date" id="stats-date-to" class="input-inline" value="${dt}" min="${df}" max="${max}" /></label>
        <button type="button" class="btn btn--sm btn--primary" id="stats-date-apply">${Utils.esc(T('stats.apply'))}</button>
      </div>
      <p class="text-xs text-faint stats-date-bar__hint">${Utils.esc(T('stats.dateRangeHint', { from: StatsFormat.dateFormat(state.dateFrom), to: StatsFormat.dateFormat(state.dateTo) }))}</p>
    </div>`;
  }

  function bindDateBar(state, onApply) {
    const bar = document.getElementById('stats-date-bar');
    if (!bar) return;
    bar.querySelectorAll('[data-stats-period]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.period = btn.getAttribute('data-stats-period');
        try { localStorage.setItem('prizm-stats-period', state.period); } catch (_) {}
        StatsDates.setPeriod(state.period, state, true);
      });
    });
    const from = document.getElementById('stats-date-from');
    const to = document.getElementById('stats-date-to');
    const apply = document.getElementById('stats-date-apply');
    if (apply) {
      apply.addEventListener('click', () => {
        if (from) state.dateFrom = from.valueAsDate || state.dateFrom;
        if (to) state.dateTo = to.valueAsDate || state.dateTo;
        state.period = 'custom';
        state.dayFrom = StatsDates.getDayFrom(state.dateFrom);
        state.dayTo = StatsDates.getDayTo(state.dateTo);
        onApply();
      });
    }
  }

  function dataMissingBanner() {
    return `<div class="card card--flat stats-pending">
      <p class="text-sm text-muted">${I18n.t('stats.bazeMissing')}</p>
    </div>`;
  }

  return { tableBody, dateRangeBar, bindDateBar, dataMissingBanner };
})();
