"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CanvasTexture, type Group } from "three";
import { FUSION_PLAY, fusionBeats, type Sensor } from "@/lib/fusion";
import { stationWeight } from "@/lib/scroll-map";
import { Colleague, type ColleaguePose } from "../Colleague";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";
import { FusionHologram } from "./FusionHologram";
import { edgeFade } from "./Graduation";

/** Projection table with the fusion hologram, ahead of Fabian on his right (he faces it, laptop in hand). */
export const HOLO: [number, number, number] = [0.75, 0, 0.45];

/**
 * Back wall of the meeting room, behind the team and turned (yaw) so the room reads in depth; fades out at the sides
 * and top like the graduation wall. Floor-to-ceiling glazing in its middle: PANES panes of PANE width, slim frames.
 */
export const ROOM_WALL = { x: 0.4, z: -1.35, width: 3.6, height: 2.8, yaw: 0.35 };
export const GLAZING = { panes: 4, pane: 0.5, height: 2.6, frame: 0.028 };

/** Glass seen from inside: sky fading to haze, a faint far skyline, one soft diagonal reflection. */
function glassTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  const sky = ctx.createLinearGradient(0, 0, 0, c.height);
  sky.addColorStop(0, "#a9c8e4");
  sky.addColorStop(0.62, "#dce8f2");
  sky.addColorStop(1, "#eef2f4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "rgba(150, 165, 180, 0.35)";
  for (let x = 0, i = 0; x < c.width; i++) {
    const w = 10 + ((i * 37) % 23);
    const h = 30 + ((i * 53) % 70);
    ctx.fillRect(x, c.height * 0.66 - h, w, h + c.height * 0.34);
    x += w + 2;
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.beginPath();
  ctx.moveTo(c.width * 0.2, 0);
  ctx.lineTo(c.width * 0.55, 0);
  ctx.lineTo(c.width * 0.05, c.height);
  ctx.lineTo(-c.width * 0.3, c.height);
  ctx.fill();
  return new CanvasTexture(c);
}

/** The angled back wall with its windows. */
function RoomWall() {
  const maps = useMemo(() => ({ wall: edgeFade({ left: 0.22, right: 0.22, top: 0.3, bottom: 0 }), glass: glassTexture() }), []);
  const { panes, pane, height, frame } = GLAZING;
  const span = panes * pane;
  const frameMat = <meshStandardMaterial color="#5a5e65" roughness={0.5} metalness={0.4} />;
  return (
    <group position={[ROOM_WALL.x, 0, ROOM_WALL.z]} rotation-y={ROOM_WALL.yaw}>
      <mesh position-y={ROOM_WALL.height / 2} receiveShadow>
        <planeGeometry args={[ROOM_WALL.width, ROOM_WALL.height]} />
        <meshStandardMaterial color="#f2f2ef" roughness={0.95} alphaMap={maps.wall} transparent depthWrite={false} />
      </mesh>
      {Array.from({ length: panes }, (_, i) => (
        <mesh key={i} position={[-span / 2 + pane * (i + 0.5), height / 2, 0.005]}>
          <planeGeometry args={[pane, height]} />
          <meshStandardMaterial map={maps.glass} roughness={0.15} metalness={0.1} transparent opacity={0.92} depthWrite={false} />
        </mesh>
      ))}
      {Array.from({ length: panes + 1 }, (_, i) => (
        <mesh key={i} position={[-span / 2 + pane * i, height / 2, 0.02]}>
          <boxGeometry args={[frame, height, 0.04]} />
          {frameMat}
        </mesh>
      ))}
      {[frame / 2, height].map((y) => (
        <mesh key={y} position={[0, y, 0.02]}>
          <boxGeometry args={[span + frame, frame, 0.04]} />
          {frameMat}
        </mesh>
      ))}
    </group>
  );
}

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
 * untextured), shipped as its own file so any of them can be swapped independently. Rebuilt from me.glb by
 * scripts/build-colleagues.mjs.
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
        <RoomWall />
        {TEAM.map((m, i) => (
          <Colleague key={m.id} model={m.model} position={m.position} yaw={m.yaw} height={m.height} width={m.width} phase={m.phase} pose={() => poses.current[i]} />
        ))}
      </group>
      <FusionHologram at={HOLO} team={TEAM} beats={beats} />
    </>
  );
}
