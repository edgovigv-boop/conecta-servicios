
// ------------------------------------------------------------------
// v4.9.40 — Publicar con Asistente integrado + modelo freemium
// - Publicación básica gratis: título, descripción, categoría, zona, foto y contacto.
// - Asistente avanzado: se configura como borrador/vista previa sin membresía.
// - Para activarlo públicamente se requiere membresía activa.
// - Admin libre e ilimitado.
// - El acceso al asistente se integra en la barra inferior; no queda flotando.
// ------------------------------------------------------------------
(function publicationAssistantFreemiumV4940(){
  const VERSION = "4.9.40-publicar-con-asistente-integrado";
  const LEGACY_QUICK_ID = "baQuickAccessV4939";
  const ASSISTANT_FLAG = "conecta_publication_assistant_freemium_v4940";

  function qs(sel, root = document){ return root.querySelector(sel); }
  function qsa(sel, root = document){ return Array.from(root.querySelectorAll(sel)); }
  function toast(msg){ if (typeof showToast === "function") showToast(msg); else console.log(msg); }
  function esc(value = ""){
    if (typeof escapeHtml === "function") return escapeHtml(value);
    return String(value ?? "").replace(/[&<>\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
  }
  function isAdminV4940(){
    try {
      if (typeof isAdminSupervisorActiveV49368 === "function" && isAdminSupervisorActiveV49368()) return true;
      if (typeof adminAccessAvailableV4936 === "function" && adminAccessAvailableV4936()) return true;
      if (typeof adminUnlocked !== "undefined" && adminUnlocked) return true;
      if (typeof adminRouteEnabled !== "undefined" && adminRouteEnabled) return true;
    } catch {}
    try { return localStorage.getItem("conecta_admin_access_v4936") === "1" || localStorage.getItem("conecta_admin_access") === "1"; } catch { return false; }
  }
  function hasMembershipV4940(){
    if (isAdminV4940()) return true;
    try { if (typeof userMembershipIsActiveV4936 === "function" && userMembershipIsActiveV4936()) return true; } catch {}
    try { if (typeof hasActivePublishMembership === "function" && hasActivePublishMembership()) return true; } catch {}
    try { return localStorage.getItem("conecta_membership_status_v4936") === "active" || localStorage.getItem("conecta_membresia_activa") === "1"; } catch { return false; }
  }

  function currentWizardContext(){
    const category = qs("#pubCategory")?.value || "";
    const title = qs("#pubTitle")?.value?.trim() || "";
    const publicName = qs("#pubName")?.value?.trim() || "Publicación local";
    const state = qs("#pubState")?.value || qs("#pubStateName")?.value || "México";
    const municipality = qs("#pubMunicipality")?.value || "";
    const phone = qs("#pubPhone")?.value || "";
    let description = "";
    try { description = typeof currentDescriptionValue === "function" ? currentDescriptionValue() : (qs("#pubDescription")?.value || ""); } catch { description = qs("#pubDescription")?.value || ""; }
    let type = "direct_message";
    const bag = `${category} ${title} ${description}`.toLowerCase();
    if (/rosti|pollo|panader|comida|tienda|producto|venta|men[uú]|refresco|papas|quesadilla/.test(bag)) type = "menu_order";
    else if (/cita|agenda|consultor|doctor|belleza|clase|asesor|taller/.test(bag)) type = "appointment";
    else if (/cotiz|presupuesto/.test(bag)) type = "quote_request";
    else if (/viaje|ruta|auto|salida|traslado/.test(bag)) type = "ride_request";
    else if (/env[ií]o|paquete|mandado|mensajer/.test(bag)) type = "delivery_request";
    else if (/ayuda|apoyo|necesito|busco/.test(bag)) type = "help_response";
    return {
      businessName: publicName,
      publicationTitle: title || "Nueva publicación",
      title: title || "Nueva publicación",
      category,
      state,
      municipality,
      phone,
      description,
      interaction_type: type,
      interactionType: type,
      fromPublishWizard: true
    };
  }

  function openAssistantFromWizardV4940(){
    const ctx = currentWizardContext();
    if (typeof window.configurePublicationAssistantForItemV4939 === "function") {
      window.configurePublicationAssistantForItemV4939({
        id: `draft-${Date.now()}`,
        title: ctx.publicationTitle,
        titulo: ctx.publicationTitle,
        name: ctx.businessName,
        nombre_publico: ctx.businessName,
        category: ctx.category,
        categoria_principal: ctx.category,
        state: ctx.state,
        estado_nombre: ctx.state,
        municipality: ctx.municipality,
        municipio: ctx.municipality,
        phone: ctx.phone,
        telefono: ctx.phone,
        description: ctx.description,
        descripcion: ctx.description
      });
      return;
    }
    if (typeof window.openPublicationAssistantConfigV4939 === "function") return window.openPublicationAssistantConfigV4939(ctx.interaction_type);
    toast("El asistente aún no está cargado. Intenta de nuevo en unos segundos.");
  }

  function freemiumGateHtml(){
    const unlocked = hasMembershipV4940();
    return `<div class="publish-freemium-v4940">
      <div class="free-card-v4940">
        <span>🟢</span>
        <div>
          <strong>Tu publicación básica es gratis</strong>
          <p>Incluye título, descripción, categoría, municipio/zona, una foto opcional y contacto básico. Se publicará con visibilidad normal.</p>
        </div>
      </div>
      <div class="assistant-card-v4940 ${unlocked ? "unlocked" : "locked"}">
        <span>🤖</span>
        <div>
          <strong>${unlocked ? "Asistente avanzado disponible" : "Asistente avanzado con membresía"}</strong>
          <p>Activa pedidos, citas, cotizaciones, mensajes filtrados, solicitudes de viaje/envío o ayuda organizada para esta publicación.</p>
          ${unlocked ? `<small>${isAdminV4940() ? "Admin libre: puedes activar y probar sin restricciones." : "Membresía activa: puedes activar asistentes en tus publicaciones."}</small>` : `<small>Tu publicación básica es gratis. Activa la membresía para recibir pedidos, citas, cotizaciones o mensajes filtrados.</small>`}
        </div>
      </div>
      <div class="freemium-actions-v4940">
        <button type="button" class="btn-small btn-purple" onclick="openAssistantFromPublishV4940()">${unlocked ? "Configurar asistente" : "Ver asistente / guardar borrador"}</button>
        ${unlocked ? "" : `<button type="button" class="btn-small btn-ghost" onclick="openMembershipPaymentFromPublishV4940()">Activar membresía</button>`}
      </div>
    </div>`;
  }

  function applyFreemiumGate(){
    const gate = qs("#publicationMembershipGate");
    if (!gate) return;
    gate.innerHTML = freemiumGateHtml();
  }

  function openMembershipFromPublishV4940(){
    try {
      if (typeof openMembershipPaymentFromPublish === "function") return openMembershipPaymentFromPublish();
    } catch {}
    try { if (typeof showSection === "function") return showSection("embajadores"); } catch {}
    toast("Abre Embajadores Conecta o Mi acceso para activar membresía.");
  }

  function allowBasicPublication(){
    applyFreemiumGate();
    return true;
  }

  function removeFloatingAssistant(){
    const floating = document.getElementById(LEGACY_QUICK_ID);
    if (floating) floating.remove();
    qsa(".ba-quick-access-v4939, .business-assistant-floating, .publication-assistant-floating").forEach(el => el.remove());
    document.body.classList.add("assistant-integrated-v4940");
  }

  function openHubV4940(){
    removeFloatingAssistant();
    if (typeof window.openPublicationAssistantOwnerPanelV4939 === "function") {
      window.openPublicationAssistantOwnerPanelV4939();
      return;
    }
    if (typeof window.openPublicationAssistantHubV4939 === "function") {
      window.openPublicationAssistantHubV4939();
      return;
    }
    if (typeof window.openBusinessAssistantHubV4939 === "function") {
      window.openBusinessAssistantHubV4939();
      return;
    }
    toast("El asistente de publicaciones aún no está disponible.");
  }

  function integrateBottomNav(){
    const nav = qs(".bottom-nav");
    if (!nav) return false;
    let btn = qsa("button,a", nav).find(el => /asistente|orientaci[oó]n|mensaje|chat/i.test(`${el.textContent || ""} ${el.getAttribute("aria-label") || ""} ${el.getAttribute("onclick") || ""}`));
    if (!btn) btn = qsa("button,a", nav).find(el => /mensajes/.test(String(el.getAttribute("onclick") || "")));
    if (!btn) return false;
    btn.classList.add("assistant-nav-action-v4940");
    btn.setAttribute("type", "button");
    btn.setAttribute("aria-label", "Asistente de publicaciones");
    btn.removeAttribute("onclick");
    btn.innerHTML = `<span class="assistant-nav-icon-v4940">🤖</span><span>Asistente</span>`;
    btn.onclick = event => { event.preventDefault(); openHubV4940(); };
    return true;
  }

  function decoratePublishEntry(){
    qsa(".publish-nav-action").forEach(btn => {
      btn.setAttribute("aria-label", "Publicar básico gratis");
      btn.title = "Publicar básico gratis";
      btn.classList.add("free-publish-v4940");
    });
  }

  function injectAssistantIntoMyPublications(){
    const section = qs("#misPublicaciones");
    if (!section || qs("#assistantIntegratedPanelV4940", section)) return;
    const panel = document.createElement("section");
    panel.id = "assistantIntegratedPanelV4940";
    panel.className = "assistant-integrated-panel-v4940";
    panel.innerHTML = `<div>
      <span>🤖 Asistente de publicaciones</span>
      <h3>Solicitudes recibidas por mis publicaciones</h3>
      <p>Administra pedidos, citas, cotizaciones, mensajes, viajes, envíos y ayuda desde un solo lugar.</p>
    </div>
    <div class="assistant-integrated-actions-v4940">
      <button type="button" class="btn-small btn-purple" onclick="openPublicationAssistantHubV4940()">Abrir asistente</button>
      <button type="button" class="btn-small btn-ghost" onclick="openPublicationAssistantConfigV4940()">Configurar publicación</button>
    </div>`;
    section.insertBefore(panel, section.firstElementChild?.nextSibling || null);
  }

  function wrapShowSection(){
    try {
      if (typeof showSection !== "function" || window.__showSectionBaseV4940) return;
      window.__showSectionBaseV4940 = showSection;
      showSection = function(section, push = true){
        if (section === "asistente") {
          const result = window.__showSectionBaseV4940("misPublicaciones", push);
          setTimeout(openHubV4940, 60);
          return result;
        }
        const result = window.__showSectionBaseV4940(section, push);
        setTimeout(() => { removeFloatingAssistant(); integrateBottomNav(); decoratePublishEntry(); if (section === "misPublicaciones") injectAssistantIntoMyPublications(); if (section === "registro") applyFreemiumGate(); }, 90);
        return result;
      };
    } catch (error) { console.warn("No se pudo integrar navegación del asistente v4.9.40", error); }
  }

  function wrapRenderPublicationPreview(){
    try {
      if (typeof renderPublicationPreview !== "function" || window.__renderPublicationPreviewBaseV4940) return;
      window.__renderPublicationPreviewBaseV4940 = renderPublicationPreview;
      renderPublicationPreview = function(){
        const result = window.__renderPublicationPreviewBaseV4940.apply(this, arguments);
        setTimeout(applyFreemiumGate, 0);
        return result;
      };
    } catch (error) { console.warn("No se pudo reforzar vista previa freemium v4.9.40", error); }
  }

  function overridePublishGate(){
    try {
      window.renderPublicationMembershipGate = applyFreemiumGate;
      renderPublicationMembershipGate = applyFreemiumGate;
    } catch {}
    try {
      window.ensurePublishMembershipBeforeSubmit = allowBasicPublication;
      ensurePublishMembershipBeforeSubmit = allowBasicPublication;
    } catch {}
  }

  function refresh(){
    removeFloatingAssistant();
    integrateBottomNav();
    decoratePublishEntry();
    injectAssistantIntoMyPublications();
    if (document.getElementById("publicationMembershipGate")) applyFreemiumGate();
    document.body.dataset.version = VERSION;
    document.body.dataset.publicationAssistantVersion = VERSION;
    try { localStorage.setItem(ASSISTANT_FLAG, VERSION); } catch {}
  }

  function init(){
    overridePublishGate();
    wrapRenderPublicationPreview();
    wrapShowSection();
    refresh();
    setTimeout(refresh, 250);
    setTimeout(refresh, 900);
    let tries = 0;
    const timer = setInterval(() => { refresh(); if (++tries > 10) clearInterval(timer); }, 1200);
  }

  window.openPublicationAssistantHubV4940 = openHubV4940;
  window.openAssistantFromPublishV4940 = openAssistantFromWizardV4940;
  window.openPublicationAssistantConfigV4940 = function(type){
    if (type && typeof window.openPublicationAssistantConfigV4939 === "function") return window.openPublicationAssistantConfigV4939(type);
    return openAssistantFromWizardV4940();
  };
  window.openMembershipPaymentFromPublishV4940 = openMembershipFromPublishV4940;
  window.renderPublicationFreemiumGateV4940 = applyFreemiumGate;
  window.removeFloatingPublicationAssistantV4940 = removeFloatingAssistant;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.addEventListener("pageshow", () => setTimeout(refresh, 160));
})();
