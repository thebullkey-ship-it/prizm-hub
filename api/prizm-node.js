const { probePeer } = require('../lib/prizm-proxy');
const { PEERS, CORS_HEADERS } = require('../lib/peers');
const {
  getUpstreamBase,
  proxyViaUpstream,
  sendProxyResponse,
  sendUpstreamMissing,
} = require('../lib/upstream-proxy');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    return res.end();
  }

  if (getUpstreamBase()) {
    try {
      const result = await proxyViaUpstream('/prizm-node', 'GET', null);
      return sendProxyResponse(res, result);
    } catch (err) {
      res.status(502).setHeader('Content-Type', 'application/json');
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  if (process.env.VERCEL) {
    const active = PEERS[0];
    const payload = {
      host:  active.host,
      port:  active.port,
      label: active.label,
      idx:   0,
      total: PEERS.length,
      peers: PEERS.map((p, i) => ({ ...p, active: i === 0 })),
      proxyPending: true,
    };
    res.status(200).setHeader('Content-Type', 'application/json');
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    return res.end(JSON.stringify(payload));
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
