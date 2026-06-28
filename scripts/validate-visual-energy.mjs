/**
 * Pure-function checks for Unified Visual Energy model (Milestone 12B).
 * Run: node scripts/validate-visual-energy.mjs
 */

const SPARSE_IDLE_DENSITY = 0.32;
const PEAK_REACTIVE_DENSITY = 1.35;
const FULL_SCENE_ENERGY_THRESHOLD = 0.22;

const ENERGY_SOURCE_KEYS = [
  'audio',
  'midi',
  'keyboard',
  'pointer',
  'touch',
  'control',
  'preset',
  'ui',
];

const COMBINE_WEIGHTS = {
  audio: 0.28,
  midi: 0.16,
  keyboard: 0.16,
  pointer: 0.1,
  touch: 0.1,
  control: 0.08,
  preset: 0.07,
  ui: 0.05,
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function createSourceEnergyMap() {
  const map = {};
  for (const key of ENERGY_SOURCE_KEYS) {
    map[key] = { current: 0, impulse: 0 };
  }
  return map;
}

function densityFromVisualEnergy(energy) {
  const norm = clamp01(energy);
  return SPARSE_IDLE_DENSITY + norm * (PEAK_REACTIVE_DENSITY - SPARSE_IDLE_DENSITY);
}

function shouldRenderFullScene(energy) {
  return energy >= FULL_SCENE_ENERGY_THRESHOLD;
}

function fullSceneBlend(energy) {
  if (energy <= FULL_SCENE_ENERGY_THRESHOLD) return 0;
  return Math.min(1, (energy - FULL_SCENE_ENERGY_THRESHOLD) / (1 - FULL_SCENE_ENERGY_THRESHOLD));
}

function pulseSourceImpulse(sources, source, amount) {
  const norm = clamp01(amount > 1 ? amount / 127 : amount);
  return {
    ...sources,
    [source]: { ...sources[source], impulse: Math.max(sources[source].impulse, norm) },
  };
}

function sustainTargets(input) {
  const audio =
    input.audio.isActive || input.audio.amplitude > 0.02
      ? clamp01(input.audio.amplitude * 0.85 + input.audio.peak * 0.45)
      : 0;

  let midiSustain = 0;
  let keyboardSustain = 0;
  for (const note of input.activeNotes) {
    const v = clamp01(0.25 + (note.velocity / 127) * 0.75);
    if (note.source === 'midi') {
      midiSustain = Math.max(midiSustain, v);
    } else {
      keyboardSustain = Math.max(keyboardSustain, v);
    }
  }

  const pointerBase = input.isTouch ? 0 : input.pointerActivity;
  const touchBase = input.isTouch ? input.pointerActivity : input.pointerActive ? input.pointerActivity * 0.6 : 0;
  const pointerBoost = input.pointerVelocity * (input.isTouch ? 0.9 : 0.55);

  return {
    audio,
    midi: midiSustain,
    keyboard: keyboardSustain,
    pointer: clamp01(pointerBase + pointerBoost),
    touch: clamp01(touchBase + (input.isTouch ? pointerBoost : 0)),
    control: clamp01(input.sliderCombined * 0.35 + input.sliderDelta * 2.5),
    preset: clamp01(input.presetTransition * 0.85),
    ui: clamp01(input.interactionBoost / 127),
  };
}

function tickUnifiedVisualEnergy(state, input, deltaMs, reduceMotion) {
  const dt = Math.min(deltaMs / 1000, 0.05);
  const motionScale = reduceMotion ? 0.65 : 1;
  const sustains = sustainTargets(input);
  const nextSources = { ...state.sources };

  const IMPULSE_DECAY = {
    audio: 4,
    midi: 3.2,
    keyboard: 3.2,
    pointer: 5.5,
    touch: 4.8,
    control: 4.5,
    preset: 2.8,
    ui: 4,
  };
  const SOURCE_RISE = {
    audio: 6,
    midi: 8,
    keyboard: 8,
    pointer: 7,
    touch: 9,
    control: 6,
    preset: 5,
    ui: 7,
  };
  const SOURCE_FALL = {
    audio: 1.2,
    midi: 1.8,
    keyboard: 1.8,
    pointer: 1.4,
    touch: 1.6,
    control: 2.2,
    preset: 1.5,
    ui: 2,
  };

  for (const key of ENERGY_SOURCE_KEYS) {
    const channel = state.sources[key];
    const decayedImpulse = channel.impulse * Math.exp(-IMPULSE_DECAY[key] * dt * motionScale);
    const target = Math.max(sustains[key], decayedImpulse);
    const rise = SOURCE_RISE[key] * motionScale;
    const fall = SOURCE_FALL[key] * motionScale;
    const rate = target > channel.current ? rise : fall;
    const current = channel.current + (target - channel.current) * Math.min(1, rate * dt);
    nextSources[key] = { current: clamp01(current), impulse: decayedImpulse };
  }

  let combined = 0;
  for (const key of ENERGY_SOURCE_KEYS) {
    combined += nextSources[key].current * COMBINE_WEIGHTS[key];
  }

  return { visualEnergy: clamp01(combined), sources: nextSources };
}

function behaviorFromVisualEnergy(energy, sources) {
  const e = clamp01(energy);
  const control = sources.control.current;
  const preset = sources.preset.current;
  const noteBloom = Math.max(sources.midi.current, sources.keyboard.current);
  return {
    density: densityFromVisualEnergy(e),
    speed: 0.55 + e * 1.3,
    spread: 0.12 + e * 0.88 + noteBloom * 0.15,
    brightness: 0.38 + e * 0.62,
    jitter: e * 0.32 + preset * 0.25 + control * 0.12,
    distortion: clamp01(e * 0.45 + control * 0.5),
    growthRate: 0.25 + e * 0.65 + noteBloom * 0.2,
  };
}

const silentAudio = { isActive: false, amplitude: 0, peak: 0 };

const checks = [
  {
    name: 'idle density at zero energy',
    pass: Math.abs(densityFromVisualEnergy(0) - SPARSE_IDLE_DENSITY) < 0.001,
  },
  {
    name: 'peak density at full energy',
    pass: Math.abs(densityFromVisualEnergy(1) - PEAK_REACTIVE_DENSITY) < 0.001,
  },
  {
    name: 'full scene off below threshold',
    pass: !shouldRenderFullScene(0.1) && shouldRenderFullScene(0.5),
  },
  {
    name: 'full scene blend ramps 0→1',
    pass: fullSceneBlend(0.22) === 0 && fullSceneBlend(1) === 1,
  },
  {
    name: 'keyboard note impulse raises keyboard channel',
    pass: (() => {
      let sources = createSourceEnergyMap();
      sources = pulseSourceImpulse(sources, 'keyboard', 100);
      let state = { visualEnergy: 0, sources };
      const input = {
        audio: silentAudio,
        activeNotes: [{ velocity: 100, source: 'keyboard' }],
        pointerActivity: 0,
        pointerVelocity: 0,
        pointerActive: false,
        isTouch: false,
        sliderCombined: 0,
        sliderDelta: 0,
        presetTransition: 0,
        interactionBoost: 0,
      };
      for (let i = 0; i < 8; i += 1) {
        state = tickUnifiedVisualEnergy(state, input, 16, false);
      }
      return state.sources.keyboard.current > 0.15 && state.visualEnergy > 0.02;
    })(),
  },
  {
    name: 'touch pointer raises touch channel without audio',
    pass: (() => {
      const state = tickUnifiedVisualEnergy(
        { visualEnergy: 0, sources: createSourceEnergyMap() },
        {
          audio: silentAudio,
          activeNotes: [],
          pointerActivity: 0.75,
          pointerVelocity: 0.6,
          pointerActive: true,
          isTouch: true,
          sliderCombined: 0,
          sliderDelta: 0,
          presetTransition: 0,
          interactionBoost: 0,
        },
        32,
        false,
      );
      return state.sources.touch.current > 0.15 && state.visualEnergy > 0.01;
    })(),
  },
  {
    name: 'preset transition raises preset channel',
    pass: (() => {
      let state = { visualEnergy: 0, sources: createSourceEnergyMap() };
      const input = {
        audio: silentAudio,
        activeNotes: [],
        pointerActivity: 0,
        pointerVelocity: 0,
        pointerActive: false,
        isTouch: false,
        sliderCombined: 0,
        sliderDelta: 0,
        presetTransition: 1,
        interactionBoost: 0,
      };
      for (let i = 0; i < 12; i += 1) {
        state = tickUnifiedVisualEnergy(state, input, 16, false);
      }
      return state.sources.preset.current > 0.15;
    })(),
  },
  {
    name: 'energy decays after impulse stops',
    pass: (() => {
      let sources = createSourceEnergyMap();
      sources = pulseSourceImpulse(sources, 'ui', 127);
      let state = { visualEnergy: 0, sources };
      for (let i = 0; i < 120; i += 1) {
        state = tickUnifiedVisualEnergy(
          state,
          {
            audio: silentAudio,
            activeNotes: [],
            pointerActivity: 0,
            pointerVelocity: 0,
            pointerActive: false,
            isTouch: false,
            sliderCombined: 0,
            sliderDelta: 0,
            presetTransition: 0,
            interactionBoost: 0,
          },
          16,
          false,
        );
      }
      return state.visualEnergy < 0.05;
    })(),
  },
  {
    name: 'behavior scales with combined energy',
    pass: (() => {
      const low = behaviorFromVisualEnergy(0.1, createSourceEnergyMap());
      const high = behaviorFromVisualEnergy(0.9, {
        ...createSourceEnergyMap(),
        control: { current: 0.8, impulse: 0 },
        keyboard: { current: 0.7, impulse: 0 },
      });
      return high.density > low.density && high.spread > low.spread && high.growthRate > low.growthRate;
    })(),
  },
  {
    name: 'no input stays near zero',
    pass: (() => {
      const state = tickUnifiedVisualEnergy(
        { visualEnergy: 0, sources: createSourceEnergyMap() },
        {
          audio: silentAudio,
          activeNotes: [],
          pointerActivity: 0,
          pointerVelocity: 0,
          pointerActive: false,
          isTouch: false,
          sliderCombined: 0,
          sliderDelta: 0,
          presetTransition: 0,
          interactionBoost: 0,
        },
        16,
        false,
      );
      return state.visualEnergy < 0.01;
    })(),
  },
];

let failed = 0;
for (const check of checks) {
  if (!check.pass) {
    console.error(`FAIL: ${check.name}`);
    failed += 1;
  } else {
    console.log(`ok: ${check.name}`);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`\n${checks.length} unified visual energy checks passed.`);
