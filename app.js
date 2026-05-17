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
const DEFAULT_STATE = "";
const DEFAULT_MUNICIPALITY = "";
const DEFAULT_LOCALITY = "";
const STATES = ["Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Guanajuato","Guerrero","Hidalgo","Jalisco","México","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"];
const KNOWN_MUNICIPALITIES = {
  "Hidalgo": ["Acatlán", "Acaxochitlán", "Actopan", "Agua Blanca de Iturbide", "Ajacuba", "Alfajayucan", "Almoloya", "Apan", "El Arenal", "Atitalaquia", "Atlapexco", "Atotonilco el Grande", "Atotonilco de Tula", "Calnali", "Cardonal", "Chapantongo", "Chapulhuacán", "Chilcuautla", "Cuautepec de Hinojosa", "Eloxochitlán", "Emiliano Zapata", "Epazoyucan", "Francisco I. Madero", "Huasca de Ocampo", "Huautla", "Huazalingo", "Huehuetla", "Huejutla de Reyes", "Huichapan", "Ixmiquilpan", "Jacala de Ledezma", "Jaltocán", "Juárez Hidalgo", "Lolotla", "Metepec", "San Agustín Metzquititlán", "Metztitlán", "Mineral del Chico", "Mineral del Monte", "La Misión", "Mixquiahuala de Juárez", "Molango de Escamilla", "Nicolás Flores", "Nopala de Villagrán", "Omitlán de Juárez", "San Felipe Orizatlán", "Pacula", "Pachuca de Soto", "Pisaflores", "Progreso de Obregón", "Mineral de la Reforma", "San Agustín Tlaxiaca", "San Bartolo Tutotepec", "San Salvador", "Santiago de Anaya", "Santiago Tulantepec de Lugo Guerrero", "Singuilucan", "Tasquillo", "Tecozautla", "Tenango de Doria", "Tepeapulco", "Tepehuacán de Guerrero", "Tepeji del Río de Ocampo", "Tepetitlán", "Tetepango", "Villa de Tezontepec", "Tezontepec de Aldama", "Tianguistengo", "Tizayuca", "Tlahuelilpan", "Tlahuiltepa", "Tlanalapa", "Tlanchinol", "Tlaxcoapan", "Tolcayuca", "Tula de Allende", "Tulancingo de Bravo", "Xochiatipan", "Xochicoatlán", "Yahualica", "Zacualtipán de Ángeles", "Zapotlán de Juárez", "Zempoala", "Zimapán"],
  "México": ["Calimaya","Chapultepec","Mexicaltzingo","Metepec","Toluca","Tenango del Valle","Tianguistenco","San Mateo Atenco","Lerma","Ocoyoacac","Zinacantepec","Almoloya de Juárez","Rayón","Atizapán","Capulhuac","Xalatlaco","Santiago Tianguistenco"],
  "Morelos": ["Cuernavaca","Jiutepec","Temixco","Emiliano Zapata","Yautepec","Cuautla","Jojutla","Xochitepec","Tepoztlán","Zacatepec"],
  "Ciudad de México": ["Álvaro Obregón","Azcapotzalco","Benito Juárez","Coyoacán","Cuajimalpa de Morelos","Cuauhtémoc","Gustavo A. Madero","Iztacalco","Iztapalapa","La Magdalena Contreras","Miguel Hidalgo","Milpa Alta","Tláhuac","Tlalpan","Venustiano Carranza","Xochimilco"]
};
const MUNICIPIOS_MX_URLS = [
  "assets/municipios-mx-completo.json",
  "https://cdn.jsdelivr.net/gh/cisnerosnow/json-estados-municipios-mexico@master/estados-municipios.json",
  "https://raw.githubusercontent.com/cisnerosnow/json-estados-municipios-mexico/master/estados-municipios.json"
];
const MUNICIPIOS_MX_LOCAL_URL = "assets/municipios-mx-base.json";
const INEGI_MGEM_URL = "https://gaia.inegi.org.mx/wscatgeo/v2/mgem";
const MUNICIPIOS_MX_CACHE_KEY = "conecta_municipios_mx_v486";
let municipiosMx = { ...KNOWN_MUNICIPALITIES };
const STATE_ALIASES = {
  "Coahuila": "Coahuila de Zaragoza",
  "Michoacán": "Michoacán de Ocampo",
  "Veracruz": "Veracruz de Ignacio de la Llave"
};
const INEGI_STATE_KEYS = {
  "Aguascalientes":"01", "Baja California":"02", "Baja California Sur":"03", "Campeche":"04",
  "Coahuila":"05", "Coahuila de Zaragoza":"05", "Colima":"06", "Chiapas":"07", "Chihuahua":"08",
  "Ciudad de México":"09", "Durango":"10", "Guanajuato":"11", "Guerrero":"12", "Hidalgo":"13",
  "Jalisco":"14", "México":"15", "Michoacán":"16", "Michoacán de Ocampo":"16", "Morelos":"17",
  "Nayarit":"18", "Nuevo León":"19", "Oaxaca":"20", "Puebla":"21", "Querétaro":"22",
  "Quintana Roo":"23", "San Luis Potosí":"24", "Sinaloa":"25", "Sonora":"26", "Tabasco":"27",
  "Tamaulipas":"28", "Tlaxcala":"29", "Veracruz":"30", "Veracruz de Ignacio de la Llave":"30",
  "Yucatán":"31", "Zacatecas":"32"
};
const MUNICIPIOS_SOURCE_NOTE = "INEGI Catálogo Único de Claves Geoestadísticas";
const BLOCKED_WORDS = ["droga","armas","arma","sexo","sexual","escort","fraude","estafa","robo","robado","ilegal","marihuana","cocaína","cocaina"];
const NOTIFICATION_PREFS_KEY = "conecta_notif_prefs_v483";
const NOTIFICATION_SEEN_KEY = "conecta_notif_seen_v41";
const ANALYTICS_SESSION_KEY = "conecta_analytics_session_v42";
const OPPORTUNITY_PREFS_KEY = "conecta_oportunidades_prefs_v43";
const PWA_VERSION = "v4.8.6-presentacion-inversionistas";

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
let pendingSharedPublicationId = null;
let analyticsCache = [];
let deferredInstallPrompt = null;
const TOTAL_STEPS = 7;
const APP_VERSION_KEY = "conecta_servicios_app_version";
const CHAT_STORAGE_KEY = "conecta_smart_chat_v486";


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
function uniqueByNormalized(list) {
  const seen = new Set();
  return (list || []).map(v => String(v || "").trim()).filter(Boolean).filter(value => {
    const key = normalize(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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

function getAnalyticsSessionId() {
  let id = localStorage.getItem(ANALYTICS_SESSION_KEY);
  if (!id) {
    id = createId();
    localStorage.setItem(ANALYTICS_SESSION_KEY, id);
  }
  return id;
}
function deviceKind() {
  const ua = navigator.userAgent || "";
  return /Mobi|Android|iPhone|iPad/i.test(ua) ? "móvil" : "escritorio";
}
function analyticsPayload(eventName, item = null, details = {}) {
  return {
    evento: eventName,
    publicacion_id: item?.id ? String(item.id) : null,
    folio: item ? folio(item) : null,
    categoria: item?.category || details.categoria || null,
    municipio: item?.municipality || details.municipio || null,
    estado_nombre: item?.state || details.estado_nombre || null,
    session_id: getAnalyticsSessionId(),
    dispositivo: deviceKind(),
    detalle: details && Object.keys(details).length ? details : null,
    pagina: location.pathname + location.search + location.hash
  };
}
function trackEvent(eventName, item = null, details = {}) {
  supabaseRequest("eventos_analytics", { method: "POST", body: JSON.stringify(analyticsPayload(eventName, item, details)) })
    .catch(error => console.debug("Analítica no disponible:", error.message));
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
    updateMunicipalityFilterOptions();
    renderCourseCards?.();
    renderSmartChat?.();
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
function officialStateName(state) { return STATE_ALIASES[state] || state || ""; }

function normalizeMunicipiosCatalog(data) {
  const out = {};
  if (!data || typeof data !== "object") return out;
  Object.entries(data).forEach(([state, list]) => {
    if (!Array.isArray(list)) return;
    const cleanList = Array.from(new Set(list.map(v => String(v || "").trim()).filter(Boolean)))
      .sort((a,b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    if (!cleanList.length) return;
    out[state] = cleanList;
    const shortName = Object.entries(STATE_ALIASES).find(([, official]) => normalize(official) === normalize(state))?.[0];
    if (shortName) out[shortName] = cleanList;
  });
  return out;
}

async function loadMunicipiosMx() {
  populateStateSelects();
  try {
    const cached = localStorage.getItem(MUNICIPIOS_MX_CACHE_KEY);
    if (cached) {
      municipiosMx = { ...municipiosMx, ...JSON.parse(cached) };
      populateStateSelects();
      updateAllMunicipalitySelects();
    }
  } catch {}

  // Carga primero el catálogo local completo si está disponible; luego intenta CDN/raw.
  for (const url of MUNICIPIOS_MX_URLS) {
    try {
      const remoteRes = await fetch(url, { cache: "reload" });
      if (!remoteRes.ok) continue;
      const remoteData = await remoteRes.json();
      const normalized = normalizeMunicipiosCatalog(remoteData);
      if (Object.keys(normalized).length >= 20) {
        municipiosMx = { ...municipiosMx, ...normalized };
        try { localStorage.setItem(MUNICIPIOS_MX_CACHE_KEY, JSON.stringify(municipiosMx)); } catch {}
        populateStateSelects();
        updateAllMunicipalitySelects();
        break;
      }
    } catch (error) { console.debug("Catálogo municipios no disponible:", url, error.message); }
  }

  // INEGI oficial: segundo plano por estado seleccionado / actualización progresiva.
  loadMunicipiosFromInegi().catch(error => console.debug("INEGI municipios no disponible:", error.message));
}
function parseInegiMunicipalities(payload) {
  const rows = Array.isArray(payload?.datos) ? payload.datos : (Array.isArray(payload) ? payload : []);
  return rows.map(row => row.nomgeo || row.nom_agem || row.NOM_MUN || row.nombre || row.nom_mun || row.NOMGEO || "")
    .map(v => String(v).trim())
    .filter(Boolean);
}
async function fetchInegiMunicipiosForState(state) {
  const official = officialStateName(state);
  const key = INEGI_STATE_KEYS[state] || INEGI_STATE_KEYS[official];
  if (!key) return [];
  const response = await fetch(`${INEGI_MGEM_URL}/${key}`, { cache: "force-cache" });
  if (!response.ok) throw new Error(`INEGI ${state} ${response.status}`);
  return parseInegiMunicipalities(await response.json());
}
async function ensureMunicipalitiesForState(state) {
  if (!state) return;
  const current = getMunicipalitiesForState(state);
  if (current.length > 20) return;
  try {
    const list = await fetchInegiMunicipiosForState(state);
    if (list.length) {
      municipiosMx[state] = list;
      municipiosMx[officialStateName(state)] = list;
      try { localStorage.setItem(MUNICIPIOS_MX_CACHE_KEY, JSON.stringify(municipiosMx)); } catch {}
      updateAllMunicipalitySelects();
    }
  } catch (error) { console.debug("No se pudo cargar municipios INEGI para", state, error.message); }
}
async function loadMunicipiosFromInegi() {
  const entries = STATES.map(async state => {
    try {
      const list = await fetchInegiMunicipiosForState(state);
      if (list.length) {
        municipiosMx[state] = list;
        municipiosMx[officialStateName(state)] = list;
      }
    } catch (error) { console.debug("INEGI estado omitido", state, error.message); }
  });
  await Promise.allSettled(entries);
  try { localStorage.setItem(MUNICIPIOS_MX_CACHE_KEY, JSON.stringify(municipiosMx)); } catch {}
  populateStateSelects();
  updateAllMunicipalitySelects();
}
function populateStateSelects() {
  document.querySelectorAll("[data-state-select]").forEach(select => {
    const blank = select.dataset.blank === "true";
    const def = select.dataset.default || DEFAULT_STATE;
    const current = select.value || def || "";
    select.innerHTML = "";
    if (blank) select.append(new Option("Todo México", ""));
    STATES.forEach(state => select.append(new Option(state, state)));
    if ([...select.options].some(o => o.value === current)) select.value = current;
    else select.value = blank ? "" : def;
  });
  updateAllMunicipalitySelects();
}
function getMunicipalitiesForState(state) {
  if (!state) return [];
  const official = officialStateName(state);
  const fromOfficial = municipiosMx[official] || municipiosMx[state] || [];
  const fromKnown = KNOWN_MUNICIPALITIES[state] || KNOWN_MUNICIPALITIES[official] || [];
  const fromData = publicationsCache
    .filter(item => normalize(item.state) === normalize(state) || normalize(item.state) === normalize(official))
    .map(item => item.municipality)
    .filter(Boolean);
  return uniqueByNormalized([...fromOfficial, ...fromKnown, ...fromData])
    .sort((a, b) => String(a).localeCompare(String(b), "es", { sensitivity: "base" }));
}
function fillMunicipalitySelect(select, state, options = {}) {
  if (!select || select.tagName !== "SELECT") return;
  const current = select.value || "";
  const placeholder = options.placeholder || "Todos los municipios";
  select.innerHTML = "";

  if (!state) {
    const disabledText = options.disabledPlaceholder || "Selecciona un estado para ver municipios";
    select.append(new Option(disabledText, ""));
    select.value = "";
    select.disabled = options.disableWhenAllMexico !== false;
    select.classList.add("select-disabled-soft");
    select.title = "Selecciona un estado para habilitar municipios";
    return;
  }

  select.disabled = false;
  select.classList.remove("select-disabled-soft");
  select.title = "";
  select.append(new Option(placeholder, ""));
  getMunicipalitiesForState(state).forEach(m => select.append(new Option(m, m)));
  if ([...select.options].some(o => o.value === current)) select.value = current;
  else select.value = "";
}
function updateMunicipalityFilterOptions() {
  const state = document.getElementById("stateFilter")?.value || "";
  fillMunicipalitySelect(document.getElementById("municipalityFilter"), state, { placeholder: "Todos los municipios", disabledPlaceholder: "Municipios desactivados" });
}
function updateAllMunicipalitySelects() {
  updateMunicipalityFilterOptions();
  fillMunicipalitySelect(document.getElementById("pubMunicipality"), document.getElementById("pubState")?.value || "", { placeholder: "Selecciona municipio", disableWhenAllMexico: false });
  fillMunicipalitySelect(document.getElementById("notifMunicipality"), document.getElementById("notifState")?.value || "", { placeholder: "Todos los municipios" });
  fillMunicipalitySelect(document.getElementById("externalMunicipality"), document.getElementById("externalState")?.value || "", { placeholder: "Selecciona municipio", disableWhenAllMexico: false });
}
function handlePairedStateChange(stateId, municipalityId, placeholder) {
  const state = document.getElementById(stateId)?.value || "";
  const munSelect = document.getElementById(municipalityId);
  fillMunicipalitySelect(munSelect, state, { placeholder, disableWhenAllMexico: false });
  if (!state) return;
  if (state && getMunicipalitiesForState(state).length <= 20 && munSelect) {
    munSelect.innerHTML = "";
    munSelect.append(new Option("Cargando municipios...", ""));
  }
  ensureMunicipalitiesForState(state).finally(() => fillMunicipalitySelect(munSelect, state, { placeholder, disableWhenAllMexico: false }));
}
function routeUrlForSection(id) {
  const params = new URLSearchParams(location.search);
  const adminMode = adminRouteEnabled || params.get("admin") === "1";
  const base = adminMode ? `${location.pathname}?admin=1` : location.pathname;
  return `${base}#${id}`;
}
function showSection(id, push = true) {
  const sectionAliases = { aprendizaje: "aprende", aprender: "aprende", chat: "mensajes" };
  id = sectionAliases[id] || id;
  if (id === "admin" && !adminRouteEnabled) { showToast("Acceso de administración oculto"); id = "inicio"; }
  const target = document.getElementById(id);
  if (!target) return;
  if (push && id !== currentSection) history.pushState({ section: id }, "", routeUrlForSection(id));
  currentSection = id;
  document.querySelector(".app-shell")?.classList.toggle("home-mode", id === "inicio");
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  target.classList.add("active");
  const titles = { inicio:"Conecta Servicios", registro:"Crear oportunidad", publicaciones:"Publicaciones", oficina:"Oficina", admin:"Administración", comoFunciona:"Cómo funciona", reglas:"Reglas", planes:"Planes", avisoPrivacidad:"Aviso de Privacidad", terminos:"Términos", notificaciones:"Notificaciones", misPublicaciones:"Mis publicaciones", enlaceExterno:"Enlace externo", aprende:"Aprende y emprende", analitica:"Analítica", oportunidades:"Oportunidades para ti", rutaGuiada:"Ruta guiada", actualizarme:"Por qué actualizarme", mensajes:"Mensajes inteligentes" };
  document.getElementById("mainTitle").textContent = titles[id] || "Conecta Servicios";
  document.getElementById("backButton").style.visibility = id === "inicio" ? "hidden" : "visible";
  document.querySelector(".app-shell").scrollTo({ top: 0, behavior: "smooth" });
  renderAll();
  trackEvent("vista_seccion", null, { seccion: id });
  if (id === "analitica" && adminUnlocked) loadAnalyticsData();
  if (id === "oportunidades") renderOpportunities(false);
  if (id === "misPublicaciones") renderMyPublications();
  if (id === "publicaciones") {
    // Entrada normal a Publicaciones cerca de mí: mostrar todo por default.
    activateAllCategoryFilterSafe();
    renderPublications();
  }
  if (id === "mensajes") renderSmartChat?.();
  if (id === "aprende") renderCourseCards?.();
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

function startWizard() { trackEvent("click_publica"); showSection("registro"); wizardStep = 1; updateWizard(); }

function startOpportunityGuide() {
  trackEvent("click_oportunidades_guiadas");
  showSection("oportunidades");
}

function setWizardPublishType(category, intent) {
  document.getElementById("pubCategory").value = category || "General";
  document.getElementById("pubIntent").value = intent || "Ofrezco / Tengo disponible";
  document.querySelectorAll(".choice-card").forEach(button => {
    const matchCategory = (button.dataset.category || "") === (category || "General");
    const matchIntent = normalize(button.dataset.intent || "").includes(normalize((intent || "").split("/")[0] || ""));
    button.classList.toggle("selected", matchCategory && (matchIntent || category !== "General"));
  });
  updateCategoryDetails();
}

function openOpportunityWizard(type) {
  resetWizardForm();
  const titleHint = document.getElementById("titleHint");
  const routeConfig = {
    ingresos: {
      category: "Servicios",
      intent: "Ofrezco / Tengo disponible",
      toast: "Vamos a convertir lo que puedes hacer en una oportunidad publicada.",
      hint: "Ej. Ofrezco limpieza por día / Hago mandados en moto / Vendo comida por encargo / Ofrezco reparaciones sencillas."
    },
    negocio: {
      category: "Negocios locales",
      intent: "Ofrezco / Tengo disponible",
      toast: "Vamos a publicar tu negocio para que más personas de tu zona lo encuentren.",
      hint: "Ej. Tengo una panadería en Chapultepec / Tiendita con productos básicos / Estética con servicio por cita."
    },
    necesito: {
      category: "Servicios",
      intent: "Busco / Necesito",
      toast: "Vamos a ordenar tu necesidad para que alguien cercano pueda ayudarte.",
      hint: "Ej. Busco quién limpie mi terreno / Necesito lavar mis autos / Busco personal para restaurante / Necesito un mandado."
    },
    entrega: {
      category: "Entregas y mandados",
      intent: "Busco / Necesito",
      toast: "Vamos a publicar tu entrega, mandado o movilidad de forma clara.",
      hint: "Ej. Necesito llevar documentos / Busco mandado local / Necesito traslado o entrega en moto."
    }
  };
  const cfg = routeConfig[type] || routeConfig.ingresos;
  setWizardPublishType(cfg.category, cfg.intent);
  if (titleHint) titleHint.textContent = cfg.hint;
  wizardStep = 2;
  showSection("registro");
  updateWizard();
  showToast(cfg.toast);
  trackEvent("oportunidad_guia_iniciada", null, { tipo: type });
}
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
  const deliveryCategories = ["Mensajería y envíos", "Entregas y mandados", "Movilidad"];
  const rideCategory = category === "Viajes compartidos";
  const deliveryCategory = deliveryCategories.includes(category);
  document.getElementById("generalDetails").classList.toggle("hidden", rideCategory || deliveryCategory);
  document.getElementById("rideDetails").classList.toggle("hidden", !rideCategory);
  document.getElementById("deliveryDetails").classList.toggle("hidden", !deliveryCategory);
  if (titleHint) {
    if (rideCategory) titleHint.textContent = "Ej. Viajo de Chapultepec a Toluca de lunes a viernes";
    else if (deliveryCategory) titleHint.textContent = "Ej. Hago entregas locales en moto / Necesito un mandado o traslado";
    else if (category === "Negocios locales") titleHint.textContent = "Ej. Tengo una tiendita / panadería / estética / negocio local";
    else titleHint.textContent = "Ej. Ofrezco servicio de jardinería / Busco carpintero / Busco trabajo en limpieza.";
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
  if (["Mensajería y envíos","Entregas y mandados","Movilidad"].includes(category)) return document.getElementById("pubDescriptionDelivery").value.trim();
  return document.getElementById("pubDescription").value.trim();
}

function activeDescriptionElement() {
  const category = document.getElementById("pubCategory").value || "General";
  if (category === "Viajes compartidos") return document.getElementById("pubDescriptionRide");
  if (["Mensajería y envíos","Entregas y mandados","Movilidad"].includes(category)) return document.getElementById("pubDescriptionDelivery");
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
  if (["Mensajería y envíos","Entregas y mandados","Movilidad"].includes(category)) {
    return `${name} publica: ${title}. Servicio o necesidad relacionada con entregas, mandados o movilidad en ${zone || municipality}. Medio: ${transport || "por coordinar"}. Puede servir para mandados, documentos, entregas, rutas o traslados locales según acuerdo directo.${budget ? ` Costo o presupuesto sugerido: $${budget}.` : ""}`;
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
  const inferred = inferPublicationClassificationFromText(payload);
  payload.categoria_principal = inferred.category || payload.categoria_principal;
  payload.subcategoria = inferred.subcategory || payload.subcategoria || "";
  payload.intencion = inferred.intent || payload.intencion;
  const evaluation = evaluatePublication(payload);
  payload.estado = evaluation.status;
  payload.referencia = evaluation.reasons.length
    ? `Revisión automática: ${evaluation.reasons.join(", ")} · Sugerencia: ${inferred.label}`
    : `Activación automática v4.7.3 · Clasificación: ${inferred.label}`;
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
    <p><strong>Clasificación sugerida:</strong> ${escapeHtml(payload.categoria_principal || "")} · ${escapeHtml(payload.subcategoria || "")}</p>
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
    trackEvent("publicacion_creada", item, { estado_resultado: active ? "activo" : "revision" });
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
  updateMunicipalityFilterOptions();
  const state = document.getElementById("stateFilter")?.value || "";
  ensureMunicipalitiesForState(state);
  renderPublications();
}
function resetLocationFilters() {
  clearNearbyMode();
  document.getElementById("stateFilter").value = "";
  updateMunicipalityFilterOptions();
  renderPublications();
}

function activateAllCategoryFilterSafe() {
  const category = document.getElementById("categoryFilter");
  const chipSearch = document.getElementById("chipSearchFilter");
  if (category) category.value = "";
  if (chipSearch) chipSearch.value = "";
  const chips = Array.from(document.querySelectorAll(".filter-chip"));
  if (!chips.length) return;
  chips.forEach((b, idx) => b.classList.toggle("active", idx === 0 || (b.dataset.filterCategory === "" && b.dataset.filterSearch === "" && b.textContent.trim().toLowerCase() === "todo")));
}

function setCategoryChip(button) {
  document.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));
  button.classList.add("active");
  document.getElementById("categoryFilter").value = button.dataset.filterCategory || "";
  const chipSearch = document.getElementById("chipSearchFilter");
  if (chipSearch) chipSearch.value = button.dataset.filterSearch || "";
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
function resetPublicationFiltersToAllMexico() {
  const stateEl = document.getElementById("stateFilter");
  const munEl = document.getElementById("municipalityFilter");
  const searchEl = document.getElementById("mainSearch");
  const categoryEl = document.getElementById("categoryFilter");
  const chipSearchEl = document.getElementById("chipSearchFilter");
  if (stateEl) stateEl.value = "";
  updateMunicipalityFilterOptions();
  if (munEl) munEl.value = "";
  if (searchEl) searchEl.value = "";
  if (categoryEl) categoryEl.value = "";
  if (chipSearchEl) chipSearchEl.value = "";
  activateAllCategoryFilterSafe();
}

async function requestNearbyPublications() {
  trackEvent("click_publicaciones_cerca");
  showSection("publicaciones");

  // v4.8.4: filtros visibles congelados; entrar desde Home abre Todo México.
  // No filtra por estado, municipio ni categoría; muestra todos los registros activos
  // y, si hay GPS, solo ordena los cercanos arriba.
  resetPublicationFiltersToAllMexico();
  const stateEl = document.getElementById("stateFilter");
  const munEl = document.getElementById("municipalityFilter");
  nearbyFallbackState = "";
  nearbyFallbackMunicipality = "";
  nearbyMode = true;
  if (stateEl) stateEl.value = "";
  if (munEl) { munEl.value = ""; munEl.disabled = true; }
  showToast("Mostrando todo México; si autorizas ubicación, las cercanas aparecen primero.");
  renderPublications();

  try {
    const pos = await getBrowserPosition();
    userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
    trackEvent("permiso_ubicacion_aceptado", null, { precision_m: Math.round(pos.coords.accuracy || 0) });
    renderPublications();
  } catch (error) {
    console.debug("Ubicación no disponible; se mantiene vista general.", error.message);
    trackEvent("permiso_ubicacion_rechazado");
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
  const chipSearch = normalize(document.getElementById("chipSearchFilter")?.value || "");
  updateFilterSummary(state, municipality);
  const nearbySummary = document.getElementById("nearbySummary");
  if (nearbySummary) nearbySummary.classList.toggle("hidden", !nearbyMode || !userLocation);

  const baseFiltered = list.filter(item => {
    const matchesCategory = !category || item.category === category;
    const haystack = normalize([folio(item), item.name, item.title, item.description, item.category, item.subcategory, item.state, item.municipality, item.locality, item.route, item.transport].join(" "));
    const matchesText = !search || haystack.includes(search);
    const chipWords = chipSearch ? chipSearch.split(/\s+/).filter(Boolean) : [];
    const matchesChip = !chipWords.length || chipWords.some(word => haystack.includes(word));
    return matchesCategory && matchesText && matchesChip;
  });

  if (nearbyMode) {
    const annotated = baseFiltered.map(item => {
      if (userLocation && hasCoordinates(item)) {
        const distanceKm = haversineKm(userLocation.lat, userLocation.lng, Number(item.lat), Number(item.lng));
        return { ...item, distanceKm, matchType: "gps" };
      }
      return { ...item, matchType: "general" };
    });

    // Conecta Servicios no debe esconder registros por falta de coordenadas.
    // Ordena los cercanos arriba, pero conserva todos los resultados activos.
    return annotated.sort((a, b) => {
      const ad = Number.isFinite(a.distanceKm) ? a.distanceKm : Number.POSITIVE_INFINITY;
      const bd = Number.isFinite(b.distanceKm) ? b.distanceKm : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
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
  if (!state) {
    el.textContent = "Todo México · municipios desactivados hasta elegir un estado";
  } else {
    el.textContent = municipality ? `${municipality}, ${state}` : `${state} · todos los municipios`;
  }
}
function categoryIcon(category) {
  const icons = {
    "Trabajo": "💼",
    "Servicios": "🛠",
    "Limpieza": "🧹",
    "Reparaciones": "🔧",
    "Entregas y mandados": "📦",
    "Movilidad": "🚘",
    "Viajes compartidos": "🚘",
    "Mensajería y envíos": "📦",
    "Negocios locales": "🏪",
    "Alimentos y ventas": "🍲",
    "Redes sociales": "🔗",
    "Colaboración general": "🤝"
  };
  return icons[category] || "📌";
}
function compactPublicationCard(item) {
  const icon = categoryIcon(item.category);
  const distanceText = nearbyMode && userLocation && Number.isFinite(item.distanceKm) ? ` · 📍 ${distanceLabel(item.distanceKm)}` : (nearbyMode && item.matchType === "municipio" ? " · 📍 mismo municipio" : "");
  const meta = [item.municipality, item.state, folio(item)].filter(Boolean).join(" · ") + distanceText;
  const originalUrl = item.category === "Redes sociales" && item.route ? (/^https?:\/\//i.test(item.route) ? item.route : `https://${item.route}`) : "";
  const originalLink = originalUrl ? `<button class="link-button original-link" type="button" onclick="openOriginalLink('${item.id}')">Ver publicación original</button>` : "";
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
        ${cleanPhone(item.phone) ? `<button class="btn-small btn-green" onclick="contactPublication('${item.id}')">WhatsApp</button>` : ""}
        <button class="btn-small btn-outline" onclick="sharePublication('${item.id}')">Compartir</button>
        <button class="btn-small btn-ghost" onclick="requestModification('${item.id}')">Solicitar modificación</button>
        <button class="btn-small btn-ghost" onclick="requestAttended('${item.id}')">Solicitar atendido</button>
      </div>
    </div>
  </article>`;
}
function togglePublicationDetail(id) {
  const card = document.getElementById(`pub-${id}`);
  if (!card) return;
  const willOpen = !card.classList.contains("open");
  card.classList.toggle("open");
  if (willOpen) {
    const item = publicationsCache.find(p => p.id === id);
    if (item) trackEvent("publicacion_abierta", item, { origen: "lista" });
  }
}
function renderPublications() {
  const list = document.getElementById("publicationsList");
  if (!list) return;
  if (isLoading) { renderLoading(); return; }
  const filtered = filterPublications(publicationsCache);
  const emptyMessage = nearbyMode
    ? "No hay publicaciones activas para mostrar en este momento. La ubicación solo ordena resultados, no los oculta."
    : "No hay registros con esos filtros. Prueba otro municipio o categoría.";
  list.innerHTML = filtered.length ? filtered.map(compactPublicationCard).join("") : `<div class="empty-state">${emptyMessage}</div>`;
  const summary = document.getElementById("resultsSummary");
  if (summary) {
    const state = document.getElementById("stateFilter")?.value || "";
    const municipality = document.getElementById("municipalityFilter")?.value || "";
    const scope = !state ? "Todo México" : (municipality ? `${municipality}, ${state}` : `${state} · todos los municipios`);
    const mode = nearbyMode ? " · vista general, cercanos primero si hay ubicación" : "";
    summary.textContent = `${filtered.length} resultado${filtered.length === 1 ? "" : "s"} encontrados · ${scope}${mode}`;
  }
  const count = document.getElementById("publicationsCount");
  if (count) count.textContent = publicationsCache.length;
}
function renderLoading() { const list = document.getElementById("publicationsList"); if (list) list.innerHTML = `<div class="empty-state">Cargando registros...</div>`; }

function myPublicationCard(item) {
  const icon = categoryIcon(item.category);
  const meta = [item.municipality, item.state, folio(item)].filter(Boolean).join(" · ");
  return `<article class="compact-publication my-publication-card" id="my-pub-${item.id}">
    <button class="compact-summary" type="button" onclick="toggleMyPublicationDetail('${item.id}')">
      <span class="compact-icon">${icon}</span>
      <span><span class="compact-title">${escapeHtml(item.title)}</span><span class="compact-meta">${escapeHtml(meta)} · ${maskPhone(item.phone)}</span></span>
      <span class="compact-chevron">›</span>
    </button>
    <div class="compact-detail">
      <span class="category-badge">${icon} ${escapeHtml(item.category)}</span>
      <p><strong>Publicado por:</strong> ${escapeHtml(item.name)}</p>
      <p class="description">${linkify(item.description)}</p>
      <p><strong>Estado:</strong> ${escapeHtml(item.status || "activo")} · <strong>Contacto:</strong> ${maskPhone(item.phone)}</p>
      <div class="detail-actions">
        <button class="btn-small btn-outline" onclick="sharePublication('${item.id}')">Compartir</button>
        <button class="btn-small btn-ghost" onclick="requestModification('${item.id}')">Solicitar cambio</button>
        <button class="btn-small btn-ghost" onclick="requestAttended('${item.id}')">Marcar como atendida</button>
      </div>
    </div>
  </article>`;
}
function toggleMyPublicationDetail(id) {
  const card = document.getElementById(`my-pub-${id}`);
  if (!card) return;
  card.classList.toggle("open");
}
function renderMyPublications() {
  const list = document.getElementById("myPublicationsList");
  if (!list) return;
  const raw = cleanPhone(document.getElementById("myPhoneSearch")?.value || "");
  if (!raw || raw.length < 4) {
    list.innerHTML = `<div class="empty-state">Escribe al menos los últimos 4 dígitos del WhatsApp registrado.</div>`;
    return;
  }
  const matches = publicationsCache.filter(item => {
    const phone = cleanPhone(item.phone);
    return raw.length >= 10 ? phone === raw || phone.endsWith(raw.slice(-10)) : phone.endsWith(raw);
  });
  list.innerHTML = matches.length ? matches.map(myPublicationCard).join("") : `<div class="empty-state">No encontramos publicaciones activas con esos dígitos. Si tu publicación está en revisión, revisa con Oficina / Contacto.</div>`;
}

function renderAll() { renderPublications(); updateHomeCounts(); renderOpportunities(false); renderMyPublications(); if (adminUnlocked) renderAdminPublications(); }
setInterval(updateHomeCounts, 3500);
function updateHomeCounts() {
  const count = document.getElementById("publicationsCount");
  const growth = document.getElementById("growthMessage");
  const total = publicationsCache.length;
  if (count) count.textContent = total;
  if (growth) {
    let messages = [
      "Sé de los primeros en registrarte gratis",
      "Tu oportunidad puede estar cerca de ti",
      "Publica hoy y empieza a conectar"
    ];
    if (total >= 30) messages = [
      "Comunidad en crecimiento: súmate gratis",
      "Sé parte de la nueva economía local",
      "Tu servicio puede estar más cerca de quien lo necesita"
    ];
    if (total >= 100) messages = [
      "Las oportunidades locales están tomando fuerza",
      "Conecta, publica y activa tu economía local",
      "No te quedes fuera de las oportunidades de tu zona"
    ];
    growth.textContent = messages[Math.floor(Date.now() / 3500) % messages.length];
  }
}
function contactPublication(id) {
  const item = publicationsCache.find(p => p.id === id) || adminCache.find(p => p.id === id);
  if (!item) return;
  trackEvent("click_whatsapp", item);
  openWhatsApp(cleanPhone(item.phone), encodeURIComponent(`Hola, vi tu publicación ${folio(item)} en Conecta Servicios: ${item.title}`));
}
function openOriginalLink(id) {
  const item = publicationsCache.find(p => p.id === id) || adminCache.find(p => p.id === id);
  if (!item || !item.route) return;
  trackEvent("click_ver_original_redes", item);
  const url = /^https?:\/\//i.test(item.route) ? item.route : `https://${item.route}`;
  window.open(url, "_blank", "noopener,noreferrer");
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
  trackEvent("click_compartir", item);
  const data = { title: item.title, text: `Mira esta publicación en Conecta Servicios:

${item.title}
${item.municipality}, ${item.state}
`, url: shareUrlFor(item) };
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
  const systemNeed = humanNeedForPublication(item);
  return `<article class="card admin-card">
    <div class="card-top"><div><span class="folio">${folio(item)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.name)} · ${escapeHtml(item.category)}${item.subcategory ? ` / ${escapeHtml(item.subcategory)}` : ""} · ${escapeHtml(item.municipality)}, ${escapeHtml(item.state)}</p></div><span class="status ${item.status}">${item.status}</span></div>
    <p>${escapeHtml(item.description).slice(0, 180)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(cleanPhone(item.phone))} · últimos 4: ${last4(item.phone)}</p>
    <p class="admin-classification"><strong>Sistema:</strong> ${escapeHtml(systemNeed.label)} · <small>${escapeHtml(systemNeed.help)}</small></p>
    <div class="admin-actions">
      <button class="btn-small btn-green" onclick="setPublicationStatus('${item.id}','activo')">Activo</button>
      <button class="btn-small btn-outline" onclick="setPublicationStatus('${item.id}','revision')">Revisión</button>
      <button class="btn-small btn-ghost" onclick="setPublicationStatus('${item.id}','oculto')">Oculto</button>
      <button class="btn-small btn-purple" onclick="setPublicationStatus('${item.id}','atendido')">Atendido</button>
      <button class="btn-small btn-outline" onclick="openEditDialog('${item.id}')">Editar</button>
      <button class="btn-small btn-gold" onclick="openReclassifyDialog('${item.id}')">Reclasificar</button>
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
  const filtered = adminCache.filter(item => {
    const sys = humanNeedForPublication(item);
    const bag = [folio(item), item.id, item.name, item.title, item.phone, last4(item.phone), item.category, item.subcategory, item.intent, item.municipality, item.state, item.status, sys.label, sys.key].join(" ");
    return !search || normalize(bag).includes(search);
  });
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
function openSharedPublicationById(id) {
  if (!id) return;
  const item = publicationsCache.find(p => String(p.id) === String(id));
  showSection("publicaciones", false);
  if (!item) {
    renderPublications();
    showToast("No encontramos esa publicación activa. Puede estar en revisión u oculta.");
    trackEvent("enlace_directo_no_encontrado", null, { publicacion_id: String(id) });
    return;
  }
  nearbyMode = false;
  const category = document.getElementById("categoryFilter");
  const state = document.getElementById("stateFilter");
  const municipality = document.getElementById("municipalityFilter");
  const search = document.getElementById("mainSearch");
  if (category) category.value = "";
  if (state) state.value = item.state || DEFAULT_STATE;
  if (municipality) { municipality.disabled = false; municipality.value = item.municipality || ""; }
  if (search) search.value = "";
  document.querySelectorAll(".filter-chip").forEach(b => b.classList.toggle("active", !b.dataset.filterCategory));
  renderPublications();
  setTimeout(() => {
    const card = document.getElementById(`pub-${id}`);
    if (card) {
      card.classList.add("open");
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      trackEvent("publicacion_abierta", item, { origen: "enlace_directo" });
      showToast("Abriendo publicación compartida");
    }
  }, 250);
}
function maybeOpenSharedPublication() {
  const id = pendingSharedPublicationId || new URLSearchParams(location.search).get("pub");
  if (id) openSharedPublicationById(id);
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
    else if (normalized.includes("tienda") || normalized.includes("negocio")) title.value = "Publico mi tienda o negocio local";
    else if (normalized.includes("limpieza")) title.value = "Ofrezco servicio de limpieza";
    else if (normalized.includes("reparaciones")) title.value = "Ofrezco reparaciones del hogar";
    else if (normalized.includes("plomeria")) title.value = "Ofrezco plomería básica";
    else if (normalized.includes("electricidad")) title.value = "Ofrezco electricidad básica";
    else if (normalized.includes("jardineria")) title.value = "Ofrezco jardinería";
    else if (normalized.includes("mensajeria") || normalized.includes("entrega")) title.value = "Ofrezco mensajería y entregas";
  }
  showToast(`Ruta seleccionada: ${routeName}. Completa tus datos para publicar.`);
}




const RECLASSIFICATION_PRESETS = {
  busca_necesita: {
    label: "Busca / Necesita",
    category: "Servicios",
    subcategory: "Solicitud de apoyo o servicio",
    intent: "Busco / Necesito",
    help: "Para publicaciones donde alguien pide ayuda, busca personal, solicita un servicio o necesita resolver algo."
  },
  ofrece_disponible: {
    label: "Ofrece / Tiene disponible",
    category: "Servicios",
    subcategory: "Servicio disponible",
    intent: "Ofrezco / Tengo disponible",
    help: "Para publicaciones donde alguien ofrece trabajo, oficio, servicio, producto, negocio o disponibilidad."
  },
  informacion_local: {
    label: "Información local / Redes",
    category: "Redes sociales",
    subcategory: "Aviso externo o información local",
    intent: "Información o acuerdo local",
    help: "Para enlaces externos, avisos de redes sociales o información útil sin copiar contenido ajeno."
  }
};
function reclassificationOptionsHtml(selected = "") {
  return Object.entries(RECLASSIFICATION_PRESETS).map(([key, preset]) => `<option value="${key}" ${key === selected ? "selected" : ""}>${preset.label}</option>`).join("");
}
function keywordAny(text, words) {
  const haystack = normalize(text);
  return words.some(word => haystack.includes(normalize(word)));
}
function inferPublicationClassificationFromText(values = {}) {
  const title = values.title || values.titulo || "";
  const description = values.description || values.descripcion || "";
  const currentCategory = values.category || values.categoria_principal || "";
  const currentIntent = values.intent || values.intencion || "";
  const transport = values.transport || values.medio || "";
  const route = values.route || values.ruta || "";
  const haystack = normalize([title, description, currentCategory, currentIntent, transport, route].join(" "));

  const lookingForJob = keywordAny(haystack, ["busco trabajo", "busco empleo", "solicito empleo", "necesito trabajo", "busco chamba", "disponible para trabajar", "me ofrezco para trabajar"]);
  if (lookingForJob) return { key: "ofrece_disponible", label: "Persona disponible para trabajar", category: "Trabajo", subcategory: "Busca empleo / disponible para trabajar", intent: "Ofrezco / Tengo disponible", help: "Persona que busca empleo o está disponible para trabajar." };

  const jobOrNeed = keywordAny(haystack, ["vacante", "se solicita", "solicito personal", "busco personal", "contrato", "contratar", "necesito ayudante", "busco ayudante", "busco quien", "necesito quien", "necesito limpiar", "necesito lavar", "necesito un mandado", "busco", "necesito", "requiero", "ocupo", "me urge"]);
  const offer = keywordAny(haystack, ["ofrezco", "hago", "realizo", "servicio de", "doy servicio", "disponible", "vendo", "venta de", "tengo", "negocio", "tienda", "panader", "papeler", "estetica", "estética", "ferreter", "tortiller", "restaurante", "taquer"]);
  const mobility = keywordAny(haystack, ["mensaj", "entrega", "entregas", "mandado", "mandados", "movilidad", "viaje", "viajes", "traslado", "paquete", "documento", "moto", "bicicleta", "bici", "auto", "camioneta", "mudanza", "ruta", "waze"]);
  const cleaning = keywordAny(haystack, ["limpieza", "limpiar", "aseo", "lavar", "lavado", "terreno", "patio"]);
  const repair = keywordAny(haystack, ["reparacion", "reparación", "plomer", "electric", "jardiner", "mantenimiento", "carpinter", "pintura", "albañil", "albanil"]);
  const business = keywordAny(haystack, ["tienda", "tiendita", "negocio", "panader", "papeler", "ferreter", "estetica", "estética", "tortiller", "restaurante", "taquer", "miscelanea", "miscelánea", "vendo", "venta", "comida", "postres", "productos"]);

  let category = "Servicios";
  let subcategory = "General";
  if (mobility) { category = "Entregas y mandados"; subcategory = "Movilidad / entregas / mandados"; }
  else if (cleaning) { category = "Limpieza"; subcategory = "Limpieza / lavado / apoyo por día"; }
  else if (repair) { category = "Reparaciones"; subcategory = "Oficio / reparación / mantenimiento"; }
  else if (business) { category = "Negocios locales"; subcategory = "Negocio local / ventas"; }

  if (jobOrNeed && !offer) return { key: "busca_necesita", label: "Busca / Necesita", category, subcategory, intent: "Busco / Necesito", help: "Solicitud que debe aparecer como necesidad o búsqueda." };
  if (offer) return { key: "ofrece_disponible", label: "Ofrece / Tiene disponible", category, subcategory, intent: "Ofrezco / Tengo disponible", help: "Oferta, servicio o negocio disponible." };
  return { key: "busca_necesita", label: "Busca / Necesita", category, subcategory, intent: "Busco / Necesito", help: "Clasificación general por revisar." };
}
function humanNeedForPublication(item) {
  return inferPublicationClassificationFromText(item || {});
}
function openReclassifyDialog(id) {
  const item = adminCache.find(p => p.id === id);
  if (!item) return;
  const guess = humanNeedForPublication(item);
  document.getElementById("reclassId").value = item.id;
  document.getElementById("reclassTitle").textContent = `${folio(item)} · ${item.title}`;
  document.getElementById("reclassNeed").innerHTML = reclassificationOptionsHtml(guess.key);
  document.getElementById("reclassCategory").value = item.category || guess.category;
  document.getElementById("reclassSubcategory").value = item.subcategory || guess.subcategory;
  document.getElementById("reclassIntent").value = item.intent || guess.intent;
  document.getElementById("reclassStatus").value = item.status || "revision";
  document.getElementById("reclassHelp").textContent = `Sugerencia: ${guess.label}. ${guess.help}`;
  document.getElementById("reclassDialog").showModal();
}
function applyReclassificationPreset() {
  const key = document.getElementById("reclassNeed").value;
  const preset = RECLASSIFICATION_PRESETS[key];
  if (!preset) return;
  document.getElementById("reclassCategory").value = preset.category;
  document.getElementById("reclassSubcategory").value = preset.subcategory;
  document.getElementById("reclassIntent").value = preset.intent;
  document.getElementById("reclassHelp").textContent = preset.help;
}
function closeReclassifyDialog() { document.getElementById("reclassDialog").close(); }
async function saveReclassification(event) {
  event.preventDefault();
  const id = document.getElementById("reclassId").value;
  const payload = {
    categoria_principal: document.getElementById("reclassCategory").value.trim(),
    subcategoria: document.getElementById("reclassSubcategory").value.trim(),
    intencion: document.getElementById("reclassIntent").value,
    estado: document.getElementById("reclassStatus").value
  };
  try {
    await supabaseRequest(`publicaciones?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(payload) });
    closeReclassifyDialog();
    showToast("Publicación reclasificada");
    await loadAdminData();
    await loadRemoteData();
  } catch (error) { console.error(error); showToast("No se pudo reclasificar"); }
}

const OPPORTUNITY_NEED_MAP = {
  busco_trabajo_oportunidades: {
    label: "Busco trabajo u oportunidades",
    categories: ["Trabajo e ingresos", "Servicios para el hogar", "Mensajería y envíos", "Redes sociales"],
    exactIntent: "demanda",
    keywords: "vacante solicita personal busco personal contratar contrato necesito ayudante busco ayudante necesito quien busco quien necesito limpiar necesito lavar necesito mandado trabajo por dia trabajo por día pago por encargo oportunidad chamba empleo disponible"
  },
  empezar_algo_propio: {
    label: "Quiero empezar algo propio",
    categories: ["Trabajo e ingresos", "Servicios para el hogar", "Alimentos y ventas", "Mensajería y envíos", "Tiendas y negocios locales"],
    exactIntent: "oferta",
    keywords: "ofrezco servicio hago realizo vendo venta clientes negocio ingresos emprender comida limpieza reparacion entrega mandado jardineria plomeria electricidad"
  },
  busco_ayuda: {
    label: "Busco quién me ayude",
    categories: ["Servicios para el hogar", "Reparaciones y oficios", "Colaboración general"],
    exactIntent: "demanda",
    keywords: "busco necesito requiero ocupo ayuda apoyo limpieza reparacion plomeria electricidad carpinteria jardineria mantenimiento lavar terreno patio casa hogar"
  },
  movilidad_entregas: {
    label: "Necesito movilidad, entregas o mandados",
    categories: ["Mensajería y envíos", "Viajes compartidos"],
    exactIntent: "mixto",
    keywords: "entrega entregas mandado mandados movilidad viaje viajes traslado paquete documento moto bici auto camioneta mudanza ruta waze llevar recoger"
  },
  aprender_algo: {
    label: "Quiero aprender algo",
    categories: ["Aprende y emprende"],
    exactIntent: "aprendizaje",
    keywords: "aprende aprender curso capacitacion capacitar oficio emprender negocio publicar mejorar habilidades"
  },
  tengo_negocio: {
    label: "Tengo un negocio",
    categories: ["Tiendas y negocios locales", "Alimentos y ventas", "Redes sociales"],
    exactIntent: "oferta",
    keywords: "tienda tiendita negocio panaderia papeleria estetica ferreteria tortilleria comida ventas producto local entregas domicilio restaurante taqueria"
  },
  ver_personas_buscando_empleo: {
    label: "Quiero ver personas que buscan empleo",
    categories: ["Personas que buscan empleo", "Trabajo e ingresos", "Redes sociales"],
    exactIntent: "candidatos",
    keywords: "busco trabajo busco empleo solicito empleo necesito trabajo busco chamba me ofrezco disponible para trabajar oportunidad laboral trabajo de limpieza empleo en restaurante ayudante"
  }
};
function normalizeOpportunityNeedKeys(needs = []) {
  const map = {
    necesito_trabajo: "busco_trabajo_oportunidades",
    activarme_economicamente: "empezar_algo_propio",
    colaborar_comunidad: "busco_ayuda"
  };
  const normalized = (needs || []).map(key => map[key] || key).filter(key => OPPORTUNITY_NEED_MAP[key]);
  return Array.from(new Set(normalized));
}
function selectedOpportunityCriteria(prefs) {
  const needs = normalizeOpportunityNeedKeys(prefs.needs || []);
  const categories = new Set();
  const keywords = [];
  const labels = [];
  needs.forEach(key => {
    const cfg = OPPORTUNITY_NEED_MAP[key];
    if (!cfg) return;
    labels.push(cfg.label);
    (cfg.categories || []).forEach(c => categories.add(c));
    if (cfg.keywords) keywords.push(cfg.keywords);
  });
  return { categories: Array.from(categories), keywords, labels, needs };
}
function defaultOpportunityPreferences() {
  return {
    needs: ["busco_trabajo_oportunidades", "empezar_algo_propio"],
    state: DEFAULT_STATE,
    municipality: DEFAULT_MUNICIPALITY
  };
}
function getOpportunityPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(OPPORTUNITY_PREFS_KEY) || "{}");
    const prefs = { ...defaultOpportunityPreferences(), ...saved };
    prefs.needs = normalizeOpportunityNeedKeys(prefs.needs || defaultOpportunityPreferences().needs);
    if (!prefs.needs.length && (prefs.categories || prefs.keywords)) {
      const needs = [];
      if ((prefs.categories || []).includes("Mensajería y envíos") || (prefs.categories || []).includes("Viajes compartidos")) needs.push("movilidad_entregas");
      if ((prefs.categories || []).includes("General")) needs.push("empezar_algo_propio");
      if ((prefs.keywords || []).join(" ").includes("limpieza") || (prefs.keywords || []).join(" ").includes("reparacion")) needs.push("busco_ayuda");
      prefs.needs = needs.length ? needs : defaultOpportunityPreferences().needs;
    }
    return prefs;
  } catch { return defaultOpportunityPreferences(); }
}
function renderOpportunitySettings() {
  const prefs = getOpportunityPreferences();
  const needs = normalizeOpportunityNeedKeys(prefs.needs || []);
  document.querySelectorAll('input[name="oppNeed"]').forEach(input => input.checked = needs.includes(input.value));
  const state = document.getElementById("oppState");
  const municipality = document.getElementById("oppMunicipality");
  if (state) state.value = prefs.state || "";
  if (municipality) municipality.value = prefs.municipality || "";
}
function saveOpportunityPreferences() {
  const needs = normalizeOpportunityNeedKeys(Array.from(document.querySelectorAll('input[name="oppNeed"]:checked')).map(i => i.value));
  const prefs = {
    needs: needs.length ? needs : ["empezar_algo_propio"],
    state: document.getElementById("oppState")?.value || "",
    municipality: document.getElementById("oppMunicipality")?.value.trim() || ""
  };
  localStorage.setItem(OPPORTUNITY_PREFS_KEY, JSON.stringify(prefs));
  const criteria = selectedOpportunityCriteria(prefs);
  trackEvent("guardar_oportunidades", null, { intereses: criteria.labels, municipio: prefs.municipality, estado_nombre: prefs.state });
  renderOpportunities(true);
  showToast("Oportunidades configuradas");
}
function opportunityScore(item, prefs) {
  let score = 0;
  const criteria = selectedOpportunityCriteria(prefs);
  const inferred = humanNeedForPublication(item);
  const haystack = normalize([item.title, item.description, item.category, item.subcategory, item.intent, item.municipality, item.locality, item.route, item.transport, item.name].join(" "));
  const selectedKeys = criteria.needs || [];
  if (selectedKeys.includes(inferred.key)) score += 20;
  const categoryMatch = criteria.categories.includes(item.category);
  if (categoryMatch) score += 5;
  let keywordHits = 0;
  for (const group of criteria.keywords) {
    const words = group.split(/\s+/).map(normalize).filter(Boolean);
    if (words.some(w => haystack.includes(w))) keywordHits += 1;
  }
  if (keywordHits) score += 8 + keywordHits;
  if (prefs.state && normalize(item.state) === normalize(prefs.state)) score += 2;
  if (prefs.municipality && normalize(item.municipality).includes(normalize(prefs.municipality))) score += 5;
  if (!categoryMatch && !keywordHits && !selectedKeys.includes(inferred.key)) score = 0;
  return score;
}
function opportunityReason(item, prefs) {
  const criteria = selectedOpportunityCriteria(prefs);
  const reasons = [];
  const inferred = humanNeedForPublication(item);
  if ((criteria.needs || []).includes(inferred.key)) reasons.push(inferred.label);
  const haystack = normalize([item.title, item.description, item.category, item.subcategory, item.intent, item.municipality, item.locality, item.route, item.transport, item.name].join(" "));
  for (const key of (criteria.needs || [])) {
    const cfg = OPPORTUNITY_NEED_MAP[key];
    if (!cfg) continue;
    const words = (cfg.keywords || "").split(/\s+/).map(normalize).filter(Boolean);
    const cat = (cfg.categories || []).includes(item.category);
    const word = words.some(w => haystack.includes(w));
    if (cat || word) reasons.push(cfg.label);
  }
  if (prefs.municipality && normalize(item.municipality).includes(normalize(prefs.municipality))) reasons.push("tu municipio");
  if (!reasons.length && criteria.labels.length) reasons.push(criteria.labels[0]);
  if (!reasons.length) reasons.push("interés relacionado");
  return Array.from(new Set(reasons)).slice(0,3).join(" · ");
}
function opportunityCard(item, reason) {
  const icon = categoryIcon(item.category);
  const meta = [item.municipality, item.state, folio(item)].filter(Boolean).join(" · ");
  return `<article class="compact-publication opportunity-card" id="opp-${item.id}">
    <button class="compact-summary" type="button" onclick="toggleOpportunityDetail('${item.id}')">
      <span class="compact-icon">${icon}</span>
      <span><span class="compact-title">${escapeHtml(item.title)}</span><span class="compact-meta">${escapeHtml(meta)} · ${maskPhone(item.phone)} · 🎯 ${escapeHtml(reason)}</span></span>
      <span class="compact-chevron">›</span>
    </button>
    <div class="compact-detail">
      <span class="category-badge">🎯 Oportunidad recomendada</span>
      <span class="category-badge">${icon} ${escapeHtml(item.category)}</span>
      <p><strong>Por qué aparece:</strong> coincide con ${escapeHtml(reason)}.</p>
      <p><strong>Publicado por:</strong> ${escapeHtml(item.name)}</p>
      <p class="description">${linkify(item.description)}</p>
      <p><strong>Contacto:</strong> ${maskPhone(item.phone)} · <strong>Costo:</strong> ${money(item.budget)}</p>
      <div class="detail-actions">
        ${cleanPhone(item.phone) ? `<button class="btn-small btn-green" onclick="contactPublication('${item.id}')">WhatsApp</button>` : ""}
        <button class="btn-small btn-outline" onclick="sharePublication('${item.id}')">Compartir</button>
        <button class="btn-small btn-ghost" onclick="showSection('publicaciones')">Ver más publicaciones</button>
      </div>
    </div>
  </article>`;
}
function toggleOpportunityDetail(id) {
  const card = document.getElementById(`opp-${id}`);
  if (!card) return;
  const willOpen = !card.classList.contains("open");
  card.classList.toggle("open");
  if (willOpen) {
    const item = publicationsCache.find(p => p.id === id);
    if (item) trackEvent("oportunidad_abierta", item, { origen: "oportunidades" });
  }
}
function renderOpportunities(scrollToList = false) {
  trackEvent("vista_oportunidades_rutas");
}

function openGuidedOpportunity(type) {
  openGuidedRoute(type);
}

async function loadAnalyticsData() {
  const panel = document.getElementById("analyticsPanel");
  if (panel) panel.innerHTML = `<div class="empty-state">Cargando analítica...</div>`;
  try {
    const rows = await supabaseRequest("eventos_analytics?select=*&order=creado_en.desc&limit=1000");
    analyticsCache = rows || [];
    renderAnalytics();
  } catch (error) {
    console.error(error);
    if (panel) panel.innerHTML = `<div class="empty-state">No se pudo cargar la analítica. Revisa que ejecutaste el SQL de v4.2 en Supabase.</div>`;
  }
}

const GUIDED_ROUTES = {
  empezar: {
    icon: "🚀",
    title: "Quiero empezar algo propio",
    intro: "Te ayudamos a elegir una idea sencilla, ordenar lo que puedes ofrecer y publicarlo para que personas cercanas te encuentren.",
    steps: [
      { title: "Elige algo que puedas hacer pronto", text: "Puedes iniciar con alimentos y ventas, limpieza, entregas, reparaciones sencillas o apoyo general. Lo importante es comenzar con algo claro y real." },
      { title: "Define zona, horario y forma de contacto", text: "Piensa dónde puedes trabajar, qué días puedes atender y cómo quieres que te contacten por WhatsApp." },
      { title: "Publica tu primer servicio", text: "Usa una frase directa como: Ofrezco limpieza de patios, Hago entregas locales en moto o Vendo comida por encargo." }
    ],
    actions: `<button class="btn-small btn-purple" onclick="startWizard('Ofrezco servicio o negocio')">Publicar mi primer servicio</button><button class="btn-small btn-outline" onclick="showSection('aprende')">Ver Aprende y emprende</button>`
  },
  negocio: {
    icon: "🏪",
    title: "Tengo un negocio",
    intro: "Tu negocio puede aparecer para que más personas de tu zona sepan qué vendes, dónde estás y cómo contactarte.",
    steps: [
      { title: "Publica lo esencial", text: "Nombre del negocio, productos principales, zona, horario, WhatsApp y enlaces de Facebook, Instagram o ubicación." },
      { title: "Conecta con mensajeros locales", text: "Si no tienes repartidor, busca personas cercanas que hagan mandados, entregas o traslados para apoyar tus pedidos." },
      { title: "Atrae clientes con publicaciones claras", text: "Publica promociones, productos principales o servicios especiales sin saturar de texto." }
    ],
    actions: `<button class="btn-small btn-purple" onclick="startLearningPublication('Tiendas y negocios locales')">Publicar mi negocio</button><button class="btn-small btn-outline" onclick="applyCategoryAndShow('Mensajería y envíos')">Buscar mensajeros locales</button>`
  }
};
function openGuidedRoute(type) {
  const route = GUIDED_ROUTES[type] || GUIDED_ROUTES.empezar;
  const target = document.getElementById("guidedRouteContent");
  if (!target) return;
  target.innerHTML = `<div class="guided-flow-card">
    <button class="btn-small btn-ghost" onclick="showSection('oportunidades')">← Volver</button>
    <div class="guided-flow-head"><span>${route.icon}</span><div><h2>${route.title}</h2><p>${route.intro}</p></div></div>
    <div class="guided-steps">${route.steps.map((step, idx) => `<article class="guided-step-card"><small>Paso ${idx + 1}</small><h3>${step.title}</h3><p>${step.text}</p></article>`).join("")}</div>
    <div class="route-actions guided-actions">${route.actions}</div>
  </div>`;
  showSection("rutaGuiada");
  trackEvent("ruta_guiada", null, { tipo: type });
}
function startLearnFlow(type) {
  const panel = document.getElementById("learnFlowPanel");
  if (!panel) return;
  const flows = {
    servicio: {
      icon: "🧭", title: "Qué puedo ofrecer", intro: "Piensa en algo que puedas resolver hoy: limpiar, entregar, cocinar, reparar, vender o apoyar por día.",
      items: ["Elige algo que sí puedas cumplir", "Define zona y horario", "Explica qué incluye", "Publica claro y corto"],
      action: `<button class="btn-small btn-purple" onclick="openOpportunityWizard('ingresos')">Guiarme para publicar</button>`
    },
    publicar: {
      icon: "✍️", title: "Publicar mejor mi servicio", intro: "Una publicación clara ayuda a que te contacten más rápido y con menos dudas.",
      items: ["Título directo", "Descripción breve", "Zona donde atiendes", "WhatsApp y condiciones"],
      action: `<button class="btn-small btn-purple" onclick="openOpportunityWizard('ingresos')">Crear publicación guiada</button>`
    },
    negocio: {
      icon: "🏪", title: "Mejorar mi negocio", intro: "Publica qué vendes, dónde atiendes y cómo te pueden contactar. Si necesitas entregas, busca mensajeros locales.",
      items: ["Nombre del negocio", "Productos o servicios", "Horario y zona", "Entregas o contacto"],
      action: `<button class="btn-small btn-purple" onclick="openOpportunityWizard('negocio')">Publicar mi negocio</button>`
    }
  };
  const flow = flows[type] || flows.servicio;
  panel.innerHTML = `<div class="guided-flow-card learn-flow-card">
    <div class="guided-flow-head"><span>${flow.icon}</span><div><h2>${flow.title}</h2><p>${flow.intro}</p></div></div>
    <div class="guided-steps">${flow.items.map((item, idx) => `<article class="guided-step-card"><small>Paso ${idx + 1}</small><h3>${item}</h3><p>Responde con información simple. La app te ayuda a convertirlo en una publicación útil.</p></article>`).join("")}</div>
    <div class="route-actions guided-actions">${flow.action}</div>
  </div>`;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
  trackEvent("guia_publicar_mejor", null, { tipo: type });
}

function countEvents(rows, name) { return rows.filter(r => r.evento === name).length; }
function uniqueSessions(rows) { return new Set(rows.map(r => r.session_id).filter(Boolean)).size; }
function renderMetric(label, value) { return `<div class="metric-card"><strong>${value}</strong><span>${label}</span></div>`; }
function topPublications(rows) {
  const map = new Map();
  rows.filter(r => r.publicacion_id).forEach(r => {
    const key = r.publicacion_id;
    const current = map.get(key) || { id: key, folio: r.folio || "", categoria: r.categoria || "", municipio: r.municipio || "", vistas: 0, whatsapp: 0, compartidos: 0 };
    if (r.evento === "publicacion_abierta") current.vistas += 1;
    if (r.evento === "click_whatsapp") current.whatsapp += 1;
    if (r.evento === "click_compartir") current.compartidos += 1;
    map.set(key, current);
  });
  return [...map.values()].sort((a,b) => (b.vistas + b.whatsapp*2 + b.compartidos) - (a.vistas + a.whatsapp*2 + a.compartidos)).slice(0, 8);
}
function renderAnalytics() {
  const panel = document.getElementById("analyticsPanel");
  if (!panel) return;
  const now = Date.now();
  const startToday = new Date(); startToday.setHours(0,0,0,0);
  const rowsToday = analyticsCache.filter(r => new Date(r.creado_en).getTime() >= startToday.getTime());
  const rows7 = analyticsCache.filter(r => new Date(r.creado_en).getTime() >= now - 7*24*60*60*1000);
  const top = topPublications(rows7);
  panel.innerHTML = `
    <div class="analytics-block">
      <h3>Hoy</h3>
      <div class="metrics-grid">
        ${renderMetric("visitantes aproximados", uniqueSessions(rowsToday))}
        ${renderMetric("clics en PUBLICA", countEvents(rowsToday, "click_publica"))}
        ${renderMetric("publicaciones abiertas", countEvents(rowsToday, "publicacion_abierta"))}
        ${renderMetric("clics a WhatsApp", countEvents(rowsToday, "click_whatsapp"))}
        ${renderMetric("compartidos", countEvents(rowsToday, "click_compartir"))}
        ${renderMetric("cerca de mí", countEvents(rowsToday, "click_publicaciones_cerca"))}
      </div>
    </div>
    <div class="analytics-block">
      <h3>Últimos 7 días</h3>
      <div class="metrics-grid">
        ${renderMetric("visitantes aproximados", uniqueSessions(rows7))}
        ${renderMetric("publicaciones creadas", countEvents(rows7, "publicacion_creada"))}
        ${renderMetric("publicaciones abiertas", countEvents(rows7, "publicacion_abierta"))}
        ${renderMetric("clics a WhatsApp", countEvents(rows7, "click_whatsapp"))}
        ${renderMetric("compartidos", countEvents(rows7, "click_compartir"))}
        ${renderMetric("Aprende y emprende", rows7.filter(r => r.evento === "vista_seccion" && r.detalle?.seccion === "aprende").length)}
        ${renderMetric("Oportunidades", rows7.filter(r => r.evento === "vista_seccion" && r.detalle?.seccion === "oportunidades").length + countEvents(rows7, "click_oportunidades"))}</div>
    </div>
    <div class="analytics-block">
      <h3>Publicaciones con más interés</h3>
      ${top.length ? top.map(item => `<div class="analytics-row"><strong>${escapeHtml(item.folio || item.id)}</strong><span>${escapeHtml(item.categoria)} · ${escapeHtml(item.municipio)}</span><small>${item.vistas} vistas · ${item.whatsapp} WhatsApp · ${item.compartidos} compartidos</small></div>`).join("") : `<div class="empty-state">Todavía no hay suficientes eventos registrados.</div>`}
    </div>
    <p class="small muted">La analítica es anónima y aproximada. No guarda nombres, teléfonos ni ubicación exacta de visitantes.</p>`;
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
    },
    precios: {
      title: "💵 Cómo poner precio a tu trabajo",
      text: "Calcula materiales, tiempo, traslado y dificultad. Explica desde el inicio qué incluye tu precio y qué cosas se cobran aparte."
    },
    primeros_clientes: {
      title: "📣 Cómo conseguir tus primeros clientes",
      text: "Publica claro, comparte tu enlace en grupos cercanos, pide recomendaciones y empieza con servicios sencillos que puedas cumplir bien."
    }
  };
  const item = guides[type] || guides.publicar;
  guide.innerHTML = `<strong>${item.title}</strong><p>${item.text}</p><button class="btn-small btn-purple" onclick="startWizard()">Publicar ahora</button>`;
  guide.scrollIntoView({ behavior: "smooth", block: "center" });
}


function isStandaloneMode() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}
function updateInstallCard() {
  const card = document.getElementById("installCard");
  const button = document.getElementById("installAppButton");
  if (!card) return;
  const installed = isStandaloneMode();
  card.classList.toggle("installed", installed);
  if (installed) {
    card.querySelector("p").textContent = "Ya estás usando Conecta Servicios como app instalada.";
    if (button) button.textContent = "Instalada";
    if (button) button.disabled = true;
  } else if (button && !deferredInstallPrompt) {
    button.textContent = "Instalar app";
  }
}
async function refreshAppCacheIfNeeded() {
  try {
    const previous = localStorage.getItem(APP_VERSION_KEY);
    if (previous !== PWA_VERSION) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith("conecta-servicios-")).map(key => caches.delete(key)));
      localStorage.setItem(APP_VERSION_KEY, PWA_VERSION);
    }
  } catch (error) {
    console.debug("No se pudo limpiar caché anterior", error.message);
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("service-worker.js");
  } catch (error) {
    console.warn("No se pudo registrar el service worker", error);
  }
}
async function installApp() {
  trackEvent("click_instalar_app");
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    updateInstallCard();
    if (choice?.outcome === "accepted") showToast("Instalación iniciada. Revisa tu pantalla de inicio.");
    else showToast("Puedes instalarla después desde el menú del navegador.");
    return;
  }
  showInstallHelp();
}
function showInstallHelp() {
  showSection("instalarApp");
  showToast("Te mostramos cómo instalarla en tu celular.");
}
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallCard();
});
window.addEventListener("appinstalled", () => {
  trackEvent("app_instalada");
  deferredInstallPrompt = null;
  updateInstallCard();
  showToast("Conecta Servicios quedó instalada.");
});

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
  pendingSharedPublicationId = params.get("pub") || params.get("publicacion");
  adminRouteEnabled = params.get("admin") === "1" || params.get("admin") === "true";
  document.getElementById("adminEntry").classList.toggle("hidden", !adminRouteEnabled);
  populateStateSelects();
  loadMunicipiosMx();
  document.getElementById("publicationForm").addEventListener("submit", submitPublication);
  document.getElementById("editForm").addEventListener("submit", saveEdit);
  document.getElementById("reclassForm")?.addEventListener("submit", saveReclassification);
  document.getElementById("externalLinkForm")?.addEventListener("submit", submitExternalLink);
  document.getElementById("pubState")?.addEventListener("change", () => handlePairedStateChange("pubState", "pubMunicipality", "Selecciona municipio"));
  document.getElementById("notifState")?.addEventListener("change", () => handlePairedStateChange("notifState", "notifMunicipality", "Todos los municipios"));
  document.getElementById("externalState")?.addEventListener("change", () => handlePairedStateChange("externalState", "externalMunicipality", "Selecciona municipio"));
  history.replaceState({ section: "inicio" }, "", routeUrlForSection("inicio"));
  document.querySelector(".app-shell")?.classList.add("home-mode");
  updateWizard();
  updateCategoryDetails();
  initMobileFormComfort();
  refreshAppCacheIfNeeded().finally(registerServiceWorker);
  updateInstallCard();
  renderNotificationSettings();
  renderOpportunitySettings();
  trackEvent("visita_home");
  loadRemoteData().then(maybeOpenSharedPublication);
  setInterval(() => loadRemoteData({ silent: true }), 60000);
}
document.addEventListener("DOMContentLoaded", init);


// v4.8.6 — Presentación inversionistas: home limpio, filtros simples, chat piloto y cursos
let smartLastSuggestion = { query: "", category: "" };

const DEFAULT_CHAT_MESSAGES = [];

const COURSE_CATALOG = [
  {
    title: "Oficios y empleo",
    provider: "Fundación Carlos Slim · Capacítate para el empleo",
    tag: "Oficios",
    icon: "🛠",
    keywords: "oficios empleo electricidad reparación construcción mantenimiento cocina limpieza ventas oficio autoempleo",
    description: "Cursos para aprender habilidades prácticas y mejorar oportunidades de ingreso.",
    url: "https://capacitateparaelempleo.org/cursos"
  },
  {
    title: "Autoempleo y negocio local",
    provider: "Fundación Carlos Slim · Aprende.org",
    tag: "Negocio",
    icon: "🏪",
    keywords: "autoempleo negocio local emprender administración finanzas comercio ventas clientes ingresos",
    description: "Rutas útiles para organizar un servicio, negocio o actividad independiente.",
    url: "https://aprende.org/capacitate"
  },
  {
    title: "Alimentos y ventas",
    provider: "Fundación Carlos Slim · Capacítate para el empleo",
    tag: "Ventas",
    icon: "🍲",
    keywords: "alimentos cocina ventas comercio comida preparación atención cliente negocio",
    description: "Opciones para personas que venden comida, productos o servicios de atención al cliente.",
    url: "https://capacitateparaelempleo.org/cursos"
  },
  {
    title: "Computación y tecnología básica",
    provider: "Fundación Carlos Slim · Aprende.org",
    tag: "Tecnología",
    icon: "💻",
    keywords: "computación tecnología celular redes sociales internet aplicaciones digitalizate software sistemas",
    description: "Capacitación para usar mejor computadora, celular, internet y herramientas digitales.",
    url: "https://capacitateparaelempleo.org/categorias/view/7"
  },
  {
    title: "Marketing digital",
    provider: "Google Actívate / Skillshop",
    tag: "Digital",
    icon: "📈",
    keywords: "marketing digital ventas online comercio electrónico google negocio clientes anuncios internet",
    description: "Cursos para promocionar servicios, negocios y productos usando herramientas digitales.",
    url: "https://skillshop.exceedlms.com/sl/d9e04e29"
  },
  {
    title: "Productividad y búsqueda de empleo",
    provider: "Crece con Google",
    tag: "Empleo",
    icon: "📋",
    keywords: "productividad empleo trabajo carrera currículum entrevista habilidades profesionales negocio",
    description: "Herramientas y cursos para mejorar habilidades laborales y crecimiento profesional.",
    url: "https://grow.google/intl/es/courses-and-tools/"
  },
  {
    title: "Inteligencia artificial y datos",
    provider: "IBM SkillsBuild",
    tag: "IA",
    icon: "🤖",
    keywords: "inteligencia artificial ia datos tecnología nube ciberseguridad programación skillsbuild ibm",
    description: "Formación gratuita para iniciar en habilidades tecnológicas de alta demanda.",
    url: "https://skillsbuild.org/es/adult-learners"
  },
  {
    title: "Ciberseguridad y nube",
    provider: "IBM SkillsBuild",
    tag: "Tecnología",
    icon: "☁️",
    keywords: "ciberseguridad nube tecnología seguridad digital internet datos ibm skillsbuild",
    description: "Rutas para conocer seguridad digital, nube y competencias tecnológicas básicas.",
    url: "https://skillsbuild.org/es/"
  }
];

function loadChatMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "null");
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_CHAT_MESSAGES;
  } catch {
    return DEFAULT_CHAT_MESSAGES;
  }
}
function saveChatMessages(messages) {
  try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40))); } catch {}
}
function renderSmartChat() {
  const list = document.getElementById("chatMessages");
  if (!list) return;
  const messages = loadChatMessages();
  list.innerHTML = messages.map(message => `<div class="chat-bubble ${message.role === "user" ? "user" : "bot"}">${linkify(message.text)}</div>`).join("");
  list.scrollTop = list.scrollHeight;
}
function pushChat(role, text) {
  const messages = loadChatMessages();
  messages.push({ role, text, at: new Date().toISOString() });
  saveChatMessages(messages);
  renderSmartChat();
}
function fillSmartMessage(text) {
  const input = document.getElementById("smartMessageInput");
  if (!input) return;
  input.value = text;
  input.focus();
}
function detectSmartIntent(rawText) {
  const text = normalize(rawText);
  if (/paquete|mandado|enviar|entrega|documento|reparto|llevar|traer|moto|bicicleta/.test(text)) {
    return { category: "Mensajería y envíos", query: "paquete entrega mandado", label: "Mensajería y envíos", action: "buscar" };
  }
  if (/viaje|viajar|ruta|traslado|ride|avent[oó]n|pasaje|llevarme|toluca|cdmx|pachuca|cuernavaca/.test(text)) {
    return { category: "Viajes compartidos", query: "viaje ruta traslado", label: "Viajes compartidos", action: "buscar" };
  }
  if (/aprend|curso|capacita|clase|enseña|ensenar|mejorar|especializar|ingresos|oficio|carlos slim|google|skillsbuild/.test(text)) {
    return { category: "", query: "aprendizaje", label: "Cursos gratuitos", action: "aprender" };
  }
  if (/ofrezco|servicio|trabajo|clientes|vendo|reparo|limpio|hago|negocio|publicar/.test(text)) {
    return { category: "Servicios", query: "servicio trabajo clientes", label: "Publicar servicio", action: "publicar" };
  }
  return { category: "", query: text.split(/\s+/).slice(0, 4).join(" "), label: "Búsqueda general", action: "buscar" };
}
function smartReplyFor(raw) {
  const intent = detectSmartIntent(raw);
  smartLastSuggestion = { query: intent.query, category: intent.category };
  if (intent.action === "aprender") return "Te conviene entrar a Aprendizaje. Ahí agregué cursos gratuitos como Fundación Carlos Slim, Google Actívate e IBM SkillsBuild para mejorar habilidades desde el celular.";
  if (intent.action === "publicar") return "Esto parece una oportunidad para publicar. Puedo llevarte al registro guiado para crear una publicación clara con municipio, categoría y WhatsApp protegido.";
  return `Encontré una ruta posible: ${intent.label}. Puedo buscar coincidencias o ayudarte a publicar la necesidad si no aparece una opción adecuada.`;
}
function sendSmartChatMessage() {
  const input = document.getElementById("smartMessageInput");
  const panel = document.getElementById("smartMessageResult");
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) { showToast("Escribe un mensaje primero"); return; }
  pushChat("user", raw);
  input.value = "";
  const reply = smartReplyFor(raw);
  setTimeout(() => pushChat("bot", reply), 180);
  if (panel) panel.innerHTML = "";
  trackEvent("mensaje_chat_enviado", null, { intencion: detectSmartIntent(raw).label });
}
function handleSmartMessage() { sendSmartChatMessage(); }
function smartShowSuggested() {
  showSection("publicaciones");
  setTimeout(() => {
    const search = document.getElementById("mainSearch");
    const category = document.getElementById("categoryFilter");
    const chipSearch = document.getElementById("chipSearchFilter");
    if (search) search.value = smartLastSuggestion.query || "";
    if (category) category.value = smartLastSuggestion.category || "";
    if (chipSearch) chipSearch.value = "";
    document.querySelectorAll(".filter-chip").forEach(button => {
      const isAll = !smartLastSuggestion.category && !button.dataset.filterCategory && !button.dataset.filterSearch && button.textContent.trim().toLowerCase() === "todo";
      const isCategory = smartLastSuggestion.category && button.dataset.filterCategory === smartLastSuggestion.category;
      button.classList.toggle("active", Boolean(isAll || isCategory));
    });
    renderPublications();
    search?.focus();
  }, 60);
}
function setCourseSearch(value) {
  const input = document.getElementById("courseSearch");
  if (input) input.value = value;
  renderCourseCards();
}
function renderCourseCards() {
  const list = document.getElementById("courseList");
  if (!list) return;
  const q = normalize(document.getElementById("courseSearch")?.value || "");
  const courses = COURSE_CATALOG.filter(course => {
    const haystack = normalize([course.title, course.provider, course.tag, course.keywords, course.description].join(" "));
    return !q || q.split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
  });
  list.innerHTML = courses.length ? courses.map(course => `<button class="course-card course-button-card" type="button" onclick="openCourseLink('${course.url}')">
    <span class="course-icon">${escapeHtml(course.icon || "🎓")}</span>
    <span>
      <small>${escapeHtml(course.tag)}</small>
      <strong>${escapeHtml(course.title)}</strong>
      <p>${escapeHtml(course.description)}</p>
      <b>${escapeHtml(course.provider)}</b>
    </span>
    <span class="course-open-pill">Ver</span>
  </button>`).join("") : `<div class="empty-state">No encontré cursos con esa palabra. Prueba “oficios”, “ventas”, “tecnología” o “negocio”.</div>`;
}
function openCourseLink(url) {
  trackEvent("abrir_curso_externo", null, { url });
  window.open(url, "_blank", "noopener,noreferrer");
}

document.addEventListener("DOMContentLoaded", () => {
  renderSmartChat();
  renderCourseCards();
});
