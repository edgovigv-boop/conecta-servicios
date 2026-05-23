/* Conecta Servicios v6.3.18 - Video ligero en feed
   Problema:
   - Muchos <video src> en el muro intentan cargar metadata al mismo tiempo.
   - En celulares eso provoca que el video se quede "pensando", reproduzca poco y vuelva a cargar.

   Solución:
   - Convertir cada video del feed en "tap para cargar".
   - No se carga el src hasta que el usuario toca reproducir.
   - Al reproducir uno, se pausa y descarga cualquier otro video del feed.
   - Se deja botón "Abrir video" como respaldo.
*/
(() => {
  'use strict';

  const VERSION = 'v6.3.18-video-ligero-feed';

  function ensureStyles() {
    if (document.getElementById('cs-video-lite-style')) return;

    const style = document.createElement('style');
    style.id = 'cs-video-lite-style';
    style.textContent = `
      .cs-video-lite-wrap{
        position:relative;
        width:100%;
        height:100%;
        min-height:360px;
        background:linear-gradient(135deg,#3d20b8,#7a4cff);
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:hidden;
      }
      .cs-video-lite-wrap video{
        width:100%;
        height:100%;
        object-fit:cover;
        display:block;
        background:#111;
      }
      .cs-video-lite-cover{
        position:absolute;
        inset:0;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:12px;
        padding:22px;
        color:#fff;
        text-align:center;
        background:linear-gradient(135deg,rgba(31,18,96,.78),rgba(18,18,32,.56));
        z-index:4;
      }
      .cs-video-lite-play{
        width:86px;
        height:86px;
        border-radius:999px;
        border:0;
        background:rgba(255,255,255,.94);
        color:#111827;
        font-size:34px;
        font-weight:900;
        box-shadow:0 18px 45px rgba(0,0,0,.28);
      }
      .cs-video-lite-cover strong{
        font-size:18px;
        line-height:1.25;
      }
      .cs-video-lite-cover small{
        max-width:260px;
        font-size:13px;
        line-height:1.3;
        opacity:.9;
      }
      .cs-video-lite-actions{
        display:flex;
        gap:10px;
        flex-wrap:wrap;
        justify-content:center;
      }
      .cs-video-lite-open{
        border:0;
        border-radius:999px;
        padding:10px 14px;
        font-weight:800;
        color:#111827;
        background:rgba(255,255,255,.9);
      }
      .cs-video-lite-loading{
        position:absolute;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%);
        z-index:5;
        background:rgba(17,24,39,.86);
        color:#fff;
        border-radius:999px;
        padding:12px 16px;
        font-weight:800;
        box-shadow:0 10px 28px rgba(0,0,0,.28);
      }
      .cs-video-lite-wrap.cs-loaded .cs-video-lite-cover{
        display:none;
      }
      .media-area .media-pending{
        pointer-events:none;
      }
    `;
    document.head.appendChild(style);
  }

  function pauseAndUnloadOthers(currentVideo) {
    document.querySelectorAll('video[data-cs-video-lite="1"]').forEach(video => {
      if (video === currentVideo) return;

      try { video.pause(); } catch {}

      const wrap = video.closest('.cs-video-lite-wrap');
      const src = video.getAttribute('src') || '';

      if (src) {
        video.removeAttribute('src');
        try { video.load(); } catch {}
        if (wrap) wrap.classList.remove('cs-loaded');
      }
    });
  }

  function setupVideo(video) {
    if (!video || video.dataset.csVideoLite === '1') return;

    const originalSrc = video.currentSrc || video.getAttribute('src') || '';
    if (!originalSrc) return;

    video.dataset.csVideoLite = '1';
    video.dataset.src = originalSrc;
    video.removeAttribute('src');
    video.setAttribute('preload', 'none');
    video.setAttribute('controls', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

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

    const pending = wrap.parentElement?.querySelector('.media-pending');
    if (pending) {
      pending.style.display = 'none';
      pending.setAttribute('aria-hidden', 'true');
    }

    const cover = document.createElement('div');
    cover.className = 'cs-video-lite-cover';
    cover.innerHTML = `
      <button class="cs-video-lite-play" type="button" aria-label="Reproducir video">▶</button>
      <strong>Video listo para reproducir</strong>
      <small>Para ahorrar datos y evitar que se quede cargando, el video se abre cuando lo tocas.</small>
      <div class="cs-video-lite-actions">
        <button class="cs-video-lite-open" type="button">Abrir video</button>
      </div>
    `;
    wrap.appendChild(cover);

    const showLoading = () => {
      if (wrap.querySelector('.cs-video-lite-loading')) return;
      const loading = document.createElement('div');
      loading.className = 'cs-video-lite-loading';
      loading.textContent = 'Cargando video...';
      wrap.appendChild(loading);
    };

    const hideLoading = () => {
      wrap.querySelectorAll('.cs-video-lite-loading').forEach(el => el.remove());
    };

    const start = async () => {
      pauseAndUnloadOthers(video);
      showLoading();

      if (!video.getAttribute('src')) {
        video.setAttribute('src', video.dataset.src || originalSrc);
        video.setAttribute('preload', 'metadata');
        try { video.load(); } catch {}
      }

      wrap.classList.add('cs-loaded');

      try {
        await video.play();
      } catch {
        // En algunos móviles el navegador pide otro toque; al menos queda con controles.
      } finally {
        setTimeout(hideLoading, 900);
      }
    };

    cover.querySelector('.cs-video-lite-play')?.addEventListener('click', start);
    cover.addEventListener('click', (event) => {
      if (event.target.closest('.cs-video-lite-open')) return;
      start();
    });

    cover.querySelector('.cs-video-lite-open')?.addEventListener('click', (event) => {
      event.stopPropagation();
      window.open(originalSrc, '_blank', 'noopener,noreferrer');
    });

    video.addEventListener('waiting', showLoading);
    video.addEventListener('playing', hideLoading);
    video.addEventListener('canplay', hideLoading);
    video.addEventListener('error', () => {
      hideLoading();
      wrap.classList.remove('cs-loaded');
      cover.querySelector('strong').textContent = 'No se pudo reproducir aquí';
      cover.querySelector('small').textContent = 'Toca Abrir video para verlo directo desde el navegador.';
    });
  }

  function scan() {
    ensureStyles();

    document.querySelectorAll('.post-card video[src], .post-card video[data-src]').forEach(video => {
      // Si otro guard ya movió el src a data-src, restaurar para setup.
      if (!video.getAttribute('src') && video.dataset.src && video.dataset.csVideoLite !== '1') {
        video.setAttribute('src', video.dataset.src);
      }
      setupVideo(video);
    });
  }

  function start() {
    scan();

    const observer = new MutationObserver(() => scan());
    observer.observe(document.documentElement, { childList: true, subtree: true });

    setInterval(scan, 1800);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        document.querySelectorAll('video[data-cs-video-lite="1"]').forEach(video => {
          try { video.pause(); } catch {}
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.conectaVideoLiteGuard = { version: VERSION, scan };
})();
