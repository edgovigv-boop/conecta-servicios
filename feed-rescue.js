/* Conecta Servicios v6.4.68 - Rescate visual del feed.
   Solo actúa si app.js deja el centro en blanco aunque /api/publications sí devuelva posts. */
(() => {
  'use strict';

  const RESCUE_VERSION = 'v6.4.68-feed-rescue';
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

  function norm(value = '') {
    return String(value || '').trim();
  }

  function postTitle(post = {}) {
    return norm(post.title) || norm(post.description).slice(0, 80) || 'Publicación';
  }

  function postDescription(post = {}) {
    const description = norm(post.description || post.details || post.content || post.body || '');
    return description || postTitle(post);
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

  function category(post = {}) {
    const value = String(post.category || 'OFREZCO').toUpperCase();
    return ['VENDO', 'OFREZCO', 'NECESITO'].includes(value) ? value : 'OFREZCO';
  }

  function serviceArea(post = {}) {
    return norm(post.serviceArea || post.coverageArea || post.zone || 'Tu zona');
  }

  function ownerName(post = {}) {
    return norm(post.ownerName || post.name || 'Usuario local');
  }

  function shortDate(value) {
    try {
      if (!value) return '';
      return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '';
    }
  }

  function card(post) {
    const media = postMedia(post);
    const video = isVideo(post, media);
    const title = postTitle(post);
    const description = postDescription(post);
    const area = serviceArea(post);
    const cat = category(post);
    const owner = ownerName(post);
    const date = shortDate(post.createdAt || post.updatedAt);

    return `
      <article class="rescue-post-card">
        <div class="rescue-media">
          ${
            media
              ? (video
                ? `<video src="${esc(media)}" muted loop playsinline preload="metadata"></video>`
                : `<img src="${esc(media)}" alt="${esc(title)}" loading="lazy">`)
              : `<div class="rescue-no-media"><strong>${esc(cat)}</strong><span>Conecta Servicios</span></div>`
          }
        </div>
        <div class="rescue-gradient"></div>
        <div class="rescue-chip">${esc(cat)}</div>
        <div class="rescue-body">
          <div class="rescue-owner">
            <div class="rescue-avatar">${esc(owner.slice(0, 1).toUpperCase() || 'C')}</div>
            <strong>${esc(owner)}</strong>
          </div>
          <div class="rescue-zone">📍 Atiende en: <strong>${esc(area)}</strong></div>
          <h2>${esc(title)}</h2>
          <p>${esc(description.length > 120 ? description.slice(0, 120).trim() + '...' : description)}</p>
          <div class="rescue-date">${esc(date)}</div>
          <div class="rescue-actions">
            <button type="button">♡</button>
            <button type="button">✉️</button>
            <button type="button">↗️</button>
          </div>
        </div>
      </article>
    `;
  }

  function installStyles() {
    if (document.getElementById('cs-feed-rescue-styles')) return;

    const style = document.createElement('style');
    style.id = 'cs-feed-rescue-styles';
    style.textContent = `
      .rescue-feed {
        width: 100%;
        min-height: 100dvh;
        margin: 0;
        padding: 0 0 calc(env(safe-area-inset-bottom) + 86px);
        background: #050507;
      }

      .rescue-post-card {
        position: relative;
        width: 100%;
        height: 100dvh;
        min-height: 100dvh;
        overflow: hidden;
        background: #111827;
        color: #fff;
      }

      @supports (height: 100svh) {
        .rescue-post-card {
          height: 100svh;
          min-height: 100svh;
        }
      }

      .rescue-media,
      .rescue-media img,
      .rescue-media video,
      .rescue-no-media {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .rescue-media img,
      .rescue-media video {
        object-fit: cover;
        object-position: center;
        background: #050507;
      }

      .rescue-no-media {
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #111827, #1D4ED8);
        text-align: center;
      }

      .rescue-no-media strong {
        display: block;
        font-size: 44px;
        font-weight: 900;
      }

      .rescue-no-media span {
        display: block;
        margin-top: 10px;
        font-size: 18px;
        font-weight: 800;
        opacity: .8;
      }

      .rescue-gradient {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(17,24,39,.08), rgba(17,24,39,.18) 38%, rgba(17,24,39,.72) 68%, rgba(17,24,39,1));
        pointer-events: none;
      }

      .rescue-chip {
        position: absolute;
        top: calc(env(safe-area-inset-top) + 155px);
        left: 16px;
        z-index: 4;
        padding: 7px 13px;
        border-radius: 999px;
        background: #1D4ED8;
        color: #fff;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .04em;
        box-shadow: 0 10px 24px rgba(0,0,0,.22);
      }

      .rescue-body {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 5;
        padding: 72px 16px calc(env(safe-area-inset-bottom) + 94px);
        background: linear-gradient(180deg, rgba(17,24,39,0), rgba(17,24,39,.4) 22%, rgba(17,24,39,.96));
      }

      .rescue-owner {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .rescue-avatar {
        width: 42px;
        height: 42px;
        border-radius: 999px;
        border: 2px solid #fff;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #1D4ED8, #14B8A6);
        font-weight: 900;
      }

      .rescue-zone {
        display: inline-flex;
        max-width: 100%;
        padding: 6px 11px;
        border-radius: 999px;
        background: rgba(255,255,255,.16);
        border: 1px solid rgba(255,255,255,.18);
        font-size: 12px;
        font-weight: 800;
        margin-bottom: 8px;
      }

      .rescue-body h2 {
        margin: 0 0 6px;
        font-size: 22px;
        line-height: 1.12;
        font-weight: 900;
        text-shadow: 0 2px 14px rgba(0,0,0,.45);
      }

      .rescue-body p {
        margin: 0;
        font-size: 15px;
        line-height: 1.3;
        color: rgba(255,255,255,.92);
      }

      .rescue-date {
        margin-top: 8px;
        color: rgba(255,255,255,.72);
        font-size: 12px;
        text-align: right;
      }

      .rescue-actions {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
        margin-top: 12px;
      }

      .rescue-actions button {
        height: 46px;
        border: 1px solid rgba(255,255,255,.26);
        border-radius: 14px;
        background: rgba(255,255,255,.92);
        color: #1E3A8A;
        font-size: 22px;
        font-weight: 900;
      }

      .rescue-banner {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: calc(env(safe-area-inset-bottom) + 82px);
        z-index: 999;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(17,24,39,.72);
        color: rgba(255,255,255,.9);
        font-size: 11px;
        font-weight: 800;
        text-align: center;
        backdrop-filter: blur(10px);
        pointer-events: none;
      }
    `;

    document.head.appendChild(style);
  }

  function appLooksBlank() {
    const feed = document.querySelector('#feed, .feed');
    const hasCards = !!document.querySelector('.post-card, [data-post-card]');
    if (hasCards) return false;

    if (!feed) {
      const app = document.getElementById('app');
      return !!app && app.textContent.trim().length < 120;
    }

    const text = feed.textContent.trim();
    const rect = feed.getBoundingClientRect();
    return !hasCards && (text.length < 80 || rect.height < 160);
  }

  async function rescueFeed() {
    if (!appLooksBlank()) return;

    let data = null;
    try {
      const res = await fetch('/api/publications?t=' + Date.now(), { cache: 'no-store' });
      data = await res.json();
    } catch {
      return;
    }

    const posts = Array.isArray(data?.posts) ? data.posts.filter(p => p && String(p.status || 'activa').toLowerCase() !== 'eliminada') : [];
    if (!posts.length || !appLooksBlank()) return;

    installStyles();

    const target = document.querySelector('#feed, .feed');
    if (target) {
      target.className = 'rescue-feed';
      target.innerHTML = posts.map(card).join('');
    } else {
      const app = document.getElementById('app');
      if (!app) return;
      app.innerHTML = `<main class="app-page"><section class="rescue-feed">${posts.map(card).join('')}</section></main>`;
    }

    document.querySelectorAll('.rescue-media video').forEach(video => {
      video.play?.().catch(() => null);
    });

    const banner = document.createElement('div');
    banner.className = 'rescue-banner';
    banner.textContent = 'Feed recuperado desde Supabase · ' + RESCUE_VERSION;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 4500);
  }

  async function boot() {
    await wait(1800);
    await rescueFeed();
    await wait(3500);
    await rescueFeed();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
