'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { copy } from '../../content';
import {
  evaluate,
  renderText,
  type Content,
  type GameState,
} from '../../engine';
export function End({
  state,
  content,
  reporting,
}: {
  state: GameState;
  content: Content;
  reporting?: ReactNode;
}) {
  const ending =
    content.timelineId === 't2'
      ? copy.endT2
      : content.timelineId === 't3'
        ? copy.endT3
        : copy.end;
  return (
    <main className="end-screen">
      <div className="end-inner">
        <h1 className="serif">{ending[0].text}</h1>
        <div className="end-statements">
          {ending
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
          {content.timelineId === 't1' && (
            <Link className="law-button ghost" href="/jouer/t2">
              {copy.toHouse}
            </Link>
          )}
          {content.timelineId === 't2' && (
            <Link className="law-button ghost" href="/jouer/t3">
              {copy.toCity}
            </Link>
          )}
          {reporting}
        </div>
      </div>
    </main>
  );
}
