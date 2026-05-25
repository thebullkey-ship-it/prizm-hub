const https = require('https');
const { CORS_HEADERS, EXT_HOST } = require('../../lib/peers');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    return res.end();
  }

  const segments = req.query.path;
  const pathPart = Array.isArray(segments) ? segments.join('/') : (segments || '');
  const qs = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const extPath = '/' + pathPart + qs;

  await new Promise((resolve) => {
    const options = {
      hostname: EXT_HOST,
      port:     443,
      path:     extPath,
      method:   req.method || 'GET',
      headers:  { Accept: 'application/json', 'User-Agent': 'PrizmHub/1.0' },
    };
    const extReq = https.request(options, (extRes) => {
      const chunks = [];
      extRes.on('data', (c) => chunks.push(c));
      extRes.on('end', () => {
        res.status(extRes.statusCode);
        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
        res.setHeader('Content-Type', extRes.headers['content-type'] || 'application/json');
        res.end(Buffer.concat(chunks));
        resolve();
      });
    });
    extReq.on('error', (err) => {
      res.status(502).setHeader('Content-Type', 'application/json');
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
      res.end(JSON.stringify({ error: err.message }));
      resolve();
    });
    extReq.end();
  });
};
