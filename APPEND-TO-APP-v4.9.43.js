// ------------------------------------------------------------------
// v4.9.43 — Publicar unificado real
// - El botón + y las plantillas dejan de depender del flujo viejo "Crear oportunidad".
// - Publicación básica gratis mensual sin WhatsApp obligatorio.
// - Asistente de publicación configurable como vista previa/borrador sin membresía.
// - Asistente activo con membresía o admin.
// - Fallback local claro cuando Supabase no responde.
// ------------------------------------------------------------------
(function publicarUnificadoRealV4943(){
  const VERSION = "v4.9.43-publicar-unificado-real";
  const FREE_LOG_KEY = "conecta_free_basic_publications_log_v4942";
  const LOCAL_PUBLICATIONS_KEY = "conecta_publicaciones_basicas_locales_v4943";
  const ASSISTANT_CONFIG_KEY = "conecta_publication_assistant_configs_v4939";
  const FREE_LIMIT = 1;
  const ASSISTANT_OPTIONS = {
    none: { label: "No, solo publicar gratis", action: "Publicación básica", icon: "🟢" },
    direct_message: { label: "Mensaje filtrado", action: "Mensaje al publicante", icon: "💬" },
    menu_order: { label: "Pedido con menú", action: "Hacer pedido", icon: "🛒" },
    appointment: { label: "Cita", action: "Agendar cita", icon: "📅" },
    quote_request: { label: "Cotización", action: "Solicitar cotización", icon: "🧾" },
    service_request: { label: "Solicitud de servicio", action: "Solicitar servicio", icon: "🛠️" },
    ride_request: { label: "Viaje compartido", action: "Solicitar lugar", icon: "🚗" },
    delivery_request: { label: "Envío o mensajería", action: "Cotizar envío", icon: "📦" },
    help_response: { label: "Ofrecer ayuda / responder necesidad", action: "Ofrecer ayuda", icon: "🤝" }
  };
  const REMOTE_ALLOWED_FIELDS = [
    "nombre_publico", "titulo", "descripcion", "categoria_principal", "subcategoria", "intencion",
    "estado_nombre", "municipio", "localidad", "telefono", "ruta", "salida", "hora", "medio",
    "presupuesto", "latitud", "longitud", "ubicacion_aproximada", "radio_servicio_km", "estado", "referencia",
    "image_url", "media_type", "media_path", "media_created_at"
  ];
  const DEMO_MENU = [
    { id: "ITEM-POLLO", name: "Pollo asado con ensalada, salsas y tortillas", price: 235, active: true },
    { id: "ITEM-QUESADILLAS", name: "Quesadillas", price: 50, active: true },
    { id: "ITEM-REFRESCOS", name: "Refrescos", price: 35, active: true },
    { id: "ITEM-PAPAS", name: "Papas fritas", price: 40, active: true }
  ];

  function qs(sel, root = document){ return root.querySelector(sel); }
  function qsa(sel, root = document){ return Array.from(root.querySelectorAll(sel)); }
  function cleanPhoneLocal(value = ""){
    try { if (typeof cleanPhone === "function") return cleanPhone(value); } catch {}
    return String(value || "").replace(/\D/g, "");
  }
  function esc(value = ""){
    try { if (typeof escapeHtml === "function") return escapeHtml(value); } catch {}
    return String(value ?? "").replace(/[&<>\"]/g, ch => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;"}[ch]));
  }
  function toast(message){
    try { if (typeof showToast === "function") return showToast(message); } catch {}
    console.log(message);
  }
  function now(){ return new Date().toISOString(); }
  function monthKey(date = new Date()){ return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
  function read(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback;
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch { return fallback; }
  }
  function write(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function id(prefix = "PUB"){ return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(16).slice(2, 7).toUpperCase()}`; }

  function isAdmin(){
    try { if (typeof isAdminSupervisorActiveV49368 === "function" && isAdminSupervisorActiveV49368()) return true; } catch {}
    try { if (typeof adminAccessAvailableV4936 === "function" && adminAccessAvailableV4936()) return true; } catch {}
    try { if (typeof adminUnlocked !== "undefined" && adminUnlocked) return true; } catch {}
    try { if (typeof adminRouteEnabled !== "undefined" && adminRouteEnabled) return true; } catch {}
    try { return localStorage.getItem("conecta_admin_access_v4936") === "1" || localStorage.getItem("conecta_admin_access") === "1"; } catch { return false; }
  }
  function hasMembership(){
    if (isAdmin()) return true;
    try { if (typeof userMembershipIsActiveV4936 === "function" && userMembershipIsActiveV4936()) return true; } catch {}
    try { if (typeof hasActivePublishMembership === "function" && hasActivePublishMembership()) return true; } catch {}
    try { return localStorage.getItem("conecta_membership_status_v4936") === "active" || localStorage.getItem("conecta_membresia_activa") === "1"; } catch { return false; }
  }
  function freeLog(){ return read(FREE_LOG_KEY, {}); }
  function usedThisMonth(){
    const current = freeLog()[monthKey()] || [];
    return Array.isArray(current) ? current.length : Number(current || 0) || 0;
  }
  function hasFreeSlot(){ return usedThisMonth() < FREE_LIMIT; }
  function recordFreePublication(payload = {}){
    if (hasMembership() || isAdmin()) return;
    const log = freeLog();
    const key = monthKey();
    const current = Array.isArray(log[key]) ? log[key] : [];
    if (current.some(row => row.id === (payload.id || payload.local_id))) return;
    current.push({
      id: payload.id || payload.local_id || id("FREE"),
      title: payload.titulo || payload.title || "Publicación básica",
      created_at: now(),
      version: VERSION
    });
    log[key] = current.slice(-20);
    write(FREE_LOG_KEY, log);
  }

  function getLocalPublications(){ return read(LOCAL_PUBLICATIONS_KEY, []); }
  function saveLocalPublication(payload = {}, status = "borrador_local", reason = ""){
    const rows = getLocalPublications();
    const localId = payload.id || payload.local_id || id("LOCAL-PUB");
    const row = {
      ...payload,
      id: localId,
      local_id: localId,
      titulo: payload.titulo || payload.title || "Publicación básica",
      descripcion: payload.descripcion || payload.description || "",
      categoria_principal: payload.categoria_principal || payload.category || "General",
      estado_nombre: payload.estado_nombre || payload.state || "México",
      municipio: payload.municipio || payload.municipality || "",
      telefono: cleanPhoneLocal(payload.telefono || payload.phone || ""),
      estado: status,
      sync_status: status,
      sync_reason: reason,
      created_at: payload.created_at || now(),
      updated_at: now(),
      source_version: VERSION
    };
    write(LOCAL_PUBLICATIONS_KEY, [row, ...rows.filter(item => item.id !== localId)].slice(0, 80));
    try {
      const mapped = typeof mapPublication === "function" ? mapPublication(row) : {
        id: row.id,
        title: row.titulo,
        description: row.descripcion,
        category: row.categoria_principal,
        state: row.estado_nombre,
        municipality: row.municipio,
        phone: row.telefono,
        name: row.nombre_publico || "Publicación local",
        status: row.estado
      };
      if (typeof publicationsCache !== "undefined" && Array.isArray(publicationsCache)) {
        publicationsCache = [mapped, ...publicationsCache.filter(item => item.id !== mapped.id)];
      }
    } catch {}
    return row;
  }

  function assistantChoice(){ return qs("#publicationAssistantChoiceV4943")?.value || "none"; }
  function assistantChoiceHtml(){
    const unlocked = hasMembership();
    const freeLeft = Math.max(0, FREE_LIMIT - usedThisMonth());
    return `<div id="publicationAssistantGateV4943" class="publication-assistant-gate-v4943">
      <div class="pa-free-v4943">
        <span>🟢</span>
        <div>
          <strong>Tu publicación básica es gratis</strong>
          <p>Incluye título, descripción, categoría, municipio/zona, foto opcional y contacto básico opcional.</p>
          <small>${isAdmin() ? "Admin libre: sin límite mensual." : unlocked ? "Membresía activa: puedes publicar y activar asistentes." : freeLeft > 0 ? `Disponible este mes: ${freeLeft} publicación básica gratis.` : "Ya usaste tu publicación básica gratis de este mes."}</small>
        </div>
      </div>
      <label class="pa-choice-v4943">
        <span>¿Quieres configurar un asistente para esta publicación?</span>
        <select id="publicationAssistantChoiceV4943">
          ${Object.entries(ASSISTANT_OPTIONS).map(([key, info]) => `<option value="${key}">${info.icon} ${info.label}</option>`).join("")}
        </select>
      </label>
      <div class="pa-membership-v4943 ${unlocked ? "unlocked" : "locked"}">
        <strong>${unlocked ? "Asistente disponible" : "Asistente avanzado con membresía"}</strong>
        <p>${unlocked ? "Puedes activar pedidos, citas, cotizaciones o mensajes internos en esta publicación." : "Sin membresía puedes guardarlo como borrador o vista previa; para activarlo públicamente necesitas membresía."}</p>
      </div>
      <p class="pa-note-v4943">Tu publicación básica es gratis. Activa la membresía para recibir pedidos, citas, cotizaciones o mensajes filtrados.</p>
    </div>`;
  }

  function ensureAssistantQuestion(){
    const gate = qs("#publicationMembershipGate");
    if (gate) {
      gate.innerHTML = assistantChoiceHtml();
      return;
    }
    const form = qs("#publicationForm");
    if (form && !qs("#publicationAssistantGateV4943", form)) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = assistantChoiceHtml();
      const submitRow = qsa("button", form).reverse().find(btn => /publicar|guardar|finalizar/i.test(btn.textContent || ""));
      if (submitRow?.parentElement) submitRow.parentElement.insertAdjacentElement("beforebegin", wrapper.firstElementChild);
      else form.appendChild(wrapper.firstElementChild);
    }
  }

  function makePhoneOptional(){
    const phone = qs("#pubPhone");
    if (phone) {
      phone.removeAttribute("required");
      phone.placeholder = "WhatsApp opcional para contacto básico";
      phone.setAttribute("aria-label", "WhatsApp opcional");
    }
    const label = phone?.closest("label");
    if (label && !label.dataset.optionalV4943) {
      label.dataset.optionalV4943 = "1";
      label.innerHTML = label.innerHTML.replace(/(WhatsApp|Tel[eé]fono|Contacto)(?![^<]*opcional)/i, "$1 <small class=\"optional-chip-v4943\">opcional</small>");
    }
  }

  function decorateCopy(){
    document.body.dataset.version = VERSION;
    document.body.dataset.publishModelVersion = VERSION;
    document.body.classList.add("publicar-unificado-real-v4943");
    if (typeof currentSection !== "undefined" && currentSection === "registro") {
      const mainTitle = qs("#mainTitle");
      if (mainTitle) mainTitle.textContent = "Crear publicación";
    }
    const section = qs("#registro");
    if (!section) return;
    qsa("h1,h2,h3,.section-title,.wizard-title", section).forEach(el => {
      if (/crear oportunidad|publicaci[oó]n autom[aá]tica|publicar oportunidad/i.test(el.textContent || "")) el.textContent = "Crear publicación";
    });
    qsa("p,small,span,strong,div", section).forEach(el => {
      if (el.children.length > 2) return;
      const text = el.textContent || "";
      if (/Resultado esperado|se activar[aá] autom[aá]ticamente|quedar[aá] en revisi[oó]n/i.test(text)) {
        el.textContent = "Tu publicación básica es gratis. Activa la membresía para recibir pedidos, citas, cotizaciones o mensajes filtrados.";
      }
      if (/Publicaci[oó]n autom[aá]tica con cuidado/i.test(text)) {
        el.textContent = "Publicación básica gratis mensual";
      }
      if (/Para publicar.*membres[ií]a|membres[ií]a anual.*publicar/i.test(text)) {
        el.textContent = "Publicar básico es gratis una vez al mes. La membresía activa el asistente avanzado.";
      }
    });
    qsa("button,a", section).forEach(el => {
      if (/chat negocio|responder filtro/i.test(el.textContent || "")) el.remove();
    });
  }

  function formValue(id){ return qs(`#${id}`)?.value?.trim() || ""; }
  function descriptionValue(){
    try { if (typeof currentDescriptionValue === "function") return currentDescriptionValue(); } catch {}
    return formValue("pubDescription") || qs("textarea[name='descripcion']")?.value?.trim() || "";
  }
  function validateUnified(){
    const title = formValue("pubTitle");
    const desc = descriptionValue();
    const municipality = formValue("pubMunicipality");
    const category = formValue("pubCategory");
    const privacy = qs("#pubPrivacyAccept");
    const phone = cleanPhoneLocal(formValue("pubPhone"));
    if (!title || title.length < 4) { qs("#pubTitle")?.focus(); toast("Escribe un título claro para tu publicación."); return false; }
    if (!desc || desc.length < 10) { (qs("#pubDescription") || qs("textarea"))?.focus(); toast("Describe con más claridad lo que necesitas u ofreces."); return false; }
    if (!category) { toast("Elige o confirma una categoría."); return false; }
    if (!municipality) { qs("#pubMunicipality")?.focus(); toast("Agrega municipio o zona para ubicar tu publicación."); return false; }
    if (phone && phone.length < 10) { qs("#pubPhone")?.focus(); toast("WhatsApp es opcional, pero si lo agregas debe tener 10 dígitos."); return false; }
    if (privacy && !privacy.checked) { toast("Acepta privacidad y términos para continuar."); return false; }
    if (!hasMembership() && !isAdmin() && !hasFreeSlot()) {
      ensureAssistantQuestion();
      qs("#publicationAssistantGateV4943")?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast("Ya usaste tu publicación básica gratis de este mes. Activa la membresía para publicar más y usar asistentes.");
      return false;
    }
    return true;
  }

  function basePayload(){
    let raw = {};
    try { raw = typeof formPayload === "function" ? formPayload() : {}; } catch (error) { console.warn("No se pudo leer formPayload, usando lectura directa", error); }
    const payload = {
      nombre_publico: raw.nombre_publico || formValue("pubName") || "Publicación local",
      titulo: raw.titulo || formValue("pubTitle"),
      descripcion: raw.descripcion || descriptionValue(),
      categoria_principal: raw.categoria_principal || formValue("pubCategory") || "General",
      subcategoria: raw.subcategoria || "",
      intencion: raw.intencion || formValue("pubIntent") || "Publicación local",
      estado_nombre: raw.estado_nombre || formValue("pubState") || "México",
      municipio: raw.municipio || formValue("pubMunicipality"),
      localidad: raw.localidad || formValue("pubLocality"),
      telefono: cleanPhoneLocal(raw.telefono || formValue("pubPhone")),
      ruta: raw.ruta || formValue("pubRoute"),
      salida: raw.salida || formValue("pubDeparture"),
      hora: raw.hora || formValue("pubTime"),
      medio: raw.medio || formValue("pubTransport"),
      presupuesto: Number(raw.presupuesto || formValue("pubBudget") || 0),
      latitud: raw.latitud ?? (formValue("pubLat") ? Number(formValue("pubLat")) : null),
      longitud: raw.longitud ?? (formValue("pubLng") ? Number(formValue("pubLng")) : null),
      ubicacion_aproximada: Boolean(raw.ubicacion_aproximada || (formValue("pubLat") && formValue("pubLng"))),
      radio_servicio_km: raw.radio_servicio_km || 10,
      estado: "activo",
      referencia: `${raw.referencia || ""} · ${VERSION}: publicación básica gratis mensual; asistente opcional con membresía.`.trim()
    };
    ["image_url", "media_type", "media_path", "media_created_at"].forEach(key => { if (raw[key]) payload[key] = raw[key]; });
    const choice = assistantChoice();
    payload.assistant_choice = choice;
    payload.assistant_status = choice === "none" ? "sin_asistente" : (hasMembership() ? "activo" : "borrador_membresia");
    payload.modelo_publicacion = hasMembership() || isAdmin() ? "membresia_o_admin" : "basica_gratis_mensual";
    return payload;
  }
  function remotePayload(payload){
    const clean = {};
    REMOTE_ALLOWED_FIELDS.forEach(key => { if (payload[key] !== undefined && payload[key] !== null && payload[key] !== "") clean[key] = payload[key]; });
    clean.referencia = `${clean.referencia || ""}`.slice(0, 900);
    return clean;
  }
  function mapForLocal(payload, remoteRow = null, syncStatus = "sincronizado"){
    return {
      ...payload,
      ...(remoteRow || {}),
      id: remoteRow?.id || payload.id || id("PUB"),
      local_id: payload.local_id || payload.id || remoteRow?.id || id("LOCAL"),
      sync_status: syncStatus,
      created_at: remoteRow?.creado_en || remoteRow?.created_at || payload.created_at || now(),
      source_version: VERSION
    };
  }

  function assistantConfigFromPublication(publication = {}, forcedStatus = ""){
    const type = publication.assistant_choice || assistantChoice();
    if (!type || type === "none") return null;
    const active = hasMembership() || isAdmin();
    const configs = read(ASSISTANT_CONFIG_KEY, []);
    const config = {
      id: id("ASIST"),
      publicationId: publication.id || publication.local_id || id("PUB"),
      businessName: publication.nombre_publico || publication.name || "Publicación local",
      publicationTitle: publication.titulo || publication.title || "Publicación local",
      title: publication.titulo || publication.title || "Publicación local",
      state: publication.estado_nombre || publication.state || "México",
      municipality: publication.municipio || publication.municipality || "",
      phone: cleanPhoneLocal(publication.telefono || publication.phone || ""),
      description: publication.descripcion || publication.description || "",
      interaction_type: type,
      interactionType: type,
      category: publication.categoria_principal || publication.category || "Publicación con asistente",
      menu: type === "menu_order" ? DEMO_MENU : [],
      status: forcedStatus || (active ? "active" : "draft_membership"),
      membershipRequired: !active,
      createdAt: now(),
      updatedAt: now(),
      source_version: VERSION
    };
    write(ASSISTANT_CONFIG_KEY, [config, ...configs.filter(c => !(c.publicationId && c.publicationId === config.publicationId))].slice(0, 200));
    return config;
  }

  async function submitUnified(event){
    try {
      event?.preventDefault?.();
      event?.stopImmediatePropagation?.();
      event?.stopPropagation?.();
    } catch {}
    ensureAssistantQuestion();
    makePhoneOptional();
    decorateCopy();
    if (!validateUnified()) return false;
    const payload = basePayload();
    const choice = payload.assistant_choice || "none";
    let saved = null;
    try {
      const response = typeof insertPublicationWithMediaFallbackV4931 === "function"
        ? await insertPublicationWithMediaFallbackV4931(remotePayload(payload))
        : await supabaseRequest("publicaciones", { method: "POST", body: JSON.stringify(remotePayload(payload)) });
      const remoteRow = Array.isArray(response) ? response[0] : response;
      saved = mapForLocal(payload, remoteRow, "sincronizado");
      saveLocalPublication(saved, "sincronizado", "Publicación sincronizada con Supabase");
      recordFreePublication(saved);
      assistantConfigFromPublication(saved);
      try {
        const mapped = typeof mapPublication === "function" ? mapPublication(remoteRow || saved) : null;
        if (mapped && typeof publicationsCache !== "undefined" && Array.isArray(publicationsCache)) {
          publicationsCache = [mapped, ...publicationsCache.filter(p => p.id !== mapped.id)];
        }
      } catch {}
      toast(choice === "none"
        ? "Publicación básica guardada. Puedes configurar asistente después desde Mis publicaciones."
        : (hasMembership() || isAdmin()) ? "Publicación guardada con asistente activo." : "Publicación guardada y asistente como borrador pendiente de membresía.");
    } catch (error) {
      console.warn("Supabase no respondió para publicación básica; guardando borrador local", error);
      saved = mapForLocal(payload, null, "borrador_local");
      saveLocalPublication(saved, "borrador_local", String(error?.message || error || "Error de conexión"));
      recordFreePublication(saved);
      assistantConfigFromPublication(saved, choice === "none" ? "sin_asistente" : "draft_membership");
      toast("Tu publicación se guardó como borrador local. Revisa conexión o vuelve a intentar sincronizar.");
    }
    try { if (typeof resetWizardForm === "function") resetWizardForm(); } catch {}
    try { if (typeof renderPublications === "function") renderPublications(); } catch {}
    try { if (typeof renderMyPublications === "function") renderMyPublications(); } catch {}
    try { if (typeof showSection === "function") showSection("misPublicaciones"); } catch {}
    setTimeout(() => { renderLocalPublicationsPanel(); decorateCopy(); }, 180);
    return false;
  }

  function renderLocalPublicationsPanel(){
    const section = qs("#misPublicaciones");
    if (!section) return;
    let panel = qs("#localPublicationsPanelV4943", section);
    const rows = getLocalPublications();
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "localPublicationsPanelV4943";
      panel.className = "local-publications-panel-v4943";
      const anchor = qs("#myPublicationsList", section);
      if (anchor?.parentElement) anchor.parentElement.insertBefore(panel, anchor);
      else section.appendChild(panel);
    }
    panel.innerHTML = `<div class="local-panel-head-v4943">
      <div><span>📝 Publicaciones de este dispositivo</span><h3>Publicaciones básicas y borradores locales</h3><p>Aquí aparecen tus publicaciones creadas con el nuevo flujo, incluso si Supabase falló temporalmente.</p></div>
      <button type="button" class="btn-small btn-ghost" onclick="startUnifiedPublishRealV4943()">Crear publicación</button>
    </div>
    ${rows.length ? `<div class="local-publication-list-v4943">${rows.map(row => localCard(row)).join("")}</div>` : `<div class="empty-state">Aún no hay publicaciones básicas guardadas en este dispositivo.</div>`}`;
  }
  function localCard(row){
    const assistant = row.assistant_choice && row.assistant_choice !== "none" ? ASSISTANT_OPTIONS[row.assistant_choice] : null;
    const status = row.sync_status === "sincronizado" ? "Sincronizada" : "Borrador local";
    return `<article class="local-publication-card-v4943">
      <div class="local-card-head-v4943"><span>${assistant?.icon || "🟢"}</span><div><strong>${esc(row.titulo || "Publicación básica")}</strong><small>${esc(row.municipio || "")}, ${esc(row.estado_nombre || "México")} · ${status}</small></div></div>
      <p>${esc(row.descripcion || "").slice(0, 180)}</p>
      <div class="local-meta-v4943"><span>${esc(row.categoria_principal || "General")}</span><span>${assistant ? `Asistente: ${esc(assistant.label)}` : "Sin asistente"}</span></div>
      <div class="local-actions-v4943">
        <button type="button" class="btn-small btn-purple" onclick="configureAssistantForLocalPublicationV4943('${esc(row.id)}')">Configurar asistente</button>
        <button type="button" class="btn-small btn-ghost" onclick="retrySyncLocalPublicationV4943('${esc(row.id)}')">Reintentar sincronizar</button>
      </div>
    </article>`;
  }
  async function retrySync(idValue){
    const rows = getLocalPublications();
    const row = rows.find(item => item.id === idValue || item.local_id === idValue);
    if (!row) return toast("No encontré ese borrador local.");
    try {
      const response = await insertPublicationWithMediaFallbackV4931(remotePayload(row));
      const remoteRow = Array.isArray(response) ? response[0] : response;
      const updated = mapForLocal(row, remoteRow, "sincronizado");
      write(LOCAL_PUBLICATIONS_KEY, [updated, ...rows.filter(item => item.id !== idValue && item.local_id !== idValue)].slice(0, 80));
      toast("Publicación sincronizada con Supabase.");
      renderLocalPublicationsPanel();
      try { await loadRemoteData?.({ silent: true }); } catch {}
    } catch (error) {
      console.warn(error);
      toast("Todavía no se pudo sincronizar. Conservamos el borrador local.");
    }
  }
  function configureAssistantForLocal(idValue){
    const row = getLocalPublications().find(item => item.id === idValue || item.local_id === idValue);
    if (!row) return toast("No encontré esa publicación local.");
    try {
      if (typeof configurePublicationAssistantForItemV4939 === "function") {
        return configurePublicationAssistantForItemV4939({
          id: row.id,
          title: row.titulo,
          titulo: row.titulo,
          name: row.nombre_publico,
          nombre_publico: row.nombre_publico,
          category: row.categoria_principal,
          categoria_principal: row.categoria_principal,
          state: row.estado_nombre,
          estado_nombre: row.estado_nombre,
          municipality: row.municipio,
          municipio: row.municipio,
          phone: row.telefono,
          telefono: row.telefono,
          description: row.descripcion,
          descripcion: row.descripcion
        });
      }
    } catch {}
    assistantConfigFromPublication({ ...row, assistant_choice: "direct_message" }, hasMembership() ? "active" : "draft_membership");
    toast(hasMembership() ? "Asistente activo para esta publicación." : "Asistente guardado como borrador pendiente de membresía.");
    renderLocalPublicationsPanel();
  }

  function installSubmitCapture(){
    const form = qs("#publicationForm");
    if (!form || form.dataset.unifiedRealV4943 === "1") return;
    form.dataset.unifiedRealV4943 = "1";
    form.setAttribute("novalidate", "novalidate");
    form.addEventListener("submit", submitUnified, true);
    form.onsubmit = submitUnified;
  }
  function wrapGlobals(){
    try {
      if (typeof startWizard === "function" && !window.__startWizardBaseV4943) {
        window.__startWizardBaseV4943 = startWizard;
        startWizard = function(){
          try { window.__startWizardBaseV4943.apply(this, arguments); } catch { try { showSection("registro"); } catch {} }
          setTimeout(refresh, 80);
          return false;
        };
      }
    } catch {}
    try {
      if (typeof openOpportunityWizard === "function" && !window.__openOpportunityWizardBaseV4943) {
        window.__openOpportunityWizardBaseV4943 = openOpportunityWizard;
        openOpportunityWizard = function(type, template = null){
          try { window.__openOpportunityWizardBaseV4943.call(this, type, template); } catch { try { showSection("registro"); } catch {} }
          setTimeout(() => {
            try { if (template && typeof applyHomeFeedTemplateToWizard === "function") applyHomeFeedTemplateToWizard(template); } catch {}
            refresh();
          }, 120);
          return false;
        };
      }
    } catch {}
    try {
      if (typeof submitPublication === "function" && !window.__submitPublicationBaseV4943) {
        window.__submitPublicationBaseV4943 = submitPublication;
        submitPublication = submitUnified;
        window.submitPublication = submitUnified;
      }
    } catch {}
    try {
      if (typeof showSection === "function" && !window.__showSectionBaseV4943) {
        window.__showSectionBaseV4943 = showSection;
        showSection = function(section, push = true){
          const result = window.__showSectionBaseV4943.apply(this, arguments);
          setTimeout(() => {
            if (String(section).toLowerCase() === "registro") refresh();
            if (String(section).toLowerCase() === "mispublicaciones") renderLocalPublicationsPanel();
            cleanupLegacyButtons();
          }, 100);
          return result;
        };
      }
    } catch {}
    try {
      if (typeof renderMyPublications === "function" && !window.__renderMyPublicationsBaseV4943) {
        window.__renderMyPublicationsBaseV4943 = renderMyPublications;
        renderMyPublications = function(){
          const result = window.__renderMyPublicationsBaseV4943.apply(this, arguments);
          setTimeout(renderLocalPublicationsPanel, 40);
          return result;
        };
      }
    } catch {}
  }

  function cleanupLegacyButtons(){
    qsa("button,a").forEach(el => {
      const text = el.textContent || "";
      const onclick = String(el.getAttribute("onclick") || "");
      if (/chat negocio|responder filtro|abrir chat de negocios/i.test(text)) {
        el.classList.add("hidden-legacy-v4943");
        el.style.display = "none";
      }
      if (/usar esta plantilla|publicar parecido/i.test(text) || /openOpportunityWizard|publishSimilarToReal/i.test(onclick)) {
        el.title = "Crea una publicación básica gratis mensual con opción de asistente.";
      }
    });
  }
  function refresh(){
    installSubmitCapture();
    makePhoneOptional();
    ensureAssistantQuestion();
    decorateCopy();
    cleanupLegacyButtons();
    if (typeof currentSection !== "undefined" && currentSection === "misPublicaciones") renderLocalPublicationsPanel();
    try { localStorage.setItem("conecta_version_publicar_unificado", VERSION); } catch {}
  }

  window.startUnifiedPublishRealV4943 = function(){
    try { if (typeof showSection === "function") showSection("registro"); } catch {}
    setTimeout(refresh, 80);
  };
  window.retrySyncLocalPublicationV4943 = retrySync;
  window.configureAssistantForLocalPublicationV4943 = configureAssistantForLocal;
  window.submitUnifiedPublicationV4943 = submitUnified;

  function init(){
    wrapGlobals();
    refresh();
    setTimeout(refresh, 250);
    setTimeout(refresh, 900);
    setTimeout(refresh, 1800);
    let count = 0;
    const timer = setInterval(() => { refresh(); if (++count > 12) clearInterval(timer); }, 1000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.addEventListener("pageshow", () => setTimeout(init, 120));
})();
