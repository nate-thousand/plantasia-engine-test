import { ControlGroup } from './ControlGroup';
import { ControlSlider } from './ControlSlider';
import {
  getVizAccessibility,
  patchVizAccessibility,
  prefersReducedMotion,
  subscribeVizAccessibility,
} from '../../stores/visualizationStore';
import { useSyncExternalStore } from 'react';

export function VizControls() {
  const accessibility = useSyncExternalStore(
    subscribeVizAccessibility,
    getVizAccessibility,
    getVizAccessibility,
  );

  return (
    <ControlGroup label="Visual" className="control-group--sliders">
      <ControlSlider
        label="Particles"
        value={accessibility.density}
        onChange={(value) => patchVizAccessibility({ density: value })}
      />
      <ControlSlider
        label="Anim"
        value={accessibility.animationSpeed}
        onChange={(value) => patchVizAccessibility({ animationSpeed: value })}
        disabled={accessibility.reduceMotion}
      />
      <ControlSlider
        label="Contrast"
        value={accessibility.contrast}
        onChange={(value) => patchVizAccessibility({ contrast: value })}
      />
      <label className="control-slider">
        <span className="control-slider__label">Reduce Motion</span>
        <input
          type="checkbox"
          checked={accessibility.reduceMotion}
          onChange={(event) =>
            patchVizAccessibility({ reduceMotion: event.target.checked })
          }
        />
        {prefersReducedMotion() ? (
          <span className="control-slider__value">OS</span>
        ) : null}
      </label>
    </ControlGroup>
  );
}
