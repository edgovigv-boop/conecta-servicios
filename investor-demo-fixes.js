/* Conecta Servicios v5.2.16-publicar-simple
   Capa segura de cierre visual para demo de inversionistas.
   No modifica Supabase, Storage, login, membresías ni Admin.
*/
(() => {
  'use strict';

  const VERSION = 'v5.2.16-publicar-simple';
  const SAFE_DRAFT_MESSAGE = 'Tu publicación se guardó como borrador local. Revisa conexión o vuelve a intentar sincronizar.';

  function setVersionMarkers() {
    document.title = 'Conecta Servicios v5.2.16';
    document.body?.setAttribute('data-version', VERSION);
    const oldVersion = document.querySelector('.version');
    if (oldVersion) oldVersion.textContent = VERSION;
  }

  function replaceTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.nodeValue) return;
    let value = node.nodeValue;

    value = value.replace(/Descripción desde Meta IA/g, 'Texto de tu publicación');
    value = value.replace(/➕\s*Igual/g, '✨ Hacer parecida');
    value = value.replace(/\bIgual\b/g, 'Hacer parecida');
    value = value.replace(/\bCrear\b/g, 'Publicar');
    value = value.replace(/\bCrear una igual\b/g, 'Hacer parecida');
    value = value.replace(/No se pudo subir al muro público\. Se guardó como borrador local\./g, SAFE_DRAFT_MESSAGE);

    if (value !== node.nodeValue) node.nodeValue = value;
  }

  function walkText(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(replaceTextNode);
  }

  function polishElements() {
    setVersionMarkers();

    document.querySelectorAll('[data-route="/publicar"]').forEach((button) => {
      if (/^Crear$/i.test(button.textContent.trim())) button.textContent = '+ Publicar';
    });

    document.querySelectorAll('button, .action, .btn, small, label, h1, h2, h3, p, span').forEach((el) => {
      const text = el.textContent.trim();
      if (text === 'Crear') el.textContent = 'Publicar';
      if (text === '➕ Igual' || text === 'Igual') el.textContent = '✨ Hacer parecida';
      if (text === 'Descripción desde Meta IA') el.textContent = 'Texto de tu publicación';
    });

    const toast = document.getElementById('toast');
    if (toast && /No se pudo subir al muro público/.test(toast.textContent)) {
      toast.textContent = SAFE_DRAFT_MESSAGE;
    }
  }

  function applyInvestorDemoPolish() {
    walkText(document.getElementById('app'));
    walkText(document.getElementById('toast'));
    polishElements();
  }

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(applyInvestorDemoPolish);
  });

  window.addEventListener('DOMContentLoaded', () => {
    applyInvestorDemoPolish();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  });

  window.addEventListener('load', applyInvestorDemoPolish);
})();
