"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, type Group, type Points, type PointsMaterial, Vector3 } from "three";
import { stationWeight } from "@/lib/scroll-map";
import { useStationOffset } from "../station-offset";

export const BURSTS = 7;
const SPARKS = 90;
const PERIOD = 2.6;
const LIFE = 1.7;
const COLORS = ["#ff3b30", "#ff9f0a", "#ffd60a", "#34c759", "#0a84ff", "#bf5af2", "#ff375f"];

/** Deterministic pseudo-random so every visit looks the same. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Burst `k` at time `t`: a new spot in the sky behind the figure every cycle, staggered so the sky is never empty. */
export function burst(k: number, t: number) {
  const local = t + (k * PERIOD) / BURSTS;
  const n = Math.floor(local / PERIOD);
  const age = local - n * PERIOD;
  const seed = k * 131 + n * 17;
  return {
    center: new Vector3(-5 + rand(seed) * 11, 3.6 + rand(seed + 1) * 2.6, -9 - rand(seed + 2) * 3),
    age,
    life: LIFE,
    alive: age < LIFE,
    color: COLORS[(k + n) % COLORS.length],
  };
}

/** Fireworks over the graduation: spark balls that spread, droop and fade, behind the figure. */
export function Fireworks() {
  const root = useRef<Group>(null);
  const offset = useStationOffset();
  // One unit direction per spark, shared by every burst.
  const dirs = useMemo(
    () =>
      Array.from({ length: SPARKS }, (_, i) => {
        const u = rand(i + 7) * 2 - 1;
        const a = rand(i + 77) * Math.PI * 2;
        const h = Math.sqrt(1 - u * u);
        return new Vector3(Math.cos(a) * h, u, Math.sin(a) * h);
      }),
    [],
  );
  const geometries = useMemo(() => Array.from({ length: BURSTS }, () => new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(SPARKS * 3), 3))), []);

  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const w = stationWeight(offset.current, "education");
    g.visible = w > 0.01;
    if (!g.visible) return;
    const t = clock.elapsedTime;
    g.children.forEach((child, k) => {
      const b = burst(k, t);
      const points = child as Points;
      const material = points.material as PointsMaterial;
      material.opacity = b.alive ? w * (1 - b.age / b.life) ** 1.5 : 0;
      material.color.set(b.color);
      const spread = 1.6 * (1 - Math.exp(-3.2 * b.age)); // fast pop, then hang
      const pos = points.geometry.getAttribute("position") as BufferAttribute;
      dirs.forEach((d, i) => pos.setXYZ(i, b.center.x + d.x * spread, b.center.y + d.y * spread - 0.6 * b.age * b.age, b.center.z + d.z * spread));
      pos.needsUpdate = true;
    });
  });

  return (
    <group ref={root}>
      {geometries.map((geometry, k) => (
        <points key={k} geometry={geometry} frustumCulled={false}>
          <pointsMaterial size={0.22} transparent depthWrite={false} toneMapped={false} />
        </points>
      ))}
    </group>
  );
}
