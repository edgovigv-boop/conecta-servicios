/* Conecta Servicios v6.3.0 - MVP social local abuelita friendly */
(() => {
  'use strict';

  const VERSION = 'v6.3.0-mvp-social-local';
  const APP_URL = 'https://conecta-servicios.vercel.app/';
  const MAX_FILE_MB = 4;
  const K = {
    posts: 'cs_v630_posts',
    user: 'cs_v630_user',
    follows: 'cs_v630_follows',
    messages: 'cs_v630_messages',
    profile: 'cs_v630_profile'
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
      reactions: 4,
      status: 'activa',
      createdAt: new Date(Date.now() - 3600000).toISOString()
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
      reactions: 2,
      status: 'activa',
      createdAt: new Date(Date.now() - 7200000).toISOString()
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
      reactions: 3,
      status: 'activa',
      createdAt: new Date(Date.now() - 10800000).toISOString()
    }
  ];

  const state = {
    route: '/',
    filter: 'ALL',
    query: '',
    posts: [],
    preview: '',
    mediaType: 'image',
    editing: null,
    cloudReady: false
  };

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');

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

  function localPosts() {
    const saved = get(K.posts, null);
    if (!saved) {
      set(K.posts, seed);
      return seed;
    }
    return saved.map(post => ({ ...post, category: normalizeCategory(post.category) }));
  }

  function saveLocalPosts(posts) {
    const normalized = posts.map(post => ({ ...post, category: normalizeCategory(post.category) }));
    state.posts = normalized;
    set(K.posts, normalized);
  }

  function filteredPosts() {
    const q = state.query.trim().toLowerCase();
    return state.posts
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
    return state.posts
      .filter(post => post.ownerId === userId())
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  function followedPosts() {
    const ids = new Set(follows());
    return state.posts
      .filter(post => ids.has(post.ownerId))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async function syncFromCloud() {
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

      const local = localPosts();
      const merged = [...remote];
      local.forEach(post => {
        if (!merged.some(item => item.id === post.id)) merged.push(post);
      });

      saveLocalPosts(merged);
    } catch {
      state.cloudReady = false;
      state.posts = localPosts();
    }
  }

  async function syncPost(post) {
    try {
      const response = await fetch('/api/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post })
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
          <input id="searchInput" value="${esc(state.query)}" placeholder="Buscar">
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
    const posts = filteredPosts();
    const title = state.filter === 'ALL' ? 'Publicaciones cerca de ti' : state.filter;
    return shell(`
      ${homeHeader()}

      <section class="feed-title">
        <div>
          <h1>${esc(title)}</h1>
          <p>${state.cloudReady ? 'Publicaciones disponibles' : 'También funciona sin conexión'}</p>
        </div>
        ${state.filter !== 'ALL' || state.query ? '<button class="small-link" data-clear>Todo</button>' : ''}
      </section>

      <section class="feed">
        ${posts.map(postCard).join('') || emptyState('No encontré publicaciones', 'Prueba otra búsqueda o publica algo con el botón +.')}
      </section>
    `);
  }

  function categoryClass(category) {
    return `chip-${normalizeCategory(category).toLowerCase()}`;
  }

  function isFollowing(ownerId) {
    return follows().includes(ownerId);
  }

  function postCard(post) {
    const media = post.mediaUrl || post.mediaData || '';
    const isVideo = post.mediaType === 'video';
    const own = post.ownerId === userId();

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

          ${own ? `
            <div class="manage-row">
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

  function composerPage() {
    const post = state.editing || {
      description: '',
      zone: '',
      category: state.filter === 'ALL' ? 'VENDO' : state.filter
    };
    const media = state.preview || post.mediaUrl || post.mediaData || '';
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

        <button class="big-button" data-publish>PUBLICAR</button>
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
    render();
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  function openPicker() {
    document.getElementById('mediaPicker')?.click();
  }

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function resizeImage(file, maxSide = 1280, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) return resolve(null);
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
        resolve(canvas.toDataURL('image/jpeg', quality));
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
      toast('Por ahora usa archivos más ligeros para evitar errores.');
      return;
    }

    try {
      state.mediaType = file.type.startsWith('video') ? 'video' : 'image';
      state.preview = state.mediaType === 'image'
        ? (await resizeImage(file) || await fileToDataURL(file))
        : await fileToDataURL(file);
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

  async function publish() {
    const form = collectForm();
    if (!form.description) return toast('Escribe una descripción.');
    if (!form.zone) return toast('Agrega zona o municipio.');
    if (!form.category) return toast('Selecciona VENDO, OFREZCO o NECESITO.');

    const old = state.editing;
    const id = old?.id || uid('post');
    const prof = profile();

    const post = {
      ...old,
      id,
      ownerId: old?.ownerId || userId(),
      ownerName: prof.name || 'Usuario local',
      title: titleFrom(form.description),
      description: form.description,
      zone: form.zone,
      category: form.category,
      mediaData: state.preview || old?.mediaData || '',
      mediaUrl: old?.mediaUrl || '',
      mediaType: state.mediaType || old?.mediaType || 'image',
      status: 'activa',
      reactions: old?.reactions || 0,
      createdAt: old?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cloudStatus: 'subiendo'
    };

    saveLocalPosts([post, ...state.posts.filter(item => item.id !== id)]);
    toast('Publicando...');

    const ok = await syncPost(post);
    saveLocalPosts([{ ...post, cloudStatus: ok ? 'publica' : 'local' }, ...state.posts.filter(item => item.id !== id)]);

    state.preview = '';
    state.mediaType = 'image';
    state.editing = null;
    state.filter = form.category;
    state.query = '';

    if (ok) {
      await syncFromCloud();
      toast('Publicación lista.');
    } else {
      toast('Tu publicación se guardó en este dispositivo. Revisa tu conexión e intenta de nuevo.');
    }

    nav('/');
  }

  function editPost(id) {
    const post = state.posts.find(item => item.id === id);
    if (!post || post.ownerId !== userId()) return toast('Solo puedes editar tus publicaciones.');
    state.editing = { ...post };
    state.preview = post.mediaData || post.mediaUrl || '';
    state.mediaType = post.mediaType || 'image';
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
    const next = current.includes(ownerId)
      ? current.filter(id => id !== ownerId)
      : [...current, ownerId];
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

  function bind() {
    document.querySelectorAll('[data-nav]').forEach(button => button.onclick = () => nav(button.dataset.nav));
    document.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => { state.filter = button.dataset.filter; state.route = '/'; render(); });
    document.querySelectorAll('[data-clear]').forEach(button => button.onclick = clearFilters);
    document.querySelectorAll('[data-pick]').forEach(button => button.onclick = openPicker);
    document.querySelectorAll('[data-publish]').forEach(button => button.onclick = publish);
    document.querySelectorAll('[data-like]').forEach(button => button.onclick = () => likePost(button.dataset.like));
    document.querySelectorAll('[data-share]').forEach(button => button.onclick = () => sharePost(button.dataset.share));
    document.querySelectorAll('[data-follow]').forEach(button => button.onclick = () => toggleFollow(button.dataset.follow));
    document.querySelectorAll('[data-message]').forEach(button => button.onclick = () => sendMessage(button.dataset.message));
    document.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => editPost(button.dataset.edit));
    document.querySelectorAll('[data-delete]').forEach(button => button.onclick = () => deletePost(button.dataset.delete));
    document.querySelectorAll('[data-save-profile]').forEach(button => button.onclick = saveProfile);

    const picker = document.getElementById('mediaPicker');
    if (picker) picker.onchange = fileChosen;

    const search = document.getElementById('searchInput');
    if (search) {
      search.oninput = (event) => {
        state.query = event.target.value;
        render();
      };
      search.focus = search.focus.bind(search);
    }
  }

  async function init() {
    state.posts = localPosts();
    render();
    await syncFromCloud();
    render();
  }

  init();
})();
