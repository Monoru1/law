'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { content, copy } from '../../src/content';
import { contentT2 } from '../../src/content/t2';
import { contentT3 } from '../../src/content/t3';
import {
  choiceFact,
  lawStatement,
  observations,
  renderText,
  replay,
  sceneOptions,
  type Content,
  type GameState,
} from '../../src/engine';
import type { SaveGame } from '../../src/persistence/SaveAdapter';
import { useGameStore } from '../../src/store/gameStore';
import { useT2GameStore } from '../../src/store/gameStoreT2';
import { useT3GameStore } from '../../src/store/gameStoreT3';
import { Button } from '../../src/ui/primitives/Button';

const answers = {
  maintain: 'Maintenue',
  nuance: 'Nuancée',
  abandon: 'Abrogée',
  silence: 'Sans réponse',
} as const;

function exportJson(save: SaveGame) {
  const blob = new Blob([JSON.stringify(save, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `the-law-${save.timelineId}-${save.runId}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Decisions({ state, content }: { state: GameState; content: Content }) {
  const decisions = state.events.filter((e) => e.type === 'choice_locked');
  return decisions.map((event, i) => {
    const scene = content.scenes.find((s) => s.id === event.sceneId);
    const input = scene?.input;
    const chosen =
      input?.kind === 'binary' ||
      input?.kind === 'choice' ||
      input?.kind === 'glyph'
        ? sceneOptions(scene!).get(String(event.value))?.label
        : input?.kind === 'slider'
          ? `${event.value} ${input.unit}`
          : input?.kind === 'freeText'
            ? event.value === 'written'
              ? state.justifications[event.sceneId]
              : copy.confrontation.silence
            : input?.kind === 'confrontation'
              ? copy.confrontation[
                  event.value as 'maintain' | 'nuance' | 'abandon' | 'silence'
                ]
              : input?.kind === 'lawProposal'
                ? event.value === 'signed'
                  ? copy.signed
                  : event.value === 'no'
                    ? copy.confrontation.unsignedNo
                    : copy.confrontation.silence
                : null;
    return (
      <article key={event.id}>
        <span className="mono">
          {String(i + 1).padStart(2, '0')} / {scene?.title}
        </span>
        <p className="serif">{chosen}</p>
        {input?.kind !== 'freeText' && state.justifications[event.sceneId] && (
          <blockquote className="serif" style={{ margin: '16px 0' }}>
            « {state.justifications[event.sceneId]} »
          </blockquote>
        )}
      </article>
    );
  });
}

const CITY_TRACE_SCENES = new Set([
  't3.la-regle',
  't3.nadia-dossier',
  't3.exception',
  't3.precedent',
  't3.la-liste',
  't3.le-registre',
]);

function CityTraces({ state }: { state: GameState }) {
  const events = state.events.filter(
    (
      event,
    ): event is Extract<
      (typeof state.events)[number],
      { type: 'choice_locked' }
    > => event.type === 'choice_locked' && CITY_TRACE_SCENES.has(event.sceneId),
  );
  return events.map((event) => {
    const scene = contentT3.scenes.find((item) => item.id === event.sceneId);
    const fact = choiceFact(event.sceneId, state, contentT3);
    return (
      <article key={event.id}>
        <span className="mono">{scene?.title ?? event.sceneId}</span>
        {fact && <p className="serif">{renderText(fact, state, contentT3)}</p>}
      </article>
    );
  });
}

function sceneTitle(sceneId: string) {
  return [...content.scenes, ...contentT2.scenes, ...contentT3.scenes].find(
    (scene) => scene.id === sceneId,
  )?.title;
}

export default function MyLaw() {
  const save = useGameStore((s) => s.save);
  const loaded = useGameStore((s) => s.loaded);
  const error = useGameStore((s) => s.error);
  const hydrate = useGameStore((s) => s.hydrate);
  const clear = useGameStore((s) => s.clear);
  const house = useT2GameStore();
  const city = useT3GameStore();
  const [erasing, setErasing] = useState(false);
  useEffect(() => {
    if (!loaded) void hydrate();
  }, [loaded, hydrate]);
  const hydrateHouse = house.hydrate;
  useEffect(() => {
    if (!house.loaded) void hydrateHouse();
  }, [house.loaded, hydrateHouse]);
  const hydrateCity = city.hydrate;
  useEffect(() => {
    if (!city.loaded) void hydrateCity();
  }, [city.loaded, hydrateCity]);
  const state = useMemo(() => replay(save?.events ?? [], content), [save]);
  const houseState = useMemo(
    () => replay(house.save?.events ?? [], contentT2),
    [house.save],
  );
  const cityState = useMemo(
    () => replay(city.save?.events ?? [], contentT3),
    [city.save],
  );
  // Each threshold copies the complete document forward. The latest journal
  // therefore contains every earlier law without rewriting its history.
  const latest = city.save
    ? { state: cityState, content: contentT3 }
    : house.save
      ? { state: houseState, content: contentT2 }
      : { state, content };
  const contradictions = [
    { state, content },
    ...(house.save ? [{ state: houseState, content: contentT2 }] : []),
    ...(city.save ? [{ state: cityState, content: contentT3 }] : []),
  ].flatMap((run) =>
    run.state.contradictions.map((c) => {
      const answer = run.state.events.find((e) => e.id === c.answerEventId);
      const fact = choiceFact(c.sceneId, run.state, run.content);
      return {
        key: `${run.content.timelineId}:${c.choiceEventId}`,
        lawNumber: c.lawNumber,
        fact: fact ? renderText(fact, run.state, run.content) : null,
        answer: !c.raised
          ? 'Consignée, sans confrontation'
          : answer?.type === 'confrontation_answered'
            ? answers[answer.answer]
            : answers.silence,
      };
    }),
  );
  const exists = Boolean(save || house.save || city.save);
  const people = city.save ? cityState : houseState;
  const errors = [error, house.error, city.error].filter(Boolean);
  return (
    <main className="law-page">
      <header className="site-top mono">
        <Link className="law-button ghost" href="/">
          THE LAW
        </Link>
        <Link
          className="law-button ghost"
          href={city.save ? '/jouer/t3' : house.save ? '/jouer/t2' : '/jouer'}
        >
          {city.save
            ? 'RETOUR À LA VILLE ↗'
            : house.save
              ? 'RETOUR À LA MAISON ↗'
              : 'RETOUR À LA PIÈCE ↗'}
        </Link>
      </header>
      <h1 className="serif">Ma loi.</h1>
      {errors.map((message, i) => (
        <p key={i} role="alert">
          {message}
        </p>
      ))}
      {!exists ? (
        errors.length === 0 &&
        loaded &&
        house.loaded &&
        city.loaded && <p className="serif beat">Aucune partie enregistrée.</p>
      ) : (
        <>
          <p
            className="mono"
            style={{ color: 'var(--law-gray-300)', marginBottom: 80 }}
          >
            CE QUI A ÉTÉ FAIT RESTE ÉCRIT.
          </p>
          <section>
            <h2 className="mono">01 / LOIS</h2>
            {latest.state.laws.length === 0 && <p>Aucune loi signée.</p>}
            {latest.state.laws.map((law) => (
              <article key={law.number}>
                <span className="mono">
                  LOI {String(law.number).padStart(2, '0')} ·{' '}
                  {law.status === 'abandoned' ? 'ABROGÉE' : 'EN VIGUEUR'}
                  {law.inheritedFrom ? ' · SIGNÉE DANS LA PIÈCE' : ''}
                </span>
                <p className="serif">{lawStatement(law, latest.content)}</p>
                {law.revisions.map((rev, i) => (
                  <div
                    key={i}
                    className={
                      i < law.revisions.length - 1 ? 'revision serif' : 'mono'
                    }
                    style={{ margin: '12px 0' }}
                  >
                    {new Date(rev.at).toLocaleDateString('fr-FR')} —{' '}
                    {rev.customText ??
                      rev.statementText ??
                      latest.content.principles
                        .find((p) => p.id === law.principleId)
                        ?.statements.find((s) => s.id === rev.statementId)
                        ?.text ??
                      ''}{' '}
                    {rev.status === 'abandoned' ? '· Abrogée' : ''}
                  </div>
                ))}
              </article>
            ))}
          </section>
          <section>
            <h2 className="mono">02 / DÉCISIONS</h2>
            {save && (
              <>
                {house.save && <h3 className="mono">LA PIÈCE</h3>}
                <Decisions state={state} content={content} />
              </>
            )}
            {house.save && (
              <>
                <h3 className="mono">LA MAISON</h3>
                <Decisions state={houseState} content={contentT2} />
              </>
            )}
            {city.save && (
              <>
                <h3 className="mono">LA VILLE — TRACES STRUCTURANTES</h3>
                <CityTraces state={cityState} />
              </>
            )}
          </section>
          <section>
            <h2 className="mono">03 / OBSERVATIONS</h2>
            {[
              ...observations(state, content),
              ...(house.save ? observations(houseState, contentT2) : []),
            ].map((text, i) => (
              <article key={i}>
                <p className="serif">{text}</p>
              </article>
            ))}
          </section>
          <section>
            <h2 className="mono">04 / CONTRADICTIONS</h2>
            {contradictions.length === 0 && (
              <p>Aucune confrontation enregistrée.</p>
            )}
            {contradictions.map((item) => (
              <article key={item.key}>
                <span className="mono">
                  {item.lawNumber
                    ? `LOI ${String(item.lawNumber).padStart(2, '0')}`
                    : 'LOI NON SIGNÉE'}
                </span>
                {item.fact && <p className="serif">{item.fact}</p>}
                <p className="mono">{item.answer}</p>
              </article>
            ))}
          </section>
          {people.relations.length > 0 && (
            <section>
              <h2 className="mono">05 / PERSONNES</h2>
              {people.relations.map((record) => (
                <article key={record.characterId}>
                  <span className="mono">
                    {copy.people[record.characterId] ?? record.characterId}
                  </span>
                  {record.events.map((item) => (
                    <p key={`${item.eventId}:${item.kind}`} className="serif">
                      {copy.relations[item.kind] ?? item.kind} —{' '}
                      {sceneTitle(item.sceneId) ?? ''}
                    </p>
                  ))}
                </article>
              ))}
            </section>
          )}
          <footer className="home-actions">
            {save && (
              <Button onClick={() => exportJson(save)}>{copy.export}</Button>
            )}
            {house.save && (
              <Button onClick={() => exportJson(house.save!)}>
                {copy.exportHouse}
              </Button>
            )}
            {city.save && (
              <Button onClick={() => exportJson(city.save!)}>
                Exporter La Ville
              </Button>
            )}
            {erasing ? (
              <>
                <Button
                  className="signal"
                  onClick={async () => {
                    await clear();
                    await house.clear();
                    await city.clear();
                    setErasing(false);
                  }}
                >
                  {copy.eraseConfirm}
                </Button>
                <Button className="ghost" onClick={() => setErasing(false)}>
                  Annuler
                </Button>
              </>
            ) : (
              <Button className="ghost" onClick={() => setErasing(true)}>
                {copy.erase}
              </Button>
            )}
          </footer>
        </>
      )}
    </main>
  );
}
