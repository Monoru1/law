'use client';
import {
  collectedDocuments,
  type EvidenceDocument,
} from '../../content/rebirth';
import type { GameState, TalkReply } from '../../engine';
import styles from './t0.module.css';

export function ConversationChoice({
  replies,
  onSay,
  disabled,
}: {
  replies: TalkReply[];
  onSay: (reply: TalkReply) => void;
  disabled: boolean;
}) {
  return (
    <ol className={styles.replies} aria-label="Actions disponibles">
      {replies.map((reply, index) => (
        <li key={reply.id}>
          <button
            type="button"
            className={styles.reply}
            data-reply={reply.id}
            disabled={disabled}
            onClick={() => onSay(reply)}
          >
            <span className={styles.actionIndex} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>{reply.label}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
export function EvidenceList({
  state,
  open,
}: {
  state: GameState;
  open: (document: EvidenceDocument) => void;
}) {
  const items = collectedDocuments(state);
  return (
    <section aria-label="Pièces consignées">
      <h2 className="serif">Les pièces consignées</h2>
      {items.length === 0 ? (
        <p>
          Aucune pièce consignée. Examiner un document ne suffit pas : choisis
          de le consigner pour le conserver dans ce carnet.
        </p>
      ) : (
        <ul className={styles.evidenceList}>
          {items.map((document) => (
            <li key={document.id}>
              <button type="button" onClick={() => open(document)}>
                <span className="mono">{document.id}</span>
                <span>{document.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
