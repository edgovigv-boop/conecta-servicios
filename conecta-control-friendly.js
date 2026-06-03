/* Conecta Control Friendly v1
   Capa aislada para probar Conecta Control sin tocar app.js.
   - Reemplaza visualmente la ruta /control cuando existe .control-page.
   - Guarda datos en localStorage propio.
   - No toca Supabase, publicaciones, geolocalización ni mensajes.
*/
(() => {
  'use strict';

  const CONFIG_KEY = 'cc_friendly_config_v1';
  const RECORDS_KEY = 'cc_friendly_records_v1';
  const LEGACY_CONFIG_KEY = 'conecta_control_business_config';
  const STYLE_ID = 'cc-friendly-styles';

  const BASE_CONTROLS = [
    {key:'VENTA', icon:'💰', label:'Ventas', short:'Vendí'},
    {key:'GASTO', icon:'🛒', label:'Compras', short:'Compré'},
    {key:'INVENTARIO', icon:'📦', label:'Inventario', short:'Tengo'},
    {key:'PRODUCCION', icon:'🍰', label:'Producción', short:'Hice'},
    {key:'MERMA', icon:'⚠️', label:'Mermas', short:'Perdí'},
    {key:'PEDIDO', icon:'📋', label:'Pedidos', short:'Me pidieron'},
    {key:'COBRO', icon:'💵', label:'Cobros', short:'Cobré'},
    {key:'DEUDA', icon:'🧾', label:'Fiado', short:'Me deben'},
    {key:'EMPLEADO', icon:'👥', label:'Empleados', short:'Pagué ayuda'}
  ];

  const DEMO_PRODUCTS = [
    {name:'Pay de limón', price:25, aliases:['limón','limon','pay limon','pay de limon','pay de limón']},
    {name:'Arroz con leche', price:25, aliases:['arroz','arroz con leche']},
    {name:'Pay de queso', price:25, aliases:['queso','pay queso','pay de queso']},
    {name:'Fresas con crema', price:35, aliases:['fresas','fresa','fresas con crema','fresa con crema']}
  ];

  const esc = (value='') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const uid = (prefix='cc') => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const todayKey = () => new Date().toISOString().slice(0,10);
  const money = (value=0) => Number(value || 0).toLocaleString('es-MX', {style:'currency', currency:'MXN', maximumFractionDigits:0});
  const normalize = (value='') => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[“”"']/g,'').replace(/\s+/g,' ').trim();

  function readJson(key, fallback){
    try{
      const raw = JSON.parse(localStorage.getItem(key) || 'null');
      return raw === null ? fallback : raw;
    }catch{
      return fallback;
    }
  }

  function writeJson(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getConfig(){
    const current = readJson(CONFIG_KEY, null);
    if(current) return current;

    const legacy = readJson(LEGACY_CONFIG_KEY, null);
    if(legacy && typeof legacy === 'object'){
      const migrated = {
        id: legacy.id || uid('negocio'),
        name: legacy.nombreNegocio || 'Mi negocio',
        type: legacy.tipoNegocio || 'Negocio',
        products: Array.isArray(legacy.productosServicios) && legacy.productosServicios.length
          ? legacy.productosServicios.map(item => ({name:String(item.nombre || item.name || item || '').trim(), price:Number(item.precio || item.price || 0), aliases:[]})).filter(item => item.name)
          : DEMO_PRODUCTS,
        controls: normalizeControls(legacy.controlesActivos || []),
        customControls: [],
        migrated:true,
        createdAt:new Date().toISOString()
      };
      writeJson(CONFIG_KEY, migrated);
      return migrated;
    }

    return null;
  }

  function normalizeControls(controls){
    const set = new Set(Array.isArray(controls) ? controls : []);
    if(set.has('TODO')) BASE_CONTROLS.forEach(c => set.add(c.key));
    if(!set.size) ['VENTA','GASTO','INVENTARIO','MERMA','PEDIDO','COBRO','DEUDA','EMPLEADO'].forEach(key => set.add(key));
    return [...set].filter(key => BASE_CONTROLS.some(c => c.key === key));
  }

  function saveConfig(config){
    const clean = {
      id: config.id || uid('negocio'),
      name: String(config.name || '').trim() || 'Mi negocio',
      type: String(config.type || '').trim() || 'Negocio',
      products: Array.isArray(config.products) && config.products.length ? config.products : DEMO_PRODUCTS,
      controls: normalizeControls(config.controls),
      customControls: Array.isArray(config.customControls) ? config.customControls : [],
      updatedAt:new Date().toISOString()
    };
    writeJson(CONFIG_KEY, clean);
    return clean;
  }

  function getRecords(){
    const records = readJson(RECORDS_KEY, []);
    return Array.isArray(records) ? records : [];
  }

  function saveRecord(record){
    const records = getRecords();
    records.push(record);
    writeJson(RECORDS_KEY, records);
    return records;
  }

  function quantityWords(){
    return {un:1, uno:1, una:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9, diez:10, once:11, doce:12, trece:13, catorce:14, quince:15, veinte:20, treinta:30, media:0.5, medio:0.5};
  }

  function parseQuantity(value){
    const text = normalize(value);
    if(/^[0-9]/.test(text)) return Number(text.replace(',','.')) || 0;
    return Number(quantityWords()[text] || 0);
  }

  function quantityPattern(){
    return ['[0-9]+(?:[\.,][0-9]+)?', ...Object.keys(quantityWords())].join('|');
  }

  function productAliases(product){
    const aliases = new Set([product.name, ...(product.aliases || [])].map(normalize).filter(Boolean));
    normalize(product.name).split(/\s+/).filter(w => w.length > 3).forEach(w => aliases.add(w));
    return [...aliases].sort((a,b)=>b.length-a.length).map(alias => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  }

  function extractProducts(message, config){
    const text = normalize(message).replace(/,/g,' , ').replace(/\s+/g,' ');
    const qty = quantityPattern();
    const items = [];
    (config.products || DEMO_PRODUCTS).forEach(product => {
      const pattern = productAliases(product).join('|');
      if(!pattern) return;
      const beforeRx = new RegExp(`(?:^|[\\s,;])(${qty})\\s*(?:de\\s+|del\\s+|al\\s+|a\\s+)?(?:${pattern})(?:s)?\\b`, 'ig');
      let match;
      while((match = beforeRx.exec(text))){
        const cantidad = parseQuantity(match[1]) || 1;
        const price = Number(product.price || 0);
        items.push({name:product.name, qty:cantidad, price, total:cantidad * price});
      }
      if(!items.some(item => item.name === product.name) && new RegExp(`\\b(?:${pattern})(?:s)?\\b`, 'i').test(text)){
        const price = Number(product.price || 0);
        items.push({name:product.name, qty:1, price, total:price});
      }
    });
    return items;
  }

  function extractMoney(message){
    const text = String(message || '');
    const explicit = text.match(/\$\s*([0-9]+(?:[\.,][0-9]+)?)/);
    if(explicit) return Number(explicit[1].replace(',','.')) || 0;
    const normalized = normalize(text);
    const contextual = normalized.match(/(?:fueron|fue|total|costo|costaron|pague|pago|gaste|gasto|compre|cobre|cobro|deben|sueldo|apoyo)\s+([0-9]+(?:[\.,][0-9]+)?)/);
    if(contextual) return Number(contextual[1].replace(',','.')) || 0;
    const all = normalized.match(/[0-9]+(?:[\.,][0-9]+)?/g) || [];
    if(!all.length) return 0;
    return Number(all[all.length - 1].replace(',','.')) || 0;
  }

  function detectIntent(message, config){
    const text = normalize(message);
    if(!text) return 'NOTA';

    const custom = (config.customControls || []).find(control => text.includes(normalize(control.label)));
    if(custom) return `CUSTOM:${custom.id}`;

    if(/\b(empleado|empleada|empleados|ayudante|ayuda|sueldo|salario|jornal|nomina|nomina|mano de obra)\b/.test(text)) return 'EMPLEADO';
    if(/\b(pague|pago|le di|di)\b.*\b(a|para)\b/.test(text) && !/\b(leche|azucar|vasos|bolsas|gas|luz|agua|renta|insumo|ingrediente|material)\b/.test(text)) return 'EMPLEADO';
    if(/\b(cobre|cobro|cobrado|me pagaron|pagaron)\b/.test(text)) return 'COBRO';
    if(/\b(me deben|deben|debe|fiado|por cobrar)\b/.test(text)) return 'DEUDA';
    if(/\b(pedido|pidieron|me pidieron|encargo|encargaron|quiere|quieren)\b/.test(text)) return 'PEDIDO';
    if(/\b(merma|mermas|se echaron a perder|echaron a perder|perdi|perdio|perdimos|regale|regalo|desperdicie)\b/.test(text)) return 'MERMA';
    if(/\b(inventario|conte|conteo|contado|me quedan|quedan|tengo en existencia|existencia)\b/.test(text)) return 'INVENTARIO';
    if(/\b(produje|produccion|hice|prepare|preparamos|elabore)\b/.test(text)) return 'PRODUCCION';
    if(/\b(compre|compramos|gaste|gastamos|gasto|pague|pago|inverti|inversion)\b/.test(text)) return 'GASTO';
    if(/\b(vendi|vendimos|venta|ventas|vender|salieron|se vendieron)\b/.test(text)) return 'VENTA';
    return 'NOTA';
  }

  function recordLabel(type, config){
    if(String(type).startsWith('CUSTOM:')){
      const id = String(type).split(':')[1];
      const c = (config.customControls || []).find(item => item.id === id);
      return c?.label || 'Otro';
    }
    return BASE_CONTROLS.find(c => c.key === type)?.label || 'Nota';
  }

  function parseRecord(message, config){
    const type = detectIntent(message, config);
    const items = extractProducts(message, config);
    const amount = extractMoney(message);
    const customId = String(type).startsWith('CUSTOM:') ? String(type).split(':')[1] : '';
    const custom = customId ? (config.customControls || []).find(item => item.id === customId) : null;

    let total = 0;
    let mermaValue = 0;
    let text = '';
    let status = 'ok';

    if(type === 'VENTA'){
      total = items.reduce((sum,item)=>sum + item.total, 0) || amount;
      if(!total){ status = 'pending'; text = 'Falta producto o monto.'; }
      else text = `Venta guardada: ${money(total)}`;
    }else if(type === 'GASTO'){
      total = amount;
      if(!total){ status = 'pending'; text = 'Falta cuánto gastaste.'; }
      else text = `Compra/gasto guardado: ${money(total)}`;
    }else if(type === 'EMPLEADO'){
      total = amount;
      if(!total){ status = 'pending'; text = 'Falta cuánto pagaste.'; }
      else text = `Pago a empleado guardado: ${money(total)}`;
    }else if(type === 'MERMA'){
      mermaValue = items.reduce((sum,item)=>sum + item.total, 0) || amount;
      total = mermaValue;
      if(!total){ status = 'pending'; text = 'Falta producto o valor de la merma.'; }
      else text = `Merma guardada: ${money(total)}`;
    }else if(type === 'PEDIDO'){
      total = items.reduce((sum,item)=>sum + item.total, 0) || amount;
      text = `Pedido guardado${total ? `: ${money(total)}` : '.'}`;
    }else if(type === 'COBRO'){
      total = amount;
      if(!total){ status = 'pending'; text = 'Falta cuánto cobraste.'; }
      else text = `Cobro guardado: ${money(total)}`;
    }else if(type === 'DEUDA'){
      total = amount;
      if(!total){ status = 'pending'; text = 'Falta cuánto te deben.'; }
      else text = `Fiado/deuda guardado: ${money(total)}`;
    }else if(type === 'INVENTARIO' || type === 'PRODUCCION'){
      text = `${recordLabel(type, config)} guardado.`;
    }else if(custom){
      total = amount;
      text = `${custom.label} guardado${total ? `: ${money(total)}` : '.'}`;
    }else{
      text = 'Nota guardada.';
    }

    return {
      id:uid('ccr'),
      date:new Date().toISOString(),
      day:todayKey(),
      type,
      label:recordLabel(type, config),
      message:String(message || '').trim(),
      items,
      total,
      status,
      response:text,
      customFlow: custom?.flow || ''
    };
  }

  function summary(config){
    const records = getRecords();
    const today = records.filter(r => r.day === todayKey() && r.status !== 'pending');
    const sumType = type => today.filter(r => r.type === type).reduce((sum,r)=>sum + Number(r.total || 0), 0);
    const ventas = sumType('VENTA');
    const compras = sumType('GASTO');
    const empleados = sumType('EMPLEADO');
    const mermas = sumType('MERMA');
    const cobros = sumType('COBRO');
    const deudas = records.filter(r => r.type === 'DEUDA' && r.status !== 'pending').reduce((sum,r)=>sum + Number(r.total || 0), 0);
    const customIn = today.filter(r => String(r.type).startsWith('CUSTOM:') && r.customFlow === 'entrada').reduce((sum,r)=>sum + Number(r.total || 0), 0);
    const customOut = today.filter(r => String(r.type).startsWith('CUSTOM:') && r.customFlow === 'salida').reduce((sum,r)=>sum + Number(r.total || 0), 0);
    const sold = {};
    today.filter(r => r.type === 'VENTA').forEach(r => (r.items || []).forEach(item => { sold[item.name] = (sold[item.name] || 0) + Number(item.qty || 0); }));
    const top = Object.entries(sold).sort((a,b)=>b[1]-a[1])[0];
    return {
      records,
      today,
      ventas,
      compras,
      empleados,
      mermas,
      cobros,
      deudas,
      customIn,
      customOut,
      utilidad: ventas + customIn - compras - empleados - mermas - customOut,
      vendidos:Object.values(sold).reduce((a,b)=>a+b,0),
      top: top ? `${top[0]} (${top[1]})` : 'Sin ventas'
    };
  }

  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .cc-friendly{min-height:100dvh;padding:calc(env(safe-area-inset-top) + 82px) 14px calc(env(safe-area-inset-bottom) + 104px);background:linear-gradient(180deg,#fff7ed 0%,#f8fafc 34%,#eefdf4 100%);color:#172033;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;}
      .cc-friendly *{box-sizing:border-box;}
      .cc-top{display:flex;gap:12px;align-items:center;justify-content:space-between;margin-bottom:12px;}
      .cc-back{min-height:44px;border-radius:999px;padding:0 14px;background:#fff;border:1px solid #e5e7eb;color:#5b2eea;font-weight:950;box-shadow:0 8px 20px rgba(15,23,42,.08);}
      .cc-hero{background:#ffffff;border:1px solid #e8edf3;border-radius:30px;padding:16px;box-shadow:0 20px 44px rgba(15,23,42,.10);margin-bottom:14px;}
      .cc-kicker{margin:0 0 4px;color:#059669;font-size:12px;font-weight:1000;letter-spacing:.07em;text-transform:uppercase;}
      .cc-hero h1{margin:0;font-size:30px;line-height:1.02;letter-spacing:-.05em;}
      .cc-hero p{margin:8px 0 0;color:#64748b;font-weight:850;line-height:1.32;}
      .cc-panel{background:#fff;border:1px solid #e8edf3;border-radius:28px;padding:14px;margin:12px 0;box-shadow:0 16px 34px rgba(15,23,42,.08);}
      .cc-panel h2{font-size:19px;margin:0 0 8px;letter-spacing:-.03em;}
      .cc-panel p{margin:0 0 10px;color:#64748b;font-weight:800;line-height:1.34;}
      .cc-big-btn,.cc-soft-btn{width:100%;min-height:58px;border-radius:22px;border:0;font-weight:1000;font-size:18px;margin-top:10px;}
      .cc-big-btn{background:linear-gradient(135deg,#16a34a,#059669);color:#fff;box-shadow:0 14px 28px rgba(22,163,74,.26);}
      .cc-soft-btn{background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;}
      .cc-soft-btn.danger{background:#fff1f2;color:#be123c;border-color:#fecdd3;}
      .cc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
      .cc-tile{min-height:104px;border-radius:26px;border:1px solid #e2e8f0;background:#f8fafc;padding:12px;text-align:left;color:#172033;box-shadow:0 10px 24px rgba(15,23,42,.06);}
      .cc-tile.active{background:#dcfce7;border-color:#86efac;box-shadow:0 12px 26px rgba(22,163,74,.14);}
      .cc-tile .ico{display:block;font-size:33px;line-height:1;margin-bottom:8px;}
      .cc-tile strong{display:block;font-size:17px;line-height:1.08;}
      .cc-tile small{display:block;margin-top:4px;color:#64748b;font-weight:850;}
      .cc-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0;}
      .cc-stat{border-radius:24px;background:#fff;border:1px solid #e2e8f0;padding:13px;box-shadow:0 10px 24px rgba(15,23,42,.06);}
      .cc-stat span{display:block;color:#64748b;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.04em;}
      .cc-stat strong{display:block;font-size:21px;margin-top:4px;letter-spacing:-.03em;}
      .cc-stat.good{background:#ecfdf5;border-color:#86efac;}.cc-stat.warn{background:#fff7ed;border-color:#fed7aa;}.cc-stat.bad{background:#fff1f2;border-color:#fecdd3;}
      .cc-input{width:100%;min-height:112px;border-radius:24px;border:2px solid #dbe4ef;background:#fff;padding:14px;font-size:18px;font-weight:800;outline:none;resize:vertical;}
      .cc-input:focus{border-color:#16a34a;box-shadow:0 0 0 4px rgba(22,163,74,.16);}
      .cc-chip-row{display:flex;gap:8px;overflow:auto;padding:8px 2px 2px;-webkit-overflow-scrolling:touch;}
      .cc-chip{flex:0 0 auto;border-radius:999px;background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;padding:10px 12px;font-weight:950;}
      .cc-history{display:grid;gap:9px;max-height:420px;overflow:auto;padding-right:2px;}
      .cc-record{border-radius:20px;border:1px solid #e2e8f0;background:#f8fafc;padding:11px;}
      .cc-record b{display:flex;gap:8px;align-items:center;font-size:15px;}.cc-record p{margin:6px 0 0;color:#334155;}.cc-record small{display:block;margin-top:5px;color:#64748b;font-weight:850;}
      .cc-form-grid{display:grid;gap:10px;}.cc-field{width:100%;min-height:52px;border:1px solid #cbd5e1;border-radius:18px;padding:12px;font-size:16px;font-weight:850;}
      .cc-products{min-height:116px;}.cc-empty{padding:18px;border-radius:22px;background:#f8fafc;border:1px dashed #cbd5e1;text-align:center;color:#64748b;font-weight:900;}
      @media(max-width:380px){.cc-grid,.cc-stats{grid-template-columns:1fr}.cc-hero h1{font-size:26px}.cc-tile{min-height:92px}.cc-tile .ico{font-size:29px}}
    `;
    document.head.appendChild(style);
  }

  function renderWelcome(target){
    target.innerHTML = `<section class="cc-friendly" data-cc-friendly="1">
      <div class="cc-top"><button class="cc-back" data-nav="/">← Inicio</button></div>
      <div class="cc-hero"><p class="cc-kicker">Libreta inteligente</p><h1>Conecta Control</h1><p>Tu negocio claro con botones grandes, colores y pocas palabras.</p></div>
      <div class="cc-panel"><h2>¿Qué hacemos?</h2><div class="cc-grid">
        <button class="cc-tile active" data-cc-demo><span class="ico">🍰</span><strong>Postres Fer</strong><small>Probar demo</small></button>
        <button class="cc-tile" data-cc-setup><span class="ico">🧩</span><strong>Mi negocio</strong><small>Crear tablero</small></button>
      </div></div>
      <div class="cc-panel"><h2>Botones posibles</h2><div class="cc-grid">
        ${BASE_CONTROLS.slice(0,8).map(c => `<div class="cc-tile"><span class="ico">${c.icon}</span><strong>${esc(c.label)}</strong><small>${esc(c.short)}</small></div>`).join('')}
        <div class="cc-tile"><span class="ico">➕</span><strong>Otro</strong><small>Agregar lo tuyo</small></div>
      </div></div>
    </section>`;
  }

  function parseProductsText(text){
    const items = String(text || '').split(/\n|,|;/).map(v => v.trim()).filter(Boolean).map(line => {
      const match = line.match(/^(.+?)\s+\$?\s*([0-9]+(?:[\.,][0-9]+)?)\s*$/);
      return {name:(match ? match[1] : line).trim(), price:match ? Number(match[2].replace(',','.')) : 0, aliases:[]};
    });
    return items.length ? items : DEMO_PRODUCTS;
  }

  function renderSetup(target){
    const draft = getConfig() || {name:'', type:'', products:DEMO_PRODUCTS, controls:['VENTA','GASTO','INVENTARIO','MERMA','PEDIDO','COBRO','DEUDA','EMPLEADO'], customControls:[]};
    const productText = (draft.products || DEMO_PRODUCTS).map(p => `${p.name}${p.price ? ` ${p.price}` : ''}`).join('\n');
    target.innerHTML = `<section class="cc-friendly" data-cc-friendly="1" data-cc-mode="setup">
      <div class="cc-top"><button class="cc-back" data-cc-cancel>← Salir</button></div>
      <div class="cc-hero"><p class="cc-kicker">Configurar</p><h1>Mi tablero</h1><p>Elige solo lo que usas. Después puedes agregar más.</p></div>
      <div class="cc-panel cc-form-grid">
        <input class="cc-field" id="ccName" placeholder="Nombre del negocio" value="${esc(draft.name || '')}">
        <input class="cc-field" id="ccType" placeholder="Tipo: postres, comida, servicios..." value="${esc(draft.type || '')}">
        <textarea class="cc-field cc-products" id="ccProducts" placeholder="Productos y precios&#10;Pay de limón 25&#10;Fresas con crema 35">${esc(productText)}</textarea>
      </div>
      <div class="cc-panel"><h2>Mis botones</h2><div class="cc-grid">
        ${BASE_CONTROLS.map(c => `<button class="cc-tile ${draft.controls?.includes(c.key) ? 'active' : ''}" data-cc-toggle="${c.key}"><span class="ico">${c.icon}</span><strong>${esc(c.label)}</strong><small>${esc(c.short)}</small></button>`).join('')}
        <button class="cc-tile active" data-cc-add-custom><span class="ico">➕</span><strong>Otro</strong><small>Crear botón</small></button>
      </div></div>
      <button class="cc-big-btn" data-cc-save-setup>Guardar tablero</button>
    </section>`;
  }

  function createDemo(){
    saveConfig({
      id:'postres_fer',
      name:'Postres Fer',
      type:'Postres',
      products:DEMO_PRODUCTS,
      controls:['VENTA','GASTO','INVENTARIO','PRODUCCION','MERMA','PEDIDO','COBRO','DEUDA','EMPLEADO'],
      customControls:[{id:'entregas', icon:'🛵', label:'Entregas', flow:'salida'}]
    });
    renderCurrent();
  }

  function renderDashboard(target, config){
    const stats = summary(config);
    const controls = BASE_CONTROLS.filter(c => config.controls.includes(c.key));
    const custom = config.customControls || [];
    const examples = ['Vendí 3 pay de limón','Compré leche $80','Pagué a María $300','Merma 2 arroz','Me deben $150 de Ana'];
    target.innerHTML = `<section class="cc-friendly" data-cc-friendly="1">
      <div class="cc-top"><button class="cc-back" data-nav="/">← Inicio</button><button class="cc-back" data-cc-setup>⚙️ Editar</button></div>
      <div class="cc-hero"><p class="cc-kicker">${esc(config.type || 'Negocio')}</p><h1>${esc(config.name || 'Mi negocio')}</h1><p>¿Qué pasó hoy?</p></div>
      <div class="cc-stats">
        <div class="cc-stat good"><span>Ventas</span><strong>${money(stats.ventas)}</strong></div>
        <div class="cc-stat warn"><span>Compras</span><strong>${money(stats.compras)}</strong></div>
        <div class="cc-stat warn"><span>Empleados</span><strong>${money(stats.empleados)}</strong></div>
        <div class="cc-stat bad"><span>Mermas</span><strong>${money(stats.mermas)}</strong></div>
        <div class="cc-stat ${stats.utilidad >= 0 ? 'good' : 'bad'}"><span>Me quedó</span><strong>${money(stats.utilidad)}</strong></div>
        <div class="cc-stat"><span>Más vendido</span><strong>${esc(stats.top)}</strong></div>
      </div>
      <div class="cc-panel"><h2>Botones rápidos</h2><div class="cc-grid">
        ${controls.map(c => `<button class="cc-tile" data-cc-prefill="${c.key}"><span class="ico">${c.icon}</span><strong>${esc(c.label)}</strong><small>${esc(c.short)}</small></button>`).join('')}
        ${custom.map(c => `<button class="cc-tile" data-cc-prefill-custom="${esc(c.id)}"><span class="ico">${esc(c.icon || '⭐')}</span><strong>${esc(c.label)}</strong><small>Mi botón</small></button>`).join('')}
        <button class="cc-tile active" data-cc-add-custom><span class="ico">➕</span><strong>Otro</strong><small>Agregar</small></button>
      </div></div>
      <div class="cc-panel"><h2>Escribir</h2><textarea class="cc-input" id="ccMessage" placeholder="Ej: Vendí 3 pay de limón"></textarea><button class="cc-big-btn" data-cc-process>Guardar</button><div class="cc-chip-row">${examples.map(e => `<button class="cc-chip" data-cc-example="${esc(e)}">${esc(e)}</button>`).join('')}</div></div>
      <div class="cc-panel"><h2>Hoy</h2><div class="cc-history">${stats.records.slice().reverse().slice(0,24).map(recordMarkup).join('') || '<div class="cc-empty">Aún no hay movimientos.</div>'}</div><button class="cc-soft-btn danger" data-cc-clear>Limpiar prueba</button></div>
    </section>`;
  }

  function recordMarkup(record){
    const time = new Date(record.date).toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});
    const icon = BASE_CONTROLS.find(c => c.key === record.type)?.icon || (String(record.type).startsWith('CUSTOM:') ? '⭐' : '📝');
    return `<div class="cc-record"><b><span>${icon}</span>${esc(record.label)} · ${time}</b><p>${esc(record.message)}</p><small>${esc(record.response || '')}</small></div>`;
  }

  function activeTarget(){
    const section = document.querySelector('.control-page, .cc-friendly');
    if(!section) return null;
    return section;
  }

  let rendering = false;
  function renderCurrent(){
    if(rendering) return;
    const target = activeTarget();
    if(!target) return;
    rendering = true;
    injectStyles();
    const config = getConfig();
    if(target.matches('.cc-friendly')){
      const wrapper = document.createElement('section');
      target.replaceWith(wrapper);
      wrapper.className = 'control-page';
      rendering = false;
      renderCurrent();
      return;
    }
    if(!config) renderWelcome(target);
    else renderDashboard(target, config);
    rendering = false;
  }

  function addCustomControl(){
    const config = getConfig() || {name:'Mi negocio', type:'Negocio', products:DEMO_PRODUCTS, controls:['VENTA','GASTO','EMPLEADO'], customControls:[]};
    const label = prompt('¿Cómo quieres llamar tu botón? Ej: Renta, Entregas, Gasolina, Empleados extra');
    if(!label || !label.trim()) return;
    const flowRaw = prompt('¿Ese botón es dinero que sale, dinero que entra o solo nota? Escribe: sale, entra o nota', 'sale') || 'nota';
    const flow = /entra|entrada|ingreso/i.test(flowRaw) ? 'entrada' : (/sale|salida|gasto|egreso/i.test(flowRaw) ? 'salida' : 'nota');
    const icons = {entrada:'💵', salida:'💸', nota:'⭐'};
    config.customControls = [...(config.customControls || []), {id:uid('custom'), label:label.trim(), flow, icon:icons[flow]}];
    saveConfig(config);
    renderCurrent();
  }

  function prefill(type){
    const input = document.getElementById('ccMessage');
    if(!input) return;
    const map = {
      VENTA:'Vendí ', GASTO:'Compré ', INVENTARIO:'Inventario ', PRODUCCION:'Hice ', MERMA:'Merma ', PEDIDO:'Pedido para mañana: ', COBRO:'Cobré ', DEUDA:'Me deben ', EMPLEADO:'Pagué a '
    };
    input.value = map[type] || '';
    input.focus();
  }

  function processMessage(){
    const config = getConfig();
    const input = document.getElementById('ccMessage');
    const message = String(input?.value || '').trim();
    if(!config || !message) return;
    const record = parseRecord(message, config);
    saveRecord(record);
    if(input) input.value = '';
    renderCurrent();
  }

  function saveSetupFromDom(){
    const existing = getConfig() || {};
    const controls = [...document.querySelectorAll('[data-cc-toggle].active')].map(btn => btn.getAttribute('data-cc-toggle')).filter(Boolean);
    const config = saveConfig({
      ...existing,
      name:document.getElementById('ccName')?.value || existing.name || 'Mi negocio',
      type:document.getElementById('ccType')?.value || existing.type || 'Negocio',
      products:parseProductsText(document.getElementById('ccProducts')?.value || ''),
      controls,
      customControls:existing.customControls || []
    });
    renderDashboard(activeTarget(), config);
  }

  document.addEventListener('click', event => {
    const btn = event.target.closest('[data-cc-demo],[data-cc-setup],[data-cc-cancel],[data-cc-save-setup],[data-cc-toggle],[data-cc-add-custom],[data-cc-prefill],[data-cc-prefill-custom],[data-cc-process],[data-cc-example],[data-cc-clear]');
    if(!btn) return;
    event.preventDefault();
    event.stopPropagation();

    if(btn.matches('[data-cc-demo]')) return createDemo();
    if(btn.matches('[data-cc-setup]')) return renderSetup(activeTarget());
    if(btn.matches('[data-cc-cancel]')) return renderCurrent();
    if(btn.matches('[data-cc-save-setup]')) return saveSetupFromDom();
    if(btn.matches('[data-cc-toggle]')){ btn.classList.toggle('active'); return; }
    if(btn.matches('[data-cc-add-custom]')) return addCustomControl();
    if(btn.matches('[data-cc-prefill]')) return prefill(btn.getAttribute('data-cc-prefill'));
    if(btn.matches('[data-cc-prefill-custom]')){
      const config = getConfig();
      const custom = (config?.customControls || []).find(c => c.id === btn.getAttribute('data-cc-prefill-custom'));
      const input = document.getElementById('ccMessage');
      if(input && custom){ input.value = `${custom.label} `; input.focus(); }
      return;
    }
    if(btn.matches('[data-cc-process]')) return processMessage();
    if(btn.matches('[data-cc-example]')){ const input = document.getElementById('ccMessage'); if(input){ input.value = btn.getAttribute('data-cc-example') || ''; input.focus(); } return; }
    if(btn.matches('[data-cc-clear]')){ if(confirm('¿Borrar registros de prueba de Conecta Control?')){ localStorage.removeItem(RECORDS_KEY); renderCurrent(); } }
  }, true);

  const observer = new MutationObserver(() => {
    const target = document.querySelector('.control-page');
    if(target && !target.querySelector('[data-cc-friendly="1"]')){
      setTimeout(renderCurrent, 0);
    }
  });

  function start(){
    injectStyles();
    observer.observe(document.body, {childList:true, subtree:true});
    renderCurrent();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
