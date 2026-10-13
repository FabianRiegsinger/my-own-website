"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, type Group } from "three";
import type { SkillGroup } from "@/content/types";
import { stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

const FONT = "/fonts/inter-600.woff"; // self-hosted: troika would otherwise fetch a font from a CDN
/** Rough text box per character and per line, as a fraction of the font size (Inter SemiBold). */
const CHAR_W = 0.56;
const LINE_H = 1.25;

type Box = { w: number; h: number };

/**
 * Word-cloud layout: biggest words first, each placed at the first free spot along an outward elliptical spiral,
 * so nothing overlaps and the heavy words gather in the middle. Returns centres in the input order.
 */
export function packCloud(boxes: Box[], pad = 0.04): { x: number; y: number }[] {
  const order = boxes.map((_, i) => i).sort((a, b) => boxes[b].w * boxes[b].h - boxes[a].w * boxes[a].h);
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const out: { x: number; y: number }[] = new Array(boxes.length);
  for (const i of order) {
    const { w, h } = boxes[i];
    for (let t = 0; ; t += 0.04) {
      const x = 0.09 * t * Math.cos(t) * 1.8; // wider than tall, like the space beside the text panel
      const y = 0.09 * t * Math.sin(t);
      const free = placed.every((p) => Math.abs(p.x - x) * 2 >= p.w + w + pad || Math.abs(p.y - y) * 2 >= p.h + h + pad);
      if (free) {
        placed.push({ x, y, w, h });
        out[i] = { x, y };
        break;
      }
    }
  }
  return out;
}

/** `n` clearly different colours (golden-angle hues), dark enough to read on the light page. */
export function cloudColors(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `#${new Color().setHSL(((i * 137.508) % 360) / 360, 0.85, 0.36).getHexString()}`);
}

/** Skills page: the skill names as a colourful word cloud behind the figure, each word swaying a little in 3D. */
export function SkillCloud({ skills }: { skills: SkillGroup[] }) {
  const root = useRef<Group>(null);
  const words = useRef<Group>(null);
  const offset = useStationOffset();

  const layout = useMemo(() => {
    const items = skills.flatMap((g) => g.items).map((item) => ({ ...item, size: 0.115 + 0.045 * item.level }));
    const at = packCloud(items.map((it) => ({ w: it.name.length * it.size * CHAR_W, h: it.size * LINE_H })));
    const colors = cloudColors(items.length);
    return items.map((it, i) => ({ ...it, ...at[i], color: colors[i] }));
  }, [skills]);

  useFrame(({ clock }) => {
    if (!root.current || !words.current) return;
    fade(root.current, stationWeight(offset.current, "skills"));
    if (!root.current.visible) return;
    const t = clock.elapsedTime;
    words.current.children.forEach((w, i) => {
      w.rotation.y = 0.18 * Math.sin(t * 0.7 + i);
      w.rotation.x = 0.06 * Math.sin(t * 0.5 + i * 1.3);
      w.position.z = 0.06 * Math.sin(t * 0.9 + i * 0.8);
    });
  });

  // Behind the figure, turned a little, centred in the space right of the text panel. z = -5.6 keeps it outside the
  // floor's contact-shadow capture (10 x 10 around the origin), which would smear it into a grey band.
  return (
    <group ref={root} position={[0.3, 1.35, -5.6]} rotation={[0, 0.15, 0.03]}>
      <group ref={words}>
        {layout.map((w) => (
          <group key={w.name} position={[w.x, w.y, 0]}>
            <Text font={FONT} fontSize={w.size} color={w.color} anchorX="center" anchorY="middle" material-toneMapped={false}>
              {w.name}
            </Text>
          </group>
        ))}
      </group>
    </group>
  );
}
