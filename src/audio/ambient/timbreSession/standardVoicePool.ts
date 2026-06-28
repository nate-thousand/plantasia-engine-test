import * as Tone from 'tone';
import type { VoiceKind } from '../probabilityEngine';
import type { TimbreProfile } from '../timbreProfile';

export type StandardVoiceHandle = {
  synth: Tone.Synth | Tone.FMSynth | Tone.PolySynth;
  panner: Tone.Panner;
  release: () => void;
};

const pool: StandardVoiceHandle[] = [];

/** Pooled voice creation — Play mode requests handles, never builds graphs directly. */
export function createStandardVoiceForKind(
  kind: VoiceKind,
  profile: TimbreProfile,
  bus: Tone.Gain,
  index: number,
): StandardVoiceHandle {
  const env = profile.envelopes[kind] ?? profile.envelopes.drone;
  let synth: Tone.Synth | Tone.FMSynth | Tone.PolySynth;

  if (kind === 'bell') {
    synth = new Tone.FMSynth({
      harmonicity: 2.4,
      modulationIndex: 1.2,
      envelope: env,
      modulationEnvelope: { attack: 0.02, decay: 0.4, sustain: 0, release: 0.6 },
    });
  } else if (kind === 'pad') {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsine' },
      envelope: env,
    });
  } else {
    synth = new Tone.Synth({
      oscillator: { type: kind === 'sub' ? 'sine' : 'fatsine' },
      envelope: env,
    });
  }

  const panner = new Tone.Panner((index / Math.max(profile.voiceKinds.length - 1, 1)) * 2 - 1);
  synth.connect(panner);
  panner.connect(bus);

  const handle: StandardVoiceHandle = {
    synth,
    panner,
    release: () => {
      synth.dispose();
      panner.dispose();
      const idx = pool.indexOf(handle);
      if (idx >= 0) {
        pool.splice(idx, 1);
      }
    },
  };
  pool.push(handle);
  return handle;
}

export function disposeStandardVoicePool(): void {
  for (const handle of pool.splice(0)) {
    handle.release();
  }
}
