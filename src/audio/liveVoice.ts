import type { BotanicalControls } from 'plantasia-sound-engine';
import { getPresetLiveRouting, resolveMoldParameters } from 'plantasia-sound-engine';
import type { ModulationControlValues, SoundControlValues } from '../types/instrument';
import type { PlantasiaPreset, SynthSettings } from 'plantasia-sound-engine';
import * as Tone from 'tone';
import {
  buildJunoSynthState,
  createJunoLiveVoice,
  ensureJunoRuntime,
  releaseJunoVoice,
  setJunoModeActive,
  stopAllJunoVoices,
  syncJunoBotanical,
  tickJunoLivingVoice,
  toJunoEnginePreset,
  applyJunoMold,
  type JunoBotanicalGraph,
  type JunoEnginePreset,
  type JunoLiveVoice,
  type JunoSynthState,
} from './junoEngineBridge';
import {
  applyPlantasonicMold,
  buildPlantasonicPerformanceState,
  createPlantasonicLiveVoice,
  ensurePlantasonicRuntime,
  releasePlantasonicVoice,
  setPlantasonicModeActive,
  setPlantasonicPerformance,
  stopAllPlantasonicVoices,
  syncPlantasonicGraph,
  tickPlantasonicLivingVoice,
  toPlantasonicEnginePreset,
  type PlantasonicEnginePreset,
  type PlantasonicGraph,
  type PlantasonicLiveVoice,
  type PlantasonicPerformanceState,
} from './plantasonicEngineBridge';
import { midiToNoteName } from '../input/noteMap';
import { getMidiStore } from '../stores/midiStore';
import { soundSliderToParams, INTERNAL_MASTER_DB } from './soundControls';
import { velocityToGain } from './velocityCurve';
import { clampMold } from './moldSync';

/** Linear ramps avoid Tone exponential wet/mix failures at or near zero. */
function rampParam(
  param: { linearRampTo?: (value: number, rampTime: number) => void; value?: unknown },
  value: number,
  time = 0.05,
): void {
  if (param == null || typeof param !== 'object') {
    return;
  }

  if (typeof param.linearRampTo === 'function') {
    param.linearRampTo(value, time);
  } else if ('value' in param) {
    (param as { value: number }).value = value;
  }
}

function buildOscillatorSettings(settings: SynthSettings) {
  if (settings.detuneCents && settings.detuneCents.length > 1) {
    const spread = Math.max(...settings.detuneCents.map((cent) => Math.abs(cent)));
    const type = settings.oscillator === 'sawtooth' ? 'fatsawtooth' : settings.oscillator;
    return { type, spread, count: settings.detuneCents.length };
  }

  return { type: settings.oscillator };
}

/** Mirrors the engine standard preset graph for sustained keyboard/MIDI notes. */
class StandardLiveVoice {
  private readonly synth: Tone.PolySynth;
  private readonly filter: Tone.Filter;
  private readonly delay: Tone.FeedbackDelay;
  private readonly reverb: Tone.Reverb;
  private readonly masterVolume: Tone.Volume;
  private readonly lfo: Tone.LFO;
  private readonly heldNotes = new Set<number>();
  private lastSound: SoundControlValues | null = null;
  private baseEcho = 0.22;

  constructor() {
    this.filter = new Tone.Filter({ frequency: 1800, type: 'lowpass', Q: 1 });
    this.delay = new Tone.FeedbackDelay({ delayTime: 0.25, feedback: 0.3, wet: 0.2 });
    this.reverb = new Tone.Reverb({ decay: 3, wet: 0.4 });
    this.masterVolume = new Tone.Volume(-6);
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.2, decay: 0.2, sustain: 0.6, release: 1.5 },
    });
    this.lfo = new Tone.LFO({ frequency: 0.3, min: 800, max: 2400 });

    this.synth.connect(this.filter);
    this.filter.connect(this.delay);
    this.delay.connect(this.reverb);
    this.reverb.connect(this.masterVolume);
    this.masterVolume.toDestination();
    this.lfo.connect(this.filter.frequency);
    this.lfo.start();
  }

  prepare(settings: SynthSettings): void {
    if (settings.filterType) {
      this.filter.type = settings.filterType;
    }

    this.baseEcho = settings.effects.echo ?? 0.22;

    this.synth.set({
      oscillator: buildOscillatorSettings(settings) as Tone.SynthOptions['oscillator'],
      envelope: {
        attack: settings.envelope.attack,
        release: settings.envelope.release,
      },
    });

    rampParam(this.delay.feedback, this.baseEcho, 0.2);

    if (settings.drift != null) {
      rampParam(this.lfo.frequency, 0.04 + settings.drift * 0.08, 0.2);
    }

    if (this.lastSound) {
      this.applySoundControls(this.lastSound);
    }
  }

  applySoundControls(sound: SoundControlValues): void {
    this.lastSound = sound;
    const mold = clampMold(sound.mold);
    const params = soundSliderToParams(sound);
    const moldParams = resolveMoldParameters(mold);

    rampParam(this.masterVolume.volume, INTERNAL_MASTER_DB);
    rampParam(this.filter.Q, params.filterQ + moldParams.filterInstability * 0.8);
    this.lfo.min = Math.max(400, params.filterHz * 0.55);
    this.lfo.max = Math.min(12000, params.filterHz * 1.35);
    rampParam(this.delay.wet, params.delayWet);
    rampParam(this.reverb.wet, params.reverbWet);
    rampParam(
      this.delay.feedback,
      Math.min(0.88, this.baseEcho + moldParams.delayFeedbackBoost),
    );
    rampParam(this.lfo.frequency, 0.05 + moldParams.modulationDepth * 5);
  }

  /** Apply engine Mold macro to the standard live voice graph. */
  syncMold(mold: number): void {
    if (this.lastSound) {
      this.applySoundControls({ ...this.lastSound, mold });
      return;
    }

    this.applySoundControls({
      mold,
      tone: 50,
      texture: 40,
      bloom: 35,
    });
  }

  applyModulationControls(modulation: ModulationControlValues): void {
    const drift = modulation.drift / 100;
    const energyNorm = modulation.energy / 100;
    const mutationNorm = modulation.mutation / 100;

    rampParam(this.lfo.frequency, 0.05 + drift * 4, 0.15);
    const baseHz = this.lastSound
      ? soundSliderToParams(this.lastSound).filterHz
      : 1800;
    const pitchSpread = mutationNorm * 400;
    this.lfo.min = Math.max(400, baseHz * 0.55 - pitchSpread);
    this.lfo.max = Math.min(12000, baseHz * 1.35 + pitchSpread);

    this.synth.set({
      envelope: {
        attack: 0.02 + (1 - modulation.growthRate / 100) * 0.6,
        release: 0.6 + (modulation.growthRate / 100) * 3,
        sustain: 0.35 + energyNorm * 0.55,
      },
    });
  }

  noteOn(midi: number, velocity: number): void {
    if (this.heldNotes.has(midi)) {
      return;
    }

    const noteName = midiToNoteName(midi);
    const curve = getMidiStore().velocityCurve;
    const normalizedVelocity = velocityToGain(velocity, curve);
    this.synth.triggerAttack(noteName, undefined, normalizedVelocity);
    this.heldNotes.add(midi);
  }

  noteOff(midi: number): void {
    if (!this.heldNotes.has(midi)) {
      return;
    }

    this.synth.triggerRelease(midiToNoteName(midi));
    this.heldNotes.delete(midi);
  }

  stopAll(): void {
    this.synth.releaseAll();
    this.heldNotes.clear();
  }

  applyPitchBend(normalized: number, rangeSemitones: number): void {
    const cents = normalized * rangeSemitones * 100;
    this.synth.set({ detune: cents });
  }

  applyChannelPressure(pressure: number): void {
    const norm = pressure / 127;
    rampParam(this.masterVolume.volume, INTERNAL_MASTER_DB - 8 + norm * 8, 0.05);
  }

  applyBotanicalControls(controls: BotanicalControls): void {
    this.applySoundControls({
      mold: controls.mold,
      tone: controls.resonance,
      texture: controls.texture,
      bloom: controls.space,
    });
    this.applyModulationControls({
      growthRate: controls.growth,
      drift: controls.life,
      mutation: controls.evolution,
      energy: controls.density,
    });
  }
}

/** Routes keyboard/MIDI through the Juno botanical graph for Juno presets. */
class JunoLiveVoiceRouter {
  private graph: JunoBotanicalGraph | null = null;
  private synthState: JunoSynthState | null = null;
  private enginePreset: JunoEnginePreset | null = null;
  private readonly voices = new Map<number, JunoLiveVoice>();
  private tickId: number | null = null;
  private lastSound: SoundControlValues | null = null;

  async prepare(preset: PlantasiaPreset): Promise<void> {
    this.graph = await ensureJunoRuntime();
    this.enginePreset = toJunoEnginePreset(preset);
    this.synthState = buildJunoSynthState(preset);
    syncJunoBotanical(this.graph, this.synthState, this.enginePreset);
    setJunoModeActive(true);
    stopAllJunoVoices(true);
    this.stopAll();

    if (this.lastSound) {
      this.applySoundControls(this.lastSound);
    }
  }

  applySoundControls(sound: SoundControlValues): void {
    this.lastSound = sound;
    applyJunoMold(clampMold(sound.mold));

    if (!this.graph || !this.enginePreset || !this.synthState) {
      return;
    }

    const params = soundSliderToParams(sound);
    const t = this.graph.audioCtx.currentTime;

    this.synthState.filterHz = params.filterHz;
    this.synthState.filterQ = params.filterQ;
    this.synthState.delayMix = params.delayWet;
    this.synthState.reverbDepth = params.reverbWet;

    this.enginePreset = {
      ...this.enginePreset,
      sound: {
        ...this.enginePreset.sound,
        filterFreq: params.filterHz,
        filterQ: params.filterQ,
      },
    };

    syncJunoBotanical(this.graph, this.synthState, this.enginePreset);
    setJunoModeActive(true);

    const liveFilter = this.graph.liveFilter;
    if (liveFilter?.frequency) {
      liveFilter.frequency.setTargetAtTime(params.filterHz, t, 0.05);
    }
    if (liveFilter?.Q) {
      liveFilter.Q.setTargetAtTime(params.filterQ, t, 0.05);
    }
  }

  syncMold(mold: number): void {
    applyJunoMold(clampMold(mold));
  }

  applyModulationControls(modulation: ModulationControlValues): void {
    if (!this.graph || !this.enginePreset || !this.synthState) {
      return;
    }

    this.synthState.lfoRate = 0.05 + (modulation.drift / 100) * 4;
    syncJunoBotanical(this.graph, this.synthState, this.enginePreset);
  }

  noteOn(midi: number, velocity: number): void {
    if (!this.graph || !this.enginePreset || !this.synthState || this.voices.has(midi)) {
      return;
    }

    const noteName = midiToNoteName(midi);
    const freq = Tone.Frequency(noteName).toFrequency();
    const audioCtx = this.graph.audioCtx;
    const startTime = audioCtx.currentTime;
    const velocityScale = velocityToGain(velocity, getMidiStore().velocityCurve);

    const voice = createJunoLiveVoice({
      audioCtx,
      params: {
        freq,
        waveform: this.enginePreset.sound.waveform,
        detuneCents: this.enginePreset.sound.detuneCents,
        filterFreq: this.synthState.filterHz,
        filterType: this.synthState.filterType,
        velocityScale,
      },
      preset: this.enginePreset,
      startTime,
      voiceId: `live-${midi}-${Date.now()}`,
      synthState: this.synthState,
      graph: this.graph,
    });

    this.voices.set(midi, voice);
    this.startTick();
  }

  noteOff(midi: number): void {
    const voice = this.voices.get(midi);
    if (!voice || !this.graph) {
      return;
    }

    releaseJunoVoice(voice, this.graph.audioCtx);
    this.voices.delete(midi);
  }

  stopAll(): void {
    if (this.graph) {
      for (const voice of this.voices.values()) {
        releaseJunoVoice(voice, this.graph.audioCtx, true);
      }
    }

    this.voices.clear();
    this.stopTick();
  }

  private startTick(): void {
    if (this.tickId) {
      return;
    }

    this.tickId = window.setInterval(() => {
      if (!this.graph || this.voices.size === 0) {
        this.stopTick();
        return;
      }

      for (const voice of this.voices.values()) {
        tickJunoLivingVoice(voice, this.graph.audioCtx);
      }
    }, 16);
  }

  private stopTick(): void {
    if (this.tickId) {
      window.clearInterval(this.tickId);
      this.tickId = null;
    }
  }

  applyBotanicalControls(controls: BotanicalControls): void {
    this.applySoundControls({
      mold: controls.mold,
      tone: controls.resonance,
      texture: controls.texture,
      bloom: controls.space,
    });
    this.applyModulationControls({
      growthRate: controls.growth,
      drift: controls.life,
      mutation: controls.evolution,
      energy: controls.density,
    });
  }
}

/** Routes keyboard/MIDI through the Plantasonic flagship graph. */
class PlantasonicLiveVoiceRouter {
  private graph: PlantasonicGraph | null = null;
  private enginePreset: PlantasonicEnginePreset | null = null;
  private performance: PlantasonicPerformanceState = buildPlantasonicPerformanceState();
  private readonly voices = new Map<number, PlantasonicLiveVoice>();
  private tickId: number | null = null;
  private lastSound: SoundControlValues | null = null;

  async prepare(preset: PlantasiaPreset): Promise<void> {
    this.graph = await ensurePlantasonicRuntime();
    this.enginePreset = toPlantasonicEnginePreset(preset);
    this.performance = buildPlantasonicPerformanceState();
    syncPlantasonicGraph(this.graph, this.enginePreset, this.performance);
    setPlantasonicModeActive(true);
    stopAllPlantasonicVoices(true);
    this.stopAll();

    if (this.lastSound) {
      this.applySoundControls(this.lastSound);
    }
  }

  applySoundControls(sound: SoundControlValues): void {
    this.lastSound = sound;
    applyPlantasonicMold(clampMold(sound.mold));

    if (!this.graph || !this.enginePreset) {
      return;
    }

    syncPlantasonicGraph(this.graph, this.enginePreset, this.performance);
  }

  syncMold(mold: number): void {
    applyPlantasonicMold(clampMold(mold));
  }

  applyModulationControls(modulation: ModulationControlValues): void {
    const growth = modulation.energy / 100;
    setPlantasonicPerformance({ growth });
    this.performance = { ...this.performance, growth };

    if (this.graph && this.enginePreset) {
      syncPlantasonicGraph(this.graph, this.enginePreset, this.performance);
    }
  }

  noteOn(midi: number, velocity: number): void {
    if (!this.graph || !this.enginePreset || this.voices.has(midi)) {
      return;
    }

    const noteName = midiToNoteName(midi);
    const freq = Tone.Frequency(noteName).toFrequency();
    const audioCtx = this.graph.audioCtx;
    const startTime = audioCtx.currentTime;
    const velocityScale = velocityToGain(velocity, getMidiStore().velocityCurve);

    const voice = createPlantasonicLiveVoice({
      audioCtx,
      params: { freq, velocityScale },
      preset: this.enginePreset,
      performance: this.performance,
      startTime,
      voiceId: `plantasonic-live-${midi}-${Date.now()}`,
      graph: this.graph,
    });

    this.voices.set(midi, voice);
    this.startTick();
  }

  noteOff(midi: number): void {
    const voice = this.voices.get(midi);
    if (!voice || !this.graph) {
      return;
    }

    releasePlantasonicVoice(voice, this.graph.audioCtx);
    this.voices.delete(midi);
  }

  stopAll(): void {
    if (this.graph) {
      for (const voice of this.voices.values()) {
        releasePlantasonicVoice(voice, this.graph.audioCtx, true);
      }
    }

    this.voices.clear();
    this.stopTick();
  }

  private startTick(): void {
    if (this.tickId) {
      return;
    }

    this.tickId = window.setInterval(() => {
      if (!this.graph || this.voices.size === 0) {
        this.stopTick();
        return;
      }

      for (const voice of this.voices.values()) {
        tickPlantasonicLivingVoice(voice, this.graph.audioCtx);
      }
    }, 16);
  }

  private stopTick(): void {
    if (this.tickId) {
      window.clearInterval(this.tickId);
      this.tickId = null;
    }
  }

  applyBotanicalControls(controls: BotanicalControls): void {
    this.applySoundControls({
      mold: controls.mold,
      tone: controls.resonance,
      texture: controls.texture,
      bloom: controls.space,
    });
    this.applyModulationControls({
      growthRate: controls.growth,
      drift: controls.life,
      mutation: controls.evolution,
      energy: controls.density,
    });
  }
}

type LiveVoiceMode = 'standard' | 'juno' | 'plantasonic';

/** Preset-aware live input router for keyboard and MIDI. */
export class LiveVoiceRouter {
  private readonly standard = new StandardLiveVoice();
  private readonly juno = new JunoLiveVoiceRouter();
  private readonly plantasonic = new PlantasonicLiveVoiceRouter();
  private mode: LiveVoiceMode = 'standard';

  async preparePreset(preset: PlantasiaPreset): Promise<void> {
    const routing = getPresetLiveRouting(preset);

    if (routing === 'plantasonic') {
      this.mode = 'plantasonic';
      this.standard.stopAll();
      this.juno.stopAll();
      setJunoModeActive(false);
      await this.plantasonic.prepare(preset);
      return;
    }

    if (routing === 'botanical') {
      this.mode = 'juno';
      this.standard.stopAll();
      this.plantasonic.stopAll();
      setPlantasonicModeActive(false);
      await this.juno.prepare(preset);
      return;
    }

    this.mode = 'standard';
    this.juno.stopAll();
    this.plantasonic.stopAll();
    setJunoModeActive(false);
    setPlantasonicModeActive(false);
    this.standard.prepare(preset.synth);
  }

  applySoundControls(sound: SoundControlValues): void {
    if (this.mode === 'plantasonic') {
      this.plantasonic.applySoundControls(sound);
      return;
    }

    if (this.mode === 'juno') {
      this.juno.applySoundControls(sound);
      return;
    }

    this.standard.applySoundControls(sound);
  }

  /** Push Mold macro to the active live voice router (uses engine mold profile). */
  syncMold(mold: number): void {
    const clamped = clampMold(mold);

    if (this.mode === 'plantasonic') {
      this.plantasonic.syncMold(clamped);
      return;
    }

    if (this.mode === 'juno') {
      this.juno.syncMold(clamped);
      return;
    }

    this.standard.syncMold(clamped);
  }

  applyModulationControls(modulation: ModulationControlValues): void {
    if (this.mode === 'plantasonic') {
      this.plantasonic.applyModulationControls(modulation);
      return;
    }

    if (this.mode === 'juno') {
      this.juno.applyModulationControls(modulation);
      return;
    }

    this.standard.applyModulationControls(modulation);
  }

  noteOn(midi: number, velocity: number): void {
    if (this.mode === 'plantasonic') {
      this.plantasonic.noteOn(midi, velocity);
      return;
    }

    if (this.mode === 'juno') {
      this.juno.noteOn(midi, velocity);
      return;
    }

    this.standard.noteOn(midi, velocity);
  }

  noteOff(midi: number): void {
    if (this.mode === 'plantasonic') {
      this.plantasonic.noteOff(midi);
      return;
    }

    if (this.mode === 'juno') {
      this.juno.noteOff(midi);
      return;
    }

    this.standard.noteOff(midi);
  }

  stopAll(): void {
    this.standard.stopAll();
    this.juno.stopAll();
    this.plantasonic.stopAll();
  }

  applyPitchBend(normalized: number): void {
    const range = getMidiStore().pitchBendRange;
    if (this.mode === 'standard') {
      this.standard.applyPitchBend(normalized, range);
    }
  }

  applyChannelPressure(pressure: number): void {
    if (this.mode === 'standard') {
      this.standard.applyChannelPressure(pressure);
    }
  }

  applyBotanicalControls(controls: BotanicalControls): void {
    if (this.mode === 'plantasonic') {
      this.plantasonic.applyBotanicalControls(controls);
      return;
    }

    if (this.mode === 'juno') {
      this.juno.applyBotanicalControls(controls);
      return;
    }

    this.standard.applyBotanicalControls(controls);
  }
}
