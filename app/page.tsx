'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../src/store/gameStore';
import { useT0GameStore } from '../src/store/gameStoreT0';
import { useT2GameStore } from '../src/store/gameStoreT2';
import { useT3GameStore } from '../src/store/gameStoreT3';
import { content, copy } from '../src/content';
import { contentT0 } from '../src/content/t0';
import { contentT2 } from '../src/content/t2';
import { contentT3 } from '../src/content/t3';
import { replay, getTimelineDoors, getRunProgress } from '../src/engine';
import { Button } from '../src/ui/primitives/Button';
import { Dialog } from '../src/ui/primitives/Dialog';
export default function Home() {
  const router = useRouter();
  const { save, loaded, error, hydrate } = useGameStore();
  const exam = useT0GameStore();
  const house = useT2GameStore();
  const city = useT3GameStore();
  const [presentingId, setPresentingId] = useState<string | null>(null);
  useEffect(() => {
    if (!loaded) void hydrate();
  }, [loaded, hydrate]);
  const hydrateExam = exam.hydrate;
  useEffect(() => {
    if (!exam.loaded) void hydrateExam();
  }, [exam.loaded, hydrateExam]);
  const hydrateHouse = house.hydrate;
  useEffect(() => {
    if (!house.loaded) void hydrateHouse();
  }, [house.loaded, hydrateHouse]);
  const hydrateCity = city.hydrate;
  useEffect(() => {
    if (!city.loaded) void hydrateCity();
  }, [city.loaded, hydrateCity]);
  const state = useMemo(() => replay(save?.events ?? [], content), [save]);
  const examState = useMemo(
    () => replay(exam.save?.events ?? [], contentT0),
    [exam.save],
  );
  const houseState = useMemo(
    () => replay(house.save?.events ?? [], contentT2),
    [house.save],
  );
  const cityState = useMemo(
    () => replay(city.save?.events ?? [], contentT3),
    [city.save],
  );
  const doors = useMemo(
    () =>
      getTimelineDoors({
        t0: { state: examState, content: contentT0 },
        t1: { state, content },
        t2: { state: houseState, content: contentT2 },
        t3: { state: cityState, content: contentT3 },
      }),
    [examState, state, houseState, cityState],
  );
  const progress = {
    t0: getRunProgress(examState, contentT0),
    t1: getRunProgress(state, content),
    t2: getRunProgress(houseState, contentT2),
    t3: getRunProgress(cityState, contentT3),
  };
  const ready = loaded && exam.loaded && house.loaded && city.loaded;
  const routes: Record<string, string> = {
    t0: '/jouer/t0',
    t1: '/jouer',
    t2: '/jouer/t2',
    t3: '/jouer/t3',
  };
  const savedRuns = { t0: exam.save, t1: save, t2: house.save, t3: city.save };
  const resumable = doors
    .filter((door) => door.status === 'in_progress' && door.timelineId !== 't4')
    .sort(
      (a, b) =>
        (savedRuns[b.timelineId as keyof typeof savedRuns]?.updatedAt ?? 0) -
        (savedRuns[a.timelineId as keyof typeof savedRuns]?.updatedAt ?? 0),
    )[0];
  const presenting = presentingId
    ? (copy.doors.find((d) => d.timelineId === presentingId) ?? null)
    : null;
  return (
    <main className="home rebirth-home">
      <header className="site-top mono">
        <span className="wordmark">{copy.brand}</span>
        <a className="registry-link" href="#registre">
          {copy.home.registry}
        </a>
      </header>
      <section className="court-entry" aria-labelledby="convocation">
        <div className="court-doors" aria-hidden="true">
          <span />
          <span />
        </div>
        <div className="court-invitation">
          <h1 id="convocation" className="serif">
            {copy.home.summons}
          </h1>
          <p>{copy.home.tagline}</p>
          <div className="court-actions">
            {ready && resumable && (
              <Link className="law-button" href={routes[resumable.timelineId]!}>
                {copy.home.resumeLatest}
              </Link>
            )}
            <a
              className={`law-button${ready && resumable ? ' ghost' : ''}`}
              href="#registre"
            >
              {copy.enter}
            </a>
          </div>
        </div>
      </section>
      <div id="registre" className="home-body" tabIndex={-1}>
        <h2 className="serif registry-title">{copy.home.registry}</h2>
        <p className="registry-note">{copy.home.registryNote}</p>
        {[error, exam.error, house.error, city.error]
          .filter(Boolean)
          .map((message, i) => (
            <p key={i} role="alert" style={{ fontSize: '1rem' }}>
              {message}
            </p>
          ))}
        <div className="home-doors">
          {doors.map((door) => {
            const meta = copy.doors.find(
              (d) => d.timelineId === door.timelineId,
            )!;
            const run =
              door.timelineId === 't4' ? null : progress[door.timelineId];
            return (
              <article
                key={door.timelineId}
                className="door-card"
                data-status={door.status}
              >
                <span className="mono door-index">
                  {meta.index} / {meta.name}
                </span>
                <span className="mono dossier-status">
                  {ready ? copy.home.states[door.status] : '…'}
                </span>
                <p className="serif door-promise">{meta.promise}</p>
                {ready && run && run.visitedSceneCount > 0 && (
                  <p className="dossier-progress">
                    {run.visitedSceneCount} {copy.home.visited}
                    {run.currentScene ? ` · ${run.currentScene.title}` : ''}
                  </p>
                )}
                {ready && door.status === 'presentation' ? (
                  <Button
                    className="ghost"
                    onClick={() => setPresentingId(door.timelineId)}
                  >
                    {copy.enter}
                  </Button>
                ) : ready ? (
                  <Button
                    onClick={() => router.push(routes[door.timelineId]!)}
                    aria-label={`${
                      door.status === 'in_progress'
                        ? copy.home.resume
                        : door.status === 'completed'
                          ? copy.home.summary
                          : copy.home.start
                    } — ${meta.name}`}
                  >
                    {door.status === 'in_progress'
                      ? copy.home.resume
                      : door.status === 'completed'
                        ? copy.home.summary
                        : copy.home.start}
                  </Button>
                ) : null}
              </article>
            );
          })}
        </div>
        {(save || exam.save || house.save || city.save) && (
          <div className="home-actions">
            <Link href="/ma-loi" className="law-button ghost">
              {copy.home.laws}
            </Link>
          </div>
        )}
      </div>
      <footer className="footerline mono">
        <span>{copy.brand}</span>
        <span>{copy.home.privacy}</span>
      </footer>
      {presenting && (
        <Dialog label={presenting.name} close={() => setPresentingId(null)}>
          <p className="mono">
            {presenting.index} / {presenting.name}
          </p>
          {presenting.presentation?.split('\n\n').map((para, i) => (
            <p key={i} className="serif">
              {para}
            </p>
          ))}
          {presenting.timelineId === 't4' && <p>{copy.home.unavailable}</p>}
          {presenting.timelineId === 't2' && (
            <p className="mono">{copy.threshold.locked}</p>
          )}
          {presenting.timelineId === 't3' && (
            <p className="mono">{copy.threshold3.locked}</p>
          )}
          <div className="stack" style={{ marginTop: '2rem' }}>
            <Button className="ghost" onClick={() => setPresentingId(null)}>
              {copy.back}
            </Button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
