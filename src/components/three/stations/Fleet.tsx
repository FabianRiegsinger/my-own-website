"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BoxGeometry, CylinderGeometry, type Group, MeshStandardMaterial } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { Person } from "../Person";
import { useStationOffset } from "../station-offset";

type Spot = { position: [number, number, number]; yaw: number };

/** The customer, a step to Fabian's side, facing him. */
export const CUSTOMER = { position: [-1, 0, -0.2] as [number, number, number], yaw: Math.atan2(1, 0.2) };

/** A few test cars parked at an angle behind the conversation, staggered in depth. */
export const FLEET: Spot[] = [
  { position: [-2.6, 0, -7.5], yaw: -0.55 },
  { position: [0.6, 0, -8.6], yaw: -0.55 },
  { position: [3.8, 0, -9.7], yaw: -0.55 },
  { position: [7, 0, -10.8], yaw: -0.55 },
];

/** Unbadged white sedan with a roof sensor rack (lidar puck, cameras): an automated-driving test car. */
function TestCar({ position, yaw, parts }: Spot & { parts: ReturnType<typeof useParts> }) {
  const { g, m } = parts;
  return (
    // Slightly under life size: reads as a fleet in the Memoji-scale scene instead of a wall of cars.
    <group position={position} rotation-y={yaw} scale={0.8}>
      <mesh geometry={g.body} material={m.paint} position-y={0.6} castShadow />
      <mesh geometry={g.cabin} material={m.glass} position={[0, 1.1, -0.2]} castShadow />
      <mesh geometry={g.roof} material={m.paint} position={[0, 1.36, -0.25]} />
      <mesh geometry={g.rack} material={m.sensor} position={[0, 1.43, 0.15]} />
      <mesh geometry={g.lidar} material={m.sensor} position={[0, 1.53, 0.15]} />
      <mesh geometry={g.ring} material={m.accent} position={[0, 1.53, 0.15]} />
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} geometry={g.camera} material={m.sensor} position={[x, 1.46, 0.27]} />
      ))}
      {[-1.4, 1.4].flatMap((z) =>
        [-0.84, 0.84].map((x) => (
          <group key={`${x}${z}`} position={[x, 0.32, z]} rotation-z={Math.PI / 2}>
            <mesh geometry={g.wheel} material={m.tyre} />
            <mesh geometry={g.rim} material={m.rim} position-y={x > 0 ? 0.11 : -0.11} />
          </group>
        )),
      )}
    </group>
  );
}

function useParts() {
  return useMemo(
    () => ({
      g: {
        // Rounded panels read as a modern car body instead of stacked crates.
        body: new RoundedBoxGeometry(1.85, 0.62, 4.5, 4, 0.2),
        cabin: new RoundedBoxGeometry(1.58, 0.5, 2.4, 4, 0.18),
        roof: new RoundedBoxGeometry(1.5, 0.07, 1.8, 3, 0.03),
        rack: new BoxGeometry(1.4, 0.05, 0.12),
        lidar: new CylinderGeometry(0.11, 0.11, 0.13, 24),
        ring: new CylinderGeometry(0.115, 0.115, 0.025, 24),
        camera: new BoxGeometry(0.1, 0.06, 0.08),
        wheel: new CylinderGeometry(0.32, 0.32, 0.22, 24),
        rim: new CylinderGeometry(0.2, 0.2, 0.01, 20),
      },
      m: {
        paint: new MeshStandardMaterial({ color: "#f4f5f7", roughness: 0.3 }),
        // Standard materials only: a clearcoat shader compiles on first sight and stalls the scroll.
        glass: new MeshStandardMaterial({ color: "#8fa3b8", roughness: 0.1, metalness: 0.35 }),
        sensor: new MeshStandardMaterial({ color: "#2a2c31", roughness: 0.5 }),
        accent: new MeshStandardMaterial({ color: "#2563eb", emissive: "#2563eb", emissiveIntensity: 0.4 }),
        tyre: new MeshStandardMaterial({ color: "#1d1d1f", roughness: 0.9 }),
        rim: new MeshStandardMaterial({ color: "#c9ccd1", metalness: 0.7, roughness: 0.3 }),
      },
    }),
    [],
  );
}

/** Mobileye: walking the customer (AUDI) through the test fleet, tablet in hand. No brand marks. */
export function Fleet() {
  const root = useRef<Group>(null);
  const offset = useStationOffset();
  const parts = useParts();
  useFrame(() => {
    if (root.current) fade(root.current, stationWeight(offset.current, "mobileye"));
  });
  return (
    <group ref={root}>
      <Person {...CUSTOMER} palette={{ skin: "#eac3a5", shirt: "#eef0f3", jacket: "#2a2d34", trousers: "#2a2d34", shoes: "#141416" }} phase={0.8} />
      {FLEET.map((s, i) => (
        <TestCar key={i} {...s} parts={parts} />
      ))}
    </group>
  );
}
