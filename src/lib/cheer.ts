import { MathUtils } from "three";

const { smoothstep } = MathUtils;
/** Rises over [a, b], falls over [c, d]: 0 outside, 1 in between. */
const env = (q: number, a: number, b: number, c: number, d: number) => smoothstep(q, a, b) * (1 - smoothstep(q, c, d));

/** One jump for joy every this many seconds. */
export const JUMP_PERIOD = 1.7;
/** Take-off and landing within the cycle. */
const LIFT = 0.3;
const LAND = 0.58;

/**
 * Jump-for-joy beats over one cycle (q = 0..1), each a 0..1 weight: crouch with the arms swung back, spring up with
 * the arms thrown into a V (air: a parabola, 1 at the top), land soft on bent knees, then stand and let the arms down.
 */
export function jumpBeats(q: number) {
  const u = (q - LIFT) / (LAND - LIFT);
  const air = u > 0 && u < 1 ? 4 * u * (1 - u) : 0;
  return {
    crouch: env(q, 0.05, 0.24, 0.26, LIFT) + 0.6 * env(q, LAND - 0.02, LAND + 0.03, LAND + 0.05, LAND + 0.15),
    windup: env(q, 0.05, 0.24, 0.24, LIFT),
    up: env(q, 0.25, 0.33, LAND + 0.05, 0.85),
    air,
  };
}
