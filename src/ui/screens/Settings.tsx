'use client';
import { useGameStore } from '../../store/gameStore';
import { copy } from '../../content';
import { Button } from '../primitives/Button';
export function Settings({ close }: { close: () => void }) {
  const save = useGameStore((s) => s.save);
  const update = useGameStore((s) => s.settings);
  const s = save?.settings;
  if (!s) return null;
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label={copy.settings}
    >
      <div className="overlay-inner">
        <p className="mono">THE LAW / 01</p>
        <h2 className="serif">{copy.settings}</h2>
        <div className="settings-row">
          <span>{copy.simple}</span>
          <input
            type="checkbox"
            checked={s.simpleConfirmation}
            onChange={(e) => update({ simpleConfirmation: e.target.checked })}
          />
        </div>
        <div className="settings-row">
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
        </div>
        <div className="settings-row">
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
        </div>
        <div className="settings-row">
          <span>{copy.sound}</span>
          <input
            type="checkbox"
            checked={s.sound}
            onChange={(e) => update({ sound: e.target.checked })}
          />
        </div>
        <div style={{ marginTop: 35 }}>
          <Button onClick={close}>{copy.continue}</Button>
        </div>
      </div>
    </div>
  );
}
