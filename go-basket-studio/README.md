# Go Basket Studio

PWA universal para básquet con HTML, CSS y JavaScript puro.

## Promesa

> Convierte cualquier partido de básquet en una transmisión desde tu celular.

Subtítulo del producto:

> Marcador, cámara, narración, sonidos, pantalla completa, grabación y resumen final para compartir.

## Funcionalidad incluida

- Pantalla inicial con Partido rápido, Partido con jugadores, Modo 3x3, Reglas personalizadas y Partidos guardados.
- Partido rápido con equipos, duración, cámara opcional, narrador opcional y sonidos opcionales.
- Partido con jugadores con nombre y número opcional, permitiendo jugar aunque el roster esté incompleto.
- Control de partido con marcador grande, tiempo, faltas, última jugada, +1, +2, +3, falta, deshacer, timer, reinicio, finalizar, cámara, grabación, pantalla completa, sonidos, narrador, teleprompter y ambiente público.
- Cámara del celular como fondo visual usando `getUserMedia` cuando el navegador concede permisos.
- Modo grabación seguro: oculta controles, mantiene marcador visible, muestra “Mostrar controles” y permite salir con doble toque.
- Pantalla completa segura: marcador tipo transmisión, botón “Salir” y doble toque para salir.
- Narrador automático con `SpeechSynthesis` en español.
- Teleprompter para leer jugadas en voz alta.
- Sonidos con Web Audio API: canasta, triple, falta, público, final y alerta de tiempo.
- Reglas personalizadas guardadas en `localStorage` y estructura preparada para reglas avanzadas.
- Reporte final con ganador, duración, puntos, faltas, historial, estadísticas por jugador, copiar resumen, WhatsApp, guardar partido y nuevo partido.
- Partidos guardados en `localStorage` con fecha, equipos, resultado, ver reporte y borrar.
- PWA instalable con `manifest.webmanifest`, `sw.js`, `icon.svg` y caché offline básico.

## Supabase futuro

La versión inicial no conecta Supabase. La estructura de datos está centralizada en `app.js` (`STORE_KEYS`, `createGame`, `getSavedMatches`, `setSavedMatches`) para reemplazar `localStorage` por un repositorio remoto en una versión posterior.

## Uso local

Abre `index.html` directamente para una revisión básica o sirve la carpeta para probar PWA y service worker:

```bash
python3 -m http.server 4174 --directory go-basket-studio
```

Luego visita `http://localhost:4174`.

## Alcance de seguridad

La app evita dejar atrapado al usuario en cámara, grabación o pantalla completa: siempre hay botón visible, salida por doble toque y botón de emergencia para mostrar controles.
