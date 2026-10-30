"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
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
 * and top like the graduation wall. Floor-to-ceiling glazing in its middle: clear, uncoloured panes in slim frames.
 */
export const ROOM_WALL = { x: 0.4, z: -1.35, width: 3.6, height: 2.8, yaw: 0.35 };
export const GLAZING = { panes: 4, pane: 0.5, height: 2.6, frame: 0.028 };

/** The angled back wall with its windows. */
function RoomWall() {
  const wallFade = useMemo(() => edgeFade({ left: 0.22, right: 0.22, top: 0.3, bottom: 0 }), []);
  const { panes, pane, height, frame } = GLAZING;
  const span = panes * pane;
  const frameMat = <meshStandardMaterial color="#b4b8be" roughness={0.6} />;
  return (
    <group position={[ROOM_WALL.x, 0, ROOM_WALL.z]} rotation-y={ROOM_WALL.yaw}>
      <mesh position-y={ROOM_WALL.height / 2} receiveShadow>
        <planeGeometry args={[ROOM_WALL.width, ROOM_WALL.height]} />
        <meshStandardMaterial color="#f2f2ef" roughness={0.95} alphaMap={wallFade} transparent depthWrite={false} />
      </mesh>
      {Array.from({ length: panes }, (_, i) => (
        <mesh key={i} position={[-span / 2 + pane * (i + 0.5), height / 2, 0.005]}>
          <planeGeometry args={[pane, height]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} transparent opacity={0.25} depthWrite={false} />
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
  /** Head size against the body, see Colleague. */
  head: number;
  /** Seeds their breathing and when they nod, so the group never moves in step. */
  phase: number;
}

const member = (id: Sensor, model: string, x: number, z: number, height: number, width: number, head: number, phase: number): Member => ({
  id,
  model,
  position: [x, 0, z],
  yaw: Math.atan2(HOLO[0] - x, HOLO[2] - z), // facing the table
  height,
  width,
  head,
  phase,
});

/** 0..1: a short nod now and then, at irregular moments that differ per `seed` (pure: no state to keep). */
export function nodAt(t: number, seed: number) {
  const SLOT = 5;
  const NOD = 1.6;
  const k = Math.floor(t / SLOT);
  const r = (n: number) => {
    const v = Math.sin(k * 12.9898 + seed * 78.233 + n * 37.719) * 43758.5453;
    return v - Math.floor(v);
  };
  if (r(1) < 0.4) return 0; // some slots pass without a nod
  const s = t - k * SLOT - r(2) * (SLOT - NOD);
  return s > 0 && s < NOD ? Math.sin((Math.PI * s) / NOD) : 0;
}

/**
 * The ESAS team, one entry per character. Each is a sculpted copy of Fabian's mesh (own haircut and face, no glasses,
 * untextured), shipped as its own file so any of them can be swapped independently. Rebuilt from me.glb by
 * scripts/build-colleagues.mjs.
 */
export const TEAM: Member[] = [
  member("camera", "/models/colleague-camera.glb", 1.35, -0.35, 1.86, 1.1, 1, 0.4), // buzz cut, square jaw
  member("lidar", "/models/colleague-lidar.glb", 0.55, -0.75, 1.7, 0.9, 1, 1.3), // smooth bob, narrow face
  member("radar", "/models/colleague-radar.glb", -0.55, -0.55, 1.79, 1.14, 0.8, 2.2), // short soft waves, ears showing, more human head
];

/** ESAS: Fabian demos his sensor fusion on a hologram; each colleague owns one sensor stream. */
export function Team({ labels }: { labels: { fused: string; sensors: string[] } }) {
  const root = useRef<Group>(null);
  const offset = useStationOffset();
  const poses = useRef(TEAM.map((): ColleaguePose => ({ point: 0, think: 0, nod: 0, thumb: 0 })));
  const beats = useRef(fusionBeats(0));
  const onPage = useRef(0);

  useFrame(({ clock }, dt) => {
    const w = stationWeight(offset.current, "esas");
    if (root.current) fade(root.current, w);
    // Plays once from arrival (scroll snaps the page still, so time drives it, not scroll), resets on leaving.
    onPage.current = w > 0.5 ? onPage.current + dt : 0;
    beats.current = fusionBeats(onPage.current / FUSION_PLAY);
    // The team only looks on, nodding now and then; the demo itself is Fabian's.
    poses.current.forEach((p, i) => {
      p.nod = nodAt(clock.elapsedTime, TEAM[i].phase);
    });
  });

  // The hologram fades itself: its opacities also follow the demo's beats, which `fade` would overwrite.
  return (
    <>
      <group ref={root}>
        <RoomWall />
        {TEAM.map((m, i) => (
          <Colleague key={m.id} model={m.model} position={m.position} yaw={m.yaw} height={m.height} width={m.width} head={m.head} phase={m.phase} pose={() => poses.current[i]} />
        ))}
      </group>
      <FusionHologram at={HOLO} team={TEAM} beats={beats} labels={labels} />
    </>
  );
}
