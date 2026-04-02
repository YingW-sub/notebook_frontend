import confetti from 'canvas-confetti';
import type { Options } from 'canvas-confetti';

/**
 * 登录成功后的烟花 / 礼花效果（canvas-confetti，高 z-index 盖住登录页）
 */
export function playLoginFireworks(): void {
  const count = 240;
  const defaults: Partial<Options> = {
    origin: { y: 0.68 },
    zIndex: 10050,
    disableForReducedMotion: true,
  };

  const fire = (particleRatio: number, opts: Options) => {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  };

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });

  window.setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 90,
      spread: 100,
      startVelocity: 38,
      angle: 60,
    });
    confetti({
      ...defaults,
      particleCount: 90,
      spread: 100,
      startVelocity: 38,
      angle: 120,
    });
  }, 220);
}
