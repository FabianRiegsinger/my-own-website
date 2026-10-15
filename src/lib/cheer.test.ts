import { describe, expect, it } from "vitest";
import { cheerBeats, THROW_AT } from "./cheer";

const at = (q: number) => cheerBeats(q);

describe("celebration beats", () => {
  it("winds up before the throw, arms up with a hop on it", () => {
    expect(at(THROW_AT - 0.03).crouch).toBeGreaterThan(0.9);
    expect(at(THROW_AT - 0.03).windup).toBeGreaterThan(0.9);
    expect(at(THROW_AT + 0.045).hop).toBeGreaterThan(0.9);
    expect(at(0.3).up).toBe(1);
  });

  it("does not hold the arms up: fist pump, then a breather with nothing raised", () => {
    expect(at(0.7).up).toBe(0);
    expect(at(0.7).pump).toBe(1);
    const rest = at(0.95);
    expect(Math.max(rest.crouch, rest.windup, rest.up, rest.hop, rest.pump)).toBe(0);
  });

  it("loops without a jump: start and end of the cycle match", () => {
    expect(at(0)).toEqual(at(1));
  });
});
