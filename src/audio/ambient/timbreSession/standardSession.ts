import type { PlantasiaPreset } from 'plantasia-sound-engine';
import * as Tone from 'tone';
import type { ModulationControlValues, SoundControlValues } from '../../../types/instrument';
import type { GestureVocabulary } from '../gestureVocabulary';
import type { AmbientLayerKind } from '../layers';
import { applyPresetMacroBehavior, macrosFromControls } from '../presetMacroMappings';
import type { VoiceKind } from '../probabilityEngine';
import type { TimbreProfile } from '../timbreProfile';
import type { AmbientVoiceActor, PresetTimbreSession } from './types';
import { createStandardVoiceForKind, type StandardVoiceHandle } from './standardVoicePool';

type SessionNodes = {
  master: Tone.Volume;
  filter: Tone.Filter;
  filterLfo: Tone.LFO;
  delay: Tone.FeedbackDelay;
  reverb: Tone.Reverb;
  air: Tone.Noise;
  airGain: Tone.Volume;
  airFilter: Tone.Filter;
  bus: Tone.Gain;
};

class StandardVoiceActor implements AmbientVoiceActor {
  readonly kind: VoiceKind;
  private readonly handle: StandardVoiceHandle;

  constructor(kind: VoiceKind, handle: StandardVoiceHandle) {
    this.kind = kind;
    this.handle = handle;
  }

  attack(note: string, time: number, velocity: number): void {
    this.handle.synth.triggerAttack(note, time, velocity);
  }

  attackRelease(note: string, duration: number, time: number, velocity: number): void {
    this.handle.synth.triggerAttackRelease(note, duration, time, velocity);
  }

  release(time: number, releaseSec = 0.6): void {
    this.handle.synth.triggerRelease(time + releaseSec);
  }

  tick(): void {
    /* standard voices use Tone envelopes only */
  }

  dispose(): void {
    this.handle.release();
  }
}

/**
 * Standard preset sound world — profile-driven graph.
 * Mirrors engine standard routing until engine exposes ambient layer API.
 */
export class StandardTimbreSession implements PresetTimbreSession {
  readonly preset: PlantasiaPreset;
  readonly profile: TimbreProfile;
  readonly gestureVocabulary: GestureVocabulary;
  private nodes: SessionNodes | null = null;
  private readonly voicePool = createStandardVoiceForKind;

  constructor(preset: PlantasiaPreset, profile: TimbreProfile, gestureVocabulary: GestureVocabulary) {
    this.preset = preset;
    this.profile = profile;
    this.gestureVocabulary = gestureVocabulary;
  }

  async init(): Promise<void> {
    const p = this.profile;
    const fx = p.effectsChain;
    const f = p.filterShape;

    const bus = new Tone.Gain(1);
    const filter = new Tone.Filter({ frequency: f.baseHz, type: f.type, Q: f.q });
    const filterLfo = new Tone.LFO({
      frequency: f.lfoRate,
      min: f.baseHz * 0.55,
      max: f.baseHz * 1.2,
    });
    const delay = new Tone.FeedbackDelay({
      delayTime: fx.delayTime,
      feedback: fx.delayFeedback,
      wet: fx.delayWet,
    });
    const reverb = new Tone.Reverb({ decay: fx.reverbDecay, wet: fx.reverbWet });
    await reverb.generate();

    const master = new Tone.Volume(-48);
    bus.connect(filter);
    filter.connect(delay);
    delay.connect(reverb);
    reverb.connect(master);
    master.toDestination();
    filterLfo.connect(filter.frequency);
    filterLfo.start();

    const airFilter = new Tone.Filter({ frequency: 720, type: 'bandpass', Q: 0.55 });
    const airGain = new Tone.Volume(-42);
    const air = new Tone.Noise({ type: p.textureLayer.noiseType });
    air.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(reverb);
    air.start();

    this.nodes = { master, filter, filterLfo, delay, reverb, air, airGain, airFilter, bus };
  }

  fadeIn(_now: number, fadeSec: number): void {
    this.nodes?.master.volume.rampTo(-20, fadeSec);
    const tex = this.profile.textureLayer;
    const airDb = -38 + tex.airLevel * 120 + tex.filteredNoise * 80;
    this.nodes?.airGain.volume.rampTo(airDb, fadeSec);
  }

  fadeOut(fade: boolean, releaseSec: number): void {
    if (!this.nodes) {
      return;
    }
    const sec = fade ? releaseSec : 0.1;
    this.nodes.master.volume.rampTo(-48, sec);
    this.nodes.airGain.volume.rampTo(-48, sec);
  }

  applyControls(
    sound: SoundControlValues,
    modulation: ModulationControlValues,
    evolutionPhase: number,
    densityBias: number,
  ): void {
    if (!this.nodes) {
      return;
    }

    const macros = macrosFromControls(sound, modulation, evolutionPhase, densityBias);
    const behavior = applyPresetMacroBehavior('standard', this.profile, macros);
    const baseHz = this.profile.filterShape.baseHz * (0.85 + behavior.filterOpen * 0.35);

    ramp(this.nodes.filter.frequency, baseHz * (0.9 + evolutionPhase * 0.08));
    this.nodes.filterLfo.min = baseHz * 0.55;
    this.nodes.filterLfo.max = baseHz * 1.25;
    ramp(this.nodes.filterLfo.frequency, behavior.driftRate);
    ramp(this.nodes.delay.wet, Math.min(0.55, this.profile.effectsChain.delayWet + behavior.spaceDepth * 0.35));
    ramp(this.nodes.reverb.wet, Math.min(0.78, this.profile.effectsChain.reverbWet + behavior.spaceDepth * 0.4));
    ramp(this.nodes.airGain.volume, -38 + behavior.textureGain * 8 + behavior.degradation * 4);
  }

  createDroneLayer(index: number): AmbientVoiceActor {
    return this.createVoiceActor('drone', index);
  }

  createPulseLayer(index: number): AmbientVoiceActor {
    return this.createVoiceActor('sub', index);
  }

  createMelodyLayer(index: number): AmbientVoiceActor {
    return this.createVoiceActor('bell', index);
  }

  createTextureLayer(index: number): AmbientVoiceActor {
    return this.createVoiceActor('pad', index);
  }

  createGestureLayer(index: number): AmbientVoiceActor {
    return this.createVoiceActor('pluck', index);
  }

  createNoiseLayer(_index: number): AmbientVoiceActor | null {
    return null;
  }

  createLayerActor(layer: AmbientLayerKind, index: number): AmbientVoiceActor | null {
    switch (layer) {
      case 'drone':
        return this.createDroneLayer(index);
      case 'pulse':
        return this.createPulseLayer(index);
      case 'melody':
        return this.createMelodyLayer(index);
      case 'texture':
        return this.createTextureLayer(index);
      case 'gesture':
        return this.createGestureLayer(index);
      default:
        return null;
    }
  }

  createVoiceActor(kind: VoiceKind, index: number): AmbientVoiceActor {
    if (!this.nodes) {
      throw new Error('StandardTimbreSession not initialized');
    }
    const handle = this.voicePool(kind, this.profile, this.nodes.bus, index);
    return new StandardVoiceActor(kind, handle);
  }

  tickLiving(): void {
    /* no-op */
  }

  getTextureAmount(): number {
    if (!this.nodes) {
      return 0.2;
    }
    return Math.min(1, (-this.nodes.airGain.volume.value + 28) / 16);
  }

  dispose(): void {
    if (!this.nodes) {
      return;
    }
    const n = this.nodes;
    n.filterLfo.stop();
    n.filterLfo.dispose();
    n.filter.dispose();
    n.delay.dispose();
    n.reverb.dispose();
    n.master.dispose();
    n.bus.dispose();
    n.air.stop();
    n.air.dispose();
    n.airGain.dispose();
    n.airFilter.dispose();
    this.nodes = null;
  }
}

function ramp(
  param: { rampTo?: (v: number, t: number) => void; value?: unknown },
  value: number,
  time = 0.5,
): void {
  if (param && typeof param.rampTo === 'function') {
    param.rampTo(value, time);
  } else if (param && 'value' in param) {
    (param as { value: number }).value = value;
  }
}

export async function createStandardTimbreSession(
  preset: PlantasiaPreset,
  profile: TimbreProfile,
  gestureVocabulary: GestureVocabulary,
): Promise<StandardTimbreSession> {
  const session = new StandardTimbreSession(preset, profile, gestureVocabulary);
  await session.init();
  return session;
}
