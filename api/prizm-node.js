const { probePeer } = require('../lib/prizm-proxy');
const { PEERS, CORS_HEADERS } = require('../lib/peers');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    return res.end();
  }

  let activePeerIdx = 0;
  for (let i = 0; i < PEERS.length; i++) {
    if (await probePeer(PEERS[i])) {
      activePeerIdx = i;
      break;
    }
  }

  const active = PEERS[activePeerIdx];
  const payload = {
    host:  active.host,
    port:  active.port,
    label: active.label,
    idx:   activePeerIdx,
    total: PEERS.length,
    peers: PEERS.map((p, i) => ({ ...p, active: i === activePeerIdx })),
  };

  res.status(200).setHeader('Content-Type', 'application/json');
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(payload));
};
