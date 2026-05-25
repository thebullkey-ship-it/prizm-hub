const { proxyPrizmRequest, CORS_HEADERS } = require('../lib/prizm-proxy');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    return res.end();
  }

  const search = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const reqPath = '/prizm' + search;

  let bodyBuf = null;
  if (req.method === 'POST') {
    bodyBuf = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(chunks.length ? Buffer.concat(chunks) : null));
      req.on('error', reject);
    });
  }

  const result = await proxyPrizmRequest(reqPath, req.method || 'GET', bodyBuf);
  if (!result) {
    res.status(502).setHeader('Content-Type', 'application/json');
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    return res.end(JSON.stringify({
      error: 'All PRIZM nodes are currently unreachable',
    }));
  }

  res.status(result.statusCode);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  res.setHeader('Content-Type', result.contentType);
  res.end(result.body);
};
