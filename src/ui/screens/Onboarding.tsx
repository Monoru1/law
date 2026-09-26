'use client';
import { copy } from '../../content';
import { Button } from '../primitives/Button';
export function Onboarding({ enter }: { enter: () => void }) {
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
        <div style={{ marginTop: 50 }}>
          <Button onClick={enter}>{copy.enter}</Button>
        </div>
      </div>
      <div className="footerline mono">
        <span>LA PIÈCE</span>
        <span>UNE FICTION INTERACTIVE</span>
      </div>
    </div>
  );
}
