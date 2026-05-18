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
const PWA_VERSION = "v4.9.11-flujos-encuesta";

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
const CHAT_STORAGE_KEY = "conecta_business_chat_v494";
const ERRAND_STORAGE_KEY = "conecta_mandados_verificados_v492";

// v4.9.11 — Home carrusel, oportunidades reorganizadas y flujos tipo encuesta
// Muestra publicaciones curadas y oculta los registros reales de Supabase en la vista pública.
// Supabase sigue intacto; administración y futuras versiones pueden volver a producción cambiando esta bandera.
const PRESENTATION_PILOT_MODE = true;
let pilotTypeFilter = "";

const PILOT_PUBLICATIONS = [
  {
    id: "PILOTO-SOL-001", pilotType: "solicitantes", roleLabel: "Solicitante", relationLabel: "Necesita apoyo",
    name: "María G.", title: "Necesito mandado a la Central de Abastos", category: "Mandados Verificados", subcategory: "Compra con evidencia",
    description: "Solicito compra de frutas y verduras para la semana. Busco agente que pueda registrar precio, peso, ticket, cambio y entrega final.",
    state: "México", municipality: "Chapultepec", locality: "Centro", phone: OFFICE_PHONE, budget: 150, status: "activo", createdAt: "2026-05-18T10:00:00Z", nextStep: "Solicitar mandado verificado"
  },
  {
    id: "PILOTO-AGE-001", pilotType: "agentes", roleLabel: "Agente", relationLabel: "Ofrece apoyo",
    name: "Carlos R.", title: "Hago mandados en moto con evidencia", category: "Mandados Verificados", subcategory: "Agente de compras",
    description: "Disponible para compras locales, farmacia, mercado y entregas pequeñas. Puedo subir evidencia del mandado paso a paso.",
    state: "México", municipality: "Mexicaltzingo", locality: "Centro", phone: OFFICE_PHONE, budget: 0, status: "activo", createdAt: "2026-05-18T09:40:00Z", nextStep: "Contactar agente"
  },
  {
    id: "PILOTO-NEG-001", pilotType: "negocios", roleLabel: "Negocio local", relationLabel: "Catálogo futuro",
    name: "Panadería San Miguel", title: "Pan dulce y pedidos por WhatsApp", category: "Negocios locales", subcategory: "Panadería",
    description: "Negocio local con pedidos por encargo. En una siguiente etapa podrá mostrar catálogo, carrito, pago y entrega o pickup.",
    state: "México", municipality: "Chapultepec", locality: "El Ameyal", phone: OFFICE_PHONE, budget: 0, status: "activo", createdAt: "2026-05-18T09:20:00Z", nextStep: "Abrir chat del negocio"
  },
  {
    id: "PILOTO-NEG-002", pilotType: "negocios", roleLabel: "Negocio local", relationLabel: "Agenda futura",
    name: "Estética Bella", title: "Cortes, uñas y citas por agenda", category: "Negocios locales", subcategory: "Estética",
    description: "Servicio por cita. La visión es que el cliente pueda chatear, elegir servicio, pagar cita y agendar horario desde la app.",
    state: "México", municipality: "Metepec", locality: "Centro", phone: OFFICE_PHONE, budget: 0, status: "activo", createdAt: "2026-05-18T09:10:00Z", nextStep: "Ver agenda futura"
  },
  {
    id: "PILOTO-NEG-003", pilotType: "negocios", roleLabel: "Negocio local", relationLabel: "Inventario futuro",
    name: "Ferretería La Esquina", title: "Herramientas, material y entrega local", category: "Negocios locales", subcategory: "Ferretería",
    description: "Ideal para catálogo por productos, pedido a carrito, pago y envío local o recolección en tienda.",
    state: "México", municipality: "Toluca", locality: "Centro", phone: OFFICE_PHONE, budget: 0, status: "activo", createdAt: "2026-05-18T09:00:00Z", nextStep: "Ver catálogo futuro"
  },
  {
    id: "PILOTO-SER-001", pilotType: "servicios", roleLabel: "Agente / prestador", relationLabel: "Ofrece servicio",
    name: "Don Luis Carpintería", title: "Reparaciones sencillas de madera", category: "Servicios", subcategory: "Carpintería",
    description: "Reparo puertas, cajones, bisagras y muebles pequeños. Trato directo, presupuesto claro y evidencia del trabajo si se requiere.",
    state: "México", municipality: "Calimaya", locality: "Centro", phone: OFFICE_PHONE, budget: 250, status: "activo", createdAt: "2026-05-18T08:50:00Z", nextStep: "Pedir cotización"
  },
  {
    id: "PILOTO-SOL-002", pilotType: "solicitantes", roleLabel: "Solicitante", relationLabel: "Busca servicio",
    name: "Oficina local", title: "Busco quien limpie un local pequeño", category: "Servicios", subcategory: "Limpieza",
    description: "Necesito limpieza por la mañana, una o dos veces por semana. Busco persona responsable de la zona para acordar directo.",
    state: "México", municipality: "Mexicaltzingo", locality: "Centro", phone: OFFICE_PHONE, budget: 180, status: "activo", createdAt: "2026-05-18T08:40:00Z", nextStep: "Ofrecer servicio"
  },
  {
    id: "PILOTO-CRE-001", pilotType: "crecimiento", roleLabel: "Campaña", relationLabel: "Por comisión",
    name: "Créditos para pensionados", title: "Busco agentes que consigan clientes interesados", category: "Agentes de crecimiento", subcategory: "Campaña por resultado",
    description: "Campaña piloto: el negocio paga comisión solo por contacto válido o cliente aprobado, con condiciones claras y trato directo.",
    state: "México", municipality: "Toluca", locality: "Zona centro", phone: OFFICE_PHONE, budget: 300, status: "activo", createdAt: "2026-05-18T08:30:00Z", nextStep: "Ver campaña"
  },
  {
    id: "PILOTO-MOV-001", pilotType: "servicios", roleLabel: "Agente", relationLabel: "Movilidad",
    name: "Ruta compartida Toluca", title: "Comparto viaje Chapultepec a Toluca", category: "Movilidad", subcategory: "Viaje compartido",
    description: "Salida por la mañana entre semana. Cooperación directa, puntos claros de encuentro y trato respetuoso.",
    state: "México", municipality: "Chapultepec", locality: "Avenida principal", phone: OFFICE_PHONE, budget: 50, status: "activo", createdAt: "2026-05-18T08:20:00Z", nextStep: "Contactar viaje"
  },
  {
    id: "PILOTO-EMB-001", pilotType: "crecimiento", roleLabel: "Embajador", relationLabel: "Activación local",
    name: "Embajador Conecta", title: "Invita negocios y usuarios en tu zona", category: "Embajadores Conecta", subcategory: "Referidos piloto",
    description: "Piloto para medir referidos de solicitantes, agentes, negocios y servicios. Sin cobros ni comisiones automáticas en esta etapa.",
    state: "México", municipality: "Chapultepec", locality: "Centro", phone: OFFICE_PHONE, budget: 0, status: "activo", createdAt: "2026-05-18T08:05:00Z", nextStep: "Registrar referido piloto"
  },
  {
    id: "PILOTO-APR-001", pilotType: "crecimiento", roleLabel: "Aprendizaje", relationLabel: "Curso útil",
    name: "Rutas gratuitas", title: "Aprende ventas, computación u oficio básico", category: "Aprendizaje", subcategory: "Cursos gratuitos",
    description: "Ruta piloto para mostrar cursos gratuitos que ayudan a mejorar servicios, negocios y oportunidades de ingreso.",
    state: "México", municipality: "Todo México", locality: "En línea", phone: OFFICE_PHONE, budget: 0, status: "activo", createdAt: "2026-05-18T08:10:00Z", nextStep: "Ver cursos"
  }
];

function getPilotPublications() {
  return PILOT_PUBLICATIONS.map(item => ({
    highlighted: true, approximateLocation: true, serviceRadiusKm: 10, lat: null, lng: null, route: "", departure: "", time: "", transport: "",
    ...item,
    isPilot: true
  }));
}


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
    // v4.8.7: no usamos estado=eq.activo en la URL para evitar que una diferencia
    // de mayúsculas, espacios o normalización en Supabase oculte publicaciones activas.
    // Traemos las publicaciones y filtramos en cliente de forma tolerante.
    const rows = await supabaseRequest("publicaciones?select=*&order=creado_en.desc");
    const mappedAll = (rows || []).map(mapPublication);
    const mapped = mappedAll.filter(item => normalize(item.status) === "activo");
    handleNotificationCheck(mapped);
    publicationsCache = PRESENTATION_PILOT_MODE ? getPilotPublications() : mapped;
    updateMunicipalityFilterOptions();
    renderCourseCards?.();
    renderSmartChat?.();
    setSyncStatus("", "ok");
    isLoading = false;
    renderAll();
  } catch (error) {
    console.error(error);
    isLoading = false;
    setSyncStatus("No se pudo conectar. Revisa internet o Supabase.", "error");
    renderAll();
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
  const sectionAliases = { aprendizaje: "aprende", aprender: "aprende", chat: "mensajes", embajador: "embajadores", embajadores: "embajadores", referidos: "embajadores" };
  id = sectionAliases[id] || id;
  if (id === "admin" && !adminRouteEnabled) { showToast("Acceso de administración oculto"); id = "inicio"; }
  const target = document.getElementById(id);
  if (!target) return;
  if (push && id !== currentSection) history.pushState({ section: id }, "", routeUrlForSection(id));
  currentSection = id;
  document.querySelector(".app-shell")?.classList.toggle("home-mode", id === "inicio");
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  target.classList.add("active");
  const titles = { inicio:"Conecta Servicios", registro:"Crear oportunidad", publicaciones:"Publicaciones", oficina:"Oficina", admin:"Administración", comoFunciona:"Cómo funciona", reglas:"Reglas", planes:"Planes", avisoPrivacidad:"Aviso de Privacidad", terminos:"Términos", notificaciones:"Notificaciones", misPublicaciones:"Mis publicaciones", enlaceExterno:"Enlace externo", aprende:"Aprende y emprende", analitica:"Analítica", oportunidades:"Oportunidades para ti", rutaGuiada:"Ruta guiada", actualizarme:"Por qué actualizarme", mensajes:"Centro de orientación", agentes:"Agentes de crecimiento", mandados:"Mandados Verificados", negocios:"Negocios locales", embajadores:"Embajadores Conecta", encuesta:"Encuesta guiada" };
  document.getElementById("mainTitle").textContent = titles[id] || "Conecta Servicios";
  document.getElementById("backButton").style.visibility = id === "inicio" ? "hidden" : "visible";
  document.querySelector(".app-shell").scrollTo({ top: 0, behavior: "smooth" });
  if (id === "publicaciones") {
    // v4.8.7: cada entrada a Publicaciones inicia limpia en Todo México / Todo.
    // Esto evita que búsquedas o chips anteriores oculten una publicación recién creada.
    resetPublicationFiltersToAllMexico();
    clearNearbyMode();
  }
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
  if (id === "agentes") renderGrowthPilotLists?.();
  if (id === "mandados") renderErrandPilotLists?.();
  if (id === "embajadores") renderAmbassadorPilot?.();
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
    if (active) {
      // v4.8.7: mostrar la nueva publicación de inmediato y luego sincronizar con Supabase.
      publicationsCache = [item, ...publicationsCache.filter(p => p.id !== item.id)];
      resetPublicationFiltersToAllMexico();
      showSection("publicaciones");
      await loadRemoteData({ silent: true });
      resetPublicationFiltersToAllMexico();
      renderPublications();
    } else {
      showSection("inicio");
      loadRemoteData({ silent: true });
    }
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

  let baseFiltered = list.filter(item => {
    const matchesCategory = !category || item.category === category;
    const haystack = normalize([folio(item), item.name, item.title, item.description, item.category, item.subcategory, item.state, item.municipality, item.locality, item.route, item.transport].join(" "));
    const matchesText = !search || haystack.includes(search);
    const chipWords = chipSearch ? chipSearch.split(/\s+/).filter(Boolean) : [];
    const matchesChip = !chipWords.length || chipWords.some(word => haystack.includes(word));
    return matchesCategory && matchesText && matchesChip;
  });

  if (PRESENTATION_PILOT_MODE && pilotTypeFilter) {
    baseFiltered = baseFiltered.filter(item => item.pilotType === pilotTypeFilter);
  }

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
    "Agentes de crecimiento": "📈",
    "Aprendizaje": "🎓",
    "Mandados Verificados": "🧺",
    "Colaboración general": "🤝"
  };
  return icons[category] || "📌";
}
function pilotPublicationCard(item) {
  const icon = categoryIcon(item.category);
  const role = item.roleLabel || (normalize(item.intent || item.title).includes("busco") ? "Solicitante" : "Agente");
  const type = item.pilotType || "general";
  const meta = [item.locality, item.municipality, item.state].filter(Boolean).join(" · ");
  const amount = Number(item.budget || 0) > 0 ? money(item.budget) : "A tratar";
  const action = type === "negocios" ? "Ver negocio" : (type === "aprendizaje" ? "Ver cursos" : "Chat piloto");
  return `<article class="pilot-publication-card pilot-${escapeHtml(type)}" id="pub-${escapeHtml(item.id)}">
    <div class="pilot-card-head">
      <span class="pilot-main-icon">${icon}</span>
      <div><small>${escapeHtml(role)}</small><strong>${escapeHtml(item.category)}</strong></div>
      <span class="pilot-mode-pill">Modo piloto</span>
    </div>
    <h3>${escapeHtml(item.title)}</h3>
    <p class="pilot-description">${linkify(item.description)}</p>
    <div class="pilot-duo-grid">
      <div class="pilot-duo-box">
        <small>${escapeHtml(role)}</small>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(meta)}</span>
      </div>
      <div class="pilot-duo-box">
        <small>${escapeHtml(item.relationLabel || "Trato directo")}</small>
        <strong>${escapeHtml(item.nextStep || "Acordar por chat")}</strong>
        <span>Referencia: ${escapeHtml(amount)}</span>
      </div>
    </div>
    <div class="pilot-card-actions">
      <button class="btn-small btn-purple" type="button" onclick="openPilotFlow('${escapeHtml(item.id)}')">${action}</button>
      <button class="btn-small btn-outline" type="button" onclick="sharePublication('${escapeHtml(item.id)}')">Compartir</button>
    </div>
  </article>`;
}

function openPilotFlow(id) {
  const item = publicationsCache.find(p => p.id === id);
  if (!item) return;
  trackEvent("modo_piloto_publicacion", item, { tipo: item.pilotType || "general" });
  if (item.pilotType === "negocios") { startSurveyFlow("chatNegocio", item.subcategory || item.name); return; }
  if (item.pilotType === "aprendizaje") { showSection("aprende"); return; }
  if (item.category === "Mandados Verificados") { startSurveyFlow("mandadoSolicitud"); return; }
  if (item.category === "Agentes de crecimiento") { startSurveyFlow("crecimientoMenu"); return; }
  showSection("mensajes");
  const input = document.getElementById("smartMessageInput");
  if (input) {
    input.value = `Quiero información sobre: ${item.title}`;
    input.focus();
  }
  showToast("Chat piloto listo para iniciar el trato directo");
}

function setPilotTypeFilter(type) {
  pilotTypeFilter = type || "";
  document.querySelectorAll("[data-pilot-type]").forEach(btn => btn.classList.toggle("active", (btn.dataset.pilotType || "") === pilotTypeFilter));
  renderPublications();
}
function openPilotType(type) {
  showSection("publicaciones");
  resetPublicationFiltersToAllMexico();
  nearbyMode = false;
  setPilotTypeFilter(type || "");
}

function compactPublicationCard(item) {
  if (PRESENTATION_PILOT_MODE && item.isPilot) return pilotPublicationCard(item);
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
  const banner = document.getElementById("pilotModeBanner");
  const tabs = document.getElementById("pilotTypeTabs");
  if (banner) banner.classList.toggle("hidden", !PRESENTATION_PILOT_MODE);
  if (tabs) tabs.classList.toggle("hidden", !PRESENTATION_PILOT_MODE);
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
    summary.textContent = PRESENTATION_PILOT_MODE
      ? `${filtered.length} ejemplo${filtered.length === 1 ? "" : "s"} piloto · ${pilotTypeFilter ? "vista curada" : "todas las oportunidades"}`
      : `${filtered.length} resultado${filtered.length === 1 ? "" : "s"} encontrados · ${scope}${mode}`;
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

function renderAll() { renderPublications(); updateHomeCounts(); renderOpportunities(false); renderMyPublications(); renderBusinessPilotList?.(); if (adminUnlocked) renderAdminPublications(); }
setInterval(updateHomeCounts, 3500);
const LOCAL_BUSINESS_PILOT = [
  { type:"Panadería", icon:"🥐", name:"Panadería San Miguel", zone:"Chapultepec", features:["Catálogo de pan", "Pedido a carrito", "Pickup o envío"] },
  { type:"Estética", icon:"💇", name:"Estética Bella", zone:"Metepec", features:["Servicios por cita", "Agenda", "Anticipo futuro"] },
  { type:"Ferretería", icon:"🔩", name:"Ferretería La Esquina", zone:"Toluca", features:["Inventario", "Entrega local", "Cotización por chat"] },
  { type:"Carpintería", icon:"🪚", name:"Carpintería Don Luis", zone:"Calimaya", features:["Cotización", "Agenda visita", "Evidencia del avance"] }
];

function renderBusinessPilotList() {
  const list = document.getElementById("localBusinessPilotList");
  if (!list) return;
  list.innerHTML = LOCAL_BUSINESS_PILOT.map((biz, idx) => `<article class="local-business-card">
    <span class="business-card-icon">${biz.icon}</span>
    <div>
      <small>${escapeHtml(biz.type)} · ${escapeHtml(biz.zone)}</small>
      <strong>${escapeHtml(biz.name)}</strong>
      <p>${biz.features.map(escapeHtml).join(" · ")}</p>
    </div>
    <button type="button" class="btn-small btn-outline" onclick="startSurveyFlow('chatNegocio','${escapeHtml(biz.type)}')">Ver flujo</button>
  </article>`).join("");
}

function showBusinessFutureTerminal(type = "Negocio local") {
  const panel = document.getElementById("businessTerminalPanel");
  if (!panel) return;
  panel.classList.remove("hidden");
  panel.innerHTML = `<div class="business-terminal-card">
    <span class="growth-kicker">Piloto visual</span>
    <h3>Chat de negocios para ${escapeHtml(type)}</h3>
    <p>Este será el espacio donde el cliente podrá preguntar, ver catálogo, ordenar, agendar, pedir envío o pickup. La primera etapa es trato directo por chat; después podrá crecer a terminal de venta.</p>
    <div class="terminal-flow-grid">
      <span>💬 Chat</span><span>🛍 Catálogo</span><span>🛒 Carrito</span><span>💳 Pago futuro</span><span>📦 Envío / pickup</span><span>📅 Cita</span>
    </div>
    <div class="chat-preview-box"><b>Cliente:</b> ¿Tienes disponible este producto o servicio?<br><b>Negocio:</b> Sí, puedo mostrarte opciones, precio, entrega o cita disponible.</div>
  </div>`;
  panel.scrollIntoView({ behavior:"smooth", block:"start" });
  trackEvent("negocio_terminal_piloto", null, { tipo: type });
}

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


// v4.8.7 — Hotfix: publicación activa visible de inmediato y filtros limpios
let smartLastSuggestion = { query: "", category: "" };

const DEFAULT_CHAT_MESSAGES = [
  { role: "bot", text: "Hola, soy el asistente de orientación de Conecta. Escríbeme qué necesitas: ganar dinero, publicar algo, pedir un mandado, hablar con un negocio, aprender una habilidad o invitar miembros como embajador. Te llevo a la sección correcta." }
];

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
  if (/catalogo|catálogo|carrito|pedido|ordenar|pickup|pick up|recoger|agendar|cita|terminal|negocio|panader|estetica|estética|ferreter|carpinter|producto|cotizar|comprar/.test(text)) {
    return { category: "Negocios locales", query: "negocio catálogo pedido cita", label: "Chat de negocios", action: "negocios" };
  }
  if (/mandado verificado|mandados verificados|compra verificada|compras verificadas|fondo protegido|dinero protegido|escrow|pago protegido|precio|peso|bascula|báscula|ticket|cambio|mercado|mandado con evidencia/.test(text)) {
    return { category: "Mandados Verificados", query: "mandado verificado evidencia compra", label: "Mandados Verificados", action: "mandados" };
  }
  if (/paquete|mandado|enviar|entrega|documento|reparto|llevar|traer|moto|bicicleta/.test(text)) {
    return { category: "Mensajería y envíos", query: "paquete entrega mandado", label: "Mensajería y envíos", action: "buscar" };
  }
  if (/viaje|viajar|ruta|traslado|ride|avent[oó]n|pasaje|llevarme|toluca|cdmx|pachuca|cuernavaca/.test(text)) {
    return { category: "Viajes compartidos", query: "viaje ruta traslado", label: "Viajes compartidos", action: "buscar" };
  }
  if (/aprend|curso|capacita|clase|enseña|ensenar|mejorar|especializar|ingresos|oficio|carlos slim|google|skillsbuild/.test(text)) {
    return { category: "", query: "aprendizaje", label: "Cursos gratuitos", action: "aprender" };
  }
  if (/embajador|embajadores|referido|referidos|membres[ií]a|invitar|recomendar la app|activar usuarios/.test(text)) {
    return { category: "Embajadores Conecta", query: "embajadores referidos membresía", label: "Embajadores Conecta", action: "embajadores" };
  }
  if (/agente|agentes|comision|comisión|marketing|campaña|campana|publicidad|promocionar|promotor|clientes por comision|crecimiento/.test(text)) {
    return { category: "Agentes de crecimiento", query: "agentes crecimiento comisión clientes", label: "Agentes de crecimiento", action: "agentes" };
  }
  if (/ofrezco|servicio|trabajo|clientes|vendo|reparo|limpio|hago|negocio|publicar/.test(text)) {
    return { category: "Servicios", query: "servicio trabajo clientes", label: "Publicar servicio", action: "publicar" };
  }
  return { category: "", query: text.split(/\s+/).slice(0, 4).join(" "), label: "Búsqueda general", action: "buscar" };
}
function smartReplyFor(raw) {
  const intent = detectSmartIntent(raw);
  smartLastSuggestion = { query: intent.query, category: intent.category, action: intent.action };
  if (intent.action === "aprender") return "Ruta recomendada: Aprendizaje. Ahí puedes buscar cursos gratuitos por oficio, ventas, negocio, computación o tecnología para mejorar tus ingresos. Toca Aprendizaje en la barra inferior o te llevo desde aquí.";
  if (intent.action === "publicar") return "Ruta recomendada: Publicaciones. Puedes crear una publicación como solicitante, agente, negocio o servicio. Te conviene usar Oportunidades para ti para elegir el camino correcto antes de publicar.";
  if (intent.action === "agentes") return "Te conviene revisar Agentes de crecimiento. Ahí un negocio puede publicar campañas por comisión y una persona puede registrarse para conseguir clientes o contactos por resultado.";
  if (intent.action === "embajadores") return "Ruta recomendada: Embajadores Conecta. La membresía anual es de $98 MXN y la comisión sugerida para el embajador es de $50 por membresía referida pagada. Puedes registrar tu código, referidos y pagos para corte manual.";
  if (intent.action === "mandados") return "Te conviene revisar Mandados Verificados. Ahí puedes solicitar una compra con evidencia de precio, peso, pago, cambio y entrega; además ver el simulador de Fondo Protegido Conecta para entender cómo se apartaría el dinero en una etapa futura.";
  if (intent.action === "negocios") return "Ruta recomendada: Chat de negocios dentro de Negocios locales. Ahí el negocio podrá evolucionar a catálogo, pedidos, citas, cotizaciones, envío o pickup. Te llevo a esa sección.";
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
  if (smartLastSuggestion?.action === "mandados") { showSection("mandados"); return; }
  if (smartLastSuggestion?.action === "negocios") { showSection("negocios"); return; }
  if (smartLastSuggestion?.action === "agentes") { showSection("agentes"); return; }
  if (smartLastSuggestion?.action === "embajadores") { showSection("embajadores"); return; }
  if (smartLastSuggestion?.action === "aprender") { showSection("aprende"); return; }
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


const GROWTH_STORAGE_KEY = "conecta_growth_pilot_v488";
let growthActiveTab = "campanas";
const GROWTH_DEFAULT_CAMPAIGNS = [
  {
    title: "Crédito para pensionados",
    category: "Financiero",
    zone: "Estado de México",
    result: "Cliente aprobado",
    commission: "$300 por cliente aprobado",
    description: "Buscamos personas interesadas en crédito para pensionados IMSS o ISSSTE. No pedir anticipos al cliente final.",
    contact: OFFICE_PHONE
  },
  {
    title: "Clases de inglés online",
    category: "Educación",
    zone: "Toluca y Metepec",
    result: "Alumno inscrito",
    commission: "$150 por inscripción válida",
    description: "Promocionar clases y conseguir alumnos interesados con datos reales de contacto.",
    contact: OFFICE_PHONE
  },
  {
    title: "Ropa deportiva local",
    category: "Comercio",
    zone: "Toluca, Metepec y Lerma",
    result: "Venta realizada",
    commission: "10% de cada venta cobrada",
    description: "Apoyo para vender ropa deportiva por redes sociales, WhatsApp y recomendación local.",
    contact: OFFICE_PHONE
  }
];
const GROWTH_DEFAULT_AGENTS = [
  {
    name: "Ana Martínez",
    zone: "Toluca, Estado de México",
    skills: "Redes sociales · Diseño · WhatsApp",
    availability: "Disponible por comisión",
    rating: "4.8",
    contact: OFFICE_PHONE
  },
  {
    name: "Luis Hernández",
    zone: "Metepec, Estado de México",
    skills: "Ventas · Captación · Promoción",
    availability: "Disponible por comisión",
    rating: "4.6",
    contact: OFFICE_PHONE
  },
  {
    name: "Valeria Gómez",
    zone: "San Mateo Atenco, Estado de México",
    skills: "Redes sociales · Contenido · Flyers",
    availability: "Disponible por comisión",
    rating: "Nuevo",
    contact: OFFICE_PHONE
  }
];
function getGrowthPilotData() {
  try {
    const saved = JSON.parse(localStorage.getItem(GROWTH_STORAGE_KEY) || "{}");
    return {
      campaigns: Array.isArray(saved.campaigns) ? saved.campaigns : [],
      agents: Array.isArray(saved.agents) ? saved.agents : []
    };
  } catch {
    return { campaigns: [], agents: [] };
  }
}
function saveGrowthPilotData(data) {
  try { localStorage.setItem(GROWTH_STORAGE_KEY, JSON.stringify(data)); } catch {}
}
function growthWhatsAppMessage(type, item) {
  if (type === "campaign") return `Hola, vi la campaña de Agentes de crecimiento en Conecta Servicios: ${item.title}. Me interesa participar o conocer condiciones.`;
  if (type === "agent") return `Hola, vi el perfil de ${item.name} en Agentes de crecimiento de Conecta Servicios. Me interesa contactar para una campaña por comisión.`;
  return "Hola, quiero información sobre Agentes de crecimiento en Conecta Servicios.";
}
function renderGrowthCampaignCard(item, local = false) {
  return `<article class="growth-item-card campaign-item">
    <span class="growth-tag">${escapeHtml(item.category || "Campaña")}</span>
    <strong>${escapeHtml(item.title)}</strong>
    <p>${escapeHtml(item.description || "")}</p>
    <dl>
      <div><dt>Resultado</dt><dd>${escapeHtml(item.result || "Acordar")}</dd></div>
      <div><dt>Comisión</dt><dd>${escapeHtml(item.commission || "A tratar")}</dd></div>
      <div><dt>Zona</dt><dd>${escapeHtml(item.zone || "Por definir")}</dd></div>
    </dl>
    <div class="growth-card-actions">
      <button type="button" class="btn-small btn-orange" onclick="openWhatsApp('${cleanPhone(item.contact || OFFICE_PHONE)}','${encodeURIComponent(growthWhatsAppMessage("campaign", item))}')">Contactar</button>
      ${local ? '<small>Guardado en este dispositivo</small>' : ''}
    </div>
  </article>`;
}
function renderGrowthAgentCard(item, local = false) {
  return `<article class="growth-item-card agent-item">
    <span class="growth-avatar">${escapeHtml((item.name || "A").slice(0,1).toUpperCase())}</span>
    <strong>${escapeHtml(item.name || "Agente")}</strong>
    <p>${escapeHtml(item.skills || "Redes sociales · Ventas · Promoción")}</p>
    <dl>
      <div><dt>Zona</dt><dd>${escapeHtml(item.zone || "Por definir")}</dd></div>
      <div><dt>Estado</dt><dd>${escapeHtml(item.availability || "Disponible")}</dd></div>
      <div><dt>Perfil</dt><dd>${escapeHtml(item.rating || "Nuevo")}</dd></div>
    </dl>
    <div class="growth-card-actions">
      <button type="button" class="btn-small btn-purple" onclick="openWhatsApp('${cleanPhone(item.contact || OFFICE_PHONE)}','${encodeURIComponent(growthWhatsAppMessage("agent", item))}')">Contactar</button>
      ${local ? '<small>Guardado en este dispositivo</small>' : ''}
    </div>
  </article>`;
}
function renderGrowthPilotLists() {
  const data = getGrowthPilotData();
  const campaigns = [...data.campaigns, ...GROWTH_DEFAULT_CAMPAIGNS];
  const agents = [...data.agents, ...GROWTH_DEFAULT_AGENTS];
  const campaignList = document.getElementById("growthCampaignList");
  const agentList = document.getElementById("growthAgentList");
  if (campaignList) campaignList.innerHTML = campaigns.map((item, index) => renderGrowthCampaignCard(item, index < data.campaigns.length)).join("");
  if (agentList) agentList.innerHTML = agents.map((item, index) => renderGrowthAgentCard(item, index < data.agents.length)).join("");
  setGrowthTab(growthActiveTab, false);
}
function setGrowthTab(tab, scroll = true) {
  growthActiveTab = tab === "agentes" ? "agentes" : "campanas";
  document.querySelectorAll("[data-growth-tab]").forEach(button => button.classList.toggle("active", button.dataset.growthTab === growthActiveTab));
  document.getElementById("growthCampaignList")?.classList.toggle("hidden", growthActiveTab !== "campanas");
  document.getElementById("growthAgentList")?.classList.toggle("hidden", growthActiveTab !== "agentes");
  if (scroll) document.querySelector(".growth-lists-tabs")?.scrollIntoView({ behavior:"smooth", block:"start" });
}
function normalizeTextareaPaste(event) {
  const target = event?.target;
  if (!target || target.tagName !== "TEXTAREA") return;
  event.preventDefault();
  const raw = (event.clipboardData || window.clipboardData)?.getData("text/plain") || "";
  const clean = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  const start = target.selectionStart || 0;
  const end = target.selectionEnd || 0;
  const before = target.value.slice(0, start);
  const after = target.value.slice(end);
  target.value = `${before}${clean}${after}`;
  target.selectionStart = target.selectionEnd = start + clean.length;
  autoSizeTextarea(target);
}
function autoSizeTextarea(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(Math.max(el.scrollHeight, 116), 260)}px`;
}
function insertGrowthTemplate(id, template) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = template.replace(/\\n/g, "\n").trim();
  autoSizeTextarea(el);
  el.focus();
}
function addGrowthSkill(skill) {
  const el = document.getElementById("growthAgentSkills");
  if (!el) return;
  const current = el.value.split(",").map(s => s.trim()).filter(Boolean);
  if (!current.some(item => item.toLowerCase() === skill.toLowerCase())) current.push(skill);
  el.value = current.join(", ");
  autoSizeTextarea(el);
  el.focus();
}
function showAgentPanel(type) {
  const panel = document.getElementById("growthPanel");
  if (!panel) return;
  const isAgent = type === "agente";
  panel.classList.remove("hidden");
  panel.innerHTML = isAgent ? `<form class="growth-form" onsubmit="saveGrowthLead(event,'agente')">
    <h3>Quiero trabajar por comisión</h3>
    <label>Nombre público<input id="growthAgentName" required placeholder="Ej. Ana Martínez"></label>
    <label>Municipio o zona<input id="growthAgentZone" required placeholder="Ej. Toluca, Estado de México"></label>
    <label>Habilidades
      <textarea id="growthAgentSkills" rows="4" required oninput="autoSizeTextarea(this)" onpaste="normalizeTextareaPaste(event)" placeholder="Ej. Redes sociales, diseño de flyers, ventas por WhatsApp, captación de clientes..."></textarea>
    </label>
    <div class="field-guide-card compact-guide">
      <strong>Guía rápida para escribir tus habilidades</strong>
      <p>Elige lo que sabes hacer. Puedes tocar botones y completar con tu experiencia.</p>
      <div class="guide-chip-row">
        <button type="button" onclick="addGrowthSkill('Redes sociales')">Redes sociales</button>
        <button type="button" onclick="addGrowthSkill('Diseño de flyers')">Diseño de flyers</button>
        <button type="button" onclick="addGrowthSkill('Ventas por WhatsApp')">Ventas por WhatsApp</button>
        <button type="button" onclick="addGrowthSkill('Captación de clientes')">Captación de clientes</button>
        <button type="button" onclick="addGrowthSkill('Atención a clientes')">Atención a clientes</button>
        <button type="button" onclick="addGrowthSkill('Videos cortos')">Videos cortos</button>
      </div>
      <button type="button" class="guide-fill-btn" onclick="insertGrowthTemplate('growthAgentSkills','Redes sociales, ventas por WhatsApp, diseño básico de publicaciones, atención a clientes y seguimiento de interesados. Puedo apoyar por comisión según resultado acordado.')">Usar ejemplo editable</button>
    </div>
    <label>WhatsApp<input id="growthAgentPhone" type="tel" required placeholder="10 dígitos"></label>
    <button class="btn-big btn-purple" type="submit">Guardar perfil piloto</button>
  </form>` : `<form class="growth-form" onsubmit="saveGrowthLead(event,'negocio')">
    <h3>Quiero conseguir clientes</h3>
    <label>Producto o servicio<input id="growthCampaignTitle" required placeholder="Ej. Crédito para pensionados"></label>
    <label>Zona<input id="growthCampaignZone" required placeholder="Ej. Estado de México"></label>
    <label>Resultado que pagarás<select id="growthCampaignResult" required><option>Contacto interesado</option><option>Cita agendada</option><option>Cliente aprobado</option><option>Venta cerrada</option></select></label>
    <label>Comisión ofrecida<input id="growthCampaignCommission" required placeholder="Ej. $300 por cliente aprobado o 10% por venta"></label>
    <label>Descripción
      <textarea id="growthCampaignDescription" rows="5" required oninput="autoSizeTextarea(this)" onpaste="normalizeTextareaPaste(event)" placeholder="Describe qué vendes, qué resultado pagarás y cómo se valida."></textarea>
    </label>
    <div class="field-guide-card compact-guide">
      <strong>Guía para una campaña clara</strong>
      <p>Usa esta estructura para evitar confusiones y facilitar que un agente te consiga clientes reales.</p>
      <div class="guide-template-list">
        <span>1. Qué ofreces</span>
        <span>2. A quién buscas</span>
        <span>3. Resultado válido</span>
        <span>4. Comisión y pago</span>
        <span>5. Zona y condiciones</span>
      </div>
      <button type="button" class="guide-fill-btn" onclick="insertGrowthTemplate('growthCampaignDescription','Ofrezco: [producto o servicio].\nBusco: personas interesadas que cumplan estos requisitos: [requisitos básicos].\nResultado válido: [contacto interesado / cita agendada / cliente aprobado / venta cerrada].\nComisión: [monto o porcentaje] por cada resultado válido.\nZona: [municipio/estado].\nCondiciones: no se piden anticipos indebidos y la información se confirma por WhatsApp.')">Llenar guía editable</button>
    </div>
    <label>WhatsApp<input id="growthCampaignPhone" type="tel" required placeholder="10 dígitos"></label>
    <button class="btn-big btn-orange" type="submit">Guardar campaña piloto</button>
  </form>`;
  panel.querySelectorAll("textarea").forEach(autoSizeTextarea);
  panel.scrollIntoView({ behavior:"smooth", block:"start" });
}
function saveGrowthLead(event, type) {
  event.preventDefault();
  const data = getGrowthPilotData();
  if (type === "agente") {
    data.agents.unshift({
      name: document.getElementById("growthAgentName")?.value.trim(),
      zone: document.getElementById("growthAgentZone")?.value.trim(),
      skills: document.getElementById("growthAgentSkills")?.value.trim(),
      availability: "Disponible por comisión",
      rating: "Nuevo",
      contact: cleanPhone(document.getElementById("growthAgentPhone")?.value)
    });
    growthActiveTab = "agentes";
    showToast("Perfil de agente guardado en piloto");
  } else {
    data.campaigns.unshift({
      title: document.getElementById("growthCampaignTitle")?.value.trim(),
      category: "Campaña",
      zone: document.getElementById("growthCampaignZone")?.value.trim(),
      result: document.getElementById("growthCampaignResult")?.value,
      commission: document.getElementById("growthCampaignCommission")?.value.trim(),
      description: document.getElementById("growthCampaignDescription")?.value.trim(),
      contact: cleanPhone(document.getElementById("growthCampaignPhone")?.value)
    });
    growthActiveTab = "campanas";
    showToast("Campaña guardada en piloto");
  }
  saveGrowthPilotData(data);
  renderGrowthPilotLists();
  document.getElementById("growthPanel")?.classList.add("hidden");
  trackEvent("agentes_crecimiento_piloto", null, { tipo: type });
}



// v4.9.0 — Mandados Verificados + Fondo Protegido Conecta piloto
let errandActiveTab = "solicitudes";
const ERRAND_DEFAULT_REQUESTS = [
  {
    id: "MV-1025",
    item: "Verdura para la semana",
    buyAt: "Mercado de San Pedro",
    deliverTo: "Col. Centro, Toluca",
    weight: 5,
    amount: 400,
    distance: 4.2,
    schedule: "Hora pico",
    estimate: 130.6,
    status: "Buscando agente",
    contact: OFFICE_PHONE
  },
  {
    id: "MV-1026",
    item: "Abarrotes y productos básicos",
    buyAt: "Central de Abastos",
    deliverTo: "Metepec, Estado de México",
    weight: 8,
    amount: 650,
    distance: 6.1,
    schedule: "Mañana",
    estimate: 160.3,
    status: "Disponible",
    contact: OFFICE_PHONE
  }
];
const ERRAND_DEFAULT_AGENTS = [
  { name:"Juan Pérez", zone:"Toluca, Estado de México", transport:"Moto", capacity:"Hasta 12 kg", skills:"Mercados, abarrotes, compras rápidas", rating:"4.8", contact:OFFICE_PHONE },
  { name:"María López", zone:"Metepec, Estado de México", transport:"Auto", capacity:"Hasta 25 kg", skills:"Compras familiares, supermercado, entrega cuidadosa", rating:"4.7", contact:OFFICE_PHONE },
  { name:"Carlos R.", zone:"Chapultepec y Mexicaltzingo", transport:"Bicicleta / moto", capacity:"Hasta 8 kg", skills:"Mandados locales, farmacia, productos pequeños", rating:"Nuevo", contact:OFFICE_PHONE }
];
function getErrandPilotData() {
  try {
    const saved = JSON.parse(localStorage.getItem(ERRAND_STORAGE_KEY) || "{}");
    return {
      requests: Array.isArray(saved.requests) ? saved.requests : [],
      agents: Array.isArray(saved.agents) ? saved.agents : [],
      reports: Array.isArray(saved.reports) ? saved.reports : []
    };
  } catch {
    return { requests: [], agents: [], reports: [] };
  }
}
function saveErrandPilotData(data) {
  try { localStorage.setItem(ERRAND_STORAGE_KEY, JSON.stringify(data)); } catch {}
}
function errandMoney(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;
}
function calculateErrandEstimate(values = {}) {
  const base = 20;
  const distance = Math.max(0, Number(values.distance || 0));
  const weight = Math.max(0, Number(values.weight || 0));
  const amount = Math.max(0, Number(values.amount || 0));
  const schedule = String(values.schedule || "normal").toLowerCase();
  const distanceFee = distance * 5;
  const weightFee = weight * 2.5;
  const purchaseFee = amount * 0.02;
  let multiplier = 1;
  if (/pico|noche|lluvia|festivo|urgente/.test(schedule)) multiplier = 1.12;
  const reference = Math.max(35, (base + distanceFee + weightFee + purchaseFee) * multiplier);
  const min = Math.max(30, reference * 0.85);
  const max = Math.max(min + 10, reference * 1.25);
  const platform = Math.max(5, reference * 0.08);
  const agent = Math.max(0, reference - platform);
  return { base, distanceFee, weightFee, purchaseFee, multiplier, total: reference, min, max, platform, agent };
}
function readErrandQuoteForm() {
  return {
    distance: document.getElementById("errandDistance")?.value || 0,
    weight: document.getElementById("errandWeight")?.value || 0,
    amount: document.getElementById("errandAmount")?.value || 0,
    schedule: document.getElementById("errandSchedule")?.value || "Normal"
  };
}
function renderErrandQuote(targetId = "errandQuotePreview") {
  const target = document.getElementById(targetId);
  if (!target) return;
  const q = calculateErrandEstimate(readErrandQuoteForm());
  target.innerHTML = `<div class="errand-quote-card direct-agreement-card">
    <div class="quote-total"><span>Referencia sugerida por la app</span><strong>${errandMoney(q.min)} - ${errandMoney(q.max)}</strong></div>
    <small>Esta referencia ayuda a iniciar un trato justo, pero el pago final se acuerda directamente entre solicitante y agente antes de aceptar.</small>
    <div><span>Base local</span><strong>${errandMoney(q.base)}</strong></div>
    <div><span>Distancia</span><strong>${errandMoney(q.distanceFee)}</strong></div>
    <div><span>Peso estimado</span><strong>${errandMoney(q.weightFee)}</strong></div>
    <div><span>Referencia por compra</span><strong>${errandMoney(q.purchaseFee)}</strong></div>
    <div><span>Horario</span><strong>${q.multiplier > 1 ? "Ajuste ligero" : "Normal"}</strong></div>
    <hr>
    <div><span>Apoyo sugerido Conecta</span><strong>${errandMoney(q.platform)}</strong></div>
    <small>Conecta Servicios no impone tarifas como plataforma grande: orienta, muestra evidencia y deja el acuerdo final a las personas.</small>
  </div>`;
}
function errandWhatsAppMessage(type, item) {
  if (type === "request") return `Hola, vi el mandado verificado ${item.id || ""} en Conecta Servicios: ${item.item}. Me interesa aceptar o conocer detalles.`;
  if (type === "agent") return `Hola, vi tu perfil como agente de Mandados Verificados en Conecta Servicios. Me interesa solicitar un mandado con evidencia.`;
  return "Hola, quiero información sobre Mandados Verificados en Conecta Servicios.";
}
function renderErrandRequestCard(item, local = false) {
  const q = calculateErrandEstimate(item);
  const total = Number(item.estimate || q.total);
  return `<article class="errand-item-card">
    <span class="errand-tag">${escapeHtml(item.status || "Disponible")}</span>
    <strong>${escapeHtml(item.item || "Mandado verificado")}</strong>
    <p>Compra en <b>${escapeHtml(item.buyAt || "por definir")}</b> y entrega en <b>${escapeHtml(item.deliverTo || "por definir")}</b>.</p>
    <dl>
      <div><dt>Peso</dt><dd>${escapeHtml(item.weight || "0")} kg</dd></div>
      <div><dt>Monto aprox.</dt><dd>${errandMoney(item.amount || 0)}</dd></div>
      <div><dt>Distancia</dt><dd>${escapeHtml(item.distance || "0")} km</dd></div>
      <div><dt>Horario</dt><dd>${escapeHtml(item.schedule || "Normal")}</dd></div>
      <div><dt>Referencia</dt><dd>${errandMoney(q.min)} - ${errandMoney(q.max)}</dd></div>
    </dl>
    <div class="errand-card-actions">
      <button type="button" class="btn-small btn-green" onclick="openWhatsApp('${cleanPhone(item.contact || OFFICE_PHONE)}','${encodeURIComponent(errandWhatsAppMessage("request", item))}')">Contactar</button>
      <button type="button" class="btn-small btn-outline" onclick="showErrandReport('${escapeHtml(item.id || "MV")}', '${escapeHtml(item.item || "Mandado verificado")}')">Ver reporte</button>
      ${local ? '<small>Guardado en este dispositivo</small>' : ''}
    </div>
  </article>`;
}
function renderErrandAgentCard(item, local = false) {
  return `<article class="errand-item-card errand-agent-item">
    <span class="errand-avatar">${escapeHtml((item.name || "A").slice(0,1).toUpperCase())}</span>
    <strong>${escapeHtml(item.name || "Agente de compras")}</strong>
    <p>${escapeHtml(item.skills || "Mandados, compras y entregas locales")}</p>
    <dl>
      <div><dt>Zona</dt><dd>${escapeHtml(item.zone || "Por definir")}</dd></div>
      <div><dt>Transporte</dt><dd>${escapeHtml(item.transport || "Por definir")}</dd></div>
      <div><dt>Capacidad</dt><dd>${escapeHtml(item.capacity || "Por definir")}</dd></div>
      <div><dt>Perfil</dt><dd>${escapeHtml(item.rating || "Nuevo")}</dd></div>
    </dl>
    <div class="errand-card-actions">
      <button type="button" class="btn-small btn-purple" onclick="openWhatsApp('${cleanPhone(item.contact || OFFICE_PHONE)}','${encodeURIComponent(errandWhatsAppMessage("agent", item))}')">Contactar</button>
      ${local ? '<small>Guardado en este dispositivo</small>' : ''}
    </div>
  </article>`;
}
function renderErrandReport(id = "MV-1025", item = "Mandado verificado") {
  const panel = document.getElementById("errandReportPanel");
  if (!panel) return;
  panel.innerHTML = `<article class="errand-report-card">
    <span class="errand-tag purple">Reporte de evidencia</span>
    <h3>${escapeHtml(id)}</h3>
    <p><strong>${escapeHtml(item)}</strong></p>
    <div class="evidence-checklist">
      <label><input type="checkbox" checked disabled> Precio del producto o etiqueta</label>
      <label><input type="checkbox" checked disabled> Producto en báscula o cantidad</label>
      <label><input type="checkbox" checked disabled> Ticket, total o monto pagado</label>
      <label><input type="checkbox" checked disabled> Cambio recibido</label>
      <label><input type="checkbox" checked disabled> Entrega final</label>
    </div>
    <div class="report-summary-box">
      <strong>Validación asistida</strong>
      <p>Al terminar el mandado, la evidencia se organiza en un reporte para que comprador y agente revisen precio, peso, pago, cambio y entrega.</p>
    </div>
  </article>`;
}
function showErrandReport(id, item) {
  renderErrandReport(id, item);
  setErrandTab("reporte");
}
function renderErrandPilotLists() {
  const data = getErrandPilotData();
  const requests = [...data.requests, ...ERRAND_DEFAULT_REQUESTS];
  const agents = [...data.agents, ...ERRAND_DEFAULT_AGENTS];
  const requestList = document.getElementById("errandRequestList");
  const agentList = document.getElementById("errandAgentList");
  if (requestList) requestList.innerHTML = requests.map((item, index) => renderErrandRequestCard(item, index < data.requests.length)).join("");
  if (agentList) agentList.innerHTML = agents.map((item, index) => renderErrandAgentCard(item, index < data.agents.length)).join("");
  renderErrandReport();
  setErrandTab(errandActiveTab, false);
}
function setErrandTab(tab, scroll = true) {
  errandActiveTab = ["agentes", "reporte"].includes(tab) ? tab : "solicitudes";
  document.querySelectorAll("[data-errand-tab]").forEach(button => button.classList.toggle("active", button.dataset.errandTab === errandActiveTab));
  document.getElementById("errandRequestList")?.classList.toggle("hidden", errandActiveTab !== "solicitudes");
  document.getElementById("errandAgentList")?.classList.toggle("hidden", errandActiveTab !== "agentes");
  document.getElementById("errandReportPanel")?.classList.toggle("hidden", errandActiveTab !== "reporte");
  if (scroll) document.querySelector(".errand-tabs")?.scrollIntoView({ behavior:"smooth", block:"start" });
}

function calculateProtectedFund(values = {}) {
  const amount = Math.max(0, Number(values.amount ?? document.getElementById("protectedAmount")?.value ?? 850));
  const distance = Math.max(0, Number(values.distance ?? document.getElementById("protectedDistance")?.value ?? 4.2));
  const weight = Math.max(0, Number(values.weight ?? document.getElementById("protectedWeight")?.value ?? 5));
  const schedule = String(values.schedule ?? document.getElementById("protectedSchedule")?.value ?? "Normal");
  const quote = calculateErrandEstimate({ amount, distance, weight, schedule });
  const suggestedService = Math.round(quote.total / 5) * 5;
  const agreedService = Math.max(30, suggestedService);
  const platformSupport = Math.max(5, Math.round((agreedService * 0.08) / 5) * 5);
  const safetyMargin = Math.max(40, Math.round((amount * 0.10) / 10) * 10);
  const suggestedFund = Math.ceil((amount + agreedService + platformSupport + safetyMargin) / 10) * 10;
  const sampleRealPurchase = Math.max(0, Math.round(amount * 0.97));
  const refund = Math.max(0, suggestedFund - sampleRealPurchase - agreedService - platformSupport);
  return { amount, distance, weight, schedule, quote, agreedService, platformSupport, safetyMargin, suggestedFund, sampleRealPurchase, refund };
}
function renderProtectedFundSimulator() {
  const target = document.getElementById("protectedFundPreview");
  if (!target) return;
  const f = calculateProtectedFund();
  target.innerHTML = `<div class="protected-result-card direct-agreement-result">
    <span>Fondo de referencia, no tarifa impuesta</span>
    <strong>${errandMoney(f.suggestedFund)}</strong>
    <small>La app calcula una base para conversar. Solicitante y agente pueden acordar un pago menor, mayor o diferente según la realidad del mandado.</small>
  </div>
  <div class="protected-breakdown">
    <div><span>Compra estimada</span><b>${errandMoney(f.amount)}</b></div>
    <div><span>Pago sugerido al agente</span><b>${errandMoney(f.agreedService)}</b></div>
    <div><span>Apoyo Conecta sugerido</span><b>${errandMoney(f.platformSupport)}</b></div>
    <div><span>Margen opcional</span><b>${errandMoney(f.safetyMargin)}</b></div>
  </div>
  <div class="direct-agreement-note">
    <strong>Acuerdo directo</strong>
    <p>Conecta Servicios orienta el cálculo, pero no busca copiar tarifas rígidas de plataformas grandes. El trato final debe confirmarse entre las personas antes de iniciar.</p>
  </div>`;
  const close = document.getElementById("protectedCloseExample");
  if (close) {
    close.innerHTML = `<div class="protected-liquidation-card">
      <h4>Ejemplo de cierre con acuerdo directo</h4>
      <div><span>Fondo apartado</span><b>${errandMoney(f.suggestedFund)}</b></div>
      <div><span>Compra real con evidencia</span><b>${errandMoney(f.sampleRealPurchase)}</b></div>
      <div><span>Pago acordado al agente</span><b>${errandMoney(f.agreedService)}</b></div>
      <div><span>Apoyo plataforma</span><b>${errandMoney(f.platformSupport)}</b></div>
      <div class="refund"><span>Devolución al solicitante</span><b>${errandMoney(f.refund)}</b></div>
      <small>Valores de ejemplo. Esta versión no mueve dinero real dentro de la app y el pago final se acuerda directamente.</small>
    </div>`;
  }
}
function showProtectedFundPanel() {
  const panel = document.getElementById("protectedFundPanel");
  if (!panel) return;
  panel.classList.remove("hidden");
  panel.innerHTML = `<div class="protected-module">
    <div class="protected-module-hero">
      <span class="protected-kicker">Módulo conceptual</span>
      <h3>Fondo Protegido Conecta</h3>
      <p>Un modelo flexible para apartar un fondo por operación, usar evidencia y permitir que solicitante y agente acuerden el pago final de forma directa.</p>
    </div>
    <div class="protected-flow-card">
      <h4>¿Cómo funcionaría?</h4>
      <ol>
        <li><b>Solicitud y referencia</b><span>La app sugiere un rango para iniciar el acuerdo.</span></li>
        <li><b>Fondo por operación</b><span>El solicitante apartaría un monto ligado al mandado, no un saldo abierto.</span></li>
        <li><b>Trato directo</b><span>Agente y solicitante confirman condiciones, pago y evidencia antes de iniciar.</span></li>
        <li><b>Compra con evidencia</b><span>Se registra precio, peso o cantidad, ticket, cambio y entrega final.</span></li>
        <li><b>Revisión y pago</b><span>Con evidencia suficiente, se liquida lo acordado y se evita discusión.</span></li>
        <li><b>Sobrante devuelto</b><span>Lo no utilizado vuelve al solicitante según el cierre del mandado.</span></li>
      </ol>
    </div>
    <form class="protected-simulator" oninput="renderProtectedFundSimulator()">
      <h4>Simulador de referencia flexible</h4>
      <label>Compra estimada<input id="protectedAmount" type="number" min="0" step="10" value="850"></label>
      <div class="form-grid"><label>Distancia km<input id="protectedDistance" type="number" min="0" step="0.1" value="4.2"></label><label>Peso kg<input id="protectedWeight" type="number" min="0" step="0.1" value="5"></label></div>
      <label>Horario<select id="protectedSchedule"><option>Normal</option><option selected>Hora pico</option><option>Noche</option><option>Lluvia o festivo</option><option>Urgente</option></select></label>
      <div id="protectedFundPreview"></div>
      <div id="protectedCloseExample"></div>
    </form>
    <div class="protected-status-card">
      <h4>Estados de la operación</h4>
      <div class="protected-status-row"><span>Solicitado</span><span>Referencia calculada</span><span>Acuerdo directo</span><span>En compra</span><span>Evidencia cargada</span><span>Entregado</span><span>Pago acordado</span><span>Sobrante devuelto</span></div>
    </div>
    <div class="notice-card slim protected-warning">
      <strong>Importante</strong>
      <p>Esta versión muestra el funcionamiento conceptual de Fondo Protegido Conecta. No implica manejo real de dinero en la app. La operación real se implementará posteriormente mediante proveedor de pagos autorizado, reglas claras y acuerdos directos entre las partes.</p>
    </div>
  </div>`;
  renderProtectedFundSimulator();
  panel.scrollIntoView({ behavior:"smooth", block:"start" });
  trackEvent("fondo_protegido_conecta", null, { tipo:"simulador" });
}

function showErrandPanel(type) {
  const panel = document.getElementById("errandPanel");
  if (!panel) return;
  const isAgent = type === "agente";
  panel.classList.remove("hidden");
  panel.innerHTML = isAgent ? `<form class="errand-form" onsubmit="saveErrandLead(event,'agente')">
    <h3>Trabajar como agente</h3>
    <label>Nombre público<input id="errandAgentName" required placeholder="Ej. Juan Pérez"></label>
    <label>Municipio o zona<input id="errandAgentZone" required placeholder="Ej. Toluca, Estado de México"></label>
    <div class="form-grid"><label>Transporte<select id="errandAgentTransport" required><option>Moto</option><option>Auto</option><option>Bicicleta</option><option>A pie</option><option>Camioneta</option></select></label><label>Capacidad aproximada<input id="errandAgentCapacity" required placeholder="Ej. hasta 10 kg"></label></div>
    <label>Habilidades o zonas que conoces<textarea id="errandAgentSkills" rows="4" required oninput="autoSizeTextarea(this)" onpaste="normalizeTextareaPaste(event)" placeholder="Ej. compras en mercado, central, abarrotes, farmacia, entrega cuidadosa..."></textarea></label>
    <div class="field-guide-card compact-guide"><strong>Guía para agente</strong><p>Explica qué compras puedes hacer, cuánto puedes cargar, tu medio de transporte y zonas que conoces.</p><button type="button" class="guide-fill-btn" onclick="insertGrowthTemplate('errandAgentSkills','Puedo hacer mandados en mercado, tienda y farmacia. Conozco rutas locales, puedo tomar evidencia de precio, peso, ticket, cambio y entrega. Capacidad aproximada: [kg]. Zonas: [municipios o colonias].')">Usar ejemplo editable</button></div>
    <label>WhatsApp<input id="errandAgentPhone" type="tel" required placeholder="10 dígitos"></label>
    <button class="btn-big btn-green" type="submit">Guardar agente piloto</button>
  </form>` : `<form class="errand-form" onsubmit="saveErrandLead(event,'solicitud')">
    <h3>Solicitar mandado verificado</h3>
    <label>¿Qué necesitas comprar?<input id="errandItem" required placeholder="Ej. frutas, verduras, pollo, abarrotes..."></label>
    <label>¿Dónde se compra?<input id="errandBuyAt" required placeholder="Ej. Mercado de San Pedro, Central de Abastos..."></label>
    <label>¿Dónde se entrega?<input id="errandDeliverTo" required placeholder="Colonia, municipio o referencia"></label>
    <div class="form-grid"><label>Peso estimado kg<input id="errandWeight" type="number" min="0" step="0.1" value="5" oninput="renderErrandQuote()"></label><label>Monto aprox. compra<input id="errandAmount" type="number" min="0" step="10" value="400" oninput="renderErrandQuote()"></label></div>
    <div class="form-grid"><label>Distancia estimada km<input id="errandDistance" type="number" min="0" step="0.1" value="4" oninput="renderErrandQuote()"></label><label>Horario<select id="errandSchedule" onchange="renderErrandQuote()"><option>Normal</option><option>Hora pico</option><option>Noche</option><option>Lluvia o festivo</option><option>Urgente</option></select></label></div>
    <label>Observaciones<textarea id="errandNotes" rows="3" oninput="autoSizeTextarea(this)" onpaste="normalizeTextareaPaste(event)" placeholder="Calidad deseada, marcas, sustituciones permitidas o instrucciones importantes."></textarea></label>
    <div class="field-guide-card compact-guide"><strong>Checklist de evidencia</strong><p>El agente deberá registrar precio, peso o cantidad, ticket o total pagado, cambio recibido y entrega final.</p></div>
    <div id="errandQuotePreview"></div>
    <label>WhatsApp<input id="errandPhone" type="tel" required placeholder="10 dígitos"></label>
    <button class="btn-big btn-purple" type="submit">Publicar solicitud piloto</button>
  </form>`;
  panel.querySelectorAll("textarea").forEach(autoSizeTextarea);
  if (!isAgent) renderErrandQuote();
  panel.scrollIntoView({ behavior:"smooth", block:"start" });
}
function saveErrandLead(event, type) {
  event.preventDefault();
  const data = getErrandPilotData();
  if (type === "agente") {
    data.agents.unshift({
      name: document.getElementById("errandAgentName")?.value.trim(),
      zone: document.getElementById("errandAgentZone")?.value.trim(),
      transport: document.getElementById("errandAgentTransport")?.value,
      capacity: document.getElementById("errandAgentCapacity")?.value.trim(),
      skills: document.getElementById("errandAgentSkills")?.value.trim(),
      rating: "Nuevo",
      contact: cleanPhone(document.getElementById("errandAgentPhone")?.value)
    });
    errandActiveTab = "agentes";
    showToast("Agente de mandados guardado en piloto");
  } else {
    const quote = calculateErrandEstimate(readErrandQuoteForm());
    data.requests.unshift({
      id: `MV-${String(Date.now()).slice(-5)}`,
      item: document.getElementById("errandItem")?.value.trim(),
      buyAt: document.getElementById("errandBuyAt")?.value.trim(),
      deliverTo: document.getElementById("errandDeliverTo")?.value.trim(),
      weight: document.getElementById("errandWeight")?.value,
      amount: document.getElementById("errandAmount")?.value,
      distance: document.getElementById("errandDistance")?.value,
      schedule: document.getElementById("errandSchedule")?.value,
      notes: document.getElementById("errandNotes")?.value.trim(),
      estimate: quote.total,
      status: "Buscando agente",
      contact: cleanPhone(document.getElementById("errandPhone")?.value)
    });
    errandActiveTab = "solicitudes";
    showToast("Solicitud de mandado guardada en piloto");
  }
  saveErrandPilotData(data);
  renderErrandPilotLists();
  document.getElementById("errandPanel")?.classList.add("hidden");
  trackEvent("mandados_verificados_piloto", null, { tipo: type });
}


// v4.9.10 — Flujos funcionales: publicar, cobro embajadores y manual
const AMBASSADOR_STORAGE_KEY = "conecta_embajadores_v498";
const AMBASSADOR_LEGACY_KEY = "conecta_embajadores_piloto_v497";
const AMBASSADOR_SETTINGS_KEY = "conecta_embajadores_mp_settings_v498";
let ambassadorActiveTab = "referidos";
const AMBASSADOR_DEFAULT_REFERRALS = [
  { name: "Panadería San Miguel", type: "Negocio", zone: "Chapultepec, México", source: "Recomendación local", status: "Interesado", notes: "Quiere aparecer en Negocios locales y probar chat de pedidos.", contact: OFFICE_PHONE, ambassadorCode: "CON-ANA-101" },
  { name: "Carlos R.", type: "Agente", zone: "Mexicaltzingo, México", source: "Vecino / conocido", status: "Registrado", notes: "Disponible para mandados verificados y entregas pequeñas.", contact: OFFICE_PHONE, ambassadorCode: "CON-LUIS-204" },
  { name: "María G.", type: "Solicitante", zone: "Chapultepec Centro", source: "Grupo local", status: "Contactado", notes: "Necesita mandados a mercado y servicios del hogar.", contact: OFFICE_PHONE, ambassadorCode: "CON-ANA-101" }
];
const AMBASSADOR_DEFAULT_MEMBERS = [
  { name: "Ana M.", zone: "Toluca", profile: "Estudiante / redes sociales", channels: "WhatsApp, Facebook local, grupos de vecinos", focus: "Negocios y agentes de crecimiento", contact: OFFICE_PHONE, code: "CON-ANA-101", status: "Piloto" },
  { name: "Luis H.", zone: "Metepec", profile: "Promotor local", channels: "Referidos directos y comercios", focus: "Mandados y servicios", contact: OFFICE_PHONE, code: "CON-LUIS-204", status: "Piloto" }
];
const MEMBERSHIP_PLANS = [
  { id: "anual", name: "Membresía anual Conecta", audience: "Personas, vecinos, agentes y negocios locales", amount: 98, commission: 50, benefits: "Acceso anual a Conecta Servicios, publicaciones, comunidad local y activación por embajador." }
];
function migrateAmbassadorData() {
  try {
    const current = localStorage.getItem(AMBASSADOR_STORAGE_KEY);
    if (current) return;
    const legacy = JSON.parse(localStorage.getItem(AMBASSADOR_LEGACY_KEY) || "{}");
    if (legacy && (Array.isArray(legacy.referrals) || Array.isArray(legacy.members))) {
      const migrated = {
        referrals: (legacy.referrals || []).map(r => ({ ...r, ambassadorCode: r.ambassadorCode || "SIN-CODIGO" })),
        members: (legacy.members || []).map(m => ({ ...m, code: m.code || generateAmbassadorCode(m.name, m.zone), status: m.status || "Piloto" })),
        payments: []
      };
      localStorage.setItem(AMBASSADOR_STORAGE_KEY, JSON.stringify(migrated));
    }
  } catch {}
}
function getAmbassadorData() {
  migrateAmbassadorData();
  try {
    const saved = JSON.parse(localStorage.getItem(AMBASSADOR_STORAGE_KEY) || "{}");
    return {
      referrals: Array.isArray(saved.referrals) ? saved.referrals : [],
      members: Array.isArray(saved.members) ? saved.members : [],
      payments: Array.isArray(saved.payments) ? saved.payments : []
    };
  } catch {
    return { referrals: [], members: [], payments: [] };
  }
}
function saveAmbassadorData(data) {
  try { localStorage.setItem(AMBASSADOR_STORAGE_KEY, JSON.stringify(data)); } catch {}
}
function getAmbassadorSettings() {
  try {
    return JSON.parse(localStorage.getItem(AMBASSADOR_SETTINGS_KEY) || "{}") || {};
  } catch { return {}; }
}
function saveAmbassadorSettings(settings) {
  try { localStorage.setItem(AMBASSADOR_SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}
function normalizeAmbassadorPart(value) {
  return normalize(value || "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 4)
    .toUpperCase() || "CS";
}
function generateAmbassadorCode(name = "Embajador", zone = "Local") {
  const a = normalizeAmbassadorPart(name);
  const b = normalizeAmbassadorPart(zone);
  const n = String(Date.now()).slice(-3);
  return `CON-${a}-${b}-${n}`;
}
function allAmbassadorReferrals() {
  const data = getAmbassadorData();
  return [...data.referrals, ...AMBASSADOR_DEFAULT_REFERRALS];
}
function allAmbassadorMembers() {
  const data = getAmbassadorData();
  const local = data.members.map(member => ({ ...member, code: member.code || generateAmbassadorCode(member.name, member.zone) }));
  return [...local, ...AMBASSADOR_DEFAULT_MEMBERS];
}
function allAmbassadorPayments() {
  return getAmbassadorData().payments || [];
}
function ambassadorWhatsAppMessage(type, item) {
  if (type === "referido") return `Hola, vi en Conecta Servicios el referido ${item.name || "registrado"}. Código embajador: ${item.ambassadorCode || "por confirmar"}. Quiero dar seguimiento.`;
  if (type === "embajador") return `Hola, soy ${item.name || "embajador Conecta"}. Mi código de embajador es ${item.code || "por confirmar"}. Quiero activar usuarios y negocios.`;
  return "Hola, quiero información sobre Embajadores Conecta.";
}
function ambassadorShareMessage(item) {
  return `Hola, te invito a conocer Conecta Servicios. Usa mi código de embajador: ${item.code || "CON-LOCAL"}. Puedes registrarte como solicitante, agente, negocio o servicio.`;
}
function renderAmbassadorReferralCard(item, local = false) {
  return `<article class="ambassador-item-card">
    <div class="ambassador-card-top"><span class="ambassador-tag">${escapeHtml(item.type || "Referido")}</span><span class="ambassador-code-pill">${escapeHtml(item.ambassadorCode || "Sin código")}</span></div>
    <strong>${escapeHtml(item.name || "Referido piloto")}</strong>
    <p>${escapeHtml(item.notes || "Contacto interesado en conocer Conecta Servicios.")}</p>
    <dl>
      <div><dt>Zona</dt><dd>${escapeHtml(item.zone || "Por definir")}</dd></div>
      <div><dt>Origen</dt><dd>${escapeHtml(item.source || "Invitación directa")}</dd></div>
      <div><dt>Estado</dt><dd>${escapeHtml(item.status || "Interesado")}</dd></div>
    </dl>
    <div class="growth-card-actions">
      <button type="button" class="btn-small btn-purple" onclick="openWhatsApp('${cleanPhone(item.contact || OFFICE_PHONE)}','${encodeURIComponent(ambassadorWhatsAppMessage("referido", item))}')">Dar seguimiento</button>
      ${local ? '<small>Guardado en este dispositivo</small>' : ''}
    </div>
  </article>`;
}
function renderAmbassadorMemberCard(item, local = false) {
  return `<article class="ambassador-item-card ambassador-member-card">
    <div class="ambassador-card-top"><span class="ambassador-tag">Embajador</span><span class="ambassador-code-pill">${escapeHtml(item.code || "CON-LOCAL")}</span></div>
    <strong>${escapeHtml(item.name || "Embajador Conecta")}</strong>
    <p>${escapeHtml(item.profile || "Persona interesada en activar usuarios y negocios locales.")}</p>
    <dl>
      <div><dt>Zona</dt><dd>${escapeHtml(item.zone || "Por definir")}</dd></div>
      <div><dt>Canales</dt><dd>${escapeHtml(item.channels || "WhatsApp y redes locales")}</dd></div>
      <div><dt>Enfoque</dt><dd>${escapeHtml(item.focus || "Usuarios y negocios")}</dd></div>
    </dl>
    <div class="growth-card-actions">
      <button type="button" class="btn-small btn-orange" onclick="openWhatsApp('${cleanPhone(item.contact || OFFICE_PHONE)}','${encodeURIComponent(ambassadorWhatsAppMessage("embajador", item))}')">Contactar</button>
      <button type="button" class="btn-small btn-ghost" onclick="shareAmbassadorCode('${escapeHtml(item.code || "CON-LOCAL")}')">Compartir código</button>
      ${local ? '<small>Mi registro local</small>' : ''}
    </div>
  </article>`;
}
function shareAmbassadorCode(code) {
  const member = allAmbassadorMembers().find(m => m.code === code) || { code };
  const text = ambassadorShareMessage(member);
  if (navigator.share) {
    navigator.share({ title: "Conecta Servicios", text }).catch(() => null);
  } else {
    navigator.clipboard?.writeText(text).then(() => showToast("Mensaje copiado")).catch(() => showToast(text));
  }
}
function getSelectedMembershipPlan(planId) {
  return MEMBERSHIP_PLANS.find(plan => plan.id === planId) || MEMBERSHIP_PLANS[0];
}
function calculateAmbassadorCommission(planId) {
  const plan = getSelectedMembershipPlan(planId);
  return {
    amount: plan.amount,
    ambassadorCommission: plan.commission,
    platformNet: Math.max(0, plan.amount - plan.commission),
    plan
  };
}
function renderAmbassadorMembership() {
  const panel = document.getElementById("ambassadorMembershipPanel");
  if (!panel) return;
  panel.innerHTML = `<div class="membership-model-grid">
    ${MEMBERSHIP_PLANS.map(plan => {
      const calc = calculateAmbassadorCommission(plan.id);
      return `<article class="membership-model-card ${plan.id === "anual" ? "featured" : ""}">
        <span>${"🤝"}</span>
        <strong>${escapeHtml(plan.name)}</strong>
        <p>${escapeHtml(plan.benefits)}</p>
        <small>$${plan.amount} MXN · comisión sugerida $${calc.ambassadorCommission}</small>
      </article>`;
    }).join("")}
  </div>
  <div class="notice-card slim">
    <strong>Modelo flexible</strong>
    <p>La app puede sugerir membresía y comisión, pero el seguimiento inicial puede validarse con Mercado Pago y corte manual. Así se prueba monetización sin construir una wallet propia.</p>
  </div>`;
}
function renderAmbassadorManual() {
  const panel = document.getElementById("ambassadorManualPanel");
  if (!panel) return;
  panel.innerHTML = `<div class="ambassador-manual-grid">
    <article class="manual-step-card"><span>1</span><strong>Explica la app simple</strong><p>Conecta personas que solicitan, agentes que ayudan, negocios locales, servicios y crecimiento.</p></article>
    <article class="manual-step-card"><span>2</span><strong>Detecta el perfil</strong><p>Pregunta si la persona necesita publicar, vender, ofrecer un servicio, hacer mandados o aprender.</p></article>
    <article class="manual-step-card"><span>3</span><strong>Usa tu código</strong><p>Comparte tu código de embajador para que el referido quede asociado a tu activación.</p></article>
    <article class="manual-step-card"><span>4</span><strong>Registra evidencia</strong><p>Guarda nombre, zona, tipo de referido, WhatsApp y estado del acercamiento.</p></article>
    <article class="manual-step-card"><span>5</span><strong>Cobra membresía</strong><p>Cuando el referido acepte, genera cobro Mercado Pago o registra pago manual con referencia.</p></article>
    <article class="manual-step-card"><span>6</span><strong>Corte de comisión</strong><p>El administrador revisa pagos confirmados y paga comisiones por código de embajador.</p></article>
  </div>
  <div class="notice-card slim"><strong>Guía para embajadores</strong><p>El objetivo no es vender humo: es explicar con claridad cómo Conecta puede ayudar a la comunidad, negocios y personas que quieren generar ingresos.</p></div>`;
}
function scrollToAmbassadorPanel(panelId, toastMessage) {
  setTimeout(() => {
    const target = document.getElementById(panelId) || document.getElementById("embajadores");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (toastMessage) showToast(toastMessage);
  }, 90);
}
function openAmbassadorPayments() {
  showSection("embajadores");
  setAmbassadorTab("pagos", false);
  scrollToAmbassadorPanel("ambassadorPaymentPanel", "Cobro de membresía listo para usar");
}
function openAmbassadorManual() {
  showSection("embajadores");
  setAmbassadorTab("manual", false);
  scrollToAmbassadorPanel("ambassadorManualPanel", "Manual rápido para embajadores");
}
function openAmbassadorManualPaymentLink() {
  const settings = getAmbassadorSettings();
  if (settings.manualPaymentLink) {
    showToast("Abriendo link de cobro Mercado Pago");
    window.open(settings.manualPaymentLink, "_blank", "noopener");
  } else {
    showToast("Primero guarda tu link de cobro de Mercado Pago");
    document.getElementById("ambassadorManualPaymentLink")?.focus();
  }
}
function copyAmbassadorPaymentSummary() {
  const payload = getAmbassadorPaymentPayload();
  const text = `Conecta Servicios\nMembresía anual: $${payload.amount} MXN\nCódigo embajador: ${payload.ambassadorCode}\nReferido: ${payload.referralName}\nComisión embajador: $${payload.commission} MXN`;
  navigator.clipboard?.writeText(text).then(() => showToast("Resumen de cobro copiado")).catch(() => showToast(text));
}
function renderAmbassadorPaymentPanel() {
  const panel = document.getElementById("ambassadorPaymentPanel");
  if (!panel) return;
  const members = allAmbassadorMembers();
  const referrals = allAmbassadorReferrals();
  const settings = getAmbassadorSettings();
  const payments = allAmbassadorPayments();
  const memberOptions = members.map(member => `<option value="${escapeHtml(member.code || "CON-LOCAL")}">${escapeHtml(member.code || "CON-LOCAL")} · ${escapeHtml(member.name || "Embajador")}</option>`).join("");
  const referralOptions = referrals.map(ref => `<option value="${escapeHtml(ref.name || "Referido")}">${escapeHtml(ref.name || "Referido")} · ${escapeHtml(ref.type || "Tipo")}</option>`).join("");
  panel.innerHTML = `<form class="form-card ambassador-form ambassador-payment-form" onsubmit="createAmbassadorMembershipPayment(event)">
    <h3>Cobro de membresía</h3>
    <p class="muted">Genera una referencia de pago vinculada al código del embajador. Si Mercado Pago aún no está configurado en Vercel, puedes usar tu link manual.</p>
    <div class="form-grid">
      <label>Código de embajador<select id="ambassadorPaymentCode">${memberOptions || '<option value="CON-LOCAL">CON-LOCAL</option>'}</select></label>
      <label>Referido<select id="ambassadorPaymentReferral"><option value="Nuevo miembro">Nuevo miembro</option>${referralOptions}</select></label>
    </div>
    <label>Tipo de membresía<select id="ambassadorPaymentPlan" onchange="updateAmbassadorPaymentPreview()">${MEMBERSHIP_PLANS.map(plan => `<option value="${plan.id}">${plan.name} · $${plan.amount}</option>`).join("")}</select></label>
    <div id="ambassadorPaymentPreview" class="payment-preview-card"></div>
    <div class="mp-direct-card">
      <strong>Cobro rápido con Mercado Pago</strong>
      <p>Usa el link guardado para cobrar la membresía anual de $98 MXN y conserva el código del embajador para el corte de comisión de $50.</p>
      <div class="dialog-actions"><button type="button" class="btn-small btn-purple" onclick="openAmbassadorManualPaymentLink()">Abrir link de cobro</button><button type="button" class="btn-small btn-ghost" onclick="copyAmbassadorPaymentSummary()">Copiar resumen</button></div>
    </div>
    <label>Notas del pago<input id="ambassadorPaymentNotes" type="text" placeholder="Ej. pago de negocio local de Chapultepec"></label>
    <div class="dialog-actions"><button type="button" class="btn-small btn-ghost" onclick="registerManualAmbassadorPayment()">Registrar pago manual</button><button type="submit" class="btn-small btn-purple">Generar cobro Mercado Pago</button></div>
  </form>
  <form class="form-card ambassador-form ambassador-settings-form" onsubmit="saveAmbassadorPaymentSettings(event)">
    <h3>Configuración rápida</h3>
    <p class="muted">Pega tu link de cobro de Mercado Pago para operar mientras se configura la integración automática.</p>
    <label>Link de cobro Mercado Pago<input id="ambassadorManualPaymentLink" type="url" placeholder="https://mpago.la/..." value="${escapeHtml(settings.manualPaymentLink || "")}"></label>
    <button type="submit" class="btn-small btn-orange">Guardar link</button>
  </form>
  <div class="ambassador-payout-card">
    <strong>Corte de comisiones</strong>
    <p>Los pagos confirmados se agrupan por código de embajador. El administrador puede hacer el corte y pagar por transferencia, efectivo o Mercado Pago.</p>
    <small>Versión piloto: control local y validación manual.</small>
  </div>
  <div class="ambassador-payment-history">
    <h3>Pagos registrados</h3>
    ${payments.length ? payments.map(payment => `<article class="payment-history-card"><strong>${escapeHtml(payment.planName)}</strong><small>${escapeHtml(payment.ambassadorCode)} · ${escapeHtml(payment.referralName)}</small><p>$${payment.amount} MXN · comisión sugerida $${payment.commission} · ${escapeHtml(payment.status)}</p></article>`).join("") : '<p class="muted">Aún no hay pagos registrados en este dispositivo.</p>'}
  </div>`;
  updateAmbassadorPaymentPreview();
}
function updateAmbassadorPaymentPreview() {
  const target = document.getElementById("ambassadorPaymentPreview");
  if (!target) return;
  const planId = document.getElementById("ambassadorPaymentPlan")?.value || "anual";
  const calc = calculateAmbassadorCommission(planId);
  target.innerHTML = `<div><span>Monto sugerido</span><strong>$${calc.amount}</strong></div><div><span>Comisión embajador</span><strong>$${calc.ambassadorCommission}</strong></div><div><span>Conecta</span><strong>$${calc.platformNet}</strong></div>`;
}
function saveAmbassadorPaymentSettings(event) {
  event.preventDefault();
  saveAmbassadorSettings({ manualPaymentLink: document.getElementById("ambassadorManualPaymentLink")?.value.trim() });
  showToast("Link de Mercado Pago guardado");
  renderAmbassadorPaymentPanel();
}
function getAmbassadorPaymentPayload() {
  const planId = document.getElementById("ambassadorPaymentPlan")?.value || "anual";
  const calc = calculateAmbassadorCommission(planId);
  return {
    planId,
    title: `Conecta Servicios - ${calc.plan.name}`,
    amount: calc.amount,
    commission: calc.ambassadorCommission,
    planName: calc.plan.name,
    ambassadorCode: document.getElementById("ambassadorPaymentCode")?.value || "CON-LOCAL",
    referralName: document.getElementById("ambassadorPaymentReferral")?.value || "Nuevo miembro",
    notes: document.getElementById("ambassadorPaymentNotes")?.value.trim() || ""
  };
}
function saveAmbassadorPaymentRecord(payload, status = "Pendiente") {
  const data = getAmbassadorData();
  data.payments.unshift({ ...payload, status, createdAt: new Date().toISOString(), id: `MP-${String(Date.now()).slice(-6)}` });
  saveAmbassadorData(data);
}
async function createAmbassadorMembershipPayment(event) {
  event.preventDefault();
  const payload = getAmbassadorPaymentPayload();
  saveAmbassadorPaymentRecord(payload, "Cobro generado");
  try {
    const response = await fetch("/api/create-ambassador-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok && (result.init_point || result.sandbox_init_point)) {
      showToast("Abriendo Mercado Pago");
      window.open(result.init_point || result.sandbox_init_point, "_blank", "noopener");
    } else {
      openManualMercadoPagoFallback(result.error || "Mercado Pago aún no está configurado en Vercel");
    }
  } catch (error) {
    openManualMercadoPagoFallback("Función de Mercado Pago no disponible todavía");
  }
  renderAmbassadorPaymentPanel();
  trackEvent("embajadores_pago_piloto", null, { plan: payload.planId });
}
function openManualMercadoPagoFallback(message) {
  const settings = getAmbassadorSettings();
  if (settings.manualPaymentLink) {
    showToast("Abriendo link manual de Mercado Pago");
    window.open(settings.manualPaymentLink, "_blank", "noopener");
  } else {
    showToast(message || "Configura tu link de Mercado Pago");
  }
}
function registerManualAmbassadorPayment() {
  const payload = getAmbassadorPaymentPayload();
  saveAmbassadorPaymentRecord(payload, "Pago manual por confirmar");
  showToast("Pago manual registrado para corte");
  renderAmbassadorPaymentPanel();
}
function updateAmbassadorSummary() {
  const referrals = allAmbassadorReferrals();
  const members = allAmbassadorMembers();
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  setText("ambassadorCount", members.length);
  setText("referralCount", referrals.length);
  setText("businessReferralCount", referrals.filter(r => normalize(r.type).includes("negocio")).length);
  setText("agentReferralCount", referrals.filter(r => normalize(r.type).includes("agente")).length);
}
function renderAmbassadorPilot() {
  updateAmbassadorSummary();
  const data = getAmbassadorData();
  const referrals = allAmbassadorReferrals();
  const members = allAmbassadorMembers();
  const referralList = document.getElementById("ambassadorReferralsList");
  const memberList = document.getElementById("ambassadorMembersList");
  if (referralList) referralList.innerHTML = referrals.map((item, index) => renderAmbassadorReferralCard(item, index < data.referrals.length)).join("");
  if (memberList) memberList.innerHTML = members.map((item, index) => renderAmbassadorMemberCard(item, index < data.members.length)).join("");
  renderAmbassadorPaymentPanel();
  renderAmbassadorMembership();
  renderAmbassadorManual();
  setAmbassadorTab(ambassadorActiveTab, false);
}
function setAmbassadorTab(tab, scroll = true) {
  ambassadorActiveTab = tab;
  document.querySelectorAll("[data-ambassador-tab]").forEach(button => button.classList.toggle("active", button.dataset.ambassadorTab === tab));
  document.getElementById("ambassadorReferralsList")?.classList.toggle("hidden", tab !== "referidos");
  document.getElementById("ambassadorMembersList")?.classList.toggle("hidden", tab !== "embajadores");
  document.getElementById("ambassadorPaymentPanel")?.classList.toggle("hidden", tab !== "pagos");
  document.getElementById("ambassadorMembershipPanel")?.classList.toggle("hidden", tab !== "membresia");
  document.getElementById("ambassadorManualPanel")?.classList.toggle("hidden", tab !== "manual");
  if (tab === "pagos") renderAmbassadorPaymentPanel();
  if (tab === "membresia") renderAmbassadorMembership();
  if (tab === "manual") renderAmbassadorManual();
  if (scroll) document.getElementById("embajadores")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
function showAmbassadorPanel(type = "embajador") {
  const panel = document.getElementById("ambassadorPanel");
  if (!panel) return;
  const isReferral = type === "referido";
  const members = allAmbassadorMembers();
  const memberOptions = members.map(member => `<option value="${escapeHtml(member.code || "CON-LOCAL")}">${escapeHtml(member.code || "CON-LOCAL")} · ${escapeHtml(member.name || "Embajador")}</option>`).join("");
  panel.classList.remove("hidden");
  panel.innerHTML = `<form class="form-card ambassador-form" onsubmit="submitAmbassadorPilot(event, '${isReferral ? "referido" : "embajador"}')">
    <h3>${isReferral ? "Registrar referido" : "Registro de embajador"}</h3>
    <p class="muted">${isReferral ? "Vincula un contacto al código de un embajador para dar seguimiento y calcular comisión." : "Crea un perfil local y genera un código único de embajador."}</p>
    ${isReferral ? `
      <label>Código de embajador<select id="ambassadorReferralCode">${memberOptions || '<option value="CON-LOCAL">CON-LOCAL</option>'}</select></label>
      <label>Nombre del referido o negocio<input id="ambassadorReferralName" type="text" placeholder="Ej. Panadería La Estrella" required></label>
      <div class="form-grid"><label>Tipo<select id="ambassadorReferralType"><option>Negocio</option><option>Agente</option><option>Solicitante</option><option>Servicio</option><option>Crecimiento</option></select></label><label>Estado<select id="ambassadorReferralStatus"><option>Interesado</option><option>Contactado</option><option>Registrado</option><option>Pago pendiente</option><option>Pago confirmado</option></select></label></div>
      <label>Zona<input id="ambassadorReferralZone" type="text" placeholder="Municipio o localidad"></label>
      <label>Origen del contacto<input id="ambassadorReferralSource" type="text" placeholder="Ej. WhatsApp, grupo local, visita directa"></label>
      <label>Notas<textarea id="ambassadorReferralNotes" rows="4" placeholder="Qué necesita, qué ofrece o qué membresía podría interesarle"></textarea></label>
      <label>WhatsApp de seguimiento<input id="ambassadorReferralContact" type="tel" placeholder="10 dígitos"></label>` : `
      <label>Nombre público<input id="ambassadorMemberName" type="text" placeholder="Ej. Ana M." required></label>
      <label>Zona donde puede activar usuarios<input id="ambassadorMemberZone" type="text" placeholder="Ej. Chapultepec, Metepec, Toluca"></label>
      <label>Perfil<select id="ambassadorMemberProfile"><option>Estudiante</option><option>Promotor local</option><option>Agente de servicios</option><option>Negocio local</option><option>Creador de contenido</option><option>Otro</option></select></label>
      <label>Canales para invitar<textarea id="ambassadorMemberChannels" rows="3" placeholder="WhatsApp, grupos locales, Facebook, visitas a negocios, escuela, comunidad..."></textarea></label>
      <label>Enfoque principal<textarea id="ambassadorMemberFocus" rows="3" placeholder="Negocios, solicitantes, agentes, servicios, mandados, aprendizaje..."></textarea></label>
      <label>WhatsApp de seguimiento<input id="ambassadorMemberContact" type="tel" placeholder="10 dígitos"></label>`}
    <div class="notice-card slim">
      <strong>${isReferral ? "Referencia medible" : "Código único"}</strong>
      <p>${isReferral ? "El referido queda ligado al código del embajador para seguimiento y corte manual." : "Al guardar se genera un código tipo CON-XXXX que podrá usarse en pagos y referidos."}</p>
    </div>
    <div class="dialog-actions"><button type="button" class="btn-small btn-ghost" onclick="document.getElementById('ambassadorPanel').classList.add('hidden')">Cancelar</button><button type="submit" class="btn-small btn-purple">Guardar</button></div>
  </form>`;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}
function submitAmbassadorPilot(event, type) {
  event.preventDefault();
  const data = getAmbassadorData();
  if (type === "referido") {
    data.referrals.unshift({
      name: document.getElementById("ambassadorReferralName")?.value.trim(),
      type: document.getElementById("ambassadorReferralType")?.value,
      status: document.getElementById("ambassadorReferralStatus")?.value,
      zone: document.getElementById("ambassadorReferralZone")?.value.trim(),
      source: document.getElementById("ambassadorReferralSource")?.value.trim(),
      notes: document.getElementById("ambassadorReferralNotes")?.value.trim(),
      contact: cleanPhone(document.getElementById("ambassadorReferralContact")?.value),
      ambassadorCode: document.getElementById("ambassadorReferralCode")?.value || "CON-LOCAL"
    });
    ambassadorActiveTab = "referidos";
    showToast("Referido guardado con código de embajador");
  } else {
    const name = document.getElementById("ambassadorMemberName")?.value.trim();
    const zone = document.getElementById("ambassadorMemberZone")?.value.trim();
    const code = generateAmbassadorCode(name, zone);
    data.members.unshift({
      name,
      zone,
      profile: document.getElementById("ambassadorMemberProfile")?.value,
      channels: document.getElementById("ambassadorMemberChannels")?.value.trim(),
      focus: document.getElementById("ambassadorMemberFocus")?.value.trim(),
      contact: cleanPhone(document.getElementById("ambassadorMemberContact")?.value),
      code,
      status: "Activo piloto"
    });
    ambassadorActiveTab = "embajadores";
    showToast(`Embajador guardado: ${code}`);
  }
  saveAmbassadorData(data);
  document.getElementById("ambassadorPanel")?.classList.add("hidden");
  renderAmbassadorPilot();
  trackEvent("embajadores_piloto", null, { tipo: type });
}


document.addEventListener("DOMContentLoaded", () => {
  renderSmartChat();
  renderCourseCards();
  renderErrandPilotLists?.();
  renderProtectedFundSimulator?.();
  renderBusinessPilotList?.();
  renderAmbassadorPilot?.();
});


// v4.9.11 — Flujos tipo encuesta para botones principales
const BUSINESS_CHAT_STORAGE_KEY = "conecta_chat_negocios_v4911";
let surveyState = { flow: "", step: 0, values: {}, context: "" };

const SURVEY_CONFIG = {
  mandadoSolicitud: {
    title: "Solicitar mandado verificado",
    subtitle: "Te guiamos paso a paso para que no tengas que llenar todo en una sola pantalla.",
    icon: "🧺",
    module: "mandados",
    steps: [
      { title: "¿Qué necesitas comprar?", hint: "Escribe los productos principales. Puedes mencionar calidad, marcas o sustituciones.", fields: [
        { id:"item", label:"Productos", type:"text", required:true, placeholder:"Ej. jitomate, pollo, abarrotes, medicamento..." },
        { id:"notes", label:"Observaciones", type:"textarea", placeholder:"Ej. maduro pero firme, no muy grande, si no hay marca A comprar marca B" }
      ]},
      { title: "Lugar de compra y entrega", hint: "Ayuda al agente a entender la ruta antes de aceptar.", fields: [
        { id:"buyAt", label:"¿Dónde se compra?", type:"text", required:true, placeholder:"Ej. Central de Abastos, mercado, tienda..." },
        { id:"deliverTo", label:"¿Dónde se entrega?", type:"text", required:true, placeholder:"Colonia, municipio o referencia" }
      ]},
      { title: "Referencia de peso y compra", hint: "La app solo calcula una referencia flexible; el trato final lo acuerdan las partes.", fields: [
        { id:"weight", label:"Peso estimado kg", type:"number", value:"5", step:"0.1" },
        { id:"amount", label:"Monto aproximado de compra", type:"number", value:"400", step:"10" }
      ]},
      { title: "Distancia y horario", hint: "Estos datos ayudan a sugerir un apoyo justo para el agente.", fields: [
        { id:"distance", label:"Distancia estimada km", type:"number", value:"4", step:"0.1" },
        { id:"schedule", label:"Horario", type:"select", options:["Normal","Hora pico","Noche","Lluvia o festivo","Urgente"] }
      ]},
      { title: "Contacto", hint: "Este número sirve para acordar detalles por trato directo.", fields: [
        { id:"phone", label:"WhatsApp", type:"tel", required:true, placeholder:"10 dígitos" }
      ]}
    ]
  },
  mandadoAgente: {
    title: "Trabajar como agente de mandados",
    subtitle: "Registra tu perfil de forma sencilla para que las personas sepan qué puedes hacer.",
    icon: "🛵",
    module: "mandados",
    steps: [
      { title:"Datos visibles", hint:"Usa un nombre público y tu zona de atención.", fields:[
        { id:"name", label:"Nombre público", type:"text", required:true, placeholder:"Ej. Juan Pérez" },
        { id:"zone", label:"Municipio o zona", type:"text", required:true, placeholder:"Ej. Toluca, Metepec, Chapultepec" }
      ]},
      { title:"Cómo puedes moverte", hint:"Esto ayuda a calcular qué tipo de mandados puedes aceptar.", fields:[
        { id:"transport", label:"Transporte", type:"select", options:["Moto","Auto","Bicicleta","A pie","Camioneta"] },
        { id:"capacity", label:"Capacidad aproximada", type:"text", required:true, placeholder:"Ej. hasta 10 kg" }
      ]},
      { title:"Habilidades", hint:"Menciona mercados que conoces, productos que puedes comprar y si puedes registrar evidencia.", fields:[
        { id:"skills", label:"Habilidades o zonas que conoces", type:"textarea", required:true, placeholder:"Ej. mercado, central, farmacia, ticket, báscula, entrega cuidadosa..." }
      ]},
      { title:"Contacto", hint:"El contacto permite trato directo con solicitantes.", fields:[
        { id:"phone", label:"WhatsApp", type:"tel", required:true, placeholder:"10 dígitos" }
      ]}
    ]
  },
  crecimientoNegocio: {
    title: "Conseguir clientes por comisión",
    subtitle: "Crea una campaña clara para que un agente sepa qué resultado debe conseguir.",
    icon: "📈",
    module: "agentes",
    steps: [
      { title:"¿Qué quieres promocionar?", hint:"Producto, servicio o campaña que necesita clientes.", fields:[
        { id:"title", label:"Producto o servicio", type:"text", required:true, placeholder:"Ej. Crédito para pensionados, estética, curso, panadería..." },
        { id:"zone", label:"Zona", type:"text", required:true, placeholder:"Ej. Estado de México, Toluca, Chapultepec" }
      ]},
      { title:"Resultado y comisión", hint:"Define por qué pagarás. Esto evita malentendidos.", fields:[
        { id:"result", label:"Resultado que pagarás", type:"select", options:["Contacto interesado","Cita agendada","Cliente aprobado","Venta cerrada"] },
        { id:"commission", label:"Comisión ofrecida", type:"text", required:true, placeholder:"Ej. $300 por cliente aprobado o 10% por venta" }
      ]},
      { title:"Descripción guiada", hint:"Explica requisitos y forma de validar el resultado.", fields:[
        { id:"description", label:"Descripción", type:"textarea", required:true, placeholder:"Ofrezco: ...\nBusco: ...\nResultado válido: ...\nComisión: ...\nZona: ..." }
      ]},
      { title:"Contacto", hint:"El agente podrá comunicarse para acordar condiciones.", fields:[
        { id:"phone", label:"WhatsApp", type:"tel", required:true, placeholder:"10 dígitos" }
      ]}
    ]
  },
  crecimientoAgente: {
    title: "Trabajar por comisión",
    subtitle: "Registra tus habilidades para apoyar campañas y ganar por resultado.",
    icon: "🧑‍🎓",
    module: "agentes",
    steps: [
      { title:"Datos visibles", hint:"Esto ayuda a negocios a ubicarte.", fields:[
        { id:"name", label:"Nombre público", type:"text", required:true, placeholder:"Ej. Ana Martínez" },
        { id:"zone", label:"Municipio o zona", type:"text", required:true, placeholder:"Ej. Toluca, Metepec, Chapultepec" }
      ]},
      { title:"Habilidades", hint:"Puedes incluir redes sociales, diseño, ventas, WhatsApp, atención a clientes o videos cortos.", fields:[
        { id:"skills", label:"Habilidades", type:"textarea", required:true, placeholder:"Ej. redes sociales, diseño de flyers, ventas por WhatsApp, atención a clientes..." }
      ], chips:["Redes sociales","Diseño de flyers","Ventas por WhatsApp","Atención a clientes","Captación de clientes","Videos cortos"]},
      { title:"Contacto", hint:"El contacto permite trato directo con negocios o campañas.", fields:[
        { id:"phone", label:"WhatsApp", type:"tel", required:true, placeholder:"10 dígitos" }
      ]}
    ]
  },
  chatNegocio: {
    title: "Activar chat de negocio",
    subtitle: "Prepara tu negocio para recibir preguntas, pedidos, citas, cotizaciones, pickup o envío.",
    icon: "🏪",
    module: "negocios",
    steps: [
      { title:"Tipo de negocio", hint:"Selecciona cómo quieres aparecer.", fields:[
        { id:"type", label:"Tipo", type:"select", options:["Negocio local","Panadería","Estética","Ferretería","Carpintería","Restaurante","Servicio profesional","Otro"] },
        { id:"name", label:"Nombre del negocio", type:"text", required:true, placeholder:"Ej. Panadería San Miguel" }
      ]},
      { title:"Qué quieres recibir por chat", hint:"Elige la operación principal que quieres probar primero.", fields:[
        { id:"goal", label:"Función inicial", type:"select", options:["Pedidos por chat","Catálogo simple","Citas o agenda","Cotizaciones","Envío o pickup","Información de servicios"] },
        { id:"zone", label:"Zona", type:"text", required:true, placeholder:"Municipio o colonia" }
      ]},
      { title:"Mensaje inicial", hint:"Este texto sirve como guía para que los clientes sepan qué pedirte.", fields:[
        { id:"message", label:"Mensaje para clientes", type:"textarea", required:true, placeholder:"Ej. Hola, puedo mostrarte productos, precios, disponibilidad, entrega o pickup." }
      ]},
      { title:"Contacto", hint:"Este WhatsApp será el canal de trato directo mientras crece la terminal de venta.", fields:[
        { id:"phone", label:"WhatsApp", type:"tel", required:true, placeholder:"10 dígitos" }
      ]}
    ]
  }
};

function startSurveyFlow(flow, context = "") {
  if (flow === "crecimientoMenu") return renderGrowthSurveyMenu();
  const config = SURVEY_CONFIG[flow];
  if (!config) return;
  surveyState = { flow, step: 0, values: {}, context: context || "" };
  config.steps.forEach(step => (step.fields || []).forEach(field => {
    if (field.value !== undefined) surveyState.values[field.id] = field.type === "number" ? Number(field.value || 0) : String(field.value);
    else if (field.type === "select" && Array.isArray(field.options) && field.options.length) surveyState.values[field.id] = field.options[0];
  }));
  if (flow === "chatNegocio" && context) surveyState.values.type = context;
  showSection("encuesta");
  renderSurveyFlow();
  trackEvent("flujo_encuesta_inicio", null, { flujo: flow, contexto: context });
}

function renderGrowthSurveyMenu() {
  surveyState = { flow: "crecimientoMenu", step: 0, values: {}, context: "" };
  showSection("encuesta");
  const root = document.getElementById("surveyFlowContent");
  if (!root) return;
  root.innerHTML = `<div class="survey-shell">
    <button type="button" class="survey-back-link" onclick="showSection('oportunidades')">← Volver a oportunidades</button>
    <div class="survey-hero"><span>📈</span><h2>Agentes de crecimiento</h2><p>Elige una ruta. La app te guiará como encuesta, paso por paso.</p></div>
    <div class="survey-path-grid">
      <button type="button" onclick="startSurveyFlow('crecimientoNegocio')"><span>🏪</span><strong>Quiero conseguir clientes</strong><small>Publicar campaña y comisión por resultado.</small></button>
      <button type="button" onclick="startSurveyFlow('crecimientoAgente')"><span>🧑‍🎓</span><strong>Quiero trabajar por comisión</strong><small>Registrar habilidades y disponibilidad.</small></button>
    </div>
  </div>`;
}

function surveyCurrentConfig() { return SURVEY_CONFIG[surveyState.flow]; }
function surveyCurrentStep() { return surveyCurrentConfig()?.steps?.[surveyState.step]; }
function surveyFieldValue(field) {
  const value = surveyState.values[field.id];
  if (value !== undefined && value !== null) return String(value);
  if (field.value !== undefined) return String(field.value);
  if (field.type === "select" && Array.isArray(field.options) && field.options.length) return field.options[0];
  return "";
}
function renderSurveyField(field) {
  const value = surveyFieldValue(field);
  const required = field.required ? "required" : "";
  if (field.type === "textarea") {
    return `<label class="survey-field"><span>${escapeHtml(field.label)}</span><textarea id="survey_${field.id}" rows="5" ${required} placeholder="${escapeHtml(field.placeholder || "")}" oninput="autoSizeTextarea(this)" onpaste="normalizeTextareaPaste(event)">${escapeHtml(value)}</textarea></label>`;
  }
  if (field.type === "select") {
    return `<label class="survey-field"><span>${escapeHtml(field.label)}</span><select id="survey_${field.id}" ${required}>${(field.options || []).map(opt => `<option ${opt === value ? "selected" : ""}>${escapeHtml(opt)}</option>`).join("")}</select></label>`;
  }
  return `<label class="survey-field"><span>${escapeHtml(field.label)}</span><input id="survey_${field.id}" type="${escapeHtml(field.type || "text")}" ${required} step="${escapeHtml(field.step || "1")}" value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder || "")}"></label>`;
}
function renderSurveyFlow() {
  const config = surveyCurrentConfig();
  const step = surveyCurrentStep();
  const root = document.getElementById("surveyFlowContent");
  if (!config || !step || !root) return;
  const total = config.steps.length;
  const progress = Math.round(((surveyState.step + 1) / total) * 100);
  root.innerHTML = `<div class="survey-shell">
    <button type="button" class="survey-back-link" onclick="surveyCancel()">← Salir de encuesta</button>
    <div class="survey-hero">
      <span>${config.icon}</span>
      <h2>${escapeHtml(config.title)}</h2>
      <p>${escapeHtml(config.subtitle)}</p>
    </div>
    <div class="survey-progress"><b style="width:${progress}%"></b></div>
    <div class="survey-step-card">
      <small>Paso ${surveyState.step + 1} de ${total}</small>
      <h3>${escapeHtml(step.title)}</h3>
      <p>${escapeHtml(step.hint || "")}</p>
      <form id="surveyStepForm" onsubmit="surveyNext(event)">
        ${step.fields.map(renderSurveyField).join("")}
        ${step.chips ? `<div class="survey-chip-row">${step.chips.map(chip => `<button type="button" onclick="surveyAppendChip('skills','${escapeHtml(chip)}')">${escapeHtml(chip)}</button>`).join("")}</div>` : ""}
        ${surveyRenderLivePreview()}
        <div class="survey-actions">
          <button type="button" class="btn-small btn-ghost" onclick="surveyPrevious()" ${surveyState.step === 0 ? "disabled" : ""}>Atrás</button>
          <button type="submit" class="btn-small btn-purple">${surveyState.step === total - 1 ? "Guardar" : "Siguiente"}</button>
        </div>
      </form>
    </div>
  </div>`;
  root.querySelectorAll("textarea").forEach(autoSizeTextarea);
}
function surveyRenderLivePreview() {
  if (surveyState.flow !== "mandadoSolicitud" || surveyState.step < 2) return "";
  const values = { ...surveyState.values };
  const quote = calculateErrandEstimate(values);
  return `<div class="survey-preview-card"><strong>Referencia estimada</strong><p>Rango sugerido: <b>${errandMoney(quote.min)} - ${errandMoney(quote.max)}</b>. El trato final se acuerda directamente.</p></div>`;
}
function surveySaveCurrentStep() {
  const step = surveyCurrentStep();
  if (!step) return true;
  for (const field of step.fields) {
    const el = document.getElementById(`survey_${field.id}`);
    if (!el) continue;
    if (field.required && !String(el.value || "").trim()) {
      el.focus();
      showToast("Completa el campo requerido");
      return false;
    }
    surveyState.values[field.id] = field.type === "number" ? Number(el.value || 0) : String(el.value || "").trim();
  }
  return true;
}
function surveyNext(event) {
  event?.preventDefault?.();
  if (!surveySaveCurrentStep()) return;
  const config = surveyCurrentConfig();
  if (!config) return;
  if (surveyState.step < config.steps.length - 1) {
    surveyState.step += 1;
    renderSurveyFlow();
    return;
  }
  surveyFinish();
}
function surveyPrevious() {
  surveySaveCurrentStep();
  if (surveyState.step > 0) {
    surveyState.step -= 1;
    renderSurveyFlow();
  }
}
function surveyCancel() {
  const config = surveyCurrentConfig();
  showSection(config?.module || "oportunidades");
}
function surveyAppendChip(fieldId, value) {
  const el = document.getElementById(`survey_${fieldId}`);
  if (!el) return;
  const current = el.value.split(",").map(v => v.trim()).filter(Boolean);
  if (!current.some(v => normalize(v) === normalize(value))) current.push(value);
  el.value = current.join(", ");
  autoSizeTextarea(el);
}
function surveyFinish() {
  const flow = surveyState.flow;
  const v = { ...surveyState.values };
  let title = "Registro guardado";
  let message = "La información quedó guardada en modo piloto en este dispositivo.";
  let module = surveyCurrentConfig()?.module || "oportunidades";
  if (flow === "mandadoSolicitud") {
    const data = getErrandPilotData();
    const quote = calculateErrandEstimate(v);
    data.requests.unshift({ id:`MV-${String(Date.now()).slice(-5)}`, item:v.item, buyAt:v.buyAt, deliverTo:v.deliverTo, weight:v.weight, amount:v.amount, distance:v.distance, schedule:v.schedule, notes:v.notes, estimate:quote.total, status:"Buscando agente", contact:cleanPhone(v.phone) });
    saveErrandPilotData(data); errandActiveTab = "solicitudes"; renderErrandPilotLists();
    title = "Mandado solicitado"; message = `Referencia flexible: ${errandMoney(quote.min)} - ${errandMoney(quote.max)}. El trato final se acuerda directamente con el agente.`;
  }
  if (flow === "mandadoAgente") {
    const data = getErrandPilotData();
    data.agents.unshift({ name:v.name, zone:v.zone, transport:v.transport, capacity:v.capacity, skills:v.skills, rating:"Nuevo", contact:cleanPhone(v.phone) });
    saveErrandPilotData(data); errandActiveTab = "agentes"; renderErrandPilotLists();
    title = "Agente registrado"; message = "Tu perfil piloto quedó disponible para mandados verificados.";
  }
  if (flow === "crecimientoNegocio") {
    const data = getGrowthPilotData();
    data.campaigns.unshift({ title:v.title, category:"Campaña", zone:v.zone, result:v.result, commission:v.commission, description:v.description, contact:cleanPhone(v.phone) });
    saveGrowthPilotData(data); growthActiveTab = "campanas"; renderGrowthPilotLists();
    title = "Campaña guardada"; message = "Tu campaña piloto quedó lista para que agentes conozcan comisión, zona y resultado esperado.";
  }
  if (flow === "crecimientoAgente") {
    const data = getGrowthPilotData();
    data.agents.unshift({ name:v.name, zone:v.zone, skills:v.skills, availability:"Disponible por comisión", rating:"Nuevo", contact:cleanPhone(v.phone) });
    saveGrowthPilotData(data); growthActiveTab = "agentes"; renderGrowthPilotLists();
    title = "Agente de crecimiento registrado"; message = "Tu perfil piloto quedó disponible para campañas por comisión.";
  }
  if (flow === "chatNegocio") {
    saveBusinessChatLead(v);
    title = "Chat de negocio preparado"; message = "Quedó guardada una solicitud piloto para activar chat, catálogo, pedidos, citas o pickup según el negocio.";
  }
  renderSurveySuccess(title, message, module);
  showToast(title);
  trackEvent("flujo_encuesta_guardado", null, { flujo: flow });
}
function getBusinessChatLeads() {
  try { return JSON.parse(localStorage.getItem(BUSINESS_CHAT_STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveBusinessChatLead(v) {
  const rows = getBusinessChatLeads();
  rows.unshift({ id:`CN-${String(Date.now()).slice(-5)}`, type:v.type, name:v.name, goal:v.goal, zone:v.zone, message:v.message, contact:cleanPhone(v.phone), createdAt:new Date().toISOString() });
  try { localStorage.setItem(BUSINESS_CHAT_STORAGE_KEY, JSON.stringify(rows)); } catch {}
}
function renderSurveySuccess(title, message, module) {
  const root = document.getElementById("surveyFlowContent");
  if (!root) return;
  root.innerHTML = `<div class="survey-shell">
    <div class="survey-success-card">
      <span>✅</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(message)}</p>
      <div class="survey-success-actions">
        <button type="button" class="btn-small btn-purple" onclick="showSection('${escapeHtml(module)}')">Ver módulo</button>
        <button type="button" class="btn-small btn-outline" onclick="startOpportunityGuide()">Oportunidades</button>
        <button type="button" class="btn-small btn-ghost" onclick="showSection('inicio')">Inicio</button>
      </div>
    </div>
  </div>`;
}
