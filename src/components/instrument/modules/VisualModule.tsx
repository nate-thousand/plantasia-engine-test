import { useSyncExternalStore } from 'react';
import { InstrKnob } from '../primitives/InstrKnob';
import { InstrModuleColumn, WsZone } from '../primitives/InstrModuleColumn';
import { InstrSwitch } from '../primitives/InstrSwitch';
import { InstrScope } from '../primitives/InstrScope';
import {
  getVizAccessibility,
  patchVizAccessibility,
  prefersReducedMotion,
  subscribeVizAccessibility,
} from '../../../stores/visualizationStore';

export function VisualModule() {
  const accessibility = useSyncExternalStore(
    subscribeVizAccessibility,
    getVizAccessibility,
    getVizAccessibility,
  );

  const scopeSamples = Array.from({ length: 48 }, (_, i) => {
    const d = accessibility.density / 100;
    const a = accessibility.animationSpeed / 100;
    const c = accessibility.contrast / 100;
    return 0.5 + Math.sin(i * 0.22 * (0.5 + a) + c * 3) * 0.35 * d;
  });

  return (
    <InstrModuleColumn index="03" title="Visual">
      <InstrScope samples={scopeSamples} label="Glyphs" />

      <WsZone label="ASCII">
        <div className="ws-knob-row">
          <InstrKnob
            label="Particles"
            value={accessibility.density}
            onChange={(value) => patchVizAccessibility({ density: value })}
          />
          <InstrKnob
            label="Contrast"
            value={accessibility.contrast}
            onChange={(value) => patchVizAccessibility({ contrast: value })}
          />
        </div>
      </WsZone>

      <WsZone label="Motion">
        <InstrKnob
          label="Anim"
          value={accessibility.animationSpeed}
          disabled={accessibility.reduceMotion}
          onChange={(value) => patchVizAccessibility({ animationSpeed: value })}
        />
      </WsZone>

      <WsZone label="Camera">
        <InstrSwitch
          label="Reduce Motion"
          checked={accessibility.reduceMotion}
          hint={prefersReducedMotion() ? 'OS preference' : undefined}
          onChange={(checked) => patchVizAccessibility({ reduceMotion: checked })}
        />
      </WsZone>
    </InstrModuleColumn>
  );
}
