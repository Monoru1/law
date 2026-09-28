import Link from 'next/link';
import { copy } from '../src/content';
export default function NotFound() {
  return (
    <main className="end-screen">
      <h1 className="serif" style={{ fontSize: 'clamp(3rem,9vw,8rem)' }}>
        {copy.absent}
      </h1>
      <p className="mono">
        Erreur 404 — cette adresse ne correspond à aucune page.
      </p>
      <Link href="/" className="law-button">
        Retour à l’accueil
      </Link>
    </main>
  );
}
