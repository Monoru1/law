import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CanvasTexture,
  SRGBColorSpace,
  Vector2,
  type Texture,
  type Group,
} from 'three';
import { Interactive, Repeated, type Vec3 } from './WorldCanvas';
import type { WorldProps } from './EnvironmentStage';
import { environmentCopy } from '../../content/environments';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type SceneMaterials = { wood: Texture };
type ModelProps = WorldProps & { materials: SceneMaterials; shadow: boolean };
const brass = '#9c8351';

function Block({
  at,
  size,
  color = '#39312b',
  wood,
  metal = false,
  children,
}: {
  at: Vec3;
  size: Vec3;
  color?: string;
  wood?: Texture;
  metal?: boolean;
  children?: ReactNode;
}) {
  const [width, height, depth] = size;
  const geometry = useMemo(
    () =>
      new RoundedBoxGeometry(
        width,
        height,
        depth,
        2,
        Math.min(0.025, width / 6, height / 6, depth / 6),
      ),
    [width, height, depth],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh position={at} castShadow receiveShadow>
      <primitive attach="geometry" object={geometry} />
      <meshStandardMaterial
        color={color}
        map={wood}
        roughness={metal ? 0.32 : 0.83}
        metalness={metal ? 0.75 : 0.04}
      />
      {children}
    </mesh>
  );
}
function Rod({
  at,
  radius = 0.025,
  height,
  color = brass,
}: {
  at: Vec3;
  radius?: number;
  height: number;
  color?: string;
}) {
  return (
    <mesh position={at} castShadow>
      <cylinderGeometry args={[radius, radius, height, 12]} />
      <meshStandardMaterial color={color} metalness={0.65} roughness={0.38} />
    </mesh>
  );
}
function Label({
  text,
  at,
  width = 0.6,
  height = 0.22,
  rotation = [-Math.PI / 2, 0, 0],
}: {
  text: string;
  at: Vec3;
  width?: number;
  height?: number;
  rotation?: Vec3;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#c6b99b';
    ctx.fillRect(0, 0, 512, 192);
    ctx.strokeStyle = '#4c4235';
    ctx.strokeRect(12, 12, 488, 168);
    ctx.fillStyle = '#302a23';
    ctx.font = '30px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 102);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return map;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={at} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={texture} roughness={0.95} />
    </mesh>
  );
}
function Chair({
  at,
  turn = 0,
  wood,
}: {
  at: Vec3;
  turn?: number;
  wood: Texture;
}) {
  return (
    <group position={at} rotation={[0, turn, 0]}>
      <Block
        at={[0, 0.48, 0]}
        size={[0.54, 0.08, 0.5]}
        wood={wood}
        color="#5d4330"
      />
      <Block
        at={[0, 0.9, -0.23]}
        size={[0.5, 0.42, 0.055]}
        wood={wood}
        color="#654c38"
      />
      {[-0.22, 0.22].flatMap((x) =>
        [-0.2, 0.2].map((z) => (
          <Block
            key={`${x}:${z}`}
            at={[x, 0.24, z]}
            size={[0.045, 0.48, 0.045]}
            wood={wood}
          />
        )),
      )}
      {[-0.22, 0.22].map((x) => (
        <Block
          key={x}
          at={[x, 0.83, -0.23]}
          size={[0.045, 0.65, 0.045]}
          wood={wood}
        />
      ))}
    </group>
  );
}
function RoomShell({
  wood,
  tribunal = false,
  half = 5,
}: {
  wood: Texture;
  tribunal?: boolean;
  half?: number;
}) {
  const boards: Vec3[] = Array.from(
    { length: Math.floor((half * 2) / 0.38) },
    (_, i) => [-half + 0.2 + i * 0.38, -0.045, -0.7],
  );
  return (
    <>
      <Repeated
        positions={boards}
        geometry={<boxGeometry args={[0.365, 0.09, 12]} />}
        material={
          <meshStandardMaterial
            color={tribunal ? '#65584b' : '#76624c'}
            map={wood}
            roughness={0.78}
          />
        }
      />
      <Block at={[0, 3.8, -0.7]} size={[half * 2, 0.2, 12]} color="#403f39" />
      <Block at={[0, 1.9, -6.6]} size={[half * 2, 3.8, 0.2]} color="#5e605a" />
      <Block at={[-half, 1.9, -0.7]} size={[0.2, 3.8, 12]} color="#5b5d56" />
      <Block at={[half, 1.9, -0.7]} size={[0.2, 3.8, 12]} color="#5a574d" />
      <Block at={[0, 1.9, 5.2]} size={[half * 2, 3.8, 0.2]} color="#55564e" />
      <Block
        at={[-half + 0.15, 0.58, -0.7]}
        size={[0.12, 1.12, 12]}
        wood={wood}
        color="#5a4331"
      />
      <Block
        at={[half - 0.15, 0.58, -0.7]}
        size={[0.12, 1.12, 12]}
        wood={wood}
        color="#5a4331"
      />
      <Block
        at={[0, 0.58, -6.42]}
        size={[half * 2, 1.12, 0.12]}
        wood={wood}
        color="#5a4331"
      />
      <Block at={[0, 3.55, -6.4]} size={[half * 2, 0.12, 0.12]} wood={wood} />
      {[-half + 0.3, half - 0.3].map((x) => (
        <Block
          key={x}
          at={[x, 1.2, -0.7]}
          size={[0.16, 0.07, 12]}
          wood={wood}
          color="#766148"
        />
      ))}
    </>
  );
}
function Door({
  at,
  wood,
  turn = 0,
}: {
  at: Vec3;
  wood: Texture;
  turn?: number;
}) {
  return (
    <group position={at} rotation={[0, turn, 0]}>
      <Block at={[0, 1.28, -0.05]} size={[1.24, 2.56, 0.12]} color="#1d1a17" />
      <Block
        at={[0, 1.26, 0.03]}
        size={[1.07, 2.46, 0.075]}
        wood={wood}
        color="#70543a"
      />
      {[-0.4, 0.4].map((x) => (
        <Block
          key={x}
          at={[x, 1.25, 0.09]}
          size={[0.045, 2.35, 0.035]}
          color="#8b7353"
        />
      ))}
      {[0.45, 1.3, 2.1].map((y) => (
        <Block
          key={y}
          at={[0, y, 0.09]}
          size={[0.8, 0.045, 0.035]}
          color="#8b7353"
        />
      ))}
      <mesh position={[0.38, 1.1, 0.14]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.15, 12]} />
        <meshStandardMaterial color={brass} roughness={0.3} metalness={0.8} />
      </mesh>
      <Block at={[0, 2.58, 0.05]} size={[1.4, 0.12, 0.2]} wood={wood} />
      {[-0.65, 0.65].map((x) => (
        <Block
          key={x}
          at={[x, 1.3, 0.05]}
          size={[0.12, 2.6, 0.2]}
          wood={wood}
        />
      ))}
    </group>
  );
}
function Lamp({ at, hanging = false }: { at: Vec3; hanging?: boolean }) {
  return (
    <group position={at}>
      {hanging ? (
        <Rod at={[0, 0.45, 0]} height={0.9} radius={0.012} />
      ) : (
        <>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.14, 0.17, 0.05, 32]} />
            <meshStandardMaterial
              color={brass}
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
          <Rod at={[0, 0.25, 0]} height={0.5} radius={0.018} />
        </>
      )}
      <mesh position={[0, hanging ? 0 : 0.5, 0]}>
        <cylinderGeometry args={[0.14, 0.3, 0.25, 40, 1, true]} />
        <meshStandardMaterial
          color={hanging ? '#b9a57d' : '#435746'}
          roughness={0.45}
          metalness={0.25}
          side={2}
        />
      </mesh>
      <mesh
        position={[0, hanging ? -0.09 : 0.41, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.24, 32]} />
        <meshStandardMaterial
          color="#e4cc90"
          emissive="#f6c47c"
          emissiveIntensity={2}
          side={2}
        />
      </mesh>
    </group>
  );
}
function Window({ at, turn = 0 }: { at: Vec3; turn?: number }) {
  return (
    <group position={at} rotation={[0, turn, 0]}>
      <Block at={[0, 0, 0]} size={[2.5, 2.1, 0.11]} color="#182b37" />
      <Repeated
        positions={[-1.52, -1.45, -1.38, 1.38, 1.45, 1.52].map((x) => [
          x,
          -0.05,
          0.2,
        ])}
        geometry={<cylinderGeometry args={[0.055, 0.07, 2.5, 10]} />}
        material={<meshStandardMaterial color="#555b58" roughness={1} />}
      />
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[2.3, 1.95]} />
        <meshStandardMaterial
          color="#385366"
          emissive="#2d485b"
          emissiveIntensity={0.65}
          roughness={0.24}
          metalness={0.4}
        />
      </mesh>
      {[-1.2, 0, 1.2].map((x) => (
        <Block
          key={x}
          at={[x, 0, 0.11]}
          size={[0.06, 2.1, 0.1]}
          color="#272b29"
        />
      ))}
      {[-1, 0, 1].map((y) => (
        <Block
          key={y}
          at={[0, y, 0.11]}
          size={[2.5, 0.06, 0.1]}
          color="#272b29"
        />
      ))}
      <Block at={[0, -1.08, 0.15]} size={[2.8, 0.1, 0.35]} color="#666353" />
      {[-1.45, 1.45].map((x) => (
        <Block
          key={x}
          at={[x, -0.05, 0.1]}
          size={[0.26, 2.5, 0.18]}
          color="#3e4140"
        />
      ))}
      <Repeated
        positions={Array.from({ length: 55 }, (_, i) => [
          -1.1 + ((i * 37) % 53) / 24,
          -0.95 + ((i * 17) % 47) / 24,
          0.08,
        ])}
        geometry={<boxGeometry args={[0.008, 0.08, 0.005]} />}
        material={
          <meshBasicMaterial color="#90a6ae" transparent opacity={0.35} />
        }
      />
    </group>
  );
}

export function Courtroom(props: ModelProps) {
  const {
    materials: { wood },
    shadow,
    actions,
    onAction,
  } = props;
  return (
    <>
      <RoomShell wood={wood} tribunal />
      <spotLight
        position={[0.5, 3.4, -1.7]}
        target-position={[0, 0, -2]}
        angle={0.8}
        penumbra={0.85}
        intensity={35}
        color="#ffd3a0"
        castShadow={shadow}
        shadow-mapSize-width={props.quality === 'high' ? 2048 : 1024}
        shadow-mapSize-height={props.quality === 'high' ? 2048 : 1024}
        shadow-bias={-0.0005}
      />
      <pointLight
        position={[-3.5, 2.3, -0.5]}
        intensity={14}
        color="#7c9cb8"
        distance={12}
      />
      <pointLight
        position={[1.2, 1.5, -2.3]}
        intensity={4}
        distance={5}
        color="#ffc477"
      />
      <Window at={[-4.8, 2.2, -1.8]} turn={Math.PI / 2} />
      <Door at={[0, 0, -6.25]} wood={wood} />
      {/* A modest dais, a physical desk, and a chair for the off-screen clerk. */}
      <Block
        at={[0, 0.08, -3.8]}
        size={[5, 0.16, 3.4]}
        wood={wood}
        color="#5b4837"
      />
      <Block
        at={[0, 1, -2.6]}
        size={[3.4, 0.12, 1.5]}
        wood={wood}
        color="#77583b"
      />
      <Block
        at={[0, 0.52, -2.9]}
        size={[3.25, 0.9, 0.16]}
        wood={wood}
        color="#4c3626"
      />
      {[-1.45, 1.45].map((x) => (
        <Block
          key={x}
          at={[x, 0.55, -2.6]}
          size={[0.16, 1, 1.35]}
          wood={wood}
          color="#4a3528"
        />
      ))}
      <Chair at={[0, 0.16, -4]} turn={Math.PI} wood={wood} />
      <Interactive id="lamp" actions={actions} onAction={onAction}>
        <Lamp at={[1.2, 1.06, -2.3]} />
      </Interactive>
      <Interactive id="dossier" actions={actions} onAction={onAction}>
        <group position={[0, 1.07, -2.05]} rotation={[0, -0.12, 0]}>
          <Block
            at={[0, 0.015, 0]}
            size={[0.82, 0.035, 0.55]}
            color="#998363"
          />
          <Block at={[0, 0.034, 0]} size={[0.8, 0.008, 0.53]} color="#af9670" />
          <Label
            at={[0, 0.04, 0.02]}
            text={environmentCopy.labels.dossier}
            width={0.65}
            height={0.2}
          />
          <Block
            at={[-0.31, 0.042, 0]}
            size={[0.008, 0.006, 0.53]}
            color="#393629"
          />
        </group>
      </Interactive>
      {[-0.95, -0.85].map((x, i) => (
        <Block
          key={x}
          at={[x, 1.09 + i * 0.03, -2.8]}
          size={[0.6, 0.04, 0.43]}
          color="#71664f"
        />
      ))}
      <Repeated
        positions={Array.from({ length: 5 }, (_, i) => [
          0.6 + i * 0.035,
          1.065 + i * 0.002,
          -2.6 + i * 0.04,
        ])}
        geometry={<boxGeometry args={[0.28, 0.002, 0.38]} />}
        material={<meshStandardMaterial color="#bfb298" roughness={1} />}
      />
      <Interactive id="bench" actions={actions} onAction={onAction}>
        {[-2.6, 2.6].flatMap((x) =>
          [-0.1, 1.8].map((z) => (
            <group key={`${x}:${z}`}>
              <Block
                at={[x, 0.5, z]}
                size={[1.65, 0.12, 0.48]}
                wood={wood}
                color="#5d4934"
              />
              <Block
                at={[x, 0.95, z - 0.26]}
                size={[1.65, 0.55, 0.08]}
                wood={wood}
                color="#594332"
              />
              {[-0.65, 0.65].map((dx) => (
                <Block
                  key={dx}
                  at={[x + dx, 0.25, z]}
                  size={[0.09, 0.5, 0.45]}
                  wood={wood}
                />
              ))}
            </group>
          )),
        )}
      </Interactive>
      <Chair at={[0, 0, 2.7]} wood={wood} />
      {/* Wall ribs, brass sconces and a clock give the room a human scale. */}
      {[-3.9, -2.1, 2.1, 3.9].map((x) => (
        <Block
          key={x}
          at={[x, 2.15, -6.3]}
          size={[0.2, 2.8, 0.2]}
          color="#767469"
        />
      ))}
      <mesh position={[2.7, 2.65, -6.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.05, 48]} />
        <meshStandardMaterial color="#b7ae94" roughness={0.75} />
      </mesh>
      <Block
        at={[2.7, 2.71, -6.2]}
        size={[0.012, 0.13, 0.015]}
        color="#292820"
      />
      <Block
        at={[2.77, 2.65, -6.2]}
        size={[0.16, 0.012, 0.015]}
        color="#292820"
      />
    </>
  );
}

const settings: Vec3[] = [-1.55, -0.3, 1].flatMap((z) =>
  [-0.7, 0.7].map((x): Vec3 => [x, 0.89, z]),
);
const plateProfile = [
  [0, 0],
  [0.1, 0],
  [0.16, 0.005],
  [0.205, 0.025],
  [0.23, 0.032],
  [0.235, 0.04],
  [0.21, 0.047],
  [0.16, 0.025],
  [0, 0.02],
].map(([x, y]) => new Vector2(x, y));
const glassProfile = [
  [0.025, 0],
  [0.05, 0.005],
  [0.055, 0.02],
  [0.06, 0.16],
  [0.065, 0.17],
  [0.07, 0.17],
  [0.065, 0.015],
  [0.025, 0],
].map(([x, y]) => new Vector2(x, y));

function Tableware(props: ModelProps) {
  const { actions, onAction } = props;
  const plates = settings.slice(0, 5);
  const silver = (
    <meshStandardMaterial color="#a6a69a" metalness={0.88} roughness={0.28} />
  );
  return (
    <>
      <Repeated
        positions={plates}
        geometry={<latheGeometry args={[plateProfile, 48]} />}
        material={
          <meshStandardMaterial
            color="#c9c8b4"
            roughness={0.28}
            metalness={0.08}
          />
        }
      />
      <Interactive id="sixth-plate" actions={actions} onAction={onAction}>
        <mesh position={settings[5]} castShadow receiveShadow>
          <latheGeometry args={[plateProfile, 64]} />
          <meshStandardMaterial
            color="#d5d2bc"
            roughness={0.22}
            metalness={0.08}
          />
        </mesh>
      </Interactive>
      <Repeated
        positions={settings.map(([x, y, z]) => [x + 0.25, y, z - 0.28])}
        geometry={<latheGeometry args={[glassProfile, 32]} />}
        material={
          <meshPhysicalMaterial
            color="#a1b6b7"
            transparent
            opacity={0.36}
            roughness={0.08}
            metalness={0.15}
            side={2}
            depthWrite={false}
          />
        }
      />
      <Repeated
        positions={settings.map(([x, y, z]) => [x + 0.29, y + 0.015, z])}
        geometry={<boxGeometry args={[0.018, 0.018, 0.32]} />}
        material={silver}
      />
      <Repeated
        positions={settings.map(([x, y, z]) => [x + 0.29, y + 0.02, z - 0.095])}
        geometry={<boxGeometry args={[0.032, 0.012, 0.12]} />}
        material={silver}
      />
      <Repeated
        positions={settings.map(([x, y, z]) => [
          x - 0.29,
          y + 0.015,
          z + 0.025,
        ])}
        geometry={<boxGeometry args={[0.016, 0.016, 0.27]} />}
        material={silver}
      />
      <Repeated
        positions={settings.flatMap(([x, y, z]) =>
          [-0.012, 0, 0.012].map((d): Vec3 => [
            x - 0.29 + d,
            y + 0.015,
            z - 0.12,
          ]),
        )}
        geometry={<boxGeometry args={[0.005, 0.01, 0.08]} />}
        material={silver}
      />
      <Repeated
        positions={settings.map(([x, y, z]) => [x - 0.39, y, z])}
        geometry={<boxGeometry args={[0.11, 0.009, 0.28]} />}
        material={<meshStandardMaterial color="#9d9a85" roughness={1} />}
      />
    </>
  );
}

function DiningRoom(props: ModelProps) {
  const {
    materials: { wood },
    actions,
    onAction,
  } = props;
  const chair = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!chair.current) return;
    const wanted = props.reaction ? 0.17 : 0;
    const previous = chair.current.position.x;
    chair.current.position.x +=
      (wanted - previous) * (props.reduced ? 1 : 1 - Math.exp(-delta * 3));
    if (Math.abs(wanted - previous) > 0.001 && !props.paused) _.invalidate();
  });
  return (
    <>
      <Block
        at={[0, 0.81, -0.3]}
        size={[2.2, 0.12, 3.65]}
        wood={wood}
        color="#a0845b"
      />
      <Block at={[0, 0.877, -0.3]} size={[1.35, 0.014, 3.5]} color="#858374" />
      {[-0.88, 0.88].flatMap((x) =>
        [-1.85, 1.25].map((z) => (
          <Block
            key={`${x}:${z}`}
            at={[x, 0.38, z]}
            size={[0.12, 0.76, 0.12]}
            wood={wood}
            color="#5e4932"
          />
        )),
      )}
      <Tableware {...props} />
      <HenriHands
        resting={props.reaction}
        reduced={props.reduced}
        paused={props.paused}
      />
      {[-1.55, -0.3, 1].flatMap((z, index) =>
        [-1.48, 1.48].map((x) =>
          index === 2 && x > 0 ? (
            <group key={`${x}:${z}`} ref={chair}>
              <Chair at={[x, 0, z]} turn={-Math.PI / 2} wood={wood} />
            </group>
          ) : (
            <Chair
              key={`${x}:${z}`}
              at={[x, 0, z]}
              turn={x < 0 ? Math.PI / 2 : -Math.PI / 2}
              wood={wood}
            />
          ),
        ),
      )}
      <Lamp at={[0, 2.65, -0.5]} hanging />
      <Window at={[-4.78, 2.05, -1.1]} turn={Math.PI / 2} />
      <Door at={[2.9, 0, -6.25]} wood={wood} />
      <Interactive id="bread" actions={actions} onAction={onAction}>
        <mesh position={[-0.4, 0.95, -0.35]} scale={[1.4, 0.65, 1]}>
          <sphereGeometry args={[0.19, 24, 16]} />
          <meshStandardMaterial color="#aa8952" roughness={1} />
        </mesh>
      </Interactive>
      <Interactive id="soup" actions={actions} onAction={onAction}>
        <mesh position={[0, 0.99, -0.65]}>
          <sphereGeometry
            args={[0.25, 32, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]}
          />
          <meshStandardMaterial color="#b2b0a1" roughness={0.26} side={2} />
        </mesh>
        <mesh position={[0, 1.0, -0.65]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.23, 32]} />
          <meshStandardMaterial color="#65523c" roughness={0.65} />
        </mesh>
      </Interactive>
      <Block
        at={[3.9, 0.7, -3.5]}
        size={[1.45, 1.4, 0.65]}
        wood={wood}
        color="#604c38"
      />
      <Block
        at={[3.9, 1.43, -3.5]}
        size={[1.55, 0.06, 0.72]}
        wood={wood}
        color="#8c7350"
      />
      <mesh position={[3.9, 1.57, -3.5]}>
        <cylinderGeometry args={[0.09, 0.08, 0.24, 24]} />
        <meshStandardMaterial color="#b9b5a1" roughness={0.4} />
      </mesh>
      <Label
        text={environmentCopy.labels.photograph}
        at={[3.9, 2.1, -6.28]}
        width={0.65}
        height={0.4}
        rotation={[0, 0, 0]}
      />
      {/* The family remains just outside the shot; no expressionless human stand-ins. */}
    </>
  );
}

// Only the wrists and hands enter the shot; there is no expressionless body rig.
function HenriHands({
  resting,
  reduced,
  paused,
}: {
  resting: boolean;
  reduced: boolean;
  paused: boolean;
}) {
  const group = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!group.current || paused) return;
    const target = resting ? -0.1 : 0.03;
    const previous = group.current.rotation.y;
    group.current.rotation.y +=
      (target - previous) * (reduced ? 1 : 1 - Math.exp(-delta * 3));
    if (Math.abs(target - previous) > 0.001) state.invalidate();
  });
  return (
    <group
      ref={group}
      position={[-1.15, 0.98, -1.55]}
      rotation={[0, 0.03, 0.08]}
    >
      <mesh position={[-0.13, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.068, 0.3, 6, 20]} />
        <meshStandardMaterial color="#555b55" roughness={1} />
      </mesh>
      <mesh position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.045, 0.12, 6, 20]} />
        <meshStandardMaterial color="#9b8270" roughness={0.9} />
      </mesh>
      <mesh position={[0.16, -0.005, 0]} scale={[1, 0.45, 0.85]} castShadow>
        <sphereGeometry args={[0.075, 24, 16]} />
        <meshStandardMaterial color="#a28b75" roughness={0.88} />
      </mesh>
      {[-0.045, -0.015, 0.015, 0.045].map((z, index) => (
        <mesh
          key={z}
          position={[0.23, -0.012, z]}
          rotation={[0, 0, 1.45]}
          castShadow
        >
          <capsuleGeometry
            args={[0.013, 0.065 - Math.abs(index - 1.5) * 0.008, 4, 12]}
          />
          <meshStandardMaterial color="#a28b75" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Album({
  actions,
  onAction,
  wood,
  at = [0, 0, 0],
}: {
  actions: WorldProps['actions'];
  onAction: WorldProps['onAction'];
  wood: Texture;
  at?: Vec3;
}) {
  return (
    <group position={at}>
      <Block
        at={[0, 0.8, 0]}
        size={[2.1, 0.12, 1.4]}
        wood={wood}
        color="#796045"
      />
      <Block at={[0, 0.875, 0]} size={[1.25, 0.035, 0.8]} color="#2e2723" />
      <Block at={[0, 0.9, 0]} size={[1.18, 0.015, 0.75]} color="#b5a587" />
      <Block at={[0, 0.915, 0]} size={[0.015, 0.006, 0.75]} color="#6f604b" />
      <Interactive id="photograph" actions={actions} onAction={onAction}>
        <Block
          at={[-0.35, 0.918, 0.1]}
          size={[0.42, 0.008, 0.43]}
          color="#d6c8a7"
        />
        <Block
          at={[-0.36, 0.924, 0.1]}
          size={[0.34, 0.004, 0.35]}
          color="#655f50"
        />
        <Repeated
          positions={[-0.47, -0.36, -0.25].map((x) => [x, 0.93, 0.1])}
          geometry={<sphereGeometry args={[0.035, 12, 8]} />}
          material={<meshStandardMaterial color="#282a26" />}
          scale={[1, 0.1, 1.7]}
        />
        <Block
          at={[-0.15, 0.932, 0.1]}
          size={[0.05, 0.004, 0.36]}
          color="#b5a587"
        />
      </Interactive>
      <Interactive id="negative" actions={actions} onAction={onAction}>
        <Block
          at={[0.35, 0.924, -0.1]}
          size={[0.13, 0.008, 0.55]}
          color="#3c291b"
        />
        <Repeated
          positions={Array.from({ length: 6 }, (_, i) => [
            0.35,
            0.932,
            -0.33 + i * 0.085,
          ])}
          geometry={<boxGeometry args={[0.1, 0.004, 0.06]} />}
          material={<meshStandardMaterial color="#92734b" roughness={0.5} />}
        />
      </Interactive>
    </group>
  );
}
function Hall(props: ModelProps) {
  const {
    materials: { wood },
    actions,
    onAction,
  } = props;
  return (
    <>
      <Interactive id="door" actions={actions} onAction={onAction}>
        <Door at={[0, 0, -6.25]} wood={wood} />
      </Interactive>
      <Interactive id="kitchen" actions={actions} onAction={onAction}>
        <Door at={[2.16, 0, -2.2]} wood={wood} turn={-Math.PI / 2} />
      </Interactive>
      <Interactive id="album" actions={actions} onAction={onAction}>
        <Block
          at={[-1.7, 0.78, -0.7]}
          size={[1, 0.1, 0.55]}
          wood={wood}
          color="#7c6042"
        />
        {[-2.1, -1.3].map((x) => (
          <Block
            key={x}
            at={[x, 0.38, -0.7]}
            size={[0.06, 0.76, 0.5]}
            wood={wood}
          />
        ))}
        <Block
          at={[-1.7, 0.85, -0.7]}
          size={[0.55, 0.07, 0.4]}
          color="#44332a"
        />
        <Label
          text={environmentCopy.labels.album}
          at={[-1.7, 0.89, -0.7]}
          width={0.3}
          height={0.12}
        />
      </Interactive>
      <Lamp at={[-2, 0.84, -0.7]} />
      {actions
        .filter((action) =>
          ['cassette', 'letter', 'maintenance', 'phone'].includes(action.id),
        )
        .map((action) => (
          <Interactive
            key={action.id}
            id={action.id}
            actions={actions}
            onAction={onAction}
          >
            <Block
              at={
                action.id === 'cassette'
                  ? [-1.5, 0.94, -0.55]
                  : action.id === 'letter'
                    ? [-1.85, 0.93, -0.65]
                    : action.id === 'phone'
                      ? [-1.4, 0.94, -0.85]
                      : [-1.7, 0.93, -0.9]
              }
              size={
                action.id === 'phone'
                  ? [0.16, 0.035, 0.23]
                  : action.id === 'cassette'
                    ? [0.25, 0.045, 0.15]
                    : [0.23, 0.008, 0.14]
              }
              color={
                action.id === 'cassette'
                  ? '#363a37'
                  : action.id === 'phone'
                    ? '#1e2728'
                    : '#c6bc9f'
              }
            />
          </Interactive>
        ))}
      <Interactive id="rug" actions={actions} onAction={onAction}>
        <Block
          at={[0.3, 0.02, -3.6]}
          size={[1.05, 0.02, 1.5]}
          color="#59564a"
        />
      </Interactive>
      <Block at={[2.18, 1.2, -1.2]} size={[0.04, 0.13, 0.09]} color="#bbb9a3" />
      <Block
        at={[-2.18, 0.28, -2.8]}
        size={[0.04, 0.1, 0.15]}
        color="#aba994"
      />
      <Repeated
        positions={Array.from({ length: 7 }, (_, i) => [
          -2.13,
          1.7,
          -3.2 + i * 0.085,
        ])}
        geometry={<boxGeometry args={[0.08, 0.5, 0.05]} />}
        material={<meshStandardMaterial color="#6f6550" roughness={0.9} />}
      />
      <Interactive id="photographs" actions={actions} onAction={onAction}>
        {[-2.4, -1.4, -0.4].map((z, index) => (
          <group key={z}>
            <Block
              at={[-2.2, 1.85, z]}
              size={[0.015, 0.7 + index * 0.04, 0.48]}
              color="#888777"
            />
            <mesh position={[-2.18, 2.3, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.008, 0.008, 0.03, 8]} />
              <meshStandardMaterial color={brass} />
            </mesh>
          </group>
        ))}
      </Interactive>
      <Interactive id="threshold" actions={actions} onAction={onAction}>
        <Block at={[1.5, 0.025, 3]} size={[1.2, 0.05, 0.45]} wood={wood} />
      </Interactive>
      <Interactive id="vestibule" actions={actions} onAction={onAction}>
        <Block at={[-1.7, 1.25, 2.8]} size={[0.09, 2.5, 0.09]} wood={wood} />
        <Block at={[-1.7, 2.15, 2.8]} size={[0.9, 0.06, 0.06]} wood={wood} />
      </Interactive>
      <Block at={[1.5, 0.5, -4.9]} size={[1.4, 1, 1.5]} color="#3d352d" />
      <Repeated
        positions={Array.from({ length: 6 }, (_, i) => [
          1.5,
          0.12 + i * 0.18,
          -3.6 - i * 0.29,
        ])}
        geometry={<boxGeometry args={[1.4, 0.12, 0.3]} />}
        material={
          <meshStandardMaterial color="#6c5740" map={wood} roughness={0.85} />
        }
      />
    </>
  );
}
function Exterior(props: ModelProps) {
  const {
    materials: { wood },
    actions,
    onAction,
  } = props;
  return (
    <>
      <Block at={[0, -0.12, 0]} size={[35, 0.2, 35]} color="#252b29" />
      <Block at={[0, -0.005, 3]} size={[1.5, 0.03, 6]} color="#67685d" />
      <Block at={[0, 1.75, -2.3]} size={[8, 3.5, 4.5]} color="#69685b" />
      <mesh
        position={[0, 4, -2.3]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[5.9, 1.5, 3.6]}
        castShadow
      >
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color="#272c2c" roughness={0.82} />
      </mesh>
      <Interactive id="entrance" actions={actions} onAction={onAction}>
        <Door at={[0, 0, 0.02]} wood={wood} />
      </Interactive>
      <Interactive id="window" actions={actions} onAction={onAction}>
        <Window at={[2.6, 1.9, 0.03]} />
      </Interactive>
      <Window at={[-2.6, 1.9, 0.03]} />
      <pointLight
        position={[2.4, 2, 0.6]}
        intensity={13}
        color="#ffd399"
        distance={8}
      />
      <spotLight
        position={[4, 7, 3]}
        angle={1}
        intensity={70}
        penumbra={1}
        color="#88a7ba"
        castShadow={props.shadow}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Interactive id="car" actions={actions} onAction={onAction}>
        <Block
          at={[3.3, 0.5, 4.8]}
          size={[1.7, 0.65, 3.5]}
          color="#202b2c"
          metal
        />
        <Block
          at={[3.3, 0.98, 4.7]}
          size={[1.5, 0.5, 1.7]}
          color="#263b43"
          metal
        />
      </Interactive>
      <Repeated
        positions={Array.from({ length: 22 }, (_, i) => [
          Math.sin(i * 7) * 10,
          2.7,
          -5 - (i % 5) * 2,
        ])}
        geometry={<cylinderGeometry args={[0.09, 0.18, 5.5, 8]} />}
        material={<meshStandardMaterial color="#252c29" roughness={1} />}
      />
    </>
  );
}
export function FamilyHouse(props: ModelProps) {
  if (props.room === 'outside') return <Exterior {...props} />;
  return (
    <>
      <RoomShell
        wood={props.materials.wood}
        half={props.room === 'hall' ? 2.35 : 5}
      />
      <spotLight
        position={props.room === 'table' ? [0, 2.6, -0.5] : [-1.7, 2.8, -0.7]}
        angle={1.05}
        penumbra={0.85}
        intensity={props.reaction ? 22 : 32}
        color="#ffd29a"
        castShadow={props.shadow}
        shadow-mapSize-width={props.quality === 'high' ? 2048 : 1024}
        shadow-mapSize-height={props.quality === 'high' ? 2048 : 1024}
        shadow-bias={-0.0004}
      />
      <pointLight
        position={[-4, 2, -1]}
        intensity={12}
        color="#7e9daf"
        distance={13}
      />
      <pointLight
        position={[2, 2, 3]}
        intensity={5}
        color="#d4bc8f"
        distance={10}
      />
      {props.room === 'table' ? (
        <DiningRoom {...props} />
      ) : props.room === 'album' ? (
        <Album
          actions={props.actions}
          onAction={props.onAction}
          wood={props.materials.wood}
        />
      ) : (
        <Hall {...props} />
      )}
    </>
  );
}
