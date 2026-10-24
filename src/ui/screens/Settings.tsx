'use client';
import type { StoreApi, UseBoundStore } from 'zustand';
import { useState } from 'react';
import type { GameStore } from '../../store/createGameStore';
import { copy } from '../../content';
import { Button } from '../primitives/Button';
import { Dialog } from '../primitives/Dialog';
// Settings belong to the journal being played, not always to Timeline I.
export function Settings({
  close,
  store,
  label = 'THE LAW: REBIRTH / 01',
}: {
  close: () => void;
  store: UseBoundStore<StoreApi<GameStore>>;
  label?: string;
}) {
  const save = store((s) => s.save);
  const persistSettings = store((s) => s.settings);
  const [saveError, setSaveError] = useState('');
  const update = (value: Parameters<GameStore['settings']>[0]) => {
    void persistSettings(value)
      .then(() => setSaveError(''))
      .catch(() =>
        setSaveError(
          'Le réglage n’a pas pu être enregistré. La partie est conservée.',
        ),
      );
  };
  const s = save?.settings;
  if (!s) return null;
  return (
    <Dialog label={copy.settings} close={close}>
      <p className="mono">{label}</p>
      <h2 className="serif">{copy.settings}</h2>
      <label className="settings-row">
        <span>{copy.reduce}</span>
        <select
          value={s.reducedMotion}
          onChange={(e) =>
            update({
              reducedMotion: e.target.value as typeof s.reducedMotion,
            })
          }
        >
          <option value="auto">Auto</option>
          <option value="on">Oui</option>
          <option value="off">Non</option>
        </select>
      </label>
      <label className="settings-row">
        <span>{copy.font}</span>
        <select
          value={s.textSize}
          onChange={(e) =>
            update({ textSize: e.target.value as typeof s.textSize })
          }
        >
          <option value="small">Petite</option>
          <option value="normal">Normale</option>
          <option value="large">Grande</option>
        </select>
      </label>
      <label className="settings-row">
        <span>{copy.sound}</span>
        <input
          type="checkbox"
          checked={s.sound}
          onChange={(e) => update({ sound: e.target.checked })}
        />
      </label>
      <label className="settings-row">
        <span>Volume</span>
        <input
          aria-label="Volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={s.volume ?? 0.65}
          onChange={(event) => update({ volume: Number(event.target.value) })}
        />
      </label>
      {saveError && <p role="alert">{saveError}</p>}
      <div style={{ marginTop: 35 }}>
        <Button onClick={close}>{copy.resume}</Button>
      </div>
    </Dialog>
  );
}
