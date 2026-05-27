# Emergencia — Variables Supabase NEXT_PUBLIC

## Commit sugerido

Corrige variables publicas de Supabase en Vercel

## Variables oficiales desde ahora

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## Qué corrige

Actualiza las APIs usadas por el feed para leer las nuevas variables públicas de Supabase en Vercel.

## Archivos incluidos

- api/publications.js
- api/public-config.js

## Orden

1. En Vercel, crear:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

2. Subir este ZIP a GitHub.

3. Commit:
   Corrige variables publicas de Supabase en Vercel

4. Esperar Vercel Ready.

5. Probar:
   /api/publications?debug=1

6. Abrir la app normal.
