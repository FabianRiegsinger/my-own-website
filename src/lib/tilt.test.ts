import { describe, expect, it } from "vitest";
import { tilt } from "./tilt";

describe("tilt", () => {
  it("is flat with the pointer in the centre", () => {
    expect(tilt(0.5, 0.5)).toEqual({ rx: 0, ry: 0 });
  });

  it("turns the panel's face toward the pointer, a few degrees at most", () => {
    expect(tilt(1, 0.5).ry).toBeCloseTo(4); // right edge recedes, face turns right
    expect(tilt(0, 0.5).ry).toBeCloseTo(-4);
    expect(tilt(0.5, 0).rx).toBeCloseTo(4); // top edge recedes, face turns up
    expect(tilt(0.5, 1).rx).toBeCloseTo(-4);
  });

  it("clamps pointers outside the panel", () => {
    expect(tilt(3, -2)).toEqual({ rx: 4, ry: 4 });
  });
});
