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
import { findPresetById } from '../presets/engineRegistry';
import { fallbackTheme } from './PresetThemes';
import { buildSoundVizParams } from './SoundMapping';
import { ThemeTransition } from './ThemeTransition';
import { densityFromVisualEnergy } from './VisualEnergy';
import { IDLE_HOME } from './VisualMode';
import { FEEDBACK_GAIN, maxParticleCount } from './VisualFeedback';
import type {
  PlantInstance,
  PresetTheme,
  SoundVizParams,
  VizAccessibility,
  VizInputSnapshot,
  AsciiFrameOutput,
  MusicalColorFrame,
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
  private simFrame = 0;

  constructor(options: AsciiEngineOptions) {
    this.renderer = new AsciiRenderer(options.initialDimensions);
    this.particles = new ParticleSystem(maxParticleCount(options.accessibility.density));
    this.accessibility = options.accessibility;
    const initialTheme = fallbackTheme();
    this.themeTransition = new ThemeTransition(initialTheme);
    this.sound = buildSoundVizParams(
      { mold: 12, tone: 50, texture: 40, bloom: 35 },
      { growthRate: 45, drift: 30, mutation: 20, energy: 55 },
      findPresetById('seed') ?? null,
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
    this.particles = new ParticleSystem(maxParticleCount(accessibility.density));
  }

  get dimensions(): GridDimensions {
    return { width: this.renderer.width, height: this.renderer.height };
  }

  tick(snapshot: VizInputSnapshot, deltaMs: number): AsciiFrameOutput {
    const dt = this.accessibility.reduceMotion
      ? Math.min(deltaMs / 1000, 1 / 24) * (this.accessibility.animationSpeed / 100)
      : Math.min(deltaMs / 1000, 1 / 24) * (this.accessibility.animationSpeed / 62);

    this.elapsed += dt;
    this.dormant = !snapshot.audioReady;
    this.simFrame += 1;

    const sliders = buildSliderVizState(snapshot.sound, snapshot.modulation);

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
      snapshot.activePreset,
      theme,
    );
    this.sound = applyAudioFeedback(baseSound, snapshot.audio);

    this.syncPlants(snapshot, theme);
    this.applyInteractionFeedback(snapshot, theme);
    this.applyPointerFeedback(snapshot, theme);
    this.applySliderChangeBursts(snapshot, theme);
    this.updateSimulation(dt, snapshot, theme, sliders);
    this.applyMidiVisualEffects(snapshot, theme);
    return this.renderFrame(snapshot, theme, sliders);
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

  /** Clear note-driven state but keep idle scene timing when audio stops. */
  softReset(): void {
    this.plants.clear();
    this.particles.clear();
    resetPlantGenerator();
    this.lastActiveMidis.clear();
    this.lastPeak = 0;
  }

  private applyPointerFeedback(snapshot: VizInputSnapshot, theme: PresetTheme): void {
    const { pointer, energy } = snapshot;
    const visualEnergy = energy.visualEnergy;
    if (pointer.activity < 0.04 && !pointer.active) {
      return;
    }

    const { width, height } = this.renderer;
    const x = Math.max(0, Math.min(width - 1, pointer.gridX));
    const y = Math.max(0, Math.min(height - 1, pointer.gridY));
    const touchBoost = pointer.isTouch ? 1.35 : 1;
    const intensity = Math.round(
      (40 + pointer.activity * 87 + visualEnergy * 40) * touchBoost,
    );

    if (pointer.active || pointer.activity > 0.08) {
      this.particles.spawnInteractionFlare(x, y, intensity, theme, width, height);
    }

    if (pointer.activity > 0.15 && this.simFrame % 2 === 0) {
      this.particles.spawnSpores(
        x,
        y,
        Math.round(2 + pointer.activity * 8 * FEEDBACK_GAIN * 0.15),
        theme,
        intensity,
      );
    }

    this.titlePulse = Math.max(this.titlePulse, Math.round(pointer.activity * 90));
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
        for (let layer = 0; layer < 2; layer += 1) {
          this.particles.spawnInteractionFlare(
            x + layer * 2 - 1,
            y - layer,
            note.velocity,
            theme,
            width,
            height,
          );
        }
        this.particles.spawnEchoSeeds(x, y, Math.max(0.2, this.sound.delayWet), theme);
        this.titlePulse = 127;
      } else if (this.simFrame % 2 === 0) {
        const plant = this.plants.get(note.midi);
        const x = plant?.x ?? Math.round((note.midi - 36) / 88 * width);
        const y = plant?.y ?? Math.round(height * 0.6);
        this.particles.spawnSpores(
          x,
          y,
          Math.round(3 + note.velocity / 20),
          theme,
          note.velocity,
        );
      }
    }

    this.lastActiveMidis = activeMidis;

    if (snapshot.controlHighlightTick > this.lastHighlightTick) {
      this.lastHighlightTick = snapshot.controlHighlightTick;
      this.particles.spawnInteractionFlare(cx, cy, 127, theme, width, height);
      this.titlePulse = Math.max(this.titlePulse, 127);
    }

    const modDelta = Math.abs(snapshot.modWheel - this.lastModWheel);
    if (modDelta >= 1) {
      this.particles.spawnInteractionFlare(
        cx + Math.round((snapshot.modWheel - 64) * 0.08),
        cy,
        Math.min(127, 40 + modDelta * 3),
        theme,
        width,
        height,
      );
      this.titlePulse = Math.max(this.titlePulse, Math.min(127, Math.round(modDelta * 2.5)));
      this.lastModWheel = snapshot.modWheel;
    }

    const pressureDelta = Math.abs(snapshot.channelPressure - this.lastChannelPressure);
    if (pressureDelta >= 2) {
      this.particles.spawnInteractionFlare(
        cx,
        cy,
        Math.min(127, 35 + pressureDelta * 2),
        theme,
        width,
        height,
      );
      this.titlePulse = Math.max(this.titlePulse, snapshot.channelPressure);
      this.lastChannelPressure = snapshot.channelPressure;
    }

    if (Math.abs(snapshot.pitchBend) > 0.02 && this.simFrame % 2 === 0) {
      const bendX = cx + Math.round(snapshot.pitchBend * width * 0.35);
      this.particles.spawnInteractionFlare(
        bendX,
        cy,
        Math.round(Math.abs(snapshot.pitchBend) * 127),
        theme,
        width,
        height,
      );
    }

    if (this.titlePulse > 0) {
      this.titlePulse = Math.max(0, this.titlePulse - 0.6);
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

    switch (kind) {
      case 'play':
      case 'stop':
        this.particles.spawnInteractionFlare(cx, cy, intensity, theme, width, height);
        this.particles.spawnReverbSpores(width, height, 0.75, theme);
        break;
      case 'pitchBend': {
        const spread = themePitchSpread(theme, snapshot.pitchBend);
        this.particles.spawnInteractionFlare(
          cx + Math.round(spread * width),
          cy,
          intensity,
          theme,
          width,
          height,
        );
        break;
      }
      case 'presetChange':
        this.particles.spawnInteractionFlare(cx, cy, intensity, theme, width, height);
        this.particles.spawnReverbSpores(width, height, 0.85, theme);
        for (let i = 0; i < 3; i += 1) {
          this.particles.spawnWindParticles(width, height, this.sound, theme);
        }
        break;
      case 'knobTwist':
        for (const plant of this.plants.values()) {
          this.particles.spawnInteractionFlare(
            plant.x,
            plant.y,
            Math.min(127, intensity + 20),
            theme,
            width,
            height,
          );
        }
        if (this.plants.size === 0) {
          this.particles.spawnInteractionFlare(cx, cy, intensity, theme, width, height);
        }
        break;
      default:
        this.particles.spawnInteractionFlare(cx, cy, intensity, theme, width, height);
        if (kind === 'reverbBurst' || kind === 'chorusBurst') {
          this.particles.spawnReverbSpores(width, height, intensity / 127, theme);
        }
    }

    if (intensity > 8) {
      const accent = themeMidiEffectChar(theme, kind, snapshot.midiEffectTick);
      this.renderer.setChar(cx, cy, accent, 9);
      const ring = Math.round((intensity / 127) * 10 * FEEDBACK_GAIN);
      for (let i = -ring; i <= ring; i += 1) {
        this.renderer.setChar(cx + i, cy, accent, 8);
        this.renderer.setChar(cx, cy + i, accent, 8);
        if (Math.abs(i) % 2 === 0) {
          this.renderer.setChar(cx + i, cy + i, accent, 7);
          this.renderer.setChar(cx + i, cy - i, accent, 7);
        }
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
      this.particles.spawnInteractionFlare(
        cx,
        cy,
        Math.min(127, Math.round(change.value * 127 + Math.abs(change.delta) * 80)),
        theme,
        width,
        height,
      );
      this.particles.spawnSpores(cx, cy, count, theme, Math.round(change.value * 127));
      this.spawnSliderKeyedParticles(change.key, change.value, width, height, theme);
      this.titlePulse = Math.max(this.titlePulse, 90);
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
      case 'mold':
        this.particles.spawnSpores(cx, ground, Math.round(2 + value * 3), theme, intensity);
        break;
      case 'tone':
        this.particles.spawnSpores(cx, 2, Math.round(2 + value * 2), theme, intensity);
        break;
      case 'texture':
        this.particles.spawnSpores(Math.round(width * 0.25), cy, Math.round(2 + value * 2), theme, intensity);
        break;
      case 'bloom':
        this.particles.spawnReverbSpores(width, height, value * 0.45, theme);
        break;
      case 'growthRate':
        this.particles.spawnEchoSeeds(cx, ground, value * 0.45, theme);
        break;
      case 'drift':
        this.particles.spawnWindParticles(width, height, this.sound, theme);
        break;
      case 'mutation':
        this.particles.spawnDistortionArtifacts(cx, cy, { ...this.sound, distortion: value }, theme);
        break;
      case 'energy':
        this.particles.spawnSpores(cx, cy, Math.round(2 + value * 5), theme, intensity);
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
          (2 + note.velocity / 8) * particleRate * (0.65 + theme.rhythm * 0.85) * (FEEDBACK_GAIN / 4),
        );
        this.particles.spawnSpores(plant.x, plant.y, sporeCount, theme, note.velocity);
        if (this.sound.delayWet > 0.06) {
          this.particles.spawnEchoSeeds(plant.x, plant.y, this.sound.delayWet, theme);
        }
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
        const leafCount = Math.round((1 + this.sound.release * 0.5) * (1 + audio.amplitude * 1.5));
        this.particles.spawnFallingLeaves(plant.x, plant.y, leafCount, theme);
        this.particles.spawnSpores(
          plant.x,
          plant.y,
          Math.round(this.sound.reverbWet * 4 * particleRate),
          theme,
          80,
        );
      }
    }
  }

  private updateSimulation(
    dt: number,
    snapshot: VizInputSnapshot,
    theme: PresetTheme,
    sliders: SliderVizState,
  ): void {
    const { width, height } = this.renderer;
    const { audio } = snapshot;
    const particleRate = audioParticleRate(audio);

    for (const plant of this.plants.values()) {
      const growthBoost = 1 + audio.amplitude * 1.2 + audio.peak * 0.6;
      updatePlant(
        plant,
        dt * growthBoost,
        this.sound,
        theme,
        width,
        height,
        this.accessibility.reduceMotion,
        audio,
      );
      plant.brightness = Math.min(
        1,
        plant.brightness * 0.85 + noteAudioIntensity(plant.velocity, audio) * 0.15,
      );

      if (this.sound.distortion > 0.35 && Math.random() < 0.08) {
        this.particles.spawnDistortionArtifacts(plant.x, plant.y, this.sound, theme);
      }
    }

    for (const [midi, plant] of this.plants) {
      if (!isPlantVisible(plant)) {
        this.plants.delete(midi);
      }
    }

    if (!this.dormant) {
      const ambientRate = sliderAmbientParticleRate(sliders);
      const { visualEnergy } = snapshot.energy;
      const { rareEventRate, spread } = snapshot.energyBehavior;
      const asciiScale = densityFromVisualEnergy(visualEnergy);

      if (Math.random() < 0.08 * particleRate * theme.density * ambientRate * asciiScale) {
        this.particles.spawnWindParticles(width, height, this.sound, theme);
      }
      if (Math.random() < this.sound.reverbWet * particleRate * 0.12 * (0.5 + sliders.bloom) * asciiScale) {
        this.particles.spawnReverbSpores(width, height, this.sound.reverbWet, theme);
      }

      if (Math.random() < sliders.energy * 0.025 * ambientRate * asciiScale) {
        this.particles.spawnSpores(
          Math.round(width / 2),
          Math.round(height / 2),
          Math.round(1 + sliders.energy * 2),
          theme,
          Math.round(sliders.energy * 127),
        );
      }

      if (Math.random() < sliders.texture * 0.02 * asciiScale) {
        this.particles.spawnSpores(
          Math.round(Math.random() * width),
          Math.round(Math.random() * height),
          1,
          theme,
          Math.round(sliders.texture * 100),
        );
      }

      if (sliders.mutation > 0.35 && Math.random() < sliders.mutation * 0.015 * asciiScale) {
        this.particles.spawnDistortionArtifacts(
          Math.round(Math.random() * width),
          Math.round(Math.random() * height),
          this.sound,
          theme,
        );
      }

      if (audio.isActive && this.plants.size <= 6) {
        for (const plant of this.plants.values()) {
          if (Math.random() < audio.amplitude * 0.12 * theme.rhythm) {
            this.particles.spawnSpores(
              plant.x,
              plant.y,
              Math.round(1 + audio.peak * 2),
              theme,
              Math.round(audio.peak * 127),
            );
          }
        }
      }

      if (audio.peak > this.lastPeak + 0.08) {
        this.particles.spawnSpores(
          Math.round(width / 2),
          Math.round(height / 2),
          Math.round(2 + audio.peak * 4),
          theme,
          Math.round(audio.peak * 127),
        );
      }
      this.lastPeak = audio.peak;

      if (snapshot.interactionBoost > 0 || visualEnergy > 0.12) {
        const layers = Math.max(
          1,
          Math.ceil((snapshot.interactionBoost / 15) * (1 + visualEnergy) * spread),
        );
        for (let i = 0; i < layers; i += 1) {
          const px = Math.round(Math.random() * width);
          const py = Math.round(Math.random() * height);
          this.particles.spawnInteractionFlare(
            px,
            py,
            snapshot.interactionBoost,
            theme,
            width,
            height,
          );
        }
        for (let i = 0; i < layers; i += 1) {
          this.particles.spawnWindParticles(width, height, this.sound, theme);
          this.particles.spawnReverbSpores(width, height, 0.7, theme, true);
        }
      }
      if (Math.random() < rareEventRate * asciiScale * 0.15) {
        this.particles.spawnInteractionFlare(
          Math.round(Math.random() * width),
          Math.round(Math.random() * height),
          Math.round(visualEnergy * 127),
          theme,
          width,
          height,
        );
      }

      const peak = snapshot.performance?.peakEvent;
      if (peak && peak.age < 0.12 && peak.intensity > 0.5) {
        this.spawnPerformancePeak(peak.kind, peak.intensity, width, height, theme);
      }
    } else {
      const { displayEnergy } = snapshot.energy;
      const { renderMode } = snapshot;
      const asciiScale = densityFromVisualEnergy(displayEnergy);
      const { rareEventRate } = snapshot.energyBehavior;
      if (
        renderMode === 'activePlay' &&
        displayEnergy > 0.12 &&
        Math.random() < (0.04 + rareEventRate * 0.08) * asciiScale * theme.density
      ) {
        const px = snapshot.pointer.active
          ? snapshot.pointer.gridX
          : Math.round(Math.random() * width);
        const py = snapshot.pointer.active
          ? snapshot.pointer.gridY
          : Math.round(Math.random() * height);
        this.particles.spawnSpores(px, py, 1, theme, Math.round(displayEnergy * 80));
      }
    }

    this.particles.update(
      dt *
        snapshot.energyBehavior.speed *
        (1 + audio.amplitude * 0.8) *
        (1 + sliders.energy * 0.25),
      width,
      height,
      this.sound,
      theme,
      this.accessibility.reduceMotion,
    );
  }

  private renderFrame(
    snapshot: VizInputSnapshot,
    theme: PresetTheme,
    sliders: SliderVizState,
  ): AsciiFrameOutput {
    const { audio, time, musicalColor } = snapshot;
    this.renderer.setMusicalFrame(musicalColor.weight > 0.02 ? musicalColor : null);
    this.renderer.clear();

    const sceneTheme = theme;
    const sceneBoost = sliderSceneIntensity(sliders, snapshot.renderMode);
    const interactionPulse = Math.max(snapshot.interactionBoost, this.titlePulse);
    const { energy, energyBehavior } = snapshot;
    const visualEnergy = energy.displayEnergy;
    const renderMode = snapshot.renderMode;
    const asciiScale = energyBehavior.density;
    const motionScale = energyBehavior.speed;
    const energyLevel =
      renderMode === 'idleHome'
        ? IDLE_HOME.sceneEnergy
        : sceneBoost.energy * asciiScale;
    const amplitude =
      renderMode === 'idleHome'
        ? IDLE_HOME.amplitude
        : this.dormant
          ? 0.04 + sliders.mold * 0.08 * asciiScale
          : (sceneBoost.amplitude + snapshot.audio.amplitude * 0.45) *
            asciiScale *
            energyBehavior.brightness;

    this.renderer.paintBotanicalScene(
      sceneTheme,
      this.elapsed * (renderMode === 'idleHome' ? IDLE_HOME.animSpeed : sceneBoost.animSpeed * motionScale),
      energyLevel,
      amplitude,
      renderMode === 'idleHome' ? IDLE_HOME.animSpeed : sceneBoost.animSpeed * motionScale,
      sliders,
      interactionPulse,
      visualEnergy,
      snapshot.pointer,
      energyBehavior,
      renderMode,
      snapshot.performance,
      snapshot.ambientActive,
      snapshot.energy.playModeEnergy,
    );

    const perfEnergy = snapshot.performance.performanceEnergy;
    if (renderMode === 'activePlay' && (interactionPulse > 3 || perfEnergy > 0.12)) {
      this.renderer.paintInteractionOverlays(
        sceneTheme,
        time,
        interactionPulse,
        energyBehavior,
        visualEnergy,
      );
    }

    const transitionProgress = Math.max(snapshot.presetTransition, energy.sources.preset.current);
    if (transitionProgress > 0.05) {
      this.renderer.paintPresetTransition(
        sceneTheme,
        time,
        transitionProgress,
        energyBehavior,
        renderMode === 'idleHome',
      );
    }

    const groundY = this.renderer.height - 2;

    if (this.dormant) {
      if (renderMode === 'activePlay' && visualEnergy > 0.22) {
        this.renderer.paintParticles(
          this.particles.list(),
          2 + Math.round(visualEnergy * 4 * energyBehavior.spread),
        );
      }
      return this.buildFrameOutput(musicalColor, sceneTheme.colorHint);
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
    if (audio.isActive && spectrumGain > 0.04) {
      this.renderer.paintSpectrumColumns(audio.spectrum, groundY - 1, spectrumGain, theme);
    }

    if (audio.isActive && spectrumGain > 0.06) {
      this.renderer.paintWaveform(
        audio.waveform,
        Math.floor(this.renderer.height * waveformY(theme)),
        spectrumGain,
        theme,
      );
    }

    const plantCount = this.plants.size;
    for (const plant of this.plants.values()) {
      const segments = drawPlantSegments(plant, this.sound, audio, theme);
      this.renderer.paintSegments(segments, 6);

      if (audio.isActive && plantCount <= 4 && audio.amplitude > 0.12) {
        this.renderer.paintAmplitudeHalo(
          Math.round(plant.x),
          Math.round(plant.y),
          2 + Math.round(audio.amplitude * 2),
          plant.brightness * (0.5 + audio.amplitude * 0.6),
          theme,
        );
      }
    }

    this.renderer.paintParticles(
      this.particles.list(),
      8 + Math.round(
        audio.amplitude * 6 + sliders.energy * 6 + sliders.bloom * 5 + interactionPulse / 10,
      ),
    );

    return this.buildFrameOutput(musicalColor, sceneTheme.colorHint);
  }

  private spawnPerformancePeak(
    kind: string,
    intensity: number,
    width: number,
    height: number,
    theme: PresetTheme,
  ): void {
    const cx = Math.round(width / 2);
    const cy = Math.round(height / 2);
    const burst = Math.round(4 + intensity * 14);

    switch (kind) {
      case 'bloom':
      case 'ripple':
        for (let i = 0; i < burst; i += 1) {
          const angle = (i / burst) * Math.PI * 2;
          const r = Math.round(2 + intensity * 8);
          this.particles.spawnSpores(
            cx + Math.round(Math.cos(angle) * r),
            cy + Math.round(Math.sin(angle) * r * 0.65),
            2,
            theme,
            Math.round(intensity * 127),
          );
        }
        break;
      case 'constellation':
        for (let i = 0; i < burst; i += 1) {
          this.particles.spawnSpores(
            Math.round(Math.random() * width),
            Math.round(Math.random() * height * 0.6),
            1,
            theme,
            100,
          );
        }
        break;
      case 'corruption':
        for (let i = 0; i < burst; i += 1) {
          this.particles.spawnDistortionArtifacts(
            Math.round(Math.random() * width),
            Math.round(Math.random() * height),
            this.sound,
            theme,
          );
        }
        break;
      case 'roll':
        for (let x = 0; x < width; x += 2) {
          this.particles.spawnSpores(x, cy + Math.round(Math.sin(x * 0.2) * 3), 1, theme, 80);
        }
        break;
      default:
        this.particles.spawnInteractionFlare(cx, cy, Math.round(intensity * 127), theme, width, height);
        for (let i = 0; i < burst; i += 1) {
          this.particles.spawnReverbSpores(width, height, intensity, theme, true);
        }
        break;
    }
  }

  private buildFrameOutput(musicalColor: MusicalColorFrame, ambientColorHint: string): AsciiFrameOutput {
    return {
      text: this.renderer.toString(),
      html: this.renderer.toHtml(),
      musicalColor,
      ambientColorHint,
    };
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
