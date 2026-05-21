/* Conecta Servicios v5.1.1 - home galería y multimedia */
(() => {
  'use strict';

  const VERSION = 'v5.1.1-home-galeria-multimedia';
  const CACHE_HINT = 'conecta-servicios-v5-1-1-home-galeria-multimedia';
  const DOLA_EXTERNAL_URL = 'https://dola.com';
  const CONNECTA_APP_URL = 'https://conecta-servicios.vercel.app/';
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
    prefs: 'cs_v5_prefs',
    notifications: 'cs_v5_notifications',
    referrals: 'cs_v5_referrals',
    verifiedApplications: 'cs_v5_verified_applications',
    learningPlans: 'cs_v5_learning_plans'
  };

  let deferredInstallPrompt = null;

  const state = {
    route: '/',
    filter: 'Todas',
    publishMode: 'dola',
    publishTemplate: null,
    dolaFlowActive: false,
    publishDraft: null,
    dolaPreview: null,
    dolaText: '',
    dolaApiStatus: 'idle',
    dolaApiMessages: [],
    dolaApiResult: '',
    dolaApiError: '',
    dolaApiTask: null,
    modal: null,
    pendingMediaItems: [],
    navigationStack: []
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
    { id:'publicar-negocio', title:'Quiero publicar mi negocio', icon:'🏪', type:'Negocio', category:'Negocio local', desc:'Muestra tu comercio, producto o servicio profesional.' },
    { id:'ofrecerme-agente', title:'Quiero ofrecerme como agente', icon:'🙋', type:'Agente', category:'Agentes en crecimiento', desc:'Publica lo que puedes hacer para generar ingresos.' }
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
    },
    {
      id:'seed-5', owner:'Panadería piloto', mine:false, type:'Negocio', category:'Comida / panadería', title:'Panadería con entregas por la mañana',
      description:'Pan dulce, bolillo y paquetes para desayunos. Atiendo pedidos pequeños y encargos para oficinas o reuniones.',
      zone:'Chapultepec centro', channel:'dola', whatsapp:'', createdAt: daysAgo(1), expiresAt: null, status:'activa', reactions:19, comments:4, shares:5, mediaLabel:'Publicación de comida', mediaType:'placeholder'
    },
    {
      id:'seed-6', owner:'Agente piloto', mine:false, type:'Agente', category:'Apoyo por horas', title:'Apoyo con trámites y compras locales',
      description:'Puedo acompañarte a realizar trámites, hacer compras o apoyar por horas en actividades sencillas.',
      zone:'Toluca y alrededores', channel:'dola', whatsapp:'', createdAt: daysAgo(2), expiresAt: null, status:'activa', reactions:11, comments:2, shares:3, mediaLabel:'Agente local', mediaType:'placeholder'
    },
    {
      id:'seed-7', owner:'Solicitante piloto', mine:false, type:'Solicitante', category:'Ayuda local', title:'Necesito apoyo para mover unas cajas',
      description:'Busco a alguien disponible para ayudarme a mover cajas pequeñas por una hora. Pago a tratar según disponibilidad.',
      zone:'Metepec', channel:'dola', whatsapp:'', createdAt: daysAgo(2), expiresAt: null, status:'activa', reactions:8, comments:1, shares:2, mediaLabel:'Solicitud local', mediaType:'placeholder'
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
  function notificationState(){ return getJSON(KEYS.notifications, { enabled:false, items:[] }); }
  function saveNotificationState(value){ setJSON(KEYS.notifications, value); }
  function addNotification(title, message, type='info'){
    const data = notificationState();
    data.items = data.items || [];
    data.items.unshift({ id: uid('note'), title, message, type, read:false, createdAt:new Date().toISOString() });
    data.items = data.items.slice(0, 40);
    saveNotificationState(data);
  }
  function unreadNotifications(){ return (notificationState().items || []).filter(n => !n.read).length; }
  function isAdmin(){ return localStorage.getItem(KEYS.admin) === 'true'; }
  function membership(){ return getJSON(KEYS.membership, { active:false, startedAt:null, expiresAt:null, ambassadorCode:'CON-LOCAL' }); }
  function isMember(){ const m = membership(); return !!m.active && (!m.expiresAt || new Date(m.expiresAt) >= new Date()); }
  function canPublishUnlimited(){ return isAdmin() || isMember(); }
  function getPosts(){
    let posts = getJSON(KEYS.posts, null);
    if (!posts) { posts = seedPosts; setJSON(KEYS.posts, posts); }
    return posts;
  }
  function savePosts(posts){
    try {
      setJSON(KEYS.posts, posts);
    } catch (err) {
      console.warn('No se pudo guardar multimedia completa en localStorage', err);
      const safePosts = posts.map(post => ({
        ...post,
        mediaData: '',
        mediaKind: '',
        mediaItems: (post.mediaItems || []).map(item => ({ ...item, data:'', url:'', transient:true }))
      }));
      setJSON(KEYS.posts, safePosts);
      toast('La publicación se guardó; para videos/fotos pesadas se requiere Storage en producción.');
    }
  }
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


  async function sendToDola(messages, context = {}){
    const response = await fetch('/api/dola', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context })
    });
    let data = null;
    try { data = await response.json(); } catch { data = null; }
    if (!response.ok || !data?.ok) {
      const error = data?.error || `HTTP_${response.status}`;
      const message = data?.message || 'No se pudo conectar con DOLA.';
      const err = new Error(message);
      err.code = error;
      err.payload = data;
      throw err;
    }
    return data;
  }

  function resetDolaApiState(){
    state.dolaApiStatus = 'idle';
    state.dolaApiMessages = [];
    state.dolaApiResult = '';
    state.dolaApiError = '';
    state.dolaApiTask = null;
  }

  function buildDolaMessages(prompt, userInstruction=''){
    const messages = [{ role:'user', content: prompt }];
    if (userInstruction) messages.push({ role:'user', content: userInstruction });
    return messages;
  }

  async function callDolaForPublication(userInstruction=''){
    const tpl = state.publishTemplate || templates[0];
    const prompt = createDolaPrompt(tpl);
    state.dolaApiStatus = 'loading';
    state.dolaApiError = '';
    state.dolaApiTask = 'publication';
    render();
    try {
      const data = await sendToDola(buildDolaMessages(prompt, userInstruction), {
        task:'create_publication',
        version: VERSION,
        template: tpl,
        appUrl: CONNECTA_APP_URL
      });
      const answer = data.text || data.message || data.content || '';
      state.dolaApiStatus = 'ready';
      state.dolaApiResult = answer.trim();
      state.dolaApiMessages = [
        { role:'user', content: userInstruction || 'Crear publicación con la plantilla seleccionada.' },
        { role:'assistant', content: state.dolaApiResult }
      ];
      state.dolaText = state.dolaApiResult;
      toast('DOLA respondió dentro de Conecta.');
    } catch (err) {
      state.dolaApiStatus = err.code === 'DOLA_API_NOT_CONFIGURED' ? 'fallback' : 'error';
      state.dolaApiError = err.message || 'No se pudo usar DOLA por API.';
      toast(state.dolaApiStatus === 'fallback' ? 'API de DOLA pendiente. Usa modo externo.' : 'Error al conectar con DOLA.');
    }
    render();
  }

  async function adjustDolaPublication(instruction){
    const tpl = state.publishTemplate || templates[0];
    const base = state.dolaApiResult || state.dolaText || '';
    const prompt = dolaBasePrompt({
      section:'Ajustar publicación generada',
      objective:'Ajustar una publicación ya redactada para Conecta Servicios sin salir del contexto de la app.',
      extra:`PUBLICACIÓN ACTUAL:\n${base}\n\nINSTRUCCIÓN DEL USUARIO:\n${instruction}\n\nDevuelve únicamente la versión ajustada, lista para usar como publicación. No repitas el prompt ni la conversación.`
    });
    state.dolaApiStatus = 'loading';
    state.dolaApiError = '';
    render();
    try {
      const data = await sendToDola(buildDolaMessages(prompt), {
        task:'adjust_publication',
        version: VERSION,
        template: tpl,
        appUrl: CONNECTA_APP_URL
      });
      state.dolaApiStatus = 'ready';
      state.dolaApiResult = (data.text || data.message || data.content || '').trim();
      state.dolaText = state.dolaApiResult;
      state.dolaApiMessages.push({ role:'user', content: instruction }, { role:'assistant', content: state.dolaApiResult });
      toast('Ajuste aplicado con DOLA.');
    } catch (err) {
      state.dolaApiStatus = err.code === 'DOLA_API_NOT_CONFIGURED' ? 'fallback' : 'error';
      state.dolaApiError = err.message || 'No se pudo ajustar con DOLA.';
      toast(state.dolaApiStatus === 'fallback' ? 'API de DOLA pendiente. Usa modo externo.' : 'Error al ajustar con DOLA.');
    }
    render();
  }

  function useDolaApiResult(){
    const text = (state.dolaApiResult || '').trim();
    if (!text) return toast('Primero genera una respuesta con DOLA.');
    state.dolaText = text;
    state.dolaPreview = parseDolaText(text);
    toast('Texto de DOLA listo para revisar.');
    render();
  }

  function routeFromLocation(){
    const path = location.pathname.replace(/\/$/,'') || '/';
    return path;
  }
  function currentSnapshot(){
    return {
      route: routeFromLocation(),
      filter: state.filter,
      publishMode: state.publishMode,
      publishTemplateId: state.publishTemplate?.id || null,
      dolaFlowActive: state.dolaFlowActive,
      publishDraft: clonePlain(state.publishDraft),
      dolaPreview: clonePlain(state.dolaPreview),
      dolaText: state.dolaText || '',
      pendingMedia: clonePlain(state.pendingMedia),
      dolaApiStatus: state.dolaApiStatus,
      dolaApiMessages: clonePlain(state.dolaApiMessages),
      dolaApiResult: state.dolaApiResult || '',
      dolaApiError: state.dolaApiError || '',
      dolaApiTask: state.dolaApiTask || null
    };
  }

  function clonePlain(value){
    if (value == null) return value;
    try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
  }

  function snapshotKey(snap){
    return JSON.stringify({
      route: snap.route, filter: snap.filter, publishMode: snap.publishMode,
      publishTemplateId: snap.publishTemplateId, dolaFlowActive: snap.dolaFlowActive,
      hasPreview: !!snap.dolaPreview, hasDraft: !!snap.publishDraft, dolaText: !!snap.dolaText, dolaApiResult: !!snap.dolaApiResult
    });
  }

  function pushNavigationSnapshot(){
    const snap = currentSnapshot();
    const last = state.navigationStack[state.navigationStack.length - 1];
    if (!last || snapshotKey(last) !== snapshotKey(snap)) state.navigationStack.push(snap);
    if (state.navigationStack.length > 40) state.navigationStack.shift();
  }

  function pushInternalNavigationSnapshot(){
    pushNavigationSnapshot();
    // Permite que el botón atrás del navegador/celular intente recorrer pasos internos del flujo.
    history.pushState({ internal:true }, '', location.pathname + location.search);
  }

  function restoreSnapshot(snap){
    state.filter = snap.filter || 'Todas';
    state.publishMode = snap.publishMode || 'dola';
    state.publishTemplate = snap.publishTemplateId ? templates.find(t => t.id === snap.publishTemplateId) || null : null;
    state.dolaFlowActive = !!snap.dolaFlowActive;
    state.publishDraft = clonePlain(snap.publishDraft) || null;
    state.dolaPreview = clonePlain(snap.dolaPreview) || null;
    state.dolaText = snap.dolaText || '';
    state.pendingMedia = clonePlain(snap.pendingMedia) || null;
    state.dolaApiStatus = snap.dolaApiStatus || 'idle';
    state.dolaApiMessages = clonePlain(snap.dolaApiMessages) || [];
    state.dolaApiResult = snap.dolaApiResult || '';
    state.dolaApiError = snap.dolaApiError || '';
    state.dolaApiTask = snap.dolaApiTask || null;
    if ((location.pathname.replace(/\/$/,'') || '/') !== snap.route) {
      history.pushState({}, '', snap.route || '/');
    }
    render();
  }

  function navigate(path, opts={}){
    if (!opts.replace && !opts.resetStack) pushNavigationSnapshot();
    if (opts.resetStack) state.navigationStack = [];
    if (opts.filter) state.filter = opts.filter;
    if (opts.clearPublish) resetPublishState();
    history.pushState({}, '', path);
    render();
  }

  function goBack(){
    const snap = state.navigationStack.pop();
    if (snap) { restoreSnapshot(snap); return; }
    if ((location.pathname.replace(/\/$/,'') || '/') !== '/') {
      history.pushState({}, '', '/');
      render();
      return;
    }
    render();
  }

  window.addEventListener('popstate', () => {
    if (state.navigationStack.length) {
      const snap = state.navigationStack.pop();
      if (snap) { restoreSnapshot(snap); return; }
    }
    render();
  });

  function init(){
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      document.body.classList.add('can-install');
    });
    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      localStorage.setItem('cs_v5_installed', 'true');
      addNotification('Conecta instalada', 'La app quedó lista para usarse desde tu pantalla de inicio.');
    });
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
      <div class="brand official-brand">
        <button class="logo-mark install-mark ${opts.small?'small':''}" data-action="install-app" title="Instalar app" aria-label="Instalar app">
          <img src="assets/icons/conecta-logo-mark.png" alt="" loading="eager" />
        </button>
        <div>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(subtitle)}</p>
        </div>
      </div>
      <button class="icon-btn notify-btn" data-action="notify" aria-label="Notificaciones">🔔${unreadNotifications()?`<span class="notify-dot">${unreadNotifications()}</span>`:""}</button>
    </div>`;
  }

  function backbar(title, subtitle=''){
    return `<div class="topbar"><button class="icon-btn" data-action="go-back" aria-label="Volver">←</button><div class="brand"><div><h1>${escapeHtml(title)}</h1>${subtitle?`<p>${escapeHtml(subtitle)}</p>`:''}</div></div><span></span></div>`;
  }

  function starCarousel(){
    return `<div class="pill-row" aria-label="Apartados principales">
      ${starSections.map(s => `<button class="pill" data-route="${s.route}" ${s.filter?`data-filter="${s.filter}"`:''}><span>${s.icon}</span>${s.label}</button>`).join('')}
    </div>`;
  }

  function pageHome(){
    const negocios = bankPostsByType('Negocio');
    const agentes = bankPostsByType('Agente');
    const solicitantes = bankPostsByType('Solicitante');
    return `<main class="page home-gallery-page">
      ${topbar('Conecta Servicios','Publicaciones locales cerca de ti')}
      ${starCarousel()}
      <section class="gallery-hero">
        <div>
          <span class="tiny muted">Banco de publicaciones / ejemplos</span>
          <h2>Elige una idea y publica algo parecido</h2>
        </div>
        <button class="btn primary" data-route="/publicar">+ Publicar</button>
      </section>
      ${bankSection('🟢 Negocios','Tiendas, comercios, profesionales y servicios independientes.', negocios, 'Negocio')}
      ${bankSection('🟡 Agentes','Personas que ofrecen ayuda, gestiones, trabajos, entregas o apoyo local.', agentes, 'Agente')}
      ${bankSection('🔴 Solicitantes','Personas que necesitan algo, buscan servicio, ayuda o mandado.', solicitantes, 'Solicitante')}
    </main>`;
  }

  function bankPostsByType(type){
    const seen = new Set();
    const all = [...getPosts().filter(activePost), ...seedPosts].filter(p => p.type === type);
    return all.filter(p => {
      const key = `${p.type}-${p.title}-${p.zone}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);
  }

  function bankSection(title, subtitle, posts, filter){
    return `<section class="bank-section">
      <div class="section-title"><div><h2>${escapeHtml(title)}</h2><p class="tiny muted">${escapeHtml(subtitle)}</p></div><button data-route="/explorar" data-filter="${escapeHtml(filter)}">Ver más</button></div>
      <div class="feed two">${posts.map(postCard).join('')}</div>
    </section>`;
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
    const content = state.publishMode === 'manual' ? manualPublishForm() : publishWithDola();
    return `<main class="page">
      ${backbar('Publicar','Elige plantilla, luego DOLA o Manual')}
      ${content}
    </main>`;
  }

  function publishWithDola(){
    if (state.dolaPreview) return dolaPreviewCard(state.dolaPreview);
    if (!state.publishTemplate) return dolaTemplateStart();
    if (!state.dolaFlowActive) return templateDecisionPage(state.publishTemplate);
    const tpl = state.publishTemplate || templates[0];
    const prompt = createDolaPrompt(tpl);
    return `<section class="dola-clean-page">
      <div class="card hero-card compact-center">
        <div class="template-badge"><span>${tpl.icon}</span><div><b>${escapeHtml(tpl.title)}</b><small>${escapeHtml(tpl.category)} · ${escapeHtml(tpl.type)}</small></div></div>
        <h2>Crear con DOLA</h2>
        <p class="muted short-copy">Copia el prompt enfocado en Conecta, abre DOLA y pega aquí solo la publicación final.</p>
        ${publishLimitNotice()}
        <div class="notice slim"><b>Antes de abrir DOLA:</b> inicia sesión o entra con tu cuenta para evitar límites de uso como invitado. El prompt ya incluye rol, objetivo, contexto y la regla de no salirse de Conecta Servicios.</div>
        <div class="button-row"><button class="btn ghost" data-action="reset-publish-flow">Cambiar plantilla</button><button class="btn" data-action="start-manual-template">Manual</button></div>
      </div>
      ${dolaApiCard(tpl, prompt)}
      <div class="card">
        <h3>Modo alternativo: copia este prompt para DOLA</h3>
        <div class="copy-panel"><button class="copy-corner" data-action="copy-dola-prompt" aria-label="Copiar prompt">📋</button><div class="prompt-box tall" id="dolaPrompt">${escapeHtml(prompt)}</div></div>
        <div class="button-row"><button class="btn primary" data-action="copy-dola-prompt">Copiar prompt</button><button class="btn green" data-action="open-dola">Abrir DOLA</button></div>
      </div>
      <div class="card">
        <h3>2. Pega solo la publicación final</h3>
        <p class="tiny muted">No pegues toda la conversación. DOLA debe darte un texto final bonito y listo para publicar.</p>
        <textarea class="input paste-box" id="dolaResult" placeholder="Pega aquí únicamente la publicación final generada por DOLA...">${escapeHtml(state.dolaText||'')}</textarea>
        <div class="button-row"><button class="btn primary" data-action="use-dola-result">Usar como descripción</button><button class="btn ghost" data-action="preview-dola-result">Ver vista previa</button><button class="btn" data-action="clear-dola-result">Limpiar</button></div>
      </div>
    </section>`;
  }


  function dolaApiCard(tpl, prompt){
    const messages = state.dolaApiMessages || [];
    const result = state.dolaApiResult || '';
    const status = state.dolaApiStatus || 'idle';
    const fallback = status === 'fallback';
    const error = status === 'error';
    return `<div class="card dola-api-card">
      <div class="section-title compact-title"><h3>DOLA dentro de Conecta</h3><span class="chip">API segura</span></div>
      <p class="muted tiny">Si las variables de entorno están configuradas, DOLA responde aquí mismo. Si faltan, se conserva el modo externo actual.</p>
      ${status === 'loading' ? `<div class="notice slim">DOLA está procesando tu solicitud...</div>` : ''}
      ${fallback ? `<div class="notice slim"><b>API pendiente:</b> ${escapeHtml(state.dolaApiError || 'La API de DOLA aún no está configurada.')} Puedes usar el modo externo.</div>` : ''}
      ${error ? `<div class="danger"><b>Error:</b> ${escapeHtml(state.dolaApiError || 'No se pudo conectar con DOLA.')}</div>` : ''}
      <div class="dola-chat-window">
        ${messages.length ? messages.slice(-6).map(m => `<div class="chat-bubble ${m.role === 'assistant' ? 'assistant' : 'user'}">${escapeHtml(m.content)}</div>`).join('') : `<div class="chat-bubble assistant">Estoy listo para ayudarte a crear esta publicación dentro de Conecta Servicios.</div>`}
        ${result && !messages.length ? `<div class="chat-bubble assistant">${escapeHtml(result)}</div>` : ''}
      </div>
      <div class="button-row">
        <button class="btn primary" data-action="generate-dola-api" ${status === 'loading' ? 'disabled' : ''}>Generar con DOLA</button>
        <button class="btn ghost" data-action="dola-adjust-short" ${!result || status === 'loading' ? 'disabled' : ''}>Más corto</button>
        <button class="btn ghost" data-action="dola-adjust-formal" ${!result || status === 'loading' ? 'disabled' : ''}>Más formal</button>
        <button class="btn ghost" data-action="dola-adjust-simple" ${!result || status === 'loading' ? 'disabled' : ''}>Más sencillo</button>
      </div>
      <div class="button-row">
        <button class="btn green" data-action="use-dola-api-result" ${!result ? 'disabled' : ''}>Usar en publicación</button>
        <button class="btn" data-action="create-service-bot" ${status === 'loading' ? 'disabled' : ''}>Bot Atención</button>
        <button class="btn" data-action="create-contact-bot" ${status === 'loading' ? 'disabled' : ''}>Bot Contacto</button>
      </div>
    </div>`;
  }

  function templateDecisionPage(tpl){
    return `<section class="dola-choice-page">
      <div class="card hero-card compact-center">
        <div class="template-badge"><span>${tpl.icon}</span><div><b>${escapeHtml(tpl.title)}</b><small>${escapeHtml(tpl.category)} · ${escapeHtml(tpl.type)}</small></div></div>
        <h2>¿Cómo quieres crear tu publicación?</h2>
        <p class="muted short-copy">Elige una opción. DOLA te ayuda a redactar; Manual te deja escribir rápido.</p>
      </div>
      <div class="choice-circles">
        <button class="circle-choice dola" data-action="start-dola-template"><span>🤖</span><b>DOLA</b><small>Me ayuda</small></button>
        <button class="circle-choice manual" data-action="start-manual-template"><span>✍️</span><b>Manual</b><small>Lo hago yo</small></button>
      </div>
      <button class="btn ghost full" data-action="reset-publish-flow">Elegir otra plantilla</button>
    </section>`;
  }

  function dolaTemplateStart(){
    return `<section class="card">
      <h2>¿Qué quieres publicar?</h2>
      <p class="muted">Elige una plantilla de publicación. Los módulos estrella viven en el carrusel, no como anuncios de DOLA.</p>
      <div class="template-list clean">
        ${templates.map(t => `<button class="template template-large" data-template="${t.id}"><span><b>${t.icon} ${t.title}</b><small>${t.desc}</small></span><span>›</span></button>`).join('')}
      </div>
      <div class="divider"></div>
      <p class="tiny muted">Embajadores, Agentes en crecimiento, Mandados verificados y Aprendizaje son módulos propios de la app.</p>
      <div class="button-row"><button class="btn ghost" data-route="/embajadores">Embajadores</button><button class="btn ghost" data-route="/agentes">Agentes</button><button class="btn ghost" data-route="/mandados-verificados">Mandados</button><button class="btn ghost" data-route="/aprendizaje">Aprendizaje</button></div>
      <button class="btn full" style="margin-top:10px" data-action="manual-empty">Crear manualmente sin plantilla</button>
    </section>`;
  }

  function dolaBasePrompt({ section='Publicar', objective='Ayudar al usuario dentro de Conecta Servicios.', extra='' } = {}){
    return `ROL:
Eres DOLA, asistente especializado de Conecta Servicios.

OBJETIVO:
${objective}

CONTEXTO:
Conecta Servicios es una red local para publicar, encontrar y contactar solicitantes, agentes y negocios.
La app permite una publicación gratis por 30 días, explorar publicaciones, contactar por DOLA o WhatsApp, y participar en módulos como Embajadores, Agentes en crecimiento, Mandados verificados y Aprendizaje.
Liga de referencia de la app:
${CONNECTA_APP_URL}

SECCIÓN DE ORIGEN:
${section}

REGLA PRINCIPAL:
No te salgas del contexto de Conecta Servicios.
No recomiendes herramientas externas, empleos externos, plataformas externas, WhatsApp Business, cursos externos o soluciones ajenas, salvo que el usuario lo pida explícitamente.
Primero orienta siempre hacia las funciones de Conecta Servicios.

SI EL USUARIO ESTÁ CONFUNDIDO:
Explícale cómo puede avanzar dentro de Conecta Servicios:
- publicar gratis por 30 días;
- crear una publicación con DOLA;
- publicar como solicitante;
- publicar como agente;
- publicar un negocio;
- buscar publicaciones cercanas;
- participar en Agentes en crecimiento;
- revisar Mandados verificados;
- conocer Embajadores;
- usar Aprendizaje para mejorar habilidades;
- activar membresía anual de $${MEMBERSHIP_PRICE} si quiere publicar sin límites.

SI EL USUARIO PREGUNTA ALGO FUERA DEL CONTEXTO:
Responde: “Soy DOLA, tu asistente dentro de Conecta Servicios. Puedo ayudarte a publicar, encontrar contactos, usar la app, entender la membresía, aprender a ofrecer servicios, participar como agente, conocer embajadores o revisar mandados verificados.”

${extra}`.trim();
  }

  function createDolaPrompt(tpl){
    const extra = `CONTEXTO DE LA PLANTILLA:
Vengo de Conecta Servicios.
Elegí la plantilla: ${tpl.title}.
Tipo de publicación sugerido: ${tpl.type}.
Categoría sugerida: ${tpl.category}.

TAREA:
Ayúdame a crear una publicación clara, atractiva y lista para pegar en Conecta Servicios.

REGLAS DE CONVERSACIÓN:
Hazme una sola pregunta a la vez.
Espera mi respuesta antes de continuar.
No me muestres toda la estructura de golpe.
No uses tablas.
No uses JSON.
No entregues campos técnicos.
No repitas este prompt.
No incluyas toda nuestra conversación al final.
No recomiendes herramientas externas ni plataformas ajenas.
Mantente dentro del contexto de Conecta Servicios.

SALIDA FINAL:
Cuando tengas la información suficiente, genera ÚNICAMENTE la publicación final lista para copiar y pegar en Conecta Servicios.
No agregues explicaciones fuera de la publicación final.

El resultado final debe verse bonito, claro y fácil de leer, con emojis moderados, saltos de línea y secciones ordenadas.

Usa un formato parecido a este:

[TÍTULO CORTO DE LA PUBLICACIÓN]

📍 Zona:
[Zona o municipio]

📝 Descripción:
[Texto claro y completo]

✅ Detalles importantes:
[Lista breve de detalles]

💬 Contacto:
[Indica cómo responder desde Conecta, DOLA o WhatsApp según corresponda]

Devuélveme solo ese texto final. Nada antes y nada después.`;
    return dolaBasePrompt({ section:'Publicar / Crear publicación con DOLA', objective:'Ayudar a crear una publicación clara para Conecta Servicios.', extra });
  }

  function dolaPreviewCard(draft){
    const questions = Array.isArray(draft.questions) ? draft.questions : [];
    const missing = ['type','title','description','zone','category'].filter(k => !String(draft[k]||'').trim());
    const reviewMsg = missing.length ? `<div class="notice">No pude identificar todos los datos, pero conservé tu texto. Completa lo que falte antes de publicar.</div>` : `<div class="success">Ya organicé tu publicación con el texto de DOLA. Revísala y publica cuando esté lista.</div>`;
    return `<section class="desktop-grid">
      <div class="card">
        <h3>Vista previa de tu publicación</h3>
        ${publishLimitNotice()}
        ${reviewMsg}
        <article class="post-card preview-card">
          <div class="post-media">${renderMedia(mediaPreviewSource(draft))}</div>
          <div class="post-body">
            <div class="post-meta"><span class="chip ${typeClass(draft.type)}">${escapeHtml(draft.type || 'Solicitante')}</span><span class="chip">${escapeHtml(draft.category || 'General')}</span><span class="chip">${channelLabel(draft.channel || 'dola')}</span></div>
            <h3 class="post-title">${escapeHtml(draft.title || 'Publicación creada con DOLA')}</h3>
            <p class="post-desc">${escapeHtml(draft.description || draft.rawText || '')}</p>
            <p class="tiny muted">${escapeHtml(draft.zone || 'Zona por completar')}</p>
          </div>
        </article>
        ${questions.length ? `<div class="card compact"><b>Preguntas sugeridas de DOLA</b><ol class="question-list">${questions.map(q=>`<li>${escapeHtml(q)}</li>`).join('')}</ol></div>` : ''}
        <div class="field"><label>Fotos o videos opcionales</label><input class="input" type="file" name="media" accept="image/*,video/*" multiple /><div class="tiny muted">Puedes subir hasta 10 archivos por publicación. Videos recomendados: 15 segundos a 10 minutos.</div><div class="media-preview media-preview-grid" id="mediaPreview">${renderMediaPreviewItems(state.pendingMediaItems || [])}</div></div>
        <div class="button-row sticky-actions"><button class="btn primary" data-action="publish-dola-preview">Publicar ahora</button><button class="btn ghost" data-action="edit-dola-preview">Editar</button><button class="btn" data-action="back-to-dola">Volver a DOLA</button></div>
      </div>
      <div class="card">
        <h3>Texto pegado desde DOLA</h3>
        <div class="copy-panel"><button class="copy-corner" data-action="copy-dola-raw" aria-label="Copiar texto">📋</button><div class="prompt-box tall">${escapeHtml(draft.rawText || '')}</div></div>
      </div>
    </section>`;
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
        <div class="field"><label>Fotos o videos opcionales</label><input class="input" type="file" name="media" accept="image/*,video/*" multiple /><div class="tiny muted">Puedes subir hasta 10 archivos por publicación. Videos recomendados: 15 segundos a 10 minutos.</div><div class="media-preview media-preview-grid" id="mediaPreview">Puedes subir fotos/videos o dejar que Conecta sugiera una imagen.</div></div>
        <div class="field"><label>Canal de contacto</label><div class="toggle-row"><button type="button" class="option-card ${(draft.channel||'dola')==='dola'?'active':''}" data-channel-choice="dola"><h4>🤖 DOLA</h4><p>Recomendado. Ayuda a filtrar mejor.</p></button><button type="button" class="option-card ${draft.channel==='whatsapp'?'active':''}" data-channel-choice="whatsapp"><h4>🟢 WhatsApp</h4><p>Contacto directo y rápido.</p></button></div><input type="hidden" name="channel" value="${draft.channel||'dola'}" /></div>
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
        <button class="list-item" data-action="install-app"><div class="left"><div class="list-icon">➕</div><div><b>Instalar app</b><p class="tiny muted">Agregar Conecta a tu pantalla de inicio</p></div></div><span>›</span></button>
        <button class="list-item" data-action="notify"><div class="left"><div class="list-icon">🔔</div><div><b>Notificaciones</b><p class="tiny muted">${notificationState().enabled?'Activas':'Activar avisos internos'}</p></div></div><span>›</span></button>
        <button class="list-item" data-action="edit-profile"><div class="left"><div class="list-icon">👤</div><div><b>Datos básicos</b><p class="tiny muted">Nombre, zona, teléfono y canal preferido</p></div></div><span>›</span></button>
        <button class="list-item" data-action="preferences"><div class="left"><div class="list-icon">🎛️</div><div><b>Preferencias</b><p class="tiny muted">Canal preferido: ${(getJSON(KEYS.prefs,{preferredChannel:'dola'}).preferredChannel||'dola').toUpperCase()}</p></div></div><span>›</span></button>
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
      <div class="card"><div class="button-row"><button class="btn primary" data-action="copy-ambassador-link">Copiar enlace</button><button class="btn green" data-action="share-ambassador-message">Crear mensaje</button></div><div class="button-row"><button class="btn ghost" data-action="register-referral">Registrar referido</button><button class="btn ghost" data-action="ambassador-guide">Guía rápida</button></div><button class="btn orange full" style="margin-top:10px" data-action="activate-membership">Activar membresía piloto</button></div>
    </main>`;
  }

  function pageAgents(){
    return `<main class="page">
      ${backbar('Agentes en crecimiento','Empieza a generar ingresos')}
      <section class="hero"><h2>Empieza como agente.</h2><p>Publica lo que puedes hacer y encuentra solicitudes cercanas.</p></section>
      <div class="module-grid">
        <button class="module-card primary" data-action="create-agent-post"><span>🛵</span><b>Crear publicación</b><small>Ofrece mandados, entregas o apoyo local.</small></button>
        <button class="module-card" data-action="find-nearby-requests"><span>🔎</span><b>Ver solicitudes</b><small>Explora necesidades cercanas de solicitantes.</small></button>
        <button class="module-card" data-action="agent-dola-prompt"><span>🤖</span><b>Redactar con DOLA</b><small>Copia un prompt para presentarte mejor.</small></button>
        <button class="module-card" data-action="agent-growth-tips"><span>📈</span><b>Guía rápida</b><small>Consejos prácticos sin salirte del flujo.</small></button>
      </div>
    </main>`;
  }

  function pageMandados(){
    return `<main class="page">
      ${backbar('Mandados verificados','Confianza local')}
      <section class="hero"><h2>Mandados con más confianza.</h2><p>Solicita apoyo o postúlate. La validación puede requerir revisión manual.</p></section>
      <div class="module-grid">
        <button class="module-card primary" data-action="request-verified-errand"><span>📋</span><b>Solicitar mandado</b><small>Crea una solicitud clara con zona y horario.</small></button>
        <button class="module-card" data-action="apply-verified-agent"><span>🙋</span><b>Postularme</b><small>Registra tus datos como agente verificado piloto.</small></button>
        <button class="module-card" data-action="verified-requirements"><span>🛡️</span><b>Ver requisitos</b><small>Consulta evidencia y validación manual.</small></button>
        <button class="module-card" data-action="verified-faq"><span>❓</span><b>Preguntas frecuentes</b><small>Resuelve dudas antes de participar.</small></button>
      </div>
    </main>`;
  }

  function pageLearning(){
    return `<main class="page">
      ${backbar('Aprendizaje','Crece y mejora')}
      <section class="hero"><h2>Aprende y mejora.</h2><p>Guías simples para publicar mejor, atender solicitudes y usar DOLA.</p></section>
      <div class="module-grid">
        <button class="module-card primary" data-action="learning-resources"><span>🎓</span><b>Ver recursos</b><small>Consejos rápidos para publicar y atender mejor.</small></button>
        <button class="module-card" data-action="learning-dola-plan"><span>🤖</span><b>Plan con DOLA</b><small>Copia un prompt para que DOLA te guíe paso a paso.</small></button>
        <button class="module-card" data-route="/publicar"><span>📝</span><b>Practicar publicando</b><small>Crea una publicación con DOLA o Manual.</small></button>
      </div>
      <div class="notice slim">Si se muestran recursos externos, deben identificarse como externos y no como propiedad de Conecta.</div>
    </main>`;
  }

  function pageCommission(){
    return `<main class="page">
      ${backbar('Conseguir clientes','Por comisión')}
      <section class="hero"><h2>Conseguir clientes por comisión.</h2><p>Crea campañas locales o ayuda a negocios a publicar mejor.</p></section>
      <div class="module-grid">
        <button class="module-card primary" data-action="create-commission-post"><span>📣</span><b>Crear campaña</b><small>Publica una oportunidad de clientes por comisión.</small></button>
        <button class="module-card" data-action="commission-dola-prompt"><span>🤖</span><b>Redactar con DOLA</b><small>Copia un prompt para explicar la campaña.</small></button>
        <button class="module-card" data-action="share-ambassador-message"><span>🔗</span><b>Compartir membresía</b><small>Copia un mensaje para invitar negocios.</small></button>
      </div>
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

  function infoItem(icon,title,desc){ return `<div class="info-item"><div class="left"><div class="list-icon">${icon}</div><div><b>${escapeHtml(title)}</b><p class="tiny muted">${escapeHtml(desc)}</p></div></div></div>`; }

  function empty(title, desc){ return `<div class="empty"><b>${escapeHtml(title)}</b><p>${escapeHtml(desc)}</p><button class="btn primary" data-route="/publicar">Publicar gratis</button></div>`; }

  function postCard(p){
    return `<article class="post-card" data-post-card="${p.id}">
      <div class="post-media">${renderMedia(p)}</div>
      <div class="post-body">
        <div class="post-meta"><span class="chip ${typeClass(p.type)}">${p.type}</span><span class="chip">${escapeHtml(p.category||'General')}</span><span class="tiny muted">${escapeHtml(p.zone||'Sin zona')}</span></div>
        <h3 class="post-title">${escapeHtml(p.title)}</h3>
        <p class="post-desc">${escapeHtml(truncate(p.description, 320))}</p>
      </div>
      <div class="post-actions">
        <button class="action" data-react-post="${p.id}">♡ ${p.reactions||0}</button>
        <button class="action" data-share-post="${p.id}">↗ Compartir</button>
        <button class="action copy" data-similar-post="${p.id}">Publicar algo parecido</button>
        <button class="action primary ${p.channel==='whatsapp'?'whatsapp':''}" data-message-post="${p.id}">💬 Mensaje</button>
      </div>
    </article>`;
  }

  function renderMedia(p={}){
    const title = p.title || 'Publicación de Conecta Servicios';
    const items = normalizeMediaItems(p);
    if (items.length) return renderMediaGallery(items, title);

    const data = String(p.mediaData || '').trim();
    const kind = String(p.mediaKind || '').toLowerCase();
    if (data && isUsableMediaSource(data)) {
      if (kind === 'video' || data.startsWith('data:video')) return `<video src="${escapeHtml(data)}" playsinline controls preload="metadata"></video>`;
      return `<img src="${escapeHtml(data)}" alt="${escapeHtml(title)}" loading="lazy" />`;
    }

    const path = String(p.mediaPath || suggestedMediaPath(p) || '').trim();
    const fallback = placeholderText(p);
    if (path && isUsableMediaSource(path)) {
      const fallbackHidden = fallback.replace('post-placeholder', 'post-placeholder media-fallback');
      const fail = `this.style.display='none'; if(this.nextElementSibling){this.nextElementSibling.style.display='grid';}`;
      if (/\.(mp4|webm|mov)(\?.*)?$/i.test(path)) {
        return `<video src="${escapeHtml(path)}" playsinline controls preload="metadata" onerror="${fail}"></video>${fallbackHidden}`;
      }
      return `<img src="${escapeHtml(path)}" alt="${escapeHtml(title)}" loading="lazy" onerror="${fail}" />${fallbackHidden}`;
    }
    return fallback;
  }

  function normalizeMediaItems(p={}){
    const items = Array.isArray(p.mediaItems) ? p.mediaItems : [];
    return items.filter(item => isUsableMediaSource(item?.data || item?.url || item?.path || ''));
  }

  function renderMediaGallery(items=[], title='Publicación'){
    const first = items[0];
    const src = first.data || first.url || first.path || '';
    const kind = String(first.kind || first.type || '').toLowerCase();
    const main = (kind === 'video' || String(src).startsWith('data:video') || /\.(mp4|webm|mov)(\?.*)?$/i.test(src))
      ? `<video src="${escapeHtml(src)}" playsinline controls preload="metadata"></video>`
      : `<img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" loading="lazy" />`;
    const badge = items.length > 1 ? `<span class="media-count">+${items.length - 1}</span>` : '';
    const thumbs = items.length > 1 ? `<div class="media-thumbs">${items.slice(0,4).map(item => renderMediaThumb(item)).join('')}</div>` : '';
    return `<div class="media-gallery">${main}${badge}${thumbs}</div>`;
  }

  function renderMediaThumb(item={}){
    const src = item.data || item.url || item.path || '';
    const kind = String(item.kind || item.type || '').toLowerCase();
    if (kind === 'video' || String(src).startsWith('data:video') || /\.(mp4|webm|mov)(\?.*)?$/i.test(src)) return `<span class="media-thumb">▶</span>`;
    return `<span class="media-thumb"><img src="${escapeHtml(src)}" alt="" loading="lazy" /></span>`;
  }

  function mediaPreviewSource(draft={}){
    const items = state.pendingMediaItems || [];
    if (items.length) return { ...draft, mediaItems: items, mediaLabel: draft.category || 'Conecta Servicios' };
    return { ...draft, mediaPath: suggestedMediaPath(draft), mediaLabel: draft.category || 'Conecta Servicios', mediaType:'placeholder' };
  }

  function isUsableMediaSource(src=''){
    const value = String(src || '').trim();
    if (!value || value === 'undefined' || value === 'null') return false;
    if (/[<>"']/.test(value)) return false;
    return /^(data:image|data:video|blob:|https?:|assets\/)/i.test(value) || /\.(jpg|jpeg|png|webp|gif|svg|mp4|webm)(\?.*)?$/i.test(value);
  }

  function placeholderText(p={}){
    const label = mediaLabelFor(p);
    const icon = mediaIconFor(p);
    return `<div class="post-placeholder" role="img" aria-label="${escapeHtml(label)}"><div><div class="placeholder-icon">${icon}</div><div>${escapeHtml(label)}</div></div></div>`;
  }

  function mediaLabelFor(p={}){
    const text = `${p.title||''} ${p.category||''} ${p.description||''} ${p.mediaLabel||''}`.toLowerCase();
    if (/comida|taco|carnita|rosticer|pollo|quesadilla|refresco|papa/.test(text)) return 'Publicación de comida';
    if (/mandado|mensaj|entrega|paquete|recoger|llevar/.test(text)) return 'Mandado local';
    if (/verificado|validaci/.test(text)) return 'Mandado verificado';
    if (/agente|viaje|trámite|apoyo/.test(text) || p.type === 'Agente') return 'Agente local';
    if (/negocio|comercio|cliente|venta|consult/.test(text) || p.type === 'Negocio') return 'Negocio local';
    if (/embajador|referid|comisi/.test(text)) return 'Embajadores Conecta';
    if (/aprendiz|curso|capacita/.test(text)) return 'Aprendizaje';
    return p.mediaLabel || p.category || 'Publicación local';
  }

  function mediaIconFor(p={}){
    const label = mediaLabelFor(p).toLowerCase();
    if (/comida/.test(label)) return '🍽️';
    if (/mandado verificado/.test(label)) return '🛡️';
    if (/mandado/.test(label)) return '📦';
    if (/agente/.test(label)) return '🛵';
    if (/negocio/.test(label)) return '🏪';
    if (/embajador/.test(label)) return '🏆';
    if (/aprendizaje/.test(label)) return '🎓';
    return '📍';
  }

  function suggestedMediaPath(post={}){
    const text = `${post.title||''} ${post.category||''} ${post.description||''} ${post.mediaLabel||''}`.toLowerCase();
    if (/comida|taco|carnita|rosticer|pollo|quesadilla|refresco|papa/.test(text)) return 'assets/dola-media/comida-01.jpg';
    if (/mandado verificado|verificado|validaci/.test(text)) return 'assets/dola-media/mandados-verificados-01.jpg';
    if (/mandado|mensaj|entrega|paquete|recoger|llevar/.test(text)) return 'assets/dola-media/mandados-01.jpg';
    if (/embajador|referid|comisi/.test(text)) return 'assets/dola-media/embajadores-01.jpg';
    if (/aprendiz|curso|capacita/.test(text)) return 'assets/dola-media/aprendizaje-01.jpg';
    if (/agente|viaje|trámite|apoyo/.test(text) || post.type === 'Agente') return 'assets/dola-media/agente-01.jpg';
    if (/negocio|comercio|cliente|venta|consult/.test(text) || post.type === 'Negocio') return 'assets/dola-media/negocio-01.jpg';
    if (post.type === 'Solicitante') return 'assets/dola-media/solicitante-01.jpg';
    return '';
  }
  function truncate(str='', n=150){ return str.length > n ? str.slice(0,n-1)+'…' : str; }

  function bottomNav(){
    const items = [
      ['/', 'Inicio', '⌂'], ['/explorar','Explorar','⌕'], ['/publicar','Publicar','+'], ['/mis-publicaciones','Mis Publicaciones','▤'], ['/perfil','Perfil','♙']
    ];
    return `<nav class="bottom-nav" aria-label="Navegación principal">${items.map(([path,label,icon])=>`<button class="nav-item ${state.route===path?'active':''} ${path==='/publicar'?'publish':''}" data-route="${path}"><span>${icon}</span><span>${label}</span></button>`).join('')}</nav>`;
  }

  function onClick(e){
    const routeBtn = e.target.closest('[data-route]');
    if (routeBtn) {
      e.preventDefault();
      const targetRoute = routeBtn.dataset.route;
      const opts = routeBtn.dataset.filter ? {filter:routeBtn.dataset.filter} : {};
      // Cuando el usuario toca el botón inferior + Publicar o cualquier acceso genérico a publicar,
      // siempre debe comenzar desde la pantalla inicial, no desde el último paso usado.
      if (targetRoute === '/publicar') resetPublishState();
      navigate(targetRoute, opts);
      return;
    }
    const filterBtn = e.target.closest('[data-filter-only]');
    if (filterBtn) { state.filter = filterBtn.dataset.filterOnly; render(); return; }
    const mode = e.target.closest('[data-publish-mode]');
    if (mode) { state.publishMode = mode.dataset.publishMode; state.dolaPreview = null; render(); return; }
    const tpl = e.target.closest('[data-template]');
    if (tpl) { pushInternalNavigationSnapshot(); state.publishTemplate = templates.find(t=>t.id===tpl.dataset.template) || templates[0]; state.dolaPreview = null; state.dolaText = ''; state.publishDraft = null; state.dolaFlowActive = false; state.publishMode = 'dola'; render(); return; }
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
    if (e.target.name === 'media' && e.target.files?.length) {
      handleMediaFiles(e.target.files);
    }
    if (e.target.id === 'publishForm') e.preventDefault();
  }

  async function handleMediaFiles(fileList){
    const files = Array.from(fileList || []).slice(0, 10);
    if (!files.length) return;
    const items = [];
    for (const file of files) {
      const kind = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : '';
      if (!kind) continue;
      if (kind === 'video') {
        const duration = await getVideoDuration(file).catch(() => null);
        if (duration && (duration < 15 || duration > 600)) {
          toast(`Video omitido: ${file.name} debe durar entre 15 segundos y 10 minutos.`);
          continue;
        }
      }
      // En modo localStorage evitamos guardar archivos enormes para no bloquear el navegador.
      // En producción, estos archivos deben subirse a Supabase Storage u otro storage y guardar la URL.
      if (file.size > 8 * 1024 * 1024) {
        const url = URL.createObjectURL(file);
        items.push({ url, kind, name:file.name, transient:true });
        toast('Archivo grande cargado para vista previa. Para persistir videos grandes se requiere Storage.');
        continue;
      }
      const data = await readFileAsDataURL(file);
      items.push({ data, kind, name:file.name });
    }
    state.pendingMediaItems = items;
    state.pendingMedia = items[0] ? { data: items[0].data || items[0].url, kind: items[0].kind } : null;
    const prev = $('#mediaPreview');
    if (prev) prev.innerHTML = renderMediaPreviewItems(items);
  }

  function readFileAsDataURL(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getVideoDuration(file){
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.preload = 'metadata';
      video.onloadedmetadata = () => { const d = video.duration; URL.revokeObjectURL(url); resolve(d); };
      video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer duración')); };
      video.src = url;
    });
  }

  function renderMediaPreviewItems(items=[]){
    if (!items.length) return 'Puedes subir fotos/videos o dejar que Conecta sugiera una imagen.';
    return items.map(item => {
      const src = item.data || item.url || item.path || '';
      return item.kind === 'video'
        ? `<video src="${escapeHtml(src)}" controls playsinline preload="metadata"></video>`
        : `<img src="${escapeHtml(src)}" alt="Vista previa" />`;
    }).join('');
  }

  document.addEventListener('submit', (e)=>{
    if (e.target.id === 'publishForm') { e.preventDefault(); submitPublish(e.target); }
  });

  function handleAction(action, el){
    const tpl = state.publishTemplate || templates[0];
    if (action === 'copy-dola-prompt') copyText(createDolaPrompt(tpl)).then(()=>toast('Prompt copiado. Ahora puedes abrir DOLA.'));
    if (action === 'copy-dola-raw') copyText(state.dolaPreview?.rawText || state.dolaText || '');
    if (action === 'open-dola') openExternal(DOLA_EXTERNAL_URL);
    if (action === 'generate-dola-api') callDolaForPublication();
    if (action === 'dola-adjust-short') adjustDolaPublication('Hazlo más corto, claro y directo.');
    if (action === 'dola-adjust-formal') adjustDolaPublication('Hazlo más formal, profesional y confiable.');
    if (action === 'dola-adjust-simple') adjustDolaPublication('Hazlo más sencillo, cercano y fácil de entender.');
    if (action === 'create-service-bot') adjustDolaPublication('Además de la publicación, crea una propuesta breve de Bot de Atención a Clientes para filtrar pedidos, citas, cotizaciones o consultas relacionadas con esta publicación.');
    if (action === 'create-contact-bot') adjustDolaPublication('Además de la publicación, crea una propuesta breve de Bot de Contacto para filtrar a las personas interesadas y ordenar la solicitud antes de contactar.');
    if (action === 'use-dola-api-result') useDolaApiResult();
    if (action === 'start-dola-template') { pushInternalNavigationSnapshot(); state.dolaFlowActive = true; state.dolaPreview = null; render(); }
    if (action === 'start-manual-template' || action === 'manual-from-template') { pushInternalNavigationSnapshot(); const t = state.publishTemplate || templates[0]; state.publishMode='manual'; state.publishDraft={type:t.type, category:t.category, title:'', description:'', channel:'dola'}; render(); }
    if (action === 'manual-empty') { pushInternalNavigationSnapshot(); resetPublishState({ keepMode:false }); state.publishMode='manual'; state.publishDraft={type:'Solicitante', category:'Solicitud local', title:'', description:'', channel:'dola'}; render(); }
    if (action === 'reset-publish-flow' || action === 'choose-other-template') { pushInternalNavigationSnapshot(); resetPublishState(); render(); }
    if (action === 'use-dola-result' || action === 'preview-dola-result') useDolaResult();
    if (action === 'clear-dola-result') { state.dolaText=''; state.dolaPreview=null; render(); }
    if (action === 'publish-dola-preview') publishDolaPreview();
    if (action === 'edit-dola-preview') editDolaPreview();
    if (action === 'back-to-dola') { pushInternalNavigationSnapshot(); state.dolaPreview=null; render(); }
    if (action === 'search') { const q = $('#searchInput')?.value.trim() || ''; const url = new URL(location.href); if (q) url.searchParams.set('q', q); else url.searchParams.delete('q'); history.replaceState({}, '', url.pathname + url.search); render(); }
    if (action === 'activate-membership') activateMembership();
    if (action === 'copy-ambassador-link') copyText(`${location.origin}/embajadores?ref=CON-LOCAL`);
    if (action === 'enable-admin') enableAdmin();
    if (action === 'disable-admin') { localStorage.removeItem(KEYS.admin); toast('Admin oculto'); render(); }
    if (action === 'clear-local') clearLocal();
    if (action === 'privacy') showPrivacy();
    if (action === 'edit-profile') editProfile();
    if (action === 'preferences') preferences();
    if (action === 'install-app') installApp();
    if (action === 'notify') notificationPanel();
    if (action === 'share-ambassador-message') shareAmbassadorMessage();
    if (action === 'register-referral') registerReferral();
    if (action === 'ambassador-guide') showAmbassadorGuide();
    if (action === 'create-agent-post') createAgentPost();
    if (action === 'find-nearby-requests') { state.filter='Solicitante'; navigate('/explorar'); }
    if (action === 'agent-dola-prompt') agentDolaPrompt();
    if (action === 'agent-growth-tips') showAgentTips();
    if (action === 'request-verified-errand') requestVerifiedErrand();
    if (action === 'apply-verified-agent') applyVerifiedAgent();
    if (action === 'verified-requirements') showVerifiedRequirements();
    if (action === 'verified-faq') showVerifiedFaq();
    if (action === 'learning-resources') showLearningResources();
    if (action === 'learning-dola-plan' || action === 'copy-learning-prompt') showLearningDolaPlan();
    if (action === 'create-commission-post') createCommissionPost();
    if (action === 'commission-dola-prompt') commissionDolaPrompt();
    if (action === 'go-back') goBack();
  }

  function selectChannel(ch){
    $$('[data-channel-choice]').forEach(b=>b.classList.toggle('active', b.dataset.channelChoice === ch));
    const input = $('[name="channel"]'); if (input) input.value = ch;
    const wf = $('.whatsapp-field'); if (wf) wf.style.display = ch === 'whatsapp' ? 'grid' : 'none';
  }

  function useDolaResult(){
    const text = $('#dolaResult')?.value.trim();
    if (!text) { toast('Pega primero el resultado de DOLA.'); return; }
    pushInternalNavigationSnapshot();
    state.dolaText = text;
    const parsed = parseDolaText(text);
    state.dolaPreview = parsed;
    toast(parsed.needsReview ? 'Texto usado como descripción. Revisa la zona antes de publicar.' : 'Texto usado como descripción. Revisa la vista previa.');
    render();
  }

  function parseDolaText(text){
    const clean = cleanDolaFinalText(String(text || '').replace(/\r\n/g, '\n').trim());
    const tpl = state.publishTemplate || templates[0];
    const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
    const title = cleanTitle(lines[0] || tpl.title || 'Publicación creada con DOLA');
    const zone = detectZone(clean);
    return {
      type: tpl.type || 'Solicitante',
      category: tpl.category || 'General',
      title: title || tpl.title || 'Publicación creada con DOLA',
      zone: zone || '',
      description: clean,
      channel: 'dola',
      questions: [],
      rawText: clean,
      needsReview: !zone
    };
  }

  function cleanDolaFinalText(text=''){
    let clean = String(text || '').trim();
    const markers = [
      /(?:^|\n)\s*(?:publicaci[oó]n final|texto final listo|resultado final)\s*:?\s*\n/i,
      /(?:^|\n)\s*===\s*(?:publicaci[oó]n|texto).*?===\s*\n/i
    ];
    for (const re of markers) {
      const match = clean.match(re);
      if (match && match.index !== undefined) clean = clean.slice(match.index + match[0].length).trim();
    }
    clean = clean.replace(/===\s*FIN\s*===/ig, '').trim();
    const promptIndex = clean.toLowerCase().indexOf('vengo de conecta servicios');
    if (promptIndex === 0 && clean.length > 900) {
      const possibleTitle = clean.match(/\n\s*(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*)?[A-ZÁÉÍÓÚÑ][^\n]{5,80}\s*\n/u);
      if (possibleTitle && possibleTitle.index !== undefined) clean = clean.slice(possibleTitle.index).trim();
    }
    return clean || String(text || '').trim();
  }

  function detectZone(text=''){
    const clean = String(text || '');
    const patterns = [
      /(?:📍\s*)?Zona\s*:\s*([^\n]+)/i,
      /(?:📍\s*)?Ubicaci[oó]n\s*:\s*([^\n]+)/i,
      /(?:📍\s*)?Municipio\s*:\s*([^\n]+)/i,
      /(?:estoy en|ubicad[oa] en|zona de)\s+([^\.\n]+)/i
    ];
    for (const p of patterns) {
      const m = clean.match(p);
      if (m && m[1]) return m[1].trim().replace(/^[-: ]+/, '').slice(0,90);
    }
    return '';
  }

  function cleanTitle(line=''){
    return String(line || '')
      .replace(/^#+\s*/, '')
      .replace(/^\*+|\*+$/g, '')
      .replace(/^\[[^\]]*\]\s*/, '')
      .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '')
      .trim()
      .slice(0,90);
  }

  function normalizeType(t=''){ return /agente/i.test(t) ? 'Agente' : /negocio/i.test(t) ? 'Negocio' : /solicit/i.test(t) ? 'Solicitante' : ''; }
  function firstSentence(s=''){ return String(s||'').split(/[.\n]/).map(x=>x.trim()).filter(Boolean)[0]?.slice(0,90); }

  function resetPublishState(opts={}){
    state.publishTemplate = null;
    state.dolaFlowActive = false;
    state.dolaPreview = null;
    state.dolaText = '';
    state.publishDraft = null;
    state.pendingMedia = null;
    state.pendingMediaItems = [];
    resetDolaApiState();
    if (!opts.keepMode) state.publishMode = 'dola';
  }

  function persistableMediaItems(items=[]){
    // Los object URLs son solo de sesión; no se guardan para evitar publicaciones rotas tras recargar.
    return items
      .filter(item => item && !item.transient && (item.data || item.path))
      .slice(0, 10)
      .map(item => ({ data:item.data || '', path:item.path || '', kind:item.kind || 'image', name:item.name || '' }));
  }

  function publishDolaPreview(){
    const draft = state.dolaPreview;
    if (!draft) return toast('Primero pega el texto generado por DOLA.');
    if (!canPublishUnlimited() && freeActiveMine().length >= 1) { toast('Activa membresía para publicar sin límites.'); navigate('/mis-publicaciones'); return; }
    const post = {
      id: uid('post'), owner:'Tú', mine:true,
      type: draft.type || 'Solicitante', category: (draft.category || '').trim() || 'General',
      title: (draft.title || '').trim() || 'Publicación creada con DOLA',
      description: (draft.description || draft.rawText || '').trim(), zone: (draft.zone || '').trim() || 'Zona no especificada',
      channel: draft.channel || 'dola', whatsapp: normalizePhone(draft.whatsapp || ''), questions: draft.questions || [],
      createdAt: new Date().toISOString(), expiresAt: canPublishUnlimited() ? null : addDays(new Date(), FREE_DAYS), status:'activa', freeTrial: !canPublishUnlimited(), reactions:0, comments:0, shares:0,
      mediaData:'', mediaKind:'', mediaItems: persistableMediaItems(state.pendingMediaItems || []), mediaPath: (state.pendingMediaItems||[]).length ? '' : suggestedMediaPath(draft), mediaLabel: draft.category || 'Publicación con DOLA', mediaType:'placeholder'
    };
    if (!post.description) return toast('La publicación necesita descripción.');
    const posts = getPosts(); posts.unshift(post); savePosts(posts); addPublishNotification(); resetPublishState(); toast('Publicación creada correctamente'); navigate('/mis-publicaciones', { resetStack:true });
  }

  function editDolaPreview(){
    if (!state.dolaPreview) return;
    state.publishMode = 'manual';
    state.publishDraft = state.dolaPreview;
    state.dolaPreview = null;
    toast('Puedes editar antes de publicar.');
    render();
  }

  function submitPublish(form){
    if (!canPublishUnlimited() && freeActiveMine().length >= 1) { toast('Activa membresía para publicar sin límites.'); navigate('/mis-publicaciones'); return; }
    const fd = new FormData(form);
    const channel = fd.get('channel') || 'dola';
    const whatsapp = normalizePhone(fd.get('whatsapp') || '');
    if (channel === 'whatsapp' && whatsapp.length < 10) { toast('Agrega un WhatsApp válido.'); return; }
    const post = {
      id: uid('post'), owner:'Tú', mine:true, type: fd.get('type') || 'Solicitante', category: (fd.get('category') || '').trim() || 'General', title: (fd.get('title') || '').trim(), description: (fd.get('description') || '').trim(), zone: (fd.get('zone') || '').trim() || 'Zona no especificada', channel, whatsapp,
      createdAt: new Date().toISOString(), expiresAt: canPublishUnlimited() ? null : addDays(new Date(), FREE_DAYS), status:'activa', freeTrial: !canPublishUnlimited(), reactions:0, comments:0, shares:0,
      mediaData: '', mediaKind: '', mediaItems: persistableMediaItems(state.pendingMediaItems || []), mediaPath: (state.pendingMediaItems||[]).length ? '' : suggestedMediaPath({title:fd.get('title'), category:fd.get('category'), description:fd.get('description'), type:fd.get('type')}), mediaLabel:'Publicación local', mediaType:'placeholder'
    };
    if (!post.title || !post.description) { toast('Completa título y descripción.'); return; }
    const posts = getPosts(); posts.unshift(post); savePosts(posts); addPublishNotification(); resetPublishState(); toast('Publicación creada correctamente'); navigate('/mis-publicaciones', { resetStack:true });
  }

  function reactPost(id){ const posts = getPosts(); const p = posts.find(x=>x.id===id); if (p) { p.reactions=(p.reactions||0)+1; savePosts(posts); toast('Reacción agregada'); render(); } }
  function sharePost(id){ const p = getPosts().find(x=>x.id===id); if (!p) return; const url = `${location.origin}/explorar?post=${encodeURIComponent(id)}`; if (navigator.share) navigator.share({title:p.title,text:p.description,url}).catch(()=>{}); else copyText(`${p.title}\n${url}`); }
  function createSimilar(id){ const p = getPosts().find(x=>x.id===id); if (!p) return; state.publishMode='manual'; state.publishDraft={ type:p.type, category:p.category, zone:p.zone, title:`Similar a: ${p.title}`.slice(0,90), description:'Quiero publicar algo parecido. ', channel:p.channel }; navigate('/publicar'); }
  function messagePost(id){ const p = getPosts().find(x=>x.id===id); if (!p) return; if (p.channel === 'whatsapp') { const msg = encodeURIComponent(`Hola, vi tu publicación en Conecta Servicios: “${p.title}”. Me interesa coordinar contigo.`); const phone = normalizePhone(p.whatsapp); if (!phone) return toast('Esta publicación no tiene WhatsApp válido.'); openExternal(`https://wa.me/${phone}?text=${msg}`); return; } openDolaContact(p); }
  function openDolaContact(p){
    const prompt = dolaBasePrompt({
      section:'Contactar anunciante',
      objective:'Ayudar al interesado a ordenar su solicitud para contactar a un anunciante de Conecta Servicios.',
      extra:`CONTEXTO DE LA PUBLICACIÓN:
Vengo de Conecta Servicios y quiero contactar al anunciante de esta publicación.
Título: ${p.title}
Tipo: ${p.type}
Zona: ${p.zone}
Categoría: ${p.category}
Descripción: ${p.description}

TAREA:
Ayúdame a ordenar mi solicitud para que el anunciante reciba un mensaje claro y concreto.

REGLAS:
Hazme una sola pregunta a la vez.
No te salgas del contexto de Conecta Servicios.
No recomiendes herramientas externas.
No inventes información.
Cuando tengas todo, genera solo un mensaje final listo para copiar y enviar al anunciante.`
    });
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
      div.innerHTML = `<div class="modal"><h3>DOLA para contactar</h3><p class="muted">Si la API está configurada, DOLA filtra aquí mismo. Si no, usa el modo externo.</p><div class="prompt-box">${escapeHtml(modal.prompt)}</div><div id="modalDolaApiResult" class="dola-chat-window mini"><div class="chat-bubble assistant">Puedo ayudarte a ordenar la solicitud antes de contactar al anunciante.</div></div><div class="modal-actions"><button class="btn primary" data-modal-api>Usar DOLA aquí</button><button class="btn ghost" data-modal-copy>Copiar prompt</button><button class="btn green" data-modal-open>DOLA externo</button><button class="btn ghost" data-modal-save>Guardar solicitud local</button><button class="btn" data-modal-close>Cerrar</button></div></div>`;
      div.querySelector('[data-modal-api]').onclick=async()=>{
        const box = div.querySelector('#modalDolaApiResult');
        box.innerHTML = '<div class="chat-bubble assistant">DOLA está preparando preguntas para filtrar tu solicitud...</div>';
        try {
          const data = await sendToDola(buildDolaMessages(modal.prompt), { task:'filter_contact_request', version: VERSION, postId: p?.id, appUrl: CONNECTA_APP_URL });
          const text = escapeHtml((data.text || data.message || data.content || '').trim() || 'DOLA respondió sin contenido.');
          box.innerHTML = `<div class="chat-bubble assistant">${text}</div>`;
        } catch(err) {
          box.innerHTML = `<div class="notice slim">${escapeHtml(err.code === 'DOLA_API_NOT_CONFIGURED' ? 'La API de DOLA aún no está configurada. Usa el modo externo por ahora.' : (err.message || 'No se pudo conectar con DOLA.'))}</div>`;
        }
      };
      div.querySelector('[data-modal-copy]').onclick=()=>copyText(modal.prompt);
      div.querySelector('[data-modal-open]').onclick=()=>openExternal(DOLA_EXTERNAL_URL);
      div.querySelector('[data-modal-save]').onclick=()=>{ const req=getJSON(KEYS.requests,[]); req.unshift({id:uid('req'),postId:p?.id,title:p?.title,summary:'Solicitud preparada con DOLA',status:'Nueva',createdAt:new Date().toISOString()}); setJSON(KEYS.requests,req); toast('Solicitud guardada localmente'); closeModal(); };
    } else if (modal.type==='post') {
      const p = getPosts().find(x=>x.id===modal.postId);
      div.innerHTML = `<div class="modal"><h3>${escapeHtml(p?.title||'Publicación')}</h3><p class="muted">${escapeHtml(p?.zone||'')} · ${escapeHtml(p?.category||'')}</p><p>${escapeHtml(p?.description||'')}</p><div class="modal-actions"><button class="btn primary" data-message-post="${p?.id}">Mensaje</button><button class="btn ghost" data-modal-close>Cerrar</button></div></div>`;
    } else if (modal.type==='info') {
      div.innerHTML = `<div class="modal"><h3>${escapeHtml(modal.title || 'Información')}</h3><div class="modal-content">${modal.html || ''}</div><div class="modal-actions"><button class="btn primary" data-modal-close>Entendido</button></div></div>`;
    } else if (modal.type==='install-help') {
      div.innerHTML = `<div class="modal"><h3>Instalar Conecta Servicios</h3><p class="muted">Si tu navegador no muestra instalación automática, abre el menú del navegador y elige “Agregar a pantalla de inicio”.</p><div class="notice">En iPhone usa Compartir → Agregar a pantalla de inicio. En Android usa el menú ⋮ → Instalar app o Agregar a pantalla principal.</div><div class="modal-actions"><button class="btn primary" data-modal-close>Entendido</button></div></div>`;
    } else if (modal.type==='notifications') {
      const data = notificationState();
      const items = (data.items||[]);
      data.items = items.map(n=>({...n, read:true})); saveNotificationState(data);
      div.innerHTML = `<div class="modal"><h3>Notificaciones</h3><p class="muted">Estado: ${data.enabled?'activas':'pendientes'} · modo piloto local.</p><div class="list">${items.length ? items.map(n=>`<div class="list-item"><div><b>${escapeHtml(n.title)}</b><p class="tiny muted">${escapeHtml(n.message)} · ${new Date(n.createdAt).toLocaleString('es-MX')}</p></div></div>`).join('') : '<div class="empty">Sin notificaciones.</div>'}</div><div class="modal-actions"><button class="btn ghost" data-modal-clear-notifications>Limpiar</button><button class="btn primary" data-modal-close>Cerrar</button></div></div>`;
      div.querySelector('[data-modal-clear-notifications]')?.addEventListener('click',()=>{ saveNotificationState({enabled:data.enabled,items:[]}); closeModal(); toast('Notificaciones limpias'); render(); });
    }
    div.onclick=(e)=>{ if(e.target===div) closeModal(); };
    div.querySelectorAll('[data-modal-close]').forEach(b=>b.onclick=closeModal);
    document.body.appendChild(div);
  }
  function closeModal(){ state.modal=null; $('#modal-root')?.remove(); }

  function activateMembership(){ const expires = addDays(new Date(), 365); setJSON(KEYS.membership,{active:true,startedAt:new Date().toISOString(),expiresAt:expires,ambassadorCode:'CON-LOCAL'}); toast('Membresía piloto activa'); render(); }
  function enableAdmin(){ const pin = prompt('Ingresa PIN admin'); if (pin === ADMIN_PIN) { localStorage.setItem(KEYS.admin,'true'); toast('Admin activo'); render(); } else if (pin) toast('PIN incorrecto'); }
  function clearLocal(){ if (!confirm('Esto borrará datos locales del piloto. ¿Continuar?')) return; Object.values(KEYS).forEach(k=>localStorage.removeItem(k)); toast('Datos locales borrados'); render(); }
  function showPrivacy(){ alert('DOLA es una herramienta externa. Conecta le envía prompts enfocados en Conecta Servicios, pero no compartas datos sensibles. Revisa el texto antes de pegarlo. Conecta facilita publicaciones y contacto, no garantiza ventas ni resultados.'); }
  function editProfile(){
    const profile = getJSON(KEYS.profile,{name:'Usuario', zone:'', phone:''});
    const name = prompt('Nombre', profile.name || 'Usuario'); if (!name) return;
    const zone = (prompt('Municipio / zona', profile.zone || '') ?? profile.zone ?? '');
    const phone = (prompt('Teléfono opcional', profile.phone || '') ?? profile.phone ?? '');
    profile.name = name; profile.zone = zone; profile.phone = phone;
    setJSON(KEYS.profile,profile); toast('Perfil actualizado'); render();
  }

  function preferences(){
    const prefs = getJSON(KEYS.prefs,{preferredChannel:'dola'});
    const current = (prefs.preferredChannel || 'dola').toLowerCase();
    const next = confirm(`Canal actual: ${current.toUpperCase()}\n\nAceptar = DOLA recomendado\nCancelar = WhatsApp`) ? 'dola' : 'whatsapp';
    prefs.preferredChannel = next; setJSON(KEYS.prefs,prefs); toast(`Preferencia guardada: ${next.toUpperCase()}`); render();
  }

  async function installApp(){
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice.catch(()=>null);
      if (choice?.outcome === 'accepted') addNotification('App instalada', 'Conecta Servicios quedó instalada en tu dispositivo.');
      deferredInstallPrompt = null;
      toast('Instalación solicitada.');
      return;
    }
    state.modal = { type:'install-help' }; renderModal(state.modal);
  }

  async function notificationPanel(){
    const data = notificationState();
    if (!data.enabled && 'Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission().catch(()=> 'denied');
      data.enabled = result === 'granted';
    } else if (!data.enabled) {
      data.enabled = true;
    }
    if (!data.items?.length) {
      data.items = [];
      data.items.push({ id: uid('note'), title:'Bienvenido a notificaciones', message:'Aquí verás avisos de publicaciones, membresía y DOLA en modo piloto.', type:'info', read:false, createdAt:new Date().toISOString() });
    }
    saveNotificationState(data);
    state.modal = { type:'notifications' }; renderModal(state.modal);
  }

  function registerReferral(){
    const name = prompt('Nombre del referido o negocio'); if (!name) return;
    const phone = prompt('WhatsApp o contacto opcional') || '';
    const refs = getJSON(KEYS.referrals,[]);
    refs.unshift({ id:uid('ref'), name, phone, status:'pendiente', createdAt:new Date().toISOString() });
    setJSON(KEYS.referrals, refs); toast('Referido registrado en modo piloto');
  }

  function shareAmbassadorMessage(){
    const text = `Hola, te invito a Conecta Servicios. Puedes publicar gratis por 30 días y activar membresía anual de $${MEMBERSHIP_PRICE} para publicar sin límites. Entra aquí: ${location.origin}/embajadores?ref=CON-LOCAL`;
    copyText(text);
  }

  function createAgentPost(){
    pushInternalNavigationSnapshot();
    state.publishMode='manual';
    state.publishTemplate = templates.find(t=>t.id==='ofrecerme-agente') || null;
    state.publishDraft={type:'Agente', category:'Agentes en crecimiento', title:'', description:'', channel:'dola'};
    navigate('/publicar');
  }

  function agentDolaPrompt(){
    state.publishMode = 'dola';
    state.publishTemplate = templates.find(t=>t.id==='ofrecerme-agente') || templates[0];
    state.dolaFlowActive = true;
    navigate('/publicar');
  }

  function requestVerifiedErrand(){
    state.publishMode = 'manual';
    state.publishTemplate = templates.find(t=>t.id==='busco-mensajero') || templates[0];
    state.publishDraft={type:'Solicitante', category:'Mandados verificados', title:'', description:'', channel:'dola'};
    navigate('/publicar');
  }

  function applyVerifiedAgent(){
    const name = prompt('Nombre para postulación como agente verificado'); if (!name) return;
    const zone = prompt('Zona donde puedes apoyar') || '';
    const apps = getJSON(KEYS.verifiedApplications, []);
    apps.unshift({ id:uid('ver'), name, zone, status:'pendiente de revisión manual', createdAt:new Date().toISOString() });
    setJSON(KEYS.verifiedApplications, apps); toast('Postulación guardada en modo piloto');
  }

  function learningPrompt(){
    const text = dolaBasePrompt({
      section:'Aprendizaje',
      objective:'Ayudar al usuario a aprender cómo usar Conecta Servicios para empezar, mejorar publicaciones, ofrecer servicios, convertirse en agente o encontrar oportunidades dentro de la app.',
      extra:`TAREA DESDE APRENDIZAJE:
Si el usuario dice que no tiene trabajo o no sabe qué hacer, oriéntalo primero a:
1. Crear una publicación gratis por 30 días.
2. Publicarse como Agente.
3. Revisar Agentes en crecimiento.
4. Aprender habilidades útiles para ofrecer servicios locales.
5. Explorar Mandados verificados.
6. Conocer Embajadores si quiere ganar por comisión.

REGLAS ESPECÍFICAS:
No recomiendes WhatsApp Business, plataformas externas, empleos externos ni herramientas ajenas salvo que el usuario lo pida explícitamente.
No conviertas la respuesta en una búsqueda de empleo genérica.
Enfócate en pasos dentro de Conecta Servicios.
Responde de forma sencilla, paso a paso y enfocada en Conecta Servicios.`
    });
    copyText(text).then(()=>toast('Prompt de aprendizaje copiado'));
  }

  function showInfo(title, html){
    state.modal = { type:'info', title, html };
    renderModal(state.modal);
  }

  function showAmbassadorGuide(){
    showInfo('Guía rápida para embajadores', `
      <div class="info-stack">
        <div class="info-item"><div class="left"><div class="list-icon">1</div><div><b>Invita</b><p class="tiny muted">Comparte tu enlace con negocios, agentes o solicitantes.</p></div></div></div>
        <div class="info-item"><div class="left"><div class="list-icon">2</div><div><b>Ayuda a publicar</b><p class="tiny muted">Dales el puente de DOLA o acompáñalos en la publicación manual.</p></div></div></div>
        <div class="info-item"><div class="left"><div class="list-icon">3</div><div><b>Registra referido</b><p class="tiny muted">Guarda el nombre y contacto en el piloto para dar seguimiento.</p></div></div></div>
      </div>
      <div class="button-row"><button class="btn primary" data-action="share-ambassador-message">Copiar mensaje</button><button class="btn ghost" data-action="register-referral">Registrar referido</button></div>
    `);
  }

  function showAgentTips(){
    showInfo('Tips para crecer como agente', `
      <div class="info-stack">
        <div class="info-item"><div class="left"><div class="list-icon">📍</div><div><b>Define zona y horario</b><p class="tiny muted">Aclara dónde puedes ayudar y en qué horarios.</p></div></div></div>
        <div class="info-item"><div class="left"><div class="list-icon">💬</div><div><b>Explica costos aproximados</b><p class="tiny muted">Evita mensajes incompletos y mejora la confianza.</p></div></div></div>
        <div class="info-item"><div class="left"><div class="list-icon">🤖</div><div><b>Usa DOLA</b><p class="tiny muted">Te ayuda a redactar una presentación clara.</p></div></div></div>
      </div>
      <div class="button-row"><button class="btn primary" data-action="agent-dola-prompt">Usar DOLA</button><button class="btn ghost" data-action="create-agent-post">Crear publicación</button></div>
    `);
  }

  function showVerifiedRequirements(){
    showInfo('Requisitos de mandados verificados', `
      <div class="info-stack">
        <div class="info-item"><div class="left"><div class="list-icon">🪪</div><div><b>Identificación o datos básicos</b><p class="tiny muted">En piloto puede requerir revisión manual.</p></div></div></div>
        <div class="info-item"><div class="left"><div class="list-icon">📍</div><div><b>Zona de apoyo</b><p class="tiny muted">Indica dónde puedes atender mandados.</p></div></div></div>
        <div class="info-item"><div class="left"><div class="list-icon">🧾</div><div><b>Evidencia del mandado</b><p class="tiny muted">Fotos de producto, ticket o entrega cuando aplique.</p></div></div></div>
      </div>
      <div class="button-row"><button class="btn primary" data-action="apply-verified-agent">Postularme</button><button class="btn ghost" data-action="request-verified-errand">Solicitar mandado</button></div>
    `);
  }

  function showVerifiedFaq(){
    showInfo('Preguntas frecuentes', `
      <div class="info-stack">
        <div class="info-item"><div class="left"><div class="list-icon">❓</div><div><b>¿Es certificación automática?</b><p class="tiny muted">No. En esta etapa puede requerir revisión manual.</p></div></div></div>
        <div class="info-item"><div class="left"><div class="list-icon">🛡️</div><div><b>¿Qué busca el programa?</b><p class="tiny muted">Dar más claridad y evidencia en mandados locales.</p></div></div></div>
        <div class="info-item"><div class="left"><div class="list-icon">📦</div><div><b>¿Puedo solicitar un mandado?</b><p class="tiny muted">Sí, crea una solicitud con zona, horario y detalles.</p></div></div></div>
      </div>
    `);
  }

  function showLearningResources(){
    showInfo('Recursos de aprendizaje', `
      <div class="info-stack">
        <div class="info-item"><div class="left"><div class="list-icon">📝</div><div><b>Mejora tu publicación</b><p class="tiny muted">Título claro, foto útil, zona y condiciones.</p></div></div></div>
        <div class="info-item"><div class="left"><div class="list-icon">💬</div><div><b>Atiende mejor</b><p class="tiny muted">Responde rápido, confirma detalles y acuerda condiciones.</p></div></div></div>
        <div class="info-item"><div class="left"><div class="list-icon">🤖</div><div><b>Practica con DOLA</b><p class="tiny muted">Pide un plan paso a paso para mejorar tu perfil.</p></div></div></div>
      </div>
      <div class="button-row"><button class="btn primary" data-action="copy-learning-prompt">Copiar prompt para DOLA</button><button class="btn green" data-action="open-dola">Abrir DOLA</button></div>
    `);
  }

  function showLearningDolaPlan(){
    learningPrompt();
    showInfo('Prompt copiado para DOLA', `
      <p class="muted">Ya copié un prompt para que DOLA te arme un plan de aprendizaje paso a paso.</p>
      <div class="button-row"><button class="btn green" data-action="open-dola">Abrir DOLA</button><button class="btn ghost" data-route="/publicar">Practicar publicando</button></div>
    `);
  }

  function createCommissionPost(){
    pushInternalNavigationSnapshot();
    state.publishMode='manual';
    state.publishTemplate = null;
    state.publishDraft={type:'Negocio', category:'Conseguir clientes por comisión', title:'Busco agentes para conseguir clientes por comisión', description:'', channel:'dola'};
    navigate('/publicar');
  }

  function commissionDolaPrompt(){
    const text = dolaBasePrompt({
      section:'Conseguir clientes por comisión',
      objective:'Ayudar a redactar una campaña clara dentro de Conecta Servicios para conseguir clientes por comisión.',
      extra:`TAREA:
Quiero crear una publicación para conseguir clientes por comisión dentro de Conecta Servicios.
Ayúdame a explicar qué se ofrece, qué tipo de clientes busco, cómo sería la comisión y qué datos necesito.
Hazme una pregunta a la vez y al final dame solo la publicación final lista para pegar en Conecta.
No inventes pagos, contratos ni reglas no definidas.`
    });
    copyText(text).then(()=>{
      showInfo('Prompt copiado para DOLA', `<p class="muted">Ya copié el prompt para redactar una campaña por comisión con contexto cerrado de Conecta.</p><div class="button-row"><button class="btn green" data-action="open-dola">Abrir DOLA</button><button class="btn ghost" data-action="create-commission-post">Crear manualmente</button></div>`);
    });
  }

  function addPublishNotification(){
    addNotification('Nueva publicación creada', 'Tu publicación ya aparece en Mis publicaciones, Inicio y Explorar en modo piloto.');
    const active = freeActiveMine()[0];
    if (active) addNotification('Publicación gratis activa', `Tu publicación gratis vence en ${daysLeft(active.expiresAt)} días.`);
  }

  function getParam(name){ return new URL(location.href).searchParams.get(name); }

  init();
})();
