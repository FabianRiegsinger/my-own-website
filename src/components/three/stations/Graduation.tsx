"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferGeometry, CanvasTexture, DoubleSide, Float32BufferAttribute, type Group, LatheGeometry, Vector2 } from "three";
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

/** Alpha map that is opaque in the middle and fades to clear over the given fraction of each edge. */
function edgeFade(edges: { left: number; right: number; top: number; bottom: number }) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const ramp = (g: CanvasGradient, a: number, b: number) => {
    g.addColorStop(0, a > 0 ? "#000" : "#fff");
    if (a > 0) g.addColorStop(a, "#fff");
    if (b > 0) g.addColorStop(1 - b, "#fff");
    g.addColorStop(1, b > 0 ? "#000" : "#fff");
    return g;
  };
  ctx.fillStyle = ramp(ctx.createLinearGradient(0, 0, size, 0), edges.left, edges.right);
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = ramp(ctx.createLinearGradient(0, 0, 0, size), edges.top, edges.bottom);
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(c);
}

/** Niche shading: dark under the top lip, lighter toward the bottom, like a shallow round recess. */
function nicheShade() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, "#6f7073");
  g.addColorStop(0.35, "#9c9da0");
  g.addColorStop(1, "#c4c5c7");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const rim = ctx.createRadialGradient(size / 2, size / 2, size * 0.36, size / 2, size / 2, size / 2);
  rim.addColorStop(0, "rgba(0,0,0,0)");
  rim.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, size, size);
  const t = new CanvasTexture(c);
  t.colorSpace = "srgb";
  return t;
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
  const maps = useMemo(
    () => ({
      // Wall fades out at the sides and top; floor fades at the sides and front, so neither shows a hard edge.
      wall: edgeFade({ left: 0.22, right: 0.22, top: 0.25, bottom: 0 }),
      floor: edgeFade({ left: 0.25, right: 0.25, top: 0, bottom: 0.45 }),
      niche: nicheShade(),
    }),
    [],
  );
  // Terrazzo: light chips scattered over the solid middle of the dark floor.
  const chips = useMemo(() => {
    const pos: number[] = [];
    for (let i = 0; i < 700; i++) pos.push(WALL.x + (rand(i) - 0.5) * FLOOR.width * 0.55, 0.004, WALL.z + rand(i + 1000) * FLOOR.depth * 0.5);
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
      <mesh position={[WALL.x, WALL.height / 2, WALL.z]} receiveShadow>
        <planeGeometry args={[WALL.width, WALL.height]} />
        <meshStandardMaterial color="#f2f2ef" roughness={0.95} alphaMap={maps.wall} transparent depthWrite={false} />
      </mesh>
      {/* Niche: shaded like a recess (inner shadow under the top lip, lighter toward the bottom). */}
      <mesh position={[NICHE.center[0], NICHE.center[1], WALL.z + 0.003]}>
        <circleGeometry args={[NICHE.radius, 64]} />
        <meshStandardMaterial map={maps.niche} roughness={0.9} />
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
      <mesh position={[WALL.x, 0.001, WALL.z + FLOOR.depth / 2]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[FLOOR.width, FLOOR.depth]} />
        <meshStandardMaterial color="#2c2d31" roughness={0.6} alphaMap={maps.floor} transparent depthWrite={false} />
      </mesh>
      <points geometry={chips}>
        <pointsMaterial color="#9a9a9a" size={0.02} />
      </points>
    </group>
  );
}
