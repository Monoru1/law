'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  campaign,
  speakers,
  tribunalContent as content,
} from '../../content/tribunal';
import {
  nextScene,
  replay,
  renderText,
  talkNode,
  talkOf,
  visibleLines,
  visibleReplies,
  type TalkReply,
} from '../../engine';
import {
  TRIBUNAL_SAVE_KEY,
  useTribunalGameStore as useStore,
} from '../../store/gameStoreTribunal';
import { Button } from '../primitives/Button';
import { Dialog } from '../primitives/Dialog';
import { Settings } from '../screens/Settings';
import styles from './tribunal.module.css';

export function ScenePlayerTribunal() {
  const { save, loaded, error, hydrate, start, append } = useStore();
  const state = useMemo(() => replay(save?.events ?? [], content), [save]);
  const scene = content.scenes.find((item) => item.id === state.currentSceneId);
  const talk = scene ? talkOf(scene) : null;
  const track = scene ? state.talk[scene.id] : null;
  const node = talk && track?.cursor ? talkNode(talk, track.cursor) : null;
  const [pause, setPause] = useState(false);
  const [settings, setSettings] = useState(false);
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const focus = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);
  const entering = useRef(false);
  const mounted = useRef(true);
  const replies = scene && node ? visibleReplies(state, scene, node) : [];
  // Every node narrated since the last answer, not only the single node at
  // the cursor — see the comment on `visibleLines` in src/engine/talk.ts.
  const lines = scene ? visibleLines(state, scene) : [];
  // The room lights only once the player has moved past the opening beat of
  // darkness (scene `tribunal.ouverture`, node `noir`). A reload during that
  // first beat stays dark; anything past it is lit.
  const lit = !!node && node.id !== 'noir';

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
      if (event.key === TRIBUNAL_SAVE_KEY) void hydrate();
    };
    window.addEventListener('storage', follow);
    return () => window.removeEventListener('storage', follow);
  }, [hydrate]);
  useEffect(() => {
    if (!pause && !settings) focus.current?.focus();
  }, [scene?.id, node?.id, pause, settings]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !settings) {
        event.preventDefault();
        setPause((value) => !value);
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [settings]);

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
      await append({
        type: 'line_chosen',
        sceneId: scene.id,
        sceneVersion: scene.version,
        nodeId: node.id,
        optionId: reply.id,
        mode: reply.silent ? 'silence' : 'reply',
        hesitationMs: 0,
      });
    });
  const move = () =>
    void flight(async () => {
      if (!scene) return;
      const latest = replay(useStore.getState().save?.events ?? [], content);
      if (latest.currentSceneId !== scene.id || latest.completed) return;
      if (!(scene.id in latest.choices)) {
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
    });

  return (
    <main className={styles.frame} aria-label={campaign.title}>
      <div className={styles.room} data-lit={lit ? 'true' : 'false'} />
      <header className={styles.hud}>
        <Link href="/" className={styles.brand}>
          THE LAW: REBIRTH
        </Link>
        <nav aria-label="Commandes de jeu">
          <button type="button" onClick={() => setPause(true)}>
            Pause
          </button>
          <Link href="/">Quitter</Link>
        </nav>
      </header>
      <section className={styles.story} aria-busy={busy || !loaded}>
        <h1 ref={focus} tabIndex={-1}>
          {state.completed
            ? 'L’audience est suspendue.'
            : (scene?.title ?? 'Le Tribunal')}
        </h1>
        {error && (
          <div role="alert">
            <p>{error}</p>
            <Button
              onClick={() =>
                void start({ replaceExisting: true, reportingConsent: false })
              }
            >
              Recommencer en archivant cette partie
            </Button>
          </div>
        )}
        {!loaded && <p>Ouverture de l’audience…</p>}
        {state.completed ? (
          <>
            <p>{campaign.next}</p>
            <Link className="law-button" href="/ma-loi">
              Ouvrir le carnet
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
              {lines.map((item, index) => (
                <div
                  key={index}
                  className={
                    item.who === 'narrator' ? styles.narration : styles.spoken
                  }
                >
                  {item.who !== 'narrator' && (
                    <div className={styles.speaker}>
                      <span>{speakers[item.who] ?? item.who}</span>
                    </div>
                  )}
                  <p>{renderText(item.text, state, content)}</p>
                </div>
              ))}
            </div>
            {replies.length > 0 && (
              <ol className={styles.replies} aria-label="Actions disponibles">
                {replies.map((reply, index) => (
                  <li key={reply.id}>
                    <button
                      type="button"
                      className={styles.reply}
                      data-reply={reply.id}
                      disabled={busy || pause || settings}
                      onClick={() => say(reply)}
                    >
                      <span className={styles.replyIndex} aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>{reply.label}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
            {track?.end && (
              <Button
                className={styles.continue}
                onClick={() => move()}
                disabled={busy}
              >
                {scene?.id === content.flow.codaSceneId
                  ? 'Clore l’audience'
                  : 'Continuer'}
              </Button>
            )}
          </>
        )}
        <p className={styles.localSave}>
          {error
            ? 'Enregistrement interrompu.'
            : loaded && save
              ? 'Journal enregistré sur cet appareil.'
              : 'Chargement…'}
        </p>
      </section>
      {pause && !settings && (
        <Dialog label="Pause" close={() => setPause(false)}>
          <h2 className="serif">L’audience attend.</h2>
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
            <Link className="law-button ghost" href="/">
              Quitter
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
