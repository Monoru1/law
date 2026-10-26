// Asset-based local sound design. AudioContext is created only by start(),
// called directly from the player's sound button. No global listeners.
export type AudioPlace = 'apartment' | 'school' | 'house' | 'silence';
export type SoundCue =
  | 'paper'
  | 'door'
  | 'steps'
  | 'phone'
  | 'electric'
  | 'clock'
  | 'message'
  | 'message-intro';
export function createInvestigationAudio() {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let muted = true;
  let volume = 0.65;
  let place: AudioPlace = 'apartment';
  let revision = 0;
  let alive = true;
  let loops: { source: AudioBufferSourceNode; gain: GainNode }[] = [];
  const oneShots = new Set<AudioBufferSourceNode>();
  const buffers = new Map<string, Promise<AudioBuffer>>();
  const load = (name: string) => {
    if (!context) throw new Error('Audio not started');
    const ctx = context;
    let pending = buffers.get(name);
    if (!pending) {
      pending = fetch(`/rebirth/${name}.wav`)
        .then((response) => {
          if (!response.ok) throw new Error('Audio asset unavailable');
          return response.arrayBuffer();
        })
        .then((bytes) => ctx.decodeAudioData(bytes));
      buffers.set(name, pending);
      void pending.catch(() => buffers.delete(name));
    }
    return pending;
  };
  const applyVolume = () => {
    if (!context || !master) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(muted ? 0 : volume, context.currentTime, 0.03);
    if (muted)
      for (const source of oneShots) {
        try {
          source.stop();
        } catch {
          /* Already ended. */
        }
      }
  };
  async function transition() {
    if (!context || !master) return;
    const token = ++revision;
    const ctx = context;
    const output = master;
    if (place === 'silence') {
      for (const layer of loops) {
        layer.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
        layer.source.stop(ctx.currentTime + 1);
        layer.source.onended = () => {
          layer.source.disconnect();
          layer.gain.disconnect();
        };
      }
      loops = [];
      return;
    }
    try {
      const [air, score] = await Promise.all([
        load(place === 'school' ? 'school-air' : 'rain'),
        load('score'),
      ]);
      if (!alive || revision !== token || ctx.state === 'closed') return;
      const previous = loops;
      loops = [air, score].map((buffer, index) => {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        source.loop = true;
        gain.gain.value = 0;
        source.connect(gain).connect(output);
        source.start();
        gain.gain.linearRampToValueAtTime(
          index === 0 ? 0.9 : place === 'school' ? 0.32 : 0.18,
          ctx.currentTime + 1.5,
        );
        return { source, gain };
      });
      for (const layer of previous) {
        layer.gain.gain.cancelScheduledValues(ctx.currentTime);
        layer.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
        layer.source.stop(ctx.currentTime + 1.5);
        layer.source.onended = () => {
          layer.source.disconnect();
          layer.gain.disconnect();
        };
      }
    } catch {
      /* Audio failure never mutates the journal. */
    }
  }
  return {
    async start(): Promise<boolean> {
      try {
        alive = true;
        if (!context || context.state === 'closed') {
          context = new AudioContext();
          master = context.createGain();
          master.gain.value = 0;
          const limiter = context.createDynamicsCompressor();
          limiter.threshold.value = -8;
          limiter.ratio.value = 8;
          master.connect(limiter).connect(context.destination);
        }
        await context.resume();
        muted = false;
        applyVolume();
        if (!loops.length) await transition();
        return context.state === 'running';
      } catch {
        return false;
      }
    },
    configure(next: { muted: boolean; volume: number; place: AudioPlace }) {
      muted = next.muted;
      volume = Math.min(1, Math.max(0, next.volume));
      applyVolume();
      if (next.place !== place) {
        place = next.place;
        void transition();
      }
    },
    async cue(name: SoundCue): Promise<boolean> {
      if (!context || !master || muted || context.state !== 'running')
        return false;
      const ctx = context;
      try {
        const buffer = await load(name);
        if (!alive || muted || ctx.state !== 'running') return false;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = name.startsWith('message') ? 0.85 : 0.65;
        // A radio band-pass colours the fictional recording, not its transcript.
        const filter = ctx.createBiquadFilter();
        filter.type = name.startsWith('message') ? 'bandpass' : 'lowpass';
        filter.frequency.value = name.startsWith('message') ? 1600 : 7500;
        filter.Q.value = 0.5;
        source.connect(filter).connect(gain).connect(master);
        oneShots.add(source);
        source.onended = () => {
          oneShots.delete(source);
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        };
        source.start();
        return true;
      } catch {
        return false;
      }
    },
    stopVoice() {
      for (const source of oneShots) {
        try {
          source.stop();
        } catch {
          /* Already ended. */
        }
      }
    },
    dispose() {
      alive = false;
      revision++;
      for (const layer of loops) {
        try {
          layer.source.stop();
        } catch {
          /* Already ended. */
        }
      }
      for (const source of oneShots) {
        try {
          source.stop();
        } catch {
          /* Already ended. */
        }
      }
      loops = [];
      oneShots.clear();
      buffers.clear();
      if (context && context.state !== 'closed')
        void context.close().catch(() => undefined);
      context = null;
      master = null;
    },
  };
}
