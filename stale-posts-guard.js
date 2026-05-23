/* Conecta Servicios v6.3.17 - Limpieza de publicaciones locales stale
   Problema que corrige:
   - Un celular conserva en localStorage publicaciones viejas, eliminadas o con video pendiente.
   - El muro público ya tiene la versión correcta, pero la app mezcla la copia local vieja.
   - Resultado: en un celular aparece video pendiente aunque Supabase ya tenga mediaUrl,
     o aparece una publicación borrada.

   Este guard:
   - Se carga antes de app.js.
   - Consulta /api/publications.
   - Limpia localStorage cs_v634_posts.
   - Prefiere SIEMPRE la versión remota de Supabase cuando existe.
   - Elimina copias locales si el remoto dice status = eliminada.
   - Si corrige algo, recarga una sola vez para que app.js arranque limpio.
*/
(() => {
  'use strict';

  const VERSION = 'v6.3.17-limpieza-local-video';
  const POSTS_KEY = 'cs_v634_posts';
  const CLEAN_FLAG = 'cs_v6317_clean_reload_done';

  const safeParse = (value, fallback) => {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  };

  const safeSet = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  const norm = value => String(value || '').trim().toLowerCase();

  function statusOf(post) {
    return norm(post?.status || post?.data?.status);
  }

  function normalizeCategory(value) {
    const x = String(value || '').trim().toUpperCase();
    return ['VENDO', 'OFREZCO', 'NECESITO'].includes(x) ? x : '';
  }

  function normalizePost(post) {
    if (!post || typeof post !== 'object') return post;
    const mediaUrl = String(post.mediaUrl || '').trim();

    const next = {
      ...post,
      category: normalizeCategory(post.category) || post.category
    };

    if (mediaUrl) {
      next.mediaUrl = mediaUrl;
      next.mediaStatus = '';
      next.mediaPending = false;
      next.cloudStatus = next.cloudStatus || 'publica';

      if (!next.mediaType && /\.(mp4|mov|webm|m4v)(\?|$)/i.test(mediaUrl)) {
        next.mediaType = 'video';
      }
    }

    return next;
  }

  function softKey(post) {
    if (!post) return '';
    return [
      norm(post.ownerId),
      norm(post.title),
      norm(post.description).slice(0, 120),
      norm(post.zone),
      normalizeCategory(post.category)
    ].join('|');
  }

  function isSeed(post) {
    return String(post?.id || '').startsWith('seed-');
  }

  function isFreshUnpublishedOwnPost(post) {
    if (!post) return false;
    const owner = String(post.ownerId || '');
    const me = localStorage.getItem('cs_v634_user') || '';
    if (!owner || owner !== me) return false;

    const updated = new Date(post.updatedAt || post.createdAt || 0).getTime();
    if (!Number.isFinite(updated)) return false;

    const age = Date.now() - updated;
    const cloud = norm(post.cloudStatus);
    const media = norm(post.mediaStatus);

    return age < 5 * 60 * 1000 && (cloud === 'local' || cloud === 'subiendo' || media === 'pendiente');
  }

  function equalPost(a, b) {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
  }

  function mergeRemoteOverLocal(localPost, remotePost) {
    const merged = normalizePost({
      ...(localPost || {}),
      ...(remotePost || {}),
      // Campos remotos críticos que no deben ser reemplazados por copia local vieja.
      id: remotePost.id,
      ownerId: remotePost.ownerId,
      status: remotePost.status || remotePost.data?.status || 'activa',
      mediaUrl: remotePost.mediaUrl || '',
      mediaStatus: remotePost.mediaUrl ? '' : (remotePost.mediaStatus || ''),
      cloudStatus: 'publica',
      updatedAt: remotePost.updatedAt || localPost?.updatedAt,
      createdAt: remotePost.createdAt || localPost?.createdAt
    });

    if (remotePost.mediaUrl) {
      merged.mediaStatus = '';
      merged.mediaPending = false;
    }

    return merged;
  }

  async function fetchRemotePosts() {
    const res = await fetch('/api/publications?ts=' + Date.now(), { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok || !data.ok || !Array.isArray(data.posts)) throw new Error('PUBLICATIONS_NOT_READY');
    return data.posts.map(normalizePost);
  }

  function repairLocalPosts(remotePosts) {
    const localPosts = safeParse(localStorage.getItem(POSTS_KEY), []);
    if (!Array.isArray(localPosts)) return false;

    const remoteById = new Map();
    const remoteBySoftKey = new Map();
    const deletedIds = new Set();
    const deletedSoftKeys = new Set();

    remotePosts.forEach(post => {
      if (!post || !post.id) return;
      const id = String(post.id);
      const sk = softKey(post);
      const deleted = statusOf(post) === 'eliminada';

      if (deleted) {
        deletedIds.add(id);
        if (sk) deletedSoftKeys.add(sk);
      } else {
        remoteById.set(id, post);
        if (sk) remoteBySoftKey.set(sk, post);
      }
    });

    const repaired = [];
    const usedRemoteIds = new Set();

    localPosts.map(normalizePost).forEach(local => {
      if (!local || !local.id) return;

      const id = String(local.id);
      const sk = softKey(local);

      if (isSeed(local)) {
        repaired.push(local);
        return;
      }

      // Borrado remoto: se elimina de este celular.
      if (deletedIds.has(id) || (sk && deletedSoftKeys.has(sk)) || statusOf(local) === 'eliminada') {
        return;
      }

      // Mis borradores o subidas en progreso muy recientes se conservan.
      if (isFreshUnpublishedOwnPost(local) && !remoteById.has(id)) {
        repaired.push(local);
        return;
      }

      // Si existe remoto por ID, remoto manda.
      const remoteByExactId = remoteById.get(id);
      if (remoteByExactId) {
        repaired.push(mergeRemoteOverLocal(local, remoteByExactId));
        usedRemoteIds.add(remoteByExactId.id);
        return;
      }

      // Si existe remoto por contenido muy parecido, remoto manda y evita duplicados viejos.
      const remoteSimilar = sk ? remoteBySoftKey.get(sk) : null;
      if (remoteSimilar) {
        repaired.push(mergeRemoteOverLocal(local, remoteSimilar));
        usedRemoteIds.add(remoteSimilar.id);
        return;
      }

      // Copia vieja pública que ya no existe en remoto: no debe quedarse.
      const cloud = norm(local.cloudStatus);
      if (cloud === 'publica' || local.mediaUrl || norm(local.mediaStatus) === 'pendiente') {
        return;
      }

      repaired.push(local);
    });

    // Asegura que todas las publicaciones remotas activas estén presentes.
    remotePosts.forEach(remote => {
      if (!remote || !remote.id || statusOf(remote) === 'eliminada') return;
      if (usedRemoteIds.has(remote.id)) return;
      if (repaired.some(p => String(p.id) === String(remote.id))) return;
      repaired.push(normalizePost({ ...remote, cloudStatus: 'publica' }));
    });

    // Quita duplicados finales por ID.
    const finalById = new Map();
    repaired.forEach(post => {
      if (!post || !post.id) return;
      const current = finalById.get(String(post.id));
      if (!current) finalById.set(String(post.id), post);
      else {
        // Preferir el que tenga mediaUrl y no esté pendiente.
        if (post.mediaUrl && !current.mediaUrl) finalById.set(String(post.id), post);
        else if (statusOf(current) === 'eliminada') finalById.set(String(post.id), post);
      }
    });

    const finalPosts = [...finalById.values()];
    const changed = !equalPost(localPosts, finalPosts);

    if (changed) {
      safeSet(POSTS_KEY, finalPosts);
    }

    return changed;
  }

  function hideBadPendingOverlays() {
    try {
      document.querySelectorAll('.post-card').forEach(card => {
        const video = card.querySelector('video[src]');
        if (!video) return;
        const src = video.getAttribute('src') || video.currentSrc || '';
        if (!src) return;

        card.querySelectorAll('.media-pending').forEach(el => {
          el.style.display = 'none';
          el.setAttribute('aria-hidden', 'true');
        });
      });
    } catch {}
  }

  async function runRepair({ reload = false } = {}) {
    try {
      const remotePosts = await fetchRemotePosts();
      const changed = repairLocalPosts(remotePosts);
      hideBadPendingOverlays();

      if (changed && reload && sessionStorage.getItem(CLEAN_FLAG) !== VERSION) {
        sessionStorage.setItem(CLEAN_FLAG, VERSION);
        location.replace(location.pathname + '?v=6317-clean-' + Date.now());
      }
    } catch {
      hideBadPendingOverlays();
    }
  }

  // Intercepta fetch de publicaciones para normalizar también lo que recibe app.js.
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function patchedFetch(input, init) {
    const response = await originalFetch(input, init);

    try {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();

      if (method === 'GET' && url.includes('/api/publications') && !url.includes('debug=1')) {
        const payload = await response.clone().json().catch(() => null);
        if (payload && payload.ok && Array.isArray(payload.posts)) {
          const normalized = {
            ...payload,
            posts: payload.posts.map(normalizePost)
          };

          const headers = new Headers(response.headers);
          headers.set('Content-Type', 'application/json; charset=utf-8');

          return new Response(JSON.stringify(normalized), {
            status: response.status,
            statusText: response.statusText,
            headers
          });
        }
      }
    } catch {}

    return response;
  };

  // Ejecutar lo antes posible y repetir mientras el usuario prueba.
  runRepair({ reload: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      hideBadPendingOverlays();
      runRepair({ reload: true });
    });
  } else {
    hideBadPendingOverlays();
    runRepair({ reload: true });
  }

  window.addEventListener('focus', () => runRepair({ reload: false }));
  setInterval(() => runRepair({ reload: false }), 7000);

  window.conectaStalePostsGuard = {
    version: VERSION,
    runRepair
  };
})();
