import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { BELL, HANDLE, NICHE, WALL } from "./Graduation";
import { TEAM } from "./Team";
import { CUSTOMER, FLEET } from "./Fleet";
import { cloudColors, packCloud } from "./SkillCloud";

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

describe("skill word cloud", () => {
  const boxes = [3, 5, 2, 4, 1, 5, 3, 2, 4, 3, 1, 2, 5, 4, 3, 2, 1, 3, 4, 2].map((level, i) => ({ w: 0.25 * (4 + (i % 7)) * (0.5 + level / 5), h: 0.12 + 0.05 * level }));
  const placed = packCloud(boxes);

  it("places every word without overlapping another", () => {
    expect(placed).toHaveLength(boxes.length);
    placed.forEach((a, i) =>
      placed.slice(i + 1).forEach((b, k) => {
        const j = i + 1 + k;
        const apart = Math.abs(a.x - b.x) * 2 >= boxes[i].w + boxes[j].w - 1e-9 || Math.abs(a.y - b.y) * 2 >= boxes[i].h + boxes[j].h - 1e-9;
        expect(apart).toBe(true);
      }),
    );
  });

  it("packs the biggest words nearest the middle", () => {
    const dist = (i: number) => Math.hypot(placed[i].x, placed[i].y);
    const order = boxes.map((b, i) => i).sort((a, b) => boxes[b].w * boxes[b].h - boxes[a].w * boxes[a].h);
    expect(dist(order[0])).toBeLessThan(dist(order.at(-1)!));
  });

  it("gives every word its own colour", () => {
    const colors = cloudColors(20);
    expect(new Set(colors).size).toBe(20);
  });
});
