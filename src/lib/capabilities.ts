export interface Env {
  hasWebGL: boolean;
  reducedMotion: boolean;
  isMobile: boolean;
}

/** WebGL is all 3D needs: reduced motion still gets it, calmed (camera cuts, no walk-in; see Experience3D's `calm`). */
export function canRender3D(env: Pick<Env, "hasWebGL">): boolean {
  return env.hasWebGL;
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
