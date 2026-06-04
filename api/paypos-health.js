const SUPABASE_URL = 'https://qfneazokicmyrtqvukqy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_HixfYyqK2s5dDngKjnS-Dw__SDkZU1K';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const results = [];

  async function test(name, url, options = {}) {
    try {
      const response = await fetch(url, { cache: 'no-store', ...options });
      const text = await response.text();
      results.push({ name, ok: response.ok, status: response.status, sample: text.slice(0, 240) });
    } catch (error) {
      results.push({ name, ok: false, error: error.message || String(error) });
    }
  }

  await test('auth_health', `${SUPABASE_URL}/auth/v1/health`);
  await test('rest_businesses', `${SUPABASE_URL}/rest/v1/cc_businesses?select=id,name&name=eq.Paypos`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });

  res.status(200).json({ ok: results.every((r) => r.ok), via: 'vercel-api', results });
};
