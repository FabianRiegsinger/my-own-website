/** Graduation cap toss, looping while the education page is in view: seconds and metres. */
export const TOSS = { cycle: 3.2, launch: 0.12, flight: 0.7, peak: 1.3, turns: 2 } as const;

/** Cap height above the head and its spin (radians) `t` seconds into the loop. */
export function capToss(t: number): { height: number; spin: number } {
  const p = (t % TOSS.cycle) / TOSS.cycle;
  const u = (p - TOSS.launch) / TOSS.flight;
  if (u <= 0 || u >= 1) return { height: 0, spin: 0 };
  return { height: 4 * TOSS.peak * u * (1 - u), spin: u * TOSS.turns * Math.PI * 2 };
}
