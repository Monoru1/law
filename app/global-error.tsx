'use client';

import { useEffect, useRef } from 'react';

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    if (process.env.NODE_ENV === 'development') {
      console.error('[THE LAW] global failure', {
        name: error.name,
        digest: error.digest,
      });
    }
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          alignItems: 'center',
          background: '#0d0d10',
          color: '#efece4',
          display: 'flex',
          fontFamily: 'Arial, sans-serif',
          justifyContent: 'center',
          margin: 0,
          minHeight: '100vh',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <main style={{ maxWidth: 680 }}>
          <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            THE LAW — erreur technique
          </p>
          <h1
            ref={heading}
            tabIndex={-1}
            style={{ fontFamily: 'Georgia, serif', fontSize: '3rem' }}
          >
            L’application n’a pas pu continuer.
          </h1>
          <p>Ta sauvegarde locale n’est pas effacée.</p>
          <button
            type="button"
            onClick={retry}
            style={{
              background: 'transparent',
              border: '1px solid #efece4',
              color: '#efece4',
              cursor: 'pointer',
              font: 'inherit',
              marginTop: 24,
              minHeight: 48,
              padding: '12px 20px',
            }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
