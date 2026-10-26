'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  createInvestigationAudio,
  type AudioPlace,
  type SoundCue,
} from '../../audio/AudioManager';
import { useT0GameStore } from '../../store/gameStoreT0';
import type { GameStore } from '../../store/createGameStore';
import type { StoreApi, UseBoundStore } from 'zustand';

export function useInvestigationAudio(
  place: AudioPlace,
  store: UseBoundStore<StoreApi<GameStore>> = useT0GameStore,
  duck = false,
) {
  const settings = store((state) => state.save?.settings);
  const update = store((state) => state.settings);
  const engine = useMemo(() => createInvestigationAudio(), []);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    engine.configure({
      place,
      muted: !settings?.sound,
      volume: (settings?.volume ?? 0.65) * (duck ? 0.42 : 1),
    });
  }, [engine, place, settings?.sound, settings?.volume, duck]);
  useEffect(() => () => engine.dispose(), [engine]);
  useEffect(() => {
    if (
      !started ||
      !settings?.sound ||
      !['apartment', 'tribunal'].includes(place)
    )
      return;
    const timer = setInterval(
      () => void engine.cue('clock'),
      place === 'tribunal' ? 6500 : 2400,
    );
    return () => clearInterval(timer);
  }, [engine, started, settings?.sound, place]);
  return {
    enabled: started && settings?.sound === true,
    error,
    async toggle() {
      try {
        if (started && settings?.sound) {
          engine.configure({
            place,
            muted: true,
            volume: settings.volume ?? 0.65,
          });
          await update({ sound: false });
          return;
        }
        const ok = await engine.start();
        setStarted(ok);
        if (ok) {
          setError('');
          await update({ sound: true });
        } else
          setError(
            'Le son est indisponible. Les transcriptions restent accessibles.',
          );
      } catch {
        engine.configure({
          place,
          muted: true,
          volume: settings?.volume ?? 0.65,
        });
        setStarted(false);
        setError(
          'Le réglage audio n’a pas pu être enregistré. La partie est conservée.',
        );
      }
    },
    async cue(name: SoundCue) {
      return engine.cue(name);
    },
    stopVoice: engine.stopVoice,
    listener: engine.listener,
  };
}
