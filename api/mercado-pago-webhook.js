// ------------------------------------------------------------------
// PROPIEDAD EXCLUSIVA - DERECHOS RESERVADOS © 2026
// Proyecto: Conecta Servicios
// Webhook placeholder Mercado Pago para futura validación de pagos
// ------------------------------------------------------------------

export default async function handler(req, res) {
  // En esta versión piloto no escribimos en Supabase ni guardamos pagos reales.
  // La siguiente etapa debe validar la firma/notificación, consultar el pago en Mercado Pago
  // y registrar el resultado en una base segura.
  return res.status(200).json({ received: true, pilot: true });
}
