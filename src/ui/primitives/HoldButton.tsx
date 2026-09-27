'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { copy } from '../../content';
import { Button } from './Button';
type Props = {
  children: React.ReactNode;
  onConfirm: () => void;
  simple: boolean;
  disabled?: boolean;
  className?: string;
};
export function HoldButton({
  children,
  onConfirm,
  simple,
  disabled,
  className = '',
}: Props) {
  const hintId = useId();
  const [progress, setProgress] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const active = useRef(false);
  const completed = useRef(false);
  const cancel = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (active.current) setInterrupted(true);
    active.current = false;
    setProgress(0);
  };
  useEffect(() => {
    const interrupt = () => {
      cancel();
      setConfirming(false);
    };
    window.addEventListener('blur', interrupt);
    document.addEventListener('visibilitychange', interrupt);
    return () => {
      if (timer.current) clearInterval(timer.current);
      window.removeEventListener('blur', interrupt);
      document.removeEventListener('visibilitychange', interrupt);
    };
  }, []);
  const start = () => {
    if (simple || disabled || active.current || completed.current) return;
    active.current = true;
    setInterrupted(false);
    const started = performance.now();
    timer.current = setInterval(() => {
      const ratio = Math.min(1, (performance.now() - started) / 1200);
      setProgress(ratio);
      if (ratio >= 1) {
        active.current = false;
        cancel();
        completed.current = true;
        onConfirm();
      }
    }, 16);
  };
  return (
    <div className="hold-control">
      <Button
        className={className}
        disabled={disabled}
        aria-describedby={hintId}
        aria-pressed={simple ? confirming : undefined}
        onBlur={() => {
          cancel();
          setConfirming(false);
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || e.button === 0) {
            e.currentTarget.focus();
            start();
          }
        }}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onKeyDown={(e) => {
          if (!simple && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            start();
          }
          if (e.key === 'Escape') {
            cancel();
            setConfirming(false);
          }
        }}
        onKeyUp={(e) => {
          if (!simple && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            cancel();
          }
        }}
        onClick={() => {
          if (completed.current) return;
          if (!simple) {
            setInterrupted(true);
            return;
          }
          if (confirming) {
            completed.current = true;
            setConfirming(false);
            onConfirm();
          } else setConfirming(true);
        }}
      >
        {confirming ? (
          <>
            {copy.confirm} : {children}
          </>
        ) : (
          children
        )}
      </Button>
      {!simple && (
        <progress
          className="hold-meter"
          max={1}
          value={progress}
          aria-hidden="true"
        />
      )}
      <p id={hintId} className="hold-hint mono" role="status">
        {simple
          ? confirming
            ? 'Appuie à nouveau pour confirmer ce choix.'
            : 'Deux appuis pour confirmer.'
          : interrupted
            ? 'Maintien interrompu. Maintiens pour confirmer.'
            : 'Maintenir pour confirmer. Relâcher pour annuler.'}
      </p>
    </div>
  );
}
