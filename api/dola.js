// api/dola.js
// Conecta Servicios v5.1.0 - Adaptador seguro para API de DOLA.
//
// Importante:
// - No pongas llaves secretas en app.js ni index.html.
// - Configura DOLA_API_URL y DOLA_API_KEY como variables de entorno en Vercel.
// - Este adaptador está preparado para conectarse a una API real de DOLA cuando tengas endpoint y API key.
// - Mientras no existan esas variables, el frontend usará el modo alternativo externo.

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

function extractTextFromDolaResponse(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (typeof data.text === 'string') return data.text;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.content === 'string') return data.content;
  if (typeof data.output === 'string') return data.output;
  if (Array.isArray(data.output)) {
    const joined = data.output.map((item) => item?.content || item?.text || '').filter(Boolean).join('\n');
    if (joined) return joined;
  }
  const choice = data.choices?.[0];
  if (choice?.message?.content) return choice.message.content;
  if (choice?.text) return choice.text;
  const candidate = data.candidates?.[0];
  if (candidate?.content?.parts?.[0]?.text) return candidate.content.parts[0].text;
  return '';
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED', message: 'Usa POST para consultar DOLA.' });
  }

  const apiUrl = process.env.DOLA_API_URL;
  const apiKey = process.env.DOLA_API_KEY;
  const model = process.env.DOLA_MODEL || 'default';

  if (!apiUrl || !apiKey) {
    return sendJson(res, 200, {
      ok: false,
      error: 'DOLA_API_NOT_CONFIGURED',
      message: 'La API de DOLA aún no está configurada.'
    });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: 'INVALID_JSON', message: 'El cuerpo de la solicitud no es JSON válido.' });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const context = body.context || {};

  if (!messages.length) {
    return sendJson(res, 400, { ok: false, error: 'EMPTY_MESSAGES', message: 'Faltan mensajes para enviar a DOLA.' });
  }

  // Payload genérico compatible con APIs estilo chat. Ajusta aquí si DOLA entrega documentación específica.
  const payload = {
    model,
    messages,
    context,
    temperature: 0.45,
    stream: false
  };

  try {
    const dolaResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const rawText = await dolaResponse.text();
    let data;
    try { data = rawText ? JSON.parse(rawText) : {}; }
    catch { data = { text: rawText }; }

    if (!dolaResponse.ok) {
      return sendJson(res, dolaResponse.status, {
        ok: false,
        error: 'DOLA_API_ERROR',
        message: data?.message || data?.error || 'La API de DOLA respondió con error.',
        status: dolaResponse.status
      });
    }

    const text = extractTextFromDolaResponse(data).trim();

    return sendJson(res, 200, {
      ok: true,
      text,
      raw: data
    });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: 'DOLA_API_REQUEST_FAILED',
      message: 'No se pudo conectar con la API de DOLA.',
      detail: error?.message || String(error)
    });
  }
};
