/**
 * Milestone 13D — sustained generative ambient layer.
 * Starts on transport Play, fades on Stop. Preset-aware routing.
 */
import type { PlantasiaPreset } from 'plantasia-sound-engine';
import {
  buildJunoSynthState,
  buildPlantasonicPerformanceState,
  createJunoLiveVoice,
  createPlantasonicLiveVoice,
  ensureJunoRuntime,
  ensurePlantasonicRuntime,
  getPresetLiveRouting,
  releaseJunoVoice,
  releasePlantasonicVoice,
  setJunoModeActive,
  setPlantasonicModeActive,
  setPlantasonicPerformance,
  syncJunoBotanical,
  syncPlantasonicGraph,
  tickJunoLivingVoice,
  tickPlantasonicLivingVoice,
  toJunoEnginePreset,
  toPlantasonicEnginePreset,
  type JunoLiveVoice,
  type PlantasonicLiveVoice,
} from 'plantasia-sound-engine';
import * as Tone from 'tone';
import type { ModulationControlValues, SoundControlValues } from '../types/instrument';
import { getControlStore } from '../stores/controlStore';
import { soundSliderToParams } from './soundControls';
import { clampMold } from './moldSync';

const FADE_IN_SEC = 2.8;
const FADE_OUT_SEC = 4.5;
const AMBIENT_NOTES = ['C3', 'G3', 'B3', 'E4'] as const;

type AmbientMode = 'standard' | 'plantasonic' | 'botanical';

type StandardAmbientNodes = {
  synth: Tone.PolySynth;
  filter: Tone.Filter;
  delay: Tone.FeedbackDelay;
  reverb: Tone.Reverb;
  lfo: Tone.LFO;
  master: Tone.Volume;
  noise: Tone.Noise;
  noiseGain: Tone.Volume;
};

class AmbientSoundscape {
  private active = false;
  private mode: AmbientMode = 'standard';
  private standard: StandardAmbientNodes | null = null;
  private plantasonicVoices: PlantasonicLiveVoice[] = [];
  private junoVoices: JunoLiveVoice[] = [];
  private tickId: number | null = null;
  private presetId: string | null = null;

  isActive(): boolean {
    return this.active;
  }

  async start(preset: PlantasiaPreset): Promise<void> {
    if (this.active && this.presetId === preset.id) {
      return;
    }

    await this.stop(false);
    this.presetId = preset.id;
    this.active = true;

    const routing = getPresetLiveRouting(preset);
    if (routing === 'plantasonic') {
      this.mode = 'plantasonic';
      await this.startPlantasonic(preset);
    } else if (routing === 'botanical') {
      this.mode = 'botanical';
      await this.startJuno(preset);
    } else {
      this.mode = 'standard';
      await this.startStandard(preset);
    }

    this.startTick();
  }

  async stop(fade = true): Promise<void> {
    if (!this.active && !this.standard && this.plantasonicVoices.length === 0 && this.junoVoices.length === 0) {
      return;
    }

    this.active = false;
    this.stopTick();

    if (this.mode === 'plantasonic') {
      await this.fadePlantasonic(fade);
      setPlantasonicModeActive(false);
    } else if (this.mode === 'botanical') {
      await this.fadeJuno(fade);
      setJunoModeActive(false);
    } else {
      await this.fadeStandard(fade);
    }

    this.presetId = null;
  }

  applyControls(sound: SoundControlValues, modulation: ModulationControlValues): void {
    if (!this.active) {
      return;
    }

    if (this.mode === 'standard' && this.standard) {
      this.applyStandardControls(sound, modulation);
    }
  }

  private async startStandard(preset: PlantasiaPreset): Promise<void> {
    const settings = preset.synth;
    const filterHz = Math.max(settings.filterHz ?? 1200, 80);
    const filter = new Tone.Filter({
      frequency: filterHz,
      type: settings.filterType ?? 'lowpass',
      Q: settings.filterQ ?? 0.8,
    });
    const delay = new Tone.FeedbackDelay({
      delayTime: 0.38,
      feedback: Math.min(0.55, (settings.effects.echo ?? 0.25) + 0.12),
      wet: Math.min(0.45, (settings.effects.delay ?? 0.2) + 0.08),
    });
    const reverb = new Tone.Reverb({
      decay: 6 + (settings.effects.reverb ?? 0.35) * 8,
      wet: Math.min(0.72, (settings.effects.reverb ?? 0.4) + 0.18),
    });
    await reverb.generate();

    const master = new Tone.Volume(-22);
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: settings.oscillator === 'sawtooth' ? 'fatsawtooth' : 'sine' },
      envelope: {
        attack: Math.max(2.5, (settings.envelope.attack ?? 0.4) * 6),
        decay: 1.2,
        sustain: 0.72,
        release: Math.max(4, (settings.envelope.release ?? 1.5) * 2.5),
      },
    });

    const lfo = new Tone.LFO({
      frequency: 0.06 + (settings.drift ?? 0.2) * 0.12,
      min: filterHz * 0.65,
      max: Math.max(filterHz * 1.35, filterHz * 0.65 + 1e-4),
    });

    const noiseGain = new Tone.Volume(-36);
    const noise = new Tone.Noise({ type: 'pink' });
    noise.connect(noiseGain);
    noiseGain.connect(reverb);

    synth.connect(filter);
    filter.connect(delay);
    delay.connect(reverb);
    reverb.connect(master);
    master.toDestination();
    lfo.connect(filter.frequency);
    lfo.start();
    noise.start();

    this.standard = { synth, filter, delay, reverb, lfo, master, noise, noiseGain };

    const notes = pickAmbientNotes(preset);
    const now = Tone.now();
    master.volume.rampTo(-22, FADE_IN_SEC);
    notes.forEach((note, i) => {
      synth.triggerAttack(note, now + i * 0.35, 0.22 + (i % 2) * 0.06);
    });

    const store = getControlStore();
    this.applyStandardControls(store.sound, store.modulation);
  }

  private applyStandardControls(sound: SoundControlValues, modulation: ModulationControlValues): void {
    if (!this.standard) {
      return;
    }

    const params = soundSliderToParams(sound);
    const mold = clampMold(sound.mold);
    const drift = modulation.drift / 100;
    const space = sound.bloom / 100;
    const baseHz = params.filterHz * (0.9 + mold * 0.004);

    this.standard.lfo.min = baseHz * 0.65;
    this.standard.lfo.max = Math.max(baseHz * 1.35, baseHz * 0.65 + 1e-4);
    ramp(this.standard.filter.Q, params.filterQ + mold * 0.01);
    ramp(this.standard.delay.wet, Math.min(0.55, params.delayWet + space * 0.12));
    ramp(this.standard.reverb.wet, Math.min(0.78, params.reverbWet + space * 0.15));
    ramp(this.standard.lfo.frequency, 0.05 + drift * 0.18 + modulation.energy / 800);
    ramp(this.standard.noiseGain.volume, -38 + (sound.texture / 100) * 10);
  }

  private async fadeStandard(fade: boolean): Promise<void> {
    if (!this.standard) {
      return;
    }

    const { synth, master, noise, lfo, filter, delay, reverb, noiseGain } = this.standard;
    const releaseSec = fade ? FADE_OUT_SEC : 0.08;
    const now = Tone.now();

    if (fade) {
      master.volume.rampTo(-48, releaseSec);
      synth.triggerRelease(now + releaseSec * 0.85);
    } else {
      synth.releaseAll();
    }

    window.setTimeout(() => {
      synth.dispose();
      filter.dispose();
      delay.dispose();
      reverb.dispose();
      lfo.dispose();
      master.dispose();
      noise.stop();
      noise.dispose();
      noiseGain.dispose();
    }, releaseSec * 1000 + 120);

    this.standard = null;
  }

  private async startPlantasonic(preset: PlantasiaPreset): Promise<void> {
    const graph = await ensurePlantasonicRuntime();
    const enginePreset = toPlantasonicEnginePreset(preset);
    const performance = buildPlantasonicPerformanceState();
    setPlantasonicPerformance({ growth: 0.35, expression: 0.25 });
    syncPlantasonicGraph(graph, enginePreset, performance);
    setPlantasonicModeActive(true, 48);

    const audioCtx = graph.audioCtx;
    const startTime = audioCtx.currentTime;
    const notes = pickAmbientNotes(preset).slice(0, 3);

    this.plantasonicVoices = notes.map((note, i) => {
      const freq = Tone.Frequency(note).toFrequency();
      return createPlantasonicLiveVoice({
        audioCtx,
        params: { freq, velocityScale: 0.38 + i * 0.08 },
        preset: enginePreset,
        performance,
        startTime: startTime + i * 0.4,
        voiceId: `ambient-plantasonic-${note}-${Date.now()}`,
        graph,
      });
    });
  }

  private async fadePlantasonic(fade: boolean): Promise<void> {
    const graph = await ensurePlantasonicRuntime().catch(() => null);
    if (!graph) {
      this.plantasonicVoices = [];
      return;
    }

    for (const voice of this.plantasonicVoices) {
      releasePlantasonicVoice(voice, graph.audioCtx, !fade);
    }
    this.plantasonicVoices = [];
  }

  private async startJuno(preset: PlantasiaPreset): Promise<void> {
    const graph = await ensureJunoRuntime();
    const enginePreset = toJunoEnginePreset(preset);
    const synthState = buildJunoSynthState(preset);
    syncJunoBotanical(graph, synthState, enginePreset);
    setJunoModeActive(true, synthState.volume * 0.55);

    const audioCtx = graph.audioCtx;
    const startTime = audioCtx.currentTime;
    const notes = pickAmbientNotes(preset).slice(0, 3);

    this.junoVoices = notes.map((note, i) =>
      createJunoLiveVoice({
        audioCtx,
        params: {
          freq: Tone.Frequency(note).toFrequency(),
          waveform: enginePreset.sound.waveform,
          detuneCents: enginePreset.sound.detuneCents,
          filterFreq: synthState.filterHz * 0.92,
          filterType: synthState.filterType,
          velocityScale: 0.42 + i * 0.06,
        },
        preset: enginePreset,
        startTime: startTime + i * 0.45,
        voiceId: `ambient-juno-${note}-${Date.now()}`,
        synthState,
        graph,
      }),
    );
  }

  private async fadeJuno(fade: boolean): Promise<void> {
    const graph = await ensureJunoRuntime().catch(() => null);
    if (!graph) {
      this.junoVoices = [];
      return;
    }

    for (const voice of this.junoVoices) {
      releaseJunoVoice(voice, graph.audioCtx, !fade);
    }
    this.junoVoices = [];
  }

  private startTick(): void {
    if (this.tickId) {
      return;
    }

    this.tickId = window.setInterval(async () => {
      if (!this.active) {
        this.stopTick();
        return;
      }

      if (this.mode === 'plantasonic' && this.plantasonicVoices.length > 0) {
        const graph = await ensurePlantasonicRuntime().catch(() => null);
        if (graph) {
          for (const voice of this.plantasonicVoices) {
            tickPlantasonicLivingVoice(voice, graph.audioCtx);
          }
        }
      }

      if (this.mode === 'botanical' && this.junoVoices.length > 0) {
        const graph = await ensureJunoRuntime().catch(() => null);
        if (graph) {
          for (const voice of this.junoVoices) {
            tickJunoLivingVoice(voice, graph.audioCtx);
          }
        }
      }
    }, 32);
  }

  private stopTick(): void {
    if (this.tickId) {
      window.clearInterval(this.tickId);
      this.tickId = null;
    }
  }
}

function pickAmbientNotes(preset: PlantasiaPreset): string[] {
  const category = preset.category ?? '';
  if (category.includes('ambient') || preset.asciiState === 'mycelium') {
    return ['A2', 'E3', 'B3'];
  }
  if (category.includes('textures') || preset.asciiState === 'mutation') {
    return ['D3', 'A3', 'F4'];
  }
  if (preset.plantasonic != null) {
    return ['C3', 'G3', 'B3', 'D4'];
  }
  if (preset.botanical != null) {
    return ['E3', 'B3', 'G4'];
  }
  return [...AMBIENT_NOTES];
}

function ramp(
  param: { rampTo?: (v: number, t: number) => void; value?: unknown },
  value: number,
  time = 0.4,
): void {
  if (param && typeof param.rampTo === 'function') {
    param.rampTo(value, time);
  } else if (param && 'value' in param) {
    (param as { value: number }).value = value;
  }
}

export const ambientSoundscape = new AmbientSoundscape();
