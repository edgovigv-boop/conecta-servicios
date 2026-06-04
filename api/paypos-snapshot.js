const SUPABASE_URL = 'https://qfneazokicmyrtqvukqy.supabase.co';
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

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ ok: false, error: 'Falta token de sesión' });

    const user = await supabaseFetch('/auth/v1/user', token);
    const business = await supabaseFetch(`/rest/v1/cc_businesses?select=id,name,business_type,subscription_status&id=eq.${PAYPOS_BUSINESS_ID}&limit=1`, token);
    const snapshot = await supabaseFetch('/rest/v1/rpc/cc_private_business_snapshot', token, {
      method: 'POST',
      body: JSON.stringify({ p_business_id: PAYPOS_BUSINESS_ID })
    });
    const stock = await supabaseFetch(`/rest/v1/cc_stock_balances?select=*&business_id=eq.${PAYPOS_BUSINESS_ID}&order=item_type.asc,item_name.asc`, token);
    const recipes = await supabaseFetch(`/rest/v1/cc_recipes?select=id,name,yield_quantity,yield_unit,cc_products(name)&business_id=eq.${PAYPOS_BUSINESS_ID}&order=name.asc`, token);

    return res.status(200).json({
      ok: true,
      user: { id: user.id, email: user.email },
      business: business?.[0] || null,
      snapshot,
      stock,
      recipes
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || String(error) });
  }
};
