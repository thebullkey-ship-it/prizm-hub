const StatsDates = (() => {
  const EPOCH = StatsConstants.GENESIS_EPOCH;
  const OFFSET = StatsConstants.DAYS_UNTIL_START_EPOCH;

  function getDayFrom(date) {
    const d = date || StatsEngine.state.dateFrom;
    const tz = d.getTimezoneOffset();
    return Math.floor((d.getTime() - Date.parse(EPOCH) - tz * 60 * 1000) / 86400000) + OFFSET - 1;
  }

  function getDayTo(date) {
    const d = date || StatsEngine.state.dateTo;
    const tz = d.getTimezoneOffset();
    return Math.floor((d.getTime() - Date.parse(EPOCH) - tz * 60 * 1000) / 86400000) + OFFSET;
  }

  function dayToDate(dayTo) {
    return new Date(Date.parse(EPOCH) + (dayTo - OFFSET) * 86400000);
  }

  return { getDayFrom, getDayTo, dayToDate };
})();
