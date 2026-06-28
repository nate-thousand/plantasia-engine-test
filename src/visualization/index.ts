/** Procedural ASCII visualization engine — public API. */
export { AsciiEngine } from './AsciiEngine';
export { AsciiRenderer, computeGridDimensions } from './AsciiRenderer';
export { CHARACTER_PALETTE, pickChar, pickFromCategories } from './CharacterPalette';
export { ParticleSystem } from './ParticleSystem';
export {
  spawnPlant,
  updatePlant,
  releasePlant,
  drawPlantSegments,
} from './PlantGenerator';
export {
  fallbackTheme,
  getPresetVisualTheme,
  listPresetVisualThemes,
  resolvePresetTheme,
  speciesForOscillator,
} from './PresetVisualThemes';
export type { PresetVisualThemeDefinition } from './PresetVisualThemes';
export { ThemeTransition } from './ThemeTransition';
export { PRESET_VISUAL_THEMES } from './PresetVisualThemes';
export { buildSoundVizParams } from './SoundMapping';
export { applyAudioFeedback, audioParticleRate, noteAudioIntensity } from './AudioFeedback';
export { paintBotanicalScene } from './BotanicalScenes';
export {
  buildSliderVizState,
  sliderSceneIntensity,
  sliderAmbientParticleRate,
} from './SliderVisualEffects';
export * from './NoteEvents';
export * from './MidiEvents';
export type * from './types';
