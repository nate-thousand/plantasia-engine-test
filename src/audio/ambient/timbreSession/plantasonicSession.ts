import type { PlantasiaPreset } from 'plantasia-sound-engine';
import {
  applyPlantasonicMold,
  buildPlantasonicPerformanceState,
  createPlantasonicLiveVoice,
  ensurePlantasonicRuntime,
  releasePlantasonicVoice,
  setPlantasonicModeActive,
  setPlantasonicPerformance,
  syncPlantasonicGraph,
  tickPlantasonicLivingVoice,
  toPlantasonicEnginePreset,
  type PlantasonicGraph,
  type PlantasonicLiveVoice,
  type PlantasonicPerformanceState,
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
  drone: 0.32,
  pad: 0.22,
  bell: 0.14,
  pluck: 0.1,
  sub: 0.28,
  air: 0,
};

class PlantasonicVoiceActor implements AmbientVoiceActor {
  readonly kind: VoiceKind;
  private voices: PlantasonicLiveVoice[] = [];
  private readonly graph: PlantasonicGraph;
  private readonly enginePreset: ReturnType<typeof toPlantasonicEnginePreset>;
  private readonly performance: PlantasonicPerformanceState;

  constructor(
    kind: VoiceKind,
    graph: PlantasonicGraph,
    enginePreset: ReturnType<typeof toPlantasonicEnginePreset>,
    performance: PlantasonicPerformanceState,
  ) {
    this.kind = kind;
    this.graph = graph;
    this.enginePreset = enginePreset;
    this.performance = performance;
  }

  attack(note: string, time: number, velocity: number): void {
    this.release(time, 0.4);
    const freq = Tone.Frequency(note).toFrequency();
    const voice = createPlantasonicLiveVoice({
      audioCtx: this.graph.audioCtx,
      params: { freq, velocityScale: velocity * AMBIENT_VEL[this.kind] },
      preset: this.enginePreset,
      performance: this.performance,
      startTime: time,
      voiceId: `ambient-ps-${this.kind}-${note}-${Date.now()}`,
      graph: this.graph,
    });
    this.voices.push(voice);
  }

  attackRelease(note: string, duration: number, time: number, velocity: number): void {
    this.attack(note, time, velocity);
    const voice = this.voices[this.voices.length - 1];
    if (voice) {
      window.setTimeout(() => {
        releasePlantasonicVoice(voice, this.graph.audioCtx);
        this.voices = this.voices.filter((v) => v !== voice);
      }, duration * 1000);
    }
  }

  release(_time: number, _releaseSec = 0.6): void {
    for (const voice of this.voices) {
      releasePlantasonicVoice(voice, this.graph.audioCtx);
    }
    this.voices = [];
  }

  tick(): void {
    for (const voice of this.voices) {
      tickPlantasonicLivingVoice(voice, this.graph.audioCtx);
    }
  }

  dispose(): void {
    this.release(Tone.now(), 0);
  }
}

export class PlantasonicTimbreSession implements PresetTimbreSession {
  readonly preset: PlantasiaPreset;
  readonly profile: TimbreProfile;
  readonly gestureVocabulary: GestureVocabulary;
  private graph: PlantasonicGraph | null = null;
  private enginePreset: ReturnType<typeof toPlantasonicEnginePreset> | null = null;
  private performance: PlantasonicPerformanceState = buildPlantasonicPerformanceState();
  private macroTexture = 0.35;

  constructor(preset: PlantasiaPreset, profile: TimbreProfile, gestureVocabulary: GestureVocabulary) {
    this.preset = preset;
    this.profile = profile;
    this.gestureVocabulary = gestureVocabulary;
  }

  async init(): Promise<void> {
    this.graph = await ensurePlantasonicRuntime();
    this.enginePreset = toPlantasonicEnginePreset(this.preset);
    this.performance = buildPlantasonicPerformanceState();
    setPlantasonicPerformance({ growth: 0.35, expression: 0.25 });
    syncPlantasonicGraph(this.graph, this.enginePreset, this.performance);
    setPlantasonicModeActive(true, 48);
  }

  fadeIn(_now: number, _fadeSec: number): void {
    /* graph master handled by engine runtime */
  }

  fadeOut(fade: boolean, _releaseSec: number): void {
    setPlantasonicModeActive(false, fade ? 48 : 0);
  }

  applyControls(
    sound: SoundControlValues,
    modulation: ModulationControlValues,
    evolutionPhase: number,
    densityBias: number,
  ): void {
    if (!this.graph || !this.enginePreset) {
      return;
    }

    const macros = macrosFromControls(sound, modulation, evolutionPhase, densityBias);
    const behavior = applyPresetMacroBehavior('plantasonic', this.profile, macros);

    applyPlantasonicMold(clampMold(sound.mold));
    const growth = Math.min(1, behavior.densityScale + behavior.filterOpen * 0.25);
    const expression = Math.min(
      1,
      this.profile.performanceMacros.expressionAmbience +
        evolutionPhase * 0.15 +
        behavior.shimmer * 0.2,
    );
    setPlantasonicPerformance({ growth, expression });
    this.performance = { ...this.performance, growth, expression };
    syncPlantasonicGraph(this.graph, this.enginePreset, this.performance);
    this.macroTexture = behavior.textureGain;
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
    if (!this.graph || !this.enginePreset) {
      throw new Error('PlantasonicTimbreSession not initialized');
    }
    return new PlantasonicVoiceActor(kind, this.graph, this.enginePreset, this.performance);
  }

  tickLiving(): void {
    /* per-voice tick in actor */
  }

  getTextureAmount(): number {
    const t = this.profile.textureLayer;
    return Math.min(
      1,
      t.airLevel * 4 + t.filteredNoise * 6 + t.organicBed * 3 + this.macroTexture * 0.35,
    );
  }

  dispose(): void {
    setPlantasonicModeActive(false);
    this.graph = null;
    this.enginePreset = null;
  }
}

export async function createPlantasonicTimbreSession(
  preset: PlantasiaPreset,
  profile: TimbreProfile,
  gestureVocabulary: GestureVocabulary,
): Promise<PlantasonicTimbreSession> {
  const session = new PlantasonicTimbreSession(preset, profile, gestureVocabulary);
  await session.init();
  return session;
}
