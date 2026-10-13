"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, type Group, MeshStandardMaterial } from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type { Level, SkillGroup } from "@/content/types";
import { stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

/** Inter Bold, printable ASCII (scripts/make-typeface.mjs, OFL). */
const FONT = "/fonts/inter-700.typeface.json";
/**
 * The word cloud hangs 1.6 m behind Fabian, its centre right behind his head as the skills camera sees it: the ray
 * from the camera (0, 2.2, 6.4) through his head (0, 1.65, 0) meets the cloud plane at about (0, 1.5). The unit
 * outline's visual centre sits at (0.15, 0.2), so the group is offset by that. CLOUD_SCALE keeps the right edge on
 * screen; the left part runs behind the frosted panel. Words shrink together until all fit inside the outline.
 */
const CLOUD_SCALE = 0.98;
const CLOUD_X = -0.15 * CLOUD_SCALE;
const CLOUD_Y = 1.5 - 0.2 * CLOUD_SCALE;
const CLOUD_Z = -1.6;
/**
 * His face as the camera sees it on the cloud plane, kept free so no word runs right behind it. The Memoji head's
 * centre is ~1.72 m high; the camera ray through it meets the cloud plane at ~1.6 m (1.25x farther than the head).
 */
const HEAD_SPOT = { x: -CLOUD_X, y: 1.5 - CLOUD_Y, w: 0.55, h: 0.85 }; // head and neck

/** Longest a word may run across the floor (metres); longer names get a smaller font. */
const MAX_LENGTH = 3.6;

type Box = { w: number; h: number };
type Rect = Box & { x: number; y: number };

/** Deterministic pseudo-random so the cloud is the same on every visit. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Skills in a shuffled order, each with its own font size (level plus a random factor) and a horizontal or vertical run. */
export function cloudWords<T extends { name: string; level: Level }>(items: T[]): (T & { size: number; vertical: boolean })[] {
  const order = items.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand(i + 11) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.map((k, i) => {
    const item = items[k];
    const size = (0.09 + 0.036 * item.level) * (0.75 + rand(i + 31) * 0.6);
    // Mostly horizontal: only short names may run vertically, and only some of them.
    return { ...item, size: Math.min(size, MAX_LENGTH / (item.name.length * 0.6)), vertical: item.name.length < 10 && rand(i + 77) < 0.45 };
  });
}

/**
 * Word-cloud layout: biggest boxes first, each at the first free spot along an outward elliptical spiral, so nothing
 * overlaps another word or a `reserved` area and the heavy words gather in the middle. Centres in input order.
 */
export function packCloud(
  boxes: Box[],
  { pad = 0.03, reserved = [] as Rect[], inside = undefined as ((x: number, y: number) => boolean) | undefined } = {},
): { x: number; y: number }[] {
  const order = boxes.map((_, i) => i).sort((a, b) => boxes[b].w * boxes[b].h - boxes[a].w * boxes[a].h);
  const placed: Rect[] = [...reserved];
  const out: { x: number; y: number }[] = new Array(boxes.length);
  for (const i of order) {
    const { w, h } = boxes[i];
    let done = false;
    // Bounded search: a box that never fits throws instead of spinning forever.
    for (let t = 0; t < 600 && !done; t += 0.03) {
      const x = 0.07 * t * Math.cos(t) * 2.4; // wide and low, like a cloud
      const y = 0.07 * t * Math.sin(t);
      const fits = !inside || [-1, 1].every((sx) => [-1, 1].every((sy) => inside(x + (sx * w) / 2, y + (sy * h) / 2)));
      if (fits && placed.every((p) => Math.abs(p.x - x) * 2 >= p.w + w + pad || Math.abs(p.y - y) * 2 >= p.h + h + pad)) {
        placed.push({ x, y, w, h });
        out[i] = { x, y };
        done = true;
      }
    }
    if (!done) throw new Error(`packCloud: no room for box ${i}`);
  }
  return out;
}

/** Cartoon-cloud outline at `scale` (unit cloud ~5.8 wide, ~2.2 tall): a flat base under five rounded puffs. */
const PUFFS = [
  [-2, -0.05, 0.85],
  [-0.95, 0.35, 1],
  [0.1, 0.3, 1],
  [1.3, 0.25, 0.95],
  [2.2, -0.1, 0.75],
];
export function cloudShape(scale: number): (x: number, y: number) => boolean {
  return (x, y) => {
    const [u, v] = [x / scale, y / scale];
    return (Math.abs(u) <= 2.6 && v >= -0.85 && v <= -0.1) || PUFFS.some(([cx, cy, r]) => (u - cx) ** 2 + (v - cy) ** 2 <= r * r);
  };
}

/** Area of the unit cloud outline (sampled), to size the outline to the words it must hold. */
const UNIT_CLOUD_AREA = (() => {
  const inside = cloudShape(1);
  let n = 0;
  for (let x = -3; x <= 3; x += 0.05) for (let y = -1; y <= 1.4; y += 0.05) if (inside(x, y)) n++;
  return n * 0.05 * 0.05;
})();

/** The site's own colours: accent blue, glow blue, then the violet and peach of the background blobs. */
export const SITE_COLORS = ["#2563eb", "#2f7bf6", "#8b5cf6", "#ffa878"];

/** The site palette at `u` in 0..1 (first to last colour). */
export function sitePalette(u: number): Color {
  const stops = SITE_COLORS.map((c) => new Color(c));
  const t = Math.min(1, Math.max(0, u)) * (stops.length - 1);
  const k = Math.min(Math.floor(t), stops.length - 2);
  return stops[k].clone().lerp(stops[k + 1], t - k);
}

/** `n` shades along the site palette, first to last colour, one per word. */
export function cloudColors(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `#${sitePalette(n === 1 ? 0 : i / (n - 1)).getHexString()}`);
}

/** Skills page: the skill names as a cloud of extruded words behind Fabian. */
export function SkillCloud({ skills }: { skills: SkillGroup[] }) {
  const root = useRef<Group>(null);
  const offset = useStationOffset();
  const font = useLoader(FontLoader, FONT);

  const words = useMemo(() => {
    const items = cloudWords(skills.flatMap((g) => g.items));
    const colors = cloudColors(items.length);
    const built = items.map((it) => {
      const geometry = new TextGeometry(it.name, {
        font,
        size: it.size,
        depth: it.size * 0.22,
        curveSegments: 5,
        bevelEnabled: true,
        bevelThickness: it.size * 0.05,
        bevelSize: it.size * 0.035,
        bevelSegments: 2,
      });
      geometry.computeBoundingBox();
      const b = geometry.boundingBox!;
      geometry.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0);
      const [len, height] = [b.max.x - b.min.x, b.max.y - b.min.y];
      return { ...it, geometry, box: it.vertical ? { w: height, h: len } : { w: len, h: height } };
    });
    // Fit the words into the fixed outline: start from a size that would fill ~half of it, shrink until all fit.
    const inside = cloudShape(CLOUD_SCALE);
    const free = UNIT_CLOUD_AREA * CLOUD_SCALE ** 2;
    let k = Math.sqrt((0.5 * free) / built.reduce((a, w) => a + w.box.w * w.box.h, 0));
    let at: { x: number; y: number }[] | null = null;
    for (let tries = 0; !at; tries++, k *= 0.92) {
      try {
        at = packCloud(
          built.map((w) => ({ w: w.box.w * k, h: w.box.h * k })),
          { inside, reserved: [HEAD_SPOT] },
        );
      } catch (e) {
        if (tries > 15) throw e;
      }
    }
    return built.map((w, i) => ({ ...w, ...at[i], scale: k, material: new MeshStandardMaterial({ color: colors[i], roughness: 0.45 }) }));
  }, [skills, font]);

  useFrame(({ size }) => {
    if (!root.current) return;
    fade(root.current, stationWeight(offset.current, "skills"));
    // Below the lg breakpoint the full-width panel covers the cloud; only stray letters would peek out at its edges.
    if (size.width < 1024) root.current.visible = false;
  });

  // Upright, facing the camera, extruded toward it; vertical words turned a quarter to read bottom to top.
  return (
    <group ref={root} position={[CLOUD_X, CLOUD_Y, CLOUD_Z]}>
      {words.map((w) => (
        <mesh key={w.name} geometry={w.geometry} material={w.material} position={[w.x, w.y, 0]} rotation-z={w.vertical ? Math.PI / 2 : 0} scale={w.scale} castShadow receiveShadow />
      ))}
    </group>
  );
}
