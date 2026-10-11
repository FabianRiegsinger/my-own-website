import type { AnimationAction } from "three";

/**
 * First clip starts at full weight: fading in from weight 0 would blend from the skeleton's
 * bind pose (T-pose) and show a visible snap on load. Later changes cross-fade.
 */
export function switchClip(actions: Record<string, AnimationAction | null>, from: string | null, to: string, fade: number) {
  const next = actions[to];
  if (!next) return;
  if (from === null) {
    next.reset().play();
    return;
  }
  actions[from]?.fadeOut(fade);
  next.reset().fadeIn(fade).play();
}
