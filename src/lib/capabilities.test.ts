import { describe, it, expect } from "vitest";
import { canRender3D } from "./capabilities";

describe("canRender3D", () => {
  it("needs WebGL", () => expect(canRender3D({ hasWebGL: false, reducedMotion: false })).toBe(false));
  it("respects reduced motion", () => expect(canRender3D({ hasWebGL: true, reducedMotion: true })).toBe(false));
  it("renders 3D otherwise", () => expect(canRender3D({ hasWebGL: true, reducedMotion: false })).toBe(true));
});
