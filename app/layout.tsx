import type { Metadata } from 'next';
import ChunkLoadRecoveryBoundary from '../components/ChunkLoadRecoveryBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'Conecta Servicios',
  description: 'Publica, encuentra y contacta servicios, ventas, mandados y necesidades cerca de ti.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
