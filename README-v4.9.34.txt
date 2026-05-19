Conecta Servicios v4.9.34 — Hotfix persistencia multimedia de plantillas

Corrige el caso en que una foto subida desde Admin aparece un momento y luego desaparece.

Cambios:
- Los overrides remotos de plantillas ya no pisan una foto local más reciente.
- Si Supabase Storage tarda en servir la URL pública, el Home reintenta cargar antes de mostrar fallback.
- Después de validar la URL pública se re-renderiza el feed.
- Cache/PWA actualizado a v4.9.34.

No requiere SQL nuevo si los buckets template-media y publication-media ya están públicos.
