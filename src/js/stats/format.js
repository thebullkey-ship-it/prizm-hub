const StatsFormat = (() => {
  function locale() {
    return typeof I18n !== 'undefined' ? I18n.getBcp47() : 'ru-RU';
  }

  function numberFormat(num, minimumFractionDigits) {
    const opts = {};
    if (minimumFractionDigits != null) opts.minimumFractionDigits = minimumFractionDigits;
    return new Intl.NumberFormat(locale(), opts).format(num);
  }

  function percentFormat(num) {
    if (!num) num = 0;
    return new Intl.NumberFormat(locale(), { style: 'percent', maximumFractionDigits: 2 }).format(num);
  }

  function dateFormat(date, options, useEn) {
    const ln = useEn ? 'en' : (typeof I18n !== 'undefined' ? I18n.getLangCode() : 'ru');
    const loc = ln + '-' + ln.toUpperCase();
    return new Intl.DateTimeFormat(loc, options).format(date);
  }

  function categoryLabel(key) {
    if (typeof I18n !== 'undefined') {
      const t = I18n.t('stats.cat.' + key);
      if (t && t !== 'stats.cat.' + key) return t;
    }
    return key;
  }

  function deltaCellClass(formattedDelta) {
    if (formattedDelta == null || formattedDelta === '—' || formattedDelta === '-') return '';
    const s = String(formattedDelta).replace(/\s/g, '');
    if (s.startsWith('-') || s.startsWith('−')) return 'delta--down';
    if (s !== '0' && s !== '0,00' && s !== '0.00') return 'delta--up';
    return '';
  }

  return { numberFormat, percentFormat, dateFormat, categoryLabel, deltaCellClass };
})();
