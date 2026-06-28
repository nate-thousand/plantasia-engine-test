import { AsciiRenderer, computeGridDimensions, type GridDimensions } from './AsciiRenderer';
import {
  applyAudioFeedback,
  audioParticleRate,
  noteAudioIntensity,
} from './AudioFeedback';
import { createNoteSpawnEvent } from './NoteEvents';
import { ParticleSystem } from './ParticleSystem';
import {
  themeMidiEffectChar,
  themeMidiParticleCount,
  themePitchSpread,
  type MidiVisualEffectKind,
} from './ThemeMidiEffects';
import {
  buildSliderVizState,
  detectSliderChanges,
  sliderAmbientParticleRate,
  sliderBassStrength,
  sliderChangeBurstCount,
  sliderSceneIntensity,
  sliderSpectrumGain,
  sliderWindDepth,
  type SliderKey,
  type SliderVizState,
} from './SliderVisualEffects';
import {
  drawPlantSegments,
  isPlantVisible,
  releasePlant,
  resetPlantGenerator,
  spawnPlant,
  updatePlant,
} from './PlantGenerator';
import { resolvePresetTheme } from './PresetThemes';
import { buildSoundVizParams } from './SoundMapping';
import { ThemeTransition } from './ThemeTransition';
import { FEEDBACK_GAIN } from './VisualFeedback';
import type {
  PlantInstance,
  PresetTheme,
  SoundVizParams,
  VizAccessibility,
  VizInputSnapshot,
} from './types';

export type AsciiEngineOptions = {
  initialDimensions: GridDimensions;
  accessibility: VizAccessibility;
};

/**
 * Real-time procedural ASCII visualization engine.
 * Each preset drives a unique ASCII ecosystem via PresetVisualThemes.
 */
export class AsciiEngine {
  private renderer: AsciiRenderer;
  private particles: ParticleSystem;
  private plants = new Map<number, PlantInstance>();
  private themeTransition: ThemeTransition;
  private sound: SoundVizParams;
  private accessibility: VizAccessibility;
  private elapsed = 0;
  private dormant = true;
  private lastPeak = 0;
  private lastMidiEffectTick = 0;
  private lastPresetId = '';
  private prevSliders: SliderVizState | null = null;
  private lastActiveMidis = new Set<number>();
  private lastHighlightTick = 0;
  private lastModWheel = 64;
  private lastChannelPressure = 0;
  private titlePulse = 0;

  constructor(options: AsciiEngineOptions) {
    this.renderer = new AsciiRenderer(options.initialDimensions);
    this.particles = new ParticleSystem(Math.round(120 + options.accessibility.density * 2.5 * FEEDBACK_GAIN));
    this.accessibility = options.accessibility;
    const initialTheme = resolvePresetTheme('seed', 'Seed');
    this.themeTransition = new ThemeTransition(initialTheme);
    this.sound = buildSoundVizParams(
      { volume: 72, tone: 50, texture: 40, bloom: 35 },
      { growthRate: 45, drift: 30, mutation: 20, energy: 55 },
      'seed',
      initialTheme,
    );
  }

  get theme(): PresetTheme {
    return this.themeTransition.activeTheme;
  }

  resize(containerWidth: number, containerHeight: number, charWidth: number, charHeight: number): void {
    const dimensions = computeGridDimensions(containerWidth, containerHeight, charWidth, charHeight);
    this.renderer = new AsciiRenderer(dimensions);
  }

  setAccessibility(accessibility: VizAccessibility): void {
    this.accessibility = accessibility;
    this.particles = new ParticleSystem(Math.round(120 + accessibility.density * 2.5 * FEEDBACK_GAIN));
  }

  get dimensions(): GridDimensions {
    return { width: this.renderer.width, height: this.renderer.height };
  }

  tick(snapshot: VizInputSnapshot, deltaMs: number): string {
    const dt = this.accessibility.reduceMotion
      ? Math.min(deltaMs / 1000, 1 / 30) * (this.accessibility.animationSpeed / 100)
      : Math.min(deltaMs / 1000, 1 / 30) * (this.accessibility.animationSpeed / 50);

    this.elapsed += dt;
    this.dormant = !snapshot.audioReady;

    const themeChanged = this.themeTransition.setTarget(snapshot.presetId, snapshot.presetName);
    this.themeTransition.advance(dt);

    if (snapshot.presetId !== this.lastPresetId) {
      this.plants.clear();
      this.particles.clear();
      resetPlantGenerator();
      this.lastPresetId = snapshot.presetId;
    } else if (themeChanged && this.themeTransition.shouldHardReset()) {
      this.plants.clear();
      this.particles.clear();
      resetPlantGenerator();
    }

    const theme = this.theme;
    const baseSound = buildSoundVizParams(
      snapshot.sound,
      snapshot.modulation,
      snapshot.presetId,
      theme,
    );
    this.sound = applyAudioFeedback(baseSound, snapshot.audio);

    this.syncPlants(snapshot, theme);
    this.applyInteractionFeedback(snapshot, theme);
    this.applySliderChangeBursts(snapshot, theme);
    this.updateSimulation(dt, snapshot, theme);
    this.applyMidiVisualEffects(snapshot, theme);
    return this.renderFrame(snapshot, theme);
  }

  reset(): void {
    this.plants.clear();
    this.particles.clear();
    resetPlantGenerator();
    this.elapsed = 0;
    this.lastPeak = 0;
    this.prevSliders = null;
    this.lastActiveMidis.clear();
    this.lastHighlightTick = 0;
    this.titlePulse = 0;
  }

  private applyInteractionFeedback(snapshot: VizInputSnapshot, theme: PresetTheme): void {
    const { width, height } = this.renderer;
    const cx = Math.round(width / 2);
    const cy = Math.round(height / 2);
    const activeMidis = new Set(snapshot.activeNotes.map((n) => n.midi));

    for (const note of snapshot.activeNotes) {
      if (!this.lastActiveMidis.has(note.midi)) {
        const plant = this.plants.get(note.midi);
        const x = plant?.x ?? Math.round((note.midi - 36) / 88 * width);
        const y = plant?.y ?? Math.round(height * 0.6);
        const burst = Math.round((3 + note.velocity / 12) * FEEDBACK_GAIN);
        this.particles.spawnSpores(x, y, burst, theme, note.velocity);
        this.particles.spawnEchoSeeds(x, y, this.sound.delayWet * 1.5, theme);
        this.titlePulse = Math.max(this.titlePulse, Math.round(note.velocity * 0.6));
      }
    }

    this.lastActiveMidis = activeMidis;

    if (snapshot.controlHighlightTick > this.lastHighlightTick) {
      this.lastHighlightTick = snapshot.controlHighlightTick;
      const burst = Math.round(8 * FEEDBACK_GAIN);
      this.particles.spawnSpores(cx, cy, burst, theme, 100);
      this.particles.spawnReverbSpores(width, height, 0.5, theme);
      this.titlePulse = Math.max(this.titlePulse, 90);
    }

    const modDelta = Math.abs(snapshot.modWheel - this.lastModWheel);
    if (modDelta >= 2) {
      this.particles.spawnWindParticles(width, height, this.sound, theme);
      this.particles.spawnSpores(
        cx,
        cy,
        Math.round((modDelta / 8) * FEEDBACK_GAIN),
        theme,
        snapshot.modWheel,
      );
      this.titlePulse = Math.max(this.titlePulse, Math.round(modDelta * 0.5));
      this.lastModWheel = snapshot.modWheel;
    }

    const pressureDelta = snapshot.channelPressure - this.lastChannelPressure;
    if (pressureDelta >= 4) {
      this.particles.spawnSpores(
        cx,
        cy,
        Math.round((pressureDelta / 6) * FEEDBACK_GAIN),
        theme,
        snapshot.channelPressure,
      );
      this.titlePulse = Math.max(this.titlePulse, snapshot.channelPressure);
      this.lastChannelPressure = snapshot.channelPressure;
    } else if (snapshot.channelPressure < this.lastChannelPressure) {
      this.lastChannelPressure = snapshot.channelPressure;
    }

    if (this.titlePulse > 0) {
      this.titlePulse = Math.max(0, this.titlePulse - 3);
    }
  }

  private applyMidiVisualEffects(snapshot: VizInputSnapshot, theme: PresetTheme): void {
    if (snapshot.midiEffectTick === 0 || snapshot.midiEffectTick === this.lastMidiEffectTick) {
      return;
    }

    this.lastMidiEffectTick = snapshot.midiEffectTick;
    const kind = (snapshot.midiEffectKind ?? 'padHit') as MidiVisualEffectKind;
    const intensity = snapshot.midiEffectIntensity;
    const { width, height } = this.renderer;
    const cx = Math.round(width / 2);
    const cy = Math.round(height / 2);

    const count = themeMidiParticleCount(theme, kind, intensity);

    switch (kind) {
      case 'pitchBend': {
        const spread = themePitchSpread(theme, snapshot.pitchBend);
        this.particles.spawnSpores(
          cx + Math.round(spread * width),
          cy,
          count,
          theme,
          intensity,
        );
        break;
      }
      case 'presetChange':
        this.particles.spawnSpores(cx, cy, count, theme, intensity);
        this.particles.spawnReverbSpores(width, height, 0.6, theme);
        break;
      case 'knobTwist':
        for (const plant of this.plants.values()) {
          this.particles.spawnSpores(plant.x, plant.y, Math.max(1, Math.round(count / 2)), theme, intensity);
        }
        if (this.plants.size === 0) {
          this.particles.spawnSpores(cx, cy, count, theme, intensity);
        }
        break;
      default:
        this.particles.spawnSpores(cx, cy, count, theme, intensity);
        if (kind === 'reverbBurst' || kind === 'chorusBurst') {
          this.particles.spawnReverbSpores(width, height, intensity / 127, theme);
        }
    }

    if (intensity > 20) {
      const accent = themeMidiEffectChar(theme, kind, snapshot.midiEffectTick);
      this.renderer.setChar(cx, cy, accent, 8);
      const ring = Math.round((intensity / 127) * 4 * FEEDBACK_GAIN);
      for (let i = -ring; i <= ring; i += 1) {
        this.renderer.setChar(cx + i, cy, accent, 7);
        this.renderer.setChar(cx, cy + i, accent, 7);
      }
    }
  }

  private applySliderChangeBursts(snapshot: VizInputSnapshot, theme: PresetTheme): void {
    const sliders = buildSliderVizState(snapshot.sound, snapshot.modulation);
    const changes = detectSliderChanges(this.prevSliders, sliders);
    this.prevSliders = sliders;

    if (changes.length === 0) {
      return;
    }

    const { width, height } = this.renderer;
    const cx = Math.round(width / 2);
    const cy = Math.round(height / 2);

    for (const change of changes) {
      const count = sliderChangeBurstCount(change.key, change.value, change.delta);
      this.particles.spawnSpores(cx, cy, count, theme, Math.round(change.value * 127));
      this.spawnSliderKeyedParticles(change.key, change.value, width, height, theme);
    }
  }

  private spawnSliderKeyedParticles(
    key: SliderKey,
    value: number,
    width: number,
    height: number,
    theme: PresetTheme,
  ): void {
    const intensity = Math.round(value * 127);
    const cx = Math.round(width / 2);
    const cy = Math.round(height / 2);
    const ground = height - 2;

    switch (key) {
      case 'volume':
        this.particles.spawnSpores(cx, ground, Math.round((2 + value * 6) * FEEDBACK_GAIN), theme, intensity);
        break;
      case 'tone':
        this.particles.spawnSpores(cx, 2, Math.round((2 + value * 5) * FEEDBACK_GAIN), theme, intensity);
        break;
      case 'texture':
        this.particles.spawnSpores(Math.round(width * 0.25), cy, Math.round((2 + value * 4) * FEEDBACK_GAIN), theme, intensity);
        this.particles.spawnSpores(Math.round(width * 0.75), cy, Math.round((2 + value * 4) * FEEDBACK_GAIN), theme, intensity);
        break;
      case 'bloom':
        this.particles.spawnReverbSpores(width, height, value * 0.8 * FEEDBACK_GAIN, theme);
        break;
      case 'growthRate':
        this.particles.spawnEchoSeeds(cx, ground, value * 0.7 * FEEDBACK_GAIN, theme);
        break;
      case 'drift':
        for (let i = 0; i < FEEDBACK_GAIN; i += 1) {
          this.particles.spawnWindParticles(width, height, this.sound, theme);
        }
        break;
      case 'mutation':
        this.particles.spawnDistortionArtifacts(cx, cy, { ...this.sound, distortion: value }, theme);
        this.particles.spawnDistortionArtifacts(cx, cy, { ...this.sound, distortion: value }, theme);
        break;
      case 'energy':
        this.particles.spawnSpores(cx, cy, Math.round((3 + value * 10) * FEEDBACK_GAIN), theme, intensity);
        break;
      default:
        break;
    }
  }

  private syncPlants(snapshot: VizInputSnapshot, theme: PresetTheme): void {
    const activeMidis = new Set(snapshot.activeNotes.map((note) => note.midi));
    const { audio } = snapshot;
    const particleRate = audioParticleRate(audio);

    for (const note of snapshot.activeNotes) {
      if (!this.plants.has(note.midi)) {
        const event = createNoteSpawnEvent(note.midi, note.velocity, 'midi');
        const plant = spawnPlant(
          {
            ...event,
            pan: event.pan + snapshot.pitchBend * 0.5,
          },
          theme,
          this.sound,
          this.renderer.width,
          this.renderer.height,
        );
        plant.brightness = noteAudioIntensity(note.velocity, audio);
        this.plants.set(note.midi, plant);

        const sporeCount = Math.round(
          (2 + note.velocity / 12) * particleRate * (0.5 + theme.rhythm) * FEEDBACK_GAIN,
        );
        this.particles.spawnSpores(plant.x, plant.y, sporeCount, theme, note.velocity);
        this.particles.spawnEchoSeeds(plant.x, plant.y, this.sound.delayWet, theme);
      } else {
        const plant = this.plants.get(note.midi);
        if (plant) {
          plant.brightness = noteAudioIntensity(note.velocity, audio);
        }
      }
    }

    for (const [midi, plant] of this.plants) {
      if (!activeMidis.has(midi) && plant.phase !== 'releasing' && plant.phase !== 'faded') {
        releasePlant(plant);
        const leafCount = Math.round((2 + this.sound.release) * (1 + audio.amplitude * 3) * FEEDBACK_GAIN);
        this.particles.spawnFallingLeaves(plant.x, plant.y, leafCount, theme);
        this.particles.spawnSpores(
          plant.x,
          plant.y,
          Math.round(this.sound.reverbWet * 8 * particleRate * FEEDBACK_GAIN),
          theme,
          80,
        );
      }
    }
  }

  private updateSimulation(dt: number, snapshot: VizInputSnapshot, theme: PresetTheme): void {
    const { width, height } = this.renderer;
    const { audio } = snapshot;
    const particleRate = audioParticleRate(audio);

    for (const plant of this.plants.values()) {
      const growthBoost = 1 + audio.amplitude * 2.5 * FEEDBACK_GAIN + audio.peak * FEEDBACK_GAIN;
      updatePlant(
        plant,
        dt * growthBoost,
        this.sound,
        theme,
        width,
        height,
        this.accessibility.reduceMotion,
      );
      plant.brightness = Math.min(
        1,
        plant.brightness * 0.85 + noteAudioIntensity(plant.velocity, audio) * 0.15,
      );

      if (this.sound.distortion > 0.2) {
        this.particles.spawnDistortionArtifacts(plant.x, plant.y, this.sound, theme);
      }
    }

    for (const [midi, plant] of this.plants) {
      if (!isPlantVisible(plant)) {
        this.plants.delete(midi);
      }
    }

    if (!this.dormant) {
      const sliders = buildSliderVizState(snapshot.sound, snapshot.modulation);
      const ambientRate = sliderAmbientParticleRate(sliders);

      if (Math.random() < 0.25 * particleRate * theme.density * ambientRate * FEEDBACK_GAIN) {
        this.particles.spawnWindParticles(width, height, this.sound, theme);
      }
      if (Math.random() < this.sound.reverbWet * particleRate * 0.5 * (0.5 + sliders.bloom) * FEEDBACK_GAIN) {
        this.particles.spawnReverbSpores(width, height, this.sound.reverbWet, theme);
      }

      if (Math.random() < sliders.energy * 0.08 * ambientRate * FEEDBACK_GAIN) {
        this.particles.spawnSpores(
          Math.round(width / 2),
          Math.round(height / 2),
          Math.round((1 + sliders.energy * 4) * FEEDBACK_GAIN),
          theme,
          Math.round(sliders.energy * 127),
        );
      }

      if (Math.random() < sliders.texture * 0.06 * FEEDBACK_GAIN) {
        this.particles.spawnSpores(
          Math.round(Math.random() * width),
          Math.round(Math.random() * height),
          Math.round(2 * FEEDBACK_GAIN),
          theme,
          Math.round(sliders.texture * 100),
        );
      }

      if (sliders.mutation > 0.25 && Math.random() < sliders.mutation * 0.05 * FEEDBACK_GAIN) {
        this.particles.spawnDistortionArtifacts(
          Math.round(Math.random() * width),
          Math.round(Math.random() * height),
          this.sound,
          theme,
        );
      }

      if (audio.isActive) {
        for (const plant of this.plants.values()) {
          if (Math.random() < audio.amplitude * 0.4 * theme.rhythm * FEEDBACK_GAIN) {
            this.particles.spawnSpores(
              plant.x,
              plant.y,
              Math.round((1 + audio.peak * 4) * FEEDBACK_GAIN),
              theme,
              Math.round(audio.peak * 127),
            );
          }
        }
      }

      if (audio.peak > this.lastPeak + 0.05) {
        this.particles.spawnSpores(
          Math.round(width / 2),
          Math.round(height / 2),
          Math.round((3 + audio.peak * 8) * FEEDBACK_GAIN),
          theme,
          Math.round(audio.peak * 127),
        );
      }
      this.lastPeak = audio.peak;

      if (snapshot.interactionBoost > 0 && Math.random() < snapshot.interactionBoost / 24) {
        this.particles.spawnSpores(
          Math.round(width / 2),
          Math.round(height / 2),
          Math.round(4 * FEEDBACK_GAIN),
          theme,
          snapshot.interactionBoost,
        );
      }
    }

    this.particles.update(
      dt *
        (1 + audio.amplitude * 2 * FEEDBACK_GAIN) *
        (1 + buildSliderVizState(snapshot.sound, snapshot.modulation).energy * 0.5 * FEEDBACK_GAIN),
      width,
      height,
      this.sound,
      theme,
      this.accessibility.reduceMotion,
    );
  }

  private renderFrame(snapshot: VizInputSnapshot, theme: PresetTheme): string {
    const { audio, time } = snapshot;
    this.renderer.clear();

    const sceneTheme = resolvePresetTheme(snapshot.presetId, snapshot.presetName);
    const sliders = buildSliderVizState(snapshot.sound, snapshot.modulation);
    const sceneBoost = sliderSceneIntensity(sliders);
    const energy = sceneBoost.energy;
    const amplitude = this.dormant ? 0.05 + sliders.volume * 0.15 : sceneBoost.amplitude + audio.amplitude * 0.5;

    const interactionPulse = Math.max(snapshot.interactionBoost, this.titlePulse);

    this.renderer.paintBotanicalScene(
      sceneTheme,
      this.elapsed * sceneBoost.animSpeed,
      energy,
      amplitude,
      sceneBoost.animSpeed,
      sliders,
      interactionPulse,
    );

    const groundY = this.renderer.height - 2;

    if (this.dormant) {
      return this.renderer.toString();
    }

    this.renderer.paintBassPulse(sliderBassStrength(sliders, audio.bass), groundY, sceneTheme);

    if (!this.accessibility.reduceMotion) {
      this.renderer.paintWindRipples(
        time,
        sliderWindDepth(sliders) + this.sound.lfoDepth + audio.mid * 0.4 + Math.abs(snapshot.pitchBend) * 0.5,
        Math.floor(this.renderer.height * themeRippleY(theme)),
        theme,
      );
    }

    const spectrumGain = sliderSpectrumGain(sliders, audio.amplitude);
    this.renderer.paintSpectrumColumns(audio.spectrum, groundY - 1, spectrumGain, theme);

    if (audio.isActive || sliders.volume > 0.2) {
      this.renderer.paintWaveform(
        audio.waveform,
        Math.floor(this.renderer.height * waveformY(theme)),
        spectrumGain,
        theme,
      );
    }

    for (const plant of this.plants.values()) {
      const segments = drawPlantSegments(plant, this.sound, audio, theme);
      this.renderer.paintSegments(segments, 6);

      if (audio.isActive) {
        this.renderer.paintAmplitudeHalo(
          Math.round(plant.x),
          Math.round(plant.y),
          2 + Math.round(audio.amplitude * 4 * FEEDBACK_GAIN),
          plant.brightness * (0.5 + audio.amplitude * FEEDBACK_GAIN),
          theme,
        );
      }
    }

    this.renderer.paintParticles(
      this.particles.list(),
      4 + Math.round((audio.amplitude * 3 + sliders.energy * 5 + sliders.bloom * 3) * FEEDBACK_GAIN),
    );

    return this.renderer.toString();
  }
}

function themeRippleY(theme: PresetTheme): number {
  switch (theme.spatialLayout) {
    case 'horizon-wide':
      return 0.75;
    case 'ground-heavy':
      return 0.85;
    default:
      return 0.65;
  }
}

function waveformY(theme: PresetTheme): number {
  switch (theme.spatialLayout) {
    case 'horizon-wide':
    case 'wide-organic':
      return 0.45;
    default:
      return 0.55;
  }
}
