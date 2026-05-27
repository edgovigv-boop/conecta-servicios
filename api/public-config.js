// api/public-config.js
// Variables oficiales: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
function send(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(payload));
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
module.exports=async function handler(req,res){
  if(req.method!=='GET') return send(res,405,{ok:false,error:'METHOD_NOT_ALLOWED'});

  const supabaseUrl=cleanSupabaseUrl(firstEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_URL',
    'PUBLIC_SUPABASE_URL'
  ));

  const supabaseAnonKey=firstEnv(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY',
    'PUBLIC_SUPABASE_ANON_KEY'
  );

  const storageBucket=process.env.SUPABASE_STORAGE_BUCKET || 'publication-media';

  if(!supabaseUrl || !supabaseAnonKey){
    return send(res,200,{
      ok:false,
      error:'SUPABASE_PUBLIC_CONFIG_MISSING',
      message:'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel.',
      expectedVariables:['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY']
    });
  }

  return send(res,200,{ok:true,supabaseUrl,supabaseAnonKey,storageBucket});
};
