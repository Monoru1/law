'use client';
import dynamic from 'next/dynamic';
import {
  Component,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  environmentCopy as copy,
  type EnvironmentRoom,
  type EnvironmentQuality,
  type StageAction,
} from '../../content/environments';
import { HouseStage } from './HouseStage';
import styles from './tribunal.module.css';

export type WorldProps = {
  room: EnvironmentRoom;
  quality: EnvironmentQuality;
  lit: boolean;
  reduced: boolean;
  paused: boolean;
  reaction: boolean;
  focusId?: string;
  actions: StageAction[];
  onAction: (action: StageAction) => void;
  onFailure: () => void;
  onReady: () => void;
  onDegrade?: () => void;
  onTarget?: (action: StageAction | null) => void;
  lookVersion?: number;
  onCamera?: (
    position: [number, number, number],
    target: [number, number, number],
  ) => void;
};
const World = dynamic(() => import('./WorldCanvas'), { ssr: false });

class RenderBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function EnvironmentStage(
  props: Omit<WorldProps, 'quality' | 'onFailure' | 'onReady' | 'onAction'> & {
    disabled: boolean;
    onReply: (id: string) => void;
    children?: ReactNode;
  },
) {
  const router = useRouter();
  const [flat, setFlat] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [quality, setQuality] = useState<EnvironmentQuality>('standard');
  const [detail, setDetail] = useState('');
  const [inspected, setInspected] = useState<string>();
  const [target, setTarget] = useState<StageAction | null>(null);
  const [lookVersion, setLookVersion] = useState(0);
  const [accessible, setAccessible] = useState(false);
  const [interfaceHidden, setInterfaceHidden] = useState(false);
  const systemReduced = useSyncExternalStore(
    (notify) => {
      const media = matchMedia('(prefers-reduced-motion: reduce)');
      media.addEventListener('change', notify);
      return () => media.removeEventListener('change', notify);
    },
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => true,
  );
  useEffect(() => {
    if (flat || failed || ready) return;
    const timer = setTimeout(() => setFailed(true), 15000);
    return () => clearTimeout(timer);
  }, [flat, failed, ready]);
  const fallback =
    props.room === 'tribunal' ? (
      <div className={styles.tribunalFallback} data-lit={props.lit} />
    ) : (
      <HouseStage room={props.room} />
    );
  const activate = (action: StageAction) => {
    if (props.disabled) return;
    setInterfaceHidden(false);
    if (action.replyId) props.onReply(action.replyId);
    else if (action.href) router.push(action.href);
    else {
      setDetail(action.detail ?? '');
      setInspected(action.id);
    }
  };
  return (
    <section
      className={styles.environment}
      aria-label={copy.rooms[props.room]}
      data-renderer={flat || failed ? '2d' : '3d'}
      data-ready={ready}
    >
      <div className={styles.renderControls}>
        <button
          type="button"
          onClick={() => setInterfaceHidden(!interfaceHidden)}
        >
          {interfaceHidden ? copy.dialogue : copy.explore}
        </button>
        <button
          type="button"
          onClick={() => setLookVersion((value) => value + 1)}
        >
          {copy.reset}
        </button>
        <button
          type="button"
          aria-pressed={accessible}
          onClick={() => setAccessible(!accessible)}
        >
          {copy.accessible}
        </button>
        <label>
          {copy.quality}{' '}
          <select
            aria-label={copy.quality}
            value={quality}
            disabled={flat || failed}
            onChange={(event) =>
              setQuality(event.target.value as EnvironmentQuality)
            }
          >
            <option value="high">{copy.high}</option>
            <option value="standard">{copy.standard}</option>
            <option value="economy">{copy.economy}</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setFlat(!flat);
            setDetail('');
          }}
        >
          {flat ? copy.depth : copy.flat}
        </button>
      </div>
      <div
        className={styles.viewport}
        data-lit={props.lit}
        data-reduced={props.reduced || systemReduced}
      >
        {flat || failed ? (
          fallback
        ) : (
          <RenderBoundary fallback={fallback} onFailure={() => setFailed(true)}>
            <World
              {...props}
              onTarget={setTarget}
              lookVersion={lookVersion}
              focusId={detail ? inspected : props.focusId}
              reduced={props.reduced || systemReduced}
              quality={quality}
              onAction={activate}
              onReady={() => setReady(true)}
              onDegrade={() => setQuality('economy')}
              onFailure={() => setFailed(true)}
            />
          </RenderBoundary>
        )}
        {!flat && !failed && !ready && (
          <p className={styles.renderMessage} role="status">
            {copy.loading}
          </p>
        )}
        {target && !props.disabled && (
          <p className={styles.targetHint} aria-live="polite">
            {target.label}
          </p>
        )}
        {detail && (
          <aside className={styles.inspection} role="status">
            <p>{detail}</p>
            <button
              type="button"
              onClick={() => {
                setDetail('');
                setInspected(undefined);
              }}
            >
              {copy.back}
            </button>
          </aside>
        )}
        <div className={styles.sceneInterface} hidden={interfaceHidden}>
          {props.children}
        </div>
        {(accessible || flat || failed) && (
          <nav className={styles.objectBar} aria-label={copy.objects}>
            {props.lit &&
              props.actions.map((action) => (
                <button
                  type="button"
                  key={action.id}
                  data-object={action.id}
                  disabled={props.disabled}
                  onClick={() => activate(action)}
                >
                  {action.label}
                </button>
              ))}
          </nav>
        )}
      </div>
      {failed && (
        <p role="status" className={styles.renderNotice}>
          {copy.unavailable}
        </p>
      )}
      {accessible && <p className={styles.renderHelp}>{copy.help}</p>}
    </section>
  );
}
