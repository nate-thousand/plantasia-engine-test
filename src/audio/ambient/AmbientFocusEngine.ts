/**
 * Milestone 15 — Adaptive Ambient Focus Engine.
 * Orchestration-only Play mode — timing and interaction only; preset owns sound.
 */
import type { PlantasiaPreset } from 'plantasia-sound-engine';
import * as Tone from 'tone';
import type { ModulationControlValues, SoundControlValues } from '../../types/instrument';
import { getControlStore } from '../../stores/controlStore';
import {
  decayAmbientActivity,
  getAmbientGenerativeState,
  patchAmbientGenerativeState,
  pulseAmbientActivity,
  resetAmbientGenerativeState,
} from './ambientStateStore';
import { generateNextGesture, shouldLayerPlay } from './gestureVocabulary';
import { resolveHarmonicProfile, type AmbientHarmonicProfile } from './harmonicProfile';
import { layerForVoice } from './layers';
import { PhraseMemory } from './phraseMemory';
import {
  applyPresetMacroBehavior,
  macrosFromControls,
} from './presetMacroMappings';
import {
  chance,
  pickChordVoicing,
  pickNextNote,
  VOICE_CLOCK_BASE,
} from './probabilityEngine';
import { midiToNoteName } from './scales';
import {
  createPresetTimbreSession,
  type GenerativeVoiceSlot,
  type PresetTimbreSession,
} from './timbreSession';

const FADE_IN_SEC = 1.2;
const FADE_OUT_SEC = 4.5;

export class AmbientFocusEngine {
  private active = false;
  private harmonic: AmbientHarmonicProfile | null = null;
  private session: PresetTimbreSession | null = null;
  private voices: GenerativeVoiceSlot[] = [];
  private phraseMemory = new PhraseMemory();
  private tickId: number | null = null;
  private sessionStart = 0;
  private evolutionPhase = 0;
  private densityBias = 0.5;

  isActive(): boolean {
    return this.active;
  }

  async start(preset: PlantasiaPreset): Promise<void> {
    if (this.active && this.harmonic?.presetId === preset.id) {
      return;
    }

    await this.stop(false);
    this.harmonic = resolveHarmonicProfile(preset);
    this.session = await createPresetTimbreSession(preset);
    this.phraseMemory.reset();
    this.active = true;
    this.sessionStart = Tone.now();
    this.evolutionPhase = 0;
    this.densityBias =
      this.session.profile.densityRange.min +
      Math.random() * (this.session.profile.densityRange.max - this.session.profile.densityRange.min);

    this.spawnLayers();
    this.startImmediateSound();
    this.startTick();
    this.updateGenerativeState(true);
  }

  async stop(fade = true): Promise<void> {
    if (!this.active && !this.session) {
      return;
    }

    this.active = false;
    this.stopTick();
    resetAmbientGenerativeState();
    this.phraseMemory.reset();

    const session = this.session;
    const voices = this.voices;
    this.voices = [];
    this.session = null;
    this.harmonic = null;

    if (!session) {
      return;
    }

    const releaseSec = fade ? FADE_OUT_SEC : 0.1;
    const now = Tone.now();

    for (const voice of voices) {
      voice.actor.release(now, releaseSec * 0.7);
      voice.actor.dispose();
    }

    session.fadeOut(fade, releaseSec);
    window.setTimeout(() => session.dispose(), releaseSec * 1000 + 150);
  }

  applyControls(sound: SoundControlValues, modulation: ModulationControlValues): void {
    if (!this.active || !this.session) {
      return;
    }
    this.session.applyControls(sound, modulation, this.evolutionPhase, this.densityBias);

    const macros = macrosFromControls(sound, modulation, this.evolutionPhase, this.densityBias);
    const behavior = applyPresetMacroBehavior(this.session.profile.routing, this.session.profile, macros);
    this.densityBias = Math.min(
      this.session.profile.densityRange.max,
      behavior.densityScale,
    );
  }

  /** Request voice layers from preset sound world — Play never instantiates synths. */
  private spawnLayers(): void {
    if (!this.session || !this.harmonic) {
      return;
    }

    const kinds = this.session.profile.voiceKinds;
    if (this.harmonic.voiceCount >= 5 && !kinds.includes('pad')) {
      kinds.push('pad');
    }

    this.voices = kinds
      .map((kind, index) => {
        const layer = layerForVoice(kind);
        const actor = this.session!.createLayerActor(layer, index) ?? this.session!.createVoiceActor(kind, index);
        return {
          kind,
          layer,
          actor,
          degree: index % 5,
          octaveOffset: kind === 'sub' ? -1 : 0,
          nextEventAt: Tone.now() + index * 0.08,
          clockBase: VOICE_CLOCK_BASE[kind] ?? 12,
          activeNotes: [],
        } satisfies GenerativeVoiceSlot;
      })
      .filter((v) => v.actor != null);
  }

  private startImmediateSound(): void {
    if (!this.session || !this.harmonic) {
      return;
    }

    const now = Tone.now();
    this.session.fadeIn(now, FADE_IN_SEC);

    for (const voice of this.voices) {
      if (voice.kind === 'drone' || voice.kind === 'sub') {
        this.triggerDroneVoice(voice, now);
      } else if (voice.kind === 'pad') {
        this.triggerPadVoice(voice, now + 0.15);
      } else {
        const gesture = generateNextGesture(
          voice.layer,
          this.session.gestureVocabulary,
          this.harmonic,
          voice.clockBase * 0.15,
          0,
          this.densityBias,
        );
        voice.nextEventAt = now + gesture.delaySec;
      }
    }

    pulseAmbientActivity(0.5);
  }

  private startTick(): void {
    if (this.tickId) {
      return;
    }
    this.tickId = window.setInterval(() => {
      if (!this.active) {
        this.stopTick();
        return;
      }
      this.tick();
    }, 48);
  }

  private stopTick(): void {
    if (this.tickId) {
      window.clearInterval(this.tickId);
      this.tickId = null;
    }
  }

  private tick(): void {
    if (!this.harmonic || !this.session) {
      return;
    }

    const now = Tone.now();
    const sessionMinutes = (now - this.sessionStart) / 60;
    this.evolutionPhase = (Math.sin(sessionMinutes * 0.08) + 1) * 0.5;

    decayAmbientActivity(48);
    this.phraseMemory.tick();
    const store = getControlStore();
    this.applyControls(store.sound, store.modulation);

    for (const voice of this.voices) {
      voice.actor.tick();
      if (now < voice.nextEventAt) {
        continue;
      }

      const gesture = generateNextGesture(
        voice.layer,
        this.session.gestureVocabulary,
        this.harmonic,
        voice.clockBase,
        sessionMinutes,
        this.densityBias,
      );

      if (gesture.allowRest) {
        voice.nextEventAt = now + gesture.delaySec;
        continue;
      }

      if (!shouldLayerPlay(voice.layer, gesture.densityScale, this.session.gestureVocabulary)) {
        voice.nextEventAt = now + gesture.delaySec;
        continue;
      }

      switch (voice.kind) {
        case 'drone':
          this.evolveDrone(voice, now, gesture.surpriseAccent);
          break;
        case 'pad':
          this.evolvePad(voice, now);
          break;
        case 'bell':
          this.evolveBell(voice, now, gesture.surpriseAccent);
          break;
        case 'pluck':
          this.evolvePluck(voice, now, gesture.surpriseAccent);
          break;
        case 'sub':
          this.evolveSub(voice, now);
          break;
        default:
          break;
      }

      voice.nextEventAt = now + gesture.delaySec;
    }

    this.session.tickLiving();
    this.updateGenerativeState(false);
  }

  private evolveDrone(voice: GenerativeVoiceSlot, now: number, surprise: boolean): void {
    const result = this.pickNote(voice, false);
    if (result.kind === 'note') {
      this.crossfadeVoice(voice, result.midi, now, surprise ? 0.38 : 0.28, 3.5);
      voice.degree = result.degree;
    }
  }

  private evolvePad(voice: GenerativeVoiceSlot, now: number): void {
    if (!chance(this.densityBias * 0.85)) {
      return;
    }
    const chord = pickChordVoicing(this.harmonic!);
    voice.actor.release(now, 2.5);
    voice.activeNotes = [];
    const vel = 0.18 + this.evolutionPhase * 0.08;
    chord.forEach((midi, i) => {
      const note = midiToNoteName(midi);
      voice.actor.attack(note, now + i * 0.12, vel);
      voice.activeNotes.push(note);
    });
    pulseAmbientActivity(0.2);
  }

  private evolveBell(voice: GenerativeVoiceSlot, now: number, surprise: boolean): void {
    if (!chance(this.densityBias * 0.55)) {
      return;
    }
    const result = this.pickNote(voice, true);
    if (result.kind === 'note') {
      const note = midiToNoteName(result.midi);
      const dur = surprise ? 3.8 + Math.random() * 2.5 : 2.8 + Math.random() * 2;
      const vel = surprise ? 0.18 + Math.random() * 0.08 : 0.12 + Math.random() * 0.06;
      voice.actor.attackRelease(note, dur, now, vel);
      voice.degree = result.degree;
      pulseAmbientActivity(surprise ? 0.25 : 0.15);
    } else if (result.kind === 'registerShift') {
      voice.octaveOffset = result.octaveDelta;
    }
  }

  private evolvePluck(voice: GenerativeVoiceSlot, now: number, surprise: boolean): void {
    if (!chance(this.densityBias * 0.45)) {
      return;
    }
    const result = this.pickNote(voice, true);
    if (result.kind === 'note') {
      const note = midiToNoteName(result.midi);
      const dur = surprise ? 1.8 + Math.random() * 1.2 : 1.2 + Math.random();
      voice.actor.attackRelease(note, dur, now, surprise ? 0.14 : 0.08 + Math.random() * 0.04);
      voice.degree = result.degree;
      pulseAmbientActivity(0.1);
    }
  }

  private evolveSub(voice: GenerativeVoiceSlot, now: number): void {
    this.crossfadeVoice(voice, this.harmonic!.droneMidi - 12, now, 0.22, 4);
  }

  private pickNote(voice: GenerativeVoiceSlot, allowPause: boolean) {
    const recalled = this.phraseMemory.recallMotif(this.harmonic!);
    if (recalled && chance(this.session!.gestureVocabulary.melodicContinuity * 0.35)) {
      return { kind: 'note' as const, midi: recalled.midi, degree: recalled.degree };
    }

    const result = pickNextNote(this.harmonic!, voice.degree, voice.octaveOffset, allowPause);
    if (result.kind === 'note') {
      const octave = Math.floor(result.midi / 12);
      const weight = this.phraseMemory.weightForDegree(result.degree, octave);
      if (weight < 0.35 && chance(0.6)) {
        return pickNextNote(this.harmonic!, voice.degree + 1, voice.octaveOffset, allowPause);
      }
      this.phraseMemory.record(result.degree, result.midi);
    }
    return result;
  }

  private triggerDroneVoice(voice: GenerativeVoiceSlot, now: number): void {
    const midi = this.harmonic!.droneMidi + voice.octaveOffset * 12;
    this.crossfadeVoice(voice, midi, now, 0.32, 2.8);
  }

  private triggerPadVoice(voice: GenerativeVoiceSlot, now: number): void {
    const chord = pickChordVoicing(this.harmonic!);
    chord.forEach((midi, i) => {
      const note = midiToNoteName(midi);
      voice.actor.attack(note, now + i * 0.1, 0.2);
      voice.activeNotes.push(note);
    });
  }

  private crossfadeVoice(
    voice: GenerativeVoiceSlot,
    midi: number,
    now: number,
    velocity: number,
    releaseSec: number,
  ): void {
    voice.actor.release(now, releaseSec);
    const note = midiToNoteName(midi);
    voice.actor.attack(note, now, velocity);
    voice.activeNotes = [note];
    this.phraseMemory.record(voice.degree, midi);
  }

  private updateGenerativeState(initial: boolean): void {
    if (!this.harmonic || !this.session) {
      return;
    }
    const padVoices = this.voices.filter((v) => v.kind === 'pad').length;
    const activePads = this.voices.filter((v) => v.kind === 'pad' && v.activeNotes.length > 0).length;
    const routing = this.session.profile.routing;

    patchAmbientGenerativeState({
      active: true,
      voiceDensity: this.densityBias,
      textureAmount: this.session.getTextureAmount(),
      evolutionPhase: this.evolutionPhase,
      harmonicCenter: this.harmonic.rootMidi,
      stereoSpread:
        0.35 +
        this.evolutionPhase * 0.25 +
        this.session.profile.modulation.stereoMovement * 0.2 +
        (routing === 'botanical' ? 0.12 : routing === 'plantasonic' ? 0.08 : 0),
      padEnergy: padVoices > 0 ? activePads / padVoices : 0.3,
      bellActivity: initial ? 0.2 : getAmbientGenerativeState().recentActivity,
      soundWorld: this.session.profile.soundWorld,
    });
  }
}

export const ambientFocusEngine = new AmbientFocusEngine();
