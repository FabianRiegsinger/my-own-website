import { describe, expect, it } from "vitest";
import { pendulum, pendulumPeriod, sn } from "./pendulum";

describe("pendulum", () => {
  it("sn is the sine at m = 0 and tanh at m = 1", () => {
    for (const u of [0.3, 1.2, 2.5]) {
      expect(sn(u, 0)).toBeCloseTo(Math.sin(u), 10);
      expect(sn(u, 1 - 1e-12)).toBeCloseTo(Math.tanh(u), 5);
    }
  });

  it("small swings are the familiar sine", () => {
    for (const t of [0.2, 0.7, 1.9]) expect(pendulum(t, 0.01, 3)).toBeCloseTo(0.01 * Math.sin(3 * t), 6);
    expect(pendulumPeriod(1e-4, 3)).toBeCloseTo((2 * Math.PI) / 3, 6);
  });

  it("wide swings reach the amplitude at a quarter period, centre at half, and take longer", () => {
    const amp = 0.9;
    const T = pendulumPeriod(amp, 3);
    expect(T).toBeGreaterThan((2 * Math.PI) / 3 * 1.04); // ≈ 1 + amp²/16
    expect(pendulum(T / 4, amp, 3)).toBeCloseTo(amp, 6);
    expect(pendulum(T / 2, amp, 3)).toBeCloseTo(0, 6);
    expect(pendulum((3 * T) / 4, amp, 3)).toBeCloseTo(-amp, 6);
    for (let t = 0; t < T; t += 0.01) expect(Math.abs(pendulum(t, amp, 3))).toBeLessThanOrEqual(amp + 1e-9);
  });

  it("conserves energy: ½θ'² + ω₀²(1 − cos θ) stays constant", () => {
    const amp = 0.9, w = 3, h = 1e-5;
    const energy = (t: number) => {
      const v = (pendulum(t + h, amp, w) - pendulum(t - h, amp, w)) / (2 * h);
      return v * v / 2 + w * w * (1 - Math.cos(pendulum(t, amp, w)));
    };
    for (const t of [0.1, 0.5, 1.3]) expect(energy(t)).toBeCloseTo(w * w * (1 - Math.cos(amp)), 4);
  });
});
