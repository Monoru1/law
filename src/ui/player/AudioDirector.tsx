'use client';
import { useEffect, useRef } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';
import { soundscapeFor } from '../../audio/actAudio';
import { createProceduralAudioManager } from '../../audio/AudioManager';
import { replay, resolveScene, type Content } from '../../engine';
import type { GameStore } from '../../store/createGameStore';

// Watches the current scene and the player's sound setting, and drives the
// procedural act audio accordingly. Renders nothing; a sibling of the scene
// player, never a dependency of it, so a T1/T2 player is unaffected and an
// audio failure can never block a decision.
export function AudioDirector({
  content,
  useStore,
}: {
  content: Content;
  useStore: UseBoundStore<StoreApi<GameStore>>;
}) {
  const save = useStore((s) => s.save);
  const manager = useRef(createProceduralAudioManager());
  const act = useRef(0);
  const startedOnGesture = useRef(false);

  // Web Audio may only start after a real user gesture; the first click or
  // key on this page is that gesture, listened for once, then forgotten.
  useEffect(() => {
    if (startedOnGesture.current) return;
    const start = () => {
      if (startedOnGesture.current) return;
      startedOnGesture.current = true;
      manager.current.resume();
    };
    document.addEventListener('pointerdown', start, { once: true });
    document.addEventListener('keydown', start, { once: true });
    return () => {
      document.removeEventListener('pointerdown', start);
      document.removeEventListener('keydown', start);
    };
  }, []);

  useEffect(() => {
    manager.current.setMuted(!(save?.settings.sound ?? false));
  }, [save?.settings.sound]);

  useEffect(() => {
    const state = replay(save?.events ?? [], content);
    const raw = content.scenes.find((s) => s.id === state.currentSceneId);
    if (!raw) return;
    const scene = resolveScene(raw, state);
    const soundscape = soundscapeFor(
      scene.id,
      scene.audio?.ambience,
      act.current,
    );
    act.current = soundscape.act;
    manager.current.setProfile(soundscape.gains);
  }, [save, content]);

  useEffect(() => {
    const engine = manager.current;
    return () => engine.setMuted(true);
  }, []);

  return null;
}
