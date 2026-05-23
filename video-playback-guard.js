/* Conecta Servicios v6.3.17 - Guard de reproducción de video */
(() => {
  'use strict';

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
    if (!mediaUrl) return post;

    return {
      ...post,
      mediaUrl,
      mediaStatus: '',
      mediaPending: false,
      cloudStatus: post.cloudStatus || 'publica',
      mediaType: post.mediaType || (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(mediaUrl) ? 'video' : post.mediaType)
    };
  }

  function normalizeLocalPosts() {
    const local = safeParse(localStorage.getItem(POSTS_KEY), []);
    if (!Array.isArray(local)) return;
    safeSet(POSTS_KEY, local.map(normalizePost));
  }

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
      });
    } catch {}
  }

  normalizeLocalPosts();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixVideoCards);
  } else {
    fixVideoCards();
  }

  const obs = new MutationObserver(fixVideoCards);
  obs.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(fixVideoCards, 1500);
})();
