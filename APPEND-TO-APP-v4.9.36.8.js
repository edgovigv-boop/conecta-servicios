
// ------------------------------------------------------------------
// v4.9.36.8 — Chat negocio con membresía obligatoria + Admin libre
// Objetivo:
// 1) Si un usuario crea un Chat negocio, al finalizar debe ver la invitación
//    a pagar/activar membresía anual antes de publicar el chat.
// 2) El chat no queda suelto: queda como borrador hasta que la membresía esté activa.
// 3) Admin puede probar/supervisar todo libre e ilimitado sin bloquearse por membresía.
// ------------------------------------------------------------------
const BUSINESS_CHAT_MEMBERSHIP_VERSION_V49368 = "4.9.36.8-chat-negocio-membresia-admin";
const BUSINESS_CHAT_PENDING_DRAFT_KEY_V49368 = "conecta_chat_negocio_borrador_pendiente_v49368";

function safeTextV49368(value = "") {
  if (typeof safeTextV49367 === "function") return safeTextV49367(value);
  if (typeof escapeHtml === "function") return escapeHtml(value);
  return String(value || "").replace(/[&<>\"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[m]));
}

function cleanPhoneV49368(value = "") {
  if (typeof cleanPhoneV49367 === "function") return cleanPhoneV49367(value);
  if (typeof cleanPhone === "function") return cleanPhone(value);
  return String(value || "").replace(/\D/g, "");
}

function isAdminSupervisorActiveV49368() {
  try {
    if (typeof adminUnlocked !== "undefined" && adminUnlocked) return true;
    if (typeof adminRouteEnabled !== "undefined" && adminRouteEnabled) return true;
    if (typeof adminAccessAvailableV4936 === "function" && adminAccessAvailableV4936()) return true;
    if (typeof hasStoredAdminAccessV4936 === "function" && hasStoredAdminAccessV4936()) return true;
    return localStorage.getItem("conecta_admin_access_v4936") === "1";
  } catch {
    return false;
  }
}

function userCanPublishBusinessChatV49368() {
  if (isAdminSupervisorActiveV49368()) return true;
  if (typeof userMembershipIsActiveV4936 === "function" && userMembershipIsActiveV4936()) return true;
  if (typeof hasActivePublishMembership === "function" && hasActivePublishMembership()) return true;
  return false;
}

function normalizeBusinessChatDraftV49368(values = {}) {
  const source = typeof businessChatCurrentSourceSafeV49367 === "function"
    ? businessChatCurrentSourceSafeV49367(values)
    : {};
  return {
    values: { ...(values || {}) },
    type: values.type || "Servicio profesional",
    name: values.name || source.sourceTitle || "Negocio o servicio",
    goal: values.goal || "Filtrar solicitudes de clientes",
    zone: values.zone || source.sourceZone || "",
    message: values.message || "Hola, cuéntame qué necesitas y revisamos si puedo ayudarte.",
    phone: cleanPhoneV49368(values.phone || values.contact || ""),
    sourceId: source.sourceId || values.sourceId || "",
    sourceTitle: source.sourceTitle || values.sourceTitle || "Nuevo negocio / servicio",
    sourceCategory: source.sourceCategory || values.sourceCategory || "Negocios locales",
    sourceZone: source.sourceZone || values.zone || "",
    sourceOrigin: source.sourceOrigin || "Chat de negocio",
    createdAt: new Date().toISOString(),
    status: "pendiente_membresia"
  };
}

function savePendingBusinessChatDraftV49368(values = {}) {
  const draft = normalizeBusinessChatDraftV49368(values);
  try { localStorage.setItem(BUSINESS_CHAT_PENDING_DRAFT_KEY_V49368, JSON.stringify(draft)); } catch {}
  return draft;
}

function getPendingBusinessChatDraftV49368() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BUSINESS_CHAT_PENDING_DRAFT_KEY_V49368) || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function clearPendingBusinessChatDraftV49368() {
  try { localStorage.removeItem(BUSINESS_CHAT_PENDING_DRAFT_KEY_V49368); } catch {}
}

function businessChatDraftSummaryV49368(draft = {}) {
  const rows = [
    ["Negocio", draft.name],
    ["Categoría", draft.type],
    ["Objetivo", draft.goal],
    ["Zona", draft.zone || draft.sourceZone],
    ["WhatsApp", draft.phone],
    ["Descripción", draft.message]
  ].filter(([, value]) => String(value || "").trim());
  return rows.map(([label, value]) => `<li><strong>${safeTextV49368(label)}:</strong> ${safeTextV49368(value)}</li>`).join("");
}

function renderBusinessChatMembershipRequiredV49368(draft = {}) {
  const root = document.getElementById("surveyFlowContent");
  if (!root) return;
  const profile = typeof getUserAccessProfileV4936 === "function" ? getUserAccessProfileV4936() : {};
  root.innerHTML = `
    <div class="business-chat-membership-gate-v49368">
      <div class="business-chat-membership-gate-v49368__icon">🔐</div>
      <span>Chat negocio listo</span>
      <h2>Activa la membresía para publicar este chat</h2>
      <p>Tu chat de negocio ya quedó preparado como borrador, pero para que aparezca como publicación y los clientes puedan responder el filtro se requiere la membresía anual Conecta.</p>
      <div class="business-chat-membership-gate-v49368__price">
        <strong>$${typeof MEMBERSHIP_PRICE_V4936 !== "undefined" ? MEMBERSHIP_PRICE_V4936 : 98} MXN / año</strong>
        <small>Publicaciones ilimitadas durante el periodo activo.</small>
      </div>
      <div class="business-chat-membership-gate-v49368__summary">
        <strong>Resumen del chat pendiente</strong>
        <ul>${businessChatDraftSummaryV49368(draft)}</ul>
      </div>
      <div class="business-chat-membership-gate-v49368__actions">
        <button type="button" onclick="openBusinessChatMembershipPaymentV49368()">Pagar / activar membresía</button>
        <button type="button" class="ghost" onclick="publishPendingBusinessChatV49368()">Ya tengo membresía, publicar chat</button>
        <button type="button" class="ghost" onclick="showSection('misPublicaciones')">Ir a Mis publicaciones</button>
      </div>
      <p class="business-chat-membership-gate-v49368__note">Estado actual: <strong>${typeof membershipLabelV4936 === "function" ? safeTextV49368(membershipLabelV4936(profile)) : "Sin membresía activa"}</strong>. Admin puede probar este flujo sin pagar ni activar membresía.</p>
    </div>
  `;
  try { trackEvent?.("chat_negocio_membresia_requerida", null, { name: draft.name, goal: draft.goal }); } catch {}
}

function openBusinessChatMembershipPaymentV49368() {
  const draft = getPendingBusinessChatDraftV49368() || {};
  try {
    if (typeof saveUserAccessProfileV4936 === "function") {
      saveUserAccessProfileV4936({
        name: draft.name || getUserAccessProfileV4936?.().name || "",
        phone: draft.phone || getUserAccessProfileV4936?.().phone || "",
        municipality: draft.zone || draft.sourceZone || getUserAccessProfileV4936?.().municipality || "",
        membershipStatus: "pendiente",
        requestedAt: new Date().toISOString(),
        notes: `Chat negocio pendiente: ${draft.goal || draft.type || "Servicio"}`
      });
    }
    if (typeof saveUserAccessHistoryV4936 === "function") {
      saveUserAccessHistoryV4936({ action: "Chat negocio pendiente", note: `${draft.name || "Negocio"} · requiere membresía` });
    }
  } catch {}
  if (typeof showSection === "function") showSection("miAcceso");
  setTimeout(() => {
    try { renderPendingBusinessChatNoticeV49368(); } catch {}
    document.getElementById("pendingBusinessChatNoticeV49368")?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof openMembershipPaymentFromAccessV4936 === "function") openMembershipPaymentFromAccessV4936();
  }, 180);
}

function publishPendingBusinessChatV49368() {
  const draft = getPendingBusinessChatDraftV49368();
  if (!draft) {
    showToast?.("No encontré un chat pendiente");
    return;
  }
  if (!userCanPublishBusinessChatV49368()) {
    renderBusinessChatMembershipRequiredV49368(draft);
    showToast?.("Primero activa la membresía anual para publicar el chat");
    return;
  }
  const values = { ...(draft.values || {}), ...draft, contact: draft.phone, phone: draft.phone };
  const record = typeof saveBusinessChatLeadV49367 === "function" ? saveBusinessChatLeadV49367(values) : null;
  clearPendingBusinessChatDraftV49368();
  if (record && typeof renderBusinessChatSuccessV49367 === "function") renderBusinessChatSuccessV49367(record);
  else showSection?.("misPublicaciones");
  try { renderBusinessPublicationsPanelV49367?.("owner"); renderBusinessPublicationsPanelV49367?.("public"); } catch {}
  showToast?.(isAdminSupervisorActiveV49368() ? "Chat publicado en modo Admin" : "Chat publicado con membresía activa");
}

function renderPendingBusinessChatNoticeV49368() {
  const draft = getPendingBusinessChatDraftV49368();
  const root = document.getElementById("memberAccessRoot");
  if (!root) return;
  let panel = document.getElementById("pendingBusinessChatNoticeV49368");
  if (!draft) {
    panel?.remove();
    return;
  }
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "pendingBusinessChatNoticeV49368";
    panel.className = "pending-business-chat-notice-v49368";
    root.prepend(panel);
  }
  const canPublish = userCanPublishBusinessChatV49368();
  panel.innerHTML = `
    <span>💬 Chat negocio pendiente</span>
    <h3>${safeTextV49368(draft.name || "Negocio o servicio")}</h3>
    <p>Este chat ya está preparado como borrador. ${canPublish ? "Puedes publicarlo ahora." : "Para publicarlo y recibir solicitudes filtradas se requiere membresía activa."}</p>
    <ul>${businessChatDraftSummaryV49368(draft)}</ul>
    <div class="pending-business-chat-notice-v49368__actions">
      <button type="button" onclick="publishPendingBusinessChatV49368()">${canPublish ? "Publicar chat" : "Revisar / publicar"}</button>
      ${canPublish ? "" : `<button type="button" class="ghost" onclick="openBusinessChatMembershipPaymentV49368()">Pagar / activar</button>`}
      <button type="button" class="ghost" onclick="clearPendingBusinessChatDraftV49368(); renderPendingBusinessChatNoticeV49368(); showToast?.('Borrador de chat descartado')">Descartar</button>
    </div>
  `;
}

try {
  const hasActivePublishMembershipBaseV49368 = hasActivePublishMembership;
  hasActivePublishMembership = function() {
    if (isAdminSupervisorActiveV49368()) return true;
    return typeof hasActivePublishMembershipBaseV49368 === "function" ? hasActivePublishMembershipBaseV49368() : false;
  };
} catch (error) {
  console.warn("No se pudo liberar membresía para Admin v4.9.36.8", error);
}

try {
  const ensurePublishMembershipBeforeSubmitBaseV49368 = ensurePublishMembershipBeforeSubmit;
  ensurePublishMembershipBeforeSubmit = function() {
    if (isAdminSupervisorActiveV49368()) return true;
    return typeof ensurePublishMembershipBeforeSubmitBaseV49368 === "function" ? ensurePublishMembershipBeforeSubmitBaseV49368() : userCanPublishBusinessChatV49368();
  };
} catch (error) {
  console.warn("No se pudo reforzar permiso de publicación Admin v4.9.36.8", error);
}

try {
  const renderPublicationMembershipGateBaseV49368 = renderPublicationMembershipGate;
  renderPublicationMembershipGate = function() {
    const gate = document.getElementById("publicationMembershipGate");
    if (gate && isAdminSupervisorActiveV49368()) {
      gate.innerHTML = `<div class="membership-gate-ok admin-free-v49368"><strong>✅ Modo Admin libre</strong><p>Publicación ilimitada habilitada para supervisar y probar la funcionalidad.</p></div>`;
      return;
    }
    return typeof renderPublicationMembershipGateBaseV49368 === "function" ? renderPublicationMembershipGateBaseV49368() : undefined;
  };
} catch (error) {
  console.warn("No se pudo ajustar gate de publicación Admin v4.9.36.8", error);
}

try {
  const surveyFinishBaseV49368 = surveyFinish;
  surveyFinish = function() {
    if (typeof surveyState !== "undefined" && surveyState && surveyState.flow === "chatNegocio") {
      if (!userCanPublishBusinessChatV49368()) {
        const values = { ...(surveyState.values || {}) };
        const draft = savePendingBusinessChatDraftV49368(values);
        renderBusinessChatMembershipRequiredV49368(draft);
        showToast?.("Chat listo. Activa membresía para publicarlo.");
        return;
      }
      return surveyFinishBaseV49368();
    }
    return surveyFinishBaseV49368();
  };
} catch (error) {
  console.warn("No se pudo agregar gate al Chat negocio v4.9.36.8", error);
}

try {
  const renderMemberAccessBaseV49368 = renderMemberAccessV4936;
  renderMemberAccessV4936 = function() {
    const result = renderMemberAccessBaseV49368();
    renderPendingBusinessChatNoticeV49368();
    return result;
  };
} catch (error) {
  console.warn("No se pudo enganchar aviso de chat pendiente en Mi acceso", error);
}

try {
  const showSectionBaseV49368 = showSection;
  showSection = function(id, push = true) {
    const result = showSectionBaseV49368(id, push);
    const section = typeof sectionAliasV4936 === "function" ? sectionAliasV4936(id) : id;
    if (section === "miAcceso") setTimeout(renderPendingBusinessChatNoticeV49368, 120);
    if (section === "registro") setTimeout(() => renderPublicationMembershipGate?.(), 120);
    return result;
  };
} catch (error) {
  console.warn("No se pudo reforzar navegación v4.9.36.8", error);
}

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(renderPendingBusinessChatNoticeV49368, 350);
  setTimeout(() => renderPublicationMembershipGate?.(), 380);
  document.body.dataset.chatMembershipVersion = BUSINESS_CHAT_MEMBERSHIP_VERSION_V49368;
});
window.addEventListener("pageshow", () => {
  setTimeout(renderPendingBusinessChatNoticeV49368, 180);
  setTimeout(() => renderPublicationMembershipGate?.(), 220);
});

try {
  window.publishPendingBusinessChatV49368 = publishPendingBusinessChatV49368;
  window.openBusinessChatMembershipPaymentV49368 = openBusinessChatMembershipPaymentV49368;
  window.renderPendingBusinessChatNoticeV49368 = renderPendingBusinessChatNoticeV49368;
  window.clearPendingBusinessChatDraftV49368 = clearPendingBusinessChatDraftV49368;
  window.isAdminSupervisorActiveV49368 = isAdminSupervisorActiveV49368;
} catch {}
