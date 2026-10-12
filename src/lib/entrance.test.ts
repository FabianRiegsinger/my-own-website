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
    expect(entrance(walk + turn + wave / 2)).toMatchObject({ wave: 1, hips: 0, think: 0 });
  });

  it("then rests hands on hips and is done", () => {
    expect(entrance(walk + turn + wave + settle)).toMatchObject({ wave: 0, hips: 1, done: true, heading: 0, x: 0 });
  });
});

describe("poseFor", () => {
  it("waves at the contact station, thinks on the about page, walks arms-free, otherwise hands on hips", () => {
    expect(poseFor("wave")).toEqual({ wave: 1, hips: 0, think: 0 });
    expect(poseFor("think")).toEqual({ wave: 0, hips: 0, think: 1 });
    expect(poseFor("walk")).toEqual({ wave: 0, hips: 0, think: 0 });
    expect(poseFor("idle")).toEqual({ wave: 0, hips: 1, think: 0 });
    expect(poseFor("typing")).toEqual({ wave: 0, hips: 1, think: 0 });
  });
});
