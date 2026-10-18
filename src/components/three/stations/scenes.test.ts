import { describe, expect, it } from "vitest";
import { Color, Vector3 } from "three";
import { STATIONS } from "@/lib/scroll-map";
import { BELL, BELL_HEIGHT, BELL_RADIUS, HANDLE, LOGO, PLAQUE, SWING, NICHE, PLAQUES, terrazzo, WALL } from "./Graduation";
import { existsSync } from "node:fs";
import { SENSORS } from "@/lib/fusion";
import { HOLO, TEAM, nodAt } from "./Team";
import { CUSTOMER, FLEET } from "./Fleet";
import { armSwing, clampRelease, FOG, fogWeight, launchWeight, liftoff, PAD } from "./Launch";
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

  it("the bell hangs inside the recess, clear of its back, and swings without touching its side", () => {
    expect(BELL[2] - BELL_RADIUS).toBeGreaterThan(WALL.z - NICHE.depth);
    // Lip corners at full swing about the crown stay inside the niche's opening.
    const pivot = [BELL[0], BELL[1] + BELL_HEIGHT / 2];
    for (const a of [-SWING.amplitude, SWING.amplitude])
      for (const x of [-BELL_RADIUS, BELL_RADIUS]) {
        const px = pivot[0] + x * Math.cos(a) + BELL_HEIGHT * Math.sin(a);
        const py = pivot[1] + x * Math.sin(a) - BELL_HEIGHT * Math.cos(a);
        expect(Math.hypot(px - NICHE.center[0], py - NICHE.center[1])).toBeLessThan(NICHE.radius);
      }
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

  it("prints the logo top right, above the plaques, twice their size, on the wall and clear of the niche", () => {
    expect(LOGO.width).toBeCloseTo(2 * PLAQUE.width);
    expect(LOGO.position[1] - LOGO.height / 2).toBeGreaterThan(PLAQUES[0].position[1] + PLAQUE.height / 2);
    expect(LOGO.position[0] + LOGO.width / 2).toBeLessThanOrEqual(WALL.x + WALL.width / 2);
    expect(LOGO.position[0] - LOGO.width / 2).toBeGreaterThan(NICHE.center[0] + NICHE.radius);
    expect(LOGO.position[1] + LOGO.height / 2).toBeLessThan(WALL.height);
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
});

describe("ESAS team", () => {
  const holo = new Vector3(...HOLO);

  it("gathers around the hologram table, each facing it, behind Fabian and clear of the table", () => {
    expect(TEAM.length).toBe(3);
    for (const p of TEAM) {
      const pos = new Vector3(...p.position);
      expect(pos.distanceTo(holo)).toBeGreaterThan(0.8);
      expect(pos.distanceTo(holo)).toBeLessThan(1.8);
      expect(facing(p.yaw).dot(holo.clone().sub(pos).normalize())).toBeGreaterThan(0.99);
      expect(pos.z).toBeLessThan(0); // never nearer the camera than Fabian
      expect(pos.x).toBeLessThan(1.5); // on screen right of him, not cut by the edge
    }
  });

  it("nobody stands inside anybody else, Fabian included", () => {
    const all = [new Vector3(), ...TEAM.map((p) => new Vector3(...p.position))];
    all.forEach((a, i) => all.slice(i + 1).forEach((b) => expect(a.distanceTo(b)).toBeGreaterThan(0.7)));
  });

  it("each character is its own model file, so any one can be replaced alone", () => {
    expect(new Set(TEAM.map((p) => p.model)).size).toBe(TEAM.length);
    expect(TEAM.map((p) => p.id)).toEqual([...SENSORS]);
    for (const p of TEAM) expect(existsSync(`public${p.model}`)).toBe(true);
  });

  it("nobody moves in step: each nods now and then, at their own moments", () => {
    expect(new Set(TEAM.map((p) => p.phase)).size).toBe(TEAM.length);
    const nods = TEAM.map((p) => Array.from({ length: 600 }, (_, i) => nodAt(i * 0.1, p.phase)));
    for (const n of nods) {
      const share = n.filter((v) => v > 0).length / n.length;
      expect(share).toBeGreaterThan(0.05); // they do nod
      expect(share).toBeLessThan(0.4); // but only from time to time
      expect(Math.max(...n)).toBeLessThanOrEqual(1);
    }
    expect(nods[0]).not.toEqual(nods[1]);
    expect(nods[1]).not.toEqual(nods[2]);
  });

  it("Fabian faces the table", () => {
    const yaw = STATIONS.find((s) => s.id === "esas")!.yaw;
    expect(facing(yaw).dot(holo.clone().normalize())).toBeGreaterThan(0.95);
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

  it("swings the access arm clear before ignition, and the clamps let go only once it has lifted", () => {
    expect(armSwing(launch.start)).toBe(0);
    const firstMove = [...Array(200)].map((_, i) => launch.start + (i / 200) * (launch.end - launch.start)).find((o) => liftoff(o) > 0)!;
    expect(armSwing(firstMove)).toBe(1);
    expect(clampRelease(firstMove - 0.001)).toBe(0);
    expect(clampRelease(launch.end)).toBe(1);
  });

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
