'use client';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  campaign,
  prologueConclusion,
  rebirthContent,
  type EvidenceDocument,
} from '../../src/content/rebirth';
import { replay } from '../../src/engine';
import {
  exportStoredSave,
  listRecoveryCopies,
} from '../../src/persistence/localStorageAdapter';
import { REBIRTH_SAVE_KEY, useT0GameStore } from '../../src/store/gameStoreT0';
import { Button } from '../../src/ui/primitives/Button';
import { Dialog } from '../../src/ui/primitives/Dialog';
import { EvidenceList } from '../../src/ui/t0/Controls';
import { DocumentSheet } from '../../src/ui/t0/Stage';

const legacyKeys = [
  'thelaw:save-t0',
  'thelaw:save',
  'thelaw:save-t2',
  'thelaw:save-t3',
];
function download(raw: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([raw], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function Notebook() {
  const { save, loaded, error, hydrate, clear } = useT0GameStore();
  const state = useMemo(
    () => replay(save?.events ?? [], rebirthContent),
    [save],
  );
  const [reading, setReading] = useState<EvidenceDocument | null>(null);
  const [erasing, setErasing] = useState(false);
  useEffect(() => {
    if (!loaded) void hydrate();
  }, [loaded, hydrate]);
  const archiveSnapshot = useSyncExternalStore(
    (listener) => {
      window.addEventListener('storage', listener);
      return () => window.removeEventListener('storage', listener);
    },
    () =>
      JSON.stringify({
        legacy: legacyKeys.filter((key) => localStorage.getItem(key) !== null),
        copies: listRecoveryCopies(REBIRTH_SAVE_KEY),
      }),
    () => '{"legacy":[],"copies":[]}',
  );
  const { legacy, copies } = useMemo(
    () =>
      JSON.parse(archiveSnapshot) as {
        legacy: string[];
        copies: ReturnType<typeof listRecoveryCopies>;
      },
    [archiveSnapshot],
  );
  function exportKey(key: string, label: string) {
    const raw = exportStoredSave(key);
    if (raw !== null) download(raw, label);
  }
  return (
    <main className="law-page rebirth-notebook">
      <header className="site-top">
        <Link className="law-button ghost" href="/">
          THE LAW: REBIRTH
        </Link>
        <Link className="law-button" href="/jouer/t0">
          Reprendre l’enquête
        </Link>
      </header>
      <h1 className="serif">Le carnet de Gabriel</h1>
      <p>{campaign.title}</p>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <Button
            onClick={() =>
              exportKey(REBIRTH_SAVE_KEY, 'rebirth-journal-a-recuperer.json')
            }
          >
            Exporter le journal illisible
          </Button>
        </div>
      )}
      {loaded && !save && !error && (
        <p>Aucune enquête enregistrée dans cette édition.</p>
      )}
      {save && (
        <>
          <EvidenceList state={state} open={setReading} />
          <section>
            <h2 className="serif">Ce que le dossier permet d’établir</h2>
            {prologueConclusion(state).map((text) => (
              <p key={text}>{text}</p>
            ))}
          </section>
          <section>
            <h2 className="serif">Notes de travail</h2>
            {state.notes.length === 0 ? (
              <p>Aucune note consignée.</p>
            ) : (
              <ol>
                {state.notes.map((note) => (
                  <li key={note.id}>
                    <p>
                      <span className="mono">
                        {note.status === 'fact'
                          ? 'Pièce'
                          : note.status === 'inference'
                            ? 'Hypothèse'
                            : 'Déclaration'}
                      </span>{' '}
                      — {note.text}
                    </p>
                    <p className="mono">
                      {
                        rebirthContent.scenes.find(
                          (scene) => scene.id === note.sceneId,
                        )?.title
                      }
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <div className="home-actions">
            <Button
              onClick={() =>
                exportKey(REBIRTH_SAVE_KEY, 'rebirth-enquete.json')
              }
            >
              Exporter l’enquête
            </Button>
            {erasing ? (
              <>
                <Button
                  className="signal"
                  onClick={async () => {
                    await clear();
                    setErasing(false);
                  }}
                >
                  Confirmer l’effacement
                </Button>
                <Button onClick={() => setErasing(false)}>Annuler</Button>
              </>
            ) : (
              <Button className="ghost" onClick={() => setErasing(true)}>
                Effacer cette enquête
              </Button>
            )}
          </div>
        </>
      )}
      {copies.length > 0 && (
        <details>
          <summary>Copies locales de récupération</summary>
          {copies.map((copy) => (
            <p key={copy.key}>
              <Button
                onClick={() =>
                  exportKey(copy.key, `rebirth-archive-${copy.createdAt}.json`)
                }
              >
                Exporter la copie du{' '}
                {new Date(copy.createdAt).toLocaleString('fr-FR')}
              </Button>
            </p>
          ))}
        </details>
      )}
      <details>
        <summary>Récupérer une sauvegarde de l’ancienne édition</summary>
        <p>
          Les anciennes parties restent isolées. Elles ne sont ni converties en
          actes de Gabriel ni effacées par cette édition.
        </p>
        {legacy.length ? (
          legacy.map((key, index) => (
            <p key={key}>
              <Button
                onClick={() =>
                  exportKey(key, `the-law-ancienne-edition-${index}.json`)
                }
              >
                Exporter l’archive {index + 1}
              </Button>
            </p>
          ))
        ) : (
          <p>Aucune ancienne sauvegarde sur cet appareil.</p>
        )}
      </details>
      {reading && (
        <Dialog label={reading.title} close={() => setReading(null)}>
          <DocumentSheet document={reading} />
          <Button onClick={() => setReading(null)}>Fermer la pièce</Button>
        </Dialog>
      )}
    </main>
  );
}
