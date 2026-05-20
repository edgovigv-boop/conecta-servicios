
// ------------------------------------------------------------------
// v4.9.42 — Publicación unificada freemium
// - Migra el + Publicar y las plantillas al mismo flujo de publicación.
// - Permite 1 publicación básica gratis por mes en modo piloto/local.
// - WhatsApp/contacto es opcional; la comunicación valiosa vive en la app.
// - El asistente avanzado queda como beneficio de membresía o admin.
// ------------------------------------------------------------------
(function unifiedFreemiumPublishV4942(){
  const VERSION = "v4.9.42-publicacion-unificada-freemium";
  const FLAG_KEY = "conecta_publicacion_unificada_v4942";
  const FREE_LOG_KEY = "conecta_free_basic_publications_log_v4942";
  const FREE_LIMIT = 1;

  function qs(sel, root = document){ return root.querySelector(sel); }
  function qsa(sel, root = document){ return Array.from(root.querySelectorAll(sel)); }
  function esc(value = ""){
    if (typeof escapeHtml === "function") return escapeHtml(value);
    return String(value ?? "").replace(/[&<>\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
  }
  function toast(message){ if (typeof showToast === "function") showToast(message); else console.log(message); }
  function clean(value){ return typeof cleanPhone === "function" ? cleanPhone(value) : String(value || "").replace(/\D/g, ""); }
  function monthKey(date = new Date()){
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  function getLog(){
    try { return JSON.parse(localStorage.getItem(FREE_LOG_KEY) || "{}"); } catch { return {}; }
  }
  function setLog(log){
    try { localStorage.setItem(FREE_LOG_KEY, JSON.stringify(log)); } catch {}
  }
  function usedThisMonth(){
    const log = getLog();
    const current = log[monthKey()] || [];
    return Array.isArray(current) ? current.length : Number(current || 0);
  }
  function hasFreeSlot(){ return usedThisMonth() < FREE_LIMIT; }
  function recordFreePublication(payload = {}){
    if (hasMembership() || isAdmin()) return;
    const log = getLog();
    const key = monthKey();
    const current = Array.isArray(log[key]) ? log[key] : [];
    current.push({
      id: payload.id || payload.local_id || `FREE-${Date.now()}`,
      title: payload.titulo || payload.title || "Publicación básica",
      created_at: new Date().toISOString(),
      source: VERSION
    });
    log[key] = current.slice(-10);
    setLog(log);
  }
  function isAdmin(){
    try { if (typeof isAdminSupervisorActiveV49368 === "function" && isAdminSupervisorActiveV49368()) return true; } catch {}
    try { if (typeof adminAccessAvailableV4936 === "function" && adminAccessAvailableV4936()) return true; } catch {}
    try { if (typeof adminUnlocked !== "undefined" && adminUnlocked) return true; } catch {}
    try { return localStorage.getItem("conecta_admin_access_v4936") === "1" || localStorage.getItem("conecta_admin_access") === "1"; } catch { return false; }
  }
  function hasMembership(){
    if (isAdmin()) return true;
    try { if (typeof userMembershipIsActiveV4936 === "function" && userMembershipIsActiveV4936()) return true; } catch {}
    try { if (typeof hasActivePublishMembership === "function" && hasActivePublishMembership()) return true; } catch {}
    try { return localStorage.getItem("conecta_membership_status_v4936") === "active" || localStorage.getItem("conecta_membresia_activa") === "1"; } catch { return false; }
  }
  function openMembership(){
    try { if (typeof openMembershipPaymentFromPublishV4940 === "function") return openMembershipPaymentFromPublishV4940(); } catch {}
    try { if (typeof openMembershipPaymentFromPublish === "function") return openMembershipPaymentFromPublish(); } catch {}
    try { if (typeof showSection === "function") return showSection("embajadoresLanding"); } catch {}
    window.location.href = "/embajadores";
  }
  function phoneOptionalText(){
    const remaining = Math.max(0, FREE_LIMIT - usedThisMonth());
    if (isAdmin()) return "Admin libre: puedes publicar y activar asistentes sin restricciones.";
    if (hasMembership()) return "Membresía activa: puedes publicar y activar asistentes en tus publicaciones.";
    return remaining > 0
      ? `Tienes ${remaining} publicación básica gratis disponible este mes. WhatsApp es opcional; puedes usar comunicación interna si activas asistente.`
      : "Ya usaste tu publicación básica gratis de este mes. Activa membresía para seguir publicando y usar asistentes.";
  }
  function gateHtml(){
    const unlocked = hasMembership();
    const free = hasFreeSlot();
    const blocked = !unlocked && !free;
    return `<div class="unified-publish-gate-v4942 ${blocked ? "is-blocked" : ""}">
      <div class="unified-free-card-v4942">
        <span>🟢</span>
        <div>
          <strong>Publicación básica gratis mensual</strong>
          <p>Incluye título, descripción, categoría, municipio/zona, foto opcional y contacto básico opcional.</p>
          <small>${esc(phoneOptionalText())}</small>
        </div>
      </div>
      <div class="unified-assistant-card-v4942">
        <span>🤖</span>
        <div>
          <strong>Asistente de publicación con membresía</strong>
          <p>Convierte tu publicación en un punto de atención con pedidos, citas, cotizaciones, solicitudes y mensajes internos organizados.</p>
          <small>${unlocked ? "Disponible para activar en tus publicaciones." : "Puedes configurarlo como vista previa; para publicarlo necesitas membresía."}</small>
        </div>
      </div>
      <div class="unified-gate-actions-v4942">
        ${blocked ? `<button type="button" class="btn-small btn-purple" onclick="openMembershipForUnifiedPublishV4942()">Activar membresía</button>` : `<button type="button" class="btn-small btn-purple" onclick="continueBasicPublishV4942()">Continuar publicación básica</button>`}
        <button type="button" class="btn-small btn-ghost" onclick="openAssistantPreviewFromUnifiedPublishV4942()">Vista previa del asistente</button>
      </div>
      <p class="unified-gate-note-v4942">Publica gratis una vez al mes. Activa tu membresía para convertir tus publicaciones en puntos de atención con pedidos, citas, cotizaciones o mensajes filtrados.</p>
    </div>`;
  }
  function renderGate(){
    const gate = qs("#publicationMembershipGate");
    if (!gate) return;
    gate.innerHTML = gateHtml();
  }
  function continueBasic(){
    if (!hasMembership() && !hasFreeSlot()) {
      toast("Ya usaste tu publicación básica gratis de este mes. Activa la membresía para seguir publicando.");
      openMembership();
      return false;
    }
    toast(hasMembership() ? "Puedes publicar y activar asistente." : "Puedes publicar gratis esta publicación básica mensual.");
    return true;
  }
  function openAssistantPreview(){
    try {
      if (typeof openAssistantFromPublishV4940 === "function") return openAssistantFromPublishV4940();
    } catch {}
    try {
      if (typeof openPublicationAssistantConfigV4941 === "function") return openPublicationAssistantConfigV4941();
    } catch {}
    try {
      if (typeof openPublicationAssistantConfigV4939 === "function") return openPublicationAssistantConfigV4939("direct_message");
    } catch {}
    toast("Primero completa tu publicación básica; después podrás configurar el asistente como vista previa o activarlo con membresía.");
  }

  function makePhoneOptional(){
    const phone = qs("#pubPhone");
    if (phone) {
      phone.removeAttribute("required");
      phone.placeholder = "WhatsApp opcional para contacto básico";
      phone.setAttribute("aria-label", "WhatsApp opcional");
    }
    const label = phone?.closest("label");
    if (label && !label.dataset.optionalV4942) {
      label.dataset.optionalV4942 = "1";
      const html = label.innerHTML;
      label.innerHTML = html.replace(/WhatsApp|Tel[eé]fono|Contacto/i, match => `${match} <small class="optional-chip-v4942">opcional</small>`);
    }
    const helpCandidates = ["#phoneHelp", "#pubPhoneHelp", ".phone-help", "[data-phone-help]"];
    helpCandidates.forEach(sel => {
      const el = qs(sel);
      if (el) el.textContent = "Opcional: si lo dejas vacío, la comunicación puede manejarse dentro de la app cuando actives asistente.";
    });
  }

  function validateStep(step){
    if (step !== 6) {
      if (typeof window.__validateWizardStepBaseV4942 === "function") return window.__validateWizardStepBaseV4942(step);
      return true;
    }
    const privacy = qs("#pubPrivacyAccept");
    if (privacy && !privacy.checked) { toast("Acepta privacidad y términos"); return false; }
    const phone = qs("#pubPhone");
    const digits = clean(phone?.value || "");
    if (digits && digits.length < 10) { phone?.focus(); toast("El WhatsApp es opcional, pero si lo agregas debe tener 10 dígitos."); return false; }
    return true;
  }

  function ensureBeforeSubmit(){
    renderGate();
    if (hasMembership() || isAdmin()) return true;
    if (hasFreeSlot()) return true;
    qs("#publicationMembershipGate")?.scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Ya usaste tu publicación básica gratis de este mes. Activa la membresía para publicar más y usar asistentes.");
    return false;
  }

  function decorateFormPayload(payload = {}){
    const decorated = { ...payload };
    decorated.referencia = `${decorated.referencia || ""} · Modelo freemium v4.9.42: publicación básica mensual gratis; asistente avanzado con membresía.`.trim();
    decorated.interaction_type = decorated.interaction_type || "basic_free";
    decorated.asistente_estado = hasMembership() || isAdmin() ? "disponible" : "no_activo_publicacion_basica";
    decorated.modelo_publicacion = hasMembership() || isAdmin() ? "membresia_o_admin" : "basica_gratis_mensual";
    return decorated;
  }

  function wrapFormPayload(){
    try {
      if (typeof formPayload !== "function" || window.__formPayloadBaseV4942) return;
      window.__formPayloadBaseV4942 = formPayload;
      formPayload = function(){ return decorateFormPayload(window.__formPayloadBaseV4942.apply(this, arguments)); };
    } catch (error) { console.warn("No se pudo unificar payload v4.9.42", error); }
  }

  function wrapValidation(){
    try {
      if (typeof validateWizardStep !== "function" || window.__validateWizardStepBaseV4942) return;
      window.__validateWizardStepBaseV4942 = validateWizardStep;
      validateWizardStep = validateStep;
    } catch (error) { console.warn("No se pudo hacer opcional el contacto v4.9.42", error); }
  }

  function wrapMembershipGate(){
    try {
      window.renderPublicationMembershipGate = renderGate;
      renderPublicationMembershipGate = renderGate;
    } catch {}
    try {
      window.ensurePublishMembershipBeforeSubmit = ensureBeforeSubmit;
      ensurePublishMembershipBeforeSubmit = ensureBeforeSubmit;
    } catch {}
  }

  function wrapInsertPublication(){
    try {
      if (typeof insertPublicationWithMediaFallbackV4931 !== "function" || window.__insertPublicationBaseV4942) return;
      window.__insertPublicationBaseV4942 = insertPublicationWithMediaFallbackV4931;
      insertPublicationWithMediaFallbackV4931 = async function(payload){
        const result = await window.__insertPublicationBaseV4942.apply(this, arguments);
        try { if (!hasMembership() && !isAdmin()) recordFreePublication(payload); } catch {}
        try { setTimeout(() => { renderGate(); refreshUnifiedPublishUI(); }, 120); } catch {}
        return result;
      };
    } catch (error) { console.warn("No se pudo registrar publicación gratuita v4.9.42", error); }
  }

  function wrapSubmitPublication(){
    try {
      if (typeof submitPublication !== "function" || window.__submitPublicationBaseV4942) return;
      window.__submitPublicationBaseV4942 = submitPublication;
      submitPublication = async function(event){
        const before = usedThisMonth();
        const result = await window.__submitPublicationBaseV4942.apply(this, arguments);
        const after = usedThisMonth();
        if (!hasMembership() && !isAdmin() && after > before) {
          setTimeout(() => toast("Publicación básica gratis mensual guardada. Activa membresía para publicar más y usar asistente avanzado."), 450);
        }
        return result;
      };
      const form = qs("#publicationForm");
      if (form && !form.dataset.submitUnifiedV4942) {
        form.dataset.submitUnifiedV4942 = "1";
        form.removeEventListener?.("submit", window.__submitPublicationBaseV4942);
        form.addEventListener("submit", submitPublication);
      }
    } catch (error) { console.warn("No se pudo reforzar submit v4.9.42", error); }
  }

  function startUnifiedPublish(template = null){
    try { if (typeof startWizard === "function") startWizard(); }
    catch { try { if (typeof showSection === "function") showSection("registro"); } catch {} }
    setTimeout(() => {
      try {
        if (template && typeof applyHomeFeedTemplateToWizard === "function") applyHomeFeedTemplateToWizard(template);
      } catch {}
      makePhoneOptional();
      renderGate();
      decoratePublishCopy();
    }, 80);
  }

  function wrapStartWizard(){
    try {
      if (typeof startWizard !== "function" || window.__startWizardBaseV4942) return;
      window.__startWizardBaseV4942 = startWizard;
      startWizard = function(){
        const result = window.__startWizardBaseV4942.apply(this, arguments);
        setTimeout(() => { makePhoneOptional(); renderGate(); decoratePublishCopy(); }, 80);
        return result;
      };
    } catch (error) { console.warn("No se pudo unificar startWizard v4.9.42", error); }
  }

  function wrapOpportunityWizard(){
    try {
      if (typeof openOpportunityWizard !== "function" || window.__openOpportunityWizardBaseV4942) return;
      window.__openOpportunityWizardBaseV4942 = openOpportunityWizard;
      openOpportunityWizard = function(type, template = null){
        const result = window.__openOpportunityWizardBaseV4942.apply(this, arguments);
        setTimeout(() => { makePhoneOptional(); renderGate(); decoratePublishCopy(); }, 120);
        return result;
      };
    } catch (error) { console.warn("No se pudo unificar plantillas v4.9.42", error); }
  }

  function decoratePublishCopy(){
    const section = qs("#registro");
    if (!section) return;
    const title = qs("h1,h2,.section-title,.wizard-title", section);
    if (title && /crear oportunidad|publica|publicar/i.test(title.textContent || "")) title.textContent = "Crear publicación básica gratis";
    const stepTitle = qs("#wizardStepTitle");
    if (stepTitle && stepTitle.textContent === "Contacto") stepTitle.textContent = "Contacto opcional";
    qsa("button", section).forEach(btn => {
      if (/pagar membres[ií]a|membres[ií]a para publicar/i.test(btn.textContent || "")) btn.textContent = "Activar membresía para asistente";
    });
  }

  function decorateTemplateButtons(){
    qsa("button,a").forEach(el => {
      const text = (el.textContent || "").trim();
      const onclick = String(el.getAttribute("onclick") || "");
      if (/usar esta plantilla|usar plantilla|publicar parecido|detalle/i.test(text) || /publishSimilarToReal|openOpportunityWizard/i.test(onclick)) {
        el.classList.add("unified-template-cta-v4942");
        if (/usar esta plantilla|usar plantilla/i.test(text)) el.innerHTML = el.innerHTML.replace(/Usar esta plantilla|Usar plantilla/i, "Publicar gratis con esta plantilla");
        el.title = "Crea una publicación básica gratis; el asistente avanzado se activa con membresía.";
      }
      if (/chat negocio|abrir chat de negocios|responder filtro/i.test(text)) {
        el.classList.add("legacy-chat-hidden-v4942");
        el.style.display = "none";
      }
    });
  }

  function decoratePublicationCards(){
    qsa(".publication-card,.compact-publication-card,.my-publication-card,.card").forEach(card => {
      if (qs(".unified-publication-note-v4942", card)) return;
      const text = (card.textContent || "").toLowerCase();
      if (!/publicaci|servicio|negocio|viaje|env[ií]o|ayuda|pedido|cita/.test(text)) return;
      const note = document.createElement("div");
      note.className = "unified-publication-note-v4942";
      note.textContent = "Comunicación interna disponible al activar asistente de publicación.";
      // Solo agregar en tarjetas propias o de configuración, no saturar explorar.
      if (card.closest("#misPublicaciones")) card.appendChild(note);
    });
  }

  function cleanLegacyPublishModel(){
    qsa(".membership-gate-info strong, .membership-gate-info p").forEach(el => {
      if (/para publicar.*membres/i.test(el.textContent || "")) {
        el.textContent = "Publicación básica gratis mensual. La membresía activa el asistente avanzado.";
      }
    });
    qsa(".business-chat-leads-panel-v49366,.business-chat-publications-panel-v49367,[data-chat-negocio-legacy]").forEach(el => { try { el.remove(); } catch { el.style.display = "none"; } });
  }

  function wrapShowSection(){
    try {
      if (typeof showSection !== "function" || window.__showSectionBaseV4942) return;
      window.__showSectionBaseV4942 = showSection;
      showSection = function(section, push = true){
        const result = window.__showSectionBaseV4942.apply(this, arguments);
        setTimeout(() => {
          if (String(section).toLowerCase() === "registro") { makePhoneOptional(); renderGate(); decoratePublishCopy(); }
          decorateTemplateButtons();
          cleanLegacyPublishModel();
          decoratePublicationCards();
          refreshUnifiedPublishUI();
        }, 120);
        return result;
      };
    } catch (error) { console.warn("No se pudo envolver navegación v4.9.42", error); }
  }

  function refreshUnifiedPublishUI(){
    makePhoneOptional();
    decorateTemplateButtons();
    cleanLegacyPublishModel();
    if (qs("#publicationMembershipGate")) renderGate();
    document.body.classList.add("unified-publish-freemium-v4942");
    document.body.dataset.version = VERSION;
    document.body.dataset.publishModelVersion = VERSION;
    try { localStorage.setItem(FLAG_KEY, VERSION); } catch {}
  }

  window.openMembershipForUnifiedPublishV4942 = openMembership;
  window.continueBasicPublishV4942 = continueBasic;
  window.openAssistantPreviewFromUnifiedPublishV4942 = openAssistantPreview;
  window.startUnifiedPublishV4942 = startUnifiedPublish;
  window.refreshUnifiedPublishV4942 = refreshUnifiedPublishUI;

  function init(){
    wrapValidation();
    wrapFormPayload();
    wrapMembershipGate();
    wrapInsertPublication();
    wrapSubmitPublication();
    wrapStartWizard();
    wrapOpportunityWizard();
    wrapShowSection();
    refreshUnifiedPublishUI();
    setTimeout(refreshUnifiedPublishUI, 300);
    setTimeout(refreshUnifiedPublishUI, 1200);
    let tries = 0;
    const timer = setInterval(() => { refreshUnifiedPublishUI(); if (++tries > 12) clearInterval(timer); }, 900);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.addEventListener("pageshow", () => setTimeout(refreshUnifiedPublishUI, 140));
})();
