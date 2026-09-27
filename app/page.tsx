'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../src/store/gameStore';
import { content, copy } from '../src/content';
import { replay, getTimelineDoors } from '../src/engine';
import { Button } from '../src/ui/primitives/Button';
import { Dialog } from '../src/ui/primitives/Dialog';
export default function Home() {
  const router = useRouter();
  const { save, loaded, error, hydrate, start } = useGameStore();
  const [presentingId, setPresentingId] = useState<string | null>(null);
  useEffect(() => {
    if (!loaded) void hydrate();
  }, [loaded, hydrate]);
  const state = useMemo(() => replay(save?.events ?? [], content), [save]);
  const doors = useMemo(() => getTimelineDoors(state, content), [state]);
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
        {error && (
          <p role="alert" style={{ fontSize: '1rem' }}>
            {error}
          </p>
        )}
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
                ) : loaded ? (
                  <Button
                    onClick={async () => {
                      if (door.status === 'completed') await start();
                      router.push('/jouer');
                    }}
                  >
                    {door.status === 'in_progress'
                      ? copy.home.resume
                      : copy.home.start}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
        {save && (
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
          <div className="stack" style={{ marginTop: '2rem' }}>
            <Button onClick={() => setPresentingId(null)}>{copy.back}</Button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
