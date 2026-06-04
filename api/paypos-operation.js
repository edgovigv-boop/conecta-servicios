const SUPABASE_URL = 'https://qfneazokicmyrtqvukqv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_HixfYyqK2s5dDngKjnS-Dw__SDkZU1K';
const PAYPOS_BUSINESS_ID = '36a8d71a-f5e4-4ab9-9d48-3a3444b447a7';

async function supabaseFetch(path, token, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const message = payload?.message || payload?.error_description || payload?.msg || text || 'Supabase request failed';
    throw new Error(`${response.status}: ${message}`);
  }
  return payload;
}

async function getUser(token) {
  const user = await supabaseFetch('/auth/v1/user', token);
  return user;
}

async function getBranch(token) {
  const branches = await supabaseFetch(`/rest/v1/cc_branches?select=id,name&business_id=eq.${PAYPOS_BUSINESS_ID}&active=eq.true&order=is_main.desc&limit=1`, token);
  return branches?.[0]?.id || null;
}

async function rpc(name, token, body) {
  return supabaseFetch(`/rest/v1/rpc/${name}`, token, { method: 'POST', body: JSON.stringify(body) });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ ok: false, error: 'Falta token de sesión' });

    const user = await getUser(token);
    const branchId = await getBranch(token);
    const { action, payload = {} } = req.body || {};
    let result;

    if (action === 'sale') {
      const { product_id, quantity, unit_price, paid_amount, payment_method = 'cash', notes = null } = payload;
      if (!product_id || !Number(quantity)) throw new Error('Falta producto o cantidad');
      const items = [{ product_id, quantity: Number(quantity) }];
      if (unit_price !== undefined && unit_price !== null && unit_price !== '') items[0].unit_price = Number(unit_price);
      result = await rpc('cc_register_sale', token, {
        p_business_id: PAYPOS_BUSINESS_ID,
        p_branch_id: branchId,
        p_items: items,
        p_payment_method: payment_method,
        p_customer_id: null,
        p_paid_amount: paid_amount === '' || paid_amount === undefined ? null : Number(paid_amount),
        p_notes: notes,
        p_user_id: user.id
      });
    } else if (action === 'purchase') {
      const { inventory_item_id, quantity, unit, unit_cost, paid_amount, payment_method = 'cash', notes = null } = payload;
      if (!inventory_item_id || !Number(quantity)) throw new Error('Falta insumo o cantidad');
      result = await rpc('cc_register_purchase', token, {
        p_business_id: PAYPOS_BUSINESS_ID,
        p_branch_id: branchId,
        p_supplier_id: null,
        p_items: [{ inventory_item_id, quantity: Number(quantity), unit: unit || 'piece', unit_cost: Number(unit_cost || 0) }],
        p_payment_method: payment_method,
        p_paid_amount: paid_amount === '' || paid_amount === undefined ? null : Number(paid_amount),
        p_notes: notes,
        p_user_id: user.id
      });
    } else if (action === 'production') {
      const { product_id, quantity, notes = null } = payload;
      if (!product_id || !Number(quantity)) throw new Error('Falta producto o cantidad');
      result = await rpc('cc_register_production', token, {
        p_business_id: PAYPOS_BUSINESS_ID,
        p_branch_id: branchId,
        p_product_id: product_id,
        p_quantity: Number(quantity),
        p_notes: notes,
        p_user_id: user.id
      });
    } else if (action === 'cash_audit') {
      const { counted_cash, notes = null } = payload;
      if (counted_cash === undefined || counted_cash === '') throw new Error('Falta efectivo contado');
      const sessionId = await rpc('cc_get_or_create_open_cash_session', token, {
        p_business_id: PAYPOS_BUSINESS_ID,
        p_branch_id: branchId,
        p_opening_cash: 0,
        p_user_id: user.id
      });
      result = await rpc('cc_close_cash_session', token, {
        p_cash_session_id: sessionId,
        p_counted_cash: Number(counted_cash),
        p_notes: notes
      });
    } else {
      throw new Error('Acción no reconocida');
    }

    res.status(200).json({ ok: true, action, result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || String(error) });
  }
};
