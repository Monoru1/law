'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { content, copy } from '../../content';
import { evaluate, renderText, type GameState } from '../../engine';
export function End({
  state,
  reporting,
}: {
  state: GameState;
  reporting?: ReactNode;
}) {
  return (
    <main className="end-screen">
      <div className="end-inner">
        <h1 className="serif">THE LAW</h1>
        <div className="end-statements">
          {copy.end
            .slice(1)
            .filter(
              (line) =>
                !('requires' in line) ||
                !line.requires ||
                evaluate(line.requires, state),
            )
            .map((line, i) => (
              <p key={i} className="serif">
                {renderText(line.text, state, content)}
              </p>
            ))}
        </div>
        <div className="end-actions">
          <Link className="law-button end-cta" href="/ma-loi">
            {copy.return}
          </Link>
          {reporting}
        </div>
      </div>
      <p className="end-teaser mono">{copy.soon}</p>
    </main>
  );
}
