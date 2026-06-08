# Sistema Deportivo Pro Broadcast Studio

Aplicación Web/PWA móvil para grabar partidos reales con cámara en vivo, marcador profesional encima del video, controles rápidos, sonidos de evento, ambiente de público, música de entrada y narración automática.

## Objetivo comercial

Abrir la página en un celular, permitir la cámara, poner el marcador encima del partido real y grabar la pantalla del celular para entregar un video con apariencia de transmisión deportiva.

## Archivos

- `index.html` — estructura de cámara, marcador overlay y controles.
- `styles.css` — diseño oscuro, deportivo, móvil y responsive.
- `app.js` — cámara, reglas de anotación, audio, narrador, historial, PWA y preparación MediaRecorder.
- `manifest.webmanifest` — instalación PWA.
- `sw.js` — caché básico offline.
- `icon.svg` — icono temporal propio.
- `sounds/README.md` — guía para sonidos libres de derechos.

## Cómo probar en celular

1. Publica esta carpeta en un servidor HTTPS o abre con una herramienta local que sirva HTTPS.
2. Entra desde el celular a `index.html`.
3. Permite acceso a cámara.
4. Activa efectos, narrador, ambiente o música según el evento.
5. Configura nombres de equipos en el marcador superior.
6. Usa los botones `+1`, `+2`, `+3`, `Falta`, reloj y cuarto durante el partido.
7. Pulsa **Modo grabación limpia**.
8. Abre la grabadora de pantalla del celular.
9. Graba el partido con el overlay encima.
10. Al finalizar, detén la grabación de pantalla y entrega el video.

## Reglas de juego implementadas

- Tiro libre suma 1.
- Triple suma 3.
- Mujer en canasta normal suma 3.
- Hombre en canasta normal suma 2.
- Falta no suma puntos.
- Deshacer revierte la última jugada de puntos o falta.

## Audio y narrador

- Los efectos intentan reproducir archivos desde `/sounds/`.
- Si no existen, la app genera tonos temporales con Web Audio API.
- El narrador usa `SpeechSynthesis` en español y frases variadas.
- No uses música con derechos de autor.

## Historial local

La app guarda en `localStorage`:

- Equipos.
- Marcador.
- Faltas.
- Periodo.
- Tiempo.
- Última jugada.
- Eventos con timestamp.
- Estado de sonidos, ambiente, música y narrador.

## Grabación interna futura

La estructura deja preparado `MediaRecorder`. En esta primera entrega se prioriza el flujo comercial inmediato: usar la grabadora de pantalla del celular mientras el navegador muestra cámara + overlay + audio/narrador.

## PWA

Incluye `manifest.webmanifest` y `sw.js` para instalación como app web y caché básico de archivos principales.

## Independencia del proyecto

Esta carpeta es independiente y no usa código de módulos ajenos. No incluye marcas, música ni logos de ligas, canales o equipos reales.
