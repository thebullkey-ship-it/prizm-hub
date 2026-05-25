/** PRIZM historical stats — constants (legacy baze portal). */
const StatsConstants = {
  DAYS_UNTIL_START_EPOCH: 43308,
  DEFAULT_PERIOD_DAYS: 7,
  GENESIS_RS: 'TE8NB3VMJJQH5NYJB',
  GENESIS_EPOCH: '2018-07-27',
  MAIN_TABLE_CATEGORIES: [
    'lessThan1', 'from1to100', 'from100to1K', 'lessThan1K', 'from1Kto10K',
    'from10Kto50K', 'from50Kto100K', 'from10Kto100K', 'from100Kto500K',
    'from500Kto1M', 'from100Kto1M', 'from1Mto10M', 'from10Mto100M',
    'from100Mto1B', 'moreThan1B',
  ],
  EXCHANGERS: [
    'RuDEX', 'ProBit', 'HotBit', 'CoinTiger', 'IndoEx', 'Btc-Alpha', 'PrizmBit',
    'LiveCoin', 'Netex', 'Golos', 'X1000', 'X100', 'X10', 'Start',
  ],
  EXCHANGERS_ORDER: {
    RuDEX: { type: 'exchanger' }, ProBit: { type: 'exchanger' }, HotBit: { type: 'exchanger' },
    CoinTiger: { type: 'exchanger' }, IndoEx: { type: 'exchanger' }, 'Btc-Alpha': { type: 'exchanger' },
    PrizmBit: { type: 'exchanger' }, LiveCoin: { type: 'exchanger' }, Netex: { type: 'exchanger' },
    Golos: { type: 'exchanger' }, X1000: { type: 'draw' }, X100: { type: 'draw' },
    X10: { type: 'draw' }, Start: { type: 'draw' }, total: { type: 'total' },
  },
  BLOCK_CATEGORIES: ['from1Kto10K', 'from10Kto50K', 'from50Kto100K', 'from10Kto100K',
    'from100Kto500K', 'from500Kto1M', 'from100Kto1M', 'from1Mto10M', 'from10Mto100M'],
};
