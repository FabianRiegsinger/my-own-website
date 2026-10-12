import { describe, expect, it } from "vitest";
import { ENTRANCE, entrance, poseFor } from "./entrance";

const { walk, turn, wave, settle, startX } = ENTRANCE;

describe("entrance", () => {
  it("starts off-screen on the right, walking left", () => {
    const s = entrance(0);
    expect(s.x).toBe(startX);
    expect(s.clip).toBe("walk");
    expect(s.heading).toBeCloseTo(-Math.PI / 2);
    expect(s.done).toBe(false);
  });

  it("moves steadily toward the centre while walking", () => {
    expect(entrance(walk / 2).x).toBeLessThan(startX);
    expect(entrance(walk / 2).x).toBeGreaterThan(0);
    expect(entrance(walk).x).toBe(0);
  });

  it("stops in the centre and turns to face the viewer", () => {
    const s = entrance(walk + turn);
    expect(s.x).toBe(0);
    expect(s.clip).toBe("idle");
    expect(s.heading).toBeCloseTo(0);
  });

  it("waves for three seconds after turning", () => {
    expect(wave).toBe(3);
    expect(entrance(walk + turn + wave / 2).pose).toMatchObject({ wave: 1, hips: 0 });
  });

  it("then rests hands on hips and is done", () => {
    const s = entrance(walk + turn + wave + settle);
    expect(s).toMatchObject({ done: true, heading: 0, x: 0 });
    expect(s.pose).toMatchObject({ wave: 0, hips: 1 });
  });
});

describe("poseFor", () => {
  it("maps each page's clip onto exactly one arm overlay at full weight", () => {
    expect(poseFor("wave")).toMatchObject({ wave: 1, hips: 0 });
    expect(poseFor("think")).toMatchObject({ think: 1, hips: 0 });
    expect(poseFor("cheer")).toMatchObject({ cheer: 1, hips: 0 });
    expect(poseFor("laptop")).toMatchObject({ laptop: 1, hips: 0 });
    expect(poseFor("tablet")).toMatchObject({ tablet: 1, hips: 0 });
    expect(poseFor("idle")).toMatchObject({ hips: 1, wave: 0 });
    expect(poseFor("typing")).toMatchObject({ hips: 1 });
    expect(Object.values(poseFor("walk")).every((w) => w === 0)).toBe(true);
    for (const c of ["wave", "think", "cheer", "laptop", "tablet", "idle"] as const) expect(Object.values(poseFor(c)).reduce((a, b) => a + b)).toBe(1);
  });
});
