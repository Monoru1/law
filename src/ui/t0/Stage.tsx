'use client';
import type { Segment } from './talkView';
import { SPEAKERS, type Env } from './talkView';
import styles from './t0.module.css';

// The place is only light and weather: the frame never draws furniture. It is
// cheap by construction, a few gradients and two moving layers of rain.
export function Place({ env }: { env: Env }) {
  return (
    <>
      <div className={styles.place} data-env={env} aria-hidden="true">
        {env === 'rue' && (
          <>
            <div className={styles.signal} />
            <div className={styles.rain} />
          </>
        )}
      </div>
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
    </>
  );
}

export function DialogueLine({
  segment,
  age,
  instant,
}: {
  segment: Segment;
  age: number;
  instant: boolean;
}) {
  const motion = instant ? { animation: 'none' } : undefined;
  if (segment.kind === 'reply')
    return (
      <p
        className={`${styles.line} ${styles.echo}`}
        data-age={age}
        data-silent={segment.silent ? 'true' : undefined}
        style={motion}
      >
        {segment.text}
      </p>
    );
  if (segment.who === 'year')
    return (
      <p
        className={`${styles.line} ${styles.year}`}
        data-age={age}
        style={motion}
      >
        {segment.text}
      </p>
    );
  if (segment.who === 'notif')
    return (
      <p
        className={`${styles.line} ${styles.notif}`}
        data-age={age}
        style={motion}
      >
        <span>LAW · maintenant</span>
        {segment.text}
      </p>
    );
  const voice =
    segment.who === 'narrator'
      ? styles.narrator
      : segment.who === 'law'
        ? styles.law
        : styles.person;
  const named =
    segment.opens && segment.who !== 'law' && segment.who !== 'narrator';
  return (
    <>
      {named && (
        <span className={styles.speaker}>
          {SPEAKERS[segment.who] ?? segment.who}
        </span>
      )}
      <p
        className={`${styles.line} ${voice} ${
          segment.style === 'emphasis'
            ? styles.emphasis
            : segment.style === 'whisper'
              ? styles.whisper
              : ''
        }`}
        data-age={age}
        style={motion}
      >
        {segment.text}
      </p>
    </>
  );
}

// Black, and a few words. Sometimes the whole scene is this.
export function TitleCard({ lines }: { lines: string[] }) {
  return (
    <div className={styles.card} role="status">
      <div>
        {lines.map((text, index) => (
          <p key={index} style={{ animationDelay: `${index * 1.2}s` }}>
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}
