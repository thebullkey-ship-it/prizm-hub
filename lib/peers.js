/** Shared PRIZM peer list (used by server.js and Vercel API routes). */
const PEERS = [
  { host: '178.159.39.2',   port: 9976, label: 'Volkonskii'    },
  { host: '217.25.230.163', port: 9976, label: 'Lir'           },
  { host: '91.122.105.234', port: 9976, label: 'Linux amd64 A' },
  { host: '188.120.245.83', port: 9976, label: 'Linux amd64 B' },
  { host: '81.177.166.142', port: 9976, label: 'Pzm'           },
  { host: '62.113.118.11',  port: 9976, label: 'Linux amd64 C' },
  { host: '62.183.98.33',   port: 9976, label: 'PrizmSpaceDVS' },
  { host: '5.141.22.122',   port: 9976, label: 'trenina'       },
  { host: '31.192.111.76',  port: 9976, label: 'DaoFamily'     },
  { host: '85.234.29.70',   port: 9976, label: 'RedyVokson'    },
  { host: '74.220.48.197',  port: 9976, label: 'Cage'          },
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

const PEER_TIMEOUT_MS = 5000;
const EXT_HOST = 'api.prizm.vip';

module.exports = { PEERS, CORS_HEADERS, PEER_TIMEOUT_MS, EXT_HOST };
