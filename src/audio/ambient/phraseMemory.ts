import type { AmbientHarmonicProfile } from './harmonicProfile';
import { midiToNoteName } from './scales';

const MAX_PHRASE = 8;
const MEMORY_DECAY = 0.92;

/** Short phrase memory — avoids obvious repetition over long sessions. */
export class PhraseMemory {
  private recentDegrees: number[] = [];
  private recentMidis: number[] = [];
  private motifCount = new Map<string, number>();

  record(degree: number, midi: number): void {
    this.recentDegrees.push(degree);
    this.recentMidis.push(midi);
    if (this.recentDegrees.length > MAX_PHRASE) {
      this.recentDegrees.shift();
      this.recentMidis.shift();
    }

    const key = `${degree}:${Math.floor(midi / 12)}`;
    this.motifCount.set(key, (this.motifCount.get(key) ?? 0) + 1);
  }

  /** Penalize recently repeated degrees — returns adjusted pick weight 0–1. */
  weightForDegree(degree: number, octave: number): number {
    const key = `${degree}:${octave}`;
    const count = this.motifCount.get(key) ?? 0;
    const recent = this.recentDegrees.filter((d) => d === degree).length;
    const penalty = count * 0.12 + recent * 0.18;
    return Math.max(0.15, 1 - penalty);
  }

  /** Occasionally revisit a past motif for continuity (not looping). */
  recallMotif(profile: AmbientHarmonicProfile): { midi: number; degree: number } | null {
    if (this.recentMidis.length < 3 || Math.random() > 0.22) {
      return null;
    }
    const idx = Math.floor(Math.random() * this.recentMidis.length);
    const midi = this.recentMidis[idx]!;
    const degree = this.recentDegrees[idx] ?? 0;
    if (Math.abs(midi - profile.droneMidi) > 24) {
      return null;
    }
    return { midi, degree };
  }

  tick(): void {
    for (const [key, count] of this.motifCount.entries()) {
      const next = count * MEMORY_DECAY;
      if (next < 0.35) {
        this.motifCount.delete(key);
      } else {
        this.motifCount.set(key, next);
      }
    }
  }

  reset(): void {
    this.recentDegrees = [];
    this.recentMidis = [];
    this.motifCount.clear();
  }

  lastNoteName(): string | null {
    const last = this.recentMidis[this.recentMidis.length - 1];
    return last != null ? midiToNoteName(last) : null;
  }
}
