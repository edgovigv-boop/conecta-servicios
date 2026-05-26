/* Conecta Servicios v6.3.23 - Boot diagnostics */
(() => {
  'use strict';

  const VERSION = 'v6.4.44-menu-flotante-publicacion';
  window.CONNECTA_BOOT_VERSION = VERSION;
  window.CONNETA_BOOT_VERSION = VERSION;

  async function clearConectaCache(){
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k.startsWith('conecta-servicios-')).map(k => caches.delete(k)));
      }

      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg => reg.update().catch(() => null)));
      }
    } catch (error) {
      console.warn('[Conecta boot] cache clear failed', error);
    }
  }

  window.conectaBootReset = async function conectaBootReset({hard = false} = {}){
    if (hard) {
      try {
        const keepUser = localStorage.getItem('cs_v634_user');
        const keepProfile = localStorage.getItem('cs_v634_profile');
        const keepFollows = localStorage.getItem('cs_v634_follows');

        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('cs_v') || key.includes('conecta') || key.includes('cache_version')) {
            localStorage.removeItem(key);
          }
        });

        if (keepUser) localStorage.setItem('cs_v634_user', keepUser);
        if (keepProfile) localStorage.setItem('cs_v634_profile', keepProfile);
        if (keepFollows) localStorage.setItem('cs_v634_follows', keepFollows);
      } catch {}
    }

    await clearConectaCache();
  };

  const params = new URLSearchParams(location.search);
  if (params.get('reset') === '1' || params.get('hardreset') === '1') {
    window.conectaBootReset({ hard: true }).then(() => {
      location.replace('/?v=6323-after-reset-' + Date.now());
    });
  } else {
    clearConectaCache();
  }
})();
