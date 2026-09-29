'use client';
import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { copy } from '../../content';
import { contentT2 } from '../../content/t2';
import { contentT3 } from '../../content/t3';
import { buildMemory, replay } from '../../engine';
import { useT2GameStore } from '../../store/gameStoreT2';
import { useT3GameStore } from '../../store/gameStoreT3';
import { Button } from '../primitives/Button';
import { AudioDirector } from './AudioDirector';
import { ScenePlayer } from './ScenePlayer';

// The city opens on what the house left behind, which already carries what
// the room left behind. The memory is copied into the new journal once, at
// the threshold; Timeline II is never rewritten.
function Threshold() {
  const t2Save = useT2GameStore((s) => s.save);
  const t2Loaded = useT2GameStore((s) => s.loaded);
  const t2Error = useT2GameStore((s) => s.error);
  const hydrateT2 = useT2GameStore((s) => s.hydrate);
  const start = useT3GameStore((s) => s.start);
  const error = useT3GameStore((s) => s.error);
  const incompatible = useT3GameStore((s) => s.incompatible);
  useEffect(() => {
    if (!t2Loaded) void hydrateT2();
  }, [t2Loaded, hydrateT2]);
  const house = useMemo(
    () => replay(t2Save?.events ?? [], contentT2),
    [t2Save],
  );
  const door = copy.doors.find((d) => d.timelineId === 't3')!;
  const enter = async (reportingConsent: boolean, replaceExisting = false) => {
    if (!t2Save || !house.completed) return;
    try {
      await start({
        ...(replaceExisting ? { replaceExisting: true as const } : {}),
        pseudonym: t2Save.pseudonym,
        reportingConsent,
        inherited: {
          fromRunId: t2Save.runId,
          memory: buildMemory(house, contentT2, contentT3.inherits!.place),
        },
      });
    } catch {
      /* The store exposes the error below; nothing was written. */
    }
  };
  if (!t2Loaded) return <main className="end-screen mono">THE LAW</main>;
  const consent = t2Save?.reportingConsent === true;
  return (
    <div className="home" role="main">
      <div className="site-top mono">
        <span>THE LAW / 03</span>
        <span>
          {door.index} / {door.name}
        </span>
      </div>
      <div style={{ maxWidth: 750 }}>
        {incompatible ? (
          copy.threshold3.incompatible.split('\n\n').map((paragraph) => (
            <p key={paragraph} className="serif threshold-line">
              {paragraph}
            </p>
          ))
        ) : t2Error ? (
          <p className="serif threshold-line">{copy.threshold3.unreadable}</p>
        ) : !house.completed ? (
          <p className="serif threshold-line">{copy.threshold3.locked}</p>
        ) : (
          door.presentation?.split('\n\n').map((para, i) => (
            <p key={i} className="serif threshold-line">
              {para}
            </p>
          ))
        )}
        {house.completed && consent && (
          <p className="mono threshold-note">{copy.threshold3.reportNote}</p>
        )}
        {error && !incompatible && <p role="alert">{error}</p>}
        <div className="home-actions" style={{ marginTop: 40 }}>
          {incompatible && house.completed && !t2Error ? (
            <>
              <Button onClick={() => void enter(consent, true)}>
                {copy.threshold3.restart}
              </Button>
              {consent && (
                <Button
                  className="ghost"
                  onClick={() => void enter(false, true)}
                >
                  {copy.threshold3.restartWithoutReport}
                </Button>
              )}
            </>
          ) : house.completed && !t2Error ? (
            <>
              <Button onClick={() => void enter(consent)}>
                {copy.threshold3.enter}
              </Button>
              {consent && (
                <Button className="ghost" onClick={() => void enter(false)}>
                  {copy.threshold3.enterWithoutReport}
                </Button>
              )}
            </>
          ) : (
            !t2Error && (
              <Link className="law-button" href="/jouer/t2">
                {copy.threshold3.toRoom}
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

export function ScenePlayerT3() {
  return (
    <>
      <AudioDirector content={contentT3} useStore={useT3GameStore} />
      <ScenePlayer
        content={contentT3}
        useStore={useT3GameStore}
        threshold={<Threshold />}
      />
    </>
  );
}
