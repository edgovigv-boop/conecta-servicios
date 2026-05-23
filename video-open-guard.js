/* Conecta Servicios v6.3.19 - Video abrir directo
   Decisión MVP:
   - El video ya existe en Supabase y "Abrir video" sí funciona.
   - Para evitar pausas/carga infinita dentro del feed, el botón principal de video
     abre el archivo directo en el reproductor del navegador.
   - También repara copias locales si el celular tiene estado pendiente viejo.
*/
(() => {
  'use strict';

  const VERSION = 'v6.3.19-video-abrir-directo';
  const POSTS_KEY = 'cs_v634_posts';
  const RELOAD_FLAG = 'cs_v6319_video_open_reload_done';

  const safeParse = (value, fallback) => {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  };

  const safeSet = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  const norm = value => String(value || '').trim().toLowerCase();

  function softKey(post) {
    if (!post) return '';
    return [
      norm(post.ownerId),
      norm(post.title),
      norm(post.description).slice(0, 120),
      norm(post.zone),
      String(post.category || '').trim().toUpperCase()
    ].join('|');
  }

  function statusOf(post) {
    return norm(post?.status || post?.data?.status);
  }

  function isVideoPost(post) {
    return norm(post?.mediaType) === 'video' || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(String(post?.mediaUrl || ''));
  }

  function normalizeRemotePost(post) {
    if (!post || typeof post !== 'object') return post;

    const mediaUrl = String(post.mediaUrl || '').trim();
    const next = {
      ...post,
      cloudStatus: post.cloudStatus || 'publica'
    };

    if (mediaUrl && isVideoPost(post)) {
      next.mediaUrl = mediaUrl;
      next.mediaType = 'video';
      next.mediaStatus = '';
      next.mediaPending = false;
      next.cloudStatus = 'publica';
    }

    return next;
  }

  async function fetchRemotePosts() {
    const response = await fetch('/api/publications?videoOpen=' + Date.now(), { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !data.ok || !Array.isArray(data.posts)) return [];
    return data.posts.map(normalizeRemotePost);
  }

  function repairLocalWithRemote(remotePosts) {
    const localPosts = safeParse(localStorage.getItem(POSTS_KEY), []);
    if (!Array.isArray(localPosts)) return false;

    const remoteById = new Map();
    const remoteBySoft = new Map();
    const deletedIds = new Set();

    remotePosts.forEach(remote => {
      if (!remote || !remote.id) return;
      if (statusOf(remote) === 'eliminada') {
        deletedIds.add(String(remote.id));
        return;
      }

      remoteById.set(String(remote.id), remote);
      const sk = softKey(remote);
      if (sk) remoteBySoft.set(sk, remote);
    });

    const final = [];
    const usedIds = new Set();

    localPosts.forEach(local => {
      if (!local || !local.id) return;

      if (String(local.id).startsWith('seed-')) {
        final.push(local);
        return;
      }

      if (deletedIds.has(String(local.id)) || statusOf(local) === 'eliminada') {
        return;
      }

      const remote = remoteById.get(String(local.id)) || remoteBySoft.get(softKey(local));

      if (remote) {
        usedIds.add(String(remote.id));

        // Si remoto trae video real, la versión remota gana para no quedarse en "pendiente".
        if (remote.mediaUrl && isVideoPost(remote)) {
          final.push({
            ...local,
            ...remote,
            mediaType: 'video',
            mediaStatus: '',
            mediaPending: false,
            cloudStatus: 'publica',
            status: remote.status || 'activa'
          });
          return;
        }

        final.push({ ...local, ...remote });
        return;
      }

      // Si es copia local vieja con pendiente o pública pero ya no está en remoto, se limpia.
      if (norm(local.cloudStatus) === 'publica' || norm(local.mediaStatus) === 'pendiente') {
        return;
      }

      final.push(local);
    });

    remotePosts.forEach(remote => {
      if (!remote || !remote.id || statusOf(remote) === 'eliminada') return;
      if (usedIds.has(String(remote.id))) return;
      if (final.some(p => String(p.id) === String(remote.id))) return;

      final.push(normalizeRemotePost(remote));
    });

    const before = JSON.stringify(localPosts);
    const after = JSON.stringify(final);

    if (before !== after) {
      safeSet(POSTS_KEY, final);
      return true;
    }

    return false;
  }

  async function repairAndMaybeReload() {
    try {
      const remote = await fetchRemotePosts();
      const changed = repairLocalWithRemote(remote);

      if (changed && sessionStorage.getItem(RELOAD_FLAG) !== VERSION) {
        sessionStorage.setItem(RELOAD_FLAG, VERSION);
        location.replace(location.pathname + '?v=6319-clean-' + Date.now());
      }
    } catch {
      // No bloquear.
    }
  }

  function getVideoUrlFromWrap(wrap) {
    const video = wrap.querySelector('video');
    return (
      video?.dataset?.src ||
      video?.getAttribute('src') ||
      video?.currentSrc ||
      ''
    );
  }

  function openVideo(url) {
    if (!url) return;

    try {
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) location.href = url;
    } catch {
      location.href = url;
    }
  }

  function rewriteLiteCover(wrap) {
    if (!wrap || wrap.dataset.csOpenDirect === '1') return;

    const url = getVideoUrlFromWrap(wrap);
    if (!url) return;

    wrap.dataset.csOpenDirect = '1';

    // Dejar el video descargado dentro del feed para ahorrar datos.
    const video = wrap.querySelector('video');
    if (video) {
      try { video.pause(); } catch {}
      video.removeAttribute('src');
      video.setAttribute('preload', 'none');
      video.dataset.src = url;
      try { video.load(); } catch {}
    }

    let cover = wrap.querySelector('.cs-video-lite-cover');
    if (!cover) {
      cover = document.createElement('div');
      cover.className = 'cs-video-lite-cover';
      wrap.appendChild(cover);
    }

    cover.innerHTML = `
      <button class="cs-video-lite-play" type="button" aria-label="Abrir video">▶</button>
      <strong>Reproducir video</strong>
      <small>Para que no se quede cargando dentro del muro, se abrirá en el reproductor del navegador.</small>
      <div class="cs-video-lite-actions">
        <button class="cs-video-lite-open" type="button">Abrir video</button>
      </div>
    `;

    cover.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openVideo(url);
      }, { passive: false });
    });

    cover.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openVideo(url);
    }, { passive: false });

    const card = wrap.closest('.post-card');
    card?.querySelectorAll('.media-pending').forEach(el => {
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
    });
  }

  function rewriteNormalVideo(video) {
    if (!video || video.dataset.csOpenDirectReady === '1') return;

    const url = video.dataset.src || video.getAttribute('src') || video.currentSrc || '';
    if (!url) return;

    video.dataset.csOpenDirectReady = '1';
    video.dataset.src = url;

    try { video.pause(); } catch {}
    video.removeAttribute('src');
    video.setAttribute('preload', 'none');
    try { video.load(); } catch {}

    const parent = video.parentElement;
    if (!parent) return;

    let wrap = video.closest('.cs-video-lite-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'cs-video-lite-wrap';
      parent.insertBefore(wrap, video);
      wrap.appendChild(video);
    }

    rewriteLiteCover(wrap);
  }

  function scanDom() {
    try {
      document.querySelectorAll('.post-card video').forEach(rewriteNormalVideo);
      document.querySelectorAll('.cs-video-lite-wrap').forEach(rewriteLiteCover);

      // Si queda alguna banda de pendiente encima de un card con video ya preparado, ocultarla.
      document.querySelectorAll('.post-card').forEach(card => {
        const hasVideo = card.querySelector('video[data-src], video[data-cs-open-direct-ready="1"], .cs-video-lite-wrap');
        if (!hasVideo) return;
        card.querySelectorAll('.media-pending').forEach(el => {
          el.style.display = 'none';
          el.setAttribute('aria-hidden', 'true');
        });
      });
    } catch {
      // No bloquear.
    }
  }

  function start() {
    repairAndMaybeReload();
    scanDom();

    const observer = new MutationObserver(scanDom);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    setInterval(() => {
      scanDom();
      repairAndMaybeReload();
    }, 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.conectaVideoOpenGuard = {
    version: VERSION,
    repairAndMaybeReload,
    scanDom
  };
})();
