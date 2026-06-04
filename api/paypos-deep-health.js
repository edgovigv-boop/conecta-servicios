const dns = require('dns').promises;
const https = require('https');
const SUPABASE_HOST = 'qfneazokicmyrtqvukqy.supabase.co';
const SUPABASE_URL = `https://${SUPABASE_HOST}`;

function httpsProbe(path) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: SUPABASE_HOST,
      path,
      method: 'GET',
      timeout: 10000,
      headers: { 'User-Agent': 'paypos-vercel-diagnostic' }
    }, (resp) => {
      let body = '';
      resp.on('data', (chunk) => { body += chunk.toString(); });
      resp.on('end', () => resolve({ ok: resp.statusCode >= 200 && resp.statusCode < 500, statusCode: resp.statusCode, headers: resp.headers, sample: body.slice(0, 500) }));
    });
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
    req.on('error', (error) => resolve({ ok: false, error: error.message, code: error.code, syscall: error.syscall, hostname: error.hostname }));
    req.end();
  });
}

async function fetchProbe(path) {
  try {
    const resp = await fetch(`${SUPABASE_URL}${path}`, { cache: 'no-store' });
    const text = await resp.text();
    return { ok: resp.ok, status: resp.status, sample: text.slice(0, 500) };
  } catch (error) {
    return { ok: false, error: error.message || String(error), name: error.name, cause: error.cause ? String(error.cause) : null };
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const out = {
    ok: true,
    via: 'vercel-api',
    node: process.version,
    host: SUPABASE_HOST,
    dns: null,
    https_health: null,
    fetch_health: null
  };

  try {
    out.dns = await dns.lookup(SUPABASE_HOST, { all: true });
  } catch (error) {
    out.dns = { ok: false, error: error.message, code: error.code };
  }

  out.https_health = await httpsProbe('/auth/v1/health');
  out.fetch_health = await fetchProbe('/auth/v1/health');

  res.status(200).json(out);
};
