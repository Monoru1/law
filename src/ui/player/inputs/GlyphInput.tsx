'use client';
import type { OptionSpec } from '../../../engine';
function Heart() {
  return (
    <svg
      width="35"
      height="37"
      viewBox="0 0 35 37"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M17.5 31 4.4 17.3C-3.1 7.1 9.6-1.7 17.5 8.1 25.4-1.7 38.1 7.1 30.6 17.3L17.5 31Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
export function GlyphInput({
  options,
  value,
  onChange,
}: {
  options: OptionSpec[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="glyph-grid" role="group" aria-label="Choix final">
      {options.map((option) => (
        <button
          key={option.id}
          className={`glyph-choice ${value === option.id ? 'selected' : ''}`}
          aria-label={option.label}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {Array.from({ length: option.id === 'un' ? 1 : 5 }, (_, i) => (
            <Heart key={i} />
          ))}
        </button>
      ))}
    </div>
  );
}
