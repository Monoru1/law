'use client';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { contentT0 } from '../../content/t0';
import {
  beatDelay,
  clockStart,
  matchOutcome,
  nextScene,
  renderText,
  replay,
  resolveScene,
  resolvedBeats,
  talkNode,
  talkOf,
  visibleReplies,
  type TalkReply,
} from '../../engine';
import { useT0GameStore } from '../../store/gameStoreT0';
import { Button } from '../primitives/Button';
import { Dialog } from '../primitives/Dialog';
import { Settings } from '../screens/Settings';
import { AudioDirector } from '../player/AudioDirector';
import { ConversationChoice, TimedBar, WriteBox } from './Controls';
import { DialogueLine, Place, TitleCard } from './Stage';
import { envOf, talkSegments } from './talkView';
import styles from './t0.module.css';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function useReduced(setting: 'auto' | 'on' | 'off') {
  const [system, setSystem] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystem(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return setting === 'on' || (setting === 'auto' && system);
}

// One gesture at a time: a double click must not answer twice.
function useSingleFlight() {
  const busy = useRef(false);
  return useCallback(async (action: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await action();
    } catch {
      /* The store keeps the journal intact and exposes the error. */
    } finally {
      busy.current = false;
    }
  }, []);
}

const FRESH_MS = 6000;
const wallNow = () => Date.now();
const tick = () => performance.now();

export function ScenePlayerT0() {
  const content = contentT0;
  const router = useRouter();
  const useStore = useT0GameStore;
  const save = useStore((s) => s.save);
  const loaded = useStore((s) => s.loaded);
  const error = useStore((s) => s.error);
  const incompatible = useStore((s) => s.incompatible);
  const hydrate = useStore((s) => s.hydrate);
  const append = useStore((s) => s.append);
  const start = useStore((s) => s.start);
  const flight = useSingleFlight();
  const started = useRef(false);

  useEffect(() => {
    if (!loaded) void hydrate();
  }, [loaded, hydrate]);
  // Another tab may have played on: follow the stored journal, never fork it.
  useEffect(() => {
    const follow = (event: StorageEvent) => {
      if (event.key?.startsWith('thelaw:save')) void hydrate();
    };
    window.addEventListener('storage', follow);
    return () => window.removeEventListener('storage', follow);
  }, [hydrate]);
  // No menu: the examination begins when the door opens.
  useEffect(() => {
    if (!loaded || save || incompatible || started.current) return;
    started.current = true;
    void start({}).catch(() => {
      started.current = false;
    });
  }, [loaded, save, incompatible, start]);

  const state = useMemo(
    () => replay(save?.events ?? [], content),
    [save, content],
  );
  useEffect(() => {
    if (!loaded || !save || state.completed || state.currentSceneId) return;
    const first = nextScene(state, content);
    if (first)
      void append({
        type: 'scene_entered',
        sceneId: first.id,
        sceneVersion: first.version,
      }).catch(() => undefined);
    else if (state.events.some((e) => e.type === 'scene_entered'))
      void append({
        type: 'run_completed',
        timelineId: content.timelineId,
      }).catch(() => undefined);
  }, [loaded, save, state, append, content]);

  const raw = content.scenes.find((s) => s.id === state.currentSceneId);
  const scene = raw ? resolveScene(raw, state) : null;
  const talk = scene ? talkOf(scene) : null;
  const track = scene ? state.talk[scene.id] : undefined;
  const chosen = scene && scene.id in state.choices;
  const visit = state.events.findLast((e) => e.type === 'scene_entered');
  const visitId = visit?.id ?? null;
  const reduced = useReduced(save?.settings.reducedMotion ?? 'auto');
  const segments = useMemo(
    () => (scene ? talkSegments(scene, state, content) : []),
    [scene, state, content],
  );

  const [shown, setShown] = useState(0);
  const [instant, setInstant] = useState(false);
  const [readyFor, setReadyFor] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const [settings, setSettings] = useState(false);
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const shownAt = useRef(0);

  if (visitId !== lastVisit) {
    // A journal picked up again shows what was already said, without
    // replaying it; a scene just entered plays from its first word.
    const resumed = visit ? wallNow() - visit.at > FRESH_MS : false;
    setLastVisit(visitId);
    setShown(resumed ? segments.length : 0);
    setInstant(resumed);
    setReadyFor('');
    setLeaving(false);
  }

  // Reveal: each line waits as long as the one before it takes to read.
  useEffect(() => {
    if (shown >= segments.length) return;
    const next = segments[shown]!;
    const before = segments[shown - 1];
    const delay = instant
      ? 0
      : next.kind === 'reply'
        ? 0
        : !before
          ? 600
          : before.kind === 'reply'
            ? before.mode === 'silence'
              ? 1900
              : 850
            : beatDelay({ text: before.text, pauseMs: before.pauseMs });
    const timer = setTimeout(() => setShown((n) => n + 1), delay);
    return () => clearTimeout(timer);
  }, [shown, segments, instant]);

  // The last line is given its own breath before anything can be answered.
  const key = `${visitId}:${segments.length}:${state.lines.length}`;
  useEffect(() => {
    if (shown < segments.length || readyFor === key) return;
    const last = segments.at(-1);
    const wait =
      instant || !last
        ? 0
        : last.kind === 'reply'
          ? 0
          : beatDelay({ text: last.text, pauseMs: last.pauseMs });
    const timer = setTimeout(() => setReadyFor(key), wait);
    return () => clearTimeout(timer);
  }, [shown, segments, readyFor, key, instant]);
  const ready = shown >= segments.length && readyFor === key;

  useEffect(() => {
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: reduced || instant ? 'auto' : 'smooth',
    });
  }, [shown, ready, reduced, instant]);

  const node = talk && track?.cursor ? talkNode(talk, track.cursor) : undefined;
  const replies = scene && node?.ask ? visibleReplies(state, scene, node) : [];
  const answering = Boolean(ready && node && !chosen && !leaving);
  useEffect(() => {
    if (answering) shownAt.current = tick();
  }, [answering, node?.id, state.lines.length]);

  const say = useCallback(
    (
      optionId: string,
      mode: 'reply' | 'silence' | 'timeout' | 'written' | 'declined',
      text?: string,
    ) =>
      flight(async () => {
        if (!scene || !node) return;
        await append({
          type: 'line_chosen',
          sceneId: scene.id,
          sceneVersion: scene.version,
          nodeId: node.id,
          optionId,
          mode,
          hesitationMs: Math.max(0, Math.round(tick() - shownAt.current)),
          ...(text ? { text } : {}),
        });
      }),
    [flight, scene, node, append],
  );
  const reply = (r: TalkReply) => say(r.id, r.silent ? 'silence' : 'reply');

  // The conversation has run its course: lock the outcome it ended on.
  const ended = Boolean(track && track.cursor === null && track.end !== null);
  useEffect(() => {
    if (!scene || !ended || chosen || !ready || !track?.end) return;
    const end = track.end;
    const timer = setTimeout(
      () =>
        void flight(async () => {
          await append({
            type: 'choice_locked',
            sceneId: scene.id,
            sceneVersion: scene.version,
            input: 'talk',
            value: end,
            hesitationMs: 0,
            selectionChanges: 0,
          });
        }),
      instant ? 0 : 900,
    );
    return () => clearTimeout(timer);
  }, [scene, ended, chosen, ready, track?.end, flight, append, instant]);

  const advance = useCallback(async () => {
    if (!scene) return;
    const latest = replay(useStore.getState().save?.events ?? [], content);
    const current = latest.events.findLast((e) => e.type === 'scene_entered');
    if (latest.completed || (current?.id ?? null) !== visitId) return;
    const next = nextScene(latest, content);
    if (next)
      await append({
        type: 'scene_entered',
        sceneId: next.id,
        sceneVersion: next.version,
      });
    else
      await append({ type: 'run_completed', timelineId: content.timelineId });
  }, [scene, append, content, useStore, visitId]);
  const leave = () =>
    flight(async () => {
      setLeaving(true);
      await sleep(reduced ? 150 : 750);
      await advance();
    });
  const leaveNow = useRef(leave);
  useEffect(() => {
    leaveNow.current = leave;
  });

  const outcome =
    scene && chosen
      ? scene.outcomes.find((o) => matchOutcome(o, state.choices[scene.id]!))
      : undefined;
  const cardLines = outcome
    ? resolvedBeats(outcome.beats, state).map((b) =>
        renderText(b.text, state, content),
      )
    : [];
  const cardHold = 2600 + Math.max(0, cardLines.length - 1) * 1200;
  useEffect(() => {
    if (!chosen || leaving) return;
    const timer = setTimeout(
      () => void leaveNow.current(),
      cardLines.length ? cardHold : instant ? 0 : 500,
    );
    return () => clearTimeout(timer);
  }, [chosen, leaving, cardLines.length, cardHold, instant, visitId]);

  // A clock that runs by itself (the call): read from the journal's start
  // line, shown as minutes, and when it ends whatever waits is recorded as such.
  const clock = talk?.clock;
  const clockFrom = scene && clock ? clockStart(state, scene) : null;
  const [wall, setWall] = useState(0);
  useEffect(() => {
    if (clockFrom === null) return;
    const id = setInterval(() => setWall(wallNow()), 500);
    return () => clearInterval(id);
  }, [clockFrom]);
  const remaining =
    clock && clockFrom !== null && wall ? clock.ms - (wall - clockFrom) : null;
  useEffect(() => {
    if (remaining !== null && remaining <= 0 && answering)
      void say('timeout', 'timeout');
  }, [remaining, answering, say]);
  const canWrite = Boolean(node?.write) && answering;
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setPaused((p) => !p);
        return;
      }
      const target = event.target;
      if (
        !answering ||
        !replies.length ||
        (target instanceof HTMLElement &&
          target.matches('input, textarea, select'))
      )
        return;
      const index = Number(event.key) - 1;
      const chosenReply = replies[index];
      if (chosenReply && !chosenReply.hold) {
        event.preventDefault();
        void reply(chosenReply);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  if (!loaded) return <main className={styles.end} aria-busy="true" />;
  if (incompatible)
    return (
      <main className={styles.end}>
        <p className="serif">
          Cette partie utilise une autre version. Elle reste conservée sur cet
          appareil.
        </p>
        <Button
          onClick={() => {
            started.current = true;
            void start({ replaceExisting: true });
          }}
        >
          Recommencer
        </Button>
        <Link href="/">Retour à l’accueil</Link>
      </main>
    );
  if (state.completed)
    return (
      <main className={styles.end}>
        <p className="mono">THE LAW</p>
        <Link href="/">Retour à l’accueil</Link>
      </main>
    );

  const scale =
    save?.settings.textSize === 'large'
      ? 1.15
      : save?.settings.textSize === 'small'
        ? 0.88
        : 1;
  const write = node?.write;
  return (
    <main
      className={styles.frame}
      data-leaving={leaving ? 'true' : undefined}
      data-reduced={reduced ? 'true' : undefined}
      style={{ '--scale': scale } as CSSProperties}
      aria-label="L’Examen"
    >
      <AudioDirector content={content} useStore={useStore} />
      <Place env={envOf(scene?.audio?.ambience)} />
      <button
        type="button"
        className={styles.pause}
        onClick={() => setPaused(true)}
        aria-label="Pause"
      >
        PAUSE
      </button>
      {remaining !== null && !chosen && (
        <div
          className={styles.clock}
          role="timer"
          aria-label="Temps de l’appel"
        >
          {String(Math.floor(Math.max(0, remaining) / 60000)).padStart(2, '0')}:
          {String(Math.floor((Math.max(0, remaining) % 60000) / 1000)).padStart(
            2,
            '0',
          )}
        </div>
      )}
      <div className={styles.log} ref={logRef}>
        <div className={styles.inner} role="log" aria-live="polite">
          {segments.slice(0, shown).map((segment, index) => {
            const distance = shown - 1 - index;
            return (
              <DialogueLine
                key={segment.key}
                segment={segment}
                age={distance < 3 ? 0 : distance < 5 ? 1 : distance < 8 ? 2 : 3}
                instant={instant || reduced}
              />
            );
          })}
        </div>
      </div>
      <div className={styles.controls}>
        {error && (
          <p role="alert" className="mono">
            {error}
          </p>
        )}
        {answering && node?.ask && replies.length > 0 && (
          <>
            <ConversationChoice
              key={key}
              replies={replies}
              onSay={(r) => void reply(r)}
              disabled={false}
            />
            {node.ask.timeoutMs && (
              <TimedBar
                key={`${key}:${node.id}`}
                ms={node.ask.timeoutMs}
                reduced={reduced}
                onExpire={() => void say('timeout', 'timeout')}
              />
            )}
          </>
        )}
        {canWrite && write && (
          <WriteBox
            key={key}
            prompt={write.prompt}
            placeholder={write.placeholder}
            maxLength={write.maxLength}
            declineLabel={write.declineLabel ?? 'Ne rien écrire'}
            disabled={false}
            onWrite={(text) => void say('written', 'written', text)}
            onDecline={() => void say('declined', 'declined')}
          />
        )}
      </div>
      {chosen && cardLines.length > 0 && <TitleCard lines={cardLines} />}
      {paused && !settings && (
        <Dialog label="Pause" close={() => setPaused(false)}>
          <p className="mono">L’EXAMEN</p>
          <div
            className="stack"
            style={{ display: 'grid', gap: 12, marginTop: 24 }}
          >
            <Button onClick={() => setPaused(false)}>Reprendre</Button>
            <Button className="ghost" onClick={() => setSettings(true)}>
              Réglages
            </Button>
            <Button
              className="ghost"
              onClick={() =>
                void flight(async () => {
                  if (!scene) return;
                  await append({ type: 'scene_skipped', sceneId: scene.id });
                  setPaused(false);
                  await advance();
                })
              }
            >
              Passer cette scène
            </Button>
            <Button className="ghost" onClick={() => router.push('/')}>
              Quitter
            </Button>
          </div>
        </Dialog>
      )}
      {paused && settings && (
        <Settings
          close={() => setSettings(false)}
          store={useStore}
          label="THE LAW / 00"
        />
      )}
    </main>
  );
}
