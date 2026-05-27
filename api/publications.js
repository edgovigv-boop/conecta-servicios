// api/publications.js
// Conecta Servicios v6.4.79
// Sanitización profunda del muro público.
// Corrección crítica: también elimina ownerAvatar/base64/blob y cualquier data:/blob:
// en cualquier nivel del objeto antes de enviarlo al navegador.
//
// Variables oficiales:
// NEXT_PUBLIC_SUPABASE_URL
// NEXT_PUBLIC_SUPABASE_ANON_KEY
//
// Compatibilidad:
// SUPABASE_URL
// SUPABASE_ANON_KEY
// SUPABASE_SERVICE_ROLE_KEY

function send(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(payload));
}

function readBody(req){
  return new Promise((resolve,reject)=>{
    let body='';
    req.on('data',chunk=>{
      body+=chunk;
      if(body.length>6_000_000) req.destroy();
    });
    req.on('end',()=>{try{resolve(body?JSON.parse(body):{});}catch(e){reject(e);}});
    req.on('error',reject);
  });
}

function firstEnv(...names){
  for(const name of names){
    const value=String(process.env[name]||'').trim();
    if(value) return value;
  }
  return '';
}

function cleanSupabaseUrl(raw){
  return String(raw||'').trim().replace(/\/rest\/v1\/?$/i,'').replace(/\/+$/g,'');
}

function safeHost(url){
  try{return new URL(url).host;}catch{return '';}
}

function env(){
  const rawUrl=firstEnv('NEXT_PUBLIC_SUPABASE_URL','SUPABASE_URL','PUBLIC_SUPABASE_URL');
  const url=cleanSupabaseUrl(rawUrl);
  const serviceKey=firstEnv('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey=firstEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_ANON_KEY','PUBLIC_SUPABASE_ANON_KEY');
  const key=serviceKey || anonKey;
  const table=String(process.env.SUPABASE_PUBLICATIONS_TABLE || 'connecta_publications').trim();

  let validUrl=false;
  try{
    const parsed=new URL(url);
    validUrl=parsed.protocol==='https:' && parsed.hostname.endsWith('.supabase.co');
  }catch{validUrl=false;}

  return {
    url,key,serviceKey,anonKey,table,
    ok:!!(url && key && validUrl),
    hasUrl:!!rawUrl,
    hasKey:!!key,
    hasAnonKey:!!anonKey,
    hasServiceRoleKey:!!serviceKey,
    validUrl,
    host:safeHost(url)
  };
}

function diagnostics(extra={}){
  const c=env();
  return {
    hasUrl:c.hasUrl,
    hasAnySupabaseKey:c.hasKey,
    hasAnonKey:c.hasAnonKey,
    hasServiceRoleKey:c.hasServiceRoleKey,
    validUrl:c.validUrl,
    supabaseHost:c.host,
    table:c.table,
    usingKeyType:c.serviceKey?'service_role':(c.anonKey?'anon':'missing'),
    expectedVariables:['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    acceptedFallbackVariables:['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'],
    ...extra
  };
}

async function supabaseFetch(path,options={}){
  const {url,key}=env();
  return fetch(`${url}/rest/v1/${path}`,{
    ...options,
    headers:{
      apikey:key,
      Authorization:`Bearer ${key}`,
      'Content-Type':'application/json',
      ...(options.headers||{})
    }
  });
}

function isVideoUrl(url=''){
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(String(url));
}

function isUnsafeLocalUrl(value=''){
  const s=String(value||'').trim().toLowerCase();
  return (
    s.startsWith('blob:') ||
    s.startsWith('data:') ||
    s.startsWith('filesystem:') ||
    s.startsWith('capacitor://localhost/_capacitor_file_') ||
    s.startsWith('file:')
  );
}

function looksLikeHugeEncodedString(value=''){
  const s=String(value||'');
  if(s.length < 5000) return false;
  if(/^data:/i.test(s)) return true;
  // Muchos base64 largos no empiezan con data:, pero tienen este patrón.
  const sample=s.slice(0,300);
  return /^[A-Za-z0-9+/=\r\n]+$/.test(sample) && s.length > 12000;
}

const BLOCKED_KEYS = new Set([
  'mediaData',
  'mediaBase64',
  'mediaBlob',
  'base64',
  'blob',
  'rawFile',
  'localFile',
  'file',
  'fileData',
  'previewData',
  'imageData',
  'videoData',
  'thumbnailData',
  'originalFile',
  'ownerAvatarData'
]);

function deepSanitize(value, stats, path=[]){
  if(value === null || value === undefined) return value;

  if(typeof value === 'string'){
    if(isUnsafeLocalUrl(value) || looksLikeHugeEncodedString(value)){
      stats.removedUnsafeStrings += 1;
      stats.removedUnsafePaths.push(path.join('.') || 'root');
      return '';
    }
    return value;
  }

  if(typeof value !== 'object') return value;

  if(Array.isArray(value)){
    return value
      .map((item,index)=>deepSanitize(item, stats, [...path, String(index)]))
      .filter(item => item !== undefined && item !== null);
  }

  const out={};

  for(const [key, raw] of Object.entries(value)){
    if(BLOCKED_KEYS.has(key)){
      stats.removedBlockedKeys += 1;
      stats.removedUnsafePaths.push([...path,key].join('.'));
      continue;
    }

    // Campos de preview/avatar locales: conservar solo si son https.
    if((key === 'mediaPreviewUrl' || key === 'previewUrl' || key === 'ownerAvatar' || key === 'avatar') && typeof raw === 'string'){
      if(isUnsafeLocalUrl(raw) || looksLikeHugeEncodedString(raw)){
        stats.removedUnsafeStrings += 1;
        stats.removedUnsafePaths.push([...path,key].join('.'));
        out[key] = '';
        continue;
      }
    }

    const cleaned = deepSanitize(raw, stats, [...path,key]);

    if(cleaned !== undefined){
      out[key]=cleaned;
    }
  }

  return out;
}

function stripEmptyMediaItems(p){
  if(Array.isArray(p.mediaItems)){
    p.mediaItems = p.mediaItems
      .map(item => item && typeof item === 'object' ? item : null)
      .filter(Boolean)
      .filter(item => item.mediaUrl || item.mediaRef || item.mediaType || item.mediaName);
  }
  return p;
}

function normalizePost(post,row={},stats=null){
  const localStats = stats || {
    removedBlockedKeys:0,
    removedUnsafeStrings:0,
    removedUnsafePaths:[]
  };

  const p=stripEmptyMediaItems(deepSanitize(post||{}, localStats));
  const mediaUrl=String(p.mediaUrl||'').trim();

  p.id=p.id || row.client_id;
  p.ownerId=p.ownerId || row.owner_id || '';
  p.status=row.status || p.status || 'activa';
  p.createdAt=p.createdAt || row.created_at;
  p.updatedAt=p.updatedAt || row.updated_at || row.created_at;

  if(mediaUrl){
    p.mediaUrl=mediaUrl;
    p.cloudStatus='publica';
    p.mediaStatus='';
    p.mediaPending=false;
    if(String(p.mediaType||'').toLowerCase()==='video' || isVideoUrl(mediaUrl) || String(p.mediaMime||'').startsWith('video/')){
      p.mediaType='video';
    }
  }

  return p;
}

function payloadSizeOf(value){
  try{return JSON.stringify(value).length;}catch{return 0;}
}

function containsUnsafeValue(value){
  try{
    const text=JSON.stringify(value);
    return /data:|blob:|filesystem:|file:|mediaData|mediaBase64|ownerAvatarData/i.test(text);
  }catch{
    return false;
  }
}

module.exports=async function handler(req,res){
  const cfg=env();

  if(req.method==='GET' && String(req.url||'').includes('debug=1')){
    return send(res,200,{
      ok:cfg.ok,
      diagnostics:diagnostics(),
      message:cfg.ok?'Supabase configurado. Lectura normal disponible.':'Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel.'
    });
  }

  if(!cfg.ok){
    return send(res,200,{
      ok:false,
      error:'SUPABASE_NOT_CONFIGURED',
      message:'Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel.',
      diagnostics:diagnostics()
    });
  }

  try{
    if(req.method==='GET'){
      const r=await supabaseFetch(`${cfg.table}?select=client_id,owner_id,status,data,created_at,updated_at&order=created_at.desc`);
      const rows=await r.json().catch(()=>[]);

      if(!r.ok){
        return send(res,r.status,{
          ok:false,
          error:'SUPABASE_GET_FAILED',
          detail:rows,
          diagnostics:diagnostics({httpStatus:r.status})
        });
      }

      const stats={
        removedBlockedKeys:0,
        removedUnsafeStrings:0,
        removedUnsafePaths:[]
      };

      const posts=rows.map(row=>normalizePost(row.data||{},row,stats));

      if(String(req.url||'').includes('sizes=1')){
        return send(res,200,{
          ok:true,
          count:posts.length,
          diagnostics:diagnostics({
            sanitized:true,
            deepSanitized:true,
            totalPayloadBytes:payloadSizeOf(posts),
            containsUnsafeValue:containsUnsafeValue(posts),
            removedBlockedKeys:stats.removedBlockedKeys,
            removedUnsafeStrings:stats.removedUnsafeStrings,
            removedUnsafePaths:stats.removedUnsafePaths.slice(0,50),
            largest:posts
              .map(p=>({
                id:p.id,
                title:p.title||'',
                bytes:payloadSizeOf(p),
                hasMediaData:!!p.mediaData,
                hasUnsafeValue:containsUnsafeValue(p),
                ownerAvatarType:p.ownerAvatar ? (String(p.ownerAvatar).startsWith('http') ? 'https' : 'other') : 'empty',
                mediaItems:Array.isArray(p.mediaItems)?p.mediaItems.length:0
              }))
              .sort((a,b)=>b.bytes-a.bytes)
              .slice(0,10)
          }),
          posts
        });
      }

      return send(res,200,{ok:true,posts});
    }

    if(req.method==='POST'){
      const body=await readBody(req);
      const stats={removedBlockedKeys:0,removedUnsafeStrings:0,removedUnsafePaths:[]};
      const post=normalizePost(body.post||{}, {}, stats);

      if(!post || !post.id) return send(res,400,{ok:false,error:'MISSING_POST'});

      const row={
        client_id:post.id,
        owner_id:post.ownerId||'',
        status:post.status||'activa',
        data:post,
        updated_at:new Date().toISOString()
      };

      const r=await supabaseFetch(`${cfg.table}?on_conflict=client_id`,{
        method:'POST',
        headers:{Prefer:'resolution=merge-duplicates,return=representation'},
        body:JSON.stringify([row])
      });

      const data=await r.json().catch(()=>null);

      if(!r.ok){
        return send(res,r.status,{
          ok:false,
          error:'SUPABASE_UPSERT_FAILED',
          detail:data,
          diagnostics:diagnostics({httpStatus:r.status})
        });
      }

      return send(res,200,{
        ok:true,
        sanitized:true,
        removedBlockedKeys:stats.removedBlockedKeys,
        removedUnsafeStrings:stats.removedUnsafeStrings,
        post:normalizePost(data?.[0]?.data || post,data?.[0] || row)
      });
    }

    if(req.method==='DELETE'){
      const body=await readBody(req);
      const id=body.id;
      const ownerId=body.ownerId || '';
      const isAdmin=!!body.admin;

      if(!id) return send(res,400,{ok:false,error:'MISSING_ID'});

      if(!isAdmin){
        const chk=await supabaseFetch(`${cfg.table}?select=owner_id&client_id=eq.${encodeURIComponent(id)}&limit=1`);
        const rows=await chk.json().catch(()=>[]);
        if(!rows[0] || rows[0].owner_id!==ownerId) return send(res,403,{ok:false,error:'NOT_OWNER'});
      }

      const r=await supabaseFetch(`${cfg.table}?client_id=eq.${encodeURIComponent(id)}`,{method:'DELETE'});

      if(!r.ok){
        return send(res,r.status,{
          ok:false,
          error:'SUPABASE_DELETE_FAILED',
          diagnostics:diagnostics({httpStatus:r.status})
        });
      }

      return send(res,200,{ok:true});
    }

    res.setHeader('Allow','GET, POST, DELETE');
    return send(res,405,{ok:false,error:'METHOD_NOT_ALLOWED'});
  }catch(error){
    return send(res,500,{
      ok:false,
      error:'PUBLICATIONS_API_ERROR',
      message:error?.message || String(error),
      diagnostics:diagnostics()
    });
  }
};
