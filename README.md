# Conecta Servicios v4.7.6 — Home limpio + CTA dinámico

Esta versión corrige el home para que no parezca una captura de pantalla y refuerza el acceso **Publicaciones cerca de mí** con un movimiento visual sutil.

## Incluye

- Home visual limpio en 9:16, sin hora falsa, batería, señal ni barra de sistema dentro de la imagen.
- Logo circular con nodos conectados.
- Botón principal: **Oportunidades para ti**.
- Acceso **Publicaciones cerca de mí** con pulso/halo suave para hacerlo más intuitivo.
- Tarjetas **Mensajes inteligentes** y **Aprendizaje** como **Próximamente**.
- Contador de registros y tarjeta de instalación acomodados según la propuesta visual.
- Campanita para notificaciones.
- Perfil para mis publicaciones.
- **Oficina / Contacto** ubicado en la parte superior del home.
- Barra inferior: Inicio, Para ti, Mensajes y Aprendizaje.
- Service worker actualizado para ayudar a romper caché.

## Archivos a subir

Sube o reemplaza en GitHub:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `manifest.json`
- `service-worker.js`
- `assets/`

## Commit sugerido

```text
Actualizar a v4.7.6 home limpio y CTA dinámico
```

## Nota de prueba

Después del despliegue en Vercel, abre primero en navegador. Si la PWA instalada conserva la versión anterior, desinstálala y vuelve a instalarla para limpiar caché.
