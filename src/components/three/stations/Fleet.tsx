"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BoxGeometry, CanvasTexture, CylinderGeometry, type Group, MeshStandardMaterial, RepeatWrapping } from "three";
import { stationWeight } from "@/lib/scroll-map";
import { Colleague, type ColleaguePose } from "../Colleague";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";
import { sedanGeometry } from "./FusionHologram";
import { edgeFade } from "./Graduation";
import { nodAt } from "./Team";

type Spot = { position: [number, number, number]; yaw: number };

/** The customer (an AUDI engineer), a step to Fabian's side, facing him. */
export const CUSTOMER = { position: [-1, 0, -0.2] as [number, number, number], yaw: Math.atan2(1, 0.2) };

/** Three test cars nosed into angled bays behind the conversation, side profile toward the camera. */
export const FLEET: Spot[] = [
  { position: [-2.9, 0, -5.8], yaw: 0.9 },
  { position: [-0.5, 0, -6.4], yaw: 0.9 },
  { position: [1.9, 0, -7], yaw: 0.9 },
];

/** Back wall of the test garage, a roller door behind each bay; fades out at the sides and top like the ESAS wall. */
export const GARAGE = { z: -9, x: -0.5, width: 11, height: 3.4, door: { width: 2, height: 2.3 } };

/** Hologram units (0.5 long) to a car a little under life size, as the rest of the Memoji-scale scene. */
const CAR_SCALE = 5.8;

/** Unbadged white sedan (the ESAS hologram's profile) with a roof sensor rack: an automated-driving test car. */
function TestCar({ position, yaw, parts }: Spot & { parts: ReturnType<typeof useParts> }) {
  const { g, m } = parts;
  return (
    // Built in hologram units, front at +x; turned so `yaw` 0 faces +z like everyone else.
    <group position={position} rotation-y={yaw}>
      <group rotation-y={-Math.PI / 2} scale={CAR_SCALE}>
        <mesh geometry={g.shell} material={m.paint} castShadow receiveShadow />
        {/* Glass a touch wider than the body, so it shows on both sides. */}
        <mesh geometry={g.pane} material={m.glass} scale-z={1.06} />
        <mesh geometry={g.rack} material={m.sensor} position={[0, 0.193, 0]} />
        <mesh geometry={g.lidar} material={m.sensor} position={[0, 0.204, 0]} />
        <mesh geometry={g.ring} material={m.accent} position={[0, 0.206, 0]} />
        {[-0.05, 0.05].map((z) => (
          <mesh key={z} geometry={g.camera} material={m.sensor} position={[0.045, 0.197, z]} />
        ))}
        {[-0.15, 0.15].flatMap((x) =>
          [-0.1, 0.1].map((z) => (
            <group key={`${x}${z}`} position={[x, 0.045, z]} rotation-x={Math.PI / 2}>
              <mesh geometry={g.wheel} material={m.tyre} castShadow />
              <mesh geometry={g.rim} material={m.rim} position-y={z > 0 ? -0.018 : 0.018} />
            </group>
          )),
        )}
        {[-0.07, 0.07].flatMap((z) => [
          <mesh key={`h${z}`} geometry={g.lamp} material={m.head} position={[0.257, 0.09, z]} />,
          <mesh key={`t${z}`} geometry={g.lamp} material={m.tail} position={[-0.257, 0.09, z]} />,
        ])}
      </group>
    </group>
  );
}

/** Horizontal slats for the roller doors, tiled up the door. */
function slats() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#e4e6eb";
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "#c3c7d0";
  ctx.fillRect(0, 58, 64, 6);
  const t = new CanvasTexture(c);
  t.wrapT = RepeatWrapping;
  t.repeat.set(1, 14);
  return t;
}

/** The back wall with a roller door behind each car, and the floor with painted bay lines between them. */
function Garage() {
  const maps = useMemo(
    () => ({
      wall: edgeFade({ left: 0.2, right: 0.2, top: 0.3, bottom: 0 }),
      floor: edgeFade({ left: 0.25, right: 0.25, top: 0.3, bottom: 0.4 }),
      slats: slats(),
    }),
    [],
  );
  const { z, x, width, height, door } = GARAGE;
  // Bay lines halfway between neighbouring cars and past the outer two, along the cars' heading.
  const step = FLEET[1].position.map((v, i) => v - FLEET[0].position[i]);
  const lines = [...FLEET.map((c) => c.position.map((v, i) => v - step[i] / 2)), FLEET.at(-1)!.position.map((v, i) => v + step[i] / 2)];
  const yaw = FLEET[0].yaw;
  return (
    <>
      <group position={[x, 0, z]}>
        <mesh position-y={height / 2} receiveShadow>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color="#f1f2f4" roughness={0.95} alphaMap={maps.wall} transparent depthWrite={false} />
        </mesh>
        {FLEET.map((c) => (
          <mesh key={c.position[0]} position={[c.position[0] - x, door.height / 2, 0.01]}>
            <planeGeometry args={[door.width, door.height]} />
            <meshStandardMaterial map={maps.slats} roughness={0.7} transparent />
          </mesh>
        ))}
      </group>
      <mesh rotation-x={-Math.PI / 2} position={[x, -0.002, -3.4]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#e6e8ec" roughness={0.9} alphaMap={maps.floor} transparent depthWrite={false} />
      </mesh>
      {lines.map((p, i) => (
        // Pulled back a little so each bay's front stays open toward the conversation.
        <mesh key={i} rotation={[-Math.PI / 2, 0, yaw]} position={[p[0] - 0.4 * Math.sin(yaw), 0.001, p[2] - 0.4 * Math.cos(yaw)]}>
          <planeGeometry args={[0.08, 4.6]} />
          <meshStandardMaterial color="#7f8bd8" roughness={0.8} transparent />
        </mesh>
      ))}
    </>
  );
}

function useParts() {
  return useMemo(() => {
    const { shell, pane } = sedanGeometry();
    return {
      g: {
        shell,
        pane,
        rack: new BoxGeometry(0.06, 0.006, 0.17),
        lidar: new CylinderGeometry(0.013, 0.013, 0.018, 24),
        ring: new CylinderGeometry(0.0135, 0.0135, 0.004, 24),
        camera: new BoxGeometry(0.012, 0.008, 0.012),
        wheel: new CylinderGeometry(0.045, 0.045, 0.03, 24),
        rim: new CylinderGeometry(0.028, 0.028, 0.002, 20),
        lamp: new BoxGeometry(0.008, 0.016, 0.045),
      },
      m: {
        paint: new MeshStandardMaterial({ color: "#f4f5f7", roughness: 0.3 }),
        // Standard materials only: a clearcoat shader compiles on first sight and stalls the scroll.
        glass: new MeshStandardMaterial({ color: "#3a4656", roughness: 0.08, metalness: 0.5 }),
        sensor: new MeshStandardMaterial({ color: "#2a2c31", roughness: 0.5 }),
        accent: new MeshStandardMaterial({ color: "#2563eb", emissive: "#2563eb", emissiveIntensity: 0.9 }),
        tyre: new MeshStandardMaterial({ color: "#1d1d1f", roughness: 0.9 }),
        rim: new MeshStandardMaterial({ color: "#c9ccd1", metalness: 0.7, roughness: 0.3 }),
        head: new MeshStandardMaterial({ color: "#ffffff", emissive: "#fff6d8", emissiveIntensity: 0.8 }),
        tail: new MeshStandardMaterial({ color: "#ff4d5a", emissive: "#ff4d5a", emissiveIntensity: 0.6 }),
      },
    };
  }, []);
}

/** Mobileye: walking the customer (AUDI) through the test fleet in its garage, tablet in hand. No brand marks. */
export function Fleet() {
  const root = useRef<Group>(null);
  const offset = useStationOffset();
  const parts = useParts();
  const pose = useRef<ColleaguePose>({ point: 0, think: 0, nod: 0, thumb: 0 });
  useFrame(({ clock }) => {
    if (root.current) fade(root.current, stationWeight(offset.current, "mobileye"));
    pose.current.nod = nodAt(clock.elapsedTime, 0.8);
  });
  return (
    <group ref={root}>
      <Garage />
      {/* Clay like the ESAS team, so every person on the site but Fabian reads as one cast. */}
      <Colleague model="/models/colleague-camera.glb" {...CUSTOMER} height={1.84} width={1.05} head={0.85} phase={0.8} pose={() => pose.current} />
      {FLEET.map((s, i) => (
        <TestCar key={i} {...s} parts={parts} />
      ))}
    </group>
  );
}
