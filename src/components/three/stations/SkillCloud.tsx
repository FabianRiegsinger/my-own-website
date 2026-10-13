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
/** The word wall stands just behind Fabian, a little right of him (away from the text panel), on the floor. */
const CLOUD_X = 0.25;
const CLOUD_Z = -1.6;
/** Longest a word may run across the floor (metres); longer names get a smaller font. */
const MAX_LENGTH = 3;

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
    const size = (0.07 + 0.028 * item.level) * (0.75 + rand(i + 31) * 0.6);
    return { ...item, size: Math.min(size, MAX_LENGTH / (item.name.length * 0.6)), vertical: rand(i + 77) < 0.4 };
  });
}

/**
 * Word-cloud layout: biggest boxes first, each at the first free spot along an outward elliptical spiral, so nothing
 * overlaps another word or a `reserved` area and the heavy words gather in the middle. Centres in input order.
 */
export function packCloud(boxes: Box[], { pad = 0.05, reserved = [] as Rect[] } = {}): { x: number; y: number }[] {
  const order = boxes.map((_, i) => i).sort((a, b) => boxes[b].w * boxes[b].h - boxes[a].w * boxes[a].h);
  const placed: Rect[] = [...reserved];
  const out: { x: number; y: number }[] = new Array(boxes.length);
  for (const i of order) {
    const { w, h } = boxes[i];
    let done = false;
    // Bounded search: a box that never fits throws instead of spinning forever.
    for (let t = 0; t < 600 && !done; t += 0.03) {
      const x = 0.07 * t * Math.cos(t) * 1.7; // wider than tall, like the space beside the text panel
      const y = 0.07 * t * Math.sin(t);
      if (placed.every((p) => Math.abs(p.x - x) * 2 >= p.w + w + pad || Math.abs(p.y - y) * 2 >= p.h + h + pad)) {
        placed.push({ x, y, w, h });
        out[i] = { x, y };
        done = true;
      }
    }
    if (!done) throw new Error(`packCloud: no room for box ${i}`);
  }
  return out;
}

/** `n` clearly different colours (golden-angle hues), dark enough to read on the light page. */
export function cloudColors(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `#${new Color().setHSL(((i * 137.508) % 360) / 360, 0.75, 0.45).getHexString()}`);
}

/** Skills page: the skill names as an upright wall of extruded words behind Fabian, every word its own colour. */
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
    const at = packCloud(built.map((w) => w.box));
    // Stand the wall on the floor: lift it so its lowest word just clears the ground.
    const lift = 0.04 - Math.min(...at.map((p, i) => p.y - built[i].box.h / 2));
    return built.map((w, i) => ({ ...w, x: at[i].x, y: at[i].y + lift, material: new MeshStandardMaterial({ color: colors[i], roughness: 0.45 }) }));
  }, [skills, font]);

  useFrame(() => {
    if (root.current) fade(root.current, stationWeight(offset.current, "skills"));
  });

  // Upright, facing the camera, extruded toward it; vertical words turned a quarter to read bottom to top.
  return (
    <group ref={root} position={[CLOUD_X, 0, CLOUD_Z]}>
      {words.map((w) => (
        <mesh key={w.name} geometry={w.geometry} material={w.material} position={[w.x, w.y, 0]} rotation-z={w.vertical ? Math.PI / 2 : 0} castShadow receiveShadow />
      ))}
    </group>
  );
}
