/* PRIZM Hub — historical statistics engine (legacy baze portal logic). */
const StatsEngine = (() => {
  const C = StatsConstants;
  const F = StatsFormat;

  const state = {
    dateTo: new Date(),
    dateFrom: new Date(Date.now() - 86400000 * (C.DEFAULT_PERIOD_DAYS - 1)),
    lastDate: new Date(),
    dayFrom: 0,
    dayTo: 0,
    period: 'today',
    ready: false,
    loading: false,
    bazeAvailable: false,
    holdSum: 0,
    prevHoldSum: 0,
    mainTableBalanceDelta: 0,
  };

  const raw = {
    main: {},
    exchangers: { data: null },
    blocks: { data: null },
    timeBlocks: { data: null },
    transactions: { data: null },
    oldWallets: { data: null },
    par: { data: null },
    top100: {},
    calc: { data: null },
  };

  let _rangeListeners = [];

  function rowCells(values, deltaIndexes) {
    return values.map((text, i) => ({
      text: text == null ? '—' : String(text),
      class: deltaIndexes && deltaIndexes.includes(i) ? F.deltaCellClass(text) : '',
    }));
  }

  function clearRendered() {
    state._cache = {};
  }

  function onRangeChanged() {
    clearRendered();
    _rangeListeners.forEach((fn) => { try { fn(); } catch (_) {} });
  }

  StatsDates.setPeriod = function (period, st, render) {
    const last = st.lastDate;
    switch (period) {
      case 'today':
        st.dateFrom = new Date(last);
        st.dateTo = new Date(last);
        break;
      case 'yesterday': {
        const d = new Date(last.getTime() - 86400000);
        st.dateFrom = d;
        st.dateTo = d;
        break;
      }
      case 'week':
        st.dateFrom = new Date(last.getTime() - ((last.getDay() || 7) - 1) * 86400000);
        st.dateTo = new Date(last);
        break;
      case 'all':
        st.dateFrom = new Date('2018-07-28');
        st.dateTo = new Date(last);
        break;
      default:
        if (period * 1) {
          st.dateFrom = new Date();
          st.dateFrom.setFullYear(period);
          if (period === 2018) { st.dateFrom.setMonth(6); st.dateFrom.setDate(28); }
          else { st.dateFrom.setMonth(0); st.dateFrom.setDate(1); }
          st.dateTo = new Date();
          if (period === last.getFullYear()) st.dateTo = new Date(last);
          else { st.dateTo.setFullYear(period); st.dateTo.setMonth(11); st.dateTo.setDate(31); }
        } else {
          st.dateFrom = new Date(Date.parse(period + ` 1, ${last.getFullYear()}`));
          st.dateTo = new Date(last);
          if (st.dateFrom.getMonth() !== last.getMonth()) {
            st.dateTo.setMonth(st.dateFrom.getMonth() + 1);
            st.dateTo.setDate(0);
          }
        }
    }
    st.dayFrom = StatsDates.getDayFrom(st.dateFrom);
    st.dayTo = StatsDates.getDayTo(st.dateTo);
    if (render) onRangeChanged();
  };

  async function correctInitialDates() {
    const ex = await StatsData.loadExchangersHistory();
    if (!ex || !ex.data) return;
    raw.exchangers = ex;
    state.bazeAvailable = true;
    let dayTo = StatsDates.getDayTo(state.dateTo);
    let change = false;
    while (!ex.data[dayTo] && dayTo > 0) { dayTo--; change = true; }
    if (change) {
      state.dateTo = StatsDates.dayToDate(dayTo);
      state.lastDate = new Date(state.dateTo);
    }
    state.dayTo = dayTo;
    if (dayTo - state.dayFrom < C.DEFAULT_PERIOD_DAYS - 2) {
      state.dayFrom = dayTo - C.DEFAULT_PERIOD_DAYS;
      state.dateFrom = StatsDates.dayToDate(state.dayFrom);
    }
    let period = 'today';
    try { period = localStorage.getItem('prizm-stats-period') || period; } catch (_) {}
    state.period = period;
    StatsDates.setPeriod(period, state, false);
  }

  async function loadAll() {
    if (state.loading) return;
    state.loading = true;
    await correctInitialDates();
    if (!state.bazeAvailable) {
      state.loading = false;
      state.ready = true;
      return;
    }
    const [main, blocks, timeBlocks, tx, oldW, par, top, calc] = await Promise.all([
      StatsData.loadMainHistory(),
      StatsData.loadBlocksHistory(),
      StatsData.loadTimeBlocksHistory(),
      StatsData.loadTransactionsHistory(),
      StatsData.loadOldWalletsHistory(),
      StatsData.loadParHistory(),
      StatsData.loadTop100(),
      StatsData.loadMainWallets(),
    ]);
    raw.main = main;
    if (blocks) raw.blocks = blocks;
    if (timeBlocks) raw.timeBlocks = timeBlocks;
    if (tx) raw.transactions = tx;
    if (oldW) raw.oldWallets = oldW;
    if (par) raw.par = par;
    raw.top100 = top;
    if (calc) raw.calc = calc;
    state.loading = false;
    state.ready = true;
  }

  async function ensureReady() {
    if (!state.ready) await loadAll();
  }

  function renderMainTables(structCategory) {
    const key = `main_${state.dayFrom}_${state.dayTo}_${structCategory ? 1 : 0}`;
    if (state._cache && state._cache[key]) return state._cache[key];

    const cats = C.MAIN_TABLE_CATEGORIES;
    const general = []; const hold = []; const forg = [];
    const total = new Array(18).fill(0);
    state.holdSum = 0;
    state.prevHoldSum = 0;
    const structOff = 14;

    for (let i = 0; i < cats.length; i++) {
      const name = cats[i];
      const src = raw.main[name];
      if (!src) continue;
      const cur = src[state.dayTo];
      const prev = src[state.dayFrom];
      if (!cur || !prev) continue;

      for (let l = 0; l < 3; l++) {
        const row = []; const structRow = [];
        let c = 0; let p = 0;
        if (l > 0) c = 9;
        if (l > 1) { c = 5; p = 9; }
        let hide = false; let structHide = false;
        for (let j = 0; j < 6; j++) {
          if (l === 1 && j === 4) c++;
          if (l > 1 && j === 4) p++;
          if (j % 2 === 0) {
            const amount = cur[j / 2 + c] - (l > 1 ? cur[j / 2 + p] : 0);
            const structAmount = cur[j / 2 + c + structOff] - (l > 1 ? cur[j / 2 + p + structOff] : 0);
            row[j] = F.numberFormat(amount / (j > 0 ? 100 : 1), j > 0 ? 2 : 0);
            structRow[j] = F.numberFormat(structAmount / (j > 0 ? 100 : 1), j > 0 ? 2 : 0);
            total[j + l * 6] += amount;
            hide = j < 1 ? !amount : hide;
            structHide = j < 1 ? !structAmount : structHide;
            if (l === 1 && j === 2) {
              state.holdSum += cur[j + c];
              state.prevHoldSum += prev[j + c];
            }
          } else {
            let diff = 0;
            if (name !== 'lessThan1K' && name !== 'from10Kto100K' && name !== 'from100Kto1M') {
              diff = cur[Math.floor(j / 2) + c] - (l > 1 ? cur[Math.floor(j / 2) + p] : 0)
                - prev[Math.floor(j / 2) + c] + (l > 1 ? prev[Math.floor(j / 2) + p] : 0);
            }
            const structDiff = cur[Math.floor(j / 2) + c + structOff] - (l > 1 ? cur[Math.floor(j / 2) + p + structOff] : 0)
              - prev[Math.floor(j / 2) + c + structOff] + (l > 1 ? prev[Math.floor(j / 2) + p + structOff] : 0);
            row[j] = F.numberFormat(diff / (j > 1 ? 100 : 1), j > 1 ? 2 : 0);
            structRow[j] = F.numberFormat(structDiff / (j > 1 ? 100 : 1), j > 1 ? 2 : 0);
            total[j + l * 6] += diff;
            structHide = j < 2 ? structHide && !structDiff : structHide;
          }
        }
        const pack = (arr, r) => arr.push({
          categories: name,
          _cells: rowCells(r, [1, 3, 5]),
        });
        if (!hide) {
          if (l < 1) pack(general, row);
          else if (l < 2) pack(hold, row);
          else pack(forg, row);
        }
        if (!structHide && structCategory) {
          if (l < 1) pack(general, structRow);
          else if (l < 2) pack(hold, structRow);
          else pack(forg, structRow);
        }
      }
    }

    const pushTotal = (arr) => arr.push({
      categories: 'total',
      _cells: rowCells([
        F.numberFormat(total[0]), F.numberFormat(total[1]),
        F.numberFormat(total[2] / 100, 2), F.numberFormat(total[3] / 100, 2),
        F.numberFormat(total[4] / 100), F.numberFormat(total[5] / 100, 2),
      ], [1, 3, 5]),
    });
    state.mainTableBalanceDelta = total[3];
    pushTotal(general);
    pushTotal(hold);
    pushTotal(forg);

    const out = { general, hold, forg, holdSum: state.holdSum, prevHoldSum: state.prevHoldSum };
    if (!state._cache) state._cache = {};
    state._cache[key] = out;
    return out;
  }

  function renderExchangers() {
    const key = `ex_${state.dayFrom}_${state.dayTo}`;
    if (state._cache && state._cache[key]) return state._cache[key];
    const ex = raw.exchangers.data;
    if (!ex) return { exchangers: [], draw: [] };

    const exchangers = []; const draw = [];
    const total = { exchanger: [0, 0, 0, 0], draw: [0, 0, 0, 0] };
    const keys = Object.keys(C.EXCHANGERS_ORDER);

    for (let i = 0; i < C.EXCHANGERS.length; i++) {
      const name = C.EXCHANGERS[i];
      const type = C.EXCHANGERS_ORDER[name].type;
      const row = [0, 0, 0, 0];
      for (let j = 0; j < 4; j++) {
        if (j === 0) row[j] = ex[state.dayTo][j + i * 4] || 0;
        else {
          for (let day = state.dayTo; day > state.dayFrom; day--) {
            row[j] += (ex[day] && ex[day][j + i * 4]) || 0;
          }
        }
      }
      if (row[1] > 10000 || row[3] > 10000) {
        const item = {
          categories: name,
          _cells: rowCells([
            F.numberFormat(row[0] / 100, 2),
            F.numberFormat(row[1] / 100, 2),
            F.numberFormat(row[2] / 100, 2),
            F.percentFormat(row[2] / (row[1] || 1)),
            F.numberFormat(row[3] / 100, 2),
          ]),
        };
        if (type === 'exchanger') exchangers.push(item);
        else draw.push(item);
        for (let k = 0; k < 4; k++) total[type][k] += row[k];
      }
    }
    exchangers.push({
      categories: 'total',
      _cells: rowCells([
        F.numberFormat(total.exchanger[0] / 100, 2),
        F.numberFormat(total.exchanger[1] / 100, 2),
        F.numberFormat(total.exchanger[2] / 100, 2),
        F.percentFormat(total.exchanger[2] / (total.exchanger[1] || 1)),
        F.numberFormat(total.exchanger[3] / 100, 2),
      ]),
    });
    if (draw.length) {
      draw.push({
        categories: 'total',
        _cells: rowCells([
          F.numberFormat(total.draw[0] / 100, 2),
          F.numberFormat(total.draw[1] / 100, 2),
          F.numberFormat(total.draw[2] / 100, 2),
          F.percentFormat(total.draw[2] / (total.draw[1] || 1)),
          F.numberFormat(total.draw[3] / 100, 2),
        ]),
      });
    }
    const out = { exchangers, draw };
    exchangers.sort((a, b) => keys.indexOf(a.categories) - keys.indexOf(b.categories));
    draw.sort((a, b) => keys.indexOf(a.categories) - keys.indexOf(b.categories));
    if (!state._cache) state._cache = {};
    state._cache[key] = out;
    return out;
  }

  function renderBlocks() {
    const data = raw.blocks.data;
    if (!data) return { blocks: [], time: [] };
    const cats = C.MAIN_TABLE_CATEGORIES.filter((c) => c !== 'lessThan1K' && c !== 'from10Kto100K' && c !== 'from100Kto1M');
    const blocks = [];
    const total = [0, 0];
    const nums = []; const amounts = [];

    for (let i = 0; i < 9; i++) {
      let num = 0; let commission = 0;
      for (let day = state.dayTo; day > state.dayFrom; day--) {
        if (!data[day]) continue;
        num += data[day][i * 4];
        commission += data[day][1 + i * 4];
      }
      total[0] += num; total[1] += commission;
      nums.push(num); amounts.push(commission);
    }
    for (let i = 0; i < 9; i++) {
      if (nums[i]) {
        blocks.push({
          categories: cats[i + 3],
          _cells: rowCells([
            F.numberFormat(nums[i]),
            F.percentFormat(nums[i] / total[0]),
            F.numberFormat(amounts[i] / 100, 2),
            F.percentFormat(amounts[i] / total[1]),
          ]),
        });
      }
    }
    blocks.push({
      categories: 'total',
      _cells: rowCells([
        F.numberFormat(total[0]), F.percentFormat(1),
        F.numberFormat(total[1] / 100, 2), F.percentFormat(1),
      ]),
    });

    const tdata = raw.timeBlocks.data;
    const time = [];
    if (tdata) {
      let tTotal = 0;
      const tNums = [];
      for (let i = 0; i < 100; i++) {
        let amount = 0;
        for (let day = state.dayTo; day > state.dayFrom; day--) {
          if (tdata[day]) amount += tdata[day][i];
        }
        tTotal += amount;
        tNums.push(amount);
      }
      let curSum = 0;
      for (let i = 0; i < 100; i++) {
        curSum += tNums[i];
        if (tNums[i]) {
          const label = (i < 99 ? 'upto' : 'over') + ' '
            + String(Math.floor((i + (i < 99 ? 1 : 0)) / 2)).padStart(2, '0')
            + ' min ' + (i < 99 && i % 2 > 0 ? '00' : '30') + ' sec';
          time.push({
            categories: label,
            _cells: rowCells([
              F.numberFormat(tNums[i]),
              F.percentFormat(tNums[i] / tTotal),
              F.percentFormat(curSum / tTotal),
            ]),
          });
        }
      }
      time.push({
        categories: 'total',
        _cells: rowCells([F.numberFormat(tTotal), F.percentFormat(1), F.percentFormat(1)]),
      });
    }
    return { blocks, time };
  }

  function renderTransactions() {
    const data = raw.transactions.data;
    if (!data) return { rows: [] };
    const cats = C.MAIN_TABLE_CATEGORIES.filter((c) => c !== 'lessThan1K' && c !== 'from10Kto100K' && c !== 'from100Kto1M');
    const rows = [];
    const total = [0, 0, 0, 0];

    for (let i = 0; i < 12; i++) {
      const name = cats[i];
      const row = [0, 0, 0, 0];
      let amountMess = 0;
      for (let j = 0; j < 4; j++) {
        for (let day = state.dayTo; day > state.dayFrom; day--) {
          if (!data[day]) continue;
          row[j] += data[day][j + i * 7];
          if (i + j === 0) amountMess += data[day][6];
        }
        total[j] += row[j];
        if (j < 1) total[j] += amountMess;
      }
      if (amountMess) {
        rows.push({
          categories: 'messages',
          _cells: rowCells([F.numberFormat(amountMess), '—', '—', '—']),
        });
      }
      if (row[0] + row[1] || row[2] + row[3]) {
        rows.push({
          categories: name,
          _cells: rowCells([
            F.numberFormat(row[0]),
            F.numberFormat(row[1] / 100, 2),
            F.numberFormat(row[2]),
            F.numberFormat(row[3] / 100, 2),
          ]),
        });
      }
    }
    rows.push({
      categories: 'total',
      _cells: rowCells([
        F.numberFormat(total[0]),
        F.numberFormat(total[1] / 100, 2),
        F.numberFormat(total[2]),
        F.numberFormat(total[3] / 100, 2),
      ]),
    });
    if (state.mainTableBalanceDelta > 0 && state.mainTableBalanceDelta < total[3]) {
      rows.push({
        categories: 'burntCoins',
        _cells: rowCells(['', '', '', F.numberFormat((state.mainTableBalanceDelta - total[3]) / 100, 2)]),
      });
    }
    return { rows };
  }

  function renderOldWallets() {
    const data = raw.oldWallets.data;
    if (!data) return { rows: [] };
    const cats = C.MAIN_TABLE_CATEGORIES.filter((c) => c !== 'lessThan1K' && c !== 'from10Kto100K' && c !== 'from100Kto1M');
    const rows = [];
    const total = [0, 0, 0, 0];
    const from1k = [0, 0, 0, 0];

    for (let i = 0; i < 12; i++) {
      const name = cats[i];
      const row = [0, 0, 0, 0];
      for (let j = 0; j < 4; j++) {
        if (j % 2 === 0) {
          row[j] = (data[state.dayTo] && data[state.dayTo][j / 2 + i * 2]) || 0;
        } else {
          row[j] = (data[state.dayTo] && data[state.dayTo][(j - 1) / 2 + i * 2] || 0)
            - (data[state.dayFrom] && data[state.dayFrom][(j - 1) / 2 + i * 2] || 0);
        }
        total[j] += row[j];
        if (i >= 3) from1k[j] += row[j];
      }
      if (row[0] + row[1]) {
        rows.push({
          categories: name,
          _cells: rowCells([
            F.numberFormat(row[0]),
            F.numberFormat(row[1]),
            F.numberFormat(row[2] / 100, 2),
            F.numberFormat(row[3] / 100, 2),
          ], [1, 3]),
        });
      }
    }
    rows.push({
      categories: 'total',
      _cells: rowCells([
        F.numberFormat(total[0]), F.numberFormat(total[1]),
        F.numberFormat(total[2] / 100, 2), F.numberFormat(total[3] / 100, 2),
      ], [1, 3]),
    });
    rows.push({
      categories: 'from1K',
      _cells: rowCells([
        F.numberFormat(from1k[0]), F.numberFormat(from1k[1]),
        F.numberFormat(from1k[2] / 100, 2), F.numberFormat(from1k[3] / 100, 2),
      ], [1, 3]),
    });
    return { rows };
  }

  function sumParSlice(data, pdata, indices) {
    let num = 0; let pnum = 0; let bal = 0; let pbal = 0; let par = 0; let ppar = 0; let fc = 0; let pfc = 0;
    for (const idx of indices) {
      num += data ? data[idx] : 0;
      pnum += pdata ? pdata[idx] : 0;
      bal += data ? data[idx + 1] : 0;
      pbal += pdata ? pdata[idx + 1] : 0;
      par += data ? data[idx + 2] : 0;
      ppar += pdata ? pdata[idx + 2] : 0;
      fc += data ? data[idx + 3] : 0;
      pfc += pdata ? pdata[idx + 3] : 0;
    }
    return { num, pnum, bal, pbal, par, ppar, fc, pfc };
  }

  function renderParTables() {
    const pdata = raw.par.data;
    if (!pdata) return { general: [], hold: [], red: [], green: [], forg: [], other: [] };
    const curData = pdata[state.dayTo] || {};
    const prevData = pdata[state.dayFrom] || {};
    const keys = Object.keys(curData).concat(Object.keys(prevData))
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => Number(b) - Number(a));

    function build(kind) {
      const rows = [];
      const total = new Array(32).fill(0);
      for (const ki of keys) {
        const i = Number(ki);
        const data = curData[i];
        const pdat = prevData[i];
        const name = i < 1 ? 'lessThan 100' : 'from' + (i < 2 ? ' 100 ' : ' ' + (i - 2) * 10 + 'K ') + 'to' + (i < 2 ? ' 1K' : ' ' + (i - 1) * 10 + 'K');
        let s;
        if (kind === 'general') s = sumParSlice(data, pdat, [0, 4, 8, 12]);
        else if (kind === 'hold') s = sumParSlice(data, pdat, [0, 4]);
        else if (kind === 'red') s = sumParSlice(data, pdat, [0]);
        else if (kind === 'green') s = sumParSlice(data, pdat, [4]);
        else if (kind === 'forg') s = sumParSlice(data, pdat, [8]);
        else s = sumParSlice(data, pdat, [12]);
        if (s.num + s.pnum) {
          rows.push({
            categories: name,
            _cells: rowCells([
              F.numberFormat(s.num), F.numberFormat(s.num - s.pnum),
              F.numberFormat(s.bal / 100, 2), F.numberFormat((s.bal - s.pbal) / 100, 2),
              F.numberFormat(s.par / 100, 2), F.numberFormat((s.par - s.ppar) / 100, 2),
              F.numberFormat(s.fc / 100, 2), F.numberFormat((s.fc - s.pfc) / 100, 2),
            ], [1, 3, 5, 7]),
          });
        }
        if (data) {
          for (const j in data) {
            total[2 * j] += data[j];
            total[2 * j + 1] += data[j] - (pdat ? pdat[j] : 0);
          }
        }
      }
      rows.push({
        categories: 'total',
        _cells: rowCells([
          F.numberFormat(total[0] + total[8] + total[16] + total[24]),
          F.numberFormat(total[1] + total[9] + total[17] + total[25]),
          F.numberFormat((total[2] + total[10] + total[18] + total[26]) / 100, 2),
          F.numberFormat((total[3] + total[11] + total[19] + total[27]) / 100, 2),
          F.numberFormat((total[4] + total[12] + total[20] + total[28]) / 100, 2),
          F.numberFormat((total[5] + total[13] + total[21] + total[29]) / 100, 2),
          F.numberFormat((total[6] + total[14] + total[22] + total[30]) / 100, 2),
          F.numberFormat((total[7] + total[15] + total[23] + total[31]) / 100, 2),
        ], [1, 3, 5, 7]),
      });
      return rows;
    }

    return {
      general: build('general'),
      hold: build('hold'),
      red: build('red'),
      green: build('green'),
      forg: build('forg'),
      other: build('other'),
    };
  }

  function renderTop100() {
    const t = raw.top100.top100;
    const all = raw.top100.top100All;
    if (!t || !all) return { allTime: [], year: [] };
    const allTime = [];
    const year = [];
    for (const i in t) {
      year.push({
        categories: String(Number(i) + 1),
        _cells: rowCells([
          t[i][0],
          F.numberFormat(Number(all[i][1]) / 100, 2),
          F.numberFormat(t[i][2] / 100, 2),
          F.numberFormat(t[i][3] / 100, 2),
          F.numberFormat(t[i][4] / 100, 2),
        ]),
      });
      allTime.push({
        categories: String(Number(i) + 1),
        _cells: rowCells([
          all[i][0],
          F.numberFormat(Number(all[i][1]) / 100, 2),
          F.numberFormat(all[i][2] / 100, 2),
          F.numberFormat(all[i][3] / 100, 2),
          F.numberFormat(all[i][4] / 100, 2),
        ]),
      });
    }
    return { allTime, year };
  }

  function onRange(fn) {
    _rangeListeners.push(fn);
    return () => { _rangeListeners = _rangeListeners.filter((f) => f !== fn); };
  }

  return {
    state, raw, ensureReady, loadAll, onRangeChanged, onRange,
    renderMainTables, renderExchangers, renderBlocks, renderTransactions,
    renderOldWallets, renderParTables, renderTop100, clearRendered,
  };
})();
