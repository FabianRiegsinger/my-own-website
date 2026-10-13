import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { BELL, HANDLE, NICHE, WALL } from "./Graduation";
import { TEAM } from "./Team";
import { CUSTOMER, FLEET } from "./Fleet";
import { labelPosition } from "./SkillCloud";
import { layoutLetters, LETTER_COLORS, WORD } from "./ClaudeWord";

const facing = (yaw: number) => new Vector3(Math.sin(yaw), 0, Math.cos(yaw));

describe("graduation wall", () => {
  // Mixamo rigs face +z, so the right hand is on -x; shoulder roughly at (-0.18, 1.42, 0).
  const shoulder = new Vector3(-0.18, 1.42, 0);

  it("hangs the bell in the round niche on Fabian's right, handle within arm's reach", () => {
    const handle = new Vector3(...HANDLE);
    expect(handle.x).toBeLessThan(0);
    expect(handle.distanceTo(shoulder)).toBeGreaterThan(0.35);
    expect(handle.distanceTo(shoulder)).toBeLessThan(0.62);
    expect(Math.hypot(BELL[0] - NICHE.center[0], BELL[1] - NICHE.center[1])).toBeLessThan(NICHE.radius);
  });

  it("the wall stands behind him and is a set piece, not a full backdrop (the colour field stays visible)", () => {
    expect(WALL.z).toBeLessThan(-0.2);
    expect(WALL.width).toBeLessThan(4);
    expect(NICHE.center[0] + NICHE.radius).toBeLessThan(0); // niche beside him, not behind his head
  });
});

describe("ESAS team", () => {
  it("stands around Fabian at talking distance, each facing him", () => {
    expect(TEAM.length).toBeGreaterThanOrEqual(3);
    for (const p of TEAM) {
      const pos = new Vector3(...p.position);
      expect(pos.length()).toBeGreaterThan(1);
      expect(pos.length()).toBeLessThan(2.2);
      expect(facing(p.yaw).dot(pos.clone().negate().normalize())).toBeGreaterThan(0.95);
    }
  });

  it("nobody stands inside anybody else", () => {
    TEAM.forEach((a, i) => TEAM.slice(i + 1).forEach((b) => expect(new Vector3(...a.position).distanceTo(new Vector3(...b.position))).toBeGreaterThan(0.7)));
  });
});

describe("Mobileye fleet", () => {
  it("parks the cars well behind Fabian and the customer, without overlapping", () => {
    expect(FLEET.length).toBeGreaterThanOrEqual(6);
    for (const c of FLEET) {
      const pos = new Vector3(...c.position);
      expect(pos.z).toBeLessThan(-3);
      expect(pos.distanceTo(new Vector3(...CUSTOMER.position))).toBeGreaterThan(3);
    }
    FLEET.forEach((a, i) => FLEET.slice(i + 1).forEach((b) => expect(new Vector3(...a.position).distanceTo(new Vector3(...b.position))).toBeGreaterThan(2.2)));
  });

  it("the customer faces Fabian", () => {
    const pos = new Vector3(...CUSTOMER.position);
    expect(facing(CUSTOMER.yaw).dot(pos.clone().negate().normalize())).toBeGreaterThan(0.95);
  });
});

describe("skill cloud", () => {
  it("labels drift around the figure, never through it, and keep moving", () => {
    for (let i = 0; i < 20; i++)
      for (const t of [0, 3, 9]) {
        const p = labelPosition(i, 20, t);
        expect(Math.hypot(p.x, p.z)).toBeGreaterThan(0.75);
        expect(Math.hypot(p.x, p.z)).toBeLessThan(1.9);
        expect(p.y).toBeGreaterThan(0.25);
        expect(p.y).toBeLessThan(2.3);
      }
    expect(labelPosition(3, 20, 0).distanceTo(labelPosition(3, 20, 4))).toBeGreaterThan(0.1);
  });
});

describe("Claude word", () => {
  it("lays the letters out left to right, centred on the word's origin", () => {
    const xs = layoutLetters([1, 0.4, 0.8], 0.1);
    expect(xs[0]).toBeLessThan(xs[1]);
    expect(xs[1]).toBeLessThan(xs[2]);
    const right = xs[2] + 0.8;
    expect(xs[0] + right).toBeCloseTo(0); // left edge = -right edge
  });

  it("gives every letter of C-l-a-u-d-e its own colour", () => {
    expect(WORD).toBe("Claude");
    expect(new Set(LETTER_COLORS).size).toBe(WORD.length);
  });
});
