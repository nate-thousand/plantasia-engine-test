import type { BotanicalControls } from 'plantasia-sound-engine';
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
  type JunoBotanicalGraph,
  type JunoEnginePreset,
  type JunoLiveVoice,
  type JunoSynthState,
} from './junoEngineBridge';
import { midiToNoteName } from '../input/noteMap';
import { soundSliderToParams } from './soundControls';

/** Linear ramps avoid Tone exponential wet/mix failures at or near zero. */
function rampParam(param: { linearRampTo: (value: number, rampTime: number) => void }, value: number, time = 0.05): void {
  param.linearRampTo(value, time);
}

function isJunoPreset(preset: PlantasiaPreset): boolean {
  return preset.botanical != null;
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
  private lfoConnected = false;
  private lastSound: SoundControlValues | null = null;

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
    this.lfo.start();
  }

  prepare(settings: SynthSettings): void {
    if (settings.filterType) {
      this.filter.type = settings.filterType;
    }

    this.synth.set({
      oscillator: buildOscillatorSettings(settings) as Tone.SynthOptions['oscillator'],
      envelope: {
        attack: settings.envelope.attack,
        release: settings.envelope.release,
      },
    });

    rampParam(this.delay.feedback, settings.effects.echo ?? 0.22, 0.2);

    if (settings.drift != null) {
      rampParam(this.lfo.frequency, 0.04 + settings.drift * 0.08, 0.2);
    }

    if (this.lastSound) {
      this.applySoundControls(this.lastSound);
    }
  }

  applySoundControls(sound: SoundControlValues): void {
    this.lastSound = sound;
    const params = soundSliderToParams(sound);

    rampParam(this.masterVolume.volume, params.outputDb);
    rampParam(this.filter.Q, params.filterQ);
    rampParam(this.filter.frequency, params.filterHz);
    rampParam(this.delay.wet, params.delayWet);
    rampParam(this.reverb.wet, params.reverbWet);
  }

  applyModulationControls(modulation: ModulationControlValues): void {
    const drift = modulation.drift / 100;

    if (drift > 0.08 && !this.lfoConnected) {
      this.lfo.connect(this.filter.frequency);
      this.lfoConnected = true;
    } else if (drift <= 0.08 && this.lfoConnected) {
      this.lfo.disconnect();
      this.lfoConnected = false;
    }

    if (this.lfoConnected) {
      rampParam(this.lfo.frequency, 0.05 + drift * 4, 0.15);
      const baseHz = this.lastSound
        ? soundSliderToParams(this.lastSound).filterHz
        : 1800;
      this.lfo.min = Math.max(400, baseHz * 0.55);
      this.lfo.max = Math.min(12000, baseHz * 1.35);
    }

    this.synth.set({
      envelope: {
        attack: 0.02 + (1 - modulation.growthRate / 100) * 0.6,
        release: 0.6 + (modulation.growthRate / 100) * 3,
      },
    });
  }

  noteOn(midi: number, velocity: number): void {
    if (this.heldNotes.has(midi)) {
      return;
    }

    const noteName = midiToNoteName(midi);
    const normalizedVelocity = Math.max(0.01, Math.min(1, velocity / 127));
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

  /** @deprecated Use applySoundControls + applyModulationControls */
  applyBotanicalControls(controls: BotanicalControls): void {
    this.applySoundControls({
      volume: controls.energy,
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
    setJunoModeActive(true, this.synthState.volume);
    stopAllJunoVoices(true);
    this.stopAll();

    if (this.lastSound) {
      this.applySoundControls(this.lastSound);
    }
  }

  applySoundControls(sound: SoundControlValues): void {
    this.lastSound = sound;

    if (!this.graph || !this.enginePreset || !this.synthState) {
      return;
    }

    const params = soundSliderToParams(sound);
    const t = this.graph.audioCtx.currentTime;

    this.synthState.filterHz = params.filterHz;
    this.synthState.filterQ = params.filterQ;
    this.synthState.delayMix = params.delayWet;
    this.synthState.reverbDepth = params.reverbWet;
    this.synthState.volume = sound.volume;

    this.enginePreset = {
      ...this.enginePreset,
      sound: {
        ...this.enginePreset.sound,
        filterFreq: params.filterHz,
        filterQ: params.filterQ,
      },
    };

    syncJunoBotanical(this.graph, this.synthState, this.enginePreset);
    setJunoModeActive(true, sound.volume);

    this.graph.liveFilter.frequency.setTargetAtTime(params.filterHz, t, 0.05);
    this.graph.liveFilter.Q.setTargetAtTime(params.filterQ, t, 0.05);
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
    const velocityScale = Math.max(0.01, velocity / 127);

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
      volume: controls.energy,
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

/** Preset-aware live input router for keyboard and MIDI. */
export class LiveVoiceRouter {
  private readonly standard = new StandardLiveVoice();
  private readonly juno = new JunoLiveVoiceRouter();
  private mode: 'standard' | 'juno' = 'standard';

  async preparePreset(preset: PlantasiaPreset): Promise<void> {
    this.mode = isJunoPreset(preset) ? 'juno' : 'standard';

    if (this.mode === 'juno') {
      this.standard.stopAll();
      await this.juno.prepare(preset);
      return;
    }

    this.juno.stopAll();
    setJunoModeActive(false);
    this.standard.prepare(preset.synth);
  }

  applySoundControls(sound: SoundControlValues): void {
    this.standard.applySoundControls(sound);
    this.juno.applySoundControls(sound);
  }

  applyModulationControls(modulation: ModulationControlValues): void {
    if (this.mode === 'juno') {
      this.juno.applyModulationControls(modulation);
      return;
    }

    this.standard.applyModulationControls(modulation);
  }

  noteOn(midi: number, velocity: number): void {
    if (this.mode === 'juno') {
      this.juno.noteOn(midi, velocity);
      return;
    }

    this.standard.noteOn(midi, velocity);
  }

  noteOff(midi: number): void {
    if (this.mode === 'juno') {
      this.juno.noteOff(midi);
      return;
    }

    this.standard.noteOff(midi);
  }

  stopAll(): void {
    this.standard.stopAll();
    this.juno.stopAll();
  }

  applyBotanicalControls(controls: BotanicalControls): void {
    if (this.mode === 'juno') {
      this.juno.applyBotanicalControls(controls);
      return;
    }

    this.standard.applyBotanicalControls(controls);
  }
}
