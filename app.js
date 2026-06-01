/* Conecta Servicios v6.5.4-conecta-control-piloto
   Arreglo de raíz para video móvil:
   - La versión remota de Supabase gana sobre copias locales viejas.
   - Si un video tiene mediaUrl válida, nunca se muestra como pendiente.
   - El feed no carga videos incrustados; muestra tarjeta y abre visor interno.
   - Fotos, chat, borrado y muro público se conservan.
*/
(() => {
  'use strict';

  const VERSION = 'v6.5.4-conecta-control-piloto';
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
    profileBackup: 'conecta_profile_backup_v1',
    profileBackup2: 'cs_profile_backup_v1',
    composer: 'cs_v634_composer',
    editingId: 'cs_v6412_editing_id',
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
    mediaFrame: {fit:'contain', scale:1, x:50, y:50},
    cloudReady: false,
    publishing: false,
    syncing: false,
    syncTimer: null,
    messageTimer: null,
    publicMessages: [],
    messagesLoaded: false,
    messagesLoading: false,
    messagesError: '',
    messagesUserId: '',
    messagesLastFetchedAt: 0,
    messagesLastCount: 0,
    messagesPostFilter: '',
    messagesPostTitle: '',
    chat: null,
    chatMessages: [],
    chatLoading: false,
    chatLoaded: false,
    knownMessageIds: new Set(),
    readMessageIds: new Set(),
    videoViewer: null,
    videoPlayingId: '',
    videoIsPlaying: false,
    videoObserver: null,
    lastUploadDiagnostic: null,
    runtimeDiagnostic: null,
    audioCtx: null,
    profileEditing: false,
    expandedDescriptions: new Set(),
    userReadingUntil: 0,
    readingListenersBound: false,
    directFramePostId: '',
    directFrameOriginal: null,
    directFrameSaving: false,
    directFrameIndex: 0,
    directEditPostId: '',
    directEditSaving: false,
    directMediaPostId: '',
    directMediaMode: '',
    directMediaSaving: false,
    galleryIndex: {}
  };

  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const uid = (p='id') => `${p}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const get = (k,f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
  const set = (k,v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (err) { console.warn('[Conecta] No se pudo guardar localStorage', k, err); return false; }
  };
  const norm = v => String(v || '').trim().toLowerCase();

  function userId(){ let id=localStorage.getItem(K.user); if(!id){ id=uid('u'); localStorage.setItem(K.user,id); } return id; }

  function isDefaultProfileName(name=''){
    const n = norm(name);
    return !n || n === 'usuario local' || n === 'tu nombre o marca';
  }

  function isPersonalProfile(prof={}){
    return !!(prof && (!isDefaultProfileName(prof.name) || String(prof.avatarData || '').trim()));
  }

  function normalizeProfile(prof={}){
    // v6.4.81: algunos celulares quedaron con respaldos de perfil en null.
    // Antes, profileFromBackups().map(normalizeProfile) podía romper al leer prof.name.
    if(!prof || typeof prof !== 'object') prof = {};
    return {
      name: String(prof.name || '').trim() || 'Usuario local',
      avatarData: String(prof.avatarData || prof.avatar || '').trim(),
      updatedAt: prof.updatedAt || new Date().toISOString()
    };
  }

  function saveProfileEverywhere(prof={}){
    const clean = normalizeProfile(prof);
    set(K.profile, clean);
    // Respaldos no versionados: deben sobrevivir a actualizaciones normales.
    try { localStorage.setItem(K.profileBackup, JSON.stringify(clean)); } catch {}
    try { localStorage.setItem(K.profileBackup2, JSON.stringify(clean)); } catch {}
    try { localStorage.setItem('conecta_profile_name_backup', clean.name || ''); } catch {}
    try { if(clean.avatarData) localStorage.setItem('conecta_profile_avatar_backup', clean.avatarData); } catch {}
    return clean;
  }

  function profileFromBackups(){
    const candidates = [
      get(K.profileBackup, null),
      get(K.profileBackup2, null),
      get(K.profile, null),
      {name: localStorage.getItem('conecta_profile_name_backup') || '', avatarData: localStorage.getItem('conecta_profile_avatar_backup') || ''}
    ]
      .filter(item => item && typeof item === 'object')
      .map(normalizeProfile);
    return candidates.find(isPersonalProfile) || null;
  }

  function profileFromOwnPosts(){
    try{
      const id = userId();
      const candidates = (Array.isArray(state.posts) && state.posts.length ? state.posts : get(K.posts, []))
        .filter(p => p && p.ownerId === id)
        .filter(p => !isDefaultProfileName(p.ownerName) || String(p.ownerAvatar || '').trim())
        .sort((a,b)=>new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
      const hit = candidates[0];
      if(!hit) return null;
      return normalizeProfile({name: hit.ownerName || 'Usuario local', avatarData: hit.ownerAvatar || ''});
    }catch{
      return null;
    }
  }

  function profile(){
    const saved = normalizeProfile(get(K.profile, null) || {});
    if(isPersonalProfile(saved)){
      saveProfileEverywhere(saved);
      return saved;
    }

    const recovered = profileFromBackups() || profileFromOwnPosts();
    if(recovered && isPersonalProfile(recovered)){
      saveProfileEverywhere(recovered);
      return recovered;
    }

    const fresh = {name:'Usuario local', avatarData:'', updatedAt:new Date().toISOString()};
    set(K.profile, fresh);
    return fresh;
  }

  function identityAliases(){
    const ids = new Set();
    const add = id => {
      id = String(id || '').trim();
      if(id) ids.add(id);
    };
    add(userId());
    try { add(localStorage.getItem(K.user)); } catch {}
    try { add(localStorage.getItem('conecta_user_id_backup')); } catch {}

    const prof = profile();
    const sameProfile = p => {
      if(!p) return false;
      const nameMatch = prof.name && !isDefaultProfileName(prof.name) && String(p.ownerName || '').trim() === String(prof.name || '').trim();
      const avatarMatch = prof.avatarData && String(p.ownerAvatar || '').trim() === String(prof.avatarData || '').trim();
      return !!(nameMatch || avatarMatch);
    };

    try{
      (Array.isArray(state.posts) && state.posts.length ? state.posts : get(K.posts, [])).forEach(p => {
        if(!p || !p.ownerId) return;
        if(p.ownerId === userId() || sameProfile(p)) add(p.ownerId);
      });
    }catch{}

    return [...ids];
  }

  function isMeId(id){
    return identityAliases().includes(String(id || '').trim());
  }

  function adminFrameMode(){
    // Modo admin local para piloto: permite encuadrar multimedia de cualquier publicación desde este navegador.
    // No reemplaza una seguridad real de servidor; solo evita tocar Supabase/SQL en esta etapa.
    const key = 'cs_v646_admin_frame_mode';
    try{
      const params = new URLSearchParams(location.search || '');
      const requested = String(params.get('admin') || '').trim().toLowerCase();
      if(requested === 'off' || requested === '0'){
        localStorage.removeItem(key);
        return false;
      }
      if(['1','true','media','encuadre','admin'].includes(requested)){
        localStorage.setItem(key, '1');
        return true;
      }
      if(location.hash && location.hash.toLowerCase().includes('admin-encuadre')){
        localStorage.setItem(key, '1');
        return true;
      }
      return localStorage.getItem(key) === '1';
    }catch{
      return false;
    }
  }

  function canFramePostAsAdmin(post){
    return !!post && (isMeId(post.ownerId) || adminFrameMode());
  }

  async function fetchMessagesForIdentity(params={}){
    const adminInbox = adminFrameMode();
    const map = new Map();
    let lastError = null;

    if(adminInbox){
      try{
        const list = await fetchPublicMessages({...params, admin:'1', all:'1', t:Date.now()});
        (Array.isArray(list) ? list : []).forEach(m => {
          if(m && m.id) map.set(m.id, {...m, adminVisible:true});
        });
      }catch(error){
        lastError = error;
      }
      if(!map.size && lastError) throw lastError;
      return [...map.values()].sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0));
    }

    const aliases = identityAliases();
    for(const id of aliases){
      try{
        const list = await fetchPublicMessages({...params, userId:id, t:Date.now()});
        (Array.isArray(list) ? list : []).forEach(m => {
          if(m && m.id) map.set(m.id, m);
        });
      }catch(error){
        lastError = error;
      }
    }

    if(!map.size && lastError) throw lastError;
    return [...map.values()].sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0));
  }

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

  function isTextInputActive(){
    const el = document.activeElement;
    if(!el) return false;
    const tag = String(el.tagName || '').toLowerCase();
    if(tag === 'textarea') return true;
    if(tag === 'input'){
      const type = String(el.getAttribute('type') || 'text').toLowerCase();
      return !['button','submit','checkbox','radio','file','hidden'].includes(type);
    }
    return !!el.isContentEditable;
  }

  function hasMountedFeedVideo(){
    try{
      return !!document.querySelector('video.feed-video-player');
    }catch{
      return false;
    }
  }

  function markReadingInteraction(ms=9000){
    if(['/publicar','/mensajes','/chat'].includes(state.route)) return;
    state.userReadingUntil = Math.max(state.userReadingUntil || 0, Date.now() + ms);
  }

  function isReadingFeed(){
    const expanded = !!(state.expandedDescriptions && state.expandedDescriptions.size);
    const recent = Date.now() < Number(state.userReadingUntil || 0);
    return expanded || recent;
  }

  function shouldAvoidRender(){
    return hasMountedFeedVideo() || isReadingFeed() || isAnyVideoPlaying() || isSearchActive() || state.searchTyping || state.profileEditing || isTextInputActive();
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
      const keepProfileBackup = localStorage.getItem(K.profileBackup);
      const keepProfileBackup2 = localStorage.getItem(K.profileBackup2);
      const keepProfileNameBackup = localStorage.getItem('conecta_profile_name_backup');
      const keepProfileAvatarBackup = localStorage.getItem('conecta_profile_avatar_backup');
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
      if(keepProfileBackup) localStorage.setItem(K.profileBackup, keepProfileBackup);
      if(keepProfileBackup2) localStorage.setItem(K.profileBackup2, keepProfileBackup2);
      if(keepProfileNameBackup) localStorage.setItem('conecta_profile_name_backup', keepProfileNameBackup);
      if(keepProfileAvatarBackup) localStorage.setItem('conecta_profile_avatar_backup', keepProfileAvatarBackup);
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
      userId: userId(),
      profileName: profile().name || '',
      profileHasPhoto: !!profile().avatarData,
      profileBackup: {hasBackup: !!profileFromBackups(), hasOwnPostRecovery: !!profileFromOwnPosts()}, 
      url: location.href,
      serviceWorkerControlled: !!navigator.serviceWorker?.controller,
      messages: {currentUserId:userId(), userId: state.messagesUserId || '', loaded: !!state.messagesLoaded, count: state.messagesLastCount || 0, lastFetchedAt: state.messagesLastFetchedAt || 0, error: state.messagesError || '', sample:(state.publicMessages||[]).slice(-5)},
      localPosts: localPosts().map(p => ({id:p.id, ownerId:p.ownerId, title:p.title, category:p.category, descriptionLength:String(p.description||'').length, captionLength:postCaptionText(p).length, mediaType:p.mediaType, mediaStatus:p.mediaStatus, cloudStatus:p.cloudStatus, hasMediaUrl:!!p.mediaUrl, mediaError:p.mediaError || ''})).slice(0, 30),
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

  function clampNumber(value, min, max, fallback){
    const n = Number(value);
    if(!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function cleanMediaFrame(frame={}){
    const fit = String(frame.fit || frame.mediaFit || 'contain').toLowerCase() === 'cover' ? 'cover' : 'contain';
    return {
      fit,
      scale: clampNumber(frame.scale ?? frame.mediaScale, .25, 4.0, 1),
      x: clampNumber(frame.x ?? frame.mediaX, -180, 280, 50),
      y: clampNumber(frame.y ?? frame.mediaY, -180, 280, 50)
    };
  }

  function mediaFrameFromPost(post={}){
    return cleanMediaFrame({
      fit: post.mediaFit || post.fit,
      scale: post.mediaScale || post.scale,
      x: post.mediaX ?? post.x,
      y: post.mediaY ?? post.y
    });
  }

  function mediaFrameVars(postOrFrame={}){
    const hasPostKeys = postOrFrame && (postOrFrame.mediaFit || postOrFrame.mediaScale || postOrFrame.mediaX !== undefined || postOrFrame.mediaY !== undefined);
    const f = cleanMediaFrame(hasPostKeys ? mediaFrameFromPost(postOrFrame) : postOrFrame);
    return `--media-fit:${f.fit};--media-x:${f.x}%;--media-y:${f.y}%;--media-tx:${f.x - 50}%;--media-ty:${f.y - 50}%;--media-scale:${f.scale};`;
  }

  function frameLabel(frame=state.mediaFrame){
    const f = cleanMediaFrame(frame);
    return `${f.fit === 'contain' ? 'Completo' : 'Lleno'} · ${Math.round(f.scale * 100)}%`;
  }

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

    const hasExplicitFrame = !!(next.mediaFit || next.fit || next.mediaScale !== undefined || next.scale !== undefined || next.mediaX !== undefined || next.x !== undefined || next.mediaY !== undefined || next.y !== undefined);
    let frame = mediaFrameFromPost(next);

    // Para publicaciones masivas con video, el estándar visual debe llenar la pantalla automáticamente.
    // Si el usuario/admin ya ajustó el encuadre, respetamos su ajuste.
    if(isVideoPost(next) && !hasExplicitFrame){
      frame = {fit:'cover', scale:1, x:50, y:50};
    }

    next.mediaFit = frame.fit;
    next.mediaScale = frame.scale;
    next.mediaX = frame.x;
    next.mediaY = frame.y;
    next.serviceArea = String(next.serviceArea || next.coverageArea || next.zone || '').trim();

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
        let chosen = chooseBetterPost(lp, rp);
        if(chosen.ownerId === userId()){
          const prof = profile();
          if(isPersonalProfile(prof)){
            chosen = {...chosen, ownerName: prof.name || chosen.ownerName || 'Usuario local', ownerAvatar: prof.avatarData || chosen.ownerAvatar || ''};
          }
        }
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
      if(rp.ownerId === userId()){
        const prof = profile();
        if(isPersonalProfile(prof)){
          rp = {...rp, ownerName: prof.name || rp.ownerName || 'Usuario local', ownerAvatar: prof.avatarData || rp.ownerAvatar || ''};
        }
      }
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
      post.serviceArea,
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
          const municipio = normalizeSearchText(municipioLabel());
          const zona = normalizeSearchText(serviceAreaText(p) || p.zone);
          return !municipio || municipio === 'tu zona'
            ? true
            : zona === municipio || zona.includes(municipio) || isWideServiceArea(zona);
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

  function myPosts(){ return filteredAll().filter(p => isMeId(p.ownerId)); }
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
    const requestedId = String(ownerId || '').trim();
    if(adminFrameMode() && (!requestedId || requestedId === userId())){
      state.storeOwnerId = '';
      state.storeOwnerName = 'Tienda global';
      state.topTab = 'tienda';
      state.filter = 'ALL';
      state.query = '';
      nav('/tienda');
      return;
    }

    const id = requestedId || userId();
    const summary = ownerSummary(id);
    state.storeOwnerId = id;
    state.storeOwnerName = summary.ownerName;
    state.topTab = 'tienda';
    state.filter = 'ALL';
    state.query = '';
    nav('/tienda');
  }


  function requestRenderSoon(){ clearTimeout(requestRenderSoon._t); requestRenderSoon._t=setTimeout(()=>{ if(state.route !== '/publicar' && !shouldAvoidRender()) render(); },60); }

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
    if(post?.ownerId === userId()) return profile().avatarData || post?.ownerAvatar || '';
    if(post?.ownerAvatar) return post.ownerAvatar;
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

  function isHttpAvatarUrl(value=''){
    return /^https:\/\/.+/i.test(String(value || '').trim());
  }

  function isDataImageAvatar(value=''){
    return /^data:image\//i.test(String(value || '').trim());
  }

  function bestLocalProfileAvatar(){
    const candidates = [];
    try{ candidates.push(profile().avatarData); }catch{}
    try{ candidates.push(get(K.profile, {})?.avatarData); }catch{}
    try{ candidates.push(get(K.profileBackup, {})?.avatarData); }catch{}
    try{ candidates.push(get(K.profileBackup2, {})?.avatarData); }catch{}
    try{ candidates.push(localStorage.getItem('conecta_profile_avatar_backup') || ''); }catch{}

    try{
      (Array.isArray(state.posts) && state.posts.length ? state.posts : get(K.posts, [])).forEach(p => {
        if(!p) return;
        if(isMeId(p.ownerId)) candidates.push(p.ownerAvatar || '', p.avatar || '');
      });
    }catch{}

    const http = candidates.find(isHttpAvatarUrl);
    if(http) return String(http).trim();

    const data = candidates.find(isDataImageAvatar);
    if(data) return String(data).trim();

    return '';
  }

  async function uploadProfileAvatarToCloud(prof=profile()){
    prof = normalizeProfile(prof);
    let currentAvatar = String(prof.avatarData || '').trim() || bestLocalProfileAvatar();

    if(!currentAvatar) return prof;
    if(isHttpAvatarUrl(currentAvatar)){
      return normalizeProfile({...prof, avatarData:currentAvatar, updatedAt:new Date().toISOString()});
    }
    if(!isDataImageAvatar(currentAvatar)) return prof;

    const cfg = await getPublicConfig();
    if(!cfg.ok || !cfg.supabaseUrl || !cfg.supabaseAnonKey){
      toast('No se pudo leer configuración de Supabase para foto.');
      return prof;
    }

    const blob = dataUrlToBlob(currentAvatar);
    if(!blob) return prof;

    const supabaseBase = String(cfg.supabaseUrl || '').trim().replace(/\/rest\/v1\/?$/i,'').replace(/\/+$/g,'');
    const bucket = cfg.storageBucket || STORAGE_BUCKET;
    const ext = (blob.type || 'image/jpeg').includes('png') ? 'png' : 'jpg';
    const path = `${encodeURIComponent(userId())}/profile/${Date.now()}-avatar.${ext}`;

    try{
      await uploadMediaTus({
        blob,
        supabaseBase,
        bucket,
        path,
        anonKey: cfg.supabaseAnonKey,
        contentType: blob.type || 'image/jpeg'
      });
    }catch(tusError){
      const url = `${supabaseBase}/storage/v1/object/${bucket}/${path}`;
      const res = await fetch(url, {
        method:'POST',
        headers:{
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
          'Content-Type': blob.type || 'image/jpeg',
          'x-upsert':'true'
        },
        body: blob
      });

      if(!res.ok){
        const detail = await res.text().catch(()=>'');
        console.warn('[Conecta perfil] No se pudo subir avatar', tusError, detail || res.status);
        toast('No se pudo subir la foto a la nube. Revisa Storage/políticas.');
        return prof;
      }
    }

    return normalizeProfile({
      ...prof,
      avatarData: `${supabaseBase}/storage/v1/object/public/${bucket}/${path}`,
      updatedAt: new Date().toISOString()
    });
  }

  async function repairPublicProfileAvatar(){
    let prof = profile();
    const localAvatar = bestLocalProfileAvatar();
    if(localAvatar && !prof.avatarData) prof = {...prof, avatarData:localAvatar};
    const before = String(prof.avatarData || localAvatar || '');
    if(!before) return toast('Este celular no tiene una foto local para subir.');
    toast('Reparando foto pública del anunciante...');
    const nextProfile = await uploadProfileAvatarToCloud(prof);
    if(!isHttpAvatarUrl(nextProfile.avatarData)){
      return toast('No se pudo convertir la foto a URL pública.');
    }
    saveProfileEverywhere(nextProfile);
    applyProfileToOwnPosts(nextProfile);
    toast('Foto pública reparada. Revisa desde otro celular en unos segundos.');
    render();
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

      /* v6.4.48: puntitos fuera del encuadre y foto única al encuadrar */
      .direct-frame-active .post-body-gallery-dots,
      .direct-frame-active .gallery-dots{
        display:none !important;
        pointer-events:none !important;
      }


      /* v6.4.48: encuadre independiente por foto */
      .direct-frame-active .direct-frame-hint{
        max-width:calc(100% - 44px) !important;
      }

      .direct-frame-single .framed-media{
        transform-origin:center center !important;
      }

      .direct-frame-single{
        width:100% !important;
        height:100% !important;
        overflow:hidden !important;
        background:#050507 !important;
      }

      .direct-frame-single img{
        width:100% !important;
        height:100% !important;
        display:block !important;
      }

      .post-body .gallery-dots,
      .post-body-gallery-dots{
        top:46px !important;
        right:46px !important;
        padding:2px 5px !important;
        gap:1px !important;
        opacity:.92 !important;
        pointer-events:auto !important;
      }

      .post-body .gallery-dot{
        width:12px !important;
        height:12px !important;
        min-width:12px !important;
      }

      .post-body .gallery-dot span{
        width:3px !important;
        height:3px !important;
      }

      .post-body .gallery-dot.active span{
        width:9px !important;
      }

      .gallery-stage{
        touch-action:pan-y !important;
      }

      .gallery-stage.is-swiping-gallery{
        touch-action:none !important;
      }

      @media (max-width:420px){
        .post-body .gallery-dots,
        .post-body-gallery-dots{
          top:44px !important;
          right:38px !important;
          transform:scale(.86) !important;
          transform-origin:right top !important;
        }
      }

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

      /* v6.3.39: altavoz fuera del video y perfil estable */
      .sound-toggle-card{
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        position:absolute !important;
        right:16px !important;
        top:calc(env(safe-area-inset-top) + 160px) !important;
        z-index:220 !important;
        width:56px !important;
        height:56px !important;
        border-radius:999px !important;
        border:2px solid rgba(255,255,255,.76) !important;
        background:rgba(0,0,0,.72) !important;
        color:#fff !important;
        font-size:26px !important;
        box-shadow:0 14px 38px rgba(0,0,0,.42) !important;
        backdrop-filter:blur(14px) !important;
        opacity:1 !important;
        visibility:visible !important;
        pointer-events:auto !important;
      }
      .sound-toggle{
        z-index:210 !important;
      }
      #profileName{
        font-size:16px !important;
        -webkit-user-select:text !important;
        user-select:text !important;
        caret-color:#5b2eea;
      }
      .profile-panel{
        scroll-margin-top:calc(env(safe-area-inset-top) + 90px);
      }
      .owner-row span:not(.owner-dot){
        display:inline-block;
      }

      /* v6.3.40: audio siempre visible y perfil aplicable */
      .post-action-row.has-audio-action{
        grid-template-columns:repeat(4, minmax(0,1fr)) !important;
      }
      .post-action-row.has-audio-action button{
        font-size:11px !important;
        padding-left:5px !important;
        padding-right:5px !important;
      }
      .audio-row-btn{
        background:rgba(0,0,0,.48) !important;
        border-color:rgba(255,255,255,.44) !important;
      }
      /* v6.4.48: acciones icon-only y perfil simple */
      .post-action-row{
        grid-template-columns:repeat(3, 1fr) !important;
        gap:10px !important;
      }
      .post-action-row.has-audio-action{
        grid-template-columns:repeat(4, 1fr) !important;
      }
      .post-action-row .icon-only-action{
        min-height:44px !important;
        height:44px !important;
        padding:0 !important;
        font-size:22px !important;
        line-height:1 !important;
        border-radius:999px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        text-align:center !important;
      }
      .post-action-row.has-audio-action .icon-only-action{
        font-size:21px !important;
      }
      .audio-row-btn{
        background:rgba(0,0,0,.50) !important;
        border-color:rgba(255,255,255,.48) !important;
      }
      .profile-help,
      .apply-profile-visible{
        display:none !important;
      }

      /* v6.5.4-conecta-control-piloto: bloque consolidado de Home/postCard.
         No tocar APIs ni multimedia; esta capa neutraliza contradicciones anteriores del Home. */
      .media-bottom{
        display:none !important;
      }

      .post-body{
        left:12px !important;
        right:12px !important;
        bottom:calc(env(safe-area-inset-bottom) + 78px) !important;
        padding:12px 12px 11px 12px !important;
        border-radius:22px !important;
        background:linear-gradient(180deg,rgba(0,0,0,.10),rgba(0,0,0,.56) 30%,rgba(0,0,0,.82)) !important;
        backdrop-filter:blur(2px) !important;
        box-shadow:0 14px 34px rgba(0,0,0,.18) !important;
        color:#fff !important;
        z-index:70 !important;
        max-height:calc(100vh - 166px) !important;
        overflow:hidden !important;
      }

      .post-body.expanded-description-body{
        max-height:calc(100vh - 144px) !important;
        background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.54) 12%,rgba(0,0,0,.88)) !important;
      }

      .post-body .owner-row{
        font-size:13px !important;
        margin-bottom:4px !important;
        gap:8px !important;
        align-items:center !important;
      }

      .post-body h2{
        font-size:18px !important;
        line-height:1.08 !important;
        margin:0 0 4px !important;
        color:#fff !important;
        text-shadow:0 2px 12px rgba(0,0,0,.42);
      }

      .post-description-short{
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        color:rgba(255,255,255,.95) !important;
        font-size:14px !important;
        line-height:1.25 !important;
        margin:0 !important;
        white-space:pre-line !important;
        text-shadow:0 2px 12px rgba(0,0,0,.42);
        max-height:none !important;
        overflow:visible !important;
      }

      .post-description-short.is-collapsed{
        max-height:2.55em !important;
        overflow:hidden !important;
      }

      .description-toggle{
        appearance:none !important;
        border:0 !important;
        background:transparent !important;
        color:#fff !important;
        font-weight:900 !important;
        font-size:14px !important;
        line-height:1 !important;
        padding:0 0 0 4px !important;
        text-shadow:0 2px 10px rgba(0,0,0,.55);
      }

      .post-description-expanded{
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        color:#fff !important;
        font-size:15px !important;
        line-height:1.25 !important;
        max-height:min(46vh, 350px) !important;
        overflow-y:auto !important;
        overscroll-behavior:contain !important;
        -webkit-overflow-scrolling:touch !important;
        padding:10px 10px 34px 10px !important;
        margin-top:6px !important;
        border-radius:18px !important;
        background:rgba(0,0,0,.36) !important;
        border:1px solid rgba(255,255,255,.18) !important;
        backdrop-filter:blur(3px) !important;
        white-space:pre-line !important;
        scrollbar-width:thin;
        scrollbar-color:rgba(255,255,255,.65) rgba(255,255,255,.12);
        touch-action:pan-y !important;
        position:relative !important;
        z-index:150 !important;
      }

      .post-description-expanded::-webkit-scrollbar{
        width:4px;
      }

      .post-description-expanded::-webkit-scrollbar-thumb{
        background:rgba(255,255,255,.65);
        border-radius:999px;
      }

      .description-full-text{
        padding-bottom:8px;
      }

      .hide-toggle{
        position:sticky !important;
        bottom:0 !important;
        display:block !important;
        width:100% !important;
        text-align:right !important;
        padding:8px 2px 0 0 !important;
        background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.38)) !important;
      }

      .post-meta{
        justify-content:flex-end !important;
        margin-top:5px !important;
        font-size:11px !important;
        color:rgba(255,255,255,.82) !important;
      }

      .post-action-row{
        display:grid !important;
        grid-template-columns:repeat(3, 1fr) !important;
        gap:10px !important;
        width:100% !important;
        margin-top:8px !important;
        z-index:160 !important;
        position:relative !important;
        pointer-events:auto !important;
      }

      .post-action-row.has-audio-action{
        grid-template-columns:repeat(4, 1fr) !important;
      }

      .post-action-row .icon-only-action{
        min-height:44px !important;
        height:44px !important;
        padding:0 !important;
        border-radius:999px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        text-align:center !important;
        font-size:22px !important;
        line-height:1 !important;
        background:rgba(255,255,255,.22) !important;
        border:1px solid rgba(255,255,255,.32) !important;
        color:#fff !important;
        box-shadow:0 10px 28px rgba(0,0,0,.20) !important;
        backdrop-filter:blur(10px) !important;
      }

      .post-action-row.has-audio-action .icon-only-action{
        font-size:21px !important;
      }

      .post-action-row .heart-action{
        font-size:28px !important;
        color:#fff !important;
      }

      .post-action-row .heart-action.liked{
        color:#ef4444 !important;
        text-shadow:0 2px 12px rgba(239,68,68,.45);
      }

      .audio-row-btn{
        background:rgba(0,0,0,.50) !important;
        border-color:rgba(255,255,255,.48) !important;
      }

      /* v6.4.48: asegurar ...leer visible y evitar mutaciones de ownerId */
      .post-description-short.is-collapsed{
        display:block !important;
        max-height:2.65em !important;
        overflow:hidden !important;
      }
      .post-description-short .read-toggle{
        display:inline !important;
        margin-left:4px !important;
        padding:0 !important;
        color:#fff !important;
        font-weight:900 !important;
        text-decoration:none !important;
      }
      .description-toggle{
        cursor:pointer !important;
        pointer-events:auto !important;
      }

      /* v6.4.48: descripción visible, ...leer separado del texto */
      .post-description-collapsed{
        display:grid !important;
        grid-template-columns:1fr auto !important;
        align-items:end !important;
        gap:4px !important;
        width:100% !important;
        position:relative !important;
        z-index:180 !important;
        margin-top:2px !important;
      }

      .description-preview{
        display:block !important;
        min-width:0 !important;
        color:rgba(255,255,255,.95) !important;
        font-size:14px !important;
        line-height:1.25 !important;
        max-height:2.5em !important;
        overflow:hidden !important;
        white-space:normal !important;
        text-shadow:0 2px 12px rgba(0,0,0,.42);
      }

      .post-description-short{
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        color:rgba(255,255,255,.95) !important;
        font-size:14px !important;
        line-height:1.25 !important;
        margin-top:2px !important;
        white-space:pre-line !important;
        text-shadow:0 2px 12px rgba(0,0,0,.42);
        position:relative !important;
        z-index:180 !important;
      }

      .description-toggle,
      .read-toggle,
      .hide-toggle{
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        border:0 !important;
        background:transparent !important;
        color:#fff !important;
        font-weight:900 !important;
        font-size:14px !important;
        line-height:1 !important;
        padding:2px 0 2px 4px !important;
        text-shadow:0 2px 10px rgba(0,0,0,.65) !important;
        pointer-events:auto !important;
        cursor:pointer !important;
        white-space:nowrap !important;
        z-index:190 !important;
      }

      .post-description-expanded{
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        color:#fff !important;
        font-size:15px !important;
        line-height:1.25 !important;
        max-height:min(46vh, 350px) !important;
        overflow-y:auto !important;
        overscroll-behavior:contain !important;
        -webkit-overflow-scrolling:touch !important;
        padding:10px 10px 34px 10px !important;
        margin-top:6px !important;
        border-radius:18px !important;
        background:rgba(0,0,0,.36) !important;
        border:1px solid rgba(255,255,255,.18) !important;
        backdrop-filter:blur(3px) !important;
        white-space:pre-line !important;
        touch-action:pan-y !important;
        position:relative !important;
        z-index:180 !important;
      }

      .hide-toggle{
        position:sticky !important;
        bottom:0 !important;
        display:flex !important;
        width:100% !important;
        justify-content:flex-end !important;
        padding-top:8px !important;
        background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.38)) !important;
      }

      .post-body.expanded-description-body{
        max-height:calc(100vh - 144px) !important;
        overflow:hidden !important;
      }

      .post-meta{
        margin-top:5px !important;
      }

      @media (max-height:700px){
        .post-description-short{
          font-size:13px !important;
        }
        .post-description-expanded{
          max-height:min(42vh, 290px) !important;
          font-size:14px !important;
        }
        .post-body h2{
          font-size:17px !important;
        }
      }

      .apply-profile-visible{
        width:100%;
        margin-top:10px;
        border:1px solid rgba(91,46,234,.22);
        background:rgba(91,46,234,.08);
        color:#4c1d95;
        font-weight:900;
        border-radius:18px;
        padding:13px 14px;
      }
      .profile-help{
        color:#6b7280;
        font-size:13px;
        margin:8px 0 12px;
      }
      #profileName{
        touch-action:manipulation;
        -webkit-user-select:text !important;
        user-select:text !important;
        min-height:48px;
      }

      /* v6.5.4-conecta-control-piloto */
      .trust-entry-card{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin-top:16px;
        padding:14px;
        border-radius:22px;
        background:linear-gradient(135deg,rgba(16,185,129,.12),rgba(59,130,246,.12));
        border:1px solid rgba(16,185,129,.18);
      }
      .trust-entry-card strong{
        display:block;
        color:#111827;
        font-size:15px;
      }
      .trust-entry-card span{
        display:block;
        color:#6b7280;
        font-size:12px;
        margin-top:3px;
        line-height:1.25;
      }
      .trust-entry-card button{
        border:0;
        border-radius:999px;
        padding:10px 14px;
        background:#0f766e;
        color:#fff;
        font-weight:900;
      }
      .trust-page{
        margin:calc(env(safe-area-inset-top) + 92px) 12px 12px !important;
      }
      .trust-page + .trust-page{
        margin-top:12px !important;
      }
      .trust-hero{
        display:flex;
        gap:14px;
        align-items:center;
      }
      .trust-badge{
        width:62px;
        height:62px;
        border-radius:22px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:32px;
        background:linear-gradient(135deg,#0f766e,#2563eb);
        color:#fff;
        box-shadow:0 14px 34px rgba(15,118,110,.22);
        flex:0 0 auto;
      }
      .trust-kicker{
        margin:0 0 3px !important;
        font-size:12px !important;
        color:#0f766e !important;
        text-transform:uppercase;
        letter-spacing:.06em;
        font-weight:900;
      }
      .trust-summary{
        margin-top:16px;
        padding:14px;
        border-radius:20px;
        background:#ecfdf5;
        border:1px solid #bbf7d0;
      }
      .trust-summary strong{
        color:#065f46;
      }
      .trust-summary p{
        margin:5px 0 0 !important;
        color:#065f46 !important;
      }
      .trust-grid{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:10px;
      }
      .trust-card{
        padding:14px;
        border-radius:20px;
        background:#fff;
        border:1px solid #eef2f7;
        box-shadow:0 10px 26px rgba(17,24,39,.06);
      }
      .trust-card span{
        font-size:26px;
        display:block;
        margin-bottom:8px;
      }
      .trust-card strong{
        display:block;
        color:#111827;
        font-size:14px;
      }
      .trust-card p{
        margin:6px 0 0 !important;
        font-size:12px !important;
        line-height:1.35 !important;
        color:#4b5563 !important;
      }
      .trust-steps{
        display:flex;
        flex-direction:column;
        gap:10px;
      }
      .trust-steps div{
        display:grid;
        grid-template-columns:36px 1fr;
        gap:10px;
        align-items:start;
        padding:12px;
        border-radius:18px;
        background:#f8fafc;
      }
      .trust-steps strong{
        width:36px;
        height:36px;
        border-radius:999px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#111827;
        color:#fff;
      }
      .trust-steps p{
        margin:0 !important;
        color:#374151 !important;
        line-height:1.35 !important;
      }
      .trust-note{
        margin-top:12px;
      }
      .trust-list{
        margin:0;
        padding-left:18px;
        color:#374151;
      }
      .trust-list li{
        margin:8px 0;
        line-height:1.35;
      }
      .trust-footer{
        margin:16px 0 0 !important;
        color:#6b7280 !important;
        font-size:12px !important;
        text-align:center;
      }

      .message-toolbar{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin:12px 0 14px;
        padding:10px 12px;
        border-radius:18px;
        background:rgba(91,46,234,.07);
        border:1px solid rgba(91,46,234,.12);
      }
      .message-toolbar small{
        color:#6b7280;
        font-weight:800;
        white-space:nowrap;
      }



      .conversation-section h2{
        font-size:16px;
        color:#111827;
        margin:14px 0 10px;
      }
      .stable-conversation-card{
        display:flex !important;
        align-items:center !important;
        gap:12px !important;
        border:1px solid rgba(91,46,234,.14) !important;
        border-radius:24px !important;
        background:#fff !important;
        box-shadow:0 14px 34px rgba(17,24,39,.08) !important;
        padding:14px !important;
        min-height:86px !important;
      }
      .stable-conversation-card.has-unread{
        background:linear-gradient(135deg,#ffffff,#f0fdf4) !important;
        border-color:rgba(16,185,129,.26) !important;
      }
      .stable-conversation-card .conversation-avatar{
        width:46px !important;
        height:46px !important;
        min-width:46px !important;
        border-radius:999px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        background:rgba(91,46,234,.10) !important;
        font-size:22px !important;
      }
      .stable-conversation-card .conversation-main{
        flex:1 !important;
        min-width:0 !important;
      }
      .stable-conversation-card .conversation-line{
        display:flex !important;
        justify-content:space-between !important;
        align-items:center !important;
        gap:8px !important;
      }
      .stable-conversation-card strong{
        color:#111827 !important;
        font-size:15px !important;
      }
      .stable-conversation-card em{
        display:block !important;
        color:#6b7280 !important;
        font-style:normal !important;
        font-size:12px !important;
        font-weight:800 !important;
        margin:3px 0 4px !important;
        white-space:nowrap !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
      }
      .stable-conversation-card p{
        color:#111827 !important;
        margin:0 !important;
        font-size:14px !important;
        line-height:1.25 !important;
        white-space:nowrap !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
      }
      .conversation-mini{
        display:block;
        color:#6b7280;
        font-size:11px;
        font-weight:800;
        margin-top:5px;
      }
      .conversation-chevron{
        font-size:32px;
        color:#9ca3af;
        font-weight:900;
      }
      .message-backup-details{
        margin-top:18px;
        border-top:1px solid rgba(17,24,39,.08);
        padding-top:12px;
      }
      .message-backup-details summary{
        cursor:pointer;
        font-weight:900;
        color:#5b2eea;
        padding:8px 0;
      }

      /* v6.4.48: estabilidad horizontal en Mensajes y Chat */
      html,
      body,
      #app,
      .app-shell,
      main,
      .screen,
      .panel,
      .messages-panel,
      .chat-panel{
        max-width:100vw !important;
        overflow-x:hidden !important;
        box-sizing:border-box !important;
      }

      body{
        position:relative;
        width:100%;
      }

      .messages-panel,
      .chat-panel{
        padding-left:14px !important;
        padding-right:14px !important;
      }

      .message-toolbar,
      .message-debug-mini,
      .conversation-section,
      .conversation-list,
      .visible-message-list,
      .message-backup-details,
      .chat-topbar,
      .chat-feed,
      .chat-box{
        width:100% !important;
        max-width:100% !important;
        min-width:0 !important;
        box-sizing:border-box !important;
        overflow-x:hidden !important;
      }

      .stable-conversation-card,
      .conversation-card,
      .message-visible-card{
        width:100% !important;
        max-width:100% !important;
        min-width:0 !important;
        box-sizing:border-box !important;
        overflow:hidden !important;
        touch-action:pan-y !important;
      }

      .stable-conversation-card .conversation-main,
      .conversation-main{
        min-width:0 !important;
        max-width:100% !important;
        overflow:hidden !important;
      }

      .stable-conversation-card .conversation-line,
      .conversation-line{
        min-width:0 !important;
        max-width:100% !important;
      }

      .stable-conversation-card strong,
      .stable-conversation-card em,
      .stable-conversation-card p,
      .conversation-main strong,
      .conversation-main em,
      .conversation-main p,
      .message-visible-card strong,
      .message-visible-card em,
      .message-visible-card p,
      .conversation-mini{
        max-width:100% !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
        word-break:break-word !important;
        overflow-wrap:anywhere !important;
      }

      .stable-conversation-card p,
      .conversation-main p{
        white-space:nowrap !important;
      }

      .message-visible-card p{
        white-space:pre-line !important;
      }

      .conversation-count,
      .conversation-chevron,
      .conversation-dot{
        flex:0 0 auto !important;
      }

      .chat-topbar{
        display:grid !important;
        grid-template-columns:auto minmax(0,1fr) auto !important;
        align-items:center !important;
        gap:8px !important;
      }

      .chat-topbar h1,
      .chat-topbar small{
        max-width:100% !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
        white-space:nowrap !important;
      }

      .chat-refresh-btn{
        white-space:nowrap !important;
        flex:0 0 auto !important;
      }

      .chat-box{
        display:grid !important;
        grid-template-columns:minmax(0,1fr) auto !important;
        gap:8px !important;
        align-items:end !important;
      }

      .chat-box textarea{
        min-width:0 !important;
        max-width:100% !important;
        box-sizing:border-box !important;
        resize:none !important;
      }

      .bubble-row,
      .bubble{
        max-width:100% !important;
        box-sizing:border-box !important;
      }

      .bubble p{
        overflow-wrap:anywhere !important;
        word-break:break-word !important;
      }




      /* v6.4.48: encuadre táctil libre sin controles inferiores */
      .media-frame-editor .frame-mode-row,
      .media-frame-editor .frame-actions-grid{
        display:none !important;
      }

      .media-frame-helper{
        margin:10px 0 16px;
        padding:12px 13px;
        border-radius:20px;
        background:rgba(91,46,234,.07);
        border:1px solid rgba(91,46,234,.12);
      }

      .media-frame-helper div{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:10px;
      }

      .media-frame-helper strong{
        color:#111827;
        font-size:15px;
      }

      .media-frame-helper span{
        color:#5b2eea;
        font-size:12px;
        font-weight:900;
        text-align:right;
      }

      .media-frame-helper p{
        margin:8px 0 0;
        color:#6b7280;
        line-height:1.35;
        font-size:12px;
        font-weight:700;
      }

      .framed-media,
      .frame-preview-media{
        will-change:transform;
      }


      /* v6.4.48: encuadre táctil tipo redes sociales */
      
      /* v6.4.48: editor de encuadre compacto, acorde a la publicación */
      .composer{
        padding-bottom:120px !important;
      }




      /* v6.4.48: encuadre directo táctil fino */

      /* v6.4.48: edición directa desde la publicación */

      /* v6.4.48: zona/cobertura libre visible */

      /* v6.4.48: carrusel más suave y encuadre por foto */
      .gallery-stage{
        touch-action:pan-y !important;
      }

      .gallery-stage.is-swiping-gallery{
        touch-action:none !important;
      }

      .media-carousel{
        overflow-x:hidden !important;
      }

      .frame-direct-btn{
        min-width:92px !important;
      }

      .service-area-row{
        display:inline-flex;
        align-items:center;
        gap:5px;
        width:auto;
        max-width:100%;
        margin:8px 0 7px;
        padding:7px 11px;
        border-radius:999px;
        background:rgba(91,46,234,.10);
        color:#4c1d95;
        border:1px solid rgba(91,46,234,.14);
        font-size:12px;
        font-weight:900;
        line-height:1.2;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .service-area-row strong{
        min-width:0;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }

      .direct-zone-help{
        display:block;
        margin-top:6px;
        color:#6b7280;
        font-size:11px;
        font-weight:800;
        line-height:1.25;
      }

      .direct-edit-panel input[data-direct-edit-zone]{
        border-color:rgba(91,46,234,.26);
      }


      /* v6.4.48: multimedia directa básica e instrucciones visibles */

      /* v6.4.48: puntitos centrados arriba del usuario */

      /* v6.4.48: carrusel táctil y edición limpia */

      /* v6.4.48: carrusel Android, categoría completa y puntitos pequeños */

      /* v6.4.48: zona legible, encuadre simple y carrusel por swipe */
      .service-area-row{
        background:rgba(0,0,0,.56) !important;
        color:#fff !important;
        border:1px solid rgba(255,255,255,.24) !important;
        text-shadow:0 2px 8px rgba(0,0,0,.70) !important;
        box-shadow:0 8px 22px rgba(0,0,0,.18) !important;
      }

      .service-area-row strong{
        color:#fff !important;
      }

      .media-top{
        left:18px !important;
        right:auto !important;
        width:auto !important;
        max-width:220px !important;
        min-width:74px !important;
        overflow:visible !important;
        justify-content:flex-start !important;
      }

      .media-top .chip{
        display:inline-flex !important;
        width:auto !important;
        max-width:none !important;
        min-width:74px !important;
        white-space:nowrap !important;
        overflow:visible !important;
        text-overflow:clip !important;
        justify-content:center !important;
        color:#fff !important;
      }

      .direct-frame-hint{
        font-size:12px !important;
      }

      .gallery-stage,
      .gallery-stage .media-carousel,
      .media-carousel{
        pointer-events:auto !important;
        touch-action:pan-y !important;
        overscroll-behavior-x:contain !important;
        -webkit-overflow-scrolling:touch !important;
      }

      .gallery-stage{
        cursor:grab;
      }

      .gallery-stage.is-swiping-gallery{
        cursor:grabbing;
      }

      .media-carousel{
        overflow-x:hidden !important;
        overflow-y:hidden !important;
        scroll-behavior:smooth !important;
      }

      .media-carousel img{
        pointer-events:none !important;
        user-select:none !important;
        -webkit-user-drag:none !important;
      }

      .post-body .gallery-dots,
      .post-body-gallery-dots{
        position:absolute !important;
        top:10px !important;
        right:72px !important;
        left:auto !important;
        bottom:auto !important;
        margin:0 !important;
        padding:3px 5px !important;
        gap:2px !important;
        max-width:58px !important;
        background:rgba(0,0,0,.30) !important;
        border:1px solid rgba(255,255,255,.18) !important;
        transform:none !important;
      }

      .post-body .gallery-dot{
        width:13px !important;
        height:13px !important;
        min-width:13px !important;
        padding:0 !important;
        background:transparent !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
      }

      .post-body .gallery-dot span{
        width:3.5px !important;
        height:3.5px !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.55) !important;
      }

      .post-body .gallery-dot.active{
        width:13px !important;
        background:transparent !important;
      }

      .post-body .gallery-dot.active span{
        width:10px !important;
        background:#fff !important;
      }


      /* v6.4.48 final override dentro del CSS */
      .service-area-row{
        background:rgba(0,0,0,.56)!important;
        color:#fff!important;
        border-color:rgba(255,255,255,.24)!important;
        text-shadow:0 2px 8px rgba(0,0,0,.7)!important;
      }
      .service-area-row strong{color:#fff!important;}
      .media-top .chip{
        min-width:74px!important;
        max-width:none!important;
        overflow:visible!important;
        text-overflow:clip!important;
        white-space:nowrap!important;
      }
      .post-body .gallery-dots,
      .post-body-gallery-dots{
        position:absolute!important;
        top:10px!important;
        right:72px!important;
        left:auto!important;
        bottom:auto!important;
        margin:0!important;
        padding:3px 5px!important;
        gap:2px!important;
        max-width:58px!important;
        background:rgba(0,0,0,.30)!important;
        transform:none!important;
      }
      .post-body .gallery-dot{
        width:13px!important;
        height:13px!important;
        min-width:13px!important;
        background:transparent!important;
      }
      .post-body .gallery-dot span{
        width:3.5px!important;
        height:3.5px!important;
        border-radius:999px!important;
        background:rgba(255,255,255,.55)!important;
        display:block!important;
      }
      .post-body .gallery-dot.active{
        width:13px!important;
        background:transparent!important;
      }
      .post-body .gallery-dot.active span{
        width:10px!important;
        background:#fff!important;
      }

      @media (max-width:420px){
        .post-body .gallery-dots,
        .post-body-gallery-dots{
          right:64px !important;
          top:9px !important;
          transform:scale(.88) !important;
          transform-origin:right top !important;
        }
      }

      .media-top{
        left:18px !important;
        right:auto !important;
        width:auto !important;
        max-width:none !important;
        overflow:visible !important;
      }

      .media-top .chip{
        width:auto !important;
        max-width:none !important;
        min-width:max-content !important;
        white-space:nowrap !important;
        overflow:visible !important;
        text-overflow:clip !important;
        font-size:13px !important;
        letter-spacing:.2px !important;
        padding:8px 12px !important;
      }

      .gallery-stage,
      .gallery-stage .media-carousel,
      .media-carousel{
        pointer-events:auto !important;
        touch-action:pan-x !important;
        overscroll-behavior-x:contain !important;
        -webkit-overflow-scrolling:touch !important;
      }

      .gallery-stage .media-carousel,
      .media-carousel{
        overflow-x:scroll !important;
        overflow-y:hidden !important;
        scroll-snap-type:x mandatory !important;
        scroll-behavior:smooth !important;
        cursor:grab;
      }

      .media-carousel.is-dragging-gallery{
        cursor:grabbing;
        scroll-snap-type:none !important;
      }

      .media-carousel img{
        flex:0 0 100% !important;
        min-width:100% !important;
        max-width:100% !important;
        pointer-events:none !important;
        user-select:none !important;
        -webkit-user-drag:none !important;
        scroll-snap-align:center !important;
      }

      .post-body{
        position:relative !important;
      }

      .post-body .gallery-dots,
      .post-body-gallery-dots{
        position:absolute !important;
        top:15px !important;
        right:58px !important;
        left:auto !important;
        bottom:auto !important;
        transform:none !important;
        margin:0 !important;
        z-index:130 !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:3px !important;
        padding:4px 6px !important;
        border-radius:999px !important;
        background:rgba(0,0,0,.28) !important;
        border:1px solid rgba(255,255,255,.20) !important;
        backdrop-filter:blur(8px) !important;
        box-shadow:0 6px 18px rgba(0,0,0,.18) !important;
        width:auto !important;
        max-width:72px !important;
      }

      .post-body .gallery-dot{
        width:15px !important;
        height:15px !important;
        min-width:15px !important;
        padding:0 !important;
        border:0 !important;
        border-radius:999px !important;
        background:transparent !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
      }

      .post-body .gallery-dot span{
        width:4px !important;
        height:4px !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.58) !important;
        display:block !important;
        transition:all .18s ease !important;
      }

      .post-body .gallery-dot.active span{
        width:13px !important;
        background:#fff !important;
      }

      @media (max-width:420px){
        .post-body .gallery-dots,
        .post-body-gallery-dots{
          top:14px !important;
          right:48px !important;
          transform:scale(.92) !important;
          transform-origin:right top !important;
        }
      }

      .gallery-stage,
      .gallery-stage .media-carousel,
      .media-carousel{
        pointer-events:auto !important;
      }

      .gallery-stage .media-carousel,
      .media-carousel{
        touch-action:pan-y !important;
        overscroll-behavior-x:contain !important;
        cursor:grab;
        -webkit-overflow-scrolling:touch !important;
        scroll-behavior:smooth;
      }

      .media-carousel.is-dragging-gallery{
        cursor:grabbing;
        scroll-snap-type:none !important;
      }

      .media-carousel img{
        pointer-events:none !important;
        user-select:none !important;
        -webkit-user-drag:none !important;
      }

      .post-body .gallery-dots,
      .post-body-gallery-dots{
        margin:0 42px 10px auto !important;
        justify-content:center !important;
        background:rgba(0,0,0,.38) !important;
        border:1px solid rgba(255,255,255,.28) !important;
      }

      .direct-edit-head.compact{
        margin-bottom:8px !important;
      }

      .direct-edit-head.compact strong{
        color:#fff !important;
        text-shadow:0 2px 10px rgba(0,0,0,.65);
      }

      .direct-edit-panel label{
        color:#fff !important;
        display:inline-block !important;
        background:rgba(0,0,0,.42);
        border:1px solid rgba(255,255,255,.18);
        border-radius:999px;
        padding:5px 10px;
        margin:10px 0 6px !important;
        text-shadow:0 2px 8px rgba(0,0,0,.65);
        font-size:13px !important;
      }

      .direct-edit-panel > p,
      .direct-zone-help,
      .direct-edit-head small{
        display:none !important;
      }

      .direct-edit-panel input,
      .direct-edit-panel textarea,
      .direct-edit-panel select{
        background:rgba(255,255,255,.96) !important;
        color:#111827 !important;
        border:2px solid rgba(255,255,255,.72) !important;
      }

      @media (max-width:420px){
        .post-body .gallery-dots,
        .post-body-gallery-dots{
          margin-right:28px !important;
        }
      }

      .post-body .gallery-dots,
      .post-body-gallery-dots{
        position:relative !important;
        left:auto !important;
        right:auto !important;
        bottom:auto !important;
        top:auto !important;
        transform:none !important;
        z-index:99 !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        width:max-content !important;
        max-width:calc(100% - 24px) !important;
        margin:0 auto 9px auto !important;
        gap:7px !important;
        padding:7px 11px !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.22) !important;
        border:1px solid rgba(255,255,255,.25) !important;
        backdrop-filter:blur(8px) !important;
        box-shadow:0 8px 22px rgba(0,0,0,.16);
      }

      .post-body .gallery-dot{
        width:8px !important;
        height:8px !important;
        min-width:8px !important;
        border-radius:999px !important;
        border:0 !important;
        background:rgba(255,255,255,.52) !important;
        padding:0 !important;
        transition:all .18s ease !important;
      }

      .post-body .gallery-dot.active{
        width:15px !important;
        background:transparent !important;
      }
      .post-body .gallery-dot span{
        width:4px !important;
        height:4px !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.58) !important;
        display:block !important;
      }
      .post-body .gallery-dot.active span{
        width:13px !important;
        background:#fff !important;
      }

      .post-body .gallery-dots,
      .post-body-gallery-dots{
        position:absolute !important;
        top:15px !important;
        right:58px !important;
        left:auto !important;
        bottom:auto !important;
        margin:0 !important;
        gap:3px !important;
        padding:4px 6px !important;
        background:rgba(0,0,0,.28) !important;
        transform:none !important;
      }

      .direct-media-panel > p{
        display:none !important;
      }

      .direct-media-head small,
      .direct-edit-head small{
        text-align:left !important;
      }

      .direct-media-btn{
        background:#0f766e !important;
        color:#fff !important;
        border:0 !important;
        font-weight:900 !important;
      }

      .direct-media-panel{
        display:block;
        width:100%;
        box-sizing:border-box;
        margin:12px 0 14px;
        padding:14px;
        border-radius:24px;
        background:linear-gradient(135deg,rgba(15,118,110,.10),rgba(91,46,234,.08));
        border:1px solid rgba(15,118,110,.18);
        box-shadow:0 12px 28px rgba(17,24,39,.08);
      }

      .direct-media-head{
        display:flex;
        justify-content:space-between;
        gap:10px;
        align-items:flex-start;
        margin-bottom:12px;
      }

      .direct-media-head strong{
        color:#111827;
        font-size:16px;
      }

      .direct-media-head small,
      .direct-edit-head small{
        color:#374151 !important;
        font-size:12px !important;
        font-weight:900 !important;
        line-height:1.25 !important;
        background:rgba(255,255,255,.72);
        padding:6px 9px;
        border-radius:12px;
        text-align:right;
      }

      .direct-media-list{
        display:grid;
        grid-template-columns:repeat(3, minmax(0,1fr));
        gap:9px;
        margin:10px 0 12px;
      }

      .direct-media-thumb{
        min-width:0;
        border-radius:16px;
        background:#fff;
        border:1px solid rgba(17,24,39,.10);
        padding:7px;
        text-align:center;
      }

      .direct-media-thumb img{
        width:100%;
        aspect-ratio:1/1;
        object-fit:cover;
        border-radius:12px;
        display:block;
      }

      .direct-media-video,
      .direct-media-thumb > span{
        width:100%;
        aspect-ratio:1/1;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:12px;
        background:#111827;
        color:#fff;
        font-size:28px;
      }

      .direct-media-thumb small{
        display:block;
        margin:5px 0;
        color:#374151;
        font-size:11px;
        font-weight:900;
      }

      .direct-media-thumb button{
        border:0;
        border-radius:999px;
        padding:6px 8px;
        background:#fee2e2;
        color:#991b1b;
        font-size:11px;
        font-weight:900;
      }

      .direct-media-empty{
        border-radius:16px;
        background:#fff;
        border:1px dashed rgba(17,24,39,.16);
        padding:12px;
        color:#6b7280;
        font-weight:800;
      }

      .direct-media-actions{
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        justify-content:flex-end;
        margin-top:12px;
      }

      .direct-media-actions button{
        border:0;
        border-radius:999px;
        padding:11px 14px;
        font-weight:900;
        background:#fff;
        color:#111827;
        border:1px solid rgba(17,24,39,.12);
      }

      .direct-media-actions .direct-media-main{
        background:#0f766e;
        color:#fff;
        border-color:#0f766e;
      }

      .direct-media-panel p,
      .direct-edit-panel p,
      .media-frame-helper p{
        color:#374151 !important;
        font-size:13px !important;
        font-weight:900 !important;
        line-height:1.35 !important;
        background:rgba(255,255,255,.70);
        border-radius:14px;
        padding:8px 10px;
      }

      input[data-direct-edit-zone],
      #zone{
        appearance:textfield !important;
        -webkit-appearance:none !important;
      }

      @media (max-width:420px){
        .direct-media-list{
          grid-template-columns:repeat(2, minmax(0,1fr));
        }
        .direct-media-actions button{
          flex:1 1 auto;
        }
      }

      .direct-edit-btn{
        background:#111827 !important;
        color:#fff !important;
        border:0 !important;
        font-weight:900 !important;
      }

      .direct-edit-active .post-body > h2,
      .direct-edit-active .post-description-short,
      .direct-edit-active .post-description-collapsed,
      .direct-edit-active .post-description-expanded,
      .direct-edit-active .post-meta,
      .direct-edit-active .post-action-row,
      .direct-edit-active .status-chip{
        display:none !important;
      }

      .direct-edit-panel{
        display:block;
        width:100%;
        box-sizing:border-box;
        margin:12px 0 14px;
        padding:14px;
        border-radius:24px;
        background:linear-gradient(135deg,rgba(91,46,234,.08),rgba(20,184,166,.08));
        border:1px solid rgba(91,46,234,.16);
        box-shadow:0 12px 28px rgba(17,24,39,.08);
      }

      .direct-edit-head{
        display:flex;
        justify-content:space-between;
        gap:10px;
        align-items:flex-start;
        margin-bottom:12px;
      }

      .direct-edit-head strong{
        color:#111827;
        font-size:16px;
      }

      .direct-edit-head small{
        color:#6b7280;
        font-size:11px;
        font-weight:800;
        text-align:right;
      }

      .direct-edit-panel label{
        display:block;
        margin:10px 0 5px;
        color:#374151;
        font-size:12px;
        font-weight:900;
      }

      .direct-edit-panel input,
      .direct-edit-panel textarea,
      .direct-edit-panel select{
        width:100%;
        box-sizing:border-box;
        border:1px solid rgba(17,24,39,.12);
        border-radius:16px;
        background:#fff;
        color:#111827;
        padding:11px 12px;
        font-size:15px;
        font-weight:700;
        outline:none;
      }

      .direct-edit-panel textarea{
        min-height:118px;
        resize:vertical;
        line-height:1.35;
      }

      .direct-edit-grid{
        display:grid;
        grid-template-columns:1fr 132px;
        gap:10px;
      }

      .direct-edit-actions{
        display:flex;
        gap:10px;
        justify-content:flex-end;
        margin-top:12px;
      }

      .direct-edit-actions button{
        border:0;
        border-radius:999px;
        padding:11px 14px;
        font-weight:900;
      }

      .direct-save-btn{
        background:#5b2eea;
        color:#fff;
      }

      .direct-cancel-btn{
        background:#fff;
        color:#111827;
        border:1px solid rgba(17,24,39,.12) !important;
      }

      .direct-edit-panel p{
        margin:10px 0 0;
        color:#6b7280;
        font-size:12px;
        font-weight:700;
      }

      @media (max-width:420px){
        .direct-edit-grid{
          grid-template-columns:1fr;
        }
        .direct-edit-actions{
          justify-content:stretch;
        }
        .direct-edit-actions button{
          flex:1;
        }
      }

      .direct-frame-area-active .framed-media,
      .direct-frame-area-active video,
      .direct-frame-area-active img{
        pointer-events:none !important;
        will-change:transform !important;
      }

      .direct-frame-area-active.direct-frame-touching::before{
        border-color:#ffffff !important;
        box-shadow:inset 0 0 0 1px rgba(0,0,0,.42), 0 0 0 4px rgba(91,46,234,.24) !important;
      }

      .direct-frame-controls{
        bottom:calc(18px + env(safe-area-inset-bottom)) !important;
      }

      .direct-frame-hint{
        top:calc(env(safe-area-inset-top) + 68px) !important;
        max-width:calc(100% - 30px);
        text-align:center;
        white-space:normal !important;
        line-height:1.15;
      }

      .direct-frame-active .media-carousel{
        pointer-events:none !important;
      }

      /* v6.4.48: encuadre directo desde la publicación */
      .frame-direct-btn{
        background:linear-gradient(135deg,#5b2eea,#14b8a6) !important;
        color:#fff !important;
        border:0 !important;
        font-weight:900 !important;
      }

      .post-card.direct-frame-active{
        outline:3px solid rgba(91,46,234,.45);
        outline-offset:2px;
      }

      .direct-frame-area-active{
        touch-action:none !important;
        cursor:grab;
        overflow:hidden !important;
        position:relative !important;
      }

      .direct-frame-area-active:active{
        cursor:grabbing;
      }

      .direct-frame-area-active::before{
        content:"";
        position:absolute;
        inset:0;
        z-index:19;
        pointer-events:none;
        border:2px solid rgba(255,255,255,.86);
        box-shadow:inset 0 0 0 1px rgba(0,0,0,.32);
      }

      .direct-frame-grid{
        position:absolute;
        inset:0;
        z-index:20;
        pointer-events:none;
        background:
          linear-gradient(to right, transparent 33.2%, rgba(255,255,255,.42) 33.33%, transparent 33.55%, transparent 66.2%, rgba(255,255,255,.42) 66.33%, transparent 66.55%),
          linear-gradient(to bottom, transparent 33.2%, rgba(255,255,255,.42) 33.33%, transparent 33.55%, transparent 66.2%, rgba(255,255,255,.42) 66.33%, transparent 66.55%);
      }

      .direct-frame-hint{
        position:absolute;
        left:50%;
        top:72px;
        transform:translateX(-50%);
        z-index:22;
        pointer-events:none;
        padding:8px 12px;
        border-radius:999px;
        background:rgba(0,0,0,.62);
        color:#fff;
        font-size:12px;
        font-weight:900;
        white-space:nowrap;
      }

      .direct-frame-controls{
        position:absolute;
        left:14px;
        right:14px;
        bottom:18px;
        z-index:23;
        display:flex;
        gap:10px;
        justify-content:center;
        pointer-events:auto;
      }

      .direct-frame-controls button{
        border:0;
        border-radius:999px;
        padding:11px 15px;
        font-weight:900;
        background:rgba(255,255,255,.94);
        color:#111827;
        box-shadow:0 10px 24px rgba(0,0,0,.20);
      }

      .direct-frame-controls button:first-child{
        background:#5b2eea;
        color:#fff;
      }

      .direct-frame-active .sound-toggle,
      .direct-frame-active .sound-toggle-card{
        display:none !important;
      }

      /* v6.4.48: recuperación de scroll global */
      html,
      body{
        overflow-x:hidden !important;
        overflow-y:auto !important;
        height:auto !important;
        min-height:100% !important;
        position:relative !important;
        touch-action:pan-y !important;
        overscroll-behavior-y:auto !important;
        -webkit-overflow-scrolling:touch !important;
      }

      #app,
      .app-shell,
      main,
      .screen{
        overflow-y:visible !important;
        height:auto !important;
        min-height:100dvh !important;
        max-height:none !important;
        touch-action:pan-y !important;
        overscroll-behavior-y:auto !important;
        -webkit-overflow-scrolling:touch !important;
      }

      .panel,
      .composer,
      .messages-panel,
      .chat-panel,
      .profile-panel,
      .store-panel,
      .following-panel,
      .owner-directory{
        overflow-y:visible !important;
        height:auto !important;
        max-height:none !important;
        touch-action:pan-y !important;
        overscroll-behavior-y:auto !important;
        -webkit-overflow-scrolling:touch !important;
      }

      .frame-touch-editor{
        touch-action:none !important;
        overscroll-behavior:contain !important;
      }

      .frame-touch-editor{
        width:min(100%, 390px) !important;
        height:auto !important;
        min-height:0 !important;
        max-height:58vh !important;
        aspect-ratio:4 / 5 !important;
        margin:10px auto 12px !important;
        border-radius:24px !important;
      }

      .frame-touch-editor::before{
        border-radius:22px !important;
        border-width:2px !important;
      }

      .frame-safe-grid{
        inset:0 !important;
        border-radius:22px !important;
        opacity:.48 !important;
        background:
          linear-gradient(to right, transparent 33.2%, rgba(255,255,255,.38) 33.33%, transparent 33.55%, transparent 66.2%, rgba(255,255,255,.38) 66.33%, transparent 66.55%),
          linear-gradient(to bottom, transparent 33.2%, rgba(255,255,255,.38) 33.33%, transparent 33.55%, transparent 66.2%, rgba(255,255,255,.38) 66.33%, transparent 66.55%) !important;
      }

      .frame-touch-hint{
        font-size:11px !important;
        padding:7px 10px !important;
        bottom:10px !important;
        opacity:.92 !important;
      }

      .media-frame-helper{
        width:min(100%, 390px) !important;
        margin:8px auto 14px !important;
      }

      .media-frame-helper p{
        font-size:11px !important;
      }

      .frame-touch-editor .frame-preview-gallery,
      .frame-touch-editor .frame-preview-media,
      .frame-touch-editor img,
      .frame-touch-editor video{
        height:100% !important;
        max-height:100% !important;
      }

      @media (max-width:420px){
        .frame-touch-editor{
          width:calc(100vw - 42px) !important;
          aspect-ratio:4 / 5 !important;
          height:auto !important;
          min-height:0 !important;
          margin-left:auto !important;
          margin-right:auto !important;
        }
        .media-frame-helper{
          width:calc(100vw - 42px) !important;
        }
        .frame-touch-hint{
          max-width:calc(100% - 22px) !important;
        }
      }

.frame-touch-editor{
        position:relative !important;
        min-height:min(72vh, 620px) !important;
        height:min(72vh, 620px) !important;
        border-radius:28px !important;
        overflow:hidden !important;
        background:#050507 !important;
        touch-action:none !important;
        user-select:none !important;
        -webkit-user-select:none !important;
        cursor:grab;
      }

      .frame-touch-editor:active{
        cursor:grabbing;
      }

      .frame-touch-editor::before{
        content:"";
        position:absolute;
        inset:0;
        z-index:4;
        pointer-events:none;
        border:2px solid rgba(255,255,255,.82);
        border-radius:24px;
        box-shadow:inset 0 0 0 1px rgba(0,0,0,.28);
      }

      .frame-safe-grid{
        position:absolute;
        inset:0;
        z-index:5;
        pointer-events:none;
        background:
          linear-gradient(to right, transparent 33.1%, rgba(255,255,255,.45) 33.3%, transparent 33.6%, transparent 66.1%, rgba(255,255,255,.45) 66.3%, transparent 66.6%),
          linear-gradient(to bottom, transparent 33.1%, rgba(255,255,255,.45) 33.3%, transparent 33.6%, transparent 66.1%, rgba(255,255,255,.45) 66.3%, transparent 66.6%);
        opacity:.72;
      }

      .frame-touch-hint{
        position:absolute;
        left:50%;
        bottom:14px;
        transform:translateX(-50%);
        z-index:6;
        pointer-events:none;
        padding:8px 12px;
        border-radius:999px;
        background:rgba(0,0,0,.62);
        color:#fff;
        font-size:12px;
        font-weight:900;
        text-align:center;
        white-space:nowrap;
      }

      .frame-touch-editor .frame-preview-gallery,
      .frame-touch-editor .frame-preview-media,
      .frame-touch-editor img,
      .frame-touch-editor video{
        width:100% !important;
        height:100% !important;
        max-height:none !important;
      }

      .frame-touch-editor .frame-preview-gallery{
        min-height:100% !important;
        height:100% !important;
      }

      .frame-touch-editor .frame-preview-gallery img{
        min-width:100% !important;
        height:100% !important;
      }

      @media (max-width:420px){
        .frame-touch-editor{
          min-height:64vh !important;
          height:64vh !important;
          border-radius:24px !important;
        }
        .frame-touch-hint{
          bottom:10px;
          font-size:11px;
          max-width:calc(100% - 34px);
          white-space:normal;
          line-height:1.15;
        }
      }

      /* v6.4.48: encuadre editable de multimedia */
      .framed-media,
      .frame-preview-media{
        object-fit:var(--media-fit, contain) !important;
        object-position:center center !important;
        transform:translate3d(var(--media-tx, 0%), var(--media-ty, 0%), 0) scale(var(--media-scale, 1)) !important;
        transform-origin:center center !important;
        transition:object-position .18s ease, transform .18s ease;
      }

      .frame-preview-box{
        overflow:hidden !important;
        background:#050507 !important;
      }

      .frame-preview-box img,
      .frame-preview-box video{
        width:100% !important;
        height:280px !important;
        max-height:280px !important;
        display:block !important;
        background:#050507 !important;
      }

      .frame-preview-gallery{
        height:280px !important;
        overflow-x:auto !important;
        overflow-y:hidden !important;
        display:flex !important;
        scroll-snap-type:x mandatory;
        background:#050507;
      }

      .frame-preview-gallery img{
        min-width:100% !important;
        scroll-snap-align:center;
      }

      .media-frame-editor{
        margin:12px 0 16px;
        padding:13px;
        border-radius:22px;
        background:linear-gradient(135deg,rgba(91,46,234,.08),rgba(20,184,166,.08));
        border:1px solid rgba(91,46,234,.13);
      }

      .frame-editor-head{
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:10px;
        margin-bottom:10px;
      }

      .frame-editor-head strong{
        color:#111827;
        font-size:15px;
      }

      .frame-editor-head span{
        color:#6b7280;
        font-size:12px;
        font-weight:900;
        text-align:right;
      }

      .frame-mode-row{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
        margin-bottom:10px;
      }

      .frame-mode-row button,
      .frame-actions-grid button{
        border:1px solid rgba(91,46,234,.18);
        background:#fff;
        color:#111827;
        border-radius:16px;
        padding:11px 10px;
        font-weight:900;
        min-height:42px;
      }

      .frame-mode-row button.active{
        background:#5b2eea;
        color:#fff;
        border-color:#5b2eea;
      }

      .frame-actions-grid{
        display:grid;
        grid-template-columns:1fr 1fr 1fr;
        gap:8px;
      }

      .media-frame-editor p{
        margin:10px 0 0;
        color:#6b7280;
        font-size:12px;
        line-height:1.3;
      }

      @media (max-width:420px){
        .messages-panel,
        .chat-panel{
          padding-left:12px !important;
          padding-right:12px !important;
        }
        .message-toolbar{
          display:grid !important;
          grid-template-columns:1fr !important;
          gap:6px !important;
          align-items:start !important;
        }
        .message-toolbar small{
          white-space:normal !important;
        }
        .stable-conversation-card{
          gap:9px !important;
          padding:12px !important;
        }
        .stable-conversation-card .conversation-avatar{
          width:42px !important;
          height:42px !important;
          min-width:42px !important;
        }
      }

      .chat-refresh-btn{
        border:1px solid rgba(91,46,234,.16);
        background:#fff;
        color:#5b2eea;
        border-radius:999px;
        padding:8px 10px;
        font-size:12px;
        font-weight:900;
        margin-left:auto;
      }

      .visible-message-list{
        display:flex !important;
        flex-direction:column !important;
        gap:12px !important;
        margin-top:12px !important;
        padding-bottom:120px !important;
      }
      .message-visible-card{
        display:block !important;
        width:100% !important;
        text-align:left !important;
        border:1px solid rgba(91,46,234,.16) !important;
        border-radius:22px !important;
        background:#fff !important;
        color:#111827 !important;
        padding:14px !important;
        box-shadow:0 14px 34px rgba(17,24,39,.08) !important;
      }
      .message-visible-card.incoming{
        border-color:rgba(16,185,129,.24) !important;
        background:linear-gradient(135deg,#ffffff,#f0fdf4) !important;
      }
      .message-visible-card.outgoing{
        opacity:.82;
      }
      .message-visible-head{
        display:flex !important;
        justify-content:space-between !important;
        align-items:center !important;
        gap:8px !important;
        margin-bottom:8px !important;
      }
      .message-visible-badge{
        display:inline-flex !important;
        align-items:center !important;
        border-radius:999px !important;
        padding:5px 9px !important;
        background:rgba(91,46,234,.08) !important;
        color:#4c1d95 !important;
        font-size:12px !important;
        font-weight:900 !important;
      }
      .message-visible-card strong{
        display:block !important;
        font-size:15px !important;
        color:#111827 !important;
        margin-bottom:3px !important;
      }
      .message-visible-card em{
        display:block !important;
        font-style:normal !important;
        color:#6b7280 !important;
        font-size:12px !important;
        font-weight:800 !important;
        margin-bottom:8px !important;
      }
      .message-visible-card p{
        color:#111827 !important;
        font-size:16px !important;
        line-height:1.35 !important;
        margin:0 0 12px !important;
        white-space:pre-line !important;
      }
      .reply-visible-btn{
        border:0 !important;
        border-radius:999px !important;
        padding:10px 14px !important;
        background:#5b2eea !important;
        color:white !important;
        font-weight:900 !important;
      }

      .message-debug-mini{
        display:flex;
        justify-content:space-between;
        gap:8px;
        margin:-6px 0 12px;
        color:#6b7280;
      }
      .message-debug-mini small{
        font-size:11px;
      }

      .refresh-messages-btn{
        font-size:14px;
        font-weight:900;
        border-radius:999px;
        background:#fff;
        border:1px solid rgba(91,46,234,.16);
        padding:9px 12px;
      }


      /* v6.4.48: encuadre editable de multimedia */
      .framed-media,
      .frame-preview-media{
        object-fit:var(--media-fit, contain) !important;
        object-position:center center !important;
        transform:translate3d(var(--media-tx, 0%), var(--media-ty, 0%), 0) scale(var(--media-scale, 1)) !important;
        transform-origin:center center !important;
        transition:object-position .18s ease, transform .18s ease;
      }

      .frame-preview-box{
        overflow:hidden !important;
        background:#050507 !important;
      }

      .frame-preview-box img,
      .frame-preview-box video{
        width:100% !important;
        height:280px !important;
        max-height:280px !important;
        display:block !important;
        background:#050507 !important;
      }

      .frame-preview-gallery{
        height:280px !important;
        overflow-x:auto !important;
        overflow-y:hidden !important;
        display:flex !important;
        scroll-snap-type:x mandatory;
        background:#050507;
      }

      .frame-preview-gallery img{
        min-width:100% !important;
        scroll-snap-align:center;
      }

      .media-frame-editor{
        margin:12px 0 16px;
        padding:13px;
        border-radius:22px;
        background:linear-gradient(135deg,rgba(91,46,234,.08),rgba(20,184,166,.08));
        border:1px solid rgba(91,46,234,.13);
      }

      .frame-editor-head{
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:10px;
        margin-bottom:10px;
      }

      .frame-editor-head strong{
        color:#111827;
        font-size:15px;
      }

      .frame-editor-head span{
        color:#6b7280;
        font-size:12px;
        font-weight:900;
        text-align:right;
      }

      .frame-mode-row{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
        margin-bottom:10px;
      }

      .frame-mode-row button,
      .frame-actions-grid button{
        border:1px solid rgba(91,46,234,.18);
        background:#fff;
        color:#111827;
        border-radius:16px;
        padding:11px 10px;
        font-weight:900;
        min-height:42px;
      }

      .frame-mode-row button.active{
        background:#5b2eea;
        color:#fff;
        border-color:#5b2eea;
      }

      .frame-actions-grid{
        display:grid;
        grid-template-columns:1fr 1fr 1fr;
        gap:8px;
      }

      .media-frame-editor p{
        margin:10px 0 0;
        color:#6b7280;
        font-size:12px;
        line-height:1.3;
      }

      @media (max-width:420px){
        .trust-grid{
          grid-template-columns:1fr;
        }
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

      .message-toolbar{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin:12px 0 14px;
        padding:10px 12px;
        border-radius:18px;
        background:rgba(91,46,234,.07);
        border:1px solid rgba(91,46,234,.12);
      }
      .message-toolbar small{
        color:#6b7280;
        font-weight:800;
        white-space:nowrap;
      }



      .conversation-section h2{
        font-size:16px;
        color:#111827;
        margin:14px 0 10px;
      }
      .stable-conversation-card{
        display:flex !important;
        align-items:center !important;
        gap:12px !important;
        border:1px solid rgba(91,46,234,.14) !important;
        border-radius:24px !important;
        background:#fff !important;
        box-shadow:0 14px 34px rgba(17,24,39,.08) !important;
        padding:14px !important;
        min-height:86px !important;
      }
      .stable-conversation-card.has-unread{
        background:linear-gradient(135deg,#ffffff,#f0fdf4) !important;
        border-color:rgba(16,185,129,.26) !important;
      }
      .stable-conversation-card .conversation-avatar{
        width:46px !important;
        height:46px !important;
        min-width:46px !important;
        border-radius:999px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        background:rgba(91,46,234,.10) !important;
        font-size:22px !important;
      }
      .stable-conversation-card .conversation-main{
        flex:1 !important;
        min-width:0 !important;
      }
      .stable-conversation-card .conversation-line{
        display:flex !important;
        justify-content:space-between !important;
        align-items:center !important;
        gap:8px !important;
      }
      .stable-conversation-card strong{
        color:#111827 !important;
        font-size:15px !important;
      }
      .stable-conversation-card em{
        display:block !important;
        color:#6b7280 !important;
        font-style:normal !important;
        font-size:12px !important;
        font-weight:800 !important;
        margin:3px 0 4px !important;
        white-space:nowrap !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
      }
      .stable-conversation-card p{
        color:#111827 !important;
        margin:0 !important;
        font-size:14px !important;
        line-height:1.25 !important;
        white-space:nowrap !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
      }
      .conversation-mini{
        display:block;
        color:#6b7280;
        font-size:11px;
        font-weight:800;
        margin-top:5px;
      }
      .conversation-chevron{
        font-size:32px;
        color:#9ca3af;
        font-weight:900;
      }
      .message-backup-details{
        margin-top:18px;
        border-top:1px solid rgba(17,24,39,.08);
        padding-top:12px;
      }
      .message-backup-details summary{
        cursor:pointer;
        font-weight:900;
        color:#5b2eea;
        padding:8px 0;
      }

      /* v6.4.48: estabilidad horizontal en Mensajes y Chat */
      html,
      body,
      #app,
      .app-shell,
      main,
      .screen,
      .panel,
      .messages-panel,
      .chat-panel{
        max-width:100vw !important;
        overflow-x:hidden !important;
        box-sizing:border-box !important;
      }

      body{
        position:relative;
        width:100%;
      }

      .messages-panel,
      .chat-panel{
        padding-left:14px !important;
        padding-right:14px !important;
      }

      .message-toolbar,
      .message-debug-mini,
      .conversation-section,
      .conversation-list,
      .visible-message-list,
      .message-backup-details,
      .chat-topbar,
      .chat-feed,
      .chat-box{
        width:100% !important;
        max-width:100% !important;
        min-width:0 !important;
        box-sizing:border-box !important;
        overflow-x:hidden !important;
      }

      .stable-conversation-card,
      .conversation-card,
      .message-visible-card{
        width:100% !important;
        max-width:100% !important;
        min-width:0 !important;
        box-sizing:border-box !important;
        overflow:hidden !important;
        touch-action:pan-y !important;
      }

      .stable-conversation-card .conversation-main,
      .conversation-main{
        min-width:0 !important;
        max-width:100% !important;
        overflow:hidden !important;
      }

      .stable-conversation-card .conversation-line,
      .conversation-line{
        min-width:0 !important;
        max-width:100% !important;
      }

      .stable-conversation-card strong,
      .stable-conversation-card em,
      .stable-conversation-card p,
      .conversation-main strong,
      .conversation-main em,
      .conversation-main p,
      .message-visible-card strong,
      .message-visible-card em,
      .message-visible-card p,
      .conversation-mini{
        max-width:100% !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
        word-break:break-word !important;
        overflow-wrap:anywhere !important;
      }

      .stable-conversation-card p,
      .conversation-main p{
        white-space:nowrap !important;
      }

      .message-visible-card p{
        white-space:pre-line !important;
      }

      .conversation-count,
      .conversation-chevron,
      .conversation-dot{
        flex:0 0 auto !important;
      }

      .chat-topbar{
        display:grid !important;
        grid-template-columns:auto minmax(0,1fr) auto !important;
        align-items:center !important;
        gap:8px !important;
      }

      .chat-topbar h1,
      .chat-topbar small{
        max-width:100% !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
        white-space:nowrap !important;
      }

      .chat-refresh-btn{
        white-space:nowrap !important;
        flex:0 0 auto !important;
      }

      .chat-box{
        display:grid !important;
        grid-template-columns:minmax(0,1fr) auto !important;
        gap:8px !important;
        align-items:end !important;
      }

      .chat-box textarea{
        min-width:0 !important;
        max-width:100% !important;
        box-sizing:border-box !important;
        resize:none !important;
      }

      .bubble-row,
      .bubble{
        max-width:100% !important;
        box-sizing:border-box !important;
      }

      .bubble p{
        overflow-wrap:anywhere !important;
        word-break:break-word !important;
      }


      /* v6.4.48: encuadre editable de multimedia */
      .framed-media,
      .frame-preview-media{
        object-fit:var(--media-fit, contain) !important;
        object-position:center center !important;
        transform:translate3d(var(--media-tx, 0%), var(--media-ty, 0%), 0) scale(var(--media-scale, 1)) !important;
        transform-origin:center center !important;
        transition:object-position .18s ease, transform .18s ease;
      }

      .frame-preview-box{
        overflow:hidden !important;
        background:#050507 !important;
      }

      .frame-preview-box img,
      .frame-preview-box video{
        width:100% !important;
        height:280px !important;
        max-height:280px !important;
        display:block !important;
        background:#050507 !important;
      }

      .frame-preview-gallery{
        height:280px !important;
        overflow-x:auto !important;
        overflow-y:hidden !important;
        display:flex !important;
        scroll-snap-type:x mandatory;
        background:#050507;
      }

      .frame-preview-gallery img{
        min-width:100% !important;
        scroll-snap-align:center;
      }

      .media-frame-editor{
        margin:12px 0 16px;
        padding:13px;
        border-radius:22px;
        background:linear-gradient(135deg,rgba(91,46,234,.08),rgba(20,184,166,.08));
        border:1px solid rgba(91,46,234,.13);
      }

      .frame-editor-head{
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:10px;
        margin-bottom:10px;
      }

      .frame-editor-head strong{
        color:#111827;
        font-size:15px;
      }

      .frame-editor-head span{
        color:#6b7280;
        font-size:12px;
        font-weight:900;
        text-align:right;
      }

      .frame-mode-row{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
        margin-bottom:10px;
      }

      .frame-mode-row button,
      .frame-actions-grid button{
        border:1px solid rgba(91,46,234,.18);
        background:#fff;
        color:#111827;
        border-radius:16px;
        padding:11px 10px;
        font-weight:900;
        min-height:42px;
      }

      .frame-mode-row button.active{
        background:#5b2eea;
        color:#fff;
        border-color:#5b2eea;
      }

      .frame-actions-grid{
        display:grid;
        grid-template-columns:1fr 1fr 1fr;
        gap:8px;
      }

      .media-frame-editor p{
        margin:10px 0 0;
        color:#6b7280;
        font-size:12px;
        line-height:1.3;
      }

      @media (max-width:420px){
        .messages-panel,
        .chat-panel{
          padding-left:12px !important;
          padding-right:12px !important;
        }
        .message-toolbar{
          display:grid !important;
          grid-template-columns:1fr !important;
          gap:6px !important;
          align-items:start !important;
        }
        .message-toolbar small{
          white-space:normal !important;
        }
        .stable-conversation-card{
          gap:9px !important;
          padding:12px !important;
        }
        .stable-conversation-card .conversation-avatar{
          width:42px !important;
          height:42px !important;
          min-width:42px !important;
        }
      }

      .chat-refresh-btn{
        border:1px solid rgba(91,46,234,.16);
        background:#fff;
        color:#5b2eea;
        border-radius:999px;
        padding:8px 10px;
        font-size:12px;
        font-weight:900;
        margin-left:auto;
      }

      .visible-message-list{
        display:flex !important;
        flex-direction:column !important;
        gap:12px !important;
        margin-top:12px !important;
        padding-bottom:120px !important;
      }
      .message-visible-card{
        display:block !important;
        width:100% !important;
        text-align:left !important;
        border:1px solid rgba(91,46,234,.16) !important;
        border-radius:22px !important;
        background:#fff !important;
        color:#111827 !important;
        padding:14px !important;
        box-shadow:0 14px 34px rgba(17,24,39,.08) !important;
      }
      .message-visible-card.incoming{
        border-color:rgba(16,185,129,.24) !important;
        background:linear-gradient(135deg,#ffffff,#f0fdf4) !important;
      }
      .message-visible-card.outgoing{
        opacity:.82;
      }
      .message-visible-head{
        display:flex !important;
        justify-content:space-between !important;
        align-items:center !important;
        gap:8px !important;
        margin-bottom:8px !important;
      }
      .message-visible-badge{
        display:inline-flex !important;
        align-items:center !important;
        border-radius:999px !important;
        padding:5px 9px !important;
        background:rgba(91,46,234,.08) !important;
        color:#4c1d95 !important;
        font-size:12px !important;
        font-weight:900 !important;
      }
      .message-visible-card strong{
        display:block !important;
        font-size:15px !important;
        color:#111827 !important;
        margin-bottom:3px !important;
      }
      .message-visible-card em{
        display:block !important;
        font-style:normal !important;
        color:#6b7280 !important;
        font-size:12px !important;
        font-weight:800 !important;
        margin-bottom:8px !important;
      }
      .message-visible-card p{
        color:#111827 !important;
        font-size:16px !important;
        line-height:1.35 !important;
        margin:0 0 12px !important;
        white-space:pre-line !important;
      }
      .reply-visible-btn{
        border:0 !important;
        border-radius:999px !important;
        padding:10px 14px !important;
        background:#5b2eea !important;
        color:white !important;
        font-weight:900 !important;
      }

      .message-debug-mini{
        display:flex;
        justify-content:space-between;
        gap:8px;
        margin:-6px 0 12px;
        color:#6b7280;
      }
      .message-debug-mini small{
        font-size:11px;
      }

      .refresh-messages-btn{
        font-size:14px;
        font-weight:900;
        border-radius:999px;
        background:#fff;
        border:1px solid rgba(91,46,234,.16);
        padding:9px 12px;
      }


      /* v6.4.48: encuadre editable de multimedia */
      .framed-media,
      .frame-preview-media{
        object-fit:var(--media-fit, contain) !important;
        object-position:center center !important;
        transform:translate3d(var(--media-tx, 0%), var(--media-ty, 0%), 0) scale(var(--media-scale, 1)) !important;
        transform-origin:center center !important;
        transition:object-position .18s ease, transform .18s ease;
      }

      .frame-preview-box{
        overflow:hidden !important;
        background:#050507 !important;
      }

      .frame-preview-box img,
      .frame-preview-box video{
        width:100% !important;
        height:280px !important;
        max-height:280px !important;
        display:block !important;
        background:#050507 !important;
      }

      .frame-preview-gallery{
        height:280px !important;
        overflow-x:auto !important;
        overflow-y:hidden !important;
        display:flex !important;
        scroll-snap-type:x mandatory;
        background:#050507;
      }

      .frame-preview-gallery img{
        min-width:100% !important;
        scroll-snap-align:center;
      }

      .media-frame-editor{
        margin:12px 0 16px;
        padding:13px;
        border-radius:22px;
        background:linear-gradient(135deg,rgba(91,46,234,.08),rgba(20,184,166,.08));
        border:1px solid rgba(91,46,234,.13);
      }

      .frame-editor-head{
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:10px;
        margin-bottom:10px;
      }

      .frame-editor-head strong{
        color:#111827;
        font-size:15px;
      }

      .frame-editor-head span{
        color:#6b7280;
        font-size:12px;
        font-weight:900;
        text-align:right;
      }

      .frame-mode-row{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
        margin-bottom:10px;
      }

      .frame-mode-row button,
      .frame-actions-grid button{
        border:1px solid rgba(91,46,234,.18);
        background:#fff;
        color:#111827;
        border-radius:16px;
        padding:11px 10px;
        font-weight:900;
        min-height:42px;
      }

      .frame-mode-row button.active{
        background:#5b2eea;
        color:#fff;
        border-color:#5b2eea;
      }

      .frame-actions-grid{
        display:grid;
        grid-template-columns:1fr 1fr 1fr;
        gap:8px;
      }

      .media-frame-editor p{
        margin:10px 0 0;
        color:#6b7280;
        font-size:12px;
        line-height:1.3;
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
    



      /* v6.5.4-conecta-control-piloto
         Layout móvil consolidado.
         Este bloque reemplaza las capas visuales conflictivas del feed.
         No cambia mensajes, perfil, identidad, Supabase, Storage ni SQL. */

      :root{
        --cs-safe-bottom: env(safe-area-inset-bottom);
        --cs-nav-height: 72px;
        --cs-post-height: 100dvh;
        --cs-post-info-bottom: calc(var(--cs-safe-bottom) + 82px);
      }

      @supports (height: 100svh){
        :root{
          --cs-post-height: 100svh;
        }
      }

      html,
      body{
        width:100% !important;
        min-height:100% !important;
        margin:0 !important;
        padding:0 !important;
        overflow-x:hidden !important;
        background:#050507 !important;
      }

      .app-page,
      main.app-page{
        width:100% !important;
        max-width:none !important;
        min-height:100dvh !important;
        margin:0 !important;
        padding:0 !important;
        overflow-x:hidden !important;
        background:#050507 !important;
      }

      .top-space{
        height:0 !important;
        min-height:0 !important;
      }

      .feed-title{
        display:none !important;
      }

      .feed,
      .store-feed{
        width:100% !important;
        max-width:none !important;
        margin:0 !important;
        padding:0 0 calc(var(--cs-safe-bottom) + 84px) 0 !important;
        display:block !important;
        gap:0 !important;
        background:#050507 !important;
        overflow-x:hidden !important;
        scroll-snap-type:none !important;
      }

      .feed > .post-card,
      .store-feed > .post-card{
        position:relative !important;
        display:block !important;
        width:100% !important;
        max-width:none !important;
        height:var(--cs-post-height) !important;
        min-height:var(--cs-post-height) !important;
        max-height:var(--cs-post-height) !important;
        margin:0 !important;
        padding:0 !important;
        border:0 !important;
        border-radius:0 !important;
        overflow:hidden !important;
        background:#050507 !important;
        box-shadow:none !important;
      }

      .feed > .post-card + .post-card,
      .store-feed > .post-card + .post-card{
        margin-top:0 !important;
      }

      .post-card .media-area{
        position:absolute !important;
        inset:0 !important;
        z-index:1 !important;
        width:100% !important;
        height:100% !important;
        min-height:100% !important;
        max-height:100% !important;
        overflow:hidden !important;
        border-radius:0 !important;
        background:#050507 !important;
      }

      .post-card .media-area > img,
      .post-card .media-area .framed-media,
      .post-card .media-area .no-media,
      .post-card .video-inline-wrap,
      .post-card .video-inline-wrap video,
      .post-card .media-area video.feed-video-player,
      .post-card .media-carousel,
      .post-card .media-carousel img,
      .post-card .direct-frame-single,
      .post-card .direct-frame-single img{
        width:100% !important;
        min-width:100% !important;
        max-width:100% !important;
        height:100% !important;
        min-height:100% !important;
        max-height:100% !important;
        border-radius:0 !important;
        background:#050507 !important;
      }

      .post-card .media-area .no-media{
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
      }

      .post-card:not(.direct-frame-active) .media-area > img,
      .post-card:not(.direct-frame-active) .media-carousel img{
        object-fit:cover !important;
        object-position:center center !important;
      }

      .post-card .post-body{
        position:absolute !important;
        left:0 !important;
        right:0 !important;
        bottom:0 !important;
        z-index:80 !important;
        box-sizing:border-box !important;
        color:#fff !important;
        min-height:0 !important;
        max-height:68% !important;
        overflow:hidden !important;
        border-radius:0 !important;
        padding:64px 16px var(--cs-post-info-bottom) 16px !important;
        background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.58) 24%,rgba(0,0,0,.92)) !important;
        box-shadow:none !important;
        backdrop-filter:none !important;
        pointer-events:auto !important;
      }

      .post-card.description-open .post-body{
        max-height:80% !important;
        overflow-y:auto !important;
        -webkit-overflow-scrolling:touch !important;
        padding-right:18px !important;
        background:linear-gradient(180deg,rgba(0,0,0,.10),rgba(0,0,0,.72) 18%,rgba(0,0,0,.96)) !important;
      }

      .post-card.direct-edit-active .post-body,
      .post-card.direct-media-active .post-body{
        max-height:84% !important;
        overflow-y:auto !important;
        -webkit-overflow-scrolling:touch !important;
        padding:56px 14px var(--cs-post-info-bottom) 14px !important;
        background:linear-gradient(180deg,rgba(0,0,0,.16),rgba(0,0,0,.78) 18%,rgba(0,0,0,.97)) !important;
      }

      .post-card.direct-frame-active .post-body{
        display:none !important;
      }

      .owner-row{
        margin-bottom:5px !important;
      }

      .post-body h2{
        color:#fff !important;
        font-size:18px !important;
        line-height:1.12 !important;
        margin:0 0 5px !important;
        text-shadow:0 2px 14px rgba(0,0,0,.48) !important;
      }

      .post-description-short,
      .post-description-collapsed,
      .post-description-expanded,
      .post-body p{
        color:rgba(255,255,255,.95) !important;
        font-size:13px !important;
        line-height:1.25 !important;
      }

      .post-meta{
        margin-top:4px !important;
        font-size:11px !important;
      }

      .service-area-row{
        position:relative !important;
        left:auto !important;
        right:auto !important;
        top:auto !important;
        bottom:auto !important;
        z-index:1 !important;
        display:inline-flex !important;
        width:auto !important;
        max-width:100% !important;
        margin:3px 0 6px !important;
        padding:6px 10px !important;
        border-radius:999px !important;
        background:rgba(0,0,0,.42) !important;
        border:1px solid rgba(255,255,255,.18) !important;
        color:#fff !important;
        font-size:12px !important;
        font-weight:900 !important;
        white-space:nowrap !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
        pointer-events:none !important;
      }

      .service-area-row strong{
        color:#fff !important;
        min-width:0 !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
      }

      .post-action-row{
        display:grid !important;
        grid-template-columns:repeat(3, minmax(0,1fr)) !important;
        gap:7px !important;
        width:100% !important;
        margin-top:8px !important;
      }

      .post-action-row button{
        min-height:36px !important;
        padding:7px 8px !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.22) !important;
        border:1px solid rgba(255,255,255,.26) !important;
        color:#fff !important;
        font-weight:900 !important;
        font-size:12px !important;
      }

      .post-action-row .audio-row-btn{
        display:none !important;
      }

      .sound-toggle,
      .sound-toggle-card{
        display:none !important;
        visibility:hidden !important;
        opacity:0 !important;
        pointer-events:none !important;
      }

      .manage-row{
        position:relative !important;
        left:auto !important;
        right:auto !important;
        top:auto !important;
        bottom:auto !important;
        z-index:120 !important;
        display:flex !important;
        flex-wrap:nowrap !important;
        overflow-x:auto !important;
        overflow-y:hidden !important;
        gap:7px !important;
        width:100% !important;
        max-width:100% !important;
        box-sizing:border-box !important;
        margin-top:7px !important;
        padding:4px 0 0 !important;
        -webkit-overflow-scrolling:touch !important;
        scrollbar-width:none !important;
      }

      .manage-row::-webkit-scrollbar{
        display:none !important;
      }

      .manage-row::before{
        content:none !important;
        display:none !important;
      }

      .manage-row button{
        flex:0 0 auto !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        min-height:34px !important;
        white-space:nowrap !important;
        border-radius:999px !important;
        border:1px solid rgba(255,255,255,.26) !important;
        background:rgba(255,255,255,.22) !important;
        color:#fff !important;
        font-weight:900 !important;
        font-size:12px !important;
        padding:7px 10px !important;
        box-shadow:0 8px 20px rgba(0,0,0,.16) !important;
        backdrop-filter:blur(10px) !important;
      }

      .manage-row .frame-direct-btn{
        background:linear-gradient(135deg,#5b2eea,#14b8a6) !important;
      }

      .manage-row .direct-edit-btn{
        background:#111827 !important;
      }

      .manage-row .direct-media-btn{
        background:#0f766e !important;
      }

      .manage-row .danger{
        background:rgba(185,28,28,.88) !important;
      }

      .direct-edit-panel,
      .direct-media-panel{
        position:relative !important;
        z-index:145 !important;
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        pointer-events:auto !important;
      }

      .direct-save-btn,
      .direct-frame-controls button:first-child{
        background:#16a34a !important;
        color:#fff !important;
      }

      .media-top{
        z-index:90 !important;
      }

      .gallery-dots,
      .post-body-gallery-dots{
        z-index:92 !important;
      }

      .direct-frame-active .service-area-row,
      .direct-frame-active .post-body-gallery-dots,
      .direct-frame-active .gallery-dots{
        display:none !important;
        pointer-events:none !important;
      }

      .bottom-nav{
        position:fixed !important;
        left:18px !important;
        right:18px !important;
        bottom:calc(env(safe-area-inset-bottom) + 8px) !important;
        width:auto !important;
        max-width:none !important;
        height:66px !important;
        min-height:66px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:space-around !important;
        gap:4px !important;
        transform:none !important;
        z-index:300 !important;
        overflow:visible !important;
      }

      .bottom-nav .nav-item{
        flex:1 1 0 !important;
        min-width:0 !important;
      }

      .bottom-nav .nav-plus{
        flex:0 0 58px !important;
        width:58px !important;
        height:58px !important;
        min-width:58px !important;
        min-height:58px !important;
        transform:translateY(-12px) !important;
      }

      @media (max-height:720px){
        :root{
          --cs-nav-height:66px;
          --cs-post-info-bottom:calc(var(--cs-safe-bottom) + 74px);
        }

        .post-card .post-body{
          padding-top:54px !important;
          max-height:66% !important;
        }

        .post-body h2{
          font-size:16px !important;
        }

        .post-description-short,
        .post-description-collapsed,
        .post-description-expanded,
        .post-body p{
          font-size:12px !important;
        }

        .bottom-nav{
          height:60px !important;
          min-height:60px !important;
        }
      }

      @media (min-width:720px){
        .feed,
        .store-feed{
          max-width:440px !important;
          margin:0 auto !important;
        }

        .bottom-nav{
          max-width:420px !important;
          left:50% !important;
          right:auto !important;
          width:calc(100% - 48px) !important;
          transform:translateX(-50%) !important;
        }
      }



      /* v6.5.4-conecta-control-piloto
         Aplicación del lenguaje visual del prototipo HTML sobre la app real.
         No cambia lógica, mensajes, perfil, Supabase, Storage ni SQL. */
      :root{
        --brand-blue:#1D4ED8;
        --brand-blue-dark:#1E3A8A;
        --brand-blue-soft:#DBEAFE;
        --surface:#FFFFFF;
        --surface-soft:#F3F4F6;
        --text-main:#111827;
        --text-muted:#6B7280;
        --border-soft:#E5E7EB;
        --ok:#16A34A;
        --danger:#DC2626;
        --cs-safe-bottom:env(safe-area-inset-bottom);
        --cs-bottom-nav-h:72px;
        --cs-top-h:142px;
        --cs-feed-card-h:calc(100dvh - var(--cs-top-h));
      }
      @supports (height:100svh){:root{--cs-feed-card-h:calc(100svh - var(--cs-top-h));}}
      html,body,#app{margin:0!important;padding:0!important;width:100%!important;min-height:100%!important;overflow-x:hidden!important;background:var(--surface-soft)!important;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif!important;color:var(--text-main)!important;}
      .app-page,main.app-page{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;min-height:100dvh!important;overflow-x:hidden!important;background:var(--surface-soft)!important;}
      .top-space,.feed-title{display:none!important;height:0!important;min-height:0!important;}
      .glass-top.tiktok-top{position:sticky!important;top:0!important;left:0!important;right:0!important;z-index:260!important;padding:calc(env(safe-area-inset-top) + 10px) 14px 10px!important;background:var(--surface)!important;border-bottom:1px solid var(--border-soft)!important;box-shadow:0 8px 18px rgba(17,24,39,.06)!important;color:var(--text-main)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}
      .tiktok-topbar{display:grid!important;grid-template-columns:42px 1fr 42px!important;align-items:center!important;gap:10px!important;min-height:42px!important;}
      .tiktok-tabs{display:flex!important;align-items:center!important;justify-content:center!important;gap:16px!important;min-width:0!important;}
      .tiktok-tab{appearance:none!important;border:0!important;background:transparent!important;color:var(--text-muted)!important;font-weight:800!important;font-size:15px!important;padding:7px 2px!important;text-shadow:none!important;white-space:nowrap!important;position:relative!important;}
      .tiktok-tab.active{color:var(--brand-blue-dark)!important;font-weight:900!important;}
      .tiktok-tab.active::after{content:""!important;position:absolute!important;left:50%!important;bottom:0!important;transform:translateX(-50%)!important;width:28px!important;height:3px!important;border-radius:999px!important;background:var(--brand-blue)!important;box-shadow:none!important;}
      .tiktok-icon-btn{width:40px!important;height:40px!important;border:0!important;border-radius:999px!important;background:var(--brand-blue-soft)!important;color:var(--brand-blue)!important;font-size:20px!important;font-weight:900!important;text-shadow:none!important;box-shadow:0 4px 12px rgba(29,78,216,.08)!important;}
      .tiktok-search-panel{margin-top:8px!important;display:flex!important;align-items:center!important;gap:8px!important;padding:8px 10px!important;border-radius:14px!important;background:var(--surface-soft)!important;border:1px solid var(--border-soft)!important;box-shadow:none!important;backdrop-filter:none!important;}
      .tiktok-search-panel input{flex:1!important;min-width:0!important;border:0!important;background:transparent!important;color:var(--text-main)!important;outline:none!important;font-size:14px!important;font-weight:650!important;}
      .tiktok-search-panel input::placeholder{color:var(--text-muted)!important;}
      .visual-filter-row,.tiktok-filter-row{display:flex!important;gap:8px!important;overflow-x:auto!important;padding:8px 14px 10px!important;background:var(--surface-soft)!important;scrollbar-width:none!important;}
      .visual-filter-row::-webkit-scrollbar,.tiktok-filter-row::-webkit-scrollbar{display:none!important;}
      .path-card{height:34px!important;min-height:34px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;flex:0 0 auto!important;border-radius:999px!important;padding:0 14px!important;border:1px solid var(--border-soft)!important;background:var(--surface)!important;color:var(--text-muted)!important;box-shadow:none!important;font-weight:800!important;}
      .path-card.active{background:var(--brand-blue)!important;color:#fff!important;border-color:var(--brand-blue)!important;box-shadow:0 8px 18px rgba(29,78,216,.18)!important;}
      .path-card .path-icon{display:none!important;}
      .path-label{font-size:12px!important;font-weight:900!important;}
      .feed,.store-feed{display:block!important;width:100%!important;max-width:none!important;margin:0!important;padding:0 0 calc(var(--cs-safe-bottom) + 82px) 0!important;background:var(--surface-soft)!important;overflow-x:hidden!important;scroll-snap-type:none!important;}
      .feed>.post-card,.store-feed>.post-card{position:relative!important;display:block!important;width:100%!important;max-width:none!important;height:var(--cs-feed-card-h)!important;min-height:var(--cs-feed-card-h)!important;max-height:var(--cs-feed-card-h)!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;overflow:hidden!important;background:#111827!important;box-shadow:none!important;}
      .feed>.post-card+.post-card,.store-feed>.post-card+.post-card{margin-top:10px!important;border-top:8px solid var(--surface-soft)!important;}
      .post-card .media-area{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:1!important;overflow:hidden!important;border-radius:0!important;background:#111827!important;}
      .post-card .media-area>img,.post-card .media-area .framed-media,.post-card .media-area .no-media,.post-card .video-inline-wrap,.post-card .video-inline-wrap video,.post-card .media-area video.feed-video-player,.post-card .media-carousel,.post-card .media-carousel img,.post-card .direct-frame-single,.post-card .direct-frame-single img{width:100%!important;min-width:100%!important;max-width:100%!important;height:100%!important;min-height:100%!important;max-height:100%!important;border-radius:0!important;background:#111827!important;}
      .post-card:not(.direct-frame-active) .media-area>img,.post-card:not(.direct-frame-active) .media-area .framed-media,.post-card:not(.direct-frame-active) .media-carousel img{object-fit:cover!important;object-position:center center!important;}
      .post-card .media-area::after{content:""!important;position:absolute!important;inset:0!important;z-index:2!important;pointer-events:none!important;background:linear-gradient(180deg,rgba(17,24,39,.05) 0%,rgba(17,24,39,.08) 34%,rgba(17,24,39,.46) 58%,rgba(17,24,39,.96) 100%)!important;}
      .post-card.direct-frame-active .media-area::after{display:none!important;}
      .sound-toggle,.sound-toggle-card,.audio-row-btn,[data-toggle-video-sound],[aria-label*="sonido" i],[aria-label*="audio" i]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}
      .media-top{position:absolute!important;top:16px!important;left:16px!important;right:auto!important;z-index:92!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;width:auto!important;max-width:80%!important;}
      .media-top .chip{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:28px!important;min-width:0!important;width:auto!important;padding:5px 10px!important;border-radius:999px!important;background:var(--brand-blue)!important;color:#fff!important;border:0!important;font-size:11px!important;font-weight:900!important;letter-spacing:.04em!important;box-shadow:0 8px 18px rgba(0,0,0,.18)!important;}
      .post-card .post-body{position:absolute!important;left:0!important;right:0!important;bottom:0!important;z-index:85!important;box-sizing:border-box!important;color:#fff!important;min-height:0!important;max-height:70%!important;overflow:hidden!important;border-radius:0!important;padding:72px 16px calc(var(--cs-safe-bottom) + 84px) 16px!important;background:linear-gradient(180deg,rgba(17,24,39,0),rgba(17,24,39,.22) 0%,rgba(17,24,39,.86) 50%,rgba(17,24,39,1) 100%)!important;box-shadow:none!important;backdrop-filter:none!important;pointer-events:auto!important;}
      .post-card.description-open .post-body{max-height:82%!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding-right:18px!important;background:linear-gradient(180deg,rgba(17,24,39,.10),rgba(17,24,39,.78) 18%,rgba(17,24,39,1) 100%)!important;}
      .post-card.direct-edit-active .post-body,.post-card.direct-media-active .post-body{max-height:84%!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding:56px 14px calc(var(--cs-safe-bottom) + 84px) 14px!important;background:linear-gradient(180deg,rgba(17,24,39,.16),rgba(17,24,39,.86) 18%,rgba(17,24,39,1) 100%)!important;}
      .post-card.direct-frame-active .post-body{display:none!important;}
      .owner-row{display:flex!important;align-items:center!important;gap:9px!important;margin-bottom:7px!important;}
      .owner-row img,.owner-avatar{width:40px!important;height:40px!important;border-radius:999px!important;border:2px solid #fff!important;box-shadow:0 8px 18px rgba(0,0,0,.24)!important;}
      .owner-row span{font-size:14px!important;font-weight:800!important;color:#fff!important;text-shadow:0 2px 12px rgba(0,0,0,.42)!important;}
      .service-area-row{position:relative!important;display:inline-flex!important;align-items:center!important;width:auto!important;max-width:100%!important;margin:0 0 6px!important;padding:6px 10px!important;border-radius:999px!important;background:rgba(219,234,254,.16)!important;border:1px solid rgba(219,234,254,.24)!important;color:#DBEAFE!important;font-size:12px!important;font-weight:900!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;pointer-events:none!important;}
      .service-area-row strong{color:#fff!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      .post-body h2{color:#fff!important;font-size:18px!important;line-height:1.12!important;margin:0 0 5px!important;font-weight:900!important;text-shadow:0 2px 14px rgba(0,0,0,.48)!important;}
      .post-description-short,.post-description-collapsed,.post-description-expanded,.post-body p{color:#F3F4F6!important;font-size:13px!important;line-height:1.3!important;font-weight:500!important;}
      .read-more,.read-toggle,[data-toggle-description]{color:#DBEAFE!important;font-weight:900!important;}
      .post-meta{margin-top:4px!important;font-size:11px!important;color:rgba(255,255,255,.72)!important;}
      .post-action-row{display:grid!important;grid-template-columns:minmax(0,1fr) 46px 46px!important;gap:8px!important;width:100%!important;margin-top:10px!important;align-items:center!important;}
      .post-action-row button{min-height:46px!important;height:46px!important;border-radius:14px!important;border:1px solid rgba(255,255,255,.26)!important;background:rgba(255,255,255,.92)!important;color:var(--brand-blue-dark)!important;font-weight:900!important;font-size:13px!important;box-shadow:0 10px 22px rgba(0,0,0,.18)!important;backdrop-filter:blur(10px)!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;}
      .post-action-row button[data-message-post],.post-action-row .primary,.post-action-row button:first-child{background:var(--brand-blue)!important;color:#fff!important;border-color:var(--brand-blue)!important;}
      .manage-row{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;z-index:120!important;display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;gap:8px!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;margin-top:10px!important;padding:4px 0 0!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important;}
      .manage-row::-webkit-scrollbar{display:none!important;}.manage-row::before{content:none!important;display:none!important;}
      .manage-row button{flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:36px!important;white-space:nowrap!important;border-radius:12px!important;border:1px solid rgba(255,255,255,.18)!important;background:rgba(30,58,138,.88)!important;color:#fff!important;font-weight:900!important;font-size:12px!important;padding:8px 12px!important;box-shadow:0 8px 20px rgba(0,0,0,.16)!important;backdrop-filter:blur(10px)!important;}
      .manage-row .frame-direct-btn{background:var(--brand-blue)!important;}.manage-row .direct-edit-btn{background:#1E3A8A!important;}.manage-row .direct-media-btn{background:#0F766E!important;}.manage-row .danger{background:var(--danger)!important;}
      .direct-edit-panel,.direct-media-panel{position:relative!important;z-index:145!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;background:rgba(255,255,255,.96)!important;color:var(--text-main)!important;border:1px solid rgba(255,255,255,.55)!important;border-radius:18px!important;box-shadow:0 14px 34px rgba(0,0,0,.24)!important;}
      .direct-edit-panel label,.direct-media-panel label{color:var(--text-main)!important;font-weight:900!important;}.direct-edit-panel input,.direct-edit-panel textarea,.direct-edit-panel select,.direct-media-panel input{background:#fff!important;border:1px solid var(--border-soft)!important;border-radius:12px!important;color:var(--text-main)!important;}
      .direct-save-btn,.direct-frame-controls button:first-child{background:var(--ok)!important;color:#fff!important;}
      .gallery-dots,.post-body-gallery-dots{position:absolute!important;right:14px!important;top:42%!important;left:auto!important;bottom:auto!important;transform:translateY(-50%)!important;z-index:96!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;padding:5px 7px!important;border-radius:999px!important;background:rgba(17,24,39,.34)!important;border:1px solid rgba(255,255,255,.18)!important;box-shadow:0 8px 18px rgba(0,0,0,.18)!important;}
      .gallery-dot{width:12px!important;height:12px!important;min-width:12px!important;background:transparent!important;padding:0!important;border:0!important;display:flex!important;align-items:center!important;justify-content:center!important;}.gallery-dot span{width:4px!important;height:4px!important;border-radius:999px!important;background:rgba(255,255,255,.58)!important;display:block!important;}.gallery-dot.active span{width:12px!important;background:#fff!important;}
      .direct-frame-active .service-area-row,.direct-frame-active .post-body-gallery-dots,.direct-frame-active .gallery-dots{display:none!important;pointer-events:none!important;}
      .bottom-nav{position:fixed!important;left:18px!important;right:18px!important;bottom:calc(var(--cs-safe-bottom) + 8px)!important;width:auto!important;max-width:none!important;height:72px!important;min-height:72px!important;display:flex!important;align-items:center!important;justify-content:space-around!important;gap:4px!important;transform:none!important;z-index:300!important;overflow:visible!important;padding:6px 10px!important;border-radius:26px!important;background:rgba(255,255,255,.94)!important;border:1px solid var(--border-soft)!important;box-shadow:0 16px 36px rgba(17,24,39,.16)!important;backdrop-filter:blur(14px)!important;}
      .bottom-nav .nav-item{flex:1 1 0!important;min-width:0!important;color:var(--text-muted)!important;}.bottom-nav .nav-item.active{color:var(--brand-blue)!important;}.nav-icon{font-size:20px!important;}.nav-item small{font-size:10px!important;font-weight:800!important;}.bottom-nav .nav-plus{flex:0 0 58px!important;width:58px!important;height:58px!important;min-width:58px!important;min-height:58px!important;border-radius:999px!important;background:var(--brand-blue)!important;color:#fff!important;box-shadow:0 12px 28px rgba(29,78,216,.30)!important;border:4px solid #fff!important;transform:translateY(-14px)!important;font-size:30px!important;}
      @media (max-height:720px){:root{--cs-top-h:126px;--cs-bottom-nav-h:66px;}.post-card .post-body{padding-top:54px!important;max-height:68%!important;}.post-body h2{font-size:16px!important;}.post-description-short,.post-description-collapsed,.post-description-expanded,.post-body p{font-size:12px!important;}.bottom-nav{height:66px!important;min-height:66px!important;}.bottom-nav .nav-plus{width:54px!important;height:54px!important;min-width:54px!important;min-height:54px!important;}}
      @media (min-width:720px){.feed,.store-feed{max-width:430px!important;margin:0 auto!important;}.bottom-nav{max-width:410px!important;left:50%!important;right:auto!important;width:calc(100% - 48px)!important;transform:translateX(-50%)!important;}}



      /* v6.4.48: ajustes post diseño según revisión real en celular.
         Mantiene funciones, corrige encabezado, barra inferior, corazón, puntitos y orden visual. */

      /* Restaurar encabezado oscuro/transparente: se deben ver Municipio / Tienda / Para ti. */
      .glass-top.tiktok-top{
        position:sticky !important;
        top:0 !important;
        z-index:260 !important;
        padding:calc(env(safe-area-inset-top) + 6px) 12px 8px !important;
        background:rgba(0,0,0,.76) !important;
        border:0 !important;
        border-bottom:1px solid rgba(255,255,255,.12) !important;
        box-shadow:none !important;
        color:#fff !important;
        backdrop-filter:blur(14px) !important;
        -webkit-backdrop-filter:blur(14px) !important;
      }

      .tiktok-topbar{
        display:grid !important;
        grid-template-columns:42px 1fr 42px !important;
        align-items:center !important;
        gap:8px !important;
        min-height:40px !important;
      }

      .tiktok-tabs{
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:16px !important;
        min-width:0 !important;
        overflow:visible !important;
      }

      .tiktok-tab{
        color:rgba(255,255,255,.76) !important;
        font-size:16px !important;
        font-weight:900 !important;
        text-shadow:0 2px 10px rgba(0,0,0,.42) !important;
      }

      .tiktok-tab.active{
        color:#fff !important;
      }

      .tiktok-tab.active::after{
        background:#fff !important;
        box-shadow:0 2px 10px rgba(255,255,255,.30) !important;
      }

      .tiktok-icon-btn{
        background:rgba(255,255,255,.18) !important;
        color:#fff !important;
        border:1px solid rgba(255,255,255,.18) !important;
        box-shadow:0 8px 22px rgba(0,0,0,.18) !important;
      }

      .visual-filter-row,
      .tiktok-filter-row{
        background:rgba(0,0,0,.72) !important;
        padding:8px 12px 10px !important;
        gap:8px !important;
      }

      .path-card{
        background:rgba(255,255,255,.16) !important;
        color:rgba(255,255,255,.88) !important;
        border:1px solid rgba(255,255,255,.18) !important;
        box-shadow:none !important;
      }

      .path-card.active{
        background:#fff !important;
        color:#111827 !important;
        border-color:#fff !important;
      }

      .tiktok-search-panel{
        background:rgba(255,255,255,.12) !important;
        border:1px solid rgba(255,255,255,.18) !important;
        color:#fff !important;
      }

      .tiktok-search-panel input{
        color:#fff !important;
      }

      .tiktok-search-panel input::placeholder{
        color:rgba(255,255,255,.64) !important;
      }

      /* Sin barra blanca/pastilla: conservar navegación, pero quitar contenedor blanco grande. */
      .bottom-nav{
        left:0 !important;
        right:0 !important;
        bottom:calc(env(safe-area-inset-bottom) + 4px) !important;
        width:100% !important;
        height:70px !important;
        min-height:70px !important;
        padding:0 18px !important;
        border-radius:0 !important;
        background:transparent !important;
        border:0 !important;
        box-shadow:none !important;
        backdrop-filter:none !important;
        -webkit-backdrop-filter:none !important;
      }

      .bottom-nav .nav-item{
        color:rgba(255,255,255,.88) !important;
        text-shadow:0 2px 10px rgba(0,0,0,.52) !important;
        background:transparent !important;
      }

      .bottom-nav .nav-item.active{
        color:#DBEAFE !important;
      }

      .nav-icon{
        font-size:22px !important;
        filter:drop-shadow(0 2px 8px rgba(0,0,0,.45));
      }

      .nav-item small{
        color:inherit !important;
        font-size:10px !important;
        font-weight:900 !important;
      }

      .bottom-nav .nav-plus{
        background:#1D4ED8 !important;
        color:#fff !important;
        border:4px solid rgba(255,255,255,.92) !important;
        box-shadow:0 12px 28px rgba(0,0,0,.30) !important;
      }

      /* Botones de acción: el corazón no debe ocupar media pantalla. */
      .post-action-row{
        display:flex !important;
        align-items:center !important;
        gap:10px !important;
        width:100% !important;
        margin-top:10px !important;
      }

      .post-action-row .icon-only-action,
      .post-action-row button{
        flex:0 0 52px !important;
        width:52px !important;
        height:46px !important;
        min-width:52px !important;
        min-height:46px !important;
        border-radius:18px !important;
        padding:0 !important;
        font-size:20px !important;
      }

      .post-action-row .heart-action{
        flex:0 0 52px !important;
        width:52px !important;
        height:46px !important;
        min-width:52px !important;
        font-size:25px !important;
        background:rgba(255,255,255,.20) !important;
        color:#fff !important;
      }

      .post-action-row .heart-action.liked{
        color:#ef4444 !important;
      }

      /* Mensaje y compartir se mantienen compactos y claros. */
      .post-action-row button[data-message],
      .post-action-row button[data-share]{
        background:rgba(255,255,255,.22) !important;
        color:#fff !important;
      }

      /* Si solo queda una foto o un punto único, no mostrar carrusel. */
      .gallery-dots:has(.gallery-dot:only-child),
      .post-body-gallery-dots:has(.gallery-dot:only-child){
        display:none !important;
      }

      .gallery-dots,
      .post-body-gallery-dots{
        max-width:58px !important;
        pointer-events:none !important;
      }

      .gallery-dot{
        pointer-events:auto !important;
      }

      /* Perfil/Siguiendo: que las publicaciones dentro de secciones no queden cortadas detrás del header. */
      .following-liked-feed,
      .profile-panel + .diag-panel + .feed,
      .profile-panel ~ .feed{
        padding-top:0 !important;
      }

      @media (max-height:720px){
        .tiktok-tab{
          font-size:15px !important;
        }

        .bottom-nav{
          height:64px !important;
          min-height:64px !important;
        }

        .post-action-row .icon-only-action,
        .post-action-row button,
        .post-action-row .heart-action{
          width:48px !important;
          min-width:48px !important;
          height:42px !important;
          min-height:42px !important;
        }
      }



      /* v6.4.48: menú flotante por publicación.
         Orden pedido: Municipio/Zona + Carrito + Corazón + Lupa.
         Se elimina Siguiendo de arriba porque ya existe abajo. */
      .glass-top.tiktok-top.floating-post-menu{
        position:fixed !important;
        top:0 !important;
        left:0 !important;
        right:0 !important;
        z-index:275 !important;
        padding:calc(env(safe-area-inset-top) + 7px) 10px 6px !important;
        background:linear-gradient(180deg,rgba(0,0,0,.56),rgba(0,0,0,.22),rgba(0,0,0,0)) !important;
        border:0 !important;
        border-bottom:0 !important;
        box-shadow:none !important;
        backdrop-filter:none !important;
        -webkit-backdrop-filter:none !important;
        color:#fff !important;
        pointer-events:none !important;
      }

      .floating-post-nav{
        width:100% !important;
        max-width:520px !important;
        margin:0 auto !important;
        display:grid !important;
        grid-template-columns:minmax(110px,1fr) 44px 44px 44px !important;
        align-items:center !important;
        gap:7px !important;
        padding:4px 6px !important;
        border-radius:999px !important;
        background:rgba(0,0,0,.26) !important;
        border:1px solid rgba(255,255,255,.10) !important;
        box-shadow:0 10px 30px rgba(0,0,0,.16) !important;
        backdrop-filter:blur(12px) !important;
        -webkit-backdrop-filter:blur(12px) !important;
        pointer-events:auto !important;
      }

      .floating-zone,
      .floating-icon{
        appearance:none !important;
        border:0 !important;
        height:38px !important;
        min-height:38px !important;
        border-radius:999px !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        color:rgba(255,255,255,.92) !important;
        background:rgba(255,255,255,.08) !important;
        text-shadow:0 2px 10px rgba(0,0,0,.55) !important;
        font-weight:900 !important;
        box-shadow:none !important;
        touch-action:manipulation !important;
      }

      .floating-zone{
        min-width:0 !important;
        justify-content:flex-start !important;
        padding:0 12px !important;
        font-size:15px !important;
        white-space:nowrap !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
      }

      .floating-icon{
        width:38px !important;
        min-width:38px !important;
        padding:0 !important;
        font-size:20px !important;
        line-height:1 !important;
      }

      .floating-heart{
        font-size:22px !important;
      }

      .floating-zone.active,
      .floating-icon.active{
        color:#fff !important;
        background:rgba(255,255,255,.18) !important;
      }

      .floating-heart.active{
        color:#fff !important;
        background:rgba(29,78,216,.72) !important;
      }

      .floating-zone.active::after,
      .floating-heart.active::after,
      .floating-cart.active::after{
        content:"" !important;
        position:absolute !important;
        left:50% !important;
        bottom:3px !important;
        width:22px !important;
        height:3px !important;
        border-radius:999px !important;
        transform:translateX(-50%) !important;
        background:#fff !important;
        box-shadow:0 2px 10px rgba(255,255,255,.32) !important;
      }

      .floating-zone,
      .floating-icon{
        position:relative !important;
      }

      /* La fila Vendo/Ofrezco/Necesito se conserva, pero ahora se ve ligera y flotante. */
      .floating-filter-row{
        width:max-content !important;
        max-width:calc(100% - 20px) !important;
        margin:6px auto 0 !important;
        padding:3px !important;
        gap:5px !important;
        justify-content:center !important;
        background:rgba(0,0,0,.18) !important;
        border:1px solid rgba(255,255,255,.08) !important;
        border-radius:999px !important;
        backdrop-filter:blur(10px) !important;
        -webkit-backdrop-filter:blur(10px) !important;
        pointer-events:auto !important;
      }

      .floating-filter-row .path-card{
        height:29px !important;
        min-height:29px !important;
        padding:0 12px !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.10) !important;
        color:rgba(255,255,255,.90) !important;
        border:0 !important;
        box-shadow:none !important;
      }

      .floating-filter-row .path-card.active{
        background:rgba(255,255,255,.90) !important;
        color:#111827 !important;
      }

      .floating-filter-row .path-icon{
        display:none !important;
      }

      .floating-filter-row .path-label{
        font-size:11px !important;
        font-weight:900 !important;
      }

      .floating-search-panel{
        max-width:520px !important;
        margin:7px auto 0 !important;
        background:rgba(0,0,0,.56) !important;
        border:1px solid rgba(255,255,255,.14) !important;
        box-shadow:0 12px 30px rgba(0,0,0,.20) !important;
        backdrop-filter:blur(14px) !important;
        -webkit-backdrop-filter:blur(14px) !important;
        pointer-events:auto !important;
      }

      /* Los chips de categoría de cada publicación bajan lo necesario para no chocar con el menú. */
      .media-top{
        top:calc(env(safe-area-inset-top) + 104px) !important;
      }

      .post-card .post-body{
        padding-bottom:calc(env(safe-area-inset-bottom) + 84px) !important;
      }

      @media (max-width:370px){
        .floating-post-nav{
          grid-template-columns:minmax(96px,1fr) 40px 40px 40px !important;
          gap:5px !important;
          padding:4px 5px !important;
        }

        .floating-zone{
          font-size:13px !important;
          padding:0 9px !important;
        }

        .floating-icon{
          width:36px !important;
          min-width:36px !important;
          height:36px !important;
          min-height:36px !important;
          font-size:18px !important;
        }

        .floating-filter-row .path-card{
          padding:0 10px !important;
        }
      }



      /* v6.4.48: corrige el hueco inferior entre publicaciones.
         El menú superior es flotante, por eso cada publicación debe ocupar 100% de la pantalla.
         No toca mensajes, perfil, Supabase, Storage ni SQL. */
      :root{
        --cs-feed-card-h:100dvh !important;
        --cs-post-height:100dvh !important;
      }

      @supports (height:100svh){
        :root{
          --cs-feed-card-h:100svh !important;
          --cs-post-height:100svh !important;
        }
      }

      .feed,
      .store-feed,
      .following-liked-feed,
      .profile-panel ~ .feed{
        padding-top:0 !important;
        padding-bottom:0 !important;
        gap:0 !important;
        background:#050507 !important;
      }

      .feed > .post-card,
      .store-feed > .post-card,
      .following-liked-feed > .post-card,
      .profile-panel ~ .feed > .post-card{
        height:var(--cs-feed-card-h) !important;
        min-height:var(--cs-feed-card-h) !important;
        max-height:var(--cs-feed-card-h) !important;
        margin:0 !important;
        border-top:0 !important;
        border-bottom:0 !important;
        overflow:hidden !important;
      }

      .feed > .post-card + .post-card,
      .store-feed > .post-card + .post-card,
      .following-liked-feed > .post-card + .post-card,
      .profile-panel ~ .feed > .post-card + .post-card{
        margin-top:0 !important;
        border-top:0 !important;
      }

      .post-card .media-area,
      .post-card .media-area > img,
      .post-card .media-area .framed-media,
      .post-card .media-area .no-media,
      .post-card .video-inline-wrap,
      .post-card .video-inline-wrap video,
      .post-card .media-area video.feed-video-player,
      .post-card .media-carousel,
      .post-card .media-carousel img,
      .post-card .direct-frame-single,
      .post-card .direct-frame-single img{
        height:100% !important;
        min-height:100% !important;
        max-height:100% !important;
      }

      .post-card .post-body{
        bottom:0 !important;
        padding-bottom:calc(env(safe-area-inset-bottom) + 86px) !important;
      }

      .bottom-nav{
        bottom:calc(env(safe-area-inset-bottom) + 0px) !important;
      }

      @media (max-height:720px){
        .post-card .post-body{
          padding-bottom:calc(env(safe-area-inset-bottom) + 76px) !important;
        }
      }



      /* v6.4.48: admin de encuadre y video auto-ajustado.
         El admin local solo muestra Encuadre admin, no borrar ni editar contenido. */
      .admin-frame-row{
        justify-content:flex-start !important;
      }

      .admin-frame-btn{
        background:linear-gradient(135deg,#1D4ED8,#0f766e) !important;
        color:#fff !important;
        border:1px solid rgba(255,255,255,.28) !important;
      }

      .admin-frame-btn::before{
        content:"🛠️ ";
      }

      .post-card video.framed-media,
      .post-card .media-area video.feed-video-player{
        object-fit:var(--media-fit, cover) !important;
        transform:translate3d(var(--media-tx, 0%), var(--media-ty, 0%), 0) scale(var(--media-scale, 1)) !important;
        transform-origin:center center !important;
      }

      .direct-frame-active .direct-frame-hint{
        top:calc(env(safe-area-inset-top) + 82px) !important;
      }



      /* v6.4.48: controles de encuadre visibles.
         Corrige Guardar/Cancelar tapados por barra inferior y mejora escritura en paneles. */

      .direct-frame-active .direct-frame-controls{
        position:absolute !important;
        left:14px !important;
        right:14px !important;
        bottom:calc(env(safe-area-inset-bottom) + 92px) !important;
        z-index:360 !important;
        display:grid !important;
        grid-template-columns:1fr 1fr !important;
        gap:12px !important;
        padding:0 !important;
        pointer-events:auto !important;
      }

      .direct-frame-active .direct-frame-controls button{
        min-height:48px !important;
        height:48px !important;
        border-radius:999px !important;
        font-size:15px !important;
        font-weight:900 !important;
        box-shadow:0 12px 28px rgba(0,0,0,.32) !important;
        touch-action:manipulation !important;
      }

      .direct-frame-active .direct-frame-controls button:first-child{
        background:#16A34A !important;
        color:#fff !important;
        border:1px solid rgba(255,255,255,.24) !important;
      }

      .direct-frame-active .direct-frame-controls button:last-child{
        background:rgba(255,255,255,.94) !important;
        color:#111827 !important;
        border:1px solid rgba(255,255,255,.48) !important;
      }

      .direct-frame-active .bottom-nav{
        display:none !important;
        pointer-events:none !important;
      }

      .direct-frame-active .direct-frame-hint{
        top:calc(env(safe-area-inset-top) + 92px) !important;
        z-index:356 !important;
      }

      /* Cuando se edita texto o multimedia, la barra inferior no debe bloquear campos ni botones. */
      .post-card.direct-edit-active .post-body,
      .post-card.direct-media-active .post-body{
        padding-bottom:calc(env(safe-area-inset-bottom) + 122px) !important;
        overflow-y:auto !important;
        -webkit-overflow-scrolling:touch !important;
      }

      .post-card.direct-edit-active .bottom-nav,
      .post-card.direct-media-active .bottom-nav{
        pointer-events:none !important;
      }

      .direct-edit-panel,
      .direct-media-panel{
        margin-bottom:calc(env(safe-area-inset-bottom) + 26px) !important;
      }

      .direct-edit-panel input,
      .direct-edit-panel textarea,
      .direct-edit-panel select,
      .direct-media-panel input,
      .direct-media-panel textarea{
        position:relative !important;
        z-index:380 !important;
        pointer-events:auto !important;
        -webkit-user-select:text !important;
        user-select:text !important;
        touch-action:manipulation !important;
        font-size:16px !important;
      }

      .direct-edit-actions,
      .direct-media-actions{
        position:sticky !important;
        bottom:calc(env(safe-area-inset-bottom) + 84px) !important;
        z-index:390 !important;
        padding-top:8px !important;
        background:linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,.96) 35%,rgba(255,255,255,.98)) !important;
      }

      @media (max-height:720px){
        .direct-frame-active .direct-frame-controls{
          bottom:calc(env(safe-area-inset-bottom) + 78px) !important;
        }

        .direct-frame-active .direct-frame-controls button{
          min-height:44px !important;
          height:44px !important;
          font-size:14px !important;
        }

        .direct-edit-actions,
        .direct-media-actions{
          bottom:calc(env(safe-area-inset-bottom) + 74px) !important;
        }
      }



      /* v6.4.48: encuadre con botones arriba y barra inferior oculta realmente.
         La barra inferior es hermana del main, por eso se usa :has() y selector de hermano. */

      body:has(.post-card.direct-frame-active) .bottom-nav,
      .app-page:has(.post-card.direct-frame-active) + .bottom-nav{
        display:none !important;
        visibility:hidden !important;
        opacity:0 !important;
        pointer-events:none !important;
      }

      body:has(.post-card.direct-frame-active) .floating-filter-row{
        display:none !important;
      }

      body:has(.post-card.direct-frame-active) .floating-post-nav{
        opacity:.88 !important;
      }

      .post-card.direct-frame-active .direct-frame-controls{
        position:absolute !important;
        left:14px !important;
        right:14px !important;
        top:calc(env(safe-area-inset-top) + 104px) !important;
        bottom:auto !important;
        z-index:999 !important;
        display:grid !important;
        grid-template-columns:1fr 1fr !important;
        gap:10px !important;
        padding:0 !important;
        pointer-events:auto !important;
        transform:none !important;
      }

      .post-card.direct-frame-active .direct-frame-controls button{
        min-height:48px !important;
        height:48px !important;
        border-radius:999px !important;
        font-size:15px !important;
        font-weight:900 !important;
        box-shadow:0 12px 30px rgba(0,0,0,.38) !important;
        touch-action:manipulation !important;
        pointer-events:auto !important;
      }

      .post-card.direct-frame-active .direct-frame-controls button:first-child{
        background:#16A34A !important;
        color:#fff !important;
        border:1px solid rgba(255,255,255,.26) !important;
      }

      .post-card.direct-frame-active .direct-frame-controls button:last-child{
        background:rgba(255,255,255,.94) !important;
        color:#111827 !important;
        border:1px solid rgba(255,255,255,.52) !important;
      }

      .post-card.direct-frame-active .direct-frame-hint{
        top:calc(env(safe-area-inset-top) + 158px) !important;
        left:50% !important;
        right:auto !important;
        transform:translateX(-50%) !important;
        max-width:calc(100% - 34px) !important;
        z-index:998 !important;
        pointer-events:none !important;
      }

      .post-card.direct-frame-active .media-top{
        display:none !important;
      }

      .post-card.direct-frame-active .media-area{
        touch-action:none !important;
      }

      .post-card.direct-frame-active{
        overflow:hidden !important;
      }

      /* Panel de edición: elevar zona de guardado para que sí se pueda escribir y guardar. */
      body:has(.post-card.direct-edit-active) .bottom-nav,
      .app-page:has(.post-card.direct-edit-active) + .bottom-nav{
        opacity:.25 !important;
        pointer-events:none !important;
      }

      .post-card.direct-edit-active .post-body,
      .post-card.direct-media-active .post-body{
        padding-bottom:calc(env(safe-area-inset-bottom) + 130px) !important;
        overflow-y:auto !important;
        -webkit-overflow-scrolling:touch !important;
      }

      .direct-edit-actions,
      .direct-media-actions{
        position:sticky !important;
        bottom:calc(env(safe-area-inset-bottom) + 18px) !important;
        z-index:999 !important;
        padding:10px 0 4px !important;
        background:linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,.98) 42%,rgba(255,255,255,1)) !important;
      }

      .direct-edit-panel input,
      .direct-edit-panel textarea,
      .direct-edit-panel select{
        font-size:16px !important;
        touch-action:manipulation !important;
        -webkit-user-select:text !important;
        user-select:text !important;
      }

      @media (max-height:720px){
        .post-card.direct-frame-active .direct-frame-controls{
          top:calc(env(safe-area-inset-top) + 92px) !important;
        }

        .post-card.direct-frame-active .direct-frame-controls button{
          min-height:44px !important;
          height:44px !important;
          font-size:14px !important;
        }

        .post-card.direct-frame-active .direct-frame-hint{
          top:calc(env(safe-area-inset-top) + 140px) !important;
        }
      }

      /* v6.4.90: carrusel compacto sin división visual sobre la foto */
      .gallery-dots.gallery-counter,
      .post-body-gallery-dots.gallery-counter{
        left:auto !important;
        right:18px !important;
        top:auto !important;
        bottom:calc(env(safe-area-inset-bottom) + 214px) !important;
        transform:none !important;
        width:auto !important;
        min-width:74px !important;
        max-width:none !important;
        height:34px !important;
        padding:4px 6px !important;
        gap:5px !important;
        border-radius:999px !important;
        background:rgba(0,0,0,.34) !important;
        border:1px solid rgba(255,255,255,.24) !important;
        box-shadow:0 10px 26px rgba(0,0,0,.18) !important;
        backdrop-filter:blur(10px) !important;
        pointer-events:auto !important;
      }
      .gallery-counter-text{
        min-width:34px !important;
        color:#fff !important;
        font-size:12px !important;
        line-height:1 !important;
        font-weight:900 !important;
        text-align:center !important;
        letter-spacing:.02em !important;
      }
      .gallery-counter-btn{
        width:24px !important;
        height:24px !important;
        min-width:24px !important;
        min-height:24px !important;
        border-radius:999px !important;
        border:0 !important;
        background:rgba(255,255,255,.20) !important;
        color:#fff !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        font-weight:900 !important;
        font-size:18px !important;
        line-height:1 !important;
        padding:0 !important;
        pointer-events:auto !important;
      }
      .gallery-counter-btn:disabled{
        opacity:.32 !important;
      }
      .gallery-dots.gallery-counter .gallery-dot{
        display:none !important;
      }
      @media (max-height:720px){
        .gallery-dots.gallery-counter,
        .post-body-gallery-dots.gallery-counter{
          bottom:calc(env(safe-area-inset-bottom) + 190px) !important;
          right:14px !important;
          height:30px !important;
          min-width:68px !important;
        }
        .gallery-counter-btn{
          width:22px !important;
          height:22px !important;
          min-width:22px !important;
          min-height:22px !important;
          font-size:16px !important;
        }
        .gallery-counter-text{
          font-size:11px !important;
          min-width:30px !important;
        }
      }

      /* v6.4.91: contador del carrusel arriba, centrado, fuera del título/descripción */
      .gallery-dots.gallery-counter,
      .post-body-gallery-dots.gallery-counter{
        left:50% !important;
        right:auto !important;
        top:calc(env(safe-area-inset-top) + 198px) !important;
        bottom:auto !important;
        transform:translateX(-50%) !important;
        width:auto !important;
        min-width:70px !important;
        max-width:none !important;
        height:30px !important;
        padding:3px 6px !important;
        gap:4px !important;
        border-radius:999px !important;
        background:rgba(0,0,0,.28) !important;
        border:1px solid rgba(255,255,255,.20) !important;
        box-shadow:0 8px 20px rgba(0,0,0,.16) !important;
        backdrop-filter:blur(9px) !important;
        z-index:92 !important;
        pointer-events:auto !important;
      }
      .gallery-counter-text{
        min-width:32px !important;
        color:#fff !important;
        font-size:11px !important;
        line-height:1 !important;
        font-weight:900 !important;
        text-align:center !important;
        letter-spacing:.02em !important;
      }
      .gallery-counter-btn{
        width:22px !important;
        height:22px !important;
        min-width:22px !important;
        min-height:22px !important;
        border-radius:999px !important;
        border:0 !important;
        background:rgba(255,255,255,.18) !important;
        color:#fff !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        font-weight:900 !important;
        font-size:15px !important;
        line-height:1 !important;
        padding:0 !important;
        pointer-events:auto !important;
      }
      .gallery-counter-btn:disabled{
        opacity:.28 !important;
      }
      @media (max-height:720px){
        .gallery-dots.gallery-counter,
        .post-body-gallery-dots.gallery-counter{
          top:calc(env(safe-area-inset-top) + 174px) !important;
          height:28px !important;
          min-width:66px !important;
        }
        .gallery-counter-btn{
          width:20px !important;
          height:20px !important;
          min-width:20px !important;
          min-height:20px !important;
          font-size:14px !important;
        }
        .gallery-counter-text{
          min-width:30px !important;
          font-size:10px !important;
        }
      }
      @media (max-width:380px){
        .gallery-dots.gallery-counter,
        .post-body-gallery-dots.gallery-counter{
          top:calc(env(safe-area-inset-top) + 188px) !important;
        }
      }

      /* v6.4.92: contador arriba y fondo de texto limpio */
      .gallery-dots.gallery-counter,
      .post-body-gallery-dots.gallery-counter{
        position:absolute !important;
        left:50% !important;
        right:auto !important;
        top:calc(env(safe-area-inset-top) + 176px) !important;
        bottom:auto !important;
        transform:translateX(-50%) !important;
        width:auto !important;
        min-width:76px !important;
        max-width:none !important;
        height:30px !important;
        padding:3px 6px !important;
        gap:5px !important;
        border-radius:999px !important;
        background:rgba(0,0,0,.26) !important;
        border:1px solid rgba(255,255,255,.22) !important;
        box-shadow:0 8px 20px rgba(0,0,0,.16) !important;
        backdrop-filter:blur(8px) !important;
        pointer-events:auto !important;
        z-index:140 !important;
      }

      .gallery-counter-text{
        min-width:34px !important;
        color:#fff !important;
        font-size:12px !important;
        line-height:1 !important;
        font-weight:900 !important;
        text-align:center !important;
        letter-spacing:.02em !important;
        text-shadow:0 1px 5px rgba(0,0,0,.55) !important;
      }

      .gallery-counter-btn{
        width:22px !important;
        height:22px !important;
        min-width:22px !important;
        min-height:22px !important;
        border-radius:999px !important;
        border:0 !important;
        background:rgba(255,255,255,.20) !important;
        color:#fff !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        font-weight:900 !important;
        font-size:16px !important;
        line-height:1 !important;
        padding:0 !important;
        pointer-events:auto !important;
      }

      .gallery-counter-btn:disabled{
        opacity:.30 !important;
      }

      .post-body{
        background:transparent !important;
        background-image:none !important;
        box-shadow:none !important;
        backdrop-filter:none !important;
      }

      .post-body h2,
      .post-body p,
      .post-body .post-meta,
      .service-area-row,
      .owner-row{
        text-shadow:
          0 2px 8px rgba(0,0,0,.86),
          0 1px 2px rgba(0,0,0,.88) !important;
      }

      .post-body .post-description-expanded{
        background:rgba(0,0,0,.24) !important;
        border-radius:16px !important;
        padding:10px 12px !important;
        backdrop-filter:blur(4px) !important;
      }

      @media (max-height:720px){
        .gallery-dots.gallery-counter,
        .post-body-gallery-dots.gallery-counter{
          top:calc(env(safe-area-inset-top) + 156px) !important;
          height:28px !important;
          min-width:72px !important;
        }
      }

      /* v6.5.1: layout real limpio de publicación.
         Jerarquía:
         post-card
           media-area  -> imagen/carrusel/video limpio + contador dentro
           post-body   -> texto normal debajo, sin overlay absoluto */
      .feed > .post-card,
      .store-feed > .post-card,
      .following-liked-feed > .post-card{
        position:relative !important;
        display:flex !important;
        flex-direction:column !important;
        width:100% !important;
        height:auto !important;
        min-height:0 !important;
        max-height:none !important;
        margin:0 0 14px 0 !important;
        padding:0 !important;
        overflow:visible !important;
        border-radius:0 !important;
        background:#f3f4f6 !important;
        box-shadow:none !important;
        scroll-margin-top:calc(env(safe-area-inset-top) + 152px) !important;
      }

      .post-card .media-area{
        position:relative !important;
        inset:auto !important;
        z-index:1 !important;
        display:block !important;
        width:100% !important;
        height:62dvh !important;
        min-height:390px !important;
        max-height:620px !important;
        overflow:hidden !important;
        border-radius:0 !important;
        background:#050507 !important;
        box-shadow:none !important;
      }

      @supports (height:100svh){
        .post-card .media-area{
          height:62svh !important;
        }
      }

      .post-card .gallery-stage,
      .post-card .media-carousel,
      .post-card .video-inline-wrap,
      .post-card .direct-frame-single{
        position:relative !important;
        width:100% !important;
        height:100% !important;
        min-height:100% !important;
        max-height:100% !important;
        overflow:hidden !important;
        background:#050507 !important;
      }

      .post-card .media-area > img,
      .post-card .media-area .framed-media,
      .post-card .media-carousel img,
      .post-card .video-inline-wrap video,
      .post-card .media-area video.feed-video-player,
      .post-card .direct-frame-single img,
      .post-card .media-area .no-media{
        width:100% !important;
        min-width:100% !important;
        max-width:100% !important;
        height:100% !important;
        min-height:100% !important;
        max-height:100% !important;
        display:block !important;
        border-radius:0 !important;
        background:#050507 !important;
      }

      .post-card:not(.direct-frame-active) .media-area > img,
      .post-card:not(.direct-frame-active) .media-carousel img{
        object-fit:cover !important;
        object-position:center center !important;
      }

      .media-area::before,
      .media-area::after,
      .gallery-stage::before,
      .gallery-stage::after,
      .media-carousel::before,
      .media-carousel::after{
        content:none !important;
        display:none !important;
        background:none !important;
        box-shadow:none !important;
      }

      .post-card .post-body,
      .post-card.description-open .post-body,
      .post-card.direct-edit-active .post-body,
      .post-card.direct-media-active .post-body{
        position:relative !important;
        left:auto !important;
        right:auto !important;
        top:auto !important;
        bottom:auto !important;
        z-index:2 !important;
        display:block !important;
        box-sizing:border-box !important;
        width:100% !important;
        min-height:0 !important;
        max-height:none !important;
        overflow:visible !important;
        padding:14px 16px calc(env(safe-area-inset-bottom) + 104px) 16px !important;
        border-radius:0 !important;
        background:#ffffff !important;
        background-image:none !important;
        color:#111827 !important;
        box-shadow:none !important;
        backdrop-filter:none !important;
        pointer-events:auto !important;
      }

      .post-card.direct-frame-active .post-body{
        display:none !important;
      }

      .media-gallery-counter{
        position:absolute !important;
        right:10px !important;
        bottom:10px !important;
        left:auto !important;
        top:auto !important;
        transform:none !important;
        z-index:120 !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:5px !important;
        min-width:76px !important;
        height:30px !important;
        padding:3px 9px !important;
        border-radius:999px !important;
        background:rgba(17,24,39,.52) !important;
        border:1px solid rgba(255,255,255,.22) !important;
        color:#fff !important;
        font-size:12px !important;
        font-weight:900 !important;
        line-height:1 !important;
        letter-spacing:.02em !important;
        text-shadow:0 1px 5px rgba(0,0,0,.55) !important;
        backdrop-filter:blur(8px) !important;
        pointer-events:none !important;
      }

      .media-gallery-counter .gallery-counter-text{
        min-width:auto !important;
        color:#fff !important;
        font-size:12px !important;
        font-weight:900 !important;
        line-height:1 !important;
        text-align:center !important;
      }

      .media-gallery-counter .gallery-counter-arrow{
        color:rgba(255,255,255,.92) !important;
        font-size:15px !important;
        line-height:1 !important;
        font-weight:900 !important;
      }

      .post-body .gallery-dots,
      .post-body-gallery-dots,
      .gallery-dots.gallery-counter,
      .post-body-gallery-dots.gallery-counter{
        display:none !important;
      }

      .post-body .owner-row,
      .post-body .service-area-row,
      .post-body h2,
      .post-body p,
      .post-body .post-meta,
      .post-description-short,
      .post-description-collapsed,
      .post-description-expanded{
        color:#111827 !important;
        text-shadow:none !important;
      }

      .post-body .owner-row{
        display:inline-flex !important;
        margin:0 0 8px !important;
      }

      .post-body .service-area-row{
        display:inline-flex !important;
        width:auto !important;
        max-width:100% !important;
        margin:2px 0 8px !important;
        padding:7px 10px !important;
        border-radius:999px !important;
        background:#f3f4f6 !important;
        border:1px solid #e5e7eb !important;
        color:#374151 !important;
        backdrop-filter:none !important;
        box-shadow:none !important;
      }

      .post-body h2{
        margin:4px 0 6px !important;
        font-size:20px !important;
        line-height:1.12 !important;
        font-weight:950 !important;
      }

      .post-description-short,
      .post-description-collapsed,
      .post-description-expanded,
      .post-body p{
        color:#374151 !important;
        font-size:15px !important;
        line-height:1.32 !important;
      }

      .post-card:not(.description-open) .post-description-short,
      .post-card:not(.description-open) .post-description-collapsed,
      .post-card:not(.description-open) .post-body p{
        max-height:3.9em !important;
        overflow:hidden !important;
      }

      .post-card.description-open .post-description-expanded{
        max-height:none !important;
        overflow:visible !important;
        padding:0 !important;
        margin:0 !important;
        background:transparent !important;
        border-radius:0 !important;
        color:#374151 !important;
        backdrop-filter:none !important;
      }

      .post-body .post-meta{
        margin-top:8px !important;
        color:#6b7280 !important;
        font-size:12px !important;
        text-align:right !important;
      }

      .post-body .post-action-row{
        margin-top:12px !important;
        display:grid !important;
        grid-template-columns:repeat(3, minmax(0, 1fr)) !important;
        gap:10px !important;
        width:100% !important;
      }

      .post-body .post-action-row button{
        min-height:48px !important;
        border-radius:18px !important;
        background:#f3f4f6 !important;
        border:1px solid #e5e7eb !important;
        color:#1f2937 !important;
        box-shadow:none !important;
      }

      .post-body .heart-action.is-liked,
      .post-body .heart-action.active{
        background:#1D4ED8 !important;
        color:#fff !important;
        border-color:#1D4ED8 !important;
      }

      .post-body .manage-row{
        position:relative !important;
        z-index:4 !important;
        display:grid !important;
        grid-template-columns:repeat(4, minmax(0, 1fr)) !important;
        gap:8px !important;
        margin-top:12px !important;
        width:100% !important;
      }

      .post-body .manage-row button{
        min-height:44px !important;
        border-radius:14px !important;
        font-size:13px !important;
      }

      .media-top{
        position:absolute !important;
        top:14px !important;
        left:14px !important;
        right:auto !important;
        bottom:auto !important;
        z-index:110 !important;
      }

      .media-top .chip{
        background:rgba(29,78,216,.92) !important;
        color:#fff !important;
        border:0 !important;
        backdrop-filter:blur(8px) !important;
      }

      .sound-toggle,
      .sound-toggle-card{
        position:absolute !important;
        right:12px !important;
        top:54px !important;
        bottom:auto !important;
        z-index:130 !important;
      }

      @media (max-height:720px){
        .post-card .media-area{
          height:58dvh !important;
          min-height:330px !important;
        }
        @supports (height:100svh){
          .post-card .media-area{
            height:58svh !important;
          }
        }
        .post-card .post-body,
        .post-card.description-open .post-body,
        .post-card.direct-edit-active .post-body,
        .post-card.direct-media-active .post-body{
          padding-bottom:calc(env(safe-area-inset-bottom) + 92px) !important;
        }
      }

      /* v6.5.2 Feed inmersivo profesional
         Estructura sin tocar Supabase:
         article.post-card.immersive-feed-card
           .media-area       -> multimedia full screen limpia
           .post-body        -> interfaz flotante, transparente, sobre multimedia
           .post-action-row  -> acciones laterales de Conecta
           .bottom-nav       -> barra inferior translúcida */
      html,
      body{
        overscroll-behavior-y:contain !important;
      }

      .app-shell,
      main,
      .feed,
      .store-feed,
      .following-liked-feed{
        background:#050507 !important;
      }

      .feed,
      .store-feed,
      .following-liked-feed{
        width:100vw !important;
        max-width:100vw !important;
        margin:0 !important;
        padding:0 !important;
        overflow-x:hidden !important;
        scroll-snap-type:y mandatory !important;
        scroll-behavior:smooth !important;
      }

      .feed > .post-card.immersive-feed-card,
      .store-feed > .post-card.immersive-feed-card,
      .following-liked-feed > .post-card.immersive-feed-card{
        position:relative !important;
        display:block !important;
        width:100vw !important;
        height:100dvh !important;
        min-height:100dvh !important;
        max-height:100dvh !important;
        margin:0 !important;
        padding:0 !important;
        overflow:hidden !important;
        border-radius:0 !important;
        background:#050507 !important;
        box-shadow:none !important;
        scroll-snap-align:start !important;
        scroll-snap-stop:always !important;
        scroll-margin-top:0 !important;
      }

      @supports (height:100svh){
        .feed > .post-card.immersive-feed-card,
        .store-feed > .post-card.immersive-feed-card,
        .following-liked-feed > .post-card.immersive-feed-card{
          height:100svh !important;
          min-height:100svh !important;
          max-height:100svh !important;
        }
      }

      .post-card.immersive-feed-card .media-area{
        position:absolute !important;
        inset:0 !important;
        z-index:1 !important;
        display:block !important;
        width:100% !important;
        height:100% !important;
        min-height:100% !important;
        max-height:100% !important;
        overflow:hidden !important;
        border-radius:0 !important;
        background:#050507 !important;
        box-shadow:none !important;
      }

      .post-card.immersive-feed-card .gallery-stage,
      .post-card.immersive-feed-card .media-carousel,
      .post-card.immersive-feed-card .video-inline-wrap,
      .post-card.immersive-feed-card .direct-frame-single{
        position:absolute !important;
        inset:0 !important;
        width:100% !important;
        height:100% !important;
        min-height:100% !important;
        max-height:100% !important;
        overflow:hidden !important;
        background:#050507 !important;
      }

      .post-card.immersive-feed-card .media-area > img,
      .post-card.immersive-feed-card .media-area .framed-media,
      .post-card.immersive-feed-card .media-carousel img,
      .post-card.immersive-feed-card .video-inline-wrap video,
      .post-card.immersive-feed-card .media-area video.feed-video-player,
      .post-card.immersive-feed-card .direct-frame-single img,
      .post-card.immersive-feed-card .media-area .no-media{
        width:100% !important;
        min-width:100% !important;
        max-width:100% !important;
        height:100% !important;
        min-height:100% !important;
        max-height:100% !important;
        display:block !important;
        object-fit:cover !important;
        object-position:center center !important;
        border-radius:0 !important;
        background:#050507 !important;
      }

      .post-card.immersive-feed-card .media-area::before,
      .post-card.immersive-feed-card .media-area::after,
      .post-card.immersive-feed-card .gallery-stage::before,
      .post-card.immersive-feed-card .gallery-stage::after,
      .post-card.immersive-feed-card .media-carousel::before,
      .post-card.immersive-feed-card .media-carousel::after,
      .post-card.immersive-feed-card .post-body::before,
      .post-card.immersive-feed-card .post-body::after{
        content:none !important;
        display:none !important;
        background:none !important;
        box-shadow:none !important;
      }

      .post-card.immersive-feed-card .post-body,
      .post-card.immersive-feed-card.description-open .post-body,
      .post-card.immersive-feed-card.direct-edit-active .post-body,
      .post-card.immersive-feed-card.direct-media-active .post-body{
        position:absolute !important;
        left:0 !important;
        right:0 !important;
        top:auto !important;
        bottom:0 !important;
        z-index:45 !important;
        display:block !important;
        width:100% !important;
        min-height:0 !important;
        max-height:none !important;
        overflow:visible !important;
        box-sizing:border-box !important;
        padding:
          0
          calc(92px + env(safe-area-inset-right))
          calc(env(safe-area-inset-bottom) + 112px)
          calc(18px + env(safe-area-inset-left)) !important;
        border-radius:0 !important;
        background:transparent !important;
        background-image:none !important;
        box-shadow:none !important;
        backdrop-filter:none !important;
        color:#fff !important;
        pointer-events:none !important;
      }

      .post-card.immersive-feed-card.direct-frame-active .post-body{
        display:none !important;
      }

      .post-card.immersive-feed-card .owner-row,
      .post-card.immersive-feed-card .service-area-row,
      .post-card.immersive-feed-card h2,
      .post-card.immersive-feed-card .post-description-short,
      .post-card.immersive-feed-card .post-description-collapsed,
      .post-card.immersive-feed-card .post-description-expanded,
      .post-card.immersive-feed-card .post-body p,
      .post-card.immersive-feed-card .post-meta,
      .post-card.immersive-feed-card .local-note,
      .post-card.immersive-feed-card .status-label{
        pointer-events:auto !important;
      }

      .post-card.immersive-feed-card .owner-row{
        display:inline-flex !important;
        align-items:center !important;
        gap:8px !important;
        width:auto !important;
        max-width:calc(100vw - 128px) !important;
        margin:0 0 8px !important;
        color:#fff !important;
        background:transparent !important;
        text-shadow:0 2px 12px rgba(0,0,0,.72) !important;
        cursor:pointer !important;
      }

      .post-card.immersive-feed-card .owner-row span{
        color:#fff !important;
        font-weight:900 !important;
        text-shadow:0 2px 12px rgba(0,0,0,.72) !important;
      }

      .post-card.immersive-feed-card .owner-row .avatar,
      .post-card.immersive-feed-card .owner-row img{
        box-shadow:0 6px 22px rgba(0,0,0,.34) !important;
        border:2px solid rgba(255,255,255,.82) !important;
      }

      .post-card.immersive-feed-card .service-area-row{
        display:inline-flex !important;
        align-items:center !important;
        max-width:calc(100vw - 128px) !important;
        margin:0 0 8px !important;
        padding:6px 10px !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.14) !important;
        border:1px solid rgba(255,255,255,.20) !important;
        color:#fff !important;
        backdrop-filter:blur(10px) !important;
        -webkit-backdrop-filter:blur(10px) !important;
        box-shadow:0 8px 24px rgba(0,0,0,.18) !important;
        text-shadow:0 2px 10px rgba(0,0,0,.72) !important;
      }

      .post-card.immersive-feed-card .service-area-row strong{
        color:#fff !important;
      }

      .post-card.immersive-feed-card h2{
        max-width:calc(100vw - 128px) !important;
        margin:4px 0 7px !important;
        color:#fff !important;
        font-size:21px !important;
        line-height:1.1 !important;
        font-weight:950 !important;
        letter-spacing:-.02em !important;
        text-shadow:0 3px 14px rgba(0,0,0,.82), 0 1px 2px rgba(0,0,0,.84) !important;
      }

      .post-card.immersive-feed-card .post-description-short,
      .post-card.immersive-feed-card .post-description-collapsed,
      .post-card.immersive-feed-card .post-description-expanded,
      .post-card.immersive-feed-card .post-body p{
        max-width:calc(100vw - 128px) !important;
        margin:0 !important;
        color:#fff !important;
        font-size:15px !important;
        line-height:1.28 !important;
        text-shadow:0 2px 12px rgba(0,0,0,.82), 0 1px 2px rgba(0,0,0,.84) !important;
        background:transparent !important;
        border-radius:0 !important;
        padding:0 !important;
        backdrop-filter:none !important;
      }

      .post-card.immersive-feed-card:not(.description-open) .post-description-short,
      .post-card.immersive-feed-card:not(.description-open) .post-description-collapsed,
      .post-card.immersive-feed-card:not(.description-open) .post-body p{
        max-height:3.9em !important;
        overflow:hidden !important;
      }

      .post-card.immersive-feed-card.description-open .post-description-expanded{
        max-height:28dvh !important;
        overflow:auto !important;
        padding-right:8px !important;
        -webkit-overflow-scrolling:touch !important;
      }

      .post-card.immersive-feed-card .post-meta{
        max-width:calc(100vw - 128px) !important;
        margin-top:6px !important;
        color:rgba(255,255,255,.86) !important;
        font-size:12px !important;
        text-align:left !important;
        text-shadow:0 2px 10px rgba(0,0,0,.80) !important;
      }

      .post-card.immersive-feed-card .post-action-row{
        position:absolute !important;
        right:calc(14px + env(safe-area-inset-right)) !important;
        bottom:calc(env(safe-area-inset-bottom) + 132px) !important;
        z-index:60 !important;
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        justify-content:flex-end !important;
        gap:12px !important;
        width:auto !important;
        margin:0 !important;
        pointer-events:auto !important;
      }

      .post-card.immersive-feed-card .post-action-row button,
      .post-card.immersive-feed-card .icon-only-action{
        width:54px !important;
        height:54px !important;
        min-width:54px !important;
        min-height:54px !important;
        border-radius:999px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        padding:0 !important;
        font-size:24px !important;
        color:#fff !important;
        background:rgba(255,255,255,.16) !important;
        border:1px solid rgba(255,255,255,.24) !important;
        box-shadow:0 10px 26px rgba(0,0,0,.28) !important;
        backdrop-filter:blur(12px) !important;
        -webkit-backdrop-filter:blur(12px) !important;
        text-shadow:0 2px 8px rgba(0,0,0,.60) !important;
      }

      .post-card.immersive-feed-card .heart-action.is-liked,
      .post-card.immersive-feed-card .heart-action.active{
        background:rgba(29,78,216,.88) !important;
        color:#fff !important;
        border-color:rgba(255,255,255,.35) !important;
      }

      .post-card.immersive-feed-card .manage-row{
        pointer-events:auto !important;
        display:flex !important;
        gap:8px !important;
        width:calc(100vw - 36px) !important;
        max-width:calc(100vw - 36px) !important;
        overflow-x:auto !important;
        margin:12px 0 0 !important;
        padding-bottom:4px !important;
      }

      .post-card.immersive-feed-card .manage-row button{
        min-width:max-content !important;
        min-height:42px !important;
        border-radius:14px !important;
        padding:0 13px !important;
        color:#fff !important;
        background:rgba(29,78,216,.72) !important;
        border:1px solid rgba(255,255,255,.26) !important;
        box-shadow:0 10px 22px rgba(0,0,0,.20) !important;
        backdrop-filter:blur(10px) !important;
      }

      .post-card.immersive-feed-card .media-top{
        position:absolute !important;
        top:calc(env(safe-area-inset-top) + 146px) !important;
        left:calc(16px + env(safe-area-inset-left)) !important;
        right:auto !important;
        bottom:auto !important;
        z-index:45 !important;
        pointer-events:none !important;
      }

      .post-card.immersive-feed-card .media-top .chip{
        color:#fff !important;
        background:rgba(29,78,216,.82) !important;
        border:1px solid rgba(255,255,255,.25) !important;
        box-shadow:0 8px 22px rgba(0,0,0,.20) !important;
        backdrop-filter:blur(10px) !important;
        text-shadow:0 2px 10px rgba(0,0,0,.55) !important;
      }

      .post-card.immersive-feed-card .media-gallery-counter{
        position:absolute !important;
        right:calc(14px + env(safe-area-inset-right)) !important;
        top:calc(env(safe-area-inset-top) + 146px) !important;
        bottom:auto !important;
        left:auto !important;
        transform:none !important;
        z-index:50 !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:6px !important;
        width:auto !important;
        min-width:74px !important;
        height:30px !important;
        padding:3px 9px !important;
        border-radius:999px !important;
        background:rgba(17,24,39,.34) !important;
        border:1px solid rgba(255,255,255,.18) !important;
        color:#fff !important;
        font-size:12px !important;
        font-weight:900 !important;
        line-height:1 !important;
        backdrop-filter:blur(10px) !important;
        -webkit-backdrop-filter:blur(10px) !important;
        box-shadow:0 8px 20px rgba(0,0,0,.18) !important;
        text-shadow:0 1px 5px rgba(0,0,0,.55) !important;
        pointer-events:none !important;
      }

      .post-card.immersive-feed-card .media-gallery-counter .gallery-counter-arrow,
      .post-card.immersive-feed-card .media-gallery-counter .gallery-counter-text{
        color:#fff !important;
        font-size:12px !important;
        font-weight:900 !important;
      }

      .post-card.immersive-feed-card .sound-toggle,
      .post-card.immersive-feed-card .sound-toggle-card{
        position:absolute !important;
        right:calc(14px + env(safe-area-inset-right)) !important;
        top:calc(env(safe-area-inset-top) + 188px) !important;
        bottom:auto !important;
        z-index:55 !important;
        width:44px !important;
        height:44px !important;
        border-radius:999px !important;
        background:rgba(255,255,255,.16) !important;
        border:1px solid rgba(255,255,255,.24) !important;
        color:#fff !important;
        box-shadow:0 10px 26px rgba(0,0,0,.26) !important;
        backdrop-filter:blur(12px) !important;
      }

      .glass-top,
      .glass-top.visual-top,
      .glass-top.tiktok-top{
        position:fixed !important;
        top:0 !important;
        left:0 !important;
        right:0 !important;
        z-index:90 !important;
        background:rgba(5,5,7,.18) !important;
        background-image:none !important;
        border:0 !important;
        box-shadow:none !important;
        backdrop-filter:blur(14px) saturate(1.15) !important;
        -webkit-backdrop-filter:blur(14px) saturate(1.15) !important;
      }

      .floating-filter-bar,
      .floating-zone,
      .floating-icon,
      .visual-tab,
      .tiktok-filter-row,
      .tiktok-tabs{
        backdrop-filter:blur(12px) !important;
        -webkit-backdrop-filter:blur(12px) !important;
      }

      .bottom-nav{
        position:fixed !important;
        left:14px !important;
        right:14px !important;
        bottom:calc(env(safe-area-inset-bottom) + 8px) !important;
        z-index:95 !important;
        height:70px !important;
        min-height:70px !important;
        padding:6px 9px !important;
        border-radius:28px !important;
        background:rgba(255,255,255,.18) !important;
        border:1px solid rgba(255,255,255,.24) !important;
        backdrop-filter:blur(18px) saturate(1.18) !important;
        -webkit-backdrop-filter:blur(18px) saturate(1.18) !important;
        box-shadow:0 14px 34px rgba(0,0,0,.24) !important;
      }

      .bottom-nav .nav-item,
      .bottom-nav .nav-item small,
      .bottom-nav .nav-icon{
        color:#fff !important;
        text-shadow:0 2px 10px rgba(0,0,0,.65) !important;
      }

      .bottom-nav .nav-plus{
        width:58px !important;
        height:58px !important;
        min-width:58px !important;
        margin-top:0 !important;
        transform:none !important;
        background:rgba(29,78,216,.92) !important;
        color:#fff !important;
        border:3px solid rgba(255,255,255,.82) !important;
        box-shadow:0 10px 26px rgba(0,0,0,.26) !important;
      }

      @media (max-height:720px){
        .post-card.immersive-feed-card .post-body,
        .post-card.immersive-feed-card.description-open .post-body{
          padding-right:calc(82px + env(safe-area-inset-right)) !important;
          padding-bottom:calc(env(safe-area-inset-bottom) + 96px) !important;
        }

        .post-card.immersive-feed-card .post-action-row{
          bottom:calc(env(safe-area-inset-bottom) + 110px) !important;
          gap:9px !important;
        }

        .post-card.immersive-feed-card .post-action-row button,
        .post-card.immersive-feed-card .icon-only-action{
          width:48px !important;
          height:48px !important;
          min-width:48px !important;
          min-height:48px !important;
          font-size:21px !important;
        }

        .post-card.immersive-feed-card .media-top,
        .post-card.immersive-feed-card .media-gallery-counter{
          top:calc(env(safe-area-inset-top) + 130px) !important;
        }
      }

      /* v6.5.3: restauración de scroll global sin tocar Supabase ni lógica.
         El feed inmersivo queda full-screen, pero el scroll vertical vuelve a pertenecer al documento.
         Los carruseles permiten gesto horizontal sin bloquear el gesto vertical del feed. */
      html,
      body{
        height:auto !important;
        min-height:100% !important;
        max-height:none !important;
        overflow-x:hidden !important;
        overflow-y:auto !important;
        position:relative !important;
        touch-action:pan-y !important;
        overscroll-behavior-y:auto !important;
        -webkit-overflow-scrolling:touch !important;
      }

      #app,
      .app-shell,
      main,
      main.app-page,
      .screen{
        height:auto !important;
        min-height:100dvh !important;
        max-height:none !important;
        overflow-x:hidden !important;
        overflow-y:visible !important;
        touch-action:pan-y !important;
        overscroll-behavior-y:auto !important;
        -webkit-overflow-scrolling:touch !important;
      }

      .feed,
      .store-feed,
      .following-liked-feed{
        height:auto !important;
        min-height:100dvh !important;
        max-height:none !important;
        overflow-x:hidden !important;
        overflow-y:visible !important;
        touch-action:pan-y !important;
        overscroll-behavior-y:auto !important;
        -webkit-overflow-scrolling:touch !important;
        scroll-snap-type:y proximity !important;
      }

      .feed > .post-card.immersive-feed-card,
      .store-feed > .post-card.immersive-feed-card,
      .following-liked-feed > .post-card.immersive-feed-card{
        position:relative !important;
        height:100dvh !important;
        min-height:100dvh !important;
        max-height:none !important;
        overflow:hidden !important;
        touch-action:pan-y !important;
        scroll-snap-align:start !important;
      }

      @supports (height:100svh){
        .feed > .post-card.immersive-feed-card,
        .store-feed > .post-card.immersive-feed-card,
        .following-liked-feed > .post-card.immersive-feed-card{
          height:100svh !important;
          min-height:100svh !important;
        }
      }

      .post-card.immersive-feed-card:not(.direct-frame-active),
      .post-card.immersive-feed-card:not(.direct-frame-active) .media-area,
      .post-card.immersive-feed-card:not(.direct-frame-active) .gallery-stage,
      .post-card.immersive-feed-card:not(.direct-frame-active) .media-carousel,
      .post-card.immersive-feed-card:not(.direct-frame-active) .video-inline-wrap,
      .post-card.immersive-feed-card:not(.direct-frame-active) video.feed-video-player,
      .post-card.immersive-feed-card:not(.direct-frame-active) img{
        touch-action:pan-y pinch-zoom !important;
        overscroll-behavior-y:auto !important;
      }

      .post-card.immersive-feed-card:not(.direct-frame-active) .media-carousel{
        overflow-x:auto !important;
        overflow-y:hidden !important;
        scroll-snap-type:x mandatory !important;
        -webkit-overflow-scrolling:touch !important;
      }

      .post-card.immersive-feed-card.description-open .post-description-expanded{
        touch-action:pan-y !important;
        overflow-y:auto !important;
        overscroll-behavior-y:contain !important;
        -webkit-overflow-scrolling:touch !important;
      }

      .panel,
      .composer,
      .messages-panel,
      .chat-panel,
      .profile-panel,
      .store-panel,
      .following-panel,
      .owner-directory,
      .conversation-list,
      .visible-message-list,
      .chat-feed{
        height:auto !important;
        max-height:none !important;
        overflow-y:visible !important;
        touch-action:pan-y !important;
        overscroll-behavior-y:auto !important;
        -webkit-overflow-scrolling:touch !important;
      }

      .direct-frame-active .media-area,
      .direct-frame-area-active,
      .frame-touch-editor{
        touch-action:none !important;
        overscroll-behavior:contain !important;
      }

      /* v6.5.4 Conecta Control — módulo aislado */
      .control-page{
        min-height:100dvh !important;
        padding:calc(env(safe-area-inset-top) + 86px) 16px calc(env(safe-area-inset-bottom) + 104px) !important;
        background:
          radial-gradient(circle at top left, rgba(16,185,129,.24), transparent 38%),
          linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%) !important;
        color:#111827 !important;
        overflow-y:auto !important;
        touch-action:pan-y !important;
      }

      .control-hero{
        display:flex;
        align-items:flex-start;
        gap:12px;
        padding:16px;
        border-radius:24px;
        background:rgba(255,255,255,.88);
        border:1px solid rgba(148,163,184,.26);
        box-shadow:0 16px 38px rgba(15,23,42,.12);
        margin-bottom:14px;
      }

      .control-back{
        flex:0 0 auto;
        margin-top:2px;
      }

      .control-kicker{
        margin:0 0 4px;
        color:#059669 !important;
        font-weight:900;
        font-size:12px;
        letter-spacing:.08em;
        text-transform:uppercase;
      }

      .control-hero h1{
        margin:0;
        font-size:28px;
        line-height:1.05;
        letter-spacing:-.04em;
        color:#111827;
      }

      .control-hero p{
        margin:6px 0 0;
        color:#475569 !important;
        line-height:1.35;
        font-size:14px;
      }

      .control-stats-grid{
        display:grid;
        grid-template-columns:repeat(2, minmax(0, 1fr));
        gap:10px;
        margin:0 0 14px;
      }

      .control-stat-card{
        padding:14px;
        border-radius:20px;
        background:#fff;
        border:1px solid rgba(148,163,184,.22);
        box-shadow:0 12px 28px rgba(15,23,42,.08);
        min-height:96px;
      }

      .control-stat-card span{
        display:block;
        color:#64748b;
        font-size:12px;
        font-weight:900;
        text-transform:uppercase;
        letter-spacing:.05em;
      }

      .control-stat-card strong{
        display:block;
        margin-top:8px;
        color:#111827;
        font-size:21px;
        line-height:1.08;
        font-weight:950;
      }

      .control-stat-card small{
        display:block;
        margin-top:6px;
        color:#64748b;
        font-size:12px;
      }

      .control-panel{
        padding:16px;
        border-radius:24px;
        background:#fff;
        border:1px solid rgba(148,163,184,.22);
        box-shadow:0 14px 34px rgba(15,23,42,.09);
        margin:0 0 14px;
      }

      .control-panel h2{
        margin:0 0 6px;
        font-size:18px;
        color:#111827;
      }

      .control-panel p{
        margin:0 0 12px;
        color:#64748b !important;
        font-size:14px;
        line-height:1.35;
      }

      #controlMessageInput{
        width:100%;
        box-sizing:border-box;
        min-height:86px;
        padding:13px 14px;
        border-radius:18px;
        border:1px solid #cbd5e1;
        background:#f8fafc;
        color:#111827;
        font-size:16px;
        resize:vertical;
        outline:none;
      }

      #controlMessageInput:focus{
        border-color:#10b981;
        box-shadow:0 0 0 4px rgba(16,185,129,.16);
        background:#fff;
      }

      .control-main-btn{
        width:100%;
        min-height:52px;
        margin-top:10px;
        border:0;
        border-radius:18px;
        background:linear-gradient(135deg,#059669,#047857);
        color:#fff;
        font-weight:950;
        font-size:16px;
        box-shadow:0 14px 28px rgba(5,150,105,.24);
      }

      .control-examples{
        display:flex;
        gap:8px;
        overflow-x:auto;
        padding:12px 0 2px;
        -webkit-overflow-scrolling:touch;
      }

      .control-examples button{
        flex:0 0 auto;
        border:1px solid #d1fae5;
        background:#ecfdf5;
        color:#065f46;
        border-radius:999px;
        padding:9px 12px;
        font-size:13px;
        font-weight:800;
        white-space:nowrap;
      }

      .control-section-head{
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        margin-bottom:10px;
      }

      .control-section-head h2{
        margin:0;
      }

      .control-section-head span{
        color:#64748b;
        font-size:12px;
        font-weight:800;
      }

      .control-table-wrap{
        overflow-x:auto;
        -webkit-overflow-scrolling:touch;
      }

      .control-table{
        width:100%;
        border-collapse:separate;
        border-spacing:0 8px;
        font-size:13px;
      }

      .control-table th{
        text-align:left;
        color:#64748b;
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:.05em;
        padding:0 8px 4px;
      }

      .control-table td{
        background:#f8fafc;
        padding:10px 8px;
        color:#111827;
        font-weight:800;
      }

      .control-table td:first-child{
        border-radius:12px 0 0 12px;
      }

      .control-table td:last-child{
        border-radius:0 12px 12px 0;
      }

      .control-table .ok{
        color:#047857;
      }

      .control-table .warn{
        color:#b45309;
      }

      .control-chat-history{
        display:flex;
        flex-direction:column;
        gap:10px;
        max-height:48dvh;
        overflow-y:auto;
        padding:4px;
        -webkit-overflow-scrolling:touch;
      }

      .control-chat-row{
        display:flex;
        flex-direction:column;
        gap:6px;
      }

      .control-bubble{
        max-width:88%;
        padding:10px 12px;
        border-radius:18px;
        font-size:14px;
        line-height:1.32;
        white-space:normal;
      }

      .control-bubble small{
        display:block;
        margin-bottom:4px;
        font-size:11px;
        font-weight:900;
        opacity:.72;
        text-transform:uppercase;
        letter-spacing:.05em;
      }

      .control-bubble.user{
        align-self:flex-end;
        background:#dcfce7;
        color:#064e3b;
        border-bottom-right-radius:6px;
      }

      .control-bubble.bot{
        align-self:flex-start;
        background:#eef2ff;
        color:#1e1b4b;
        border-bottom-left-radius:6px;
      }

      .control-bubble.bot.pendiente{
        background:#fffbeb;
        color:#78350f;
      }

      .control-empty{
        padding:18px;
        border-radius:18px;
        background:#f8fafc;
        color:#64748b;
        text-align:center;
        font-weight:800;
      }

      .small-link.danger{
        color:#b91c1c !important;
      }

      .floating-control{
        background:rgba(5,150,105,.82) !important;
      }

      .bottom-nav .nav-control.active .nav-icon,
      .bottom-nav .nav-control.active small{
        color:#34d399 !important;
      }

      @media (max-width:380px){
        .control-page{
          padding-left:12px !important;
          padding-right:12px !important;
        }

        .control-stats-grid{
          grid-template-columns:1fr;
        }

        .control-bubble{
          max-width:94%;
        }
      }

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


  /* =========================================================
     Conecta Control v6.5.4 — Piloto Postres Fer
     Módulo aislado. No toca Supabase, publicaciones ni mensajes.
     ========================================================= */

  const CONTROL_STORAGE_KEY = 'conecta_control_postres_fer_records';
  const CONTROL_BUSINESS_ID = 'postres_fer';

  function controlNormalize(value=''){
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[“”"']/g,'')
      .replace(/\s+/g,' ')
      .trim();
  }

  function controlMoney(value=0){
    const n = Number(value || 0);
    return n.toLocaleString('es-MX', {style:'currency', currency:'MXN', maximumFractionDigits:0});
  }

  function controlNumber(value=0){
    const n = Number(value || 0);
    return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.00$/,'');
  }

  function getControlCatalog(){
    return {
      limon: {
        clave:'limon',
        nombre:'Pay de limón',
        precio:25,
        aliases:['limon','limones','pay de limon','pays de limon','pay limon','pays limon']
      },
      arroz: {
        clave:'arroz',
        nombre:'Arroz con leche',
        precio:25,
        aliases:['arroz','arroz con leche']
      },
      queso: {
        clave:'queso',
        nombre:'Pay de queso',
        precio:25,
        aliases:['queso','pay de queso','pays de queso','pay queso','pays queso']
      },
      fresas: {
        clave:'fresas',
        nombre:'Fresas con crema',
        precio:35,
        aliases:['fresas con crema','fresa con crema','fresas','fresa']
      }
    };
  }

  function getControlExamples(){
    return [
      'Vendí 3 limón, 2 queso y 1 fresas',
      'Compré leche 120, azúcar 80 y vasos 150',
      'Produje 20 limón, 15 queso y 10 arroz',
      'Conté 8 limón, 5 queso y 3 arroz',
      'Merma 2 arroz',
      'Pedido para mañana: Ana quiere 10 queso',
      'Me deben 150 de Ana',
      'Cobré 200 de Ana',
      'Nota: mañana comprar más vasos'
    ];
  }

  function detectControlIntent(message=''){
    const text = controlNormalize(message);
    if(!text) return 'NOTA';
    if(/^nota\b/.test(text)) return 'NOTA';
    if(/\b(cobre|cobro|cobrado|me pagaron|pagaron)\b/.test(text)) return 'COBRO';
    if(/\b(deben|me deben|debe|pendiente de pago|por cobrar)\b/.test(text)) return 'DEUDA';
    if(/\b(pedido|pidieron|me pidieron|encargo|encargaron|quiere|quieren)\b/.test(text)) return 'PEDIDO';
    if(/\b(merma|mermas|se echaron a perder|echaron a perder|se perdieron|perdi|perdio|desperdicie|desperdicio)\b/.test(text)) return 'MERMA';
    if(/\b(conte|contar|conteo|contado|me quedan|quedan|tengo en existencia|existencia real)\b/.test(text)) return 'CONTEO_REAL';
    if(/\b(produje|produccion|hice|prepare|preparamos|salieron del horno|elabore)\b/.test(text)) return 'PRODUCCION';
    if(/\b(compre|gaste|gasto|pague|pago|inverti|inversion)\b/.test(text)) return 'GASTO';
    if(/\b(vendi|vendimos|venta|ventas|vender|salieron|se vendieron)\b/.test(text)) return 'VENTA';
    return 'NOTA';
  }

  function controlProductAliases(){
    const catalog = getControlCatalog();
    return Object.entries(catalog).map(([key, product]) => {
      const aliases = [...new Set([key, product.nombre, ...(product.aliases || [])].map(controlNormalize))]
        .filter(Boolean)
        .sort((a,b)=>b.length-a.length)
        .map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      return {key, product, pattern: aliases.join('|')};
    });
  }

  function extractProductItems(message='', tipo='VENTA'){
    const text = controlNormalize(message).replace(/,/g,' , ').replace(/\by\b/g,' y ');
    const found = [];
    const seen = new Set();

    controlProductAliases().forEach(({key, product, pattern}) => {
      const patterns = [
        new RegExp(`(?:^|[\\s,;])([0-9]+(?:[\\.,][0-9]+)?)\\s*(?:de\\s+)?(?:${pattern})(?:s)?\\b`, 'i'),
        new RegExp(`(?:^|[\\s,;])(?:${pattern})(?:s)?\\s*([0-9]+(?:[\\.,][0-9]+)?)\\b`, 'i')
      ];

      let qty = 0;
      for(const rx of patterns){
        const match = text.match(rx);
        if(match){
          qty = Number(String(match[1] || '0').replace(',','.'));
          break;
        }
      }

      if(qty > 0 && !seen.has(key)){
        seen.add(key);
        const unit = ['VENTA','PEDIDO'].includes(tipo) ? product.precio : 0;
        found.push({
          productoClave:key,
          productoNombre:product.nombre,
          cantidad:qty,
          precioUnitario:unit,
          total:qty * unit
        });
      }
    });

    return found;
  }

  function extractExpenseItems(message=''){
    const clean = String(message || '').trim()
      .replace(/^(compr[eé]|gast[eé]|gasto|pagu[eé]|invert[ií])\s+/i,'')
      .replace(/\s+/g,' ');

    const parts = clean
      .split(/,|\sy\s/gi)
      .map(p => p.trim())
      .filter(Boolean);

    const items = [];
    parts.forEach(part => {
      const match = part.match(/^(.+?)\s+\$?\s*([0-9]+(?:[\.,][0-9]+)?)\s*$/i);
      if(match){
        const concepto = match[1].trim();
        const monto = Number(String(match[2]).replace(',','.'));
        if(concepto && monto > 0){
          items.push({concepto, monto});
        }
      }
    });

    if(!items.length){
      const totalMatch = clean.match(/\$?\s*([0-9]+(?:[\.,][0-9]+)?)/);
      const total = totalMatch ? Number(String(totalMatch[1]).replace(',','.')) : 0;
      if(total > 0) items.push({concepto:'Gasto general', monto:total});
    }

    return items;
  }

  function extractControlAmount(message=''){
    const match = String(message || '').match(/\$?\s*([0-9]+(?:[\.,][0-9]+)?)/);
    return match ? Number(String(match[1]).replace(',','.')) : 0;
  }

  function extractControlPerson(message=''){
    const raw = String(message || '').trim();
    const byColon = raw.match(/:\s*([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s]{1,40}?)\s+(?:quiere|pidi[oó]|pide|encarg[oó])/);
    if(byColon) return byColon[1].trim();

    const byDe = raw.match(/\b(?:de|a|cliente)\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]{1,30})\b/);
    if(byDe) return byDe[1].trim();

    return '';
  }

  function extractDeliveryText(message=''){
    const text = controlNormalize(message);
    const options = ['hoy','manana','mañana','pasado manana','lunes','martes','miercoles','jueves','viernes','sabado','domingo','fin de semana'];
    const found = options.find(o => text.includes(controlNormalize(o)));
    return found ? (found === 'manana' ? 'mañana' : found) : '';
  }

  function parseControlMessage(message=''){
    const original = String(message || '').trim();
    const tipo = detectControlIntent(original);
    const productItems = extractProductItems(original, tipo);
    const expenseItems = tipo === 'GASTO' ? extractExpenseItems(original) : [];
    const amount = ['COBRO','DEUDA'].includes(tipo) ? extractControlAmount(original) : 0;
    const person = ['COBRO','DEUDA','PEDIDO'].includes(tipo) ? extractControlPerson(original) : '';
    const fechaEntregaTexto = tipo === 'PEDIDO' ? extractDeliveryText(original) : '';

    let total = 0;
    if(tipo === 'VENTA') total = productItems.reduce((sum,item)=>sum + item.total, 0);
    if(tipo === 'GASTO') total = expenseItems.reduce((sum,item)=>sum + item.monto, 0);
    if(['COBRO','DEUDA'].includes(tipo)) total = amount;

    let estado = 'confirmado';
    let alerta = '';

    if(['VENTA','PRODUCCION','CONTEO_REAL','MERMA','PEDIDO'].includes(tipo) && !productItems.length){
      estado = 'pendiente';
      alerta = tipo === 'VENTA'
        ? 'Entendí que fue una venta, pero falta cantidad y producto. Ejemplo: Vendí 3 limón.'
        : tipo === 'PEDIDO'
          ? 'Entendí que fue un pedido, pero falta producto o cantidad. Ejemplo: Pedido para mañana: Ana quiere 10 queso.'
          : 'Falta cantidad y producto. Ejemplo: Produje 10 limón o Conté 8 queso.';
    }

    if(tipo === 'GASTO' && !expenseItems.length){
      estado = 'pendiente';
      alerta = 'Entendí que fue un gasto, pero falta monto. Ejemplo: Compré leche 120.';
    }

    if(['COBRO','DEUDA'].includes(tipo) && !amount){
      estado = 'pendiente';
      alerta = tipo === 'COBRO'
        ? 'Entendí que fue un cobro, pero falta monto. Ejemplo: Cobré 200 de Ana.'
        : 'Entendí que es deuda, pero falta monto. Ejemplo: Me deben 150 de Ana.';
    }

    return {
      tipo,
      mensajeOriginal:original,
      items:productItems,
      gastos:expenseItems,
      total,
      persona:person,
      fechaEntregaTexto,
      estado,
      alerta
    };
  }

  function controlResponseForRecord(record){
    if(record.alerta) return record.alerta;
    if(record.tipo === 'VENTA'){
      const lines = record.items.map(i => `${controlNumber(i.cantidad)} ${i.productoNombre} = ${controlMoney(i.total)}`);
      return `Listo, registré venta:\n${lines.join('\n')}\nTotal: ${controlMoney(record.total)}.`;
    }
    if(record.tipo === 'GASTO'){
      const lines = record.gastos.map(g => `${g.concepto}: ${controlMoney(g.monto)}`);
      return `Listo, registré gasto:\n${lines.join('\n')}\nTotal gastos: ${controlMoney(record.total)}.`;
    }
    if(record.tipo === 'PRODUCCION'){
      return `Producción registrada:\n${record.items.map(i=>`+${controlNumber(i.cantidad)} ${i.productoNombre}`).join('\n')}.`;
    }
    if(record.tipo === 'CONTEO_REAL'){
      return `Conteo real registrado:\n${record.items.map(i=>`${controlNumber(i.cantidad)} ${i.productoNombre}`).join('\n')}.`;
    }
    if(record.tipo === 'MERMA'){
      return `Merma registrada:\n${record.items.map(i=>`${controlNumber(i.cantidad)} ${i.productoNombre}`).join('\n')}.`;
    }
    if(record.tipo === 'PEDIDO'){
      const who = record.persona ? ` para ${record.persona}` : '';
      const when = record.fechaEntregaTexto ? ` (${record.fechaEntregaTexto})` : '';
      return `Pedido pendiente registrado${who}${when}:\n${record.items.map(i=>`${controlNumber(i.cantidad)} ${i.productoNombre}`).join('\n')}.`;
    }
    if(record.tipo === 'COBRO'){
      return `Cobro registrado${record.persona ? ` de ${record.persona}` : ''}: ${controlMoney(record.total)}.`;
    }
    if(record.tipo === 'DEUDA'){
      return `Deuda registrada${record.persona ? ` de ${record.persona}` : ''}: ${controlMoney(record.total)}.`;
    }
    return 'Nota guardada.';
  }

  function createControlRecord(message=''){
    const parsed = parseControlMessage(message);
    const record = {
      id:uid('ctrl'),
      negocioId:CONTROL_BUSINESS_ID,
      fecha:new Date().toISOString(),
      origen:'simulador_whatsapp',
      ...parsed
    };
    record.respuesta = controlResponseForRecord(record);
    return record;
  }

  function getControlRecords(){
    try{
      const raw = JSON.parse(localStorage.getItem(CONTROL_STORAGE_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    }catch{
      return [];
    }
  }

  function saveControlRecord(record){
    const records = getControlRecords();
    records.push(record);
    localStorage.setItem(CONTROL_STORAGE_KEY, JSON.stringify(records));
    return records;
  }

  function clearControlRecords(){
    localStorage.removeItem(CONTROL_STORAGE_KEY);
  }

  function controlIsToday(iso=''){
    try{
      const d = new Date(iso);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }catch{
      return false;
    }
  }

  function calculateControlDashboard(records=getControlRecords()){
    const catalog = getControlCatalog();
    const confirmed = records.filter(r => r && r.estado === 'confirmado');
    const today = confirmed.filter(r => controlIsToday(r.fecha));
    const productStats = {};
    const inventory = {};
    const latestCount = {};

    Object.keys(catalog).forEach(key => {
      productStats[key] = {clave:key, nombre:catalog[key].nombre, vendidos:0, ventas:0};
      inventory[key] = {clave:key, nombre:catalog[key].nombre, producido:0, vendido:0, merma:0, esperado:0, conteo:null, diferencia:null};
    });

    const ventas = today.filter(r=>r.tipo==='VENTA').reduce((sum,r)=>sum + Number(r.total || 0), 0);
    const gastos = today.filter(r=>r.tipo==='GASTO').reduce((sum,r)=>sum + Number(r.total || 0), 0);
    const cobros = today.filter(r=>r.tipo==='COBRO').reduce((sum,r)=>sum + Number(r.total || 0), 0);
    const deudas = confirmed.filter(r=>r.tipo==='DEUDA').reduce((sum,r)=>sum + Number(r.total || 0), 0);
    const pedidos = confirmed.filter(r=>r.tipo==='PEDIDO');
    const notas = confirmed.filter(r=>r.tipo==='NOTA');

    confirmed.forEach(r => {
      (r.items || []).forEach(item => {
        const key = item.productoClave;
        if(!inventory[key]) return;
        const qty = Number(item.cantidad || 0);

        if(r.tipo === 'VENTA'){
          inventory[key].vendido += qty;
          productStats[key].vendidos += qty;
          productStats[key].ventas += Number(item.total || 0);
        }
        if(r.tipo === 'PRODUCCION') inventory[key].producido += qty;
        if(r.tipo === 'MERMA') inventory[key].merma += qty;
        if(r.tipo === 'CONTEO_REAL') latestCount[key] = qty;
      });
    });

    Object.keys(inventory).forEach(key => {
      inventory[key].esperado = inventory[key].producido - inventory[key].vendido - inventory[key].merma;
      if(Object.prototype.hasOwnProperty.call(latestCount, key)){
        inventory[key].conteo = latestCount[key];
        inventory[key].diferencia = inventory[key].esperado - latestCount[key];
      }
    });

    const productList = Object.values(productStats).sort((a,b)=>b.vendidos-a.vendidos);
    const topProduct = productList.find(p => p.vendidos > 0);

    return {
      totalRegistros:records.length,
      pendientes:records.filter(r=>r.estado==='pendiente').length,
      ventas,
      gastos,
      ganancia:ventas - gastos,
      cobros,
      deudas,
      productoMasVendido: topProduct ? `${topProduct.nombre} (${controlNumber(topProduct.vendidos)})` : 'Sin ventas',
      productStats:productList,
      inventory:Object.values(inventory),
      mermas:confirmed.filter(r=>r.tipo==='MERMA'),
      pedidos,
      notas,
      recientes:records.slice().reverse().slice(0, 18)
    };
  }

  function controlCard(label, value, hint=''){
    return `<article class="control-stat-card"><span>${esc(label)}</span><strong>${esc(value)}</strong>${hint ? `<small>${esc(hint)}</small>` : ''}</article>`;
  }

  function controlInventoryTable(stats){
    const rows = stats.inventory.map(item => {
      const diff = item.diferencia;
      const diffText = diff === null ? 'Sin conteo' : (diff === 0 ? 'Cuadra' : (diff > 0 ? `Faltan ${controlNumber(diff)}` : `Sobran ${controlNumber(Math.abs(diff))}`));
      return `<tr>
        <td>${esc(item.nombre)}</td>
        <td>${controlNumber(item.esperado)}</td>
        <td>${item.conteo === null ? '—' : controlNumber(item.conteo)}</td>
        <td class="${diff === 0 ? 'ok' : (diff === null ? '' : 'warn')}">${esc(diffText)}</td>
      </tr>`;
    }).join('');
    return `<div class="control-table-wrap"><table class="control-table"><thead><tr><th>Producto</th><th>Esperado</th><th>Contado</th><th>Diferencia</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function controlRecordMarkup(record){
    const status = record.estado === 'pendiente' ? 'pendiente' : 'confirmado';
    return `<div class="control-chat-row">
      <div class="control-bubble user"><small>${esc(record.tipo)} · ${new Date(record.fecha).toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'})}</small>${esc(record.mensajeOriginal)}</div>
      <div class="control-bubble bot ${status}"><small>Conecta Control</small>${esc(record.respuesta || '').replace(/\n/g,'<br>')}</div>
    </div>`;
  }

  function renderConectaControlPage(){
    const records = getControlRecords();
    const stats = calculateControlDashboard(records);
    const examples = getControlExamples().map(ex => `<button type="button" data-control-example="${esc(ex)}">${esc(ex)}</button>`).join('');

    return shell(`<section class="control-page">
      <div class="control-hero">
        <button type="button" class="small-link control-back" data-nav="/">← Volver</button>
        <div>
          <p class="control-kicker">Piloto · Postres Fer</p>
          <h1>Conecta Control</h1>
          <p>Simulador tipo WhatsApp para registrar ventas, gastos, producción, mermas, conteos, pedidos, cobros y deudas.</p>
        </div>
      </div>

      <section class="control-stats-grid">
        ${controlCard('Ventas hoy', controlMoney(stats.ventas), 'Ingresos registrados')}
        ${controlCard('Gastos hoy', controlMoney(stats.gastos), 'Egresos registrados')}
        ${controlCard('Ganancia estimada', controlMoney(stats.ganancia), 'Ventas - gastos')}
        ${controlCard('Producto estrella', stats.productoMasVendido, 'Más vendido')}
        ${controlCard('Cobros hoy', controlMoney(stats.cobros), 'Pagos recibidos')}
        ${controlCard('Deudas', controlMoney(stats.deudas), 'Pendientes registrados')}
      </section>

      <section class="control-panel">
        <h2>Mensaje tipo WhatsApp</h2>
        <p>Escribe como hablarías normalmente: “Vendí 3 limón, 2 queso y 1 fresas”.</p>
        <textarea id="controlMessageInput" rows="3" placeholder="Ej: Vendí 3 limón, 2 queso y 1 fresas"></textarea>
        <button type="button" class="control-main-btn" data-control-process>Procesar mensaje</button>
        <div class="control-examples">${examples}</div>
      </section>

      <section class="control-panel">
        <div class="control-section-head"><h2>Inventario esperado vs conteo real</h2><span>${stats.totalRegistros} registros</span></div>
        ${controlInventoryTable(stats)}
      </section>

      <section class="control-panel">
        <div class="control-section-head"><h2>Historial del asistente</h2><button type="button" class="small-link danger" data-control-clear>Limpiar registros de prueba</button></div>
        <div class="control-chat-history">
          ${stats.recientes.length ? stats.recientes.map(controlRecordMarkup).join('') : '<div class="control-empty">Todavía no hay movimientos. Prueba con un ejemplo.</div>'}
        </div>
      </section>
    </section>`);
  }

  function processControlMessage(){
    const input = document.getElementById('controlMessageInput');
    const message = String(input?.value || '').trim();
    if(!message) return toast('Escribe un mensaje para procesar.');
    const record = createControlRecord(message);
    saveControlRecord(record);
    toast(record.estado === 'confirmado' ? 'Movimiento registrado.' : 'Registro pendiente de datos.');
    render();
    setTimeout(() => {
      const history = document.querySelector('.control-chat-history');
      history?.scrollTo?.({top:0, behavior:'smooth'});
      document.getElementById('controlMessageInput')?.focus?.({preventScroll:true});
    }, 80);
  }

  function clearControlRecordsWithConfirm(){
    if(!confirm('¿Borrar todos los registros de prueba de Conecta Control?')) return;
    clearControlRecords();
    toast('Registros de prueba borrados.');
    render();
  }


  function shell(content){
    return `
      <main class="app-page"><div class="top-space"></div>${content}</main>
      <nav class="bottom-nav">
        <button class="nav-item ${state.route==='/'?'active':''}" data-nav="/"><span class="nav-icon">🏠</span><small>Inicio</small></button>
        <button class="nav-item ${state.route==='/siguiendo'?'active':''}" data-nav="/siguiendo"><span class="nav-icon">🫂</span><small>Siguiendo</small></button>
        <button class="nav-plus" data-pick>+</button>
        <button class="nav-item ${state.route==='/mensajes'?'active':''}" data-nav="/mensajes"><span class="nav-icon nav-icon-wrap">✉️${unreadBadge()}</span><small>Mensajes</small></button>
        <button class="nav-item nav-control ${state.route==='/control'?'active':''}" data-nav="/control"><span class="nav-icon">📊</span><small>Control</small></button>
        <button class="nav-item ${state.route==='/perfil'?'active':''}" data-nav="/perfil"><span class="nav-icon">👤</span><small>Perfil</small></button>
      </nav>
      <input id="mediaPicker" type="file" accept="image/*,video/*" multiple hidden>
      <input id="directMediaPicker" type="file" accept="image/*,video/*" multiple hidden>
      ${videoViewerMarkup()}
    `;
  }

  function homeHeader(){
    const municipio = municipioLabel();
    return `<section class="glass-top tiktok-top visual-top floating-post-menu">
      <div class="floating-post-nav" aria-label="Menú flotante de publicaciones">
        <button class="floating-zone ${state.topTab === 'municipio' ? 'active' : ''}" data-top-tab="municipio" title="Publicaciones cerca de ${esc(municipio)}">${esc(municipio)}</button>
        <button class="floating-icon floating-cart ${state.route === '/tienda' ? 'active' : ''}" data-open-store="${esc(userId())}" title="Tienda / mandado" aria-label="Tienda y mandados">🛒</button>
        <button class="floating-icon floating-heart ${state.topTab === 'para-ti' ? 'active' : ''}" data-top-tab="para-ti" title="Intereses / Para ti" aria-label="Intereses para ti">🎯</button>
        <button class="floating-icon floating-search" data-toggle-search title="Buscar" aria-label="Buscar">🔎</button>
        <button class="floating-icon floating-control" data-nav="/control" title="Conecta Control" aria-label="Conecta Control">📊</button>
      </div>
      ${state.searchOpen ? `<div class="tiktok-search-panel visual-search-panel floating-search-panel"><span>🔎</span><input id="searchInput" type="search" inputmode="search" value="${esc(state.query)}" placeholder="Buscar: refrigerador, pan, viaje..." autocomplete="off" enterkeyhint="search"><button type="button" data-clear-search>${state.query ? 'Limpiar' : 'Cerrar'}</button></div>` : ''}
      <div class="tiktok-filter-row visual-filter-row floating-filter-row">
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
  function feedMarkup(){
    try{
      const posts=filteredPosts();
      const cards = posts.map(safePostCard).filter(Boolean).join('');
      return cards || emptyState('No encontré publicaciones','Prueba otra búsqueda o publica algo con el botón +.');
    }catch(error){
      console.warn('[Conecta] feedMarkup recuperado', error);
      try{ set('cs_v6480_last_feed_error', {message:error?.message || String(error), stack:String(error?.stack || '').slice(0,600), at:new Date().toISOString()}); }catch{}
      const fallbackPosts = (Array.isArray(state.posts) ? state.posts : []).slice(0,20);
      const cards = fallbackPosts.map(safePostCard).filter(Boolean).join('');
      return cards || emptyState('Cargando publicaciones','Vuelve a Inicio o recarga la app.');
    }
  }
  function updateFeedOnly(){ const feed=document.getElementById('feed'); if(feed) feed.innerHTML=feedMarkup(); const title=document.getElementById('feedTitle'); if(title) title.innerHTML=feedTitleMarkup(); bindDynamicFeedControls(); setupInternalVideos(); setupGalleries(); }
  function serviceAreaText(post){
    return String(post?.serviceArea || post?.coverageArea || post?.zone || '').trim();
  }

  function isWideServiceArea(value){
    const z = normalizeSearchText(value);
    if(!z) return false;
    return ['todo mexico','todo el pais','nacional','mundial','mundo','global','online','en linea','virtual','remoto','a distancia','alrededores'].some(k => z.includes(k));
  }

  function categoryClass(cat){ return `chip-${normalizeCategory(cat).toLowerCase()}`; }
  function isFollowing(ownerId){ return follows().includes(ownerId); }
  function shortDescription(text, max=118){
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if(clean.length <= max) return clean;
    return clean.slice(0, max).trim() + '...';
  }

  function postCaptionText(post){
    const description = String(post?.description || post?.details || post?.content || post?.body || '').trim();
    const title = String(post?.title || '').trim();
    // Si la descripción está vacía o es igual al título, usamos lo que haya.
    if(description && description !== title) return description;
    return description || title || '';
  }

  function compactDescription(text, max=68){
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if(clean.length <= max) return clean;
    return clean.slice(0, max).trim();
  }

  function isLongDescription(text){
    const raw = String(text || '').trim();
    return raw.replace(/\s+/g, ' ').length > 68 || raw.split(/\n/).filter(Boolean).length > 1;
  }

  function isDescriptionExpanded(postId){
    return !!state.expandedDescriptions?.has(String(postId));
  }

  function descriptionMarkup(post){
    const raw = postCaptionText(post);
    if(!raw) return '';

    const long = isLongDescription(raw);
    const expanded = isDescriptionExpanded(post.id);

    if(!long){
      return `<div class="post-description-short">${esc(raw)}</div>`;
    }

    if(expanded){
      return `<div class="post-description-expanded" data-description-box="${esc(post.id)}" tabindex="0">
        <div class="description-full-text">${esc(raw)}</div>
        <button type="button" class="description-toggle hide-toggle" data-toggle-description="${esc(post.id)}">...ocultar</button>
      </div>`;
    }

    return `<div class="post-description-collapsed">
      <div class="description-preview">${esc(compactDescription(raw))}</div>
      <button type="button" class="description-toggle read-toggle" data-toggle-description="${esc(post.id)}">...leer</button>
    </div>`;
  }

  function toggleDescription(postId){
    const id = String(postId || '');
    if(!id) return;
    if(!state.expandedDescriptions) state.expandedDescriptions = new Set();
    if(state.expandedDescriptions.has(id)){
      state.expandedDescriptions.delete(id);
      state.userReadingUntil = Date.now() + 2500;
    }else{
      state.expandedDescriptions.add(id);
      state.userReadingUntil = Date.now() + 60000;
    }
    render();
    setTimeout(() => {
      const safeId = (window.CSS && CSS.escape) ? CSS.escape(id) : id.replace(/["\\]/g, '\\$&');
      const box = document.querySelector(`[data-description-box="${safeId}"]`);
      box?.focus?.({preventScroll:true});
    }, 80);
  }

  function heartIcon(postId){
    return likedPostIds().includes(String(postId)) ? '⭐' : '☆';
  }

  function heartClass(postId){
    return likedPostIds().includes(String(postId)) ? 'liked' : '';
  }



  function statusLabel(post){
    if(norm(post.cloudStatus)==='subiendo') return '<span class="chip status-chip">Publicando...</span>';
    if(norm(post.cloudStatus)==='local') return '<span class="chip status-chip local">Guardada en este dispositivo</span>';
    if(norm(post.cloudStatus)==='publica') return '<span class="chip status-chip publica">Publicada</span>';
    return '';
  }

  function activeGalleryIndex(postId){
    const saved = state.galleryIndex && state.galleryIndex[String(postId)];
    const n = Number(saved);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }

  function itemHasOwnFrame(item={}){
    return item.mediaFit !== undefined || item.fit !== undefined ||
      item.mediaScale !== undefined || item.scale !== undefined ||
      item.mediaX !== undefined || item.x !== undefined ||
      item.mediaY !== undefined || item.y !== undefined;
  }

  function cleanItemFrame(item={}){
    // Las fotos de un carrusel NO deben heredar el encuadre general de la publicación.
    // Si una foto no tiene encuadre propio, inicia limpia y centrada.
    return cleanMediaFrame(itemHasOwnFrame(item) ? {
      mediaFit: item.mediaFit ?? item.fit,
      mediaScale: item.mediaScale ?? item.scale,
      mediaX: item.mediaX ?? item.x,
      mediaY: item.mediaY ?? item.y
    } : {fit:'contain', scale:1, x:50, y:50});
  }

  function mediaFrameForItem(post, item){
    const f = cleanItemFrame(item || {});
    return mediaFrameVars(f);
  }

  function galleryImageItems(post){
    const items = Array.isArray(post.mediaItems) ? post.mediaItems.filter(item => item && (item.mediaUrl || item.mediaRef || item.mediaData || item.mediaPreviewUrl)) : [];
    return items.filter(item => String(item.mediaType || post.mediaType || 'image').toLowerCase() !== 'video');
  }

  function galleryDotsMarkup(post){
    const imageItems = galleryImageItems(post);
    if(imageItems.length <= 1) return '';
    const active = Math.min(imageItems.length - 1, activeGalleryIndex(post.id));
    return `<div class="gallery-counter media-gallery-counter" data-gallery-dots="${esc(post.id)}" aria-label="Foto ${active + 1} de ${imageItems.length}">
      <span class="gallery-counter-arrow" aria-hidden="true">‹</span>
      <span class="gallery-counter-text" data-gallery-count="${esc(post.id)}">${active + 1} / ${imageItems.length}</span>
      <span class="gallery-counter-arrow" aria-hidden="true">›</span>
    </div>`;
  }

  function mediaMarkup(post){
    const imageItems = galleryImageItems(post);

    if(imageItems.length > 1){
      const active = Math.min(imageItems.length - 1, activeGalleryIndex(post.id));
      if(state.directFramePostId === post.id){
        const item = imageItems[active];
        const src = resolveMediaItem(item);
        return src ? `<div class="direct-frame-single" data-direct-frame-single="${esc(post.id)}"><img class="framed-media" style="${mediaFrameForItem(post, item)}" src="${esc(src)}" alt="${esc(post.title || 'Foto')} ${active+1}" loading="eager"></div>` : '';
      }
      const slides = imageItems.map((item, index) => {
        const src = resolveMediaItem(item);
        return src ? `<img class="framed-media" style="${mediaFrameForItem(post, item)}" src="${esc(src)}" alt="${esc(post.title || 'Foto')} ${index+1}" loading="${index ? 'lazy' : 'eager'}">` : '';
      }).join('');
      return `<div class="gallery-stage" data-gallery-stage="${esc(post.id)}">
        <div class="media-carousel" data-gallery="${esc(post.id)}" data-gallery-total="${imageItems.length}">
          ${slides}
        </div>
      </div>`;
    }

    const media = resolveMedia(post);
    if(isVideoPost(post)){
      if(post.mediaUrl){
        return `<div class="video-inline-wrap clean-video" data-video-wrap="${esc(post.id)}">
          <video class="feed-video-player framed-media" style="${mediaFrameVars(post)}" src="${esc(post.mediaUrl)}" autoplay muted loop playsinline webkit-playsinline preload="auto" data-open-video="${esc(post.id)}" data-video-id="${esc(post.id)}"></video>
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

    if(media) return `<img class="framed-media" style="${mediaFrameVars(post)}" src="${esc(media)}" alt="${esc(post.title || 'Publicación')}">`;
    return '<div class="no-media">Conecta Servicios</div>';
  }

  function directEditMarkup(post){
    const category = normalizeCategory(post.category);
    return `<form class="direct-edit-panel" data-direct-edit-panel="${esc(post.id)}">
      <div class="direct-edit-head compact">
        <strong>Editar publicación</strong>
      </div>
      <label>Título</label>
      <input id="directTitle-${esc(post.id)}" data-direct-edit-title="${esc(post.id)}" value="${esc(post.title || '')}" placeholder="Título de la publicación">
      <label>Descripción</label>
      <textarea id="directDescription-${esc(post.id)}" data-direct-edit-description="${esc(post.id)}" rows="5" placeholder="Describe lo que vendes, ofreces o necesitas">${esc(post.description || '')}</textarea>
      <div class="direct-edit-grid">
        <div>
          <label>Zona / cobertura</label>
          <input id="directZone-${esc(post.id)}" data-direct-edit-zone="${esc(post.id)}" value="${esc(serviceAreaText(post) || '')}" placeholder="Ej. Toluca y sus alrededores / En línea mundial" autocomplete="off">
        </div>
        <div>
          <label>Categoría</label>
          <select id="directCategory-${esc(post.id)}" data-direct-edit-category="${esc(post.id)}">
            ${CATEGORIES.map(c=>`<option value="${esc(c)}" ${category===c?'selected':''}>${esc(c)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="direct-edit-actions">
        <button type="button" class="direct-save-btn" data-direct-edit-save="${esc(post.id)}">${state.directEditSaving ? 'Guardando...' : 'Guardar y volver'}</button>
        <button type="button" class="direct-cancel-btn" data-direct-edit-cancel="${esc(post.id)}">Cancelar</button>
      </div>

    </form>`;
  }

  function startDirectEdit(postId){
    const post = state.posts.find(p => String(p.id) === String(postId));
    if(!post || !canFramePostAsAdmin(post)) return toast('Solo puedes editar publicaciones propias o activar modo admin.');
    state.directFramePostId = '';
    state.directMediaPostId = '';
    state.directEditPostId = String(postId);
    state.directEditSaving = false;
    render();
    setTimeout(() => {
      const panel = document.querySelector(`[data-direct-edit-panel="${cssEscape(postId)}"]`);
      panel?.scrollIntoView({block:'center', behavior:'smooth'});
      document.querySelector(`[data-direct-edit-title="${cssEscape(postId)}"]`)?.focus({preventScroll:true});
    }, 100);
  }

  function cancelDirectEdit(postId){
    if(state.directEditPostId !== String(postId)) return;
    state.directEditPostId = '';
    state.directEditSaving = false;
    render();
    scrollBackToPost(postId);
  }

  function readDirectEditForm(postId){
    const id = cssEscape(postId);
    const title = document.querySelector(`[data-direct-edit-title="${id}"]`)?.value.trim() || '';
    const description = document.querySelector(`[data-direct-edit-description="${id}"]`)?.value.trim() || '';
    const zone = document.querySelector(`[data-direct-edit-zone="${id}"]`)?.value.trim() || '';
    const category = normalizeCategory(document.querySelector(`[data-direct-edit-category="${id}"]`)?.value || 'VENDO');
    return {title, description, zone, category};
  }

  async function saveDirectEdit(postId){
    const post = state.posts.find(p => String(p.id) === String(postId));
    if(!post || !canFramePostAsAdmin(post)) return toast('Solo puedes guardar publicaciones propias o activar modo admin.');
    const form = readDirectEditForm(postId);
    if(!form.title && !form.description) return toast('Agrega título o descripción.');
    if(!form.zone) return toast('Agrega zona o municipio.');

    const nextTitle = (form.title || titleFrom(form.description)).slice(0, 90);
    const updated = normalizePost({
      ...post,
      title: nextTitle,
      description: form.description || post.description || nextTitle,
      zone: form.zone,
      serviceArea: form.zone,
      category: form.category,
      updatedAt: new Date().toISOString(),
      cloudStatus: post.cloudStatus || 'publica'
    });

    state.directEditSaving = true;
    saveLocalPosts(state.posts.map(p => String(p.id) === String(postId) ? updated : p));
    render();

    const ok = await syncPost(updated);
    state.directEditPostId = '';
    state.directEditSaving = false;
    render();
    scrollBackToPost(postId);
    toast(ok ? 'Publicación actualizada.' : 'Cambios guardados localmente. Revisa conexión.');
  }

  function directMediaItemsForPost(post){
    const items = Array.isArray(post.mediaItems) ? post.mediaItems.filter(item => item && (item.mediaUrl || item.mediaRef || item.mediaData || item.mediaPreviewUrl)) : [];
    if(items.length) return items;
    const media = resolveMedia(post);
    if(!media && !post.mediaRef) return [];
    return [{
      mediaUrl: post.mediaUrl || '',
      mediaRef: post.mediaRef || '',
      mediaData: post.mediaData || '',
      mediaPreviewUrl: post.mediaPreviewUrl || media || '',
      mediaName: post.mediaName || 'multimedia',
      mediaMime: post.mediaMime || '',
      mediaType: isVideoPost(post) ? 'video' : 'image'
    }];
  }

  function directMediaMarkup(post){
    const items = directMediaItemsForPost(post);
    const hasVideo = isVideoPost(post);
    const active = state.directMediaPostId === post.id;
    if(!active) return '';
    const itemList = items.length ? `<div class="direct-media-list">${items.map((item, index) => {
      const src = resolveMediaItem(item);
      const type = String(item.mediaType || post.mediaType || 'image').toLowerCase();
      return `<div class="direct-media-thumb">
        ${type === 'video' ? '<span class="direct-media-video">🎬</span>' : (src ? `<img src="${esc(src)}" alt="Foto ${index+1}">` : '<span>🖼️</span>')}
        <small>${type === 'video' ? 'Video' : `Foto ${index+1}`}</small>
        ${items.length > 1 && type !== 'video' ? `<button type="button" data-direct-media-remove="${esc(post.id)}" data-direct-media-index="${index}">Quitar</button>` : ''}
      </div>`;
    }).join('')}</div>` : '<div class="direct-media-empty">Sin multimedia visible.</div>';

    return `<div class="direct-media-panel" data-direct-media-panel="${esc(post.id)}">
      <div class="direct-media-head">
        <strong>Multimedia</strong>
        <small>Cambia video o agrega fotos sin salir del Home.</small>
      </div>
      ${itemList}
      <div class="direct-media-actions">
        ${hasVideo ? `<button type="button" class="direct-media-main" data-direct-media-pick="${esc(post.id)}" data-direct-media-mode="replace">Reemplazar video</button>` : `<button type="button" class="direct-media-main" data-direct-media-pick="${esc(post.id)}" data-direct-media-mode="add-photos">Agregar fotos</button><button type="button" data-direct-media-pick="${esc(post.id)}" data-direct-media-mode="replace">Cambiar todo</button>`}
        <button type="button" data-direct-media-cancel="${esc(post.id)}">Cerrar</button>
      </div>
    </div>`;
  }

  function startDirectMedia(postId){
    const post = state.posts.find(p => String(p.id) === String(postId));
    if(!post || !canFramePostAsAdmin(post)) return toast('Solo puedes cambiar multimedia propia o activar modo admin.');
    state.directFramePostId = '';
    state.directEditPostId = '';
    state.directMediaPostId = String(postId);
    state.directMediaMode = '';
    state.directMediaSaving = false;
    render();
    setTimeout(() => document.querySelector(`[data-direct-media-panel="${cssEscape(postId)}"]`)?.scrollIntoView({block:'center', behavior:'smooth'}), 80);
  }

  function cancelDirectMedia(postId){
    if(state.directMediaPostId !== String(postId)) return;
    state.directMediaPostId = '';
    state.directMediaMode = '';
    state.directMediaSaving = false;
    render();
    scrollBackToPost(postId);
  }

  function pickDirectMedia(postId, mode='replace'){
    const post = state.posts.find(p => String(p.id) === String(postId));
    if(!post || !canFramePostAsAdmin(post)) return toast('Solo puedes cambiar multimedia propia o activar modo admin.');
    state.directMediaPostId = String(postId);
    state.directMediaMode = mode;
    const picker = document.getElementById('directMediaPicker');
    if(!picker) return toast('No se encontró el selector de multimedia.');
    picker.value = '';
    picker.multiple = mode !== 'replace' || !isVideoPost(post);
    picker.click();
  }

  async function prepareDirectMediaFiles(postId, files, mode='replace', post=null){
    const list = [...files];
    if(!list.length) return null;

    const hasVideo = list.some(file => file.type.startsWith('video/'));
    if(hasVideo && list.length > 1) throw new Error('Por ahora puedes elegir varias fotos o un solo video.');
    if(mode === 'add-photos' && hasVideo) throw new Error('Para agregar, selecciona solo fotos. Para video usa Cambiar todo.');
    if(hasVideo && mode !== 'replace') throw new Error('El video reemplaza la multimedia actual.');

    if(list.length > 1){
      const images = list.filter(file => file.type.startsWith('image/'));
      if(images.length !== list.length) throw new Error('Para varias imágenes, selecciona solo fotos.');
      const items = [];
      for(let i=0; i<images.length; i++){
        const file = images[i];
        if(file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`Una imagen pesa demasiado. Máximo: ${MAX_IMAGE_MB} MB.`);
        const blob = await resizeImage(file).catch(()=>file);
        const ref = `direct-media-${postId}-${Date.now()}-${i}`;
        await saveMediaBlob(ref, blob);
        items.push({
          mediaRef: ref,
          mediaName: file.name || `foto-${i+1}.jpg`,
          mediaMime: blob.type || file.type || 'image/jpeg',
          mediaType: 'image',
          mediaFit:'contain',
          mediaScale:1,
          mediaX:50,
          mediaY:50,
          mediaPreviewUrl: objectUrlFor(ref, blob)
        });
      }
      return {kind:'gallery', items};
    }

    const file = list[0];
    const isVideo = file.type.startsWith('video/');
    const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if(file.size > maxMb * 1024 * 1024) throw new Error(isVideo ? `El video pesa más de ${maxMb} MB.` : `La imagen pesa demasiado. Máximo: ${maxMb} MB.`);

    if(isVideo){
      toast('Revisando duración del video...');
      const duration = await readVideoDuration(file);
      if(duration && duration > MAX_VIDEO_SECONDS + 1) throw new Error('El video dura más de 10 minutos.');
    }

    const kind = isVideo ? 'video' : 'image';
    let blob = file;
    if(kind === 'image') blob = await resizeImage(file).catch(()=>file);
    const ref = `direct-media-${postId}-${Date.now()}`;
    await saveMediaBlob(ref, blob);
    const item = {
      mediaRef: ref,
      mediaName: file.name || `${kind}.bin`,
      mediaMime: blob.type || file.type || 'application/octet-stream',
      mediaType: kind,
      mediaFit: kind === 'image' ? 'contain' : undefined,
      mediaScale: kind === 'image' ? 1 : undefined,
      mediaX: kind === 'image' ? 50 : undefined,
      mediaY: kind === 'image' ? 50 : undefined,
      mediaPreviewUrl: objectUrlFor(ref, blob)
    };
    return {kind, item};
  }

  function mergeDirectMedia(post, prepared, mode){
    let mediaItems = [];
    let mediaType = 'image';
    let mediaRef = '';
    let mediaName = '';
    let mediaMime = '';
    let mediaPreviewUrl = '';
    let mediaUrl = '';

    if(mode === 'add-photos'){
      const current = directMediaItemsForPost(post).filter(item => String(item.mediaType || 'image').toLowerCase() !== 'video');
      const currentItems = current.map(item => ({...item, mediaType:'image'}));
      const newItems = prepared.kind === 'gallery' ? prepared.items : [prepared.item];
      mediaItems = [...currentItems, ...newItems].slice(0, 10);
      mediaType = 'image';
      mediaRef = mediaItems[0]?.mediaRef || '';
      mediaName = mediaItems[0]?.mediaName || '';
      mediaMime = mediaItems[0]?.mediaMime || '';
      mediaPreviewUrl = mediaItems[0]?.mediaPreviewUrl || '';
      mediaUrl = '';
    }else if(prepared.kind === 'video'){
      mediaItems = [];
      mediaType = 'video';
      mediaRef = prepared.item.mediaRef;
      mediaName = prepared.item.mediaName;
      mediaMime = prepared.item.mediaMime;
      mediaPreviewUrl = prepared.item.mediaPreviewUrl;
      mediaUrl = '';
    }else if(prepared.kind === 'gallery'){
      mediaItems = prepared.items;
      mediaType = 'image';
      mediaRef = mediaItems[0]?.mediaRef || '';
      mediaName = mediaItems[0]?.mediaName || '';
      mediaMime = mediaItems[0]?.mediaMime || '';
      mediaPreviewUrl = mediaItems[0]?.mediaPreviewUrl || '';
      mediaUrl = '';
    }else{
      mediaItems = [];
      mediaType = 'image';
      mediaRef = prepared.item.mediaRef;
      mediaName = prepared.item.mediaName;
      mediaMime = prepared.item.mediaMime;
      mediaPreviewUrl = prepared.item.mediaPreviewUrl;
      mediaUrl = '';
    }

    return normalizePost({
      ...post,
      mediaItems,
      mediaType,
      mediaRef,
      mediaName,
      mediaMime,
      mediaPreviewUrl,
      mediaUrl,
      mediaStatus:'pendiente',
      mediaPending:true,
      cloudStatus:'subiendo',
      mediaFit:'contain',
      mediaScale:1,
      mediaX:50,
      mediaY:50,
      updatedAt:new Date().toISOString()
    });
  }

  async function directMediaChosen(event){
    const files = [...(event.target.files || [])];
    event.target.value = '';
    if(!files.length || !state.directMediaPostId) return;

    const postId = state.directMediaPostId;
    const post = state.posts.find(p => String(p.id) === String(postId));
    if(!post || !canFramePostAsAdmin(post)) return toast('Solo puedes cambiar multimedia propia o activar modo admin.');

    try{
      state.directMediaSaving = true;
      toast('Preparando multimedia...');
      const prepared = await prepareDirectMediaFiles(postId, files, state.directMediaMode || 'replace', post);
      if(!prepared) return;

      let updated = mergeDirectMedia(post, prepared, state.directMediaMode || 'replace');
      saveLocalPosts(state.posts.map(p => String(p.id) === String(postId) ? updated : p));
      render();

      const firstSync = await syncPost({...updated, cloudStatus:'publica', mediaStatus:'pendiente', updatedAt:new Date().toISOString()});
      updated = normalizePost({...updated, cloudStatus:firstSync ? 'publica' : 'local', updatedAt:new Date().toISOString()});
      saveLocalPosts(state.posts.map(p => String(p.id) === String(postId) ? updated : p));
      render();

      if(firstSync){
        toast('Subiendo multimedia...');
        const uploaded = await uploadMediaToCloud(updated).catch(()=>({ok:false, post:updated}));
        if(uploaded.ok){
          updated = normalizePost({...uploaded.post, cloudStatus:'publica', mediaStatus:'', mediaPending:false, updatedAt:new Date().toISOString()}, 'remote');
          await syncPost(updated);
          saveLocalPosts(state.posts.map(p => String(p.id) === String(postId) ? updated : p));
          toast('Multimedia actualizada.');
        }else{
          updated = normalizePost({...updated, cloudStatus:'publica', mediaStatus:'error', mediaError:uploaded.detail || 'No se pudo subir multimedia', updatedAt:new Date().toISOString()});
          saveLocalPosts(state.posts.map(p => String(p.id) === String(postId) ? updated : p));
          toast('No se pudo subir multimedia. Toca Reintentar.');
        }
      }else{
        toast('Guardado localmente. Revisa conexión.');
      }
    }catch(error){
      toast(error?.message || 'No se pudo abrir el archivo.');
    }finally{
      state.directMediaSaving = false;
      state.directMediaMode = '';
      render();
    }
  }

  function removeDirectMediaItem(postId, index){
    const post = state.posts.find(p => String(p.id) === String(postId));
    if(!post || !canFramePostAsAdmin(post)) return toast('Solo puedes cambiar multimedia propia o activar modo admin.');
    const items = directMediaItemsForPost(post).filter(item => String(item.mediaType || 'image').toLowerCase() !== 'video');
    if(items.length <= 1) return toast('Deja al menos una foto o usa Cambiar todo.');
    const nextItems = items.filter((_, i) => i !== Number(index));
    const first = nextItems[0] || {};

    const single = nextItems.length === 1;
    const updated = normalizePost({
      ...post,
      // Si queda una sola foto, la publicación vuelve a multimedia simple.
      // Así desaparecen los puntitos del carrusel.
      mediaItems: single ? [] : nextItems,
      mediaType:'image',
      mediaUrl:first.mediaUrl || '',
      mediaRef:first.mediaRef || '',
      mediaData:first.mediaData || '',
      mediaName:first.mediaName || '',
      mediaMime:first.mediaMime || '',
      mediaPreviewUrl:first.mediaPreviewUrl || '',
      mediaFit:first.mediaFit || first.fit || post.mediaFit || 'contain',
      mediaScale:first.mediaScale || first.scale || post.mediaScale || 1,
      mediaX:first.mediaX || first.x || post.mediaX || 50,
      mediaY:first.mediaY || first.y || post.mediaY || 50,
      mediaStatus:'',
      mediaPending:false,
      updatedAt:new Date().toISOString()
    });
    state.galleryIndex[String(postId)] = 0;
    saveLocalPosts(state.posts.map(p => String(p.id) === String(postId) ? updated : p));
    syncPost(updated).catch(()=>null);
    render();
    toast(single ? 'Quedó una sola foto.' : 'Foto quitada.');
  }

  
  function minimalSafePostCard(post={}, error=null){
    const p = post && typeof post === 'object' ? post : {};
    const id = String(p.id || uid('safe-post'));
    const title = String(p.title || p.description || 'Publicación disponible').slice(0, 120);
    const description = String(p.description || p.details || p.content || 'Toca mensaje para pedir información.').slice(0, 180);
    const category = normalizeCategory(p.category || 'OFREZCO');
    const zone = serviceAreaText(p) || p.zone || 'Tu zona';
    const owner = String(p.ownerName || 'Usuario local').trim() || 'Usuario local';
    const media = (() => {
      try { return resolveMedia(p) || ''; } catch { return String(p.mediaUrl || ''); }
    })();

    try{
      console.warn('[Conecta] Tarjeta omitió datos dañados', error, id);
      set('cs_v6480_last_bad_post', {
        id,
        title,
        message: error?.message || String(error || ''),
        stack: String(error?.stack || '').slice(0, 600),
        at: new Date().toISOString()
      });
    }catch{}

    return `<article class="post-card safe-post-card" data-post-card="${esc(id)}">
      <div class="media-area">
        ${media ? `<img class="framed-media" style="object-fit:cover;object-position:center;" src="${esc(media)}" alt="${esc(title)}">` : '<div class="no-media">Conecta Servicios</div>'}
        <div class="media-top"><span class="chip ${categoryClass(category)}">${esc(category)}</span></div>
      </div>
      <div class="post-body">
        <div class="owner-row"><div class="avatar-fallback">${esc(owner.slice(0,1).toUpperCase())}</div><span>${esc(owner)}</span></div>
        <div class="service-area-row">📍 Atiende en: <strong>${esc(String(zone))}</strong></div>
        <h2>${esc(title)}</h2>
        <div class="post-description-short">${esc(description)}</div>
        <div class="post-action-row">
          <button type="button" class="icon-only-action heart-action ${heartClass(id)}" data-like="${esc(id)}" aria-label="Preferir" title="Para ti">${heartIcon(id)}</button>
          <button type="button" class="icon-only-action" data-message="${esc(id)}" aria-label="Mensaje" title="Mensaje">✉️</button>
          <button type="button" class="icon-only-action" data-share="${esc(id)}" aria-label="Compartir" title="Compartir">↗️</button>
        </div>
        <div class="local-note">Esta tarjeta fue recuperada porque tenía datos incompatibles.</div>
      </div>
    </article>`;
  }

  function safePostCard(post){
    try{
      return postCard(post);
    }catch(error){
      return minimalSafePostCard(post, error);
    }
  }

function postCard(post){
    post = normalizePost(post);
    const ownerPost = isMeId(post.ownerId);
    const adminFramePost = !ownerPost && adminFrameMode();
    const adminManagePost = !ownerPost && adminFrameMode();
    const own = ownerPost || adminManagePost;
    const pending = isVideoPost(post) && !post.mediaUrl;
    const expandedDesc = isDescriptionExpanded(post.id);
    const canFrameDirect = (ownerPost || adminFramePost || adminManagePost) && !pending && !!resolveMedia(post);
    const directFrameActive = state.directFramePostId === post.id;
    const directEditActive = state.directEditPostId === post.id;
    const directMediaActive = state.directMediaPostId === post.id;
    return `<article class="post-card immersive-feed-card ${expandedDesc ? 'description-open' : ''} ${directFrameActive ? 'direct-frame-active' : ''} ${directEditActive ? 'direct-edit-active' : ''} ${directMediaActive ? 'direct-media-active' : ''}" data-post-card="${esc(post.id)}">
      <div class="media-area ${directFrameActive ? 'direct-frame-area-active' : ''}" ${directFrameActive ? `data-direct-frame-area="${esc(post.id)}"` : ''}>
        ${mediaMarkup(post)}
        ${galleryDotsMarkup(post)}
        ${pending ? '<div class="media-pending">Video en proceso. La publicación ya está visible.</div>' : ''}
        <div class="media-top"><span class="chip ${categoryClass(post.category)}">${esc(normalizeCategory(post.category))}</span></div>
        ${isVideoPost(post) && post.mediaUrl ? `<button class="sound-toggle-card" type="button" data-toggle-video-sound="${esc(post.id)}" aria-label="Activar sonido">🔇</button>` : ''}
        ${directFrameActive ? `<div class="direct-frame-grid" aria-hidden="true"></div><div class="direct-frame-hint">${isVideoPost(post) ? 'Encuadre de video' : 'Encuadre de multimedia'} · Pellizca tamaño</div><div class="direct-frame-controls"><button type="button" data-direct-frame-save="${esc(post.id)}">${state.directFrameSaving ? 'Guardando...' : 'Guardar y volver'}</button><button type="button" data-direct-frame-cancel="${esc(post.id)}">Cancelar</button></div>` : ''}
      </div>
      <div class="post-body ${expandedDesc ? 'expanded-description-body' : ''}">
        <div class="owner-row" data-open-store="${esc(post.ownerId)}">${avatarMarkup(postAvatar(post), post.ownerName || 'Usuario local')}<span>${esc(post.ownerName || 'Usuario local')}</span></div>
        ${directEditActive ? directEditMarkup(post) : ''}
        ${directMediaActive ? directMediaMarkup(post) : ''}
        ${serviceAreaText(post) ? `<div class="service-area-row">📍 Atiende en: <strong>${esc(serviceAreaText(post))}</strong></div>` : ''}
        <h2>${esc(post.title || 'Publicación')}</h2>
        ${descriptionMarkup(post)}
        <div class="post-meta"><span>${new Date(post.createdAt || Date.now()).toLocaleDateString('es-MX')}</span></div>
        <div class="post-action-row ${isVideoPost(post) && post.mediaUrl ? 'has-audio-action' : ''}">
          <button type="button" class="icon-only-action heart-action ${heartClass(post.id)}" data-like="${esc(post.id)}" aria-label="Guardar para mis intereses" title="Guardar para mis intereses">${heartIcon(post.id)}</button>
          <button type="button" class="icon-only-action" data-message="${esc(post.id)}" aria-label="Mensaje" title="Mensaje">✉️</button>
          <button type="button" class="icon-only-action" data-share="${esc(post.id)}" aria-label="Compartir" title="Compartir">↗️</button>
          ${isVideoPost(post) && post.mediaUrl ? `<button type="button" class="icon-only-action audio-row-btn" data-toggle-video-sound="${esc(post.id)}" aria-label="Audio" title="Audio">🔇</button>` : ''}
        </div>
        ${statusLabel(post)}
        ${own ? `<div class="manage-row">${post.cloudStatus==='local'||post.mediaStatus==='pendiente'||post.mediaStatus==='error'?`<button class="retry" data-retry="${esc(post.id)}">Reintentar</button>`:''}${canFrameDirect ? `<button class="frame-direct-btn" data-direct-frame-start="${esc(post.id)}">${directFrameActive ? 'Encuadre...' : 'Encuadre'}</button>` : ''}<button class="direct-edit-btn" data-direct-edit-start="${esc(post.id)}">${directEditActive ? 'Editando...' : 'Editar aquí'}</button><button class="direct-media-btn" data-direct-media-start="${esc(post.id)}">${directMediaActive ? 'Multimedia...' : 'Multimedia'}</button><button data-edit="${esc(post.id)}">Completo</button><button class="danger" data-delete="${esc(post.id)}">Borrar</button></div>` : (adminFramePost && canFrameDirect ? `<div class="manage-row admin-frame-row"><button class="frame-direct-btn admin-frame-btn" data-direct-frame-start="${esc(post.id)}">${directFrameActive ? 'Encuadre admin...' : 'Encuadre admin'}</button></div>` : '')}
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
    const adminStore = adminFrameMode() && !state.storeOwnerId;
    if(adminStore){
      const vendoAll = filteredAll().filter(p => !isDeleted(p) && normalizeCategory(p.category) === 'VENDO');
      const suggestionsAll = allOwnerSummaries().filter(s => s.vendo > 0).slice(0, 10);
      return shell(`<section class="panel store-panel">
        <button class="small-link" data-nav="/">← Volver al Home</button>
        <div class="store-hero">
          <div class="store-avatar">🛒</div>
          <div>
            <p class="store-kicker">Modo admin</p>
            <h1>Tienda global</h1>
            <p>Publicaciones VENDO visibles para revisar productos sin depender del userId local de este celular.</p>
          </div>
        </div>
        <div class="store-stats">
          <span><strong>${vendoAll.length}</strong> en venta</span>
          <span><strong>${suggestionsAll.length}</strong> cuentas</span>
          <span><strong>Admin</strong> activo</span>
        </div>
      </section>
      <section class="feed store-feed">${vendoAll.map(safePostCard).join('') || emptyState('No hay productos VENDO','Cuando alguien publique en VENDO, aparecerá aquí.')}</section>
      ${suggestionsAll.length ? `<section class="panel owner-directory"><h2>Tiendas locales</h2><div class="owner-list">${suggestionsAll.map(s => ownerCard(s)).join('')}</div></section>` : ''}`);
    }

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
    <section class="feed store-feed">${vendo.map(safePostCard).join('') || emptyState('Esta tienda aún no tiene productos','Cuando publique en VENDO, aparecerá aquí.')}</section>
    ${suggestions.length ? `<section class="panel owner-directory"><h2>Otras tiendas locales</h2><div class="owner-list">${suggestions.map(s => ownerCard(s)).join('')}</div></section>` : ''}`);
  }

  function followingPage(){
    const ids = follows();
    const likedIds = new Set(likedPostIds().map(String));
    const liked = filteredAll().filter(p => likedIds.has(String(p.id)));
    const summaries = ids.map(ownerSummary).filter(s => s.total > 0);

    return shell(`<section class="panel following-panel">
      <button class="small-link" data-nav="/">← Volver al Home</button>
      <h1>Siguiendo</h1>
      <p>Aquí aparecen las publicaciones guardadas para tus intereses y las cuentas que sigues.</p>
    </section>
    <section class="panel following-panel">
      <h2>Guardados para ti</h2>
      <p>Publicaciones guardadas para tus intereses.</p>
    </section>
    <section class="feed following-liked-feed">${liked.map(safePostCard).join('') || emptyState('Todavía no guardas publicaciones','Toca la estrella en una publicación para verla aquí.')}</section>
    <section class="panel owner-directory">
      <h2>Cuentas que sigues</h2>
      <div class="owner-list">${summaries.map(s => ownerCard(s)).join('') || emptyState('Todavía no sigues cuentas','Cuando sigas a un publicante, aparecerá aquí.')}</div>
    </section>`);
  }

  function diagnosticsPanel(){
    const diag = state.lastUploadDiagnostic || get('cs_v6323_last_upload_diagnostic', null);
    const runtime = {
      version: VERSION,
      bootVersion: window.CONNECTA_BOOT_VERSION || '',
      userId: userId(),
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
    const adminProfile = adminFrameMode();
    const mine = adminProfile ? filteredAll().filter(p => !isDeleted(p) && !isSeed(p)) : myPosts();
    const avatar = prof.avatarData || '';
    return shell(`<section class="panel profile-panel">
      <h1>Perfil</h1>
      <p>${adminProfile ? 'Modo admin activo: este perfil es local de este celular, pero abajo puedes revisar publicaciones administrables.' : 'Guarda tu nombre visible y foto de perfil. La nueva foto se sube a la nube para verse en otros celulares.'}</p>
      ${adminProfile ? '<div class="local-note">🛡️ Admin activo. No se mezclan identidades: “Usuario local” es solo el perfil de este navegador.</div>' : ''}
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
      <input id="profileName" type="text" inputmode="text" autocomplete="off" autocapitalize="words" value="${esc(prof.name||'Usuario local')}" placeholder="Tu nombre o negocio">
      <button class="big-button" data-save-profile>Guardar perfil</button><button class="small-link" type="button" data-repair-avatar>Reparar foto pública</button>
      <div class="profile-grid"><div class="stat"><strong>${mine.length}</strong><span>${adminProfile ? 'Administrables' : 'Publicaciones'}</span></div><div class="stat"><strong>${follows().length}</strong><span>Siguiendo</span></div><div class="stat"><strong>${unreadCount()}</strong><span>Sin leer</span></div></div>
      <div class="trust-entry-card">
        <div>
          <strong>Privacidad y seguridad</strong>
          <span>Conoce qué permisos usa Conecta Servicios y cómo instalarla con confianza.</span>
        </div>
        <button type="button" data-nav="/confianza">Ver</button>
      </div>
    </section>${diagnosticsPanel()}<section class="feed">${mine.map(safePostCard).join('')||emptyState(adminProfile ? 'No hay publicaciones administrables' : 'No has publicado', adminProfile ? 'Cuando haya publicaciones visibles, aparecerán aquí.' : 'Toca + para crear tu primera publicación.')}</section>`);
  }

  function confidencePage(){
    return shell(`<section class="panel trust-page">
      <button class="small-link" data-nav="/">← Volver al Home</button>
      <div class="trust-hero">
        <div class="trust-badge">🛡️</div>
        <div>
          <p class="trust-kicker">Conecta Servicios</p>
          <h1>Privacidad y seguridad</h1>
          <p>Esta app está pensada para publicar necesidades, servicios y productos locales sin pedir permisos innecesarios.</p>
        </div>
      </div>
      <div class="trust-summary">
        <strong>Mensaje importante</strong>
        <p>Conecta Servicios no accede a tus archivos personales. Solo usas cámara, galería o ubicación cuando tú decides publicar o buscar mejor en tu zona.</p>
      </div>
    </section>

    <section class="panel trust-page trust-grid-panel">
      <h2>Permisos de la app</h2>
      <div class="trust-grid">
        <article class="trust-card">
          <span>📍</span>
          <strong>Ubicación aproximada</strong>
          <p>Sirve para mostrar publicaciones cercanas por municipio o zona. No debe usarse para rastrear a una persona en tiempo real.</p>
        </article>
        <article class="trust-card">
          <span>📷</span>
          <strong>Cámara y galería</strong>
          <p>Solo se usan cuando eliges subir foto o video a una publicación. La app no revisa tus archivos sin que tú los selecciones.</p>
        </article>
        <article class="trust-card">
          <span>✉️</span>
          <strong>Mensajes internos</strong>
          <p>Los mensajes se usan para contactar al anunciante dentro de la app. Evitan exponer WhatsApp como dato obligatorio.</p>
        </article>
        <article class="trust-card">
          <span>🔔</span>
          <strong>Notificaciones futuras</strong>
          <p>Cuando se activen, se pedirán con permiso claro y servirán para avisar de mensajes o novedades.</p>
        </article>
      </div>
    </section>

    <section class="panel trust-page">
      <h2>Instalación segura</h2>
      <div class="trust-steps">
        <div><strong>1</strong><p>Abre siempre la app desde el enlace oficial de Conecta Servicios.</p></div>
        <div><strong>2</strong><p>En Android puedes usar el menú del navegador y elegir “Agregar a pantalla principal”.</p></div>
        <div><strong>3</strong><p>Para personas que prefieren app instalada, se preparará una versión Android revisable antes de distribuirse.</p></div>
      </div>
      <div class="local-note trust-note">Para mayor confianza, evita instalar APKs recibidos por mensajes si no vienen de un canal verificado del proyecto.</div>
    </section>

    <section class="panel trust-page">
      <h2>Transparencia del MVP</h2>
      <ul class="trust-list">
        <li>La app está en etapa piloto y se está probando con publicaciones reales controladas.</li>
        <li>WhatsApp es opcional; el objetivo es que la comunicación interna funcione dentro de Conecta Servicios.</li>
        <li>Si algo no carga bien, puede deberse a caché del navegador durante pruebas. Abrir con la última liga de versión ayuda a validar.</li>
        <li>Soporte: desde Perfil puedes copiar el diagnóstico técnico para reportar problemas al equipo de Conecta Servicios.</li>
      </ul>
      <p class="trust-footer">© 2026 Conecta Servicios. Todos los derechos reservados.</p>
    </section>`);
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
      mediaItems: state.composerMediaItems || [],
      mediaFrame: cleanMediaFrame(state.mediaFrame || {})
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
    state.mediaFrame = cleanMediaFrame(saved.mediaFrame || state.mediaFrame || {});
  }

  function composerPage(){
    loadComposerDraft();
    ensureComposerId();
    if(!state.editing){
      const savedEditingId = localStorage.getItem(K.editingId);
      if(savedEditingId){
        const recovered = state.posts.find(p => String(p.id) === String(savedEditingId));
        if(recovered && recovered.ownerId === userId()){
          state.editing = {...recovered};
          state.composerId = recovered.id;
          state.preview = resolveMedia(recovered);
          state.mediaType = recovered.mediaType || 'image';
          state.composerMediaRef = recovered.mediaRef || '';
          state.composerMediaName = recovered.mediaName || '';
          state.composerMediaMime = recovered.mediaMime || '';
          state.composerMediaItems = Array.isArray(recovered.mediaItems) ? recovered.mediaItems : [];
          state.mediaFrame = mediaFrameFromPost(recovered);
        }
      }
    }
    const post = state.editing || null;
    if(post) state.composerDraft = {description:post.description||'', zone:post.zone||'', category:normalizeCategory(post.category)};
    const draft = state.composerDraft;
    const previewItems = state.composerMediaItems?.length ? state.composerMediaItems : (post?.mediaItems || []);
    const media = state.preview || post?.mediaUrl || resolveMedia(post || {mediaRef:state.composerMediaRef});
    const isVideo = (state.mediaType || post?.mediaType) === 'video';
    const frame = cleanMediaFrame(state.mediaFrame || mediaFrameFromPost(post || {}));
    state.mediaFrame = frame;

    const previewMarkup = previewItems?.length > 1
      ? `<div class="preview-gallery frame-preview-gallery">${previewItems.map((item, idx) => { const src = resolveMediaItem(item); return src ? `<img class="frame-preview-media" style="${mediaFrameVars(frame)}" src="${esc(src)}" alt="Foto ${idx+1}">` : ''; }).join('')}</div><small>${previewItems.length} fotos seleccionadas</small>`
      : (media ? (isVideo ? `<video class="frame-preview-media" style="${mediaFrameVars(frame)}" src="${esc(media)}" controls playsinline preload="metadata"></video>` : `<img class="frame-preview-media" style="${mediaFrameVars(frame)}" src="${esc(media)}" alt="Vista previa">`) : '<div><strong>+ Agregar foto o video</strong><span>Desde tu dispositivo</span></div>');

    const frameControls = media ? `<div class="media-frame-helper">
      <div><strong>Encuadre táctil</strong><span data-frame-label>${esc(frameLabel(frame))}</span></div>
      <p>El recuadro representa cómo se verá en la publicación. Arrastra para acomodar, pellizca para ampliar/reducir. Desliza fuera del recuadro para bajar la página.</p>
    </div>` : '';

    return shell(`<section class="composer">
      <button class="back-btn" data-nav="/">← Volver</button>
      <h1>${state.editing?'Editar publicación':'Nueva publicación'}</h1>
      <p>Escribe aquí. Puedes elegir una foto, varias fotos o un video corto.</p>
      <label for="description">Descripción</label>
      <textarea id="description" autocomplete="off" autocapitalize="sentences" spellcheck="true" placeholder="Ejemplo: Vendo tamales hoy&#10;Entrego en zona centro desde las 6 pm.">${esc(draft.description||'')}</textarea>
      <div class="preview-compact frame-preview-box frame-touch-editor" data-frame-touch>
        ${previewMarkup}
        ${media ? '<div class="frame-safe-grid" aria-hidden="true"></div><div class="frame-touch-hint">Arrastra / Pellizca</div>' : ''}
      </div>
      ${frameControls}
      <div class="form-grid"><div><label for="zone">Zona / cobertura</label><input id="zone" value="${esc(draft.zone||'')}" placeholder="Ej. Toluca y sus alrededores / En línea mundial" autocomplete="off"></div><div><label for="category">Categoría</label><select id="category">${CATEGORIES.map(c=>`<option value="${esc(c)}" ${normalizeCategory(draft.category)===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div></div>
      <button class="big-button ${state.publishing?'publishing':''}" data-publish ${state.publishing?'disabled':''}>${state.publishing?'PUBLICANDO...':'PUBLICAR'}</button>
      <div class="local-note">Tip: si el video tiene texto, usa “Ver completo” antes de guardar.</div>
    </section>`);
  }

  function render(){
    injectRootStyles();

    const routes = {'/':homePage, '/tienda':storePage, '/siguiendo':followingPage, '/mensajes':messagesPage, '/perfil':profilePage, '/control':renderConectaControlPage, '/confianza':confidencePage, '/publicar':composerPage, '/chat':chatPage};
    let html = '';

    try{
      html = (routes[state.route] || homePage)();
      app.innerHTML = html;
    }catch(error){
      console.error('[Conecta] Error creando pantalla', error);
      try{
        localStorage.setItem('cs_v6477_last_route_error', JSON.stringify({
          route: state.route,
          message: error?.message || String(error),
          stack: String(error?.stack || '').slice(0, 900),
          at: new Date().toISOString()
        }));
      }catch{}
      app.innerHTML = shell(`<section class="feed" id="feed">
        ${emptyState('Cargando publicaciones','Hubo un problema con una pantalla. Vuelve a Inicio o recarga la app.')}
      </section>`);
    }

    const safeStep = (name, fn) => {
      try{
        fn();
      }catch(error){
        console.warn(`[Conecta] Paso visual omitido: ${name}`, error);
        try{
          localStorage.setItem('cs_v6477_last_visual_error', JSON.stringify({
            route: state.route,
            step: name,
            message: error?.message || String(error),
            stack: String(error?.stack || '').slice(0, 900),
            at: new Date().toISOString()
          }));
        }catch{}
      }
    };

    safeStep('bind', () => bind());
    if(state.route === '/chat') safeStep('scrollChatToBottom', () => scrollChatToBottom('auto'));
    safeStep('setupInternalVideos', () => setupInternalVideos());
    safeStep('setupGalleries', () => setupGalleries());
    safeStep('setupDirectFrameEditors', () => setupDirectFrameEditors());
    if(state.route === '/publicar') safeStep('setupFrameTouchEditor', () => setupFrameTouchEditor());
  }
  function routeUrl(route){
    const base = location.pathname + location.search;
    return route === '/' ? base.replace(/#.*/, '') : `${base.replace(/#.*/, '')}#${route.replace(/^\//,'')}`;
  }
  function nav(route, options={}){
    if(route === '/mensajes' && !options.keepMessageFilter){
      state.messagesPostFilter = '';
      state.messagesPostTitle = '';
    }
    if(route !== '/mensajes' && route !== '/chat' && !options.keepMessageFilter){
      state.messagesPostFilter = '';
      state.messagesPostTitle = '';
    }
    state.route = route;
    if(route !== '/publicar' && !state.publishing) state.editing = null;
    if(options.push !== false && history.pushState){
      const currentRoute = history.state?.route || '/';
      if(currentRoute !== route) history.pushState({route}, '', routeUrl(route));
    } else if(options.replace && history.replaceState){
      history.replaceState({route}, '', routeUrl(route));
    }
    render();
    if(route === '/mensajes') setTimeout(()=>forceRefreshMessages(), 0);
    setTimeout(()=>scrollTo({top:0,behavior:'smooth'}),0);
  }
  function setupNavigationHistory(){
    const initialHash = location.hash.replace('#','');
    if(initialHash){
      const route = '/' + initialHash.replace(/^\//,'');
      if(['/tienda','/siguiendo','/mensajes','/perfil','/control','/confianza','/publicar','/chat'].includes(route)) state.route = route;
    }
    history.replaceState?.({route:state.route || '/'}, '', routeUrl(state.route || '/'));
    window.addEventListener('popstate', e => {
      state.route = e.state?.route || '/';
      if(state.route !== '/publicar' && !state.publishing) state.editing = null;
      render();
      if(state.route === '/mensajes') setTimeout(()=>forceRefreshMessages(), 0);
      setTimeout(()=>scrollTo({top:0,behavior:'smooth'}),0);
    });
  }
  function clearComposer(){ state.preview=''; state.mediaType='image'; state.editing=null; state.composerId=''; state.composerMediaRef=''; state.composerMediaName=''; state.composerMediaMime=''; state.composerMediaItems=[]; state.composerDraft={description:'',zone:'',category:'VENDO'}; state.mediaFrame={fit:'contain',scale:1,x:50,y:50}; localStorage.removeItem(K.composer); localStorage.removeItem(K.editingId); }
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
        state.mediaFrame = {fit:'contain', scale:1, x:50, y:50};
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
      state.mediaFrame = {fit:'contain', scale:1, x:50, y:50};
      saveComposerDraft();
      nav('/publicar');
      setTimeout(()=>document.getElementById('description')?.focus(),250);
    }catch{
      toast('No se pudo abrir el archivo. Prueba con otro.');
    }
  }

  function adjustComposerFrame(action){
    let f = cleanMediaFrame(state.mediaFrame || {});
    const move = 14;
    const zoom = .10;
    if(action === 'fit-contain') f.fit = 'contain';
    if(action === 'fit-cover') f.fit = 'cover';
    if(action === 'zoom-in') f.scale = clampNumber(f.scale + zoom, .35, 3.2, 1);
    if(action === 'zoom-out') f.scale = clampNumber(f.scale - zoom, .35, 3.2, 1);
    if(action === 'left') f.x = clampNumber(f.x - move, -150, 250, 50);
    if(action === 'right') f.x = clampNumber(f.x + move, -150, 250, 50);
    if(action === 'up') f.y = clampNumber(f.y - move, -150, 250, 50);
    if(action === 'down') f.y = clampNumber(f.y + move, -150, 250, 50);
    if(action === 'reset') f = {fit:'contain', scale:1, x:50, y:50};
    state.mediaFrame = cleanMediaFrame(f);
    saveComposerDraft();
    render();
  }

  function applyFramePreviewStyles(){
    const f = cleanMediaFrame(state.mediaFrame || {});
    document.querySelectorAll('.frame-preview-media').forEach(el => {
      el.style.setProperty('--media-fit', f.fit);
      el.style.setProperty('--media-x', `${f.x}%`);
      el.style.setProperty('--media-y', `${f.y}%`);
      el.style.setProperty('--media-tx', `${f.x - 50}%`);
      el.style.setProperty('--media-ty', `${f.y - 50}%`);
      el.style.setProperty('--media-scale', `${f.scale}`);
    });
    const label = document.querySelector('[data-frame-label]');
    if(label) label.textContent = frameLabel(f);
  }

  function setupFrameTouchEditor(){
    const box = document.querySelector('[data-frame-touch]');
    if(!box || box.dataset.touchReady === '1') return;
    box.dataset.touchReady = '1';

    const pointers = new Map();
    let start = null;
    let lastTapAt = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    const distance = () => {
      const pts = [...pointers.values()];
      if(pts.length < 2) return 0;
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    };

    const begin = () => {
      start = { frame: cleanMediaFrame(state.mediaFrame || {}), dist: distance() };
    };

    const updateFromPointers = () => {
      if(!start || !pointers.size) return;
      const rect = box.getBoundingClientRect();
      let f = cleanMediaFrame(state.mediaFrame || {});
      const pts = [...pointers.values()];

      if(pts.length === 1){
        const p = pts[0];
        const dx = p.x - p.startX;
        const dy = p.y - p.startY;
        f.x = clampNumber(start.frame.x + (dx / Math.max(1, rect.width)) * 120, -150, 250, 50);
        f.y = clampNumber(start.frame.y + (dy / Math.max(1, rect.height)) * 120, -150, 250, 50);
      }else if(pts.length >= 2){
        const d = distance();
        if(start.dist > 0 && d > 0){
          f.scale = clampNumber(start.frame.scale * (d / start.dist), .35, 3.2, 1);
        }
        const a = pts[0], b = pts[1];
        const startMidX = (a.startX + b.startX) / 2;
        const startMidY = (a.startY + b.startY) / 2;
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        f.x = clampNumber(start.frame.x + ((midX - startMidX) / Math.max(1, rect.width)) * 120, -150, 250, 50);
        f.y = clampNumber(start.frame.y + ((midY - startMidY) / Math.max(1, rect.height)) * 120, -150, 250, 50);
      }

      state.mediaFrame = cleanMediaFrame(f);
      applyFramePreviewStyles();
    };

    const toggleFit = () => {
      const f = cleanMediaFrame(state.mediaFrame || {});
      f.fit = f.fit === 'contain' ? 'cover' : 'contain';
      state.mediaFrame = cleanMediaFrame(f);
      applyFramePreviewStyles();
      saveComposerDraft();
      toast(f.fit === 'contain' ? 'Modo completo.' : 'Modo llenar pantalla.');
    };

    box.addEventListener('pointerdown', e => {
      if(e.target.closest('button, input, textarea, select')) return;
      pointers.set(e.pointerId, {x:e.clientX, y:e.clientY, startX:e.clientX, startY:e.clientY});
      box.setPointerCapture?.(e.pointerId);
      begin();
      e.preventDefault();
      e.stopPropagation();
    }, {passive:false});

    box.addEventListener('pointermove', e => {
      if(!pointers.has(e.pointerId)) return;
      const p = pointers.get(e.pointerId);
      p.x = e.clientX;
      p.y = e.clientY;
      pointers.set(e.pointerId, p);
      updateFromPointers();
      e.preventDefault();
      e.stopPropagation();
    }, {passive:false});

    const end = e => {
      const p = pointers.get(e.pointerId);
      if(p){
        const moved = Math.hypot((e.clientX || p.x) - p.startX, (e.clientY || p.y) - p.startY);
        const now = Date.now();
        const nearLast = Math.hypot((e.clientX || p.x) - lastTapX, (e.clientY || p.y) - lastTapY) < 32;
        if(moved < 12 && now - lastTapAt < 360 && nearLast){
          toggleFit();
          lastTapAt = 0;
        }else if(moved < 12){
          lastTapAt = now;
          lastTapX = e.clientX || p.x;
          lastTapY = e.clientY || p.y;
        }
      }

      if(pointers.has(e.pointerId)) pointers.delete(e.pointerId);
      if(pointers.size) begin();
      else { start = null; saveComposerDraft(); }
    };

    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    box.addEventListener('lostpointercapture', end);
    box.addEventListener('dblclick', e => { e.preventDefault(); toggleFit(); });

    box.addEventListener('wheel', e => {
      const f = cleanMediaFrame(state.mediaFrame || {});
      f.scale = clampNumber(f.scale + (e.deltaY < 0 ? .08 : -.08), .35, 3.2, 1);
      state.mediaFrame = f;
      applyFramePreviewStyles();
      saveComposerDraft();
      e.preventDefault();
    }, {passive:false});
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
      serviceArea: form.zone,
      category: form.category,
      mediaUrl: old?.mediaUrl || '',
      mediaItems: state.composerMediaItems?.length ? state.composerMediaItems : (old?.mediaItems || []),
      mediaRef: state.composerMediaRef || old?.mediaRef || '',
      mediaPreviewUrl: state.preview || old?.mediaPreviewUrl || '',
      mediaType: state.mediaType || old?.mediaType || 'image',
      mediaMime: state.composerMediaMime || old?.mediaMime || '',
      mediaName: state.composerMediaName || old?.mediaName || '',
      mediaStatus: (state.composerMediaRef || state.composerMediaItems?.some(item => item.mediaRef && !item.mediaUrl)) ? 'pendiente' : '',
      mediaFit: cleanMediaFrame(state.mediaFrame || old || {}).fit,
      mediaScale: cleanMediaFrame(state.mediaFrame || old || {}).scale,
      mediaX: cleanMediaFrame(state.mediaFrame || old || {}).x,
      mediaY: cleanMediaFrame(state.mediaFrame || old || {}).y,
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

    if(firstSync) localStorage.removeItem(K.editingId); clearComposer();
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
    state.directEditPostId = '';
    state.directFramePostId = '';
    state.directMediaPostId = '';
    const post = state.posts.find(x=>x.id===id);
    if(!post || !canFramePostAsAdmin(post)) return toast('Solo puedes editar publicaciones propias o activar modo admin.');
    state.editing = {...post};
    state.composerId = post.id;
    state.preview = resolveMedia(post);
    state.mediaType = post.mediaType || 'image';
    state.composerMediaRef = post.mediaRef || '';
    state.composerMediaName = post.mediaName || '';
    state.composerMediaMime = post.mediaMime || '';
    state.composerDraft = {description:post.description||'', zone:post.zone||'', category:normalizeCategory(post.category)};
    state.mediaFrame = mediaFrameFromPost(post);
    localStorage.setItem(K.editingId, post.id);
    saveComposerDraft();
    nav('/publicar');
  }

  async function deletePost(id){
    const post = state.posts.find(x=>x.id===id);
    if(!post || !canFramePostAsAdmin(post)) return toast('Solo puedes borrar publicaciones propias o activar modo admin.');
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
    const width = Math.max(1, gallery.clientWidth);
    const scrollIndex = Math.min(total - 1, Math.max(0, Math.round(gallery.scrollLeft / width)));
    const saved = Number(gallery.dataset.galleryIndex);
    const index = Number.isFinite(saved) ? Math.min(total - 1, Math.max(0, saved)) : scrollIndex;
    gallery.dataset.galleryIndex = String(index);
    state.galleryIndex[String(id)] = index;
    const safe = (window.CSS && CSS.escape) ? CSS.escape(id) : String(id).replace(/["\\]/g, '\\$&');

    document.querySelectorAll(`[data-gallery-dot="${safe}"]`).forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-current', i === index ? 'true' : 'false');
    });

    document.querySelectorAll(`[data-gallery-count="${safe}"]`).forEach(el => {
      el.textContent = `${index + 1} / ${total}`;
      const wrap = el.closest('[data-gallery-dots]');
      if(wrap) wrap.setAttribute('aria-label', `Foto ${index + 1} de ${total}`);
    });
  }

  function goGallery(id, index){
    const safeId = (window.CSS && CSS.escape) ? CSS.escape(id) : String(id).replace(/["\\]/g, '\\$&');
    const gallery = document.querySelector(`[data-gallery="${safeId}"]`);
    if(!gallery) return;
    const total = Number(gallery.dataset.galleryTotal || gallery.querySelectorAll('img').length || 1);
    const nextIndex = Math.min(total - 1, Math.max(0, Number(index || 0)));
    const target = nextIndex * Math.max(1, gallery.clientWidth);
    gallery.dataset.galleryIndex = String(nextIndex);
    state.galleryIndex[String(id)] = nextIndex;
    gallery.scrollTo({left: target, behavior:'smooth'});
    setTimeout(()=>{ gallery.scrollLeft = target; updateGalleryCounter(gallery); }, 180);
  }

  function stepGallery(id, delta){
    const current = activeGalleryIndex(id);
    goGallery(id, current + Number(delta || 0));
  }

  function setupGalleries(){
    document.querySelectorAll('.media-carousel').forEach(gallery => {
      if(gallery.dataset.galleryBound === '1') return;
      gallery.dataset.galleryBound = '1';

      const id = gallery.dataset.gallery;
      const stage = gallery.closest('.gallery-stage') || gallery;

      const total = () => Number(gallery.dataset.galleryTotal || gallery.querySelectorAll('img').length || 1);
      const currentIndex = () => {
        const saved = Number(gallery.dataset.galleryIndex ?? state.galleryIndex[String(id)]);
        if(Number.isFinite(saved)) return Math.min(total() - 1, Math.max(0, saved));
        return Math.min(total() - 1, Math.max(0, Math.round(gallery.scrollLeft / Math.max(1, gallery.clientWidth))));
      };
      const setIndex = (index, smooth=true) => {
        const next = Math.min(total() - 1, Math.max(0, Number(index || 0)));
        gallery.dataset.galleryIndex = String(next);
        state.galleryIndex[String(id)] = next;
        const target = next * Math.max(1, gallery.clientWidth);
        gallery.scrollTo({left: target, behavior:smooth ? 'smooth' : 'auto'});
        setTimeout(()=>{ gallery.scrollLeft = target; updateGalleryCounter(gallery); }, smooth ? 120 : 20);
      };
      const refreshDots = () => {
        if(gallery._raf) cancelAnimationFrame(gallery._raf);
        gallery._raf = requestAnimationFrame(()=>updateGalleryCounter(gallery));
      };

      let swipe = null;
      const beginSwipe = (x,y) => {
        swipe = {x,y,lastX:x,lastY:y,horizontal:false,index:currentIndex()};
      };
      const moveSwipe = (x,y,ev) => {
        if(!swipe) return;
        const dx = x - swipe.x;
        const dy = y - swipe.y;
        swipe.lastX = x;
        swipe.lastY = y;
        if(!swipe.horizontal && Math.abs(dx) > 3 && Math.abs(dx) > Math.abs(dy) * .85){
          swipe.horizontal = true;
          stage.classList.add('is-swiping-gallery');
        }
        if(swipe.horizontal){
          gallery.scrollLeft = swipe.index * Math.max(1, gallery.clientWidth) - dx;
          refreshDots();
          ev?.preventDefault?.();
          ev?.stopPropagation?.();
        }
      };
      const endSwipe = (ev) => {
        if(!swipe) return;
        const dx = swipe.lastX - swipe.x;
        const dy = swipe.lastY - swipe.y;
        if(swipe.horizontal && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * .75){
          setIndex(swipe.index + (dx < 0 ? 1 : -1), true);
          ev?.preventDefault?.();
          ev?.stopPropagation?.();
        }else if(swipe.horizontal){
          setIndex(swipe.index, true);
        }
        stage.classList.remove('is-swiping-gallery');
        swipe = null;
      };

      stage.addEventListener('touchstart', e => {
        if(state.directFramePostId) return;
        if(!e.touches || !e.touches.length) return;
        const t = e.touches[0];
        beginSwipe(t.clientX, t.clientY);
      }, {passive:true});

      stage.addEventListener('touchmove', e => {
        if(state.directFramePostId) return;
        if(!swipe || !e.touches || !e.touches.length) return;
        const t = e.touches[0];
        moveSwipe(t.clientX, t.clientY, e);
      }, {passive:false});

      stage.addEventListener('touchend', e => endSwipe(e), {passive:false});
      stage.addEventListener('touchcancel', e => endSwipe(e), {passive:false});

      stage.addEventListener('pointerdown', e => {
        if(state.directFramePostId) return;
        if(e.pointerType === 'touch') return;
        beginSwipe(e.clientX, e.clientY);
      }, {passive:true});
      stage.addEventListener('pointermove', e => {
        if(state.directFramePostId || !swipe || e.pointerType === 'touch') return;
        moveSwipe(e.clientX, e.clientY, e);
      }, {passive:false});
      stage.addEventListener('pointerup', e => {
        if(e.pointerType === 'touch') return;
        endSwipe(e);
      }, {passive:false});
      stage.addEventListener('pointercancel', e => {
        if(e.pointerType === 'touch') return;
        endSwipe(e);
      }, {passive:false});

      setIndex(activeGalleryIndex(id), false);
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
    document.querySelectorAll(`[data-toggle-video-sound="${safeId}"]`).forEach(el => {
      el.textContent = video.muted ? '🔇' : '🔊';
    });
    toast(video.muted ? 'Video en silencio.' : 'Sonido activado. Usa el volumen de tu dispositivo.');
  }


  function setupInternalVideos(){
    const videos = [...document.querySelectorAll('video.feed-video-player')];

    if(!state.videoObserver && 'IntersectionObserver' in window){
      state.videoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const video = entry.target;
          if(!video || !video.matches?.('video.feed-video-player')) return;
          if(entry.isIntersecting && entry.intersectionRatio > 0.45){
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            document.querySelectorAll('video.feed-video-player').forEach(other => {
              if(other !== video) { try{ other.pause(); }catch{} }
            });
            video.play?.().catch(()=>null);
          }else{
            try{ video.pause(); }catch{}
          }
        });
      }, {threshold:[0, .45, .75]});
    }

    videos.forEach(video => {
      if(video.dataset.csObserved !== '1' && state.videoObserver){
        state.videoObserver.observe(video);
        video.dataset.csObserved = '1';
      }
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
    const postId = String(id || '');
    const cur = likedPostIds().map(String);
    const already = cur.includes(postId);
    const next = already ? cur.filter(x => x !== postId) : [...cur, postId];
    set(K.likedPosts, next);
    saveLocalPosts(state.posts.map(p => String(p.id) === postId ? {...p, reactions:Math.max(0,(p.reactions||0)+(already?-1:1))} : p));
    toast(already ? 'Quitado de Para ti.' : 'Agregado a Para ti.');
    render();
  }
  function toggleFollow(ownerId){ if(ownerId===userId()) return toast('Esta publicación es tuya.'); const cur=follows(); const next=cur.includes(ownerId)?cur.filter(id=>id!==ownerId):[...cur,ownerId]; set(K.follows,next); toast(cur.includes(ownerId)?'Dejaste de seguir.':'Ahora lo sigues.'); render(); }
  function sharePost(id){ const p=state.posts.find(x=>x.id===id); if(!p) return; const text=`${p.title}\n\n${p.description}\n\n${p.category} · ${p.zone}\n\n${APP_URL}`; if(navigator.share) navigator.share({title:p.title,text,url:APP_URL}).catch(()=>{}); else navigator.clipboard?.writeText(text).then(()=>toast('Copiado para compartir.')); }
  async function saveProfile(){
    const current = profile();
    const name=document.getElementById('profileName')?.value.trim()||'Usuario local';
    const bestAvatar = String(current.avatarData || '').trim() || bestLocalProfileAvatar();
    let nextProfile = saveProfileEverywhere({...current, name, avatarData:bestAvatar, updatedAt:new Date().toISOString()});
    if(bestAvatar && !isHttpAvatarUrl(bestAvatar)){
      toast('Subiendo foto de perfil a la nube...');
      nextProfile = await uploadProfileAvatarToCloud(nextProfile);
      saveProfileEverywhere(nextProfile);
    }
    applyProfileToOwnPosts(nextProfile);
    state.profileEditing=false;
    toast(isHttpAvatarUrl(nextProfile.avatarData) ? 'Perfil guardado con foto visible en otros celulares.' : 'Perfil guardado y aplicado a tus publicaciones.');
    render();
  }

  function applyProfileToOwnPosts(prof=profile()){
    prof = normalizeProfile(prof);
    if(!isPersonalProfile(prof)) return;
    const avatar = String(prof.avatarData || '').trim() || bestLocalProfileAvatar();
    const cleanProf = normalizeProfile({...prof, avatarData:avatar});
    saveProfileEverywhere(cleanProf);
    const mine = state.posts.filter(p => p.ownerId === userId());
    if(!mine.length) return;
    const now = new Date().toISOString();
    const updated = state.posts.map(p => p.ownerId === userId() ? {...p, ownerName:cleanProf.name || 'Usuario local', ownerAvatar:cleanProf.avatarData || '', updatedAt:now} : p);
    saveLocalPosts(updated);
    state.posts = updated;
    mine.forEach(p => syncPost({...p, ownerName:cleanProf.name || 'Usuario local', ownerAvatar:cleanProf.avatarData || '', updatedAt:now}).catch(()=>null));
  }

  function applyProfileToVisiblePosts(options={}){
    // v6.4.48: esta función queda segura. Ya no cambia ownerId ni reclama publicaciones visibles.
    // Solo actualiza nombre/foto de publicaciones que ya son realmente del usuario actual.
    const prof = profile();
    const ownVisible = filteredAll().filter(p => !isDeleted(p) && !isSeed(p) && p.ownerId === userId());
    if(!ownVisible.length){
      if(!options.silent) toast('No hay publicaciones propias visibles para actualizar.');
      return;
    }

    const now = new Date().toISOString();
    const ids = new Set(ownVisible.map(p => String(p.id)));
    const updated = state.posts.map(p => ids.has(String(p.id)) ? {
      ...p,
      ownerName: prof.name || 'Usuario local',
      ownerAvatar: prof.avatarData || '',
      updatedAt: now
    } : p);

    saveLocalPosts(updated);
    updated.filter(p => ids.has(String(p.id))).forEach(p => syncPost(p).catch(()=>null));
    if(!options.silent){
      toast('Perfil aplicado a tus publicaciones propias.');
      render();
    }
  }

  async function profilePhotoChosen(event){
    const file = event.target.files?.[0];
    event.target.value = '';
    if(!file) return;
    if(!file.type.startsWith('image/')) return toast('Elige una imagen para tu perfil.');
    try{
      const resized = await resizeImage(file, 180, .68);
      const avatarData = await blobToDataURL(resized);
      const current = profile();
      const name = document.getElementById('profileName')?.value.trim() || current.name || 'Usuario local';
      let nextProfile = saveProfileEverywhere({...current, name, avatarData, updatedAt:new Date().toISOString()});
      toast('Subiendo foto de perfil a la nube...');
      nextProfile = await uploadProfileAvatarToCloud(nextProfile);
      saveProfileEverywhere(nextProfile);
      applyProfileToOwnPosts(nextProfile);
      toast(isHttpAvatarUrl(nextProfile.avatarData) ? 'Foto de perfil visible en otros celulares.' : 'Foto guardada localmente. Revisa conexión para nube.');
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
        if(!initial && !isMeId(m.senderId)) fresh.push(m);
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
      if(m && m.id && !isMeId(m.senderId) && !state.readMessageIds.has(m.id)){
        state.readMessageIds.add(m.id);
        changed = true;
      }
    });
    if(changed) persistReadMessageIds();
    return changed;
  }

  function postOwnerIdFromMessage(m){
    const post = (state.posts || []).find(p => String(p.id || '') === String(m?.postId || ''));
    return String(post?.ownerId || '').trim();
  }

  function adminThreadPartsForMessage(m){
    const postId = String(m?.postId || '');
    let ownerId = postOwnerIdFromMessage(m);
    const senderId = String(m?.senderId || '').trim();
    const receiverId = String(m?.receiverId || '').trim();

    if(!ownerId){
      // En mensajes iniciados desde una publicación, el primer receptor normalmente es el dueño real.
      ownerId = receiverId || senderId;
    }

    let peerId = senderId === ownerId ? receiverId : senderId;
    if(!peerId || peerId === ownerId){
      peerId = [senderId, receiverId].find(id => id && id !== ownerId) || senderId || receiverId;
    }

    const pair = [ownerId, peerId].filter(Boolean).sort().join('::');
    return {
      postId,
      ownerId,
      peerId,
      key:`admin::${postId}::${pair || m?.id || ''}`
    };
  }

  function adminThreadKeyForMessage(m){
    return adminThreadPartsForMessage(m).key;
  }

  function chatMatchesMessage(m, chat=state.chat){
    if(!m || !chat) return false;
    if(adminFrameMode() && chat.adminThreadKey){
      const parts = adminThreadPartsForMessage(m);
      const chatOwnerId = String(chat.adminOwnerId || '').trim();
      const chatPeerId = String(chat.adminPeerId || chat.peerId || '').trim();
      if(chatOwnerId && chatPeerId){
        return String(m.postId || '') === String(chat.postId || '') &&
          ((String(m.senderId || '') === chatOwnerId && String(m.receiverId || '') === chatPeerId) ||
           (String(m.senderId || '') === chatPeerId && String(m.receiverId || '') === chatOwnerId));
      }
      return parts.key === chat.adminThreadKey;
    }
    return (m.postId||'') === (chat.postId||'') &&
      ((isMeId(m.senderId) && m.receiverId === chat.peerId) || (m.senderId === chat.peerId && isMeId(m.receiverId)));
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
    const activeUserId = userId();
    state.messagesLoading = !options.silent;
    state.messagesError = '';
    try{
      const list = await fetchMessagesForIdentity({});
      const previous = JSON.stringify(state.publicMessages || []);
      const previousUnread = unreadCount();
      trackMessages(list, {initial:!state.messagesLoaded || state.messagesUserId !== activeUserId});
      state.publicMessages = list;
      state.messagesLoaded = true;
      state.messagesUserId = activeUserId;
      state.messagesLastFetchedAt = Date.now();
      state.messagesLastCount = list.length;
      if(state.route === '/chat') markActiveChatRead();

      const changed = JSON.stringify(list)!==previous || unreadCount()!==previousUnread;
      const shouldRenderInbox = state.route === '/mensajes';
      if(options.silent && state.route !== '/publicar' && !shouldAvoidRender() && (changed || shouldRenderInbox)) render();
    }catch(error){
      state.messagesError = 'Todavía no se pudieron cargar los mensajes públicos.';
      state.messagesLoaded = false;
      state.messagesLastCount = 0;
      if(!options.silent) toast('No se pudieron cargar los mensajes.');
      console.warn('[Conecta mensajes]', error);
    }finally{
      state.messagesLoading = false;
      if(state.route === '/mensajes' && !options.silent) render();
    }
  }


  async function forceRefreshMessages(){
    const activeUserId = userId();
    state.messagesLoading = true;
    state.messagesError = '';
    render();
    try{
      const list = await fetchMessagesForIdentity({direct:'1'});
      trackMessages(list, {initial:false});
      state.publicMessages = Array.isArray(list) ? list : [];
      state.messagesLoaded = true;
      state.messagesUserId = activeUserId;
      state.messagesLastFetchedAt = Date.now();
      state.messagesLastCount = state.publicMessages.length;
      state.messagesError = '';
      toast(`${state.publicMessages.length} mensajes cargados.`);
    }catch(error){
      state.messagesError = `No se pudieron cargar mensajes: ${error?.message || error || 'error desconocido'}`;
      state.messagesLoaded = false;
      state.messagesLastCount = 0;
      toast('No se pudieron cargar mensajes.');
      console.warn('[Conecta force mensajes]', error);
    }finally{
      state.messagesLoading = false;
      if(state.route === '/mensajes') render();
    }
  }

  function messageVisibleCard(m){
    const me = userId();
    const admin = adminFrameMode();
    const incoming = admin ? true : (m.receiverId === me && m.senderId !== me);
    const peerId = admin ? (m.senderId && !isMeId(m.senderId) ? m.senderId : (m.receiverId || m.senderId || '')) : (incoming ? m.senderId : m.receiverId);
    const peerName = admin ? `${m.senderName || 'Usuario'} → ${m.receiverName || 'Usuario'}` : (incoming ? (m.senderName || 'Usuario local') : (m.receiverName || 'Usuario local'));
    const direction = admin ? 'Admin' : (incoming ? 'Recibido' : 'Enviado');
    return `<article class="message-visible-card ${incoming ? 'incoming' : 'outgoing'}">
      <div class="message-visible-head">
        <span class="message-visible-badge">${admin ? '🛡️' : (incoming ? '📩' : '↗️')} ${direction}</span>
        <small>${esc(shortDateTime(m.createdAt))}</small>
      </div>
      <strong>${esc(peerName || 'Usuario local')}</strong>
      <em>${esc(m.postTitle || 'Publicación')}</em>
      <p>${esc(m.text || '')}</p>
      <button type="button" class="reply-visible-btn" data-open-chat="1" data-post="${esc(m.postId||'')}" data-peer="${esc(peerId||'')}" data-title="${esc(m.postTitle||'Publicación')}" data-name="${esc(peerName || 'Usuario local')}" data-admin-thread="${esc(admin ? adminThreadKeyForMessage(m) : '')}" data-admin-sender="${esc(m.senderId || '')}" data-admin-receiver="${esc(m.receiverId || '')}" data-admin-owner="${esc(admin ? adminThreadPartsForMessage(m).ownerId : '')}" data-admin-peer="${esc(admin ? adminThreadPartsForMessage(m).peerId : '')}">Responder</button>
    </article>`;
  }

  function messageVisibleList(){
    const me = userId();
    const list = (state.publicMessages || []).slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    if(!list.length) return '';
    const incoming = list.filter(m => m.receiverId === me && m.senderId !== me);
    const outgoing = list.filter(m => !(m.receiverId === me && m.senderId !== me));
    const ordered = [...incoming, ...outgoing];
    return `<div class="visible-message-list">${ordered.map(messageVisibleCard).join('')}</div>`;
  }



  async function loadChatMessages(options={}){
    if(!state.chat || state.chatLoading) return;
    const activeInput = document.getElementById('chatText');
    const isTyping = !!(activeInput && document.activeElement === activeInput && activeInput.value.trim());
    if(options.silent && isTyping) return;
    state.chatLoading = !options.silent;
    try{
      const list = await fetchMessagesForIdentity({postId:state.chat.postId, peerId:state.chat.peerId});
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
    const map = new Map();
    const admin = adminFrameMode();

    (list || []).forEach(m => {
      if(!m || !m.id) return;

      let incoming = false;
      let outgoing = false;
      let peerId = '';
      let peerName = '';
      let key = '';
      let adminThreadKey = '';
      let adminSenderId = '';
      let adminReceiverId = '';
      let adminOwnerId = '';
      let adminPeerId = '';
      const postId = m.postId || '';

      if(admin){
        const parts = adminThreadPartsForMessage(m);
        adminThreadKey = parts.key;
        adminOwnerId = parts.ownerId;
        adminPeerId = parts.peerId;
        adminSenderId = m.senderId || '';
        adminReceiverId = m.receiverId || '';
        key = adminThreadKey;
        incoming = String(m.senderId || '') !== adminOwnerId;
        outgoing = String(m.senderId || '') === adminOwnerId;
        peerId = adminPeerId || parts.peerId || '';
        peerName = nameForMessageParticipant(peerId, 'Usuario local');
      }else{
        incoming = isMeId(m.receiverId) && !isMeId(m.senderId);
        outgoing = isMeId(m.senderId) && !isMeId(m.receiverId);
        if(!incoming && !outgoing) return;
        peerId = incoming ? m.senderId : m.receiverId;
        peerName = incoming ? (m.senderName || 'Usuario local') : (m.receiverName || 'Usuario local');
        key = `${postId}::${peerId || ''}`;
      }

      const prev = map.get(key) || {
        key, postId, postTitle: m.postTitle || 'Publicación', peerId, peerName,
        messages: [], incoming: 0, outgoing: 0, unread: 0, lastText: '', lastAt: '',
        adminThreadKey, adminSenderId, adminReceiverId, adminOwnerId, adminPeerId, adminMode: admin
      };

      const nextMessages = [...prev.messages, m].sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0));
      const last = nextMessages[nextMessages.length - 1] || m;

      map.set(key, {
        ...prev,
        postTitle: last.postTitle || prev.postTitle || 'Publicación',
        peerName: peerName || prev.peerName || 'Usuario local',
        peerId: peerId || prev.peerId || '',
        messages: nextMessages,
        incoming: prev.incoming + (incoming ? 1 : 0),
        outgoing: prev.outgoing + (outgoing ? 1 : 0),
        unread: prev.unread + (incoming && !state.readMessageIds.has(m.id) ? 1 : 0),
        lastText: last.text || '',
        lastAt: last.createdAt || '',
        adminThreadKey: adminThreadKey || prev.adminThreadKey || '',
        adminSenderId,
        adminReceiverId,
        adminOwnerId: adminOwnerId || prev.adminOwnerId || '',
        adminPeerId: adminPeerId || prev.adminPeerId || '',
        adminMode: admin
      });
    });

    return [...map.values()].sort((a,b)=>new Date(b.lastAt||0)-new Date(a.lastAt||0));
  }

  function conversationCard(item){
    const unread = item.unread || 0;
    const count = item.messages?.length || item.count || 0;
    const last = item.lastText || '';
    return `<button class="conversation-card stable-conversation-card ${unread?'has-unread':''}" data-open-chat="1" data-post="${esc(item.postId)}" data-peer="${esc(item.peerId)}" data-title="${esc(item.postTitle)}" data-name="${esc(item.peerName)}" data-admin-thread="${esc(item.adminThreadKey || '')}" data-admin-sender="${esc(item.adminSenderId || '')}" data-admin-receiver="${esc(item.adminReceiverId || '')}" data-admin-owner="${esc(item.adminOwnerId || '')}" data-admin-peer="${esc(item.adminPeerId || item.peerId || '')}">
      <div class="conversation-avatar">${item.adminMode ? '🛡️' : (unread ? '📩' : '💬')}</div>
      <div class="conversation-main">
        <div class="conversation-line">
          <strong>${esc(item.peerName || 'Usuario local')}</strong>
          <small>${esc(shortDateTime(item.lastAt))}</small>
        </div>
        <em>${esc(item.postTitle || 'Publicación')}</em>
        <p>${esc(last)}</p>
        <span class="conversation-mini">${item.adminMode ? 'Admin · ' : ''}${count} mensaje${count===1?'':'s'} · ${item.incoming || 0} recibido${(item.incoming||0)===1?'':'s'}</span>
      </div>
      ${unread ? `<span class="conversation-count unread">${unread>99?'99+':unread}</span>` : '<span class="conversation-chevron">›</span>'}
    </button>`;
  }

  function messagesScopedList(){
    const all = state.publicMessages || [];
    const filter = String(state.messagesPostFilter || '');
    return filter ? all.filter(m => String(m?.postId || '') === filter) : all;
  }

  function conversationListMarkup(){
    const scoped = messagesScopedList();
    const groups = conversationGroups(scoped);
    if(!groups.length) return '';
    return `<div class="conversation-section">
      <h2>${state.messagesPostFilter ? 'Conversaciones de esta publicación' : 'Conversaciones'}</h2>
      <div class="list conversation-list">${groups.map(conversationCard).join('')}</div>
    </div>`;
  }

  function directMessagesBackupMarkup(){
    const original = state.publicMessages;
    state.publicMessages = messagesScopedList();
    const direct = messageVisibleList();
    state.publicMessages = original;
    if(!direct) return '';
    return `<details class="message-backup-details">
      <summary>Ver mensajes individuales</summary>
      ${direct}
    </details>`;
  }

  function messagesPage(){
    const activeUserId = userId();
    const adminInbox = adminFrameMode();
    const stale = Date.now() - (state.messagesLastFetchedAt || 0) > 2500;
    if(!state.messagesLoading && (!state.messagesLoaded || state.messagesUserId !== activeUserId || stale)){
      loadMessagesForInbox({silent:state.messagesLoaded && state.messagesUserId === activeUserId});
    }

    const lastFetch = state.messagesLastFetchedAt ? shortTime(state.messagesLastFetchedAt) : 'sin cargar';
    const conversations = conversationListMarkup();
    const backup = directMessagesBackupMarkup();
    const filteredPost = !!state.messagesPostFilter;
    const filteredPostTitle = state.messagesPostTitle || 'esta publicación';

    return shell(`<section class="panel messages-panel">
      <h1>Mensajes</h1>
      <p>${filteredPost ? `Viendo solo conversaciones de: ${esc(filteredPostTitle)}` : (adminInbox ? 'Modo admin: aquí aparecen conversaciones globales de publicaciones.' : 'Aquí aparecen las conversaciones de tus publicaciones.')}</p>
      ${adminInbox && !filteredPost ? '<div class="local-note">🛡️ Bandeja global admin activa en este celular.</div>' : ''}
      ${filteredPost ? '<div class="local-note">Filtro por publicación activo. <button type="button" class="small-link" data-clear-message-filter>Ver todas las conversaciones</button></div>' : ''}
      <div class="message-toolbar">
        <button type="button" class="small-link refresh-messages-btn" data-refresh-messages>${adminInbox ? 'Actualizar bandeja admin' : 'Actualizar mensajes'}</button>
        <small>${state.messagesLoading ? 'Cargando...' : `${state.messagesLastCount || 0} mensajes · ${esc(lastFetch)}`}</small>
      </div>
      <div class="message-debug-mini">
        <small>Este celular: <strong>${esc(activeUserId.slice(-10))}</strong> · IDs: ${identityAliases().length}${adminInbox ? ' · admin global' : ''}</small>
        <small>API: ${state.messagesError ? 'con error' : (state.messagesLoaded ? 'cargada' : 'pendiente')}</small>
      </div>
      ${state.messagesError ? `<div class="local-note">${esc(state.messagesError)}</div>` : ''}
      ${conversations || (!state.messagesLoading ? emptyState('Sin conversaciones','Toca Actualizar mensajes. Cuando alguien escriba desde una publicación aparecerá aquí.') : '<div class="empty compact-empty"><strong>Cargando...</strong></div>')}
      ${backup}
    </section>`);
  }

  function chatBubble(m){
    const mine = isMeId(m.senderId);
    return `<div class="bubble-row ${mine?'mine':'theirs'}"><div class="bubble"><p>${esc(m.text || '')}</p><small>${esc(shortTime(m.createdAt || Date.now()))}${mine?' ✓':''}</small></div></div>`;
  }

  function chatPage(){
    const chat = state.chat;
    if(!chat) return shell(`<section class="panel"><button class="back-btn" data-nav="/mensajes">← Volver</button><h1>Chat</h1></section>`);
    if(!state.chatLoaded && !state.chatLoading) loadChatMessages();
    return shell(`<section class="panel chat-panel">
      <div class="chat-topbar">
        <button class="back-btn" data-nav="/mensajes">←</button>
        <div><h1>${esc(chat.peerName || 'Usuario local')}</h1><small>${adminFrameMode() && chat.adminThreadKey ? 'Admin · ' : ''}${esc(chat.postTitle || 'Publicación')} · ${state.chatMessages.length || 0} mensaje${state.chatMessages.length===1?'':'s'}</small></div>
        <button type="button" class="chat-refresh-btn" data-refresh-chat>Actualizar</button>
      </div>
      <div class="chat-feed" id="chatFeed">${state.chatLoading ? '<div class="empty compact-empty"><strong>Cargando...</strong></div>' : ''}${state.chatMessages.map(chatBubble).join('') || (!state.chatLoading ? '<div class="empty compact-empty"><strong>Empieza la conversación</strong></div>' : '')}</div>
      <div class="chat-box"><textarea id="chatText" placeholder="Escribe un mensaje"></textarea><button class="big-button" data-send-chat>Enviar</button></div>
    </section>`);
  }

  function openChat(postId){
    const p = state.posts.find(x=>x.id===postId);
    if(!p) return;
    if(isMeId(p.ownerId) || adminFrameMode()){
      state.messagesPostFilter = p.id;
      state.messagesPostTitle = p.title || 'Publicación';
      toast('Mostrando mensajes de esta publicación.');
      nav('/mensajes', {keepMessageFilter:true});
      return;
    }
    state.chat = {postId:p.id, postTitle:p.title || 'Publicación', peerId:p.ownerId, peerName:p.ownerName || 'Usuario local'};
    state.chatMessages = [];
    state.chatLoaded = false;
    markActiveChatRead();
    nav('/chat');
  }

  
  function postForChat(chat=state.chat){
    if(!chat?.postId) return null;
    return (state.posts || []).find(p => String(p.id || '') === String(chat.postId || '')) || null;
  }

  function nameForMessageParticipant(participantId, fallback='Usuario local'){
    participantId = String(participantId || '').trim();
    if(!participantId) return fallback;

    const messages = [
      ...(state.chatMessages || []),
      ...(state.publicMessages || [])
    ];

    for(const m of messages){
      if(!m) continue;
      if(String(m.senderId || '') === participantId && m.senderName) return m.senderName;
      if(String(m.receiverId || '') === participantId && m.receiverName) return m.receiverName;
    }

    const post = (state.posts || []).find(p => String(p.ownerId || '') === participantId);
    if(post?.ownerName) return post.ownerName;

    return fallback;
  }

  function adminReplyIdentity(chat=state.chat){
    const post = postForChat(chat);
    const explicitOwnerId = String(chat?.adminOwnerId || '').trim();
    const explicitPeerId = String(chat?.adminPeerId || chat?.peerId || '').trim();

    const ownerId = explicitOwnerId || String(post?.ownerId || '').trim() || String(chat?.adminReceiverId || '').trim();
    const ownerName = String(post?.ownerName || nameForMessageParticipant(ownerId, profile().name || 'Usuario local') || 'Usuario local').trim();

    const receiverId = explicitPeerId || String(chat?.adminSenderId || '').trim() || String(chat?.peerId || '').trim();
    const receiverName = nameForMessageParticipant(receiverId, chat?.peerName || 'Usuario local');

    return {
      senderId: ownerId || userId(),
      senderName: ownerName || profile().name || 'Usuario local',
      receiverId: receiverId || chat?.peerId || '',
      receiverName: receiverName || chat?.peerName || 'Usuario local'
    };
  }

function openChatFromConversation(button){
    const chat = {
      postId:button.dataset.post||'',
      postTitle:button.dataset.title||'Publicación',
      peerId:button.dataset.adminPeer || button.dataset.peer || '',
      peerName:button.dataset.name||'Usuario local',
      adminThreadKey:button.dataset.adminThread || '',
      adminSenderId:button.dataset.adminSender || '',
      adminReceiverId:button.dataset.adminReceiver || '',
      adminOwnerId:button.dataset.adminOwner || '',
      adminPeerId:button.dataset.adminPeer || ''
    };
    state.chat = chat;
    state.chatMessages = (state.publicMessages || []).filter(m => chatMatchesMessage(m, chat)).sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0));
    state.chatLoaded = state.chatMessages.length > 0;
    markActiveChatRead();
    nav('/chat');
  }

  async function sendChatMessage(){
    if(!state.chat) return;
    const input = document.getElementById('chatText');
    const text = (input?.value || '').trim();
    if(!text) return toast('Escribe un mensaje.');

    const prof = profile();
    let senderId = userId();
    let senderName = prof.name || 'Usuario local';
    let receiverId = state.chat.peerId;
    let receiverName = state.chat.peerName || 'Usuario local';

    if(adminFrameMode() && state.chat.adminThreadKey){
      const adminIdentity = adminReplyIdentity(state.chat);
      senderId = adminIdentity.senderId || senderId;
      senderName = adminIdentity.senderName || senderName;
      receiverId = adminIdentity.receiverId || receiverId;
      receiverName = adminIdentity.receiverName || receiverName;
    }

    const msg = {
      id:uid('msg'),
      postId:state.chat.postId,
      postTitle:state.chat.postTitle,
      senderId,
      senderName,
      receiverId,
      receiverName,
      text,
      status:'sent',
      createdAt:new Date().toISOString()
    };

    if(input) input.value = '';
    state.chatMessages = [...state.chatMessages, msg];
    render(); scrollChatToBottom('smooth');
    try{
      await savePublicMessage(msg);
      state.messagesLoaded = false;
      await loadChatMessages({silent:true});
      loadMessagesForInbox({silent:true}).catch(()=>null);
      toast('Mensaje enviado.');
    }catch{
      toast('No se pudo enviar. Revisa conexión.');
    }
  }

  function cssEscape(value){
    try { return CSS.escape(String(value)); } catch { return String(value).replace(/["\\]/g, '\\$&'); }
  }

  function scrollBackToPost(postId){
    setTimeout(() => {
      const card = document.querySelector(`[data-post-card="${cssEscape(postId)}"]`);
      if(card){
        card.scrollIntoView({block:'center', behavior:'smooth'});
      }else{
        scrollTo({top:0, behavior:'smooth'});
      }
    }, 90);
  }

  function frameTargetIndex(postId){
    const n = Number(state.directFrameIndex);
    if(Number.isFinite(n)) return Math.max(0, n);
    return activeGalleryIndex(postId);
  }

  function postFrameData(post){
    const imageItems = galleryImageItems(post);
    if(imageItems.length > 1){
      const item = imageItems[Math.min(imageItems.length - 1, frameTargetIndex(post.id))] || {};
      const f = cleanItemFrame(item);
      return {fit:f.fit, scale:f.scale, x:f.x, y:f.y};
    }
    const f = mediaFrameFromPost(post || {});
    return {fit:f.fit, scale:f.scale, x:f.x, y:f.y};
  }

  function applyPostFrameToDom(postId, frame){
    const f = cleanMediaFrame(frame || {});
    const area = document.querySelector(`[data-direct-frame-area="${cssEscape(postId)}"]`);
    if(!area) return;
    const all = [...area.querySelectorAll('.framed-media')];
    const gallery = area.querySelector('.media-carousel');
    const targets = gallery && all.length > 1 ? [all[Math.min(all.length - 1, frameTargetIndex(postId))]].filter(Boolean) : all;
    targets.forEach(el => {
      el.style.setProperty('--media-fit', f.fit);
      el.style.setProperty('--media-x', `${f.x}%`);
      el.style.setProperty('--media-y', `${f.y}%`);
      el.style.setProperty('--media-tx', `${f.x - 50}%`);
      el.style.setProperty('--media-ty', `${f.y - 50}%`);
      el.style.setProperty('--media-scale', `${f.scale}`);
    });
  }

  function updatePostFrameLocal(postId, frame, options={}){
    const f = cleanMediaFrame(frame || {});
    const now = new Date().toISOString();
    const nextPosts = state.posts.map(p => {
      if(String(p.id) !== String(postId)) return p;
      const imageItems = galleryImageItems(p);
      if(imageItems.length > 1){
        const idx = Math.min(imageItems.length - 1, frameTargetIndex(postId));
        let imageCursor = -1;
        const nextItems = (Array.isArray(p.mediaItems) ? p.mediaItems : []).map((item) => {
          const type = String(item?.mediaType || p.mediaType || 'image').toLowerCase();
          if(type === 'video') return item;
          imageCursor += 1;
          const baseFrame = cleanItemFrame(item || {});
          const nextFrame = imageCursor === idx ? f : baseFrame;
          return {
            ...item,
            mediaFit: nextFrame.fit,
            mediaScale: nextFrame.scale,
            mediaX: nextFrame.x,
            mediaY: nextFrame.y
          };
        });
        return normalizePost({
          ...p,
          mediaItems: nextItems,
          // El encuadre general ya no gobierna las fotos de una galería.
          mediaFit:'contain',
          mediaScale:1,
          mediaX:50,
          mediaY:50,
          updatedAt: options.touchUpdatedAt === false ? p.updatedAt : now
        });
      }
      return normalizePost({
        ...p,
        mediaFit:f.fit,
        mediaScale:f.scale,
        mediaX:f.x,
        mediaY:f.y,
        updatedAt: options.touchUpdatedAt === false ? p.updatedAt : now
      });
    });
    state.posts = nextPosts;
    if(options.save !== false) set(K.posts, nextPosts.map(stripForLocal));
    applyPostFrameToDom(postId, f);
    return nextPosts.find(p => String(p.id) === String(postId));
  }

  function startDirectFrame(postId){
    const post = state.posts.find(p => String(p.id) === String(postId));
    if(!post || !canFramePostAsAdmin(post)) return toast('Solo puedes encuadrar publicaciones propias o activar modo admin.');
    if(!resolveMedia(post)) return toast('Esta publicación no tiene multimedia para encuadrar.');

    const gallery = document.querySelector(`[data-gallery="${cssEscape(postId)}"]`);
    const total = gallery ? Number(gallery.dataset.galleryTotal || gallery.querySelectorAll('img').length || 1) : galleryImageItems(post).length || 1;
    const fromDataset = gallery ? Number(gallery.dataset.galleryIndex) : Number.NaN;
    const fromState = Number(state.galleryIndex[String(postId)]);
    const fromScroll = gallery ? Math.round(gallery.scrollLeft / Math.max(1, gallery.clientWidth)) : 0;
    const current = Math.min(total - 1, Math.max(0, Number.isFinite(fromDataset) ? fromDataset : (Number.isFinite(fromState) ? fromState : fromScroll)));

    state.galleryIndex[String(postId)] = current;
    state.directFrameIndex = current;
    state.directEditPostId = '';
    state.directMediaPostId = '';
    state.directFramePostId = String(postId);
    state.directFrameOriginal = postFrameData(post);
    state.directFrameSaving = false;
    render();
    setTimeout(() => {
      const area = document.querySelector(`[data-direct-frame-area="${cssEscape(postId)}"]`);
      area?.scrollIntoView({block:'center', behavior:'smooth'});
    }, 80);
    toast('Ajusta con un dedo o pellizco.');
  }

  function cancelDirectFrame(postId){
    if(state.directFrameOriginal && String(state.directFramePostId) === String(postId)){
      updatePostFrameLocal(postId, state.directFrameOriginal, {save:true, touchUpdatedAt:false});
    }
    state.directFramePostId = '';
    state.directFrameOriginal = null;
    state.directFrameSaving = false;
    render();
    scrollBackToPost(postId);
  }

  async function saveDirectFrame(postId){
    const post = state.posts.find(p => String(p.id) === String(postId));
    if(!post || !canFramePostAsAdmin(post)) return toast('Solo puedes guardar publicaciones propias o activar modo admin.');
    state.directFrameSaving = true;
    render();
    const updated = normalizePost({...post, updatedAt:new Date().toISOString(), cloudStatus: post.cloudStatus || 'publica'});
    saveLocalPosts(state.posts.map(p => String(p.id) === String(postId) ? updated : p));
    const ok = await syncPost(updated);
    state.directFramePostId = '';
    state.directFrameOriginal = null;
    state.directFrameSaving = false;
    render();
    setTimeout(()=>goGallery(postId, activeGalleryIndex(postId)), 80);
    scrollBackToPost(postId);
    toast(ok ? 'Encuadre guardado.' : 'Encuadre guardado localmente. Revisa conexión.');
  }

  function setupDirectFrameEditors(){
    document.querySelectorAll('[data-direct-frame-area]').forEach(area => {
      if(area.dataset.directFrameReady === '1') return;
      area.dataset.directFrameReady = '1';
      const postId = area.dataset.directFrameArea;
      const pointers = new Map();
      let start = null;
      let lastTapAt = 0;
      let lastTapX = 0;
      let lastTapY = 0;
      let raf = 0;

      const post = () => state.posts.find(p => String(p.id) === String(postId));
      const areaSize = () => {
        const rect = area.getBoundingClientRect();
        return {rect, w:Math.max(1, rect.width), h:Math.max(1, rect.height)};
      };
      const distance = () => {
        const pts = [...pointers.values()];
        if(pts.length < 2) return 0;
        return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      };
      const midpoint = (pts) => {
        if(pts.length >= 2) return {x:(pts[0].x + pts[1].x)/2, y:(pts[0].y + pts[1].y)/2};
        return pts[0] || {x:0,y:0};
      };
      const startMidpoint = (pts) => {
        if(pts.length >= 2) return {x:(pts[0].startX + pts[1].startX)/2, y:(pts[0].startY + pts[1].startY)/2};
        return pts[0] ? {x:pts[0].startX, y:pts[0].startY} : {x:0,y:0};
      };
      const begin = () => {
        const pts = [...pointers.values()];
        start = {
          frame: postFrameData(post() || {}),
          dist: distance(),
          mid: midpoint(pts),
          startMid: startMidpoint(pts)
        };
      };
      const apply = (frame) => {
        const f = cleanMediaFrame(frame);
        if(raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => updatePostFrameLocal(postId, f, {save:false}));
      };
      const update = () => {
        if(!start || !pointers.size) return;
        const {w,h} = areaSize();
        const pts = [...pointers.values()];
        let f = cleanMediaFrame(start.frame);

        if(pts.length === 1){
          const p = pts[0];
          const dx = p.x - p.startX;
          const dy = p.y - p.startY;
          // Movimiento directo y sensible: la multimedia sigue el dedo.
          f.x = clampNumber(start.frame.x + (dx / w) * 135, -180, 280, 50);
          f.y = clampNumber(start.frame.y + (dy / h) * 135, -180, 280, 50);
        }else if(pts.length >= 2){
          const d = distance();
          const currentMid = midpoint(pts);
          const originalMid = start.startMid || start.mid || currentMid;

          if(start.dist > 0 && d > 0){
            // Curva ligeramente más sensible para que se note claramente ampliar/reducir.
            const ratio = d / start.dist;
            const adjusted = Math.pow(ratio, 1.08);
            f.scale = clampNumber(start.frame.scale * adjusted, .25, 4.0, 1);
          }

          f.x = clampNumber(start.frame.x + ((currentMid.x - originalMid.x) / w) * 135, -180, 280, 50);
          f.y = clampNumber(start.frame.y + ((currentMid.y - originalMid.y) / h) * 135, -180, 280, 50);
        }

        apply(f);
      };

      const toggleFit = () => {
        const current = postFrameData(post() || {});
        current.fit = current.fit === 'contain' ? 'cover' : 'contain';
        updatePostFrameLocal(postId, current, {save:false});
        toast(current.fit === 'contain' ? 'Modo completo.' : 'Modo llenar pantalla.');
      };

      const addPointer = (e) => {
        if(state.directFramePostId !== String(postId)) return false;
        if(e.target.closest('button')) return false;
        pointers.set(e.pointerId, {x:e.clientX, y:e.clientY, startX:e.clientX, startY:e.clientY});
        try { area.setPointerCapture?.(e.pointerId); } catch {}
        begin();
        return true;
      };

      area.addEventListener('pointerdown', e => {
        if(!addPointer(e)) return;
        area.classList.add('direct-frame-touching');
        e.preventDefault();
        e.stopPropagation();
      }, {passive:false});

      area.addEventListener('pointermove', e => {
        if(!pointers.has(e.pointerId)) return;
        const p = pointers.get(e.pointerId);
        p.x = e.clientX;
        p.y = e.clientY;
        pointers.set(e.pointerId, p);
        update();
        e.preventDefault();
        e.stopPropagation();
      }, {passive:false});

      const end = e => {
        const p = pointers.get(e.pointerId);
        // v6.4.48: el encuadre directo solo usa un dedo para mover y pellizco para tamaño.
        // Se desactiva doble toque para no interferir con el uso normal de la publicación.

        if(pointers.has(e.pointerId)) pointers.delete(e.pointerId);
        if(pointers.size){
          // Cuando queda otro dedo activo, reinicia referencia para que no salte.
          [...pointers.values()].forEach(pt => { pt.startX = pt.x; pt.startY = pt.y; });
          begin();
        }else{
          start = null;
          area.classList.remove('direct-frame-touching');
          updatePostFrameLocal(postId, postFrameData(post() || {}), {save:true, touchUpdatedAt:false});
        }
      };

      area.addEventListener('pointerup', end);
      area.addEventListener('pointercancel', end);
      area.addEventListener('lostpointercapture', end);

      // Respaldo para navegadores que reportan mal el segundo pointer.
      let touchStart = null;
      area.addEventListener('touchstart', e => {
        if(state.directFramePostId !== String(postId)) return;
        if(e.target.closest('button')) return;
        if(window.PointerEvent && pointers.size) return;
        const touches = [...e.touches].map(t => ({x:t.clientX, y:t.clientY, startX:t.clientX, startY:t.clientY}));
        if(!touches.length) return;
        touchStart = {frame:postFrameData(post() || {}), touches};
        e.preventDefault();
        e.stopPropagation();
      }, {passive:false});

      area.addEventListener('touchmove', e => {
        if(state.directFramePostId !== String(postId) || !touchStart) return;
        if(window.PointerEvent && pointers.size) return;
        const touches = [...e.touches].map(t => ({x:t.clientX, y:t.clientY}));
        if(!touches.length) return;
        const {w,h} = areaSize();
        let f = cleanMediaFrame(touchStart.frame);
        if(touches.length === 1 && touchStart.touches.length === 1){
          const s = touchStart.touches[0], t = touches[0];
          f.x = clampNumber(touchStart.frame.x + ((t.x - s.x) / w) * 135, -180, 280, 50);
          f.y = clampNumber(touchStart.frame.y + ((t.y - s.y) / h) * 135, -180, 280, 50);
        }else if(touches.length >= 2 && touchStart.touches.length >= 2){
          const s0 = touchStart.touches[0], s1 = touchStart.touches[1], t0 = touches[0], t1 = touches[1];
          const startDist = Math.hypot(s0.x - s1.x, s0.y - s1.y);
          const currentDist = Math.hypot(t0.x - t1.x, t0.y - t1.y);
          if(startDist > 0 && currentDist > 0){
            f.scale = clampNumber(touchStart.frame.scale * Math.pow(currentDist / startDist, 1.08), .25, 4.0, 1);
          }
          const startMid = {x:(s0.x+s1.x)/2, y:(s0.y+s1.y)/2};
          const currentMid = {x:(t0.x+t1.x)/2, y:(t0.y+t1.y)/2};
          f.x = clampNumber(touchStart.frame.x + ((currentMid.x - startMid.x) / w) * 135, -180, 280, 50);
          f.y = clampNumber(touchStart.frame.y + ((currentMid.y - startMid.y) / h) * 135, -180, 280, 50);
        }
        apply(f);
        e.preventDefault();
        e.stopPropagation();
      }, {passive:false});

      area.addEventListener('touchend', () => {
        if(touchStart){
          touchStart = null;
          updatePostFrameLocal(postId, postFrameData(post() || {}), {save:true, touchUpdatedAt:false});
        }
      }, {passive:true});
    });
  }

  function bindDynamicFeedControls(){
    document.querySelectorAll('[data-clear]').forEach(b=>b.onclick=clearFilters);
    document.querySelectorAll('[data-retry]').forEach(b=>b.onclick=()=>retryPost(b.dataset.retry));
    document.querySelectorAll('[data-like]').forEach(b=>b.onclick=()=>likePost(b.dataset.like));
    document.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>sharePost(b.dataset.share));
    document.querySelectorAll('[data-follow]').forEach(b=>b.onclick=()=>toggleFollow(b.dataset.follow));
    document.querySelectorAll('[data-message]').forEach(b=>b.onclick=()=>openChat(b.dataset.message));
    document.querySelectorAll('[data-open-video]').forEach(el=>el.onclick=(e)=>{ if(state.directFramePostId === el.dataset.openVideo){e.preventDefault();e.stopPropagation();return;} openVideo(el.dataset.openVideo); });
    document.querySelectorAll('[data-reload-video]').forEach(el=>el.onclick=()=>reloadVideo(el.dataset.reloadVideo));
    document.querySelectorAll('[data-toggle-video-sound]').forEach(el=>el.onclick=(e)=>{e.preventDefault();e.stopPropagation();toggleVideoSound(el.dataset.toggleVideoSound);});
    document.querySelectorAll('[data-gallery-dot]').forEach(el=>el.onclick=(e)=>{e.preventDefault();e.stopPropagation();goGallery(el.dataset.galleryDot, el.dataset.galleryIndex);});
    document.querySelectorAll('[data-toggle-description]').forEach(el=>el.onclick=(e)=>{e.preventDefault();e.stopPropagation();toggleDescription(el.dataset.toggleDescription);});
    document.querySelectorAll('.post-description-expanded').forEach(el=>{
      el.onclick=e=>e.stopPropagation();
      el.ontouchstart=e=>e.stopPropagation();
      el.onpointerdown=e=>e.stopPropagation();
    });
    setupInternalVideos();
    setupGalleries();
    document.querySelectorAll('[data-clear-message-filter]').forEach(b=>b.onclick=()=>{state.messagesPostFilter='';state.messagesPostTitle='';render();});
    document.querySelectorAll('[data-open-chat]').forEach(b=>b.onclick=()=>openChatFromConversation(b));
    document.querySelectorAll('[data-send-chat]').forEach(b=>b.onclick=sendChatMessage);
    document.querySelectorAll('[data-refresh-chat]').forEach(b=>b.onclick=()=>loadChatMessages({silent:false}));
    document.querySelectorAll('[data-refresh-messages]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();forceRefreshMessages();});
    document.querySelectorAll('[data-direct-frame-start]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();startDirectFrame(b.dataset.directFrameStart);});
    document.querySelectorAll('[data-direct-frame-save]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();saveDirectFrame(b.dataset.directFrameSave);});
    document.querySelectorAll('[data-direct-frame-cancel]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();cancelDirectFrame(b.dataset.directFrameCancel);});
    setupDirectFrameEditors();
    document.querySelectorAll('[data-direct-media-start]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();startDirectMedia(b.dataset.directMediaStart);});
    document.querySelectorAll('[data-direct-media-pick]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();pickDirectMedia(b.dataset.directMediaPick, b.dataset.directMediaMode || 'replace');});
    document.querySelectorAll('[data-direct-media-cancel]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();cancelDirectMedia(b.dataset.directMediaCancel);});
    document.querySelectorAll('[data-direct-media-remove]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();removeDirectMediaItem(b.dataset.directMediaRemove, b.dataset.directMediaIndex);});
    document.querySelectorAll('[data-direct-media-panel]').forEach(panel=>{
      panel.onclick=e=>e.stopPropagation();
      panel.onpointerdown=e=>e.stopPropagation();
      panel.ontouchstart=e=>e.stopPropagation();
    });
    document.querySelectorAll('[data-direct-edit-start]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();startDirectEdit(b.dataset.directEditStart);});
    document.querySelectorAll('[data-direct-edit-save]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();saveDirectEdit(b.dataset.directEditSave);});
    document.querySelectorAll('[data-direct-edit-cancel]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();cancelDirectEdit(b.dataset.directEditCancel);});
    document.querySelectorAll('[data-direct-edit-panel]').forEach(panel=>{
      panel.onclick=e=>e.stopPropagation();
      panel.onpointerdown=e=>e.stopPropagation();
      panel.ontouchstart=e=>e.stopPropagation();
    });
    document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editPost(b.dataset.edit));
    document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deletePost(b.dataset.delete));
    document.querySelectorAll('[data-close-video]').forEach(b=>b.onclick=closeVideo);
    document.querySelectorAll('[data-reset-app]').forEach(b=>b.onclick=resetTechnicalApp);
    document.querySelectorAll('[data-copy-diagnostics]').forEach(b=>b.onclick=copyDiagnostics);
  }

  function bind(){
    document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.nav));
    document.querySelectorAll('[data-control-process]').forEach(b=>b.onclick=processControlMessage);
    document.querySelectorAll('[data-control-clear]').forEach(b=>b.onclick=clearControlRecordsWithConfirm);
    document.querySelectorAll('[data-control-example]').forEach(b=>b.onclick=()=>{ const input=document.getElementById('controlMessageInput'); if(input){input.value=b.dataset.controlExample||''; input.focus({preventScroll:true});} });
    const controlInput=document.getElementById('controlMessageInput');
    if(controlInput){
      controlInput.onkeydown=e=>{ if(e.key==='Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); processControlMessage(); } };
    }
    document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;state.topTab='';state.query='';nav('/', {replace:true});});
    document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=openPicker);
    document.querySelectorAll('[data-publish]').forEach(b=>b.onclick=publish);
    document.querySelectorAll('[data-frame-action]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();adjustComposerFrame(b.dataset.frameAction);});
    document.querySelectorAll('[data-save-profile]').forEach(b=>b.onclick=saveProfile);
    document.querySelectorAll('[data-repair-avatar]').forEach(b=>b.onclick=repairPublicProfileAvatar);
    document.querySelectorAll('[data-pick-profile-photo]').forEach(b=>b.onclick=openProfilePhotoPicker);
    const profilePhotoInput=document.getElementById('profilePhotoInput');
    if(profilePhotoInput) profilePhotoInput.onchange=profilePhotoChosen;
    const profileNameInput=document.getElementById('profileName');
    if(profileNameInput){
      profileNameInput.onfocus=()=>{state.profileEditing=true;};
      profileNameInput.onblur=()=>{setTimeout(()=>{state.profileEditing=false;},300);};
      profileNameInput.oninput=()=>{state.profileEditing=true;};
    }
    document.querySelectorAll('[data-toggle-search]').forEach(b=>b.onclick=toggleSearchPanel);
    document.querySelectorAll('[data-open-store]').forEach(b=>b.onclick=()=>openStore(b.dataset.openStore));
    document.querySelectorAll('[data-top-tab]').forEach(b=>b.onclick=()=>setTopTab(b.dataset.topTab));
    document.querySelectorAll('[data-clear-search]').forEach(b=>b.onclick=(e)=>{ e.preventDefault(); e.stopPropagation(); if(state.query){ state.query=''; state.searchTyping=true; updateFeedOnly(); setTimeout(()=>{ const i=document.getElementById('searchInput'); i?.focus({preventScroll:true}); try{i?.setSelectionRange(0,0)}catch{} state.searchTyping=false; },80); } else { closeSearchPanel(); } });
    bindDynamicFeedControls();
    document.querySelectorAll('[data-refresh-messages]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();forceRefreshMessages();});

    const picker=document.getElementById('mediaPicker');
    if(picker) picker.onchange=fileChosen;
    const directPicker=document.getElementById('directMediaPicker');
    if(directPicker) directPicker.onchange=directMediaChosen;

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
    else { loadMessagesForInbox({silent:true}); if(!state.syncing && !['/publicar','/control'].includes(state.route)) syncFromCloud({render:!shouldAvoidRender()}); }
  }

  function setupReadingProtection(){
    if(state.readingListenersBound) return;
    state.readingListenersBound = true;
    const mark = () => markReadingInteraction(9000);
    window.addEventListener('scroll', mark, {passive:true});
    document.addEventListener('touchmove', mark, {passive:true});
    document.addEventListener('wheel', mark, {passive:true});
    document.addEventListener('pointerdown', event => {
      if(event.target?.closest?.('.post-card, .feed, [data-description-box]')) markReadingInteraction(9000);
    }, {passive:true});
  }

  function startPolling(){
    setupReadingProtection();
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
