"use client";

import { Edges } from "@react-three/drei";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { Education, Experience } from "@/content/types";
import { STATIONS, stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

const GLOW = "#e10600";
const INK = "#111111";
const SPACING = 5;
const DASHES = 24;
const timeline = STATIONS.find((s) => s.id === "timeline")!;

/** Unbranded low-poly car outline, a nod to the automotive milestones. */
function Car(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh position-y={0.45}>
        <boxGeometry args={[0.8, 0.4, 1.9]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
        <Edges color={INK} />
      </mesh>
      <mesh position={[0, 0.82, -0.1]}>
        <boxGeometry args={[0.7, 0.34, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
        <Edges color={INK} />
      </mesh>
      {[-0.65, 0.65].flatMap((z) =>
        [-0.42, 0.42].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 0.2, z]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.2, 0.2, 0.12, 12]} />
            <meshStandardMaterial color={INK} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Milestone gates (oldest first) come toward the figure as it walks into the distance; cars mark the industry jobs. */
export function Timeline({ experience, education }: { experience: Experience[]; education: Education[] }) {
  const root = useRef<Group>(null);
  const world = useRef<Group>(null);
  const dashes = useRef<Group>(null);
  const offset = useStationOffset();
  const milestones = [...education.map(() => false).reverse(), ...experience.map(() => true).reverse()];
  const length = milestones.length * SPACING;

  useFrame(() => {
    if (!root.current || !world.current || !dashes.current) return;
    fade(root.current, stationWeight(offset.current, "timeline"));
    const p = Math.min(1, Math.max(0, (offset.current - timeline.start) / (timeline.end - timeline.start)));
    const travel = p * length;
    world.current.position.z = travel;
    // Hide milestones once they pass the figure so nothing sweeps across the camera and the text.
    world.current.children.forEach((m) => (m.visible = m.position.z + travel < 1));
    dashes.current.children.forEach((d, i) => {
      d.position.z = ((i * 1.2 + travel) % (DASHES * 1.2)) - DASHES * 0.9;
    });
  });

  return (
    <group ref={root}>
      <group ref={dashes}>
        {Array.from({ length: DASHES }, (_, i) => (
          <mesh key={i} position-y={0.003} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.06, 0.5]} />
            <meshBasicMaterial color={INK} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <group ref={world}>
        {milestones.map((isJob, i) => (
          <group key={i} position-z={-SPACING * (i + 1)}>
            <mesh position-y={1.2}>
              <torusGeometry args={[1.2, 0.012, 8, 64]} />
              <meshBasicMaterial color={GLOW} toneMapped={false} />
            </mesh>
            {isJob && <Car position={[-2.6, 0, 0]} rotation-y={0.3} />}
          </group>
        ))}
      </group>
    </group>
  );
}
