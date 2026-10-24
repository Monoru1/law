'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * A small procedural horror soundscape. No external media, tracking, or network.
 * Browser autoplay rules mean that audio starts only after a real user gesture.
 */
type AudioContextCtor = typeof AudioContext;
type SoundEngine = {
  context: AudioContext;
  master: GainNode;
  ambience: GainNode;
  stop: () => void;
  click: () => void;
};

function buildEngine(): SoundEngine {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const ambience = context.createGain();
  ambience.gain.value = 0.22;
  ambience.connect(master);

  const oscillators: OscillatorNode[] = [];
  // A detuned, dissonant cluster: tension without a repeating musical loop.
  for (const [frequency, amplitude, type] of [
    [43.65, 0.23, 'sine'],
    [65.41, 0.12, 'triangle'],
    [82.8, 0.07, 'sine'],
    [116.54, 0.025, 'sine'],
  ] as const) {
    const osc = context.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    const voice = context.createGain();
    voice.gain.value = amplitude;
    osc.connect(voice).connect(ambience);
    osc.start();
    oscillators.push(osc);
  }

  // Slow, unsynchronised breathing in the background.
  const motion = context.createOscillator();
  motion.frequency.value = 0.075;
  const motionDepth = context.createGain();
  motionDepth.gain.value = 0.075;
  motion.connect(motionDepth).connect(ambience.gain);
  motion.start();
  oscillators.push(motion);

  const click = () => {
    if (context.state !== 'running') return;
    const now = context.currentTime;
    const tone = context.createOscillator();
    const envelope = context.createGain();
    tone.type = 'triangle';
    tone.frequency.setValueAtTime(390, now);
    tone.frequency.exponentialRampToValueAtTime(145, now + 0.085);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.16, now + 0.006);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    tone.connect(envelope).connect(master);
    tone.start(now);
    tone.stop(now + 0.12);
  };

  return {
    context,
    master,
    ambience,
    click,
    stop: () => {
      oscillators.forEach((osc) => osc.stop());
      void context.close();
    },
  };
}

export function HorrorAudio() {
  const pathname = usePathname();
  const engine = useRef<SoundEngine | null>(null);
  const enabledRef = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(0.38);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const isGame = pathname === '/' || pathname.startsWith('/jouer/');

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem('thelaw:audio:enabled') === 'true');
      const saved = Number(localStorage.getItem('thelaw:audio:volume'));
      if (Number.isFinite(saved) && saved >= 0 && saved <= 1) {
        setVolume(saved);
      }
    } catch {
      // Private browsing or storage restrictions: audio still works.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    enabledRef.current = enabled;
    try {
      localStorage.setItem('thelaw:audio:enabled', String(enabled));
      localStorage.setItem('thelaw:audio:volume', String(volume));
    } catch {
      // Persistence is optional.
    }
    const audio = engine.current;
    if (!audio) return;
    const now = audio.context.currentTime;
    audio.master.gain.cancelScheduledValues(now);
    audio.master.gain.setTargetAtTime(enabled && isGame ? volume : 0, now, 0.35);
  }, [enabled, volume, isGame]);

  useEffect(() => {
    if (!isGame) return;
    const unlock = () => {
      if (!enabledRef.current) return;
      try {
        if (!engine.current) engine.current = buildEngine();
        void engine.current.context.resume().then(() => {
          const audio = engine.current;
          if (!audio) return;
          audio.master.gain.setTargetAtTime(
            enabledRef.current ? volume : 0,
            audio.context.currentTime,
            0.35,
          );
        });
      } catch {
        setError(true);
      }
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest('button, a, [role="button"]')) return;
      unlock();
      engine.current?.click();
    };
    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('click', onClick);
    };
  }, [isGame, volume]);

  useEffect(() => {
    return () => {
      engine.current?.stop();
      engine.current = null;
    };
  }, []);

  if (!isGame || !ready) return null;
  return (
    <aside
      aria-label="Ambiance sonore du jeu"
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 12px',
        border: '1px solid #6a5351',
        background: 'rgba(9,8,9,.94)',
        color: '#e6ded3',
        fontSize: 12,
      }}
    >
      <button
        type="button"
        aria-pressed={enabled}
        onClick={() => {
          if (!enabled) {
            try {
              if (!engine.current) engine.current = buildEngine();
              void engine.current.context.resume();
            } catch {
              setError(true);
            }
          }
          setEnabled(!enabled);
        }}
        style={{
          color: 'inherit',
          background: 'transparent',
          border: '1px solid #6a5351',
          minHeight: 36,
          padding: '6px 9px',
        }}
      >
        {enabled ? 'Couper le son' : 'Activer le son'}
      </button>
      <label htmlFor="law-audio-volume">Volume</label>
      <input
        id="law-audio-volume"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(event) => setVolume(Number(event.target.value))}
        aria-label="Volume de l'ambiance"
        style={{ width: 70, accentColor: '#b9a18c' }}
      />
      {error && <span role="status">Audio indisponible</span>}
    </aside>
  );
}
