'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { campaign as tribunalCampaign } from '../src/content/tribunal';
import { useTribunalGameStore } from '../src/store/gameStoreTribunal';
import styles from '../src/ui/tribunal/tribunal.module.css';

// Only the Tribunal is presented publicly. Legacy save data is preserved separately.
export default function Home() {
  const {
    loaded: tribunalLoaded,
    save: tribunalSave,
    hydrate: hydrateTribunal,
    error: tribunalError,
  } = useTribunalGameStore();
  useEffect(() => {
    if (!tribunalLoaded) void hydrateTribunal();
  }, [tribunalLoaded, hydrateTribunal]);
  return (
    <main className={styles.frame}>
      <div className={styles.room} data-lit="true" />
      <header className={styles.hud}>
        <span className={styles.brand}>THE LAW: REBIRTH</span>
        <Link className="law-button ghost" href="/ma-loi">
          Carnet et sauvegardes
        </Link>
      </header>
      <section className={styles.story}>
        <h1>VOUS AVEZ ÉTÉ CONVOQUÉ.</h1>
        <p>{tribunalCampaign.subtitle}</p>
        <p>{tribunalCampaign.warning}</p>
        {tribunalError && <p role="alert">{tribunalError}</p>}
        <Link className="law-button" href="/jouer/tribunal">
          {tribunalSave ? 'Reprendre l’audience' : 'Entrer'}
        </Link>
        <p className={styles.localSave}>
          Sauvegarde locale. Aucun compte. Aucun envoi de tes réponses.
        </p>
      </section>
      <section className="rebirth-dossiers" aria-label="Le registre">
        <h2 className="serif">Le registre</h2>
        <ol>
          <li>
            <span className="mono">Dossier I</span>
            <h3>La Sixième Place</h3>
            <p>En préparation.</p>
          </li>
          <li>
            <span className="mono">Dossier II</span>
            <h3>Les Enfants du Sous-sol</h3>
            <p>En préparation.</p>
          </li>
          <li>
            <span className="mono">Dossier III</span>
            <h3>Le Dernier Témoin</h3>
            <p>En préparation.</p>
          </li>
        </ol>
      </section>
    </main>
  );
}
