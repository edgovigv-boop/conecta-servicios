// api/publications.js
// Conecta Servicios v6.3.20 - Muro público con normalización de video.
// Mantiene service role solo en backend.

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 6_000_000) req.destroy();
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function cleanSupabaseUrl(raw) {
  return String(raw || '').trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/g, '');
}

function safeHost(url) {
  try { return new URL(url).host; } catch { return ''; }
}

function env() {
  const rawUrl = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = cleanSupabaseUrl(rawUrl);
  const key = String(rawKey || '').trim();
  const table = String(process.env.SUPABASE_PUBLICATIONS_TABLE || 'connecta_publications').trim();

  let validUrl = false;
  try {
    const parsed = new URL(url);
    validUrl = parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
  } catch { validUrl = false; }

  return { url, key, table, ok: !!(url && key && validUrl), hasUrl: !!rawUrl, hasKey: !!rawKey, validUrl, host: safeHost(url) };
}

function diagnostics(extra = {}) {
  const cfg = env();
  return { hasUrl: cfg.hasUrl, hasServiceRoleKey: cfg.hasKey, validUrl: cfg.validUrl, supabaseHost: cfg.host, table: cfg.table, ...extra };
}

async function supabaseFetch(path, options = {}) {
  const { url, key } = env();
  return fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}

function isVideoUrl(url = '') {
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(String(url));
}

function normalizePost(post, row = {}) {
  const p = { ...(post || {}) };
  const mediaUrl = String(p.mediaUrl || '').trim();

  p.id = p.id || row.client_id;
  p.ownerId = p.ownerId || row.owner_id || '';
  p.status = row.status || p.status || 'activa';
  p.createdAt = p.createdAt || row.created_at;
  p.updatedAt = p.updatedAt || row.updated_at || row.created_at;

  if (mediaUrl) {
    p.mediaUrl = mediaUrl;
    p.cloudStatus = 'publica';
    p.mediaStatus = '';
    p.mediaPending = false;
    if (String(p.mediaType || '').toLowerCase() === 'video' || isVideoUrl(mediaUrl) || String(p.mediaMime || '').startsWith('video/')) {
      p.mediaType = 'video';
    }
  }

  return p;
}

module.exports = async function handler(req, res) {
  const cfg = env();

  if (req.method === 'GET' && String(req.url || '').includes('debug=1')) {
    return send(res, 200, {
      ok: cfg.ok,
      diagnostics: diagnostics(),
      message: cfg.ok ? 'Configuración básica presente. Probando lectura normal en /api/publications.' : 'Revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel.'
    });
  }

  if (!cfg.ok) {
    return send(res, 200, {
      ok: false,
      error: 'SUPABASE_NOT_CONFIGURED',
      message: 'Modo local activo: revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para muro público.',
      diagnostics: diagnostics()
    });
  }

  try {
    if (req.method === 'GET') {
      const r = await supabaseFetch(`${cfg.table}?select=client_id,owner_id,status,data,created_at,updated_at&order=created_at.desc`);
      const rows = await r.json().catch(() => []);
      if (!r.ok) {
        return send(res, r.status, { ok: false, error: 'SUPABASE_GET_FAILED', detail: rows, diagnostics: diagnostics({ httpStatus: r.status }) });
      }
      return send(res, 200, {
        ok: true,
        posts: rows.map(row => normalizePost(row.data || {}, row))
      });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const post = normalizePost(body.post || {});
      if (!post || !post.id) return send(res, 400, { ok: false, error: 'MISSING_POST' });

      const row = {
        client_id: post.id,
        owner_id: post.ownerId || '',
        status: post.status || 'activa',
        data: post,
        updated_at: new Date().toISOString()
      };

      const r = await supabaseFetch(`${cfg.table}?on_conflict=client_id`, {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify([row])
      });

      const data = await r.json().catch(() => null);
      if (!r.ok) {
        return send(res, r.status, { ok: false, error: 'SUPABASE_UPSERT_FAILED', detail: data, diagnostics: diagnostics({ httpStatus: r.status }) });
      }
      return send(res, 200, { ok: true, post: normalizePost(data?.[0]?.data || post, data?.[0] || row) });
    }

    if (req.method === 'DELETE') {
      const body = await readBody(req);
      const id = body.id;
      const ownerId = body.ownerId || '';
      const isAdmin = !!body.admin;
      if (!id) return send(res, 400, { ok: false, error: 'MISSING_ID' });

      if (!isAdmin) {
        const chk = await supabaseFetch(`${cfg.table}?select=owner_id&client_id=eq.${encodeURIComponent(id)}&limit=1`);
        const rows = await chk.json().catch(() => []);
        if (!rows[0] || rows[0].owner_id !== ownerId) return send(res, 403, { ok: false, error: 'NOT_OWNER' });
      }

      const r = await supabaseFetch(`${cfg.table}?client_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!r.ok) return send(res, r.status, { ok: false, error: 'SUPABASE_DELETE_FAILED', diagnostics: diagnostics({ httpStatus: r.status }) });
      return send(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return send(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  } catch (error) {
    return send(res, 500, { ok: false, error: 'PUBLICATIONS_API_ERROR', message: error?.message || String(error), diagnostics: diagnostics() });
  }
};
