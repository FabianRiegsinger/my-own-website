import { MathUtils } from "three";

const { smoothstep } = MathUtils;

/** Seconds into the contact-page sequence at which he coughs. */
export const COUGHS = [0.45, 0.9, 1.35];
/** The thumbs-up is fully up by this time (s) and then held. */
export const THUMB_UP = 2.6;

/**
 * Soot-and-cough sequence on the contact page, after the launch (`t` = seconds since he arrived), each a 0..1 weight:
 * right fist up to the mouth, three coughs (a sharp jerk that dies away), a slight hunch through them, then the fist
 * comes down and rises again as a thumbs-up, held with a proud head tilt.
 */
export function coughBeats(t: number) {
  if (t < 0) return { fist: 0, hack: 0, hunch: 0, thumb: 0 };
  // Each cough: near-instant attack, quick decay; the strongest of the three wins.
  const hack = Math.max(
    ...COUGHS.map((c) => {
      const a = t - c;
      return a > 0 ? (1 - Math.exp(-a / 0.03)) * Math.exp(-a / 0.14) : 0;
    }),
  );
  return {
    fist: smoothstep(t, 0, 0.35) * (1 - smoothstep(t, 1.75, 2.1)),
    hack: hack / 0.57, // peak of the attack-decay curve (at ~0.05 s), so each cough reaches 1
    hunch: smoothstep(t, 0.2, 0.45) * (1 - smoothstep(t, 1.6, 2.1)),
    thumb: smoothstep(t, 2.1, THUMB_UP),
  };
}

/**
 * Soot on his body at a point (metres, his model frame: facing +x, feet at y = 0): soft dark smudges from a layered
 * sine pattern (smudges a few cm across), kept off the eyes. 0 = clean, up to 0.85.
 */
export function sootAt(x: number, y: number, z: number) {
  const n = (Math.sin(29 * x + 1.3) + Math.sin(23 * y + 0.7) + Math.sin(31 * z + 2.1) + Math.sin(13 * (x + y) - 11 * z + 0.4)) / 8 + 0.5;
  // Face: only light smudges, and none round the eyes or the mouth and chin (there it would read as a beard).
  const front = x > 0.08;
  const face = y < 1.22 ? 1 : front && y < 1.66 && (y > 1.42 || y < 1.4) ? 0.15 : 0.5;
  return 0.85 * smoothstep(n, 0.5, 0.68) * face;
}
