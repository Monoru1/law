'use client';
import { useState } from 'react';
import { copy } from '../../content';
import { Button } from '../primitives/Button';
import Link from 'next/link';

export function Onboarding({
  enter,
  error,
  defaultPseudonym,
}: {
  enter: (pseudonym: string) => void;
  error?: string | null;
  defaultPseudonym?: string;
}) {
  const [pseudo, setPseudo] = useState(defaultPseudonym ?? '');

  const trimmed = pseudo.trim().slice(0, 64);

  return (
    <div className="home" role="main">
      <div className="site-top mono">
        <span>THE LAW: REBIRTH / 01</span>
        <span>PROTOCOLE T1</span>
      </div>
      <div style={{ maxWidth: 750 }}>
        {copy.onboarding.map((line, i) => (
          <p
            key={i}
            className={
              'style' in line && line.style === 'meta' ? 'mono' : 'serif'
            }
            style={{
              fontSize:
                'style' in line && line.style === 'meta'
                  ? '1rem'
                  : 'clamp(2.3rem,5vw,4.5rem)',
              lineHeight: 1.05,
              margin: '16px 0',
            }}
          >
            {line.text}
          </p>
        ))}
        <div style={{ marginTop: 40 }}>
          <label
            className="mono"
            style={{ display: 'block', fontSize: '1rem', marginBottom: 8 }}
          >
            {copy.arrival.pseudoLabel}
          </label>
          <input
            className="field"
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value.slice(0, 64))}
            placeholder={copy.arrival.pseudoPlaceholder}
            maxLength={64}
            aria-label={copy.arrival.pseudoLabel}
            style={{ width: '100%' }}
          />
          <p
            className="mono"
            style={{ fontSize: '0.85rem', margin: '8px 0 0', opacity: 0.6 }}
          >
            {copy.arrival.pseudoHint}
          </p>
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="home-actions" style={{ marginTop: 40 }}>
          <Button
            onClick={() => {
              if (!trimmed) return;
              enter(trimmed);
            }}
            disabled={!trimmed}
          >
            {copy.enter}
          </Button>
          <Link className="law-button ghost" href="/">
            {copy.back}
          </Link>
        </div>
      </div>
      <div className="footerline mono">
        <span>LA PIÈCE</span>
        <span>UNE FICTION INTERACTIVE</span>
      </div>
    </div>
  );
}
