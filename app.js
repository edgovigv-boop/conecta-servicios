const SUPABASE_URL = "https://qfneazokicmyrtqvukqv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVhem9raWNteXJ0cXZ1a3F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzA0MzUsImV4cCI6MjA5MzUwNjQzNX0.60AKW1IttWSPbRJ8n7Ca9vP5it5-yLyxiXaxDKjd5r0";

const OFFICE_INFO = {
  phone: "7225703145",
  note: "Atención solamente por WhatsApp para dudas, registros asistidos y seguimiento de publicaciones."
};

let currentSection = "inicio";
let jobsCache = [];
let helpersCache = [];
let adminJobsCache = [];
let adminHelpersCache = [];
let adminUnlocked = false;
let adminTab = "pedidos";
let isLoading = false;

// Acceso temporal para piloto. No es seguridad real: en la siguiente versión conviene usar Supabase Auth.
const ADMIN_PIN = "3145";
let adminRouteEnabled = false;
let lastHomeBackPress = 0;
let allowBrowserExit = false;
let homeExitGuardArmed = false;

const DEFAULT_STATE = "México";
const DEFAULT_MUNICIPALITY = "Chapultepec";
const DEFAULT_LOCALITY = "Chapultepec Centro";
const STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Guanajuato",
  "Guerrero", "Hidalgo", "Jalisco", "México", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

function createId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setSyncStatus(message, type = "") {
  const status = document.getElementById("syncStatus");
  if (!status) return;
  status.textContent = message;
  status.className = `sync-status ${type}`.trim();
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error ${response.status}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function loadRemoteData() {
  isLoading = true;
  renderLoadingStates();
  setSyncStatus("Conectando con la base de datos...");

  try {
    const [pedidos, ayudantes] = await Promise.all([
      supabaseRequest("pedidos?select=*&estado=eq.activo&order=creado_en.desc"),
      supabaseRequest("ayudantes?select=*&estado=eq.activo&order=creado_en.desc")
    ]);

    jobsCache = (pedidos || []).map(mapPedidoFromDb);
    helpersCache = (ayudantes || []).map(mapAyudanteFromDb);
    setSyncStatus("Datos en línea actualizados", "ok");
    renderAll();
  } catch (error) {
    console.error("Error conectando con Supabase", error);
    setSyncStatus("No se pudo conectar con la base de datos. Revisa Supabase o internet.", "error");
    renderAll();
    showToast("Error de conexión con Supabase");
  } finally {
    isLoading = false;
  }
}

function mapPedidoFromDb(row) {
  return {
    id: row.id || createId(),
    title: row.titulo || "Pedido sin título",
    category: row.categoria || "General",
    location: row.ubicacion || "Ubicación por confirmar",
    state: row.estado_nombre || row.estado_ubicacion || row.estado_geo || DEFAULT_STATE,
    municipality: row.municipio || DEFAULT_MUNICIPALITY,
    locality: row.localidad || row.colonia || DEFAULT_LOCALITY,
    date: row.fecha || "",
    budget: Number(row.presupuesto || 0),
    phone: row.contacto || "",
    description: row.descripcion || "",
    createdAt: row.creado_en || ""
  };
}

function mapAyudanteFromDb(row) {
  return {
    id: row.id || createId(),
    name: row.nombre || "Perfil sin nombre",
    service: row.servicio || "Servicio",
    category: row.categoria || "Servicio",
    location: row.zona || "Zona por confirmar",
    state: row.estado_nombre || row.estado_ubicacion || row.estado_geo || DEFAULT_STATE,
    municipality: row.municipio || DEFAULT_MUNICIPALITY,
    locality: row.localidad || row.colonia || DEFAULT_LOCALITY,
    availability: row.disponibilidad || "Disponibilidad por confirmar",
    phone: row.telefono || "",
    description: row.descripcion || "",
    highlighted: Boolean(row.destacado),
    createdAt: row.creado_en || ""
  };
}

function routeUrlForSection(id) {
  const params = new URLSearchParams(window.location.search);
  const adminMode = adminRouteEnabled || params.get("admin") === "1" || params.get("admin") === "true";
  const base = adminMode ? `${location.pathname}?admin=1` : location.pathname;
  return `${base}#${id}`;
}

function normalizeSectionFromHash(hashValue) {
  const raw = String(hashValue || "").replace("#", "");
  if (!raw || raw === "inicio-guard" || raw === "inicio-top") return "inicio";
  return raw;
}

function pushExitGuard(section = currentSection || "inicio") {
  // Estado extra para que el botón Atrás del celular no cierre la app al primer toque.
  history.pushState({ section, appGuard: true, ts: Date.now() }, "", routeUrlForSection(section === "inicio" ? "inicio-guard" : section));
  homeExitGuardArmed = section === "inicio";
}

function handleHomeBackAttempt() {
  const now = Date.now();
  if (now - lastHomeBackPress < 2600) {
    allowBrowserExit = true;
    homeExitGuardArmed = false;
    showToast("Saliendo de Conecta Servicios");
    setTimeout(() => history.back(), 80);
    return;
  }

  lastHomeBackPress = now;
  showToast("Presiona atrás otra vez para salir");
  pushExitGuard("inicio");
}

function showSection(id, pushToHistory = true) {
  lastHomeBackPress = 0;
  if (id === "admin" && !adminRouteEnabled) {
    id = "inicio";
    showToast("Acceso de administración oculto");
  }
  const target = document.getElementById(id);
  if (!target) return;

  if (pushToHistory && id !== currentSection) {
    history.pushState({ section: id }, "", routeUrlForSection(id));
  }

  currentSection = id;
  document.querySelectorAll(".section").forEach(section => section.classList.remove("active"));
  target.classList.add("active");

  const titles = {
    inicio: "Conecta Servicios",
    ofertas: "Pedidos publicados",
    publicar: "Publicar pedido",
    galeria: "Perfiles disponibles",
    registroAyudante: "Registrar ayudante",
    comoFunciona: "Cómo funciona",
    reglas: "Reglas y seguridad",
    avisoPrivacidad: "Aviso de Privacidad",
    terminos: "Términos y Condiciones",
    planes: "Planes y destacados",
    oficina: "Oficina de registro",
    admin: "Administración"
  };

  document.getElementById("mainTitle").textContent = titles[id] || "Conecta Servicios";
  document.getElementById("backButton").style.visibility = id === "inicio" ? "hidden" : "visible";
  document.querySelector(".app-shell").scrollTo({ top: 0, behavior: "smooth" });
  renderAll();
}

function goBack() {
  if (currentSection === "inicio") {
    handleHomeBackAttempt();
    return;
  }
  if (history.state && history.state.section) history.back();
  else showSection("inicio", false);
}

function formatDate(value) {
  if (!value) return "Fecha por confirmar";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha por confirmar";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function cleanPhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function publicFolio(prefix, id) {
  const raw = String(id || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const short = raw ? raw.slice(-6) : Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${short}`;
}

function pedidoFolio(jobOrRow) {
  return publicFolio("PED", jobOrRow?.id);
}

function ayudanteFolio(helperOrRow) {
  return publicFolio("AYU", helperOrRow?.id);
}

function lastFourPhone(phone) {
  const cleaned = cleanPhone(phone);
  return cleaned.slice(-4);
}

function whatsappLink(phone, message) {
  const cleaned = cleanPhone(phone);
  const withCountry = cleaned.length === 10 ? `52${cleaned}` : cleaned;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

function maskPhone(phone) {
  const cleaned = cleanPhone(phone);
  if (!cleaned) return "xxxxxx----";
  const lastFour = cleaned.slice(-4);
  return `xxxxxx${lastFour}`;
}

function officeNewJobMessage(job) {
  return `Nuevo pedido en revisión en Conecta Servicios:

Folio: ${pedidoFolio(job)}
Pedido: ${job.title}
Categoría: ${job.category}
Ubicación: ${job.locality}, ${job.municipality}, ${job.state}
Zona: ${job.location}
Fecha: ${formatDate(job.date)}
Presupuesto: $${Number(job.budget || 0).toLocaleString("es-MX")}
Contacto completo: ${cleanPhone(job.phone)}
Últimos 4: ${lastFourPhone(job.phone)}
ID interno: ${job.id}

Favor de revisar y aprobar desde el panel administrador.`;
}

function officeNewHelperMessage(helper) {
  return `Nuevo perfil en revisión en Conecta Servicios:

Folio: ${ayudanteFolio(helper)}
Nombre: ${helper.name}
Servicio: ${helper.service}
Categoría: ${helper.category}
Ubicación: ${helper.locality}, ${helper.municipality}, ${helper.state}
Zona: ${helper.location}
Disponibilidad: ${helper.availability}
Contacto completo: ${cleanPhone(helper.phone)}
Últimos 4: ${lastFourPhone(helper.phone)}
ID interno: ${helper.id}

Favor de revisar y aprobar desde el panel administrador.`;
}

function notifyOfficeByWhatsapp(kind, item) {
  const message = kind === "pedido" ? officeNewJobMessage(item) : officeNewHelperMessage(item);
  const link = whatsappLink(OFFICE_INFO.phone, message);
  window.location.href = link;
}

function planWhatsappMessage(type) {
  const messages = {
    perfil: `Hola, quiero solicitar información para activar un perfil destacado en Conecta Servicios.

Nombre:
Municipio:
Servicio:
Teléfono:`,
    publicacion: `Hola, quiero solicitar información para destacar una publicación en Conecta Servicios.

Tipo de publicación:
Municipio:
Fecha aproximada:
Teléfono:`,
    registro: `Hola, quiero apoyo de la oficina para registrar o actualizar información en Conecta Servicios.

Nombre:
Municipio:
Qué necesito:`
  };
  return messages[type] || "Hola, quiero información sobre planes y destacados de Conecta Servicios.";
}

function renderPlanLinks() {
  document.querySelectorAll("[data-plan-link]").forEach(link => {
    const type = link.getAttribute("data-plan-link");
    link.href = whatsappLink(OFFICE_INFO.phone, planWhatsappMessage(type));
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}


function normalizeText(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchesSearch(item, search) {
  const query = normalizeText(search);
  if (!query) return true;
  return normalizeText(Object.values(item).join(" ")).includes(query);
}

function matchesLocation(item, prefix) {
  const selectedState = document.getElementById(`${prefix}StateFilter`)?.value || "";
  const selectedMunicipality = document.getElementById(`${prefix}MunicipalityFilter`)?.value || "";

  const itemState = item.state || DEFAULT_STATE;
  const itemMunicipality = item.municipality || DEFAULT_MUNICIPALITY;

  const stateOk = !selectedState || normalizeText(itemState) === normalizeText(selectedState);
  const municipalityOk = !selectedMunicipality || normalizeText(itemMunicipality).includes(normalizeText(selectedMunicipality));
  return stateOk && municipalityOk;
}

function locationText(item) {
  const parts = [item.locality, item.municipality, item.state].filter(Boolean);
  return parts.length ? parts.join(", ") : item.location;
}

function populateStateSelects() {
  document.querySelectorAll("select[data-state-select]").forEach(select => {
    const keepBlank = select.dataset.blank === "true";
    const current = select.value || select.dataset.default || DEFAULT_STATE;
    select.innerHTML = `${keepBlank ? '<option value="">Todo México</option>' : ''}${STATES.map(state => `<option value="${escapeHtml(state)}">${escapeHtml(state)}</option>`).join("")}`;

    if (keepBlank && current === "") select.value = "";
    else select.value = STATES.includes(current) ? current : DEFAULT_STATE;
  });

  syncMunicipalityInput("job");
  syncMunicipalityInput("helper");
}

function syncMunicipalityInput(prefix) {
  const state = document.getElementById(`${prefix}StateFilter`);
  const municipality = document.getElementById(`${prefix}MunicipalityFilter`);
  if (!state || !municipality) return;

  if (!state.value) {
    municipality.value = "";
    municipality.disabled = true;
    municipality.placeholder = "Todos los municipios";
  } else {
    municipality.disabled = false;
    municipality.placeholder = `Ej. ${state.value === DEFAULT_STATE ? DEFAULT_MUNICIPALITY : "Cuernavaca"}`;
  }
}

function handleStateFilterChange(prefix) {
  syncMunicipalityInput(prefix);
  if (prefix === "job") renderJobs();
  if (prefix === "helper") renderHelpers();
}

function getLocationFilterLabel(prefix) {
  const selectedState = document.getElementById(`${prefix}StateFilter`)?.value || "";
  const selectedMunicipality = document.getElementById(`${prefix}MunicipalityFilter`)?.value.trim() || "";

  if (!selectedState) return "Mostrando resultados para: Todo México";
  if (!selectedMunicipality) return `Mostrando resultados para: ${selectedState}`;
  return `Mostrando resultados para: ${selectedMunicipality}, ${selectedState}`;
}

function updateLocationFilterSummary(prefix, count) {
  const summary = document.getElementById(`${prefix}FilterSummary`);
  if (!summary) return;
  const label = getLocationFilterLabel(prefix);
  const suffix = typeof count === "number" ? ` • ${count} resultado${count === 1 ? "" : "s"}` : "";
  summary.textContent = `${label}${suffix}`;
}

function resetLocationFilters(prefix) {
  const state = document.getElementById(`${prefix}StateFilter`);
  const municipality = document.getElementById(`${prefix}MunicipalityFilter`);
  if (state) state.value = DEFAULT_STATE;
  if (municipality) municipality.value = DEFAULT_MUNICIPALITY;
  syncMunicipalityInput(prefix);
  if (prefix === "job") renderJobs();
  if (prefix === "helper") renderHelpers();
}

function renderLoadingStates() {
  const jobsList = document.getElementById("jobsList");
  const helpersList = document.getElementById("helpersList");
  if (jobsList) jobsList.innerHTML = `<div class="list-empty"><strong>Cargando pedidos...</strong><p>Consultando la base de datos en línea.</p></div>`;
  if (helpersList) helpersList.innerHTML = `<div class="list-empty"><strong>Cargando perfiles...</strong><p>Consultando la base de datos en línea.</p></div>`;
}

function renderCounters() {
  document.getElementById("jobsCount").textContent = jobsCache.length;
  document.getElementById("helpersCount").textContent = helpersCache.length;
}

function requestPedidoAtendido(jobId) {
  const job = jobsCache.find(item => item.id === jobId);
  if (!job) {
    showToast("No se encontró el pedido");
    return;
  }

  const folio = pedidoFolio(job);
  const entered = prompt(`Para solicitar que la oficina marque este pedido como atendido, escribe los últimos 4 dígitos del teléfono con el que se publicó.\n\nFolio: ${folio}`);
  if (entered === null) return;

  const normalized = String(entered || "").replace(/\D/g, "");
  if (normalized !== lastFourPhone(job.phone)) {
    alert("Los últimos 4 dígitos no coinciden con el teléfono registrado en este pedido. Por seguridad, no se abrirá la solicitud.");
    return;
  }

  const message = `Hola, quiero solicitar que revisen y marquen como atendido este pedido en Conecta Servicios.\n\nFolio: ${folio}\nPedido: ${job.title}\nUbicación: ${locationText(job)}\nContacto registrado: ${maskPhone(job.phone)}\nÚltimos 4 dígitos verificados: ${lastFourPhone(job.phone)}\n\nEntiendo que la oficina revisa y confirma el cambio desde administración.`;
  window.open(whatsappLink(OFFICE_INFO.phone, message), "_blank", "noopener");
}

function requestModification(kind, id) {
  const isJob = kind === "pedido";
  const item = isJob ? jobsCache.find(row => row.id === id) : helpersCache.find(row => row.id === id);
  if (!item) {
    showToast("No se encontró la publicación");
    return;
  }

  const folio = isJob ? pedidoFolio(item) : ayudanteFolio(item);
  const title = isJob ? item.title : item.name;
  const typeLabel = isJob ? "pedido" : "perfil";
  const entered = prompt(`Para solicitar modificación de este ${typeLabel}, escribe los últimos 4 dígitos del teléfono registrado.\n\nFolio: ${folio}`);
  if (entered === null) return;

  const normalized = String(entered || "").replace(/\D/g, "");
  if (normalized !== lastFourPhone(item.phone)) {
    alert("Los últimos 4 dígitos no coinciden con el teléfono registrado. Por seguridad, no se abrirá la solicitud.");
    return;
  }

  const message = `Hola, quiero solicitar una modificación de mi ${typeLabel} en Conecta Servicios.\n\nFolio: ${folio}\nPublicación: ${title}\nUbicación: ${locationText(item)}\nContacto registrado: ${maskPhone(item.phone)}\nÚltimos 4 dígitos verificados: ${lastFourPhone(item.phone)}\n\nCambio solicitado:\n`;
  window.open(whatsappLink(OFFICE_INFO.phone, message), "_blank", "noopener");
}

function renderJobs() {
  syncMunicipalityInput("job");
  const list = document.getElementById("jobsList");
  if (!list) return;
  if (isLoading) return;

  const search = document.getElementById("jobSearch")?.value || "";
  const jobs = jobsCache.filter(job => matchesSearch(job, search) && matchesLocation(job, "job"));
  updateLocationFilterSummary("job", jobs.length);

  if (!jobs.length) {
    list.innerHTML = `<div class="list-empty"><strong>No hay pedidos publicados todavía.</strong><p>Publica el primer pedido o prueba con otra búsqueda.</p></div>`;
    return;
  }

  list.innerHTML = jobs.map(job => {
    const message = `Hola, vi tu pedido en Conecta Servicios: "${job.title}". Me interesa ayudarte. ¿Me compartes más detalles?`;
    return `
      <article class="card">
        <div class="card-title">
          <strong>🔍 ${escapeHtml(job.title)}</strong>
          <span class="price-tag">$${Number(job.budget || 0).toLocaleString("es-MX")}</span>
        </div>
        <div class="folio-line">Folio: <strong>${escapeHtml(pedidoFolio(job))}</strong></div>
        <span class="tag">${escapeHtml(job.category || "General")}</span>
        <p class="meta">📍 ${escapeHtml(locationText(job))}</p>
        <p class="meta small-meta">Zona: ${escapeHtml(job.location)}</p>
        <p class="meta">📅 ${formatDate(job.date)}</p>
        ${job.description ? `<p class="description">${escapeHtml(job.description)}</p>` : ""}
        <p class="masked-contact">☎ Contacto: ${escapeHtml(maskPhone(job.phone))}</p>
        <div class="privacy-note">El número está parcialmente oculto en la app. Al abrir WhatsApp, la conversación puede mostrar el número real.</div>
        <div class="card-actions">
          <a class="whatsapp" href="${whatsappLink(job.phone, message)}" target="_blank" rel="noopener">Enviar WhatsApp</a>
          <button class="request-done" type="button" onclick="requestPedidoAtendido('${job.id}')">Solicitar atendido</button>
          <button class="request-edit" type="button" onclick="requestModification('pedido', '${job.id}')">Solicitar modificación</button>
        </div>
      </article>`;
  }).join("");
}

function renderHelpers() {
  syncMunicipalityInput("helper");
  const list = document.getElementById("helpersList");
  if (!list) return;
  if (isLoading) return;

  const search = document.getElementById("helperSearch")?.value || "";
  const helpers = helpersCache.filter(helper => matchesSearch(helper, search) && matchesLocation(helper, "helper"));
  updateLocationFilterSummary("helper", helpers.length);

  if (!helpers.length) {
    list.innerHTML = `<div class="list-empty"><strong>No hay perfiles publicados todavía.</strong><p>Registra el primer perfil o prueba con otra búsqueda.</p></div>`;
    return;
  }

  list.innerHTML = helpers.map(helper => {
    const message = `Hola ${helper.name}, vi tu perfil en Conecta Servicios. Me interesa tu servicio de ${helper.service}.`;
    return `
      <article class="card ${helper.highlighted ? "highlighted" : ""}">
        <div class="card-title"><strong>🧰 ${escapeHtml(helper.name)}</strong></div>
        <div class="folio-line">Folio: <strong>${escapeHtml(ayudanteFolio(helper))}</strong></div>
        <span class="tag">${escapeHtml(helper.category || "Servicio")}</span>
        <p class="meta">🛠️ ${escapeHtml(helper.service)}</p>
        <p class="meta">📍 ${escapeHtml(locationText(helper))}</p>
        <p class="meta small-meta">Zona: ${escapeHtml(helper.location)}</p>
        <p class="meta">🕒 ${escapeHtml(helper.availability)}</p>
        ${helper.description ? `<p class="description">${escapeHtml(helper.description)}</p>` : ""}
        <p class="masked-contact">☎ Contacto: ${escapeHtml(maskPhone(helper.phone))}</p>
        <div class="privacy-note">El número está parcialmente oculto en la app. Al abrir WhatsApp, la conversación puede mostrar el número real.</div>
        <div class="card-actions">
          <a class="whatsapp" href="${whatsappLink(helper.phone, message)}" target="_blank" rel="noopener">Enviar WhatsApp</a>
          <button class="request-edit" type="button" onclick="requestModification('ayudante', '${helper.id}')">Solicitar modificación</button>
        </div>
      </article>`;
  }).join("");
}

function renderOfficeInfo() {
  const officeInfo = document.getElementById("officeInfo");
  if (!officeInfo) return;
  const message = "Hola, quiero atención de Conecta Servicios por WhatsApp.";

  officeInfo.innerHTML = `
    <strong>Atención de Conecta Servicios</strong>
    <p class="muted">${escapeHtml(OFFICE_INFO.note)}</p>
    <a class="office-whatsapp" href="${whatsappLink(OFFICE_INFO.phone, message)}" target="_blank" rel="noopener">Enviar WhatsApp</a>
    <p class="muted edit-hint">Versión 3.7.3: filtros flexibles, folios, solicitud de atendido verificada y edición desde administración.</p>`;
}

function setupAdminAccess() {
  const adminButton = document.getElementById("adminAccessButton");
  const params = new URLSearchParams(window.location.search);
  adminRouteEnabled = params.get("admin") === "1" || params.get("admin") === "true";
  if (adminButton) adminButton.classList.toggle("hidden", !adminRouteEnabled);
}


function renderAll() {
  renderCounters();
  renderJobs();
  renderHelpers();
  renderOfficeInfo();
  renderPlanLinks();
  updateLocationFilterSummary("job");
  updateLocationFilterSummary("helper");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function createPedido(newJob) {
  const payload = {
    titulo: newJob.title,
    categoria: newJob.category,
    ubicacion: newJob.location,
    estado_nombre: newJob.state,
    municipio: newJob.municipality,
    localidad: newJob.locality,
    fecha: newJob.date,
    presupuesto: newJob.budget,
    descripcion: newJob.description,
    contacto: newJob.phone,
    estado: "revision"
  };

  const inserted = await supabaseRequest("pedidos", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return mapPedidoFromDb(inserted?.[0] || payload);
}

async function createAyudante(newHelper) {
  const payload = {
    nombre: newHelper.name,
    servicio: newHelper.service,
    categoria: newHelper.category,
    zona: newHelper.location,
    estado_nombre: newHelper.state,
    municipio: newHelper.municipality,
    localidad: newHelper.locality,
    disponibilidad: newHelper.availability,
    telefono: newHelper.phone,
    descripcion: newHelper.description,
    destacado: false,
    estado: "revision"
  };

  const inserted = await supabaseRequest("ayudantes", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return mapAyudanteFromDb(inserted?.[0] || payload);
}

function setSubmitState(form, isSubmitting) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  button.disabled = isSubmitting;
  button.textContent = isSubmitting ? "Guardando..." : button.dataset.originalText;
}


function estadoLabel(estado) {
  const value = estado || "activo";
  const labels = { activo: "Aprobado", oculto: "Oculto", revision: "En revisión", atendido: "Atendido" };
  return labels[value] || value;
}

function renderStatusBadge(estado) {
  const value = estado || "activo";
  return `<span class="status-badge ${escapeHtml(value)}">${escapeHtml(estadoLabel(value))}</span>`;
}

async function loadAdminData() {
  if (!adminUnlocked) return;
  const pedidosBox = document.getElementById("adminPedidos");
  const ayudantesBox = document.getElementById("adminAyudantes");
  if (pedidosBox) pedidosBox.innerHTML = `<div class="list-empty"><strong>Cargando pedidos...</strong></div>`;
  if (ayudantesBox) ayudantesBox.innerHTML = `<div class="list-empty"><strong>Cargando perfiles...</strong></div>`;

  try {
    const [pedidos, ayudantes] = await Promise.all([
      supabaseRequest("pedidos?select=*&order=creado_en.desc"),
      supabaseRequest("ayudantes?select=*&order=creado_en.desc")
    ]);
    adminJobsCache = pedidos || [];
    adminHelpersCache = ayudantes || [];
    renderAdminLists();
    showToast("Administración actualizada");
  } catch (error) {
    console.error("Error cargando administración", error);
    alert("No se pudo cargar el panel. Revisa que hayas corrido el SQL de v3.2 en Supabase.");
  }
}

function unlockAdmin() {
  const input = document.getElementById("adminPinInput");
  const pin = input?.value.trim();
  if (pin !== ADMIN_PIN) {
    showToast("PIN incorrecto");
    return;
  }
  adminUnlocked = true;
  document.getElementById("adminLogin")?.classList.add("hidden");
  document.getElementById("adminPanel")?.classList.remove("hidden");
  loadAdminData();
}

function lockAdmin() {
  adminUnlocked = false;
  document.getElementById("adminPinInput").value = "";
  document.getElementById("adminLogin")?.classList.remove("hidden");
  document.getElementById("adminPanel")?.classList.add("hidden");
  showToast("Admin cerrado");
}

function setAdminTab(tab) {
  adminTab = tab;
  document.getElementById("adminTabPedidos")?.classList.toggle("active", tab === "pedidos");
  document.getElementById("adminTabAyudantes")?.classList.toggle("active", tab === "ayudantes");
  document.getElementById("adminPedidos")?.classList.toggle("hidden", tab !== "pedidos");
  document.getElementById("adminAyudantes")?.classList.toggle("hidden", tab !== "ayudantes");
}

function renderAdminLists() {
  if (!adminUnlocked) return;
  renderAdminPedidos();
  renderAdminAyudantes();
}

function adminPedidoMatchesSearch(row, search) {
  const query = normalizeText(search);
  if (!query) return true;
  const searchable = [
    row.titulo, row.categoria, row.ubicacion, row.estado_nombre, row.municipio, row.localidad,
    row.fecha, row.presupuesto, row.descripcion, row.contacto, row.estado,
    pedidoFolio(row), lastFourPhone(row.contacto)
  ].join(" ");
  return normalizeText(searchable).includes(query);
}

function adminAyudanteMatchesSearch(row, search) {
  const query = normalizeText(search);
  if (!query) return true;
  const searchable = [
    row.nombre, row.servicio, row.categoria, row.zona, row.estado_nombre, row.municipio, row.localidad,
    row.disponibilidad, row.telefono, row.descripcion, row.estado,
    ayudanteFolio(row), lastFourPhone(row.telefono)
  ].join(" ");
  return normalizeText(searchable).includes(query);
}

function renderAdminPedidos() {
  const list = document.getElementById("adminPedidos");
  if (!list) return;
  const search = document.getElementById("adminSearch")?.value || "";
  const rows = adminJobsCache.filter(row => adminPedidoMatchesSearch(row, search));
  if (!rows.length) {
    list.innerHTML = `<div class="list-empty"><strong>No hay pedidos para mostrar.</strong></div>`;
    return;
  }
  list.innerHTML = rows.map(row => `
    <article class="card admin-card">
      <div class="card-title">
        <strong>🔍 ${escapeHtml(row.titulo || "Pedido sin título")}</strong>
        ${renderStatusBadge(row.estado)}
      </div>
      <div class="folio-line">Folio: <strong>${escapeHtml(pedidoFolio(row))}</strong> · Últimos 4: <strong>${escapeHtml(lastFourPhone(row.contacto))}</strong></div>
      <span class="tag">${escapeHtml(row.categoria || "General")}</span>
      <p class="meta">📍 ${escapeHtml([row.localidad, row.municipio, row.estado_nombre].filter(Boolean).join(", ") || row.ubicacion || "")}</p>
      <p class="meta small-meta">Zona: ${escapeHtml(row.ubicacion || "")}</p>
      <p class="meta">📅 ${formatDate(row.fecha)}</p>
      <p class="meta">☎ ${escapeHtml(row.contacto || "")}</p>
      ${row.descripcion ? `<p class="description">${escapeHtml(row.descripcion)}</p>` : ""}
      <div class="admin-card-actions">
        <button class="edit-button" onclick="editPedido('${row.id}')">Editar</button>
        <button onclick="updatePedidoEstado('${row.id}', 'activo')">Aprobar</button>
        <button onclick="updatePedidoEstado('${row.id}', 'revision')">Revisión</button>
        <button class="done-button" onclick="updatePedidoEstado('${row.id}', 'atendido')">Atendido</button>
        <button class="danger-button" onclick="updatePedidoEstado('${row.id}', 'oculto')">Ocultar</button>
      </div>
    </article>
  `).join("");
}

function renderAdminAyudantes() {
  const list = document.getElementById("adminAyudantes");
  if (!list) return;
  const search = document.getElementById("adminSearch")?.value || "";
  const rows = adminHelpersCache.filter(row => adminAyudanteMatchesSearch(row, search));
  if (!rows.length) {
    list.innerHTML = `<div class="list-empty"><strong>No hay perfiles para mostrar.</strong></div>`;
    return;
  }
  list.innerHTML = rows.map(row => `
    <article class="card admin-card">
      <div class="card-title">
        <strong>🧰 ${escapeHtml(row.nombre || "Perfil sin nombre")}</strong>
        ${renderStatusBadge(row.estado)}
      </div>
      <div class="folio-line">Folio: <strong>${escapeHtml(ayudanteFolio(row))}</strong> · Últimos 4: <strong>${escapeHtml(lastFourPhone(row.telefono))}</strong></div>
      <span class="tag">${escapeHtml(row.categoria || "Servicio")}</span>
      <p class="meta">🛠️ ${escapeHtml(row.servicio || "")}</p>
      <p class="meta">📍 ${escapeHtml([row.localidad, row.municipio, row.estado_nombre].filter(Boolean).join(", ") || row.zona || "")}</p>
      <p class="meta small-meta">Zona: ${escapeHtml(row.zona || "")}</p>
      <p class="meta">☎ ${escapeHtml(row.telefono || "")}</p>
      ${row.descripcion ? `<p class="description">${escapeHtml(row.descripcion)}</p>` : ""}
      <div class="admin-card-actions">
        <button class="edit-button" onclick="editAyudante('${row.id}')">Editar</button>
        <button onclick="updateAyudanteEstado('${row.id}', 'activo')">Aprobar</button>
        <button onclick="updateAyudanteEstado('${row.id}', 'revision')">Revisión</button>
        <button class="danger-button" onclick="updateAyudanteEstado('${row.id}', 'oculto')">Ocultar</button>
      </div>
    </article>
  `).join("");
}


function promptRequired(label, currentValue) {
  const value = prompt(label, currentValue || "");
  if (value === null) return null;
  return value.trim();
}

function promptOptional(label, currentValue) {
  const value = prompt(label, currentValue || "");
  if (value === null) return null;
  return value.trim();
}

async function editPedido(id) {
  if (!adminUnlocked) return;
  const row = adminJobsCache.find(item => item.id === id);
  if (!row) {
    showToast("No se encontró el pedido");
    return;
  }

  const folio = pedidoFolio(row);
  const ok = confirm(`Editar pedido ${folio}.\n\nSe abrirán campos uno por uno. Si presionas Cancelar, no se guardará nada.`);
  if (!ok) return;

  const titulo = promptRequired("Título del pedido", row.titulo || "");
  if (titulo === null || !titulo) return alert("El título no puede quedar vacío.");
  const categoria = promptRequired("Categoría", row.categoria || "General");
  if (categoria === null || !categoria) return alert("La categoría no puede quedar vacía.");
  const estado_nombre = promptRequired("Estado", row.estado_nombre || DEFAULT_STATE);
  if (estado_nombre === null || !estado_nombre) return alert("El estado no puede quedar vacío.");
  const municipio = promptRequired("Municipio", row.municipio || DEFAULT_MUNICIPALITY);
  if (municipio === null || !municipio) return alert("El municipio no puede quedar vacío.");
  const localidad = promptRequired("Colonia o localidad", row.localidad || DEFAULT_LOCALITY);
  if (localidad === null || !localidad) return alert("La localidad no puede quedar vacía.");
  const ubicacion = promptRequired("Zona o referencia", row.ubicacion || "");
  if (ubicacion === null || !ubicacion) return alert("La zona o referencia no puede quedar vacía.");
  const fecha = promptOptional("Fecha y hora. Puedes dejar el valor actual o cambiarlo en formato del navegador.", row.fecha || "");
  if (fecha === null) return;
  const presupuestoText = promptRequired("Presupuesto sugerido", String(row.presupuesto || 0));
  if (presupuestoText === null) return;
  const presupuesto = Number(String(presupuestoText).replace(/[^0-9.]/g, ""));
  if (Number.isNaN(presupuesto)) return alert("El presupuesto debe ser numérico.");
  const contacto = promptRequired("Teléfono o WhatsApp", row.contacto || "");
  if (contacto === null || !cleanPhone(contacto)) return alert("El teléfono no puede quedar vacío.");
  const descripcion = promptOptional("Descripción", row.descripcion || "");
  if (descripcion === null) return;

  await updateRegistro("pedidos", id, {
    titulo, categoria, estado_nombre, municipio, localidad, ubicacion, fecha, presupuesto, contacto, descripcion
  });
}

async function editAyudante(id) {
  if (!adminUnlocked) return;
  const row = adminHelpersCache.find(item => item.id === id);
  if (!row) {
    showToast("No se encontró el perfil");
    return;
  }

  const folio = ayudanteFolio(row);
  const ok = confirm(`Editar perfil ${folio}.\n\nSe abrirán campos uno por uno. Si presionas Cancelar, no se guardará nada.`);
  if (!ok) return;

  const nombre = promptRequired("Nombre", row.nombre || "");
  if (nombre === null || !nombre) return alert("El nombre no puede quedar vacío.");
  const servicio = promptRequired("Servicio principal", row.servicio || "");
  if (servicio === null || !servicio) return alert("El servicio no puede quedar vacío.");
  const categoria = promptRequired("Categoría", row.categoria || "Servicio");
  if (categoria === null || !categoria) return alert("La categoría no puede quedar vacía.");
  const estado_nombre = promptRequired("Estado", row.estado_nombre || DEFAULT_STATE);
  if (estado_nombre === null || !estado_nombre) return alert("El estado no puede quedar vacío.");
  const municipio = promptRequired("Municipio", row.municipio || DEFAULT_MUNICIPALITY);
  if (municipio === null || !municipio) return alert("El municipio no puede quedar vacío.");
  const localidad = promptRequired("Colonia o localidad", row.localidad || DEFAULT_LOCALITY);
  if (localidad === null || !localidad) return alert("La localidad no puede quedar vacía.");
  const zona = promptRequired("Zona donde trabaja o referencia", row.zona || "");
  if (zona === null || !zona) return alert("La zona no puede quedar vacía.");
  const disponibilidad = promptRequired("Disponibilidad", row.disponibilidad || "");
  if (disponibilidad === null || !disponibilidad) return alert("La disponibilidad no puede quedar vacía.");
  const telefono = promptRequired("Teléfono o WhatsApp", row.telefono || "");
  if (telefono === null || !cleanPhone(telefono)) return alert("El teléfono no puede quedar vacío.");
  const descripcion = promptOptional("Descripción", row.descripcion || "");
  if (descripcion === null) return;
  const destacadoText = promptOptional("¿Perfil destacado? Escribe sí o no", row.destacado ? "sí" : "no");
  if (destacadoText === null) return;
  const destacado = ["si", "sí", "s", "yes", "true", "1"].includes(normalizeText(destacadoText));

  await updateRegistro("ayudantes", id, {
    nombre, servicio, categoria, estado_nombre, municipio, localidad, zona, disponibilidad, telefono, descripcion, destacado
  });
}

async function updateRegistro(table, id, payload) {
  if (!adminUnlocked) return;
  const ok = confirm("¿Guardar los cambios de esta publicación?");
  if (!ok) return;

  try {
    await supabaseRequest(`${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    showToast("Cambios guardados");
    await Promise.all([loadRemoteData(), loadAdminData()]);
  } catch (error) {
    console.error("Error guardando cambios", error);
    alert("No se pudieron guardar los cambios. Revisa permisos de Supabase o conexión.");
  }
}

async function updatePedidoEstado(id, estado) {
  await updateEstado("pedidos", id, estado);
}

async function updateAyudanteEstado(id, estado) {
  await updateEstado("ayudantes", id, estado);
}

async function updateEstado(table, id, estado) {
  if (!adminUnlocked) return;
  const label = estadoLabel(estado).toLowerCase();
  const ok = confirm(`¿Cambiar este registro a "${label}"?`);
  if (!ok) return;

  try {
    await supabaseRequest(`${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ estado })
    });
    showToast(estado === "activo" ? "Registro aprobado" : "Estado actualizado");
    await Promise.all([loadRemoteData(), loadAdminData()]);
  } catch (error) {
    console.error("Error actualizando estado", error);
    alert("No se pudo actualizar. Revisa que hayas corrido el SQL de permisos de v3.2 en Supabase.");
  }
}

function setupForms() {
  const jobButton = document.querySelector('#jobForm button[type="submit"]');
  const helperButton = document.querySelector('#helperForm button[type="submit"]');
  if (jobButton) jobButton.dataset.originalText = jobButton.textContent;
  if (helperButton) helperButton.dataset.originalText = helperButton.textContent;

  document.getElementById("jobForm").addEventListener("submit", async event => {
    event.preventDefault();
    const confirmSend = confirm("Tu pedido será enviado a revisión antes de aparecer públicamente.\n\n¿Deseas continuar?");
    if (!confirmSend) return;

    const form = event.target;
    setSubmitState(form, true);

    const newJob = {
      title: document.getElementById("jobTitle").value.trim(),
      category: document.getElementById("jobCategory").value,
      state: document.getElementById("jobState").value || DEFAULT_STATE,
      municipality: document.getElementById("jobMunicipality").value.trim() || DEFAULT_MUNICIPALITY,
      locality: document.getElementById("jobLocality").value.trim() || DEFAULT_LOCALITY,
      location: document.getElementById("jobLocation").value.trim(),
      date: document.getElementById("jobDate").value,
      budget: Number(document.getElementById("jobBudget").value),
      phone: document.getElementById("jobPhone").value.trim(),
      description: document.getElementById("jobDescription").value.trim()
    };

    try {
      const savedJob = await createPedido(newJob);
      jobsCache.unshift(savedJob);
      form.reset();
      showToast("Pedido enviado a revisión");
      showSection("ofertas");
      await loadRemoteData();
      alert("Tu pedido fue recibido. Ahora se abrirá WhatsApp con un aviso listo para la oficina. Solo toca enviar para acelerar la revisión.");
      notifyOfficeByWhatsapp("pedido", savedJob);
    } catch (error) {
      console.error("Error al publicar pedido", error);
      alert("No se pudo publicar el pedido. Revisa la conexión o las políticas de Supabase.");
    } finally {
      setSubmitState(form, false);
    }
  });

  document.getElementById("helperForm").addEventListener("submit", async event => {
    event.preventDefault();
    const confirmSend = confirm("Tu perfil será enviado a revisión antes de aparecer públicamente.\n\n¿Deseas continuar?");
    if (!confirmSend) return;

    const form = event.target;
    setSubmitState(form, true);

    const newHelper = {
      name: document.getElementById("helperName").value.trim(),
      service: document.getElementById("helperService").value.trim(),
      category: document.getElementById("helperCategory").value,
      state: document.getElementById("helperState").value || DEFAULT_STATE,
      municipality: document.getElementById("helperMunicipality").value.trim() || DEFAULT_MUNICIPALITY,
      locality: document.getElementById("helperLocality").value.trim() || DEFAULT_LOCALITY,
      location: document.getElementById("helperLocation").value.trim(),
      availability: document.getElementById("helperAvailability").value.trim(),
      phone: document.getElementById("helperPhone").value.trim(),
      description: document.getElementById("helperDescription").value.trim()
    };

    try {
      const savedHelper = await createAyudante(newHelper);
      helpersCache.unshift(savedHelper);
      form.reset();
      showToast("Perfil enviado a revisión");
      showSection("galeria");
      await loadRemoteData();
      alert("Tu perfil fue recibido. Ahora se abrirá WhatsApp con un aviso listo para la oficina. Solo toca enviar para acelerar la revisión.");
      notifyOfficeByWhatsapp("ayudante", savedHelper);
    } catch (error) {
      console.error("Error al registrar perfil", error);
      alert("No se pudo registrar el perfil. Revisa la conexión o las políticas de Supabase.");
    } finally {
      setSubmitState(form, false);
    }
  });
}

window.addEventListener("popstate", event => {
  if (allowBrowserExit) return;
  const section = event.state?.section || normalizeSectionFromHash(location.hash) || "inicio";

  if (currentSection === "inicio" || section === "inicio") {
    handleHomeBackAttempt();
    return;
  }

  showSection(section, false);
});

window.addEventListener("beforeunload", event => {
  if (allowBrowserExit) return;
  if (currentSection === "inicio") {
    event.preventDefault();
    event.returnValue = "";
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const adminMode = params.get("admin") === "1" || params.get("admin") === "true";
  const hashSection = normalizeSectionFromHash(location.hash);
  const initialSection = adminMode ? "admin" : (hashSection === "admin" ? "inicio" : hashSection || "inicio");
  adminRouteEnabled = adminMode;

  // Base + guard: el primer botón Atrás del celular muestra aviso; el segundo permite salir.
  history.replaceState({ section: "inicio", homeBase: true }, "", routeUrlForSection("inicio"));
  pushExitGuard("inicio");
  if (initialSection !== "inicio") {
    history.pushState({ section: initialSection, appGuard: true }, "", routeUrlForSection(initialSection));
    homeExitGuardArmed = false;
  }

  populateStateSelects();
  setupForms();
  setupAdminAccess();
  showSection(initialSection, false);
  await loadRemoteData();
});
