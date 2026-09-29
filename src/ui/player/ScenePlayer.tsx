'use client';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { content as defaultContent, copy } from '../../content';
import {
  dominantUnsignedPrinciple,
  lawStatement,
  matchOutcome,
  nextLawNumber,
  nextScene,
  outcomeCadence,
  REST_SETTLE_MS,
  replay,
  resolveScene,
  resolvedBeats,
  sceneOptions,
  visitStage,
  type Content,
  type GameEvent,
  type Scene,
} from '../../engine';
import { useGameStore } from '../../store/gameStore';
import type { UseBoundStore, StoreApi } from 'zustand';
import type { GameStore } from '../../store/createGameStore';
import {
  canAutoSend,
  releaseSend,
  submitReport,
  tryClaimSend,
} from '../../reporting/sendGate';
import { Button } from '../primitives/Button';
import { Dialog } from '../primitives/Dialog';
import { BeatRenderer } from './BeatRenderer';
import { GlyphInput } from './inputs/GlyphInput';
import { Room } from '../stage/Room';
import { Settings } from '../screens/Settings';
import { End } from '../screens/End';
import { Onboarding } from '../screens/Onboarding';
type Phase = 'scene' | 'outcome' | 'law' | 'revision' | 'sealed';
// The law page and the revision page are opened by the player; every other
// phase is read from the journal, so a reload returns to the same place.
type Overlay = 'law' | 'revision' | null;
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
function useTimeTracker({ reset }: { reset: string }) {
  const started = useRef(0);
  const paused = useRef(0);
  const hidden = useRef<number | null>(null);
  const changes = useRef(0);
  useEffect(() => {
    started.current = performance.now();
    paused.current = 0;
    changes.current = 0;
    hidden.current = null;
  }, [reset]);
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) hidden.current = performance.now();
      else if (hidden.current !== null) {
        paused.current += performance.now() - hidden.current;
        hidden.current = null;
      }
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  return {
    mark: () => {
      changes.current++;
    },
    read: () => ({
      hesitationMs: Math.round(
        Math.max(
          0,
          performance.now() -
            started.current -
            paused.current -
            (hidden.current !== null ? performance.now() - hidden.current : 0),
        ),
      ),
      selectionChanges: Math.max(0, changes.current - 1),
    }),
  };
}
const ordinals = ['première', 'deuxième', 'troisième', 'quatrième'];
// What the player committed, in their own terms, kept above its consequence.
function decisionTrace(
  scene: Scene,
  event: Extract<GameEvent, { type: 'choice_locked' }> | undefined,
  justification: string | undefined,
): string | null {
  if (!event) return null;
  const input = scene.input;
  if (input.kind === 'freeText')
    return justification
      ? `«\u00a0${justification}\u00a0»`
      : 'Je préfère ne pas répondre';
  if (input.kind === 'slider')
    return event.value === 0
      ? (input.zeroLabel ?? '0')
      : input.labelTemplate.replace('{{n}}', String(event.value));
  if (input.kind === 'confrontation')
    return (
      copy.confrontation[event.value as keyof typeof copy.confrontation] ?? null
    );
  if (input.kind === 'lawProposal')
    return event.value === 'silence'
      ? copy.confrontation.silence
      : event.value === 'no'
        ? copy.confrontation.unsignedNo
        : null;
  return sceneOptions(scene).get(String(event.value))?.label ?? null;
}
// The way on under a resting consequence: small, textual, focused so that
// Enter or Space continue, and never a second decision.
function RestAdvance({ onAdvance }: { onAdvance: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    ref.current?.scrollIntoView({ block: 'nearest' });
  }, []);
  const advance = () => {
    // A browser double-click can retarget its second press after this button
    // unmounts. Swallow only that immediate pointer press so it cannot select
    // or activate the next scene; normal narrative selection remains intact.
    const blockRetargetedPress = (event: PointerEvent) => {
      event.preventDefault();
      window.getSelection()?.removeAllRanges();
    };
    document.addEventListener('pointerdown', blockRetargetedPress, {
      capture: true,
      once: true,
    });
    window.setTimeout(
      () =>
        document.removeEventListener('pointerdown', blockRetargetedPress, true),
      600,
    );
    onAdvance();
  };
  return (
    <div className="rest">
      <button
        ref={ref}
        type="button"
        className="rest-advance mono"
        aria-label={copy.next}
        onClick={advance}
      >
        {copy.next}
        <span aria-hidden="true">{'\u00a0→'}</span>
      </button>
    </div>
  );
}
// True once the settle has passed since the key last changed.
function useSettled(key: string, active: boolean) {
  const [settledKey, setSettledKey] = useState<string | null>(null);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setSettledKey(key), REST_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [key, active]);
  return active && settledKey === key;
}
function createSingleFlight() {
  let busy = false;
  return async (action: () => Promise<void>) => {
    if (busy) return;
    busy = true;
    try {
      await action();
    } catch {
      /* The store keeps the journal intact and exposes the error. */
    } finally {
      busy = false;
    }
  };
}
export function ScenePlayer({
  content = defaultContent,
  useStore = useGameStore as UseBoundStore<StoreApi<GameStore>>,
  threshold,
}: {
  content?: Content;
  useStore?: UseBoundStore<StoreApi<GameStore>>;
  // Shown instead of the first onboarding when no run exists yet.
  threshold?: ReactNode;
} = {}) {
  const door =
    copy.doors.find((d) => d.timelineId === content.timelineId) ??
    copy.doors[0];
  const timelineNumber = String(
    Number(door.timelineId.slice(1)),
  ).padStart(2, '0');
  const router = useRouter();
  const save = useStore((s) => s.save);
  const loaded = useStore((s) => s.loaded);
  const error = useStore((s) => s.error);
  const hydrate = useStore((s) => s.hydrate);
  const append = useStore((s) => s.append);
  const start = useStore((s) => s.start);
  const setReportingStatus = useStore((s) => s.setReportingStatus);
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
  const state = useMemo(
    () => replay(save?.events ?? [], content),
    [save, content],
  );

  // Envoi automatique du rapport de playtest après run_completed.
  // Statut persisté dans la sauvegarde (reportingStatus) : survit au
  // rafraîchissement de page et à la navigation vers "Ma loi" et retour.
  const completionEvent = save?.events.find((e) => e.type === 'run_completed');
  const completionEventId = completionEvent?.id ?? null;
  useEffect(() => {
    if (!save || !completionEventId) return;
    if (
      !canAutoSend({
        reportingConsent: save.reportingConsent,
        reportingStatus: save.reportingStatus,
      })
    )
      return;
    if (!tryClaimSend(save.runId)) return;
    const runId = save.runId;
    void submitReport(save, setReportingStatus).finally(() =>
      releaseSend(runId),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    completionEventId,
    save?.runId,
    save?.reportingConsent,
    save?.reportingStatus,
  ]);

  const current = content.scenes.find((s) => s.id === state.currentSceneId);
  const scene = current ? resolveScene(current, state) : null;
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [previousVisitId, setPreviousVisitId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // The consequence of a decision has been shown and now rests.
  const [resting, setResting] = useState(false);
  const [selected, setSelected] = useState<string>('');
  const [value, setValue] = useState(0);
  const [answer, setAnswer] = useState('');
  const [pause, setPause] = useState(false);
  const [settings, setSettings] = useState(false);
  const [variant, setVariant] = useState('');
  const [custom, setCustom] = useState('');
  const [pulse, setPulse] = useState(false);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const choiceArea = useRef<HTMLDivElement>(null);
  // One commit at a time: a double click must not record, or skip, twice.
  const [singleFlight] = useState(createSingleFlight);
  const reduced = useReduced(save?.settings.reducedMotion ?? 'auto');
  const tracker = useTimeTracker({ reset: `${scene?.id}:${ready}` });
  // Physical acknowledgement: THE LAW registers a committed decision with a
  // brief, restrained surface pulse. Silent under reduced motion.
  const flashLock = useCallback(() => {
    if (reduced) return;
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    setPulse(true);
    pulseTimer.current = setTimeout(() => setPulse(false), 260);
  }, [reduced]);
  useEffect(
    () => () => {
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!loaded || !save || state.completed || state.currentSceneId) return;
    const first = nextScene(state, content);
    if (first)
      void append({
        type: 'scene_entered',
        sceneId: first.id,
        sceneVersion: first.version,
      });
    else if (state.events.some((e) => e.type === 'scene_entered'))
      void append({
        type: 'run_completed',
        timelineId: content.timelineId,
      }).catch(() => undefined);
  }, [loaded, save, state, append, content]);
  const sceneId = scene?.id ?? null;
  const visit = state.events.findLast(
    (event) => event.type === 'scene_entered',
  );
  const visitId = visit?.id ?? null;
  if (visitId !== previousVisitId) {
    setPreviousVisitId(visitId);
    setReady(false);
    setResting(false);
    setOverlay(null);
    setSelected('');
    setValue(0);
    setAnswer('');
    setVariant('');
    setCustom('');
  }
  const stage = sceneId ? visitStage(state.events, sceneId) : 'deciding';
  const phase: Phase =
    overlay ??
    (stage === 'sealed'
      ? 'sealed'
      : stage === 'consequence'
        ? 'outcome'
        : 'scene');
  const visitEvents = state.events.slice(
    state.events.findLastIndex((event) => event.type === 'scene_entered') + 1,
  );
  const sealedSettled = useSettled(`${visitId}:sealed`, phase === 'sealed');
  useEffect(() => {
    if (!visitId) return;
    window.scrollTo({
      top: 0,
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [visitId, phase, reduced]);
  useEffect(() => {
    if (!ready || phase !== 'scene') return;
    choiceArea.current?.scrollIntoView({
      block: 'nearest',
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [ready, phase, reduced]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setPause((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  // Moves on from one visit only: a second activation that lands after the
  // journal has moved on (double click, key repeat) finds a newer visit and
  // does nothing, so no scene is ever skipped.
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
      await append({
        type: 'run_completed',
        timelineId: content.timelineId,
      });
  }, [scene, append, content, useStore, visitId]);
  const chosen =
    scene && scene.id in state.choices ? state.choices[scene.id] : null;
  const outcome = scene?.outcomes.find(
    (o) => chosen !== null && matchOutcome(o, chosen!),
  );
  const lawNumber =
    state.pendingConfrontations[0]?.lawNumber ??
    state.events.findLast((e) => e.type === 'confrontation_answered')
      ?.lawNumber ??
    undefined;
  const beats = scene
    ? resolvedBeats(
        phase === 'outcome' ? (outcome?.beats ?? []) : scene.beats,
        state,
      )
    : [];
  const record = async (
    input: Scene['input']['kind'],
    choice: string | number,
    text?: string,
  ) => {
    if (!scene) return;
    flashLock();
    const metrics = tracker.read();
    if (input === 'freeText') {
      if (text?.trim())
        await append({
          type: 'justification_given',
          sceneId: scene.id,
          text: text.trim().slice(0, 280),
        });
      else await append({ type: 'justification_declined', sceneId: scene.id });
    }
    await append({
      type: 'choice_locked',
      sceneId: scene.id,
      sceneVersion: scene.version,
      input,
      value: choice,
      ...metrics,
    });
    setReady(false);
    setOverlay(null);
  };
  const lock = (...args: Parameters<typeof record>) =>
    singleFlight(() => record(...args));
  const certaintyPending = Boolean(
    scene?.followUps?.includes('certainty') && !(scene.id in state.certainty),
  );
  // After a consequence: the law it proposes, if any, then the next scene.
  const moveOn = async () => {
    if (!scene) return;
    if (scene.followUps?.includes('lawProposal') && state.pendingLaws.length) {
      setOverlay('law');
      return;
    }
    await advance();
  };
  const afterOutcome = () => singleFlight(moveOn);
  const skip = () =>
    singleFlight(async () => {
      if (!scene) return;
      await append({ type: 'scene_skipped', sceneId: scene.id });
      setPause(false);
      await advance();
    });
  const advanceOnce = () => singleFlight(advance);
  const law = state.pendingLaws[0];
  const principle = law
    ? content.principles.find((p) => p.id === law.principleId)
    : null;
  const unsigned = dominantUnsignedPrinciple(state, content);
  const signed = (principleId: string, statementId: string) =>
    singleFlight(async () => {
      flashLock();
      const number = nextLawNumber(state);
      // The exact sentence signed is frozen into the journal, including a
      // formulation the player wrote: it was signed, not revised later.
      const statementText =
        custom.trim() ||
        content.principles
          .find((p) => p.id === principleId)
          ?.statements.find((s) => s.id === statementId)?.text;
      await append({
        type: 'law_signed',
        lawNumber: number,
        principleId,
        statementId,
        ...(statementText ? { statementText } : {}),
      });
      if (scene?.input.kind === 'lawProposal') {
        await record('lawProposal', 'signed');
      }
      // The signed law rests on screen before the night goes on.
      setOverlay(null);
    });
  if (!loaded) return <main className="end-screen mono">THE LAW</main>;
  if (!save && threshold) return <>{threshold}</>;
  if (!save)
    return (
      <Onboarding
        error={error}
        enter={async (pseudonym, reportingConsent) => {
          try {
            await start({ pseudonym, reportingConsent });
          } catch {
            /* The store exposes the recovery error above. */
          }
        }}
      />
    );
  if (state.completed) {
    const reportStatus = save?.reportingStatus ?? 'not_sent';
    const showConsent = save?.reportingConsent === true;
    const reporting =
      showConsent && reportStatus === 'sent' ? (
        <p className="end-reporting mono">Rapport de playtest transmis.</p>
      ) : showConsent && reportStatus === 'failed' ? (
        <div className="end-reporting end-reporting--failed">
          <p className="mono">Le rapport n&apos;a pas pu être transmis.</p>
          <Button
            className="ghost end-reporting-retry"
            onClick={async () => {
              if (!save) return;
              if (!tryClaimSend(save.runId)) return;
              try {
                await submitReport(save, setReportingStatus);
              } finally {
                releaseSend(save.runId);
              }
            }}
          >
            Réessayer
          </Button>
        </div>
      ) : null;
    return <End state={state} content={content} reporting={reporting} />;
  }
  if (!scene) return <main className="end-screen mono">THE LAW</main>;
  const input = scene.input;
  const manualPassage = content.timelineId === 't3' && input.kind === 'passage';
  const choiceOptions =
    input.kind === 'binary' || input.kind === 'choice' || input.kind === 'glyph'
      ? input.options
      : [];
  const inputControl = () => {
    if (input.kind === 'binary' || input.kind === 'choice') {
      return (
        <div
          className={`choice-grid ${input.options.length === 3 ? 'three' : ''}`}
        >
          {input.options.map((option, index) => (
            <Button
              key={option.id}
              className="choice"
              data-choice-index={String(index + 1).padStart(2, '0')}
              aria-label={option.label}
              onClick={() => void lock(input.kind, option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      );
    }
    if (input.kind === 'slider')
      return (
        <div>
          <div className="range-value" aria-live="polite">
            {value} <span className="mono">{input.unit}</span>
          </div>
          <input
            className="range"
            type="range"
            min={input.min}
            max={input.max}
            step={input.step}
            value={value}
            aria-label="Années données"
            onChange={(e) => setValue(Number(e.target.value))}
          />
          <div>
            <Button
              className="commit"
              onClick={() => void lock(input.kind, value)}
            >
              {value === 0
                ? input.zeroLabel
                : input.labelTemplate.replace('{{n}}', String(value))}
            </Button>
          </div>
        </div>
      );
    if (input.kind === 'freeText')
      return (
        <div className="record">
          <textarea
            className="field record-field"
            aria-label={input.prompt}
            placeholder={input.placeholder}
            maxLength={input.maxLength}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <div className="record-meta mono">
            <span>{copy.recordNote}</span>
            <span>
              {answer.length} / {input.maxLength}
            </span>
          </div>
          <div className="home-actions">
            <Button
              onClick={() =>
                void lock(
                  input.kind,
                  answer.trim() ? 'written' : 'declined',
                  answer,
                )
              }
              disabled={!answer.trim()}
            >
              {copy.recordConfirm}
            </Button>
            <Button
              className="ghost"
              onClick={() => void lock(input.kind, 'declined')}
            >
              Je préfère ne pas répondre
            </Button>
          </div>
        </div>
      );
    if (input.kind === 'glyph')
      return (
        <>
          <GlyphInput
            options={choiceOptions}
            value={selected}
            onChange={(id) => {
              tracker.mark();
              setSelected(id);
            }}
          />
          <div style={{ marginTop: 20 }}>
            <Button
              className="commit"
              disabled={!selected}
              onClick={() => void lock(input.kind, selected)}
            >
              {copy.confirm}
            </Button>
          </div>
        </>
      );
    if (input.kind === 'confrontation')
      return (
        <div className="stack">
          {(['maintain', 'nuance', 'abandon', 'silence'] as const).map(
            (key) => (
              <Button
                key={key}
                onClick={() =>
                  singleFlight(async () => {
                    if (key === 'nuance') {
                      setOverlay('revision');
                      return;
                    }
                    if (key === 'abandon' && lawNumber)
                      await append({ type: 'law_abandoned', lawNumber });
                    await append({
                      type: 'confrontation_answered',
                      lawNumber: lawNumber ?? null,
                      answer: key,
                    });
                    await record('confrontation', key);
                  })
                }
              >
                {copy.confrontation[key]}
              </Button>
            ),
          )}
        </div>
      );
    if (input.kind === 'lawProposal')
      return (
        <div className="stack">
          <Button
            className="commit"
            onClick={() => {
              if (unsigned?.statements[0])
                void signed(unsigned.id, unsigned.statements[0].id);
            }}
          >
            {copy.confrontation.unsignedSign}
          </Button>
          <Button
            onClick={() =>
              singleFlight(async () => {
                if (unsigned)
                  await append({
                    type: 'law_declined',
                    principleId: unsigned.id,
                  });
                await record('lawProposal', 'no');
              })
            }
          >
            {copy.confrontation.unsignedNo}
          </Button>
          <Button
            className="ghost"
            onClick={() => void lock('lawProposal', 'silence')}
          >
            {copy.confrontation.silence}
          </Button>
        </div>
      );
    return null;
  };
  const revisionLaw = state.laws.find((l) => l.number === lawNumber);
  // Rewriting a law into the words it already has would record no change.
  const revisions = (
    content.principles.find((p) => p.id === revisionLaw?.principleId)
      ?.statements ?? []
  ).filter(
    (s) => !revisionLaw || s.text !== lawStatement(revisionLaw, content),
  );
  const saveRevision = () =>
    singleFlight(async () => {
      if (!lawNumber || (!variant && !custom.trim())) return;
      const statementText = custom.trim()
        ? undefined
        : revisions.find((s) => s.id === variant)?.text;
      await append({
        type: 'law_revised',
        lawNumber,
        newStatementId: custom.trim() ? null : variant,
        customText: custom.trim() || undefined,
        ...(statementText ? { statementText } : {}),
      });
      await append({
        type: 'confrontation_answered',
        lawNumber,
        answer: 'nuance',
      });
      await record('confrontation', 'nuance');
    });
  const cadence = outcomeCadence(input);
  const lockedEvent = visitEvents.findLast(
    (e): e is Extract<GameEvent, { type: 'choice_locked' }> =>
      e.type === 'choice_locked' && e.sceneId === scene.id,
  );
  const trace = decisionTrace(
    scene,
    lockedEvent,
    state.justifications[scene.id],
  );
  const sealing = visitEvents.findLast(
    (e) => e.type === 'law_signed' || e.type === 'law_declined',
  );
  const sealedLaw =
    sealing?.type === 'law_signed'
      ? state.laws.find((l) => l.number === sealing.lawNumber)
      : undefined;
  const sealedStatement = sealedLaw
    ? lawStatement(sealedLaw, content)
    : sealing?.type === 'law_declined'
      ? content.principles.find((p) => p.id === sealing.principleId)
          ?.statements[0]?.text
      : '';
  const textScale =
    save.settings.textSize === 'large'
      ? 1.15
      : save.settings.textSize === 'small'
        ? 0.88
        : 1;
  const roomDecisions = state.events.filter(
    (event) => event.type === 'choice_locked',
  );
  return (
    <main
      className={`stage reg-${scene.regression}${pulse ? ' stage--pulse' : ''}`}
      data-reduce={reduced}
      data-timeline={content.timelineId}
      data-scene={scene.id}
      data-phase={phase}
      data-input={input.kind}
      style={{ fontSize: `${textScale}rem` }}
    >
      <Room
        key={visitId}
        timelineId={content.timelineId}
        sceneId={scene.id}
        phase={phase}
        ambience={scene.audio?.ambience}
        decisions={roomDecisions}
        regression={scene.regression}
      />
      <header className="player-top">
        <span className="mono" aria-live="polite">
          {scene.title}
        </span>
        <Button className="ghost" onClick={() => setPause(true)}>
          {copy.quit}
        </Button>
      </header>
      {error && (
        <div className="player-alert" role="alert">
          <p className="mono">{error}</p>
          <Button className="ghost" onClick={() => void hydrate()}>
            {copy.reload}
          </Button>
        </div>
      )}
      <div className="player-main" key={`${visitId}:${phase}`}>
        {phase === 'law' ? (
          <div className="law-proposal">
            <p className="law-proposal-mark mono">
              Protocole · Loi {String(nextLawNumber(state)).padStart(2, '0')}
            </p>
            <p className="mono law-proposal-intro">
              {`Ta ${ordinals[nextLawNumber(state) - 1] ?? 'nouvelle'} loi.`}
            </p>
            <p className="law-statement serif">
              {custom.trim() ||
                principle?.statements.find(
                  (s) => s.id === (variant || law?.statementId),
                )?.text}
            </p>
            {principle && (
              <div className="choice-area">
                <div className="stack">
                  {variant && (
                    <>
                      <textarea
                        className="field"
                        aria-label="Reformulation personnelle"
                        maxLength={280}
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                        placeholder="Écris ta propre loi"
                      />
                      {principle.statements.map((s) => (
                        <Button
                          key={s.id}
                          className={variant === s.id ? 'selected' : ''}
                          onClick={() => {
                            setVariant(s.id);
                            setCustom('');
                          }}
                        >
                          {s.text}
                        </Button>
                      ))}
                    </>
                  )}
                  <Button
                    className="commit"
                    onClick={() =>
                      void signed(
                        principle.id,
                        custom.trim()
                          ? (law?.statementId ??
                              principle.statements[0]?.id ??
                              '')
                          : variant || law?.statementId || '',
                      )
                    }
                  >
                    {copy.signed}
                  </Button>
                  <Button
                    onClick={() =>
                      setVariant(principle.statements[0]?.id ?? '')
                    }
                  >
                    {copy.rephrase}
                  </Button>
                  <Button
                    className="ghost"
                    onClick={() =>
                      singleFlight(async () => {
                        await append({
                          type: 'law_declined',
                          principleId: principle.id,
                        });
                        setOverlay(null);
                      })
                    }
                  >
                    {copy.decline}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : phase === 'revision' ? (
          <div className="law-proposal">
            <p className="law-proposal-mark mono">
              Révision · Loi {String(lawNumber).padStart(2, '0')}
            </p>
            <p className="serif law-statement">
              {revisionLaw ? lawStatement(revisionLaw, content) : ''}
            </p>
            <div className="choice-area stack">
              {revisions.map((s) => (
                <Button
                  key={s.id}
                  className={variant === s.id ? 'selected' : ''}
                  onClick={() => {
                    setVariant(s.id);
                    setCustom('');
                  }}
                >
                  {s.text}
                </Button>
              ))}
              <textarea
                className="field"
                aria-label="Reformuler la loi"
                maxLength={280}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Écris ta propre formulation"
              />
              <Button
                className="commit"
                disabled={!variant && !custom.trim()}
                onClick={() => void saveRevision()}
              >
                {copy.confirm}
              </Button>
              <Button className="ghost" onClick={() => setOverlay(null)}>
                Retour à la confrontation
              </Button>
            </div>
          </div>
        ) : phase === 'sealed' ? (
          <div className="law-proposal">
            <p className="law-proposal-mark mono">
              {sealedLaw
                ? `Protocole · Loi ${String(sealedLaw.number).padStart(2, '0')}`
                : 'Protocole'}
            </p>
            <p className="law-statement serif">{sealedStatement}</p>
            <p className="lock-trace mono">
              {sealedLaw ? copy.sealed.signed : copy.sealed.declined}
            </p>
            {sealedSettled && (
              <RestAdvance onAdvance={() => void advanceOnce()} />
            )}
          </div>
        ) : (
          <>
            {phase === 'outcome' && trace && (
              <p className="lock-trace mono">{trace}</p>
            )}
            <BeatRenderer
              key={`${visitId}:${phase}`}
              beats={beats}
              state={state}
              content={content}
              lawNumber={lawNumber}
              reduceAnimations={reduced}
              paused={pause || settings}
              mode={
                phase === 'outcome'
                  ? cadence === 'rest'
                    ? 'rest'
                    : 'transition'
                  : input.kind === 'passage'
                    ? 'transition'
                    : 'decision'
              }
              instant={Boolean(phase === 'outcome' && !outcome?.beats.length)}
              onDone={
                phase === 'outcome'
                  ? cadence === 'rest'
                    ? () => setResting(true)
                    : () => void afterOutcome()
                  : input.kind === 'passage'
                    ? manualPassage
                      ? () => setResting(true)
                      : () => void advanceOnce()
                    : () => setReady(true)
              }
            />
            {phase === 'scene' && ready && input.kind !== 'passage' && (
              <div ref={choiceArea} className="choice-area">
                {inputControl()}
              </div>
            )}
            {phase === 'scene' && manualPassage && resting && (
              <RestAdvance onAdvance={() => void advanceOnce()} />
            )}
            {phase === 'outcome' && resting && certaintyPending && (
              <div className="choice-area certainty">
                <p className="certainty-question serif">{copy.certainty}</p>
                <div className="certainty-gauge">
                  <span className="range-value" aria-live="polite">
                    {value}
                  </span>
                  <span className="certainty-unit mono">/ 100</span>
                </div>
                <input
                  className="range"
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  aria-label={copy.certainty}
                  onChange={(e) => setValue(Number(e.target.value))}
                />
                <div className="certainty-scale mono">
                  <span>{copy.certaintyLow}</span>
                  <span>{copy.certaintyHigh}</span>
                </div>
                <div className="home-actions">
                  <Button
                    onClick={() =>
                      singleFlight(async () => {
                        await append({
                          type: 'certainty_given',
                          sceneId: scene.id,
                          value,
                        });
                        await moveOn();
                      })
                    }
                  >
                    {copy.confirm}
                  </Button>
                  <Button className="ghost" onClick={() => void afterOutcome()}>
                    {copy.skip}
                  </Button>
                </div>
              </div>
            )}
            {phase === 'outcome' && resting && !certaintyPending && (
              <RestAdvance onAdvance={() => void afterOutcome()} />
            )}
          </>
        )}
      </div>
      <footer className="player-bottom mono">
        <span>
          {scene.regression < 3 ? `TIMELINE ${door.index} / ${door.name}` : ''}
        </span>
      </footer>
      {pause && (
        <Dialog label={copy.pause} close={() => setPause(false)}>
          <p className="mono">THE LAW / {timelineNumber}</p>
          <h2 className="serif">{copy.pause}</h2>
          <div className="stack">
            <Button onClick={() => setPause(false)}>{copy.resume}</Button>
            <Button onClick={() => void skip()}>Passer cette scène</Button>
            <Link className="law-button" href="/ma-loi">
              {copy.home.laws}
            </Link>
            <Button
              onClick={() => {
                setPause(false);
                setSettings(true);
              }}
            >
              {copy.settings}
            </Button>
            <Button onClick={() => router.push('/')}>{copy.back}</Button>
          </div>
        </Dialog>
      )}
      {settings && (
        <Settings
          close={() => setSettings(false)}
          store={useStore}
          label={`THE LAW / ${timelineNumber}`}
        />
      )}
    </main>
  );
}
