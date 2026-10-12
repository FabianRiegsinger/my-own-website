import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { burst, BURSTS } from "./Fireworks";
import { TEAM } from "./Team";
import { CUSTOMER, FLEET } from "./Fleet";
import { labelPosition } from "./SkillCloud";

const facing = (yaw: number) => new Vector3(Math.sin(yaw), 0, Math.cos(yaw));

describe("fireworks", () => {
  it("bursts high in the sky behind the figure and fade out within their life", () => {
    for (let k = 0; k < BURSTS; k++)
      for (const t of [0, 0.7, 1.9, 5.3, 11.1]) {
        const b = burst(k, t);
        expect(b.center.y).toBeGreaterThan(3);
        expect(b.center.z).toBeLessThan(-6);
        expect(b.age).toBeGreaterThanOrEqual(0);
        if (b.alive) expect(b.age).toBeLessThan(b.life);
      }
  });

  it("keeps firing: some burst is always alive", () => {
    for (let t = 0; t < 12; t += 0.25) expect([...Array(BURSTS).keys()].some((k) => burst(k, t).alive)).toBe(true);
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
