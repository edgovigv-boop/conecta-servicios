'use client';

import React, { useCallback, useEffect, useState } from 'react';

const RECOVERY_KEY = 'conecta_chunk_recovery_v1';
const MAX_RECOVERIES = 1;
const WINDOW_MS = 1000 * 60 * 5;

function getErrorText(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return `${error.name || ''} ${error.message || ''} ${error.stack || ''}`;
  try { return JSON.stringify(error); } catch { return String(error); }
}

function isChunkLoadError(error: unknown): boolean {
  const text = getErrorText(error).toLowerCase();
  return (
    text.includes('chunkloaderror') ||
    text.includes('loading chunk') ||
    text.includes('loading css chunk') ||
    text.includes('failed to fetch dynamically imported module') ||
    text.includes('importing a module script failed') ||
    text.includes('error loading dynamically imported module') ||
    text.includes('__webpack_require__.e')
  );
}

function canRecover(): boolean {
  try {
    const raw = window.localStorage.getItem(RECOVERY_KEY);
    const now = Date.now();

    if (!raw) {
      window.localStorage.setItem(RECOVERY_KEY, JSON.stringify({ count: 1, firstAt: now, lastAt: now }));
      return true;
    }

    const data = JSON.parse(raw) as { count?: number; firstAt?: number; lastAt?: number };
    const firstAt = Number(data.firstAt || 0);
    const count = Number(data.count || 0);

    if (!firstAt || now - firstAt > WINDOW_MS) {
      window.localStorage.setItem(RECOVERY_KEY, JSON.stringify({ count: 1, firstAt: now, lastAt: now }));
      return true;
    }

    if (count >= MAX_RECOVERIES) return false;

    window.localStorage.setItem(RECOVERY_KEY, JSON.stringify({ count: count + 1, firstAt, lastAt: now }));
    return true;
  } catch {
    return false;
  }
}

async function clearRuntimeCaches(): Promise<void> {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {}

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch {}
}

async function recoverFromChunkError(reason: string): Promise<void> {
  if (!canRecover()) return;
  await clearRuntimeCaches();

  const url = new URL(window.location.href);
  url.searchParams.set('recover', String(Date.now()));
  url.searchParams.set('reason', reason);
  window.location.replace(url.toString());
}

function RecoveryScreen({
  message = 'Estamos actualizando la app. Toca entrar para cargar la versión más reciente.',
}: {
  message?: string;
}) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: '#f8fafc',
        color: '#111827',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 24,
          background: '#ffffff',
          padding: 24,
          boxShadow: '0 18px 40px rgba(15,23,42,.14)',
        }}
      >
        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 900 }}>
          Conecta Servicios
        </h1>

        <p style={{ margin: '0 0 18px', color: '#4b5563', lineHeight: 1.5 }}>
          {message}
        </p>

        <button
          type="button"
          onClick={() => {
            window.localStorage.removeItem(RECOVERY_KEY);
            window.location.replace('/?recover=' + Date.now());
          }}
          style={{
            width: '100%',
            minHeight: 52,
            border: 0,
            borderRadius: 999,
            background: '#1d4ed8',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          Entrar a la app
        </button>
      </section>
    </main>
  );
}

type BoundaryProps = {
  children: React.ReactNode;
  onRecoverableError: (error: unknown) => void;
};

type BoundaryState = {
  hasError: boolean;
  nonChunkError: boolean;
};

class ChunkBoundaryClass extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = {
    hasError: false,
    nonChunkError: false,
  };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return {
      hasError: true,
      nonChunkError: !isChunkLoadError(error),
    };
  }

  componentDidCatch(error: unknown): void {
    if (isChunkLoadError(error)) {
      this.props.onRecoverableError(error);
      return;
    }
    console.error('[Conecta] Error no recuperable por ChunkBoundary:', error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <RecoveryScreen
          message={
            this.state.nonChunkError
              ? 'La app necesita recargarse para continuar.'
              : 'Estamos actualizando la app. Toca entrar para cargar la versión más reciente.'
          }
        />
      );
    }

    return this.props.children;
  }
}

export default function ChunkLoadRecoveryBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const [fatalChunkError, setFatalChunkError] = useState(false);

  const handleRecoverableError = useCallback((error: unknown) => {
    if (!isChunkLoadError(error)) return;
    recoverFromChunkError('chunk-boundary').catch(() => setFatalChunkError(true));
  }, []);

  useEffect(() => {
    function onWindowError(event: ErrorEvent) {
      if (isChunkLoadError(event.error || event.message)) {
        event.preventDefault();
        recoverFromChunkError('window-error').catch(() => setFatalChunkError(true));
      }
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      if (isChunkLoadError(event.reason)) {
        event.preventDefault();
        recoverFromChunkError('unhandled-rejection').catch(() => setFatalChunkError(true));
      }
    }

    window.addEventListener('error', onWindowError, true);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onWindowError, true);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  if (fatalChunkError) {
    return <RecoveryScreen message="Hay una actualización pendiente. Toca entrar para recargar la app." />;
  }

  return (
    <ChunkBoundaryClass onRecoverableError={handleRecoverableError}>
      {children}
    </ChunkBoundaryClass>
  );
}
