'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { content, copy } from '../../content';
import {
  dominantUnsignedPrinciple,
  lawStatement,
  matchOutcome,
  nextLawNumber,
  nextScene,
  replay,
  resolveScene,
  resolvedBeats,
  type Scene,
} from '../../engine';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../primitives/Button';
import { HoldButton } from '../primitives/HoldButton';
import { Dialog } from '../primitives/Dialog';
import { BeatRenderer } from './BeatRenderer';
import { GlyphInput } from './inputs/GlyphInput';
import { Room } from '../stage/Room';
import { Settings } from '../screens/Settings';
import { End } from '../screens/End';
import { Onboarding } from '../screens/Onboarding';
type Phase = 'scene' | 'outcome' | 'certainty' | 'law' | 'revision';
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
export function ScenePlayer() {
  const router = useRouter();
  const save = useGameStore((s) => s.save);
  const loaded = useGameStore((s) => s.loaded);
  const error = useGameStore((s) => s.error);
  const hydrate = useGameStore((s) => s.hydrate);
  const append = useGameStore((s) => s.append);
  const start = useGameStore((s) => s.start);
  useEffect(() => {
    if (!loaded) void hydrate();
  }, [loaded, hydrate]);
  const state = useMemo(() => replay(save?.events ?? [], content), [save]);
  const current = content.scenes.find((s) => s.id === state.currentSceneId);
  const scene = current ? resolveScene(current, state) : null;
  const [phase, setPhase] = useState<Phase>('scene');
  const [previousVisitId, setPreviousVisitId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [outcomeReady, setOutcomeReady] = useState(false);
  const [selected, setSelected] = useState<string>('');
  const [value, setValue] = useState(0);
  const [answer, setAnswer] = useState('');
  const [pause, setPause] = useState(false);
  const [settings, setSettings] = useState(false);
  const [variant, setVariant] = useState('');
  const [custom, setCustom] = useState('');
  const reduced = useReduced(save?.settings.reducedMotion ?? 'auto');
  const simple = Boolean(save?.settings.simpleConfirmation || reduced);
  const tracker = useTimeTracker({ reset: `${scene?.id}:${ready}` });
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
      void append({ type: 'run_completed', timelineId: 't1' });
  }, [loaded, save, state, append]);
  const sceneId = scene?.id ?? null;
  const visit = state.events.findLast(
    (event) => event.type === 'scene_entered',
  );
  const visitId = visit?.id ?? null;
  if (visitId !== previousVisitId) {
    setPreviousVisitId(visitId);
    setReady(false);
    setOutcomeReady(false);
    setSelected('');
    setValue(0);
    setAnswer('');
    setVariant('');
    setCustom('');
    const answered = state.events
      .slice(
        state.events.findLastIndex((event) => event.type === 'scene_entered') +
          1,
      )
      .some(
        (event) => event.type === 'choice_locked' && event.sceneId === sceneId,
      );
    setPhase(answered ? 'outcome' : 'scene');
  }
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
  const advance = useCallback(async () => {
    if (!scene) return;
    const latest = replay(useGameStore.getState().save?.events ?? [], content);
    const next = nextScene(latest, content);
    if (next)
      await append({
        type: 'scene_entered',
        sceneId: next.id,
        sceneVersion: next.version,
      });
    else await append({ type: 'run_completed', timelineId: 't1' });
  }, [scene, append]);
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
  const lock = async (
    input: Scene['input']['kind'],
    choice: string | number,
    text?: string,
  ) => {
    if (!scene) return;
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
    setPhase('outcome');
  };
  const afterOutcome = async () => {
    if (!scene) return;
    if (
      scene.followUps?.includes('certainty') &&
      !(scene.id in state.certainty)
    ) {
      setPhase('certainty');
      return;
    }
    if (scene.followUps?.includes('lawProposal') && state.pendingLaws.length) {
      setPhase('law');
      return;
    }
    await advance();
  };
  const skip = async () => {
    if (!scene) return;
    await append({ type: 'scene_skipped', sceneId: scene.id });
    setPause(false);
    await advance();
  };
  const law = state.pendingLaws[0];
  const principle = law
    ? content.principles.find((p) => p.id === law.principleId)
    : null;
  const unsigned = dominantUnsignedPrinciple(state, content);
  const signed = async (principleId: string, statementId: string) => {
    const number = nextLawNumber(state);
    await append({
      type: 'law_signed',
      lawNumber: number,
      principleId,
      statementId,
    });
    if (custom.trim())
      await append({
        type: 'law_revised',
        lawNumber: number,
        newStatementId: null,
        customText: custom.trim(),
      });
    if (scene?.input.kind === 'lawProposal') {
      await lock('lawProposal', 'signed');
    }
    setPhase('outcome');
    setOutcomeReady(true);
    await advance();
  };
  if (!loaded) return <main className="end-screen mono">THE LAW</main>;
  if (!save)
    return (
      <Onboarding
        error={error}
        enter={async () => {
          try {
            await start();
          } catch {
            /* The store exposes the recovery error above. */
          }
        }}
      />
    );
  if (state.completed) return <End state={state} />;
  if (!scene) return <main className="end-screen mono">THE LAW</main>;
  const input = scene.input;
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
          {input.options.map((option) =>
            input.confirm === 'hold' ? (
              <HoldButton
                key={option.id}
                simple={simple}
                onConfirm={() => void lock(input.kind, option.id)}
              >
                {option.label}
              </HoldButton>
            ) : (
              <Button
                key={option.id}
                onClick={() => void lock(input.kind, option.id)}
              >
                {option.label}
              </Button>
            ),
          )}
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
            <HoldButton
              simple={simple}
              onConfirm={() => void lock(input.kind, value)}
            >
              {value === 0
                ? input.zeroLabel
                : input.labelTemplate.replace('{{n}}', String(value))}
            </HoldButton>
          </div>
        </div>
      );
    if (input.kind === 'freeText')
      return (
        <div>
          <textarea
            className="field"
            aria-label={input.prompt}
            placeholder={input.placeholder}
            maxLength={input.maxLength}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <div
            className="mono"
            style={{ textAlign: 'right', margin: '12px 0 30px' }}
          >
            {answer.length} / {input.maxLength}
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
              Continuer
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
            <HoldButton
              simple={simple}
              disabled={!selected}
              onConfirm={() => void lock(input.kind, selected)}
            >
              {copy.confirm}
            </HoldButton>
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
                onClick={async () => {
                  if (key === 'nuance') {
                    setPhase('revision');
                    return;
                  }
                  if (key === 'abandon' && lawNumber)
                    await append({ type: 'law_abandoned', lawNumber });
                  await append({
                    type: 'confrontation_answered',
                    lawNumber: lawNumber ?? null,
                    answer: key,
                  });
                  await lock('confrontation', key);
                }}
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
          <HoldButton
            simple={simple}
            onConfirm={() => {
              if (unsigned?.statements[0])
                void signed(unsigned.id, unsigned.statements[0].id);
            }}
          >
            {copy.confrontation.unsignedSign}
          </HoldButton>
          <Button
            onClick={async () => {
              if (unsigned)
                await append({
                  type: 'law_declined',
                  principleId: unsigned.id,
                });
              await lock('lawProposal', 'no');
            }}
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
  const revisions =
    content.principles.find((p) => p.id === revisionLaw?.principleId)
      ?.statements ?? [];
  const saveRevision = async () => {
    if (!lawNumber || (!variant && !custom.trim())) return;
    await append({
      type: 'law_revised',
      lawNumber,
      newStatementId: custom.trim() ? null : variant,
      customText: custom.trim() || undefined,
    });
    await append({
      type: 'confrontation_answered',
      lawNumber,
      answer: 'nuance',
    });
    await lock('confrontation', 'nuance');
  };
  const textScale =
    save.settings.textSize === 'large'
      ? 1.15
      : save.settings.textSize === 'small'
        ? 0.88
        : 1;
  return (
    <main
      className={`stage reg-${scene.regression}`}
      data-reduce={reduced}
      style={{ fontSize: `${textScale}rem` }}
    >
      <Room />
      <header className="player-top">
        <span className="mono">{scene.title}</span>
        <Button className="ghost" onClick={() => setPause(true)}>
          {copy.quit}
        </Button>
      </header>
      <div className="player-main">
        {phase === 'law' ? (
          <>
            <div className="beats">
              <p className="mono">{copy.lawIntro}</p>
              <p className="beat serif">
                {custom.trim() ||
                  principle?.statements.find(
                    (s) => s.id === (variant || law?.statementId),
                  )?.text}
              </p>
            </div>
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
                  <HoldButton
                    simple={simple}
                    onConfirm={() =>
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
                  </HoldButton>
                  <Button
                    onClick={() =>
                      setVariant(principle.statements[0]?.id ?? '')
                    }
                  >
                    {copy.rephrase}
                  </Button>
                  <Button
                    className="ghost"
                    onClick={async () => {
                      await append({
                        type: 'law_declined',
                        principleId: principle.id,
                      });
                      await advance();
                    }}
                  >
                    {copy.decline}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : phase === 'revision' ? (
          <>
            <p className="mono">LOI {String(lawNumber).padStart(2, '0')}</p>
            <p className="serif beat">
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
              <HoldButton
                simple={simple}
                disabled={!variant && !custom.trim()}
                onConfirm={() => void saveRevision()}
              >
                {copy.confirm}
              </HoldButton>
              <Button className="ghost" onClick={() => setPhase('scene')}>
                Retour à la confrontation
              </Button>
            </div>
          </>
        ) : phase === 'certainty' ? (
          <>
            <p className="serif beat">{copy.certainty}</p>
            <div className="choice-area">
              <div className="range-value">{value}</div>
              <input
                className="range"
                type="range"
                min="0"
                max="100"
                value={value}
                aria-label={copy.certainty}
                onChange={(e) => setValue(Number(e.target.value))}
              />
              <div className="footerline mono">
                <span>{copy.certaintyLow}</span>
                <span>{copy.certaintyHigh}</span>
              </div>
              <div className="home-actions">
                <Button
                  onClick={async () => {
                    await append({
                      type: 'certainty_given',
                      sceneId: scene.id,
                      value,
                    });
                    await advance();
                  }}
                >
                  {copy.confirm}
                </Button>
                <Button className="ghost" onClick={() => void advance()}>
                  {copy.skip}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <BeatRenderer
              key={`${visitId}:${phase}`}
              beats={beats}
              state={state}
              content={content}
              lawNumber={lawNumber}
              reduceAnimations={reduced}
              paused={pause || settings}
              instant={Boolean(
                phase === 'outcome' &&
                chosen !== null &&
                save.events.some(
                  (e) => e.type === 'choice_locked' && e.sceneId === scene.id,
                ) &&
                !outcome?.beats.length,
              )}
              onDone={
                phase === 'outcome'
                  ? () => setOutcomeReady(true)
                  : () => setReady(true)
              }
            />
            {phase === 'scene' && ready && (
              <div className="choice-area">{inputControl()}</div>
            )}
            {phase === 'outcome' && outcomeReady && (
              <div className="outcome-actions">
                <Button onClick={() => void afterOutcome()}>
                  {copy.continue}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <footer className="player-bottom mono">
        <span>{scene.regression < 3 ? 'TIMELINE I / LA PIÈCE' : ''}</span>
      </footer>
      {pause && (
        <Dialog label={copy.pause} close={() => setPause(false)}>
          <p className="mono">THE LAW / 01</p>
          <h2 className="serif">{copy.pause}</h2>
          <div className="stack">
            <Button onClick={() => setPause(false)}>{copy.continue}</Button>
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
      {settings && <Settings close={() => setSettings(false)} />}
    </main>
  );
}
