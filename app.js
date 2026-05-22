/* Conecta Servicios v6.0.0 - MVP social simple */
(() => {
  'use strict';

  const VERSION = 'v6.0.0-social-simple';
  const ADMIN_PIN = '3145';
  const APP_URL = 'https://conecta-servicios.vercel.app/';
  const K = { posts:'cs_v600_posts', user:'cs_v600_user', admin:'cs_v600_admin', draft:'cs_v600_draft' };

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');

  const categories = ['Comida','Servicio','Negocio local','Mandado o envío','Viaje compartido','Trabajo','Ayuda local','Venta','Otro'];
  const zones = ['Tejupilco','Toluca','Metepec','Chapultepec','Centro','Zona cercana','Todo México'];

  const seed = [
    {
      id:'demo-1',
      title:'Rosticería con entrega',
      description:'Pollo asado con ensalada, salsas y tortillas. Entrega local o para recoger.',
      category:'Comida',
      zone:'Tejupilco',
      mediaUrl:'assets/dola-media/comida-01.jpg',
      mediaType:'image',
      ownerId:'demo',
      createdAt:new Date(Date.now()-3600000).toISOString(),
      reactions:12,
      status:'activa'
    },
    {
      id:'demo-2',
      title:'Mandados por la tarde',
      description:'Compras, pagos y entregas pequeñas. Disponible por la tarde en zona centro.',
      category:'Mandado o envío',
      zone:'Centro',
      mediaUrl:'assets/dola-media/mandados-01.jpg',
      mediaType:'image',
      ownerId:'demo',
      createdAt:new Date(Date.now()-7200000).toISOString(),
      reactions:8,
      status:'activa'
    }
  ];

  const state = {
    route:'/',
    posts:[],
    filter:'Todas',
    file:null,
    preview:'',
    mediaType:'image',
    editing:null,
    cloudReady:false
  };

  function esc(value='') {
    return String(value).replace(/[&<>'"]/g, char => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      "'":'&#39;',
      '"':'&quot;'
    }[char]));
  }

  function uid(prefix='p') {
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

  function isAdmin() {
    return localStorage.getItem(K.admin) === 'true';
  }

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  function titleFrom(text) {
    return (String(text).split('\n').map(line => line.trim()).find(Boolean) || 'Publicación').slice(0, 72);
  }

  function loadLocal() {
    const saved = get(K.posts, null);
    if (!saved) {
      set(K.posts, seed);
      return seed;
    }
    return saved;
  }

  function saveLocal(posts) {
    state.posts = posts;
    set(K.posts, posts);
  }

  function visiblePosts() {
    const active = state.posts.filter(post => post.status !== 'eliminada');
    const filtered = state.filter === 'Todas'
      ? active
      : active.filter(post => post.category === state.filter);
    return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async function syncFromCloud() {
    try {
      const response = await fetch('/api/publications', { cache:'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error('Sin conexión pública');

      state.cloudReady = true;
      const remote = (data.posts || []).map(post => ({ ...post, cloudStatus:'publica' }));
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
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ post })
      });
      const data = await response.json().catch(() => ({ ok:false }));
      if (!response.ok || !data.ok) throw new Error('No sincronizado');
      return true;
    } catch {
      return false;
    }
  }

  async function deleteCloud(id) {
    try {
      await fetch('/api/publications', {
        method:'DELETE',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ id, ownerId:userId(), admin:isAdmin() })
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
              <span>${state.cloudReady ? 'Muro público' : 'Modo local'}</span>
            </div>
          </div>
          <button class="admin-pill ${isAdmin() ? 'active' : ''}" data-admin>${isAdmin() ? 'Admin activo' : 'Admin'}</button>
        </header>
        ${content}
      </main>

      <nav class="bottom-nav">
        <button class="nav-item ${state.route === '/' ? 'active' : ''}" data-nav="/">🏠<small>Inicio</small></button>
        <button class="nav-plus" data-pick>+</button>
        <button class="nav-item ${state.route === '/mis' ? 'active' : ''}" data-nav="/mis">📌<small>Mis publicaciones</small></button>
      </nav>

      <input id="mediaPicker" type="file" accept="image/*,video/*" hidden>
    `;
  }

  function home() {
    return shell(`
      <section class="hero-card">
        <h1>Publica fácil, como red social local</h1>
        <p>Elige foto o video, escribe descripción, zona y categoría. Publica sin pantallas complicadas.</p>
        <button class="primary-action" data-pick>+ Publicar</button>
      </section>

      <section class="filters">
        ${['Todas', ...categories].map(category => `
          <button class="filter ${state.filter === category ? 'active' : ''}" data-filter="${esc(category)}">${esc(category)}</button>
        `).join('')}
      </section>

      <section class="feed">
        ${visiblePosts().map(postCard).join('') || '<div class="empty">Todavía no hay publicaciones.</div>'}
      </section>
    `);
  }

  function postCard(post) {
    const mine = post.ownerId === userId();
    const canManage = mine || isAdmin();
    const media = post.mediaUrl || post.mediaData || '';
    const isVideo = post.mediaType === 'video';

    return `
      <article class="post-card">
        <div class="post-media">
          ${
            media
              ? (isVideo
                ? `<video src="${esc(media)}" controls playsinline></video>`
                : `<img src="${esc(media)}" alt="${esc(post.title)}">`)
              : '<div class="no-media">Conecta Servicios</div>'
          }
          <span class="category-badge">${esc(post.category || 'General')}</span>
        </div>

        <div class="post-body">
          <h2>${esc(post.title || 'Publicación')}</h2>
          <p>${esc(post.description || '')}</p>
          <div class="post-meta">
            <span>📍 ${esc(post.zone || 'Zona')}</span>
            <span>${new Date(post.createdAt || Date.now()).toLocaleDateString('es-MX')}</span>
          </div>
          <div class="post-actions">
            <button data-like="${esc(post.id)}">❤️ ${post.reactions || 0}</button>
            <button data-share="${esc(post.id)}">Compartir</button>
            ${canManage ? `
              <button data-edit="${esc(post.id)}">Editar</button>
              <button class="danger" data-delete="${esc(post.id)}">Borrar</button>
            ` : ''}
          </div>
          ${post.cloudStatus === 'local' ? '<div class="local-note">Guardada localmente.</div>' : ''}
        </div>
      </article>
    `;
  }

  function composer() {
    const post = state.editing || get(K.draft, {});
    const media = state.preview || post.mediaUrl || post.mediaData || '';
    const isVideo = (state.mediaType || post.mediaType) === 'video';

    return shell(`
      <section class="composer-card">
        <button class="ghost" data-nav="/">← Volver</button>
        <h1>${state.editing ? 'Editar publicación' : 'Nueva publicación'}</h1>

        <div class="composer-preview" data-pick>
          ${
            media
              ? (isVideo
                ? `<video src="${esc(media)}" controls playsinline></video>`
                : `<img src="${esc(media)}" alt="Vista previa">`)
              : '<div><strong>+ Agregar foto o video</strong><span>Desde tu dispositivo</span></div>'
          }
        </div>

        <label>Descripción</label>
        <textarea id="description" placeholder="Ejemplo: Vendo comida casera hoy. Entrego en zona centro. Precio y detalles por mensaje.">${esc(post.description || '')}</textarea>

        <div class="form-grid">
          <div>
            <label>Zona o municipio</label>
            <input id="zone" list="zones" value="${esc(post.zone || '')}" placeholder="Ej. Tejupilco">
            <datalist id="zones">
              ${zones.map(zone => `<option value="${esc(zone)}"></option>`).join('')}
            </datalist>
          </div>

          <div>
            <label>Categoría</label>
            <select id="category">
              <option value="">Selecciona</option>
              ${categories.map(category => `<option value="${esc(category)}" ${post.category === category ? 'selected' : ''}>${esc(category)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button class="secondary-action" data-save-draft>Guardar borrador</button>
          <button class="primary-action" data-publish>${state.editing ? 'Guardar cambios' : 'Publicar'}</button>
        </div>
      </section>
    `);
  }

  function myPosts() {
    const mine = state.posts
      .filter(post => post.ownerId === userId())
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return shell(`
      <section class="hero-card compact">
        <h1>Mis publicaciones</h1>
        <p>${isAdmin() ? 'Admin activo: puedes cargar muchas publicaciones tipo plantilla.' : 'Tus publicaciones y borradores locales.'}</p>
        <button class="primary-action" data-pick>+ Publicar</button>
      </section>

      <section class="feed">
        ${mine.map(postCard).join('') || '<div class="empty">Aún no tienes publicaciones.</div>'}
      </section>
    `);
  }

  function render() {
    const routes = { '/':home, '/publicar':composer, '/mis':myPosts };
    app.innerHTML = (routes[state.route] || home)();
    bind();
  }

  function nav(route) {
    state.route = route;
    render();
    setTimeout(() => scrollTo({ top:0, behavior:'smooth' }), 0);
  }

  function openPicker() {
    document.getElementById('mediaPicker')?.click();
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
    localStorage.removeItem(K.draft);
    nav('/publicar');
  }

  function formData() {
    return {
      description:document.getElementById('description')?.value.trim() || '',
      zone:document.getElementById('zone')?.value.trim() || '',
      category:document.getElementById('category')?.value || ''
    };
  }

  function saveDraft() {
    const form = formData();
    set(K.draft, {
      ...form,
      mediaData:state.mediaType === 'image' ? state.preview : '',
      mediaType:state.mediaType,
      savedAt:new Date().toISOString()
    });
    toast('Borrador guardado');
  }

  async function publish() {
    const form = formData();
    if (!form.description) return toast('Escribe una descripción');
    if (!form.zone) return toast('Agrega zona o municipio');
    if (!form.category) return toast('Selecciona categoría');

    const old = state.editing;
    const id = old?.id || uid('post');

    const post = {
      ...old,
      id,
      ownerId:old?.ownerId || userId(),
      title:titleFrom(form.description),
      description:form.description,
      zone:form.zone,
      category:form.category,
      mediaData:state.mediaType === 'image' ? (state.preview || old?.mediaData || '') : '',
      mediaUrl:old?.mediaUrl || '',
      mediaType:state.mediaType || old?.mediaType || 'image',
      status:'activa',
      reactions:old?.reactions || 0,
      createdAt:old?.createdAt || new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      cloudStatus:'subiendo',
      adminTemplate:isAdmin()
    };

    saveLocal([post, ...state.posts.filter(item => item.id !== id)]);
    toast('Publicando...');

    const ok = await syncPost(post);
    const finalPost = { ...post, cloudStatus:ok ? 'publica' : 'local' };
    saveLocal([finalPost, ...state.posts.filter(item => item.id !== id)]);

    state.file = null;
    state.preview = '';
    state.editing = null;
    localStorage.removeItem(K.draft);

    if (ok) {
      await syncFromCloud();
      toast('Publicación lista');
      nav('/');
    } else {
      toast('Tu publicación se guardó como borrador local. Revisa conexión o vuelve a intentar sincronizar.');
      nav('/mis');
    }
  }

  function editPost(id) {
    const post = state.posts.find(item => item.id === id);
    if (!post) return;
    if (!isAdmin() && post.ownerId !== userId()) return toast('Solo puedes editar tus publicaciones');

    state.editing = { ...post };
    state.preview = post.mediaUrl || post.mediaData || '';
    state.mediaType = post.mediaType || 'image';
    nav('/publicar');
  }

  function deletePost(id) {
    const post = state.posts.find(item => item.id === id);
    if (!post) return;
    if (!isAdmin() && post.ownerId !== userId()) return toast('Solo puedes borrar tus publicaciones');
    if (!confirm('¿Borrar esta publicación?')) return;

    saveLocal(state.posts.filter(item => item.id !== id));
    deleteCloud(id);
    toast('Publicación borrada');
    render();
  }

  async function deleteCloud(id) {
    try {
      await fetch('/api/publications', {
        method:'DELETE',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ id, ownerId:userId(), admin:isAdmin() })
      });
    } catch {}
  }

  function likePost(id) {
    saveLocal(state.posts.map(post => post.id === id ? { ...post, reactions:(post.reactions || 0) + 1 } : post));
    render();
  }

  function sharePost(id) {
    const post = state.posts.find(item => item.id === id);
    if (!post) return;

    const text = `${post.title}\n\n${post.description}\n\nZona: ${post.zone}\nCategoría: ${post.category}\n\n${APP_URL}`;

    if (navigator.share) {
      navigator.share({ title:post.title, text, url:APP_URL }).catch(() => {});
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
    document.querySelectorAll('[data-nav]').forEach(button => button.onclick = () => nav(button.dataset.nav));
    document.querySelectorAll('[data-pick]').forEach(button => button.onclick = openPicker);
    document.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => { state.filter = button.dataset.filter; render(); });
    document.querySelectorAll('[data-save-draft]').forEach(button => button.onclick = saveDraft);
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
