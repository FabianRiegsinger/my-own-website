/** No input for this long and the 3D scene drops to the idle frame rate. Longer than the camera takes to settle. */
export const IDLE_AFTER_MS = 4000;
/** Frame rate while idle: the figure's idle motion still reads smooth, at about half the GPU work of a 60 Hz screen. */
export const IDLE_FPS = 30;

/** Idle once nothing has happened since `lastActive` (ms, may lie in the future to hold full rate until then). */
export function isIdle(now: number, lastActive: number): boolean {
  return now - lastActive > IDLE_AFTER_MS;
}

/**
 * Whether to draw a frame now: every frame while active, at most IDLE_FPS while idle (a little slack, so a 60 Hz
 * screen draws every second frame rather than drifting between every second and every third).
 */
export function shouldDraw(now: number, lastDrawn: number, idle: boolean): boolean {
  return !idle || now - lastDrawn >= 1000 / IDLE_FPS - 4;
}
