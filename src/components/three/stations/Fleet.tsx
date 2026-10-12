"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BoxGeometry, CylinderGeometry, type Group, MeshStandardMaterial } from "three";
import { stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { Person } from "../Person";
import { useStationOffset } from "../station-offset";

type Spot = { position: [number, number, number]; yaw: number };

/** The customer, a step to Fabian's side, facing him. */
export const CUSTOMER = { position: [-1, 0, -0.2] as [number, number, number], yaw: Math.atan2(1, 0.2) };

/** Test fleet parked in two diagonal rows behind the conversation. */
export const FLEET: Spot[] = [
  ...[-6.3, -2.5, 1.3, 5.1].map((x) => ({ position: [x, 0, -9] as [number, number, number], yaw: -0.5 })),
  ...[-4.4, -0.6, 3.2].map((x) => ({ position: [x, 0, -13] as [number, number, number], yaw: -0.5 })),
];

/** Unbadged white sedan with a roof sensor rack (lidar puck, cameras): an automated-driving test car. */
function TestCar({ position, yaw, parts }: Spot & { parts: ReturnType<typeof useParts> }) {
  const { g, m } = parts;
  return (
    // Slightly under life size: reads as a fleet in the Memoji-scale scene instead of a wall of cars.
    <group position={position} rotation-y={yaw} scale={0.8}>
      <mesh geometry={g.body} material={m.paint} position-y={0.55} castShadow />
      <mesh geometry={g.cabin} material={m.glass} position={[0, 1.08, -0.15]} castShadow />
      <mesh geometry={g.roof} material={m.paint} position={[0, 1.35, -0.15]} />
      <mesh geometry={g.rack} material={m.sensor} position={[0, 1.4, 0.1]} />
      <mesh geometry={g.lidar} material={m.sensor} position={[0, 1.5, 0.1]} />
      <mesh geometry={g.ring} material={m.accent} position={[0, 1.5, 0.1]} />
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} geometry={g.camera} material={m.sensor} position={[x, 1.43, 0.22]} />
      ))}
      {[-1.4, 1.4].flatMap((z) =>
        [-0.86, 0.86].map((x) => <mesh key={`${x}${z}`} geometry={g.wheel} material={m.tyre} position={[x, 0.34, z]} rotation-z={Math.PI / 2} />),
      )}
    </group>
  );
}

function useParts() {
  return useMemo(
    () => ({
      g: {
        body: new BoxGeometry(1.85, 0.62, 4.5),
        cabin: new BoxGeometry(1.6, 0.52, 2.5),
        roof: new BoxGeometry(1.62, 0.04, 2.0),
        rack: new BoxGeometry(1.4, 0.05, 0.12),
        lidar: new CylinderGeometry(0.11, 0.11, 0.13, 24),
        ring: new CylinderGeometry(0.115, 0.115, 0.025, 24),
        camera: new BoxGeometry(0.1, 0.06, 0.08),
        wheel: new CylinderGeometry(0.34, 0.34, 0.24, 24),
      },
      m: {
        paint: new MeshStandardMaterial({ color: "#f4f5f7", roughness: 0.45 }),
        glass: new MeshStandardMaterial({ color: "#56657a", roughness: 0.15, metalness: 0.3 }),
        sensor: new MeshStandardMaterial({ color: "#2a2c31", roughness: 0.5 }),
        accent: new MeshStandardMaterial({ color: "#2563eb", emissive: "#2563eb", emissiveIntensity: 0.4 }),
        tyre: new MeshStandardMaterial({ color: "#1d1d1f", roughness: 0.9 }),
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
