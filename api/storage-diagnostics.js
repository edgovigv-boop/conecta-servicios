// api/storage-diagnostics.js
// Conecta Servicios v6.3.16
// Diagnóstico seguro de Supabase Storage para saber por qué el video queda pendiente.
// No expone llaves. Prueba bucket, anon key y service role con un archivo pequeño.

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

async function readJsonOrText(response){
  const text = await response.text().catch(() => '');
  try { return JSON.parse(text); } catch { return text; }
}

function env(){
  const supabaseUrl = cleanSupabaseUrl(process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL);
  const anonKey = String(process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const bucket = String(process.env.SUPABASE_STORAGE_BUCKET || 'publication-media').trim();

  let validUrl = false;
  try {
    const parsed = new URL(supabaseUrl);
    validUrl = parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
  } catch {
    validUrl = false;
  }

  return { supabaseUrl, anonKey, serviceKey, bucket, validUrl, host: safeHost(supabaseUrl) };
}

async function storageFetch(path, key, options = {}){
  const cfg = env();
  const target = `${cfg.supabaseUrl}/storage/v1/${path}`;
  return fetch(target, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(options.headers || {})
    }
  });
}

async function bucketInfo(){
  const cfg = env();
  if(!cfg.validUrl || !cfg.serviceKey) {
    return { ok:false, skipped:true, reason:'Missing valid SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' };
  }

  const response = await storageFetch(`bucket/${encodeURIComponent(cfg.bucket)}`, cfg.serviceKey);
  const detail = await readJsonOrText(response);
  return { ok: response.ok, httpStatus: response.status, detail };
}

async function tryUpload(label, key){
  const cfg = env();

  if(!cfg.validUrl || !key){
    return { ok:false, skipped:true, reason:`Missing valid SUPABASE_URL or ${label} key` };
  }

  const now = Date.now();
  const path = `diagnostics/${label}-${now}.txt`;
  const body = `Conecta Servicios storage diagnostic ${label} ${new Date().toISOString()}`;

  const upload = await storageFetch(
    `object/${encodeURIComponent(cfg.bucket)}/${path}`,
    key,
    {
      method:'POST',
      headers:{
        'Content-Type':'text/plain; charset=utf-8',
        'x-upsert':'true'
      },
      body
    }
  );

  const uploadDetail = await readJsonOrText(upload);

  let cleanup = { ok:false, skipped:true };
  if(cfg.serviceKey){
    const del = await storageFetch(
      `object/${encodeURIComponent(cfg.bucket)}/${path}`,
      cfg.serviceKey,
      { method:'DELETE' }
    ).catch(() => null);

    cleanup = del
      ? { ok: del.ok, httpStatus: del.status, detail: await readJsonOrText(del) }
      : { ok:false, error:'DELETE_REQUEST_FAILED' };
  }

  return {
    ok: upload.ok,
    httpStatus: upload.status,
    path,
    publicUrl: `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/${path}`,
    detail: uploadDetail,
    cleanup
  };
}

module.exports = async function handler(req, res){
  if(req.method !== 'GET') return send(res, 405, { ok:false, error:'METHOD_NOT_ALLOWED' });

  const cfg = env();
  const base = {
    ok: !!(cfg.validUrl && cfg.anonKey && cfg.serviceKey),
    diagnostics: {
      hasUrl: !!cfg.supabaseUrl,
      validUrl: cfg.validUrl,
      supabaseHost: cfg.host,
      hasAnonKey: !!cfg.anonKey,
      hasServiceRoleKey: !!cfg.serviceKey,
      storageBucket: cfg.bucket
    }
  };

  const shouldTest = String(req.url || '').includes('test=1');

  if(!shouldTest){
    return send(res, 200, {
      ...base,
      message:'Abre /api/storage-diagnostics?test=1 para probar subida pequeña con anon key y service role.'
    });
  }

  try{
    const bucket = await bucketInfo();
    const anonUpload = await tryUpload('anon', cfg.anonKey);
    const serviceUpload = await tryUpload('service', cfg.serviceKey);

    return send(res, 200, {
      ...base,
      bucket,
      anonUpload,
      serviceUpload,
      interpretation: {
        ifAnonUploadFails: 'La app no puede subir multimedia desde el navegador. Revisa SUPABASE_ANON_KEY o políticas de Storage.',
        ifServiceUploadFails: 'El bucket o SUPABASE_SERVICE_ROLE_KEY están mal configurados.',
        ifBothPass: 'Storage permite subir. Si el video sigue pendiente, el problema está en el archivo, tamaño, formato o flujo frontend.'
      }
    });
  }catch(error){
    return send(res, 500, {
      ...base,
      ok:false,
      error:'STORAGE_DIAGNOSTICS_ERROR',
      message:error?.message || String(error)
    });
  }
};
