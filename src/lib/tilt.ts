const MAX_DEG = 4;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * CSS rotateX/rotateY (deg) that turn a panel's face toward the pointer.
 * `px`, `py` are the pointer position across the panel, 0..1 from its top-left corner.
 */
export function tilt(px: number, py: number): { rx: number; ry: number } {
  // `+ 0` normalises -0 so a centred pointer reads as flat.
  return { rx: (0.5 - clamp01(py)) * 2 * MAX_DEG + 0, ry: (clamp01(px) - 0.5) * 2 * MAX_DEG + 0 };
}
