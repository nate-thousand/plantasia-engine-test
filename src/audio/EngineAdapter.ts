import { PlantasiaEngine, type PlantasiaPreset } from 'plantasia-sound-engine';
import { midiToNoteName } from '../input/noteMap';
import type { ModulationControlValues, SoundControlValues } from '../types/instrument';
import { ambientSoundscape } from './AmbientSoundscape';
import {
  mapControlSurfaceToBotanical,
  resetAudioControls,
  setBotanicalState,
} from './controls';
import { clampMold, syncMoldProfile } from './moldSync';
import { LiveVoiceRouter } from './liveVoice';
import { startAudioTap } from './visualization/AudioTap';

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
  private audioStartPromise: Promise<{ presetCount: number }> | null = null;
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

  /** Call synchronously inside a user-gesture handler before any await. */
  kickAudioFromUserGesture(): Promise<{ presetCount: number }> {
    this.getEngine();
    if (this.audioStarted) {
      return Promise.resolve({ presetCount: this.getEngine().presets.length });
    }
    if (!this.audioStartPromise) {
      this.audioStartPromise = this.startAudio().finally(() => {
        this.audioStartPromise = null;
      });
    }
    return this.audioStartPromise;
  }

  async startAudio(): Promise<{ presetCount: number }> {
    if (this.audioStarted) {
      return { presetCount: this.getEngine().presets.length };
    }

    const instance = this.getEngine();

    console.info(`${LOG_PREFIX} Initializing audio context…`);
    await instance.init();
    this.audioStarted = true;
    startAudioTap();
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

    syncMoldProfile(preset);
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
    const mold = clampMold(sound.mold);
    const controls = mapControlSurfaceToBotanical({ ...sound, mold }, modulation);
    setBotanicalState(controls);
    this.getEngine().applyBotanicalControls(controls);
    this.getEngine().setMold(mold);
    this.liveVoice.syncMold(mold);
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

  async startAmbientPlayback(preset: PlantasiaPreset): Promise<void> {
    if (!this.audioStarted) {
      throw new Error('Audio context is not running. Start audio first.');
    }
    await ambientSoundscape.start(preset);
  }

  async stopAmbientPlayback(fade = true): Promise<void> {
    await ambientSoundscape.stop(fade);
  }

  isAmbientPlaying(): boolean {
    return ambientSoundscape.isActive();
  }

  applyAmbientControls(sound: SoundControlValues, modulation: ModulationControlValues): void {
    ambientSoundscape.applyControls(sound, modulation);
  }

  applyChannelPressure(pressure: number): void {
    if (!this.audioStarted) {
      return;
    }

    this.liveVoice.applyChannelPressure(pressure);
  }

  applyPitchBend(normalized: number): void {
    if (!this.audioStarted) {
      return;
    }

    this.liveVoice.applyPitchBend(normalized);
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
