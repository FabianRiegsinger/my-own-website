import { describe, expect, it } from "vitest";
import { fusionBeats } from "./fusion";

describe("fusion demo beats", () => {
  it("starts empty and ends on one fused track with the team relaxed again", () => {
    const a = fusionBeats(0);
    expect(a.on + a.done + a.thumb + Math.max(...a.sensor)).toBe(0);
    const z = fusionBeats(1);
    expect(z.on).toBe(1);
    expect(z.done).toBe(1);
    expect(Math.max(...z.sensor, ...z.dots, ...z.point)).toBe(0);
    expect(z.thumb).toBe(0);
  });

  it("hands the streams over one after another, each owner pointing while theirs comes up", () => {
    const b = fusionBeats(0.27);
    expect(b.sensor[0]).toBe(1);
    expect(b.sensor[2]).toBe(0);
    expect(b.point[0]).toBeGreaterThan(0.9);
  });

  it("fuses after the detections disagree, then the team signs off", () => {
    expect(fusionBeats(0.53).think).toBeGreaterThan(0.5);
    expect(fusionBeats(0.5).merge).toBe(0);
    expect(fusionBeats(0.8).done).toBe(1);
    expect(fusionBeats(0.92).thumb).toBe(1);
  });
});
