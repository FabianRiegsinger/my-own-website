import { describe, expect, it } from "vitest";
import { Color, Vector3 } from "three";
import { STATIONS } from "@/lib/scroll-map";
import { BELL, CAPS, capFlight, HANDLE, NICHE, PLAQUES, terrazzo, WALL } from "./Graduation";
import { TEAM } from "./Team";
import { CUSTOMER, FLEET } from "./Fleet";
import { FOG, fogWeight, launchWeight, liftoff, PAD } from "./Launch";
import { cloudColor, cloudShape, cloudWords, packCloud, SITE_COLORS } from "./SkillCloud";

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

  it("hangs a plaque per degree on his left, on the wall, clear of the niche and of each other", () => {
    expect(PLAQUES.length).toBe(2);
    for (const p of PLAQUES) {
      expect(p.position[0] - 0.31).toBeGreaterThan(0.2); // left edge clears his body
      expect(p.position[0] + 0.31).toBeLessThan(WALL.x + WALL.width / 2);
      expect(p.position[2]).toBeGreaterThan(WALL.z);
    }
    expect(PLAQUES[0].position[1] - PLAQUES[1].position[1]).toBeGreaterThan(0.31);
  });

  it("scatters terrazzo chips over the whole floor, not just a patch in the middle", () => {
    const pos = terrazzo();
    const xs = pos.filter((_, i) => i % 3 === 0);
    const zs = pos.filter((_, i) => i % 3 === 2);
    expect(xs.length).toBeGreaterThan(1500);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(2.6); // floor is 3 wide
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(1.4); // and 1.8 deep
    expect(Math.min(...zs)).toBeGreaterThanOrEqual(WALL.z);
  });

  it("throws the caps up from above his head at a swing peak, in front of the wall, and lands them", () => {
    const peak = Math.PI / 2 / 2.6;
    CAPS.forEach((_, i) => {
      const start = capFlight(i, peak + CAPS[i].delay);
      expect(start.position[1]).toBeGreaterThan(1.8);
      let highest = 0;
      let landed = false;
      for (let t = peak; t < peak + 2; t += 0.02) {
        const f = capFlight(i, t);
        expect(f.position[2]).toBeGreaterThan(WALL.z);
        highest = Math.max(highest, f.position[1]);
        landed ||= !f.airborne;
      }
      expect(highest).toBeGreaterThan(2.5);
      expect(landed).toBe(true);
    });
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
    expect(FLEET.length).toBeGreaterThanOrEqual(3);
    expect(FLEET.length).toBeLessThanOrEqual(4); // a few cars read as a fleet without crowding the scene
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
  const figure = { x: 0, y: 0, w: 0.9, h: 0.6 };
  const placed = packCloud(boxes, { reserved: [figure] });
  const apart = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    Math.abs(a.x - b.x) * 2 >= a.w + b.w - 1e-9 || Math.abs(a.y - b.y) * 2 >= a.h + b.h - 1e-9;

  it("places every word without overlapping another or the spot where Fabian stands", () => {
    expect(placed).toHaveLength(boxes.length);
    const rects = placed.map((p, i) => ({ ...p, ...boxes[i] }));
    rects.forEach((a, i) => {
      expect(apart(a, figure)).toBe(true);
      rects.slice(i + 1).forEach((b) => expect(apart(a, b)).toBe(true));
    });
  });

  it("cloud outline: puffy, much wider than tall", () => {
    const inside = cloudShape(1);
    expect(inside(0, 0)).toBe(true);
    expect(inside(2.3, 0)).toBe(true); // reaches far sideways
    expect(inside(0, 1.4)).toBe(false); // but not far up
    expect(inside(0, -1.2)).toBe(false);
    expect(inside(3.5, 0)).toBe(false);
  });

  it("keeps every word inside the cloud outline when one is given", () => {
    const inside = cloudShape(1.6);
    const small = boxes.map((b) => ({ w: b.w * 0.6, h: b.h * 0.6 }));
    const at = packCloud(small, { inside });
    at.forEach((p, i) => {
      const { w, h } = small[i];
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) expect(inside(p.x + (dx * w) / 2, p.y + (dy * h) / 2)).toBe(true);
    });
  });

  it("packs the biggest words nearest the middle", () => {
    const dist = (i: number) => Math.hypot(placed[i].x, placed[i].y);
    const order = boxes.map((b, i) => i).sort((a, b) => boxes[b].w * boxes[b].h - boxes[a].w * boxes[a].h);
    expect(dist(order[0])).toBeLessThan(dist(order.at(-1)!));
  });

  it("mostly horizontal: only names shorter than 10 characters may run vertically", () => {
    const names = ["Git", "Linux", "C++", "Python", "Jenkins", "Cursor", "CMake/Conan", "Sensor fusion", "ADAS/AD integration", "Jira/Confluence", "Team coordination", "Vector CANoe", "HTML/CSS", "Claude Code"];
    const words = cloudWords(names.map((name, i) => ({ name, level: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5 })));
    for (const w of words) if (w.name.length >= 10) expect(w.vertical).toBe(false);
    const vertical = words.filter((w) => w.vertical).length;
    expect(vertical).toBeGreaterThan(0);
    expect(vertical).toBeLessThan(words.length / 2);
  });

  it("shuffles the order and varies sizes, deterministically", () => {
    const words = cloudWords([3, 5, 2, 4, 1, 5, 3, 2, 4, 3, 1, 2, 5, 4, 3, 2, 1, 3, 4, 2].map((level, i) => ({ name: `skill${i}`, level: level as 1 | 2 | 3 | 4 | 5 })));
    expect(words.map((w) => w.name)).not.toEqual(words.map((w) => w.name).sort((a, b) => Number(a.slice(5)) - Number(b.slice(5))));
    expect(new Set(words.filter((w) => w.level === 3).map((w) => w.size)).size).toBeGreaterThan(1);
    expect(cloudWords(words)).toEqual(cloudWords(words));
  });

  it("tints words like the page's colour field: blue on the left, through violet, to peach on the right", () => {
    const hue = (hex: string) => new Color(hex).getHSL({ h: 0, s: 0, l: 0 }).h;
    expect(Math.abs(hue(cloudColor(0, 5)) - hue(SITE_COLORS[0]))).toBeLessThan(0.02);
    expect(Math.abs(hue(cloudColor(1, 5)) - hue(SITE_COLORS.at(-1)!))).toBeLessThan(0.02);
  });

  it("strong skills read strongest; lesser ones fade toward the pastel of the glass", () => {
    const l = (hex: string) => new Color(hex).getHSL({ h: 0, s: 0, l: 0 }).l;
    for (const u of [0, 0.5, 1]) {
      expect(l(cloudColor(u, 3))).toBeGreaterThan(l(cloudColor(u, 4)));
      expect(l(cloudColor(u, 4))).toBeGreaterThan(l(cloudColor(u, 5)));
      expect(l(cloudColor(u, 1))).toBeLessThan(0.9); // never washed out to white
    }
    expect(new Set([0, 0.25, 0.5, 0.75, 1].map((u) => cloudColor(u, 4))).size).toBe(5);
  });
});

describe("launch pad", () => {
  const launch = STATIONS.find((s) => s.id === "launch")!;

  it("holds the rocket on the pad while the launch page is read", () => {
    expect(liftoff(launch.start)).toBe(0);
    expect(liftoff((launch.start + launch.end) / 2)).toBe(0);
  });

  it("lifts off late on the page, gathering speed", () => {
    const a = liftoff(launch.end - 0.03);
    const b = liftoff(launch.end - 0.015);
    expect(a).toBeGreaterThan(0);
    expect(b - a).toBeGreaterThan(a);
  });

  it("climbs on an e-curve: a slow start, then each equal scroll step multiplies the speed", () => {
    const climb = (u: number) => liftoff(launch.end - (1 - u) * 0.0405); // u: 0 at ignition .. 1 at the page end
    expect(climb(0.25)).toBeLessThan(0.03 * climb(1)); // still barely off the pad a quarter of the way in
    const steps = [0.4, 0.6, 0.8, 1].map((u, i, a) => climb(u) - climb(i ? a[i - 1] : 0.2));
    const ratios = steps.slice(1).map((s, i) => s / steps[i]);
    for (const r of ratios) expect(r).toBeCloseTo(ratios[0], 1); // constant growth factor = exponential
    expect(ratios[0]).toBeGreaterThan(2);
  });

  it("has left the frame by the time contact begins", () => {
    expect(liftoff(launch.end)).toBeGreaterThanOrEqual(10);
  });

  it("stays out of the skills page (tall, so its lower half sits close to the launch page)", () => {
    expect(launchWeight(launch.start - 0.01)).toBe(0);
    expect(launchWeight(launch.start)).toBe(0);
    expect(launchWeight((launch.start + launch.end) / 2)).toBe(1);
  });

  it("clears the pad and tower away early on the contact page", () => {
    const contact = STATIONS.find((s) => s.id === "contact")!;
    expect(launchWeight(contact.start + 0.02)).toBe(0);
  });

  it("leaves a low fog around his feet from ignition on, through contact", () => {
    expect(fogWeight(launch.start)).toBe(0);
    expect(fogWeight(launch.end)).toBe(1);
    expect(fogWeight(1)).toBe(1);
    // Just over the shoes (~0.1 m), well below the knees.
    expect(FOG.top).toBeGreaterThan(0.1);
    expect(FOG.top).toBeLessThan(0.35);
  });

  it("stands the pad beside Fabian, clear of him", () => {
    expect(Math.hypot(PAD.x, PAD.z)).toBeGreaterThan(0.9);
  });
});
