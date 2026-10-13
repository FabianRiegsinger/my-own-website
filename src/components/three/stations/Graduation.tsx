"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferGeometry, DoubleSide, Float32BufferAttribute, type Group, LatheGeometry, Vector2 } from "three";
import { stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

/**
 * Graduation, after the photo at the Friedberg campus: a grey wall with a round niche holding a bronze bell that
 * graduates ring, a dark terrazzo floor. A set piece, not a backdrop, so the page's colour field still shows.
 * University marks (FH logo, crest) are left out on purpose.
 */
export const WALL = { x: -0.2, z: -0.4, width: 3, height: 3 };
/** Round niche in the wall, on Fabian's right (Mixamo rigs face +z, so his right is -x). */
export const NICHE = { center: [-0.62, 2] as [number, number], radius: 0.6 };
/** Bell (centre of its body) and the handle he pulls, within reach of his raised right hand. */
export const BELL: [number, number, number] = [-0.58, 2.15, -0.25];
export const HANDLE: [number, number, number] = [-0.55, 1.82, -0.1];

const BELL_HEIGHT = 0.42;
const FLOOR = { width: 3, depth: 1.8 };

/** Deterministic pseudo-random so every visit looks the same. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function Graduation() {
  const root = useRef<Group>(null);
  const swing = useRef<Group>(null);
  const offset = useStationOffset();

  const bell = useMemo(
    () =>
      new LatheGeometry(
        [[0.2, 0], [0.16, 0.06], [0.125, 0.18], [0.115, 0.3], [0.095, 0.38], [0.03, BELL_HEIGHT]].map(([r, y]) => new Vector2(r, y)),
        40,
      ),
    [],
  );
  // Terrazzo: light chips scattered over the dark floor.
  const chips = useMemo(() => {
    const pos: number[] = [];
    for (let i = 0; i < 900; i++) pos.push(WALL.x + (rand(i) - 0.5) * FLOOR.width, 0.004, WALL.z + rand(i + 1000) * FLOOR.depth);
    return new BufferGeometry().setAttribute("position", new Float32BufferAttribute(pos, 3));
  }, []);

  useFrame(({ clock }) => {
    if (!root.current || !swing.current) return;
    fade(root.current, stationWeight(offset.current, "education"));
    // Swings when the arm tugs the handle (same rhythm as the ring pose in arm-pose.ts).
    swing.current.rotation.z = -0.12 * Math.max(0, Math.sin(clock.elapsedTime * 2.6));
  });

  const bellTop: [number, number, number] = [BELL[0], BELL[1] + BELL_HEIGHT / 2, BELL[2]];
  return (
    <group ref={root}>
      <mesh position={[WALL.x, WALL.height / 2, WALL.z - 0.03]} receiveShadow>
        <boxGeometry args={[WALL.width, WALL.height, 0.06]} />
        <meshStandardMaterial color="#f2f2ef" roughness={0.95} />
      </mesh>
      {/* Niche: a darker recess with a soft rim. */}
      <mesh position={[NICHE.center[0], NICHE.center[1], WALL.z + 0.003]}>
        <circleGeometry args={[NICHE.radius, 64]} />
        <meshStandardMaterial color="#a9aaac" roughness={0.9} />
      </mesh>
      <mesh position={[NICHE.center[0], NICHE.center[1], WALL.z + 0.005]}>
        <ringGeometry args={[NICHE.radius * 0.93, NICHE.radius, 64]} />
        <meshStandardMaterial color="#8a8b8e" roughness={0.9} />
      </mesh>
      {/* Bracket from the niche's back wall to the bell's crown. */}
      <mesh position={[bellTop[0], bellTop[1] + 0.05, (WALL.z + bellTop[2]) / 2]}>
        <boxGeometry args={[0.05, 0.05, bellTop[2] - WALL.z]} />
        <meshStandardMaterial color="#2a2a2c" roughness={0.6} />
      </mesh>
      <group ref={swing} position={bellTop}>
        <mesh geometry={bell} position-y={-BELL_HEIGHT} castShadow>
          <meshStandardMaterial color="#7b6236" metalness={0.8} roughness={0.35} side={DoubleSide} />
        </mesh>
        {/* Handle hanging below the mouth: what he pulls in the photo. */}
        <mesh position={[HANDLE[0] - BELL[0], (HANDLE[1] - bellTop[1]) / 2 - BELL_HEIGHT / 2, HANDLE[2] - BELL[2]]}>
          <cylinderGeometry args={[0.012, 0.012, bellTop[1] - BELL_HEIGHT - HANDLE[1] + 0.06, 8]} />
          <meshStandardMaterial color="#1f1f22" roughness={0.5} />
        </mesh>
      </group>
      <mesh position={[WALL.x, -0.01, WALL.z + FLOOR.depth / 2]} receiveShadow>
        <boxGeometry args={[FLOOR.width, 0.02, FLOOR.depth]} />
        <meshStandardMaterial color="#2c2d31" roughness={0.6} />
      </mesh>
      <points geometry={chips}>
        <pointsMaterial color="#9a9a9a" size={0.02} />
      </points>
    </group>
  );
}
