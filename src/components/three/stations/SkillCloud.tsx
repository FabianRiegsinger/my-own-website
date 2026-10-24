"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, type Group, MeshStandardMaterial } from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type { Level, SkillGroup } from "@/content/types";
import { isDesktop, stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

/** Inter Bold, printable ASCII (scripts/make-typeface.mjs, OFL). */
const FONT = "/fonts/inter-700.typeface.json";
/**
 * The word cloud hangs 1.6 m behind Fabian, its centre right behind his head as the skills camera sees it: the ray
 * from the camera (0, 2.2, 6.4) through his head (0, 1.65, 0) meets the cloud plane at about (0, 1.5). The unit
 * outline's visual centre sits at (0.15, 0.2), so the group is offset by that. CLOUD_SCALE (with the skills page's
 * view shift) keeps the whole cloud between the frosted panel and the right screen edge from 1280 px wide up.
 * Words shrink together until all fit inside the outline.
 */
const CLOUD_SCALE = 0.86;
const CLOUD_X = -0.15 * CLOUD_SCALE;
const CLOUD_Y = 1.5 - 0.2 * CLOUD_SCALE;
const CLOUD_Z = -1.6;
/**
 * Him as the camera sees him on the cloud plane, kept free so no word runs behind him. The plane is 1.25x farther
 * from the camera than he is, so a height y on him lands at 2.2 + (y - 2.2) * 1.25: head and neck (1.45 to 1.8 m)
 * at 1.26 to 1.7, his body from the hips up (0.95 to 1.45 m) at 0.64 to 1.26, arms included in the width.
 */
const HEAD_SPOT = { x: -CLOUD_X, y: 1.48 - CLOUD_Y, w: 0.5, h: 0.48 };
const BODY_SPOT = { x: -CLOUD_X, y: 0.9 - CLOUD_Y, w: 0.8, h: 0.75 };
/** This skill sits centred right above his head; the others pack around it. */
const CROWN = "FlexRay/CAN/Automotive Ethernet";

/** Longest a word may run across the floor (metres); longer names get a smaller font. */
const MAX_LENGTH = 3.6;

type Box = { w: number; h: number };
type Rect = Box & { x: number; y: number };

/** Deterministic pseudo-random so the cloud is the same on every visit. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Seed for the word order, sizes and runs: of the first 40 it packs the current skills densest.
 * shortcut: picked for today's skill list; re-pick (try seeds, compare gaps) when skills change a lot.
 */
const SEED = 31;

/** Skills in a shuffled order, each with its own font size (level plus a random factor) and a horizontal or vertical run. */
export function cloudWords<T extends { name: string; level: Level }>(items: T[], seed = SEED): (T & { size: number; vertical: boolean })[] {
  const order = items.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand(i + 11 + seed) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.map((k, i) => {
    const item = items[k];
    const size = (0.09 + 0.036 * item.level) * (0.75 + rand(i + 31 + seed) * 0.6);
    // Mostly horizontal: only short names may run vertically, and only some of them.
    return { ...item, size: Math.min(size, MAX_LENGTH / (item.name.length * 0.6)), vertical: item.name.length < 10 && rand(i + 77 + seed) < 0.45 };
  });
}

/**
 * Word-cloud layout: biggest boxes first, each at the first free spot along an outward elliptical spiral, so nothing
 * overlaps another word or a `reserved` area and the heavy words gather in the middle. With `compact`, every word then
 * slides toward the middle, across and up or down, until it touches a neighbour, closing the gaps the spiral leaves.
 * Centres in input order.
 */
export function packCloud(
  boxes: Box[],
  {
    pad = 0.03,
    reserved = [] as Rect[],
    inside = undefined as ((x: number, y: number) => boolean) | undefined,
    compact = false,
  } = {},
): { x: number; y: number }[] {
  const order = boxes.map((_, i) => i).sort((a, b) => boxes[b].w * boxes[b].h - boxes[a].w * boxes[a].h);
  const placed: Rect[] = [...reserved];
  const out: Rect[] = new Array(boxes.length);
  const fits = (r: Rect, others: Rect[]) =>
    (!inside || [-1, 1].every((sx) => [-1, 1].every((sy) => inside(r.x + (sx * r.w) / 2, r.y + (sy * r.h) / 2)))) &&
    others.every((p) => Math.abs(p.x - r.x) * 2 >= p.w + r.w + pad || Math.abs(p.y - r.y) * 2 >= p.h + r.h + pad);
  for (const i of order) {
    const { w, h } = boxes[i];
    let done = false;
    // Bounded search: a box that never fits throws instead of spinning forever.
    for (let t = 0; t < 600 && !done; t += 0.03) {
      const r = { x: 0.07 * t * Math.cos(t) * 2.4, y: 0.07 * t * Math.sin(t), w, h }; // wide and low, like a cloud
      if (fits(r, placed)) {
        placed.push(r);
        out[i] = r;
        done = true;
      }
    }
    if (!done) throw new Error(`packCloud: no room for box ${i}`);
  }
  // A few passes, 1 cm steps: a word that moves can free room for one placed after it.
  for (let pass = 0; compact && pass < 20; pass++) {
    for (let i = 0; i < out.length; i++) {
      const others = [...reserved, ...out.filter((_, j) => j !== i)];
      for (const axis of ["x", "y"] as const) {
        const step = -Math.sign(out[i][axis]) * 0.01;
        while (step && Math.abs(out[i][axis]) > 0.01 && fits({ ...out[i], [axis]: out[i][axis] + step }, others)) out[i] = { ...out[i], [axis]: out[i][axis] + step };
      }
    }
  }
  return out.map(({ x, y }) => ({ x, y }));
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

/** The frosted white of the glass panels, lesser skills fade toward it. */
const GLASS = new Color("#f3f1fb");

/**
 * A word's colour: hue from the page's colour field at its place in the cloud (`u`: 0 left .. 1 right, blue through
 * violet to peach, like the background blobs), strength from the skill level: level 5 nearly in full (10% toward the
 * glass), each level below 17% further, so the strongest skills read first and the cloud stays soft.
 */
export function cloudColor(u: number, level: Level): string {
  return `#${sitePalette(u).lerp(GLASS, 0.1 + (5 - level) * 0.17).getHexString()}`;
}

/** Skills page: the skill names as a cloud of extruded words behind Fabian. */
export function SkillCloud({ skills }: { skills: SkillGroup[] }) {
  const root = useRef<Group>(null);
  const offset = useStationOffset();
  const font = useLoader(FontLoader, FONT);

  const words = useMemo(() => {
    const items = cloudWords(skills.flatMap((g) => g.items));
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
    const crown = built.findIndex((w) => w.name === CROWN);
    for (let tries = 0; !at; tries++, k *= 0.97) {
      const boxes = built.map((w) => ({ w: w.box.w * k, h: w.box.h * k }));
      const reserved = [HEAD_SPOT, BODY_SPOT];
      const top = crown < 0 ? null : { x: HEAD_SPOT.x, y: HEAD_SPOT.y + (HEAD_SPOT.h + boxes[crown].h) / 2 + 0.03, ...boxes[crown] };
      if (top) reserved.push(top);
      try {
        // The others pack around the reserved crown spot; the crown word goes back in at its own index.
        const packed = packCloud(boxes.filter((_, i) => i !== crown), { inside, reserved, compact: true });
        at = top ? [...packed.slice(0, crown), { x: top.x, y: top.y }, ...packed.slice(crown)] : packed;
      } catch (e) {
        if (tries > 40) throw e;
      }
    }
    const [left, right] = [Math.min(...at.map((p) => p.x)), Math.max(...at.map((p) => p.x))];
    return built.map((w, i) => {
      const color = cloudColor((at[i].x - left) / (right - left || 1), w.level);
      // A little self-glow keeps the extruded sides from going muddy in shadow.
      return { ...w, ...at[i], scale: k, material: new MeshStandardMaterial({ color, roughness: 0.55, emissive: color, emissiveIntensity: 0.12 }) };
    });
  }, [skills, font]);

  useFrame(({ size }) => {
    if (!root.current) return;
    // Short fade: the launch page after it is shorter than the default fade, the cloud would still ghost behind the rocket.
    fade(root.current, stationWeight(offset.current, "skills"));
    // Without the side-by-side layout the full-width panel covers the cloud; only stray letters would peek out at its edges.
    if (!isDesktop(size)) root.current.visible = false;
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
