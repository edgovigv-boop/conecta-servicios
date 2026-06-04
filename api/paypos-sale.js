const URL_BASE = 'https://qfneazokicmyrtqvukqv.supabase.co';
const KEY = 'sb_publishable_HixfYyqK2s5dDngKjnS-Dw__SDkZU1K';
const BUSINESS_ID = '36a8d71a-f5e4-4ab9-9d48-3a3444b447a7';

async function callSupabase(path, token, init) {
  const response = await fetch(URL_BASE + path, {
    ...(init || {}),
    headers: {
      apikey: KEY,
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      ...((init && init.headers) || {})
    }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!response.ok) {
    const message = (data && (data.message || data.msg || data.error_description || data.error)) || text || 'Error de Supabase';
    throw new Error(message);
  }
  return data;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Metodo no permitido' });

  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ ok: false, error: 'Falta sesion' });

    const user = await callSupabase('/auth/v1/user', token);
    const body = req.body || {};
    const productId = body.product_id;
    const quantity = Number(body.quantity || 0);
    const unitPrice = Number(body.unit_price || 0);
    const paidAmount = body.paid_amount === '' || body.paid_amount === undefined || body.paid_amount === null ? null : Number(body.paid_amount || 0);

    if (!productId) return res.status(400).json({ ok: false, error: 'Falta producto' });
    if (quantity <= 0) return res.status(400).json({ ok: false, error: 'Cantidad invalida' });

    const branchRows = await callSupabase('/rest/v1/cc_branches?select=id&business_id=eq.' + BUSINESS_ID + '&active=eq.true&order=is_main.desc&limit=1', token);
    const branchId = branchRows && branchRows[0] ? branchRows[0].id : null;

    const saleItems = [{ product_id: productId, quantity }];
    if (unitPrice > 0) saleItems[0].unit_price = unitPrice;

    const result = await callSupabase('/rest/v1/rpc/cc_register_sale', token, {
      method: 'POST',
      body: JSON.stringify({
        p_business_id: BUSINESS_ID,
        p_branch_id: branchId,
        p_items: saleItems,
        p_payment_method: 'cash',
        p_customer_id: null,
        p_paid_amount: paidAmount,
        p_notes: 'Venta desde Paypos',
        p_user_id: user.id
      })
    });

    return res.status(200).json({ ok: true, sale_id: result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || String(error) });
  }
};
