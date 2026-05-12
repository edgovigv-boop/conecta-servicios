// ------------------------------------------------------------------
// PROPIEDAD EXCLUSIVA - DERECHOS RESERVADOS © 2026
// Proyecto: Conecta Servicios
// Titular del proyecto: Conecta Servicios
//
// Este código fuente, diseño, textos, estructura funcional,
// documentación, interfaz y elementos originales del proyecto
// son propiedad exclusiva de su titular.
//
// Queda prohibida su copia, reproducción, distribución,
// modificación, explotación comercial, cesión o uso no autorizado,
// total o parcial, por cualquier medio.
//
// El acceso a este archivo no concede licencia de uso.
// Todo uso requiere autorización expresa y por escrito del titular.
// ------------------------------------------------------------------

const SUPABASE_URL = "https://qfneazokicmyrtqvukqv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmVhem9raWNteXJ0cXZ1a3F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzA0MzUsImV4cCI6MjA5MzUwNjQzNX0.60AKW1IttWSPbRJ8n7Ca9vP5it5-yLyxiXaxDKjd5r0";

const OFFICE_PHONE = "7225703145";
const ADMIN_PIN = "3145";
const DEFAULT_STATE = "México";
const DEFAULT_MUNICIPALITY = "Chapultepec";
const DEFAULT_LOCALITY = "Chapultepec Centro";
const STATES = ["Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Guanajuato","Guerrero","Hidalgo","Jalisco","México","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"];
const BLOCKED_WORDS = ["droga","armas","arma","sexo","sexual","escort","fraude","estafa","robo","robado","ilegal","marihuana","cocaína","cocaina"];
const NOTIFICATION_PREFS_KEY = "conecta_notif_prefs_v41";
const NOTIFICATION_SEEN_KEY = "conecta_notif_seen_v41";

let currentSection = "inicio";
let publicationsCache = [];
let adminCache = [];
let adminUnlocked = false;
let adminRouteEnabled = false;
let lastHomeBackPress = 0;
let isLoading = false;
let wizardStep = 1;
let userLocation = null;
let nearbyMode = false;
let nearbyFallbackState = DEFAULT_STATE;
let nearbyFallbackMunicipality = DEFAULT_MUNICIPALITY;
const TOTAL_STEPS = 7;

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
function toNumberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function hasCoordinates(item) {
  return Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng));
}
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function distanceLabel(km) {
  if (!Number.isFinite(km)) return "";
  if (km < 1) return `Aprox. ${Math.round(km * 1000)} m de ti`;
  return `Aprox. ${km.toFixed(km < 10 ? 1 : 0)} km de ti`;
}
function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Tu navegador no permite ubicación.")); return; }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 12000, maximumAge: 180000 });
  });
}

function escapeHtml(text) { return String(text || "").replace(/[&<>"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m])); }
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
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
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
    lat: toNumberOrNull(row.latitud),
    lng: toNumberOrNull(row.longitud),
    approximateLocation: row.ubicacion_aproximada !== false,
    serviceRadiusKm: Number(row.radio_servicio_km || 10),
    createdAt: row.creado_en || ""
  };
}
async function loadRemoteData(options = {}) {
  const silent = Boolean(options.silent);
  if (!silent) {
    isLoading = true;
    setSyncStatus("Conectando con la base de datos...");
    renderLoading();
  }
  try {
    const rows = await supabaseRequest("publicaciones?select=*&estado=eq.activo&order=creado_en.desc");
    const mapped = (rows || []).map(mapPublication);
    handleNotificationCheck(mapped);
    publicationsCache = mapped;
    setSyncStatus("", "ok");
    renderAll();
  } catch (error) {
    console.error(error);
    setSyncStatus("No se pudo conectar. Revisa internet o Supabase.", "error");
    renderAll();
  } finally { isLoading = false; }
}
async function loadAdminData() {
  if (!adminUnlocked) return;
  const list = document.getElementById("adminList");
  if (list) list.innerHTML = `<div class="empty-state">Cargando administración...</div>`;
  try {
    const rows = await supabaseRequest("publicaciones?select=*&order=creado_en.desc");
    adminCache = (rows || []).map(mapPublication);
    renderAdminPublications();
  } catch (error) { console.error(error); showToast("No se pudo cargar administración"); }
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
  const titles = { inicio:"Conecta Servicios", registro:"Publica", publicaciones:"Publicaciones", oficina:"Oficina", admin:"Administración", comoFunciona:"Cómo funciona", reglas:"Reglas", planes:"Planes", avisoPrivacidad:"Aviso de Privacidad", terminos:"Términos", notificaciones:"Notificaciones", enlaceExterno:"Enlace externo", aprende:"Aprende y emprende" };
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

function startWizard() { showSection("registro"); wizardStep = 1; updateWizard(); }
function selectPublishType(button) {
  document.querySelectorAll(".choice-card").forEach(b => b.classList.remove("selected"));
  button.classList.add("selected");
  document.getElementById("pubCategory").value = button.dataset.category || "General";
  document.getElementById("pubIntent").value = button.dataset.intent || "Ofrezco / Tengo disponible";
  updateCategoryDetails();
}
function updateCategoryDetails() {
  const category = document.getElementById("pubCategory").value || "General";
  const titleHint = document.getElementById("titleHint");
  document.getElementById("generalDetails").classList.toggle("hidden", category !== "General");
  document.getElementById("rideDetails").classList.toggle("hidden", category !== "Viajes compartidos");
  document.getElementById("deliveryDetails").classList.toggle("hidden", category !== "Mensajería y envíos");
  if (titleHint) {
    if (category === "Viajes compartidos") titleHint.textContent = "Ej. Viajo de Chapultepec a Toluca de lunes a viernes";
    else if (category === "Mensajería y envíos") titleHint.textContent = "Ej. Hago entregas locales en moto / Busco envío de documentos";
    else titleHint.textContent = "Ej. Ofrezco servicio de jardinería / Busco carpintero.";
  }
}
function validateWizardStep(step) {
  if (step === 1 && !document.getElementById("pubCategory").value) { showToast("Elige qué quieres publicar"); return false; }
  const fieldsByStep = { 2:["pubName"], 3:["pubState","pubMunicipality","pubLocality"], 4:["pubTitle"], 6:["pubPhone","pubPrivacyAccept"] };
  const fields = fieldsByStep[step] || [];
  for (const id of fields) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === "checkbox" && !el.checked) { showToast("Acepta privacidad y términos"); return false; }
    if (!String(el.value || "").trim()) { el.focus(); showToast("Completa este dato"); return false; }
  }
  if (step === 5) {
    const desc = currentDescriptionValue();
    if (!desc || desc.trim().length < 10) { showToast("Agrega una descripción más clara"); return false; }
  }
  if (step === 6 && cleanPhone(document.getElementById("pubPhone").value).length < 10) { showToast("Revisa el WhatsApp"); return false; }
  return true;
}
function nextWizardStep() {
  if (!validateWizardStep(wizardStep)) return;
  if (wizardStep < TOTAL_STEPS) wizardStep += 1;
  if (wizardStep === 7) renderPublicationPreview();
  updateWizard();
}
function prevWizardStep() { if (wizardStep > 1) wizardStep -= 1; updateWizard(); }
function updateWizard() {
  document.querySelectorAll(".wizard-step").forEach(step => step.classList.toggle("active", Number(step.dataset.step) === wizardStep));
  document.getElementById("wizardStepLabel").textContent = `Paso ${wizardStep} de ${TOTAL_STEPS}`;
  const titles = ["","¿Qué quieres publicar?","¿Cómo quieres aparecer?","¿Dónde aplica?","Título","Detalles","Contacto","Revisar y publicar"];
  document.getElementById("wizardStepTitle").textContent = titles[wizardStep] || "Publica";
  document.getElementById("wizardProgressBar").style.width = `${(wizardStep / TOTAL_STEPS) * 100}%`;
  document.getElementById("wizardBackBtn").style.visibility = wizardStep === 1 ? "hidden" : "visible";
  document.getElementById("wizardNextBtn").classList.toggle("hidden", wizardStep === TOTAL_STEPS);
  document.getElementById("wizardSubmitBtn").classList.toggle("hidden", wizardStep !== TOTAL_STEPS);
}
function currentDescriptionValue() {
  const category = document.getElementById("pubCategory").value || "General";
  if (category === "Viajes compartidos") return document.getElementById("pubDescriptionRide").value.trim();
  if (category === "Mensajería y envíos") return document.getElementById("pubDescriptionDelivery").value.trim();
  return document.getElementById("pubDescription").value.trim();
}

function activeDescriptionElement() {
  const category = document.getElementById("pubCategory").value || "General";
  if (category === "Viajes compartidos") return document.getElementById("pubDescriptionRide");
  if (category === "Mensajería y envíos") return document.getElementById("pubDescriptionDelivery");
  return document.getElementById("pubDescription");
}
function buildSuggestedDescription() {
  const category = document.getElementById("pubCategory").value || "General";
  const intent = document.getElementById("pubIntent").value || "";
  const title = document.getElementById("pubTitle").value.trim() || "esta publicación";
  const name = document.getElementById("pubName").value.trim() || "la persona que publica";
  const municipality = document.getElementById("pubMunicipality").value.trim() || DEFAULT_MUNICIPALITY;
  const locality = document.getElementById("pubLocality").value.trim();
  const zone = [locality, municipality].filter(Boolean).join(", ");
  const route = document.getElementById("pubRoute")?.value.trim();
  const time = document.getElementById("pubTime")?.value.trim();
  const departure = document.getElementById("pubDeparture")?.value.trim();
  const transport = document.getElementById("pubTransport")?.value;
  const budget = currentBudgetValue();
  if (category === "Viajes compartidos") {
    return `${name} publica: ${title}. Ruta o destino: ${route || "por confirmar"}. Salida: ${departure || "por coordinar"}. Horario: ${time || "por acordar"}. La idea es compartir el viaje de forma directa y respetuosa con personas que vayan por la misma ruta.${budget ? ` Cooperación sugerida: $${budget}.` : ""}`;
  }
  if (category === "Mensajería y envíos") {
    return `${name} publica: ${title}. Servicio o necesidad relacionada con mensajería y envíos en ${zone || municipality}. Medio: ${transport || "por coordinar"}. Puede servir para mandados, documentos, entregas o traslados locales según acuerdo directo.${budget ? ` Costo o presupuesto sugerido: $${budget}.` : ""}`;
  }
  if (normalize(intent).includes("busco") || normalize(title).includes("busco") || normalize(title).includes("necesito")) {
    return `${name} necesita apoyo con: ${title}. La solicitud aplica en ${zone || municipality}. Se busca una persona disponible, responsable y con trato directo para acordar detalles por WhatsApp.${budget ? ` Presupuesto sugerido: $${budget}.` : ""}`;
  }
  return `${name} ofrece: ${title}. Disponible en ${zone || municipality}. Se puede coordinar por WhatsApp para revisar detalles, horarios y condiciones del servicio de forma directa.${budget ? ` Costo o referencia: $${budget}.` : ""}`;
}
function assistDescription(mode) {
  const el = activeDescriptionElement();
  if (!el) return;
  const current = el.value.trim();
  let next = current;
  if (mode === "draft" || !current) {
    next = buildSuggestedDescription();
  } else if (mode === "clear") {
    next = current
      .replace(/\s+/g, " ")
      .replace(/\bq\b/gi, "que")
      .replace(/\bxq\b/gi, "porque")
      .trim();
    next = `Publicación clara: ${next}`.replace(/Publicación clara: Publicación clara:/g, "Publicación clara:");
  } else if (mode === "friendly") {
    next = `${current}\n\nPuedes escribir por WhatsApp para coordinar detalles con respeto, claridad y trato directo.`;
  } else if (mode === "short") {
    const sentences = current.split(/(?<=[.!?])\s+/).filter(Boolean);
    next = (sentences.slice(0, 2).join(" ") || current.slice(0, 180)).trim();
  } else if (mode === "details") {
    next = `${current}\n\nDetalles útiles: zona, horario disponible, condiciones, presupuesto aproximado si aplica y cualquier enlace de referencia como Facebook, Instagram, Waze o ubicación.`;
  }
  el.value = next.trim();
  el.focus();
  el.dispatchEvent(new Event("input", { bubbles: true }));
  showToast("Descripción actualizada. Puedes editarla antes de publicar.");
}
function currentBudgetValue() {
  const category = document.getElementById("pubCategory").value || "General";
  if (category === "Viajes compartidos") return document.getElementById("pubBudgetRide").value;
  if (category === "Mensajería y envíos") return document.getElementById("pubBudgetDelivery").value;
  return document.getElementById("pubBudget").value;
}
function evaluatePublication(payload) {
  const text = normalize([payload.nombre_publico, payload.titulo, payload.descripcion, payload.municipio, payload.localidad].join(" "));
  const reasons = [];
  if (String(payload.titulo || "").trim().length < 8) reasons.push("título muy corto");
  if (String(payload.descripcion || "").trim().length < 20) reasons.push("descripción muy corta");
  if (cleanPhone(payload.telefono).length < 10) reasons.push("teléfono incompleto");
  if (!payload.estado_nombre || !payload.municipio) reasons.push("ubicación incompleta");
  if (BLOCKED_WORDS.some(w => text.includes(normalize(w)))) reasons.push("palabra sensible");
  const uppercaseRatio = payload.descripcion ? (payload.descripcion.replace(/[^A-ZÁÉÍÓÚÑ]/g, "").length / Math.max(payload.descripcion.replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ]/g, "").length, 1)) : 0;
  if (uppercaseRatio > .72 && payload.descripcion.length > 25) reasons.push("demasiadas mayúsculas");
  const duplicate = publicationsCache.some(p => normalize(p.title) === normalize(payload.titulo) && last4(p.phone) === last4(payload.telefono));
  if (duplicate) reasons.push("posible duplicado");
  return { status: reasons.length ? "revision" : "activo", reasons };
}
function formPayload() {
  const category = document.getElementById("pubCategory").value || "General";
  const payload = {
    nombre_publico: document.getElementById("pubName").value.trim(),
    titulo: document.getElementById("pubTitle").value.trim(),
    descripcion: currentDescriptionValue(),
    categoria_principal: category,
    intencion: document.getElementById("pubIntent").value || "Ofrezco / Tengo disponible",
    estado_nombre: document.getElementById("pubState").value,
    municipio: document.getElementById("pubMunicipality").value.trim(),
    localidad: document.getElementById("pubLocality").value.trim(),
    telefono: cleanPhone(document.getElementById("pubPhone").value),
    ruta: document.getElementById("pubRoute")?.value.trim() || "",
    salida: document.getElementById("pubDeparture")?.value.trim() || "",
    hora: document.getElementById("pubTime")?.value.trim() || "",
    medio: document.getElementById("pubTransport")?.value || "",
    presupuesto: Number(currentBudgetValue() || 0),
    latitud: toNumberOrNull(document.getElementById("pubLat")?.value),
    longitud: toNumberOrNull(document.getElementById("pubLng")?.value),
    ubicacion_aproximada: Boolean(document.getElementById("pubLat")?.value && document.getElementById("pubLng")?.value),
    radio_servicio_km: 10
  };
  const evaluation = evaluatePublication(payload);
  payload.estado = evaluation.status;
  payload.referencia = evaluation.reasons.length ? `Revisión automática: ${evaluation.reasons.join(", ")}` : "Activación automática v4.1";
  return payload;
}
function renderPublicationPreview() {
  const preview = document.getElementById("publicationPreview");
  const payload = formPayload();
  const evaluation = evaluatePublication(payload);
  const icon = categoryIcon(payload.categoria_principal);
  preview.innerHTML = `<h4>${icon} ${escapeHtml(payload.titulo || "Publicación")}</h4>
    <p><strong>Aparecerás como:</strong> ${escapeHtml(payload.nombre_publico || "")}</p>
    <p><strong>Zona:</strong> ${escapeHtml(payload.municipio || "")}, ${escapeHtml(payload.estado_nombre || "")}</p>
    ${payload.latitud && payload.longitud ? `<p><strong>Cercanía:</strong> se usará ubicación aproximada para ordenar resultados.</p>` : ""}
    <p><strong>WhatsApp:</strong> ${maskPhone(payload.telefono)}</p>
    <p>${escapeHtml(payload.descripcion || "").slice(0, 180)}</p>
    <p class="muted"><strong>Resultado esperado:</strong> ${evaluation.status === "activo" ? "se activará automáticamente" : `quedará en revisión (${evaluation.reasons.join(", ")})`}</p>`;
}
async function submitPublication(event) {
  event.preventDefault();
  if (!validateWizardStep(7)) return;
  const payload = formPayload();
  try {
    const [created] = await supabaseRequest("publicaciones", { method: "POST", body: JSON.stringify(payload) });
    const item = mapPublication(created || { ...payload, id: createId() });
    const active = payload.estado === "activo";
    showToast(active ? "Publicación activa" : "Publicación enviada a revisión");
    if (!active) {
      openOfficeWhatsApp(`Nuevo registro en revisión\n\nFolio: ${folio(item)}\nNombre: ${item.name}\nTítulo: ${item.title}\nCategoría: ${item.category}\nMunicipio: ${item.municipality}, ${item.state}\nTeléfono: ${maskPhone(item.phone)} / últimos 4: ${last4(item.phone)}\nMotivo: ${payload.referencia}`);
    }
    resetWizardForm();
    showSection(active ? "publicaciones" : "inicio");
    loadRemoteData();
  } catch (error) { console.error(error); showToast("No se pudo guardar. Revisa Supabase o internet."); }
}
function resetWizardForm() {
  document.getElementById("publicationForm").reset();
  document.querySelectorAll(".choice-card").forEach(b => b.classList.remove("selected"));
  populateStateSelects();
  document.getElementById("pubMunicipality").value = DEFAULT_MUNICIPALITY;
  document.getElementById("pubLocality").value = DEFAULT_LOCALITY;
  document.getElementById("pubCategory").value = "";
  document.getElementById("pubIntent").value = "";
  document.getElementById("pubLat").value = "";
  document.getElementById("pubLng").value = "";
  const locStatus = document.getElementById("pubLocationStatus");
  if (locStatus) locStatus.textContent = "Puedes publicar sin activar ubicación.";
  wizardStep = 1;
  updateCategoryDetails();
  updateWizard();
}
function handleStateFilterChange() {
  clearNearbyMode();
  const state = document.getElementById("stateFilter").value;
  const municipality = document.getElementById("municipalityFilter");
  if (!state) { municipality.value = ""; municipality.disabled = true; }
  else { municipality.disabled = false; if (!municipality.value) municipality.value = state === DEFAULT_STATE ? DEFAULT_MUNICIPALITY : ""; }
  renderPublications();
}
function resetLocationFilters() {
  clearNearbyMode();
  document.getElementById("stateFilter").value = DEFAULT_STATE;
  const municipality = document.getElementById("municipalityFilter");
  municipality.disabled = false;
  municipality.value = DEFAULT_MUNICIPALITY;
  renderPublications();
}
function setCategoryChip(button) {
  document.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));
  button.classList.add("active");
  document.getElementById("categoryFilter").value = button.dataset.filterCategory || "";
  renderPublications();
}
function applyCategoryAndShow(category) {
  showSection("publicaciones");
  setTimeout(() => {
    document.getElementById("categoryFilter").value = category;
    document.querySelectorAll(".filter-chip").forEach(b => b.classList.toggle("active", b.dataset.filterCategory === category));
    renderPublications();
  }, 50);
}
async function requestNearbyPublications() {
  showSection("publicaciones");
  showToast("Solicitando ubicación aproximada...");
  try {
    const stateEl = document.getElementById("stateFilter");
    const munEl = document.getElementById("municipalityFilter");
    // Guardamos el municipio visible como respaldo inteligente para publicaciones antiguas sin coordenadas.
    nearbyFallbackState = stateEl?.value || DEFAULT_STATE;
    nearbyFallbackMunicipality = munEl?.value || (nearbyFallbackState === DEFAULT_STATE ? DEFAULT_MUNICIPALITY : "");

    const pos = await getBrowserPosition();
    userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
    nearbyMode = true;

    // Dejamos visible el municipio de respaldo, pero la búsqueda GPS no depende de este texto.
    if (stateEl) stateEl.value = nearbyFallbackState;
    if (munEl) { munEl.value = nearbyFallbackMunicipality; munEl.disabled = false; }
    const controls = document.getElementById("nearbyControls");
    if (controls) controls.classList.remove("hidden");
    showToast("Mostrando publicaciones cercanas");
    renderPublications();
  } catch (error) {
    console.error(error);
    nearbyMode = false;
    const controls = document.getElementById("nearbyControls");
    if (controls) controls.classList.add("hidden");
    showToast("No se pudo usar tu ubicación. Puedes buscar por municipio.");
    renderPublications();
  }
}
async function capturePublicationLocation() {
  const status = document.getElementById("pubLocationStatus");
  if (status) status.textContent = "Solicitando permiso de ubicación...";
  try {
    const pos = await getBrowserPosition();
    document.getElementById("pubLat").value = String(pos.coords.latitude);
    document.getElementById("pubLng").value = String(pos.coords.longitude);
    if (status) status.textContent = "Ubicación aproximada agregada. No se mostrará tu ubicación exacta.";
    showToast("Ubicación aproximada agregada");
  } catch (error) {
    console.error(error);
    if (status) status.textContent = "No se activó ubicación. Puedes continuar manualmente.";
    showToast("No se pudo obtener ubicación");
  }
}
function clearNearbyMode() {
  nearbyMode = false;
  nearbyFallbackState = DEFAULT_STATE;
  nearbyFallbackMunicipality = DEFAULT_MUNICIPALITY;
  const summary = document.getElementById("nearbySummary");
  if (summary) summary.classList.add("hidden");
  const controls = document.getElementById("nearbyControls");
  if (controls) controls.classList.add("hidden");
}
function getNearbyRadiusKm() {
  const radius = Number(document.getElementById("nearbyRadius")?.value || 25);
  return Number.isFinite(radius) && radius > 0 ? radius : 25;
}

function filterPublications(list) {
  const category = document.getElementById("categoryFilter")?.value || "";
  const state = document.getElementById("stateFilter")?.value || "";
  const municipality = document.getElementById("municipalityFilter")?.value || "";
  const search = normalize(document.getElementById("mainSearch")?.value || "");
  updateFilterSummary(state, municipality);
  const nearbySummary = document.getElementById("nearbySummary");
  if (nearbySummary) nearbySummary.classList.toggle("hidden", !nearbyMode || !userLocation);

  const baseFiltered = list.filter(item => {
    const matchesCategory = !category || item.category === category;
    const haystack = normalize([folio(item), item.name, item.title, item.description, item.category, item.subcategory, item.state, item.municipality, item.locality, item.route, item.transport].join(" "));
    return matchesCategory && (!search || haystack.includes(search));
  });

  if (nearbyMode && userLocation) {
    const radiusKm = getNearbyRadiusKm();
    const gpsMatches = baseFiltered
      .filter(item => hasCoordinates(item))
      .map(item => ({ ...item, distanceKm: haversineKm(userLocation.lat, userLocation.lng, Number(item.lat), Number(item.lng)), matchType: "gps" }))
      .filter(item => Number.isFinite(item.distanceKm) && item.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // Respaldo inteligente: publicaciones locales antiguas sin coordenadas.
    // Así no desaparecen registros reales del mismo municipio, pero tampoco se mezcla otro estado por error.
    const fallbackState = nearbyFallbackState || state || DEFAULT_STATE;
    const fallbackMunicipality = nearbyFallbackMunicipality || municipality || (fallbackState === DEFAULT_STATE ? DEFAULT_MUNICIPALITY : "");
    const localFallback = baseFiltered
      .filter(item => !hasCoordinates(item))
      .filter(item => !fallbackState || normalize(item.state) === normalize(fallbackState))
      .filter(item => !fallbackMunicipality || normalize(item.municipality).includes(normalize(fallbackMunicipality)))
      .map(item => ({ ...item, matchType: "municipio" }));

    return [...gpsMatches, ...localFallback];
  }

  return baseFiltered.filter(item => {
    const matchesState = !state || normalize(item.state) === normalize(state);
    const matchesMunicipality = !municipality || normalize(item.municipality).includes(normalize(municipality));
    return matchesState && matchesMunicipality;
  });
}
function updateFilterSummary(state, municipality) {
  const el = document.getElementById("filterSummary");
  if (!el) return;
  if (nearbyMode && userLocation) { el.textContent = `Mostrando cercanas por GPS y registros de ${nearbyFallbackMunicipality || "tu municipio"} sin ubicación exacta (radio: ${getNearbyRadiusKm()} km)`; return; }
  if (!state) el.textContent = "Mostrando resultados para: Todo México";
  else if (!municipality) el.textContent = `Mostrando resultados para: ${state}`;
  else el.textContent = `Mostrando resultados para: ${municipality}, ${state}`;
}
function categoryIcon(category) { return category === "Viajes compartidos" ? "🚘" : category === "Mensajería y envíos" ? "📦" : category === "Redes sociales" ? "🔗" : "📌"; }
function compactPublicationCard(item) {
  const icon = categoryIcon(item.category);
  const distanceText = nearbyMode && userLocation && Number.isFinite(item.distanceKm) ? ` · 📍 ${distanceLabel(item.distanceKm)}` : (nearbyMode && item.matchType === "municipio" ? " · 📍 mismo municipio" : "");
  const meta = [item.municipality, item.state, folio(item)].filter(Boolean).join(" · ") + distanceText;
  const originalLink = item.category === "Redes sociales" && item.route ? `<a class="original-link" href="${escapeHtml(/^https?:\/\//i.test(item.route) ? item.route : `https://${item.route}`)}" target="_blank" rel="noopener noreferrer">Ver publicación original</a>` : "";
  const extra = [originalLink, item.category !== "Redes sociales" && item.route && `<strong>Ruta:</strong> ${escapeHtml(item.route)}`, item.time && `<strong>Horario:</strong> ${escapeHtml(item.time)}`, item.departure && `<strong>Salida:</strong> ${escapeHtml(item.departure)}`, item.transport && `<strong>Medio:</strong> ${escapeHtml(item.transport)}`].filter(Boolean).join("<br>");
  return `<article class="compact-publication" id="pub-${item.id}">
    <button class="compact-summary" type="button" onclick="togglePublicationDetail('${item.id}')">
      <span class="compact-icon">${icon}</span>
      <span><span class="compact-title">${escapeHtml(item.title)}</span><span class="compact-meta">${escapeHtml(meta)} · ${maskPhone(item.phone)}</span></span>
      <span class="compact-chevron">›</span>
    </button>
    <div class="compact-detail">
      <span class="category-badge">${icon} ${escapeHtml(item.category)}</span>
      <p><strong>Publicado por:</strong> ${escapeHtml(item.name)}</p>
      <p class="description">${linkify(item.description)}</p>
      ${extra ? `<div class="extra-info">${extra}</div>` : ""}
      ${nearbyMode && userLocation && Number.isFinite(item.distanceKm) ? `<p><strong>Cercanía:</strong> ${distanceLabel(item.distanceKm)}. Ubicación aproximada.</p>` : (nearbyMode && item.matchType === "municipio" ? `<p><strong>Cercanía:</strong> coincide con tu municipio. Esta publicación aún no tiene ubicación GPS.</p>` : "")}
      <p><strong>Contacto:</strong> ${maskPhone(item.phone)} · <strong>Costo:</strong> ${money(item.budget)}</p>
      <div class="detail-actions">
        ${cleanPhone(item.phone) ? `<button class="btn-small btn-green" onclick="openWhatsApp('${cleanPhone(item.phone)}','${encodeURIComponent(`Hola, vi tu publicación ${folio(item)} en Conecta Servicios: ${item.title}`)}')">WhatsApp</button>` : ""}
        <button class="btn-small btn-outline" onclick="sharePublication('${item.id}')">Compartir</button>
        <button class="btn-small btn-ghost" onclick="requestModification('${item.id}')">Solicitar modificación</button>
        <button class="btn-small btn-ghost" onclick="requestAttended('${item.id}')">Solicitar atendido</button>
      </div>
    </div>
  </article>`;
}
function togglePublicationDetail(id) {
  const card = document.getElementById(`pub-${id}`);
  if (card) card.classList.toggle("open");
}
function renderPublications() {
  const list = document.getElementById("publicationsList");
  if (!list) return;
  if (isLoading) { renderLoading(); return; }
  const filtered = filterPublications(publicationsCache);
  const emptyMessage = nearbyMode
    ? `No encontramos publicaciones cercanas dentro de ${getNearbyRadiusKm()} km ni registros del municipio seleccionado. Puedes aumentar el radio o cambiar el municipio.`
    : "No hay registros con esos filtros. Prueba otro municipio o categoría.";
  list.innerHTML = filtered.length ? filtered.map(compactPublicationCard).join("") : `<div class="empty-state">${emptyMessage}</div>`;
  const count = document.getElementById("publicationsCount");
  if (count) count.textContent = publicationsCache.length;
}
function renderLoading() { const list = document.getElementById("publicationsList"); if (list) list.innerHTML = `<div class="empty-state">Cargando registros...</div>`; }
function renderAll() { renderPublications(); updateHomeCounts(); if (adminUnlocked) renderAdminPublications(); }
function updateHomeCounts() { const count = document.getElementById("publicationsCount"); if (count) count.textContent = publicationsCache.length; }
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
function renderAdminSummary(list) {
  const el = document.getElementById("adminSummary");
  if (!el) return;
  const counts = list.reduce((acc, item) => { acc[item.status] = (acc[item.status] || 0) + 1; return acc; }, {});
  el.innerHTML = [
    ["activo", "Activas"], ["revision", "En revisión"], ["oculto", "Ocultas"], ["atendido", "Atendidas"]
  ].map(([key,label]) => `<div class="admin-stat"><strong>${counts[key] || 0}</strong><span>${label}</span></div>`).join("");
}
function renderAdminPublications() {
  const list = document.getElementById("adminList");
  if (!list) return;
  renderAdminSummary(adminCache);
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
    const card = document.getElementById(`pub-${id}`);
    if (card) { card.classList.add("open"); card.scrollIntoView({ behavior: "smooth", block: "center" }); }
  }, 900);
}


function notificationPermissionLabel() {
  if (!("Notification" in window)) return "Tu navegador no soporta notificaciones web";
  if (Notification.permission === "granted") return "Activadas en este dispositivo";
  if (Notification.permission === "denied") return "Bloqueadas por el navegador";
  return "Pendientes de activar";
}
function defaultNotificationPreferences() {
  return { enabled: false, categories: ["General","Mensajería y envíos","Viajes compartidos","Redes sociales"], state: DEFAULT_STATE, municipality: DEFAULT_MUNICIPALITY, from: "07:00", to: "22:00" };
}
function getNotificationPreferences() {
  try { return { ...defaultNotificationPreferences(), ...(JSON.parse(localStorage.getItem(NOTIFICATION_PREFS_KEY) || "{}")) }; }
  catch { return defaultNotificationPreferences(); }
}
function renderNotificationSettings() {
  const prefs = getNotificationPreferences();
  document.querySelectorAll('input[name="notifCategory"]').forEach(input => input.checked = prefs.categories.includes(input.value));
  const state = document.getElementById("notifState");
  const municipality = document.getElementById("notifMunicipality");
  const from = document.getElementById("notifFrom");
  const to = document.getElementById("notifTo");
  if (state) state.value = prefs.state || "";
  if (municipality) municipality.value = prefs.municipality || "";
  if (from) from.value = prefs.from || "07:00";
  if (to) to.value = prefs.to || "22:00";
  const status = document.getElementById("notificationStatus");
  if (status) status.textContent = `Estado: ${notificationPermissionLabel()}`;
}
async function enableNotifications() {
  if (!("Notification" in window)) { showToast("Este navegador no soporta notificaciones"); return; }
  const permission = await Notification.requestPermission();
  const prefs = getNotificationPreferences();
  prefs.enabled = permission === "granted";
  localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
  renderNotificationSettings();
  showToast(permission === "granted" ? "Notificaciones activadas" : "No se activaron las notificaciones");
}
function saveNotificationPreferences() {
  const categories = Array.from(document.querySelectorAll('input[name="notifCategory"]:checked')).map(i => i.value);
  const prefs = {
    ...getNotificationPreferences(),
    categories: categories.length ? categories : ["General"],
    state: document.getElementById("notifState")?.value || "",
    municipality: document.getElementById("notifMunicipality")?.value.trim() || "",
    from: document.getElementById("notifFrom")?.value || "07:00",
    to: document.getElementById("notifTo")?.value || "22:00"
  };
  localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
  renderNotificationSettings();
  showToast("Preferencias guardadas");
}
function withinNotificationHours(prefs) {
  const now = new Date();
  const current = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const from = prefs.from || "00:00";
  const to = prefs.to || "23:59";
  if (from <= to) return current >= from && current <= to;
  return current >= from || current <= to;
}
function itemMatchesNotificationPreferences(item, prefs) {
  if (!prefs.enabled || !("Notification" in window) || Notification.permission !== "granted") return false;
  if (!withinNotificationHours(prefs)) return false;
  if (prefs.categories?.length && !prefs.categories.includes(item.category)) return false;
  if (prefs.state && normalize(item.state) !== normalize(prefs.state)) return false;
  if (prefs.municipality && !normalize(item.municipality).includes(normalize(prefs.municipality))) return false;
  return true;
}
function handleNotificationCheck(mappedItems) {
  const ids = mappedItems.map(item => item.id);
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem(NOTIFICATION_SEEN_KEY) || "[]"); } catch { seen = []; }
  if (!seen.length) { localStorage.setItem(NOTIFICATION_SEEN_KEY, JSON.stringify(ids)); return; }
  const prefs = getNotificationPreferences();
  const newItems = mappedItems.filter(item => !seen.includes(item.id) && itemMatchesNotificationPreferences(item, prefs));
  newItems.slice(0, 3).forEach(item => {
    try { new Notification("Nueva publicación en Conecta Servicios", { body: `${item.title} · ${item.municipality}, ${item.state}`, tag: item.id }); }
    catch { showToast(`Nueva publicación: ${item.title}`); }
  });
  localStorage.setItem(NOTIFICATION_SEEN_KEY, JSON.stringify(Array.from(new Set([...ids, ...seen])).slice(0, 300)));
}
async function submitExternalLink(event) {
  event.preventDefault();
  if (!adminUnlocked) { showToast("Solo administración puede agregar enlaces externos"); return; }
  const url = document.getElementById("externalUrl").value.trim();
  const title = document.getElementById("externalTitle").value.trim();
  const summary = document.getElementById("externalSummary").value.trim();
  if (!title || summary.length < 15 || !url) { showToast("Completa título, resumen y enlace"); return; }
  const payload = {
    nombre_publico: "Enlace externo",
    titulo: title,
    descripcion: `${summary}\n\nAviso: esta información está publicada originalmente en redes sociales. Conecta Servicios solo muestra un resumen y dirige al enlace original.`,
    categoria_principal: "Redes sociales",
    intencion: "Enlace externo de interés local",
    estado_nombre: document.getElementById("externalState").value,
    municipio: document.getElementById("externalMunicipality").value.trim(),
    localidad: document.getElementById("externalLocality").value.trim(),
    telefono: "",
    ruta: url,
    salida: "",
    hora: "",
    medio: "",
    presupuesto: 0,
    estado: "activo",
    referencia: "Enlace externo agregado por administración"
  };
  try {
    await supabaseRequest("publicaciones", { method: "POST", body: JSON.stringify(payload) });
    document.getElementById("externalLinkForm").reset();
    document.getElementById("externalMunicipality").value = DEFAULT_MUNICIPALITY;
    document.getElementById("externalLocality").value = DEFAULT_LOCALITY;
    showToast("Enlace externo publicado");
    await loadRemoteData();
    showSection("publicaciones");
  } catch (error) { console.error(error); showToast("No se pudo guardar el enlace"); }
}


function startLearningPublication(routeName) {
  const normalized = normalize(routeName);
  startWizard();
  let category = "General";
  let intent = "Ofrezco / Tengo disponible";
  if (normalized.includes("mensajeria") || normalized.includes("entrega")) category = "Mensajería y envíos";
  document.getElementById("pubCategory").value = category;
  document.getElementById("pubIntent").value = intent;
  document.querySelectorAll(".choice-card").forEach(button => {
    const match = (button.dataset.category || "") === category && normalize(button.dataset.intent || "").includes("ofrezco");
    button.classList.toggle("selected", match);
  });
  updateCategoryDetails();
  wizardStep = 2;
  updateWizard();
  const title = document.getElementById("pubTitle");
  if (title && !title.value) {
    if (normalized.includes("alimentos")) title.value = "Ofrezco alimentos o ventas locales";
    else if (normalized.includes("limpieza")) title.value = "Ofrezco servicio de limpieza";
    else if (normalized.includes("reparaciones")) title.value = "Ofrezco reparaciones del hogar";
    else if (normalized.includes("plomeria")) title.value = "Ofrezco plomería básica";
    else if (normalized.includes("electricidad")) title.value = "Ofrezco electricidad básica";
    else if (normalized.includes("jardineria")) title.value = "Ofrezco jardinería";
    else if (normalized.includes("mensajeria") || normalized.includes("entrega")) title.value = "Ofrezco mensajería y entregas";
  }
  showToast(`Ruta seleccionada: ${routeName}. Completa tus datos para publicar.`);
}

function showLearningGuide(type) {
  const guide = document.getElementById("learningGuide");
  if (!guide) return;
  const guides = {
    emprender: {
      title: "💡 Emprender con poco dinero",
      text: "Empieza con lo que ya sabes hacer, define a quién ayudas, calcula costos básicos, ofrece algo claro y publica una primera versión sencilla. No esperes tener todo perfecto para conseguir tus primeros clientes."
    },
    publicar: {
      title: "✍️ Cómo publicar mejor tu servicio",
      text: "Usa un título directo, explica zona, horarios, qué incluye tu servicio, costo aproximado si aplica y agrega enlaces útiles. Evita textos muy largos o confusos."
    },
    cliente: {
      title: "🤝 Atención al cliente",
      text: "Responde rápido, confirma lugar y horario, explica condiciones antes de aceptar, cumple lo prometido y pide recomendaciones cuando el servicio salga bien."
    }
  };
  const item = guides[type] || guides.publicar;
  guide.innerHTML = `<strong>${item.title}</strong><p>${item.text}</p><button class="btn-small btn-purple" onclick="startWizard()">Publicar ahora</button>`;
  guide.scrollIntoView({ behavior: "smooth", block: "center" });
}

function initMobileFormComfort() {
  const appShell = document.querySelector(".app-shell");
  const form = document.getElementById("publicationForm");
  if (!form || !appShell) return;

  const setKeyboardMode = active => document.body.classList.toggle("keyboard-open", Boolean(active));
  const controls = form.querySelectorAll("input, textarea, select");

  controls.forEach(control => {
    control.setAttribute("autocomplete", control.getAttribute("autocomplete") || "off");
    control.addEventListener("focus", () => {
      setKeyboardMode(true);
      setTimeout(() => {
        control.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 260);
    });
    control.addEventListener("blur", () => {
      setTimeout(() => {
        if (!form.contains(document.activeElement) || !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) {
          setKeyboardMode(false);
        }
      }, 120);
    });
  });

  if (window.visualViewport) {
    const viewportHandler = () => {
      const keyboardLikelyOpen = window.visualViewport.height < window.innerHeight * 0.78 && currentSection === "registro";
      setKeyboardMode(keyboardLikelyOpen);
      const active = document.activeElement;
      if (keyboardLikelyOpen && form.contains(active)) {
        setTimeout(() => active.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
      }
    };
    window.visualViewport.addEventListener("resize", viewportHandler);
    window.visualViewport.addEventListener("scroll", viewportHandler);
  }
}

function init() {
  const params = new URLSearchParams(location.search);
  adminRouteEnabled = params.get("admin") === "1" || params.get("admin") === "true";
  document.getElementById("adminEntry").classList.toggle("hidden", !adminRouteEnabled);
  populateStateSelects();
  document.getElementById("publicationForm").addEventListener("submit", submitPublication);
  document.getElementById("editForm").addEventListener("submit", saveEdit);
  document.getElementById("externalLinkForm")?.addEventListener("submit", submitExternalLink);
  history.replaceState({ section: "inicio" }, "", routeUrlForSection("inicio"));
  updateWizard();
  updateCategoryDetails();
  initMobileFormComfort();
  renderNotificationSettings();
  loadRemoteData().then(maybeOpenSharedPublication);
  setInterval(() => loadRemoteData({ silent: true }), 60000);
}
document.addEventListener("DOMContentLoaded", init);
