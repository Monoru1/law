'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function ErrorPage({
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
      console.error('[THE LAW] route failure', {
        name: error.name,
        digest: error.digest,
      });
    }
  }, [error]);

  return (
    <main className="end-screen technical-error">
      <div className="end-inner">
        <p className="mono">Erreur technique</p>
        <h1 ref={heading} className="serif" tabIndex={-1}>
          La page n’a pas pu être chargée.
        </h1>
        <p>
          Ta sauvegarde locale n’est pas effacée. Tu peux réessayer ou revenir à
          l’accueil.
        </p>
        <div className="home-actions">
          <button className="law-button" type="button" onClick={retry}>
            Réessayer
          </button>
          <Link className="law-button ghost" href="/">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
