// ------------------------------------------------------------------
// PROPIEDAD EXCLUSIVA - DERECHOS RESERVADOS © 2026
// Proyecto: Conecta Servicios
// Función Vercel: crear preferencia de Mercado Pago para Embajadores
// ------------------------------------------------------------------

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(501).json({
      error: "MP_ACCESS_TOKEN no configurado en Vercel. Usa el link manual de Mercado Pago o configura la variable de entorno."
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const amount = Number(body.amount || 0);
    if (!amount || amount <= 0) return res.status(400).json({ error: "Monto inválido" });

    const origin = req.headers.origin || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://conecta-servicios.vercel.app");
    const ambassadorCode = String(body.ambassadorCode || "CON-LOCAL").slice(0, 80);
    const referralName = String(body.referralName || "Nuevo miembro").slice(0, 120);
    const planName = String(body.planName || "Membresía Conecta").slice(0, 120);
    const externalReference = `CON-${ambassadorCode}-${Date.now()}`.replace(/[^A-Za-z0-9\-_]/g, "-");

    const preference = {
      items: [
        {
          title: planName,
          description: `Embajador ${ambassadorCode} · ${referralName}`,
          quantity: 1,
          currency_id: "MXN",
          unit_price: amount
        }
      ],
      external_reference: externalReference,
      metadata: {
        ambassador_code: ambassadorCode,
        referral_name: referralName,
        plan_id: body.planId || "negocio",
        commission_suggested: Number(body.commission || 0),
        notes: body.notes || ""
      },
      back_urls: {
        success: `${origin}/?pago=aprobado&ref=${encodeURIComponent(externalReference)}`,
        failure: `${origin}/?pago=fallido&ref=${encodeURIComponent(externalReference)}`,
        pending: `${origin}/?pago=pendiente&ref=${encodeURIComponent(externalReference)}`
      },
      auto_return: "approved"
    };

    if (process.env.MP_WEBHOOK_URL) preference.notification_url = process.env.MP_WEBHOOK_URL;

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preference)
    });

    const data = await mpResponse.json();
    if (!mpResponse.ok) {
      return res.status(mpResponse.status).json({ error: data.message || "Mercado Pago rechazó la preferencia", detail: data });
    }

    return res.status(200).json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      external_reference: externalReference
    });
  } catch (error) {
    return res.status(500).json({ error: "No se pudo crear el cobro", detail: error.message });
  }
}
