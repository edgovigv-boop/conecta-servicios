/* Conecta Servicios v6.2.0 - Home MVP social */
(() => {
  'use strict';

  const VERSION = 'v6.2.0-home-mvp-social';
  const APP_URL = 'https://conecta-servicios.vercel.app/';
  const MAX_FILE_MB = 4;
  const K = {
    posts: 'cs_v620_posts',
    user: 'cs_v620_user',
    follows: 'cs_v620_follows',
    messages: 'cs_v620_messages',
    profile: 'cs_v620_profile'
  };

  const CATEGORIES = ['VENDO', 'OFREZCO', 'NECESITO'];
  const ZONES = ['Tejupilco', 'Toluca', 'Metepec', 'Chapultepec', 'Centro', 'Zona cercana', 'Todo México'];

  const seed = [
    {
      id: 'seed-vendo-1',
      ownerId: 'seed-shop',
      ownerName: 'Proveedor local',
      title: 'Vendo pan casero hoy',
      description: 'Pan dulce y bolillo recién hecho. Entrega local por la tarde.',
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
      description: 'Hago pagos, compras y entregas pequeñas en zona centro y alrededores.',
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
      description: 'Busco viaje mañana por la mañana. Salida desde Chapultepec.',
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
    pickedFileData: '',
    pickedFileName: '',
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
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
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
        const hay = `${post.title || ''} ${post.description || ''} ${post.zone || ''} ${post.ownerName || ''}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  function myPosts() {
    return state.posts.filter(post => post.ownerId === userId());
  }

  function followedPosts() {
    const ids = new Set(follows());
    return state.posts.filter(post => ids.has(post.ownerId)).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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
        <div class="top-safe"></div>
        ${content}
      </main>

      <nav class="bottom-nav">
        <button class="nav-item ${state.route === '/' ? 'active' : ''}" data-nav="/">🏠<small>Inicio</small></button>
        <button class="nav-item ${state.route === '/siguiendo' ? 'active' : ''}" data-nav="/siguiendo">🫂<small>Siguiendo</small></button>
        <button class="nav-plus" data-pick>+</button>
        <button class="nav-item ${state.route === '/mensajes' ? 'active' : ''}" data-nav="/mensajes">✉️<small>Mensajes</small></button>
        <button class="nav-item ${state.route === '/perfil' ? 'active' : ''}" data-nav="/perfil">👤<small>Perfil</small></button>
      </nav>

      <input id="mediaPicker" type="file" accept="image/*,video/*" hidden>
    `;
  }

  function topHeader() {
    return `
      <section class="top-card">
        <div class="brand-row">
          <img src="assets/icons/conecta-logo-oficial.png" alt="Conecta" class="brand-logo" onerror="this.style.display='none'">
          <div class="brand-text">
            <strong>Conecta</strong>
            <span>Servicios</span>
          </div>
          <div style="display:flex;gap:10px;align-items:center">
            <div class="top-ghost"></div>
            <button class="bell-btn" title="Avisos">🔔</button>
          </div>
        </div>

        <div class="overlay-controls">
          <div class="path-row">
            ${pathButton('VENDO', '🏪', 'Vendo', 'vendo')}
            ${pathButton('OFREZCO', '🛵', 'Ofrezco', 'ofrezco')}
            ${pathButton('NECESITO', '🧡', 'Necesito', 'necesito')}
          </div>

          <label class="search-float">
            <span class="icon">🔎</span>
            <input id="searchInput" value="${esc(state.query)}" placeholder="Buscar">
          </label>
        </div>
      </section>
    `;
  }

  function pathButton(key, icon, label, klass) {
    const active = state.filter === key;
    return `
      <button class="path-btn ${klass} ${active ? 'active' : ''}" data-filter="${key}">
        <div class="inner">
          <span class="icon">${icon}</span>
          <span class="label">${label}</span>
        </div>
      </button>
    `;
  }

  function homePage() {
    return shell(`
      ${topHeader()}
      <section class="feed">
        ${filteredPosts().map(postCard).join('') || '<div class="empty">No hay publicaciones con ese filtro o búsqueda.</div>'}
      </section>
    `);
  }

  function categoryClass(category) {
    return `cat-${normalizeCategory(category).toLowerCase()}`;
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
        <div class="media-shell">
          ${
            media
              ? (isVideo
                ? `<video src="${esc(media)}" controls playsinline></video>`
                : `<img src="${esc(media)}" alt="${esc(post.title || 'Publicación')}">`)
              : '<div class="media-empty">Conecta Servicios</div>'
          }

          <div class="media-overlay-top">
            <span class="chip ${categoryClass(post.category)}">${esc(normalizeCategory(post.category))}</span>
            <span class="chip">📍 ${esc(post.zone || 'Zona')}</span>
          </div>

          <div class="media-overlay-bottom">
            <div class="floating-actions">
              <button class="round-action" data-like="${esc(post.id)}">❤️</button>
              <button class="round-action" data-message="${esc(post.id)}">✉️</button>
              <button class="round-action" data-share="${esc(post.id)}">↗️</button>
            </div>
            <button class="follow-btn ${isFollowing(post.ownerId) ? 'following' : ''}" data-follow="${esc(post.ownerId)}">
              ${isFollowing(post.ownerId) ? 'Siguiendo' : 'Seguir'}
            </button>
          </div>
        </div>

        <div class="post-body">
          <h2>${esc(post.title || 'Publicación')}</h2>
          <p>${esc(post.description || '')}</p>
          <div class="meta">
            <span>👤 ${esc(post.ownerName || 'Usuario local')}</span>
            <span>${new Date(post.createdAt || Date.now()).toLocaleDateString('es-MX')}</span>
          </div>

          ${own ? `
            <div class="edit-row">
              <button data-edit="${esc(post.id)}">Editar</button>
              <button class="danger" data-delete="${esc(post.id)}">Borrar</button>
            </div>
          ` : ''}

          ${post.cloudStatus === 'local' ? '<div class="local-note">Guardada localmente. Revisa conexión o vuelve a intentar sincronizar.</div>' : ''}
        </div>
      </article>
    `;
  }

  function followingPage() {
    const posts = followedPosts();
    return shell(`
      <section class="helper-card">
        <h1>Siguiendo</h1>
        <p>Aquí aparecen proveedores, clientes o mensajeros que decidiste seguir.</p>
      </section>
      <section class="feed">
        ${posts.map(postCard).join('') || '<div class="empty">Todavía no sigues a nadie.</div>'}
      </section>
    `);
  }

  function messagesPage() {
    const list = messages().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return shell(`
      <section class="messages-card">
        <h1>Mensajes</h1>
        <p>Aquí se registran los mensajes que envías desde las publicaciones.</p>
        <div class="list">
          ${list.map(messageCard).join('') || '<div class="empty">Todavía no hay mensajes.</div>'}
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
      <section class="profile-card">
        <h1>Perfil</h1>
        <p>Por ahora este MVP se enfoca en publicar fácil. Aquí puedes ver un resumen rápido.</p>

        <label>Nombre visible</label>
        <input id="profileName" value="${esc(prof.name || 'Usuario local')}" placeholder="Tu nombre o negocio">

        <button class="primary-action" style="margin-top:12px" data-save-profile>Guardar nombre</button>

        <div class="profile-stats">
          <div class="stat"><strong>${mine.length}</strong><span>Publicaciones</span></div>
          <div class="stat"><strong>${follows().length}</strong><span>Siguiendo</span></div>
          <div class="stat"><strong>${messages().length}</strong><span>Mensajes</span></div>
        </div>
      </section>

      <section class="feed" style="margin-top:18px">
        ${mine.map(postCard).join('') || '<div class="empty">Todavía no has publicado.</div>'}
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
      <section class="composer-card">
        <button class="ghost" data-nav="/">← Volver</button>
        <h1>Nueva publicación</h1>
        <p style="margin:0 0 14px;color:var(--muted)">Elige tu multimedia, escribe tu descripción y selecciona VENDO, OFREZCO o NECESITO.</p>

        <div class="preview" data-pick>
          ${
            media
              ? (isVideo
                ? `<video src="${esc(media)}" controls playsinline></video>`
                : `<img src="${esc(media)}" alt="Vista previa">`)
              : '<div><strong>+ Agregar foto o video</strong><span>Desde tu dispositivo</span></div>'
          }
        </div>

        <label>Descripción</label>
        <textarea id="description" placeholder="Describe lo que vendes, ofreces o necesitas.">${esc(post.description || '')}</textarea>

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

        <button class="primary-action publish-only" data-publish>PUBLICAR</button>
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

  function openPicker() {
    document.getElementById('mediaPicker')?.click();
  }

  function nav(route) {
    state.route = route;
    render();
    setTimeout(() => scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  async function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function fileChosen(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast(`Por ahora usa archivos de hasta ${MAX_FILE_MB} MB.`);
      return;
    }

    state.mediaType = file.type.startsWith('video') ? 'video' : 'image';
    try {
      state.pickedFileData = await fileToDataURL(file);
      state.preview = state.pickedFileData;
      state.pickedFileName = file.name || 'media';
      state.editing = null;
      nav('/publicar');
    } catch {
      toast('No se pudo leer el archivo.');
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
    if (!form.description) return toast('Escribe una descripción');
    if (!form.zone) return toast('Agrega zona o municipio');
    if (!form.category) return toast('Selecciona VENDO, OFREZCO o NECESITO');

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
    state.pickedFileData = '';
    state.pickedFileName = '';
    state.mediaType = 'image';
    state.editing = null;
    state.filter = form.category;
    state.query = '';

    if (ok) {
      await syncFromCloud();
      toast('Publicación lista');
      nav('/');
    } else {
      toast('Tu publicación se guardó como borrador local. Revisa conexión o vuelve a intentar sincronizar.');
      nav('/');
    }
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
    toast('Publicación borrada');
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
    else navigator.clipboard?.writeText(text).then(() => toast('Copiado para compartir'));
  }

  function toggleFollow(ownerId) {
    const current = follows();
    const next = current.includes(ownerId)
      ? current.filter(id => id !== ownerId)
      : [...current, ownerId];
    set(K.follows, next);
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
    toast('Mensaje guardado');
  }

  function saveProfile() {
    const name = document.getElementById('profileName')?.value.trim() || 'Usuario local';
    set(K.profile, { name });
    toast('Nombre guardado');
  }

  function bind() {
    document.querySelectorAll('[data-nav]').forEach(button => button.onclick = () => nav(button.dataset.nav));
    document.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => { state.filter = button.dataset.filter; render(); });
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
        const currentRoute = state.route;
        if (currentRoute !== '/') state.route = '/';
        render();
      };
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
