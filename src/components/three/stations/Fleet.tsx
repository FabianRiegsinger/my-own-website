"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BoxGeometry, CanvasTexture, CircleGeometry, CylinderGeometry, type Group, MeshStandardMaterial, RepeatWrapping } from "three";
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

/** Test cars nosed into angled bays behind the conversation, side profile toward the camera; the left two stand behind
 *  the text panel, so the row reads as running on past it. */
export const FLEET: Spot[] = [
  { position: [-9.2, 0, -4.6], yaw: 0.9 },
  { position: [-6.8, 0, -5.2], yaw: 0.9 },
  { position: [-4.4, 0, -5.8], yaw: 0.9 },
  { position: [-2, 0, -6.4], yaw: 0.9 },
  { position: [0.4, 0, -7], yaw: 0.9 },
];

/** Back wall of the test garage, a roller door behind each bay; fades out at the sides and top like the ESAS wall. */
export const GARAGE = { z: -9, x: -5.6, width: 18.4, height: 3.4, door: { width: 2, height: 2.3 } };
/** Doors along the wall: one behind each car, and one more bay on the far left still waiting for its car. */
const EMPTY_BAYS = 1;
const BAY = FLEET[1].position[0] - FLEET[0].position[0];
const DOORS = [...Array.from({ length: EMPTY_BAYS }, (_, i) => FLEET[0].position[0] - (EMPTY_BAYS - i) * BAY), ...FLEET.map((c) => c.position[0])];

/** Hologram units (0.5 long) to a car a little under life size, as the rest of the Memoji-scale scene. */
const CAR_SCALE = 5.8;
/** Body bevel, in hologram units: rounds the extruded profile's hard edges. */
const ROUND = 0.014;
/** Half the body's width, bevel included: where the sides are. */
const SIDE = 0.1 + ROUND * 1.25;
/** Front (and, negated, rear) face, where the lamps sit: the profile's 0.25 grown by the bevel. */
const NOSE = 0.25 + ROUND + 0.002;

/** Unbadged white sedan (the ESAS hologram's profile) with a roof sensor rack: an automated-driving test car. */
function TestCar({ position, yaw, parts }: Spot & { parts: ReturnType<typeof useParts> }) {
  const { g, m } = parts;
  return (
    // Built in hologram units, front at +x; turned so `yaw` 0 faces +z like everyone else.
    <group position={position} rotation-y={yaw}>
      <group rotation-y={-Math.PI / 2} scale={CAR_SCALE}>
        <mesh geometry={g.shell} material={m.paint} castShadow receiveShadow />
        {/* Glass a touch proud of the body, so it shows on both sides, split by a body-coloured B-pillar. */}
        <mesh geometry={g.pane} material={m.glass} scale-z={(SIDE + 0.002) / 0.108} />
        <mesh geometry={g.pillar} material={m.paint} position={[0.005, 0.155, 0]} />
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={g.mirror} material={m.paint} position={[0.075, 0.135, s * (SIDE + 0.008)]} />
        ))}
        {/* Dark sill between the wheels and a lower grille: they lift the body off the ground. */}
        <mesh geometry={g.sill} material={m.trim} position={[0, 0.052, 0]} />
        <mesh geometry={g.grille} material={m.trim} position={[NOSE - 0.004, 0.062, 0]} />
        <mesh geometry={g.rack} material={m.sensor} position={[0, 0.193, 0]} />
        <mesh geometry={g.lidar} material={m.sensor} position={[0, 0.204, 0]} />
        <mesh geometry={g.ring} material={m.accent} position={[0, 0.206, 0]} />
        {[-0.05, 0.05].map((z) => (
          <mesh key={z} geometry={g.camera} material={m.sensor} position={[0.045, 0.197, z]} />
        ))}
        {[-0.15, 0.15].map((x) => (
          // Wheel arch: a dark disc through the body, just proud of both sides, behind the wheels.
          <mesh key={x} geometry={g.arch} material={m.trim} position={[x, 0.045, 0]} rotation-x={Math.PI / 2} />
        ))}
        {[-0.15, 0.15].flatMap((x) =>
          [-1, 1].map((s) => (
            <group key={`${x}${s}`} position={[x, 0.045, s * (SIDE - 0.004)]}>
              <mesh geometry={g.wheel} material={m.tyre} rotation-x={Math.PI / 2} castShadow />
              <mesh geometry={g.rim} material={m.rim} position-z={s * 0.0155} rotation-y={s > 0 ? 0 : Math.PI} />
              <mesh geometry={g.hub} material={m.trim} position-z={s * 0.016} rotation-x={Math.PI / 2} />
            </group>
          )),
        )}
        {[-0.07, 0.07].flatMap((z) => [
          <mesh key={`h${z}`} geometry={g.lamp} material={m.head} position={[NOSE, 0.09, z]} />,
          <mesh key={`t${z}`} geometry={g.lamp} material={m.tail} position={[-NOSE, 0.09, z]} />,
        ])}
      </group>
    </group>
  );
}

/** Horizontal slats for the roller doors, tiled up the door: each one lit from above, a groove and a highlight under it. */
function slats() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, "#f2f3f6");
  g.addColorStop(1, "#d9dce3");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "#a9afbb";
  ctx.fillRect(0, 59, 64, 3);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 62, 64, 2);
  const t = new CanvasTexture(c);
  t.wrapT = RepeatWrapping;
  t.repeat.set(1, 16);
  return t;
}

/** Five-spoke alloy face for the wheels: light spokes on a dark ground, round. */
function rimFace() {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.translate(size / 2, size / 2);
  ctx.fillStyle = "#2a2c31";
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = "#d4d7dc";
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
  ctx.arc(0, 0, size / 2 - 7, 0, 2 * Math.PI, true);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    ctx.rotate((2 * Math.PI) / 5);
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-11, size / 2 - 6);
    ctx.lineTo(11, size / 2 - 6);
    ctx.lineTo(5, 0);
    ctx.fill();
  }
  return new CanvasTexture(c);
}

/** A roller door in its frame: slats, a row of small windows, a rubber seal along the floor and a handle. */
function RollerDoor({ x, slatMap, m }: { x: number; slatMap: CanvasTexture; m: ReturnType<typeof useDoorMaterials> }) {
  const { width: w, height: h } = GARAGE.door;
  const frame = 0.09;
  return (
    <group position-x={x}>
      <mesh position={[0, h / 2, 0.01]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={slatMap} roughness={0.55} metalness={0.15} transparent />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.frame} position={[s * (w / 2 + frame / 2), (h + frame) / 2, 0.04]}>
          <boxGeometry args={[frame, h + frame, 0.08]} />
        </mesh>
      ))}
      <mesh material={m.frame} position={[0, h + frame / 2, 0.04]}>
        <boxGeometry args={[w + 2 * frame, frame, 0.08]} />
      </mesh>
      {[-1.5, -0.5, 0.5, 1.5].map((i) => (
        <mesh key={i} material={m.window} position={[i * (w / 4.6), h * 0.68, 0.015]}>
          <planeGeometry args={[w / 5.4, 0.11]} />
        </mesh>
      ))}
      <mesh material={m.seal} position={[0, 0.02, 0.02]}>
        <boxGeometry args={[w, 0.04, 0.03]} />
      </mesh>
      <mesh material={m.seal} position={[0, 0.32, 0.03]}>
        <boxGeometry args={[0.28, 0.035, 0.03]} />
      </mesh>
    </group>
  );
}

function useDoorMaterials() {
  return useMemo(
    () => ({
      frame: new MeshStandardMaterial({ color: "#d5d8de", roughness: 0.6, metalness: 0.2, transparent: true }),
      window: new MeshStandardMaterial({ color: "#7d8a9e", roughness: 0.1, metalness: 0.4, transparent: true }),
      seal: new MeshStandardMaterial({ color: "#2a2c31", roughness: 0.8, transparent: true }),
    }),
    [],
  );
}

/** The back wall with a roller door behind each car, and the floor with painted bay lines between them. */
function Garage() {
  const maps = useMemo(
    () => ({
      // Fades in metres (3.2 m on the wall, 4 m on the floor), so the wall's widening for the extra door keeps them.
      wall: edgeFade({ left: 3.2 / GARAGE.width, right: 3.2 / GARAGE.width, top: 0.3, bottom: 0 }),
      floor: edgeFade({ left: 4 / GARAGE.width, right: 4 / GARAGE.width, top: 0.3, bottom: 0.4 }),
      slats: slats(),
    }),
    [],
  );
  const doorMats = useDoorMaterials();
  const { z, x, width, height } = GARAGE;
  // Bay lines halfway between neighbouring cars and past the outer two, along the cars' heading.
  const step = FLEET[1].position.map((v, i) => v - FLEET[0].position[i]);
  const lines = [
    // the empty bays' lines
    ...Array.from({ length: EMPTY_BAYS }, (_, n) => FLEET[0].position.map((v, i) => v - (n + 1.5) * step[i])),
    ...FLEET.map((c) => c.position.map((v, i) => v - step[i] / 2)),
    FLEET.at(-1)!.position.map((v, i) => v + step[i] / 2),
  ];
  const yaw = FLEET[0].yaw;
  return (
    <>
      <group position={[x, 0, z]}>
        <mesh position-y={height / 2} receiveShadow>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color="#f1f2f4" roughness={0.95} alphaMap={maps.wall} transparent depthWrite={false} />
        </mesh>
        {DOORS.map((d) => (
          <RollerDoor key={d} x={d - x} slatMap={maps.slats} m={doorMats} />
        ))}
      </group>
      <mesh rotation-x={-Math.PI / 2} position={[x, -0.002, -3.4]} receiveShadow>
        <planeGeometry args={[width, 12]} />
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
    const { shell, pane } = sedanGeometry(ROUND);
    return {
      g: {
        shell,
        pane,
        rack: new BoxGeometry(0.06, 0.006, 0.17),
        lidar: new CylinderGeometry(0.013, 0.013, 0.018, 24),
        ring: new CylinderGeometry(0.0135, 0.0135, 0.004, 24),
        camera: new BoxGeometry(0.012, 0.008, 0.012),
        wheel: new CylinderGeometry(0.045, 0.045, 0.03, 32),
        rim: new CircleGeometry(0.031, 32),
        hub: new CylinderGeometry(0.006, 0.006, 0.004, 16),
        arch: new CylinderGeometry(0.054, 0.054, 2 * SIDE + 0.002, 32),
        pillar: new BoxGeometry(0.012, 0.055, 2 * SIDE + 0.006),
        mirror: new BoxGeometry(0.014, 0.011, 0.016),
        sill: new BoxGeometry(0.2, 0.009, 2 * SIDE + 0.002),
        grille: new BoxGeometry(0.012, 0.014, 0.1),
        lamp: new BoxGeometry(0.008, 0.016, 0.045),
      },
      m: {
        paint: new MeshStandardMaterial({ color: "#f4f5f7", roughness: 0.22, metalness: 0.1, envMapIntensity: 1.3 }),
        trim: new MeshStandardMaterial({ color: "#26282d", roughness: 0.7 }),
        // Standard materials only: a clearcoat shader compiles on first sight and stalls the scroll.
        glass: new MeshStandardMaterial({ color: "#3a4656", roughness: 0.08, metalness: 0.5 }),
        sensor: new MeshStandardMaterial({ color: "#2a2c31", roughness: 0.5 }),
        accent: new MeshStandardMaterial({ color: "#2563eb", emissive: "#2563eb", emissiveIntensity: 0.9 }),
        tyre: new MeshStandardMaterial({ color: "#1d1d1f", roughness: 0.9 }),
        rim: new MeshStandardMaterial({ map: rimFace(), metalness: 0.5, roughness: 0.35 }),
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
