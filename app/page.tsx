'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { campaign } from '../src/content/rebirth';
import { useT0GameStore } from '../src/store/gameStoreT0';
import styles from '../src/ui/t0/t0.module.css';
import { Place } from '../src/ui/t0/Stage';

export default function Home() {
  const { loaded, save, hydrate, error } = useT0GameStore();
  useEffect(() => {
    if (!loaded) void hydrate();
  }, [loaded, hydrate]);
  return (
    <main className={styles.frame}>
      <Place location="apartment" />
      <header className={styles.hud}>
        <span className={styles.brand}>THE LAW: REBIRTH</span>
        <Link className="law-button ghost" href="/ma-loi">
          Carnet et sauvegardes
        </Link>
      </header>
      <section className={styles.story}>
        <p className={styles.chapter}>Valombre · 24 octobre 2026</p>
        <h1>{campaign.title}</h1>
        <p>{campaign.subtitle}</p>
        <p>
          Gabriel Varenne est revenu. Dans une enveloppe sans timbre, il trouve
          une adolescente disparue, deux dépositions incompatibles et sa propre
          signature.
        </p>
        <p>{campaign.warning}</p>
        {error && <p role="alert">{error}</p>}
        <Link className="law-button" href="/jouer/t0">
          {save ? 'Reprendre l’enquête' : 'Commencer le prologue'}
        </Link>
        <p className={styles.localSave}>
          Sauvegarde locale. Aucun compte. Aucun envoi de tes réponses.
        </p>
      </section>
      <section
        className="rebirth-dossiers"
        aria-label="Les dossiers de Valombre"
      >
        <h2 className="serif">Les affaires de Valombre</h2>
        <ol>
          {campaign.chapters.map((title, index) => (
            <li key={title}>
              <span className="mono">Dossier {index}</span>
              <h3>{title}</h3>
              {index === 0 ? (
                <>
                  <p>
                    Le retour à Valombre, l’enveloppe et la première trace au
                    couloir B.
                  </p>
                  <Link className="law-button ghost" href="/jouer/t0">
                    Jouer le prologue
                  </Link>
                </>
              ) : (
                <p>À venir · ce dossier n’est pas encore jouable.</p>
              )}
            </li>
          ))}
        </ol>
      </section>
      <section className="rebirth-dossiers" aria-label="Le Tribunal">
        <h2 className="serif">Le Tribunal</h2>
        <p>
          Nouvelle direction narrative, en construction : l’audience d’ouverture
          seule est jouable. Les Archives du silence ci-dessus restent
          accessibles ; les deux campagnes ne partagent ni sauvegarde ni
          journal.
        </p>
        <Link className="law-button ghost" href="/jouer/tribunal">
          Entrer dans l’audience
        </Link>
      </section>
    </main>
  );
}
