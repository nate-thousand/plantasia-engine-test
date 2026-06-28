#!/usr/bin/env node
/**
 * Validates Scriabin musical color theory constants (Milestone 12D).
 * Run: node scripts/validate-musical-color.mjs
 */

const NOTE_COLOR_MAP = {
  C: '#B84A48',
  'C#': '#8068A8',
  D: '#C4A05A',
  'D#': '#8A9098',
  E: '#58A4C4',
  F: '#B04858',
  'F#': '#688EC8',
  G: '#C87848',
  'G#': '#9868A8',
  A: '#68A870',
  'A#': '#B87A8A',
  B: '#506898',
};

const CAMELOT_COLOR_MAP = {
  '1A': { key: 'G# minor', tonic: 'G#' },
  '1B': { key: 'B major', tonic: 'B' },
  '2A': { key: 'D# minor', tonic: 'D#' },
  '2B': { key: 'F# major', tonic: 'F#' },
  '3A': { key: 'A# minor', tonic: 'A#' },
  '3B': { key: 'C# major', tonic: 'C#' },
  '4A': { key: 'F minor', tonic: 'F' },
  '4B': { key: 'G# major', tonic: 'G#' },
  '5A': { key: 'C minor', tonic: 'C' },
  '5B': { key: 'D# major', tonic: 'D#' },
  '6A': { key: 'G minor', tonic: 'G' },
  '6B': { key: 'A# major', tonic: 'A#' },
  '7A': { key: 'D minor', tonic: 'D' },
  '7B': { key: 'F major', tonic: 'F' },
  '8A': { key: 'A minor', tonic: 'A' },
  '8B': { key: 'C major', tonic: 'C' },
  '9A': { key: 'E minor', tonic: 'E' },
  '9B': { key: 'G major', tonic: 'G' },
  '10A': { key: 'B minor', tonic: 'B' },
  '10B': { key: 'D major', tonic: 'D' },
  '11A': { key: 'F# minor', tonic: 'F#' },
  '11B': { key: 'A major', tonic: 'A' },
  '12A': { key: 'C# minor', tonic: 'C#' },
  '12B': { key: 'E major', tonic: 'E' },
};

const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MAJOR_INTERVALS = [0, 4, 7];
const MINOR_INTERVALS = [0, 3, 7];

const errors = [];

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function midiToPitchClass(midi) {
  return PITCH_CLASSES[((midi % 12) + 12) % 12];
}

function addSemitones(root, semitones) {
  const idx = PITCH_CLASSES.indexOf(root);
  return PITCH_CLASSES[(idx + semitones) % 12];
}

function detectTonalCenter(midis) {
  if (midis.length === 0) {
    return { pitchClass: 'C', mode: 'chromatic' };
  }
  if (midis.length === 1) {
    return { pitchClass: midiToPitchClass(midis[0]), mode: 'major' };
  }
  const pitchSet = new Set(midis.map((m) => midiToPitchClass(m)));
  let best = null;
  for (const root of PITCH_CLASSES) {
    for (const mode of ['major', 'minor']) {
      const intervals = mode === 'major' ? MAJOR_INTERVALS : MINOR_INTERVALS;
      const chordPcs = intervals.map((i) => addSemitones(root, i));
      const matchCount = chordPcs.filter((pc) => pitchSet.has(pc)).length;
      if (matchCount >= 3) {
        const score = matchCount * 10;
        if (!best || score > best.score) {
          best = { root, mode, score };
        }
      }
    }
  }
  if (best) {
    return { pitchClass: best.root, mode: best.mode };
  }
  const bassMidi = midis.reduce((a, b) => (a < b ? a : b));
  return { pitchClass: midiToPitchClass(bassMidi), mode: 'major' };
}

assert(Object.keys(NOTE_COLOR_MAP).length === 12, 'NOTE_COLOR_MAP must have 12 pitch classes');
for (const [note, hex] of Object.entries(NOTE_COLOR_MAP)) {
  assert(/^#[0-9A-F]{6}$/i.test(hex), `Invalid hex for ${note}: ${hex}`);
}

assert(Object.keys(CAMELOT_COLOR_MAP).length === 24, 'CAMELOT_COLOR_MAP must have 24 entries');
assert(CAMELOT_COLOR_MAP['8B'].key === 'C major', '8B → C major');
assert(CAMELOT_COLOR_MAP['5A'].key === 'C minor', '5A → C minor');
assert(CAMELOT_COLOR_MAP['9B'].key === 'G major', '9B → G major');
assert(CAMELOT_COLOR_MAP['6A'].key === 'G minor', '6A → G minor');

for (const [code, entry] of Object.entries(CAMELOT_COLOR_MAP)) {
  assert(/^\d{1,2}[AB]$/.test(code), `Invalid Camelot code: ${code}`);
  assert(NOTE_COLOR_MAP[entry.tonic], `Missing tonic color for ${code}`);
}

const single = detectTonalCenter([60]);
assert(single.pitchClass === 'C' && single.mode === 'major', 'Single C → C major center');

const cMajorChord = detectTonalCenter([60, 64, 67]);
assert(cMajorChord.pitchClass === 'C' && cMajorChord.mode === 'major', 'C-E-G → C major');

const gMinorChord = detectTonalCenter([67, 70, 74]);
assert(gMinorChord.pitchClass === 'G' && gMinorChord.mode === 'minor', 'G-Bb-D → G minor');

if (errors.length > 0) {
  console.error('Musical color validation failed:');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log('Musical color validation passed (12 notes, 24 Camelot keys, chord detection).');
