'use client';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import Link from 'next/link';
import {
  campaign,
  documents,
  prologueConclusion,
  rebirthContent as content,
  scenePlaces,
  speakers,
  type EvidenceDocument,
} from '../../content/rebirth';
import {
  evaluate,
  nextScene,
  replay,
  renderText,
  talkNode,
  talkOf,
  visibleReplies,
  type TalkReply,
} from '../../engine';
import {
  REBIRTH_SAVE_KEY,
  useT0GameStore as useStore,
} from '../../store/gameStoreT0';
import { Button } from '../primitives/Button';
import { Dialog } from '../primitives/Dialog';
import { Settings } from '../screens/Settings';
import { useInvestigationAudio } from '../player/AudioDirector';
import { ConversationChoice, EvidenceList } from './Controls';
import { DocumentSheet, Place, Portrait } from './Stage';
import styles from './t0.module.css';

export function ScenePlayerT0() {
  const { save, loaded, error, hydrate, start, append } = useStore();
  const state = useMemo(() => replay(save?.events ?? [], content), [save]);
  const scene = content.scenes.find((item) => item.id === state.currentSceneId);
  const talk = scene ? talkOf(scene) : null;
  const track = scene ? state.talk[scene.id] : null;
  const node = talk && track?.cursor ? talkNode(talk, track.cursor) : null;
  const place = scenePlaces[scene?.id ?? content.order[0]!]!;
  const audio = useInvestigationAudio(place.ambience);
  const [pause, setPause] = useState(false);
  const [settings, setSettings] = useState(false);
  const [notebook, setNotebook] = useState(false);
  const [reading, setReading] = useState<EvidenceDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const [audioNotice, setAudioNotice] = useState('');
  const working = useRef(false);
  const focus = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);
  const entering = useRef(false);
  const mounted = useRef(true);
  const activeDocument = node
    ? documents.find((document) => document.id === node.id)
    : undefined;
  const replies = scene && node ? visibleReplies(state, scene, node) : [];
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!loaded) void hydrate();
  }, [loaded, hydrate]);
  useEffect(() => {
    if (!loaded || save || error || started.current) return;
    started.current = true;
    void start({ reportingConsent: false }).catch(() => {
      started.current = false;
    });
  }, [loaded, save, error, start]);
  useEffect(() => {
    if (!save || state.currentSceneId || state.completed || entering.current)
      return;
    const first = nextScene(state, content);
    if (first) {
      entering.current = true;
      void append({
        type: 'scene_entered',
        sceneId: first.id,
        sceneVersion: first.version,
      })
        .catch(() => undefined)
        .finally(() => {
          entering.current = false;
        });
    }
  }, [save, state, append]);
  useEffect(() => {
    const follow = (event: StorageEvent) => {
      if (event.key === REBIRTH_SAVE_KEY) void hydrate();
    };
    window.addEventListener('storage', follow);
    return () => window.removeEventListener('storage', follow);
  }, [hydrate]);
  useEffect(() => {
    if (!activeDocument && !pause && !notebook && !settings)
      focus.current?.focus();
  }, [scene?.id, node?.id, activeDocument, pause, notebook, settings]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !activeDocument && !notebook && !settings) {
        event.preventDefault();
        setPause((value) => !value);
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [activeDocument, notebook, settings]);
  async function flight(action: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    try {
      await action();
    } catch {
      /* The store exposes persistence failures. */
    } finally {
      working.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const say = (reply: TalkReply) =>
    void flight(async () => {
      if (!scene || !node) return;
      audio.stopVoice();
      await append({
        type: 'line_chosen',
        sceneId: scene.id,
        sceneVersion: scene.version,
        nodeId: node.id,
        optionId: reply.id,
        mode: reply.silent ? 'silence' : 'reply',
        hesitationMs: 0,
      });
      const cue =
        reply.id === 'go'
          ? 'steps'
          : ['nora', 'keller'].includes(reply.id)
            ? 'phone'
            : reply.id === 'restore'
              ? 'electric'
              : 'paper';
      void audio.cue(cue);
    });
  const move = (skip = false) =>
    void flight(async () => {
      if (!scene) return;
      const latest = replay(useStore.getState().save?.events ?? [], content);
      if (latest.currentSceneId !== scene.id || latest.completed) return;
      audio.stopVoice();
      if (skip && !(scene.id in latest.choices))
        await append({ type: 'scene_skipped', sceneId: scene.id });
      else if (!(scene.id in latest.choices)) {
        const result = latest.talk[scene.id]?.end;
        if (!result) return;
        await append({
          type: 'choice_locked',
          sceneId: scene.id,
          sceneVersion: scene.version,
          input: 'talk',
          value: result,
          hesitationMs: 0,
          selectionChanges: 0,
        });
      }
      const current = replay(useStore.getState().save!.events, content);
      const next = nextScene(current, content);
      if (next)
        await append({
          type: 'scene_entered',
          sceneId: next.id,
          sceneVersion: next.version,
        });
      else await append({ type: 'run_completed', timelineId: 't0' });
      setPause(false);
      void audio.cue(next?.id.includes('couloir') ? 'door' : 'steps');
    });
  async function playMessage(full: boolean) {
    audio.stopVoice();
    const played = await audio.cue(full ? 'message' : 'message-intro');
    setAudioNotice(
      played
        ? 'Lecture de l’enregistrement. La transcription est visible.'
        : 'Active le son pour écouter. La transcription reste disponible.',
    );
  }
  const reduced = save?.settings.reducedMotion;
  const scale =
    save?.settings.textSize === 'large'
      ? 1.15
      : save?.settings.textSize === 'small'
        ? 0.9
        : 1;
  return (
    <main
      className={styles.frame}
      data-reduced={reduced === 'on' ? 'true' : undefined}
      style={{ '--scale': scale } as CSSProperties}
      aria-label={campaign.title}
    >
      <Place location={place.location} />
      <header className={styles.hud}>
        <Link href="/" className={styles.brand}>
          THE LAW: REBIRTH
        </Link>
        <nav aria-label="Commandes de jeu">
          <button type="button" onClick={() => setNotebook(true)}>
            Carnet
          </button>
          <button
            type="button"
            onClick={() => void audio.toggle()}
            aria-pressed={audio.enabled}
          >
            {audio.enabled ? 'Couper le son' : 'Activer le son'}
          </button>
          <button type="button" onClick={() => setPause(true)}>
            Pause
          </button>
          <Link href="/">Quitter</Link>
        </nav>
      </header>
      <aside className={styles.location}>
        <p className="mono">{place.time}</p>
        <p>{place.name}</p>
      </aside>
      <section className={styles.story} aria-busy={busy || !loaded}>
        <p className={styles.chapter}>{campaign.prologue}</p>
        <h1 ref={focus} tabIndex={-1}>
          {state.completed
            ? 'Le dossier reste ouvert.'
            : (scene?.title ?? 'Valombre')}
        </h1>
        {error && (
          <div role="alert">
            <p>{error}</p>
            <Link className="law-button" href="/ma-loi">
              Récupérer le journal
            </Link>
            <Button
              onClick={() =>
                void start({ replaceExisting: true, reportingConsent: false })
              }
            >
              Recommencer en archivant cette partie
            </Button>
          </div>
        )}
        {!loaded && <p>Ouverture du dossier…</p>}
        {state.completed ? (
          <>
            <p className={styles.ending}>Fin du prologue</p>
            {prologueConclusion(state).map((text) => (
              <p key={text}>{text}</p>
            ))}
            <p>{campaign.next}</p>
            <Link className="law-button" href="/ma-loi">
              Ouvrir le carnet de Gabriel
            </Link>
          </>
        ) : (
          <>
            <div
              className={styles.dialogue}
              aria-live="polite"
              aria-atomic="true"
              key={`${scene?.id}:${node?.id}`}
            >
              {node?.lines
                ?.filter(
                  (item) => !item.requires || evaluate(item.requires, state),
                )
                .map((item, index) => (
                  <div
                    key={index}
                    className={
                      item.who === 'narrator' ? styles.narration : styles.spoken
                    }
                  >
                    {item.who !== 'narrator' && (
                      <div className={styles.speaker}>
                        <Portrait
                          who={item.who}
                          name={speakers[item.who] ?? item.who}
                        />
                        <span>{speakers[item.who] ?? item.who}</span>
                      </div>
                    )}
                    <p>{renderText(item.text, state, content)}</p>
                  </div>
                ))}
            </div>
            {node?.id === 'broken' && (
              <button
                className="law-button ghost"
                disabled={!audio.enabled}
                onClick={() => void playMessage(false)}
              >
                Écouter le début du fichier
              </button>
            )}
            {!activeDocument && (
              <ConversationChoice
                replies={replies}
                onSay={say}
                disabled={busy || pause || notebook || settings}
              />
            )}
            {track?.end && (
              <Button onClick={() => move()} disabled={busy}>
                {scene?.id === content.flow.codaSceneId
                  ? 'Terminer le prologue'
                  : 'Poursuivre l’enquête'}
              </Button>
            )}
          </>
        )}
        {(audio.error || audioNotice) && (
          <p role="status">{audio.error || audioNotice}</p>
        )}
        <p className={styles.localSave}>
          {error
            ? 'Enregistrement interrompu.'
            : loaded && save
              ? 'Journal enregistré sur cet appareil.'
              : 'Chargement…'}
        </p>
      </section>
      {activeDocument && (
        <Dialog
          label={activeDocument.title}
          close={() => {
            const back = replies.find((reply) => reply.id === 'back');
            if (back && !busy) say(back);
          }}
        >
          <DocumentSheet
            document={activeDocument}
            play={
              activeDocument.audio ? () => void playMessage(true) : undefined
            }
            audioEnabled={audio.enabled}
          />
          <ConversationChoice replies={replies} onSay={say} disabled={busy} />
        </Dialog>
      )}
      {notebook && (
        <Dialog
          key={reading?.id ?? 'list'}
          label="Carnet de Gabriel"
          close={() => {
            audio.stopVoice();
            if (reading) setReading(null);
            else setNotebook(false);
          }}
        >
          {reading ? (
            <>
              <DocumentSheet
                document={reading}
                play={reading.audio ? () => void playMessage(true) : undefined}
                audioEnabled={audio.enabled}
              />
              <Button
                onClick={() => {
                  audio.stopVoice();
                  setReading(null);
                }}
              >
                Retour aux pièces
              </Button>
            </>
          ) : (
            <>
              <EvidenceList state={state} open={setReading} />
              <Link className="law-button ghost" href="/ma-loi">
                Journal, export et archives
              </Link>
              <Button onClick={() => setNotebook(false)}>
                Fermer le carnet
              </Button>
            </>
          )}
        </Dialog>
      )}
      {pause && !activeDocument && !settings && (
        <Dialog label="Pause" close={() => setPause(false)}>
          <h2 className="serif">L’enquête attend.</h2>
          <div className={styles.pauseActions}>
            <Button onClick={() => setPause(false)}>Reprendre</Button>
            <Button
              onClick={() => {
                setPause(false);
                setSettings(true);
              }}
            >
              Réglages
            </Button>
            {!state.completed && (
              <Button disabled={busy} onClick={() => move(true)}>
                Passer cette scène
              </Button>
            )}
            <Link className="law-button ghost" href="/">
              Quitter l’enquête
            </Link>
          </div>
        </Dialog>
      )}
      {settings && (
        <Settings
          close={() => setSettings(false)}
          store={useStore}
          label={campaign.title}
        />
      )}
    </main>
  );
}
