# Conecta Servicios — Parche web + preparación Capacitor Android

## Commit sugerido

Agrega proteccion de chunks y prepara estructura Capacitor

## Qué incluye

- `next.config.js` con `output: 'export'`.
- `capacitor.config.ts` apuntando a `webDir: 'out'`.
- `components/ChunkLoadRecoveryBoundary.tsx`.
- `app/layout.tsx` envolviendo la app con el Error Boundary.
- `.gitignore` actualizado.
- Carpeta `android/` con estructura base y archivos críticos:
  - `AndroidManifest.xml`
  - `network_security_config.xml`
  - permisos `INTERNET` y `ACCESS_NETWORK_STATE`
  - bloqueo `usesCleartextTraffic="false"`

## Qué verás en Vercel

Si todo carga bien, la app se ve igual.

Si un usuario tiene una versión vieja de chunks JavaScript después de un deploy:

1. El Error Boundary detecta el problema.
2. Limpia caché/runtime relacionado.
3. Recarga con parámetro `recover`.
4. Si no logra recuperarse automáticamente, muestra una pantalla limpia con botón `Entrar a la app`.

## Importante sobre `app/layout.tsx`

Este ZIP incluye un `app/layout.tsx` estándar para App Router.

Si tu proyecto ya tiene un `app/layout.tsx` con providers, fuentes o metadata especial, revisa el archivo antes de reemplazarlo totalmente. La parte esencial es:

```tsx
<ChunkLoadRecoveryBoundary>
  {children}
</ChunkLoadRecoveryBoundary>
```

## Importante sobre Android

La carpeta `android/` queda preparada como base de repositorio. Cuando se trabaje en entorno local o CI con Node/Android Studio, Capacitor podrá sincronizar la carpeta `out/` generada por Next.

## No subir nunca

- `.env.local`
- `.jks`
- `.keystore`
- `key.properties`
- `.aab`
- `.apk`
- `android/app/build/`
- `out/`
- `.next/`
