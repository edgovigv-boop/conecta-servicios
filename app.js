/* Conecta Servicios v6.3.38-altavoz-foto-perfil
   Arreglo de raíz para video móvil:
   - La versión remota de Supabase gana sobre copias locales viejas.
   - Si un video tiene mediaUrl válida, nunca se muestra como pendiente.
   - El feed no carga videos incrustados; muestra tarjeta y abre visor interno.
   - Fotos, chat, borrado y muro público se conservan.
*/
(() => {
  'use strict';

  const VERSION = 'v6.3.38-altavoz-foto-perfil';
  const APP_URL = 'https://conecta-servicios.vercel.app/';
  const IMAGE_MAX_SIDE = 1280;
  const MAX_IMAGE_MB = 18;
  const MAX_VIDEO_MB = 1024;
  const MAX_VIDEO_SECONDS = 10 * 60;
  const POLL_MS = 7000;
  const MESSAGE_POLL_MS = 3500;
  const STORAGE_BUCKET = 'publication-media';

  const K = {
    posts: 'cs_v634_posts',
    user: 'cs_v634_user',
    follows: 'cs_v634_follows',
    profile: 'cs_v634_profile',
    composer: 'cs_v634_composer',
    seenMessages: 'cs_v639_seen_messages',
    readMessages: 'cs_v6310_read_messages',
    deletedPosts: 'cs_v6322_deleted_posts',
    likedPosts: 'cs_v6330_liked_posts',
    municipality: 'cs_v6330_municipality'
  };

  const CATEGORIES = ['VENDO', 'OFREZCO', 'NECESITO'];
  const ZONES = ['Tejupilco', 'Toluca', 'Metepec', 'Chapultepec', 'Centro', 'Zona cercana', 'Todo México'];

  const seed = [];

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const memoryUrls = new Map();
  let mediaDbPromise = null;

  const state = {
    route: '/',
    filter: 'ALL',
    query: '',
    searchOpen: false,
    searchTyping: false,
    searchRenderTimer: null,
    topTab: 'para-ti',
    storeOwnerId: '',
    storeOwnerName: '',
    posts: [],
    preview: '',
    mediaType: 'image',
    editing: null,
    composerId: '',
    composerMediaRef: '',
    composerMediaName: '',
    composerMediaMime: '',
    composerMediaItems: [],
    composerDraft: {description:'', zone:'', category:'VENDO'},
    cloudReady: false,
    publishing: false,
    syncing: false,
    syncTimer: null,
    messageTimer: null,
    publicMessages: [],
    messagesLoaded: false,
    messagesLoading: false,
    messagesError: '',
    chat: null,
    chatMessages: [],
    chatLoading: false,
    chatLoaded: false,
    knownMessageIds: new Set(),
    readMessageIds: new Set(),
    videoViewer: null,
    videoPlayingId: '',
    videoIsPlaying: false,
    lastUploadDiagnostic: null,
    runtimeDiagnostic: null,
    audioCtx: null
  };

  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const uid = (p='id') => `${p}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const get = (k,f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
  const set = (k,v) => localStorage.setItem(k, JSON.stringify(v));
  const norm = v => String(v || '').trim().toLowerCase();

  function userId(){ let id=localStorage.getItem(K.user); if(!id){ id=uid('u'); localStorage.setItem(K.user,id); } return id; }
  function profile(){ const saved=get(K.profile,null); if(saved) return {...saved, avatarData:saved.avatarData||''}; const fresh={name:'Usuario local', avatarData:''}; set(K.profile,fresh); return fresh; }
  function follows(){ return get(K.follows,[]); }
  const PILOT_MUNICIPALITIES = [
    {name:'Tejupilco', lat:18.905, lon:-100.153},
    {name:'Chapultepec', lat:19.203, lon:-99.562},
    {name:'Calimaya', lat:19.164, lon:-99.618},
    {name:'Metepec', lat:19.253, lon:-99.607},
    {name:'Toluca', lat:19.282, lon:-99.655},
    {name:'Mexicaltzingo', lat:19.212, lon:-99.585},
    {name:'San Mateo Atenco', lat:19.267, lon:-99.532},
    {name:'Ayala', lat:18.762, lon:-98.982}
  ];

  function kmBetween(a,b,c,d){
    const R=6371, toRad=x=>x*Math.PI/180;
    const dLat=toRad(c-a), dLon=toRad(d-b);
    const s=Math.sin(dLat/2)**2 + Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(dLon/2)**2;
    return 2*R*Math.asin(Math.sqrt(s));
  }

  function approximateMunicipio(lat, lon){
    let best = null;
    PILOT_MUNICIPALITIES.forEach(m => {
      const km = kmBetween(lat, lon, m.lat, m.lon);
      if(!best || km < best.km) best = {...m, km};
    });
    return best && best.km <= 80 ? best.name : 'Tu zona';
  }

  function municipalityInfo(){
    return get(K.municipality, null);
  }

  function municipioLabel(){
    const saved = municipalityInfo();
    if(saved?.name) return saved.name;
    try {
      const zones = filteredAll().map(p => p.zone).filter(Boolean).filter(z => z !== 'Todo México');
      return zones[0] || 'Tu zona';
    } catch {
      return 'Tu zona';
    }
  }

  function saveMunicipio(name, source='manual'){
    const clean = String(name || '').trim() || 'Tu zona';
    set(K.municipality, {name: clean, source, updatedAt: new Date().toISOString()});
    try { localStorage.setItem('cs_v6326_municipio', clean); } catch {}
    return clean;
  }

  function selectMunicipioTab(){
    state.topTab = 'municipio';
    state.filter = 'ALL';
    state.query = '';
    const saved = municipalityInfo();
    if(saved?.name){
      toast(`Viendo ${saved.name}`);
      render();
      return;
    }
    if(!navigator.geolocation){
      const manual = prompt('Escribe tu municipio para personalizar tu Home:', municipioLabel());
      if(manual) saveMunicipio(manual, 'manual');
      render();
      return;
    }
    if(confirm('¿Quieres usar tu ubicación aproximada para personalizar tu Home por municipio? No guardamos coordenadas exactas, solo el nombre aproximado.')){
      toast('Detectando zona aproximada...');
      navigator.geolocation.getCurrentPosition(
        pos => {
          const name = approximateMunicipio(pos.coords.latitude, pos.coords.longitude);
          saveMunicipio(name, 'approx-geolocation');
          toast(`Home personalizado para ${name}`);
          render();
        },
        () => {
          const manual = prompt('No se pudo detectar. Escribe tu municipio:', municipioLabel());
          if(manual) saveMunicipio(manual, 'manual');
          render();
        },
        {enableHighAccuracy:false, timeout:9000, maximumAge:86400000}
      );
    } else {
      render();
    }
  }

  function setTopTab(tab){
    if(tab === 'municipio') return selectMunicipioTab();
    state.topTab = tab === 'tienda' ? 'tienda' : 'para-ti';
    state.filter = state.topTab === 'tienda' ? 'VENDO' : 'ALL';
    state.query = '';
    toast(state.topTab === 'tienda' ? 'Tienda: publicaciones VENDO' : 'Para ti');
    render();
  }


  function toggleSearchPanel(){
    state.searchOpen = !state.searchOpen;
    if(state.searchOpen){
      state.filter = 'ALL';
      state.topTab = 'para-ti';
    }
    render();
    if(state.searchOpen) setTimeout(()=>{
      const input = document.getElementById('searchInput');
      input?.focus({preventScroll:true});
      try { input?.setSelectionRange(input.value.length, input.value.length); } catch {}
    }, 120);
  }

  function applySearchText(value){
    state.query = String(value || '');
    state.filter = 'ALL';
    state.topTab = 'para-ti';
    state.searchTyping = true;
    clearTimeout(state.searchRenderTimer);
    state.searchRenderTimer = setTimeout(() => {
      updateFeedOnly();
      state.searchTyping = false;
      const input = document.getElementById('searchInput');
      if(input && state.searchOpen){
        input.focus({preventScroll:true});
        try { input.setSelectionRange(input.value.length, input.value.length); } catch {}
      }
    }, 140);
  }

  function closeSearchPanel(){
    state.searchOpen = false;
    state.query = '';
    state.filter = 'ALL';
    render();
  }

  function searchResultText(){
    const q = state.query.trim();
    if(!q) return '';
    const count = filteredPosts().length;
    return `${count} resultado${count === 1 ? '' : 's'} para “${q}”`;
  }

  function toast(msg){ if(!toastEl) return; toastEl.textContent=msg; toastEl.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>toastEl.classList.remove('show'),3000); }

  function diagnosticPayload(kind, detail='', extra={}){
    return {
      version: VERSION,
      kind,
      detail: String(detail || '').slice(0, 1200),
      extra,
      at: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: location.href,
      serviceWorkerControlled: !!navigator.serviceWorker?.controller,
      bootVersion: window.CONNETA_BOOT_VERSION || window.CONNECTA_BOOT_VERSION || ''
    };
  }

  function saveUploadDiagnostic(kind, detail='', extra={}){
    const payload = diagnosticPayload(kind, detail, extra);
    state.lastUploadDiagnostic = payload;
    try { set('cs_v6323_last_upload_diagnostic', payload); } catch {}
    console.warn('[Conecta video diagnostic]', payload);
    return payload;
  }

  function clearUploadDiagnostic(){
    state.lastUploadDiagnostic = null;
    try { localStorage.removeItem('cs_v6323_last_upload_diagnostic'); } catch {}
  }

  function shortDiagnosticText(diag){
    if(!diag) return 'Sin error registrado en esta versión.';
    const d = diag.detail || '';
    const e = diag.extra ? JSON.stringify(diag.extra).slice(0, 500) : '';
    return `${diag.kind || 'diagnóstico'} · ${diag.at || ''}\n${d}${e ? '\n' + e : ''}`;
  }

  function isSearchActive(){
    const active = document.activeElement;
    return !!(state.searchOpen && active && active.id === 'searchInput');
  }

  function shouldAvoidRender(){
    return isAnyVideoPlaying() || isSearchActive() || state.searchTyping;
  }

  function isAnyVideoPlaying(){
    if(state.videoIsPlaying) return true;
    try{
      return [...document.querySelectorAll('video.feed-video-player, .video-viewer video')]
        .some(v => !v.paused && !v.ended && v.readyState > 1);
    }catch{
      return false;
    }
  }

  function safeRender(reason=''){
    if(shouldAvoidRender()){
      console.info('[Conecta] Render omitido durante reproducción/video/búsqueda', reason);
      return false;
    }
    render();
    return true;
  }


  async function resetTechnicalApp(){
    if(!confirm('Esto limpiará caché, service worker y publicaciones locales de este dispositivo. Las publicaciones públicas seguirán en Supabase. ¿Continuar?')) return;
    toast('Limpiando caché local...');
    try{
      const keepUser = localStorage.getItem(K.user);
      const keepProfile = localStorage.getItem(K.profile);
      const keepFollows = localStorage.getItem(K.follows);
      const keepRead = localStorage.getItem(K.readMessages);

      if('caches' in window){
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k.startsWith('conecta-servicios-')).map(k => caches.delete(k)));
      }

      if('serviceWorker' in navigator){
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg => reg.unregister().catch(()=>null)));
      }

      Object.keys(localStorage).forEach(key => {
        if(key.startsWith('cs_v') || key.startsWith('conecta') || key.includes('cache_version')) localStorage.removeItem(key);
      });

      if(keepUser) localStorage.setItem(K.user, keepUser);
      if(keepProfile) localStorage.setItem(K.profile, keepProfile);
      if(keepFollows) localStorage.setItem(K.follows, keepFollows);
      if(keepRead) localStorage.setItem(K.readMessages, keepRead);

      toast('Limpieza lista. Recargando...');
      setTimeout(()=>location.replace('/?v=6323-reset-' + Date.now()), 800);
    }catch(error){
      saveUploadDiagnostic('reset-error', error?.message || String(error));
      toast('No se pudo limpiar completo. Revisa diagnóstico.');
    }
  }

  function copyDiagnostics(){
    const data = {
      version: VERSION,
      bootVersion: window.CONNECTA_BOOT_VERSION || '',
      url: location.href,
      serviceWorkerControlled: !!navigator.serviceWorker?.controller,
      localPosts: localPosts().map(p => ({id:p.id, title:p.title, mediaType:p.mediaType, mediaStatus:p.mediaStatus, cloudStatus:p.cloudStatus, hasMediaUrl:!!p.mediaUrl, mediaError:p.mediaError || ''})).slice(0, 30),
      lastUploadDiagnostic: state.lastUploadDiagnostic || get('cs_v6323_last_upload_diagnostic', null)
    };
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard?.writeText(text).then(()=>toast('Diagnóstico copiado.')).catch(()=>alert(text));
  }

  function normalizeCategory(v){ const x=String(v||'').toUpperCase().trim(); return CATEGORIES.includes(x)?x:'VENDO'; }
  function titleFrom(text){ return (String(text||'').split('\n').map(x=>x.trim()).find(Boolean)||'Publicación').slice(0,72); }
  function isSeed(post){ return String(post?.id || '').startsWith('seed-'); }
  function postStatus(post){ return norm(post?.status || post?.data?.status || 'activa'); }
  function isDeleted(post){ return postStatus(post) === 'eliminada'; }
  function isVideoUrl(url=''){ return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(String(url)); }
  function isVideoPost(post){ return norm(post?.mediaType) === 'video' || isVideoUrl(post?.mediaUrl || '') || norm(post?.mediaMime).startsWith('video/'); }
  function hasRemoteMedia(post){ return !!String(post?.mediaUrl || '').trim(); }

  function normalizePost(post, source='local'){
    if(!post || typeof post !== 'object') return post;
    const mediaUrl = String(post.mediaUrl || '').trim();
    const next = {
      ...post,
      id: post.id || post.client_id || uid('post'),
      ownerId: post.ownerId || post.owner_id || '',
      category: normalizeCategory(post.category),
      status: post.status || postStatus(post) || 'activa',
      cloudStatus: post.cloudStatus || (source === 'remote' ? 'publica' : ''),
      updatedAt: post.updatedAt || post.updated_at || post.createdAt || post.created_at || new Date().toISOString(),
      createdAt: post.createdAt || post.created_at || post.updatedAt || post.updated_at || new Date().toISOString()
    };

    if(mediaUrl){
      next.mediaUrl = mediaUrl;
      next.cloudStatus = 'publica';
      next.mediaStatus = '';
      next.mediaPending = false;
      if(isVideoPost(next)) next.mediaType = 'video';
    }

    if(isVideoPost(next) && !next.mediaType) next.mediaType = 'video';
    if(!next.mediaType) next.mediaType = mediaUrl ? 'image' : 'image';

    return next;
  }

  function loadDeletedIds(){ return new Set(get(K.deletedPosts, [])); }
  function saveDeletedIds(ids){ try { set(K.deletedPosts, [...ids].slice(-1500)); } catch {} }

  function softKey(post){
    if(!post) return '';
    return [
      norm(post.ownerId),
      norm(post.title),
      norm(post.description).slice(0,160),
      norm(post.zone),
      normalizeCategory(post.category)
    ].join('|');
  }

  function localPosts(){
    const saved = get(K.posts, null);
    if(!saved){
      set(K.posts, seed);
      return seed.map(p => normalizePost(p)).filter(p => !isSeed(p));
    }
    return (Array.isArray(saved) ? saved : []).map(p => normalizePost(p)).filter(p => !isSeed(p));
  }

  function stripForLocal(post){
    const p = {...post};
    delete p.mediaPreviewUrl;
    return p;
  }

  function stripForRemote(post){
    const p = {...post};
    delete p.mediaPreviewUrl;
    delete p.mediaRef;
    delete p.mediaData;
    return p;
  }

  function chooseBetterPost(a,b){
    a = normalizePost(a);
    b = normalizePost(b);
    if(!a) return b;
    if(!b) return a;

    if(isDeleted(b) && !isDeleted(a)) return b;
    if(isDeleted(a) && !isDeleted(b)) return a;

    // Regla central del arreglo: mediaUrl remota/video real siempre gana.
    if(hasRemoteMedia(b) && !hasRemoteMedia(a)) return b;
    if(hasRemoteMedia(a) && !hasRemoteMedia(b)) return a;

    if(hasRemoteMedia(b) && hasRemoteMedia(a)){
      if(norm(b.cloudStatus) === 'publica' && norm(a.cloudStatus) !== 'publica') return b;
      if(norm(a.cloudStatus) === 'publica' && norm(b.cloudStatus) !== 'publica') return a;
      if(norm(a.mediaStatus) === 'pendiente' && norm(b.mediaStatus) !== 'pendiente') return b;
      if(norm(b.mediaStatus) === 'pendiente' && norm(a.mediaStatus) !== 'pendiente') return a;
    }

    const at = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bt = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bt >= at ? {...a,...b} : {...b,...a};
  }

  function dedupePosts(posts){
    const byId = new Map();
    (posts || []).map(p => normalizePost(p)).forEach(p => {
      if(!p || !p.id) return;
      byId.set(String(p.id), chooseBetterPost(byId.get(String(p.id)), p));
    });

    const bySoft = [];
    [...byId.values()].forEach(p => {
      const key = softKey(p);
      const i = bySoft.findIndex(x => softKey(x) === key && Math.abs(new Date(x.createdAt||0)-new Date(p.createdAt||0)) < 120000);
      if(i >= 0) bySoft[i] = chooseBetterPost(bySoft[i], p);
      else bySoft.push(p);
    });

    return bySoft.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  }

  function isFreshOwnUploading(post){
    if(!post || post.ownerId !== userId()) return false;
    const updated = new Date(post.updatedAt || post.createdAt || 0).getTime();
    const fresh = Number.isFinite(updated) && (Date.now() - updated) < 8 * 60 * 1000;
    return fresh && ['local','subiendo'].includes(norm(post.cloudStatus));
  }

  function mergeLocalAndRemote(local, remote){
    const deleted = loadDeletedIds();
    const remoteById = new Map();
    const remoteBySoft = new Map();

    (remote || []).map(p => normalizePost(p, 'remote')).forEach(p => {
      if(!p || !p.id) return;
      if(isDeleted(p)){
        deleted.add(String(p.id));
        const sk = softKey(p);
        if(sk) deleted.add('soft:' + sk);
        return;
      }
      remoteById.set(String(p.id), p);
      const sk = softKey(p);
      if(sk) remoteBySoft.set(sk, p);
    });

    const merged = [];
    const usedRemoteIds = new Set();

    (local || []).map(p => normalizePost(p)).forEach(lp => {
      if(!lp || !lp.id) return;
      if(isSeed(lp)){ return; }

      const sk = softKey(lp);
      if(deleted.has(String(lp.id)) || deleted.has('soft:' + sk) || isDeleted(lp)) return;

      const rp = remoteById.get(String(lp.id)) || remoteBySoft.get(sk);
      if(rp){
        const chosen = chooseBetterPost(lp, rp);
        merged.push(chosen);
        usedRemoteIds.add(String(rp.id));
        return;
      }

      // No resucitar copias públicas viejas que ya no existen en Supabase.
      if(norm(lp.cloudStatus) === 'publica' || hasRemoteMedia(lp) || norm(lp.mediaStatus) === 'pendiente'){
        if(isFreshOwnUploading(lp)) merged.push(lp);
        return;
      }

      if(lp.ownerId === userId()) merged.push(lp);
    });

    (remote || []).map(p => normalizePost(p, 'remote')).forEach(rp => {
      if(!rp || !rp.id || isDeleted(rp)) return;
      if(usedRemoteIds.has(String(rp.id))) return;
      if(merged.some(p => String(p.id) === String(rp.id))) return;
      merged.push(rp);
    });

    saveDeletedIds(deleted);
    return dedupePosts(merged);
  }

  function saveLocalPosts(posts){
    const normalized = dedupePosts(posts).filter(p => !isDeleted(p) && !isSeed(p));
    state.posts = normalized;
    set(K.posts, normalized.map(stripForLocal));
  }

  function likedPostIds(){ return get(K.likedPosts, []); }
  function likedCategories(){
    const ids = new Set(likedPostIds());
    return new Set(filteredAll().filter(p => ids.has(p.id)).map(p => normalizeCategory(p.category)).filter(Boolean));
  }
  function paraTiScore(post){
    const likedIds = new Set(likedPostIds());
    const cats = likedCategories();
    const currentMunicipio = norm(municipioLabel());
    let score = 0;
    if(likedIds.has(post.id)) score += 10000;
    if(cats.has(normalizeCategory(post.category))) score += 500;
    if(currentMunicipio && norm(post.zone) === currentMunicipio) score += 350;
    score += Math.min(300, Number(post.reactions || 0) * 15);
    score += Math.max(0, 180 - ((Date.now() - new Date(post.createdAt || 0).getTime()) / 3600000));
    return score;
  }

  function normalizeSearchText(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function postSearchText(post){
    return normalizeSearchText([
      post.title,
      post.description,
      post.zone,
      post.category,
      post.ownerName,
      post.mediaName
    ].join(' '));
  }

  function filteredPosts(){
    const q = normalizeSearchText(state.query);
    let list = dedupePosts(state.posts)
      .filter(p => !isDeleted(p))
      .filter(p => {
        if(q) return true;
        if(state.topTab === 'tienda') return normalizeCategory(p.category) === 'VENDO';
        if(state.topTab === 'municipio'){
          const municipio = norm(municipioLabel());
          return !municipio || municipio === 'tu zona' ? true : norm(p.zone) === municipio || norm(p.zone) === 'todo méxico';
        }
        return state.filter === 'ALL' || normalizeCategory(p.category) === state.filter;
      })
      .filter(p => {
        if(!q) return true;
        const haystack = postSearchText(p);
        return q.split(' ').every(token => haystack.includes(token));
      });

    if(!q && state.topTab === 'para-ti'){
      list = list.sort((a,b) => paraTiScore(b) - paraTiScore(a));
    } else {
      list = list.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    }
    return list;
  }

  function myPosts(){ return filteredAll().filter(p => p.ownerId === userId()); }
  function followedPosts(){ const ids = new Set(follows()); return filteredAll().filter(p => ids.has(p.ownerId)); }
  function filteredAll(){ return dedupePosts(state.posts).filter(p => !isDeleted(p)).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)); }
  function ownerPosts(ownerId){
    return filteredAll().filter(p => p.ownerId === ownerId);
  }

  function ownerVendoPosts(ownerId){
    return ownerPosts(ownerId).filter(p => normalizeCategory(p.category) === 'VENDO');
  }

  function ownerSummary(ownerId){
    const posts = ownerPosts(ownerId);
    const first = posts[0] || {};
    return {
      ownerId,
      ownerName: first.ownerName || (ownerId === userId() ? profile().name || 'Mi perfil' : 'Usuario local'),
      ownerAvatar: first.ownerAvatar || (ownerId === userId() ? profile().avatarData || '' : ''),
      total: posts.length,
      vendo: posts.filter(p => normalizeCategory(p.category) === 'VENDO').length,
      ofrezco: posts.filter(p => normalizeCategory(p.category) === 'OFREZCO').length,
      necesito: posts.filter(p => normalizeCategory(p.category) === 'NECESITO').length,
      lastAt: posts[0]?.createdAt || '',
      isFollowing: follows().includes(ownerId),
      isMe: ownerId === userId()
    };
  }

  function allOwnerSummaries(){
    const ids = new Set(filteredAll().map(p => p.ownerId).filter(Boolean));
    ids.add(userId());
    return [...ids].map(ownerSummary)
      .filter(s => s.total > 0 || s.isMe)
      .sort((a,b) => (b.isMe - a.isMe) || (Number(b.isFollowing) - Number(a.isFollowing)) || b.vendo - a.vendo || new Date(b.lastAt||0)-new Date(a.lastAt||0));
  }

  function openStore(ownerId){
    const id = ownerId || userId();
    const summary = ownerSummary(id);
    state.storeOwnerId = id;
    state.storeOwnerName = summary.ownerName;
    state.topTab = 'tienda';
    state.filter = 'ALL';
    state.query = '';
    nav('/tienda');
  }


  function requestRenderSoon(){ clearTimeout(requestRenderSoon._t); requestRenderSoon._t=setTimeout(()=>{ if(state.route !== '/publicar') render(); },60); }

  function openMediaDb(){
    if(mediaDbPromise) return mediaDbPromise;
    mediaDbPromise = new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)) return reject(new Error('IndexedDB no disponible'));
      const req = indexedDB.open('conecta_media_v634',1);
      req.onupgradeneeded = () => req.result.createObjectStore('files');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return mediaDbPromise;
  }

  async function saveMediaBlob(ref, blob){
    const db = await openMediaDb();
    return new Promise((resolve,reject)=>{
      const tx = db.transaction('files','readwrite');
      tx.objectStore('files').put(blob, ref);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function loadMediaBlob(ref){
    const db = await openMediaDb();
    return new Promise((resolve,reject)=>{
      const tx = db.transaction('files','readonly');
      const req = tx.objectStore('files').get(ref);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  function objectUrlFor(ref, blob){
    if(!ref || !blob) return '';
    if(memoryUrls.has(ref)) return memoryUrls.get(ref);
    const url = URL.createObjectURL(blob);
    memoryUrls.set(ref, url);
    return url;
  }

  function blobToDataURL(blob){
    return new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('No se pudo leer imagen'));
      reader.readAsDataURL(blob);
    });
  }

  function avatarMarkup(src, alt='Usuario'){
    return src ? `<img class="owner-avatar-img" src="${esc(src)}" alt="${esc(alt)}">` : '<span class="owner-dot">👤</span>';
  }

  function postAvatar(post){
    if(post?.ownerAvatar) return post.ownerAvatar;
    if(post?.ownerId === userId()) return profile().avatarData || '';
    return '';
  }

  function resolveMediaItem(item){
    if(!item) return '';
    if(item.mediaUrl) return item.mediaUrl;
    if(item.mediaData) return item.mediaData;
    if(item.mediaPreviewUrl) return item.mediaPreviewUrl;
    if(item.mediaRef){
      if(memoryUrls.has(item.mediaRef)) return memoryUrls.get(item.mediaRef);
      loadMediaBlob(item.mediaRef).then(blob => {
        if(blob){ objectUrlFor(item.mediaRef, blob); requestRenderSoon(); }
      }).catch(()=>{});
    }
    return '';
  }

  function resolveMedia(post){
    if(post?.mediaUrl) return post.mediaUrl;
    if(post?.mediaData) return post.mediaData;
    if(post?.mediaPreviewUrl) return post.mediaPreviewUrl;
    if(post?.mediaRef){
      if(memoryUrls.has(post.mediaRef)) return memoryUrls.get(post.mediaRef);
      loadMediaBlob(post.mediaRef).then(blob => {
        if(blob){ objectUrlFor(post.mediaRef, blob); requestRenderSoon(); }
      }).catch(()=>{});
    }
    return '';
  }

  async function getPublicConfig(){
    try { const res = await fetch('/api/public-config', {cache:'no-store'}); return await res.json(); }
    catch { return {ok:false}; }
  }

  function dataUrlToBlob(dataUrl){
    const [header,body] = String(dataUrl||'').split(',');
    if(!header || !body) return null;
    const mime = (header.match(/data:([^;]+)/)||[])[1] || 'application/octet-stream';
    const bin = atob(body);
    const bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    return new Blob([bytes], {type:mime});
  }


  function toTusMetadataValue(value){
    const text = String(value || '');
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  function buildTusMetadata(meta){
    return Object.entries(meta)
      .filter(([,value]) => value !== undefined && value !== null && String(value) !== '')
      .map(([key,value]) => `${key} ${toTusMetadataValue(value)}`)
      .join(',');
  }

  function directStorageEndpoint(supabaseBase){
    try{
      const url = new URL(supabaseBase);
      const projectId = url.hostname.split('.')[0];
      if(projectId) return `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`;
    }catch{}
    return `${supabaseBase}/storage/v1/upload/resumable`;
  }

  async function fetchWithRetry(url, options, attempts=4){
    let lastError = null;
    for(let i=0;i<attempts;i++){
      try{
        const response = await fetch(url, options);
        if(response.ok || response.status === 204) return response;
        const detail = await response.text().catch(()=>'');
        lastError = new Error(`HTTP ${response.status} ${detail}`.slice(0, 600));
      }catch(error){
        lastError = error;
      }
      await new Promise(resolve => setTimeout(resolve, [0, 1200, 3000, 6000][i] || 6000));
    }
    throw lastError || new Error('UPLOAD_FAILED');
  }

  function updateUploadToast(bytesUploaded, bytesTotal){
    if(!bytesTotal) return;
    const pct = Math.max(1, Math.min(99, Math.round((bytesUploaded / bytesTotal) * 100)));
    const step = Math.floor(pct / 10) * 10;
    if(updateUploadToast._lastStep === step) return;
    updateUploadToast._lastStep = step;
    toast(`Subiendo video... ${pct}%`);
  }

  async function uploadMediaTus({blob, supabaseBase, bucket, path, anonKey, contentType}){
    const endpoint = directStorageEndpoint(supabaseBase);
    const metadata = buildTusMetadata({
      bucketName: bucket,
      objectName: path,
      contentType: contentType || blob.type || 'application/octet-stream',
      cacheControl: '3600'
    });

    updateUploadToast._lastStep = -1;
    toast('Preparando subida resumible...');

    const create = await fetchWithRetry(endpoint, {
      method: 'POST',
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Length': String(blob.size),
        'Upload-Metadata': metadata,
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
        'x-upsert': 'true'
      }
    }, 3);

    let uploadUrl = create.headers.get('Location') || create.headers.get('location');
    if(uploadUrl && uploadUrl.startsWith('/')) uploadUrl = `${new URL(endpoint).origin}${uploadUrl}`;
    if(!uploadUrl) throw new Error('Supabase no devolvió URL resumible para continuar la subida.');

    const chunkSize = 6 * 1024 * 1024; // Recomendación Supabase/TUS: 6 MB.
    let offset = 0;

    while(offset < blob.size){
      const chunk = blob.slice(offset, Math.min(offset + chunkSize, blob.size));
      const patch = await fetchWithRetry(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': String(offset),
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey
        },
        body: chunk
      }, 5);

      const nextOffset = Number(patch.headers.get('Upload-Offset') || patch.headers.get('upload-offset') || 0);
      offset = nextOffset > offset ? nextOffset : offset + chunk.size;
      updateUploadToast(offset, blob.size);
    }

    toast('Video subido. Guardando publicación...');
    return true;
  }

  async function uploadOneMediaItem(post, item, index, cfg){
    let blob = null;
    if(item.mediaRef) blob = await loadMediaBlob(item.mediaRef).catch(()=>null);
    if(!blob && item.mediaData) blob = dataUrlToBlob(item.mediaData);
    if(!blob) throw new Error(`NO_LOCAL_BLOB_ITEM_${index}`);

    const supabaseBase = String(cfg.supabaseUrl || '').trim().replace(/\/rest\/v1\/?$/i,'').replace(/\/+$/g,'');
    const bucket = cfg.storageBucket || STORAGE_BUCKET;
    const originalName = item.mediaName || `foto-${index+1}.jpg`;
    const safeName = originalName.replace(/[^a-z0-9_.-]/gi,'-').toLowerCase();
    const path = `${encodeURIComponent(post.ownerId || userId())}/${encodeURIComponent(post.id)}/${Date.now()}-${index}-${safeName}`;
    const url = `${supabaseBase}/storage/v1/object/${bucket}/${path}`;
    const contentType = item.mediaMime || blob.type || 'application/octet-stream';
    const itemIsVideo = String(item.mediaType || '').toLowerCase() === 'video' || contentType.startsWith('video/');

    if(itemIsVideo || blob.size > 6 * 1024 * 1024){
      await uploadMediaTus({blob, supabaseBase, bucket, path, anonKey: cfg.supabaseAnonKey, contentType});
    }else{
      const res = await fetch(url, {
        method:'POST',
        headers:{
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
          'Content-Type': contentType,
          'x-upsert':'true'
        },
        body: blob
      });
      if(!res.ok){
        const detail = await res.text().catch(()=>'');
        throw new Error(detail || `HTTP ${res.status}`);
      }
    }

    return {
      ...item,
      mediaUrl: `${supabaseBase}/storage/v1/object/public/${bucket}/${path}`,
      mediaStatus: '',
      mediaPending: false,
      mediaUploadedAt: new Date().toISOString(),
      mediaType: item.mediaType || (itemIsVideo ? 'video' : 'image')
    };
  }

  async function uploadMediaToCloud(post){
    if(post.mediaUrl) return {post: normalizePost(post,'remote'), ok:true};
    const cfg = await getPublicConfig();
    if(!cfg.ok || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return {post, ok:false, detail:'PUBLIC_CONFIG_MISSING'};

    if(Array.isArray(post.mediaItems) && post.mediaItems.length){
      try{
        saveUploadDiagnostic('upload-gallery-start', 'Iniciando subida de galería.', {postId:post.id, count:post.mediaItems.length});
        const uploadedItems = [];
        for(let i=0; i<post.mediaItems.length; i++){
          const item = post.mediaItems[i];
          uploadedItems.push(item.mediaUrl ? item : await uploadOneMediaItem(post, item, i, cfg));
          toast(`Subiendo fotos... ${i+1}/${post.mediaItems.length}`);
        }
        const first = uploadedItems[0] || {};
        saveUploadDiagnostic('upload-gallery-success', 'Galería subida correctamente.', {postId:post.id, count:uploadedItems.length});
        return {
          ok:true,
          post: normalizePost({
            ...post,
            mediaItems: uploadedItems,
            mediaUrl: first.mediaUrl || post.mediaUrl || '',
            mediaType: first.mediaType || 'image',
            mediaStatus:'',
            mediaPending:false,
            cloudStatus:'publica',
            updatedAt:new Date().toISOString()
          }, 'remote')
        };
      }catch(error){
        const detail = error?.message || String(error);
        saveUploadDiagnostic('upload-gallery-error', detail, {postId:post.id});
        return {post, ok:false, detail};
      }
    }

    let blob = null;
    if(post.mediaRef) blob = await loadMediaBlob(post.mediaRef).catch(()=>null);
    if(!blob && post.mediaData) blob = dataUrlToBlob(post.mediaData);
    if(!blob){ saveUploadDiagnostic('upload-no-blob', 'No se encontró el archivo local para subir.', {postId:post.id, mediaRef:post.mediaRef}); return {post, ok:false, detail:'NO_LOCAL_BLOB'}; }

    saveUploadDiagnostic('upload-start', 'Iniciando subida de multimedia.', {postId:post.id, mediaType:post.mediaType, bytes:blob.size, mime:post.mediaMime || blob.type});

    const supabaseBase = String(cfg.supabaseUrl || '').trim().replace(/\/rest\/v1\/?$/i,'').replace(/\/+$/g,'');
    const bucket = cfg.storageBucket || STORAGE_BUCKET;
    const originalName = post.mediaName || `${post.mediaType || 'media'}.bin`;
    const safeName = originalName.replace(/[^a-z0-9_.-]/gi,'-').toLowerCase();
    const path = `${encodeURIComponent(post.ownerId || userId())}/${encodeURIComponent(post.id)}/${Date.now()}-${safeName}`;
    const url = `${supabaseBase}/storage/v1/object/${bucket}/${path}`;

    const contentType = post.mediaMime || blob.type || 'application/octet-stream';
    const shouldUseTus = isVideoPost(post) || blob.size > 6 * 1024 * 1024;

    if(shouldUseTus){
      try{
        await uploadMediaTus({
          blob,
          supabaseBase,
          bucket,
          path,
          anonKey: cfg.supabaseAnonKey,
          contentType
        });
      }catch(error){
        const detail = error?.message || String(error);
        saveUploadDiagnostic('upload-tus-error', detail, {postId:post.id, bytes:blob.size, bucket, path});
        return {post, ok:false, detail};
      }
    }else{
      const res = await fetch(url, {
        method:'POST',
        headers:{
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
          'Content-Type': contentType,
          'x-upsert':'true'
        },
        body: blob
      });

      if(!res.ok){
        const detail = await res.text().catch(()=>'');
        saveUploadDiagnostic('upload-direct-error', detail, {postId:post.id, status:res.status, bucket, path});
        return {post, ok:false, detail};
      }
    }

    const mediaUrl = `${supabaseBase}/storage/v1/object/public/${bucket}/${path}`;
    saveUploadDiagnostic('upload-success', 'Multimedia subida correctamente.', {postId:post.id, mediaUrl, bytes:blob.size});
    return {
      ok:true,
      post: normalizePost({
        ...post,
        mediaUrl,
        mediaData:'',
        mediaPreviewUrl:'',
        mediaStatus:'',
        mediaPending:false,
        cloudStatus:'publica',
        mediaUploadedAt:new Date().toISOString(),
        updatedAt:new Date().toISOString()
      }, 'remote')
    };
  }

  async function syncPost(post){
    try{
      const clean = stripForRemote(normalizePost(post));
      const res = await fetch('/api/publications', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({post: clean})
      });
      const data = await res.json().catch(()=>({ok:false}));
      return !!(res.ok && data.ok);
    }catch{
      return false;
    }
  }

  async function syncFromCloud(options={}){
    if(state.syncing) return false;
    state.syncing = true;
    try{
      const res = await fetch('/api/publications', {cache:'no-store'});
      const data = await res.json();
      if(!res.ok || !data.ok) throw new Error('offline');

      const remote = (data.posts || []).map(p => normalizePost(p, 'remote'));
      state.cloudReady = true;
      saveLocalPosts(mergeLocalAndRemote(localPosts(), remote));

      if(options.render !== false && state.route !== '/publicar' && !shouldAvoidRender()) render();
      return true;
    }catch{
      state.cloudReady = false;
      state.posts = localPosts().filter(p => !isDeleted(p));
      if(options.render !== false && state.route !== '/publicar' && !shouldAvoidRender()) render();
      return false;
    }finally{
      state.syncing = false;
    }
  }

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

  function injectRootStyles(){
    if(document.getElementById('cs-root-fix-styles')) return;
    const style = document.createElement('style');
    style.id = 'cs-root-fix-styles';
    style.textContent = `
      .video-tile{
        position:relative; width:100%; min-height:380px; height:100%;
        display:flex; align-items:center; justify-content:center; text-align:center;
        background:linear-gradient(135deg,#2d1b80,#7b45f2); color:#fff; overflow:hidden;
      }
      .video-tile::before{
        content:""; position:absolute; inset:0;
        background:radial-gradient(circle at center,rgba(255,255,255,.18),rgba(0,0,0,.12) 48%,rgba(0,0,0,.35));
      }
      .video-tile-content{position:relative; z-index:2; padding:26px; display:flex; flex-direction:column; align-items:center; gap:13px;}
      .video-play-big{
        width:92px; height:92px; border-radius:999px; border:0; background:rgba(255,255,255,.95);
        color:#111827; font-size:36px; font-weight:900; box-shadow:0 20px 50px rgba(0,0,0,.28);
      }
      .video-tile strong{font-size:20px; line-height:1.2;}
      .video-tile small{max-width:300px; line-height:1.35; opacity:.92;}
      .video-pill-btn{
        border:0; border-radius:999px; padding:12px 18px; font-weight:900;
        background:rgba(255,255,255,.94); color:#111827;
      }
      .video-pending-tile{background:linear-gradient(135deg,#6b7280,#1f2937);}
      .video-viewer{
        position:fixed; inset:0; z-index:9999; background:rgba(10,10,18,.96);
        display:flex; flex-direction:column; padding:env(safe-area-inset-top) 12px env(safe-area-inset-bottom);
      }
      .video-viewer-top{
        display:flex; align-items:center; justify-content:space-between; gap:12px; color:#fff; padding:12px 4px;
      }
      .video-viewer-top strong{font-size:16px; line-height:1.2;}
      .video-close{
        border:0; border-radius:999px; padding:10px 14px; background:rgba(255,255,255,.14); color:#fff; font-weight:900;
      }
      .video-viewer-body{flex:1; display:flex; align-items:center; justify-content:center; min-height:0;}
      .video-viewer video{max-width:100%; max-height:100%; width:100%; background:#000; border-radius:18px;}
      .video-viewer-note{color:rgba(255,255,255,.75); font-size:13px; text-align:center; padding:10px 10px 16px;}
      .media-area video.feed-video-player{
        display:block !important;
        width:100%;
        min-height:360px;
        height:100%;
        object-fit:cover;
        background:#000;
      }
      .media-pending{display:none !important;}
      .video-inline-wrap{position:relative;width:100%;height:100%;min-height:380px;background:#050507;}
      .video-inline-wrap video{display:block;width:100%;height:100%;min-height:380px;object-fit:cover;background:#000;}
      .video-inline-actions{position:absolute;left:14px;right:14px;bottom:84px;z-index:5;display:flex;gap:10px;justify-content:center;pointer-events:auto;}
      .video-inline-actions button{border:0;border-radius:999px;padding:10px 14px;font-weight:900;background:rgba(255,255,255,.94);color:#111827;box-shadow:0 8px 22px rgba(0,0,0,.22);}
      .video-load-error{position:absolute;left:18px;right:18px;top:45%;z-index:6;background:rgba(17,24,39,.9);color:#fff;border-radius:18px;padding:14px;text-align:center;font-weight:800;}
      body.video-playing .sync-pill{opacity:.45;}
      .top-space{height:0 !important;}
      .glass-top.tiktok-top{
        position:fixed !important;
        top:0; left:0; right:0;
        z-index:80;
        padding:calc(env(safe-area-inset-top) + 8px) 14px 10px;
        background:linear-gradient(180deg,rgba(0,0,0,.48),rgba(0,0,0,.18),rgba(0,0,0,0)) !important;
        backdrop-filter:none !important;
        -webkit-backdrop-filter:none !important;
        border:0 !important;
        box-shadow:none !important;
        color:#fff;
      }
      .tiktok-topbar{
        display:grid;
        grid-template-columns:42px 1fr 42px;
        align-items:center;
        gap:10px;
        min-height:44px;
      }
      .tiktok-tabs{
        display:flex;
        align-items:center;
        justify-content:center;
        gap:18px;
        min-width:0;
      }
      .tiktok-tab{
        appearance:none;
        border:0;
        background:transparent;
        color:rgba(255,255,255,.78);
        font-weight:900;
        font-size:16px;
        padding:8px 2px;
        position:relative;
        text-shadow:0 2px 12px rgba(0,0,0,.55);
        white-space:nowrap;
      }
      .tiktok-tab.active{color:#fff;}
      .tiktok-tab.active::after{
        content:"";
        position:absolute;
        left:50%;
        bottom:1px;
        transform:translateX(-50%);
        width:28px;
        height:3px;
        border-radius:999px;
        background:#fff;
        box-shadow:0 2px 10px rgba(0,0,0,.25);
      }
      .tiktok-icon-btn{
        width:42px;
        height:42px;
        display:flex;
        align-items:center;
        justify-content:center;
        border:0;
        border-radius:999px;
        background:rgba(0,0,0,.16);
        color:#fff;
        font-size:21px;
        font-weight:900;
        text-shadow:0 2px 12px rgba(0,0,0,.55);
        backdrop-filter:blur(6px);
      }
      .tiktok-search-panel{
        margin-top:8px;
        display:flex;
        align-items:center;
        gap:8px;
        padding:8px 10px;
        border-radius:999px;
        background:rgba(0,0,0,.38);
        backdrop-filter:blur(10px);
      }
      .tiktok-search-panel input{
        flex:1;
        min-width:0;
        border:0;
        background:transparent;
        color:#fff;
        outline:none;
        font-size:16px;
        font-weight:700;
      }
      .tiktok-search-panel input::placeholder{color:rgba(255,255,255,.78);}
      .tiktok-search-panel button{
        border:0;
        border-radius:999px;
        padding:7px 10px;
        font-weight:900;
        background:rgba(255,255,255,.88);
        color:#111827;
      }
      .tiktok-search-panel input,
      .tiktok-search-panel button{
        pointer-events:auto;
        touch-action:manipulation;
      }
      .tiktok-search-panel input{
        -webkit-user-select:text;
        user-select:text;
        caret-color:#fff;
      }
      .tiktok-search-panel{
        transform:translateZ(0);
        will-change:auto;
      }
      .tiktok-search-panel{
        position:relative;
        z-index:95;
      }
      .tiktok-filter-row{
        margin-top:8px;
        display:flex;
        gap:8px;
        justify-content:center;
        pointer-events:auto;
      }
      .tiktok-filter-row .path-card{
        min-width:0;
        flex:0 1 auto;
        padding:7px 11px !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.20) !important;
        color:#fff !important;
        border:1px solid rgba(255,255,255,.18) !important;
        box-shadow:none !important;
        backdrop-filter:blur(8px);
      }
      .tiktok-filter-row .path-card.active{
        background:rgba(255,255,255,.88) !important;
        color:#111827 !important;
      }
      .tiktok-filter-row .path-icon{font-size:14px !important;}
      .tiktok-filter-row .path-label{font-size:12px !important;font-weight:900;}
      .feed-title{margin-top:calc(env(safe-area-inset-top) + 112px) !important;}
      .brand-row,.path-row,.search-box{display:none;}
      .feed-title{
        padding:0 14px !important;
      }
      .feed-title h1{
        font-size:20px !important;
      }
      .feed-title p{
        font-size:12px !important;
      }
      .post-card{
        scroll-margin-top:calc(env(safe-area-inset-top) + 118px);
      }
      /* v6.3.29 Home visual estilo red social */
      .glass-top.visual-top{
        background:linear-gradient(180deg,rgba(0,0,0,.58),rgba(0,0,0,.18),rgba(0,0,0,0)) !important;
        padding:calc(env(safe-area-inset-top) + 6px) 10px 8px !important;
      }
      .visual-topbar{
        grid-template-columns:1fr 44px !important;
        gap:8px !important;
      }
      .visual-tabs{
        display:flex;
        align-items:center;
        justify-content:center;
        gap:10px;
        overflow:hidden;
        min-width:0;
      }
      .visual-tab{
        appearance:none;
        border:0;
        background:transparent;
        color:rgba(255,255,255,.76);
        font-weight:900;
        font-size:15px;
        line-height:1;
        padding:9px 0 8px;
        text-shadow:0 2px 12px rgba(0,0,0,.72);
        white-space:nowrap;
        position:relative;
      }
      .visual-tab.active{
        color:#fff;
        font-size:17px;
      }
      .visual-tab.active::after{
        content:"";
        position:absolute;
        left:50%;
        bottom:0;
        width:28px;
        height:3px;
        border-radius:999px;
        background:#fff;
        transform:translateX(-50%);
      }
      .municipio-tab{
        max-width:88px;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      .owner-row{
        cursor:pointer;
        display:inline-flex !important;
        width:auto;
        max-width:100%;
      }
      .store-panel,.owner-directory,.following-panel{
        margin:calc(env(safe-area-inset-top) + 92px) 12px 12px !important;
      }
      .owner-directory{
        margin-top:12px !important;
      }
      .store-hero{
        display:flex;
        gap:14px;
        align-items:center;
      }
      .store-avatar,.owner-avatar{
        width:54px;
        height:54px;
        border-radius:18px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:linear-gradient(135deg,#5b2eea,#14b8a6);
        color:#fff;
        font-size:28px;
        box-shadow:0 14px 32px rgba(91,46,234,.22);
        flex:0 0 auto;
      }
      .store-kicker{
        margin:0 0 3px !important;
        font-size:12px !important;
        color:#6b7280 !important;
        text-transform:uppercase;
        letter-spacing:.06em;
        font-weight:900;
      }
      .store-stats{
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        margin-top:14px;
      }
      .store-stats span{
        padding:8px 11px;
        border-radius:999px;
        background:#f3f4f6;
        color:#111827;
        font-size:12px;
        font-weight:800;
      }
      .owner-list{
        display:flex;
        flex-direction:column;
        gap:10px;
      }
      .owner-card{
        display:grid;
        grid-template-columns:54px 1fr auto;
        gap:12px;
        align-items:center;
        padding:12px;
        border-radius:20px;
        background:#fff;
        box-shadow:0 12px 34px rgba(17,24,39,.08);
      }
      .owner-card-main strong{
        display:block;
        font-size:15px;
        color:#111827;
      }
      .owner-card-main span{
        display:block;
        color:#6b7280;
        font-size:12px;
        margin-top:3px;
      }
      .owner-card-actions{
        display:flex;
        flex-direction:column;
        gap:6px;
        align-items:flex-end;
      }
      .owner-card-actions button{
        border:0;
        border-radius:999px;
        padding:8px 11px;
        background:#5b2eea;
        color:#fff;
        font-weight:900;
        font-size:12px;
        white-space:nowrap;
      }
      .owner-card-actions button.following{
        background:#111827;
      }
      .owner-card-actions small{
        color:#6b7280;
        font-weight:800;
      }
      .store-feed{
        margin-top:0 !important;
      }
      .media-carousel{
        display:flex;
        width:100%;
        height:100%;
        min-height:calc(100vh - 92px);
        overflow-x:auto;
        scroll-snap-type:x mandatory;
        scrollbar-width:none;
        background:#050507;
      }
      .media-carousel::-webkit-scrollbar{display:none;}
      .media-carousel img{
        flex:0 0 100%;
        width:100%;
        height:calc(100vh - 92px);
        min-height:calc(100vh - 92px);
        object-fit:cover;
        scroll-snap-align:center;
      }
      .gallery-count{
        position:absolute;
        top:calc(env(safe-area-inset-top) + 128px);
        right:14px;
        z-index:10;
        padding:6px 10px;
        border-radius:999px;
        background:rgba(0,0,0,.42);
        color:#fff;
        font-weight:900;
        font-size:12px;
        backdrop-filter:blur(8px);
      }
      .clean-video{
        cursor:pointer;
      }
      .gallery-arrow{
        position:absolute;
        top:50%;
        transform:translateY(-50%);
        z-index:18;
        width:44px;
        height:58px;
        border:0;
        border-radius:999px;
        background:rgba(0,0,0,.36);
        color:#fff;
        font-size:42px;
        line-height:1;
        display:flex;
        align-items:center;
        justify-content:center;
        text-shadow:0 2px 10px rgba(0,0,0,.4);
        backdrop-filter:blur(8px);
      }
      .gallery-prev{left:10px;}
      .gallery-next{right:10px;}
      .gallery-arrow.is-hidden{
        opacity:.18;
        pointer-events:none;
      }
      .sound-toggle{
        position:absolute;
        right:14px;
        top:calc(env(safe-area-inset-top) + 128px);
        z-index:22;
        width:44px;
        height:44px;
        border:0;
        border-radius:999px;
        background:rgba(0,0,0,.42);
        color:#fff;
        font-size:21px;
        backdrop-filter:blur(8px);
        box-shadow:0 10px 28px rgba(0,0,0,.22);
      }
      .media-bottom{
        z-index:30 !important;
        opacity:1 !important;
        visibility:visible !important;
        pointer-events:auto !important;
      }
      .action-stack{
        z-index:31 !important;
        pointer-events:auto !important;
      }
      .round-action{
        display:flex !important;
        flex-direction:column;
        align-items:center !important;
        justify-content:center !important;
        gap:1px;
        color:#111827 !important;
        pointer-events:auto !important;
      }
      .round-action span{
        line-height:1;
      }
      .round-action small{
        display:block;
        font-size:9px;
        line-height:1;
        font-weight:900;
        color:#111827;
        max-width:54px;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .follow-btn{
        z-index:31 !important;
        pointer-events:auto !important;
      }
      /* v6.3.34: galería y acciones siempre visibles */
      .media-carousel{
        position:relative !important;
        overflow-x:auto !important;
        overflow-y:hidden !important;
        touch-action:pan-x pinch-zoom;
      }
      .gallery-arrow{
        position:absolute !important;
        top:50% !important;
        transform:translateY(-50%) !important;
        z-index:80 !important;
        width:54px !important;
        height:72px !important;
        border:2px solid rgba(255,255,255,.65) !important;
        border-radius:999px !important;
        background:rgba(0,0,0,.62) !important;
        color:#fff !important;
        font-size:56px !important;
        line-height:.8 !important;
        font-weight:900 !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        text-shadow:0 3px 12px rgba(0,0,0,.65) !important;
        box-shadow:0 12px 34px rgba(0,0,0,.32) !important;
        backdrop-filter:blur(10px);
        opacity:1 !important;
        visibility:visible !important;
        pointer-events:auto !important;
      }
      .gallery-prev{
        left:12px !important;
        right:auto !important;
      }
      .gallery-next{
        right:12px !important;
        left:auto !important;
      }
      .gallery-arrow.is-hidden,
      .gallery-arrow.is-edge{
        opacity:.62 !important;
        pointer-events:auto !important;
      }
      .gallery-count{
        z-index:82 !important;
        background:rgba(0,0,0,.66) !important;
        border:1px solid rgba(255,255,255,.35) !important;
      }
      .media-bottom{
        right:10px !important;
        bottom:148px !important;
        z-index:75 !important;
        opacity:1 !important;
        visibility:visible !important;
        display:flex !important;
      }
      .action-stack{
        display:flex !important;
        flex-direction:column !important;
        gap:12px !important;
      }
      .action-stack .round-action{
        width:56px !important;
        height:56px !important;
        min-width:56px !important;
        min-height:56px !important;
        background:rgba(255,255,255,.94) !important;
        border:1px solid rgba(255,255,255,.86) !important;
        box-shadow:0 12px 34px rgba(0,0,0,.32) !important;
      }
      .action-stack .round-action small{
        font-size:8px !important;
        max-width:50px !important;
      }
      .post-action-row{
        display:flex !important;
        gap:8px !important;
        flex-wrap:wrap !important;
        margin-top:10px !important;
        position:relative !important;
        z-index:90 !important;
        pointer-events:auto !important;
      }
      .post-action-row button{
        border:1px solid rgba(255,255,255,.30) !important;
        border-radius:999px !important;
        padding:8px 10px !important;
        background:rgba(255,255,255,.18) !important;
        color:#fff !important;
        font-weight:900 !important;
        font-size:12px !important;
        backdrop-filter:blur(10px);
        box-shadow:0 8px 22px rgba(0,0,0,.16) !important;
      }
      .post-action-row button:active,
      .gallery-arrow:active{
        transform:translateY(-50%) scale(.96) !important;
      }
      .post-action-row button:active{
        transform:scale(.96) !important;
      }

      /* v6.3.35 estética final: acciones horizontales, dots y audio visible */
      .gallery-arrow{
        display:none !important;
      }
      .gallery-dots{
        position:absolute;
        left:50%;
        bottom:calc(env(safe-area-inset-bottom) + 150px);
        transform:translateX(-50%);
        z-index:92;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:7px;
        padding:7px 10px;
        border-radius:999px;
        background:rgba(0,0,0,.24);
        backdrop-filter:blur(8px);
      }
      .gallery-dot{
        width:8px;
        height:8px;
        border-radius:999px;
        border:0;
        background:rgba(255,255,255,.48);
        padding:0;
        transition:all .18s ease;
      }
      .gallery-dot.active{
        width:22px;
        background:#fff;
      }
      .media-bottom{
        display:none !important;
      }
      .post-body{
        padding:54px 16px calc(env(safe-area-inset-bottom) + 86px) 16px !important;
        background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.58) 28%,rgba(0,0,0,.86)) !important;
      }
      .post-body h2{
        font-size:19px !important;
        margin-bottom:5px !important;
      }
      .post-body p{
        font-size:14px !important;
        max-height:2.7em !important;
      }
      .post-action-row{
        display:grid !important;
        grid-template-columns:repeat(3, 1fr);
        gap:8px !important;
        width:100%;
        margin-top:12px !important;
        z-index:96 !important;
      }
      .post-action-row button{
        display:flex !important;
        align-items:center;
        justify-content:center;
        white-space:nowrap;
        min-height:42px;
        background:rgba(255,255,255,.22) !important;
        border:1px solid rgba(255,255,255,.32) !important;
        color:#fff !important;
        font-size:13px !important;
        box-shadow:0 10px 28px rgba(0,0,0,.20) !important;
      }
      .sound-toggle{
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        right:14px !important;
        top:auto !important;
        bottom:calc(env(safe-area-inset-bottom) + 248px) !important;
        z-index:98 !important;
        width:50px !important;
        height:50px !important;
        border:2px solid rgba(255,255,255,.55) !important;
        background:rgba(0,0,0,.58) !important;
        color:#fff !important;
        opacity:1 !important;
        visibility:visible !important;
        pointer-events:auto !important;
      }
      .owner-row{
        margin-bottom:4px !important;
      }
      .post-meta{
        margin-top:6px !important;
      }

      /* v6.3.36: mover información a la base, dots arriba de info y menú inferior más discreto */
      .visual-tabs{
        gap:18px !important;
      }
      .visual-tab{
        font-size:16px !important;
      }
      .visual-tab.active{
        font-size:19px !important;
      }
      .post-body{
        left:10px !important;
        right:10px !important;
        bottom:calc(env(safe-area-inset-bottom) + 76px) !important;
        padding:14px 14px 12px 14px !important;
        border-radius:22px !important;
        background:linear-gradient(180deg,rgba(0,0,0,.10),rgba(0,0,0,.56) 30%,rgba(0,0,0,.78)) !important;
        backdrop-filter:blur(2px);
        box-shadow:0 14px 34px rgba(0,0,0,.18) !important;
      }
      .post-body .owner-row{
        font-size:13px !important;
        margin-bottom:4px !important;
      }
      .post-body h2{
        font-size:18px !important;
        line-height:1.08 !important;
        margin-bottom:4px !important;
      }
      .post-body p{
        font-size:13px !important;
        line-height:1.2 !important;
        max-height:2.4em !important;
      }
      .post-meta{
        margin-top:4px !important;
        font-size:11px !important;
      }
      .post-action-row{
        margin-top:8px !important;
        gap:7px !important;
      }
      .post-action-row button{
        min-height:36px !important;
        padding:7px 8px !important;
        font-size:12px !important;
        background:rgba(255,255,255,.20) !important;
      }
      .manage-row{
        margin-top:8px !important;
      }
      .manage-row button{
        padding:8px 12px !important;
        font-size:13px !important;
      }
      .gallery-dots{
        bottom:calc(env(safe-area-inset-bottom) + 260px) !important;
        background:rgba(0,0,0,.36) !important;
        border:1px solid rgba(255,255,255,.22);
        box-shadow:0 10px 30px rgba(0,0,0,.18);
      }
      .gallery-dot{
        width:7px !important;
        height:7px !important;
        background:rgba(255,255,255,.58) !important;
      }
      .gallery-dot.active{
        width:24px !important;
        background:#fff !important;
      }
      .sound-toggle{
        bottom:calc(env(safe-area-inset-bottom) + 258px) !important;
        width:46px !important;
        height:46px !important;
        right:14px !important;
      }
      .bottom-nav{
        left:26px !important;
        right:26px !important;
        bottom:calc(env(safe-area-inset-bottom) + 8px) !important;
        height:68px !important;
        min-height:68px !important;
        padding:5px 8px !important;
        border-radius:28px !important;
        background:rgba(255,255,255,.62) !important;
        border:1px solid rgba(255,255,255,.45) !important;
        backdrop-filter:blur(18px) saturate(1.1) !important;
        box-shadow:0 10px 32px rgba(0,0,0,.16) !important;
      }
      .nav-item{
        min-width:0 !important;
        padding:4px 6px !important;
      }
      .nav-icon{
        font-size:23px !important;
        line-height:1 !important;
      }
      .nav-item small{
        font-size:10px !important;
        margin-top:2px !important;
      }
      .nav-plus{
        width:58px !important;
        height:58px !important;
        min-width:58px !important;
        margin-top:-24px !important;
        font-size:30px !important;
        background:rgba(255,255,255,.86) !important;
        box-shadow:0 10px 30px rgba(0,0,0,.18) !important;
      }
      .post-card .media-area,
      .post-card .media-area img,
      .post-card .media-area .no-media,
      .video-inline-wrap,
      .video-inline-wrap video,
      .media-area video.feed-video-player,
      .media-carousel,
      .media-carousel img{
        height:calc(100vh - 72px) !important;
        min-height:calc(100vh - 72px) !important;
      }
      .post-card{
        min-height:calc(100vh - 72px) !important;
      }

      /* v6.3.37: corrección precisa de menú y puntitos */
      .gallery-stage{
        position:relative !important;
        width:100% !important;
        height:calc(100vh - 72px) !important;
        min-height:calc(100vh - 72px) !important;
        overflow:hidden !important;
        background:#050507 !important;
      }
      .gallery-stage .media-carousel{
        position:relative !important;
        width:100% !important;
        height:100% !important;
        min-height:100% !important;
        overflow-x:auto !important;
        overflow-y:hidden !important;
        scroll-snap-type:x mandatory !important;
      }
      .gallery-stage .media-carousel img{
        height:100% !important;
        min-height:100% !important;
      }
      .gallery-dots{
        position:absolute !important;
        left:50% !important;
        top:auto !important;
        right:auto !important;
        bottom:calc(env(safe-area-inset-bottom) + 230px) !important;
        transform:translateX(-50%) !important;
        z-index:120 !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:7px !important;
        padding:7px 11px !important;
        border-radius:999px !important;
        background:rgba(0,0,0,.42) !important;
        border:1px solid rgba(255,255,255,.24) !important;
        box-shadow:0 10px 30px rgba(0,0,0,.22) !important;
        backdrop-filter:blur(10px) !important;
        pointer-events:auto !important;
      }
      .gallery-dot{
        width:8px !important;
        height:8px !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.55) !important;
      }
      .gallery-dot.active{
        width:24px !important;
        background:#fff !important;
      }
      .bottom-nav{
        position:fixed !important;
        left:50% !important;
        right:auto !important;
        bottom:calc(env(safe-area-inset-bottom) + 10px) !important;
        transform:translateX(-50%) !important;
        width:min(86vw, 360px) !important;
        height:58px !important;
        min-height:58px !important;
        max-height:58px !important;
        padding:4px 8px !important;
        border-radius:24px !important;
        background:rgba(255,255,255,.20) !important;
        border:1px solid rgba(255,255,255,.30) !important;
        backdrop-filter:blur(20px) saturate(1.15) !important;
        -webkit-backdrop-filter:blur(20px) saturate(1.15) !important;
        box-shadow:0 8px 30px rgba(0,0,0,.20) !important;
        display:grid !important;
        grid-template-columns:1fr 1fr 58px 1fr 1fr !important;
        align-items:center !important;
        gap:0 !important;
        overflow:visible !important;
      }
      .nav-item{
        height:50px !important;
        min-height:50px !important;
        padding:2px 4px !important;
        border-radius:16px !important;
        background:transparent !important;
        box-shadow:none !important;
      }
      .nav-item.active{
        background:rgba(255,255,255,.22) !important;
      }
      .nav-icon{
        font-size:21px !important;
        line-height:1 !important;
      }
      .nav-item small{
        font-size:9px !important;
        margin-top:1px !important;
        line-height:1 !important;
      }
      .nav-plus{
        width:56px !important;
        height:56px !important;
        min-width:56px !important;
        min-height:56px !important;
        margin:0 !important;
        transform:translateY(-12px) !important;
        border-radius:999px !important;
        font-size:30px !important;
        background:rgba(255,255,255,.78) !important;
        color:#111827 !important;
        border:1px solid rgba(255,255,255,.70) !important;
        box-shadow:0 10px 28px rgba(0,0,0,.18) !important;
      }
      .post-body{
        bottom:calc(env(safe-area-inset-bottom) + 78px) !important;
        left:12px !important;
        right:12px !important;
        padding:12px 12px 11px 12px !important;
      }
      .post-action-row{
        margin-top:7px !important;
      }
      .post-action-row button{
        min-height:34px !important;
      }

      /* v6.3.38: altavoz visible y foto de perfil */
      .sound-toggle{
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        position:absolute !important;
        right:16px !important;
        bottom:calc(env(safe-area-inset-bottom) + 228px) !important;
        top:auto !important;
        z-index:160 !important;
        width:52px !important;
        height:52px !important;
        border-radius:999px !important;
        border:2px solid rgba(255,255,255,.72) !important;
        background:rgba(0,0,0,.66) !important;
        color:#fff !important;
        font-size:24px !important;
        box-shadow:0 12px 34px rgba(0,0,0,.35) !important;
        backdrop-filter:blur(12px) !important;
        opacity:1 !important;
        visibility:visible !important;
        pointer-events:auto !important;
      }
      .video-inline-wrap.clean-video{
        position:relative !important;
      }
      .owner-row{
        gap:8px !important;
        align-items:center !important;
      }
      .owner-avatar-img{
        width:100% !important;
        height:100% !important;
        object-fit:cover !important;
        border-radius:inherit !important;
        display:block !important;
      }
      .owner-row .owner-avatar-img,
      .owner-row .owner-dot{
        width:42px !important;
        height:42px !important;
        min-width:42px !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.92) !important;
        border:2px solid rgba(255,255,255,.70) !important;
        box-shadow:0 10px 24px rgba(0,0,0,.18) !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        overflow:hidden !important;
      }
      .profile-avatar-editor{
        display:flex;
        gap:14px;
        align-items:center;
        padding:12px;
        border-radius:22px;
        background:linear-gradient(135deg,rgba(91,46,234,.10),rgba(20,184,166,.10));
        margin:12px 0 16px;
      }
      .profile-avatar-button{
        width:78px;
        height:78px;
        min-width:78px;
        border-radius:26px;
        border:2px solid rgba(91,46,234,.22);
        background:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:hidden;
        font-size:34px;
        box-shadow:0 14px 34px rgba(91,46,234,.15);
      }
      .profile-avatar-button img{
        width:100%;
        height:100%;
        object-fit:cover;
      }
      .profile-avatar-editor strong{
        display:block;
        color:#111827;
        font-size:17px;
      }
      .profile-avatar-editor span{
        display:block;
        color:#6b7280;
        font-size:13px;
        margin:4px 0 6px;
      }
      .store-avatar,.owner-avatar{
        overflow:hidden !important;
      }
      @media (max-width:380px){
        .post-action-row button{
          font-size:11px !important;
          padding-left:5px !important;
          padding-right:5px !important;
        }
        .bottom-nav{
          left:16px !important;
          right:16px !important;
        }
      }
      .media-bottom{
        display:flex !important;
        opacity:1 !important;
        visibility:visible !important;
      }
      .action-stack .round-action{
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
      }
      .visual-tab[data-top-tab="tienda"].active{color:#fff;}
      .visual-tab[data-nav="/siguiendo"]{max-width:82px;overflow:hidden;text-overflow:ellipsis;}
      .visual-search-btn{
        width:40px !important;
        height:40px !important;
        background:rgba(0,0,0,.10) !important;
        backdrop-filter:none !important;
        font-size:24px !important;
        box-shadow:none !important;
      }
      .visual-search-panel{
        margin:6px 6px 0 !important;
        background:rgba(0,0,0,.50) !important;
        box-shadow:0 12px 30px rgba(0,0,0,.18);
      }
      .visual-filter-row{
        margin-top:6px !important;
        gap:6px !important;
      }
      .visual-filter-row .path-card{
        padding:5px 9px !important;
        min-height:0 !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.16) !important;
        transform:none !important;
      }
      .visual-filter-row .path-card.active{
        background:rgba(255,255,255,.78) !important;
        color:#111827 !important;
      }
      .visual-filter-row .path-icon{
        display:none !important;
      }
      .visual-filter-row .path-label{
        font-size:11px !important;
        letter-spacing:.02em;
      }
      .feed-title{
        display:none !important;
      }
      .feed{
        padding-top:0 !important;
        padding-left:0 !important;
        padding-right:0 !important;
        gap:8px !important;
      }
      .post-card{
        position:relative !important;
        margin:0 0 10px !important;
        border-radius:0 !important;
        overflow:hidden !important;
        background:#050507 !important;
        box-shadow:none !important;
        min-height:calc(100vh - 92px) !important;
      }
      .post-card .media-area{
        height:calc(100vh - 92px) !important;
        min-height:560px !important;
        border-radius:0 !important;
        background:#050507 !important;
        overflow:hidden !important;
      }
      .post-card .media-area img,
      .post-card .media-area .no-media,
      .video-inline-wrap,
      .video-inline-wrap video,
      .media-area video.feed-video-player{
        min-height:calc(100vh - 92px) !important;
        height:calc(100vh - 92px) !important;
        object-fit:cover !important;
        border-radius:0 !important;
      }
      .media-top{
        top:calc(env(safe-area-inset-top) + 88px) !important;
        left:12px !important;
        right:auto !important;
        gap:6px !important;
        z-index:8 !important;
      }
      .media-top .chip{
        padding:6px 10px !important;
        font-size:11px !important;
        font-weight:900 !important;
        color:#fff !important;
        background:rgba(0,0,0,.30) !important;
        border:1px solid rgba(255,255,255,.18) !important;
        backdrop-filter:blur(8px);
      }
      .media-bottom{
        position:absolute !important;
        right:10px !important;
        left:auto !important;
        bottom:118px !important;
        z-index:9 !important;
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        gap:10px !important;
        pointer-events:auto !important;
      }
      .action-stack{
        display:flex !important;
        flex-direction:column !important;
        gap:10px !important;
        align-items:center !important;
      }
      .round-action{
        width:48px !important;
        height:48px !important;
        border-radius:999px !important;
        font-size:21px !important;
        background:rgba(255,255,255,.82) !important;
        backdrop-filter:blur(8px) !important;
        box-shadow:0 10px 25px rgba(0,0,0,.16) !important;
      }
      .follow-btn{
        min-width:0 !important;
        padding:9px 12px !important;
        border-radius:18px !important;
        font-size:13px !important;
        font-weight:900 !important;
        background:rgba(20,184,166,.86) !important;
        box-shadow:0 10px 28px rgba(0,0,0,.18) !important;
      }
      .follow-btn.following{
        background:rgba(17,24,39,.78) !important;
        color:#fff !important;
      }
      .video-inline-actions{
        left:12px !important;
        right:auto !important;
        bottom:auto !important;
        top:calc(env(safe-area-inset-top) + 128px) !important;
        transform:none !important;
        justify-content:flex-start !important;
        gap:7px !important;
        z-index:7 !important;
      }
      .video-inline-actions button{
        padding:7px 10px !important;
        border-radius:999px !important;
        font-size:12px !important;
        background:rgba(0,0,0,.38) !important;
        color:#fff !important;
        border:1px solid rgba(255,255,255,.18) !important;
        box-shadow:none !important;
        backdrop-filter:blur(8px);
      }
      .post-body{
        position:absolute !important;
        left:0 !important;
        right:0 !important;
        bottom:0 !important;
        z-index:7 !important;
        color:#fff !important;
        background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.62) 22%,rgba(0,0,0,.84)) !important;
        padding:76px 84px calc(env(safe-area-inset-bottom) + 82px) 16px !important;
        border-radius:0 !important;
        box-shadow:none !important;
      }
      .post-body .owner-row{
        color:rgba(255,255,255,.92) !important;
        font-size:14px !important;
        font-weight:900 !important;
        margin-bottom:5px !important;
      }
      .post-body h2{
        color:#fff !important;
        font-size:20px !important;
        line-height:1.12 !important;
        margin:0 0 7px !important;
        text-shadow:0 2px 15px rgba(0,0,0,.45);
      }
      .post-body p{
        color:rgba(255,255,255,.92) !important;
        font-size:15px !important;
        line-height:1.25 !important;
        margin:0 !important;
        max-height:3.75em;
        overflow:hidden;
      }
      .post-meta{
        color:rgba(255,255,255,.82) !important;
        font-size:12px !important;
        margin-top:8px !important;
      }
      .status-chip{
        display:none !important;
      }
      .manage-row{
        margin-top:9px !important;
        display:flex !important;
        gap:8px !important;
        flex-wrap:wrap !important;
      }
      .manage-row button{
        padding:8px 10px !important;
        border-radius:999px !important;
        border:0 !important;
        background:rgba(255,255,255,.90) !important;
        color:#111827 !important;
        font-weight:900 !important;
      }
      .manage-row .danger{
        background:rgba(254,226,226,.94) !important;
        color:#991b1b !important;
      }
      .bottom-nav{
        background:rgba(255,255,255,.88) !important;
        backdrop-filter:blur(14px) !important;
        box-shadow:0 -14px 34px rgba(0,0,0,.14) !important;
      }
      .nav-plus{
        box-shadow:0 12px 32px rgba(0,0,0,.18) !important;
      }
      .local-note{
        background:rgba(255,255,255,.14) !important;
        color:#fff !important;
        border:1px solid rgba(255,255,255,.18) !important;
      }
      @media (max-width:420px){
        .tiktok-tab{font-size:15px;}
        .tiktok-tabs{gap:13px;}
        .tiktok-filter-row{gap:6px;}
        .tiktok-filter-row .path-card{padding:7px 9px !important;}
      }
      .version-pill{display:inline-block;margin-top:3px;padding:3px 7px;border-radius:999px;background:rgba(91,46,234,.12);color:#5b2eea;font-size:10px;font-weight:900;}
      .diag-panel{margin:16px 0 0;padding:14px;border-radius:22px;background:#111827;color:#fff;box-shadow:0 16px 44px rgba(17,24,39,.20);}
      .diag-panel h2{margin:0 0 8px;font-size:18px;}
      .diag-panel p{margin:6px 0;color:rgba(255,255,255,.78);}
      .diag-panel code{display:block;white-space:pre-wrap;word-break:break-word;background:rgba(255,255,255,.08);border-radius:14px;padding:10px;margin-top:8px;font-size:12px;color:#fff;}
      .diag-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;}
      .diag-actions button{border:0;border-radius:999px;padding:10px 13px;font-weight:900;}
      .diag-reset{background:#fee2e2;color:#991b1b;}
      .diag-copy{background:#e0e7ff;color:#3730a3;}
    `;
    document.head.appendChild(style);
  }

  function videoViewerMarkup(){
    if(!state.videoViewer) return '';
    return `<div class="video-viewer" role="dialog" aria-modal="true">
      <div class="video-viewer-top">
        <button class="video-close" data-close-video>← Cerrar</button>
        <strong>${esc(state.videoViewer.title || 'Video')}</strong>
        <span></span>
      </div>
      <div class="video-viewer-body">
        <video src="${esc(state.videoViewer.url)}" controls autoplay playsinline webkit-playsinline preload="auto"></video>
      </div>
      <div class="video-viewer-note">El sonido usa el volumen de tu dispositivo. Si no inicia solo, toca ▶.</div>
    </div>`;
  }

  function shell(content){
    return `
      <main class="app-page"><div class="top-space"></div>${content}</main>
      <nav class="bottom-nav">
        <button class="nav-item ${state.route==='/'?'active':''}" data-nav="/"><span class="nav-icon">🏠</span><small>Inicio</small></button>
        <button class="nav-item ${state.route==='/siguiendo'?'active':''}" data-nav="/siguiendo"><span class="nav-icon">🫂</span><small>Siguiendo</small></button>
        <button class="nav-plus" data-pick>+</button>
        <button class="nav-item ${state.route==='/mensajes'?'active':''}" data-nav="/mensajes"><span class="nav-icon nav-icon-wrap">✉️${unreadBadge()}</span><small>Mensajes</small></button>
        <button class="nav-item ${state.route==='/perfil'?'active':''}" data-nav="/perfil"><span class="nav-icon">👤</span><small>Perfil</small></button>
      </nav>
      <input id="mediaPicker" type="file" accept="image/*,video/*" multiple hidden>
      ${videoViewerMarkup()}
    `;
  }

  function homeHeader(){
    const municipio = municipioLabel();
    return `<section class="glass-top tiktok-top visual-top">
      <div class="tiktok-topbar visual-topbar">
        <div class="visual-tabs">
          <button class="visual-tab municipio-tab ${state.topTab === 'municipio' ? 'active' : ''}" data-top-tab="municipio">${esc(municipio)}</button>
          <button class="visual-tab ${state.route === '/tienda' ? 'active' : ''}" data-open-store="${esc(userId())}">Tienda</button>
          <button class="visual-tab ${state.topTab === 'para-ti' ? 'active' : ''}" data-top-tab="para-ti">Para ti</button>
        </div>
        <button class="tiktok-icon-btn visual-search-btn" data-toggle-search title="Buscar">🔎</button>
      </div>
      ${state.searchOpen ? `<div class="tiktok-search-panel visual-search-panel"><span>🔎</span><input id="searchInput" type="search" inputmode="search" value="${esc(state.query)}" placeholder="Buscar: refrigerador, pan, viaje..." autocomplete="off" enterkeyhint="search"><button type="button" data-clear-search>${state.query ? 'Limpiar' : 'Cerrar'}</button></div>` : ''}
      <div class="tiktok-filter-row visual-filter-row">
        ${pathButton('VENDO','🏪','Vendo','path-vendo')}
        ${pathButton('OFREZCO','🛵','Ofrezco','path-ofrezco')}
        ${pathButton('NECESITO','🧡','Necesito','path-necesito')}
      </div>
    </section>`;
  }


  function pathButton(key,icon,label,klass){
    return `<button class="path-card ${klass} ${state.filter===key?'active':''}" data-filter="${key}"><span class="path-icon">${icon}</span><span class="path-label">${label}</span></button>`;
  }

  function homePage(){ return shell(`${homeHeader()}<section class="feed-title" id="feedTitle">${feedTitleMarkup()}</section><section class="feed" id="feed">${feedMarkup()}</section>`); }
  function feedTitleMarkup(){
    const searching = !!state.query.trim();
    const title = searching ? 'Resultados' : (state.filter === 'ALL' ? 'Publicaciones cerca de ti' : state.filter);
    const subtitle = searching ? searchResultText() : (state.cloudReady ? 'Publicaciones disponibles' : 'También funciona sin conexión');
    return `<div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${state.syncing?'<span class="sync-pill">Actualizando...</span>':(state.filter!=='ALL'||state.query?'<button class="small-link" data-clear>Todo</button>':'')}`;
  }
  function feedMarkup(){ const posts=filteredPosts(); return posts.map(postCard).join('') || emptyState('No encontré publicaciones','Prueba otra búsqueda o publica algo con el botón +.'); }
  function updateFeedOnly(){ const feed=document.getElementById('feed'); if(feed) feed.innerHTML=feedMarkup(); const title=document.getElementById('feedTitle'); if(title) title.innerHTML=feedTitleMarkup(); bindDynamicFeedControls(); setupInternalVideos(); setupGalleries(); }
  function categoryClass(cat){ return `chip-${normalizeCategory(cat).toLowerCase()}`; }
  function isFollowing(ownerId){ return follows().includes(ownerId); }
  function shortDescription(text, max=118){
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if(clean.length <= max) return clean;
    return clean.slice(0, max).trim() + '... más';
  }


  function statusLabel(post){
    if(norm(post.cloudStatus)==='subiendo') return '<span class="chip status-chip">Publicando...</span>';
    if(norm(post.cloudStatus)==='local') return '<span class="chip status-chip local">Guardada en este dispositivo</span>';
    if(norm(post.cloudStatus)==='publica') return '<span class="chip status-chip publica">Publicada</span>';
    return '';
  }

  function mediaMarkup(post){
    const items = Array.isArray(post.mediaItems) ? post.mediaItems.filter(item => item && (item.mediaUrl || item.mediaRef || item.mediaData || item.mediaPreviewUrl)) : [];
    const imageItems = items.filter(item => String(item.mediaType || post.mediaType || 'image').toLowerCase() !== 'video');

    if(imageItems.length > 1){
      const slides = imageItems.map((item, index) => {
        const src = resolveMediaItem(item);
        return src ? `<img src="${esc(src)}" alt="${esc(post.title || 'Foto')} ${index+1}" loading="${index ? 'lazy' : 'eager'}">` : '';
      }).join('');
      const dots = imageItems.map((_, index) => `<button type="button" class="gallery-dot ${index === 0 ? 'active' : ''}" data-gallery-dot="${esc(post.id)}" data-gallery-index="${index}" aria-label="Ver foto ${index+1}"></button>`).join('');
      return `<div class="gallery-stage" data-gallery-stage="${esc(post.id)}">
        <div class="media-carousel" data-gallery="${esc(post.id)}" data-gallery-total="${imageItems.length}">
          ${slides}
        </div>
        <div class="gallery-dots" data-gallery-dots="${esc(post.id)}">${dots}</div>
      </div>`;
    }

    const media = resolveMedia(post);
    if(isVideoPost(post)){
      if(post.mediaUrl){
        return `<div class="video-inline-wrap clean-video" data-video-wrap="${esc(post.id)}">
          <video class="feed-video-player" src="${esc(post.mediaUrl)}" autoplay muted loop playsinline webkit-playsinline preload="auto" data-open-video="${esc(post.id)}" data-video-id="${esc(post.id)}"></video>
          <button class="sound-toggle" type="button" data-toggle-video-sound="${esc(post.id)}" aria-label="Activar sonido">🔇</button>
        </div>`;
      }
      const failed = norm(post.mediaStatus) === 'error';
      return `<div class="video-tile video-pending-tile">
        <div class="video-tile-content">
          <button class="video-play-big" type="button" disabled>${failed ? '⚠️' : '⏳'}</button>
          <strong>${failed ? 'Video no subió' : 'Video en proceso'}</strong>
          <small>${failed ? 'Toca Reintentar. Si vuelve a fallar, abre Perfil y copia el diagnóstico.' : 'La publicación ya está visible. Mantén la app abierta o toca Reintentar si tarda demasiado.'}</small>
        </div>
      </div>`;
    }

    if(media) return `<img src="${esc(media)}" alt="${esc(post.title || 'Publicación')}">`;
    return '<div class="no-media">Conecta Servicios</div>';
  }

  function postCard(post){
    post = normalizePost(post);
    const own = post.ownerId === userId();
    const pending = isVideoPost(post) && !post.mediaUrl;
    return `<article class="post-card">
      <div class="media-area">
        ${mediaMarkup(post)}
        ${pending ? '<div class="media-pending">Video en proceso. La publicación ya está visible.</div>' : ''}
        <div class="media-top"><span class="chip ${categoryClass(post.category)}">${esc(normalizeCategory(post.category))}</span><span class="chip">📍 ${esc(post.zone || 'Zona')}</span></div>
        <div class="media-bottom"><div class="action-stack"><button class="round-action" data-like="${esc(post.id)}"><span>❤️</span><small>${post.reactions || 0}</small></button><button class="round-action" data-message="${esc(post.id)}"><span>✉️</span><small>Mensaje</small></button><button class="round-action" data-share="${esc(post.id)}"><span>↗️</span><small>Compartir</small></button></div><button class="follow-btn ${isFollowing(post.ownerId)?'following':''}" data-follow="${esc(post.ownerId)}">${isFollowing(post.ownerId)?'Siguiendo':'Seguir'}</button></div>
      </div>
      <div class="post-body">
        <div class="owner-row" data-open-store="${esc(post.ownerId)}">${avatarMarkup(postAvatar(post), post.ownerName || 'Usuario local')}<span>${esc(post.ownerName || 'Usuario local')}</span></div>
        <h2>${esc(post.title || 'Publicación')}</h2>
        <p>${esc(shortDescription(post.description || ''))}</p>
        <div class="post-meta"><span>❤️ ${post.reactions || 0}</span><span>${new Date(post.createdAt || Date.now()).toLocaleDateString('es-MX')}</span></div>
        <div class="post-action-row">
          <button type="button" data-like="${esc(post.id)}">❤️ Me gusta</button>
          <button type="button" data-message="${esc(post.id)}">✉️ Mensaje</button>
          <button type="button" data-share="${esc(post.id)}">↗️ Compartir</button>
        </div>
        ${statusLabel(post)}
        ${own ? `<div class="manage-row">${post.cloudStatus==='local'||post.mediaStatus==='pendiente'||post.mediaStatus==='error'?`<button class="retry" data-retry="${esc(post.id)}">Reintentar</button>`:''}<button data-edit="${esc(post.id)}">Editar</button><button class="danger" data-delete="${esc(post.id)}">Borrar</button></div>` : ''}
        ${post.cloudStatus==='local' ? '<div class="local-note">Tu publicación se guardó en este dispositivo. Revisa tu conexión e intenta de nuevo.</div>' : ''}
      </div>
    </article>`;
  }

  function emptyState(t,x){ return `<div class="empty"><strong>${esc(t)}</strong>${esc(x)}</div>`; }
  function ownerCard(summary, extra=''){
    return `<article class="owner-card">
      <div class="owner-avatar">${summary.ownerAvatar ? `<img class="owner-avatar-img" src="${esc(summary.ownerAvatar)}" alt="${esc(summary.ownerName || 'Usuario')}">` : (summary.isMe ? '👤' : '🏪')}</div>
      <div class="owner-card-main">
        <strong>${esc(summary.ownerName || 'Usuario local')}</strong>
        <span>${summary.vendo} en tienda · ${summary.ofrezco} ofrece · ${summary.necesito} necesita</span>
        ${extra}
      </div>
      <div class="owner-card-actions">
        <button data-open-store="${esc(summary.ownerId)}">Ver tienda</button>
        ${summary.isMe ? '<small>Tu cuenta</small>' : `<button class="${summary.isFollowing ? 'following' : ''}" data-follow="${esc(summary.ownerId)}">${summary.isFollowing ? 'Siguiendo' : 'Seguir'}</button>`}
      </div>
    </article>`;
  }

  function storePage(){
    const ownerId = state.storeOwnerId || userId();
    const summary = ownerSummary(ownerId);
    const vendo = ownerVendoPosts(ownerId);
    const suggestions = allOwnerSummaries().filter(s => s.ownerId !== ownerId && s.vendo > 0).slice(0, 8);

    return shell(`<section class="panel store-panel">
      <button class="small-link" data-nav="/">← Volver al Home</button>
      <div class="store-hero">
        <div class="store-avatar">${summary.ownerAvatar ? `<img class="owner-avatar-img" src="${esc(summary.ownerAvatar)}" alt="${esc(summary.ownerName || 'Usuario')}">` : (summary.isMe ? '👤' : '🏪')}</div>
        <div>
          <p class="store-kicker">${summary.isMe ? 'Mi cuenta' : 'Cuenta local'}</p>
          <h1>${esc(summary.isMe ? 'Mi tienda' : summary.ownerName || 'Tienda')}</h1>
          <p>Solo publicaciones VENDO de este usuario. Sus publicaciones de OFREZCO y NECESITO no aparecen aquí.</p>
        </div>
      </div>
      <div class="store-stats">
        <span><strong>${summary.vendo}</strong> en venta</span>
        <span><strong>${summary.total}</strong> publicaciones</span>
        <span><strong>${summary.isFollowing ? 'Sí' : 'No'}</strong> siguiendo</span>
      </div>
      ${summary.isMe && !vendo.length ? '<div class="local-note">Publica algo en categoría VENDO para empezar tu tienda.</div>' : ''}
    </section>
    <section class="feed store-feed">${vendo.map(postCard).join('') || emptyState('Esta tienda aún no tiene productos','Cuando publique en VENDO, aparecerá aquí.')}</section>
    ${suggestions.length ? `<section class="panel owner-directory"><h2>Otras tiendas locales</h2><div class="owner-list">${suggestions.map(s => ownerCard(s)).join('')}</div></section>` : ''}`);
  }

  function followingPage(){
    const ids = follows();
    const summaries = ids.map(ownerSummary).filter(s => s.total > 0);
    return shell(`<section class="panel following-panel"><button class="small-link" data-nav="/">← Volver al Home</button><h1>Siguiendo</h1><p>Personas, proveedores, clientes o mensajeros que sigues. Entra a su cuenta para ver su tienda VENDO.</p></section><section class="panel owner-directory"><div class="owner-list">${summaries.map(s => ownerCard(s)).join('') || emptyState('Todavía no sigues a nadie','Toca Seguir en una publicación para ver su cuenta y tienda aquí.')}</div></section>`);
  }

  function diagnosticsPanel(){
    const diag = state.lastUploadDiagnostic || get('cs_v6323_last_upload_diagnostic', null);
    const runtime = {
      version: VERSION,
      bootVersion: window.CONNECTA_BOOT_VERSION || '',
      serviceWorkerControlled: !!navigator.serviceWorker?.controller,
      url: location.href,
      localPosts: localPosts().length,
      publicMessages: state.publicMessages.length,
      lastUpload: diag ? (diag.kind || 'registrado') : 'sin registro'
    };

    return `<section class="diag-panel">
      <h2>Diagnóstico técnico</h2>
      <p>Sirve para confirmar si este celular cargó la versión nueva y ver el último error real del video.</p>
      <code>${esc(JSON.stringify(runtime, null, 2))}

Último video:
${esc(shortDiagnosticText(diag))}</code>
      <div class="diag-actions">
        <button class="diag-copy" data-copy-diagnostics>Copiar diagnóstico</button>
        <button class="diag-reset" data-reset-app>Reset app / caché</button>
      </div>
    </section>`;
  }

  function profilePage(){
    const prof=profile();
    const mine=myPosts();
    const avatar = prof.avatarData || '';
    return shell(`<section class="panel profile-panel">
      <h1>Perfil</h1>
      <p>Guarda tu nombre visible y foto de perfil. Esa imagen aparecerá como anunciante en tus publicaciones.</p>
      <div class="profile-avatar-editor">
        <button class="profile-avatar-button" type="button" data-pick-profile-photo>${avatar ? `<img src="${esc(avatar)}" alt="Foto de perfil">` : '👤'}</button>
        <div>
          <strong>${esc(prof.name || 'Usuario local')}</strong>
          <span>Foto para posicionar tu canal o negocio</span>
          <button class="small-link" type="button" data-pick-profile-photo>Cambiar foto</button>
        </div>
      </div>
      <input id="profilePhotoInput" type="file" accept="image/*" hidden>
      <label>Nombre visible</label>
      <input id="profileName" value="${esc(prof.name||'Usuario local')}" placeholder="Tu nombre o negocio">
      <button class="big-button" data-save-profile>Guardar perfil</button>
      <div class="profile-grid"><div class="stat"><strong>${mine.length}</strong><span>Publicaciones</span></div><div class="stat"><strong>${follows().length}</strong><span>Siguiendo</span></div><div class="stat"><strong>${unreadCount()}</strong><span>Sin leer</span></div></div>
    </section>${diagnosticsPanel()}<section class="feed">${mine.map(postCard).join('')||emptyState('No has publicado','Toca + para crear tu primera publicación.')}</section>`);
  }

  function ensureComposerId(){
    if(!state.composerId){
      state.composerId = uid('post');
      state.composerDraft.category = state.filter === 'ALL' ? 'VENDO' : normalizeCategory(state.filter);
      saveComposerDraft();
    }
    return state.composerId;
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
      mediaType: state.mediaType,
      mediaItems: state.composerMediaItems || []
    });
  }

  function loadComposerDraft(){
    const saved = get(K.composer, null);
    if(!saved) return;
    state.composerId = saved.id || state.composerId;
    state.composerDraft = {description: saved.description || '', zone: saved.zone || '', category: normalizeCategory(saved.category || 'VENDO')};
    state.composerMediaRef = saved.mediaRef || '';
    state.composerMediaName = saved.mediaName || '';
    state.composerMediaMime = saved.mediaMime || '';
    state.mediaType = saved.mediaType || state.mediaType || 'image';
    state.composerMediaItems = Array.isArray(saved.mediaItems) ? saved.mediaItems : [];
  }

  function composerPage(){
    loadComposerDraft();
    ensureComposerId();
    const post = state.editing || null;
    if(post) state.composerDraft = {description:post.description||'', zone:post.zone||'', category:normalizeCategory(post.category)};
    const draft = state.composerDraft;
    const previewItems = state.composerMediaItems?.length ? state.composerMediaItems : (post?.mediaItems || []);
    const media = state.preview || post?.mediaUrl || resolveMedia(post || {mediaRef:state.composerMediaRef});
    const isVideo = (state.mediaType || post?.mediaType) === 'video';
    const previewMarkup = previewItems?.length > 1
      ? `<div class="preview-gallery">${previewItems.map((item, idx) => { const src = resolveMediaItem(item); return src ? `<img src="${esc(src)}" alt="Foto ${idx+1}">` : ''; }).join('')}</div><small>${previewItems.length} fotos seleccionadas</small>`
      : (media ? (isVideo ? `<video src="${esc(media)}" controls playsinline preload="metadata"></video>` : `<img src="${esc(media)}" alt="Vista previa">`) : '<div><strong>+ Agregar foto o video</strong><span>Desde tu dispositivo</span></div>');
    return shell(`<section class="composer">
      <button class="back-btn" data-nav="/">← Volver</button>
      <h1>${state.editing?'Editar publicación':'Nueva publicación'}</h1>
      <p>Escribe aquí. Puedes elegir una foto, varias fotos o un video corto.</p>
      <label for="description">Descripción</label>
      <textarea id="description" autocomplete="off" autocapitalize="sentences" spellcheck="true" placeholder="Ejemplo: Vendo tamales hoy&#10;Entrego en zona centro desde las 6 pm.">${esc(draft.description||'')}</textarea>
      <div class="preview-compact" data-pick>${previewMarkup}</div>
      <div class="form-grid"><div><label for="zone">Zona o municipio</label><input id="zone" list="zoneList" value="${esc(draft.zone||'')}" placeholder="Ej. Tejupilco"><datalist id="zoneList">${ZONES.map(z=>`<option value="${esc(z)}"></option>`).join('')}</datalist></div><div><label for="category">Categoría</label><select id="category">${CATEGORIES.map(c=>`<option value="${esc(c)}" ${normalizeCategory(draft.category)===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div></div>
      <button class="big-button ${state.publishing?'publishing':''}" data-publish ${state.publishing?'disabled':''}>${state.publishing?'PUBLICANDO...':'PUBLICAR'}</button>
    </section>`);
  }

  function render(){
    injectRootStyles();
    const routes = {'/':homePage, '/tienda':storePage, '/siguiendo':followingPage, '/mensajes':messagesPage, '/perfil':profilePage, '/publicar':composerPage, '/chat':chatPage};
    app.innerHTML = (routes[state.route] || homePage)();
    bind();
    if(state.route === '/chat') scrollChatToBottom('auto');
    setupInternalVideos();
    setupGalleries();
  }

  function routeUrl(route){
    const base = location.pathname + location.search;
    return route === '/' ? base.replace(/#.*/, '') : `${base.replace(/#.*/, '')}#${route.replace(/^\//,'')}`;
  }
  function nav(route, options={}){
    state.route = route;
    if(route !== '/publicar' && !state.publishing) state.editing = null;
    if(options.push !== false && history.pushState){
      const currentRoute = history.state?.route || '/';
      if(currentRoute !== route) history.pushState({route}, '', routeUrl(route));
    } else if(options.replace && history.replaceState){
      history.replaceState({route}, '', routeUrl(route));
    }
    render();
    setTimeout(()=>scrollTo({top:0,behavior:'smooth'}),0);
  }
  function setupNavigationHistory(){
    const initialHash = location.hash.replace('#','');
    if(initialHash){
      const route = '/' + initialHash.replace(/^\//,'');
      if(['/tienda','/siguiendo','/mensajes','/perfil','/publicar','/chat'].includes(route)) state.route = route;
    }
    history.replaceState?.({route:state.route || '/'}, '', routeUrl(state.route || '/'));
    window.addEventListener('popstate', e => {
      state.route = e.state?.route || '/';
      if(state.route !== '/publicar' && !state.publishing) state.editing = null;
      render();
      setTimeout(()=>scrollTo({top:0,behavior:'smooth'}),0);
    });
  }
  function clearComposer(){ state.preview=''; state.mediaType='image'; state.editing=null; state.composerId=''; state.composerMediaRef=''; state.composerMediaName=''; state.composerMediaMime=''; state.composerMediaItems=[]; state.composerDraft={description:'',zone:'',category:'VENDO'}; localStorage.removeItem(K.composer); }
  function openPicker(){ if(state.publishing) return toast('Estamos terminando de publicar. Espera un momento.'); ensureComposerId(); document.getElementById('mediaPicker')?.click(); }

  function resizeImage(file,maxSide=IMAGE_MAX_SIDE,quality=.82){
    return new Promise((resolve,reject)=>{
      if(!file.type.startsWith('image/')) return resolve(file);
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer imagen')); };
      img.src = url;
    });
  }

  function readVideoDuration(file){
    return new Promise(resolve => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      let done = false;
      const finish = value => {
        if(done) return;
        done = true;
        URL.revokeObjectURL(url);
        resolve(Number(value) || 0);
      };
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = () => finish(video.duration);
      video.onerror = () => finish(0);
      setTimeout(()=>finish(0), 5000);
      video.src = url;
    });
  }

  async function fileChosen(event){
    const files = [...(event.target.files || [])];
    event.target.value = '';
    if(!files.length) return;

    const hasVideo = files.some(file => file.type.startsWith('video/'));
    if(hasVideo && files.length > 1) return toast('Por ahora puedes elegir varias fotos o un solo video.');

    try{
      const postId = ensureComposerId();

      if(files.length > 1){
        const images = files.filter(file => file.type.startsWith('image/'));
        if(images.length !== files.length) return toast('Para varias imágenes, selecciona solo fotos.');

        const items = [];
        for(let i=0; i<images.length; i++){
          const file = images[i];
          if(file.size > MAX_IMAGE_MB * 1024 * 1024) return toast(`Una imagen pesa demasiado. Máximo: ${MAX_IMAGE_MB} MB.`);
          const blob = await resizeImage(file).catch(()=>file);
          const ref = `media-${postId}-${i}`;
          await saveMediaBlob(ref, blob);
          items.push({
            mediaRef: ref,
            mediaName: file.name || `foto-${i+1}.jpg`,
            mediaMime: blob.type || file.type || 'image/jpeg',
            mediaType: 'image',
            mediaPreviewUrl: objectUrlFor(ref, blob)
          });
        }

        state.mediaType = 'image';
        state.composerMediaItems = items;
        state.composerMediaRef = items[0]?.mediaRef || '';
        state.composerMediaName = items[0]?.mediaName || '';
        state.composerMediaMime = items[0]?.mediaMime || '';
        state.preview = items[0]?.mediaPreviewUrl || '';
        state.editing = null;
        saveComposerDraft();
        nav('/publicar');
        setTimeout(()=>document.getElementById('description')?.focus(),250);
        return;
      }

      const file = files[0];
      const isVideo = file.type.startsWith('video/');
      const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
      if(file.size > maxMb * 1024 * 1024) return toast(isVideo ? `El video pesa más de ${maxMb} MB. Intenta grabarlo en calidad media o comprimirlo.` : `La imagen pesa demasiado. Máximo: ${maxMb} MB.`);

      if(isVideo){
        toast('Revisando duración del video...');
        const duration = await readVideoDuration(file);
        if(duration && duration > MAX_VIDEO_SECONDS + 1) return toast('El video dura más de 10 minutos.');
      }

      const ref = `media-${postId}`;
      const kind = isVideo ? 'video' : 'image';
      let blob = file;
      if(kind === 'image') blob = await resizeImage(file).catch(()=>file);
      await saveMediaBlob(ref, blob);
      state.mediaType = kind;
      state.composerMediaItems = [];
      state.composerMediaRef = ref;
      state.composerMediaName = file.name || `${kind}.bin`;
      state.composerMediaMime = blob.type || file.type || 'application/octet-stream';
      state.preview = objectUrlFor(ref, blob);
      state.editing = null;
      saveComposerDraft();
      nav('/publicar');
      setTimeout(()=>document.getElementById('description')?.focus(),250);
    }catch{
      toast('No se pudo abrir el archivo. Prueba con otro.');
    }
  }

  function collectForm(){
    return {
      description: document.getElementById('description')?.value.trim() || state.composerDraft.description || '',
      zone: document.getElementById('zone')?.value.trim() || state.composerDraft.zone || '',
      category: normalizeCategory(document.getElementById('category')?.value || state.composerDraft.category || 'VENDO')
    };
  }

  async function publish(){
    if(state.publishing) return toast('Estamos terminando de publicar. Espera un momento.');
    const form = collectForm();
    state.composerDraft = {...form};
    saveComposerDraft();

    if(!form.description) return toast('Escribe una descripción.');
    if(!form.zone) return toast('Agrega zona o municipio.');

    const old = state.editing;
    const id = old?.id || ensureComposerId();
    const prof = profile();
    const now = new Date().toISOString();

    let post = normalizePost({
      ...old,
      id,
      ownerId: old?.ownerId || userId(),
      ownerName: prof.name || 'Usuario local',
      ownerAvatar: prof.avatarData || old?.ownerAvatar || '',
      title: titleFrom(form.description),
      description: form.description,
      zone: form.zone,
      category: form.category,
      mediaUrl: old?.mediaUrl || '',
      mediaItems: state.composerMediaItems?.length ? state.composerMediaItems : (old?.mediaItems || []),
      mediaRef: state.composerMediaRef || old?.mediaRef || '',
      mediaPreviewUrl: state.preview || old?.mediaPreviewUrl || '',
      mediaType: state.mediaType || old?.mediaType || 'image',
      mediaMime: state.composerMediaMime || old?.mediaMime || '',
      mediaName: state.composerMediaName || old?.mediaName || '',
      mediaStatus: (state.composerMediaRef || state.composerMediaItems?.some(item => item.mediaRef && !item.mediaUrl)) ? 'pendiente' : '',
      status:'activa',
      reactions: old?.reactions || 0,
      createdAt: old?.createdAt || now,
      updatedAt: now,
      cloudStatus:'subiendo'
    });

    state.publishing = true;
    saveLocalPosts([post, ...state.posts.filter(x=>x.id!==id)]);
    state.filter = form.category;
    state.query = '';
    state.route = '/';
    render();
    toast('Publicando...');

    const firstSync = await syncPost({...post, cloudStatus:'publica', mediaStatus: post.mediaRef ? 'pendiente' : '', updatedAt:new Date().toISOString()});
    post = normalizePost({...post, cloudStatus:firstSync?'publica':'local', updatedAt:new Date().toISOString()});
    saveLocalPosts([post, ...state.posts.filter(x=>x.id!==id)]);
    render();

    if(firstSync && post.mediaRef){
      toast('Subiendo multimedia...');
      const uploaded = await uploadMediaToCloud(post).catch(()=>({ok:false, post}));
      if(uploaded.ok){
        post = normalizePost({...uploaded.post, cloudStatus:'publica', mediaStatus:'', updatedAt:new Date().toISOString()}, 'remote');
        await syncPost(post);
        saveLocalPosts([post, ...state.posts.filter(x=>x.id!==id)]);
        toast('Publicación lista.');
      }else{
        post = normalizePost({...post, cloudStatus:'publica', mediaStatus:'error', mediaError:String(uploaded.detail || '').slice(0, 500), updatedAt:new Date().toISOString()});
        saveUploadDiagnostic('upload-failed-visible', uploaded.detail || 'Subida no completada.', {postId:post.id});
        await syncPost(post);
        saveLocalPosts([post, ...state.posts.filter(x=>x.id!==id)]);
        console.warn('Media upload failed', uploaded.detail); toast(isVideoPost(post) ? 'Video no subió. Toca Reintentar o copia diagnóstico en Perfil.' : 'Publicación visible. La imagen no subió.');
      }
    }else if(firstSync){
      toast('Publicación lista.');
    }else{
      toast('Tu publicación se guardó en este dispositivo. Revisa conexión e intenta de nuevo.');
    }

    if(firstSync) clearComposer();
    state.publishing = false;
    await syncFromCloud({render:false});
    render();
  }

  async function retryPost(id){
    let post = state.posts.find(x=>x.id===id);
    if(!post) return;
    if(post.ownerId !== userId()) return toast('Solo puedes reintentar tus publicaciones.');

    toast('Reintentando...');
    post = normalizePost({...post, cloudStatus:'subiendo', updatedAt:new Date().toISOString()});
    saveLocalPosts([post, ...state.posts.filter(x=>x.id!==id)]);
    render();

    const metaOk = await syncPost({...post, cloudStatus:'publica', updatedAt:new Date().toISOString()});
    if(!metaOk){
      post = normalizePost({...post, cloudStatus:'local', updatedAt:new Date().toISOString()});
      saveLocalPosts([post, ...state.posts.filter(x=>x.id!==id)]);
      toast('No se pudo publicar. Revisa conexión.');
      render();
      return;
    }

    if(post.mediaRef && !post.mediaUrl){
      const uploaded = await uploadMediaToCloud(post).catch(()=>({ok:false, post}));
      post = uploaded.ok
        ? normalizePost({...uploaded.post, cloudStatus:'publica', mediaStatus:'', updatedAt:new Date().toISOString()}, 'remote')
        : normalizePost({...post, cloudStatus:'publica', mediaStatus:'error', mediaError:String(uploaded.detail || '').slice(0,500), updatedAt:new Date().toISOString()});
      await syncPost(post);
    }else{
      post = normalizePost({...post, cloudStatus:'publica', mediaStatus: post.mediaUrl ? '' : post.mediaStatus, updatedAt:new Date().toISOString()}, 'remote');
      await syncPost(post);
    }

    saveLocalPosts([post, ...state.posts.filter(x=>x.id!==id)]);
    await syncFromCloud({render:false});
    toast('Publicación lista.');
    render();
  }

  function editPost(id){
    const post = state.posts.find(x=>x.id===id);
    if(!post || post.ownerId !== userId()) return toast('Solo puedes editar tus publicaciones.');
    state.editing = {...post};
    state.composerId = post.id;
    state.preview = resolveMedia(post);
    state.mediaType = post.mediaType || 'image';
    state.composerMediaRef = post.mediaRef || '';
    state.composerMediaName = post.mediaName || '';
    state.composerMediaMime = post.mediaMime || '';
    state.composerDraft = {description:post.description||'', zone:post.zone||'', category:normalizeCategory(post.category)};
    saveComposerDraft();
    nav('/publicar');
  }

  async function deletePost(id){
    const post = state.posts.find(x=>x.id===id);
    if(!post || post.ownerId !== userId()) return toast('Solo puedes borrar tus publicaciones.');
    if(!confirm('¿Borrar esta publicación?')) return;

    const tombstone = normalizePost({...post, status:'eliminada', cloudStatus:'publica', deletedAt:new Date().toISOString(), updatedAt:new Date().toISOString()});
    const deleted = loadDeletedIds();
    deleted.add(String(id));
    deleted.add('soft:' + softKey(post));
    saveDeletedIds(deleted);

    saveLocalPosts(state.posts.filter(x=>x.id!==id));
    render();
    toast('Borrando...');

    const ok = await syncPost(tombstone);
    if(ok){
      await syncFromCloud({render:false});
      toast('Publicación borrada.');
    }else{
      toast('No se pudo confirmar borrado. Revisa conexión.');
    }
    render();
  }


  function updateGalleryCounter(gallery){
    if(!gallery) return;
    const id = gallery.dataset.gallery;
    const total = Number(gallery.dataset.galleryTotal || gallery.querySelectorAll('img').length || 1);
    const index = Math.min(total, Math.max(1, Math.round(gallery.scrollLeft / Math.max(1, gallery.clientWidth)) + 1));
    document.querySelectorAll(`[data-gallery-dot="${CSS.escape(id)}"]`).forEach((dot, i) => {
      dot.classList.toggle('active', i === index - 1);
    });
  }

  function goGallery(id, index){
    const safeId = (window.CSS && CSS.escape) ? CSS.escape(id) : String(id).replace(/["\\]/g, '\\$&');
    const gallery = document.querySelector(`[data-gallery="${safeId}"]`);
    if(!gallery) return;
    gallery.scrollTo({left: Number(index || 0) * gallery.clientWidth, behavior:'smooth'});
    setTimeout(()=>updateGalleryCounter(gallery), 320);
  }

  function setupGalleries(){
    document.querySelectorAll('.media-carousel').forEach(gallery => {
      if(gallery.dataset.galleryBound === '1') return;
      gallery.dataset.galleryBound = '1';
      gallery.addEventListener('scroll', () => {
        clearTimeout(gallery._countTimer);
        gallery._countTimer = setTimeout(()=>updateGalleryCounter(gallery), 90);
      }, {passive:true});
      updateGalleryCounter(gallery);
    });
  }

  function toggleVideoSound(postId){
    const safeId = (window.CSS && CSS.escape) ? CSS.escape(postId) : String(postId).replace(/["\\]/g, '\\$&');
    const video = document.querySelector(`video.feed-video-player[data-video-id="${safeId}"]`);
    const btn = document.querySelector(`[data-toggle-video-sound="${safeId}"]`);
    if(!video) return;

    video.muted = !video.muted;
    video.volume = 1;
    video.play().catch(()=>null);
    if(btn) btn.textContent = video.muted ? '🔇' : '🔊';
    toast(video.muted ? 'Video en silencio.' : 'Sonido activado. Usa el volumen de tu dispositivo.');
  }


  function setupInternalVideos(){
    document.querySelectorAll('video.feed-video-player').forEach(video => {
      if(video.dataset.csBound === '1') return;
      video.dataset.csBound = '1';

      const postId = video.dataset.videoId || '';

      video.addEventListener('error', () => {
        const wrap = video.closest('.video-inline-wrap');
        if(!wrap || wrap.querySelector('.video-load-error')) return;
        const box = document.createElement('div');
        box.className = 'video-load-error';
        box.innerHTML = 'No se pudo cargar el video dentro de la app.<br><button type="button" data-reload-video="' + postId + '">Reintentar</button>';
        wrap.appendChild(box);
        saveUploadDiagnostic('video-playback-error', 'El video existe pero el reproductor interno no pudo cargarlo.', {postId, src: video.currentSrc || video.src, readyState: video.readyState, networkState: video.networkState});
      });

      video.addEventListener('loadedmetadata', () => {
        const wrap = video.closest('.video-inline-wrap');
        wrap?.querySelectorAll('.video-load-error').forEach(el => el.remove());
      });

      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      if(!video.dataset.csAutoplayTried){
        video.dataset.csAutoplayTried = '1';
        setTimeout(()=>video.play().catch(()=>null), 120);
      }

      video.addEventListener('play', () => {
        state.videoPlayingId = postId;
        state.videoIsPlaying = true;
        document.body.classList.add('video-playing');
        document.querySelectorAll('video.feed-video-player').forEach(other => {
          if(other !== video) {
            try { other.pause(); } catch {}
          }
        });
      });

      video.addEventListener('pause', () => {
        if(state.videoPlayingId === postId){
          state.videoIsPlaying = false;
          state.videoPlayingId = '';
          document.body.classList.remove('video-playing');
        }
      });

      video.addEventListener('ended', () => {
        if(state.videoPlayingId === postId){
          state.videoIsPlaying = false;
          state.videoPlayingId = '';
          document.body.classList.remove('video-playing');
        }
      });

      video.addEventListener('waiting', () => {
        console.info('[Conecta] Video esperando buffer', {postId, currentTime: video.currentTime, readyState: video.readyState, networkState: video.networkState});
      });

      video.addEventListener('stalled', () => {
        saveUploadDiagnostic('video-stalled', 'El reproductor se quedó esperando datos. Se mantiene el video sin re-render.', {postId, currentTime: video.currentTime, readyState: video.readyState, networkState: video.networkState});
      });
    });
  }

  function reloadVideo(postId){
    const post = state.posts.find(p => p.id === postId);
    if(!post?.mediaUrl) return toast('El video todavía no tiene URL.');
    const safeId = (window.CSS && CSS.escape) ? CSS.escape(postId) : postId.replace(/["\\]/g, '\\$&');
    const video = document.querySelector(`video.feed-video-player[data-video-id="${safeId}"]`);
    const wrap = document.querySelector(`[data-video-wrap="${safeId}"]`);
    wrap?.querySelectorAll('.video-load-error').forEach(el => el.remove());
    if(video){
      try { video.pause(); } catch {}
      state.videoIsPlaying = false;
      state.videoPlayingId = '';
      video.src = post.mediaUrl + (post.mediaUrl.includes('?') ? '&' : '?') + 'reload=' + Date.now();
      video.load();
      toast('Recargando video dentro de la app...');
    }
  }

  function openVideo(postId){
    const post = state.posts.find(p => p.id === postId);
    if(!post || !post.mediaUrl) return toast('El video aún no está listo.');
    state.videoViewer = {url: post.mediaUrl, title: post.title || 'Video'};
    render();
    setTimeout(()=>{
      const video = document.querySelector('.video-viewer video');
      if(video){
        video.muted = false;
        video.volume = 1;
        video.focus?.();
        video.play?.().catch(()=>null);
      }
    }, 120);
  }

  function closeVideo(){
    state.videoIsPlaying = false;
    state.videoPlayingId = '';
    document.body.classList.remove('video-playing');
    state.videoViewer = null;
    render();
  }

  function likePost(id){
    const cur = likedPostIds();
    const already = cur.includes(id);
    if(!already) set(K.likedPosts, [...cur, id]);
    saveLocalPosts(state.posts.map(p=>p.id===id?{...p,reactions:(p.reactions||0)+(already?0:1)}:p));
    toast(already ? 'Ya está en Para ti.' : 'Agregado a Para ti.');
    render();
  }
  function toggleFollow(ownerId){ if(ownerId===userId()) return toast('Esta publicación es tuya.'); const cur=follows(); const next=cur.includes(ownerId)?cur.filter(id=>id!==ownerId):[...cur,ownerId]; set(K.follows,next); toast(cur.includes(ownerId)?'Dejaste de seguir.':'Ahora lo sigues.'); render(); }
  function sharePost(id){ const p=state.posts.find(x=>x.id===id); if(!p) return; const text=`${p.title}\n\n${p.description}\n\n${p.category} · ${p.zone}\n\n${APP_URL}`; if(navigator.share) navigator.share({title:p.title,text,url:APP_URL}).catch(()=>{}); else navigator.clipboard?.writeText(text).then(()=>toast('Copiado para compartir.')); }
  function saveProfile(){
    const current = profile();
    const name=document.getElementById('profileName')?.value.trim()||'Usuario local';
    const nextProfile = {...current, name};
    set(K.profile,nextProfile);
    applyProfileToOwnPosts(nextProfile);
    toast('Perfil guardado y aplicado a tus publicaciones.');
    render();
  }

  function applyProfileToOwnPosts(prof=profile()){
    const mine = state.posts.filter(p => p.ownerId === userId());
    if(!mine.length) return;
    const now = new Date().toISOString();
    const updated = state.posts.map(p => p.ownerId === userId() ? {...p, ownerName:prof.name || 'Usuario local', ownerAvatar:prof.avatarData || '', updatedAt:now} : p);
    saveLocalPosts(updated);
    mine.forEach(p => syncPost({...p, ownerName:prof.name || 'Usuario local', ownerAvatar:prof.avatarData || '', updatedAt:now}).catch(()=>null));
  }

  async function profilePhotoChosen(event){
    const file = event.target.files?.[0];
    event.target.value = '';
    if(!file) return;
    if(!file.type.startsWith('image/')) return toast('Elige una imagen para tu perfil.');
    try{
      const resized = await resizeImage(file, 480, .82);
      const avatarData = await blobToDataURL(resized);
      const current = profile();
      const name = document.getElementById('profileName')?.value.trim() || current.name || 'Usuario local';
      const nextProfile = {...current, name, avatarData};
      set(K.profile, nextProfile);
      applyProfileToOwnPosts(nextProfile);
      toast('Foto de perfil guardada.');
      render();
    }catch{
      toast('No se pudo guardar la foto de perfil.');
    }
  }

  function openProfilePhotoPicker(){
    document.getElementById('profilePhotoInput')?.click();
  }
  function clearFilters(){ state.filter='ALL'; state.query=''; render(); }

  function shortTime(value){ try { return value ? new Date(value).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}) : ''; } catch { return ''; } }
  function shortDateTime(value){ try { const d=new Date(value); return d.toDateString()===new Date().toDateString()?d.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}):d.toLocaleDateString('es-MX',{day:'2-digit',month:'short'}); } catch { return ''; } }
  function loadKnownMessageIds(){ state.knownMessageIds = new Set(get(K.seenMessages, [])); }
  function persistKnownMessageIds(){ try { set(K.seenMessages, [...state.knownMessageIds].slice(-1000)); } catch {} }
  function loadReadMessageIds(){ state.readMessageIds = new Set(get(K.readMessages, [])); }
  function persistReadMessageIds(){ try { set(K.readMessages, [...state.readMessageIds].slice(-1500)); } catch {} }
  function unreadMessages(list=state.publicMessages){ return (list||[]).filter(m => m && m.senderId !== userId() && !state.readMessageIds.has(m.id)); }
  function unreadCount(){ return unreadMessages().length; }
  function unreadBadge(){ const count=unreadCount(); return count ? `<span class="nav-badge">${count > 99 ? '99+' : count}</span>` : ''; }

  function enableMessageFeedback(){
    try{
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if(AudioCtor && !state.audioCtx) state.audioCtx = new AudioCtor();
      if(state.audioCtx?.state === 'suspended') state.audioCtx.resume().catch(()=>null);
    }catch{}
  }

  function playMessageTone(){
    try{
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if(!AudioCtor) return;
      const ctx = state.audioCtx || new AudioCtor();
      state.audioCtx = ctx;
      if(ctx.state === 'suspended') ctx.resume().catch(()=>null);
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(740, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.11);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime); oscillator.stop(ctx.currentTime + 0.22);
    }catch{}
  }

  function trackMessages(list, options={}){
    const initial = !!options.initial;
    const fresh = [];
    (list||[]).forEach(m => {
      if(!m || !m.id) return;
      if(!state.knownMessageIds.has(m.id)){
        if(!initial && m.senderId !== userId()) fresh.push(m);
        state.knownMessageIds.add(m.id);
      }
    });
    persistKnownMessageIds();
    if(fresh.length){
      try { if(navigator.vibrate) navigator.vibrate(fresh.length > 1 ? [220,90,220] : [260]); } catch {}
      playMessageTone();
      toast(fresh.length > 1 ? `${fresh.length} mensajes nuevos` : `Nuevo mensaje de ${fresh[0].senderName || 'usuario local'}`);
    }
  }

  function markMessagesRead(list){
    let changed = false;
    (list||[]).forEach(m => {
      if(m && m.id && m.senderId !== userId() && !state.readMessageIds.has(m.id)){
        state.readMessageIds.add(m.id);
        changed = true;
      }
    });
    if(changed) persistReadMessageIds();
    return changed;
  }

  function chatMatchesMessage(m, chat=state.chat){
    if(!m || !chat) return false;
    const me = userId();
    return (m.postId||'') === (chat.postId||'') &&
      ((m.senderId === me && m.receiverId === chat.peerId) || (m.senderId === chat.peerId && m.receiverId === me));
  }

  function markActiveChatRead(){
    if(!state.chat) return false;
    return markMessagesRead((state.publicMessages || []).filter(m => chatMatchesMessage(m)));
  }

  function scrollChatToBottom(mode='auto'){
    setTimeout(()=>{ const feed=document.getElementById('chatFeed'); if(feed) feed.scrollTo({top:feed.scrollHeight, behavior:mode}); }, 60);
  }

  async function fetchPublicMessages(params={}){
    const qs = new URLSearchParams(params);
    const res = await fetch(`/api/messages?${qs.toString()}`, {cache:'no-store'});
    const data = await res.json().catch(()=>({ok:false}));
    if(!res.ok || !data.ok) throw new Error(data.message || data.error || 'No se pudieron cargar mensajes.');
    return data.messages || [];
  }

  async function savePublicMessage(message){
    const res = await fetch('/api/messages', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message})});
    const data = await res.json().catch(()=>({ok:false}));
    if(!res.ok || !data.ok) throw new Error(data.message || data.error || 'No se pudo enviar.');
    return data.message || message;
  }

  async function loadMessagesForInbox(options={}){
    if(state.messagesLoading) return;
    state.messagesLoading = !options.silent;
    state.messagesError = '';
    try{
      const list = await fetchPublicMessages({userId:userId()});
      const previous = JSON.stringify(state.publicMessages || []);
      const previousUnread = unreadCount();
      trackMessages(list, {initial:!state.messagesLoaded});
      state.publicMessages = list;
      state.messagesLoaded = true;
      if(state.route === '/chat') markActiveChatRead();
      if(options.silent && state.route !== '/publicar' && !shouldAvoidRender() && (JSON.stringify(list)!==previous || unreadCount()!==previousUnread)) render();
    }catch{
      if(!options.silent) state.messagesError = 'Todavía no se pudieron cargar los mensajes públicos.';
    }finally{
      state.messagesLoading = false;
      if(state.route === '/mensajes' && !options.silent) render();
    }
  }

  async function loadChatMessages(options={}){
    if(!state.chat || state.chatLoading) return;
    const activeInput = document.getElementById('chatText');
    const isTyping = !!(activeInput && document.activeElement === activeInput && activeInput.value.trim());
    if(options.silent && isTyping) return;
    state.chatLoading = !options.silent;
    try{
      const list = await fetchPublicMessages({userId:userId(), postId:state.chat.postId, peerId:state.chat.peerId});
      const previous = JSON.stringify(state.chatMessages || []);
      trackMessages(list, {initial:!state.chatLoaded});
      state.chatMessages = list;
      state.chatLoaded = true;
      markMessagesRead(list);
      if(options.silent && state.route === '/chat' && !shouldAvoidRender() && JSON.stringify(list)!==previous) render();
      if(state.route === '/chat') scrollChatToBottom(options.silent ? 'smooth' : 'auto');
    }catch{ if(!options.silent) toast('No se pudieron cargar los mensajes.'); }
    finally{
      state.chatLoading = false;
      if(state.route === '/chat' && !options.silent) render();
    }
  }

  function conversationGroups(list){
    const me=userId();
    const map = new Map();
    (list||[]).forEach(m => {
      const peerId = m.senderId === me ? m.receiverId : m.senderId;
      const peerName = m.senderId === me ? (m.receiverName || 'Usuario local') : (m.senderName || 'Usuario local');
      const key = `${m.postId || ''}::${peerId || ''}`;
      const prev = map.get(key);
      const item = {
        postId:m.postId||'',
        postTitle:m.postTitle||'Publicación',
        peerId,
        peerName,
        lastText:m.text||'',
        lastAt:m.createdAt||'',
        count:(prev?.count||0)+1,
        unread:(prev?.unread||0)+((m.senderId!==me && !state.readMessageIds.has(m.id))?1:0)
      };
      if(!prev || new Date(item.lastAt||0) >= new Date(prev.lastAt||0)) map.set(key,item);
      else map.set(key,{...prev,count:item.count,unread:item.unread});
    });
    return [...map.values()].sort((a,b)=>new Date(b.lastAt||0)-new Date(a.lastAt||0));
  }

  function conversationCard(item){
    const unread = item.unread || 0;
    return `<button class="conversation-card ${unread?'has-unread':''}" data-open-chat="1" data-post="${esc(item.postId)}" data-peer="${esc(item.peerId)}" data-title="${esc(item.postTitle)}" data-name="${esc(item.peerName)}">
      <div class="conversation-avatar">💬</div>
      <div class="conversation-main"><div class="conversation-line"><strong>${esc(item.peerName || 'Usuario local')}</strong><small>${esc(shortDateTime(item.lastAt))}</small></div><p>${esc(item.lastText || '')}</p></div>
      ${unread ? `<span class="conversation-count unread">${unread>99?'99+':unread}</span>` : '<span class="conversation-dot"></span>'}
    </button>`;
  }

  function messagesPage(){
    if(!state.messagesLoaded && !state.messagesLoading) loadMessagesForInbox();
    const groups = conversationGroups(state.publicMessages || []);
    return shell(`<section class="panel messages-panel">
      <h1>Mensajes</h1>
      ${state.messagesLoading ? '<div class="empty compact-empty"><strong>Cargando...</strong></div>' : ''}
      ${state.messagesError ? `<div class="local-note">${esc(state.messagesError)}</div>` : ''}
      <div class="list conversation-list">${groups.map(conversationCard).join('') || (!state.messagesLoading ? emptyState('Sin conversaciones','Cuando alguien te escriba, aparecerá aquí.') : '')}</div>
    </section>`);
  }

  function chatBubble(m){
    const mine = m.senderId === userId();
    return `<div class="bubble-row ${mine?'mine':'theirs'}"><div class="bubble"><p>${esc(m.text || '')}</p><small>${esc(shortTime(m.createdAt || Date.now()))}${mine?' ✓':''}</small></div></div>`;
  }

  function chatPage(){
    const chat = state.chat;
    if(!chat) return shell(`<section class="panel"><button class="back-btn" data-nav="/mensajes">← Volver</button><h1>Chat</h1></section>`);
    if(!state.chatLoaded && !state.chatLoading) loadChatMessages();
    return shell(`<section class="panel chat-panel">
      <div class="chat-topbar"><button class="back-btn" data-nav="/mensajes">←</button><div><h1>${esc(chat.peerName || 'Usuario local')}</h1><small>${esc(chat.postTitle || 'Publicación')}</small></div></div>
      <div class="chat-feed" id="chatFeed">${state.chatLoading ? '<div class="empty compact-empty"><strong>Cargando...</strong></div>' : ''}${state.chatMessages.map(chatBubble).join('') || (!state.chatLoading ? '<div class="empty compact-empty"><strong>Empieza la conversación</strong></div>' : '')}</div>
      <div class="chat-box"><textarea id="chatText" placeholder="Escribe un mensaje"></textarea><button class="big-button" data-send-chat>Enviar</button></div>
    </section>`);
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
    markActiveChatRead();
    nav('/chat');
  }

  function openChatFromConversation(button){
    state.chat = {postId:button.dataset.post||'', postTitle:button.dataset.title||'Publicación', peerId:button.dataset.peer||'', peerName:button.dataset.name||'Usuario local'};
    state.chatMessages = [];
    state.chatLoaded = false;
    markActiveChatRead();
    nav('/chat');
  }

  async function sendChatMessage(){
    if(!state.chat) return;
    const input = document.getElementById('chatText');
    const text = (input?.value || '').trim();
    if(!text) return toast('Escribe un mensaje.');
    const prof = profile();
    const msg = {id:uid('msg'), postId:state.chat.postId, postTitle:state.chat.postTitle, senderId:userId(), senderName:prof.name||'Usuario local', receiverId:state.chat.peerId, receiverName:state.chat.peerName||'Usuario local', text, status:'sent', createdAt:new Date().toISOString()};
    if(input) input.value = '';
    state.chatMessages = [...state.chatMessages, msg];
    render(); scrollChatToBottom('smooth');
    try{
      await savePublicMessage(msg);
      state.messagesLoaded = false;
      await loadChatMessages({silent:true});
      toast('Mensaje enviado.');
    }catch{
      toast('No se pudo enviar. Revisa conexión.');
    }
  }

  function bindDynamicFeedControls(){
    document.querySelectorAll('[data-clear]').forEach(b=>b.onclick=clearFilters);
    document.querySelectorAll('[data-retry]').forEach(b=>b.onclick=()=>retryPost(b.dataset.retry));
    document.querySelectorAll('[data-like]').forEach(b=>b.onclick=()=>likePost(b.dataset.like));
    document.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>sharePost(b.dataset.share));
    document.querySelectorAll('[data-follow]').forEach(b=>b.onclick=()=>toggleFollow(b.dataset.follow));
    document.querySelectorAll('[data-message]').forEach(b=>b.onclick=()=>openChat(b.dataset.message));
    document.querySelectorAll('[data-open-video]').forEach(el=>el.onclick=()=>openVideo(el.dataset.openVideo));
    document.querySelectorAll('[data-reload-video]').forEach(el=>el.onclick=()=>reloadVideo(el.dataset.reloadVideo));
    document.querySelectorAll('[data-toggle-video-sound]').forEach(el=>el.onclick=(e)=>{e.preventDefault();e.stopPropagation();toggleVideoSound(el.dataset.toggleVideoSound);});
    document.querySelectorAll('[data-gallery-dot]').forEach(el=>el.onclick=(e)=>{e.preventDefault();e.stopPropagation();goGallery(el.dataset.galleryDot, el.dataset.galleryIndex);});
    setupInternalVideos();
    setupGalleries();
    document.querySelectorAll('[data-open-chat]').forEach(b=>b.onclick=()=>openChatFromConversation(b));
    document.querySelectorAll('[data-send-chat]').forEach(b=>b.onclick=sendChatMessage);
    document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editPost(b.dataset.edit));
    document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deletePost(b.dataset.delete));
    document.querySelectorAll('[data-close-video]').forEach(b=>b.onclick=closeVideo);
    document.querySelectorAll('[data-reset-app]').forEach(b=>b.onclick=resetTechnicalApp);
    document.querySelectorAll('[data-copy-diagnostics]').forEach(b=>b.onclick=copyDiagnostics);
  }

  function bind(){
    document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.nav));
    document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;state.topTab='';state.query='';nav('/', {replace:true});});
    document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=openPicker);
    document.querySelectorAll('[data-publish]').forEach(b=>b.onclick=publish);
    document.querySelectorAll('[data-save-profile]').forEach(b=>b.onclick=saveProfile);
    document.querySelectorAll('[data-pick-profile-photo]').forEach(b=>b.onclick=openProfilePhotoPicker);
    const profilePhotoInput=document.getElementById('profilePhotoInput');
    if(profilePhotoInput) profilePhotoInput.onchange=profilePhotoChosen;
    document.querySelectorAll('[data-toggle-search]').forEach(b=>b.onclick=toggleSearchPanel);
    document.querySelectorAll('[data-open-store]').forEach(b=>b.onclick=()=>openStore(b.dataset.openStore));
    document.querySelectorAll('[data-top-tab]').forEach(b=>b.onclick=()=>setTopTab(b.dataset.topTab));
    document.querySelectorAll('[data-clear-search]').forEach(b=>b.onclick=(e)=>{ e.preventDefault(); e.stopPropagation(); if(state.query){ state.query=''; state.searchTyping=true; updateFeedOnly(); setTimeout(()=>{ const i=document.getElementById('searchInput'); i?.focus({preventScroll:true}); try{i?.setSelectionRange(0,0)}catch{} state.searchTyping=false; },80); } else { closeSearchPanel(); } });
    bindDynamicFeedControls();

    const picker=document.getElementById('mediaPicker');
    if(picker) picker.onchange=fileChosen;

    const search=document.getElementById('searchInput');
    if(search){
      let composing = false;
      const handler = e => {
        if(composing) return;
        applySearchText(e.target.value);
      };
      search.oncompositionstart = () => { composing = true; state.searchTyping = true; };
      search.oncompositionend = e => { composing = false; applySearchText(e.target.value); };
      search.oninput = handler;
      search.onsearch = handler;
      search.onclick = e => e.stopPropagation();
      search.onpointerdown = e => e.stopPropagation();
      search.ontouchstart = e => e.stopPropagation();
      search.onfocus = () => { state.searchTyping = true; };
      search.onblur = () => { setTimeout(()=>{ state.searchTyping = false; }, 300); };
    }

    const description=document.getElementById('description');
    if(description) description.oninput=e=>{state.composerDraft.description=e.target.value; saveComposerDraft();};

    const zone=document.getElementById('zone');
    if(zone) zone.oninput=e=>{state.composerDraft.zone=e.target.value; saveComposerDraft();};

    const category=document.getElementById('category');
    if(category) category.onchange=e=>{state.composerDraft.category=normalizeCategory(e.target.value); saveComposerDraft();};
  }

  function runVisibleRefresh(){
    if(document.visibilityState !== 'visible' || state.publishing) return;
    if(state.route === '/mensajes') loadMessagesForInbox({silent:true});
    else if(state.route === '/chat'){ loadChatMessages({silent:true}); loadMessagesForInbox({silent:true}); }
    else { loadMessagesForInbox({silent:true}); if(!state.syncing && state.route !== '/publicar') syncFromCloud({render:!shouldAvoidRender()}); }
  }

  function startPolling(){
    if(state.syncTimer) clearInterval(state.syncTimer);
    if(state.messageTimer) clearInterval(state.messageTimer);
    state.syncTimer = setInterval(()=>{ if(document.visibilityState==='visible' && !state.syncing && !state.publishing && !['/publicar','/mensajes','/chat'].includes(state.route)) syncFromCloud({render:!shouldAvoidRender()}); }, POLL_MS);
    state.messageTimer = setInterval(runVisibleRefresh, MESSAGE_POLL_MS);
    window.addEventListener('focus', runVisibleRefresh);
    document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') runVisibleRefresh(); });
  }

  async function init(){
    injectRootStyles();
    await refreshOldCaches();
    loadKnownMessageIds();
    loadReadMessageIds();
    document.addEventListener('pointerdown', enableMessageFeedback, {once:true});
    document.addEventListener('keydown', enableMessageFeedback, {once:true});
    state.lastUploadDiagnostic = get('cs_v6323_last_upload_diagnostic', null);
    window.CONNECTA_BOOT_VERSION = window.CONNECTA_BOOT_VERSION || VERSION;
    state.runtimeDiagnostic = diagnosticPayload('boot', 'App inicializada');
    state.posts = localPosts();
    loadComposerDraft();
    setupNavigationHistory();
    render();
    await syncFromCloud({render:true});
    startPolling();
  }

  init();
})();
