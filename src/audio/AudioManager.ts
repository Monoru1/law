import { gainsForAct } from './actAudio';

export interface AudioManager {
  play(cue: string): void;
  setAmbience(id: string): void;
  mute(): void;
}
export const silentAudio: AudioManager = {
  play() {},
  setAmbience() {},
  mute() {},
};

// The city's whole sound is synthesised in the browser: no external file, no
// third-party asset, nothing whose licence needs documenting. Three layers —
// a low drone, a slow amplitude pulse, a filtered noise texture — cross-fade
// as the act changes. Nothing here plays before a user gesture, and nothing
// here can block the game: every entry point is wrapped so a failure is
// silent, never a thrown error the player would see.
export interface ActAudioDirector extends AudioManager {
  /** Cross-fades to the given act's layers over a few seconds. */
  setAct(act: number): void;
  setMuted(muted: boolean): void;
  /** Starts the engine; must follow a real user gesture per browser policy. */
  resume(): void;
}

const FADE_SECONDS = 3;

function buildNoiseBuffer(context: AudioContext): AudioBuffer {
  const seconds = 4;
  const buffer = context.createBuffer(
    1,
    context.sampleRate * seconds,
    context.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function createProceduralAudioManager(): ActAudioDirector {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let droneGain: GainNode | null = null;
  let pulseGain: GainNode | null = null;
  let textureGain: GainNode | null = null;
  let currentAct = 0;
  let muted = false;
  let started = false;

  const safe = (fn: () => void) => {
    try {
      fn();
    } catch {
      /* Audio is decoration; a failure here never touches gameplay. */
    }
  };

  function applyGains(): void {
    if (!context || !droneGain || !pulseGain || !textureGain) return;
    const gains = gainsForAct(currentAct);
    const now = context.currentTime;
    const factor = muted ? 0 : 1;
    for (const [node, value] of [
      [droneGain, gains.drone],
      [pulseGain, gains.pulse],
      [textureGain, gains.texture],
    ] as const)
      node.gain.linearRampToValueAtTime(value * factor, now + FADE_SECONDS);
  }

  function build(): void {
    if (started) return;
    started = true;
    const Ctx =
      typeof window === 'undefined'
        ? undefined
        : (window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    context = ctx;
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);

    // Drone: a single low, tuned oscillator — the piece's floor.
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 55;
    droneGain = ctx.createGain();
    droneGain.gain.value = 0;
    drone.connect(droneGain).connect(master);
    drone.start();

    // Pulse: the drone's own amplitude, slowly modulated — felt more than
    // heard, arriving only once a rule is in force.
    const pulseCarrier = ctx.createOscillator();
    pulseCarrier.type = 'sine';
    pulseCarrier.frequency.value = 110;
    const pulseLfo = ctx.createOscillator();
    pulseLfo.type = 'sine';
    pulseLfo.frequency.value = 0.12;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.5;
    const pulseCarrierGain = ctx.createGain();
    pulseCarrierGain.gain.value = 0.5;
    pulseLfo.connect(lfoDepth).connect(pulseCarrierGain.gain);
    pulseGain = ctx.createGain();
    pulseGain.gain.value = 0;
    pulseCarrier.connect(pulseCarrierGain).connect(pulseGain).connect(master);
    pulseCarrier.start();
    pulseLfo.start();

    // Texture: filtered noise — the system running on its own, underneath.
    const noise = ctx.createBufferSource();
    noise.buffer = buildNoiseBuffer(ctx);
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 240;
    textureGain = ctx.createGain();
    textureGain.gain.value = 0;
    noise.connect(filter).connect(textureGain).connect(master);
    noise.start();

    applyGains();
  }

  return {
    resume() {
      safe(() => {
        build();
        void context?.resume();
      });
    },
    setAct(act: number) {
      currentAct = act;
      safe(applyGains);
    },
    setMuted(next: boolean) {
      muted = next;
      safe(applyGains);
    },
    // Kept for interface compatibility; La Ville has no discrete cues yet.
    play() {},
    setAmbience() {},
    mute() {
      this.setMuted(true);
    },
  };
}
