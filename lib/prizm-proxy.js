const http = require('http');
const { PEERS, CORS_HEADERS, PEER_TIMEOUT_MS } = require('./peers');

function probePeer(peer) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: peer.host,
      port:     peer.port,
      path:     '/prizm?requestType=getBlockchainStatus',
      method:   'GET',
      headers:  { Accept: 'application/json' },
    }, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.setTimeout(PEER_TIMEOUT_MS, () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
    req.end();
  });
}

function tryPeerProxy(peer, reqPath, method, bodyBuf) {
  return new Promise((resolve) => {
    const nodeReq = http.request({
      hostname: peer.host,
      port:     peer.port,
      path:     reqPath,
      method:   method,
      headers:  { Accept: 'application/json' },
    }, (nodeRes) => {
      const chunks = [];
      nodeRes.on('data', (c) => chunks.push(c));
      nodeRes.on('end', () => {
        resolve({
          ok: true,
          statusCode: nodeRes.statusCode,
          contentType: nodeRes.headers['content-type'] || 'application/json; charset=utf-8',
          body: Buffer.concat(chunks),
        });
      });
    });
    nodeReq.setTimeout(PEER_TIMEOUT_MS, () => { nodeReq.destroy(); resolve({ ok: false }); });
    nodeReq.on('error', () => resolve({ ok: false }));
    if (method === 'POST' && bodyBuf) nodeReq.write(bodyBuf);
    nodeReq.end();
  });
}

/** Try peers in order; returns first successful response or null. */
async function proxyPrizmRequest(reqPath, method, bodyBuf) {
  for (let i = 0; i < PEERS.length; i++) {
    const peer = PEERS[i];
    const result = await tryPeerProxy(peer, reqPath, method, bodyBuf);
    if (result.ok) {
      return { peer, peerIdx: i, ...result };
    }
  }
  return null;
}

module.exports = { probePeer, proxyPrizmRequest, PEERS, CORS_HEADERS };
