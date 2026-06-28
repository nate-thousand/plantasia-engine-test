import { PlantasiaEngine, type PlantasiaPreset } from 'plantasia-sound-engine';
import { midiToNoteName } from '../input/noteMap';
import type { ModulationControlValues, SoundControlValues } from '../types/instrument';
import {
  mapControlSurfaceToBotanical,
  resetAudioControls,
  setBotanicalState,
} from './controls';
import { LiveVoiceRouter } from './liveVoice';

const LOG_PREFIX = '[Plantasia Engine Test]';

/**
 * Facade between input layers and plantasia-sound-engine.
 * Keyboard and MIDI route through LiveVoiceRouter, which mirrors
 * the active preset for both standard and Juno Flowers paths.
 */
class EngineAdapter {
  private engine: PlantasiaEngine | null = null;
  private readonly liveVoice = new LiveVoiceRouter();
  private audioStarted = false;
  private lastSound: SoundControlValues | null = null;
  private lastModulation: ModulationControlValues | null = null;

  getEngine(): PlantasiaEngine {
    if (!this.engine) {
      this.engine = new PlantasiaEngine();
      console.info(`${LOG_PREFIX} PlantasiaEngine instance created`);
    }

    return this.engine;
  }

  isAudioRunning(): boolean {
    return this.audioStarted;
  }

  isEngineConnected(): boolean {
    return this.engine !== null;
  }

  async startAudio(): Promise<{ presetCount: number }> {
    const instance = this.getEngine();

    console.info(`${LOG_PREFIX} Initializing audio context…`);
    await instance.init();
    this.audioStarted = true;
    resetAudioControls();

    const presetCount = instance.presets.length;
    console.info(
      `${LOG_PREFIX} Engine initialized successfully (${presetCount} presets available)`,
    );

    return { presetCount };
  }

  async preparePreset(preset: PlantasiaPreset): Promise<void> {
    if (!this.audioStarted) {
      return;
    }

    await this.liveVoice.preparePreset(preset);
    this.reapplyStoredControls();

    console.info(`${LOG_PREFIX} Live input prepared for preset`, { id: preset.id, name: preset.name });
  }

  applyControlSurface(
    sound: SoundControlValues,
    modulation: ModulationControlValues,
  ): void {
    this.lastSound = sound;
    this.lastModulation = modulation;

    if (!this.audioStarted) {
      return;
    }

    this.pushControlSurface(sound, modulation);
  }

  applySoundControls(sound: SoundControlValues, modulation: ModulationControlValues): void {
    this.lastSound = sound;
    this.lastModulation = modulation;

    if (!this.audioStarted) {
      return;
    }

    this.liveVoice.applySoundControls(sound);
    this.syncEngineControls(sound, modulation);
  }

  private reapplyStoredControls(): void {
    if (!this.lastSound || !this.lastModulation) {
      return;
    }

    this.pushControlSurface(this.lastSound, this.lastModulation);
  }

  private pushControlSurface(
    sound: SoundControlValues,
    modulation: ModulationControlValues,
  ): void {
    this.liveVoice.applySoundControls(sound);
    this.liveVoice.applyModulationControls(modulation);
    this.syncEngineControls(sound, modulation);
  }

  private syncEngineControls(
    sound: SoundControlValues,
    modulation: ModulationControlValues,
  ): void {
    const controls = mapControlSurfaceToBotanical(sound, modulation);
    setBotanicalState(controls);
    this.getEngine().applyBotanicalControls(controls);
  }

  noteOn(midi: number, velocity = 100): void {
    if (!this.audioStarted) {
      throw new Error('Audio context is not running. Start audio first.');
    }

    this.liveVoice.noteOn(midi, velocity);
    console.info(`${LOG_PREFIX} Note on`, { midi, note: midiToNoteName(midi), velocity });
  }

  noteOff(midi: number): void {
    if (!this.audioStarted) {
      return;
    }

    this.liveVoice.noteOff(midi);
    console.info(`${LOG_PREFIX} Note off`, { midi });
  }

  stopAllNotes(): void {
    this.getEngine().stop();
    this.liveVoice.stopAll();
    console.info(`${LOG_PREFIX} All notes stopped`);
  }

  triggerChord(): void {
    if (!this.audioStarted) {
      throw new Error('Audio context is not running. Start audio first.');
    }

    if (this.lastSound && this.lastModulation) {
      this.syncEngineControls(this.lastSound, this.lastModulation);
    }

    this.getEngine().triggerChord();
    console.info(`${LOG_PREFIX} Chord triggered`);
  }
}

export const engineAdapter = new EngineAdapter();
