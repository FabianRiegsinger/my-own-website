"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { BufferGeometry, CanvasTexture, Color, DoubleSide, Float32BufferAttribute, type Group, type InstancedMesh, LatheGeometry, Object3D, Vector2 } from "three";
import { cv } from "@/content/cv";
import { stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

/**
 * Graduation, after the photo at the Friedberg campus: a grey wall with a round niche holding a bronze bell that
 * graduates ring, a dark terrazzo floor. A set piece, not a backdrop, so the page's colour field still shows.
 * University marks (FH logo, crest) are left out on purpose. Every other ring throws mortarboard caps, confetti drifts
 * down, and two brass plaques on his left name the degrees.
 */
export const WALL = { x: -0.2, z: -0.4, width: 3, height: 3 };
/** Round niche in the wall, on Fabian's right (Mixamo rigs face +z, so his right is -x). */
export const NICHE = { center: [-0.62, 2] as [number, number], radius: 0.6 };
/** Bell (centre of its body) and the handle he pulls, within reach of his raised right hand. */
export const BELL: [number, number, number] = [-0.58, 2.15, -0.25];
export const HANDLE: [number, number, number] = [-0.55, 1.82, -0.1];

const BELL_HEIGHT = 0.42;
const FLOOR = { width: 3, depth: 1.8 };
/** Bell swing rhythm (rad/s), shared with the ring pose in arm-pose.ts. */
const RING_RATE = 2.6;
const RING_PERIOD = (2 * Math.PI) / RING_RATE;
/** Caps fly on every other ring, so the throw stays readable instead of constant. */
export const THROW_CYCLE = RING_PERIOD * 2;
const GRAVITY = 4.9;
/** Plaques on the wall, on his left (+x), clear of the niche. */
export const PLAQUES = cv.education.map((e, i) => ({ ...e, position: [0.72, 2.05 - i * 0.43, WALL.z + 0.012] as [number, number, number] }));
const PLAQUE = { width: 0.62, height: 0.31 };
const CONFETTI = 260;
const CONFETTI_COLOURS = ["#80ba24", "#c4c6ca", "#686c72", "#f2f2ef"]; // THM green and the photo's greys

/** Deterministic pseudo-random so every visit looks the same. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Cap launch velocities, seeded so every visit throws the same way. */
export const CAPS = [0, 1, 2, 3].map((i) => ({ vx: (rand(i + 7) - 0.4) * 1.2, vy: 3 + rand(i + 11) * 0.8, vz: 0.3 + rand(i + 3) * 0.5, spin: (rand(i + 5) - 0.5) * 9, delay: i * 0.08 }));

/** Seconds since the caps were last thrown (every other swing peak); GenMe cheers on the same beat. */
export const sinceThrow = (t: number) => (((t - RING_PERIOD / 4) % THROW_CYCLE) + THROW_CYCLE) % THROW_CYCLE;

/** Where cap `i` is at time `t`: thrown from above his head at each other swing peak, falling back to the floor. */
export function capFlight(i: number, t: number) {
  const c = CAPS[i];
  const u = Math.max(0, sinceThrow(t) - c.delay);
  const y = 1.9 + c.vy * u - GRAVITY * u * u;
  return { position: [0.05 + c.vx * u, Math.max(0.02, y), 0.1 + c.vz * u] as [number, number, number], spin: c.spin * u, airborne: y > 0.02 };
}

/** Floor opacity at (x, z): the same linear edge ramps as the floor's alpha map (sides 25 %, front 45 %). */
function floorFade(x: number, z: number) {
  const u = (x - WALL.x) / FLOOR.width + 0.5;
  const d = (z - WALL.z) / FLOOR.depth; // 0 at the wall, 1 at the front edge
  return Math.min(1, u / 0.25, (1 - u) / 0.25, (1 - d) / 0.45);
}

/** Terrazzo chips over the whole floor, thinning out where the floor fades so they never float past its edge. */
export function terrazzo(count = 3000) {
  const pos: number[] = [];
  for (let i = 0; i < count; i++) {
    const x = WALL.x + (rand(i) - 0.5) * FLOOR.width;
    const z = WALL.z + rand(i + 5000) * FLOOR.depth;
    if (rand(i + 9000) < floorFade(x, z)) pos.push(x, 0.004, z);
  }
  return pos;
}

/**
 * Bell cross-section (r, y), lip at y = 0: up the inside from the lip to the crown, then back down the outside, so the
 * lathe gives a bell with real wall thickness, the thick sound bow near the lip and a flared mouth.
 */
const BELL_PROFILE = [
  [0, 0.395], [0.06, 0.39], [0.092, 0.365], [0.103, 0.3], [0.108, 0.2], [0.125, 0.12], [0.155, 0.06], [0.182, 0.015], [0.196, 0],
  [0.207, 0.008], [0.205, 0.03], [0.188, 0.055], [0.162, 0.095], [0.138, 0.15], [0.124, 0.22], [0.118, 0.29], [0.11, 0.345], [0.095, 0.385],
  [0.065, 0.41], [0.03, BELL_HEIGHT], [0, BELL_HEIGHT],
];

/** Cast bronze: a warm sheen brightest on the sound bow, darker patina in the waist, fine casting grain. */
function bronze() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  // Lathe v follows BELL_PROFILE: 0 at the inner crown, ~0.42 at the lip, 1 at the outer crown (canvas bottom to top).
  const g = ctx.createLinearGradient(0, size, 0, 0);
  g.addColorStop(0, "#4a381e"); // inside: dull, unpolished
  g.addColorStop(0.38, "#5a4425");
  g.addColorStop(0.46, "#c49a55"); // sound bow, polished by hands and weather
  g.addColorStop(0.7, "#7a5c2e"); // waist patina
  g.addColorStop(0.88, "#a07a3e"); // shoulder
  g.addColorStop(1, "#8a6a35");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = rand(i + 77) < 0.5 ? "rgba(40,28,10,0.12)" : "rgba(255,226,170,0.08)";
    ctx.fillRect(rand(i) * size, rand(i + 3000) * size, 1 + rand(i + 6000) * 2, 1);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = "srgb";
  return t;
}

/** Engraved brass face: the degree and year large, the field of study below, shrunk to fit. */
function plaqueFace(title: string, subtitle: string) {
  const w = 512, h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#b8964f");
  g.addColorStop(0.5, "#d9bd7b");
  g.addColorStop(1, "#9c7a3c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(60,40,10,0.55)";
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.fillStyle = "rgba(55,36,8,0.88)";
  ctx.textAlign = "center";
  ctx.font = "600 64px Georgia, serif";
  ctx.fillText(title, w / 2, 118);
  let size = 30;
  do ctx.font = `${size--}px Georgia, serif`;
  while (ctx.measureText(subtitle).width > w - 64 && size > 12);
  ctx.fillText(subtitle, w / 2, 182);
  const t = new CanvasTexture(c);
  t.colorSpace = "srgb";
  return t;
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
  const clapper = useRef<Group>(null);
  const caps = useRef<Group>(null);
  const confetti = useRef<InstancedMesh>(null);
  const offset = useStationOffset();

  const bell = useMemo(() => new LatheGeometry(BELL_PROFILE.map(([r, y]) => new Vector2(r, y)), 64), []);
  const maps = useMemo(
    () => ({
      // Wall fades out at the sides and top; floor fades at the sides and front, so neither shows a hard edge.
      wall: edgeFade({ left: 0.22, right: 0.22, top: 0.25, bottom: 0 }),
      floor: edgeFade({ left: 0.25, right: 0.25, top: 0, bottom: 0.45 }),
      niche: nicheShade(),
      bronze: bronze(),
      plaques: PLAQUES.map((p) => {
        const [title, ...field] = p.degree.split(" ");
        return plaqueFace(`${title} ${p.end.slice(0, 4)}`, field.join(" "));
      }),
    }),
    [],
  );
  // Confetti flakes: seeded spot over the floor, fall speed, phase and tumble.
  const flakes = useMemo(
    () =>
      Array.from({ length: CONFETTI }, (_, i) => ({
        x: WALL.x + (rand(i * 3) - 0.5) * 2.4,
        z: WALL.z + 0.2 + rand(i * 3 + 1) * 1.1,
        speed: 0.35 + rand(i * 3 + 2) * 0.35,
        phase: rand(i + 400) * 10,
        tumble: rand(i + 900) * 6,
      })),
    [],
  );
  const dummy = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    flakes.forEach((_, i) => confetti.current?.setColorAt(i, new Color(CONFETTI_COLOURS[i % CONFETTI_COLOURS.length])));
  }, [flakes]);
  const chips = useMemo(() => new BufferGeometry().setAttribute("position", new Float32BufferAttribute(terrazzo(), 3)), []);

  useFrame(({ clock }) => {
    if (!root.current || !swing.current || !clapper.current || !caps.current || !confetti.current) return;
    fade(root.current, stationWeight(offset.current, "education"));
    if (!root.current.visible) return;
    const t = clock.elapsedTime;
    // Swings when the arm tugs the handle (same rhythm as the ring pose in arm-pose.ts).
    const swingAt = (s: number) => -0.12 * Math.max(0, Math.sin(s * RING_RATE));
    swing.current.rotation.z = swingAt(t);
    // The clapper hangs free: it trails the bell a beat late and overshoots, striking the sound bow on the way back.
    clapper.current.rotation.z = 1.5 * swingAt(t - 0.16) - swing.current.rotation.z;
    caps.current.children.forEach((cap, i) => {
      const f = capFlight(i, t);
      cap.visible = f.airborne;
      cap.position.set(...f.position);
      cap.rotation.set(f.spin * 0.6, f.spin, f.spin * 0.3);
    });
    flakes.forEach((f, i) => {
      dummy.position.set(f.x + Math.sin(t * 1.3 + f.phase) * 0.08, 3.2 - ((t * f.speed + f.phase) % 3.4), f.z);
      dummy.rotation.set(t * 2 + f.tumble, t * 1.4 + f.tumble, f.tumble);
      dummy.updateMatrix();
      confetti.current!.setMatrixAt(i, dummy.matrix);
    });
    confetti.current.instanceMatrix.needsUpdate = true;
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
          <meshPhysicalMaterial map={maps.bronze} metalness={0.9} roughness={0.32} clearcoat={0.4} clearcoatRoughness={0.25} envMapIntensity={1.4} side={DoubleSide} />
        </mesh>
        {/* Cast ridges round the shoulder and above the lip, and the crown loop it hangs from. */}
        {[[0.36, 0.108], [0.33, 0.115], [0.065, 0.184]].map(([y, r]) => (
          <mesh key={y} position-y={y - BELL_HEIGHT} rotation-x={Math.PI / 2}>
            <torusGeometry args={[r, 0.005, 8, 64]} />
            <meshStandardMaterial color="#b08a4c" metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
        <mesh position-y={0.02}>
          <torusGeometry args={[0.032, 0.011, 10, 24]} />
          <meshStandardMaterial color="#7a5c2e" metalness={0.85} roughness={0.4} />
        </mesh>
        <group ref={clapper} position-y={-0.03}>
          <mesh position-y={-0.15}>
            <cylinderGeometry args={[0.007, 0.007, 0.3, 8]} />
            <meshStandardMaterial color="#2a2a2c" metalness={0.7} roughness={0.5} />
          </mesh>
          <mesh position-y={-0.32}>
            <sphereGeometry args={[0.036, 16, 12]} />
            <meshStandardMaterial color="#3b3226" metalness={0.7} roughness={0.45} />
          </mesh>
        </group>
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
      {PLAQUES.map((p, i) => (
        <group key={p.degree} position={p.position}>
          <mesh castShadow>
            <boxGeometry args={[PLAQUE.width, PLAQUE.height, 0.02]} />
            <meshStandardMaterial color="#8c6c33" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position-z={0.0101}>
            <planeGeometry args={[PLAQUE.width, PLAQUE.height]} />
            <meshStandardMaterial map={maps.plaques[i]} metalness={0.55} roughness={0.35} />
          </mesh>
        </group>
      ))}
      <group ref={caps}>
        {CAPS.map((_, i) => (
          <group key={i} visible={false}>
            <mesh castShadow>
              <boxGeometry args={[0.24, 0.014, 0.24]} />
              <meshStandardMaterial color="#17181b" roughness={0.7} />
            </mesh>
            <mesh position-y={-0.04}>
              <cylinderGeometry args={[0.075, 0.085, 0.07, 18]} />
              <meshStandardMaterial color="#17181b" roughness={0.8} />
            </mesh>
            {/* Tassel in THM green. */}
            <mesh position={[0.11, -0.05, 0.11]}>
              <cylinderGeometry args={[0.006, 0.006, 0.1, 6]} />
              <meshStandardMaterial color="#80ba24" roughness={0.6} />
            </mesh>
          </group>
        ))}
      </group>
      <instancedMesh ref={confetti} args={[undefined, undefined, CONFETTI]}>
        <planeGeometry args={[0.03, 0.018]} />
        <meshStandardMaterial side={DoubleSide} roughness={0.8} />
      </instancedMesh>
    </group>
  );
}
