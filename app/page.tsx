'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../src/store/gameStore';
import { copy } from '../src/content';
import { Button } from '../src/ui/primitives/Button';
export default function Home() {
  const router = useRouter();
  const { save, loaded, error, hydrate, start } = useGameStore();
  useEffect(() => {
    if (!loaded) void hydrate();
  }, [loaded, hydrate]);
  return (
    <main className="home">
      <header className="site-top mono">
        <span className="wordmark">T/L</span>
        <span>
          UNE EXPÉRIENCE INTERACTIVE
          <br />
          LA PIÈCE — TIMELINE I
        </span>
      </header>
      <div className="home-body">
        <h1 className="serif">THE LAW</h1>
        <p className="serif">{copy.home.tagline}</p>
        {error && (
          <p role="alert" style={{ fontSize: '1rem' }}>
            {error}
          </p>
        )}
        <div className="home-actions">
          {loaded && (
            <Button
              onClick={async () => {
                if (save?.events.some((e) => e.type === 'run_completed'))
                  await start();
                router.push('/jouer');
              }}
            >
              {save && !save.events.some((e) => e.type === 'run_completed')
                ? copy.home.resume
                : copy.home.start}
            </Button>
          )}
          {save && (
            <Link href="/ma-loi" className="law-button ghost">
              {copy.home.laws}
            </Link>
          )}
        </div>
      </div>
      <footer className="footerline mono">
        <span>01 / 04</span>
        <span>TES DÉCISIONS RESTENT ICI</span>
      </footer>
    </main>
  );
}
