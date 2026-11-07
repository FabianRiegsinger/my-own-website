import { describe, expect, it } from "vitest";
import { IDLE_AFTER_MS, isIdle, shouldDraw } from "./pace";

describe("isIdle", () => {
  it("stays active until IDLE_AFTER_MS without input", () => {
    expect(isIdle(1000 + IDLE_AFTER_MS, 1000)).toBe(false);
    expect(isIdle(1001 + IDLE_AFTER_MS, 1000)).toBe(true);
  });

  it("holds full rate while lastActive is in the future", () => {
    expect(isIdle(5000, 9000)).toBe(false);
  });
});

describe("shouldDraw", () => {
  it("draws every frame while active", () => {
    expect(shouldDraw(1016, 1000, false)).toBe(true);
  });

  it("draws every second frame of a 60 Hz screen while idle", () => {
    const frames = Array.from({ length: 60 }, (_, i) => i * (1000 / 60));
    let last = -Infinity;
    let drawn = 0;
    for (const t of frames) {
      if (shouldDraw(t, last, true)) {
        last = t;
        drawn++;
      }
    }
    expect(drawn).toBe(30);
  });

  it("draws every fourth frame of a 120 Hz screen while idle", () => {
    const frames = Array.from({ length: 120 }, (_, i) => i * (1000 / 120));
    let last = -Infinity;
    let drawn = 0;
    for (const t of frames) {
      if (shouldDraw(t, last, true)) {
        last = t;
        drawn++;
      }
    }
    expect(drawn).toBe(30);
  });
});
