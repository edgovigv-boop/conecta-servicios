// api/publications.js
// Conecta Servicios v5.2.5
// Adaptador seguro para publicar y leer el muro general desde Supabase.
// Requiere variables de entorno en Vercel:
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY  (solo backend; NO exponer al frontend)
// Tabla sugerida: connecta_publications

function send(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
function readBody(req){
  return new Promise((resolve,reject)=>{
    let body='';
    req.on('data',chunk=>{ body+=chunk; if(body.length>6_000_000) req.destroy(); });
    req.on('end',()=>{ try{resolve(body?JSON.parse(body):{});}catch(e){reject(e);} });
    req.on('error',reject);
  });
}
function env(){
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table=process.env.SUPABASE_PUBLICATIONS_TABLE || 'connecta_publications';
  return {url,key,table,ok:!!(url&&key)};
}
async function supabaseFetch(path, options={}){
  const {url,key}=env();
  return fetch(`${url}/rest/v1/${path}`,{
    ...options,
    headers:{
      'apikey':key,
      'Authorization':`Bearer ${key}`,
      'Content-Type':'application/json',
      ...(options.headers||{})
    }
  });
}
module.exports = async function handler(req,res){
  const cfg=env();
  if(!cfg.ok){
    return send(res,200,{ok:false,error:'SUPABASE_NOT_CONFIGURED',message:'Modo local activo: configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para muro público.'});
  }
  try{
    if(req.method==='GET'){
      const r=await supabaseFetch(`${cfg.table}?select=client_id,owner_id,status,data,created_at&order=created_at.desc`);
      const rows=await r.json().catch(()=>[]);
      if(!r.ok) return send(res,r.status,{ok:false,error:'SUPABASE_GET_FAILED',detail:rows});
      return send(res,200,{ok:true,posts:rows.map(row=>({...(row.data||{}),id:row.client_id,ownerId:row.owner_id,status:row.status||row.data?.status||'activa'}))});
    }
    if(req.method==='POST'){
      const body=await readBody(req);
      const post=body.post;
      if(!post || !post.id) return send(res,400,{ok:false,error:'MISSING_POST'});
      const row={client_id:post.id,owner_id:post.ownerId||'',status:post.status||'activa',data:post,updated_at:new Date().toISOString()};
      const r=await supabaseFetch(`${cfg.table}?on_conflict=client_id`,{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify([row])});
      const data=await r.json().catch(()=>null);
      if(!r.ok) return send(res,r.status,{ok:false,error:'SUPABASE_UPSERT_FAILED',detail:data});
      return send(res,200,{ok:true,post});
    }
    if(req.method==='DELETE'){
      const body=await readBody(req);
      const id=body.id;
      const ownerId=body.ownerId||'';
      const isAdmin=!!body.admin;
      if(!id) return send(res,400,{ok:false,error:'MISSING_ID'});
      if(!isAdmin){
        const chk=await supabaseFetch(`${cfg.table}?select=owner_id&client_id=eq.${encodeURIComponent(id)}&limit=1`);
        const rows=await chk.json().catch(()=>[]);
        if(!rows[0] || rows[0].owner_id!==ownerId) return send(res,403,{ok:false,error:'NOT_OWNER'});
      }
      const r=await supabaseFetch(`${cfg.table}?client_id=eq.${encodeURIComponent(id)}`,{method:'DELETE'});
      if(!r.ok) return send(res,r.status,{ok:false,error:'SUPABASE_DELETE_FAILED'});
      return send(res,200,{ok:true});
    }
    res.setHeader('Allow','GET, POST, DELETE');
    return send(res,405,{ok:false,error:'METHOD_NOT_ALLOWED'});
  }catch(error){
    return send(res,500,{ok:false,error:'PUBLICATIONS_API_ERROR',message:error?.message||String(error)});
  }
};
