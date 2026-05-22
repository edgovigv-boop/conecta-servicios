/* Conecta Servicios v5.2.6 - Publicar visible inmediato */
(() => {
  'use strict';
  const VERSION = 'v5.2.6-publicar-visible-inmediato';
  const DOLA_EXTERNAL_URL = 'https://dola.com';
  const META_AI_URL = 'https://www.meta.ai/';
  const CONNECTA_APP_URL = 'https://conecta-servicios.vercel.app/';
  const FREE_DAYS = 30;
  const PRICE = 98;
  const ADMIN_PIN = '3145';
  const MAX_MEDIA = 10;
  const MAX_LOCAL_MB = 3; // fotos pequeñas pueden ir como dataURL; videos usan IndexedDB/preview para evitar pérdida
  const K = {
    posts:'cs_v52_posts', profile:'cs_v52_profile', prefs:'cs_v52_prefs', member:'cs_v52_member', admin:'cs_v52_admin',
    notes:'cs_v52_notes', requests:'cs_v52_requests', referrals:'cs_v52_referrals', verified:'cs_v52_verified', user:'cs_v52_user'
  };
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  let deferredInstallPrompt = null;
  const mediaObjectUrls = new Map();
  const mediaLoading = new Set();
  let mediaDbPromise = null;
  const state = { route:'/', filter:'Todos', stack:[], modal:null, selectedTemplate:null, selectedType:null, createChoice:null, draft:null, media:[], chatTask:null, chatMessages:[], chatText:'', chatResult:'', apiStatus:'idle', apiError:'', dolaPromptCopied:false, cloudReady:false, cloudMessage:'', inspirationPostId:null, metaPrompt:'', metaCopied:false };

  const types = [
    {id:'Negocio', icon:'🏪', color:'negocio', bg:'negocio-bg', title:'Negocio', short:'Vendo'},
    {id:'Agente', icon:'🛵', color:'agente', bg:'agente-bg', title:'Agente', short:'Ofrezco'},
    {id:'Solicitante', icon:'🧡', color:'solicitante', bg:'sol-bg', title:'Solicitante', short:'Necesito'}
  ];
  const templates = [
    {id:'necesito', type:'Solicitante', icon:'🧡', title:'Necesito algo', cat:'Ayuda local', media:'solicitante'},
    {id:'mensajero', type:'Solicitante', icon:'📦', title:'Busco mensajero', cat:'Mandados', media:'mandados'},
    {id:'comida', type:'Solicitante', icon:'🌮', title:'Pedir comida', cat:'Comida', media:'comida'},
    {id:'negocio', type:'Negocio', icon:'🏪', title:'Mi negocio', cat:'Negocio local', media:'negocio'},
    {id:'agente', type:'Agente', icon:'🛵', title:'Soy agente', cat:'Agente local', media:'agente'},
    {id:'clientes', type:'Negocio', icon:'💼', title:'Clientes', cat:'Comisión', media:'comision'}
  ];
  const modules = [
    {id:'embajadores', icon:'🏆', title:'Embajadores', short:'Invita', route:'/embajadores'},
    {id:'agentes', icon:'🚀', title:'Crecimiento', short:'Agentes', route:'/agentes'},
    {id:'mandados', icon:'🛡️', title:'Verificados', short:'Mandados', route:'/mandados'},
    {id:'aprendizaje', icon:'🎓', title:'Aprende', short:'Mejora', route:'/aprendizaje'}
  ];
  const star = [
    {icon:'✨', label:'Para ti', route:'/'},{icon:'🧡', label:'Solicitantes', route:'/explorar', filter:'Solicitante'},
    {icon:'🛵', label:'Agentes', route:'/explorar', filter:'Agente'},{icon:'🏪', label:'Negocios', route:'/explorar', filter:'Negocio'},
    {icon:'🛡️', label:'Mandados', route:'/mandados'},{icon:'💼', label:'Comisión', route:'/comision'},
    {icon:'🏆', label:'Embajadores', route:'/embajadores'},{icon:'🎓', label:'Aprende', route:'/aprendizaje'}
  ];
  const seed = [
    {id:'s1', type:'Negocio', category:'Comida', title:'Rosticería con entrega', description:'🍗 Pollo asado con ensalada, salsas y tortillas.\n🚚 Entrega o recoger.\n💬 Pide por DOLA.', zone:'Chapultepec', channel:'dola', mediaKey:'comida', mine:false, createdAt:now(-1), reactions:22},
    {id:'s2', type:'Agente', category:'Mandados', title:'Mandados por la tarde', description:'📦 Compras, pagos y entregas pequeñas.\n⏰ Tardes.\n📍 Zona centro.', zone:'Centro', channel:'dola', mediaKey:'mandados', mine:false, createdAt:now(-2), reactions:15},
    {id:'s3', type:'Solicitante', category:'Ayuda', title:'Necesito mover cajas', description:'📦 Cajas pequeñas.\n⏰ Una hora.\n💵 Pago a tratar.', zone:'Metepec', channel:'dola', mediaKey:'solicitante', mine:false, createdAt:now(-3), reactions:7},
    {id:'s4', type:'Negocio', category:'Profesional', title:'Consultoría tecnológica', description:'💻 Sistemas y apps.\n📅 Citas.\n📝 Cotización sin compromiso.', zone:'Regional', channel:'dola', mediaKey:'negocio', mine:false, createdAt:now(-4), reactions:18},
    {id:'s5', type:'Agente', category:'Apoyo', title:'Apoyo por horas', description:'🙋 Trámites, compras y acompañamiento.\n📍 Toluca y alrededores.', zone:'Toluca', channel:'whatsapp', whatsapp:'5217220000000', mediaKey:'agente', mine:false, createdAt:now(-5), reactions:11},
    {id:'s6', type:'Solicitante', category:'Comida', title:'Busco tacos para cenar', description:'🌮 Quiero entrega hoy.\n📍 Chapultepec.\n💵 Costo a tratar.', zone:'Chapultepec', channel:'dola', mediaKey:'comida', mine:false, createdAt:now(-1), reactions:9}
  ];

  function now(days=0){ return new Date(Date.now()+days*86400000).toISOString(); }
  function uid(p='id'){ return `${p}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function get(k,f){ try{return JSON.parse(localStorage.getItem(k)) ?? f}catch{return f} }
  function set(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
  function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function cleanPhone(p=''){return String(p).replace(/\D/g,'');}
  function member(){return get(K.member,{active:false});}
  function isMember(){const m=member();return !!m.active && (!m.expiresAt || new Date(m.expiresAt)>new Date());}
  function isAdmin(){return localStorage.getItem(K.admin)==='true';}
  function canUnlimited(){return isAdmin()||isMember();}
  function userId(){let id=localStorage.getItem(K.user); if(!id){id=uid('u');localStorage.setItem(K.user,id);} return id;}
  function isMine(p){return !!p && (p.mine===true || p.ownerId===userId());}
  function normalizePost(p){return {...p, ownerId:p.ownerId||(p.mine?userId():p.ownerId), mine:(p.ownerId? p.ownerId===userId(): !!p.mine)};}
  function posts(){let p=get(K.posts,null); if(!p){p=seed;set(K.posts,p)} return p.map(normalizePost);}
  function savePosts(p){const normalized=p.map(normalizePost); try{set(K.posts,normalized)}catch(e){toast('Video pesado: usa Storage en producción'); set(K.posts,normalized.map(x=>({...x,mediaItems:[],mediaData:''})));}}
  function visiblePosts(){return posts().filter(p=>p.status!=='eliminada' && (isAdmin() || p.status!=='oculta'));}
  function myPosts(){return posts().filter(p=>isMine(p));}
  function daysLeft(d){if(!d)return null; return Math.max(0,Math.ceil((new Date(d)-new Date())/86400000));}
  function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>toastEl.classList.remove('show'),2400);}
  function nav(route, opts={}){ if(!opts.replace && state.route!==route) state.stack.push({route:state.route, filter:state.filter, template:state.selectedTemplate, choice:state.createChoice}); state.route=route; if(opts.filter)state.filter=opts.filter; render(); if(!opts.keepScroll) setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),0); }
  function back(){ const prev=state.stack.pop(); if(prev){state.route=prev.route; state.filter=prev.filter||'Todos'; state.selectedTemplate=prev.template||null; state.createChoice=prev.choice||null;} else {state.route='/';} render(); setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),0); }
  function resetCreate(){ state.selectedTemplate=null; state.selectedType=null; state.createChoice=null; state.draft=null; state.media=[]; state.chatTask=null; state.chatMessages=[]; state.chatText=''; state.chatResult=''; state.apiStatus='idle'; state.apiError=''; state.dolaPromptCopied=false; state.inspirationPostId=null; state.metaPrompt=''; state.metaCopied=false; }
  function installApp(){ if(deferredInstallPrompt){deferredInstallPrompt.prompt(); deferredInstallPrompt.userChoice.finally(()=>deferredInstallPrompt=null); } else toast('Menú del navegador → Agregar a inicio'); }
  function addNote(title,msg){ const n=get(K.notes,[]); n.unshift({id:uid('n'),title,msg,createdAt:now()}); set(K.notes,n.slice(0,50)); }
  function unread(){ return get(K.notes,[]).length; }
  function copy(text){ return navigator.clipboard?.writeText(text).then(()=>toast('Copiado')).catch(()=>toast('No se pudo copiar')); }
  function officialLogo(){return 'assets/icons/conecta-logo-oficial.png';}
  function mediaPath(key){ const map={comida:'comida-01.jpg',mandados:'mandados-01.jpg',agente:'agente-01.jpg',negocio:'negocio-01.jpg',solicitante:'solicitante-01.jpg',embajadores:'embajadores-01.jpg',aprendizaje:'aprendizaje-01.jpg',verificados:'mandados-verificados-01.jpg',comision:'comision-01.jpg'}; return `assets/dola-media/${map[key]||'solicitante-01.jpg'}`; }
  function openMediaDb(){
    if(mediaDbPromise) return mediaDbPromise;
    mediaDbPromise = new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)) return reject(new Error('indexedDB no disponible'));
      const req = indexedDB.open('conecta_media_v1',1);
      req.onupgradeneeded = () => req.result.createObjectStore('files');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return mediaDbPromise;
  }
  async function saveMediaBlob(id, file){
    const db = await openMediaDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('files','readwrite');
      tx.objectStore('files').put(file,id);
      tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
    });
  }
  async function loadMediaBlob(id){
    const db = await openMediaDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('files','readonly');
      const req=tx.objectStore('files').get(id);
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
    });
  }
  function resolveMediaSrc(item){
    if(!item) return '';
    if(item.data && !item.ref) return item.data;
    if(item.url) return item.url;
    if(item.ref){
      if(mediaObjectUrls.has(item.ref)) return mediaObjectUrls.get(item.ref);
      if(item.preview && !item.persisted) return item.preview;
      if(!mediaLoading.has(item.ref)){
        mediaLoading.add(item.ref);
        loadMediaBlob(item.ref).then(blob=>{
          if(blob){
            const old=mediaObjectUrls.get(item.ref);
            if(old) URL.revokeObjectURL(old);
            mediaObjectUrls.set(item.ref, URL.createObjectURL(blob));
            render();
          }
        }).catch(()=>{}).finally(()=>mediaLoading.delete(item.ref));
      }
    }
    return '';
  }

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;});
  window.addEventListener('popstate',e=>{ if(state.stack.length) back(); });

  function layout(content, opts={}){
    const showBack = opts.back ?? (state.route !== '/');
    return `<main class="page">
      <div class="topbar">
        ${showBack?`<button class="back" data-back>‹</button>`:`<div class="brand"><img class="brand-logo" src="${officialLogo()}" alt="Conecta"><div><div class="brand-title">Conecta</div><div class="brand-sub">Servicios</div></div></div>`}
        ${showBack?`<div class="brand-title">${opts.title||'Conecta'}</div>`:''}
        <div style="display:flex;gap:8px">
          <button class="icon-btn" data-install title="Instalar">➕</button>
          <button class="icon-btn" data-route="/notificaciones" title="Avisos">🔔${unread()?`<span class="dot">${unread()}</span>`:''}</button>
        </div>
      </div>
      ${content}
    </main>${bottomNav()}${state.modal?modal(state.modal):''}`;
  }
  function bottomNav(){ const items=[['/','🏠','Inicio'],['/explorar','🔎','Buscar'],['/publicar','➕','Crear'],['/perfil','👤','Perfil']]; return `<nav class="bottom-nav">${items.map(([r,i,l])=>`<button class="nav-btn ${r==='/publicar'?'nav-create':''} ${state.route===r?'active':''}" data-route="${r}"><span>${i}</span><small>${l}</small></button>`).join('')}</nav>`; }
  function modal(m){return `<div class="modal-bg" data-close-modal><div class="modal" onclick="event.stopPropagation()"><div class="title-row"><h3>${m.title}</h3><button class="icon-btn" data-close-modal>✕</button></div>${m.body}</div></div>`;}

  function render(){
    const routes = {'/':home,'/explorar':explore,'/publicar':publish,'/mis':myPage,'/perfil':profile,'/embajadores':()=>modulePage('embajadores'),'/agentes':()=>modulePage('agentes'),'/mandados':()=>modulePage('mandados'),'/aprendizaje':()=>modulePage('aprendizaje'),'/comision':()=>modulePage('comision'),'/notificaciones':notifications,'/admin':adminPage};
    app.innerHTML = (routes[state.route]||home)(); bind();
  }
  function home(){
    return layout(`
      <div class="quick-hero">${types.map(t=>`<button class="big-chip ${t.bg}" data-filter-home="${t.id}"><span>${t.icon}</span><small>${t.short}</small></button>`).join('')}</div>
      <div class="cloud-badge ${state.cloudReady?'':'off'}">${state.cloudReady?'🌐 Público':'📱 Local'}</div>
      <div class="visual-tabs">${star.map(s=>`<button class="tab-pill" data-route="${s.route}" ${s.filter?`data-filter="${s.filter}"`:''}>${s.icon} ${s.label}</button>`).join('')}</div>
      <div class="section-head"><h2>Ejemplos</h2><button data-route="/publicar">Crear</button></div>
      ${categoryGallery('Negocio')}${categoryGallery('Agente')}${categoryGallery('Solicitante')}
    `,{back:false});
  }
  function categoryGallery(type){ const filtered=visiblePosts().filter(p=>p.type===type).slice(0,3); const t=types.find(x=>x.id===type); return `<section><div class="section-head"><h2>${t.icon} ${type}s</h2><button data-route="/explorar" data-filter="${type}">Ver</button></div><div class="gallery snap-feed">${filtered.map(p=>postCard(p,'feed')).join('')}</div></section>`; }
  function explore(){ const all=visiblePosts(); const filtered=state.filter==='Todos'?all:all.filter(p=>p.type===state.filter); return layout(`
    <div class="visual-tabs">${['Todos','Negocio','Agente','Solicitante'].map(f=>`<button class="tab-pill ${state.filter===f?'active':''}" data-set-filter="${f}">${f==='Todos'?'✨':types.find(t=>t.id===f)?.icon} ${f}</button>`).join('')}</div>
    <input class="input" data-search placeholder="🔎 Buscar" aria-label="Buscar">
    <div class="gallery snap-feed" id="feed">${filtered.map(p=>postCard(p,'feed')).join('') || '<div class="empty">Sin publicaciones</div>'}</div>
  `,{title:'Buscar'}); }
  function postCard(p, context='feed'){
    const cls=p.type==='Agente'?'agente':p.type==='Negocio'?'negocio':'solicitante';
    const canManage = context==='mine' && isMine(p);
    const actions = [`<button class="action" data-react="${p.id}">❤️ ${p.reactions||0}</button>`,`<button class="action" data-share="${p.id}">↗ Compartir</button>`,`<button class="action" data-similar="${p.id}">➕ Igual</button>`,`<button class="action primary ${p.channel==='whatsapp'?'whatsapp':''}" data-message="${p.id}">💬 Mensaje</button>`];
    if(canManage){actions.unshift(`<button class="action primary" data-edit-own="${p.id}">✏️ Editar</button>`); if(p.cloudStatus!=='publica') actions.push(`<button class="action primary" data-retry-cloud="${p.id}">🌐 Subir</button>`); actions.push(`<button class="action red" data-delete-post="${p.id}">🗑️ Borrar</button>`);}
    return `<article class="post-card snap-card ${context==='preview'?'preview-card':''}" data-post-id="${p.id}">
      <div class="post-media">${renderMedia(p)}</div>
      <div class="post-overlay"><div class="meta"><span class="chip ${cls}">${iconForType(p.type)} ${p.type}</span><span class="chip glass">📍 ${esc(p.zone||'Zona')}</span>${p.status==='oculta'?'<span class="chip glass">🙈 Oculta</span>':''}${context==='mine'?`<span class="chip glass">${p.cloudStatus==='publica'?'🌐 Pública':'📱 Borrador'}</span>`:''}</div>
        <h3 class="post-title">${esc(p.title)}</h3><div class="post-desc">${esc(p.description)}</div></div>
      <div class="post-actions ${canManage?'manage-actions':''}">${actions.join('')}</div>
    </article>`;
  }
  function renderMedia(p){
    const items=p.mediaItems||[];
    const first=items[0];
    const src=resolveMediaSrc(first);
    if(src){
      return first.kind==='video'
        ? `<video controls playsinline preload="metadata" src="${src}"></video>`
        : `<img src="${src}" alt="${esc(p.title)}">`;
    }
    if(first?.ref) return `<div class="placeholder"><div><span class="emoji">🎥</span>Video listo</div></div>`;
    const key=p.mediaKey || (p.type==='Negocio'?'negocio':p.type==='Agente'?'agente':'solicitante');
    return `<img src="${mediaPath(key)}" alt="${esc(p.title)}" onerror="this.outerHTML='<div class=&quot;placeholder&quot;><div><span class=&quot;emoji&quot;>${iconForType(p.type)}</span>${esc(p.type)}</div></div>'">`;
  }
  async function getPublicConfig(){
    try{ const res=await fetch('/api/public-config',{cache:'no-store'}); return await res.json(); }catch{return {ok:false};}
  }
  async function syncFromCloud(opts={}){
    try{
      const res=await fetch('/api/publications',{cache:'no-store'});
      const data=await res.json();
      if(!data.ok){state.cloudReady=false; state.cloudMessage=data.message||'Modo local'; return {ok:false,error:data.error||'SUPABASE_NOT_READY'};}
      state.cloudReady=true; state.cloudMessage='Muro público activo';
      const remote=(data.posts||[]).map(p=>normalizePost({...p, cloudStatus:'publica'}));
      const local=posts();
      const merged=[...remote];
      local.forEach(lp=>{
        const exists=merged.some(r=>r.id===lp.id);
        if(!exists && lp.status!=='eliminada') merged.push(normalizePost({...lp, cloudStatus:lp.cloudStatus||'local'}));
      });
      merged.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
      savePosts(merged);
      if(opts.render!==false) render();
      return {ok:true,posts:merged};
    }catch(e){state.cloudReady=false; state.cloudMessage='Modo local'; return {ok:false,error:e?.message||'SYNC_FAILED'};}
  }
  async function syncPostToCloud(post){
    try{
      const res=await fetch('/api/publications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({post})});
      const data=await res.json().catch(()=>({ok:false,error:'BAD_JSON'}));
      if(!res.ok || !data.ok) return {ok:false,error:data.error||`HTTP_${res.status}`,detail:data.detail||data.message};
      return {ok:true,post:data.post||post};
    }catch(e){return {ok:false,error:e?.message||'NETWORK_ERROR'};}
  }
  async function deletePostFromCloud(id){
    try{
      const res=await fetch('/api/publications',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,ownerId:userId(),admin:isAdmin()})});
      const data=await res.json().catch(()=>({ok:false}));
      return {ok:res.ok && data.ok, data};
    }catch(e){return {ok:false,error:e?.message||'NETWORK_ERROR'};}
  }
  async function uploadMediaToCloud(post){
    const cfg=await getPublicConfig();
    if(!cfg.ok || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return post.mediaItems||[];
    const bucket=cfg.storageBucket||'publication-media';
    const items=[];
    for(const item of (post.mediaItems||[])){
      if(item.url){items.push(item); continue;}
      let blob=null;
      try{
        if(item.data) blob=await (await fetch(item.data)).blob();
        else if(item.ref) blob=await loadMediaBlob(item.ref);
      }catch(e){}
      if(!blob){items.push(item); continue;}
      const safe=(item.name||`${item.kind||'media'}.bin`).replace(/[^a-z0-9_.-]/gi,'-').toLowerCase();
      const path=`${encodeURIComponent(userId())}/${encodeURIComponent(post.id)}/${Date.now()}-${safe}`;
      try{
        const up=await fetch(`${cfg.supabaseUrl}/storage/v1/object/${bucket}/${path}`,{method:'POST',headers:{'apikey':cfg.supabaseAnonKey,'Authorization':`Bearer ${cfg.supabaseAnonKey}`,'Content-Type':item.type||blob.type||'application/octet-stream','x-upsert':'true'},body:blob});
        if(up.ok){items.push({...item,data:undefined,ref:undefined,preview:undefined,url:`${cfg.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`});}
        else items.push(item);
      }catch(e){items.push(item);}
    }
    return items;
  }


  function currentInspirationPost(){
    const all=visiblePosts();
    return all.find(p=>p.id===state.inspirationPostId) || all[0] || seed[0];
  }
  function templateFromPost(p){
    if(!p) return templates[0];
    if((p.category||'').toLowerCase().includes('comida')) return templates.find(t=>t.id==='comida') || templates[0];
    if((p.category||'').toLowerCase().includes('mandado')) return templates.find(t=>t.id==='mensajero') || templates[0];
    if(p.type==='Negocio') return templates.find(t=>t.id==='negocio') || templates[0];
    if(p.type==='Agente') return templates.find(t=>t.id==='agente') || templates[0];
    return templates.find(t=>t.type===p.type) || templates[0];
  }
  function startInspiredCreation(post){
    const p=post || currentInspirationPost();
    resetCreate();
    state.inspirationPostId=p?.id||null;
    state.selectedTemplate=templateFromPost(p);
    state.createChoice='dola';
    state.chatMessages=[{role:'assistant',content:'¿Te gustó esta publicación? ¡Qué buena elección! ✨\nCopia el prompt, abre DOLA y te ayudará a crear una parecida.'}];
    nav('/publicar',{keepScroll:false});
  }
  function inspirationPrompt(source,t){
    const hasSource=!!source;
    return `ROL:
Eres DOLA, asistente amable, paciente y especializado dentro de Conecta Servicios.

CONTEXTO:
Vengo de Conecta Servicios: ${CONNECTA_APP_URL}
Quiero crear una publicación inspirada en otra que vi en el muro.
${hasSource?`Publicación que me inspiró:
- Título: ${source.title||''}
- Tipo: ${source.type||''}
- Categoría: ${source.category||''}
- Zona: ${source.zone||''}
- Texto:
${source.description||''}`:`Plantilla elegida: ${t.title}\nTipo: ${t.type}\nCategoría: ${t.cat}`}

SALUDO INICIAL OBLIGATORIO:
Empieza diciendo algo parecido a: "¿Te gustó esta publicación? ¡Qué buena elección! Aquí tienes toda la información y los detalles que necesitas saber para hacer la tuya. Mira lo que debes considerar..."

OBJETIVO:
Ayúdame a crear una publicación propia, clara, atractiva y lista para pegar en Conecta Servicios. No copies literalmente la publicación original: úsala solo como inspiración.

REGLAS OBLIGATORIAS:
Hazme UNA sola pregunta a la vez.
Espera mi respuesta antes de continuar.
No uses tablas. No uses JSON.
No repitas este prompt.
No incluyas toda la conversación.
No recomiendes herramientas externas.
Mantente dentro de Conecta Servicios.

AYUDA INTELIGENTE:
Si te respondo con "No sé", "Ayúdame", "No tengo idea" o no sé qué escribir, NO me dejes solo. Dime: "Claro que sí, te ayudo con gusto 🤝". Luego dame ejemplos, opciones claras y sugerencias para que yo solo elija.

SALIDA FINAL:
Cuando generes el resultado final, entrégalo SIEMPRE dentro de un RECUADRO DE TEXTO y agrega debajo un BOTÓN que diga 📋 COPIAR, para que solo tenga que presionar un botón.
Entrega SOLO la publicación final, con emojis moderados y formato limpio:

[TÍTULO CORTO]

📍 Zona:
...

📝 Descripción:
...

✅ Detalles:
...

💬 Contacto:
Responder por Conecta Servicios.

No agregues explicaciones fuera de la publicación final.`;
  }
  function buildMetaPrompt(d){
    const title=d?.title||'Publicación para Conecta Servicios';
    const desc=d?.description||'';
    const type=d?.type||state.selectedTemplate?.type||'Publicación';
    return `Crea un video vertical 9:16, estilo TikTok/Reels, para una publicación de Conecta Servicios.

Tema: ${title}
Tipo: ${type}
Zona: ${d?.zone||'local'}

Texto base:
${desc}

Indicaciones:
- Duración sugerida: 15 a 30 segundos.
- Estilo moderno, claro, familiar y confiable.
- Texto grande y legible.
- Música alegre y limpia.
- Mostrar sensación de comunidad local.
- Cerrar con la idea: "Conecta Servicios".
- No uses marcas ajenas ni promesas exageradas.`;
  }

  function iconForType(type){ return type==='Negocio'?'🏪':type==='Agente'?'🛵':'🧡'; }

  function publish(){
    if(!state.selectedTemplate) return layout(`<div class="section-head"><h2>¿Qué quieres?</h2></div><div class="big-options">${templates.map(t=>`<button class="big-option" data-template="${t.id}"><span class="ico">${t.icon}</span><div><b>${t.title}</b><small>${t.type}</small></div></button>`).join('')}</div>`,{title:'Crear'});
    if(!state.createChoice) return layout(`<div class="card center"><div class="template-badge"><span style="font-size:3rem">${state.selectedTemplate.icon}</span><h2>${state.selectedTemplate.title}</h2></div><div class="circle-grid"><button class="circle dola" data-create-choice="dola"><div><div class="ico">✨</div><b>DOLA</b><br><small>Me ayuda</small></div></button><button class="circle manual" data-create-choice="manual"><div><div class="ico">✍️</div><b>Manual</b><br><small>Yo escribo</small></div></button></div></div>`,{title:'Crear'});
    return state.createChoice==='manual'?manualCreate():dolaCreate();
  }
  function basePrompt(t){ return `ROL:
Eres DOLA, asistente amable, paciente y especializado dentro de Conecta Servicios.

CONTEXTO:
Vengo de Conecta Servicios: ${CONNECTA_APP_URL}
Elegí: ${t.title}
Tipo: ${t.type}
Categoría: ${t.cat}
Conecta Servicios ayuda a publicar necesidades, agentes y negocios locales.

OBJETIVO:
Ayúdame a crear una publicación clara, visual y lista para pegar en Conecta Servicios.

REGLAS OBLIGATORIAS:
Hazme UNA sola pregunta a la vez.
Espera mi respuesta antes de continuar.
No uses tablas. No uses JSON.
No repitas este prompt.
No incluyas toda la conversación.
No recomiendes herramientas externas.
Mantente en Conecta Servicios.

AYUDA INTELIGENTE:
Si te respondo con "No sé", "Ayúdame", "No tengo idea" o no sé qué escribir, NO me dejes solo. Dime: "Claro que sí, te ayudo con gusto 🤝". Luego dame ejemplos, opciones claras y sugerencias para que yo solo elija.

SALIDA FINAL:
Cuando generes el resultado final, entrégalo SIEMPRE dentro de un RECUADRO DE TEXTO y agrega debajo un BOTÓN que diga 📋 COPIAR, para que solo tenga que presionar un botón.
Entrega SOLO la publicación final, con emojis moderados y formato limpio:

[TÍTULO CORTO]

📍 Zona:
...

📝 Descripción:
...

✅ Detalles:
...

💬 Contacto:
Responder por Conecta Servicios.

No agregues explicaciones fuera de la publicación final.`; }
  function dolaCreate(){
    const t=state.selectedTemplate;
    const source=currentInspirationPost();
    const prompt=state.inspirationPostId?inspirationPrompt(source,t):basePrompt(t);
    const promptBlink=state.dolaPromptCopied?'':' blink-soft';
    const openBlink=state.dolaPromptCopied?' blink-soft':'';
    return layout(`
    <div class="card"><div class="title-row"><div><h2 class="page-title">✨ Crear con DOLA</h2><p class="sub">${state.inspirationPostId?'Inspirado en el muro':t.title}</p></div></div>
      <div class="notice friendly">PRÓXIMAMENTE: Copia el prompt y abre DOLA</div>
      <div class="prompt-card${promptBlink}" data-prompt-card><div class="copy-corner"><button class="icon-btn" data-copy-prompt="${t.id}">📋</button></div><pre>${esc(prompt)}</pre></div>
      <button class="btn primary full${openBlink}" data-open-external>↗ ABRIR DOLA</button><button class="btn full" data-create-choice="manual">✍️ Manual</button>
      <p class="sub center">Primero DOLA te da el texto. Después Meta IA puede ayudarte con el video.</p>
      <div class="chat">${state.chatMessages.length?state.chatMessages.map(m=>`<div class="bubble ${m.role==='user'?'user':'assistant'}">${esc(m.content)}</div>`).join(''):`<div class="bubble assistant">1️⃣ Copia el prompt.\n2️⃣ Abre DOLA.\n3️⃣ Copia el recuadro final.\n4️⃣ Pégalo aquí.\n5️⃣ Genera video con Meta IA si quieres.</div>`}</div>
      ${state.apiError?`<div class="notice friendly">${esc(state.apiError)}</div>`:''}
    </div>
    <div class="card"><label class="label">Texto de DOLA</label><textarea class="textarea" data-dola-text placeholder="Pega aquí la publicación final de DOLA">${esc(state.chatResult||'')}</textarea><button class="btn green full edit-finish" data-edit-finish>✏️ EDITAR Y TERMINAR</button></div>
    ${state.draft?preview(state.draft):''}
  `,{title:'DOLA'}); }
  function manualCreate(){ const d=state.draft||{type:state.selectedTemplate.type,category:state.selectedTemplate.cat,title:'',description:'',zone:'',channel:'dola',whatsapp:'',mediaItems:[]}; if(!state.draft) state.draft=d; return layout(`<div class="card"><h2 class="page-title">✍️ Manual</h2>${formFields(d)}</div>${preview(d)}`,{title:'Manual'}); }
  function formFields(d){return `<label class="label">Título</label><input class="input" data-field="title" value="${esc(d.title)}" placeholder="Título"><label class="label">Zona</label><input class="input" data-field="zone" value="${esc(d.zone)}" placeholder="Zona"><label class="label">Texto</label><textarea class="textarea" data-field="description" placeholder="Descripción">${esc(d.description)}</textarea><label class="label">Canal</label><select class="select" data-field="channel"><option value="dola" ${d.channel==='dola'?'selected':''}>DOLA</option><option value="whatsapp" ${d.channel==='whatsapp'?'selected':''}>WhatsApp</option></select>${d.channel==='whatsapp'?`<label class="label">WhatsApp</label><input class="input" data-field="whatsapp" value="${esc(d.whatsapp||'')}" placeholder="Número">`:''}${metaVideoBox(d)}${mediaUploader()}`;}

  function metaVideoBox(d){
    const prompt=state.metaPrompt || buildMetaPrompt(d);
    const blink=state.metaCopied?'':' blink-soft';
    return `<div id="meta-video-section" class="meta-video-box ${blink}">
      <div class="title-row"><div><b>🎥 Meta IA</b><p class="sub">Video listo para crear</p></div></div>
      <button class="btn primary full" data-copy-meta>🎬 GENERAR VIDEO CON META IA</button>
      <button class="btn full" data-open-meta>↗ Abrir Meta IA</button>
      <p class="sub center">Se copia el prompt. Cuando Meta descargue el video, súbelo abajo.</p>
      <details><summary>Ver prompt</summary><pre>${esc(prompt)}</pre></details>
    </div>`;
  }

  function mediaUploader(){ return `<div id="media-section" class="media-section"><label class="label">Fotos / videos</label><label class="file-btn">📷 Subir<input class="hidden" type="file" data-media multiple accept="image/*,video/*"></label><div class="media-grid">${state.media.map((m,i)=>{const src=resolveMediaSrc(m); return `<div class="media-thumb">${src?(m.kind==='video'?`<video src="${src}" controls playsinline preload="metadata"></video>`:`<img src="${src}" alt="media">`):`<div class="placeholder small">🎥 Video</div>`}<button class="media-x" data-remove-media="${i}">×</button></div>`}).join('')}</div><p class="sub">Hasta 10 archivos.</p></div>`; }
  function preview(d){ return `<div class="card"><h2 class="page-title">Así se verá</h2>${postCard({...d,id:'preview',reactions:0,mediaItems:state.media,mine:true,ownerId:userId(),createdAt:now(),mediaKey:state.selectedTemplate?.media},'preview')}<button class="btn primary full" data-publish-draft>Publicar</button></div>`; }
  function buildDraftFromText(text){ const first=(text||'').split('\n').find(x=>x.trim())||state.selectedTemplate.title; const draft={id:uid('p'), mine:true, type:state.selectedTemplate.type, category:state.selectedTemplate.cat, title:first.replace(/^[#*\s]+/,'').slice(0,80), description:text.trim(), zone:extractZone(text)||'', channel:'dola', whatsapp:'', status:'activa', freeTrial:!canUnlimited(), expiresAt:canUnlimited()?null:now(FREE_DAYS), createdAt:now(), mediaKey:state.selectedTemplate.media, mediaItems:state.media, reactions:0, inspiredBy:state.inspirationPostId||null}; state.metaPrompt=buildMetaPrompt(draft); state.metaCopied=false; return draft; }
  function extractZone(text){ const m=String(text).match(/(?:Zona|Ubicación|📍)\s*:?\s*([^\n]+)/i); return m?m[1].trim().slice(0,60):''; }

  function myPage(){ const list=myPosts().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); return layout(`<div class="section-head"><h2>Mis publicaciones</h2><button data-route="/publicar">Crear</button></div>${list.length?`<div class="gallery snap-feed">${list.map(p=>postCard(p,'mine')).join('')}</div>`:'<div class="empty">Sin publicaciones</div>'}<div class="card"><b>💎 $${PRICE}</b><p class="sub">Publica sin límites.</p><button class="btn primary full" data-activate-member>Activar</button></div>`,{title:'Mis'}); }
  function profile(){ const p=get(K.profile,{name:'',zone:'',phone:''}); const prefs=get(K.prefs,{channel:'dola'}); return layout(`<div class="big-options"><button class="big-option" data-route="/mis"><span class="ico">📌</span><div><b>Mis</b><small>Publicaciones</small></div></button><button class="big-option" data-install><span class="ico">➕</span><div><b>Instalar</b><small>PWA</small></div></button><button class="big-option" data-enable-notes><span class="ico">🔔</span><div><b>Avisos</b><small>Activar</small></div></button><button class="big-option" ${isAdmin()?'data-route="/admin"':'data-admin'}><span class="ico">🛠️</span><div><b>Oficina</b><small>${isAdmin()?'Panel':'Admin'}</small></div></button></div><div class="card"><label class="label">Nombre</label><input class="input" data-profile="name" value="${esc(p.name)}"><label class="label">Zona</label><input class="input" data-profile="zone" value="${esc(p.zone)}"><label class="label">Canal</label><select class="select" data-pref="channel"><option value="dola" ${prefs.channel==='dola'?'selected':''}>DOLA</option><option value="whatsapp" ${prefs.channel==='whatsapp'?'selected':''}>WhatsApp</option></select><div class="btn-row"><button class="btn green" data-save-profile>Guardar</button><button class="btn red" data-clear-local>Limpiar</button></div></div><div class="version">${VERSION}</div>`,{title:'Perfil'}); }
  function notifications(){ const n=get(K.notes,[]); return layout(`<div class="card"><button class="btn primary full" data-enable-notes>Activar 🔔</button></div>${n.length?n.map(x=>`<div class="card"><b>${esc(x.title)}</b><p class="sub">${esc(x.msg)}</p></div>`).join(''):'<div class="empty">Sin avisos</div>'}`,{title:'Avisos'}); }

  function adminPage(){
    if(!isAdmin()) return layout(`<div class="card center"><div style="font-size:4rem">🛠️</div><h2>Admin</h2><p class="sub">Activa acceso.</p><button class="btn primary full" data-admin>Entrar</button></div>`,{title:'Admin'});
    const all=posts().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    const stats={total:all.length, activa:all.filter(p=>(p.status||'activa')==='activa').length, oculta:all.filter(p=>p.status==='oculta').length};
    return layout(`<div class="card"><div class="title-row"><div><h2 class="page-title">🛠️ Admin</h2><p class="sub">Todas las publicaciones</p></div><span class="admin-badge">${stats.total}</span></div><div class="quick-grid"><div class="stat-mini">✅<b>${stats.activa}</b><small>Activas</small></div><div class="stat-mini">🙈<b>${stats.oculta}</b><small>Ocultas</small></div></div></div><div class="gallery">${all.map(adminCard).join('')||'<div class="empty">Sin publicaciones</div>'}</div><div class="card"><button class="btn red full" data-admin-exit>Salir de admin</button></div>`,{title:'Admin'});
  }
  function adminCard(p){
    const visible=(p.status||'activa')==='activa';
    return `<article class="post-card admin-post ${p.status==='oculta'?'is-hidden':''}">
      <div class="post-body"><div class="meta"><span class="chip gray">${visible?'✅ Activa':'🙈 Oculta'}</span><span class="chip gray">${p.mine?'Mía':'Usuario'}</span><span class="chip gray">${esc(p.type||'Tipo')}</span></div>
      <h3 class="post-title">${esc(p.title||'Sin título')}</h3><div class="post-desc compact">${esc(p.description||'')}</div></div>
      <div class="post-actions admin-actions"><button class="action primary" data-admin-edit="${p.id}">✏️ Editar</button><button class="action ${visible?'red':'primary'}" data-admin-toggle="${p.id}">${visible?'🙈 Ocultar':'✅ Activar'}</button><button class="action red" data-delete-post="${p.id}">🗑️ Borrar</button><button class="action" data-message="${p.id}">💬 Ver</button></div>
    </article>`;
  }

  function modulePage(id){ const data={embajadores:['🏆','Embajadores',['Copiar enlace','Mensaje','Referido','Membresía']],agentes:['🚀','Agentes',[ 'Publicar','Solicitudes','DOLA','Tips']],mandados:['🛡️','Mandados',[ 'Solicitar','Postularme','Requisitos','FAQ']],aprendizaje:['🎓','Aprende',[ 'Recursos','DOLA','Plan','Tips']],comision:['💼','Comisión',[ 'Campaña','DOLA','Compartir','Clientes']]}[id]||['✨','Módulo',['Crear','DOLA']]; return layout(`<div class="card center"><div style="font-size:4rem">${data[0]}</div><h2>${data[1]}</h2></div><div class="module-grid">${data[2].map((a,i)=>`<button class="module-card" data-module-action="${id}:${a}"><span>${['➕','✨','📋','↗'][i%4]}</span><b>${a}</b><small>Ir</small></button>`).join('')}</div>`,{title:data[1]}); }

  async function callDola(task,instruction=''){
    const prompt = task==='contact' ? contactPrompt(state.chatTask) : (state.inspirationPostId?inspirationPrompt(currentInspirationPost(), state.selectedTemplate || templates[0]):basePrompt(state.selectedTemplate || templates[0]));
    state.apiStatus='loading'; state.apiError=''; state.chatMessages.push({role:'user',content:instruction||'Crear con DOLA'}); render();
    try{
      const res=await fetch('/api/dola',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:prompt},{role:'user',content:instruction}],context:{task,version:VERSION,app:CONNECTA_APP_URL}})});
      const data=await res.json();
      if(!data.ok) throw Object.assign(new Error(data.message||'PRÓXIMAMENTE'),{code:data.error});
      const text=(data.text||'').trim(); state.chatMessages.push({role:'assistant',content:text||'Listo.'}); state.chatResult=text; state.apiStatus='ready';
    }catch(e){ state.apiStatus='fallback'; state.apiError='PRÓXIMAMENTE: Copia el prompt y abre DOLA'; state.chatMessages.push({role:'assistant',content:'PRÓXIMAMENTE: Copia el prompt y abre DOLA'}); }
    render();
  }
  function contactPrompt(p){ return `ROL:\nEres DOLA, asistente de Conecta Servicios.\nCONTEXTO:\nQuiero contactar esta publicación: ${p?.title}. Zona: ${p?.zone}. Texto: ${p?.description}\nOBJETIVO:\nHaz una pregunta a la vez y genera mensaje final claro para el anunciante.`; }
  function openContact(p){ if(p.channel==='whatsapp' && p.whatsapp){ const msg=encodeURIComponent(`Hola, vi tu publicación en Conecta Servicios: ${p.title}`); location.href=`https://wa.me/${cleanPhone(p.whatsapp)}?text=${msg}`; return; } state.modal={title:'💬 DOLA',body:`<p class="sub">Ordena tu mensaje.</p><div class="btn-row"><button class="btn primary" data-contact-dola="${p.id}">DOLA</button><button class="btn" data-copy-contact="${p.id}">Copiar prompt</button></div>`}; render(); }


  let postObserver=null;
  function watchVisiblePosts(){
    if(postObserver) postObserver.disconnect();
    if(state.route==='/publicar') return;
    const cards=[...document.querySelectorAll('[data-post-id]')];
    if(!cards.length) return;
    postObserver=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible?.target?.dataset?.postId) state.inspirationPostId=visible.target.dataset.postId;
    },{threshold:[0.45,0.65,0.85]});
    cards.forEach(c=>postObserver.observe(c));
  }

  function bind(){
    document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{ if(b.dataset.route==='/publicar'){ startInspiredCreation(currentInspirationPost()); return; } else resetTransient(); if(b.dataset.filter)state.filter=b.dataset.filter; nav(b.dataset.route,{filter:b.dataset.filter});});
    document.querySelectorAll('[data-back]').forEach(b=>b.onclick=back); document.querySelectorAll('[data-install]').forEach(b=>b.onclick=installApp);
    document.querySelectorAll('[data-filter-home]').forEach(b=>b.onclick=()=>nav('/explorar',{filter:b.dataset.filterHome}));
    document.querySelectorAll('[data-set-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.setFilter;render();});
    document.querySelectorAll('[data-template]').forEach(b=>b.onclick=()=>{state.selectedTemplate=templates.find(t=>t.id===b.dataset.template); state.createChoice=null; state.media=[]; state.draft=null; nav('/publicar');});
    document.querySelectorAll('[data-create-choice]').forEach(b=>b.onclick=()=>{state.createChoice=b.dataset.createChoice; state.draft=null; state.chatMessages=[]; state.chatResult=''; state.dolaPromptCopied=false; render();});
    document.querySelectorAll('[data-copy-prompt]').forEach(b=>b.onclick=()=>{state.dolaPromptCopied=true; const prompt=state.inspirationPostId?inspirationPrompt(currentInspirationPost(), state.selectedTemplate||templates[0]):basePrompt(state.selectedTemplate||templates[0]); copy(prompt).finally(()=>render());});
    document.querySelectorAll('[data-open-external]').forEach(b=>b.onclick=()=>window.open(DOLA_EXTERNAL_URL,'_blank','noopener'));
    const dt=document.querySelector('[data-dola-text]'); if(dt)dt.oninput=e=>state.chatResult=e.target.value;
    document.querySelectorAll('[data-api-create]').forEach(b=>b.onclick=()=>callDola('publication',''));
    document.querySelectorAll('[data-edit-finish]').forEach(b=>b.onclick=()=>{const text=(document.querySelector('[data-dola-text]')?.value||state.chatResult).trim(); if(!text)return toast('Pega el texto de DOLA'); state.draft=buildDraftFromText(text); state.createChoice='manual'; render(); setTimeout(()=>document.getElementById('meta-video-section')?.scrollIntoView({behavior:'smooth',block:'center'}),80);});
    document.querySelectorAll('[data-field]').forEach(el=>{
      el.oninput=e=>{ if(!state.draft)state.draft={type:state.selectedTemplate.type,category:state.selectedTemplate.cat,channel:'dola',mediaItems:[]}; state.draft[e.target.dataset.field]=e.target.value; };
      if(el.tagName==='SELECT') el.onchange=e=>{ if(!state.draft)state.draft={type:state.selectedTemplate.type,category:state.selectedTemplate.cat,channel:'dola',mediaItems:[]}; state.draft[e.target.dataset.field]=e.target.value; render(); };
    });
    document.querySelectorAll('[data-preview-manual]').forEach(b=>b.onclick=()=>{collectManual(); render();});
    document.querySelectorAll('[data-copy-meta]').forEach(b=>b.onclick=()=>{collectManual(); state.metaPrompt=buildMetaPrompt(state.draft); state.metaCopied=true; copy(state.metaPrompt).then(()=>{toast('Prompt copiado para Meta IA'); window.open(META_AI_URL,'_blank','noopener');}).finally(()=>render());});
    document.querySelectorAll('[data-open-meta]').forEach(b=>b.onclick=()=>window.open(META_AI_URL,'_blank','noopener'));
    document.querySelectorAll('[data-save-manual],[data-publish-draft]').forEach(b=>b.onclick=publishDraft);
    document.querySelectorAll('[data-delete-post]').forEach(b=>b.onclick=()=>deletePost(b.dataset.deletePost));
    document.querySelectorAll('[data-retry-cloud]').forEach(b=>b.onclick=()=>retryCloud(b.dataset.retryCloud));
    document.querySelectorAll('[data-edit-own]').forEach(b=>b.onclick=()=>editOwnPost(b.dataset.editOwn));
    document.querySelectorAll('[data-media]').forEach(i=>i.onchange=handleFiles);
    document.querySelectorAll('[data-remove-media]').forEach(b=>b.onclick=()=>{state.media.splice(+b.dataset.removeMedia,1);render();});
    document.querySelectorAll('[data-message]').forEach(b=>b.onclick=()=>openContact(posts().find(p=>p.id===b.dataset.message)));
    document.querySelectorAll('[data-react]').forEach(b=>b.onclick=()=>{const ps=posts(); const p=ps.find(x=>x.id===b.dataset.react); if(p){p.reactions=(p.reactions||0)+1;savePosts(ps);render();}});
    document.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>sharePost(b.dataset.share));
    document.querySelectorAll('[data-similar]').forEach(b=>b.onclick=()=>{const p=posts().find(x=>x.id===b.dataset.similar); startInspiredCreation(p);});
    document.querySelectorAll('[data-activate-member]').forEach(b=>b.onclick=()=>{set(K.member,{active:true,startedAt:now(),expiresAt:now(365)});toast('Membresía activa');render();});
    document.querySelectorAll('[data-enable-notes]').forEach(b=>b.onclick=()=>{Notification?.requestPermission?.();addNote('Avisos','Activados');toast('Avisos activos');render();});
    document.querySelectorAll('[data-admin]').forEach(b=>b.onclick=()=>{const pin=prompt('PIN'); if(pin===ADMIN_PIN){localStorage.setItem(K.admin,'true');toast('Admin activo'); nav('/admin');} else toast('PIN incorrecto');});
    document.querySelectorAll('[data-admin-exit]').forEach(b=>b.onclick=()=>{localStorage.removeItem(K.admin);toast('Admin cerrado');nav('/perfil',{replace:true});});
    document.querySelectorAll('[data-admin-toggle]').forEach(b=>b.onclick=()=>{const ps=posts(); const p=ps.find(x=>x.id===b.dataset.adminToggle); if(p){p.status=(p.status==='oculta')?'activa':'oculta'; savePosts(ps); syncPostToCloud(p); toast(p.status==='oculta'?'Publicación oculta':'Publicación activa'); render();}});
    document.querySelectorAll('[data-admin-edit]').forEach(b=>b.onclick=()=>{const p=posts().find(x=>x.id===b.dataset.adminEdit); if(p){state.selectedTemplate=templates.find(t=>t.type===p.type)||templates[0]; state.createChoice='manual'; state.draft={...p}; state.media=[...(p.mediaItems||[])]; nav('/publicar');}});
    document.querySelectorAll('[data-save-profile]').forEach(b=>b.onclick=saveProfile);
    document.querySelectorAll('[data-clear-local]').forEach(b=>b.onclick=()=>{if(confirm('¿Borrar datos locales?')){Object.values(K).forEach(k=>localStorage.removeItem(k));toast('Listo');render();}});
    document.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=()=>{state.modal=null;render();});
    document.querySelectorAll('[data-module-action]').forEach(b=>b.onclick=()=>moduleAction(b.dataset.moduleAction));
    document.querySelectorAll('[data-contact-dola]').forEach(b=>b.onclick=()=>{state.modal=null; const p=posts().find(x=>x.id===b.dataset.contactDola); state.chatTask=p; state.selectedTemplate=templates.find(t=>t.type===p.type)||templates[0]; state.createChoice='dola'; state.chatMessages=[]; state.chatResult=''; nav('/publicar'); callDola('contact','Quiero contactar esta publicación.');});
    document.querySelectorAll('[data-copy-contact]').forEach(b=>{b.onclick=()=>{const p=posts().find(x=>x.id===b.dataset.copyContact);copy(contactPrompt(p));};});
    watchVisiblePosts();
  }
  let rd; function renderDebounced(){clearTimeout(rd); rd=setTimeout(render,450);} function resetTransient(){ if(state.route!=='/publicar'){state.selectedTemplate=null; state.createChoice=null;} }
  function collectManual(){ const d=state.draft||{type:state.selectedTemplate?.type||'Solicitante',category:state.selectedTemplate?.cat||'General',channel:'dola'}; document.querySelectorAll('[data-field]').forEach(el=>d[el.dataset.field]=el.value); d.mediaKey=d.mediaKey||state.selectedTemplate?.media||'solicitante'; state.draft=d; }
  async function publishPost(draftOverride=null){
    if(!draftOverride) collectManual();
    const d=draftOverride || state.draft;
    if(!d?.title && d?.description) d.title=d.description.split('\n').find(Boolean)?.slice(0,70)||'Publicación';
    if(!d?.title)return toast('Falta título');
    if(!canUnlimited() && myPosts().filter(p=>p.freeTrial && (!p.expiresAt || new Date(p.expiresAt)>new Date())).length>=1 && !d.id) return toast('Activa membresía');
    const isExisting=!!d.id;
    let post={...d,id:d.id||uid('p'),mine:(d.mine!==undefined?d.mine:true),ownerId:d.ownerId||userId(),status:d.status||'activa',createdAt:d.createdAt||now(),updatedAt:now(),expiresAt:(isExisting?d.expiresAt:(canUnlimited()?null:now(FREE_DAYS))),freeTrial:(isExisting?d.freeTrial:!canUnlimited()),mediaItems:state.media.length?state.media:(d.mediaItems||[]),mediaKey:d.mediaKey||state.selectedTemplate?.media||'solicitante',reactions:d.reactions||0, inspiredBy:d.inspiredBy||state.inspirationPostId||null, cloudStatus:'subiendo'};

    // 1) Guardado local inmediato para que el usuario lo vea sin esperar red.
    savePosts([post,...posts().filter(p=>p.id!==post.id)]);
    state.route='/';
    state.stack=[];
    render();
    toast('Publicando...');

    // 2) Subida de media y sincronización pública.
    try{
      const uploaded=await uploadMediaToCloud(post);
      if(uploaded && uploaded.length) post={...post,mediaItems:uploaded};
    }catch(e){ /* conserva multimedia local si Storage no responde */ }

    const cloud=await syncPostToCloud(post);
    if(cloud.ok){
      post={...post,cloudStatus:'publica',updatedAt:now()};
      savePosts([post,...posts().filter(p=>p.id!==post.id)]);
      await syncFromCloud({render:false});
      addNote('Publicada',post.title);
      resetCreate();
      state.route='/';
      state.stack=[];
      toast('Publicación visible en el muro');
      render();
      return {ok:true,post};
    }

    // 3) Si Supabase falla, no mentir: queda como borrador local con opción de reintentar.
    post={...post,cloudStatus:'local',cloudError:cloud.error||'No sincronizada',updatedAt:now()};
    savePosts([post,...posts().filter(p=>p.id!==post.id)]);
    addNote('Borrador local',post.title);
    resetCreate();
    state.route='/mis';
    state.stack=[];
    toast('No se pudo subir al muro público. Se guardó como borrador local.');
    render();
    return {ok:false,post,error:cloud.error};
  }
  async function publishDraft(){
    return publishPost();
  }
  async function retryCloud(id){
    const p=posts().find(x=>x.id===id);
    if(!p) return toast('No encontrada');
    if(!isMine(p) && !isAdmin()) return toast('Solo tus publicaciones');
    toast('Subiendo al muro...');
    let post={...p,status:p.status||'activa',ownerId:p.ownerId||userId(),cloudStatus:'subiendo',updatedAt:now()};
    try{
      const uploaded=await uploadMediaToCloud(post);
      if(uploaded && uploaded.length) post={...post,mediaItems:uploaded};
    }catch(e){}
    const cloud=await syncPostToCloud(post);
    if(cloud.ok){
      post={...post,cloudStatus:'publica',cloudError:'',updatedAt:now()};
      savePosts([post,...posts().filter(x=>x.id!==id)]);
      await syncFromCloud({render:false});
      toast('Ya está en el muro público');
      render();
    }else{
      post={...post,cloudStatus:'local',cloudError:cloud.error||'No sincronizada'};
      savePosts([post,...posts().filter(x=>x.id!==id)]);
      toast('No se pudo subir al muro público. Se guardó como borrador local.');
      render();
    }
  }
  function sharePost(id){
    const p=posts().find(x=>x.id===id); if(!p) return;
    const url=`${CONNECTA_APP_URL}#${encodeURIComponent(id)}`;
    const text=`${p.title}

${p.description||''}

Ver en Conecta Servicios: ${url}`;
    if(navigator.share){ navigator.share({title:p.title,text,url}).catch(()=>{}); }
    else copy(text);
  }
  function deletePost(id){
    const ps=posts(); const p=ps.find(x=>x.id===id); if(!p) return;
    if(!isAdmin() && !isMine(p)){ toast('Solo puedes borrar tus publicaciones'); return; }
    if(!confirm('¿Eliminar definitivamente esta publicación?')) return;
    savePosts(ps.filter(x=>x.id!==id));
    deletePostFromCloud(id);
    toast('Publicación eliminada');
    render();
  }
  function editOwnPost(id){
    const p=posts().find(x=>x.id===id);
    if(!p || !isMine(p)){toast('Solo puedes editar tus publicaciones'); return;}
    state.selectedTemplate=templates.find(t=>t.type===p.type)||templates[0];
    state.createChoice='manual';
    state.draft={...p};
    state.media=[...(p.mediaItems||[])];
    nav('/publicar');
    setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),50);
  }
  function saveProfile(){ const p={}; document.querySelectorAll('[data-profile]').forEach(el=>p[el.dataset.profile]=el.value); const prefs=get(K.prefs,{}); document.querySelectorAll('[data-pref]').forEach(el=>prefs[el.dataset.pref]=el.value); set(K.profile,p); set(K.prefs,prefs); toast('Guardado'); }
  async function handleFiles(e){
    const files=[...e.target.files].slice(0,MAX_MEDIA-state.media.length);
    for(const file of files){
      const kind=file.type.startsWith('video')?'video':'image';
      const id=uid('media');
      if(kind==='video' || file.size>MAX_LOCAL_MB*1024*1024){
        const preview=URL.createObjectURL(file);
        mediaObjectUrls.set(id, preview);
        const item={kind,name:file.name,ref:id,persisted:false,size:file.size,type:file.type};
        state.media.push(item); render();
        try{ await saveMediaBlob(id,file); item.persisted=true; toast(kind==='video'?'Video guardado':'Archivo guardado'); }catch(err){ toast('Vista temporal: storage local no disponible'); }
        render();
      }else{
        await new Promise(resolve=>{ const r=new FileReader(); r.onload=()=>{state.media.push({kind,data:r.result,name:file.name,size:file.size,type:file.type}); resolve();}; r.readAsDataURL(file); });
        render();
      }
    }
    e.target.value='';
  }
  function moduleAction(raw){ const [mod,act]=raw.split(':'); if(['Publicar','Solicitar','Campaña'].includes(act)){ state.selectedTemplate=templates.find(t=>mod==='agentes'?t.id==='agente':mod==='mandados'?t.id==='mensajero':t.id==='negocio'); state.createChoice=null; nav('/publicar'); return; } if(act==='DOLA'||act==='Plan'||act==='Mensaje'){ state.selectedTemplate=templates.find(t=>t.id==='agente')||templates[0]; state.createChoice='dola'; nav('/publicar'); return; } if(act==='Copiar enlace'||act==='Compartir'){ copy(`${CONNECTA_APP_URL}?ref=embajador`); return;} if(act==='Referido'||act==='Postularme'){ const arr=get(mod==='mandados'?K.verified:K.referrals,[]); arr.unshift({id:uid('r'),createdAt:now(),mod}); set(mod==='mandados'?K.verified:K.referrals,arr); toast('Guardado'); return;} toast('Listo'); }

  render();
  syncFromCloud();
})();
