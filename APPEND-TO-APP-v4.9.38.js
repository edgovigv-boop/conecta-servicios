
// ------------------------------------------------------------------
// v4.9.38 — Asistente de negocio configurable
// Sustituye el concepto limitado de "Chat negocio" por una herramienta
// de valor para membresía: pedidos, citas y mensajes internos por negocio.
// Funciona en modo piloto con localStorage y no depende de WhatsApp Business.
// ------------------------------------------------------------------
(function businessAssistantV4938(){
  const VERSION = "4.9.38-asistente-negocio-configurable";
  const CONFIG_KEY = "conecta_biz_assistant_configs_v4938";
  const ORDER_KEY = "conecta_biz_assistant_orders_v4938";
  const APPOINTMENT_KEY = "conecta_biz_assistant_appointments_v4938";
  const MESSAGE_KEY = "conecta_biz_assistant_messages_v4938";
  const VERSION_FLAG = "conecta_biz_assistant_version_v4938";
  const ORDER_STATUSES = ["Nuevo", "Confirmado", "En preparación", "Listo para recoger", "En camino", "Completado", "Cancelado"];
  const APPOINTMENT_STATUSES = ["Nueva solicitud", "Pendiente de confirmar", "Confirmada", "Reagendada", "Completada", "Cancelada"];
  const MESSAGE_STATUSES = ["Nuevo mensaje", "En conversación", "Atendido", "Cerrado"];
  const FLOW = {
    menu_order: { icon: "🛒", label: "Pedidos con menú", action: "Hacer pedido", help: "Ideal para comida, tiendas, abarrotes, panaderías o negocios con productos." },
    appointment: { icon: "📅", label: "Citas", action: "Agendar cita", help: "Ideal para consultoría, salud, belleza, talleres, asesorías o clases." },
    direct_message: { icon: "💬", label: "Mensaje filtrado", action: "Mensaje al negocio", help: "Ideal para servicios que primero necesitan entender la solicitud." }
  };
  const DEMO_MENU = [
    { name: "Pollo asado con ensalada, salsas y tortillas", price: 235, active: true },
    { name: "Quesadillas", price: 50, active: true },
    { name: "Refrescos", price: 35, active: true },
    { name: "Papas fritas", price: 40, active: true }
  ];

  function esc(value = "") {
    if (typeof escapeHtml === "function") return escapeHtml(value);
    return String(value ?? "").replace(/[&<>\"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;" }[ch]));
  }
  function money(value = 0) {
    const n = Number(value) || 0;
    return `$${n.toFixed(2)} MXN`;
  }
  function cleanPhone(value = "") { return String(value || "").replace(/\D/g, ""); }
  function id(prefix = "BA") { return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(16).slice(2, 7).toUpperCase()}`; }
  function now() { return new Date().toISOString(); }
  function dateLabel(value = "") {
    try { return value ? new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : ""; } catch { return value || ""; }
  }
  function read(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "");
      return Array.isArray(fallback) ? (Array.isArray(parsed) ? parsed : fallback) : (parsed && typeof parsed === "object" ? parsed : fallback);
    } catch { return fallback; }
  }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function toast(msg) { if (typeof showToast === "function") showToast(msg); else console.log(msg); }
  function isAdmin() {
    try {
      if (typeof isAdminSupervisorActiveV49368 === "function" && isAdminSupervisorActiveV49368()) return true;
      if (typeof adminAccessAvailableV4936 === "function" && adminAccessAvailableV4936()) return true;
      if (typeof adminUnlocked !== "undefined" && adminUnlocked) return true;
      if (typeof adminRouteEnabled !== "undefined" && adminRouteEnabled) return true;
      return localStorage.getItem("conecta_admin_access_v4936") === "1" || localStorage.getItem("conecta_admin_access") === "1";
    } catch { return false; }
  }
  function hasMembership() {
    if (isAdmin()) return true;
    try {
      if (typeof userMembershipIsActiveV4936 === "function" && userMembershipIsActiveV4936()) return true;
      if (typeof userCanPublishBusinessChatV49368 === "function" && userCanPublishBusinessChatV49368()) return true;
      if (typeof hasActivePublishMembership === "function" && hasActivePublishMembership()) return true;
    } catch {}
    return localStorage.getItem("conecta_membership_status_v4936") === "active" || localStorage.getItem("conecta_membresia_activa") === "1";
  }
  function getConfigs(){ return read(CONFIG_KEY, []); }
  function setConfigs(rows){ write(CONFIG_KEY, rows.slice(0, 200)); }
  function getOrders(){ return read(ORDER_KEY, []); }
  function setOrders(rows){ write(ORDER_KEY, rows.slice(0, 500)); }
  function getAppointments(){ return read(APPOINTMENT_KEY, []); }
  function setAppointments(rows){ write(APPOINTMENT_KEY, rows.slice(0, 500)); }
  function getMessages(){ return read(MESSAGE_KEY, []); }
  function setMessages(rows){ write(MESSAGE_KEY, rows.slice(0, 900)); }
  function flowLabel(type){ return FLOW[type] || FLOW.direct_message; }
  function menuText(menu = []) { return (menu.length ? menu : DEMO_MENU).map(i => `${i.name} | ${Number(i.price) || 0}`).join("\n"); }
  function parseMenu(text = "") {
    const rows = String(text || "").split(/\n+/).map(line => line.trim()).filter(Boolean).map(line => {
      let [name, price] = line.split("|").map(v => v.trim());
      if (!price) {
        const match = line.match(/(.+?)\s+\$?([0-9]+(?:\.[0-9]+)?)\s*(?:mxn|pesos)?$/i);
        if (match) { name = match[1].trim(); price = match[2]; }
      }
      return { id: id("ITEM"), name: name || "Producto", price: Math.max(0, Number(String(price || "0").replace(/[^0-9.]/g, "")) || 0), active: true };
    });
    return rows.length ? rows : DEMO_MENU.map(item => ({ ...item, id: id("ITEM") }));
  }
  function inferType(text = "") {
    const t = String(text).toLowerCase();
    if (/rosti|pollo|panader|comida|tienda|abarrote|men[uú]|producto|venta|taco|torta|pizza|farmacia/.test(t)) return "menu_order";
    if (/consulta|consultor|tecnol[oó]g|cita|agenda|doctor|taller|belleza|clase|asesor/.test(t)) return "appointment";
    return "direct_message";
  }

  function ensureModal() {
    let modal = document.getElementById("bizAssistantModalV4938");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "bizAssistantModalV4938";
    modal.className = "ba-modal-v4938 hidden";
    modal.innerHTML = `<div class="ba-modal-card-v4938"><button type="button" class="ba-close-v4938" onclick="closeBusinessAssistantV4938()">×</button><div id="bizAssistantModalBodyV4938"></div></div>`;
    document.body.appendChild(modal);
    return modal;
  }
  function openModal(html) {
    const modal = ensureModal();
    const body = document.getElementById("bizAssistantModalBodyV4938");
    if (body) body.innerHTML = html;
    modal.classList.remove("hidden");
    document.body.classList.add("ba-modal-open-v4938");
  }
  function closeModal() {
    document.getElementById("bizAssistantModalV4938")?.classList.add("hidden");
    document.body.classList.remove("ba-modal-open-v4938");
  }
  function membershipHtml() {
    if (hasMembership()) return `<div class="ba-note-v4938 ba-ok-v4938"><strong>${isAdmin() ? "Admin libre" : "Membresía activa"}</strong><span>Puedes crear y probar asistentes sin bloqueo.</span></div>`;
    return `<div class="ba-note-v4938 ba-warn-v4938"><strong>Membresía requerida para publicar</strong><span>Puedes configurar el asistente como borrador. Para activarlo públicamente se requiere membresía anual.</span><button type="button" onclick="openMembershipFromBusinessAssistantV4938()">Activar membresía</button></div>`;
  }

  function primaryPanelHtml(mode = "default") {
    const configs = getConfigs();
    const orders = getOrders();
    const appointments = getAppointments();
    const messages = getMessages();
    return `<section class="ba-panel-v4938" data-ba-panel="${esc(mode)}">
      <div class="ba-panel-head-v4938">
        <div>
          <span class="ba-kicker-v4938">Nuevo valor de membresía</span>
          <h3>Asistente de negocio configurable</h3>
          <p>Convierte cada publicación en un punto de atención: pedidos con menú, citas o mensajes filtrados dentro de Conecta Servicios.</p>
        </div>
        <button type="button" class="ba-btn-v4938 ba-primary-v4938" onclick="openBusinessAssistantConfigV4938()">Configurar asistente</button>
      </div>
      <div class="ba-flow-grid-v4938">
        <button type="button" onclick="openBusinessAssistantConfigV4938('menu_order')"><strong>🛒 Pedidos</strong><span>Menú, cantidades, total y pickup/entrega.</span></button>
        <button type="button" onclick="openBusinessAssistantConfigV4938('appointment')"><strong>📅 Citas</strong><span>Fecha, horario, necesidad y seguimiento.</span></button>
        <button type="button" onclick="openBusinessAssistantConfigV4938('direct_message')"><strong>💬 Mensajes</strong><span>Contacto filtrado para servicios y cotizaciones.</span></button>
      </div>
      <div class="ba-mini-metrics-v4938"><span>${configs.length} asistentes</span><span>${orders.length} pedidos</span><span>${appointments.length} citas</span><span>${messages.length} mensajes</span></div>
      <div class="ba-actions-v4938"><button type="button" class="ba-btn-v4938 ba-outline-v4938" onclick="seedRosticeriaAssistantV4938()">Crear ejemplo Rosticería</button><button type="button" class="ba-btn-v4938 ba-outline-v4938" onclick="openBusinessAssistantOwnerPanelV4938()">Ver panel del negocio</button></div>
      ${configs.length ? `<div class="ba-card-grid-v4938">${configs.slice(0, 3).map(c => configCardHtml(c, "public")).join("")}</div>` : `<div class="ba-empty-v4938">Aún no hay asistentes configurados en este dispositivo.</div>`}
    </section>`;
  }

  function configCardHtml(config, mode = "owner") {
    const label = flowLabel(config.interaction_type);
    const orders = getOrders().filter(o => o.configId === config.id).length;
    const appts = getAppointments().filter(a => a.configId === config.id).length;
    const msgs = getMessages().filter(m => m.configId === config.id && !m.orderId && !m.appointmentId).length;
    const active = config.status === "active" || isAdmin();
    return `<article class="ba-card-v4938">
      <div class="ba-card-head-v4938"><span>${label.icon}</span><div><strong>${esc(config.publicationTitle || config.businessName)}</strong><small>${esc(config.businessName)} · ${esc(label.label)} · ${esc(config.municipality || "")}</small></div></div>
      <p>${esc(config.description || label.help)}</p>
      <div class="ba-card-meta-v4938"><span class="${active ? "ba-active" : "ba-draft"}">${active ? "Activo" : "Borrador"}</span><span>${orders} pedidos</span><span>${appts} citas</span><span>${msgs} mensajes</span></div>
      <div class="ba-actions-v4938">
        <button type="button" class="ba-btn-v4938 ba-primary-v4938" onclick="openBusinessAssistantClientV4938('${esc(config.id)}')">${esc(label.action)}</button>
        ${mode === "owner" ? `<button type="button" class="ba-btn-v4938 ba-outline-v4938" onclick="editBusinessAssistantConfigV4938('${esc(config.id)}')">Editar</button><button type="button" class="ba-btn-v4938 ba-outline-v4938" onclick="openBusinessAssistantOwnerPanelV4938('${esc(config.id)}')">Solicitudes</button>` : ""}
      </div>
    </article>`;
  }

  function injectPanel(sectionId, panelId, mode) {
    const section = document.getElementById(sectionId);
    if (!section) return false;
    let panel = document.getElementById(panelId);
    if (!panel) {
      panel = document.createElement("div");
      panel.id = panelId;
      section.insertBefore(panel, section.firstElementChild?.nextSibling || null);
    }
    panel.innerHTML = primaryPanelHtml(mode);
    return true;
  }
  function injectVisibleAccess() {
    injectPanel("negocios", "baPanelNegociosV4938", "negocios");
    injectPanel("misPublicaciones", "baPanelMisPublicacionesV4938", "misPublicaciones");
    injectPanel("oportunidades", "baPanelOportunidadesV4938", "oportunidades");
    const exists = document.getElementById("baQuickAccessV4938");
    if (!exists) {
      const content = document.querySelector(".content") || document.querySelector("main") || document.body;
      const quick = document.createElement("div");
      quick.id = "baQuickAccessV4938";
      quick.className = "ba-quick-access-v4938";
      quick.innerHTML = `<button type="button" onclick="openBusinessAssistantHubV4938()">🤖 Asistente de negocio</button>`;
      content.appendChild(quick);
    }
    try { localStorage.setItem(VERSION_FLAG, VERSION); } catch {}
    document.body.dataset.businessAssistantVersion = VERSION;
  }

  function configForm(config = {}) {
    const type = config.interaction_type || config.interactionType || inferType(`${config.businessName || ""} ${config.publicationTitle || ""}`);
    openModal(`<span class="ba-kicker-v4938">${VERSION}</span><h2>Configurar asistente de negocio</h2><p>Elige cómo atenderá tu publicación: pedido, cita o mensaje filtrado.</p>${membershipHtml()}
      <form class="ba-form-v4938" onsubmit="event.preventDefault(); saveBusinessAssistantConfigV4938('${esc(config.id || "")}')">
        <label>Nombre del negocio<input id="baBusinessNameV4938" required value="${esc(config.businessName || (type === "menu_order" ? "Rosticería" : type === "appointment" ? "Consultoría tecnológica" : "Negocio local"))}"></label>
        <label>Título visible de la publicación<input id="baPublicationTitleV4938" required value="${esc(config.publicationTitle || config.title || "")}" placeholder="Ej. Rosticería con pedidos y pickup"></label>
        <div class="ba-grid-v4938"><label>Estado<input id="baStateV4938" value="${esc(config.state || "México")}"></label><label>Municipio<input id="baMunicipalityV4938" value="${esc(config.municipality || "Chapultepec")}"></label></div>
        <label>Tipo de asistente<select id="baInteractionTypeV4938" onchange="toggleBusinessAssistantMenuV4938()">
          ${Object.entries(FLOW).map(([key, info]) => `<option value="${key}" ${key === type ? "selected" : ""}>${info.icon} ${info.label}</option>`).join("")}
        </select></label>
        <div id="baMenuEditorV4938" class="${type === "menu_order" ? "" : "hidden"}"><label>Menú / productos <small>Un producto por línea: Nombre | Precio</small><textarea id="baMenuTextV4938" rows="6">${esc(menuText(config.menu || DEMO_MENU))}</textarea></label></div>
        <label>WhatsApp o teléfono de referencia <input id="baPhoneV4938" value="${esc(config.phone || "")}" inputmode="tel" placeholder="Solo para que el negocio identifique al cliente"></label>
        <label>Descripción del negocio o servicio<textarea id="baDescriptionV4938" rows="4">${esc(config.description || "")}</textarea></label>
        <div class="ba-actions-v4938"><button class="ba-btn-v4938 ba-primary-v4938" type="submit">Guardar asistente</button><button class="ba-btn-v4938 ba-outline-v4938" type="button" onclick="seedRosticeriaAssistantV4938(true)">Usar ejemplo Rosticería</button><button class="ba-btn-v4938 ba-ghost-v4938" type="button" onclick="closeBusinessAssistantV4938()">Cancelar</button></div>
      </form>`);
  }
  function toggleMenu() {
    const type = document.getElementById("baInteractionTypeV4938")?.value || "direct_message";
    document.getElementById("baMenuEditorV4938")?.classList.toggle("hidden", type !== "menu_order");
  }
  function saveConfig(existingId = "") {
    const configs = getConfigs();
    const old = configs.find(c => c.id === existingId);
    const type = document.getElementById("baInteractionTypeV4938")?.value || "direct_message";
    const active = hasMembership();
    const businessName = document.getElementById("baBusinessNameV4938")?.value.trim() || "Negocio local";
    const publicationTitle = document.getElementById("baPublicationTitleV4938")?.value.trim() || businessName;
    const config = {
      ...(old || {}),
      id: old?.id || id("BIZ"),
      publicationId: old?.publicationId || id("PUB"),
      businessName,
      publicationTitle,
      title: publicationTitle,
      state: document.getElementById("baStateV4938")?.value.trim() || "México",
      municipality: document.getElementById("baMunicipalityV4938")?.value.trim() || "Chapultepec",
      phone: cleanPhone(document.getElementById("baPhoneV4938")?.value || ""),
      description: document.getElementById("baDescriptionV4938")?.value.trim() || flowLabel(type).help,
      interaction_type: type,
      interactionType: type,
      category: "Negocios locales",
      menu: type === "menu_order" ? parseMenu(document.getElementById("baMenuTextV4938")?.value || "") : [],
      status: active ? "active" : "draft_membership",
      membershipRequired: !active,
      createdAt: old?.createdAt || now(),
      updatedAt: now()
    };
    setConfigs([config, ...configs.filter(c => c.id !== config.id)]);
    toast(active ? "Asistente publicado" : "Asistente guardado como borrador pendiente de membresía");
    closeModal();
    injectVisibleAccess();
    ownerPanel(config.id);
  }
  function seedRosticeria(fromForm = false) {
    if (fromForm && document.getElementById("baBusinessNameV4938")) {
      document.getElementById("baBusinessNameV4938").value = "Rosticería";
      document.getElementById("baPublicationTitleV4938").value = "Rosticería · pollo asado con pickup o entrega";
      document.getElementById("baStateV4938").value = "México";
      document.getElementById("baMunicipalityV4938").value = "Chapultepec";
      document.getElementById("baInteractionTypeV4938").value = "menu_order";
      document.getElementById("baMenuTextV4938").value = menuText(DEMO_MENU);
      document.getElementById("baDescriptionV4938").value = "Haz tu pedido interno: pollo asado, quesadillas, refrescos y papas. Pago pendiente o a acordar con el negocio.";
      toggleMenu();
      return;
    }
    const config = { businessName: "Rosticería", publicationTitle: "Rosticería · pollo asado con pickup o entrega", state: "México", municipality: "Chapultepec", interaction_type: "menu_order", menu: DEMO_MENU, description: "Pedido interno con menú, total automático, pickup o entrega." };
    configForm(config);
  }
  function editConfig(idValue) {
    const config = getConfigs().find(c => c.id === idValue);
    if (!config) return toast("No encontré el asistente");
    configForm(config);
  }

  function clientView(configId) {
    const config = getConfigs().find(c => c.id === configId);
    if (!config) return toast("No encontré el negocio");
    const label = flowLabel(config.interaction_type);
    openModal(`<button type="button" class="ba-back-v4938" onclick="openBusinessAssistantHubV4938()">← Volver</button><span class="ba-kicker-v4938">Publicación con asistente</span><h2>${esc(config.publicationTitle)}</h2><p>${esc(config.description)}</p><div class="ba-note-v4938"><strong>${label.icon} ${esc(label.label)}</strong><span>${esc(label.help)}</span></div><div class="ba-actions-v4938"><button class="ba-btn-v4938 ba-primary-v4938" onclick="startBusinessAssistantFlowV4938('${esc(config.id)}')">${esc(label.action)}</button><button class="ba-btn-v4938 ba-outline-v4938" onclick="openBusinessAssistantOwnerPanelV4938('${esc(config.id)}')">Panel del negocio</button></div>`);
  }
  function startFlow(configId) {
    const config = getConfigs().find(c => c.id === configId);
    if (!config) return;
    if (config.interaction_type === "menu_order") return orderFlow(config);
    if (config.interaction_type === "appointment") return appointmentFlow(config);
    return messageFlow(config);
  }
  function orderFlow(config) {
    openModal(`<button type="button" class="ba-back-v4938" onclick="openBusinessAssistantClientV4938('${esc(config.id)}')">← Publicación</button><span class="ba-kicker-v4938">Hacer pedido</span><h2>${esc(config.businessName)}</h2><form class="ba-form-v4938" onsubmit="event.preventDefault(); submitBusinessAssistantOrderV4938('${esc(config.id)}')">
      <div class="ba-menu-v4938">${(config.menu || DEMO_MENU).map(item => `<label class="ba-menu-item-v4938"><span><strong>${esc(item.name)}</strong><small>${money(item.price)}</small></span><input type="number" min="0" max="99" value="0" data-ba-item="${esc(item.name)}" data-ba-price="${Number(item.price) || 0}" oninput="updateBusinessAssistantOrderTotalV4938()"></label>`).join("")}</div>
      <div class="ba-total-v4938">Total: <strong id="baOrderTotalV4938">$0.00 MXN</strong></div>
      <div class="ba-grid-v4938"><label>Tu nombre<input id="baOrderNameV4938" required></label><label>Teléfono<input id="baOrderPhoneV4938" required inputmode="tel"></label></div>
      <label>Entrega<select id="baDeliveryTypeV4938"><option>Pickup / paso a recoger</option><option>Entrega a domicilio</option></select></label>
      <label>Dirección o referencia<textarea id="baOrderAddressV4938" rows="2" placeholder="Opcional si es pickup; necesario para entrega"></textarea></label>
      <label>Notas del pedido<textarea id="baOrderNotesV4938" rows="2" placeholder="Ej. sin picante, horario, referencia"></textarea></label>
      <div class="ba-note-v4938"><strong>Pago</strong><span>Pago pendiente / acordar con negocio. Espacio listo para futura integración con Mercado Pago.</span></div>
      <button class="ba-btn-v4938 ba-primary-v4938" type="submit">Confirmar pedido</button>
    </form>`);
    updateTotal();
  }
  function updateTotal() {
    const inputs = Array.from(document.querySelectorAll("[data-ba-item]"));
    const total = inputs.reduce((sum, input) => sum + (Number(input.value) || 0) * (Number(input.dataset.baPrice) || 0), 0);
    const target = document.getElementById("baOrderTotalV4938");
    if (target) target.textContent = money(total);
    return total;
  }
  function submitOrder(configId) {
    const config = getConfigs().find(c => c.id === configId);
    const items = Array.from(document.querySelectorAll("[data-ba-item]")).map(input => {
      const quantity = Number(input.value) || 0;
      const unitPrice = Number(input.dataset.baPrice) || 0;
      return { item_name: input.dataset.baItem, quantity, unit_price: unitPrice, subtotal: quantity * unitPrice };
    }).filter(item => item.quantity > 0);
    if (!items.length) return toast("Selecciona al menos un producto");
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const order = { id: id("PED"), configId, publicationId: config?.publicationId || "", businessName: config?.businessName || "Negocio", customer_name: document.getElementById("baOrderNameV4938")?.value.trim() || "Cliente", customer_phone: cleanPhone(document.getElementById("baOrderPhoneV4938")?.value || ""), delivery_type: document.getElementById("baDeliveryTypeV4938")?.value || "Pickup", address: document.getElementById("baOrderAddressV4938")?.value.trim() || "", notes: document.getElementById("baOrderNotesV4938")?.value.trim() || "", items, total, status: "Nuevo", payment_status: "Pago pendiente / acordar con negocio", created_at: now(), updated_at: now() };
    setOrders([order, ...getOrders()]);
    addMessage({ configId, orderId: order.id, sender_type: "system", sender_name: "Conecta", message: `Pedido recibido por ${money(total)}.` });
    openModal(`<div class="ba-success-v4938"><span>✅</span><h2>Pedido confirmado</h2><p>El negocio recibió tu pedido organizado en su panel.</p><strong>${money(total)}</strong><small>Pago pendiente / acordar con negocio</small><div class="ba-actions-v4938"><button class="ba-btn-v4938 ba-primary-v4938" onclick="openBusinessAssistantChatV4938('order','${esc(order.id)}')">Abrir chat de seguimiento</button><button class="ba-btn-v4938 ba-outline-v4938" onclick="openBusinessAssistantOwnerPanelV4938('${esc(configId)}')">Ver panel del negocio</button></div></div>`);
    injectVisibleAccess();
  }
  function appointmentFlow(config) {
    openModal(`<button type="button" class="ba-back-v4938" onclick="openBusinessAssistantClientV4938('${esc(config.id)}')">← Publicación</button><span class="ba-kicker-v4938">Agendar cita</span><h2>${esc(config.businessName)}</h2><form class="ba-form-v4938" onsubmit="event.preventDefault(); submitBusinessAssistantAppointmentV4938('${esc(config.id)}')"><div class="ba-grid-v4938"><label>Tu nombre<input id="baApptNameV4938" required></label><label>Teléfono<input id="baApptPhoneV4938" required inputmode="tel"></label></div><div class="ba-grid-v4938"><label>Fecha preferida<input id="baApptDateV4938" type="date" required></label><label>Horario preferido<input id="baApptTimeV4938" type="time" required></label></div><label>¿Qué necesitas?<textarea id="baApptNeedV4938" rows="4" required></textarea></label><button class="ba-btn-v4938 ba-primary-v4938" type="submit">Confirmar solicitud</button></form>`);
  }
  function submitAppointment(configId) {
    const config = getConfigs().find(c => c.id === configId);
    const appt = { id: id("CITA"), configId, publicationId: config?.publicationId || "", businessName: config?.businessName || "Negocio", customer_name: document.getElementById("baApptNameV4938")?.value.trim() || "Cliente", customer_phone: cleanPhone(document.getElementById("baApptPhoneV4938")?.value || ""), preferred_date: document.getElementById("baApptDateV4938")?.value || "", preferred_time: document.getElementById("baApptTimeV4938")?.value || "", need_description: document.getElementById("baApptNeedV4938")?.value.trim() || "", status: "Nueva solicitud", created_at: now(), updated_at: now() };
    setAppointments([appt, ...getAppointments()]);
    addMessage({ configId, appointmentId: appt.id, sender_type: "system", sender_name: "Conecta", message: `Solicitud de cita para ${appt.preferred_date} ${appt.preferred_time}.` });
    openModal(`<div class="ba-success-v4938"><span>📅</span><h2>Solicitud enviada</h2><p>El negocio verá tu cita en su panel.</p><div class="ba-actions-v4938"><button class="ba-btn-v4938 ba-primary-v4938" onclick="openBusinessAssistantChatV4938('appointment','${esc(appt.id)}')">Abrir chat</button><button class="ba-btn-v4938 ba-outline-v4938" onclick="openBusinessAssistantOwnerPanelV4938('${esc(configId)}')">Ver panel del negocio</button></div></div>`);
    injectVisibleAccess();
  }
  function messageFlow(config) {
    const threadId = id("HILO");
    openModal(`<button type="button" class="ba-back-v4938" onclick="openBusinessAssistantClientV4938('${esc(config.id)}')">← Publicación</button><span class="ba-kicker-v4938">Mensaje al negocio</span><h2>${esc(config.businessName)}</h2><form class="ba-form-v4938" onsubmit="event.preventDefault(); submitBusinessAssistantMessageV4938('${esc(config.id)}','${esc(threadId)}')"><div class="ba-grid-v4938"><label>Tu nombre<input id="baMsgNameV4938" required></label><label>Teléfono<input id="baMsgPhoneV4938" required inputmode="tel"></label></div><label>Mensaje o necesidad<textarea id="baMsgTextV4938" rows="5" required placeholder="Describe qué necesitas para que el negocio te responda mejor"></textarea></label><button class="ba-btn-v4938 ba-primary-v4938" type="submit">Enviar mensaje</button></form>`);
  }
  function submitMessage(configId, threadId) {
    const row = addMessage({ id: threadId, threadId, configId, sender_type: "customer", sender_name: document.getElementById("baMsgNameV4938")?.value.trim() || "Cliente", customer_phone: cleanPhone(document.getElementById("baMsgPhoneV4938")?.value || ""), message: document.getElementById("baMsgTextV4938")?.value.trim() || "", status: "Nuevo mensaje" });
    openModal(`<div class="ba-success-v4938"><span>💬</span><h2>Mensaje enviado</h2><p>El negocio verá tu mensaje interno.</p><div class="ba-actions-v4938"><button class="ba-btn-v4938 ba-primary-v4938" onclick="openBusinessAssistantChatV4938('direct','${esc(row.threadId)}')">Abrir conversación</button><button class="ba-btn-v4938 ba-outline-v4938" onclick="openBusinessAssistantOwnerPanelV4938('${esc(configId)}')">Ver panel del negocio</button></div></div>`);
    injectVisibleAccess();
  }
  function addMessage(data = {}) {
    const row = { id: data.id || id("MSG"), threadId: data.threadId || data.id || data.orderId || data.appointmentId || id("THREAD"), configId: data.configId || "", orderId: data.orderId || "", appointmentId: data.appointmentId || "", sender_type: data.sender_type || "business", sender_name: data.sender_name || "Negocio", customer_phone: data.customer_phone || "", message: data.message || "", status: data.status || "En conversación", created_at: now() };
    setMessages([row, ...getMessages()]);
    return row;
  }
  function messagesFor(kind, recordId) {
    const rows = getMessages();
    if (kind === "order") return rows.filter(m => m.orderId === recordId);
    if (kind === "appointment") return rows.filter(m => m.appointmentId === recordId);
    return rows.filter(m => m.threadId === recordId || m.id === recordId);
  }
  function openChat(kind, recordId) {
    const rows = messagesFor(kind, recordId).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    const configId = rows[0]?.configId || getOrders().find(o => o.id === recordId)?.configId || getAppointments().find(a => a.id === recordId)?.configId || "";
    const config = getConfigs().find(c => c.id === configId);
    openModal(`<button type="button" class="ba-back-v4938" onclick="openBusinessAssistantOwnerPanelV4938('${esc(configId)}')">← Panel</button><span class="ba-kicker-v4938">Chat interno de seguimiento</span><h2>${esc(config?.businessName || "Negocio")}</h2><div class="ba-chat-log-v4938">${rows.map(m => `<div class="ba-chat-msg-v4938 ${m.sender_type === "customer" ? "customer" : "business"}"><strong>${esc(m.sender_name)}</strong><p>${esc(m.message)}</p><small>${dateLabel(m.created_at)}</small></div>`).join("") || `<div class="ba-empty-v4938">Sin mensajes todavía.</div>`}</div><form class="ba-chat-compose-v4938" onsubmit="event.preventDefault(); sendBusinessAssistantChatV4938('${esc(kind)}','${esc(recordId)}')"><input id="baChatInputV4938" required placeholder="Escribe una respuesta interna"><button class="ba-btn-v4938 ba-primary-v4938" type="submit">Enviar</button></form>`);
  }
  function sendChat(kind, recordId) {
    const msg = document.getElementById("baChatInputV4938")?.value.trim() || "";
    if (!msg) return;
    const configId = kind === "order" ? getOrders().find(o => o.id === recordId)?.configId : kind === "appointment" ? getAppointments().find(a => a.id === recordId)?.configId : getMessages().find(m => m.threadId === recordId || m.id === recordId)?.configId;
    addMessage({ configId, threadId: kind === "direct" ? recordId : undefined, orderId: kind === "order" ? recordId : "", appointmentId: kind === "appointment" ? recordId : "", sender_type: "business", sender_name: "Negocio", message: msg });
    openChat(kind, recordId);
  }
  function statusSelect(kind, rowId, value, options) { return `<select onchange="updateBusinessAssistantStatusV4938('${kind}','${esc(rowId)}', this.value)">${options.map(opt => `<option value="${esc(opt)}" ${opt === value ? "selected" : ""}>${esc(opt)}</option>`).join("")}</select>`; }
  function ownerPanel(configId = "") {
    const configs = configId ? getConfigs().filter(c => c.id === configId) : getConfigs();
    const orders = getOrders().filter(o => !configId || o.configId === configId);
    const appointments = getAppointments().filter(a => !configId || a.configId === configId);
    const directThreads = Object.values(getMessages().filter(m => !m.orderId && !m.appointmentId && (!configId || m.configId === configId)).reduce((acc, m) => { acc[m.threadId || m.id] = acc[m.threadId || m.id] || m; return acc; }, {}));
    openModal(`<span class="ba-kicker-v4938">Panel del negocio</span><h2>Mensajes y pedidos de mi negocio</h2><p>Administra pedidos, citas y mensajes internos por publicación.</p>${membershipHtml()}<div class="ba-actions-v4938"><button class="ba-btn-v4938 ba-primary-v4938" onclick="openBusinessAssistantConfigV4938()">Crear asistente</button><button class="ba-btn-v4938 ba-outline-v4938" onclick="openBusinessAssistantHubV4938()">Ver publicaciones</button></div><div class="ba-mini-metrics-v4938"><span>${configs.length} publicaciones</span><span>${orders.length} pedidos</span><span>${appointments.length} citas</span><span>${directThreads.length} mensajes</span></div><h3>Publicaciones con asistente</h3><div class="ba-card-grid-v4938">${configs.map(c => configCardHtml(c, "owner")).join("") || `<div class="ba-empty-v4938">Aún no hay asistentes configurados.</div>`}</div>${ordersTable(orders)}${appointmentsTable(appointments)}${messagesTable(directThreads)}`);
    injectVisibleAccess();
  }
  function ordersTable(rows) { return `<section class="ba-table-v4938"><h3>Pedidos recibidos</h3>${rows.map(o => `<article class="ba-row-v4938"><strong>${esc(o.customer_name)} · ${money(o.total)}</strong><small>${dateLabel(o.created_at)} · ${esc(o.delivery_type)}</small><p>${(o.items || []).map(i => `${esc(i.item_name)} x${i.quantity}`).join(" · ")}</p><div class="ba-actions-v4938">${statusSelect("order", o.id, o.status, ORDER_STATUSES)}<button class="ba-btn-v4938 ba-outline-v4938" onclick="openBusinessAssistantChatV4938('order','${esc(o.id)}')">Responder</button></div></article>`).join("") || `<div class="ba-empty-v4938">Sin pedidos todavía.</div>`}</section>`; }
  function appointmentsTable(rows) { return `<section class="ba-table-v4938"><h3>Solicitudes de cita</h3>${rows.map(a => `<article class="ba-row-v4938"><strong>${esc(a.customer_name)} · ${esc(a.preferred_date)} ${esc(a.preferred_time)}</strong><small>${dateLabel(a.created_at)} · ${esc(a.customer_phone)}</small><p>${esc(a.need_description)}</p><div class="ba-actions-v4938">${statusSelect("appointment", a.id, a.status, APPOINTMENT_STATUSES)}<button class="ba-btn-v4938 ba-outline-v4938" onclick="openBusinessAssistantChatV4938('appointment','${esc(a.id)}')">Responder</button></div></article>`).join("") || `<div class="ba-empty-v4938">Sin citas todavía.</div>`}</section>`; }
  function messagesTable(rows) { return `<section class="ba-table-v4938"><h3>Mensajes directos</h3>${rows.map(m => `<article class="ba-row-v4938"><strong>${esc(m.sender_name)}</strong><small>${dateLabel(m.created_at)} · ${esc(m.customer_phone || "")}</small><p>${esc(m.message)}</p><div class="ba-actions-v4938">${statusSelect("message", m.threadId || m.id, m.status || "Nuevo mensaje", MESSAGE_STATUSES)}<button class="ba-btn-v4938 ba-outline-v4938" onclick="openBusinessAssistantChatV4938('direct','${esc(m.threadId || m.id)}')">Responder</button></div></article>`).join("") || `<div class="ba-empty-v4938">Sin mensajes todavía.</div>`}</section>`; }
  function updateStatus(kind, rowId, value) {
    if (kind === "order") setOrders(getOrders().map(o => o.id === rowId ? { ...o, status: value, updated_at: now() } : o));
    if (kind === "appointment") setAppointments(getAppointments().map(a => a.id === rowId ? { ...a, status: value, updated_at: now() } : a));
    if (kind === "message") setMessages(getMessages().map(m => (m.threadId === rowId || m.id === rowId) ? { ...m, status: value } : m));
    toast("Estado actualizado");
    ownerPanel();
  }
  function hub() {
    openModal(`<span class="ba-kicker-v4938">${VERSION}</span><h2>Asistente de negocio configurable</h2><p>Prueba cómo un negocio recibe pedidos, citas o mensajes filtrados dentro de la app.</p>${primaryPanelHtml("modal")}`);
  }
  function membershipOpen() {
    closeModal();
    if (typeof showSection === "function") showSection("miAcceso");
    else toast("Abre Mis publicaciones → Mi acceso / Membresía");
  }

  function wrapLegacy() {
    try {
      if (typeof startSurveyFlow === "function" && !window.__startSurveyFlowBaseV4938) {
        window.__startSurveyFlowBaseV4938 = startSurveyFlow;
        startSurveyFlow = function(flow, context) {
          if (flow === "chatNegocio") return configForm(context || { interactionType: "menu_order", businessName: "Negocio local" });
          return window.__startSurveyFlowBaseV4938(flow, context);
        };
      }
    } catch {}
    try {
      if (typeof showSection === "function" && !window.__showSectionBaseV4938) {
        window.__showSectionBaseV4938 = showSection;
        showSection = function(section, push = true) {
          const result = window.__showSectionBaseV4938(section, push);
          setTimeout(injectVisibleAccess, 80);
          return result;
        };
      }
    } catch {}
  }
  function init() {
    wrapLegacy();
    ensureModal();
    injectVisibleAccess();
    setTimeout(injectVisibleAccess, 300);
    setTimeout(injectVisibleAccess, 1000);
    let tries = 0;
    const timer = setInterval(() => { injectVisibleAccess(); if (++tries > 8) clearInterval(timer); }, 1200);
  }

  window.openBusinessAssistantHubV4938 = hub;
  window.closeBusinessAssistantV4938 = closeModal;
  window.openBusinessAssistantConfigV4938 = function(type){ configForm({ interaction_type: type || "menu_order" }); };
  window.saveBusinessAssistantConfigV4938 = saveConfig;
  window.toggleBusinessAssistantMenuV4938 = toggleMenu;
  window.seedRosticeriaAssistantV4938 = seedRosticeria;
  window.editBusinessAssistantConfigV4938 = editConfig;
  window.openBusinessAssistantClientV4938 = clientView;
  window.startBusinessAssistantFlowV4938 = startFlow;
  window.updateBusinessAssistantOrderTotalV4938 = updateTotal;
  window.submitBusinessAssistantOrderV4938 = submitOrder;
  window.submitBusinessAssistantAppointmentV4938 = submitAppointment;
  window.submitBusinessAssistantMessageV4938 = submitMessage;
  window.openBusinessAssistantChatV4938 = openChat;
  window.sendBusinessAssistantChatV4938 = sendChat;
  window.openBusinessAssistantOwnerPanelV4938 = ownerPanel;
  window.updateBusinessAssistantStatusV4938 = updateStatus;
  window.openMembershipFromBusinessAssistantV4938 = membershipOpen;
  window.renderBusinessAssistantAccessV4938 = injectVisibleAccess;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.addEventListener("pageshow", () => setTimeout(injectVisibleAccess, 180));
  window.addEventListener("hashchange", () => setTimeout(injectVisibleAccess, 120));
})();
