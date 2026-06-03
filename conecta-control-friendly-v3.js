/* Conecta Control Friendly v3
   Diagnóstico primero: entiende el negocio, propone tablero y luego registra.
   Módulo aislado para /control. No toca app.js, Supabase, publicaciones, mensajes ni geolocalización.
*/
(() => {
  'use strict';

  const CONFIG_KEY = 'cc_friendly_config_v1';
  const RECORDS_KEY = 'cc_friendly_records_v1';
  const DIAG_KEY = 'cc_friendly_diagnosis_v1';
  const LEGACY_CONFIG_KEY = 'conecta_control_business_config';
  const STYLE_ID = 'cc-friendly-v3-styles';

  const BASE_CONTROLS = [
    {key:'VENTA', icon:'💰', label:'Ventas', short:'Entró dinero', flow:'entrada'},
    {key:'GASTO', icon:'🛒', label:'Compras', short:'Salió dinero', flow:'salida'},
    {key:'PEDIDO', icon:'📋', label:'Pedidos', short:'Me encargaron', flow:'pendiente'},
    {key:'ANTICIPO', icon:'💵', label:'Anticipos', short:'Me adelantaron', flow:'entrada'},
    {key:'DEUDA', icon:'🧾', label:'Me deben', short:'Falta cobrar', flow:'pendiente'},
    {key:'CLIENTE', icon:'🤝', label:'Clientes', short:'Quién me compra', flow:'nota'},
    {key:'INVENTARIO', icon:'📦', label:'Inventario', short:'Qué tengo', flow:'nota'},
    {key:'PRODUCCION', icon:'🍰', label:'Producción', short:'Lo que hice', flow:'nota'},
    {key:'MERMA', icon:'⚠️', label:'Mermas', short:'Se perdió', flow:'salida'},
    {key:'EMPLEADO', icon:'👥', label:'Empleados', short:'Pagué ayuda', flow:'salida'},
    {key:'CITA', icon:'📅', label:'Citas', short:'Agenda', flow:'pendiente'},
    {key:'MEMBRESIA', icon:'🪪', label:'Membresías', short:'Mensualidades', flow:'entrada'},
    {key:'MATERIAL', icon:'🧰', label:'Materiales', short:'Para trabajar', flow:'salida'},
    {key:'CADUCIDAD', icon:'⏳', label:'Caducidad', short:'Por vencer', flow:'nota'},
    {key:'ASISTENCIA', icon:'✅', label:'Asistencia', short:'Quién vino', flow:'nota'},
    {key:'PROVEEDOR', icon:'🚚', label:'Proveedores', short:'A quién compro', flow:'nota'}
  ];

  const DEMO_PRODUCTS = [
    {name:'Pay de limón', price:25, aliases:['limón','limon','pay limon','pay de limon','pay de limón','pays limon','pays de limon','pays de limón']},
    {name:'Arroz con leche', price:25, aliases:['arroz','arroz con leche','arrocito']},
    {name:'Pay de queso', price:25, aliases:['queso','pay queso','pay de queso','pays queso','pays de queso']},
    {name:'Fresas con crema', price:35, aliases:['fresas','fresa','fresas con crema','fresa con crema']}
  ];

  const PROFILES = [
    {id:'postres', name:'Venta de postres', icon:'🍰', category:'Comida', keywords:['postre','postres','pay','pays','pastel','pasteles','gelatina','gelatinas','arroz con leche','fresas con crema','reposteria','repostería'], controls:['VENTA','GASTO','PRODUCCION','INVENTARIO','MERMA','PEDIDO','ANTICIPO','DEUDA','CLIENTE','EMPLEADO'], products:DEMO_PRODUCTS, basic:['Productos vendidos','Ingredientes comprados','Pedidos por encargo','Anticipos','Saldo pendiente','Merma'], advanced:['Recetas por producto','Costo por postre','Caducidad','Clientes frecuentes','Recomendación de producción'], examples:['Vendí 3 pays de limón','Me encargaron un pastel para el sábado','Me dieron $200 de anticipo','Pagué a María $300']},
    {id:'tortilleria', name:'Tortillería', icon:'🌽', category:'Producción diaria', keywords:['tortilleria','tortillería','tortilla','tortillas','masa','maiz','maíz','nixtamal','kilo','kilos'], controls:['VENTA','GASTO','INVENTARIO','MERMA','EMPLEADO','PROVEEDOR'], products:[{name:'Kilo de tortilla', price:0, aliases:['kilo','kilos','tortilla','tortillas']}], basic:['Kilos vendidos','Maíz o masa comprada','Gas/luz','Tortilla sobrante','Corte del día'], advanced:['Rendimiento de maíz','Costo por kilo','Turnos','Pedidos de tienda'], examples:['Vendí 40 kilos','Compré maíz $900','Sobró tortilla','Pagué turno $350']},
    {id:'carpintero', name:'Carpintero / muebles', icon:'🪵', category:'Oficio por encargo', keywords:['carpintero','carpinteria','carpintería','mueble','muebles','madera','closet','clóset','cocina integral','puerta','mesa','silla'], controls:['PEDIDO','MATERIAL','GASTO','ANTICIPO','DEUDA','CLIENTE','EMPLEADO'], products:[], basic:['Trabajo solicitado','Madera y herrajes','Anticipo','Saldo pendiente','Fecha de entrega','Mano de obra'], advanced:['Cotizaciones','Fotos de avance','Instalación','Garantía','Historial por cliente'], examples:['Me pidieron un clóset','Compré madera $1200','Me dieron anticipo $2000','Me deben $3000 del mueble']},
    {id:'consultorio', name:'Consultorio médico', icon:'🩺', category:'Citas', keywords:['doctor','doctora','medico','médico','consulta','consultorio','paciente','pacientes','citas','terapia'], controls:['CITA','CLIENTE','VENTA','DEUDA','GASTO'], products:[], basic:['Citas','Pacientes','Consulta pagada','Pendientes','Insumos'], advanced:['Seguimiento','Recordatorios','Paquetes de consulta','Reporte mensual'], examples:['Tengo cita con Ana a las 5','Consulta pagada $500','Me deben la consulta','Compré guantes $120']},
    {id:'gimnasio', name:'Gimnasio', icon:'🏋️', category:'Membresías', keywords:['gimnasio','gym','mensualidad','mensualidades','membresia','membresía','socio','socios','clase grupal'], controls:['MEMBRESIA','CLIENTE','DEUDA','ASISTENCIA','GASTO','EMPLEADO'], products:[], basic:['Socios','Mensualidades','Vencimientos','Asistencia','Gastos'], advanced:['Planes','Clases grupales','Entrenadores','Mantenimiento de equipo','Alertas de vencimiento'], examples:['Juan pagó mensualidad $500','Ana debe mensualidad','Vinieron 20 personas','Pagué renta $3000']},
    {id:'entrenador', name:'Entrenador personal', icon:'💪', category:'Sesiones', keywords:['entrenador','personal trainer','rutina','rutinas','fitness','sesion','sesión','sesiones','paquete de sesiones'], controls:['CLIENTE','CITA','MEMBRESIA','VENTA','DEUDA'], products:[], basic:['Clientes','Sesiones','Paquetes','Sesiones usadas','Pagos pendientes'], advanced:['Renovaciones','Seguimiento de progreso','Clientes activos','Recordatorios'], examples:['Vendí paquete de 10 sesiones','Hoy entrenó Ana','Me debe 2 sesiones','Renovó paquete']},
    {id:'ferreteria', name:'Ferretería', icon:'🔩', category:'Inventario', keywords:['ferreteria','ferretería','herramienta','herramientas','tornillo','tornillos','clavos','pintura','refaccion','refacción','plomeria','plomería','material electrico','eléctrico'], controls:['VENTA','INVENTARIO','GASTO','PROVEEDOR','DEUDA','CLIENTE'], products:[], basic:['Producto vendido','Existencias','Mercancía comprada','Proveedores','Fiado'], advanced:['SKU','Inventario mínimo','Productos más vendidos','Fiado por cliente'], examples:['Vendí tornillos $80','Agregué 20 martillos','Compré mercancía $5000','Le fié a Juan $200']},
    {id:'farmacia', name:'Farmacia', icon:'💊', category:'Inventario con caducidad', keywords:['farmacia','medicina','medicinas','medicamento','medicamentos','generico','genérico','caducidad','caduca','salud'], controls:['VENTA','INVENTARIO','CADUCIDAD','PROVEEDOR','GASTO','DEUDA'], products:[], basic:['Medicamento vendido','Existencias','Caducidad','Compras a proveedor','Corte'], advanced:['Alertas de caducidad','Lotes','Inventario mínimo','Proveedor por laboratorio'], examples:['Vendí medicamento $120','Entró producto nuevo','Caduca en junio','Compré a proveedor $4000']},
    {id:'clases', name:'Clases particulares', icon:'📚', category:'Clases', keywords:['clases','maestro','maestra','tutor','tutorias','tutorías','regularizacion','regularización','ingles','inglés','matematicas','matemáticas','alumno','alumnos'], controls:['CLIENTE','CITA','VENTA','ANTICIPO','DEUDA','MEMBRESIA'], products:[], basic:['Alumnos','Clases dadas','Pago por clase','Paquetes','Pendientes'], advanced:['Asistencia','Material entregado','Recordatorios','Reporte por alumno'], examples:['Di clase a Ana','Me pagó 4 clases','Me debe una clase','Compró paquete mensual']},
    {id:'belleza', name:'Estética / belleza', icon:'💅', category:'Citas y servicios', keywords:['estetica','estética','uñas','unas','pestañas','cabello','corte','tinte','maquillaje','barberia','barbería','belleza'], controls:['CITA','CLIENTE','VENTA','ANTICIPO','DEUDA','GASTO','MATERIAL','EMPLEADO'], products:[], basic:['Citas','Clientes','Servicio realizado','Materiales','Anticipos','Pendientes'], advanced:['Fotos antes/después','Paquetes','Promociones','Comisiones'], examples:['Hice uñas $250','Tengo cita mañana','Compré material $400','Me dieron anticipo $100']},
    {id:'comida', name:'Restaurante / fonda', icon:'🍽️', category:'Comida preparada', keywords:['restaurante','fonda','comida corrida','platillo','platillos','desayuno','desayunos','menu','menú','cocina economica','económica'], controls:['VENTA','GASTO','INVENTARIO','MERMA','EMPLEADO','PEDIDO'], products:[], basic:['Platillos vendidos','Insumos comprados','Merma','Empleados','Corte'], advanced:['Receta por platillo','Costo por porción','Turnos','Proveedores'], examples:['Vendí 20 comidas','Compré pollo $700','Sobró comida','Pagué turno $300']},
    {id:'taqueria', name:'Taquería / antojitos', icon:'🌮', category:'Comida por pieza', keywords:['taco','tacos','taqueria','taquería','quesadilla','quesadillas','pambazo','sopes','antojitos','garnachas'], controls:['VENTA','GASTO','INVENTARIO','MERMA','EMPLEADO'], products:[], basic:['Piezas vendidas','Carne/guisos','Tortillas/masa','Merma','Corte'], advanced:['Costo por taco','Guisos más vendidos','Turnos','Pedidos'], examples:['Vendí 50 tacos','Compré carne $1000','Sobró guiso','Pagué ayudante $250']},
    {id:'tienda', name:'Tienda / abarrotes', icon:'🏪', category:'Inventario', keywords:['tienda','abarrotes','miscelanea','miscelánea','refresco','refrescos','botanas','leche','pan','productos'], controls:['VENTA','INVENTARIO','GASTO','PROVEEDOR','DEUDA','CADUCIDAD'], products:[], basic:['Ventas','Inventario','Proveedores','Fiado','Producto agotado'], advanced:['Inventario mínimo','Caducidad','Compras sugeridas','Fiado por cliente'], examples:['Vendí refrescos $100','Compré mercancía $3000','Le fié a Lupita $80','Se acabó leche']},
    {id:'mecanico', name:'Mecánico / taller', icon:'🚗', category:'Trabajo con refacciones', keywords:['mecanico','mecánico','taller','auto','autos','moto','motos','reparacion','reparación','refaccion','refacción','aceite'], controls:['PEDIDO','CLIENTE','MATERIAL','GASTO','ANTICIPO','DEUDA','EMPLEADO'], products:[], basic:['Vehículo','Trabajo solicitado','Refacciones','Anticipo','Saldo','Entrega'], advanced:['Historial de vehículo','Garantía','Fotos de avance','Proveedor de refacciones'], examples:['Entró auto para afinación','Compré refacción $900','Me dieron anticipo $500','Me deben $1200']},
    {id:'oficio', name:'Plomero / electricista / herrero', icon:'🛠️', category:'Servicio a domicilio', keywords:['plomero','electricista','herrero','reparacion','reparación','instalacion','instalación','mantenimiento','domicilio'], controls:['PEDIDO','CLIENTE','MATERIAL','GASTO','VENTA','DEUDA','EMPLEADO'], products:[], basic:['Cliente','Dirección','Servicio','Materiales','Mano de obra','Pendientes'], advanced:['Cotizaciones','Fotos antes/después','Garantía','Traslados'], examples:['Hice reparación $800','Compré material $250','Me deben $300','Fui a domicilio']},
    {id:'lavanderia', name:'Lavandería', icon:'🧺', category:'Servicio por kilo', keywords:['lavanderia','lavandería','ropa','kilos de ropa','lavado','planchado','tintoreria','tintorería'], controls:['PEDIDO','VENTA','CLIENTE','DEUDA','GASTO','INVENTARIO'], products:[], basic:['Kilos recibidos','Servicio','Cliente','Pago','Entrega','Insumos'], advanced:['Etiquetas por cliente','Paquetes','Entregas','Clientes frecuentes'], examples:['Recibí 5 kilos','Entregué ropa $150','Compré jabón $200','Me deben lavado']},
    {id:'papeleria', name:'Papelería', icon:'🖨️', category:'Servicios por pieza', keywords:['papeleria','papelería','copias','impresiones','utiles','útiles','engargolado','internet','tareas'], controls:['VENTA','INVENTARIO','GASTO','PROVEEDOR','DEUDA'], products:[], basic:['Copias/impresiones','Útiles vendidos','Material comprado','Fiado','Corte'], advanced:['Control de tinta','Temporada escolar','Inventario mínimo','Servicios digitales'], examples:['Hice 50 copias','Imprimí $80','Compré hojas $500','Fié útiles $120']},
    {id:'mascotas', name:'Veterinaria / estética canina', icon:'🐶', category:'Citas y mascotas', keywords:['veterinaria','mascota','mascotas','perro','perros','gato','gatos','estetica canina','estética canina','baño','vacunas'], controls:['CITA','CLIENTE','VENTA','GASTO','DEUDA'], products:[], basic:['Dueño','Mascota','Servicio','Pago','Próxima cita','Insumos'], advanced:['Historial administrativo','Paquetes de baño','Recordatorios','Productos vendidos'], examples:['Baño de perro $250','Tengo cita con Max','Compré shampoo $300','Me deben servicio']},
    {id:'ropa', name:'Ropa / boutique', icon:'👕', category:'Inventario por variantes', keywords:['ropa','boutique','vestido','vestidos','playera','playeras','pantalon','pantalón','calzado','zapatos','accesorios','apartado'], controls:['VENTA','INVENTARIO','GASTO','ANTICIPO','DEUDA','CLIENTE'], products:[], basic:['Prenda','Talla/color','Precio','Apartados','Abonos','Saldo'], advanced:['Variantes','Temporadas','Apartados vencidos','Promociones'], examples:['Vendí vestido $450','Apartaron una blusa','Dio abono $100','Compré mercancía $3000']},
    {id:'digital', name:'Servicios digitales', icon:'💻', category:'Proyecto por entrega', keywords:['desarrollo','diseño','diseno','pagina web','página web','logo','marketing','publicidad','edicion de video','edición de video','redes sociales','programador'], controls:['PEDIDO','CLIENTE','ANTICIPO','DEUDA','VENTA','GASTO'], products:[], basic:['Proyecto','Cliente','Anticipo','Saldo','Fecha de entrega','Horas o gastos'], advanced:['Etapas','Cambios solicitados','Mantenimiento','Suscripciones'], examples:['Nuevo proyecto web','Me dieron anticipo $2000','Me deben al entregar','Registré horas']}
  ];

  const esc = (value='') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const uid = (prefix='cc') => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const todayKey = () => new Date().toISOString().slice(0,10);
  const money = (value=0) => Number(value || 0).toLocaleString('es-MX', {style:'currency', currency:'MXN', maximumFractionDigits:0});

  function normalize(value=''){
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[“”"']/g,'')
      .replace(/\bpays\b/g,'pay')
      .replace(/\s+/g,' ')
      .trim();
  }

  function readJson(key, fallback){ try{ const raw = JSON.parse(localStorage.getItem(key) || 'null'); return raw === null ? fallback : raw; }catch{ return fallback; } }
  function writeJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function controlDef(key){ return BASE_CONTROLS.find(c => c.key === key) || {key, icon:'⭐', label:key, short:'Control', flow:'nota'}; }
  function unique(list){ return [...new Set((list || []).filter(Boolean))]; }

  function productFromAny(item){
    const name = String(item?.name || item?.nombre || item || '').trim();
    return name ? {name, price:Number(item?.price || item?.precio || 0), aliases:Array.isArray(item?.aliases) ? item.aliases : []} : null;
  }

  function normalizeControls(controls){
    const set = new Set(Array.isArray(controls) ? controls : []);
    if(set.has('TODO')) BASE_CONTROLS.forEach(c => set.add(c.key));
    if(!set.size) ['VENTA','GASTO','PEDIDO','DEUDA','CLIENTE'].forEach(key => set.add(key));
    return [...set].filter(key => BASE_CONTROLS.some(c => c.key === key));
  }

  function getConfig(){
    const current = readJson(CONFIG_KEY, null);
    if(current){
      return {
        ...current,
        products:(Array.isArray(current.products) && current.products.length ? current.products : []).map(productFromAny).filter(Boolean),
        controls:normalizeControls(current.controls || []),
        customControls:Array.isArray(current.customControls) ? current.customControls : []
      };
    }
    const legacy = readJson(LEGACY_CONFIG_KEY, null);
    if(legacy && typeof legacy === 'object'){
      const migrated = saveConfig({
        id:legacy.id || uid('negocio'),
        name:legacy.nombreNegocio || 'Mi negocio',
        type:legacy.tipoNegocio || 'Negocio',
        profileId:'personalizado',
        products:Array.isArray(legacy.productosServicios) ? legacy.productosServicios.map(productFromAny).filter(Boolean) : [],
        controls:normalizeControls(legacy.controlesActivos || []),
        customControls:[],
        diagnosisText:'Migrado desde configuración anterior.'
      });
      return migrated;
    }
    return null;
  }

  function saveConfig(config){
    const clean = {
      id:config.id || uid('negocio'),
      name:String(config.name || '').trim() || 'Mi negocio',
      type:String(config.type || '').trim() || 'Negocio',
      profileId:String(config.profileId || 'personalizado'),
      profileName:String(config.profileName || config.type || 'Negocio'),
      profileIcon:String(config.profileIcon || '🧩'),
      products:(Array.isArray(config.products) && config.products.length ? config.products : []).map(productFromAny).filter(Boolean),
      controls:normalizeControls(config.controls),
      customControls:Array.isArray(config.customControls) ? config.customControls : [],
      diagnosisText:String(config.diagnosisText || '').trim(),
      basics:Array.isArray(config.basics) ? config.basics : [],
      advanced:Array.isArray(config.advanced) ? config.advanced : [],
      updatedAt:new Date().toISOString()
    };
    writeJson(CONFIG_KEY, clean);
    return clean;
  }

  function getRecords(){ const records = readJson(RECORDS_KEY, []); return Array.isArray(records) ? records : []; }
  function saveRecord(record){ const records = getRecords(); records.push(record); writeJson(RECORDS_KEY, records); return records; }

  function detectExtraModules(text){
    const t = normalize(text);
    const extras = [];
    const reasons = [];
    const add = (keys, reason) => { keys.forEach(k => extras.push(k)); reasons.push(reason); };
    if(/encargo|encarg|pedido|piden|pidieron|apartar|apartado|entrega|para manana|para mañana|sabado|sábado|viernes/.test(t)) add(['PEDIDO','CLIENTE'], 'Trabajas con pedidos o encargos.');
    if(/anticipo|adelanto|mitad|deposito|depósito|apartar|abono|adelantaron/.test(t)) add(['ANTICIPO','DEUDA'], 'Manejas anticipos o saldos pendientes.');
    if(/me deben|deben|fiado|falta pagar|saldo|resto|por cobrar/.test(t)) add(['DEUDA','CLIENTE'], 'Hay pagos pendientes por cobrar.');
    if(/empleado|empleada|empleados|ayudante|ayuda|sueldo|salario|jornal|mano de obra|turno/.test(t)) add(['EMPLEADO'], 'Tienes pagos a empleados o ayudantes.');
    if(/inventario|existencia|stock|me quedan|material|materiales|herramienta|refaccion|refacción|madera|insumo|ingrediente/.test(t)) add(['INVENTARIO','GASTO'], 'Necesitas controlar compras, materiales o existencias.');
    if(/caduc|vence|vencer|perecedero|medicina|alimento/.test(t)) add(['CADUCIDAD','INVENTARIO'], 'Hay productos con caducidad o rotación.');
    if(/cita|agenda|agendar|paciente|alumno|socio|sesion|sesión/.test(t)) add(['CITA','CLIENTE'], 'Atiendes por citas o sesiones.');
    if(/mensualidad|membresia|membresía|paquete|renovacion|renovación/.test(t)) add(['MEMBRESIA','DEUDA','CLIENTE'], 'Cobras paquetes, mensualidades o membresías.');
    return {extras:unique(extras), reasons:unique(reasons)};
  }

  function analyzeBusiness(text){
    const t = normalize(text);
    let best = null;
    let bestScore = 0;
    PROFILES.forEach(profile => {
      const score = profile.keywords.reduce((sum, word) => sum + (t.includes(normalize(word)) ? 1 : 0), 0);
      if(score > bestScore){ best = profile; bestScore = score; }
    });
    if(!best) best = {id:'personalizado', name:'Negocio personalizado', icon:'🧩', category:'General', controls:['VENTA','GASTO','PEDIDO','DEUDA','CLIENTE'], products:[], basic:['Lo que entra','Lo que sale','Quién me debe','Clientes','Resumen'], advanced:['Inventario','Empleados','Reportes'], examples:['Vendí $300','Compré material $80','Me deben $150']};
    const extras = detectExtraModules(text);
    const controls = unique([...(best.controls || []), ...extras.extras]);
    const nameGuess = guessBusinessName(text, best);
    return {
      id:uid('diag'),
      raw:text,
      profileId:best.id,
      profileName:best.name,
      profileIcon:best.icon || '🧩',
      category:best.category || 'Negocio',
      businessName:nameGuess,
      controls,
      products:(best.products || []).map(productFromAny).filter(Boolean),
      basics:best.basic || [],
      advanced:best.advanced || [],
      examples:best.examples || [],
      reasons:extras.reasons,
      confidence:bestScore ? 'alta' : 'media'
    };
  }

  function guessBusinessName(text, profile){
    const t = String(text || '').trim();
    const m = t.match(/(?:mi negocio se llama|se llama|tengo|soy)\s+([^,.]{3,40})/i);
    if(m && !/un |una |el |la |los |las /.test(normalize(m[1]).slice(0,4))) return m[1].trim();
    if(profile.id === 'postres') return 'Mi negocio de postres';
    if(profile.id === 'tortilleria') return 'Mi tortillería';
    if(profile.id === 'carpintero') return 'Mi carpintería';
    if(profile.id === 'consultorio') return 'Mi consultorio';
    if(profile.id === 'gimnasio') return 'Mi gimnasio';
    return profile.name || 'Mi negocio';
  }

  function quantityWords(){ return {un:1, uno:1, una:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9, diez:10, once:11, doce:12, trece:13, catorce:14, quince:15, veinte:20, treinta:30, media:0.5, medio:0.5}; }
  function quantityPattern(){ return ['[0-9]+(?:[\.,][0-9]+)?', ...Object.keys(quantityWords()).sort((a,b)=>b.length-a.length)].join('|'); }
  function parseQuantity(value=''){ const t = normalize(value); if(/^[0-9]/.test(t)) return Number(t.replace(',','.')) || 0; return Number(quantityWords()[t] || 0); }
  function rxEscape(value=''){ return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function singularPlural(alias=''){ const base = normalize(alias); const set = new Set([base]); if(base.includes('pay')) set.add(base.replace(/\bpay\b/g,'pays')); if(base.endsWith('a') || base.endsWith('o')) set.add(`${base}s`); return [...set].filter(Boolean); }
  function aliasList(product){
    const base = new Set([product.name, ...(product.aliases || [])].map(normalize).filter(Boolean));
    normalize(product.name).split(/\s+/).filter(w => w.length > 3 && !['para','como','leche','crema'].includes(w)).forEach(w => base.add(w));
    const all = new Set(); base.forEach(a => singularPlural(a).forEach(v => all.add(v)));
    return [...all].sort((a,b)=>b.length-a.length);
  }

  function extractProducts(message, config){
    const text = normalize(message).replace(/,/g,' , ').replace(/\by\b/g,' y ').replace(/\s+/g,' ');
    const qty = quantityPattern();
    const items = [];
    const products = (config.products && config.products.length ? config.products : []).map(productFromAny).filter(Boolean);
    products.forEach(product => {
      const pattern = aliasList(product).map(rxEscape).join('|'); if(!pattern) return;
      const hits = [];
      const beforeRx = new RegExp(`(?:^|[\\s,;])(${qty})\\s*(?:piezas?\\s+|unidades?\\s+)?(?:de\\s+|del\\s+|al\\s+|a\\s+)?(?:${pattern})(?:s)?\\b`, 'ig');
      let match;
      while((match = beforeRx.exec(text))){ hits.push({qty:parseQuantity(match[1]) || 1, index:match.index}); if(match.index === beforeRx.lastIndex) beforeRx.lastIndex++; }
      if(!hits.length){
        const afterRx = new RegExp(`(?:^|[\\s,;])(?:${pattern})(?:s)?\\s+(${qty})\\b`, 'ig');
        while((match = afterRx.exec(text))){ hits.push({qty:parseQuantity(match[1]) || 1, index:match.index}); if(match.index === afterRx.lastIndex) afterRx.lastIndex++; }
      }
      if(hits.length) hits.forEach(hit => { const price = Number(product.price || 0); items.push({name:product.name, qty:hit.qty, price, total:hit.qty * price}); });
      else if(new RegExp(`\\b(?:${pattern})(?:s)?\\b`, 'i').test(text)){ const price = Number(product.price || 0); items.push({name:product.name, qty:1, price, total:price}); }
    });
    return items;
  }

  function extractMoney(message){
    const original = String(message || '');
    const explicit = original.match(/\$\s*([0-9]+(?:[\.,][0-9]+)?)/); if(explicit) return Number(explicit[1].replace(',','.')) || 0;
    const text = normalize(original);
    const contextual = text.match(/(?:fueron|fue|total|costo|costaron|pague|pago|gaste|gasto|compre|cobre|cobro|deben|anticipo|adelanto|abono|mensualidad|sueldo|apoyo)\s+([0-9]+(?:[\.,][0-9]+)?)/); if(contextual) return Number(contextual[1].replace(',','.')) || 0;
    const all = text.match(/[0-9]+(?:[\.,][0-9]+)?/g) || []; if(!all.length) return 0;
    return Number(all[all.length - 1].replace(',','.')) || 0;
  }

  function detectIntent(message, config){
    const t = normalize(message);
    const custom = (config.customControls || []).find(control => t.includes(normalize(control.label))); if(custom) return `CUSTOM:${custom.id}`;
    if(/empleado|empleada|ayudante|sueldo|salario|jornal|mano de obra|pague a|le di/.test(t)) return 'EMPLEADO';
    if(/anticipo|adelanto|abono|mitad|deposito|apartar|apartado/.test(t)) return 'ANTICIPO';
    if(/mensualidad|membresia|membresía|renovo|renovó|paquete/.test(t)) return 'MEMBRESIA';
    if(/cita|agendar|agenda|sesion|sesión|consulta/.test(t)) return 'CITA';
    if(/me deben|deben|debe|fiado|falta pagar|saldo|resto|por cobrar/.test(t)) return 'DEUDA';
    if(/pedido|pidieron|me pidieron|encargo|encargaron|quiere|quieren/.test(t)) return 'PEDIDO';
    if(/merma|se echaron a perder|echaron a perder|perdi|perdio|regale|sobro|sobró|desperdicie/.test(t)) return 'MERMA';
    if(/inventario|conte|conteo|me quedan|quedan|existencia|stock/.test(t)) return 'INVENTARIO';
    if(/produje|produccion|hice|prepare|preparamos|elabore/.test(t)) return 'PRODUCCION';
    if(/material|madera|refaccion|refacción|herramienta|insumo/.test(t)) return 'MATERIAL';
    if(/compre|compramos|gaste|gastamos|gasto|pague|pago|renta|luz|gasolina|gas/.test(t)) return 'GASTO';
    if(/vendi|vendimos|venta|ventas|salieron|se vendieron|cobre|cobro|pagada|pagado/.test(t)) return 'VENTA';
    return 'NOTA';
  }

  function productLine(items){ return items.map(i => `${i.qty} ${i.name}`).join(', '); }
  function parseRecord(message, config){
    const type = detectIntent(message, config);
    const def = controlDef(type);
    const items = extractProducts(message, config);
    const amount = extractMoney(message);
    const customId = String(type).startsWith('CUSTOM:') ? String(type).split(':')[1] : '';
    const custom = customId ? (config.customControls || []).find(item => item.id === customId) : null;
    const flow = custom?.flow || def.flow || 'nota';
    let total = 0, response = '', status = 'ok';
    if(['VENTA','MERMA','PEDIDO'].includes(type)) total = items.reduce((sum,item)=>sum + Number(item.total || 0), 0) || amount;
    else if(['GASTO','EMPLEADO','ANTICIPO','DEUDA','MEMBRESIA','MATERIAL'].includes(type) || custom) total = amount;
    if(['VENTA','GASTO','EMPLEADO','ANTICIPO','DEUDA','MERMA','MEMBRESIA','MATERIAL'].includes(type) && !total){ status = 'pending'; response = `Falta monto o cantidad. Ejemplo: ${exampleForIntent(type, config)}.`; }
    else response = `${custom?.label || def.label || 'Nota'} guardado${total ? `: ${money(total)}` : ''}${items.length ? ` (${productLine(items)})` : ''}.`;
    return {id:uid('ccr'), date:new Date().toISOString(), day:todayKey(), type, label:custom?.label || def.label || 'Nota', message:String(message || '').trim(), items, total, status, response, flow};
  }

  function exampleForIntent(type, config){
    const first = (config.products || [])[0]?.name || 'producto';
    return {VENTA:`Vendí 3 ${first}`, GASTO:'Compré material $80', EMPLEADO:'Pagué a María $300', ANTICIPO:'Me dieron anticipo $200', DEUDA:'Me deben $150', MERMA:`Merma 2 ${first}`, MEMBRESIA:'Juan pagó mensualidad $500', MATERIAL:'Compré material $250'}[type] || 'Vendí $300';
  }

  function summary(config){
    const records = getRecords();
    const today = records.filter(r => r.day === todayKey() && r.status !== 'pending');
    const byFlow = flow => today.filter(r => r.flow === flow).reduce((sum,r)=>sum + Number(r.total || 0), 0);
    const sumType = type => today.filter(r => r.type === type).reduce((sum,r)=>sum + Number(r.total || 0), 0);
    const entradas = byFlow('entrada');
    const salidas = byFlow('salida');
    const sold = {};
    today.filter(r => r.type === 'VENTA').forEach(r => (r.items || []).forEach(i => { sold[i.name] = (sold[i.name] || 0) + Number(i.qty || 0); }));
    const top = Object.entries(sold).sort((a,b)=>b[1]-a[1])[0];
    return {records, today, entradas, salidas, utilidad:entradas - salidas, ventas:sumType('VENTA'), gastos:sumType('GASTO'), empleados:sumType('EMPLEADO'), mermas:sumType('MERMA'), anticipos:sumType('ANTICIPO'), deudas:getRecords().filter(r => r.type === 'DEUDA' && r.status !== 'pending').reduce((s,r)=>s+Number(r.total||0),0), top:top ? `${top[0]} (${top[1]})` : 'Sin ventas'};
  }

  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .cc-friendly{min-height:100dvh;padding:calc(env(safe-area-inset-top) + 82px) 14px calc(env(safe-area-inset-bottom) + 104px);background:linear-gradient(180deg,#fff7ed 0%,#f8fafc 34%,#eefdf4 100%);color:#172033;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}.cc-friendly *{box-sizing:border-box}
      .cc-top{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-bottom:12px}.cc-back{min-height:44px;border-radius:999px;padding:0 14px;background:#fff;border:1px solid #e5e7eb;color:#5b2eea;font-weight:950;box-shadow:0 8px 20px rgba(15,23,42,.08)}
      .cc-hero{background:#fff;border:1px solid #e8edf3;border-radius:30px;padding:16px;box-shadow:0 20px 44px rgba(15,23,42,.10);margin-bottom:14px}.cc-kicker{margin:0 0 4px;color:#059669;font-size:12px;font-weight:1000;letter-spacing:.07em;text-transform:uppercase}.cc-hero h1{margin:0;font-size:30px;line-height:1.02;letter-spacing:-.05em}.cc-hero p{margin:8px 0 0;color:#64748b;font-weight:850;line-height:1.32}
      .cc-panel{background:#fff;border:1px solid #e8edf3;border-radius:28px;padding:14px;margin:12px 0;box-shadow:0 16px 34px rgba(15,23,42,.08)}.cc-panel h2{font-size:19px;margin:0 0 8px;letter-spacing:-.03em}.cc-panel p{margin:0 0 10px;color:#64748b;font-weight:800;line-height:1.34}
      .cc-big-btn,.cc-soft-btn{width:100%;min-height:58px;border-radius:22px;border:0;font-weight:1000;font-size:18px;margin-top:10px}.cc-big-btn{background:linear-gradient(135deg,#16a34a,#059669);color:#fff;box-shadow:0 14px 28px rgba(22,163,74,.26)}.cc-soft-btn{background:#f1f5f9;color:#334155;border:1px solid #e2e8f0}.cc-soft-btn.danger{background:#fff1f2;color:#be123c;border-color:#fecdd3}.cc-soft-btn.inline{width:auto;min-height:42px;font-size:14px;padding:0 12px;margin-top:0}
      .cc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.cc-tile{min-height:104px;border-radius:26px;border:1px solid #e2e8f0;background:#f8fafc;padding:12px;text-align:left;color:#172033;box-shadow:0 10px 24px rgba(15,23,42,.06)}.cc-tile.active{background:#dcfce7;border-color:#86efac;box-shadow:0 12px 26px rgba(22,163,74,.14)}.cc-tile .ico{display:block;font-size:33px;line-height:1;margin-bottom:8px}.cc-tile strong{display:block;font-size:17px;line-height:1.08}.cc-tile small{display:block;margin-top:4px;color:#64748b;font-weight:850}
      .cc-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}.cc-stat{border-radius:24px;background:#fff;border:1px solid #e2e8f0;padding:13px;box-shadow:0 10px 24px rgba(15,23,42,.06)}.cc-stat span{display:block;color:#64748b;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.04em}.cc-stat strong{display:block;font-size:21px;margin-top:4px;letter-spacing:-.03em}.cc-stat.good{background:#ecfdf5;border-color:#86efac}.cc-stat.warn{background:#fff7ed;border-color:#fed7aa}.cc-stat.bad{background:#fff1f2;border-color:#fecdd3}
      .cc-input{width:100%;min-height:118px;border-radius:24px;border:2px solid #dbe4ef;background:#fff;padding:14px;font-size:18px;font-weight:800;outline:none;resize:vertical}.cc-field{width:100%;min-height:52px;border:1px solid #cbd5e1;border-radius:18px;padding:12px;font-size:16px;font-weight:850}.cc-input:focus,.cc-field:focus{border-color:#16a34a;box-shadow:0 0 0 4px rgba(22,163,74,.16)}.cc-products{min-height:116px}
      .cc-chip-row{display:flex;gap:8px;overflow:auto;padding:8px 2px 2px;-webkit-overflow-scrolling:touch}.cc-chip{flex:0 0 auto;border-radius:999px;background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;padding:10px 12px;font-weight:950}.cc-list{display:grid;gap:8px}.cc-pill{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:900;color:#334155}.cc-muted{color:#64748b;font-weight:850}.cc-history{display:grid;gap:9px;max-height:420px;overflow:auto;padding-right:2px}.cc-record{border-radius:20px;border:1px solid #e2e8f0;background:#f8fafc;padding:11px}.cc-record b{display:flex;gap:8px;align-items:center;font-size:15px}.cc-record p{margin:6px 0 0;color:#334155}.cc-record small{display:block;margin-top:5px;color:#64748b;font-weight:850}.cc-empty{padding:18px;border-radius:22px;background:#f8fafc;border:1px dashed #cbd5e1;text-align:center;color:#64748b;font-weight:900}
      @media(max-width:380px){.cc-grid,.cc-stats{grid-template-columns:1fr}.cc-hero h1{font-size:26px}.cc-tile{min-height:92px}.cc-tile .ico{font-size:29px}}
    `;
    document.head.appendChild(style);
  }

  function renderDiagnostic(target){
    target.innerHTML = `<section class="cc-friendly" data-cc-friendly="1"><div class="cc-top"><button class="cc-back" data-nav="/">← Inicio</button></div><div class="cc-hero"><p class="cc-kicker">Primero entendemos</p><h1>¿A qué te dedicas?</h1><p>Escríbelo o díctalo como tú lo dirías. Conecta te propone tu tablero.</p></div><div class="cc-panel"><h2>Cuéntame tu negocio</h2><textarea id="ccDiagnosisInput" class="cc-input" placeholder="Ej: Vendo postres por encargo y a veces me pagan la mitad por adelantado."></textarea><button class="cc-big-btn" data-cc-diagnose>Analizar mi negocio</button><div class="cc-chip-row">${['Vendo postres por encargo','Soy carpintero y compro la madera','Tengo un gimnasio y cobro mensualidades','Tengo una tortillería y vendo por kilo','Doy clases y me pagan por adelantado'].map(t => `<button class="cc-chip" data-cc-diag-example="${esc(t)}">${esc(t)}</button>`).join('')}</div></div><div class="cc-panel"><h2>Como libreta</h2><div class="cc-list"><span class="cc-pill">💰 ¿Qué entró?</span><span class="cc-pill">🛒 ¿Qué salió?</span><span class="cc-pill">🧾 ¿Quién debe?</span><span class="cc-pill">📦 ¿Qué tengo?</span><span class="cc-pill">📊 ¿Cuánto me quedó?</span></div></div></section>`;
  }

  function renderProposal(target, diagnosis){
    writeJson(DIAG_KEY, diagnosis);
    const controls = diagnosis.controls.map(controlDef);
    target.innerHTML = `<section class="cc-friendly" data-cc-friendly="1"><div class="cc-top"><button class="cc-back" data-cc-rediagnose>← Cambiar</button></div><div class="cc-hero"><p class="cc-kicker">Propuesta inteligente</p><h1>${esc(diagnosis.profileIcon)} ${esc(diagnosis.profileName)}</h1><p>Conecta analizó tu texto y preparó un tablero básico. Puedes ajustarlo con “Otro”.</p></div><div class="cc-panel"><h2>Tu tablero recomendado</h2><div class="cc-grid">${controls.map(c => `<button class="cc-tile active" data-cc-proposal-toggle="${esc(c.key)}"><span class="ico">${c.icon}</span><strong>${esc(c.label)}</strong><small>${esc(c.short)}</small></button>`).join('')}<button class="cc-tile active" data-cc-add-custom-proposal><span class="ico">➕</span><strong>Otro</strong><small>Agregar lo tuyo</small></button></div></div><div class="cc-panel"><h2>Primero lo básico</h2><div class="cc-list">${(diagnosis.basics || []).slice(0,8).map(v => `<span class="cc-pill">✅ ${esc(v)}</span>`).join('') || '<span class="cc-pill">✅ Entradas y salidas de dinero</span>'}</div></div>${diagnosis.reasons?.length ? `<div class="cc-panel"><h2>Detecté esto</h2><div class="cc-list">${diagnosis.reasons.map(v => `<span class="cc-pill">🧠 ${esc(v)}</span>`).join('')}</div></div>` : ''}<button class="cc-big-btn" data-cc-create-from-proposal>Crear mi tablero</button><button class="cc-soft-btn" data-cc-rediagnose>Volver a escribir</button></section>`;
  }

  function createConfigFromProposal(){
    const diagnosis = readJson(DIAG_KEY, null);
    if(!diagnosis) return renderCurrent(true);
    const controls = [...document.querySelectorAll('[data-cc-proposal-toggle].active')].map(btn => btn.getAttribute('data-cc-proposal-toggle')).filter(Boolean);
    saveConfig({name:diagnosis.businessName, type:diagnosis.category, profileId:diagnosis.profileId, profileName:diagnosis.profileName, profileIcon:diagnosis.profileIcon, products:diagnosis.products, controls, customControls:[], diagnosisText:diagnosis.raw, basics:diagnosis.basics, advanced:diagnosis.advanced});
    renderCurrent(true);
  }

  function renderDashboard(target, config){
    const stats = summary(config);
    const controls = BASE_CONTROLS.filter(c => config.controls.includes(c.key));
    const custom = config.customControls || [];
    const examples = (PROFILES.find(p => p.id === config.profileId)?.examples || ['Vendí $300','Compré material $80','Me deben $150']).slice(0,6);
    target.innerHTML = `<section class="cc-friendly" data-cc-friendly="1"><div class="cc-top"><button class="cc-back" data-nav="/">← Inicio</button><button class="cc-back" data-cc-rediagnose>🧠 Diagnóstico</button></div><div class="cc-hero"><p class="cc-kicker">${esc(config.profileName || config.type || 'Negocio')}</p><h1>${esc(config.profileIcon || '🧩')} ${esc(config.name || 'Mi negocio')}</h1><p>Háblale a tu negocio. Yo lo acomodo en tu libreta.</p></div><div class="cc-stats"><div class="cc-stat good"><span>Entró</span><strong>${money(stats.entradas)}</strong></div><div class="cc-stat warn"><span>Salió</span><strong>${money(stats.salidas)}</strong></div><div class="cc-stat ${stats.utilidad >= 0 ? 'good' : 'bad'}"><span>Me quedó</span><strong>${money(stats.utilidad)}</strong></div><div class="cc-stat"><span>Me deben</span><strong>${money(stats.deudas)}</strong></div><div class="cc-stat"><span>Anticipos</span><strong>${money(stats.anticipos)}</strong></div><div class="cc-stat"><span>Más vendido</span><strong>${esc(stats.top)}</strong></div></div><div class="cc-panel"><h2>Botones rápidos</h2><div class="cc-grid">${controls.map(c => `<button class="cc-tile" data-cc-prefill="${c.key}"><span class="ico">${c.icon}</span><strong>${esc(c.label)}</strong><small>${esc(c.short)}</small></button>`).join('')}${custom.map(c => `<button class="cc-tile" data-cc-prefill-custom="${esc(c.id)}"><span class="ico">${esc(c.icon || '⭐')}</span><strong>${esc(c.label)}</strong><small>Mi botón</small></button>`).join('')}<button class="cc-tile active" data-cc-add-custom><span class="ico">➕</span><strong>Otro</strong><small>Agregar</small></button></div></div><div class="cc-panel"><h2>Escribir o dictar</h2><textarea class="cc-input" id="ccMessage" placeholder="Ej: Vendí 3 pays de limón"></textarea><button class="cc-big-btn" data-cc-process>Guardar</button><div class="cc-chip-row">${examples.map(e => `<button class="cc-chip" data-cc-example="${esc(e)}">${esc(e)}</button>`).join('')}</div></div><div class="cc-panel"><h2>Hoy</h2><div class="cc-history">${stats.records.slice().reverse().slice(0,24).map(recordMarkup).join('') || '<div class="cc-empty">Aún no hay movimientos.</div>'}</div><button class="cc-soft-btn danger" data-cc-clear>Limpiar prueba</button></div></section>`;
  }

  function recordMarkup(record){
    const time = new Date(record.date).toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});
    const icon = controlDef(record.type).icon || (String(record.type).startsWith('CUSTOM:') ? '⭐' : '📝');
    return `<div class="cc-record"><b><span>${icon}</span>${esc(record.label)} · ${time}</b><p>${esc(record.message)}</p><small>${esc(record.response || '')}</small></div>`;
  }

  function activeTarget(){ return document.querySelector('.control-page, .cc-friendly'); }
  let rendering = false;
  function renderCurrent(forceDashboard=false){
    if(rendering) return;
    const target = activeTarget(); if(!target) return;
    rendering = true; injectStyles();
    if(target.matches('.cc-friendly')){ const wrapper = document.createElement('section'); wrapper.className = 'control-page'; target.replaceWith(wrapper); rendering = false; return renderCurrent(forceDashboard); }
    const config = getConfig();
    if(config || forceDashboard) renderDashboard(target, config || getConfig()); else renderDiagnostic(target);
    rendering = false;
  }

  function addCustomControl(proposal=false){
    const base = getConfig() || readJson(DIAG_KEY, null) || {controls:['VENTA','GASTO'], customControls:[]};
    const label = prompt('¿Cómo quieres llamar tu botón? Ej: Renta, Entregas, Gasolina, Herramientas'); if(!label || !label.trim()) return;
    const flowRaw = prompt('¿Es dinero que sale, dinero que entra o solo nota? Escribe: sale, entra o nota', 'sale') || 'nota';
    const flow = /entra|entrada|ingreso/i.test(flowRaw) ? 'entrada' : (/sale|salida|gasto|egreso/i.test(flowRaw) ? 'salida' : 'nota');
    const icons = {entrada:'💵', salida:'💸', nota:'⭐'};
    if(proposal){
      const diag = readJson(DIAG_KEY, base); diag.customControls = [...(diag.customControls || []), {id:uid('custom'), label:label.trim(), flow, icon:icons[flow]}]; writeJson(DIAG_KEY, diag);
    }else{
      const config = getConfig(); config.customControls = [...(config.customControls || []), {id:uid('custom'), label:label.trim(), flow, icon:icons[flow]}]; saveConfig(config); renderCurrent(true);
    }
  }

  function prefill(type){ const input = document.getElementById('ccMessage'); if(!input) return; const map = {VENTA:'Vendí ', GASTO:'Compré ', INVENTARIO:'Inventario ', PRODUCCION:'Hice ', MERMA:'Merma ', PEDIDO:'Pedido: ', ANTICIPO:'Me dieron anticipo ', DEUDA:'Me deben ', EMPLEADO:'Pagué a ', CITA:'Cita con ', MEMBRESIA:'Pagó mensualidad ', MATERIAL:'Compré material '}; input.value = map[type] || ''; input.focus(); }
  function processMessage(){ const config = getConfig(); const input = document.getElementById('ccMessage'); const message = String(input?.value || '').trim(); if(!config || !message) return; saveRecord(parseRecord(message, config)); if(input) input.value = ''; renderCurrent(true); }

  window.addEventListener('click', event => {
    const btn = event.target.closest('[data-cc-diagnose],[data-cc-diag-example],[data-cc-rediagnose],[data-cc-proposal-toggle],[data-cc-create-from-proposal],[data-cc-add-custom-proposal],[data-cc-add-custom],[data-cc-prefill],[data-cc-prefill-custom],[data-cc-process],[data-cc-example],[data-cc-clear]');
    if(!btn) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    if(btn.matches('[data-cc-diag-example]')){ const input=document.getElementById('ccDiagnosisInput'); if(input){ input.value=btn.getAttribute('data-cc-diag-example') || ''; input.focus(); } return; }
    if(btn.matches('[data-cc-diagnose]')){ const text=String(document.getElementById('ccDiagnosisInput')?.value || '').trim(); if(!text) return alert('Escribe o dicta a qué te dedicas.'); return renderProposal(activeTarget(), analyzeBusiness(text)); }
    if(btn.matches('[data-cc-rediagnose]')){ localStorage.removeItem(CONFIG_KEY); localStorage.removeItem(DIAG_KEY); return renderDiagnostic(activeTarget()); }
    if(btn.matches('[data-cc-proposal-toggle]')){ btn.classList.toggle('active'); return; }
    if(btn.matches('[data-cc-create-from-proposal]')) return createConfigFromProposal();
    if(btn.matches('[data-cc-add-custom-proposal]')) return addCustomControl(true);
    if(btn.matches('[data-cc-add-custom]')) return addCustomControl(false);
    if(btn.matches('[data-cc-prefill]')) return prefill(btn.getAttribute('data-cc-prefill'));
    if(btn.matches('[data-cc-prefill-custom]')){ const config=getConfig(); const custom=(config?.customControls || []).find(c => c.id === btn.getAttribute('data-cc-prefill-custom')); const input=document.getElementById('ccMessage'); if(input && custom){ input.value=`${custom.label} `; input.focus(); } return; }
    if(btn.matches('[data-cc-process]')) return processMessage();
    if(btn.matches('[data-cc-example]')){ const input=document.getElementById('ccMessage'); if(input){ input.value=btn.getAttribute('data-cc-example') || ''; input.focus(); } return; }
    if(btn.matches('[data-cc-clear]')){ if(confirm('¿Borrar registros de prueba de Conecta Control?')){ localStorage.removeItem(RECORDS_KEY); renderCurrent(true); } }
  }, true);

  const observer = new MutationObserver(() => { const target = document.querySelector('.control-page'); if(target && !target.querySelector('[data-cc-friendly="1"]')) setTimeout(renderCurrent, 0); });
  function start(){ injectStyles(); observer.observe(document.body, {childList:true, subtree:true}); renderCurrent(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
