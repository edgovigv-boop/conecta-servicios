/* Conecta Servicios v6.1.0 - Tres caminos: VENDO / OFREZCO / NECESITO */
(() => {
  'use strict';

  const VERSION = 'v6.1.0-tres-caminos';
  const ADMIN_PIN = '3145';
  const APP_URL = 'https://conecta-servicios.vercel.app/';
  const K = {
    posts: 'cs_v610_posts',
    user: 'cs_v610_user',
    admin: 'cs_v610_admin'
  };

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');

  const CATEGORIES = ['VENDO', 'OFREZCO', 'NECESITO'];
  const ZONES = ['Tejupilco', 'Toluca', 'Metepec', 'Chapultepec', 'Centro', 'Zona cercana', 'Todo México'];

  const seed = [
    {
      id: 'plantilla-vendo-1',
      title: 'PLANTILLA "ÚSALA"',
      description: 'PLANTILLA "ÚSALA"\nVendo comida casera por pedido. Agrega aquí producto, precio, zona, horario y forma de entrega.',
      category: 'VENDO',
      zone: 'Tejupilco',
      mediaUrl: 'assets/dola-media/comida-01.jpg',
      mediaType: 'image',
      ownerId: 'admin-template',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      reactions: 0,
      status: 'activa',
      template: true
    },
    {
      id: 'plantilla-ofrezco-1',
      title: 'PLANTILLA "ÚSALA"',
      description: 'PLANTILLA "ÚSALA"\nOfrezco servicio local. Describe aquí qué haces, en qué zona atiendes, horarios y cómo pueden contactarte.',
      category: 'OFREZCO',
      zone: 'Zona cercana',
      mediaUrl: 'assets/dola-media/agente-01.jpg',
      mediaType: 'image',
      ownerId: 'admin-template',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      reactions: 0,
      status: 'activa',
      template: true
    },
    {
      id: 'plantilla-necesito-1',
      title: 'PLANTILLA "ÚSALA"',
      description: 'PLANTILLA "ÚSALA"\nNecesito apoyo para una actividad local. Describe aquí lo que necesitas, zona, horario y condiciones.',
      category: 'NECESITO',
      zone: 'Centro',
      mediaUrl: 'assets/dola-media/solicitante-01.jpg',
      mediaType: 'image',
      ownerId: 'admin-template',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      reactions: 0,
      status: 'activa',
      template: true
    }
  ];

  const state = {
    route: '/',
    path: '',
    posts: [],
    file: null,
    preview: '',
    mediaType: 'image',
    editing: null,
    cloudReady: false
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

  function uid(prefix = 'p') {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
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

  function isAdmin() {
    return localStorage.getItem(K.admin) === 'true';
  }

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  function normalizeCategory(category) {
    const value = String(category || '').toUpperCase().trim();
    return CATEGORIES.includes(value) ? value : 'NECESITO';
  }

  function titleFrom(description) {
    const first = String(description || '').split('\n').map(line => line.trim()).find(Boolean) || 'PUBLICACIÓN';
    return first.slice(0, 72);
  }

  function loadLocal() {
    const saved = get(K.posts, null);
    if (!saved) {
      set(K.posts, seed);
      return seed;
    }
    return saved.map(post => ({ ...post, category: normalizeCategory(post.category) }));
  }

  function saveLocal(posts) {
    const normalized = posts.map(post => ({ ...post, category: normalizeCategory(post.category) }));
    state.posts = normalized;
    set(K.posts, normalized);
  }

  function visiblePosts() {
    return state.posts
      .filter(post => post.status !== 'eliminada')
      .filter(post => !state.path || normalizeCategory(post.category) === state.path)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async function syncFromCloud() {
    try {
      const response = await fetch('/api/publications', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error('Sin muro público');

      state.cloudReady = true;
      const remote = (data.posts || []).map(post => ({
        ...post,
        category: normalizeCategory(post.category),
        cloudStatus: 'publica'
      }));

      const local = loadLocal();
      const merged = [...remote];

      local.forEach(post => {
        if (!merged.some(item => item.id === post.id)) merged.push(post);
      });

      saveLocal(merged);
    } catch {
      state.cloudReady = false;
      state.posts = loadLocal();
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
      if (!response.ok || !data.ok) throw new Error('No sincronizado');
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
        body: JSON.stringify({ id, ownerId: userId(), admin: isAdmin() })
      });
    } catch {}
  }

  function shell(content) {
    return `
      <main class="app-page">
        <header class="topbar">
          <div class="brand-block">
            <img src="assets/icons/conecta-logo-oficial.png" alt="Conecta" class="brand-logo" onerror="this.style.display='none'">
            <div>
              <strong>Conecta Servicios</strong>
              <span>${state.cloudReady ? 'Muro público' : 'Modo local'} · ${VERSION}</span>
            </div>
          </div>
          <button class="admin-pill ${isAdmin() ? 'active' : ''}" data-admin>${isAdmin() ? 'Admin activo' : 'Admin'}</button>
        </header>
        ${content}
      </main>

      <nav class="bottom-nav">
        <button class="nav-item ${state.route === '/' ? 'active' : ''}" data-home>🏠<small>Inicio</small></button>
        <button class="nav-plus" data-pick>+</button>
        <button class="nav-item ${state.route === '/muro' ? 'active' : ''}" data-open-path="${esc(state.path || 'VENDO')}">📌<small>Muro</small></button>
      </nav>

      <input id="mediaPicker" type="file" accept="image/*,video/*" hidden>
    `;
  }

  function home() {
    return shell(`
      <section class="home-only">
        <div class="home-title">
          <h1>¿Qué vas a hacer?</h1>
          <p>Conecta Servicios queda ordenado solo por tres caminos.</p>
        </div>

        <div class="path-grid">
          <button class="path-button path-vendo" data-open-path="VENDO">
            <strong>VENDO</strong>
            <span>Productos, comida, negocios y ventas locales</span>
          </button>

          <button class="path-button path-ofrezco" data-open-path="OFREZCO">
            <strong>OFREZCO</strong>
            <span>Servicios, trabajo, apoyo, entregas o habilidades</span>
          </button>

          <button class="path-button path-necesito" data-open-path="NECESITO">
            <strong>NECESITO</strong>
            <span>Ayuda, mandados, viajes, compras o soluciones</span>
          </button>
        </div>
      </section>
    `);
  }

  function pathPage() {
    const posts = visiblePosts();
    return shell(`
      <section class="section-head">
        <div>
          <h1>${esc(state.path || 'Muro')}</h1>
          <p>${isAdmin() ? 'Admin: carga aquí tus plantillas.' : 'Publicaciones disponibles en este camino.'}</p>
        </div>
        ${isAdmin() ? '<button class="small-btn" data-pick>+ Publicar</button>' : ''}
      </section>

      <section class="feed">
        ${posts.map(postCard).join('') || '<div class="empty">Todavía no hay publicaciones en este camino.</div>'}
      </section>
    `);
  }

  function badgeClass(category) {
    const cat = normalizeCategory(category).toLowerCase();
    return `badge-${cat}`;
  }

  function postCard(post) {
    const canManage = isAdmin();
    const media = post.mediaUrl || post.mediaData || '';
    const isVideo = post.mediaType === 'video';

    return `
      <article class="card">
        <div class="post-media">
          ${
            media
              ? (isVideo
                ? `<video src="${esc(media)}" controls playsinline></video>`
                : `<img src="${esc(media)}" alt="${esc(post.title || 'Publicación')}">`)
              : '<div class="no-media">Conecta Servicios</div>'
          }
          <span class="badge ${badgeClass(post.category)}">${esc(normalizeCategory(post.category))}</span>
        </div>

        <div class="post-body">
          <h2>${esc(post.title || 'PUBLICACIÓN')}</h2>
          <p>${esc(post.description || '')}</p>

          <div class="meta">
            <span>📍 ${esc(post.zone || 'Zona')}</span>
            <span>${new Date(post.createdAt || Date.now()).toLocaleDateString('es-MX')}</span>
          </div>

          <div class="actions">
            <button data-like="${esc(post.id)}">❤️ ${post.reactions || 0}</button>
            <button data-share="${esc(post.id)}">Compartir</button>
            ${canManage ? `
              <button data-edit="${esc(post.id)}">Editar</button>
              <button class="danger" data-delete="${esc(post.id)}">Borrar</button>
            ` : ''}
          </div>

          ${post.cloudStatus === 'local' ? '<div class="local-note">Guardada localmente. Revisa conexión o vuelve a intentar sincronizar.</div>' : ''}
        </div>
      </article>
    `;
  }

  function composer() {
    const post = state.editing || {
      description: 'PLANTILLA "ÚSALA"\n',
      category: state.path || 'VENDO',
      zone: ''
    };

    const media = state.preview || post.mediaUrl || post.mediaData || '';
    const isVideo = (state.mediaType || post.mediaType) === 'video';

    return shell(`
      <section class="composer-card">
        <button class="ghost" data-back>← Volver</button>
        <h1>${state.editing ? 'Editar publicación' : 'Publicar plantilla'}</h1>

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
        <textarea id="description" placeholder='PLANTILLA "ÚSALA"&#10;Describe aquí la plantilla para que otra persona la use.'>${esc(post.description || '')}</textarea>

        <div class="form-grid">
          <div>
            <label>Zona o municipio</label>
            <input id="zone" list="zones" value="${esc(post.zone || '')}" placeholder="Ej. Tejupilco">
            <datalist id="zones">
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
      '/': home,
      '/muro': pathPage,
      '/publicar': composer
    };
    app.innerHTML = (routes[state.route] || home)();
    bind();
  }

  function goHome() {
    state.route = '/';
    state.path = '';
    render();
    setTimeout(() => scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  function openPath(path) {
    state.path = normalizeCategory(path);
    state.route = '/muro';
    render();
    setTimeout(() => scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  function openComposer() {
    if (!isAdmin()) return toast('Solo Admin puede publicar por ahora.');
    document.getElementById('mediaPicker')?.click();
  }

  function backFromComposer() {
    if (state.path) openPath(state.path);
    else goHome();
  }

  function readImage(file) {
    return new Promise(resolve => {
      if (!file.type.startsWith('image/')) return resolve('');
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  async function fileChosen(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    state.file = file;
    state.mediaType = file.type.startsWith('video') ? 'video' : 'image';
    state.preview = state.mediaType === 'video' ? URL.createObjectURL(file) : await readImage(file);
    state.editing = null;
    state.route = '/publicar';
    render();
  }

  function collectForm() {
    return {
      description: document.getElementById('description')?.value.trim() || '',
      zone: document.getElementById('zone')?.value.trim() || '',
      category: normalizeCategory(document.getElementById('category')?.value || state.path || 'VENDO')
    };
  }

  async function publish() {
    if (!isAdmin()) return toast('Solo Admin puede publicar por ahora.');

    const form = collectForm();
    if (!form.description) return toast('Escribe la descripción');
    if (!form.zone) return toast('Agrega zona o municipio');
    if (!form.category) return toast('Selecciona VENDO, OFREZCO o NECESITO');

    const old = state.editing;
    const id = old?.id || uid('post');

    const post = {
      ...old,
      id,
      ownerId: old?.ownerId || userId(),
      title: titleFrom(form.description),
      description: form.description,
      zone: form.zone,
      category: form.category,
      mediaData: state.mediaType === 'image' ? (state.preview || old?.mediaData || '') : '',
      mediaUrl: old?.mediaUrl || '',
      mediaType: state.mediaType || old?.mediaType || 'image',
      status: 'activa',
      reactions: old?.reactions || 0,
      createdAt: old?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cloudStatus: 'subiendo',
      template: true,
      adminTemplate: true
    };

    saveLocal([post, ...state.posts.filter(item => item.id !== id)]);
    toast('Publicando...');

    const ok = await syncPost(post);
    const finalPost = { ...post, cloudStatus: ok ? 'publica' : 'local' };
    saveLocal([finalPost, ...state.posts.filter(item => item.id !== id)]);

    state.file = null;
    state.preview = '';
    state.mediaType = 'image';
    state.editing = null;
    state.path = form.category;

    if (ok) {
      await syncFromCloud();
      toast('Publicación lista');
    } else {
      toast('Tu publicación se guardó como borrador local. Revisa conexión o vuelve a intentar sincronizar.');
    }

    openPath(form.category);
  }

  function editPost(id) {
    if (!isAdmin()) return toast('Solo Admin puede editar por ahora.');
    const post = state.posts.find(item => item.id === id);
    if (!post) return;

    state.editing = { ...post, category: normalizeCategory(post.category) };
    state.preview = post.mediaUrl || post.mediaData || '';
    state.mediaType = post.mediaType || 'image';
    state.path = normalizeCategory(post.category);
    state.route = '/publicar';
    render();
  }

  function deletePost(id) {
    if (!isAdmin()) return toast('Solo Admin puede borrar por ahora.');
    const post = state.posts.find(item => item.id === id);
    if (!post) return;
    if (!confirm('¿Borrar esta publicación?')) return;

    saveLocal(state.posts.filter(item => item.id !== id));
    deleteCloud(id);
    toast('Publicación borrada');
    render();
  }

  function likePost(id) {
    saveLocal(state.posts.map(post => post.id === id ? { ...post, reactions: (post.reactions || 0) + 1 } : post));
    render();
  }

  function sharePost(id) {
    const post = state.posts.find(item => item.id === id);
    if (!post) return;

    const text = `${post.title}\n\n${post.description}\n\n${post.category} · ${post.zone}\n\n${APP_URL}`;

    if (navigator.share) {
      navigator.share({ title: post.title, text, url: APP_URL }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => toast('Copiado para compartir'));
    }
  }

  function adminLogin() {
    if (isAdmin()) return toast('Admin ya está activo');

    const pin = prompt('PIN de admin');
    if (pin === ADMIN_PIN) {
      localStorage.setItem(K.admin, 'true');
      toast('Admin activo');
      render();
    } else if (pin) {
      toast('PIN incorrecto');
    }
  }

  function bind() {
    document.querySelectorAll('[data-home]').forEach(button => button.onclick = goHome);
    document.querySelectorAll('[data-open-path]').forEach(button => button.onclick = () => openPath(button.dataset.openPath));
    document.querySelectorAll('[data-pick]').forEach(button => button.onclick = openComposer);
    document.querySelectorAll('[data-back]').forEach(button => button.onclick = backFromComposer);
    document.querySelectorAll('[data-publish]').forEach(button => button.onclick = publish);
    document.querySelectorAll('[data-like]').forEach(button => button.onclick = () => likePost(button.dataset.like));
    document.querySelectorAll('[data-share]').forEach(button => button.onclick = () => sharePost(button.dataset.share));
    document.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => editPost(button.dataset.edit));
    document.querySelectorAll('[data-delete]').forEach(button => button.onclick = () => deletePost(button.dataset.delete));
    document.querySelectorAll('[data-admin]').forEach(button => button.onclick = adminLogin);

    const picker = document.getElementById('mediaPicker');
    if (picker) picker.onchange = fileChosen;
  }

  async function init() {
    state.posts = loadLocal();
    render();
    await syncFromCloud();
    render();
  }

  init();
})();
