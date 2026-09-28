'use client';

import { useEffect, useState } from 'react';

export function OfflineStatus() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <aside
      className="connectivity-status mono"
      role="status"
      aria-live="polite"
    >
      Connexion interrompue. La partie reste enregistrée sur cet appareil. Le
      rapport devra être réessayé après reconnexion.
    </aside>
  );
}
