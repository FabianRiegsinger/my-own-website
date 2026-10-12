"use client";

import { Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { type Group, Vector3 } from "three";
import type { SkillGroup } from "@/content/types";
import { stationWeight } from "@/lib/scroll-map";
import { contentRight, duckScale } from "../duck";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

const FONT = "/fonts/inter-600.woff"; // self-hosted: troika would otherwise fetch a font from a CDN

/** Deterministic pseudo-random so every visit looks the same. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Where skill label `i` of `n` floats at time `t`: its own slow orbit and bob around the figure, spread over its height. */
export function labelPosition(i: number, n: number, t: number, out = new Vector3()): Vector3 {
  const r = 1 + rand(i + 300) * 0.85;
  const a = (i / n) * Math.PI * 2 + rand(i) * 0.8 + t * (0.06 + rand(i + 50) * 0.06) * (i % 2 ? 1 : -1);
  const y = 0.45 + ((i * 7) % n) / n * 1.6 + 0.12 * Math.sin(t * 0.6 + i);
  return out.set(Math.cos(a) * r, y, Math.sin(a) * r);
}

/** Skill names floating around the figure, gently tilting in 3D; stronger skills are larger and blue. */
export function SkillCloud({ skills }: { skills: SkillGroup[] }) {
  const root = useRef<Group>(null);
  const labels = useRef<Group>(null);
  const offset = useStationOffset();
  const width = useThree((s) => s.size.width);
  const textEdge = useRef<number | null>(null);
  const items = useMemo(() => skills.flatMap((g) => g.items), [skills]);
  const v = useMemo(() => new Vector3(), []);

  // Desktop only: where the skills text ends on screen. Mobile text sits on its own backdrop.
  useEffect(() => {
    const section = document.getElementById("skills");
    if (!section) return;
    const measure = () => (textEdge.current = window.innerWidth >= 768 ? contentRight(section) : null);
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    return () => ro.disconnect();
  }, []);

  useFrame(({ camera, clock }) => {
    if (!root.current || !labels.current) return;
    fade(root.current, stationWeight(offset.current, "skills"));
    if (!root.current.visible) return;
    const t = clock.elapsedTime;
    labels.current.children.forEach((label, i) => {
      labelPosition(i, items.length, t, label.position);
      // Face the camera, then tilt a little in 3D so the words feel like objects, not stickers.
      label.quaternion.copy(camera.quaternion);
      label.rotateY(0.35 * Math.sin(t * 0.8 + i));
      label.rotateX(0.15 * Math.sin(t * 0.6 + i * 1.7));
      // Words drifting over the skills text shrink away there.
      const px = ((label.getWorldPosition(v).project(camera).x + 1) / 2) * width;
      const s = duckScale(px, textEdge.current);
      label.visible = s > 0;
      label.scale.setScalar(s);
    });
  });

  return (
    <group ref={root}>
      <group ref={labels}>
        {items.map((item) => (
          <Text key={item.name} font={FONT} fontSize={0.035 + 0.012 * item.level} color={item.level >= 4 ? "#2563eb" : "#1d1d1f"} anchorX="center" anchorY="middle">
            {item.name}
          </Text>
        ))}
      </group>
    </group>
  );
}
