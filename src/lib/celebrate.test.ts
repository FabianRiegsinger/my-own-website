import { describe, expect, it } from "vitest";
import { capToss, TOSS } from "./celebrate";

describe("capToss", () => {
  it("sits on the head between tosses", () => {
    expect(capToss(0)).toEqual({ height: 0, spin: 0 });
    expect(capToss(TOSS.cycle * 0.95).height).toBe(0);
  });

  it("flies up to its peak mid-flight and lands back on the head", () => {
    const mid = TOSS.cycle * (TOSS.launch + TOSS.flight / 2);
    expect(capToss(mid).height).toBeCloseTo(TOSS.peak);
    expect(capToss(TOSS.cycle * (TOSS.launch + TOSS.flight) - 1e-6).height).toBeCloseTo(0, 2);
    expect(capToss(mid).spin).toBeGreaterThan(0);
  });

  it("repeats every cycle", () => {
    expect(capToss(TOSS.cycle * 1.4).height).toBeCloseTo(capToss(TOSS.cycle * 0.4).height);
  });
});
