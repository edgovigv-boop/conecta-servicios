/* Conecta Servicios v6.3.15 - Videos hasta 10 minutos
   Se carga antes de app.js.

   Objetivo:
   - Permitir seleccionar videos de hasta 10 minutos.
   - Permitir videos más pesados que el límite viejo de 40 MB, hasta 300 MB.
   - Mantener bloqueados videos demasiado largos o demasiado pesados.
   - No tocar chat, publicaciones, borrado ni diseño.

   Nota técnica:
   La app base tenía un límite interno de 40 MB. Este guard reduce el valor
   reportado por File.size solo para videos válidos, de forma que app.js pueda
   continuar el flujo normal y subir el archivo real a Supabase Storage.
*/
(() => {
  'use strict';

  const VERSION = 'v6.3.15-video-10-min';
  const MAX_VIDEO_SECONDS = 10 * 60;
  const MAX_VIDEO_MB = 300;
  const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
  const OLD_APP_SAFE_LIMIT_BYTES = 39 * 1024 * 1024;

  const originalSizeDescriptor = Object.getOwnPropertyDescriptor(Blob.prototype, 'size');

  function actualSize(blob) {
    try {
      if (originalSizeDescriptor && typeof originalSizeDescriptor.get === 'function') {
        return originalSizeDescriptor.get.call(blob);
      }
    } catch {}
    try { return Number(blob.size) || 0; } catch { return 0; }
  }

  function isVideo(file) {
    return !!file && String(file.type || '').toLowerCase().startsWith('video/');
  }

  function toast(message) {
    const el = document.getElementById('toast');
    if (el) {
      el.textContent = message;
      el.classList.add('show');
      clearTimeout(toast._t);
      toast._t = setTimeout(() => el.classList.remove('show'), 3500);
    } else {
      alert(message);
    }
  }

  function formatMb(bytes) {
    return Math.round((bytes / 1024 / 1024) * 10) / 10;
  }

  function readVideoDuration(file) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      let done = false;

      const finish = (value) => {
        if (done) return;
        done = true;
        try { URL.revokeObjectURL(url); } catch {}
        resolve(value);
      };

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = () => finish(Number(video.duration) || 0);
      video.onerror = () => finish(0);
      setTimeout(() => finish(0), 5000);
      video.src = url;
    });
  }

  // Permite pasar el límite antiguo de 40 MB solo para videos dentro del nuevo límite.
  try {
    if (originalSizeDescriptor && originalSizeDescriptor.configurable) {
      Object.defineProperty(Blob.prototype, 'size', {
        configurable: true,
        enumerable: originalSizeDescriptor.enumerable,
        get() {
          const bytes = actualSize(this);
          const type = String(this.type || '').toLowerCase();

          if (
            type.startsWith('video/') &&
            bytes > OLD_APP_SAFE_LIMIT_BYTES &&
            bytes <= MAX_VIDEO_BYTES
          ) {
            return OLD_APP_SAFE_LIMIT_BYTES;
          }

          return bytes;
        }
      });
    }
  } catch {
    // Si el navegador no permite parchear size, el app.js viejo mantendrá su límite.
  }

  async function validateVideoBeforeApp(event) {
    const input = event.target;
    if (!input || input.id !== 'mediaPicker') return;

    const file = input.files && input.files[0];
    if (!isVideo(file)) return;

    // Si el evento lo disparamos nosotros tras validar, dejar que app.js lo procese.
    if (input.dataset.csVideoGuardValid === '1') return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const bytes = actualSize(file);

    if (bytes > MAX_VIDEO_BYTES) {
      input.value = '';
      toast(`El video pesa ${formatMb(bytes)} MB. Por ahora el máximo es ${MAX_VIDEO_MB} MB.`);
      return;
    }

    toast('Revisando duración del video...');

    const duration = await readVideoDuration(file);

    if (duration && duration > MAX_VIDEO_SECONDS + 1) {
      input.value = '';
      const minutes = Math.round((duration / 60) * 10) / 10;
      toast(`El video dura ${minutes} minutos. El máximo permitido es 10 minutos.`);
      return;
    }

    // Continuar con el flujo original de la app.
    input.dataset.csVideoGuardValid = '1';

    try {
      if (typeof input.onchange === 'function') {
        input.onchange({ target: input, currentTarget: input, type: 'change' });
      } else {
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } finally {
      setTimeout(() => {
        delete input.dataset.csVideoGuardValid;
      }, 500);
    }
  }

  document.addEventListener('change', validateVideoBeforeApp, true);

  window.conectaVideoLongGuard = {
    version: VERSION,
    maxVideoSeconds: MAX_VIDEO_SECONDS,
    maxVideoMb: MAX_VIDEO_MB,
    actualSize
  };
})();
