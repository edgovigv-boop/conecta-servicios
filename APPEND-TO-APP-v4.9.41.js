// ------------------------------------------------------------------
// v4.9.41 — Limpieza de navegación y Asistente solo dentro de publicaciones
// - Quita accesos globales/flotantes del Asistente de publicación.
// - Explorar vuelve a mostrar solo publicaciones.
// - La barra inferior reemplaza Asistente por Embajadores.
// - El Asistente vive dentro de Publicar y Mis publicaciones, no como sección global.
// ------------------------------------------------------------------
(function publicationAssistantNavigationCleanupV4941(){
  const VERSION = "v4.9.41-limpieza-navegacion-asistente";
  const CLEANUP_FLAG = "conecta_publication_assistant_cleanup_v4941";
  const HIDDEN_SELECTOR = [
    "#baPanelPublicacionesV4939",
    "#baPanelOportunidadesV4939",
    "#baPanelMisPublicacionesV4939",
    "#assistantIntegratedPanelV4940",
    "#baQuickAccessV4939",
    ".ba-quick-access-v4939",
    ".business-assistant-floating",
    ".publication-assistant-floating",
    ".assistant-floating-v4940",
    ".assistant-global-access-v4940",
    ".floating-action-stack",
    ".floating-actions",
    ".right-floating-icons",
    ".quick-actions-floating",
    "[data-assistant-global]",
    "[data-ba-panel='publicaciones']",
    "[data-ba-panel='oportunidades']",
    "[data-ba-panel='misPublicaciones']"
  ].join(",");

  function qs(sel, root = document){ return root.querySelector(sel); }
  function qsa(sel, root = document){ return Array.from(root.querySelectorAll(sel)); }
  function toast(msg){ if (typeof showToast === "function") showToast(msg); else console.log(msg); }
  function isAdmin(){
    try { if (typeof isAdminSupervisorActiveV49368 === "function" && isAdminSupervisorActiveV49368()) return true; } catch {}
    try { if (typeof adminAccessAvailableV4936 === "function" && adminAccessAvailableV4936()) return true; } catch {}
    try { if (typeof adminUnlocked !== "undefined" && adminUnlocked) return true; } catch {}
    try { return localStorage.getItem("conecta_admin_access_v4936") === "1" || localStorage.getItem("conecta_admin_access") === "1"; } catch { return false; }
  }

  function removeGlobalAssistantUI(){
    qsa(HIDDEN_SELECTOR).forEach(el => {
      try { el.remove(); } catch { el.classList.add("hidden"); el.style.display = "none"; }
    });
    document.body.classList.add("assistant-clean-nav-v4941");
    document.body.classList.remove("assistant-integrated-v4940");
  }

  function goEmbajadores(){
    try {
      if (typeof showSection === "function") return showSection("embajadoresLanding");
    } catch {}
    try {
      if (typeof showSection === "function") return showSection("embajadores");
    } catch {}
    window.location.href = "/embajadores";
  }

  function looksLikeAssistantNav(el){
    const bag = `${el.textContent || ""} ${el.getAttribute("aria-label") || ""} ${el.getAttribute("title") || ""} ${el.getAttribute("onclick") || ""} ${el.className || ""}`.toLowerCase();
    return /asistente|orientaci[oó]n|centro de orientación|chat|mensaje/.test(bag) && !/publicar|publicaciones/.test(bag);
  }

  function replaceBottomAssistantWithEmbajadores(){
    const nav = qs(".bottom-nav") || qs(".bottom-navigation") || qs("nav[aria-label*='inferior' i]") || qs(".app-bottom-nav");
    if (!nav) return false;
    const candidates = qsa("button,a", nav);
    let target = candidates.find(el => el.classList.contains("assistant-nav-action-v4940")) || candidates.find(looksLikeAssistantNav);
    if (!target) return false;
    target.classList.remove("assistant-nav-action-v4940");
    target.classList.add("ambassadors-nav-action-v4941");
    target.setAttribute("type", "button");
    target.setAttribute("aria-label", "Embajadores Conecta");
    target.setAttribute("title", "Embajadores Conecta");
    target.removeAttribute("onclick");
    target.innerHTML = `<span class="ambassadors-nav-icon-v4941">🤝</span><span>Embajadores</span>`;
    target.onclick = event => { event.preventDefault(); goEmbajadores(); };
    return true;
  }

  function cleanPerfilProfileSections(){
    const perfil = qs("#perfil") || qs("[data-section='perfil']") || qs(".perfil-section") || qs("#profile") || qs("[data-section='profile']");
    if (!perfil) return;
    qsa("section,article,div", perfil).forEach(el => {
      const txt = (el.textContent || "").toLowerCase();
      if (/asistente de publicaciones|asistente configurable|chat configurable|asistente avanzado|pedidos y citas/.test(txt)) {
        try { el.remove(); } catch { el.style.display = "none"; }
      }
    });
  }

  function cleanExploreSections(){
    const explorar = qs("#publicaciones") || qs("#explorar") || qs("[data-section='explorar']");
    if (!explorar) return;
    qsa("#baPanelPublicacionesV4939, #assistantIntegratedPanelV4940, .ba-panel-v4939, .assistant-integrated-panel-v4940", explorar).forEach(el => {
      try { el.remove(); } catch { el.style.display = "none"; }
    });
  }

  function publicationRequestsPanelHtml(){
    let countConfigs = 0, countOrders = 0, countAppointments = 0, countMessages = 0;
    try { countConfigs = JSON.parse(localStorage.getItem("conecta_publication_assistant_configs_v4939") || "[]").length; } catch {}
    try { countOrders = JSON.parse(localStorage.getItem("conecta_publication_assistant_orders_v4939") || "[]").length; } catch {}
    try { countAppointments = JSON.parse(localStorage.getItem("conecta_publication_assistant_appointments_v4939") || "[]").length; } catch {}
    try { countMessages = JSON.parse(localStorage.getItem("conecta_publication_assistant_messages_v4939") || "[]").length; } catch {}
    return `<section id="publicationRequestsPanelV4941" class="publication-requests-panel-v4941">
      <div class="publication-requests-copy-v4941">
        <span class="publication-requests-kicker-v4941">Mis publicaciones</span>
        <h3>Solicitudes recibidas por mis publicaciones</h3>
        <p>Administra pedidos, citas, cotizaciones, mensajes, viajes, envíos y respuestas de ayuda desde las publicaciones que tú creaste.</p>
      </div>
      <div class="publication-requests-metrics-v4941">
        <span>${countConfigs} asistentes</span>
        <span>${countOrders} pedidos</span>
        <span>${countAppointments} citas</span>
        <span>${countMessages} mensajes</span>
      </div>
      <div class="publication-requests-actions-v4941">
        <button type="button" class="btn-small btn-purple" onclick="openPublicationAssistantOwnerPanelV4939 && openPublicationAssistantOwnerPanelV4939()">Ver solicitudes</button>
        <button type="button" class="btn-small btn-ghost" onclick="openPublicationAssistantConfigV4941()">Configurar asistente por publicación</button>
      </div>
      <p class="publication-requests-note-v4941">La publicación básica sigue siendo gratis. El asistente avanzado se activa con membresía; admin puede probar sin restricciones.</p>
    </section>`;
  }

  function injectRequestsOnlyInMyPublications(){
    const section = qs("#misPublicaciones");
    if (!section) return;
    qsa("#assistantIntegratedPanelV4940, #baPanelMisPublicacionesV4939", section).forEach(el => { try { el.remove(); } catch { el.style.display = "none"; } });
    let panel = qs("#publicationRequestsPanelV4941", section);
    if (!panel) {
      panel = document.createElement("div");
      panel.innerHTML = publicationRequestsPanelHtml();
      section.insertBefore(panel.firstElementChild, section.firstElementChild?.nextSibling || section.firstElementChild || null);
    } else {
      panel.outerHTML = publicationRequestsPanelHtml();
    }
  }

  function openAssistantConfigV4941(type){
    if (!isAdmin()) {
      try {
        const active = (typeof userMembershipIsActiveV4936 === "function" && userMembershipIsActiveV4936()) || localStorage.getItem("conecta_membership_status_v4936") === "active" || localStorage.getItem("conecta_membresia_activa") === "1";
        if (!active) toast("Tu publicación básica es gratis. Activa la membresía para recibir pedidos, citas, cotizaciones o mensajes filtrados.");
      } catch {}
    }
    if (typeof window.openPublicationAssistantConfigV4940 === "function") return window.openPublicationAssistantConfigV4940(type);
    if (typeof window.openPublicationAssistantConfigV4939 === "function") return window.openPublicationAssistantConfigV4939(type || "direct_message");
    toast("Configura primero una publicación básica y después activa el asistente.");
  }

  function removeAssistantFromGlobalRoutes(section){
    const normalized = String(section || "").toLowerCase();
    if (["publicaciones", "explorar", "oportunidades", "perfil", "profile"].includes(normalized)) {
      removeGlobalAssistantUI();
      cleanExploreSections();
      cleanPerfilProfileSections();
    }
    if (normalized === "mispublicaciones") {
      removeGlobalAssistantUI();
      injectRequestsOnlyInMyPublications();
    }
  }

  function wrapShowSectionV4941(){
    try {
      if (typeof showSection !== "function" || window.__showSectionBaseV4941) return;
      window.__showSectionBaseV4941 = showSection;
      showSection = function(section, push = true){
        if (section === "asistente" || section === "assistant") {
          return goEmbajadores();
        }
        const result = window.__showSectionBaseV4941(section, push);
        setTimeout(() => {
          replaceBottomAssistantWithEmbajadores();
          removeAssistantFromGlobalRoutes(section);
          refreshV4941();
        }, 90);
        return result;
      };
    } catch (error) { console.warn("No se pudo limpiar navegación v4.9.41", error); }
  }

  function refreshV4941(){
    removeGlobalAssistantUI();
    replaceBottomAssistantWithEmbajadores();
    cleanExploreSections();
    cleanPerfilProfileSections();
    injectRequestsOnlyInMyPublications();
    document.body.dataset.version = VERSION;
    document.body.dataset.publicationAssistantVersion = VERSION;
    try { localStorage.setItem(CLEANUP_FLAG, VERSION); } catch {}
  }

  window.openPublicationAssistantConfigV4941 = openAssistantConfigV4941;
  window.cleanupPublicationAssistantNavigationV4941 = refreshV4941;
  window.goEmbajadoresFromBottomNavV4941 = goEmbajadores;

  function init(){
    wrapShowSectionV4941();
    refreshV4941();
    setTimeout(refreshV4941, 250);
    setTimeout(refreshV4941, 900);
    let tries = 0;
    const timer = setInterval(() => { refreshV4941(); if (++tries > 14) clearInterval(timer); }, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.addEventListener("pageshow", () => setTimeout(refreshV4941, 150));
  window.addEventListener("hashchange", () => setTimeout(refreshV4941, 120));
})();
