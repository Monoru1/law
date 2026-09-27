'use client';
import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { content, copy } from '../../content';
import { contentT2 } from '../../content/t2';
import { buildMemory, replay } from '../../engine';
import { useGameStore } from '../../store/gameStore';
import { useT2GameStore } from '../../store/gameStoreT2';
import { Button } from '../primitives/Button';
import { ScenePlayer } from './ScenePlayer';

// The house opens on what the room left behind. The memory is copied into the
// new journal once, at the threshold; Timeline I is never rewritten.
function Threshold() {
  const t1Save = useGameStore((s) => s.save);
  const t1Loaded = useGameStore((s) => s.loaded);
  const t1Error = useGameStore((s) => s.error);
  const hydrateT1 = useGameStore((s) => s.hydrate);
  const start = useT2GameStore((s) => s.start);
  const error = useT2GameStore((s) => s.error);
  useEffect(() => {
    if (!t1Loaded) void hydrateT1();
  }, [t1Loaded, hydrateT1]);
  const room = useMemo(() => replay(t1Save?.events ?? [], content), [t1Save]);
  const door = copy.doors.find((d) => d.timelineId === 't2')!;
  const enter = async (reportingConsent: boolean) => {
    if (!t1Save || !room.completed) return;
    try {
      await start({
        pseudonym: t1Save.pseudonym,
        reportingConsent,
        inherited: {
          fromRunId: t1Save.runId,
          memory: buildMemory(room, content, contentT2.inherits!.place),
        },
      });
    } catch {
      /* The store exposes the error below; nothing was written. */
    }
  };
  if (!t1Loaded) return <main className="end-screen mono">THE LAW</main>;
  const consent = t1Save?.reportingConsent === true;
  return (
    <div className="home" role="main">
      <div className="site-top mono">
        <span>THE LAW / 02</span>
        <span>
          {door.index} / {door.name}
        </span>
      </div>
      <div style={{ maxWidth: 750 }}>
        {t1Error ? (
          <p className="serif threshold-line">{copy.threshold.unreadable}</p>
        ) : !room.completed ? (
          <p className="serif threshold-line">{copy.threshold.locked}</p>
        ) : (
          door.presentation?.split('\n\n').map((para, i) => (
            <p key={i} className="serif threshold-line">
              {para}
            </p>
          ))
        )}
        {room.completed && consent && (
          <p className="mono threshold-note">{copy.threshold.reportNote}</p>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="home-actions" style={{ marginTop: 40 }}>
          {room.completed && !t1Error ? (
            <>
              <Button onClick={() => void enter(consent)}>
                {copy.threshold.enter}
              </Button>
              {consent && (
                <Button className="ghost" onClick={() => void enter(false)}>
                  {copy.threshold.enterWithoutReport}
                </Button>
              )}
            </>
          ) : (
            !t1Error && (
              <Link className="law-button" href="/jouer">
                {copy.threshold.toRoom}
              </Link>
            )
          )}
          <Link className="law-button ghost" href="/">
            {copy.back}
          </Link>
        </div>
      </div>
      <div className="footerline mono">
        <span>{door.name}</span>
        <span>UNE FICTION INTERACTIVE</span>
      </div>
    </div>
  );
}

export function ScenePlayerT2() {
  return (
    <ScenePlayer
      content={contentT2}
      useStore={useT2GameStore}
      threshold={<Threshold />}
    />
  );
}
