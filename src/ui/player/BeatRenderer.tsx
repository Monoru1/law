'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  beatDelay,
  completionDelay,
  renderText,
  type Beat,
  type BeatSequenceMode,
  type Content,
  type GameState,
} from '../../engine';
export function BeatRenderer({
  beats,
  state,
  content,
  lawNumber,
  onDone,
  instant = false,
  reduceAnimations = false,
  paused = false,
  mode = 'decision',
}: {
  beats: Beat[];
  state: GameState;
  content: Content;
  lawNumber?: number;
  onDone: () => void;
  instant?: boolean;
  reduceAnimations?: boolean;
  paused?: boolean;
  mode?: BeatSequenceMode;
}) {
  const reduced = useReducedMotion();
  const done = useRef(onDone);
  const latest = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);
  const [shown, setShown] = useState(
    instant || reduced || reduceAnimations ? beats.length : 0,
  );
  useEffect(() => {
    if (paused) return;
    if (shown >= beats.length) {
      const delay = completionDelay(beats, mode);
      if (delay === 0) {
        done.current();
        return;
      }
      const completion = setTimeout(() => done.current(), delay);
      return () => clearTimeout(completion);
    }
    const t = setTimeout(
      () => setShown((n) => n + 1),
      shown === 0 ? 180 : beatDelay(beats[shown - 1]!),
    );
    return () => clearTimeout(t);
  }, [shown, beats, paused, mode]);
  useEffect(() => {
    if (paused || shown === 0 || shown >= beats.length) return;
    latest.current?.scrollIntoView({
      block: 'nearest',
      behavior: reduced || reduceAnimations ? 'auto' : 'smooth',
    });
  }, [shown, beats.length, paused, reduced, reduceAnimations]);
  return (
    <div className="beats" aria-live="polite" aria-atomic="false">
      {beats.slice(0, shown).map((beat, i) => (
        <motion.p
          ref={i === shown - 1 ? latest : undefined}
          key={`${i}-${beat.text}`}
          initial={reduced || reduceAnimations ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`serif beat ${beat.style ?? ''} ${beat.text === '—' ? 'dash' : ''}`}
        >
          {renderText(beat.text, state, content, lawNumber)}
        </motion.p>
      ))}
    </div>
  );
}
