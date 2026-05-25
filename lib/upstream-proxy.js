const https = require('https');
const http = require('http');
const { URL } = require('url');
const { CORS_HEADERS } = require('./peers');

function getUpstreamBase() {
  const base = process.env.PRIZM_UPSTREAM;
  if (!base) return null;
  return base.replace(/\/$/, '');
}

function forwardRequest(targetUrl, method, bodyBuf) {
  return new Promise((resolve, reject) => {
    const target = new URL(targetUrl);
    const lib = target.protocol === 'https:' ? https : http;
    const options = {
      hostname: target.hostname,
      port:     target.port || (target.protocol === 'https:' ? 443 : 80),
      path:     target.pathname + target.search,
      method:   method || 'GET',
      headers:  { Accept: 'application/json', 'User-Agent': 'PrizmHub/1.0' },
    };
    const req = lib.request(options, (upstreamRes) => {
      const chunks = [];
      upstreamRes.on('data', (c) => chunks.push(c));
      upstreamRes.on('end', () => {
        resolve({
          statusCode: upstreamRes.statusCode,
          contentType: upstreamRes.headers['content-type'] || 'application/json',
          body: Buffer.concat(chunks),
        });
      });
    });
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('upstream timeout')); });
    req.on('error', reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

async function proxyViaUpstream(relativePath, method, bodyBuf) {
  const base = getUpstreamBase();
  if (!base) return null;
  const targetUrl = base + relativePath;
  const result = await forwardRequest(targetUrl, method, bodyBuf);
  return result;
}

function sendProxyResponse(res, result) {
  res.status(result.statusCode);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  res.setHeader('Content-Type', result.contentType);
  res.end(result.body);
}

function sendUpstreamMissing(res) {
  res.status(503).setHeader('Content-Type', 'application/json');
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify({
    error: 'PRIZM node proxy unavailable on Vercel',
    hint: 'Deploy server.js (Render/Railway) and set PRIZM_UPSTREAM in Vercel env.',
  }));
}

module.exports = {
  getUpstreamBase,
  proxyViaUpstream,
  sendProxyResponse,
  sendUpstreamMissing,
};
