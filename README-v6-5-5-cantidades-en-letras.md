# Conecta Servicios v6.5.5 — Cantidades en letras para Conecta Control

## Qué corrige

Conecta Control ahora entiende cantidades escritas con letras, porque usuarios reales pueden escribir desde el teclado normal sin cambiar al teclado numérico.

Ejemplo que ahora debe funcionar:

- Vendí un fresa y tres limón

Resultado esperado:

- 1 Fresas con crema = $35
- 3 Pay de limón = $75
- Total: $110

## Cantidades soportadas

- un, uno, una
- dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez
- once a veinte
- veintiuno a treinta
- medio, media

También conserva cantidades con número:

- Vendí 3 limón
- Produje 20 queso
- Conté 8 arroz

## Archivos incluidos

- app.js
- api/messages.js
- index.html
- service-worker.js
- limpiar-cache.html
- activar-admin.html
- README-v6-5-5-cantidades-en-letras.md

## Commit sugerido

Permite cantidades en letras en Conecta Control

## Prueba recomendada

1. Abrir Control.
2. Escribir: Vendí un fresa y tres limón
3. Confirmar que registra total $110.
4. Probar: Produje veinte limón y diez queso
5. Probar: Conté ocho limón y cinco queso
6. Revisar que Feed, Mensajes, Perfil y Admin sigan normales.
