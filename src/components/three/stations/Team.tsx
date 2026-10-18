"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { FUSION_PLAY, fusionBeats, type Sensor } from "@/lib/fusion";
import { stationWeight } from "@/lib/scroll-map";
import { Colleague, type ColleaguePose } from "../Colleague";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";
import { FusionHologram } from "./FusionHologram";

/** Projection table with the fusion hologram, ahead of Fabian on his right (he faces it, laptop in hand). */
export const HOLO: [number, number, number] = [0.75, 0, 0.45];

export interface Member {
  /** Stable handle for this character; the sensor stream they own in the demo. */
  id: Sensor;
  /** The character's own model file: replace it (or point here at another GLB) to swap the character. */
  model: string;
  position: [number, number, number];
  yaw: number;
  height: number;
  width: number;
  phase: number;
}

const member = (id: Sensor, model: string, x: number, z: number, height: number, width: number, phase: number): Member => ({
  id,
  model,
  position: [x, 0, z],
  yaw: Math.atan2(HOLO[0] - x, HOLO[2] - z), // facing the table
  height,
  width,
  phase,
});

/**
 * The ESAS team, one entry per character. Each is a sculpted copy of Fabian's mesh (own haircut and face, no glasses,
 * untextured), shipped as its own file so any of them can be swapped independently.
 */
export const TEAM: Member[] = [
  member("camera", "/models/colleague-camera.glb", 1.35, -0.35, 1.86, 1.1, 0.4), // buzz cut, square jaw
  member("lidar", "/models/colleague-lidar.glb", 0.55, -0.75, 1.7, 0.9, 1.3), // smooth bob, narrow face
  member("radar", "/models/colleague-radar.glb", -0.55, -0.55, 1.79, 1.14, 2.2), // curls and beard
];

/** ESAS: Fabian demos his sensor fusion on a hologram; each colleague owns one sensor stream. */
export function Team() {
  const root = useRef<Group>(null);
  const offset = useStationOffset();
  const poses = useRef(TEAM.map((): ColleaguePose => ({ point: 0, think: 0, nod: 0, thumb: 0 })));
  const beats = useRef(fusionBeats(0));
  const onPage = useRef(0);

  useFrame((_, dt) => {
    const w = stationWeight(offset.current, "esas");
    if (root.current) fade(root.current, w);
    // Plays once from arrival (scroll snaps the page still, so time drives it, not scroll), resets on leaving.
    onPage.current = w > 0.5 ? onPage.current + dt : 0;
    const b = (beats.current = fusionBeats(onPage.current / FUSION_PLAY));
    poses.current.forEach((p, i) => {
      p.point = b.point[i];
      p.think = i === 1 ? b.think : 0; // the lidar owner stops to think when the streams disagree
      p.nod = b.nod;
      p.thumb = b.thumb;
    });
  });

  // The hologram fades itself: its opacities also follow the demo's beats, which `fade` would overwrite.
  return (
    <>
      <group ref={root}>
        {TEAM.map((m, i) => (
          <Colleague key={m.id} model={m.model} position={m.position} yaw={m.yaw} height={m.height} width={m.width} phase={m.phase} pose={() => poses.current[i]} />
        ))}
      </group>
      <FusionHologram at={HOLO} team={TEAM} beats={beats} />
    </>
  );
}
