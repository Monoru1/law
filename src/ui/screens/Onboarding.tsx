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
  enter: (pseudonym: string, consent: boolean) => void;
  error?: string | null;
  defaultPseudonym?: string;
}) {
  const [pseudo, setPseudo] = useState(defaultPseudonym ?? '');
  const [step, setStep] = useState<'intro' | 'consent'>('intro');

  const trimmed = pseudo.trim().slice(0, 64);

  if (step === 'consent') {
    return (
      <div className="home" role="main">
        <div className="site-top mono">
          <span>THE LAW / 01</span>
          <span>PROTOCOLE T1</span>
        </div>
        <div style={{ maxWidth: 750 }}>
          <p className="mono" style={{ fontSize: '1rem', margin: '16px 0' }}>
            {copy.playtestIntro.consentTitle}
          </p>
          <p
            className="serif"
            style={{
              fontSize: 'clamp(1.2rem,2.5vw,1.8rem)',
              lineHeight: 1.4,
              margin: '16px 0',
            }}
          >
            {copy.playtestIntro.consentBody}
          </p>
          {error && <p role="alert">{error}</p>}
          <div className="home-actions" style={{ marginTop: 50 }}>
            <Button
              onClick={() => {
                if (!trimmed) {
                  setStep('intro');
                  return;
                }
                enter(trimmed, true);
              }}
            >
              {copy.playtestIntro.consentAccept}
            </Button>
            <Button className="ghost" onClick={() => setStep('intro')}>
              {copy.playtestIntro.consentDecline}
            </Button>
          </div>
        </div>
        <div className="footerline mono">
          <span>LA PIÈCE</span>
          <span>UNE FICTION INTERACTIVE</span>
        </div>
      </div>
    );
  }

  return (
    <div className="home" role="main">
      <div className="site-top mono">
        <span>THE LAW / 01</span>
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
            {copy.playtestIntro.pseudoLabel}
          </label>
          <input
            className="field"
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value.slice(0, 64))}
            placeholder={copy.playtestIntro.pseudoPlaceholder}
            maxLength={64}
            aria-label={copy.playtestIntro.pseudoLabel}
            style={{ width: '100%' }}
          />
          <p
            className="mono"
            style={{ fontSize: '0.85rem', margin: '8px 0 0', opacity: 0.6 }}
          >
            {copy.playtestIntro.pseudoHint}
          </p>
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="home-actions" style={{ marginTop: 40 }}>
          <Button
            onClick={() => {
              if (!trimmed) return;
              setStep('consent');
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
