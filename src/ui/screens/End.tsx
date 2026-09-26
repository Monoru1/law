'use client';
import Link from 'next/link';
import { content, copy } from '../../content';
import { evaluate, renderText, type GameState } from '../../engine';
export function End({ state }: { state: GameState }) {
  return (
    <main className="end-screen">
      <h1 className="serif">THE LAW</h1>
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
      <Link className="law-button" style={{ marginTop: 38 }} href="/ma-loi">
        {copy.return}
      </Link>
      <small
        className="mono"
        style={{
          position: 'absolute',
          bottom: 25,
          color: 'var(--law-gray-300)',
        }}
      >
        {copy.soon}
      </small>
    </main>
  );
}
