'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { tribunalContent } from '../../src/content/tribunal';
import { replay } from '../../src/engine';
import { exportStoredSave } from '../../src/persistence/localStorageAdapter';
import {
  TRIBUNAL_SAVE_KEY,
  useTribunalGameStore,
} from '../../src/store/gameStoreTribunal';

function download(raw: string, filename: string) {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function TribunalNotebook() {
  const { save, loaded, error, hydrate, clear } = useTribunalGameStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const state = useMemo(
    () => replay(save?.events ?? [], tribunalContent),
    [save],
  );
  useEffect(() => {
    if (!loaded) void hydrate();
  }, [loaded, hydrate]);

  const notes = state.notes;
  const choices = Object.entries(state.choices);
  return (
    <main className="law-page rebirth-notebook">
      <header className="site-top">
        <Link className="law-button ghost" href="/">THE LAW: REBIRTH</Link>
        <Link className="law-button" href="/jouer/tribunal">
          Reprendre l’audience
        </Link>
      </header>
      <h1 className="serif">Le registre du Tribunal</h1>
      <p>Chaque choix laisse une trace. Ce registre contient uniquement les actes de votre audience actuelle.</p>
      {!loaded && <p>Ouverture du registre…</p>}
      {error && <p role="alert">{error}</p>}
      {loaded && !save && !error && <p>Aucune audience enregistrée sur cet appareil.</p>}
      {save && (
        <>
          <section>
            <h2 className="serif">Déclarations et observations</h2>
            {notes.length === 0 ? (
              <p>Aucune déclaration consignée pour le moment.</p>
            ) : (
              <ol>
                {notes.map((note) => (
                  <li key={note.id}>
                    <p>{note.text || 'Silence consigné.'}</p>
                    <p className="mono">{note.status === 'fact' ? 'Acte consigné' : 'Observation'}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section>
            <h2 className="serif">Étapes de l’audience</h2>
            {choices.length === 0 ? (
              <p>Aucune étape clôturée.</p>
            ) : (
              <ol>
                {choices.map(([sceneId]) => (
                  <li key={sceneId}>
                    {tribunalContent.scenes.find((scene) => scene.id === sceneId)?.title ?? 'Étape enregistrée'}
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section>
            <h2 className="serif">Les dossiers</h2>
            <p>Dossier I — La Sixième Place : en préparation.</p>
            <p>Dossiers II et III : en préparation.</p>
            <p>Le procès final sera ouvert après l’instruction des dossiers.</p>
          </section>
          <div className="home-actions">
            <button
              className="law-button"
              type="button"
              onClick={() => {
                const raw = exportStoredSave(TRIBUNAL_SAVE_KEY);
                if (raw !== null) download(raw, 'the-law-tribunal.json');
              }}
            >
              Exporter mon audience
            </button>
            {confirmDelete ? (
              <>
                <button className="law-button" type="button" onClick={() => { void clear(); setConfirmDelete(false); }}>Confirmer l’effacement</button>
                <button className="law-button ghost" type="button" onClick={() => setConfirmDelete(false)}>Annuler</button>
              </>
            ) : (
              <button className="law-button ghost" type="button" onClick={() => setConfirmDelete(true)}>Effacer cette audience</button>
            )}
          </div>
        </>
      )}
      <p className="mono">Les sauvegardes des anciennes éditions restent conservées séparément et ne sont pas effacées par ces commandes.</p>
    </main>
  );
}
