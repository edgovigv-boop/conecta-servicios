// api/messages.js
// Conecta Servicios v6.3.7 - Mensajes públicos básicos tipo chat
// Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel.
// Tabla: connecta_messages

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2_000_000) req.destroy();
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

function env() {
  const url = cleanSupabaseUrl(process.env.SUPABASE_URL);
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const table = String(process.env.SUPABASE_MESSAGES_TABLE || 'connecta_messages').trim();
  let validUrl = false;
  let host = '';
  try {
    const parsed = new URL(url);
    validUrl = parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
    host = parsed.host;
  } catch {}
  return { url, key, table, ok: !!(url && key && validUrl), hasUrl: !!url, hasKey: !!key, validUrl, host };
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

function normalize(row) {
  return {
    id: row.id,
    postId: row.post_id,
    postTitle: row.post_title,
    senderId: row.sender_id,
    senderName: row.sender_name,
    receiverId: row.receiver_id,
    receiverName: row.receiver_name,
    text: row.text,
    status: row.status || 'sent',
    createdAt: row.created_at
  };
}

module.exports = async function handler(req, res) {
  const cfg = env();

  if (req.method === 'GET' && String(req.url || '').includes('debug=1')) {
    return send(res, 200, { ok: cfg.ok, diagnostics: diagnostics(), message: cfg.ok ? 'Mensajes configurados.' : 'Revisa variables de Supabase.' });
  }

  if (!cfg.ok) {
    return send(res, 200, { ok: false, error: 'MESSAGES_NOT_CONFIGURED', diagnostics: diagnostics() });
  }

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url, 'https://local');
      const userId = String(url.searchParams.get('userId') || '').trim();
      const postId = String(url.searchParams.get('postId') || '').trim();
      const peerId = String(url.searchParams.get('peerId') || '').trim();

      if (!userId) return send(res, 400, { ok: false, error: 'MISSING_USER_ID' });

      // Traemos mensajes del usuario y filtramos detalles en backend para evitar lógica REST compleja.
      const filter = `or=(sender_id.eq.${encodeURIComponent(userId)},receiver_id.eq.${encodeURIComponent(userId)})`;
      const r = await supabaseFetch(`${cfg.table}?select=*&${filter}&order=created_at.asc&limit=300`);
      const rows = await r.json().catch(() => []);

      if (!r.ok) {
        return send(res, r.status, { ok: false, error: 'MESSAGES_GET_FAILED', detail: rows, diagnostics: diagnostics({ httpStatus: r.status }) });
      }

      let messages = rows.map(normalize);
      if (postId) messages = messages.filter(m => m.postId === postId);
      if (peerId) messages = messages.filter(m =>
        (m.senderId === userId && m.receiverId === peerId) ||
        (m.senderId === peerId && m.receiverId === userId)
      );

      return send(res, 200, { ok: true, messages });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const m = body.message;
      if (!m || !m.id || !m.senderId || !m.receiverId || !m.text) {
        return send(res, 400, { ok: false, error: 'MISSING_MESSAGE_FIELDS' });
      }

      const row = {
        id: m.id,
        post_id: m.postId || '',
        post_title: m.postTitle || 'Publicación',
        sender_id: m.senderId,
        sender_name: m.senderName || 'Usuario local',
        receiver_id: m.receiverId,
        receiver_name: m.receiverName || 'Usuario local',
        text: m.text,
        status: m.status || 'sent',
        created_at: m.createdAt || new Date().toISOString()
      };

      const r = await supabaseFetch(`${cfg.table}?on_conflict=id`, {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify([row])
      });
      const data = await r.json().catch(() => null);

      if (!r.ok) {
        return send(res, r.status, { ok: false, error: 'MESSAGES_INSERT_FAILED', detail: data, diagnostics: diagnostics({ httpStatus: r.status }) });
      }

      return send(res, 200, { ok: true, message: normalize(data?.[0] || row) });
    }

    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  } catch (error) {
    return send(res, 500, { ok: false, error: 'MESSAGES_API_ERROR', message: error?.message || String(error), diagnostics: diagnostics() });
  }
};
