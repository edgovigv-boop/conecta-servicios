/* Conecta Servicios v5.0 - rediseño estructural desde cero */
(() => {
  'use strict';

  const VERSION = 'v5.0-rediseño-estructural-conecta';
  const CACHE_HINT = 'conecta-servicios-v5-0-redisenio-estructural';
  const DOLA_EXTERNAL_URL = 'https://dola.com';
  const MEMBERSHIP_PRICE = 98;
  const FREE_DAYS = 30;
  const ADMIN_PIN = '3145';

  const KEYS = {
    posts: 'cs_v5_posts',
    reactions: 'cs_v5_reactions',
    requests: 'cs_v5_requests',
    membership: 'cs_v5_membership',
    admin: 'cs_v5_admin_active',
    profile: 'cs_v5_profile',
    prefs: 'cs_v5_prefs'
  };

  const state = {
    route: '/',
    filter: 'Todas',
    publishMode: 'dola',
    publishTemplate: null,
    publishDraft: null,
    modal: null
  };

  const starSections = [
    { id:'para-ti', label:'Para ti', icon:'✨', route:'/' },
    { id:'solicitantes', label:'Solicitantes', icon:'🧡', route:'/explorar', filter:'Solicitante' },
    { id:'agentes', label:'Agentes', icon:'🛵', route:'/agentes' },
    { id:'negocios', label:'Negocios', icon:'🏪', route:'/explorar', filter:'Negocio' },
    { id:'mandados', label:'Mandados verificados', icon:'🛡️', route:'/mandados-verificados' },
    { id:'comision', label:'Conseguir clientes', icon:'💼', route:'/conseguir-clientes' },
    { id:'embajadores', label:'Embajadores', icon:'🏆', route:'/embajadores' },
    { id:'aprendizaje', label:'Aprendizaje', icon:'🎓', route:'/aprendizaje' }
  ];

  const templates = [
    { id:'necesito-algo', title:'Necesito algo', icon:'🧡', type:'Solicitante', category:'Solicitud local', desc:'Pide ayuda, un favor, un trámite o algo cercano.' },
    { id:'busco-mensajero', title:'Busco mensajero cerca', icon:'📦', type:'Solicitante', category:'Mandados / mensajería', desc:'Encuentra quien recoja, compre o entregue algo.' },
    { id:'pedir-comida', title:'Quiero pedir comida', icon:'🌮', type:'Solicitante', category:'Comida', desc:'Busca comida, mandado o entrega local.' },
    { id:'encontrar-agente', title:'Quiero encontrar un agente', icon:'🛵', type:'Solicitante', category:'Agentes', desc:'Busca personas que hagan mandados, entregas o apoyo local.' },
    { id:'publicar-negocio', title:'Quiero publicar mi negocio', icon:'🏪', type:'Negocio', category:'Negocio local', desc:'Muestra tu comercio o servicio profesional.' },
    { id:'ofrecerme-agente', title:'Quiero ofrecerme como agente', icon:'🙋', type:'Agente', category:'Agentes en crecimiento', desc:'Publica lo que puedes hacer para generar ingresos.' },
    { id:'ganar-comision', title:'Quiero ganar por comisión', icon:'💼', type:'Agente', category:'Conseguir clientes', desc:'Ofrece conseguir clientes o referir negocios.' },
    { id:'ser-embajador', title:'Quiero ser embajador', icon:'🏆', type:'Agente', category:'Embajadores', desc:'Invita usuarios y apoya negocios locales.' },
    { id:'mandados-verificados', title:'Mandados verificados', icon:'🛡️', type:'Agente', category:'Mandados verificados', desc:'Solicita o participa en mandados con mayor confianza.' },
    { id:'aprendizaje', title:'Aprendizaje', icon:'🎓', type:'Agente', category:'Aprendizaje', desc:'Encuentra recursos para mejorar y vender mejor.' }
  ];

  const seedPosts = [
    {
      id:'seed-1', owner:'Conecta piloto', mine:false, type:'Agente', category:'Mandados / entregas', title:'Hago mandados y entregas en Chapultepec',
      description:'Puedo ayudarte con compras, entregas pequeñas y encargos el mismo día. Trabajo principalmente por las tardes.',
      zone:'Chapultepec, Edo. Méx.', channel:'dola', whatsapp:'', createdAt: daysAgo(1), expiresAt: null, status:'activa', reactions:12, comments:3, shares:2, mediaLabel:'Agente local', mediaType:'placeholder'
    },
    {
      id:'seed-2', owner:'Rosticería piloto', mine:false, type:'Negocio', category:'Comida', title:'Rosticería Pollo Feliz',
      description:'Pollo asado con ensalada, salsas y tortillas. También quesadillas, refrescos y papas. Atención en zona centro.',
      zone:'Centro, Chapultepec', channel:'dola', whatsapp:'', createdAt: daysAgo(2), expiresAt: null, status:'activa', reactions:28, comments:5, shares:7, mediaLabel:'Comida local', mediaType:'placeholder'
    },
    {
      id:'seed-3', owner:'Solicitante piloto', mine:false, type:'Solicitante', category:'Transporte / mandado', title:'Busco quien me lleve al aeropuerto mañana',
      description:'Necesito salida temprano, trato directo y responsable. Puedo coordinar punto de encuentro y costo justo.',
      zone:'Toluca y alrededores', channel:'whatsapp', whatsapp:'5217220000000', createdAt: daysAgo(3), expiresAt: null, status:'activa', reactions:5, comments:1, shares:1, mediaLabel:'Solicitud local', mediaType:'placeholder'
    },
    {
      id:'seed-4', owner:'Consultoría piloto', mine:false, type:'Negocio', category:'Consultoría', title:'Consultoría tecnológica para empresas',
      description:'Asesoría en procesos digitales, sistemas y aplicaciones. Podemos iniciar con una llamada para revisar necesidades.',
      zone:'Atención regional', channel:'dola', whatsapp:'', createdAt: daysAgo(4), expiresAt: null, status:'activa', reactions:17, comments:2, shares:4, mediaLabel:'Negocio profesional', mediaType:'placeholder'
    }
  ];

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  function daysAgo(days){ return new Date(Date.now() - days*86400000).toISOString(); }
  function addDays(date, days){ const d = new Date(date); d.setDate(d.getDate()+days); return d.toISOString(); }
  function uid(prefix='id'){ return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function escapeHtml(str=''){
    return String(str).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }
  function normalizePhone(phone=''){ return String(phone).replace(/\D/g,''); }
  function getJSON(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
  function setJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function isAdmin(){ return localStorage.getItem(KEYS.admin) === 'true'; }
  function membership(){ return getJSON(KEYS.membership, { active:false, startedAt:null, expiresAt:null, ambassadorCode:'CON-LOCAL' }); }
  function isMember(){ const m = membership(); return !!m.active && (!m.expiresAt || new Date(m.expiresAt) >= new Date()); }
  function canPublishUnlimited(){ return isAdmin() || isMember(); }
  function getPosts(){
    let posts = getJSON(KEYS.posts, null);
    if (!posts) { posts = seedPosts; setJSON(KEYS.posts, posts); }
    return posts;
  }
  function savePosts(posts){ setJSON(KEYS.posts, posts); }
  function myPosts(){ return getPosts().filter(p => p.mine); }
  function activePost(post){ return post.status !== 'borrador' && post.status !== 'eliminada' && (!post.expiresAt || new Date(post.expiresAt) >= new Date()); }
  function freeActiveMine(){ return myPosts().filter(p => p.freeTrial && activePost(p)); }
  function daysLeft(expiresAt){
    if (!expiresAt) return null;
    return Math.max(0, Math.ceil((new Date(expiresAt) - new Date())/86400000));
  }
  function typeClass(type){ return type === 'Agente' ? 'agent' : type === 'Negocio' ? 'negocio' : 'solicitante'; }
  function channelLabel(channel){ return channel === 'whatsapp' ? 'WhatsApp' : 'DOLA'; }
  function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),2600); }
  function copyText(text){
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).then(()=>toast('Copiado'));
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Copiado'); return Promise.resolve();
  }
  function openExternal(url){ window.open(url, '_blank', 'noopener,noreferrer'); }

  function routeFromLocation(){
    const path = location.pathname.replace(/\/$/,'') || '/';
    return path;
  }
  function navigate(path, opts={}){
    if (opts.filter) state.filter = opts.filter;
    history.pushState({}, '', path);
    render();
  }
  window.addEventListener('popstate', render);

  function init(){
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
    render();
  }

  function render(){
    state.route = routeFromLocation();
    const app = $('#app');
    const route = state.route;
    let html = '';
    if (route === '/' || route === '/inicio') html = pageHome();
    else if (route === '/explorar') html = pageExplore();
    else if (route === '/publicar') html = pagePublish();
    else if (route === '/mis-publicaciones') html = pageMyPosts();
    else if (route === '/perfil') html = pageProfile();
    else if (route === '/embajadores') html = pageAmbassadors();
    else if (route === '/agentes') html = pageAgents();
    else if (route === '/mandados-verificados') html = pageMandados();
    else if (route === '/aprendizaje') html = pageLearning();
    else if (route === '/conseguir-clientes') html = pageCommission();
    else if (route === '/oficina') html = pageOffice();
    else html = pageNotFound();
    app.innerHTML = html + bottomNav();
    if (state.modal) renderModal(state.modal);
    window.scrollTo({top:0, behavior:'instant'});
  }

  function topbar(title='Conecta Servicios', subtitle='Red local para publicar y conectar', opts={}){
    return `<div class="topbar">
      <div class="brand">
        <div class="logo-mark ${opts.small?'small':''}">CS</div>
        <div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div>
      </div>
      <button class="icon-btn" data-action="notify" aria-label="Notificaciones">🔔</button>
    </div>`;
  }

  function backbar(title, subtitle=''){
    return `<div class="topbar"><button class="icon-btn" data-route="/" aria-label="Volver">←</button><div class="brand"><div><h1>${escapeHtml(title)}</h1>${subtitle?`<p>${escapeHtml(subtitle)}</p>`:''}</div></div><span></span></div>`;
  }

  function starCarousel(){
    return `<div class="pill-row" aria-label="Apartados principales">
      ${starSections.map(s => `<button class="pill" data-route="${s.route}" ${s.filter?`data-filter="${s.filter}"`:''}><span>${s.icon}</span>${s.label}</button>`).join('')}
    </div>`;
  }

  function pageHome(){
    const posts = getPosts().filter(activePost).slice(0,6);
    return `<main class="page">
      ${topbar()}
      <section class="hero">
        <h2>Publica fácil. Encuentra cerca. Conecta mejor.</h2>
        <p>Crea tu publicación con DOLA o manualmente. Usa un solo canal: DOLA o WhatsApp.</p>
        <div class="hero-actions">
          <button class="btn" data-route="/publicar">+ Publicar gratis</button>
          <button class="btn ghost" data-route="/explorar">Explorar</button>
        </div>
      </section>
      ${starCarousel()}
      <section class="card compact">
        <div class="stat-row">
          <div class="stat"><b>30 días</b><span>1 publicación gratis</span></div>
          <div class="stat"><b>$${MEMBERSHIP_PRICE}</b><span>membresía anual</span></div>
          <div class="stat"><b>DOLA</b><span>apoyo externo</span></div>
        </div>
      </section>
      <div class="section-title"><h2>Para ti</h2><button data-route="/explorar">Ver todo</button></div>
      <div class="feed two">${posts.map(postCard).join('')}</div>
    </main>`;
  }

  function pageExplore(){
    const filters = ['Todas','Solicitante','Agente','Negocio','Mandados verificados','Cerca de mí'];
    const q = getParam('q') || '';
    const posts = filterPosts(q);
    return `<main class="page">
      ${backbar('Explorar','Publicaciones locales')}
      <div class="searchbar">
        <input class="input" id="searchInput" placeholder="Buscar publicaciones..." value="${escapeHtml(q)}" />
        <button class="filter-btn" data-action="search">🔎</button>
      </div>
      <div class="pill-row" style="margin-top:10px">
        ${filters.map(f=>`<button class="pill ${state.filter===f?'active':''}" data-filter-only="${f}">${f}</button>`).join('')}
      </div>
      <div class="section-title"><h2>${state.filter || 'Todas'}</h2><span class="tiny muted">${posts.length} publicaciones</span></div>
      <div class="feed two">${posts.length ? posts.map(postCard).join('') : empty('No encontré publicaciones con esos filtros.', 'Puedes crear una publicación gratis por 30 días.')}</div>
    </main>`;
  }

  function filterPosts(search=''){
    let posts = getPosts().filter(activePost);
    const f = state.filter || 'Todas';
    if (f !== 'Todas' && f !== 'Cerca de mí') {
      if (f === 'Mandados verificados') posts = posts.filter(p => /mandado|entrega|mensaj/i.test(`${p.category} ${p.title} ${p.description}`));
      else posts = posts.filter(p => p.type === f);
    }
    if (search) {
      const s = search.toLowerCase();
      posts = posts.filter(p => `${p.title} ${p.description} ${p.category} ${p.zone} ${p.type}`.toLowerCase().includes(s));
    }
    return posts.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
  }

  function pagePublish(){
    const mode = state.publishMode;
    return `<main class="page">
      ${backbar('Publicar','Crea con DOLA o manualmente')}
      <div class="tabs">
        <button class="tab ${mode==='dola'?'active':''}" data-publish-mode="dola">Crear con DOLA</button>
        <button class="tab ${mode==='manual'?'active':''}" data-publish-mode="manual">Crear manualmente</button>
      </div>
      ${mode==='dola' ? publishWithDola() : manualPublishForm()}
    </main>`;
  }

  function publishWithDola(){
    const tpl = state.publishTemplate || templates[0];
    const prompt = createDolaPrompt(tpl);
    return `<section class="desktop-grid">
      <div>
        <div class="section-title"><h2>Elige plantilla</h2><span class="tiny muted">DOLA usará este contexto</span></div>
        <div class="template-list">
          ${templates.map(t => `<button class="template ${tpl.id===t.id?'active':''}" data-template="${t.id}"><span><b>${t.icon} ${t.title}</b><small>${t.desc}</small></span><span>›</span></button>`).join('')}
        </div>
      </div>
      <div class="card">
        <h3>Puente con DOLA</h3>
        <p class="muted">Copia el prompt, abre DOLA, conversa allá y pega aquí el resultado final.</p>
        <div class="bridge-steps">
          <div class="step"><div class="step-no">1</div><div><b>Copia este prompt</b><div class="prompt-box" id="dolaPrompt">${escapeHtml(prompt)}</div><button class="btn primary full" data-action="copy-dola-prompt">Copiar prompt</button></div></div>
          <div class="step"><div class="step-no">2</div><div><b>Abre DOLA</b><button class="btn green full" data-action="open-dola">Abrir DOLA</button><p class="tiny muted">DOLA es externo. Revisa antes de pegar de vuelta.</p></div></div>
          <div class="step"><div class="step-no">3</div><div><b>Pega el resultado final</b><textarea class="input paste-box" id="dolaResult" placeholder="Pega aquí el texto generado por DOLA..."></textarea><button class="btn primary full" data-action="use-dola-result">Usar este texto</button></div></div>
        </div>
      </div>
    </section>`;
  }

  function createDolaPrompt(tpl){
    return `Vengo de Conecta Servicios. Elegí la plantilla “${tpl.title}”. Tipo sugerido: ${tpl.type}. Categoría sugerida: ${tpl.category}.\n\nAyúdame a crear una publicación clara y breve para Conecta Servicios. Hazme las preguntas necesarias y al final dame un texto listo para copiar y pegar en Conecta con este formato exacto:\n\n=== PUBLICACIÓN GENERADA POR DOLA ===\nTipo: ${tpl.type}\nCategoría: ${tpl.category}\nTítulo: [título claro]\nZona: [municipio o zona]\nDescripción:\n[descripción ordenada]\n\nCanal recomendado: DOLA\nPreguntas sugeridas:\n1. [pregunta]\n2. [pregunta]\n3. [pregunta]\n4. [pregunta]\n=== FIN ===`;
  }

  function manualPublishForm(prefill={}){
    const draft = state.publishDraft || prefill || {};
    return `<section class="card">
      <h3>Crear publicación manual</h3>
      ${publishLimitNotice()}
      <form class="form" id="publishForm">
        <div class="field"><label>Tipo</label><select name="type"><option ${draft.type==='Solicitante'?'selected':''}>Solicitante</option><option ${draft.type==='Agente'?'selected':''}>Agente</option><option ${draft.type==='Negocio'?'selected':''}>Negocio</option></select></div>
        <div class="field"><label>Título</label><input class="input" name="title" required maxlength="90" value="${escapeHtml(draft.title||'')}" placeholder="Ej. Necesito que alguien me traiga tacos" /></div>
        <div class="field"><label>Descripción</label><textarea name="description" required placeholder="Describe lo que necesitas, ofreces o tu negocio...">${escapeHtml(draft.description||'')}</textarea></div>
        <div class="grid-2">
          <div class="field"><label>Categoría</label><input class="input" name="category" value="${escapeHtml(draft.category||'')}" placeholder="Mandados, comida, negocio..." /></div>
          <div class="field"><label>Municipio / zona</label><input class="input" name="zone" value="${escapeHtml(draft.zone||'')}" placeholder="Chapultepec, Toluca..." /></div>
        </div>
        <div class="field"><label>Foto o video opcional</label><input class="input" type="file" name="media" accept="image/*,video/mp4,video/webm" /><div class="media-preview" id="mediaPreview">Puedes subir una foto/video o dejarlo sin media.</div></div>
        <div class="field"><label>Canal de contacto</label><div class="toggle-row"><button type="button" class="option-card active" data-channel-choice="dola"><h4>🤖 DOLA</h4><p>Recomendado. Ayuda a filtrar mejor.</p></button><button type="button" class="option-card" data-channel-choice="whatsapp"><h4>🟢 WhatsApp</h4><p>Contacto directo y rápido.</p></button></div><input type="hidden" name="channel" value="${draft.channel||'dola'}" /></div>
        <div class="field whatsapp-field" style="display:${draft.channel==='whatsapp'?'grid':'none'}"><label>WhatsApp</label><input class="input" name="whatsapp" value="${escapeHtml(draft.whatsapp||'')}" placeholder="Ej. 5217220000000" /></div>
        <button class="btn primary full" type="submit">Publicar</button>
      </form>
    </section>`;
  }

  function publishLimitNotice(){
    if (canPublishUnlimited()) return `<div class="success">Publicación ilimitada activa ${isAdmin()?'por admin':'por membresía'}.</div>`;
    const active = freeActiveMine();
    if (!active.length) return `<div class="success">Tienes 1 publicación gratis por ${FREE_DAYS} días.</div>`;
    const left = daysLeft(active[0].expiresAt);
    return `<div class="notice">Ya tienes una publicación gratis activa. Vence en ${left} días. Activa tu membresía anual de $${MEMBERSHIP_PRICE} para publicar sin límites.</div>`;
  }

  function pageMyPosts(){
    const mine = myPosts().filter(p => p.status !== 'eliminada').sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    const requests = getJSON(KEYS.requests, []);
    return `<main class="page">
      ${backbar('Mis publicaciones','Administra tus publicaciones')}
      <section class="card compact">
        <div class="stat-row"><div class="stat"><b>${mine.filter(activePost).length}</b><span>activas</span></div><div class="stat"><b>${mine.filter(p=>p.status==='borrador').length}</b><span>borradores</span></div><div class="stat"><b>${requests.length}</b><span>solicitudes</span></div></div>
      </section>
      ${membershipBox()}
      <div class="section-title"><h2>Mis publicaciones</h2><button data-route="/publicar">+ Crear</button></div>
      <div class="feed">${mine.length ? mine.map(myPostCard).join('') : empty('Aún no tienes publicaciones.', 'Crea una gratis por 30 días con ayuda de DOLA.')}</div>
      <div class="section-title"><h2>Solicitudes recibidas</h2><span class="tiny muted">Modo piloto local</span></div>
      <div class="list">${requests.length ? requests.map(requestItem).join('') : empty('Sin solicitudes todavía.', 'Cuando alguien use DOLA para contactarte aparecerá aquí.')}</div>
    </main>`;
  }

  function membershipBox(){
    const m = membership();
    if (isMember()) return `<section class="card success"><b>Membresía activa</b><p class="muted">Puedes publicar sin límites. Vigencia: ${new Date(m.expiresAt).toLocaleDateString('es-MX')}</p></section>`;
    const active = freeActiveMine()[0];
    return `<section class="card notice"><b>${active ? `Tu publicación gratis vence en ${daysLeft(active.expiresAt)} días.` : 'Tienes 1 publicación gratis por 30 días.'}</b><p>Activa tu membresía anual de $${MEMBERSHIP_PRICE} para publicar sin límites.</p><button class="btn primary" data-action="activate-membership">Activar membresía piloto</button></section>`;
  }

  function myPostCard(p){
    const left = daysLeft(p.expiresAt);
    return `<article class="card">
      <div class="post-meta"><span class="chip ${typeClass(p.type)}">${p.type}</span><span class="chip">${channelLabel(p.channel)}</span><span class="chip ${p.status==='vencida'?'warning':''}">${p.status||'activa'}</span></div>
      <h3 class="post-title">${escapeHtml(p.title)}</h3><p class="post-desc">${escapeHtml(p.description)}</p><p class="tiny muted">${escapeHtml(p.zone||'Sin zona')} · ${escapeHtml(p.category||'Sin categoría')} ${left!==null?`· ${left} días restantes`:''}</p>
      <div class="post-actions"><button class="action primary" data-view-post="${p.id}">Ver</button><button class="action" data-edit-post="${p.id}">Editar</button><button class="action" data-similar-post="${p.id}">Publicar algo parecido</button><button class="action" data-delete-post="${p.id}">Eliminar</button></div>
    </article>`;
  }

  function requestItem(r){
    return `<div class="list-item"><div><b>${escapeHtml(r.title||'Solicitud')}</b><p class="tiny muted">${escapeHtml(r.summary||'Solicitud preparada')} · ${new Date(r.createdAt).toLocaleString('es-MX')}</p></div><button class="action" data-action="mark-request" data-id="${r.id}">${escapeHtml(r.status||'Nueva')}</button></div>`;
  }

  function pageProfile(){
    const prof = getJSON(KEYS.profile, {name:'Edgar', email:'usuario@conecta.local', zone:'Chapultepec, Edo. Méx.'});
    return `<main class="page">
      ${backbar('Perfil','Mi acceso')}
      <section class="card">
        <div class="brand"><div class="logo-mark small">${escapeHtml((prof.name||'U').slice(0,2).toUpperCase())}</div><div><h2 style="margin:0">${escapeHtml(prof.name||'Usuario')}</h2><p class="muted" style="margin:2px 0 0">${escapeHtml(prof.email||'')}</p></div></div>
      </section>
      <div class="list">
        <button class="list-item" data-action="activate-membership"><div class="left"><div class="list-icon">💳</div><div><b>Mi acceso / Membresía</b><p class="tiny muted">${isMember()?'Activa':'Gratis 1 publicación'}</p></div></div><span>›</span></button>
        <button class="list-item" data-route="/mis-publicaciones"><div class="left"><div class="list-icon">🗂️</div><div><b>Mis publicaciones</b><p class="tiny muted">Activas, vencidas y borradores</p></div></div><span>›</span></button>
        <button class="list-item" data-action="edit-profile"><div class="left"><div class="list-icon">👤</div><div><b>Datos básicos</b><p class="tiny muted">Nombre, zona y preferencias</p></div></div><span>›</span></button>
        <button class="list-item" data-action="privacy"><div class="left"><div class="list-icon">🛡️</div><div><b>Ayuda y privacidad</b><p class="tiny muted">DOLA es externo; no compartas datos sensibles</p></div></div><span>›</span></button>
        <button class="list-item" data-route="/oficina"><div class="left"><div class="list-icon">⚙️</div><div><b>Oficina / Admin</b><p class="tiny muted">Acceso discreto de administración</p></div></div><span>›</span></button>
        <button class="list-item" data-action="clear-local"><div class="left"><div class="list-icon">🧹</div><div><b>Borrar datos locales</b><p class="tiny muted">Solo modo piloto</p></div></div><span>›</span></button>
      </div>
      <p class="version">${VERSION}</p>
    </main>`;
  }

  function pageAmbassadors(){
    return `<main class="page">
      ${backbar('Embajadores','Gana ayudando a crecer Conecta')}
      <section class="hero"><h2>Invita negocios, agentes y solicitantes.</h2><p>Ayuda a otros a publicar y gana comisión por membresías referidas.</p></section>
      <div class="list">
        ${infoItem('🏆','¿Qué es ser embajador?','Personas que recomiendan Conecta y ayudan a otros a publicar.')}
        ${infoItem('💰','¿Cómo ganas comisión?','Comisión piloto sugerida: $50 MXN por membresía referida de $98.')}
        ${infoItem('🔗','Comparte tu enlace','Copia tu enlace y compártelo con negocios o agentes.')}
        ${infoItem('📝','Registrar referido','Lleva control de a quién invitaste.')}
      </div>
      <div class="card"><button class="btn primary full" data-action="copy-ambassador-link">Copiar enlace</button><button class="btn ghost full" style="margin-top:10px" data-route="/publicar">Ayudar a alguien a publicar</button></div>
    </main>`;
  }

  function pageAgents(){
    return `<main class="page">
      ${backbar('Agentes en crecimiento','Empieza a generar ingresos')}
      <section class="hero"><h2>Ofrece lo que puedes hacer.</h2><p>Mandados, entregas, trámites, viajes locales o apoyo por horas.</p></section>
      <div class="list">
        ${infoItem('🛵','Hago mandados','Publica tu disponibilidad y zona de atención.')}
        ${infoItem('📦','Hago entregas','Recibe solicitudes más claras con DOLA o WhatsApp.')}
        ${infoItem('🤝','Apoyo local','Acompañamiento, trámites o ayuda por horas.')}
        ${infoItem('📈','Mejora tu perfil','Aprende cómo presentarte mejor para recibir solicitudes.')}
      </div>
      <div class="card"><button class="btn primary full" data-route="/publicar">Crear publicación como agente</button></div>
    </main>`;
  }

  function pageMandados(){
    return `<main class="page">
      ${backbar('Mandados verificados','Confianza local')}
      <section class="hero"><h2>Más claridad para mandados y entregas.</h2><p>En esta etapa, la validación puede requerir revisión manual.</p></section>
      <div class="list">
        ${infoItem('🛡️','¿Qué es un mandado verificado?','Programa para conectar solicitudes con agentes revisados o identificados.')}
        ${infoItem('📋','Solicitar mandado','Crea una publicación clara con lugar, horario y presupuesto.')}
        ${infoItem('🙋','Postularme como agente','Registra tu zona y disponibilidad para participar.')}
        ${infoItem('❓','Requisitos y preguntas','La revisión puede ser manual durante el piloto.')}
      </div>
      <div class="card"><button class="btn primary full" data-route="/publicar">Solicitar mandado</button></div>
    </main>`;
  }

  function pageLearning(){
    return `<main class="page">
      ${backbar('Aprendizaje','Crece y mejora')}
      <section class="hero"><h2>Aprende a publicar, atender y vender mejor.</h2><p>Recursos recomendados para agentes, negocios y embajadores.</p></section>
      <div class="list">
        ${infoItem('🎓','Cursos gratuitos recomendados','Recursos externos permitidos para mejorar habilidades.')}
        ${infoItem('📝','Cómo mejorar tu publicación','Títulos claros, fotos, zona y contacto correcto.')}
        ${infoItem('🤖','Cómo usar DOLA','DOLA ayuda a redactar y filtrar mejor tus contactos.')}
        ${infoItem('💬','Cómo atender mejor','Responde claro, confirma detalles y cuida la confianza.')}
      </div>
      <div class="notice">Los recursos externos deben identificarse como externos y no como propiedad de Conecta.</div>
    </main>`;
  }

  function pageCommission(){
    return `<main class="page">
      ${backbar('Conseguir clientes','Por comisión')}
      <section class="hero"><h2>Ayuda a negocios a conseguir clientes.</h2><p>Publica campañas o consigue prospectos con pago por resultado.</p></section>
      <div class="list">
        ${infoItem('💼','Agentes por comisión','Conecta negocios con personas que puedan promoverlos.')}
        ${infoItem('📣','Campañas locales','Crea publicaciones para atraer prospectos medibles.')}
        ${infoItem('🤝','Sin pago adelantado','El enfoque puede ser por resultado acordado entre partes.')}
      </div>
      <div class="card"><button class="btn primary full" data-route="/publicar">Crear publicación</button></div>
    </main>`;
  }

  function pageOffice(){
    return `<main class="page">
      ${backbar('Oficina','Administración piloto')}
      <section class="card">
        <h3>Acceso admin</h3>
        <p class="muted">El admin no se bloquea por membresía ni límite de 30 días.</p>
        ${isAdmin()?`<div class="success">Admin activo en este navegador.</div><button class="btn ghost" data-action="disable-admin">Ocultar admin</button>`:`<button class="btn primary" data-action="enable-admin">Ingresar PIN admin</button>`}
      </section>
      ${isAdmin()?`<section class="card"><h3>Panel piloto</h3><div class="stat-row"><div class="stat"><b>${getPosts().length}</b><span>publicaciones</span></div><div class="stat"><b>${getJSON(KEYS.requests,[]).length}</b><span>solicitudes</span></div><div class="stat"><b>${isMember()?'Sí':'No'}</b><span>membresía</span></div></div><button class="btn green full" data-action="activate-membership" style="margin-top:12px">Activar membresía piloto</button></section>`:''}
    </main>`;
  }

  function pageNotFound(){ return `<main class="page">${backbar('Página no encontrada')}<div class="empty">Esta ruta no existe. <button class="btn primary" data-route="/">Ir al inicio</button></div></main>`; }

  function infoItem(icon,title,desc){ return `<div class="list-item"><div class="left"><div class="list-icon">${icon}</div><div><b>${escapeHtml(title)}</b><p class="tiny muted">${escapeHtml(desc)}</p></div></div><span>›</span></div>`; }

  function empty(title, desc){ return `<div class="empty"><b>${escapeHtml(title)}</b><p>${escapeHtml(desc)}</p><button class="btn primary" data-route="/publicar">Publicar gratis</button></div>`; }

  function postCard(p){
    return `<article class="post-card" data-post-card="${p.id}">
      <div class="post-media">${renderMedia(p)}</div>
      <div class="post-body">
        <div class="post-meta"><span class="chip ${typeClass(p.type)}">${p.type}</span><span class="chip">${escapeHtml(p.category||'General')}</span><span class="tiny muted">${escapeHtml(p.zone||'Sin zona')}</span></div>
        <h3 class="post-title">${escapeHtml(p.title)}</h3>
        <p class="post-desc">${escapeHtml(truncate(p.description, 170))}</p>
      </div>
      <div class="post-actions">
        <button class="action" data-react-post="${p.id}">♡ ${p.reactions||0}</button>
        <button class="action" data-share-post="${p.id}">↗ Compartir</button>
        <button class="action copy" data-similar-post="${p.id}">Publicar algo parecido</button>
        <button class="action primary ${p.channel==='whatsapp'?'whatsapp':''}" data-message-post="${p.id}">💬 Mensaje</button>
      </div>
    </article>`;
  }

  function renderMedia(p){
    if (p.mediaData) {
      if (p.mediaKind === 'video') return `<video src="${p.mediaData}" muted playsinline controls></video>`;
      return `<img src="${p.mediaData}" alt="${escapeHtml(p.title)}" />`;
    }
    if (p.mediaPath) return p.mediaPath.endsWith('.mp4') ? `<video src="${p.mediaPath}" muted playsinline controls onerror="this.parentElement.innerHTML='${placeholderText(p)}'"></video>` : `<img src="${p.mediaPath}" alt="${escapeHtml(p.title)}" onerror="this.parentElement.innerHTML='${placeholderText(p)}'" />`;
    return placeholderText(p);
  }
  function placeholderText(p){ return `<div class="post-placeholder"><div><div style="font-size:2rem">${p.type==='Negocio'?'🏪':p.type==='Agente'?'🛵':'🧡'}</div><div>${escapeHtml(p.mediaLabel||p.category||'Conecta Servicios')}</div></div></div>`; }
  function truncate(str='', n=150){ return str.length > n ? str.slice(0,n-1)+'…' : str; }

  function bottomNav(){
    const items = [
      ['/', 'Inicio', '⌂'], ['/explorar','Explorar','⌕'], ['/publicar','Publicar','+'], ['/mis-publicaciones','Mis Publicaciones','▤'], ['/perfil','Perfil','♙']
    ];
    return `<nav class="bottom-nav" aria-label="Navegación principal">${items.map(([path,label,icon])=>`<button class="nav-item ${state.route===path?'active':''} ${path==='/publicar'?'publish':''}" data-route="${path}"><span>${icon}</span><span>${label}</span></button>`).join('')}</nav>`;
  }

  function onClick(e){
    const routeBtn = e.target.closest('[data-route]');
    if (routeBtn) { e.preventDefault(); navigate(routeBtn.dataset.route, routeBtn.dataset.filter ? {filter:routeBtn.dataset.filter} : {}); return; }
    const filterBtn = e.target.closest('[data-filter-only]');
    if (filterBtn) { state.filter = filterBtn.dataset.filterOnly; render(); return; }
    const mode = e.target.closest('[data-publish-mode]');
    if (mode) { state.publishMode = mode.dataset.publishMode; render(); return; }
    const tpl = e.target.closest('[data-template]');
    if (tpl) { state.publishTemplate = templates.find(t=>t.id===tpl.dataset.template) || templates[0]; render(); return; }
    const channel = e.target.closest('[data-channel-choice]');
    if (channel) { selectChannel(channel.dataset.channelChoice); return; }
    const react = e.target.closest('[data-react-post]');
    if (react) { reactPost(react.dataset.reactPost); return; }
    const share = e.target.closest('[data-share-post]');
    if (share) { sharePost(share.dataset.sharePost); return; }
    const similar = e.target.closest('[data-similar-post]');
    if (similar) { createSimilar(similar.dataset.similarPost); return; }
    const msg = e.target.closest('[data-message-post]');
    if (msg) { messagePost(msg.dataset.messagePost); return; }
    const view = e.target.closest('[data-view-post]');
    if (view) { openPostModal(view.dataset.viewPost); return; }
    const del = e.target.closest('[data-delete-post]');
    if (del) { deletePost(del.dataset.deletePost); return; }
    const edit = e.target.closest('[data-edit-post]');
    if (edit) { editPost(edit.dataset.editPost); return; }
    const action = e.target.closest('[data-action]');
    if (action) { handleAction(action.dataset.action, action); return; }
  }

  function onInput(e){
    // Reservado para interacciones futuras sin recargar la pantalla mientras el usuario escribe.
  }

  function onChange(e){
    if (e.target.name === 'media' && e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => { state.pendingMedia = { data: reader.result, kind: file.type.startsWith('video') ? 'video' : 'image' }; const prev = $('#mediaPreview'); if (prev) prev.innerHTML = state.pendingMedia.kind === 'video' ? `<video src="${reader.result}" controls muted playsinline></video>` : `<img src="${reader.result}" alt="Vista previa" />`; };
      reader.readAsDataURL(file);
    }
    if (e.target.id === 'publishForm') e.preventDefault();
  }

  document.addEventListener('submit', (e)=>{
    if (e.target.id === 'publishForm') { e.preventDefault(); submitPublish(e.target); }
  });

  function handleAction(action, el){
    const tpl = state.publishTemplate || templates[0];
    if (action === 'copy-dola-prompt') copyText(createDolaPrompt(tpl));
    if (action === 'open-dola') openExternal(DOLA_EXTERNAL_URL);
    if (action === 'use-dola-result') useDolaResult();
    if (action === 'search') { const q = $('#searchInput')?.value.trim() || ''; const url = new URL(location.href); if (q) url.searchParams.set('q', q); else url.searchParams.delete('q'); history.replaceState({}, '', url.pathname + url.search); render(); }
    if (action === 'activate-membership') activateMembership();
    if (action === 'copy-ambassador-link') copyText(`${location.origin}/embajadores?ref=CON-LOCAL`);
    if (action === 'enable-admin') enableAdmin();
    if (action === 'disable-admin') { localStorage.removeItem(KEYS.admin); toast('Admin oculto'); render(); }
    if (action === 'clear-local') clearLocal();
    if (action === 'privacy') showPrivacy();
    if (action === 'edit-profile') editProfile();
    if (action === 'notify') toast('Notificaciones en piloto.');
  }

  function selectChannel(ch){
    $$('[data-channel-choice]').forEach(b=>b.classList.toggle('active', b.dataset.channelChoice === ch));
    const input = $('[name="channel"]'); if (input) input.value = ch;
    const wf = $('.whatsapp-field'); if (wf) wf.style.display = ch === 'whatsapp' ? 'grid' : 'none';
  }

  function useDolaResult(){
    const text = $('#dolaResult')?.value.trim();
    if (!text) { toast('Pega primero el resultado de DOLA.'); return; }
    const parsed = parseDolaText(text);
    state.publishMode = 'manual';
    state.publishDraft = parsed;
    toast('Texto organizado. Revisa y publica.');
    render();
  }

  function parseDolaText(text){
    const getLine = (label) => {
      const m = text.match(new RegExp(`${label}:\\s*(.+)`, 'i'));
      return m ? m[1].trim() : '';
    };
    const descMatch = text.match(/Descripción:\s*([\s\S]*?)(?:\n\s*Canal recomendado:|\n\s*Preguntas sugeridas:|=== FIN ===|$)/i);
    const description = descMatch ? descMatch[1].trim() : text;
    const channelLine = getLine('Canal recomendado');
    return {
      type: normalizeType(getLine('Tipo')) || 'Solicitante',
      category: getLine('Categoría') || '',
      title: getLine('Título') || firstSentence(description) || 'Publicación creada con DOLA',
      zone: getLine('Zona') || '',
      description,
      channel: /whats/i.test(channelLine) ? 'whatsapp' : 'dola'
    };
  }
  function normalizeType(t=''){ return /agente/i.test(t) ? 'Agente' : /negocio/i.test(t) ? 'Negocio' : /solicit/i.test(t) ? 'Solicitante' : ''; }
  function firstSentence(s=''){ return s.split(/[.\n]/).map(x=>x.trim()).filter(Boolean)[0]?.slice(0,90); }

  function submitPublish(form){
    if (!canPublishUnlimited() && freeActiveMine().length >= 1) { toast('Activa membresía para publicar sin límites.'); navigate('/mis-publicaciones'); return; }
    const fd = new FormData(form);
    const channel = fd.get('channel') || 'dola';
    const whatsapp = normalizePhone(fd.get('whatsapp') || '');
    if (channel === 'whatsapp' && whatsapp.length < 10) { toast('Agrega un WhatsApp válido.'); return; }
    const post = {
      id: uid('post'), owner:'Tú', mine:true, type: fd.get('type') || 'Solicitante', category: (fd.get('category') || '').trim() || 'General', title: (fd.get('title') || '').trim(), description: (fd.get('description') || '').trim(), zone: (fd.get('zone') || '').trim() || 'Zona no especificada', channel, whatsapp,
      createdAt: new Date().toISOString(), expiresAt: canPublishUnlimited() ? null : addDays(new Date(), FREE_DAYS), status:'activa', freeTrial: !canPublishUnlimited(), reactions:0, comments:0, shares:0,
      mediaData: state.pendingMedia?.data || '', mediaKind: state.pendingMedia?.kind || '', mediaLabel:'Publicación local', mediaType:'placeholder'
    };
    if (!post.title || !post.description) { toast('Completa título y descripción.'); return; }
    const posts = getPosts(); posts.unshift(post); savePosts(posts); state.pendingMedia = null; state.publishDraft = null; toast('Publicación creada'); navigate('/mis-publicaciones');
  }

  function reactPost(id){ const posts = getPosts(); const p = posts.find(x=>x.id===id); if (p) { p.reactions=(p.reactions||0)+1; savePosts(posts); toast('Reacción agregada'); render(); } }
  function sharePost(id){ const p = getPosts().find(x=>x.id===id); if (!p) return; const url = `${location.origin}/explorar?post=${encodeURIComponent(id)}`; if (navigator.share) navigator.share({title:p.title,text:p.description,url}).catch(()=>{}); else copyText(`${p.title}\n${url}`); }
  function createSimilar(id){ const p = getPosts().find(x=>x.id===id); if (!p) return; state.publishMode='manual'; state.publishDraft={ type:p.type, category:p.category, zone:p.zone, title:`Similar a: ${p.title}`.slice(0,90), description:'Quiero publicar algo parecido. ', channel:p.channel }; navigate('/publicar'); }
  function messagePost(id){ const p = getPosts().find(x=>x.id===id); if (!p) return; if (p.channel === 'whatsapp') { const msg = encodeURIComponent(`Hola, vi tu publicación en Conecta Servicios: “${p.title}”. Me interesa coordinar contigo.`); const phone = normalizePhone(p.whatsapp); if (!phone) return toast('Esta publicación no tiene WhatsApp válido.'); openExternal(`https://wa.me/${phone}?text=${msg}`); return; } openDolaContact(p); }
  function openDolaContact(p){
    const prompt = `Vengo de Conecta Servicios. Quiero contactar al anunciante de esta publicación: “${p.title}”.\n\nDescripción: ${p.description}\nZona: ${p.zone}\nTipo: ${p.type}\nCategoría: ${p.category}\n\nAyúdame a ordenar mi solicitud. Hazme las preguntas necesarias y al final dame un mensaje listo para enviar al anunciante.`;
    state.modal = { type:'dola-contact', postId:p.id, prompt };
    renderModal(state.modal);
  }
  function openPostModal(id){ const p = getPosts().find(x=>x.id===id); if (!p) return; state.modal={type:'post', postId:id}; renderModal(state.modal); }
  function editPost(id){ const p = getPosts().find(x=>x.id===id); if (!p) return; state.publishMode='manual'; state.publishDraft=p; navigate('/publicar'); }
  function deletePost(id){ if (!confirm('¿Eliminar esta publicación local?')) return; const posts = getPosts().map(p=>p.id===id?{...p,status:'eliminada'}:p); savePosts(posts); toast('Publicación eliminada'); render(); }

  function renderModal(modal){
    let old = $('#modal-root'); if (old) old.remove();
    const div = document.createElement('div'); div.id='modal-root'; div.className='modal-backdrop';
    if (modal.type==='dola-contact') {
      const p = getPosts().find(x=>x.id===modal.postId);
      div.innerHTML = `<div class="modal"><h3>Puente con DOLA</h3><p class="muted">DOLA es externo. Copia el prompt, abre DOLA y prepara tu solicitud.</p><div class="prompt-box">${escapeHtml(modal.prompt)}</div><div class="modal-actions"><button class="btn primary" data-modal-copy>Copiar prompt</button><button class="btn green" data-modal-open>DOLA</button><button class="btn ghost" data-modal-save>Guardar solicitud local</button><button class="btn" data-modal-close>Cerrar</button></div></div>`;
      div.querySelector('[data-modal-copy]').onclick=()=>copyText(modal.prompt);
      div.querySelector('[data-modal-open]').onclick=()=>openExternal(DOLA_EXTERNAL_URL);
      div.querySelector('[data-modal-save]').onclick=()=>{ const req=getJSON(KEYS.requests,[]); req.unshift({id:uid('req'),postId:p?.id,title:p?.title,summary:'Solicitud preparada con DOLA',status:'Nueva',createdAt:new Date().toISOString()}); setJSON(KEYS.requests,req); toast('Solicitud guardada localmente'); closeModal(); };
    } else if (modal.type==='post') {
      const p = getPosts().find(x=>x.id===modal.postId);
      div.innerHTML = `<div class="modal"><h3>${escapeHtml(p?.title||'Publicación')}</h3><p class="muted">${escapeHtml(p?.zone||'')} · ${escapeHtml(p?.category||'')}</p><p>${escapeHtml(p?.description||'')}</p><div class="modal-actions"><button class="btn primary" data-message-post="${p?.id}">Mensaje</button><button class="btn ghost" data-modal-close>Cerrar</button></div></div>`;
    }
    div.onclick=(e)=>{ if(e.target===div) closeModal(); };
    div.querySelectorAll('[data-modal-close]').forEach(b=>b.onclick=closeModal);
    document.body.appendChild(div);
  }
  function closeModal(){ state.modal=null; $('#modal-root')?.remove(); }

  function activateMembership(){ const expires = addDays(new Date(), 365); setJSON(KEYS.membership,{active:true,startedAt:new Date().toISOString(),expiresAt:expires,ambassadorCode:'CON-LOCAL'}); toast('Membresía piloto activa'); render(); }
  function enableAdmin(){ const pin = prompt('Ingresa PIN admin'); if (pin === ADMIN_PIN) { localStorage.setItem(KEYS.admin,'true'); toast('Admin activo'); render(); } else if (pin) toast('PIN incorrecto'); }
  function clearLocal(){ if (!confirm('Esto borrará datos locales del piloto. ¿Continuar?')) return; Object.values(KEYS).forEach(k=>localStorage.removeItem(k)); toast('Datos locales borrados'); render(); }
  function showPrivacy(){ alert('DOLA es una herramienta externa. No compartas datos sensibles. Revisa el texto antes de pegarlo en Conecta. Conecta facilita publicaciones y contacto, no garantiza ventas ni resultados.'); }
  function editProfile(){ const name = prompt('Nombre', getJSON(KEYS.profile,{name:'Usuario'}).name || 'Usuario'); if (!name) return; const profile = getJSON(KEYS.profile,{}); profile.name=name; setJSON(KEYS.profile,profile); toast('Perfil actualizado'); render(); }

  function getParam(name){ return new URL(location.href).searchParams.get(name); }

  init();
})();
