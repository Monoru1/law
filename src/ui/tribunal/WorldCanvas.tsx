'use client';
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from '@react-three/fiber';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  Euler,
  Matrix4,
  Quaternion,
  PCFShadowMap,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type InstancedMesh,
} from 'three';
import {
  environmentCopy as copy,
  type StageAction,
} from '../../content/environments';
import type { WorldProps } from './EnvironmentStage';
import { Courtroom, FamilyHouse, type SceneMaterials } from './WorldModels';
import styles from './tribunal.module.css';

export type Vec3 = [number, number, number];
export const objectPositions: Record<string, Vec3> = {
  dossier: [0, 1.07, -2.05],
  bench: [-2.6, 0.65, 0.2],
  lamp: [1.2, 1.45, -2.3],
  'sixth-plate': [0.7, 0.9, 1],
  bread: [-0.65, 0.95, -0.35],
  soup: [0, 1, -0.65],
  album: [-1.7, 0.92, -0.7],
  photographs: [-2.18, 1.85, -1.4],
  door: [0, 1.2, -6.1],
  kitchen: [2.16, 1.2, -2.2],
  threshold: [1.5, 1.2, 3],
  vestibule: [-1.7, 1.2, 2.8],
  entrance: [0, 1.2, -0.2],
  window: [2.6, 1.9, -0.1],
  car: [2.8, 0.7, 4.5],
  photograph: [-0.35, 0.88, 0.1],
  negative: [0.4, 0.9, -0.1],
};

function woodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#766049';
  ctx.fillRect(0, 0, 256, 256);
  let seed = 812;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 1800; i++) {
    const y = rand() * 256;
    ctx.strokeStyle = `rgba(${rand() > 0.5 ? '22,15,11' : '204,174,124'},${rand() * 0.2})`;
    ctx.lineWidth = rand() * 1.4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(80, y + rand() * 5, 170, y - rand() * 5, 256, y);
    ctx.stroke();
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;
  map.repeat.set(2, 1);
  map.anisotropy = 4;
  return map;
}

// The same action objects drive raycast hits and the accessible DOM controls.
export function Interactive({
  id,
  actions,
  onAction,
  children,
}: {
  id: string;
  actions: StageAction[];
  onAction: WorldProps['onAction'];
  children: ReactNode;
}) {
  const { scene, raycaster, gl } = useThree();
  const action = actions.find((item) => item.id === id);
  const [hovered, setHovered] = useState(false);
  const clear = () => {
    setHovered(false);
    gl.domElement.removeAttribute('data-target');
    gl.domElement.dispatchEvent(
      new CustomEvent('world-target', { detail: null }),
    );
  };
  const unobstructed = () => {
    const first = raycaster
      .intersectObjects(scene.children, true)
      .find((hit) => {
        let object = hit.object;
        while (object.parent) {
          if (!object.visible) return false;
          object = object.parent;
        }
        return object.visible;
      });
    if (!first || first.distance > (action?.maxDistance ?? 12)) return false;
    let object = first.object;
    while (object.parent) {
      if (object.name === id) return true;
      object = object.parent;
    }
    return false;
  };
  return (
    <group
      name={id}
      onClick={
        action
          ? (event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation();
              if (event.delta < 8 && unobstructed()) {
                clear();
                onAction(action);
              }
            }
          : undefined
      }
      onPointerOver={
        action
          ? (event) => {
              event.stopPropagation();
              if (unobstructed()) {
                setHovered(true);
                gl.domElement.setAttribute('data-target', id);
                gl.domElement.dispatchEvent(
                  new CustomEvent('world-target', { detail: action }),
                );
              }
            }
          : undefined
      }
      onPointerOut={clear}
    >
      {children}
      {action && (
        <mesh
          position={objectPositions[id]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => {}}
        >
          <ringGeometry
            args={[hovered ? 0.17 : 0.12, hovered ? 0.185 : 0.13, 32]}
          />
          <meshBasicMaterial
            color={hovered ? '#fff2cf' : '#cab583'}
            transparent
            opacity={hovered ? 0.9 : 0.55}
            depthTest={false}
          />
        </mesh>
      )}
    </group>
  );
}

export function Repeated({
  positions,
  geometry,
  material,
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  shadow = false,
}: {
  positions: Vec3[];
  geometry: ReactNode;
  material: ReactNode;
  scale?: Vec3;
  rotation?: Vec3;
  shadow?: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const matrix = new Matrix4();
    const quaternion = new Quaternion().setFromEuler(new Euler(...rotation));
    positions.forEach((position, index) => {
      matrix.compose(
        new Vector3(...position),
        quaternion,
        new Vector3(...scale),
      );
      ref.current!.setMatrixAt(index, matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [positions, scale, rotation]);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, positions.length]}
      castShadow={shadow}
      receiveShadow
    >
      {geometry}
      {material}
    </instancedMesh>
  );
}

function CameraRig({
  room,
  reduced,
  paused,
  reaction,
  onCamera,
  quality,
  onReady,
  onDegrade,
  onFailure,
  focusId,
  onTarget,
  lookVersion,
}: WorldProps) {
  const { camera, gl, invalidate, scene } = useThree();
  const target = useRef(new Vector3());
  const pointer = useRef(new Vector2());
  const drag = useRef(false);
  const ready = useRef(false);
  const frames = useRef<number[]>([]);
  const lastReport = useRef(0);
  useEffect(() => {
    gl.domElement.setAttribute('data-quality', quality);
  }, [gl, quality]);
  const preset = useMemo(
    () =>
      room === 'tribunal'
        ? focusId === 'dossier'
          ? { eye: [0.15, 1.85, 0.2] as Vec3, aim: [0, 1.07, -2.05] as Vec3 }
          : focusId === 'bench'
            ? { eye: [-0.9, 1.65, 2.1] as Vec3, aim: [-2.6, 0.65, 0.2] as Vec3 }
            : focusId === 'lamp'
              ? { eye: [1.8, 1.8, 0.1] as Vec3, aim: [1.2, 1.45, -2.3] as Vec3 }
              : { eye: [0, 1.65, 4] as Vec3, aim: [0, 1.05, -2.3] as Vec3 }
        : room === 'outside'
          ? { eye: [4.2, 2.6, 8] as Vec3, aim: [0, 1.4, -0.8] as Vec3 }
          : room === 'table'
            ? reaction
              ? { eye: [1.6, 1.6, 2.7] as Vec3, aim: [0.65, 0.89, 1] as Vec3 }
              : { eye: [2.9, 2.65, 4.7] as Vec3, aim: [0, 0.85, -0.4] as Vec3 }
            : room === 'album'
              ? { eye: [1.25, 2.5, 1.8] as Vec3, aim: [0, 0.82, 0] as Vec3 }
              : {
                  eye: [1.3, 1.7, 3.5] as Vec3,
                  aim: [-0.7, 1.25, -2.7] as Vec3,
                },
    [room, reaction, focusId],
  );
  const eye = useMemo(() => new Vector3(...preset.eye), [preset]);
  const aim = useMemo(() => new Vector3(...preset.aim), [preset]);
  useLayoutEffect(() => {
    pointer.current.set(0, 0);
    if (reduced || !ready.current) {
      camera.position.copy(eye);
      target.current.copy(aim);
      camera.lookAt(target.current);
    }
    invalidate();
  }, [eye, aim, reduced, camera, invalidate, lookVersion]);
  useEffect(() => {
    const element = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    element.addEventListener('webglcontextlost', lost);
    const targeted = (event: Event) =>
      onTarget?.((event as CustomEvent<StageAction | null>).detail);
    element.addEventListener('world-target', targeted);
    return () => {
      element.removeEventListener('webglcontextlost', lost);
      element.removeEventListener('world-target', targeted);
    };
  }, [gl, onFailure, onTarget]);
  useEffect(() => {
    const element = gl.domElement;
    let lastX = 0,
      lastY = 0;
    const down = (event: PointerEvent) => {
      drag.current = true;
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const up = () => {
      drag.current = false;
    };
    const move = (event: PointerEvent) => {
      if (!drag.current || paused) return;
      const dx = event.clientX - lastX,
        dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      pointer.current.x = Math.max(
        -2.1,
        Math.min(2.1, pointer.current.x + dx * 0.008),
      );
      pointer.current.y = Math.max(
        -0.9,
        Math.min(0.9, pointer.current.y - dy * 0.006),
      );
      invalidate();
    };
    const key = (event: KeyboardEvent) => {
      if (
        paused ||
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(
          event.key,
        )
      )
        return;
      event.preventDefault();
      if (event.key === 'Home') pointer.current.set(0, 0);
      else {
        pointer.current.x = Math.max(
          -0.65,
          Math.min(
            0.65,
            pointer.current.x +
              (event.key === 'ArrowLeft'
                ? -0.12
                : event.key === 'ArrowRight'
                  ? 0.12
                  : 0),
          ),
        );
        pointer.current.y = Math.max(
          -0.25,
          Math.min(
            0.25,
            pointer.current.y +
              (event.key === 'ArrowUp'
                ? 0.07
                : event.key === 'ArrowDown'
                  ? -0.07
                  : 0),
          ),
        );
      }
      invalidate();
    };
    element.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    element.addEventListener('pointermove', move);
    element.addEventListener('keydown', key);
    return () => {
      element.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('keydown', key);
    };
  }, [gl, invalidate, paused, reduced]);
  useFrame((state, delta) => {
    if (paused) return;
    const wanted = aim
      .clone()
      .add(new Vector3(pointer.current.x, pointer.current.y, 0));
    const factor = reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 2.8);
    camera.position.lerp(eye, factor);
    target.current.lerp(wanted, factor);
    camera.lookAt(target.current);
    if (
      camera.position.distanceToSquared(eye) > 0.000001 ||
      target.current.distanceToSquared(wanted) > 0.000001
    )
      invalidate();
    if (!ready.current) {
      ready.current = true;
      onReady();
    }
    if (delta < 0.3 && delta > 0) frames.current.push(delta * 1000);
    if (state.clock.elapsedTime - lastReport.current > 1) {
      lastReport.current = state.clock.elapsedTime;
      frames.current = frames.current.slice(-40);
      const samples = [...frames.current].sort((a, b) => a - b);
      gl.domElement.setAttribute(
        'data-frame-ms',
        String(samples[Math.floor(samples.length / 2)] ?? 0),
      );
      gl.domElement.setAttribute('data-calls', String(gl.info.render.calls));
      gl.domElement.setAttribute(
        'data-triangles',
        String(gl.info.render.triangles),
      );
      gl.domElement.setAttribute(
        'data-geometries',
        String(gl.info.memory.geometries),
      );
      if (
        quality !== 'economy' &&
        samples.length >= 8 &&
        samples[Math.floor(samples.length * 0.8)]! > 45
      ) {
        gl.setPixelRatio(0.75);
        onDegrade?.();
      }
    }
    if (onCamera)
      onCamera(
        camera.position.toArray() as Vec3,
        target.current.toArray() as Vec3,
      );
    // Expose only geometry coordinates for reproducible raycast tests, never player text.
    for (const [id, position] of Object.entries(objectPositions)) {
      if (!scene.getObjectByName(id)) continue;
      const point = new Vector3(...position).project(camera);
      gl.domElement.setAttribute(
        `data-hit-${id}`,
        JSON.stringify([point.x, point.y, point.z]),
      );
    }
  });
  return null;
}

function WorldScene(props: WorldProps) {
  const texture = useMemo(() => woodTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  const materials = useMemo<SceneMaterials>(
    () => ({ wood: texture }),
    [texture],
  );
  const shadow = props.quality !== 'economy';
  return (
    <>
      <color attach="background" args={[props.lit ? '#16191b' : '#020203']} />
      <fog attach="fog" args={['#16191b', 11, 28]} />
      <CameraRig {...props} />
      <group visible={props.lit}>
        <hemisphereLight args={['#b7c6d1', '#34261b', 0.7]} />
        {props.room === 'tribunal' ? (
          <Courtroom {...props} materials={materials} shadow={shadow} />
        ) : (
          <FamilyHouse {...props} materials={materials} shadow={shadow} />
        )}
      </group>
    </>
  );
}

export default function WorldCanvas(props: WorldProps) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry?.isIntersecting ?? false),
    );
    observer.observe(element);
    const changed = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', changed);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', changed);
    };
  }, []);
  return (
    <div ref={host} className={styles.worldCanvas}>
      <Canvas
        shadows={props.quality !== 'economy' ? { type: PCFShadowMap } : false}
        dpr={
          props.quality === 'high'
            ? [1, 1.75]
            : props.quality === 'economy'
              ? 0.75
              : [1, 1.25]
        }
        frameloop={!visible || props.paused ? 'never' : 'demand'}
        camera={{ position: [0, 1.65, 4], fov: 48, near: 0.08, far: 50 }}
        gl={{
          antialias: props.quality !== 'economy',
          alpha: false,
          powerPreference: 'low-power',
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
        }}
        fallback={<p role="status">{copy.unavailable}</p>}
        onCreated={({ gl }) => {
          gl.domElement.setAttribute('aria-label', copy.look);
          gl.domElement.setAttribute('role', 'img');
          gl.domElement.tabIndex = 0;
          gl.domElement.dataset.quality = props.quality;
        }}
      >
        <WorldScene {...props} />
      </Canvas>
    </div>
  );
}
