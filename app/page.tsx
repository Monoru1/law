'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { campaign as tribunalCampaign } from '../src/content/tribunal';
import { campaign as rebirthCampaign } from '../src/content/rebirth';
import { useT0GameStore } from '../src/store/gameStoreT0';
import { useTribunalGameStore } from '../src/store/gameStoreTribunal';
import styles from '../src/ui/tribunal/tribunal.module.css';

// The Tribunal is the main entry: it opens and closes the game (see
// docs/rebirth/canon-2026/00-BIBLE-DU-TRIBUNAL.md). Les Archives du silence
// (Gabriel Varenne) stays reachable as a clearly secondary, historical link —
// it is no longer presented as the primary scenario — and its save is
// untouched: the two campaigns share neither journal nor storage key.
export default function Home() {
  const {
    loaded: tribunalLoaded,
    save: tribunalSave,
    hydrate: hydrateTribunal,
    error: tribunalError,
  } = useTribunalGameStore();
  const {
    loaded: archivesLoaded,
    save: archivesSave,
    hydrate: hydrateArchives,
    error: archivesError,
  } = useT0GameStore();
  useEffect(() => {
    if (!tribunalLoaded) void hydrateTribunal();
  }, [tribunalLoaded, hydrateTribunal]);
  useEffect(() => {
    if (!archivesLoaded) void hydrateArchives();
  }, [archivesLoaded, hydrateArchives]);
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
            <p>
              Premier chapitre jouable : la maison, le repas et les premières
              découvertes. Dossier incomplet.
            </p>
            <Link href="/jouer/sixieme-place">Ouvrir le premier chapitre</Link>
          </li>
          <li>
            <span className="mono">Dossier II</span>
            <h3>Les Enfants du Sous-sol</h3>
            <p>À l’instruction. Non jouable aujourd’hui.</p>
          </li>
          <li>
            <span className="mono">Dossier III</span>
            <h3>Le Dernier Témoin</h3>
            <p>À l’instruction. Non jouable aujourd’hui.</p>
          </li>
        </ol>
      </section>
      <section className="rebirth-dossiers" aria-label="Édition précédente">
        <h2 className="serif">Édition précédente</h2>
        <p>
          {rebirthCampaign.title} n’est plus la direction principale du jeu. Le
          prologue reste jouable et sa sauvegarde est conservée ; il ne partage
          ni journal ni progression avec le Tribunal ci-dessus.
        </p>
        {archivesError && <p role="alert">{archivesError}</p>}
        <Link className="law-button ghost" href="/jouer/t0">
          {archivesSave
            ? 'Reprendre l’enquête de Gabriel'
            : 'Jouer le prologue'}
        </Link>
      </section>
    </main>
  );
}
