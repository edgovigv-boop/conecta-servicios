// Ejemplo de implementación en app/layout.tsx o pages/_app.tsx
import ChunkLoadRecoveryBoundary from '@/components/ChunkLoadRecoveryBoundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ChunkLoadRecoveryBoundary>
          {children}
        </ChunkLoadRecoveryBoundary>
      </body>
    </html>
  );
}
