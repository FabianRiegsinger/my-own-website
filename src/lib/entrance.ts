import type { ClipName } from "./scroll-map";

/** Landing choreography timings (seconds) and the off-screen start position (world units, camera at z = 5). */
export const ENTRANCE = { walk: 2.5, turn: 0.6, wave: 3, settle: 0.6, startX: 3.6 } as const;

export interface EntranceState {
  x: number;
  /** Figure rotation.y: -π/2 faces left (walking in), 0 faces the viewer. */
  heading: number;
  clip: ClipName;
  /** Arm overlay weights, 0..1. */
  wave: number;
  hips: number;
  done: boolean;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => v * v * (3 - 2 * v);

/** Where the figure is `t` seconds into the landing: walk in from the right, turn, wave, hands on hips. */
export function entrance(t: number): EntranceState {
  const { walk, turn, wave, settle, startX } = ENTRANCE;
  // Constant pace matches the walk cycle (no foot sliding); the clip cross-fade softens the stop.
  const x = startX * (1 - clamp01(t / walk));
  const heading = (Math.PI / 2) * (ease(clamp01((t - walk) / turn)) - 1);
  const w = t - walk - turn;
  const ramp = 0.3;
  const waving = w <= 0 ? 0 : Math.min(clamp01(w / ramp), clamp01((wave - w) / ramp));
  const hips = ease(clamp01((w - wave) / settle));
  return { x, heading, clip: t < walk ? "walk" : "idle", wave: waving, hips, done: t >= walk + turn + wave + settle };
}

/** Arm overlay for a station's clip once the landing is over. */
export function poseFor(clip: ClipName): { wave: number; hips: number } {
  if (clip === "wave") return { wave: 1, hips: 0 };
  if (clip === "walk") return { wave: 0, hips: 0 };
  return { wave: 0, hips: 1 };
}
