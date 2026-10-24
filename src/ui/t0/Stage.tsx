'use client';
import Image from 'next/image';
import { applyFrenchTypography } from '../../engine';
import type { EvidenceDocument, LocationId } from '../../content/rebirth';
import styles from './t0.module.css';

export function Place({ location }: { location: LocationId }) {
  const asset = location === 'school' ? 'school' : 'apartment';
  return (
    <div
      className={styles.environment}
      data-location={location}
      aria-hidden="true"
    >
      <Image
        src={`/rebirth/${asset}.webp`}
        alt=""
        fill
        sizes="100vw"
        priority
        quality={85}
      />
      <div className={styles.weather} />
      <div className={styles.shade} />
    </div>
  );
}
export function Portrait({ who, name }: { who: string; name: string }) {
  if (!['gabriel', 'nora-delmas', 'adrien-keller'].includes(who)) return null;
  return (
    <Image
      className={styles.portrait}
      src={`/rebirth/${who}.svg`}
      width={72}
      height={88}
      alt={name}
      unoptimized
    />
  );
}
export function DocumentSheet({
  document,
  play,
  audioEnabled,
}: {
  document: EvidenceDocument;
  play?: () => void;
  audioEnabled?: boolean;
}) {
  return (
    <article className={styles.paper}>
      <p className={styles.documentId}>{document.id} · Pièce du dossier</p>
      <h2>{document.title}</h2>
      <p className={styles.source}>
        {document.source}
        <br />
        {document.date}
      </p>
      {document.image && (
        <Image
          className={styles.evidenceImage}
          src={document.image}
          alt={
            document.id === 'RB-001'
              ? 'Reconstitution illustrée du tirage d’Élise, personnage fictif'
              : 'Illustration de la silhouette devant B-17, sans visage identifiable'
          }
          width={600}
          height={420}
          unoptimized
        />
      )}
      {document.paragraphs.map((text, index) => (
        <p key={index}>{applyFrenchTypography(text)}</p>
      ))}
      {document.transcript && (
        <>
          <h3>Transcription de l’enregistrement</h3>
          <blockquote>{applyFrenchTypography(document.transcript)}</blockquote>
        </>
      )}
      {play && (
        <button
          className="law-button"
          type="button"
          onClick={play}
          disabled={!audioEnabled}
        >
          Écouter l’enregistrement restauré
        </button>
      )}
      {play && !audioEnabled && (
        <p>
          Active le son dans la barre de jeu pour écouter. La transcription
          contient les mêmes informations.
        </p>
      )}
    </article>
  );
}
