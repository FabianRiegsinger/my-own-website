"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { Pose } from "@/lib/entrance";
import { stationWeight } from "@/lib/scroll-map";
import type { Palette } from "../avatar";
import { fade } from "../fade";
import { Person } from "../Person";
import { useStationOffset } from "../station-offset";

const at = (x: number, z: number, palette: Palette, pose: Partial<Pose>, phase: number) => ({
  position: [x, 0, z] as [number, number, number],
  yaw: Math.atan2(-x, -z), // facing Fabian at the origin
  palette,
  pose,
  phase,
});

const look = (shirt: string, trousers: string, skin: string, jacket = shirt): Palette => ({ skin, shirt, jacket, trousers, shoes: "#2b2b30" });

/** Colleagues in a tight half circle around him and the laptop, never nearer the camera than Fabian. */
export const TEAM = [
  at(-1.05, -0.25, look("#d9d4c7", "#3d4350", "#e8c4a6"), { think: 1 }, 0.3),
  at(1.1, -0.2, look("#9aa5b1", "#2b2f36", "#c99a74"), { hips: 1 }, 1.1),
  at(0.6, -1.05, look("#e6e6ea", "#30343c", "#a8775a", "#5a5f6b"), { wave: 0.35 }, 1.9),
  at(-0.55, -1.1, look("#b7c9b3", "#4a4038", "#f0cfb5"), {}, 2.6),
];

/** ESAS: talking a technical point through with the team, laptop in hand. */
export function Team() {
  const root = useRef<Group>(null);
  const offset = useStationOffset();
  useFrame(() => {
    if (root.current) fade(root.current, stationWeight(offset.current, "esas"));
  });
  return (
    <group ref={root}>
      {TEAM.map((p, i) => (
        <Person key={i} {...p} />
      ))}
    </group>
  );
}
