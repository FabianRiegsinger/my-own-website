import { describe, it, expect, vi } from "vitest";
import type { AnimationAction } from "three";
import { switchClip } from "./clips";

function fakeAction() {
  const a = { reset: vi.fn(), play: vi.fn(), fadeIn: vi.fn(), fadeOut: vi.fn() };
  a.reset.mockReturnValue(a);
  a.fadeIn.mockReturnValue(a);
  a.play.mockReturnValue(a);
  return a;
}

describe("switchClip", () => {
  it("starts the first clip at full weight, without fading in from the bind (T) pose", () => {
    const idle = fakeAction();
    switchClip({ idle: idle as unknown as AnimationAction }, null, "idle", 0.4);
    expect(idle.play).toHaveBeenCalled();
    expect(idle.fadeIn).not.toHaveBeenCalled();
  });

  it("cross-fades between clips after that", () => {
    const idle = fakeAction();
    const walk = fakeAction();
    const actions = { idle, walk } as unknown as Record<string, AnimationAction>;
    switchClip(actions, "idle", "walk", 0.4);
    expect(idle.fadeOut).toHaveBeenCalledWith(0.4);
    expect(walk.fadeIn).toHaveBeenCalledWith(0.4);
  });
});
