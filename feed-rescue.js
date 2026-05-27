/* Conecta Servicios v6.4.69 - Rescate persistente del feed.
   Este parche no toca Supabase, Storage, mensajes ni app.js.
   Solo pinta publicaciones reales cuando el render principal deja el centro en blanco. */
(() => {
  'use strict';

  const VERSION = 'v6.4.69-feed-rescue-persistente';
  const API_URL = '/api/publications';
  const CHECK_MS = 1600;

  let lastPosts = [];
  let applying = false;
  let lastApiFetchAt = 0;
  let rescueActive = false;

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function esc(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char]));
  }

  function clean(value = '') {
    return String(value || '').trim();
  }

  function category(post = {}) {
    const value = String(post.category || 'OFREZCO').toUpperCase();
    return ['VENDO', 'OFREZCO', 'NECESITO'].includes(value) ? value : 'OFREZCO';
  }

  function postTitle(post = {}) {
    return clean(post.title) || clean(post.description).slice(0, 84) || 'Publicación';
  }

  function postDescription(post = {}) {
    return clean(post.description || post.details || post.content || post.body || '') || postTitle(post);
  }

  function postMedia(post = {}) {
    if (post.mediaUrl) return post.mediaUrl;
    if (Array.isArray(post.mediaItems)) {
      const item = post.mediaItems.find(x => x && x.mediaUrl);
      if (item) return item.mediaUrl;
    }
    return '';
  }

  function isVideo(post = {}, media = '') {
    const type = String(post.mediaType || '').toLowerCase();
    return type === 'video' || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(String(media || ''));
  }

  function serviceArea(post = {}) {
    return clean(post.serviceArea || post.coverageArea || post.zone || 'Tu zona');
  }

  function ownerName(post = {}) {
    return clean(post.ownerName || post.name || 'Usuario local');
  }

  function ownerAvatar(post = {}) {
    return clean(post.ownerAvatar || post.avatar || '');
  }

  function shortDate(value) {
    try {
      if (!value) return '';
      return new Date(value).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }

  function visiblePosts(posts) {
    return (Array.isArray(posts) ? posts : [])
      .filter(p => p && String(p.status || 'activa').toLowerCase() !== 'eliminada')
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
  }

  function installStyles() {
    if (document.getElementById('cs-feed-rescue-persistent-styles')) return;

    const style = document.createElement('style');
    style.id = 'cs-feed-rescue-persistent-styles';
    style.textContent = `
      .cs-rescue-feed {
        width: 100% !important;
        min-height: 100dvh !important;
        margin: 0 !important;
        padding: 0 0 calc(env(safe-area-inset-bottom) + 86px) !important;
        background: #050507 !important;
        overflow-x: hidden !important;
      }

      .cs-rescue-card {
        position: relative !important;
        width: 100% !important;
        height: 100dvh !important;
        min-height: 100dvh !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: #111827 !important;
        color: #fff !important;
        box-shadow: none !important;
      }

      @supports (height: 100svh) {
        .cs-rescue-card {
          height: 100svh !important;
          min-height: 100svh !important;
        }
      }

      .cs-rescue-media,
      .cs-rescue-media img,
      .cs-rescue-media video,
      .cs-rescue-no-media {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }

      .cs-rescue-media img,
      .cs-rescue-media video {
        object-fit: cover !important;
        object-position: center center !important;
        background: #050507 !important;
        display: block !important;
      }

      .cs-rescue-no-media {
        display: grid !important;
        place-items: center !important;
        background: linear-gradient(135deg, #111827, #1D4ED8) !important;
        text-align: center !important;
      }

      .cs-rescue-no-media strong {
        display: block !important;
        font-size: 40px !important;
        font-weight: 900 !important;
      }

      .cs-rescue-no-media span {
        display: block !important;
        margin-top: 10px !important;
        font-size: 17px !important;
        font-weight: 800 !important;
        opacity: .85 !important;
      }

      .cs-rescue-gradient {
        position: absolute !important;
        inset: 0 !important;
        z-index: 2 !important;
        pointer-events: none !important;
        background: linear-gradient(180deg, rgba(17,24,39,.08), rgba(17,24,39,.14) 38%, rgba(17,24,39,.74) 68%, rgba(17,24,39,1)) !important;
      }

      .cs-rescue-chip {
        position: absolute !important;
        top: calc(env(safe-area-inset-top) + 155px) !important;
        left: 16px !important;
        z-index: 4 !important;
        padding: 7px 13px !important;
        border-radius: 999px !important;
        background: #1D4ED8 !important;
        color: #fff !important;
        font-size: 12px !important;
        font-weight: 900 !important;
        letter-spacing: .04em !important;
        box-shadow: 0 10px 24px rgba(0,0,0,.22) !important;
      }

      .cs-rescue-body {
        position: absolute !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 5 !important;
        box-sizing: border-box !important;
        padding: 72px 16px calc(env(safe-area-inset-bottom) + 96px) !important;
        background: linear-gradient(180deg, rgba(17,24,39,0), rgba(17,24,39,.38) 22%, rgba(17,24,39,.96)) !important;
        color: #fff !important;
      }

      .cs-rescue-owner {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        margin-bottom: 8px !important;
      }

      .cs-rescue-avatar {
        width: 42px !important;
        height: 42px !important;
        border-radius: 999px !important;
        border: 2px solid #fff !important;
        display: grid !important;
        place-items: center !important;
        background: linear-gradient(135deg, #1D4ED8, #14B8A6) !important;
        font-weight: 900 !important;
        overflow: hidden !important;
        color: #fff !important;
        box-shadow: 0 8px 18px rgba(0,0,0,.24) !important;
      }

      .cs-rescue-avatar img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }

      .cs-rescue-owner strong {
        color: #fff !important;
        font-size: 16px !important;
        font-weight: 900 !important;
        text-shadow: 0 2px 12px rgba(0,0,0,.42) !important;
      }

      .cs-rescue-zone {
        display: inline-flex !important;
        max-width: 100% !important;
        padding: 6px 11px !important;
        border-radius: 999px !important;
        background: rgba(255,255,255,.16) !important;
        border: 1px solid rgba(255,255,255,.18) !important;
        font-size: 12px !important;
        font-weight: 800 !important;
        margin-bottom: 8px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      .cs-rescue-body h2 {
        margin: 0 0 6px !important;
        font-size: 22px !important;
        line-height: 1.12 !important;
        font-weight: 900 !important;
        color: #fff !important;
        text-shadow: 0 2px 14px rgba(0,0,0,.45) !important;
      }

      .cs-rescue-body p {
        margin: 0 !important;
        font-size: 15px !important;
        line-height: 1.3 !important;
        color: rgba(255,255,255,.92) !important;
      }

      .cs-rescue-date {
        margin-top: 8px !important;
        color: rgba(255,255,255,.72) !important;
        font-size: 12px !important;
        text-align: right !important;
      }

      .cs-rescue-actions {
        display: grid !important;
        grid-template-columns: 1fr 1fr 1fr !important;
        gap: 8px !important;
        margin-top: 12px !important;
      }

      .cs-rescue-actions button {
        height: 46px !important;
        border: 1px solid rgba(255,255,255,.26) !important;
        border-radius: 14px !important;
        background: rgba(255,255,255,.92) !important;
        color: #1E3A8A !important;
        font-size: 22px !important;
        font-weight: 900 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function card(post) {
    const media = postMedia(post);
    const title = postTitle(post);
    const description = postDescription(post);
    const cat = category(post);
    const area = serviceArea(post);
    const owner = ownerName(post);
    const avatar = ownerAvatar(post);
    const date = shortDate(post.createdAt || post.updatedAt);
    const video = isVideo(post, media);

    return `
      <article class="cs-rescue-card" data-rescue-card="${esc(post.id || '')}">
        <div class="cs-rescue-media">
          ${
            media
              ? (video
                ? `<video src="${esc(media)}" muted loop playsinline webkit-playsinline preload="metadata"></video>`
                : `<img src="${esc(media)}" alt="${esc(title)}" loading="lazy">`)
              : `<div class="cs-rescue-no-media"><div><strong>${esc(cat)}</strong><span>Conecta Servicios</span></div></div>`
          }
        </div>
        <div class="cs-rescue-gradient"></div>
        <div class="cs-rescue-chip">${esc(cat)}</div>
        <div class="cs-rescue-body">
          <div class="cs-rescue-owner">
            <div class="cs-rescue-avatar">${avatar ? `<img src="${esc(avatar)}" alt="${esc(owner)}">` : esc(owner.slice(0,1).toUpperCase() || 'C')}</div>
            <strong>${esc(owner)}</strong>
          </div>
          <div class="cs-rescue-zone">📍 Atiende en: <strong>${esc(area)}</strong></div>
          <h2>${esc(title)}</h2>
          <p>${esc(description.length > 132 ? description.slice(0,132).trim() + '...' : description)}</p>
          <div class="cs-rescue-date">${esc(date)}</div>
          <div class="cs-rescue-actions">
            <button type="button" aria-label="Me gusta">♡</button>
            <button type="button" aria-label="Mensaje">✉️</button>
            <button type="button" aria-label="Compartir">↗️</button>
          </div>
        </div>
      </article>
    `;
  }

  function hasMainCards() {
    return !!document.querySelector('.post-card, [data-post-card], .cs-rescue-card');
  }

  function feedIsBlank() {
    const feed = document.querySelector('#feed, .feed, .store-feed, .following-liked-feed');
    const rescueCards = document.querySelectorAll('.cs-rescue-card').length;
    const realCards = document.querySelectorAll('.post-card, [data-post-card]').length;

    if (realCards > 0 || rescueCards > 0) return false;

    if (!feed) {
      const app = document.getElementById('app');
      return !!app && app.textContent.trim().length < 180;
    }

    const rect = feed.getBoundingClientRect();
    const text = feed.textContent.trim().toLowerCase();

    if (text.includes('no encontré publicaciones') || text.includes('prueba otra búsqueda')) return true;
    return rect.height < 220 || text.length < 100;
  }

  async function loadPosts(force = false) {
    if (!force && lastPosts.length && Date.now() - lastApiFetchAt < 9000) return lastPosts;

    try {
      lastApiFetchAt = Date.now();
      const res = await fetch(`${API_URL}?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      const posts = visiblePosts(data?.posts || []);
      if (posts.length) lastPosts = posts;
      return posts;
    } catch {
      return lastPosts;
    }
  }

  function renderRescue(posts) {
    if (!posts.length || applying) return;
    applying = true;

    try {
      installStyles();

      let target = document.querySelector('#feed, .feed');
      if (!target) {
        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = `<main class="app-page"><section id="feed" class="cs-rescue-feed">${posts.map(card).join('')}</section></main>`;
        target = document.querySelector('#feed');
      } else {
        target.className = 'cs-rescue-feed';
        target.innerHTML = posts.map(card).join('');
      }

      rescueActive = true;
      document.querySelectorAll('.cs-rescue-media video').forEach(video => {
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.play?.().catch(() => null);
      });
    } finally {
      applying = false;
    }
  }

  async function rescueIfNeeded(force = false) {
    if (applying) return;

    if (!force && !feedIsBlank()) return;

    const posts = await loadPosts(force);
    if (!posts.length) return;

    // Si la app original ya pintó tarjetas reales, no estorbamos.
    if (document.querySelectorAll('.post-card, [data-post-card]').length > 0 && !force) return;

    if (feedIsBlank() || force || rescueActive) {
      renderRescue(posts);
    }
  }

  function startObserver() {
    const app = document.getElementById('app') || document.body;
    if (!app) return;

    const observer = new MutationObserver(() => {
      clearTimeout(startObserver._timer);
      startObserver._timer = setTimeout(() => rescueIfNeeded(false), 220);
    });

    observer.observe(app, { childList: true, subtree: true });
  }

  async function boot() {
    await wait(1500);
    await rescueIfNeeded(true);

    // Revisa constantemente porque app.js puede re-renderizar y volver a dejar blanco.
    setInterval(() => rescueIfNeeded(false), CHECK_MS);

    startObserver();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => rescueIfNeeded(true), 350);
      }
    });

    window.addEventListener('focus', () => {
      setTimeout(() => rescueIfNeeded(true), 350);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.ConectaFeedRescue = {
    version: VERSION,
    force: () => rescueIfNeeded(true)
  };
})();
