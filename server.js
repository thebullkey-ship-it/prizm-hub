#!/usr/bin/env node
/**
 * Prizm Hub — Dev Server + CORS Proxy with Multi-Peer Failover
 * Serves static files AND proxies /prizm?... → active PRIZM node (auto-switches on failure)
 * Usage: node server.js [port]
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT     = parseInt(process.argv[2] || process.env.PORT || '8181', 10);
const EXT_HOST = 'api.prizm.vip';

// ── Peer list ────────────────────────────────────────────────────────────────
// All known PRIZM nodes, ordered by weight (descending). The proxy starts with
// the first peer and automatically fails over to the next on timeout/error.
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
];

const PEER_TIMEOUT_MS  = 5000;  // per-peer connection timeout for user requests
const HEALTH_INTERVAL  = 30000; // background health check interval
const HEALTH_TIMEOUT   = 5000;  // timeout for health probe

let activePeerIdx = 0;          // index into PEERS of the currently-used node
let failoverActive = false;     // true while searching for a new peer

// ── CORS / MIME helpers ──────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.pdf':  'application/pdf',
};

// ── Health check + failover ──────────────────────────────────────────────────

/**
 * Probe a peer by requesting getBlockchainStatus.
 * Resolves true if the peer answers with HTTP 200, false otherwise.
 */
function probePeer(peer) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: peer.host,
      port:     peer.port,
      path:     '/prizm?requestType=getBlockchainStatus',
      method:   'GET',
      headers:  { Accept: 'application/json' },
    }, (res) => {
      res.resume(); // drain to free socket
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.setTimeout(HEALTH_TIMEOUT, () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
    req.end();
  });
}

/**
 * Find the first healthy peer (starting from activePeerIdx+1) and switch to it.
 * Called by the background health check or immediately after a proxy failure.
 */
async function switchToHealthyPeer(reason) {
  if (failoverActive) return;
  failoverActive = true;

  const start = activePeerIdx;
  for (let i = 1; i <= PEERS.length; i++) {
    const idx = (start + i) % PEERS.length;
    const peer = PEERS[idx];
    const ok = await probePeer(peer);
    if (ok) {
      const prev = PEERS[activePeerIdx];
      activePeerIdx = idx;
      console.log(`[failover] ${reason} → switched ${prev.host} → ${peer.host} (${peer.label})`);
      failoverActive = false;
      return;
    }
  }
  // No peer responded — keep the current one, it might recover
  console.warn(`[failover] all peers unresponsive, staying on ${PEERS[activePeerIdx].host}`);
  failoverActive = false;
}

// Background health checker — runs every HEALTH_INTERVAL ms
setInterval(async () => {
  const active = PEERS[activePeerIdx];
  const ok = await probePeer(active);
  if (!ok) {
    console.warn(`[health] active peer ${active.host} not responding — looking for alternative`);
    switchToHealthyPeer('health-check');
  }
}, HEALTH_INTERVAL);

// ── Smart PRIZM proxy ────────────────────────────────────────────────────────

/**
 * Try proxying the request to one peer.
 * Returns a Promise that resolves true once response headers arrive (piping started),
 * or false on timeout / connection error (before any data was written to `res`).
 */
function tryPeerProxy(peer, reqPath, method, clientRes, bodyBuf) {
  return new Promise((resolve) => {
    const nodeReq = http.request({
      hostname: peer.host,
      port:     peer.port,
      path:     reqPath,
      method:   method,
      headers:  { Accept: 'application/json' },
    }, (nodeRes) => {
      // Got response headers — commit to this peer and start streaming
      const headers = {
        ...CORS_HEADERS,
        'Content-Type': nodeRes.headers['content-type'] || 'application/json; charset=utf-8',
      };
      clientRes.writeHead(nodeRes.statusCode, headers);
      nodeRes.pipe(clientRes, { end: true });
      resolve(true);
    });

    nodeReq.setTimeout(PEER_TIMEOUT_MS, () => { nodeReq.destroy(); resolve(false); });
    nodeReq.on('error', () => resolve(false));

    if (method === 'POST' && bodyBuf) nodeReq.write(bodyBuf);
    nodeReq.end();
  });
}

/**
 * Smart proxy: tries the active peer first, then falls back through all others.
 * Switches activePeerIdx if it finds a working alternative.
 */
async function prizmProxy(reqPath, method, clientRes, bodyBuf) {
  const startIdx = activePeerIdx;

  for (let attempt = 0; attempt < PEERS.length; attempt++) {
    const idx = (startIdx + attempt) % PEERS.length;
    const peer = PEERS[idx];

    const ok = await tryPeerProxy(peer, reqPath, method, clientRes, bodyBuf);
    if (ok) {
      if (idx !== startIdx) {
        const prev = PEERS[startIdx];
        activePeerIdx = idx;
        console.log(`[proxy-failover] ${prev.host} → ${peer.host} (${peer.label})`);
      }
      return;
    }

    console.warn(`[proxy] ${peer.host}:${peer.port} timed-out/failed (attempt ${attempt + 1}/${PEERS.length})`);
  }

  // All peers exhausted
  console.error('[proxy] all peers unreachable');
  clientRes.writeHead(502, CORS_HEADERS);
  clientRes.end(JSON.stringify({
    error:   'All PRIZM nodes are currently unreachable',
    tried:   PEERS.length,
    peers:   PEERS.map(p => p.host),
  }));

  // Kick off async search for a live peer so the next request might succeed
  switchToHealthyPeer('all-failed');
}

// ── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // ── /prizm-node — returns active peer info (used by browser client) ────────
  if (parsed.pathname === '/prizm-node') {
    const active = PEERS[activePeerIdx];
    res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      host:  active.host,
      port:  active.port,
      label: active.label,
      idx:   activePeerIdx,
      total: PEERS.length,
      peers: PEERS.map((p, i) => ({ ...p, active: i === activePeerIdx })),
    }));
    return;
  }

  // ── /prizm?... — proxy to active PRIZM node with failover ─────────────────
  if (parsed.pathname === '/prizm') {
    if (req.method === 'POST') {
      // Buffer POST body before proxying (needed for retry logic)
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => {
        const body = chunks.length ? Buffer.concat(chunks) : null;
        prizmProxy(req.url, 'POST', res, body);
      });
    } else {
      prizmProxy(req.url, 'GET', res, null);
    }
    return;
  }

  // ── /ext-api/... — proxy to https://api.prizm.vip ─────────────────────────
  if (parsed.pathname.startsWith('/ext-api/')) {
    const extPath = parsed.pathname.replace('/ext-api', '');
    const options = {
      hostname: EXT_HOST,
      port:     443,
      path:     extPath + (parsed.search || ''),
      method:   req.method,
      headers:  { Accept: 'application/json', 'User-Agent': 'PrizmHub/1.0' },
    };
    const extReq = https.request(options, (extRes) => {
      const ct = extRes.headers['content-type'] || 'application/json';
      res.writeHead(extRes.statusCode, { ...CORS_HEADERS, 'Content-Type': ct });
      extRes.pipe(res, { end: true });
    });
    extReq.on('error', (err) => {
      res.writeHead(502, CORS_HEADERS);
      res.end(JSON.stringify({ error: err.message }));
    });
    extReq.end();
    return;
  }

  // ── /baze/* — historical stats JSON (no SPA fallback) ───────────────────────
  if (parsed.pathname.startsWith('/baze/')) {
    const rel = parsed.pathname.replace(/^\/baze\/?/, '');
    const bazePath = path.join(__dirname, 'baze', rel);
    if (!bazePath.startsWith(path.join(__dirname, 'baze'))) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    fs.stat(bazePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'application/json', ...CORS_HEADERS });
        res.end(JSON.stringify({ error: 'baze file not found', path: rel }));
        return;
      }
      fs.readFile(bazePath, (err2, data) => {
        if (err2) { res.writeHead(500); res.end('Error'); return; }
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          ...CORS_HEADERS,
          'Cache-Control': 'no-cache',
        });
        res.end(data);
      });
    });
    return;
  }

  // ── Static file server ─────────────────────────────────────────────────────
  let filePath = path.join(__dirname, parsed.pathname === '/' ? 'index.html' : parsed.pathname);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      if (parsed.pathname.startsWith('/api/')) {
        res.writeHead(404); res.end('Not found'); return;
      }
      filePath = path.join(__dirname, 'index.html');
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (err2, data) => {
      if (err2) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, {
        'Content-Type':  mime,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma':        'no-cache',
        'Expires':       '0',
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  const active = PEERS[activePeerIdx];
  console.log(`\n  ⬡  Prizm Hub running at http://localhost:${PORT}`);
  console.log(`  ↔  CORS proxy: /prizm → http://${active.host}:${active.port} (${active.label})`);
  console.log(`  ⬡  ${PEERS.length} peers configured — auto-failover enabled`);
  console.log(`\n  Press Ctrl+C to stop\n`);

  // Probe all peers on startup so we start with the best available
  (async () => {
    const ok = await probePeer(PEERS[activePeerIdx]);
    if (!ok) {
      console.warn(`[startup] primary peer ${PEERS[activePeerIdx].host} unreachable — finding alternative`);
      await switchToHealthyPeer('startup');
      console.log(`[startup] active peer: ${PEERS[activePeerIdx].host} (${PEERS[activePeerIdx].label})`);
    }
  })();
});
