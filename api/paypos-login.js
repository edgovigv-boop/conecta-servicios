const SUPABASE_URL = 'https://qfneazokicmyrtqvukqy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_HixfYyqK2s5dDngKjnS-Dw__SDkZU1K';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: 'Correo y contraseña requeridos' });

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ ok: false, error: payload.error_description || payload.msg || payload.error || 'No se pudo iniciar sesión' });

    return res.status(200).json({
      ok: true,
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_at: payload.expires_at,
      user: payload.user ? { id: payload.user.id, email: payload.user.email } : null
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || String(error) });
  }
};
