'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { TalkReply } from '../../engine';
import styles from './t0.module.css';

const HOLD_MS = 1300;
// Wall-clock reads live outside render so a component stays a pure description.
const now = () => performance.now();

// A reply is a line you can say, not a button in a card. Digits 1-9 say it too.
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
    <ol className={styles.replies} aria-label="Ta réponse">
      {replies.map((reply, index) => (
        <li key={reply.id}>
          {reply.hold ? (
            <HoldDecision
              reply={reply}
              index={index}
              disabled={disabled}
              onDone={() => onSay(reply)}
            />
          ) : (
            <button
              type="button"
              className={styles.reply}
              data-silent={reply.silent ? 'true' : undefined}
              data-reply={reply.id}
              disabled={disabled}
              onClick={() => onSay(reply)}
            >
              <span className={styles.idx} aria-hidden="true">
                {index + 1}
              </span>
              <span>{reply.label}</span>
            </button>
          )}
        </li>
      ))}
    </ol>
  );
}

// An irreversible act asks to be held, not tapped: the red is the only red in
// the room. A key held down does the same, so it never needs a pointer.
export function HoldDecision({
  reply,
  index,
  disabled,
  onDone,
}: {
  reply: TalkReply;
  index: number;
  disabled: boolean;
  onDone: () => void;
}) {
  const [held, setHeld] = useState(0);
  const frame = useRef<number | null>(null);
  const since = useRef<number | null>(null);
  const done = useRef(false);
  const stop = () => {
    since.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    if (!done.current) setHeld(0);
  };
  const tick = () => {
    if (since.current === null) return;
    const progress = Math.min(1, (now() - since.current) / HOLD_MS);
    setHeld(progress);
    if (progress >= 1 && !done.current) {
      done.current = true;
      onDone();
      return;
    }
    frame.current = requestAnimationFrame(tick);
  };
  const begin = () => {
    if (disabled || done.current || since.current !== null) return;
    since.current = now();
    frame.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => stop(), []);
  return (
    <button
      type="button"
      className={styles.reply}
      data-hold="true"
      data-reply={reply.id}
      disabled={disabled}
      style={{ '--held': held } as React.CSSProperties}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
          event.preventDefault();
          begin();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === 'Enter' || event.key === ' ') stop();
      }}
      onBlur={stop}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className={styles.idx} aria-hidden="true">
        {index + 1}
      </span>
      <span>
        {reply.label}
        <span className={styles.hint}>Maintenir pour confirmer</span>
      </span>
    </button>
  );
}

// The thin line that runs out: only visible once time is nearly gone, never a
// clock face. Letting it end is an answer of its own, and it is recorded so.
export function TimedBar({
  ms,
  onExpire,
  reduced,
}: {
  ms: number;
  onExpire: () => void;
  reduced: boolean;
}) {
  const expire = useRef(onExpire);
  const [remaining, setRemaining] = useState(ms);
  useEffect(() => {
    expire.current = onExpire;
  }, [onExpire]);
  useEffect(() => {
    let left = ms;
    let last = now();
    const id = setInterval(() => {
      const t = now();
      // Time spent away from the page does not count against the player.
      if (!document.hidden) left -= t - last;
      last = t;
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        expire.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, [ms]);
  if (reduced || remaining > Math.min(ms * 0.4, 12000)) return null;
  return (
    <div
      className={styles.timer}
      aria-hidden="true"
      style={{ animationDuration: `${Math.max(0, remaining)}ms` }}
    />
  );
}

export function WriteBox({
  prompt,
  placeholder,
  maxLength,
  declineLabel,
  onWrite,
  onDecline,
  disabled,
}: {
  prompt: string;
  placeholder: string;
  maxLength: number;
  declineLabel: string;
  onWrite: (text: string) => void;
  onDecline: () => void;
  disabled: boolean;
}) {
  const [text, setText] = useState('');
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (matchMedia('(hover: hover) and (pointer: fine)').matches)
      area.current?.focus({ preventScroll: true });
  }, []);
  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const clean = text.replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
    if (clean && !disabled) onWrite(clean.slice(0, maxLength));
  };
  return (
    <form className={styles.write} onSubmit={submit}>
      <label htmlFor="t0-write">{prompt}</label>
      <textarea
        id="t0-write"
        ref={area}
        value={text}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={2}
        disabled={disabled}
        enterKeyHint="send"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
      />
      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.quiet}
          data-primary="true"
          disabled={disabled || !text.trim()}
        >
          Dire
        </button>
        <button
          type="button"
          className={styles.quiet}
          disabled={disabled}
          onClick={onDecline}
        >
          {declineLabel}
        </button>
        {text.length > maxLength - 40 && (
          <span className={styles.count}>
            {text.length}/{maxLength}
          </span>
        )}
      </div>
    </form>
  );
}
