// api/public-config.js
// Devuelve solo configuración pública necesaria para subir media a Supabase Storage.
// Nunca devuelve llaves secretas. SUPABASE_ANON_KEY puede ser pública si las políticas de Storage están bien configuradas.
function send(res, status, payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
module.exports = async function handler(req,res){
  if(req.method!=='GET') return send(res,405,{ok:false,error:'METHOD_NOT_ALLOWED'});
  const supabaseUrl=process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey=process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
  const storageBucket=process.env.SUPABASE_STORAGE_BUCKET || 'publication-media';
  if(!supabaseUrl || !supabaseAnonKey){
    return send(res,200,{ok:false,error:'SUPABASE_PUBLIC_CONFIG_MISSING',message:'Modo local activo'});
  }
  return send(res,200,{ok:true,supabaseUrl,supabaseAnonKey,storageBucket});
};
