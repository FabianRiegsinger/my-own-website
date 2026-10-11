export interface Env {
  hasWebGL: boolean;
  reducedMotion: boolean;
  isMobile: boolean;
}

export function canRender3D(env: Pick<Env, "hasWebGL" | "reducedMotion">): boolean {
  return env.hasWebGL && !env.reducedMotion;
}

export function detectEnv(): Env {
  let hasWebGL = false;
  try {
    const c = document.createElement("canvas");
    hasWebGL = !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {}
  return {
    hasWebGL,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    isMobile: window.matchMedia("(pointer: coarse)").matches,
  };
}
