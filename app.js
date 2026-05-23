/* Conecta Servicios v6.3.8 - Chat en pantalla, polling y limpieza de caché */
(() => {
  'use strict';

  const VERSION = 'v6.3.8-chat-tiempo-real-cache';
  const APP_URL = 'https://conecta-servicios.vercel.app/';
  const MAX_FILE_MB = 40;
  const IMAGE_MAX_SIDE = 1280;
  const POLL_MS = 7000;
  const MESSAGE_POLL_MS = 3500;
  const STORAGE_BUCKET = 'publication-media';

  const K = {
    posts: 'cs_v634_posts',
    user: 'cs_v634_user',
    follows: 'cs_v634_follows',
    messages: 'cs_v634_messages',
    profile: 'cs_v634_profile',
    composer: 'cs_v634_composer'
  };

  const CATEGORIES = ['VENDO', 'OFREZCO', 'NECESITO'];
  const ZONES = ['Tejupilco', 'Toluca', 'Metepec', 'Chapultepec', 'Centro', 'Zona cercana', 'Todo México'];

  const seed = [
    {id:'seed-vendo-1',ownerId:'seed-shop',ownerName:'Proveedor local',title:'Vendo pan casero hoy',description:'Vendo pan casero hoy.\nRecién hecho, entrega local por la tarde.',category:'VENDO',zone:'Tejupilco',mediaUrl:'assets/dola-media/comida-01.jpg',mediaType:'image',reactions:4,status:'activa',cloudStatus:'publica',createdAt:new Date(Date.now()-3600000).toISOString(),updatedAt:new Date(Date.now()-3600000).toISOString()},
    {id:'seed-ofrezco-1',ownerId:'seed-agent',ownerName:'Mensajero local',title:'Ofrezco mandados y entregas',description:'Ofrezco mandados y entregas.\nHago compras, pagos y entregas pequeñas.',category:'OFREZCO',zone:'Centro',mediaUrl:'assets/dola-media/mandados-01.jpg',mediaType:'image',reactions:2,status:'activa',cloudStatus:'publica',createdAt:new Date(Date.now()-7200000).toISOString(),updatedAt:new Date(Date.now()-7200000).toISOString()},
    {id:'seed-necesito-1',ownerId:'seed-user',ownerName:'Cliente local',title:'Necesito viaje compartido',description:'Necesito viaje compartido.\nBusco salida mañana por la mañana.',category:'NECESITO',zone:'Chapultepec',mediaUrl:'assets/dola-media/solicitante-01.jpg',mediaType:'image',reactions:3,status:'activa',cloudStatus:'publica',createdAt:new Date(Date.now()-10800000).toISOString(),updatedAt:new Date(Date.now()-10800000).toISOString()}
  ];

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const memoryUrls = new Map();
  let mediaDbPromise = null;

  const state = {
    route:'/',
    filter:'ALL',
    query:'',
    posts:[],
    preview:'',
    mediaType:'image',
    editing:null,
    composerId:'',
    composerMediaRef:'',
    composerMediaName:'',
    composerMediaMime:'',
    composerDraft:{description:'',zone:'',category:'VENDO'},
    cloudReady:false,
    publishing:false,
    syncing:false,
    syncTimer:null,
    messageTimer:null,
    publicMessages: [],
    messagesLoaded: false,
    messagesLoading: false,
    messagesError: '',
    chat: null,
    chatMessages: [],
    chatLoading: false,
    chatLoaded: false
  };

  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const uid = (p='id') => `${p}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const get = (k,f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
  const set = (k,v) => localStorage.setItem(k, JSON.stringify(v));

  function userId(){ let id=localStorage.getItem(K.user); if(!id){ id=uid('u'); localStorage.setItem(K.user,id); } return id; }
  function profile(){ const saved=get(K.profile,null); if(saved) return saved; const fresh={name:'Usuario local'}; set(K.profile,fresh); return fresh; }
  function follows(){ return get(K.follows,[]); }
  function messages(){ return get(K.messages,[]); }
  function saveMessages(list){ set(K.messages,list); }
  function toast(msg){ toastEl.textContent=msg; toastEl.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>toastEl.classList.remove('show'),2800); }
  function normalizeCategory(v){ const x=String(v||'').toUpperCase().trim(); return CATEGORIES.includes(x)?x:'VENDO'; }
  function titleFrom(text){ return (String(text||'').split('\n').map(x=>x.trim()).find(Boolean)||'Publicación').slice(0,72); }


  async function refreshOldCaches(){
    try{
      const cacheKey = `cs_cache_version_${VERSION}`;
      if(localStorage.getItem('cs_cache_version') === cacheKey) return;
      if('caches' in window){
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k.startsWith('conecta-servicios-')).map(k => caches.delete(k)));
      }
      if('serviceWorker' in navigator){
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg => reg.update().catch(()=>null)));
      }
      localStorage.setItem('cs_cache_version', cacheKey);
    }catch{}
  }

  function saveComposerDraft(){
    set(K.composer, {
      id: state.composerId,
      description: state.composerDraft.description || '',
      zone: state.composerDraft.zone || '',
      category: normalizeCategory(state.composerDraft.category || 'VENDO'),
      mediaRef: state.composerMediaRef,
      mediaName: state.composerMediaName,
      mediaMime: state.composerMediaMime,
      mediaType: state.mediaType
    });
  }

  function loadComposerDraft(){
    const saved = get(K.composer, null);
    if (!saved) return;
    state.composerId = saved.id || state.composerId;
    state.composerDraft = {
      description: saved.description || '',
      zone: saved.zone || '',
      category: normalizeCategory(saved.category || state.filter || 'VENDO')
    };
    state.composerMediaRef = saved.mediaRef || '';
    state.composerMediaName = saved.mediaName || '';
    state.composerMediaMime = saved.mediaMime || '';
    state.mediaType = saved.mediaType || state.mediaType || 'image';
  }

  function openMediaDb(){
    if(mediaDbPromise) return mediaDbPromise;
    mediaDbPromise=new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)) return reject(new Error('Sin multimedia local'));
      const req=indexedDB.open('conecta_media_v634',1);
      req.onupgradeneeded=()=>req.result.createObjectStore('files');
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
    return mediaDbPromise;
  }
  async function saveMediaBlob(ref,blob){
    const db=await openMediaDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('files','readwrite');
      tx.objectStore('files').put(blob,ref);
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
    });
  }
  async function loadMediaBlob(ref){
    const db=await openMediaDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('files','readonly');
      const req=tx.objectStore('files').get(ref);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    });
  }
  function objectUrlFor(ref,blob){
    if(!ref||!blob) return '';
    if(memoryUrls.has(ref)) return memoryUrls.get(ref);
    const url=URL.createObjectURL(blob);
    memoryUrls.set(ref,url);
    return url;
  }
  function requestRenderSoon(){ clearTimeout(requestRenderSoon._t); requestRenderSoon._t=setTimeout(()=>{ if(state.route !== '/publicar') render(); },60); }
  function resolveMedia(post){
    if(post.mediaUrl) return post.mediaUrl;
    if(post.mediaData) return post.mediaData;
    if(post.mediaPreviewUrl) return post.mediaPreviewUrl;
    if(post.mediaRef){
      if(memoryUrls.has(post.mediaRef)) return memoryUrls.get(post.mediaRef);
      loadMediaBlob(post.mediaRef).then(blob=>{ if(blob){ objectUrlFor(post.mediaRef,blob); requestRenderSoon(); } }).catch(()=>{});
    }
    return '';
  }

  function stripForLocal(post){ const p={...post}; delete p.mediaPreviewUrl; return p; }
  function stripForRemote(post){ const p={...post}; delete p.mediaPreviewUrl; delete p.mediaRef; delete p.mediaData; return p; }

  function localPosts(){ const saved=get(K.posts,null); if(!saved){ set(K.posts,seed); return seed; } return saved.map(p=>({...p,category:normalizeCategory(p.category)})); }
  function saveLocalPosts(posts){ const normalized=dedupePosts(posts.map(p=>({...p,category:normalizeCategory(p.category)}))); state.posts=normalized; set(K.posts,normalized.map(stripForLocal)); }

  function betterPost(a,b){
    if(!a) return b; if(!b) return a;
    if((b.status === 'eliminada') && (a.status !== 'eliminada')) return b;
    if((a.status === 'eliminada') && (b.status !== 'eliminada')) return a;
    if(b.mediaUrl&&!a.mediaUrl) return b;
    if(a.mediaUrl&&!b.mediaUrl) return a;
    if(b.cloudStatus==='publica'&&a.cloudStatus!=='publica') return b;
    if(a.cloudStatus==='publica'&&b.cloudStatus!=='publica') return a;
    const ad=new Date(a.updatedAt||a.createdAt||0).getTime();
    const bd=new Date(b.updatedAt||b.createdAt||0).getTime();
    return bd>=ad?{...a,...b}:{...b,...a};
  }
  function sameSoftKey(a,b){
    if(!a||!b) return false;
    if((a.ownerId||'')!==(b.ownerId||'')) return false;
    if(normalizeCategory(a.category)!==normalizeCategory(b.category)) return false;
    if((a.zone||'').trim().toLowerCase()!==(b.zone||'').trim().toLowerCase()) return false;
    if((a.description||'').trim().toLowerCase()!==(b.description||'').trim().toLowerCase()) return false;
    return Math.abs(new Date(a.createdAt||0).getTime()-new Date(b.createdAt||0).getTime())<120000;
  }
  function dedupePosts(posts){
    const byId=new Map();
    posts.forEach(p=>{ if(p&&p.id) byId.set(p.id,betterPost(byId.get(p.id),p)); });
    const list=[...byId.values()].sort((a,b)=>new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0));
    const final=[];
    list.forEach(p=>{ const i=final.findIndex(x=>sameSoftKey(x,p)); if(i>=0) final[i]=betterPost(final[i],p); else final.push(p); });
    return final;
  }
  function mergePosts(local,remote){ return dedupePosts([...(remote||[]),...(local||[])]); }
  function filteredPosts(){
    const q=state.query.trim().toLowerCase();
    return dedupePosts(state.posts).filter(p=>p.status!=='eliminada')
      .filter(p=>state.filter==='ALL'||normalizeCategory(p.category)===state.filter)
      .filter(p=>!q||`${p.title||''} ${p.description||''} ${p.zone||''} ${p.category||''} ${p.ownerName||''}`.toLowerCase().includes(q))
      .sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  }
  function myPosts(){ return dedupePosts(state.posts).filter(p=>p.ownerId===userId() && p.status !== 'eliminada').sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)); }
  function followedPosts(){ const ids=new Set(follows()); return dedupePosts(state.posts).filter(p=>ids.has(p.ownerId) && p.status !== 'eliminada').sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)); }

  async function getPublicConfig(){
    try{ const res=await fetch('/api/public-config',{cache:'no-store'}); return await res.json(); }catch{ return {ok:false}; }
  }
  function dataUrlToBlob(dataUrl){
    const [header,body]=String(dataUrl||'').split(',');
    if(!header||!body) return null;
    const mime=(header.match(/data:([^;]+)/)||[])[1]||'application/octet-stream';
    const bin=atob(body); const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    return new Blob([bytes],{type:mime});
  }

  async function uploadMediaToCloud(post){
    if(post.mediaUrl) return {post,ok:true};
    const cfg=await getPublicConfig();
    if(!cfg.ok||!cfg.supabaseUrl||!cfg.supabaseAnonKey) return {post,ok:false};
    let blob=null;
    if(post.mediaRef) blob=await loadMediaBlob(post.mediaRef).catch(()=>null);
    if(!blob&&post.mediaData) blob=dataUrlToBlob(post.mediaData);
    if(!blob) return {post,ok:false};

    const bucket=cfg.storageBucket||STORAGE_BUCKET;
    const safeName=(post.mediaName||`${post.mediaType||'media'}.bin`).replace(/[^a-z0-9_.-]/gi,'-').toLowerCase();
    const path=`${encodeURIComponent(post.ownerId||userId())}/${encodeURIComponent(post.id)}/${Date.now()}-${safeName}`;
    const url=`${cfg.supabaseUrl}/storage/v1/object/${bucket}/${path}`;

    const res=await fetch(url,{
      method:'POST',
      headers:{apikey:cfg.supabaseAnonKey,Authorization:`Bearer ${cfg.supabaseAnonKey}`,'Content-Type':post.mediaMime||blob.type||'application/octet-stream','x-upsert':'true'},
      body:blob
    });
    if(!res.ok) return {post,ok:false};
    return {post:{...post,mediaUrl:`${cfg.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`,mediaData:'',mediaPreviewUrl:'',mediaStatus:'',mediaUploadedAt:new Date().toISOString()},ok:true};
  }

  async function syncFromCloud(options={}){
    if(state.syncing) return false;
    state.syncing=true;
    try{
      const res=await fetch('/api/publications',{cache:'no-store'});
      const data=await res.json();
      if(!res.ok||!data.ok) throw new Error('offline');
      state.cloudReady=true;
      const remote=(data.posts||[]).map(p=>({...p,category:normalizeCategory(p.category),cloudStatus:'publica'}));
      saveLocalPosts(mergePosts(localPosts(),remote));
      if(options.render!==false && state.route !== '/publicar') render();
      return true;
    }catch{
      state.cloudReady=false;
      state.posts=localPosts();
      if(options.render!==false && state.route !== '/publicar') render();
      return false;
    }finally{ state.syncing=false; }
  }

  async function syncPost(post){
    try{
      const clean=stripForRemote(post);
      const res=await fetch('/api/publications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({post:clean})});
      const data=await res.json().catch(()=>({ok:false}));
      return !!(res.ok&&data.ok);
    }catch{ return false; }
  }

  async function deleteCloud(id){
    // Se conserva para compatibilidad, pero v6.3.6 usa borrado suave con syncPost.
    try{ await fetch('/api/publications',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,ownerId:userId(),admin:false})}); }catch{}
  }

  function shell(content){ return `
    <main class="app-page"><div class="top-space"></div>${content}</main>
    <nav class="bottom-nav">
      <button class="nav-item ${state.route==='/'?'active':''}" data-nav="/"><span class="nav-icon">🏠</span><small>Inicio</small></button>
      <button class="nav-item ${state.route==='/siguiendo'?'active':''}" data-nav="/siguiendo"><span class="nav-icon">🫂</span><small>Siguiendo</small></button>
      <button class="nav-plus" data-pick>+</button>
      <button class="nav-item ${state.route==='/mensajes'?'active':''}" data-nav="/mensajes"><span class="nav-icon">✉️</span><small>Mensajes</small></button>
      <button class="nav-item ${state.route==='/perfil'?'active':''}" data-nav="/perfil"><span class="nav-icon">👤</span><small>Perfil</small></button>
    </nav>
    <input id="mediaPicker" type="file" accept="image/*,video/*" hidden>
  `; }

  function homeHeader(){ return `
    <section class="glass-top">
      <div class="brand-row">
        <img src="assets/icons/conecta-logo-oficial.png" alt="Conecta" class="brand-logo" onerror="this.style.display='none'">
        <div class="brand-title"><strong>Conecta</strong><span>Servicios</span></div>
        <div style="display:flex;gap:10px;align-items:center"><div class="ghost-top"></div><button class="bell-btn" data-nav="/mensajes" title="Avisos">🔔</button></div>
      </div>
      <div class="path-row">
        ${pathButton('VENDO','🏪','Vendo','path-vendo')}
        ${pathButton('OFREZCO','🛵','Ofrezco','path-ofrezco')}
        ${pathButton('NECESITO','🧡','Necesito','path-necesito')}
      </div>
      <label class="search-box"><span>🔎</span><input id="searchInput" value="${esc(state.query)}" placeholder="Buscar" autocomplete="off"></label>
    </section>
  `; }
  function pathButton(key,icon,label,klass){ return `<button class="path-card ${klass} ${state.filter===key?'active':''}" data-filter="${key}"><span class="path-icon">${icon}</span><span class="path-label">${label}</span></button>`; }
  function homePage(){ return shell(`${homeHeader()}<section class="feed-title" id="feedTitle">${feedTitleMarkup()}</section><section class="feed" id="feed">${feedMarkup()}</section>`); }
  function feedTitleMarkup(){
    const title=state.filter==='ALL'?'Publicaciones cerca de ti':state.filter;
    return `<div><h1>${esc(title)}</h1><p>${state.cloudReady?'Publicaciones disponibles':'También funciona sin conexión'}</p></div>${state.syncing?'<span class="sync-pill">Actualizando...</span>':(state.filter!=='ALL'||state.query?'<button class="small-link" data-clear>Todo</button>':'')}`;
  }
  function feedMarkup(){ const posts=filteredPosts(); return posts.map(postCard).join('')||emptyState('No encontré publicaciones','Prueba otra búsqueda o publica algo con el botón +.'); }
  function updateFeedOnly(){ const feed=document.getElementById('feed'); if(feed) feed.innerHTML=feedMarkup(); const title=document.getElementById('feedTitle'); if(title) title.innerHTML=feedTitleMarkup(); bindDynamicFeedControls(); }
  function categoryClass(cat){ return `chip-${normalizeCategory(cat).toLowerCase()}`; }
  function isFollowing(ownerId){ return follows().includes(ownerId); }
  function statusLabel(post){
    if(post.cloudStatus==='subiendo') return '<span class="chip status-chip">Publicando...</span>';
    if(post.cloudStatus==='local') return '<span class="chip status-chip local">Guardada en este dispositivo</span>';
    if(post.cloudStatus==='publica') return '<span class="chip status-chip publica">Publicada</span>';
    return '';
  }
  function postCard(post){
    const media=resolveMedia(post); const isVideo=post.mediaType==='video'; const own=post.ownerId===userId();
    const pending=post.mediaStatus==='pendiente'||(!post.mediaUrl&&post.mediaType==='video'&&post.cloudStatus==='publica');
    return `<article class="post-card">
      <div class="media-area">
        ${media?(isVideo?`<video src="${esc(media)}" controls playsinline preload="metadata"></video>`:`<img src="${esc(media)}" alt="${esc(post.title||'Publicación')}">`):'<div class="no-media">Conecta Servicios</div>'}
        ${pending?'<div class="media-pending">El video está pendiente. La publicación ya está visible.</div>':''}
        <div class="media-top"><span class="chip ${categoryClass(post.category)}">${esc(normalizeCategory(post.category))}</span><span class="chip">📍 ${esc(post.zone||'Zona')}</span></div>
        <div class="media-bottom"><div class="action-stack"><button class="round-action" data-like="${esc(post.id)}">❤️</button><button class="round-action" data-message="${esc(post.id)}">✉️</button><button class="round-action" data-share="${esc(post.id)}">↗️</button></div><button class="follow-btn ${isFollowing(post.ownerId)?'following':''}" data-follow="${esc(post.ownerId)}">${isFollowing(post.ownerId)?'Siguiendo':'Seguir'}</button></div>
      </div>
      <div class="post-body">
        <div class="owner-row"><span class="owner-dot">👤</span>${esc(post.ownerName||'Usuario local')}</div>
        <h2>${esc(post.title||'Publicación')}</h2>
        <p>${esc(post.description||'')}</p>
        <div class="post-meta"><span>❤️ ${post.reactions||0}</span><span>${new Date(post.createdAt||Date.now()).toLocaleDateString('es-MX')}</span></div>
        ${statusLabel(post)}
        ${own?`<div class="manage-row">${post.cloudStatus==='local'||post.mediaStatus==='pendiente'?`<button class="retry" data-retry="${esc(post.id)}">Reintentar</button>`:''}<button data-edit="${esc(post.id)}">Editar</button><button class="danger" data-delete="${esc(post.id)}">Borrar</button></div>`:''}
        ${post.cloudStatus==='local'?'<div class="local-note">Tu publicación se guardó en este dispositivo. Revisa tu conexión e intenta de nuevo.</div>':''}
      </div>
    </article>`;
  }
  function emptyState(t,x){ return `<div class="empty"><strong>${esc(t)}</strong>${esc(x)}</div>`; }
  function followingPage(){ const posts=followedPosts(); return shell(`<section class="panel"><h1>Siguiendo</h1><p>Aquí aparecen proveedores, clientes o mensajeros que decidiste seguir.</p></section><section class="feed">${posts.map(postCard).join('')||emptyState('Todavía no sigues a nadie','Toca Seguir en una publicación para verla aquí.')}</section>`); }
  function messagesPage(){
    if(!state.messagesLoaded && !state.messagesLoading) loadMessagesForInbox();
    const groups = conversationGroups(state.publicMessages || []);
    return shell(`<section class="panel">
      <h1>Conversaciones</h1>
      <p>Aquí ves mensajes enviados y recibidos desde tus publicaciones.</p>
      ${state.messagesLoading ? '<div class="empty"><strong>Cargando mensajes...</strong>Espera un momento.</div>' : ''}
      ${state.messagesError ? `<div class="local-note">${esc(state.messagesError)}</div>` : ''}
      <div class="list">
        ${groups.map(conversationCard).join('') || (!state.messagesLoading ? emptyState('Sin conversaciones todavía','Toca el sobre en una publicación para escribir.') : '')}
      </div>
    </section>`);
  }

  function conversationGroups(list){
    const me = userId();
    const map = new Map();
    (list || []).forEach(m => {
      const peerId = m.senderId === me ? m.receiverId : m.senderId;
      const peerName = m.senderId === me ? (m.receiverName || 'Usuario local') : (m.senderName || 'Usuario local');
      const key = `${m.postId || ''}::${peerId || ''}`;
      const prev = map.get(key);
      const current = {
        postId: m.postId || '',
        postTitle: m.postTitle || 'Publicación',
        peerId,
        peerName,
        lastText: m.text || '',
        lastAt: m.createdAt || '',
        count: (prev?.count || 0) + 1
      };
      if(!prev || new Date(current.lastAt || 0) >= new Date(prev.lastAt || 0)) map.set(key, current);
      else map.set(key, {...prev, count: current.count});
    });
    return [...map.values()].sort((a,b)=>new Date(b.lastAt||0)-new Date(a.lastAt||0));
  }

  function conversationCard(item){
    return `<button class="conversation-card" data-open-chat="1" data-post="${esc(item.postId)}" data-peer="${esc(item.peerId)}" data-title="${esc(item.postTitle)}" data-name="${esc(item.peerName)}">
      <div class="conversation-avatar">💬</div>
      <div class="conversation-main">
        <strong>${esc(item.peerName || 'Usuario local')}</strong>
        <small>${esc(item.postTitle || 'Publicación')}</small>
        <p>${esc(item.lastText || '')}</p>
      </div>
      <span class="conversation-count">${item.count || 1}</span>
    </button>`;
  }

  function chatPage(){
    const chat = state.chat;
    if(!chat){
      return shell(`<section class="panel"><button class="back-btn" data-nav="/mensajes">← Volver</button><h1>Conversación</h1><p>Abre una conversación desde Mensajes o desde el sobre de una publicación.</p></section>`);
    }
    if(!state.chatLoaded && !state.chatLoading) loadChatMessages();
    return shell(`<section class="panel chat-panel">
      <button class="back-btn" data-nav="/mensajes">← Conversaciones</button>
      <h1>${esc(chat.peerName || 'Usuario local')}</h1>
      <p>${esc(chat.postTitle || 'Publicación')}</p>
      <div class="chat-feed" id="chatFeed">
        ${state.chatLoading ? '<div class="empty"><strong>Cargando conversación...</strong></div>' : ''}
        ${state.chatMessages.map(chatBubble).join('') || (!state.chatLoading ? '<div class="empty"><strong>Sin mensajes todavía</strong>Escribe el primer mensaje.</div>' : '')}
      </div>
      <div class="chat-box">
        <textarea id="chatText" placeholder="Escribe un mensaje claro y amable"></textarea>
        <button class="big-button" data-send-chat>Enviar</button>
      </div>
    </section>`);
  }

  function chatBubble(m){
    const mine = m.senderId === userId();
    return `<div class="bubble-row ${mine ? 'mine' : 'theirs'}">
      <div class="bubble">
        <p>${esc(m.text || '')}</p>
        <small>${esc(m.senderName || 'Usuario local')} · ${new Date(m.createdAt || Date.now()).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</small>
      </div>
    </div>`;
  }
  function profilePage(){ const prof=profile(); const mine=myPosts(); return shell(`<section class="panel"><h1>Perfil</h1><p>Guarda tu nombre visible y revisa tu actividad.</p><label>Nombre visible</label><input id="profileName" value="${esc(prof.name||'Usuario local')}" placeholder="Tu nombre o negocio"><button class="big-button" data-save-profile>Guardar nombre</button><div class="profile-grid"><div class="stat"><strong>${mine.length}</strong><span>Publicaciones</span></div><div class="stat"><strong>${follows().length}</strong><span>Siguiendo</span></div><div class="stat"><strong>${messages().length}</strong><span>Mensajes</span></div></div></section><section class="feed">${mine.map(postCard).join('')||emptyState('No has publicado','Toca + para crear tu primera publicación.')}</section>`); }

  function ensureComposerId(){ if(!state.composerId){ state.composerId=uid('post'); state.composerDraft.category = state.filter==='ALL'?'VENDO':normalizeCategory(state.filter); saveComposerDraft(); } return state.composerId; }
  function composerPage(){
    loadComposerDraft();
    ensureComposerId();
    let post = state.editing || null;
    if(post){
      state.composerDraft = {description: post.description || '', zone: post.zone || '', category: normalizeCategory(post.category)};
    }
    const draft = state.composerDraft;
    const media=state.preview||(post?.mediaUrl)||resolveMedia(post||{mediaRef:state.composerMediaRef});
    const isVideo=(state.mediaType||(post?.mediaType))==='video';
    return shell(`<section class="composer">
      <button class="back-btn" data-nav="/">← Volver</button>
      <h1>${state.editing?'Editar publicación':'Nueva publicación'}</h1>
      <p>Escribe aquí. Este campo ya no se borra mientras publicas.</p>
      <label for="description">Descripción</label>
      <textarea id="description" autocomplete="off" autocapitalize="sentences" spellcheck="true" placeholder="Ejemplo: Vendo tamales hoy&#10;Entrego en zona centro desde las 6 pm.">${esc(draft.description||'')}</textarea>
      <div class="preview-compact" data-pick>${media?(isVideo?`<video src="${esc(media)}" controls playsinline preload="metadata"></video>`:`<img src="${esc(media)}" alt="Vista previa">`):'<div><strong>+ Agregar foto o video</strong><span>Desde tu dispositivo</span></div>'}</div>
      <div class="form-grid"><div><label for="zone">Zona o municipio</label><input id="zone" list="zoneList" value="${esc(draft.zone||'')}" placeholder="Ej. Tejupilco"><datalist id="zoneList">${ZONES.map(z=>`<option value="${esc(z)}"></option>`).join('')}</datalist></div><div><label for="category">Categoría</label><select id="category">${CATEGORIES.map(c=>`<option value="${esc(c)}" ${normalizeCategory(draft.category)===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div></div>
      <button class="big-button ${state.publishing?'publishing':''}" data-publish ${state.publishing?'disabled':''}>${state.publishing?'PUBLICANDO...':'PUBLICAR'}</button>
    </section>`);
  }

  function render(){ const routes={'/':homePage,'/siguiendo':followingPage,'/mensajes':messagesPage,'/perfil':profilePage,'/publicar':composerPage,'/chat':chatPage}; app.innerHTML=(routes[state.route]||homePage)(); bind(); }
  function nav(route){ state.route=route; if(route!=='/publicar'&&!state.publishing) state.editing=null; render(); setTimeout(()=>scrollTo({top:0,behavior:'smooth'}),0); }
  function openPicker(){ if(state.publishing) return toast('Estamos terminando de publicar. Espera un momento.'); ensureComposerId(); document.getElementById('mediaPicker')?.click(); }
  function resizeImage(file,maxSide=IMAGE_MAX_SIDE,quality=.82){
    return new Promise((resolve,reject)=>{
      if(!file.type.startsWith('image/')) return resolve(file);
      const img=new Image(); const url=URL.createObjectURL(file);
      img.onload=()=>{ URL.revokeObjectURL(url); const scale=Math.min(1,maxSide/Math.max(img.width,img.height)); const w=Math.max(1,Math.round(img.width*scale)); const h=Math.max(1,Math.round(img.height*scale)); const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h; canvas.getContext('2d').drawImage(img,0,0,w,h); canvas.toBlob(blob=>resolve(blob||file),'image/jpeg',quality); };
      img.onerror=()=>{ URL.revokeObjectURL(url); reject(new Error('No se pudo leer imagen')); };
      img.src=url;
    });
  }
  async function fileChosen(event){
    const file=event.target.files?.[0]; event.target.value=''; if(!file) return;
    if(file.size>MAX_FILE_MB*1024*1024) return toast('Por ahora usa un archivo más ligero para evitar errores.');
    try{
      const postId=ensureComposerId(); const ref=`media-${postId}`; const kind=file.type.startsWith('video')?'video':'image';
      let blob=file; if(kind==='image') blob=await resizeImage(file).catch(()=>file);
      await saveMediaBlob(ref,blob);
      state.mediaType=kind; state.composerMediaRef=ref; state.composerMediaName=file.name||`${kind}.bin`; state.composerMediaMime=blob.type||file.type||'application/octet-stream'; state.preview=objectUrlFor(ref,blob); state.editing=null; saveComposerDraft(); nav('/publicar');
      setTimeout(()=>document.getElementById('description')?.focus(),250);
    }catch{ toast('No se pudo abrir el archivo. Prueba con otro.'); }
  }
  function collectForm(){ return {description:document.getElementById('description')?.value.trim()||state.composerDraft.description||'',zone:document.getElementById('zone')?.value.trim()||state.composerDraft.zone||'',category:normalizeCategory(document.getElementById('category')?.value||state.composerDraft.category||'VENDO')}; }
  function clearComposer(){ state.preview=''; state.mediaType='image'; state.editing=null; state.composerId=''; state.composerMediaRef=''; state.composerMediaName=''; state.composerMediaMime=''; state.composerDraft={description:'',zone:'',category:'VENDO'}; localStorage.removeItem(K.composer); }

  async function publish(){
    if(state.publishing) return toast('Estamos terminando de publicar. Espera un momento.');
    const form=collectForm();
    state.composerDraft = {...form};
    saveComposerDraft();

    if(!form.description) return toast('Escribe una descripción.');
    if(!form.zone) return toast('Agrega zona o municipio.');
    if(!form.category) return toast('Selecciona VENDO, OFREZCO o NECESITO.');

    const old=state.editing; const id=old?.id||ensureComposerId(); const prof=profile(); const now=new Date().toISOString();
    let post={...old,id,ownerId:old?.ownerId||userId(),ownerName:prof.name||'Usuario local',title:titleFrom(form.description),description:form.description,zone:form.zone,category:form.category,mediaUrl:old?.mediaUrl||'',mediaData:old?.mediaData||'',mediaRef:state.composerMediaRef||old?.mediaRef||'',mediaPreviewUrl:state.preview||old?.mediaPreviewUrl||'',mediaType:state.mediaType||old?.mediaType||'image',mediaMime:state.composerMediaMime||old?.mediaMime||'',mediaName:state.composerMediaName||old?.mediaName||'',mediaStatus:state.composerMediaRef?'pendiente':'',status:'activa',reactions:old?.reactions||0,createdAt:old?.createdAt||now,updatedAt:now,cloudStatus:'subiendo'};

    state.publishing=true;
    saveLocalPosts([post,...state.posts.filter(x=>x.id!==id)]);
    state.filter=form.category; state.query=''; state.route='/'; render(); toast('Publicando...');

    const metadataPost={...post,cloudStatus:'publica',mediaStatus:post.mediaRef?'pendiente':'',updatedAt:new Date().toISOString()};
    const firstSync=await syncPost(metadataPost);

    post={...post,cloudStatus:firstSync?'publica':'local',mediaStatus:post.mediaRef?'pendiente':'',updatedAt:new Date().toISOString()};
    saveLocalPosts([post,...state.posts.filter(x=>x.id!==id)]);
    render();

    if(firstSync) toast('Publicación visible. Subiendo multimedia...');
    else toast('Tu publicación se guardó en este dispositivo. Revisa tu conexión e intenta de nuevo.');

    if(firstSync && post.mediaRef){
      try{
        const uploaded=await uploadMediaToCloud(post);
        if(uploaded.ok){
          post={...uploaded.post,cloudStatus:'publica',mediaStatus:'',updatedAt:new Date().toISOString()};
          await syncPost(post);
          saveLocalPosts([post,...state.posts.filter(x=>x.id!==id)]);
          toast('Publicación lista.');
        }else{
          post={...post,cloudStatus:'publica',mediaStatus:'pendiente',updatedAt:new Date().toISOString()};
          await syncPost(post);
          saveLocalPosts([post,...state.posts.filter(x=>x.id!==id)]);
          toast('Publicación visible. El video quedó pendiente.');
        }
      }catch{
        post={...post,cloudStatus:'publica',mediaStatus:'pendiente',updatedAt:new Date().toISOString()};
        await syncPost(post);
        saveLocalPosts([post,...state.posts.filter(x=>x.id!==id)]);
        toast('Publicación visible. El video quedó pendiente.');
      }
    }

    if(firstSync) clearComposer();
    state.publishing=false;
    await syncFromCloud({render:false});
    render();
  }

  async function retryPost(id){
    let post=state.posts.find(x=>x.id===id); if(!post) return; if(post.ownerId!==userId()) return toast('Solo puedes reintentar tus publicaciones.');
    toast('Publicando...'); post={...post,cloudStatus:'subiendo',updatedAt:new Date().toISOString()}; saveLocalPosts([post,...state.posts.filter(x=>x.id!==id)]); render();
    const metaOk=await syncPost({...post,cloudStatus:'publica',updatedAt:new Date().toISOString()});
    if(!metaOk){ post={...post,cloudStatus:'local',updatedAt:new Date().toISOString()}; saveLocalPosts([post,...state.posts.filter(x=>x.id!==id)]); toast('Tu publicación se guardó en este dispositivo. Revisa tu conexión e intenta de nuevo.'); render(); return; }
    if(post.mediaRef&&!post.mediaUrl){
      const uploaded=await uploadMediaToCloud(post).catch(()=>({post,ok:false}));
      post=uploaded.ok?{...uploaded.post,cloudStatus:'publica',mediaStatus:'',updatedAt:new Date().toISOString()}:{...post,cloudStatus:'publica',mediaStatus:'pendiente',updatedAt:new Date().toISOString()};
      await syncPost(post);
    }else post={...post,cloudStatus:'publica',updatedAt:new Date().toISOString()};
    saveLocalPosts([post,...state.posts.filter(x=>x.id!==id)]); toast('Publicación lista.'); await syncFromCloud({render:false}); render();
  }

  function editPost(id){ const post=state.posts.find(x=>x.id===id); if(!post||post.ownerId!==userId()) return toast('Solo puedes editar tus publicaciones.'); if(state.publishing) return toast('Estamos terminando de publicar. Espera un momento.'); state.editing={...post}; state.composerId=post.id; state.preview=resolveMedia(post); state.mediaType=post.mediaType||'image'; state.composerMediaRef=post.mediaRef||''; state.composerMediaName=post.mediaName||''; state.composerMediaMime=post.mediaMime||''; state.composerDraft={description:post.description||'',zone:post.zone||'',category:normalizeCategory(post.category)}; saveComposerDraft(); nav('/publicar'); }

  async function deletePost(id){
    const post=state.posts.find(x=>x.id===id);
    if(!post || post.ownerId!==userId()) return toast('Solo puedes borrar tus publicaciones.');
    if(!confirm('¿Borrar esta publicación?')) return;

    const tombstone = {
      ...post,
      status: 'eliminada',
      cloudStatus: 'subiendo',
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Primero se oculta localmente.
    saveLocalPosts([tombstone, ...state.posts.filter(x=>x.id!==id)]);
    render();
    toast('Borrando...');

    // Luego se marca eliminada en el muro público. Esto es más confiable que DELETE para este MVP sin login.
    const ok = await syncPost({
      ...tombstone,
      cloudStatus: 'publica'
    });

    if(ok){
      saveLocalPosts([{...tombstone, cloudStatus:'publica'}, ...state.posts.filter(x=>x.id!==id)]);
      await syncFromCloud({render:false});
      toast('Publicación borrada.');
    }else{
      saveLocalPosts([{...post, cloudStatus:'local'}, ...state.posts.filter(x=>x.id!==id)]);
      toast('No se pudo borrar en el muro público. Revisa conexión e intenta de nuevo.');
    }

    render();
  }

  function likePost(id){ saveLocalPosts(state.posts.map(p=>p.id===id?{...p,reactions:(p.reactions||0)+1}:p)); render(); }
  function sharePost(id){ const p=state.posts.find(x=>x.id===id); if(!p) return; const text=`${p.title}\n\n${p.description}\n\n${p.category} · ${p.zone}\n\n${APP_URL}`; if(navigator.share) navigator.share({title:p.title,text,url:APP_URL}).catch(()=>{}); else navigator.clipboard?.writeText(text).then(()=>toast('Copiado para compartir.')); }
  function toggleFollow(ownerId){ if(ownerId===userId()) return toast('Esta publicación es tuya.'); const cur=follows(); const next=cur.includes(ownerId)?cur.filter(id=>id!==ownerId):[...cur,ownerId]; set(K.follows,next); toast(cur.includes(ownerId)?'Dejaste de seguir.':'Ahora lo sigues.'); render(); }
  async function fetchPublicMessages(params = {}){
    const qs = new URLSearchParams(params);
    const res = await fetch(`/api/messages?${qs.toString()}`, {cache:'no-store'});
    const data = await res.json().catch(()=>({ok:false}));
    if(!res.ok || !data.ok) throw new Error(data.message || data.error || 'No se pudieron cargar mensajes.');
    return data.messages || [];
  }

  async function savePublicMessage(message){
    const res = await fetch('/api/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({message})
    });
    const data = await res.json().catch(()=>({ok:false}));
    if(!res.ok || !data.ok) throw new Error(data.message || data.error || 'No se pudo enviar.');
    return data.message || message;
  }

  async function loadMessagesForInbox(options = {}){
    if(state.messagesLoading) return;
    state.messagesLoading = !options.silent;
    state.messagesError = '';
    try{
      const list = await fetchPublicMessages({userId:userId()});
      const previous = JSON.stringify(state.publicMessages || []);
      state.publicMessages = list;
      state.messagesLoaded = true;
      if(options.silent && state.route === '/mensajes' && JSON.stringify(list) !== previous) render();
    }catch(e){
      if(!options.silent) state.messagesError = 'Todavía no se pudieron cargar los mensajes públicos. Revisa conexión o la tabla de mensajes.';
    }finally{
      state.messagesLoading = false;
      if(state.route === '/mensajes' && !options.silent) render();
    }
  }

  async function loadChatMessages(options = {}){
    if(!state.chat || state.chatLoading) return;
    const activeInput = document.getElementById('chatText');
    const isTyping = !!(activeInput && document.activeElement === activeInput && activeInput.value.trim());
    if(options.silent && isTyping) return;
    state.chatLoading = !options.silent;
    try{
      const list = await fetchPublicMessages({userId:userId(), postId:state.chat.postId, peerId:state.chat.peerId});
      const previous = JSON.stringify(state.chatMessages || []);
      state.chatMessages = list;
      state.chatLoaded = true;
      if(options.silent && state.route === '/chat' && JSON.stringify(list) !== previous) render();
    }catch(e){
      if(!options.silent) toast('No se pudieron cargar los mensajes.');
    }finally{
      state.chatLoading = false;
      if(state.route === '/chat' && !options.silent) render();
    }
  }

  function openChat(postId){
    const p = state.posts.find(x=>x.id===postId);
    if(!p) return;
    if(p.ownerId === userId()){
      toast('Esta publicación es tuya. Revisa Mensajes para responder.');
      nav('/mensajes');
      return;
    }
    state.chat = {postId:p.id, postTitle:p.title || 'Publicación', peerId:p.ownerId, peerName:p.ownerName || 'Usuario local'};
    state.chatMessages = [];
    state.chatLoaded = false;
    nav('/chat');
  }

  function openChatFromConversation(button){
    state.chat = {
      postId: button.dataset.post || '',
      postTitle: button.dataset.title || 'Publicación',
      peerId: button.dataset.peer || '',
      peerName: button.dataset.name || 'Usuario local'
    };
    state.chatMessages = [];
    state.chatLoaded = false;
    nav('/chat');
  }

  async function sendChatMessage(){
    if(!state.chat) return;
    const input = document.getElementById('chatText');
    const text = (input?.value || '').trim();
    if(!text) return toast('Escribe un mensaje.');
    if(!state.chat.peerId) return toast('No se encontró destinatario.');

    const prof = profile();
    const msg = {
      id: uid('msg'),
      postId: state.chat.postId,
      postTitle: state.chat.postTitle,
      senderId: userId(),
      senderName: prof.name || 'Usuario local',
      receiverId: state.chat.peerId,
      receiverName: state.chat.peerName || 'Usuario local',
      text,
      status: 'sent',
      createdAt: new Date().toISOString()
    };

    if(input) input.value = '';
    state.chatMessages = [...state.chatMessages, msg];
    render();

    try{
      await savePublicMessage(msg);
      state.messagesLoaded = false;
      await loadChatMessages({silent:true});
      toast('Mensaje enviado.');
    }catch(e){
      toast('No se pudo enviar. Revisa conexión e intenta de nuevo.');
    }
  }

  function sendMessage(postId){ openChat(postId); }
  function saveProfile(){ const name=document.getElementById('profileName')?.value.trim()||'Usuario local'; set(K.profile,{name}); toast('Nombre guardado.'); render(); }
  function clearFilters(){ state.filter='ALL'; state.query=''; render(); }
  function bindDynamicFeedControls(){
    document.querySelectorAll('[data-clear]').forEach(b=>b.onclick=clearFilters);
    document.querySelectorAll('[data-retry]').forEach(b=>b.onclick=()=>retryPost(b.dataset.retry));
    document.querySelectorAll('[data-like]').forEach(b=>b.onclick=()=>likePost(b.dataset.like));
    document.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>sharePost(b.dataset.share));
    document.querySelectorAll('[data-follow]').forEach(b=>b.onclick=()=>toggleFollow(b.dataset.follow));
    document.querySelectorAll('[data-message]').forEach(b=>b.onclick=()=>sendMessage(b.dataset.message));
    document.querySelectorAll('[data-open-chat]').forEach(b=>b.onclick=()=>openChatFromConversation(b));
    document.querySelectorAll('[data-send-chat]').forEach(b=>b.onclick=sendChatMessage);
    document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editPost(b.dataset.edit));
    document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deletePost(b.dataset.delete));
  }
  function bind(){
    document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.nav));
    document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;state.route='/';render();});
    document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=openPicker);
    document.querySelectorAll('[data-publish]').forEach(b=>b.onclick=publish);
    document.querySelectorAll('[data-save-profile]').forEach(b=>b.onclick=saveProfile);
    bindDynamicFeedControls();
    const picker=document.getElementById('mediaPicker'); if(picker) picker.onchange=fileChosen;
    const search=document.getElementById('searchInput'); if(search) search.oninput=e=>{state.query=e.target.value;updateFeedOnly();};
    const description=document.getElementById('description');
    if(description){
      description.oninput=e=>{ state.composerDraft.description=e.target.value; saveComposerDraft(); };
      description.onfocus=()=>{ state.composerDraft.description=description.value; saveComposerDraft(); };
    }
    const zone=document.getElementById('zone');
    if(zone) zone.oninput=e=>{ state.composerDraft.zone=e.target.value; saveComposerDraft(); };
    const category=document.getElementById('category');
    if(category) category.onchange=e=>{ state.composerDraft.category=normalizeCategory(e.target.value); saveComposerDraft(); };
  }
  function runVisibleRefresh(){
    if(document.visibilityState !== 'visible' || state.publishing) return;
    if(state.route === '/mensajes') loadMessagesForInbox({silent:true});
    else if(state.route === '/chat') loadChatMessages({silent:true});
    else if(!state.syncing && state.route !== '/publicar') syncFromCloud({render:true});
  }

  function startPolling(){
    if(state.syncTimer) clearInterval(state.syncTimer);
    if(state.messageTimer) clearInterval(state.messageTimer);
    state.syncTimer=setInterval(()=>{ if(document.visibilityState==='visible'&&!state.syncing&&!state.publishing&&state.route!=='/publicar'&&state.route!=='/mensajes'&&state.route!=='/chat') syncFromCloud({render:true}); },POLL_MS);
    state.messageTimer=setInterval(()=>{ runVisibleRefresh(); }, MESSAGE_POLL_MS);
    window.addEventListener('focus',()=>{ runVisibleRefresh(); });
    document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') runVisibleRefresh(); });
  }
  async function init(){ await refreshOldCaches(); state.posts=localPosts(); loadComposerDraft(); render(); await syncFromCloud({render:true}); startPolling(); }
  init();
})();
