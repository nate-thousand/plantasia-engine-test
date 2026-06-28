import gsap from 'gsap';
import type { Container } from 'pixi.js';

let ambientAnimation: gsap.core.Tween | gsap.core.Timeline | null = null;
let lastAmbientActive = false;

/** GSAP choreography — ambient session enter (POC proof path). */
export function tickAmbientChoreography(
  ambientActive: boolean,
  pixiContainer: Container | null,
  reduceMotion: boolean,
): void {
  if (reduceMotion || !pixiContainer) {
    pixiContainer?.scale.set(1);
    if (pixiContainer) {
      pixiContainer.alpha = 1;
    }
    lastAmbientActive = ambientActive;
    return;
  }

  if (ambientActive && !lastAmbientActive) {
    ambientAnimation?.kill();
    pixiContainer.alpha = 0.35;
    pixiContainer.scale.set(0.94);
    ambientAnimation = gsap.timeline();
    ambientAnimation.to(pixiContainer, {
      alpha: 1,
      duration: 1.4,
      ease: 'power2.out',
    });
    ambientAnimation.to(
      pixiContainer.scale,
      {
        x: 1,
        y: 1,
        duration: 1.8,
        ease: 'elastic.out(1, 0.65)',
      },
      0,
    );
  } else if (!ambientActive && lastAmbientActive) {
    ambientAnimation?.kill();
    ambientAnimation = gsap.to(pixiContainer, {
      alpha: 0.88,
      duration: 0.6,
      ease: 'power1.inOut',
    });
  }

  lastAmbientActive = ambientActive;
}

export function disposeAmbientChoreography(): void {
  ambientAnimation?.kill();
  ambientAnimation = null;
  lastAmbientActive = false;
}
