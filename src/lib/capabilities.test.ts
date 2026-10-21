import { describe, it, expect } from "vitest";
import { canRender3D } from "./capabilities";

describe("canRender3D", () => {
  it("needs WebGL", () => expect(canRender3D({ hasWebGL: false })).toBe(false));
  it("renders 3D with WebGL", () => expect(canRender3D({ hasWebGL: true })).toBe(true));
});
