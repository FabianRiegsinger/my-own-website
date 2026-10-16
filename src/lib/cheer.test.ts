import { describe, expect, it } from "vitest";
import { jumpBeats } from "./cheer";

const at = (q: number) => jumpBeats(q);

describe("jump for joy", () => {
  it("crouches with the arms back before take-off, feet still on the floor", () => {
    expect(at(0.25).crouch).toBeGreaterThan(0.9);
    expect(at(0.25).windup).toBeGreaterThan(0.9);
    expect(at(0.25).air).toBe(0);
  });

  it("is highest mid-flight with the arms up, and lands on bent knees", () => {
    expect(at(0.44).air).toBeGreaterThan(0.99);
    expect(at(0.44).up).toBe(1);
    expect(at(0.44).crouch).toBe(0);
    expect(at(0.62).air).toBe(0);
    expect(at(0.62).crouch).toBeGreaterThan(0.5);
  });

  it("stands at rest with the arms down before the next jump, and loops without a jump", () => {
    const rest = at(0.95);
    expect(Math.max(rest.crouch, rest.windup, rest.up, rest.air)).toBe(0);
    expect(at(0)).toEqual(at(1));
  });
});
