/* Conecta Servicios v6.3.2 - Multicelular + búsqueda sin cerrar teclado */
(() => {
  'use strict';

  const VERSION = 'v6.3.2-multicelular-busqueda';
  const APP_URL = 'https://conecta-servicios.vercel.app/';
  const MAX_FILE_MB = 40;
  const IMAGE_MAX_SIDE = 1280;
  const POLL_MS = 8000;
  const STORAGE_BUCKET = 'publication-media';

  const K = {
    posts: 'cs_v632_posts',
    user: 'cs_v632_user',
    follows: 'cs_v632_follows',
    messages: 'cs_v632_messages',
    profile: 'cs_v632_profile',
    composer: 'cs_v632_composer'
  };

  const CATEGORIES = ['VENDO', 'OFREZCO', 'NECESITO'];
  const ZONES = ['Tejupilco', 'Toluca', 'Metepec', 'Chapultepec', 'Centro', 'Zona cercana', 'Todo México'];

  const seed = [
    {
      id: 'seed-vendo-1',
      ownerId: 'seed-shop',
      ownerName: 'Proveedor local',
      title: 'Vendo pan casero hoy',
      description: 'Vendo pan casero hoy.\nRecién hecho, entrega local por la tarde. Pregunta por disponibilidad.',
      category: 'VENDO',
      zone: 'Tejupilco',
      mediaUrl: 'assets/dola-media/comida-01.jpg',
      mediaType: 'image',
      mediaMime: 'image/jpeg',
      reactions: 4,
      status: 'activa',
      cloudStatus: 'publica',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'seed-ofrezco-1',
      ownerId: 'seed-agent',
      ownerName: 'Mensajero local',
      title: 'Ofrezco mandados y entregas',
      description: 'Ofrezco mandados y entregas.\nHago compras, pagos y entregas pequeñas en zona centro y alrededores.',
      category: 'OFREZCO',
      zone: 'Centro',
      mediaUrl: 'assets/dola-media/mandados-01.jpg',
      mediaType: 'image',
      mediaMime: 'image/jpeg',
      reactions: 2,
      status: 'activa',
      cloudStatus: 'publica',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'seed-necesito-1',
      ownerId: 'seed-user',
      ownerName: 'Cliente local',
      title: 'Necesito viaje compartido',
      description: 'Necesito viaje compartido.\nBusco salida mañana por la mañana desde Chapultepec.',
      category: 'NECESITO',
      zone: 'Chapultepec',
      mediaUrl: 'assets/dola-media/solicitante-01.jpg',
      mediaType: 'image',
      mediaMime: 'image/jpeg',
      reactions: 3,
      status: 'activa',
      cloudStatus: 'publica',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      updatedAt: new Date(Date.now() - 10800000).toISOString()
    }
  ];

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');

  const memoryUrls = new Map();
  let mediaDbPromise = null;

  const state = {
    route: '/',
    filter: 'ALL',
    query: '',
    posts: [],
    preview: '',
    previewBlob: null,
    mediaType: 'image',
    editing: null,
    composerId: '',
    composerMediaRef: '',
    composerMediaName: '',
    composerMediaMime: '',
    cloudReady: false,
    publishing: false,
    syncing: false,
    lastSyncAt: 0,
    syncTimer: null
  };

  function esc(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char]));
  }

  function uid(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }

  function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function userId() {
    let id = localStorage.getItem(K.user);
    if (!id) {
      id = uid('u');
      localStorage.setItem(K.user, id);
    }
    return id;
  }

  function profile() {
    const saved = get(K.profile, null);
    if (saved) return saved;
    const fresh = { name: 'Usuario local' };
    set(K.profile, fresh);
    return fresh;
  }

  function follows() {
    return get(K.follows, []);
  }

  function messages() {
    return get(K.messages, []);
  }

  function saveMessages(list) {
    set(K.messages, list);
  }

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  function normalizeCategory(value) {
    const v = String(value || '').toUpperCase().trim();
    return CATEGORIES.includes(v) ? v : 'VENDO';
  }

  function titleFrom(description) {
    return (String(description || '').split('\n').map(line => line.trim()).find(Boolean) || 'Publicación').slice(0, 72);
  }

  function openMediaDb() {
    if (mediaDbPromise) return mediaDbPromise;
    mediaDbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('Sin almacenamiento multimedia'));
      const req = indexedDB.open('conecta_media_v632', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('files');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return mediaDbPromise;
  }

  async function saveMediaBlob(ref, blob) {
    const db = await openMediaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put(blob, ref);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function loadMediaBlob(ref) {
    const db = await openMediaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly');
      const req = tx.objectStore('files').get(ref);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  function objectUrlFor(ref, blob) {
    if (!ref || !blob) return '';
    if (memoryUrls.has(ref)) return memoryUrls.get(ref);
    const url = URL.createObjectURL(blob);
    memoryUrls.set(ref, url);
    return url;
  }

  function requestRenderSoon() {
    clearTimeout(requestRenderSoon._t);
    requestRenderSoon._t = setTimeout(render, 60);
  }

  function resolveMedia(post) {
    if (post.mediaUrl) return post.mediaUrl;
    if (post.mediaData) return post.mediaData;
    if (post.mediaPreviewUrl) return post.mediaPreviewUrl;
    if (post.mediaRef) {
      if (memoryUrls.has(post.mediaRef)) return memoryUrls.get(post.mediaRef);
      loadMediaBlob(post.mediaRef).then(blob => {
        if (blob) {
          objectUrlFor(post.mediaRef, blob);
          requestRenderSoon();
        }
      }).catch(() => {});
    }
    return '';
  }

  function stripForLocal(post) {
    const copy = { ...post };
    delete copy.mediaPreviewUrl;
    return copy;
  }

  function stripForRemote(post) {
    const copy = { ...post };
    delete copy.mediaPreviewUrl;
    delete copy.mediaRef;
    delete copy.mediaData;
    return copy;
  }

  function localPosts() {
    const saved = get(K.posts, null);
    if (!saved) {
      set(K.posts, seed);
      return seed;
    }
    return saved.map(post => ({ ...post, category: normalizeCategory(post.category) }));
  }

  function saveLocalPosts(posts) {
    const normalized = dedupePosts(posts.map(post => ({ ...post, category: normalizeCategory(post.category) })));
    state.posts = normalized;
    set(K.posts, normalized.map(stripForLocal));
  }

  function betterPost(a, b) {
    if (!a) return b;
    if (!b) return a;
    if (b.mediaUrl && !a.mediaUrl) return b;
    if (a.mediaUrl && !b.mediaUrl) return a;
    if (b.cloudStatus === 'publica' && a.cloudStatus !== 'publica') return b;
    if (a.cloudStatus === 'publica' && b.cloudStatus !== 'publica') return a;
    const ad = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bd = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bd >= ad ? { ...a, ...b } : { ...b, ...a };
  }

  function sameSoftKey(a, b) {
    if (!a || !b) return false;
    if ((a.ownerId || '') !== (b.ownerId || '')) return false;
    if (normalizeCategory(a.category) !== normalizeCategory(b.category)) return false;
    if ((a.zone || '').trim().toLowerCase() !== (b.zone || '').trim().toLowerCase()) return false;
    if ((a.description || '').trim().toLowerCase() !== (b.description || '').trim().toLowerCase()) return false;
    const at = new Date(a.createdAt || 0).getTime();
    const bt = new Date(b.createdAt || 0).getTime();
    return Math.abs(at - bt) < 120000;
  }

  function dedupePosts(posts) {
    const byId = new Map();
    posts.forEach(post => {
      if (!post || !post.id) return;
      byId.set(post.id, betterPost(byId.get(post.id), post));
    });

    const list = [...byId.values()].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    const final = [];

    list.forEach(post => {
      const duplicateIndex = final.findIndex(existing => sameSoftKey(existing, post));
      if (duplicateIndex >= 0) final[duplicateIndex] = betterPost(final[duplicateIndex], post);
      else final.push(post);
    });

    return final;
  }

  function mergePosts(local, remote) {
    return dedupePosts([...(remote || []), ...(local || [])]);
  }

  function filteredPosts() {
    const q = state.query.trim().toLowerCase();
    return dedupePosts(state.posts)
      .filter(post => post.status !== 'eliminada')
      .filter(post => state.filter === 'ALL' ? true : normalizeCategory(post.category) === state.filter)
      .filter(post => {
        if (!q) return true;
        const haystack = `${post.title || ''} ${post.description || ''} ${post.zone || ''} ${post.category || ''} ${post.ownerName || ''}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  function myPosts() {
    return dedupePosts(state.posts).filter(post => post.ownerId === userId()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  function followedPosts() {
    const ids = new Set(follows());
    return dedupePosts(state.posts).filter(post => ids.has(post.ownerId)).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async function getPublicConfig() {
    try {
      const res = await fetch('/api/public-config', { cache: 'no-store' });
      const data = await res.json();
      return data || { ok: false };
    } catch {
      return { ok: false };
    }
  }

  function dataUrlToBlob(dataUrl) {
    const [header, body] = String(dataUrl || '').split(',');
    if (!header || !body) return null;
    const mime = (header.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
    const bin = atob(body);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  async function uploadMediaToCloud(post) {
    if (post.mediaUrl) return { post, ok: true, reason: '' };

    const cfg = await getPublicConfig();
    if (!cfg.ok || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      return { post, ok: false, reason: 'config' };
    }

    let blob = null;
    if (post.mediaRef) blob = await loadMediaBlob(post.mediaRef).catch(() => null);
    if (!blob && post.mediaData) blob = dataUrlToBlob(post.mediaData);
    if (!blob) return { post, ok: false, reason: 'media' };

    const bucket = cfg.storageBucket || STORAGE_BUCKET;
    const safeName = (post.mediaName || `${post.mediaType || 'media'}.bin`).replace(/[^a-z0-9_.-]/gi, '-').toLowerCase();
    const path = `${encodeURIComponent(post.ownerId || userId())}/${encodeURIComponent(post.id)}/${Date.now()}-${safeName}`;
    const url = `${cfg.supabaseUrl}/storage/v1/object/${bucket}/${path}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: cfg.supabaseAnonKey,
        Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        'Content-Type': post.mediaMime || blob.type || 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: blob
    });

    if (!res.ok) return { post, ok: false, reason: 'upload' };

    return {
      post: {
        ...post,
        mediaUrl: `${cfg.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`,
        mediaData: '',
        mediaPreviewUrl: '',
        mediaUploadedAt: new Date().toISOString()
      },
      ok: true,
      reason: ''
    };
  }

  async function syncFromCloud(options = {}) {
    if (state.syncing) return false;
    state.syncing = true;

    try {
      const response = await fetch('/api/publications', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error('offline');

      state.cloudReady = true;
      const remote = (data.posts || []).map(post => ({
        ...post,
        category: normalizeCategory(post.category),
        cloudStatus: 'publica'
      }));

      const merged = mergePosts(localPosts(), remote);
      saveLocalPosts(merged);
      state.lastSyncAt = Date.now();
      if (options.render !== false) render();
      return true;
    } catch {
      state.cloudReady = false;
      state.posts = localPosts();
      if (options.render !== false) render();
      return false;
    } finally {
      state.syncing = false;
    }
  }

  async function syncPost(post) {
    try {
      const cleanPost = stripForRemote(post);
      const response = await fetch('/api/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: cleanPost })
      });
      const data = await response.json().catch(() => ({ ok: false }));
      if (!response.ok || !data.ok) throw new Error('sync');
      return true;
    } catch {
      return false;
    }
  }

  async function deleteCloud(id) {
    try {
      await fetch('/api/publications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ownerId: userId(), admin: false })
      });
    } catch {}
  }

  function shell(content) {
    return `
      <main class="app-page">
        <div class="top-space"></div>
        ${content}
      </main>

      <nav class="bottom-nav">
        <button class="nav-item ${state.route === '/' ? 'active' : ''}" data-nav="/">
          <span class="nav-icon">🏠</span><small>Inicio</small>
        </button>
        <button class="nav-item ${state.route === '/siguiendo' ? 'active' : ''}" data-nav="/siguiendo">
          <span class="nav-icon">🫂</span><small>Siguiendo</small>
        </button>
        <button class="nav-plus" data-pick>+</button>
        <button class="nav-item ${state.route === '/mensajes' ? 'active' : ''}" data-nav="/mensajes">
          <span class="nav-icon">✉️</span><small>Mensajes</small>
        </button>
        <button class="nav-item ${state.route === '/perfil' ? 'active' : ''}" data-nav="/perfil">
          <span class="nav-icon">👤</span><small>Perfil</small>
        </button>
      </nav>

      <input id="mediaPicker" type="file" accept="image/*,video/*" hidden>
    `;
  }

  function homeHeader() {
    return `
      <section class="glass-top">
        <div class="brand-row">
          <img src="assets/icons/conecta-logo-oficial.png" alt="Conecta" class="brand-logo" onerror="this.style.display='none'">
          <div class="brand-title">
            <strong>Conecta</strong>
            <span>Servicios</span>
          </div>
          <div style="display:flex;gap:10px;align-items:center">
            <div class="ghost-top"></div>
            <button class="bell-btn" data-nav="/mensajes" title="Avisos">🔔</button>
          </div>
        </div>

        <div class="path-row">
          ${pathButton('VENDO', '🏪', 'Vendo', 'path-vendo')}
          ${pathButton('OFREZCO', '🛵', 'Ofrezco', 'path-ofrezco')}
          ${pathButton('NECESITO', '🧡', 'Necesito', 'path-necesito')}
        </div>

        <label class="search-box">
          <span>🔎</span>
          <input id="searchInput" value="${esc(state.query)}" placeholder="Buscar" autocomplete="off">
        </label>
      </section>
    `;
  }

  function pathButton(key, icon, label, styleClass) {
    return `
      <button class="path-card ${styleClass} ${state.filter === key ? 'active' : ''}" data-filter="${key}">
        <span class="path-icon">${icon}</span>
        <span class="path-label">${label}</span>
      </button>
    `;
  }

  function homePage() {
    const title = state.filter === 'ALL' ? 'Publicaciones cerca de ti' : state.filter;
    return shell(`
      ${homeHeader()}

      <section class="feed-title" id="feedTitle">
        ${feedTitleMarkup(title)}
      </section>

      <section class="feed" id="feed">
        ${feedMarkup()}
      </section>
    `);
  }

  function feedTitleMarkup(title = state.filter === 'ALL' ? 'Publicaciones cerca de ti' : state.filter) {
    return `
      <div>
        <h1>${esc(title)}</h1>
        <p>${state.cloudReady ? 'Publicaciones disponibles' : 'También funciona sin conexión'}</p>
      </div>
      ${state.syncing ? '<span class="sync-pill">Actualizando...</span>' : (state.filter !== 'ALL' || state.query ? '<button class="small-link" data-clear>Todo</button>' : '')}
    `;
  }

  function feedMarkup() {
    const posts = filteredPosts();
    return posts.map(postCard).join('') || emptyState('No encontré publicaciones', 'Prueba otra búsqueda o publica algo con el botón +.');
  }

  function updateFeedOnly() {
    const feed = document.getElementById('feed');
    if (feed) feed.innerHTML = feedMarkup();

    const feedTitle = document.getElementById('feedTitle');
    if (feedTitle) feedTitle.innerHTML = feedTitleMarkup();

    bindDynamicFeedControls();
  }

  function categoryClass(category) {
    return `chip-${normalizeCategory(category).toLowerCase()}`;
  }

  function isFollowing(ownerId) {
    return follows().includes(ownerId);
  }

  function statusLabel(post) {
    if (post.cloudStatus === 'subiendo') return '<span class="chip status-chip">Publicando...</span>';
    if (post.cloudStatus === 'local') return '<span class="chip status-chip local">Guardada en este dispositivo</span>';
    if (post.cloudStatus === 'publica') return '<span class="chip status-chip publica">Publicada</span>';
    return '';
  }

  function postCard(post) {
    const media = resolveMedia(post);
    const isVideo = post.mediaType === 'video';
    const own = post.ownerId === userId();
    const mediaPending = post.mediaStatus === 'pendiente' || (!post.mediaUrl && post.mediaType === 'video' && post.cloudStatus === 'publica');

    return `
      <article class="post-card">
        <div class="media-area">
          ${
            media
              ? (isVideo
                ? `<video src="${esc(media)}" controls playsinline preload="metadata"></video>`
                : `<img src="${esc(media)}" alt="${esc(post.title || 'Publicación')}">`)
              : '<div class="no-media">Conecta Servicios</div>'
          }

          ${mediaPending ? '<div class="media-pending">El video está pendiente. La publicación ya está visible.</div>' : ''}

          <div class="media-top">
            <span class="chip ${categoryClass(post.category)}">${esc(normalizeCategory(post.category))}</span>
            <span class="chip">📍 ${esc(post.zone || 'Zona')}</span>
          </div>

          <div class="media-bottom">
            <div class="action-stack">
              <button class="round-action" data-like="${esc(post.id)}" title="Me gusta">❤️</button>
              <button class="round-action" data-message="${esc(post.id)}" title="Mensaje">✉️</button>
              <button class="round-action" data-share="${esc(post.id)}" title="Compartir">↗️</button>
            </div>
            <button class="follow-btn ${isFollowing(post.ownerId) ? 'following' : ''}" data-follow="${esc(post.ownerId)}">
              ${isFollowing(post.ownerId) ? 'Siguiendo' : 'Seguir'}
            </button>
          </div>
        </div>

        <div class="post-body">
          <div class="owner-row"><span class="owner-dot">👤</span>${esc(post.ownerName || 'Usuario local')}</div>
          <h2>${esc(post.title || 'Publicación')}</h2>
          <p>${esc(post.description || '')}</p>
          <div class="post-meta">
            <span>❤️ ${post.reactions || 0}</span>
            <span>${new Date(post.createdAt || Date.now()).toLocaleDateString('es-MX')}</span>
          </div>

          ${statusLabel(post)}

          ${own ? `
            <div class="manage-row">
              ${post.cloudStatus === 'local' || post.mediaStatus === 'pendiente' ? `<button class="retry" data-retry="${esc(post.id)}">Reintentar</button>` : ''}
              <button data-edit="${esc(post.id)}">Editar</button>
              <button class="danger" data-delete="${esc(post.id)}">Borrar</button>
            </div>
          ` : ''}

          ${post.cloudStatus === 'local' ? '<div class="local-note">Tu publicación se guardó en este dispositivo. Revisa tu conexión e intenta de nuevo.</div>' : ''}
        </div>
      </article>
    `;
  }

  function emptyState(title, text) {
    return `<div class="empty"><strong>${esc(title)}</strong>${esc(text)}</div>`;
  }

  function followingPage() {
    const posts = followedPosts();
    return shell(`
      <section class="panel">
        <h1>Siguiendo</h1>
        <p>Aquí aparecen proveedores, clientes o mensajeros que decidiste seguir.</p>
      </section>
      <section class="feed">
        ${posts.map(postCard).join('') || emptyState('Todavía no sigues a nadie', 'Toca Seguir en una publicación para verla aquí.')}
      </section>
    `);
  }

  function messagesPage() {
    const list = messages().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return shell(`
      <section class="panel">
        <h1>Mensajes</h1>
        <p>Aquí se guardan los mensajes que escribes desde las publicaciones.</p>
        <div class="list">
          ${list.map(messageCard).join('') || emptyState('Sin mensajes todavía', 'Toca el sobre en una publicación para escribir uno.')}
        </div>
      </section>
    `);
  }

  function messageCard(item) {
    return `
      <div class="list-item">
        <strong>${esc(item.postTitle || 'Publicación')}</strong>
        <small>${esc(item.postCategory || '')} · ${esc(item.postZone || '')}</small>
        <p style="margin:10px 0 0;white-space:pre-wrap">${esc(item.text || '')}</p>
      </div>
    `;
  }

  function profilePage() {
    const prof = profile();
    const mine = myPosts();
    return shell(`
      <section class="panel">
        <h1>Perfil</h1>
        <p>Guarda tu nombre visible y revisa tu actividad.</p>

        <label>Nombre visible</label>
        <input id="profileName" value="${esc(prof.name || 'Usuario local')}" placeholder="Tu nombre o negocio">

        <button class="big-button" data-save-profile>Guardar nombre</button>

        <div class="profile-grid">
          <div class="stat"><strong>${mine.length}</strong><span>Publicaciones</span></div>
          <div class="stat"><strong>${follows().length}</strong><span>Siguiendo</span></div>
          <div class="stat"><strong>${messages().length}</strong><span>Mensajes</span></div>
        </div>
      </section>

      <section class="feed">
        ${mine.map(postCard).join('') || emptyState('No has publicado', 'Toca + para crear tu primera publicación.')}
      </section>
    `);
  }

  function ensureComposerId() {
    if (!state.composerId) {
      state.composerId = uid('post');
      set(K.composer, { id: state.composerId, createdAt: new Date().toISOString() });
    }
    return state.composerId;
  }

  function composerPage() {
    ensureComposerId();
    const post = state.editing || { description: '', zone: '', category: state.filter === 'ALL' ? 'VENDO' : state.filter };
    const media = state.preview || post.mediaUrl || resolveMedia(post);
    const isVideo = (state.mediaType || post.mediaType) === 'video';

    return shell(`
      <section class="composer">
        <button class="back-btn" data-nav="/">← Volver</button>
        <h1>${state.editing ? 'Editar publicación' : 'Nueva publicación'}</h1>
        <p>Escribe claro. La primera línea será el título.</p>

        <div class="preview" data-pick>
          ${
            media
              ? (isVideo
                ? `<video src="${esc(media)}" controls playsinline preload="metadata"></video>`
                : `<img src="${esc(media)}" alt="Vista previa">`)
              : '<div><strong>+ Agregar foto o video</strong><span>Desde tu dispositivo</span></div>'
          }
        </div>

        <label>Descripción</label>
        <textarea id="description" placeholder="Ejemplo: Vendo tamales hoy&#10;Entrego en zona centro desde las 6 pm.">${esc(post.description || '')}</textarea>

        <div class="form-grid">
          <div>
            <label>Zona o municipio</label>
            <input id="zone" list="zoneList" value="${esc(post.zone || '')}" placeholder="Ej. Tejupilco">
            <datalist id="zoneList">
              ${ZONES.map(zone => `<option value="${esc(zone)}"></option>`).join('')}
            </datalist>
          </div>

          <div>
            <label>Categoría</label>
            <select id="category">
              ${CATEGORIES.map(category => `<option value="${esc(category)}" ${normalizeCategory(post.category) === category ? 'selected' : ''}>${esc(category)}</option>`).join('')}
            </select>
          </div>
        </div>

        <button class="big-button ${state.publishing ? 'publishing' : ''}" data-publish ${state.publishing ? 'disabled' : ''}>
          ${state.publishing ? 'PUBLICANDO...' : 'PUBLICAR'}
        </button>
      </section>
    `);
  }

  function render() {
    const routes = {
      '/': homePage,
      '/siguiendo': followingPage,
      '/mensajes': messagesPage,
      '/perfil': profilePage,
      '/publicar': composerPage
    };
    app.innerHTML = (routes[state.route] || homePage)();
    bind();
  }

  function nav(route) {
    state.route = route;
    if (route !== '/publicar' && !state.publishing) state.editing = null;
    render();
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  function openPicker() {
    if (state.publishing) return toast('Estamos terminando de publicar. Espera un momento.');
    ensureComposerId();
    document.getElementById('mediaPicker')?.click();
  }

  function resizeImage(file, maxSide = IMAGE_MAX_SIDE, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) return resolve(file);
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo leer imagen'));
      };
      img.src = url;
    });
  }

  async function fileChosen(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast('Por ahora usa un archivo más ligero para evitar errores.');
      return;
    }

    try {
      const postId = ensureComposerId();
      const ref = `media-${postId}`;
      const kind = file.type.startsWith('video') ? 'video' : 'image';
      let blob = file;

      if (kind === 'image') blob = await resizeImage(file).catch(() => file);

      await saveMediaBlob(ref, blob);

      state.mediaType = kind;
      state.composerMediaRef = ref;
      state.composerMediaName = file.name || `${kind}.bin`;
      state.composerMediaMime = blob.type || file.type || 'application/octet-stream';
      state.preview = objectUrlFor(ref, blob);
      state.editing = null;
      nav('/publicar');
    } catch {
      toast('No se pudo abrir el archivo. Prueba con otro.');
    }
  }

  function collectForm() {
    return {
      description: document.getElementById('description')?.value.trim() || '',
      zone: document.getElementById('zone')?.value.trim() || '',
      category: normalizeCategory(document.getElementById('category')?.value || 'VENDO')
    };
  }

  function clearComposer() {
    state.preview = '';
    state.previewBlob = null;
    state.mediaType = 'image';
    state.editing = null;
    state.composerId = '';
    state.composerMediaRef = '';
    state.composerMediaName = '';
    state.composerMediaMime = '';
    localStorage.removeItem(K.composer);
  }

  async function publish() {
    if (state.publishing) {
      toast('Estamos terminando de publicar. Espera un momento.');
      return;
    }

    const form = collectForm();
    if (!form.description) return toast('Escribe una descripción.');
    if (!form.zone) return toast('Agrega zona o municipio.');
    if (!form.category) return toast('Selecciona VENDO, OFREZCO o NECESITO.');

    const old = state.editing;
    const id = old?.id || ensureComposerId();
    const prof = profile();
    const now = new Date().toISOString();

    let post = {
      ...old,
      id,
      ownerId: old?.ownerId || userId(),
      ownerName: prof.name || 'Usuario local',
      title: titleFrom(form.description),
      description: form.description,
      zone: form.zone,
      category: form.category,
      mediaUrl: old?.mediaUrl || '',
      mediaData: old?.mediaData || '',
      mediaRef: state.composerMediaRef || old?.mediaRef || '',
      mediaPreviewUrl: state.preview || old?.mediaPreviewUrl || '',
      mediaType: state.mediaType || old?.mediaType || 'image',
      mediaMime: state.composerMediaMime || old?.mediaMime || '',
      mediaName: state.composerMediaName || old?.mediaName || '',
      mediaStatus: '',
      status: 'activa',
      reactions: old?.reactions || 0,
      createdAt: old?.createdAt || now,
      updatedAt: now,
      cloudStatus: 'subiendo'
    };

    state.publishing = true;
    saveLocalPosts([post, ...state.posts.filter(item => item.id !== id)]);
    state.filter = form.category;
    state.query = '';
    state.route = '/';
    render();
    toast('Publicando...');

    try {
      const uploaded = await uploadMediaToCloud(post);
      post = uploaded.post;

      if (!uploaded.ok && post.mediaRef) {
        post = {
          ...post,
          mediaStatus: 'pendiente',
          updatedAt: new Date().toISOString()
        };
      }

      const ok = await syncPost({
        ...post,
        cloudStatus: 'publica',
        updatedAt: new Date().toISOString()
      });

      post = {
        ...post,
        cloudStatus: ok ? 'publica' : 'local',
        updatedAt: new Date().toISOString()
      };

      saveLocalPosts([post, ...state.posts.filter(item => item.id !== id)]);

      if (ok) {
        clearComposer();
        toast(uploaded.ok || !post.mediaRef ? 'Publicación lista.' : 'Publicación visible. El video quedó pendiente en este dispositivo.');
        await syncFromCloud({ render: false });
      } else {
        toast('Tu publicación se guardó en este dispositivo. Revisa tu conexión e intenta de nuevo.');
      }
    } catch {
      post = {
        ...post,
        cloudStatus: 'local',
        updatedAt: new Date().toISOString()
      };
      saveLocalPosts([post, ...state.posts.filter(item => item.id !== id)]);
      toast('Tu publicación se guardó en este dispositivo. Revisa tu conexión e intenta de nuevo.');
    } finally {
      state.publishing = false;
      render();
    }
  }

  async function retryPost(id) {
    const found = state.posts.find(item => item.id === id);
    if (!found) return;
    if (found.ownerId !== userId()) return toast('Solo puedes reintentar tus publicaciones.');

    toast('Publicando...');
    let post = { ...found, cloudStatus: 'subiendo', updatedAt: new Date().toISOString() };
    saveLocalPosts([post, ...state.posts.filter(item => item.id !== id)]);
    render();

    try {
      const uploaded = await uploadMediaToCloud(post);
      post = uploaded.post;
      post.mediaStatus = uploaded.ok ? '' : (post.mediaRef ? 'pendiente' : post.mediaStatus || '');

      const ok = await syncPost({ ...post, cloudStatus: 'publica', updatedAt: new Date().toISOString() });
      post = { ...post, cloudStatus: ok ? 'publica' : 'local', updatedAt: new Date().toISOString() };
      saveLocalPosts([post, ...state.posts.filter(item => item.id !== id)]);
      toast(ok ? 'Publicación lista.' : 'Tu publicación se guardó en este dispositivo. Revisa tu conexión e intenta de nuevo.');
      if (ok) await syncFromCloud({ render: false });
    } catch {
      post = { ...post, cloudStatus: 'local', updatedAt: new Date().toISOString() };
      saveLocalPosts([post, ...state.posts.filter(item => item.id !== id)]);
      toast('Tu publicación se guardó en este dispositivo. Revisa tu conexión e intenta de nuevo.');
    }

    render();
  }

  function editPost(id) {
    const post = state.posts.find(item => item.id === id);
    if (!post || post.ownerId !== userId()) return toast('Solo puedes editar tus publicaciones.');
    if (state.publishing) return toast('Estamos terminando de publicar. Espera un momento.');

    state.editing = { ...post };
    state.composerId = post.id;
    state.preview = resolveMedia(post);
    state.mediaType = post.mediaType || 'image';
    state.composerMediaRef = post.mediaRef || '';
    state.composerMediaName = post.mediaName || '';
    state.composerMediaMime = post.mediaMime || '';
    nav('/publicar');
  }

  function deletePost(id) {
    const post = state.posts.find(item => item.id === id);
    if (!post || post.ownerId !== userId()) return toast('Solo puedes borrar tus publicaciones.');
    if (!confirm('¿Borrar esta publicación?')) return;

    saveLocalPosts(state.posts.filter(item => item.id !== id));
    deleteCloud(id);
    toast('Publicación borrada.');
    render();
  }

  function likePost(id) {
    saveLocalPosts(state.posts.map(post => post.id === id ? { ...post, reactions: (post.reactions || 0) + 1 } : post));
    render();
  }

  function sharePost(id) {
    const post = state.posts.find(item => item.id === id);
    if (!post) return;
    const text = `${post.title}\n\n${post.description}\n\n${post.category} · ${post.zone}\n\n${APP_URL}`;
    if (navigator.share) navigator.share({ title: post.title, text, url: APP_URL }).catch(() => {});
    else navigator.clipboard?.writeText(text).then(() => toast('Copiado para compartir.'));
  }

  function toggleFollow(ownerId) {
    if (ownerId === userId()) return toast('Esta publicación es tuya.');
    const current = follows();
    const next = current.includes(ownerId) ? current.filter(id => id !== ownerId) : [...current, ownerId];
    set(K.follows, next);
    toast(current.includes(ownerId) ? 'Dejaste de seguir.' : 'Ahora lo sigues.');
    render();
  }

  function sendMessage(postId) {
    const post = state.posts.find(item => item.id === postId);
    if (!post) return;
    const text = prompt(`Mensaje para "${post.title}"`);
    if (!text) return;

    const list = messages();
    list.unshift({
      id: uid('m'),
      postId,
      postTitle: post.title,
      postCategory: post.category,
      postZone: post.zone,
      ownerId: post.ownerId,
      text,
      createdAt: new Date().toISOString()
    });
    saveMessages(list);
    toast('Mensaje guardado.');
  }

  function saveProfile() {
    const name = document.getElementById('profileName')?.value.trim() || 'Usuario local';
    set(K.profile, { name });
    toast('Nombre guardado.');
    render();
  }

  function clearFilters() {
    state.filter = 'ALL';
    state.query = '';
    render();
  }

  function bindDynamicFeedControls() {
    document.querySelectorAll('[data-clear]').forEach(button => button.onclick = clearFilters);
    document.querySelectorAll('[data-retry]').forEach(button => button.onclick = () => retryPost(button.dataset.retry));
    document.querySelectorAll('[data-like]').forEach(button => button.onclick = () => likePost(button.dataset.like));
    document.querySelectorAll('[data-share]').forEach(button => button.onclick = () => sharePost(button.dataset.share));
    document.querySelectorAll('[data-follow]').forEach(button => button.onclick = () => toggleFollow(button.dataset.follow));
    document.querySelectorAll('[data-message]').forEach(button => button.onclick = () => sendMessage(button.dataset.message));
    document.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => editPost(button.dataset.edit));
    document.querySelectorAll('[data-delete]').forEach(button => button.onclick = () => deletePost(button.dataset.delete));
  }

  function bind() {
    document.querySelectorAll('[data-nav]').forEach(button => button.onclick = () => nav(button.dataset.nav));
    document.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => { state.filter = button.dataset.filter; state.route = '/'; render(); });
    document.querySelectorAll('[data-pick]').forEach(button => button.onclick = openPicker);
    document.querySelectorAll('[data-publish]').forEach(button => button.onclick = publish);
    document.querySelectorAll('[data-save-profile]').forEach(button => button.onclick = saveProfile);
    bindDynamicFeedControls();

    const picker = document.getElementById('mediaPicker');
    if (picker) picker.onchange = fileChosen;

    const search = document.getElementById('searchInput');
    if (search) {
      search.oninput = event => {
        state.query = event.target.value;
        updateFeedOnly();
      };
    }
  }

  function startPolling() {
    if (state.syncTimer) clearInterval(state.syncTimer);
    state.syncTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && !state.syncing && !state.publishing) syncFromCloud({ render: true });
    }, POLL_MS);

    window.addEventListener('focus', () => {
      if (!state.syncing && !state.publishing) syncFromCloud({ render: true });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !state.syncing && !state.publishing) syncFromCloud({ render: true });
    });
  }

  async function init() {
    state.posts = localPosts();
    render();
    await syncFromCloud({ render: true });
    startPolling();
  }

  init();
})();
