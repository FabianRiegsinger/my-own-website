import { MathUtils } from "three";

const { smoothstep } = MathUtils;
/** Rises over [a, b], falls over [c, d]: 0 outside, 1 in between. */
const env = (q: number, a: number, b: number, c: number, d: number) => smoothstep(q, a, b) * (1 - smoothstep(q, c, d));

/** Where the throw sits in the cycle: the wind-up before it needs room. */
export const THROW_AT = 0.15;

/**
 * Celebration beats over one cap-throw cycle (q = 0..1, throw at THROW_AT), each a 0..1 weight:
 * wind up (crouch, arms swung back), toss (arms sweep up into a V with a little hop, hands shaking), then a "yes!"
 * right fist punched at the sky twice, then a breather with the arms down before the next wind-up.
 */
export function cheerBeats(q: number) {
  const hopT = (q - THROW_AT) / 0.09;
  return {
    crouch: env(q, 0.03, 0.13, THROW_AT, 0.2),
    windup: env(q, 0.03, 0.13, 0.13, 0.17),
    up: env(q, 0.14, 0.2, 0.46, 0.56),
    hop: hopT > 0 && hopT < 1 ? Math.sin(Math.PI * hopT) : 0,
    pump: env(q, 0.54, 0.6, 0.8, 0.88),
    /** Two quick punches while pumping. */
    beat: q > 0.6 && q < 0.8 ? Math.max(0, Math.sin((2 * Math.PI * (q - 0.6)) / 0.1)) : 0,
  };
}
