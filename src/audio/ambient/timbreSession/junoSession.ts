import type { PlantasiaPreset } from 'plantasia-sound-engine';
import {
  applyJunoMold,
  buildJunoSynthState,
  createJunoLiveVoice,
  ensureJunoRuntime,
  releaseJunoVoice,
  setJunoModeActive,
  syncJunoBotanical,
  tickJunoLivingVoice,
  toJunoEnginePreset,
  type JunoBotanicalGraph,
  type JunoLiveVoice,
} from 'plantasia-sound-engine';
import * as Tone from 'tone';
import type { ModulationControlValues, SoundControlValues } from '../../../types/instrument';
import { clampMold } from '../../moldSync';
import type { GestureVocabulary } from '../gestureVocabulary';
import type { AmbientLayerKind } from '../layers';
import { applyPresetMacroBehavior, macrosFromControls } from '../presetMacroMappings';
import type { VoiceKind } from '../probabilityEngine';
import type { TimbreProfile } from '../timbreProfile';
import type { AmbientVoiceActor, PresetTimbreSession } from './types';

const AMBIENT_VEL: Record<VoiceKind, number> = {
  drone: 0.38,
  pad: 0.28,
  bell: 0.16,
  pluck: 0.12,
  sub: 0.34,
  air: 0,
};

class JunoVoiceActor implements AmbientVoiceActor {
  readonly kind: VoiceKind;
  private voices: JunoLiveVoice[] = [];
  private readonly graph: JunoBotanicalGraph;
  private readonly enginePreset: ReturnType<typeof toJunoEnginePreset>;
  private readonly synthState: ReturnType<typeof buildJunoSynthState>;

  constructor(
    kind: VoiceKind,
    graph: JunoBotanicalGraph,
    enginePreset: ReturnType<typeof toJunoEnginePreset>,
    synthState: ReturnType<typeof buildJunoSynthState>,
  ) {
    this.kind = kind;
    this.graph = graph;
    this.enginePreset = enginePreset;
    this.synthState = synthState;
  }

  attack(note: string, time: number, velocity: number): void {
    this.release(time, 0.35);
    const freq = Tone.Frequency(note).toFrequency();
    const voice = createJunoLiveVoice({
      audioCtx: this.graph.audioCtx,
      params: {
        freq,
        waveform: this.enginePreset.sound.waveform,
        detuneCents: this.enginePreset.sound.detuneCents,
        filterFreq: this.synthState.filterHz * (this.kind === 'sub' ? 0.65 : 0.92),
        filterType: this.synthState.filterType,
        velocityScale: velocity * AMBIENT_VEL[this.kind],
      },
      preset: this.enginePreset,
      startTime: time,
      voiceId: `ambient-juno-${this.kind}-${note}-${Date.now()}`,
      synthState: this.synthState,
      graph: this.graph,
    });
    this.voices.push(voice);
  }

  attackRelease(note: string, duration: number, time: number, velocity: number): void {
    this.attack(note, time, velocity);
    const voice = this.voices[this.voices.length - 1];
    if (voice) {
      window.setTimeout(() => {
        releaseJunoVoice(voice, this.graph.audioCtx);
        this.voices = this.voices.filter((v) => v !== voice);
      }, duration * 1000);
    }
  }

  release(_time: number, _releaseSec = 0.6): void {
    for (const voice of this.voices) {
      releaseJunoVoice(voice, this.graph.audioCtx);
    }
    this.voices = [];
  }

  tick(): void {
    for (const voice of this.voices) {
      tickJunoLivingVoice(voice, this.graph.audioCtx);
    }
  }

  dispose(): void {
    this.release(Tone.now(), 0);
  }
}

export class JunoTimbreSession implements PresetTimbreSession {
  readonly preset: PlantasiaPreset;
  readonly profile: TimbreProfile;
  readonly gestureVocabulary: GestureVocabulary;
  private graph: JunoBotanicalGraph | null = null;
  private enginePreset: ReturnType<typeof toJunoEnginePreset> | null = null;
  private synthState: ReturnType<typeof buildJunoSynthState> | null = null;
  private baseFilterHz = 1750;
  private macroTexture = 0.3;

  constructor(preset: PlantasiaPreset, profile: TimbreProfile, gestureVocabulary: GestureVocabulary) {
    this.preset = preset;
    this.profile = profile;
    this.gestureVocabulary = gestureVocabulary;
  }

  async init(): Promise<void> {
    this.graph = await ensureJunoRuntime();
    this.enginePreset = toJunoEnginePreset(this.preset);
    this.synthState = buildJunoSynthState(this.preset);
    this.baseFilterHz = this.synthState.filterHz;
    syncJunoBotanical(this.graph, this.synthState, this.enginePreset);
    setJunoModeActive(true, this.synthState.volume * 0.55);
  }

  fadeIn(_now: number, _fadeSec: number): void {
    /* juno runtime handles master */
  }

  fadeOut(fade: boolean, _releaseSec: number): void {
    setJunoModeActive(false, fade ? 48 : 0);
  }

  applyControls(
    sound: SoundControlValues,
    modulation: ModulationControlValues,
    evolutionPhase: number,
    densityBias: number,
  ): void {
    if (!this.graph || !this.enginePreset || !this.synthState) {
      return;
    }

    const macros = macrosFromControls(sound, modulation, evolutionPhase, densityBias);
    const behavior = applyPresetMacroBehavior('botanical', this.profile, macros);

    applyJunoMold(clampMold(sound.mold));
    this.synthState = {
      ...this.synthState,
      filterHz: this.baseFilterHz * (0.85 + behavior.filterOpen * 0.25 + evolutionPhase * 0.05),
      delayMix: Math.min(0.65, (this.profile.effectsChain.delayWet ?? 0.32) + behavior.spaceDepth * 0.35),
      reverbDepth: Math.min(0.85, 0.45 + behavior.spaceDepth * 0.4),
    };
    syncJunoBotanical(this.graph, this.synthState, this.enginePreset);
    setJunoModeActive(true, this.synthState.volume * (0.5 + behavior.densityScale * 0.15));
    this.macroTexture = behavior.textureGain + behavior.shimmer * 0.2;
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

  createVoiceActor(kind: VoiceKind, _index: number): AmbientVoiceActor {
    if (!this.graph || !this.enginePreset || !this.synthState) {
      throw new Error('JunoTimbreSession not initialized');
    }
    return new JunoVoiceActor(kind, this.graph, this.enginePreset, this.synthState);
  }

  tickLiving(): void {
    /* per-voice */
  }

  getTextureAmount(): number {
    const t = this.profile.textureLayer;
    return Math.min(1, t.airLevel * 0.8 + t.organicBed * 0.5 + this.macroTexture * 0.4);
  }

  dispose(): void {
    setJunoModeActive(false);
    this.graph = null;
    this.enginePreset = null;
    this.synthState = null;
  }
}

export async function createJunoTimbreSession(
  preset: PlantasiaPreset,
  profile: TimbreProfile,
  gestureVocabulary: GestureVocabulary,
): Promise<JunoTimbreSession> {
  const session = new JunoTimbreSession(preset, profile, gestureVocabulary);
  await session.init();
  return session;
}
