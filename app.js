const SUPABASE_URL = "https://qfneazokicmyrtqvukqv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVhem9raWNteXJ0cXZ1a3F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzA0MzUsImV4cCI6MjA5MzUwNjQzNX0.60AKW1IttWSPbRJ8n7Ca9vP5it5-yLyxiXaxDKjd5r0";

const OFFICE_PHONE = "7225703145";
const ADMIN_PIN = "3145";
const DEFAULT_STATE = "México";
const DEFAULT_MUNICIPALITY = "Chapultepec";
const DEFAULT_LOCALITY = "Chapultepec Centro";
const STATES = ["Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Guanajuato","Guerrero","Hidalgo","Jalisco","México","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"];

let currentSection = "inicio";
let publicationsCache = [];
let adminCache = [];
let adminUnlocked = false;
let adminRouteEnabled = false;
let lastHomeBackPress = 0;
let isLoading = false;

function cleanPhone(phone) { return String(phone || "").replace(/\D/g, ""); }
function maskPhone(phone) {
  const digits = cleanPhone(phone);
  if (digits.length <= 4) return "xxxx";
  return `${"x".repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
}
function last4(phone) { return cleanPhone(phone).slice(-4); }
function createId() { return crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function folio(item) { return `PUB-${String(item.id || "00000").replace(/-/g, "").slice(0, 5).toUpperCase()}`; }
function normalize(value) { return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function money(value) { const n = Number(value || 0); return n > 0 ? `$${n.toLocaleString("es-MX")}` : "A tratar"; }
function escapeHtml(text) {
  return String(text || "").replace(/[&<>"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));
}
function linkify(text) {
  const safe = escapeHtml(text || "");
  const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+|(?:facebook|fb|instagram|tiktok|waze)\.com\/[^\s<]+)/gi;
  return safe.replace(urlRegex, match => {
    const href = /^https?:\/\//i.test(match) ? match : `https://${match}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${match}</a>`;
  }).replace(/\n/g, "<br>");
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function setSyncStatus(message, type = "") {
  const el = document.getElementById("syncStatus");
  if (!el) return;
  el.textContent = message;
  el.className = `sync-status ${type}`.trim();
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
function mapPublication(row) {
  return {
    id: row.id || createId(),
    name: row.nombre_publico || "Sin nombre",
    title: row.titulo || "Publicación sin título",
    description: row.descripcion || "",
    category: row.categoria_principal || "General",
    subcategory: row.subcategoria || "",
    intent: row.intencion || "",
    state: row.estado_nombre || DEFAULT_STATE,
    municipality: row.municipio || DEFAULT_MUNICIPALITY,
    locality: row.localidad || DEFAULT_LOCALITY,
    reference: row.referencia || "",
    phone: row.telefono || "",
    route: row.ruta || "",
    departure: row.salida || "",
    time: row.hora || "",
    transport: row.medio || "",
    budget: row.presupuesto || 0,
    status: row.estado || "revision",
    highlighted: Boolean(row.destacado),
    createdAt: row.creado_en || ""
  };
}
async function loadRemoteData() {
  isLoading = true;
  setSyncStatus("Conectando con la base de datos...");
  renderLoading();
  try {
    const rows = await supabaseRequest("publicaciones?select=*&estado=eq.activo&order=creado_en.desc");
    publicationsCache = (rows || []).map(mapPublication);
    setSyncStatus("Datos en línea actualizados", "ok");
    renderAll();
  } catch (error) {
    console.error(error);
    setSyncStatus("No se pudo conectar. Revisa si ya corriste el SQL de v3.8.", "error");
    renderAll();
  } finally {
    isLoading = false;
  }
}
async function loadAdminData() {
  if (!adminUnlocked) return;
  const list = document.getElementById("adminList");
  if (list) list.innerHTML = `<div class="empty-state">Cargando administración...</div>`;
  try {
    const rows = await supabaseRequest("publicaciones?select=*&order=creado_en.desc");
    adminCache = (rows || []).map(mapPublication);
    renderAdminPublications();
  } catch (error) {
    console.error(error);
    showToast("No se pudo cargar administración");
  }
}
function populateStateSelects() {
  document.querySelectorAll("[data-state-select]").forEach(select => {
    const blank = select.dataset.blank === "true";
    const def = select.dataset.default || DEFAULT_STATE;
    select.innerHTML = "";
    if (blank) select.append(new Option("Todos los estados", ""));
    STATES.forEach(state => select.append(new Option(state, state)));
    select.value = blank ? def : def;
  });
}
function routeUrlForSection(id) {
  const params = new URLSearchParams(location.search);
  const adminMode = adminRouteEnabled || params.get("admin") === "1";
  const base = adminMode ? `${location.pathname}?admin=1` : location.pathname;
  return `${base}#${id}`;
}
function showSection(id, push = true) {
  if (id === "admin" && !adminRouteEnabled) { showToast("Acceso de administración oculto"); id = "inicio"; }
  const target = document.getElementById(id);
  if (!target) return;
  if (push && id !== currentSection) history.pushState({ section: id }, "", routeUrlForSection(id));
  currentSection = id;
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  target.classList.add("active");
  const titles = { inicio:"Conecta Servicios", registro:"Publica", publicaciones:"Publicaciones", oficina:"Oficina", admin:"Administración", comoFunciona:"Cómo funciona", reglas:"Reglas", planes:"Planes", avisoPrivacidad:"Aviso de Privacidad", terminos:"Términos" };
  document.getElementById("mainTitle").textContent = titles[id] || "Conecta Servicios";
  document.getElementById("backButton").style.visibility = id === "inicio" ? "hidden" : "visible";
  document.querySelector(".app-shell").scrollTo({ top: 0, behavior: "smooth" });
  renderAll();
}
function goBack() {
  if (currentSection === "inicio") {
    const now = Date.now();
    if (now - lastHomeBackPress < 2500) { history.back(); return; }
    lastHomeBackPress = now;
    showToast("Presiona atrás otra vez para salir");
    history.pushState({ section: "inicio", guard: true }, "", routeUrlForSection("inicio"));
    return;
  }
  history.back();
}
window.addEventListener("popstate", event => {
  const id = (event.state && event.state.section) || String(location.hash || "#inicio").replace("#", "") || "inicio";
  if (currentSection === "inicio" && id === "inicio") { goBack(); return; }
  showSection(id, false);
});
function handleStateFilterChange() {
  const state = document.getElementById("stateFilter").value;
  const municipality = document.getElementById("municipalityFilter");
  if (!state) { municipality.value = ""; municipality.disabled = true; }
  else { municipality.disabled = false; if (!municipality.value) municipality.value = state === DEFAULT_STATE ? DEFAULT_MUNICIPALITY : ""; }
  renderPublications();
}
function resetLocationFilters() {
  document.getElementById("stateFilter").value = DEFAULT_STATE;
  const municipality = document.getElementById("municipalityFilter");
  municipality.disabled = false;
  municipality.value = DEFAULT_MUNICIPALITY;
  renderPublications();
}
function applyCategoryAndShow(category) {
  showSection("publicaciones");
  setTimeout(() => { document.getElementById("categoryFilter").value = category; renderPublications(); }, 50);
}
function requestNearbyComingSoon() {
  showToast("Próxima etapa: ubicación exacta y registros cercanos");
  showSection("publicaciones");
}
function filterPublications(list) {
  const category = document.getElementById("categoryFilter")?.value || "";
  const state = document.getElementById("stateFilter")?.value || "";
  const municipality = document.getElementById("municipalityFilter")?.value || "";
  const search = normalize(document.getElementById("mainSearch")?.value || "");
  updateFilterSummary(state, municipality);
  return list.filter(item => {
    const matchesCategory = !category || item.category === category;
    const matchesState = !state || normalize(item.state) === normalize(state);
    const matchesMunicipality = !municipality || normalize(item.municipality).includes(normalize(municipality));
    const haystack = normalize([folio(item), item.name, item.title, item.description, item.category, item.subcategory, item.state, item.municipality, item.locality, item.route, item.transport].join(" "));
    return matchesCategory && matchesState && matchesMunicipality && (!search || haystack.includes(search));
  });
}
function updateFilterSummary(state, municipality) {
  const el = document.getElementById("filterSummary");
  if (!el) return;
  if (!state) el.textContent = "Mostrando resultados para: Todo México";
  else if (!municipality) el.textContent = `Mostrando resultados para: ${state}`;
  else el.textContent = `Mostrando resultados para: ${municipality}, ${state}`;
}
function publicationCard(item) {
  const icon = item.category === "Viajes compartidos" ? "🚘" : item.category === "Mensajería y envíos" ? "📦" : "📌";
  const meta = [item.intent, item.municipality, item.state].filter(Boolean).join(" · ");
  const extra = [item.route && `Ruta: ${escapeHtml(item.route)}`, item.time && `Hora: ${escapeHtml(item.time)}`, item.departure && `Salida: ${escapeHtml(item.departure)}`, item.transport && `Medio: ${escapeHtml(item.transport)}`].filter(Boolean).join("<br>");
  return `<article class="card publication-card ${item.highlighted ? "highlighted" : ""}">
    <div class="card-top">
      <div class="pub-icon">${icon}</div>
      <div><span class="folio">${folio(item)}</span><h3>${escapeHtml(item.title)}</h3><p class="muted small">${escapeHtml(meta)}</p></div>
      <strong class="price-tag">${money(item.budget)}</strong>
    </div>
    <p><strong>Publicado por:</strong> ${escapeHtml(item.name)}</p>
    <p class="description">${linkify(item.description)}</p>
    ${extra ? `<div class="extra-info">${extra}</div>` : ""}
    <div class="contact-row"><span>WhatsApp: <strong>${maskPhone(item.phone)}</strong></span><button class="btn-small btn-green" onclick="openWhatsApp('${cleanPhone(item.phone)}','${encodeURIComponent(`Hola, vi tu publicación ${folio(item)} en Conecta Servicios: ${item.title}`)}')">Contactar</button></div>
    <div class="card-actions">
      <button class="btn-small btn-outline" onclick="sharePublication('${item.id}')">Compartir</button>
      <button class="btn-small btn-ghost" onclick="requestModification('${item.id}')">Solicitar modificación</button>
      <button class="btn-small btn-ghost" onclick="requestAttended('${item.id}')">Solicitar atendido</button>
    </div>
  </article>`;
}
function renderPublications() {
  const list = document.getElementById("publicationsList");
  if (!list) return;
  if (isLoading) { renderLoading(); return; }
  const filtered = filterPublications(publicationsCache);
  list.innerHTML = filtered.length ? filtered.map(publicationCard).join("") : `<div class="empty-state">No hay registros con esos filtros. Prueba otro municipio o categoría.</div>`;
  document.getElementById("publicationsCount").textContent = publicationsCache.length;
}
function renderLoading() {
  const list = document.getElementById("publicationsList");
  if (list) list.innerHTML = `<div class="empty-state">Cargando registros...</div>`;
}
function renderAll() { renderPublications(); updateHomeCounts(); }
function updateHomeCounts() { const count = document.getElementById("publicationsCount"); if (count) count.textContent = publicationsCache.length; }
function toggleCategoryFields() {
  const category = document.getElementById("pubCategory").value;
  document.getElementById("rideFields").classList.toggle("hidden", category !== "Viajes compartidos");
  document.getElementById("deliveryFields").classList.toggle("hidden", category !== "Mensajería y envíos");
}
function formPayload() {
  return {
    nombre_publico: document.getElementById("pubName").value.trim(),
    titulo: document.getElementById("pubTitle").value.trim(),
    descripcion: document.getElementById("pubDescription").value.trim(),
    categoria_principal: document.getElementById("pubCategory").value,
    intencion: document.getElementById("pubIntent").value,
    estado_nombre: document.getElementById("pubState").value,
    municipio: document.getElementById("pubMunicipality").value.trim(),
    localidad: document.getElementById("pubLocality").value.trim(),
    telefono: cleanPhone(document.getElementById("pubPhone").value),
    ruta: document.getElementById("pubRoute").value.trim(),
    salida: document.getElementById("pubDeparture").value.trim(),
    hora: document.getElementById("pubTime").value.trim(),
    medio: document.getElementById("pubTransport").value,
    presupuesto: Number(document.getElementById("pubBudget").value || 0),
    estado: "revision"
  };
}
async function submitPublication(event) {
  event.preventDefault();
  const payload = formPayload();
  if (payload.telefono.length < 10) { showToast("Revisa el teléfono"); return; }
  try {
    const [created] = await supabaseRequest("publicaciones", { method: "POST", body: JSON.stringify(payload) });
    const item = mapPublication(created || { ...payload, id: createId() });
    document.getElementById("publicationForm").reset();
    populateStateSelects();
    document.getElementById("pubMunicipality").value = DEFAULT_MUNICIPALITY;
    document.getElementById("pubLocality").value = DEFAULT_LOCALITY;
    toggleCategoryFields();
    showToast("Registro enviado a revisión");
    openOfficeWhatsApp(`Nuevo registro en revisión\n\nFolio: ${folio(item)}\nNombre: ${item.name}\nTítulo: ${item.title}\nCategoría: ${item.category}\nMunicipio: ${item.municipality}, ${item.state}\nTeléfono: ${maskPhone(item.phone)} / últimos 4: ${last4(item.phone)}`);
    showSection("inicio");
    loadRemoteData();
  } catch (error) {
    console.error(error);
    showToast("No se pudo guardar. Revisa Supabase o internet.");
  }
}
function openWhatsApp(phone, encodedMessage) {
  const digits = cleanPhone(phone);
  if (!digits) { showToast("Teléfono no disponible"); return; }
  window.open(`https://wa.me/52${digits}?text=${encodedMessage}`, "_blank");
}
function openOfficeWhatsApp(message) { openWhatsApp(OFFICE_PHONE, encodeURIComponent(message)); }
function shareUrlFor(item) { return `${location.origin}${location.pathname}?pub=${encodeURIComponent(item.id)}`; }
async function sharePublication(id) {
  const item = publicationsCache.find(p => p.id === id) || adminCache.find(p => p.id === id);
  if (!item) return;
  const data = { title: item.title, text: `${item.title} - ${item.category} en Conecta Servicios`, url: shareUrlFor(item) };
  if (navigator.share) await navigator.share(data).catch(() => null);
  else { await navigator.clipboard.writeText(data.url); showToast("Enlace copiado"); }
}
function requestModification(id) {
  const item = publicationsCache.find(p => p.id === id);
  if (!item) return;
  const input = prompt(`Para solicitar modificación de ${folio(item)}, escribe los últimos 4 dígitos del teléfono registrado:`);
  if (input === null) return;
  if (String(input).trim() !== last4(item.phone)) { showToast("Los últimos 4 dígitos no coinciden"); return; }
  openOfficeWhatsApp(`Hola, quiero solicitar modificación de mi publicación.\n\nFolio: ${folio(item)}\nTítulo: ${item.title}\nMunicipio: ${item.municipality}, ${item.state}\nTeléfono: ${maskPhone(item.phone)}\n\nCambio solicitado:`);
}
function requestAttended(id) {
  const item = publicationsCache.find(p => p.id === id);
  if (!item) return;
  const input = prompt(`Para solicitar marcar como atendido ${folio(item)}, escribe los últimos 4 dígitos del teléfono registrado:`);
  if (input === null) return;
  if (String(input).trim() !== last4(item.phone)) { showToast("Los últimos 4 dígitos no coinciden"); return; }
  openOfficeWhatsApp(`Hola, quiero reportar como atendida esta publicación.\n\nFolio: ${folio(item)}\nTítulo: ${item.title}\nMunicipio: ${item.municipality}, ${item.state}\nTeléfono: ${maskPhone(item.phone)}\n\nPor favor revisen y cambien el estatus a atendido.`);
}
function unlockAdmin() {
  const value = document.getElementById("adminPin").value;
  if (value !== ADMIN_PIN) { showToast("PIN incorrecto"); return; }
  adminUnlocked = true;
  showSection("admin");
  loadAdminData();
}
function adminCard(item) {
  return `<article class="card admin-card">
    <div class="card-top"><div><span class="folio">${folio(item)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.name)} · ${escapeHtml(item.category)} · ${escapeHtml(item.municipality)}, ${escapeHtml(item.state)}</p></div><span class="status ${item.status}">${item.status}</span></div>
    <p>${escapeHtml(item.description).slice(0, 180)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(cleanPhone(item.phone))} · últimos 4: ${last4(item.phone)}</p>
    <div class="admin-actions">
      <button class="btn-small btn-green" onclick="setPublicationStatus('${item.id}','activo')">Activo</button>
      <button class="btn-small btn-outline" onclick="setPublicationStatus('${item.id}','revision')">Revisión</button>
      <button class="btn-small btn-ghost" onclick="setPublicationStatus('${item.id}','oculto')">Oculto</button>
      <button class="btn-small btn-purple" onclick="setPublicationStatus('${item.id}','atendido')">Atendido</button>
      <button class="btn-small btn-outline" onclick="openEditDialog('${item.id}')">Editar</button>
    </div>
  </article>`;
}
function renderAdminPublications() {
  const list = document.getElementById("adminList");
  if (!list) return;
  const search = normalize(document.getElementById("adminSearch")?.value || "");
  const filtered = adminCache.filter(item => !search || normalize([folio(item), item.id, item.name, item.title, item.phone, last4(item.phone), item.category, item.municipality, item.state, item.status].join(" ")).includes(search));
  list.innerHTML = filtered.length ? filtered.map(adminCard).join("") : `<div class="empty-state">Sin resultados en administración.</div>`;
}
async function setPublicationStatus(id, status) {
  try {
    await supabaseRequest(`publicaciones?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ estado: status }) });
    showToast(`Estado cambiado a ${status}`);
    await loadAdminData();
    await loadRemoteData();
  } catch (error) { console.error(error); showToast("No se pudo cambiar estado"); }
}
function openEditDialog(id) {
  const item = adminCache.find(p => p.id === id);
  if (!item) return;
  document.getElementById("editId").value = item.id;
  document.getElementById("editName").value = item.name;
  document.getElementById("editTitle").value = item.title;
  document.getElementById("editCategory").value = item.category;
  document.getElementById("editIntent").value = item.intent || "Busco / Necesito";
  document.getElementById("editStateName").value = item.state;
  document.getElementById("editMunicipality").value = item.municipality;
  document.getElementById("editLocality").value = item.locality;
  document.getElementById("editPhone").value = cleanPhone(item.phone);
  document.getElementById("editRoute").value = item.route || item.transport || "";
  document.getElementById("editStatus").value = item.status;
  document.getElementById("editDescription").value = item.description;
  document.getElementById("editDialog").showModal();
}
function closeEditDialog() { document.getElementById("editDialog").close(); }
async function saveEdit(event) {
  event.preventDefault();
  const id = document.getElementById("editId").value;
  const payload = {
    nombre_publico: document.getElementById("editName").value.trim(),
    titulo: document.getElementById("editTitle").value.trim(),
    categoria_principal: document.getElementById("editCategory").value,
    intencion: document.getElementById("editIntent").value,
    estado_nombre: document.getElementById("editStateName").value.trim(),
    municipio: document.getElementById("editMunicipality").value.trim(),
    localidad: document.getElementById("editLocality").value.trim(),
    telefono: cleanPhone(document.getElementById("editPhone").value),
    ruta: document.getElementById("editRoute").value.trim(),
    estado: document.getElementById("editStatus").value,
    descripcion: document.getElementById("editDescription").value.trim()
  };
  try {
    await supabaseRequest(`publicaciones?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(payload) });
    closeEditDialog();
    showToast("Publicación actualizada");
    await loadAdminData();
    await loadRemoteData();
  } catch (error) { console.error(error); showToast("No se pudo guardar edición"); }
}
function maybeOpenSharedPublication() {
  const params = new URLSearchParams(location.search);
  const id = params.get("pub");
  if (!id) return;
  showSection("publicaciones", false);
  setTimeout(() => {
    const card = [...document.querySelectorAll(".publication-card")].find(c => c.textContent.includes(id.slice(0,5).toUpperCase()));
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 800);
}
function init() {
  const params = new URLSearchParams(location.search);
  adminRouteEnabled = params.get("admin") === "1" || params.get("admin") === "true";
  document.getElementById("adminEntry").classList.toggle("hidden", !adminRouteEnabled);
  populateStateSelects();
  document.getElementById("publicationForm").addEventListener("submit", submitPublication);
  document.getElementById("editForm").addEventListener("submit", saveEdit);
  history.replaceState({ section: "inicio" }, "", routeUrlForSection("inicio"));
  toggleCategoryFields();
  loadRemoteData().then(maybeOpenSharedPublication);
}
document.addEventListener("DOMContentLoaded", init);
