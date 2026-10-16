import { describe, expect, it } from "vitest";
import { COUGHS, coughBeats, sootAt, THUMB_UP } from "./cough";

describe("cough then thumbs-up", () => {
  it("raises the fist to the mouth before the first cough and lowers it after the last", () => {
    expect(coughBeats(COUGHS[0] - 0.05).fist).toBe(1);
    expect(coughBeats(2.2).fist).toBe(0);
  });

  it("coughs three times: a sharp peak shortly after each beat, quiet in between", () => {
    for (const c of COUGHS) expect(coughBeats(c + 0.06).hack).toBeGreaterThan(0.8);
    expect(coughBeats(COUGHS[0] - 0.05).hack).toBe(0);
    expect(coughBeats(COUGHS[1] - 0.01).hack).toBeLessThan(0.2);
  });

  it("ends on a held thumbs-up, with nothing else left over", () => {
    for (const t of [THUMB_UP, 5, 30]) {
      const b = coughBeats(t);
      expect(b.thumb).toBe(1);
      expect(b.fist + b.hunch).toBe(0);
      expect(b.hack).toBeLessThan(0.01);
    }
    expect(coughBeats(-1)).toEqual({ fist: 0, hack: 0, hunch: 0, thumb: 0 });
  });
});

describe("soot", () => {
  it("covers a fair share of the body in smudges, not all of it", () => {
    let dirty = 0;
    let n = 0;
    for (let y = 0.05; y < 1.8; y += 0.05) for (let z = -0.25; z <= 0.25; z += 0.05) for (const x of [-0.12, 0.15]) {
      n++;
      if (sootAt(x, y, z) > 0.2) dirty++;
    }
    expect(dirty / n).toBeGreaterThan(0.1);
    expect(dirty / n).toBeLessThan(0.45);
  });

  it("keeps the eyes, mouth and chin clean, and the rest of the face light", () => {
    for (let y = 1.24; y < 1.65; y += 0.02) for (let z = -0.15; z <= 0.15; z += 0.03) expect(sootAt(0.2, y, z)).toBeLessThan(y > 1.4 && y < 1.42 ? 0.45 : 0.15);
    for (let y = 1.25; y < 1.8; y += 0.03) for (let z = -0.2; z <= 0.2; z += 0.04) expect(sootAt(-0.1, y, z)).toBeLessThan(0.45);
  });
});
