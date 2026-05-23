/* Conecta Servicios v6.3.15 - Guard de reproducción de video
   Limpia estado pendiente cuando ya existe mediaUrl real.
*/
(() => {
  'use strict';

  const VERSION = 'v6.3.15-video-playback';
  const PUBLICATIONS_API = '/api/publications';
  const POSTS_KEY = 'cs_v634_posts';

  const safeParse = (value, fallback) => {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  };

  const safeSet = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  function normalizePost(post) {
    if (!post || typeof post !== 'object') return post;

    const mediaUrl = String(post.mediaUrl || '').trim();
    const mediaType = String(post.mediaType || '').toLowerCase();

    if (mediaUrl) {
      return {
        ...post,
        mediaUrl,
        mediaType: mediaType || (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(mediaUrl) ? 'video' : post.mediaType),
        mediaStatus: '',
        mediaPending: false,
        cloudStatus: post.cloudStatus || 'publica'
      };
    }

    return post;
  }

  function normalizeLocalPosts() {
    const local = safeParse(localStorage.getItem(POSTS_KEY), []);
    if (!Array.isArray(local)) return;
    safeSet(POSTS_KEY, local.map(normalizePost));
  }

  function normalizePayload(payload) {
    if (!payload || !Array.isArray(payload.posts)) return payload;
    return { ...payload, posts: payload.posts.map(normalizePost) };
  }

  function cloneJsonResponse(originalResponse, payload) {
    const headers = new Headers(originalResponse.headers);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    return new Response(JSON.stringify(payload), {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers
    });
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function patchedFetch(input, init) {
    const response = await originalFetch(input, init);

    try {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();

      if (method === 'GET' && url.includes(PUBLICATIONS_API) && !url.includes('debug=1')) {
        const payload = await response.clone().json().catch(() => null);
        if (payload && payload.ok && Array.isArray(payload.posts)) {
          return cloneJsonResponse(response, normalizePayload(payload));
        }
      }
    } catch {}

    return response;
  };

  function fixVideoCards() {
    try {
      document.querySelectorAll('.post-card').forEach(card => {
        const video = card.querySelector('video');
        if (!video) return;

        video.setAttribute('controls', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('preload', 'metadata');

        const src = video.currentSrc || video.getAttribute('src') || '';
        if (!src) return;

        card.querySelectorAll('.media-pending').forEach(el => {
          el.style.display = 'none';
          el.setAttribute('aria-hidden', 'true');
        });

        const mediaArea = card.querySelector('.media-area');
        if (mediaArea) mediaArea.classList.add('video-ready');
      });
    } catch {}
  }

  function startDomGuard() {
    fixVideoCards();
    const obs = new MutationObserver(() => fixVideoCards());
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setInterval(fixVideoCards, 1500);
  }

  normalizeLocalPosts();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startDomGuard);
  } else {
    startDomGuard();
  }

  window.conectaVideoPlaybackGuard = {
    version: VERSION,
    normalizeLocalPosts,
    fixVideoCards
  };
})();
