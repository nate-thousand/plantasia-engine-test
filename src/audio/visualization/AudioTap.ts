import * as Tone from 'tone';

export type AudioVizFeedback = {
  /** Smoothed RMS amplitude 0–1. */
  amplitude: number;
  /** Instant peak 0–1. */
  peak: number;
  /** Low frequency energy 0–1. */
  bass: number;
  /** Mid frequency energy 0–1. */
  mid: number;
  /** High frequency energy 0–1. */
  treble: number;
  /** Spectral brightness 0–1. */
  brightness: number;
  /** Whether signal exceeds silence threshold. */
  isActive: boolean;
  /** Normalized frequency bins for column rendering. */
  spectrum: number[];
  /** Waveform samples -1..1. */
  waveform: number[];
};

const SILENCE_THRESHOLD = 0.008;

const initialFeedback: AudioVizFeedback = {
  amplitude: 0,
  peak: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  brightness: 0,
  isActive: false,
  spectrum: [],
  waveform: [],
};

/**
 * Taps the Tone.js master output for real-time visualization feedback.
 * Does not modify the audio graph — parallel analyser branch only.
 */
class AudioTap {
  private analyser: AnalyserNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;
  private attached = false;
  private smoothedAmplitude = 0;
  private smoothedPeak = 0;

  attach(): void {
    if (this.attached) {
      return;
    }

    const context = Tone.getContext();
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.72;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;

    Tone.getDestination().connect(this.analyser);

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.fftSize);
    this.attached = true;
  }

  detach(): void {
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    this.frequencyData = null;
    this.timeData = null;
    this.attached = false;
    this.smoothedAmplitude = 0;
    this.smoothedPeak = 0;
  }

  sample(): AudioVizFeedback {
    if (!this.analyser || !this.frequencyData || !this.timeData) {
      return { ...initialFeedback };
    }

    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeData);

    const binCount = this.frequencyData.length;
    let sumSquares = 0;
    let peak = 0;

    for (let i = 0; i < this.timeData.length; i += 1) {
      const sample = (this.timeData[i] - 128) / 128;
      sumSquares += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }

    const rms = Math.sqrt(sumSquares / this.timeData.length);
    const amplitude = Math.min(1, rms * 3.2);
    const peakNorm = Math.min(1, peak * 1.4);

    this.smoothedAmplitude = this.smoothedAmplitude * 0.82 + amplitude * 0.18;
    this.smoothedPeak = this.smoothedPeak * 0.72 + peakNorm * 0.28;

    const bassEnd = Math.floor(binCount * 0.12);
    const midEnd = Math.floor(binCount * 0.45);

    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    let weightedSum = 0;
    let magnitudeSum = 0;

    const spectrum: number[] = [];
    const columnCount = 16;

    for (let i = 0; i < binCount; i += 1) {
      const magnitude = this.frequencyData[i] / 255;
      weightedSum += magnitude * i;
      magnitudeSum += magnitude;

      if (i < bassEnd) {
        bassSum += magnitude;
      } else if (i < midEnd) {
        midSum += magnitude;
      } else {
        trebleSum += magnitude;
      }
    }

    for (let col = 0; col < columnCount; col += 1) {
      const binStart = Math.floor((col / columnCount) * binCount);
      const binEnd = Math.floor(((col + 1) / columnCount) * binCount);
      let colSum = 0;
      for (let b = binStart; b < binEnd; b += 1) {
        colSum += this.frequencyData[b] / 255;
      }
      spectrum.push(Math.min(1, (colSum / Math.max(1, binEnd - binStart)) * 1.8));
    }

    const waveform: number[] = [];
    const waveStep = Math.max(1, Math.floor(this.timeData.length / 16));
    for (let i = 0; i < this.timeData.length; i += waveStep) {
      waveform.push((this.timeData[i] - 128) / 128);
    }

    const bass = Math.min(1, (bassSum / Math.max(1, bassEnd)) * 2.2);
    const mid = Math.min(1, (midSum / Math.max(1, midEnd - bassEnd)) * 2);
    const treble = Math.min(1, (trebleSum / Math.max(1, binCount - midEnd)) * 2.4);
    const brightness = magnitudeSum > 0 ? weightedSum / magnitudeSum / binCount : 0;

    return {
      amplitude: this.smoothedAmplitude,
      peak: this.smoothedPeak,
      bass,
      mid,
      treble,
      brightness: Math.min(1, brightness * 2.5),
      isActive: this.smoothedAmplitude > SILENCE_THRESHOLD || peakNorm > SILENCE_THRESHOLD * 2,
      spectrum,
      waveform,
    };
  }
}

export const audioTap = new AudioTap();

export function startAudioTap(): void {
  audioTap.attach();
}

export function stopAudioTap(): void {
  audioTap.detach();
}

export function sampleAudioFeedback(): AudioVizFeedback {
  return audioTap.sample();
}
