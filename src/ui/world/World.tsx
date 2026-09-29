import type { CSSProperties } from 'react';
import type { GameEvent } from '../../engine';
import styles from './World.module.css';

type Decision = Extract<GameEvent, { type: 'choice_locked' }>;

export type WorldProps = {
  timelineId: string;
  sceneId: string;
  phase: string;
  ambience?: string;
  regression: 0 | 1 | 2 | 3;
  decisions: Decision[];
};

type WorldKind = 'room' | 'house' | 'city';
type LightState = 'cold' | 'evening' | 'night' | 'dawn';
type Location =
  | 'room'
  | 'clinical'
  | 'house'
  | 'dining'
  | 'kitchen'
  | 'garden'
  | 'balcony'
  | 'office'
  | 'city';

type WorldStyle = CSSProperties & {
  '--world-bias': string;
  '--world-memory': string;
};

type TraceStyle = CSSProperties & {
  '--trace-x': string;
  '--trace-y': string;
  '--trace-length': string;
  '--trace-angle': string;
};

function hash(value: string) {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function worldKind(timelineId: string): WorldKind {
  if (timelineId === 't2') return 'house';
  if (timelineId === 't3') return 'city';
  return 'room';
}

function houseLight(sceneId: string): LightState {
  if (sceneId === 't2.la-maison') return 'dawn';
  if (
    sceneId === 't2.les-nouvelles' ||
    sceneId === 't2.mila-confie' ||
    sceneId === 't2.omar-histoire'
  )
    return 'evening';
  return 'night';
}

function actNumber(ambience: string | undefined) {
  const match = /^act-([1-6])$/.exec(ambience ?? '');
  return match?.[1] ?? '1';
}

function sceneLocation(timelineId: string, sceneId: string): Location {
  if (sceneId === 't1.chambre-froide') return 'clinical';
  if (timelineId === 't1') return 'room';
  if (sceneId === 't2.la-faveur') return 'garden';
  if (sceneId === 't2.omar-histoire') return 'balcony';
  if (sceneId === 't2.la-promesse' || sceneId === 't2.le-mensonge')
    return 'kitchen';
  if (sceneId === 't2.les-nouvelles' || sceneId === 't2.ce-qu-on-protege')
    return 'dining';
  if (timelineId === 't2') return 'house';
  return sceneId === 't3.la-fenetre' ? 'city' : 'office';
}

function ArchitecturalDoor({ open }: { open: boolean }) {
  return (
    <div
      className={styles.door}
      data-open={open || undefined}
      data-primitive="door"
    >
      <div className={styles.doorSpill} />
      <div className={styles.doorFrame}>
        <div className={styles.doorSlab}>
          <span className={styles.doorInset} />
          <span className={styles.doorHandle} />
        </div>
      </div>
    </div>
  );
}

function CurtainPanels() {
  return (
    <div className={styles.reveal} data-primitive="scene-panels">
      <span className={styles.revealLeft} />
      <span className={styles.revealRight} />
    </div>
  );
}

function OfficeLight() {
  return (
    <div className={styles.officeLight} data-primitive="office-light">
      <span />
    </div>
  );
}

function Corridor() {
  return (
    <div className={styles.corridor} data-primitive="corridor">
      <span className={styles.corridorCeiling} />
      <span className={styles.corridorLeft} />
      <span className={styles.corridorRight} />
      <span className={styles.corridorFloor} />
    </div>
  );
}

function HouseWindow() {
  const rain = Array.from({ length: 11 }, (_, index) => index);
  return (
    <div className={styles.window} data-primitive="window">
      <div className={styles.windowOutside}>
        <span className={styles.neighbourOne} />
        <span className={styles.neighbourTwo} />
      </div>
      <div className={styles.rain}>
        {rain.map((line) => (
          <span key={line} style={{ '--rain-line': line } as CSSProperties} />
        ))}
      </div>
      <span className={styles.windowFrameV} />
      <span className={styles.windowFrameH} />
      <span className={styles.curtainLeft} />
      <span className={styles.curtainRight} />
      <span className={styles.windowSill} />
    </div>
  );
}

function HouseFurniture() {
  return (
    <div className={styles.furniture}>
      <span className={styles.tableTop} />
      <span className={styles.tableLegLeft} />
      <span className={styles.tableLegRight} />
      <span className={styles.chairBack} />
    </div>
  );
}

function ExteriorLandscape({ elevated }: { elevated: boolean }) {
  return (
    <div
      className={styles.exterior}
      data-elevated={elevated || undefined}
      data-primitive="exterior"
    >
      <span className={styles.exteriorHouse} />
      <span className={styles.exteriorGlow} />
      <span className={styles.exteriorHedge} />
      <span className={styles.exteriorRail} />
    </div>
  );
}

function CityWindows() {
  return (
    <div
      className={styles.city}
      data-primitive="city-windows"
      data-window-count="417"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="presentation">
        <defs>
          <pattern
            id="law-city-windows"
            width="4.8"
            height="5.8"
            patternUnits="userSpaceOnUse"
          >
            <rect
              className={styles.cityCell}
              x="0.7"
              y="0.8"
              width="2.6"
              height="3"
            />
          </pattern>
          <linearGradient id="law-city-depth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(7,7,9,.04)" />
            <stop offset="1" stopColor="rgba(7,7,9,.88)" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#law-city-windows)" />
        <g className={styles.cityLit}>
          <rect x="12.7" y="18.2" width="2.6" height="3" />
          <rect x="41.5" y="29.8" width="2.6" height="3" />
          <rect x="70.3" y="12.4" width="2.6" height="3" />
          <rect x="84.7" y="53" width="2.6" height="3" />
          <rect x="27.1" y="64.6" width="2.6" height="3" />
        </g>
        <rect width="100" height="100" fill="url(#law-city-depth)" />
      </svg>
    </div>
  );
}

function FileStack() {
  return (
    <div className={styles.files}>
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function DecisionTraces({ decisions }: { decisions: Decision[] }) {
  const visible = decisions.slice(-14);
  return (
    <div className={`${styles.traces} room-traces`} data-count={visible.length}>
      {visible.map((decision, index) => {
        const seed = hash(
          `${decision.sceneId}:${decision.input}:${String(decision.value)}`,
        );
        const style: TraceStyle = {
          '--trace-x': `${9 + (seed % 81)}%`,
          '--trace-y': `${14 + ((seed >>> 7) % 68)}%`,
          '--trace-length': `${12 + ((seed >>> 13) % 23)}px`,
          '--trace-angle': `${((seed >>> 18) % 17) - 8}deg`,
        };
        return (
          <span
            key={decision.id}
            className="room-trace"
            data-latest={index === visible.length - 1 || undefined}
            style={style}
          />
        );
      })}
    </div>
  );
}

export function World({
  timelineId,
  sceneId,
  phase,
  ambience,
  regression,
  decisions,
}: WorldProps) {
  const kind = worldKind(timelineId);
  const location = sceneLocation(timelineId, sceneId);
  const visible = decisions.slice(-14);
  const last = visible.at(-1);
  const lastHash = last ? hash(`${last.sceneId}:${String(last.value)}`) : 0;
  const style: WorldStyle = {
    '--world-bias': `${last ? (lastHash % 17) - 8 : 0}%`,
    '--world-memory': String(Math.min(visible.length, 12) / 12),
  };
  const light = kind === 'house' ? houseLight(sceneId) : 'cold';

  return (
    <div
      className={`${styles.world} room`}
      aria-hidden="true"
      data-memory={visible.length}
      data-world={kind}
      data-location={location}
      data-light={light}
      data-act={kind === 'city' ? actNumber(ambience) : undefined}
      data-focus={sceneId === 't3.la-fenetre' ? 'windows' : undefined}
      data-phase={phase}
      data-regression={regression}
      style={style}
    >
      <div className={styles.backdrop} />
      {kind === 'room' && (
        <>
          <Corridor />
          <ArchitecturalDoor open={phase === 'sealed'} />
          <OfficeLight />
        </>
      )}
      {kind === 'house' && (
        <>
          <HouseWindow />
          {location === 'garden' || location === 'balcony' ? (
            <ExteriorLandscape elevated={location === 'balcony'} />
          ) : (
            <HouseFurniture />
          )}
          <ArchitecturalDoor open={phase === 'sealed'} />
        </>
      )}
      {kind === 'city' && (
        <>
          <Corridor />
          <ArchitecturalDoor open={phase === 'sealed'} />
          <CityWindows />
          <FileStack />
          <OfficeLight />
        </>
      )}
      <DecisionTraces decisions={decisions} />
      <CurtainPanels />
      <div className={styles.atmosphere} />
    </div>
  );
}
