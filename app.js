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

function showSection(id, pushToHistory = true) {
  if (id === "admin" && !adminRouteEnabled) {
    id = "inicio";
    showToast("Acceso de administración oculto");
  }
  const target = document.getElementById(id);
  if (!target) return;

  if (pushToHistory && id !== currentSection) {
    history.pushState({ section: id }, "", `#${id}`);
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
    oficina: "Oficina de registro",
    admin: "Administración"
  };

  document.getElementById("mainTitle").textContent = titles[id] || "Conecta Servicios";
  document.getElementById("backButton").style.visibility = id === "inicio" ? "hidden" : "visible";
  document.querySelector(".app-shell").scrollTo({ top: 0, behavior: "smooth" });
  renderAll();
}

function goBack() {
  if (currentSection === "inicio") return;
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

function attendedMessage(job) {
  return `Hola, quiero marcar como atendido este pedido de Conecta Servicios:

Pedido: ${job.title}
Municipio: ${job.municipality}
Localidad: ${job.locality}
Zona: ${job.location}
Contacto: ${maskPhone(job.phone)}
ID: ${job.id}

Ya fue atendido y solicito que deje de aparecer públicamente.`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

function processPayment(amount, successMsg) {
  const confirmPay = confirm(`¿Deseas realizar el pago simbólico de $${amount} pesos?\n\nEsta versión todavía usa pago simulado.`);
  if (confirmPay) {
    showToast("Pago simulado aprobado");
    setTimeout(() => {
      alert(successMsg);
      showSection("inicio");
    }, 650);
  }
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
    select.innerHTML = `${keepBlank ? '<option value="">Todos los estados</option>' : ''}${STATES.map(state => `<option value="${escapeHtml(state)}">${escapeHtml(state)}</option>`).join("")}`;
    select.value = STATES.includes(current) ? current : DEFAULT_STATE;
  });
}

function getLocationFilterLabel(prefix) {
  const selectedState = document.getElementById(`${prefix}StateFilter`)?.value || "Todos los estados";
  const selectedMunicipality = document.getElementById(`${prefix}MunicipalityFilter`)?.value.trim() || "todos los municipios";

  if (!selectedState && !selectedMunicipality) return "Mostrando resultados de todas las ubicaciones";
  if (!selectedState) return `Mostrando resultados para: ${selectedMunicipality}`;
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

function renderJobs() {
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
        <span class="tag">${escapeHtml(job.category || "General")}</span>
        <p class="meta">📍 ${escapeHtml(locationText(job))}</p>
        <p class="meta small-meta">Zona: ${escapeHtml(job.location)}</p>
        <p class="meta">📅 ${formatDate(job.date)}</p>
        ${job.description ? `<p class="description">${escapeHtml(job.description)}</p>` : ""}
        <p class="masked-contact">☎ Contacto: ${escapeHtml(maskPhone(job.phone))}</p>
        <div class="privacy-note">El número está parcialmente oculto en la app. Al abrir WhatsApp, la conversación puede mostrar el número real.</div>
        <div class="card-actions">
          <a class="whatsapp" href="${whatsappLink(job.phone, message)}" target="_blank" rel="noopener">Enviar WhatsApp</a>
          <a class="done" href="${whatsappLink(OFFICE_INFO.phone, attendedMessage(job))}" target="_blank" rel="noopener">Ya se atendió</a>
        </div>
      </article>`;
  }).join("");
}

function renderHelpers() {
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
    <p class="muted edit-hint">Versión 3.4: piloto consolidado con filtros claros, contacto enmascarado, revisión previa y pedidos atendidos.</p>`;
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

function renderAdminPedidos() {
  const list = document.getElementById("adminPedidos");
  if (!list) return;
  const search = document.getElementById("adminSearch")?.value || "";
  const rows = adminJobsCache.filter(row => matchesSearch(row, search));
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
      <span class="tag">${escapeHtml(row.categoria || "General")}</span>
      <p class="meta">📍 ${escapeHtml([row.localidad, row.municipio, row.estado_nombre].filter(Boolean).join(", ") || row.ubicacion || "")}</p>
      <p class="meta small-meta">Zona: ${escapeHtml(row.ubicacion || "")}</p>
      <p class="meta">📅 ${formatDate(row.fecha)}</p>
      <p class="meta">☎ ${escapeHtml(row.contacto || "")}</p>
      ${row.descripcion ? `<p class="description">${escapeHtml(row.descripcion)}</p>` : ""}
      <div class="admin-card-actions">
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
  const rows = adminHelpersCache.filter(row => matchesSearch(row, search));
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
      <span class="tag">${escapeHtml(row.categoria || "Servicio")}</span>
      <p class="meta">🛠️ ${escapeHtml(row.servicio || "")}</p>
      <p class="meta">📍 ${escapeHtml([row.localidad, row.municipio, row.estado_nombre].filter(Boolean).join(", ") || row.zona || "")}</p>
      <p class="meta small-meta">Zona: ${escapeHtml(row.zona || "")}</p>
      <p class="meta">☎ ${escapeHtml(row.telefono || "")}</p>
      ${row.descripcion ? `<p class="description">${escapeHtml(row.descripcion)}</p>` : ""}
      <div class="admin-card-actions">
        <button onclick="updateAyudanteEstado('${row.id}', 'activo')">Aprobar</button>
        <button onclick="updateAyudanteEstado('${row.id}', 'revision')">Revisión</button>
        <button class="danger-button" onclick="updateAyudanteEstado('${row.id}', 'oculto')">Ocultar</button>
      </div>
    </article>
  `).join("");
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
    const confirmPay = confirm("Publicar este pedido tiene un costo simbólico de $25 pesos.\n\nEsta versión usa pago simulado. ¿Continuar?");
    if (!confirmPay) return;

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
      alert("Tu pedido fue recibido. Aparecerá públicamente cuando la oficina lo apruebe.");
      showSection("ofertas");
      await loadRemoteData();
    } catch (error) {
      console.error("Error al publicar pedido", error);
      alert("No se pudo publicar el pedido. Revisa la conexión o las políticas de Supabase.");
    } finally {
      setSubmitState(form, false);
    }
  });

  document.getElementById("helperForm").addEventListener("submit", async event => {
    event.preventDefault();
    const confirmPay = confirm("Registrar este perfil tiene un costo simbólico de $25 pesos.\n\nEsta versión usa pago simulado. ¿Continuar?");
    if (!confirmPay) return;

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
      alert("Tu perfil fue recibido. Aparecerá públicamente cuando la oficina lo apruebe.");
      showSection("galeria");
      await loadRemoteData();
    } catch (error) {
      console.error("Error al registrar perfil", error);
      alert("No se pudo registrar el perfil. Revisa la conexión o las políticas de Supabase.");
    } finally {
      setSubmitState(form, false);
    }
  });
}

window.addEventListener("popstate", event => {
  const section = event.state?.section || "inicio";
  showSection(section, false);
});

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const adminMode = params.get("admin") === "1" || params.get("admin") === "true";
  const hashSection = location.hash ? location.hash.replace("#", "") : "inicio";
  const initialSection = adminMode ? "admin" : (hashSection === "admin" ? "inicio" : hashSection);
  history.replaceState({ section: initialSection }, "", adminMode ? `${location.pathname}?admin=1#${initialSection}` : `#${initialSection}`);
  populateStateSelects();
  setupForms();
  setupAdminAccess();
  showSection(initialSection, false);
  await loadRemoteData();
});
