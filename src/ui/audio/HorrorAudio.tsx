'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

/**
 * A small procedural horror soundscape. No external media, tracking, or network.
 * Browser autoplay rules mean that audio starts only after a real user gesture.
 */
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
  // Lazy initializers, not an effect: reading the saved preference is part
  // of computing the first client render, not a side effect to synchronize
  // afterwards (avoids a cascading setState-in-effect render, and the
  // default is used safely during SSR, where there is no `window`).
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('thelaw:audio:enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 0.38;
    try {
      const raw = localStorage.getItem('thelaw:audio:volume');
      const saved = raw === null ? NaN : Number(raw);
      return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : 0.38;
    } catch {
      return 0.38;
    }
  });
  const [error, setError] = useState(false);
  // Excludes any route whose own player already mounts a dedicated audio
  // engine and its own "Activer le son" control
  // (src/ui/player/AudioDirector.tsx's useInvestigationAudio): /jouer/t0
  // (Les Archives du silence) and /jouer/sixieme-place (La Sixième Place,
  // via ScenePlayerTribunal's `dossier` mode). Two independent sound
  // toggles on the same screen would be a real, confusing duplicate, not a
  // cosmetic one.
  const ownAudioRoutes = [
    '/jouer/t0',
    '/jouer/sixieme-place',
    '/jouer/tribunal',
  ];
  const isGame =
    pathname === '/' ||
    (pathname.startsWith('/jouer/') &&
      !ownAudioRoutes.some((route) => pathname.startsWith(route)));
  // Whether this is a real client render yet, without a setState-in-effect:
  // the subscription never fires (nothing external changes), so this only
  // ever flips the SSR snapshot (false) to the client one (true) on the
  // client's own first render — the same hydration-safety the previous
  // `ready` state + mount effect gave, without tripping the "don't setState
  // synchronously in an effect" rule.
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

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
    audio.master.gain.setTargetAtTime(
      enabled && isGame ? volume : 0,
      now,
      0.35,
    );
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
