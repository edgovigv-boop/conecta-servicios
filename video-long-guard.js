/* Conecta Servicios v6.3.17 - Videos hasta 10 minutos / 300 MB */
(() => {
  'use strict';

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

  try {
    if (originalSizeDescriptor && originalSizeDescriptor.configurable) {
      Object.defineProperty(Blob.prototype, 'size', {
        configurable: true,
        enumerable: originalSizeDescriptor.enumerable,
        get() {
          const bytes = actualSize(this);
          const type = String(this.type || '').toLowerCase();
          if (type.startsWith('video/') && bytes > OLD_APP_SAFE_LIMIT_BYTES && bytes <= MAX_VIDEO_BYTES) {
            return OLD_APP_SAFE_LIMIT_BYTES;
          }
          return bytes;
        }
      });
    }
  } catch {}

  async function validateVideoBeforeApp(event) {
    const input = event.target;
    if (!input || input.id !== 'mediaPicker') return;

    const file = input.files && input.files[0];
    if (!isVideo(file)) return;
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

    input.dataset.csVideoGuardValid = '1';
    try {
      if (typeof input.onchange === 'function') input.onchange({ target: input, currentTarget: input, type: 'change' });
      else input.dispatchEvent(new Event('change', { bubbles: true }));
    } finally {
      setTimeout(() => { delete input.dataset.csVideoGuardValid; }, 500);
    }
  }

  document.addEventListener('change', validateVideoBeforeApp, true);
})();
