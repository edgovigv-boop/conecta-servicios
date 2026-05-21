/* Conecta Servicios v5.2.0 - UX visual universal */
(() => {
  'use strict';
  const VERSION = 'v5.2.0-ux-visual-universal';
  const DOLA_EXTERNAL_URL = 'https://dola.com';
  const CONNECTA_APP_URL = 'https://conecta-servicios.vercel.app/';
  const FREE_DAYS = 30;
  const PRICE = 98;
  const ADMIN_PIN = '3145';
  const MAX_MEDIA = 10;
  const MAX_LOCAL_MB = 4;
  const K = {
    posts:'cs_v52_posts', profile:'cs_v52_profile', prefs:'cs_v52_prefs', member:'cs_v52_member', admin:'cs_v52_admin',
    notes:'cs_v52_notes', requests:'cs_v52_requests', referrals:'cs_v52_referrals', verified:'cs_v52_verified'
  };
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  let deferredInstallPrompt = null;
  const state = { route:'/', filter:'Todos', stack:[], modal:null, selectedTemplate:null, selectedType:null, createChoice:null, draft:null, media:[], chatTask:null, chatMessages:[], chatText:'', chatResult:'', apiStatus:'idle', apiError:'' };

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
  function posts(){let p=get(K.posts,null); if(!p){p=seed;set(K.posts,p)} return p;}
  function savePosts(p){try{set(K.posts,p)}catch(e){toast('Video pesado: usa Storage en producción'); set(K.posts,p.map(x=>({...x,mediaItems:[],mediaData:''})));}}
  function myPosts(){return posts().filter(p=>p.mine);}
  function daysLeft(d){if(!d)return null; return Math.max(0,Math.ceil((new Date(d)-new Date())/86400000));}
  function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>toastEl.classList.remove('show'),2400);}
  function nav(route, opts={}){ if(!opts.replace && state.route!==route) state.stack.push({route:state.route, filter:state.filter, template:state.selectedTemplate, choice:state.createChoice}); state.route=route; if(opts.filter)state.filter=opts.filter; render(); }
  function back(){ const prev=state.stack.pop(); if(prev){state.route=prev.route; state.filter=prev.filter||'Todos'; state.selectedTemplate=prev.template||null; state.createChoice=prev.choice||null;} else {state.route='/';} render(); }
  function resetCreate(){ state.selectedTemplate=null; state.selectedType=null; state.createChoice=null; state.draft=null; state.media=[]; state.chatTask=null; state.chatMessages=[]; state.chatText=''; state.chatResult=''; state.apiStatus='idle'; state.apiError=''; }
  function installApp(){ if(deferredInstallPrompt){deferredInstallPrompt.prompt(); deferredInstallPrompt.userChoice.finally(()=>deferredInstallPrompt=null); } else toast('Menú del navegador → Agregar a inicio'); }
  function addNote(title,msg){ const n=get(K.notes,[]); n.unshift({id:uid('n'),title,msg,createdAt:now()}); set(K.notes,n.slice(0,50)); }
  function unread(){ return get(K.notes,[]).length; }
  function copy(text){ return navigator.clipboard?.writeText(text).then(()=>toast('Copiado')).catch(()=>toast('No se pudo copiar')); }
  function officialLogo(){return 'assets/icons/conecta-logo-oficial.png';}
  function mediaPath(key){ const map={comida:'comida-01.jpg',mandados:'mandados-01.jpg',agente:'agente-01.jpg',negocio:'negocio-01.jpg',solicitante:'solicitante-01.jpg',embajadores:'embajadores-01.jpg',aprendizaje:'aprendizaje-01.jpg',verificados:'mandados-verificados-01.jpg',comision:'comision-01.jpg'}; return `assets/dola-media/${map[key]||'solicitante-01.jpg'}`; }

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
    const routes = {'/':home,'/explorar':explore,'/publicar':publish,'/mis':myPage,'/perfil':profile,'/embajadores':()=>modulePage('embajadores'),'/agentes':()=>modulePage('agentes'),'/mandados':()=>modulePage('mandados'),'/aprendizaje':()=>modulePage('aprendizaje'),'/comision':()=>modulePage('comision'),'/notificaciones':notifications};
    app.innerHTML = (routes[state.route]||home)(); bind();
  }
  function home(){
    return layout(`
      <div class="quick-hero">${types.map(t=>`<button class="big-chip ${t.bg}" data-filter-home="${t.id}"><span>${t.icon}</span><small>${t.short}</small></button>`).join('')}</div>
      <div class="visual-tabs">${star.map(s=>`<button class="tab-pill" data-route="${s.route}" ${s.filter?`data-filter="${s.filter}"`:''}>${s.icon} ${s.label}</button>`).join('')}</div>
      <div class="section-head"><h2>Ejemplos</h2><button data-route="/publicar">Crear</button></div>
      ${categoryGallery('Negocio')}${categoryGallery('Agente')}${categoryGallery('Solicitante')}
    `,{back:false});
  }
  function categoryGallery(type){ const filtered=posts().filter(p=>p.type===type).slice(0,3); const t=types.find(x=>x.id===type); return `<section><div class="section-head"><h2>${t.icon} ${type}s</h2><button data-route="/explorar" data-filter="${type}">Ver</button></div><div class="gallery">${filtered.map(postCard).join('')}</div></section>`; }
  function explore(){ const all=posts().filter(p=>p.status!=='eliminada'); const filtered=state.filter==='Todos'?all:all.filter(p=>p.type===state.filter); return layout(`
    <div class="visual-tabs">${['Todos','Negocio','Agente','Solicitante'].map(f=>`<button class="tab-pill ${state.filter===f?'active':''}" data-set-filter="${f}">${f==='Todos'?'✨':types.find(t=>t.id===f)?.icon} ${f}</button>`).join('')}</div>
    <input class="input" data-search placeholder="🔎 Buscar" aria-label="Buscar">
    <div class="gallery" id="feed">${filtered.map(postCard).join('') || '<div class="empty">Sin publicaciones</div>'}</div>
  `,{title:'Buscar'}); }
  function postCard(p){ const cls=p.type==='Agente'?'agente':p.type==='Negocio'?'negocio':'solicitante'; return `<article class="post-card">
    <div class="post-media">${renderMedia(p)}</div>
    <div class="post-body"><div class="meta"><span class="chip ${cls}">${iconForType(p.type)} ${p.type}</span><span class="chip gray">📍 ${esc(p.zone||'Zona')}</span></div>
      <h3 class="post-title">${esc(p.title)}</h3><p class="post-desc">${esc(p.description)}</p></div>
    <div class="post-actions"><button class="action" data-react="${p.id}">❤️ ${p.reactions||0}</button><button class="action" data-share="${p.id}">↗ Compartir</button><button class="action" data-similar="${p.id}">➕ Igual</button><button class="action primary ${p.channel==='whatsapp'?'whatsapp':''}" data-message="${p.id}">💬 Mensaje</button></div>
  </article>`; }
  function renderMedia(p){ const items=p.mediaItems||[]; const first=items[0]; if(first?.data||first?.url){ const src=first.data||first.url; return first.kind==='video'?`<video controls playsinline src="${src}"></video>`:`<img src="${src}" alt="${esc(p.title)}">`; } const key=p.mediaKey || (p.type==='Negocio'?'negocio':p.type==='Agente'?'agente':'solicitante'); return `<img src="${mediaPath(key)}" alt="${esc(p.title)}" onerror="this.outerHTML='<div class=&quot;placeholder&quot;><div><span class=&quot;emoji&quot;>${iconForType(p.type)}</span>${esc(p.type)}</div></div>'">`; }
  function iconForType(type){ return type==='Negocio'?'🏪':type==='Agente'?'🛵':'🧡'; }

  function publish(){
    if(!state.selectedTemplate) return layout(`<div class="section-head"><h2>¿Qué quieres?</h2></div><div class="big-options">${templates.map(t=>`<button class="big-option" data-template="${t.id}"><span class="ico">${t.icon}</span><div><b>${t.title}</b><small>${t.type}</small></div></button>`).join('')}</div>`,{title:'Crear'});
    if(!state.createChoice) return layout(`<div class="card center"><div class="template-badge"><span style="font-size:3rem">${state.selectedTemplate.icon}</span><h2>${state.selectedTemplate.title}</h2></div><div class="circle-grid"><button class="circle dola" data-create-choice="dola"><div><div class="ico">✨</div><b>DOLA</b><br><small>Me ayuda</small></div></button><button class="circle manual" data-create-choice="manual"><div><div class="ico">✍️</div><b>Manual</b><br><small>Yo escribo</small></div></button></div></div>`,{title:'Crear'});
    return state.createChoice==='manual'?manualCreate():dolaCreate();
  }
  function basePrompt(t){ return `ROL:\nEres DOLA, asistente especializado dentro de Conecta Servicios.\n\nCONTEXTO:\nVengo de Conecta Servicios: ${CONNECTA_APP_URL}\nElegí: ${t.title}\nTipo: ${t.type}\nCategoría: ${t.cat}\n\nOBJETIVO:\nAyúdame a crear una publicación clara, visual y lista para pegar en Conecta Servicios.\n\nREGLAS:\nHazme UNA sola pregunta a la vez.\nNo uses tablas. No uses JSON.\nNo repitas este prompt.\nNo incluyas toda la conversación.\nNo recomiendes herramientas externas.\nMantente en Conecta Servicios.\n\nSALIDA FINAL:\nEntrega SOLO la publicación final, con emojis moderados y formato limpio:\n\n[TÍTULO CORTO]\n\n📍 Zona:\n...\n\n📝 Descripción:\n...\n\n✅ Detalles:\n...\n\n💬 Contacto:\nResponder por Conecta Servicios.`; }
  function dolaCreate(){ const t=state.selectedTemplate; return layout(`
    <div class="card"><div class="title-row"><div><h2 class="page-title">✨ DOLA</h2><p class="sub">${t.title}</p></div><button class="icon-btn" data-copy-prompt="${t.id}">📋</button></div>
      <div class="chat">${state.chatMessages.length?state.chatMessages.map(m=>`<div class="bubble ${m.role==='user'?'user':'assistant'}">${esc(m.content)}</div>`).join(''):`<div class="bubble assistant">Toca ✨ y creo tu texto.</div>`}</div>
      <div class="quick-grid"><button class="btn primary" data-api-create>✨ Crear</button><button class="btn" data-open-external>↗ DOLA</button><button class="btn" data-adjust="Hazlo más corto">Corto</button><button class="btn" data-adjust="Hazlo más claro y formal">Formal</button></div>
      ${state.apiError?`<div class="notice">${esc(state.apiError)}</div>`:''}
    </div>
    <div class="card"><label class="label">Texto final</label><textarea class="textarea" data-dola-text placeholder="Pega o revisa aquí">${esc(state.chatResult||'')}</textarea><div class="btn-row"><button class="btn green" data-use-dola>Usar</button><button class="btn" data-copy-final>Copiar</button></div></div>
    ${state.draft?preview(state.draft):''}
  `,{title:'DOLA'}); }
  function manualCreate(){ const d=state.draft||{type:state.selectedTemplate.type,category:state.selectedTemplate.cat,title:'',description:'',zone:'',channel:'dola',whatsapp:'',mediaItems:[]}; return layout(`<div class="card"><h2 class="page-title">✍️ Manual</h2>${formFields(d)}<div class="btn-row"><button class="btn green" data-preview-manual>Vista</button><button class="btn primary" data-save-manual>Publicar</button></div></div>${state.draft?preview(state.draft):''}`,{title:'Manual'}); }
  function formFields(d){return `<label class="label">Título</label><input class="input" data-field="title" value="${esc(d.title)}" placeholder="Título"><label class="label">Zona</label><input class="input" data-field="zone" value="${esc(d.zone)}" placeholder="Zona"><label class="label">Texto</label><textarea class="textarea" data-field="description" placeholder="Descripción">${esc(d.description)}</textarea><label class="label">Canal</label><select class="select" data-field="channel"><option value="dola" ${d.channel==='dola'?'selected':''}>DOLA</option><option value="whatsapp" ${d.channel==='whatsapp'?'selected':''}>WhatsApp</option></select>${d.channel==='whatsapp'?`<label class="label">WhatsApp</label><input class="input" data-field="whatsapp" value="${esc(d.whatsapp||'')}" placeholder="Número">`:''}${mediaUploader()}`;}
  function mediaUploader(){ return `<label class="label">Fotos / videos</label><label class="file-btn">📷 Subir<input class="hidden" type="file" data-media multiple accept="image/*,video/*"></label><div class="media-grid">${state.media.map((m,i)=>`<div class="media-thumb">${m.kind==='video'?`<video src="${m.data}" controls></video>`:`<img src="${m.data}" alt="media">`}<button class="media-x" data-remove-media="${i}">×</button></div>`).join('')}</div><p class="sub">Hasta 10 archivos.</p>`; }
  function preview(d){ return `<div class="card"><h2 class="page-title">Vista</h2>${postCard({...d,id:'preview',reactions:0,mediaItems:state.media,mine:true,createdAt:now(),mediaKey:state.selectedTemplate?.media})}<button class="btn primary full" data-publish-draft>Publicar</button></div>`; }
  function buildDraftFromText(text){ const first=(text||'').split('\n').find(x=>x.trim())||state.selectedTemplate.title; return {id:uid('p'), mine:true, type:state.selectedTemplate.type, category:state.selectedTemplate.cat, title:first.replace(/^[#*\s]+/,'').slice(0,80), description:text.trim(), zone:extractZone(text)||'', channel:'dola', whatsapp:'', status:'activa', freeTrial:!canUnlimited(), expiresAt:canUnlimited()?null:now(FREE_DAYS), createdAt:now(), mediaKey:state.selectedTemplate.media, mediaItems:state.media, reactions:0}; }
  function extractZone(text){ const m=String(text).match(/(?:Zona|Ubicación|📍)\s*:?\s*([^\n]+)/i); return m?m[1].trim().slice(0,60):''; }

  function myPage(){ const list=myPosts().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); return layout(`<div class="section-head"><h2>Mis publicaciones</h2><button data-route="/publicar">Crear</button></div>${list.length?`<div class="gallery">${list.map(postCard).join('')}</div>`:'<div class="empty">Sin publicaciones</div>'}<div class="card"><b>💎 $${PRICE}</b><p class="sub">Publica sin límites.</p><button class="btn primary full" data-activate-member>Activar</button></div>`,{title:'Mis'}); }
  function profile(){ const p=get(K.profile,{name:'',zone:'',phone:''}); const prefs=get(K.prefs,{channel:'dola'}); return layout(`<div class="big-options"><button class="big-option" data-route="/mis"><span class="ico">📌</span><div><b>Mis</b><small>Publicaciones</small></div></button><button class="big-option" data-install><span class="ico">➕</span><div><b>Instalar</b><small>PWA</small></div></button><button class="big-option" data-enable-notes><span class="ico">🔔</span><div><b>Avisos</b><small>Activar</small></div></button><button class="big-option" data-admin><span class="ico">🛠️</span><div><b>Oficina</b><small>Admin</small></div></button></div><div class="card"><label class="label">Nombre</label><input class="input" data-profile="name" value="${esc(p.name)}"><label class="label">Zona</label><input class="input" data-profile="zone" value="${esc(p.zone)}"><label class="label">Canal</label><select class="select" data-pref="channel"><option value="dola" ${prefs.channel==='dola'?'selected':''}>DOLA</option><option value="whatsapp" ${prefs.channel==='whatsapp'?'selected':''}>WhatsApp</option></select><div class="btn-row"><button class="btn green" data-save-profile>Guardar</button><button class="btn red" data-clear-local>Limpiar</button></div></div><div class="version">${VERSION}</div>`,{title:'Perfil'}); }
  function notifications(){ const n=get(K.notes,[]); return layout(`<div class="card"><button class="btn primary full" data-enable-notes>Activar 🔔</button></div>${n.length?n.map(x=>`<div class="card"><b>${esc(x.title)}</b><p class="sub">${esc(x.msg)}</p></div>`).join(''):'<div class="empty">Sin avisos</div>'}`,{title:'Avisos'}); }
  function modulePage(id){ const data={embajadores:['🏆','Embajadores',['Copiar enlace','Mensaje','Referido','Membresía']],agentes:['🚀','Agentes',[ 'Publicar','Solicitudes','DOLA','Tips']],mandados:['🛡️','Mandados',[ 'Solicitar','Postularme','Requisitos','FAQ']],aprendizaje:['🎓','Aprende',[ 'Recursos','DOLA','Plan','Tips']],comision:['💼','Comisión',[ 'Campaña','DOLA','Compartir','Clientes']]}[id]||['✨','Módulo',['Crear','DOLA']]; return layout(`<div class="card center"><div style="font-size:4rem">${data[0]}</div><h2>${data[1]}</h2></div><div class="module-grid">${data[2].map((a,i)=>`<button class="module-card" data-module-action="${id}:${a}"><span>${['➕','✨','📋','↗'][i%4]}</span><b>${a}</b><small>Ir</small></button>`).join('')}</div>`,{title:data[1]}); }

  async function callDola(task,instruction=''){
    const prompt = task==='contact' ? contactPrompt(state.chatTask) : basePrompt(state.selectedTemplate || templates[0]);
    state.apiStatus='loading'; state.apiError=''; state.chatMessages.push({role:'user',content:instruction||'Crear con DOLA'}); render();
    try{
      const res=await fetch('/api/dola',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:prompt},{role:'user',content:instruction}],context:{task,version:VERSION,app:CONNECTA_APP_URL}})});
      const data=await res.json();
      if(!data.ok) throw Object.assign(new Error(data.message||'DOLA no configurado'),{code:data.error});
      const text=(data.text||'').trim(); state.chatMessages.push({role:'assistant',content:text||'Listo.'}); state.chatResult=text; state.apiStatus='ready';
    }catch(e){ state.apiStatus='fallback'; state.apiError='API no configurada. Usa DOLA externo.'; state.chatMessages.push({role:'assistant',content:'API no configurada. Puedes copiar el prompt y abrir DOLA externo.'}); }
    render();
  }
  function contactPrompt(p){ return `ROL:\nEres DOLA, asistente de Conecta Servicios.\nCONTEXTO:\nQuiero contactar esta publicación: ${p?.title}. Zona: ${p?.zone}. Texto: ${p?.description}\nOBJETIVO:\nHaz una pregunta a la vez y genera mensaje final claro para el anunciante.`; }
  function openContact(p){ if(p.channel==='whatsapp' && p.whatsapp){ const msg=encodeURIComponent(`Hola, vi tu publicación en Conecta Servicios: ${p.title}`); location.href=`https://wa.me/${cleanPhone(p.whatsapp)}?text=${msg}`; return; } state.modal={title:'💬 DOLA',body:`<p class="sub">Ordena tu mensaje.</p><div class="btn-row"><button class="btn primary" data-contact-dola="${p.id}">DOLA</button><button class="btn" data-copy-contact="${p.id}">Copiar prompt</button></div>`}; render(); }

  function bind(){
    document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{ if(b.dataset.route==='/publicar') resetCreate(); else resetTransient(); if(b.dataset.filter)state.filter=b.dataset.filter; nav(b.dataset.route,{filter:b.dataset.filter});});
    document.querySelectorAll('[data-back]').forEach(b=>b.onclick=back); document.querySelectorAll('[data-install]').forEach(b=>b.onclick=installApp);
    document.querySelectorAll('[data-filter-home]').forEach(b=>b.onclick=()=>nav('/explorar',{filter:b.dataset.filterHome}));
    document.querySelectorAll('[data-set-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.setFilter;render();});
    document.querySelectorAll('[data-template]').forEach(b=>b.onclick=()=>{state.selectedTemplate=templates.find(t=>t.id===b.dataset.template); state.createChoice=null; state.media=[]; state.draft=null; nav('/publicar');});
    document.querySelectorAll('[data-create-choice]').forEach(b=>b.onclick=()=>{state.createChoice=b.dataset.createChoice; state.draft=null; state.chatMessages=[]; state.chatResult=''; render();});
    document.querySelectorAll('[data-copy-prompt]').forEach(b=>b.onclick=()=>copy(basePrompt(state.selectedTemplate||templates[0])));
    document.querySelectorAll('[data-open-external]').forEach(b=>b.onclick=()=>window.open(DOLA_EXTERNAL_URL,'_blank','noopener'));
    const dt=document.querySelector('[data-dola-text]'); if(dt)dt.oninput=e=>state.chatResult=e.target.value;
    document.querySelectorAll('[data-api-create]').forEach(b=>b.onclick=()=>callDola('publication',''));
    document.querySelectorAll('[data-adjust]').forEach(b=>b.onclick=()=>callDola('publication',b.dataset.adjust));
    document.querySelectorAll('[data-use-dola]').forEach(b=>b.onclick=()=>{const text=(document.querySelector('[data-dola-text]')?.value||state.chatResult).trim(); if(!text)return toast('Falta texto'); state.draft=buildDraftFromText(text); render();});
    document.querySelectorAll('[data-copy-final]').forEach(b=>b.onclick=()=>copy(document.querySelector('[data-dola-text]')?.value||''));
    document.querySelectorAll('[data-field]').forEach(el=>el.oninput=e=>{ if(!state.draft)state.draft={type:state.selectedTemplate.type,category:state.selectedTemplate.cat,channel:'dola',mediaItems:[]}; state.draft[e.target.dataset.field]=e.target.value; renderDebounced(); });
    document.querySelectorAll('[data-preview-manual]').forEach(b=>b.onclick=()=>{collectManual(); render();});
    document.querySelectorAll('[data-save-manual],[data-publish-draft]').forEach(b=>b.onclick=publishDraft);
    document.querySelectorAll('[data-media]').forEach(i=>i.onchange=handleFiles);
    document.querySelectorAll('[data-remove-media]').forEach(b=>b.onclick=()=>{state.media.splice(+b.dataset.removeMedia,1);render();});
    document.querySelectorAll('[data-message]').forEach(b=>b.onclick=()=>openContact(posts().find(p=>p.id===b.dataset.message)));
    document.querySelectorAll('[data-react]').forEach(b=>b.onclick=()=>{const ps=posts(); const p=ps.find(x=>x.id===b.dataset.react); if(p){p.reactions=(p.reactions||0)+1;savePosts(ps);render();}});
    document.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>copy(`${CONNECTA_APP_URL}#${b.dataset.share}`));
    document.querySelectorAll('[data-similar]').forEach(b=>b.onclick=()=>{const p=posts().find(x=>x.id===b.dataset.similar); state.selectedTemplate=templates.find(t=>t.type===p.type)||templates[0]; state.createChoice='manual'; state.draft={...p,id:uid('p'),mine:true,title:`${p.title}`,createdAt:now(),mediaItems:[]}; nav('/publicar');});
    document.querySelectorAll('[data-activate-member]').forEach(b=>b.onclick=()=>{set(K.member,{active:true,startedAt:now(),expiresAt:now(365)});toast('Membresía activa');render();});
    document.querySelectorAll('[data-enable-notes]').forEach(b=>b.onclick=()=>{Notification?.requestPermission?.();addNote('Avisos','Activados');toast('Avisos activos');render();});
    document.querySelectorAll('[data-admin]').forEach(b=>b.onclick=()=>{const pin=prompt('PIN'); if(pin===ADMIN_PIN){localStorage.setItem(K.admin,'true');toast('Admin activo');} else toast('PIN incorrecto'); render();});
    document.querySelectorAll('[data-save-profile]').forEach(b=>b.onclick=saveProfile);
    document.querySelectorAll('[data-clear-local]').forEach(b=>b.onclick=()=>{if(confirm('¿Borrar datos locales?')){Object.values(K).forEach(k=>localStorage.removeItem(k));toast('Listo');render();}});
    document.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=()=>{state.modal=null;render();});
    document.querySelectorAll('[data-module-action]').forEach(b=>b.onclick=()=>moduleAction(b.dataset.moduleAction));
    document.querySelectorAll('[data-contact-dola]').forEach(b=>b.onclick=()=>{state.modal=null; const p=posts().find(x=>x.id===b.dataset.contactDola); state.chatTask=p; state.selectedTemplate=templates.find(t=>t.type===p.type)||templates[0]; state.createChoice='dola'; state.chatMessages=[]; state.chatResult=''; nav('/publicar'); callDola('contact','Quiero contactar esta publicación.');});
    document.querySelectorAll('[data-copy-contact]').forEach(b=>{b.onclick=()=>{const p=posts().find(x=>x.id===b.dataset.copyContact);copy(contactPrompt(p));};});
  }
  let rd; function renderDebounced(){clearTimeout(rd); rd=setTimeout(render,450);} function resetTransient(){ if(state.route!=='/publicar'){state.selectedTemplate=null; state.createChoice=null;} }
  function collectManual(){ const d=state.draft||{type:state.selectedTemplate.type,category:state.selectedTemplate.cat,channel:'dola'}; document.querySelectorAll('[data-field]').forEach(el=>d[el.dataset.field]=el.value); d.mediaKey=state.selectedTemplate.media; state.draft=d; }
  function publishDraft(){ collectManual(); const d=state.draft; if(!d?.title && d?.description) d.title=d.description.split('\n').find(Boolean)?.slice(0,70)||'Publicación'; if(!d?.title)return toast('Falta título'); if(!canUnlimited() && myPosts().filter(p=>p.freeTrial && (!p.expiresAt || new Date(p.expiresAt)>new Date())).length>=1 && !d.id) return toast('Activa membresía'); const post={...d,id:d.id||uid('p'),mine:true,status:'activa',createdAt:now(),expiresAt:canUnlimited()?null:now(FREE_DAYS),freeTrial:!canUnlimited(),mediaItems:state.media,mediaKey:d.mediaKey||state.selectedTemplate?.media||'solicitante',reactions:0}; savePosts([post,...posts().filter(p=>p.id!==post.id)]); addNote('Publicada',post.title); resetCreate(); state.route='/mis'; state.stack=[]; toast('Publicación creada'); render(); }
  function saveProfile(){ const p={}; document.querySelectorAll('[data-profile]').forEach(el=>p[el.dataset.profile]=el.value); const prefs=get(K.prefs,{}); document.querySelectorAll('[data-pref]').forEach(el=>prefs[el.dataset.pref]=el.value); set(K.profile,p); set(K.prefs,prefs); toast('Guardado'); }
  function handleFiles(e){ const files=[...e.target.files].slice(0,MAX_MEDIA-state.media.length); files.forEach(file=>{const kind=file.type.startsWith('video')?'video':'image'; if(file.size>MAX_LOCAL_MB*1024*1024){const url=URL.createObjectURL(file); state.media.push({kind,data:url,name:file.name,transient:true});toast('Archivo pesado: vista temporal');render();return;} const r=new FileReader(); r.onload=()=>{state.media.push({kind,data:r.result,name:file.name});render();}; r.readAsDataURL(file);}); e.target.value=''; }
  function moduleAction(raw){ const [mod,act]=raw.split(':'); if(['Publicar','Solicitar','Campaña'].includes(act)){ state.selectedTemplate=templates.find(t=>mod==='agentes'?t.id==='agente':mod==='mandados'?t.id==='mensajero':t.id==='negocio'); state.createChoice=null; nav('/publicar'); return; } if(act==='DOLA'||act==='Plan'||act==='Mensaje'){ state.selectedTemplate=templates.find(t=>t.id==='agente')||templates[0]; state.createChoice='dola'; nav('/publicar'); return; } if(act==='Copiar enlace'||act==='Compartir'){ copy(`${CONNECTA_APP_URL}?ref=embajador`); return;} if(act==='Referido'||act==='Postularme'){ const arr=get(mod==='mandados'?K.verified:K.referrals,[]); arr.unshift({id:uid('r'),createdAt:now(),mod}); set(mod==='mandados'?K.verified:K.referrals,arr); toast('Guardado'); return;} toast('Listo'); }

  render();
})();
