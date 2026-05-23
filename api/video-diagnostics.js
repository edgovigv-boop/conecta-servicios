// api/video-diagnostics.js
// Conecta Servicios v6.3.16
// Lista publicaciones de video y muestra si tienen mediaUrl o siguen pendientes.
// No expone llaves.

function send(res, status, payload){
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload, null, 2));
}

function cleanSupabaseUrl(raw){
  return String(raw || '').trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/g, '');
}

function safeHost(url){
  try { return new URL(url).host; } catch { return ''; }
}

function env(){
  const url = cleanSupabaseUrl(process.env.SUPABASE_URL);
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const table = String(process.env.SUPABASE_PUBLICATIONS_TABLE || 'connecta_publications').trim();

  let validUrl = false;
  try {
    const parsed = new URL(url);
    validUrl = parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
  } catch {
    validUrl = false;
  }

  return { url, key, table, validUrl, host:safeHost(url), ok: !!(url && key && validUrl) };
}

async function readJsonOrText(response){
  const text = await response.text().catch(() => '');
  try { return JSON.parse(text); } catch { return text; }
}

async function supabaseFetch(path, options = {}){
  const cfg = env();
  const target = `${cfg.url}/rest/v1/${path}`;
  return fetch(target, {
    ...options,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}

function mediaUrlInfo(mediaUrl){
  if(!mediaUrl) return { hasMediaUrl:false };
  try{
    const u = new URL(mediaUrl);
    return {
      hasMediaUrl:true,
      host:u.host,
      pathname:u.pathname,
      looksLikeStorage:u.pathname.includes('/storage/v1/object/public/')
    };
  }catch{
    return { hasMediaUrl:true, invalidUrl:true };
  }
}

function summarize(row){
  const data = row.data || {};
  const mediaUrl = data.mediaUrl || '';
  return {
    id: row.client_id,
    ownerId: row.owner_id,
    status: row.status || data.status || '',
    title: data.title || '',
    category: data.category || '',
    zone: data.zone || '',
    mediaType: data.mediaType || '',
    mediaStatus: data.mediaStatus || '',
    mediaName: data.mediaName || '',
    mediaMime: data.mediaMime || '',
    cloudStatus: data.cloudStatus || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...mediaUrlInfo(mediaUrl)
  };
}

module.exports = async function handler(req, res){
  if(req.method !== 'GET') return send(res, 405, { ok:false, error:'METHOD_NOT_ALLOWED' });

  const cfg = env();
  if(!cfg.ok){
    return send(res, 200, {
      ok:false,
      error:'SUPABASE_NOT_CONFIGURED',
      diagnostics:{ hasUrl:!!cfg.url, validUrl:cfg.validUrl, hasServiceRoleKey:!!cfg.key, supabaseHost:cfg.host, table:cfg.table }
    });
  }

  try{
    const response = await supabaseFetch(`${cfg.table}?select=client_id,owner_id,status,data,created_at,updated_at&order=created_at.desc&limit=50`);
    const detail = await readJsonOrText(response);

    if(!response.ok){
      return send(res, response.status, {
        ok:false,
        error:'SUPABASE_GET_FAILED',
        detail,
        diagnostics:{ table:cfg.table, supabaseHost:cfg.host }
      });
    }

    const rows = Array.isArray(detail) ? detail : [];
    const videos = rows
      .filter(row => String(row.data?.mediaType || '').toLowerCase() === 'video')
      .map(summarize);

    const pending = videos.filter(v => !v.hasMediaUrl || String(v.mediaStatus || '').toLowerCase() === 'pendiente');

    return send(res, 200, {
      ok:true,
      diagnostics:{ table:cfg.table, supabaseHost:cfg.host },
      count: videos.length,
      pendingCount: pending.length,
      videos,
      interpretation:{
        hasMediaUrlFalse:'El video no subió a Storage o no se guardó la URL.',
        mediaStatusPendienteWithMediaUrl:'El archivo puede estar subido, pero la app dejó estado pendiente viejo.',
        looksLikeStorageFalse:'La URL no parece venir de Supabase Storage.'
      }
    });
  }catch(error){
    return send(res, 500, {
      ok:false,
      error:'VIDEO_DIAGNOSTICS_ERROR',
      message:error?.message || String(error)
    });
  }
};
