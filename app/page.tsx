'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../src/store/gameStore';
import { useT2GameStore } from '../src/store/gameStoreT2';
import { content, copy } from '../src/content';
import { contentT2 } from '../src/content/t2';
import { replay, getTimelineDoors } from '../src/engine';
import { Button } from '../src/ui/primitives/Button';
import { Dialog } from '../src/ui/primitives/Dialog';
export default function Home() {
  const router = useRouter();
  const { save, loaded, error, hydrate } = useGameStore();
  const house = useT2GameStore();
  const [presentingId, setPresentingId] = useState<string | null>(null);
  useEffect(() => {
    if (!loaded) void hydrate();
  }, [loaded, hydrate]);
  const hydrateHouse = house.hydrate;
  useEffect(() => {
    if (!house.loaded) void hydrateHouse();
  }, [house.loaded, hydrateHouse]);
  const state = useMemo(() => replay(save?.events ?? [], content), [save]);
  const houseState = useMemo(
    () => replay(house.save?.events ?? [], contentT2),
    [house.save],
  );
  const doors = useMemo(
    () =>
      getTimelineDoors({
        t1: { state, content },
        t2: { state: houseState, content: contentT2 },
      }),
    [state, houseState],
  );
  const routes: Record<string, string> = { t1: '/jouer', t2: '/jouer/t2' };
  const presenting = presentingId
    ? (copy.doors.find((d) => d.timelineId === presentingId) ?? null)
    : null;
  return (
    <main className="home">
      <header className="site-top mono">
        <span className="wordmark">T/L</span>
        <span>
          UNE EXPÉRIENCE INTERACTIVE
          <br />
          THE LAW
        </span>
      </header>
      <div className="home-body">
        <h1 className="serif">THE LAW</h1>
        <p className="serif">{copy.home.tagline}</p>
        {[error, house.error].filter(Boolean).map((message, i) => (
          <p key={i} role="alert" style={{ fontSize: '1rem' }}>
            {message}
          </p>
        ))}
        <div className="home-doors">
          {doors.map((door) => {
            const meta = copy.doors.find(
              (d) => d.timelineId === door.timelineId,
            )!;
            return (
              <div
                key={door.timelineId}
                className="door-card"
                data-status={door.status}
              >
                <span className="mono door-index">
                  {meta.index} / {meta.name}
                </span>
                <p className="serif door-promise">{meta.promise}</p>
                {door.status === 'presentation' ? (
                  <Button
                    className="ghost"
                    onClick={() => setPresentingId(door.timelineId)}
                  >
                    {copy.enter}
                  </Button>
                ) : loaded && house.loaded ? (
                  <Button onClick={() => router.push(routes[door.timelineId]!)}>
                    {door.status === 'in_progress'
                      ? copy.home.resume
                      : door.status === 'completed'
                        ? copy.home.summary
                        : copy.home.start}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
        {(save || house.save) && (
          <div className="home-actions">
            <Link href="/ma-loi" className="law-button ghost">
              {copy.home.laws}
            </Link>
          </div>
        )}
      </div>
      <footer className="footerline mono">
        <span>LA PIÈCE</span>
        <span>TES DÉCISIONS RESTENT ICI</span>
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
          {presenting.timelineId === 't2' && (
            <p className="mono">{copy.threshold.locked}</p>
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
