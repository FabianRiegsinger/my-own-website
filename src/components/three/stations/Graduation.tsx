"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { BackSide, MathUtils, BufferGeometry, CanvasTexture, Color, DoubleSide, Float32BufferAttribute, type Group, type InstancedMesh, LatheGeometry, Object3D, Vector2 } from "three";
import { cv } from "@/content/cv";
import { pendulum } from "@/lib/pendulum";
import { stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";
import { useDark } from "../use-dark";

/**
 * Graduation, after the photo at the Friedberg campus: a grey wall with a round niche holding a bronze bell that
 * swings and rings, a dark terrazzo floor. A set piece, not a backdrop, so the page's colour field still shows.
 * The THM logo is printed on the wall top right, two brass plaques below it name the degrees, confetti
 * drifts down, and he wears gown and mortarboard and jumps for joy (GenMe, Gown).
 */
export const WALL = { x: -0.2, z: -0.4, width: 3, height: 3 };
/** Round niche cut into the wall, on Fabian's right (Mixamo rigs face +z, so his right is -x), deep enough for the bell. */
export const NICHE = { center: [-0.62, 2] as [number, number], radius: 0.6, depth: 0.3 };
/** Bell (centre of its body) and the handle he pulls, within reach of his raised right hand. */
export const BELL: [number, number, number] = [-0.58, 2.15, -0.25];
export const HANDLE: [number, number, number] = [-0.55, 1.82, -0.1];

export const BELL_HEIGHT = 0.42;
/** Lip radius of the bell (BELL_PROFILE's widest point). */
export const BELL_RADIUS = 0.207;
/** Swing: amplitude (rad) and small-swing angular frequency (rad/s, ≈ 2 s per swing). */
export const SWING = { amplitude: 0.5, omega: 3.2 };
/** The clapper hangs free: it follows the bell this late (s) and further, until it strikes the sound bow. */
const CLAPPER = { lag: 0.14, gain: 1.35, strike: 0.38 };
/** The handle hangs from the mouth on a hinge: it trails the bell this late (s) and by this share of its angle. */
const PULL = { lag: 0.34, gain: 0.8 };
const FLOOR = { width: 3, depth: 1.8 };
/** Plaques on the wall, on his left (+x), clear of the niche. */
export const PLAQUES = cv.education.map((e, i) => ({ ...e, position: [0.72, 2.05 - i * 0.43, WALL.z + 0.012] as [number, number, number] }));
export const PLAQUE = { width: 0.62, height: 0.31 };
/** THM logo printed on the wall above the plaques, twice their width; aspect from the logo artwork (830 x 278). */
const LOGO_ART = { width: 830, height: 278 };
export const LOGO = { width: 2 * PLAQUE.width, height: (2 * PLAQUE.width * LOGO_ART.height) / LOGO_ART.width, position: [0.67, 2.62, WALL.z + 0.004] as [number, number, number] };
const CONFETTI = 260;
const CONFETTI_COLOURS = ["#80ba24", "#c4c6ca", "#686c72", "#f2f2ef"]; // THM green and the photo's greys

/** Deterministic pseudo-random so every visit looks the same. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
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

/**
 * THM logo, redrawn as vector shapes in the artwork's own units (830 x 278): the square pattern, the divider, the
 * block letters THM, and the wordmark below, on a transparent background.
 */
function thmLogo() {
  const k = 2; // pixels per artwork unit
  const c = document.createElement("canvas");
  c.width = LOGO_ART.width * k;
  c.height = LOGO_ART.height * k;
  const ctx = c.getContext("2d")!;
  ctx.scale(k, k);
  const green = "#80ba24";
  const grey = "#4a5c66";
  ctx.fillStyle = green;
  // Squares: 35 wide on a 52 pitch, three columns by four rows with the top-left one missing.
  for (let row = 0; row < 4; row++) for (let col = row === 0 ? 1 : 0; col < 3; col++) ctx.fillRect(col * 52, row * 52, 35, 35);
  const poly = (...pts: number[]) => {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.fill();
  };
  const CAP = 190;
  ctx.fillRect(276, 0, 144, 36); // T
  ctx.fillRect(329, 0, 39, CAP);
  ctx.fillRect(462, 0, 38, CAP); // H
  ctx.fillRect(568, 0, 40, CAP);
  ctx.fillRect(500, 78, 68, 32);
  poly(650, 0, 690, 0, 740, 108, 790, 0, 830, 0, 830, CAP, 791, CAP, 791, 78, 740, 158, 689, 78, 689, CAP, 650, CAP); // M
  ctx.fillStyle = grey;
  ctx.fillRect(206, 0, 5, CAP); // divider
  // Wordmark: condensed caps, squeezed or stretched to span the artwork's full width.
  ctx.font = '600 58px "DIN Condensed", "Arial Narrow", "Roboto Condensed", sans-serif';
  ctx.textBaseline = "alphabetic";
  const text = "TECHNISCHE HOCHSCHULE MITTELHESSEN";
  ctx.save();
  ctx.translate(0, 276);
  ctx.scale(LOGO_ART.width / ctx.measureText(text).width, 1);
  ctx.fillText(text, 0, 0);
  ctx.restore();
  const t = new CanvasTexture(c);
  t.colorSpace = "srgb";
  t.anisotropy = 4;
  return t;
}

/**
 * Alpha map that is opaque in the middle and fades to clear over the given fraction of each edge. `soft` (dark mode)
 * stretches each fade 1.8x and eases it (smoothstep, squared): a light wall on the dark page then dissolves gradually
 * instead of ending in the bright rim a linear ramp leaves, which the light page hides.
 */
export function edgeFade(edges: { left: number; right: number; top: number; bottom: number }, hole?: { u: number; v: number; r: number }, soft = false) {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const STEPS = 12;
  const grey = (v: number) => `rgb(${Math.round(255 * v)} ${Math.round(255 * v)} ${Math.round(255 * v)})`;
  const ease = (t: number) => (t * t * (3 - 2 * t)) ** 2;
  const ramp = (g: CanvasGradient, a: number, b: number) => {
    if (soft) [a, b] = [Math.min(a * 1.8, 0.45), Math.min(b * 1.8, 0.45)];
    if (!soft || a === 0) g.addColorStop(0, a > 0 ? "#000" : "#fff");
    if (a > 0) {
      if (soft) for (let i = 0; i < STEPS; i++) g.addColorStop((a * i) / STEPS, grey(ease(i / STEPS)));
      g.addColorStop(a, "#fff");
    }
    if (b > 0) {
      g.addColorStop(1 - b, "#fff");
      if (soft) for (let i = STEPS - 1; i > 0; i--) g.addColorStop(1 - (b * i) / STEPS, grey(ease(i / STEPS)));
    }
    g.addColorStop(1, b > 0 ? "#000" : "#fff");
    return g;
  };
  ctx.fillStyle = ramp(ctx.createLinearGradient(0, 0, size, 0), edges.left, edges.right);
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = ramp(ctx.createLinearGradient(0, 0, 0, size), edges.top, edges.bottom);
  ctx.fillRect(0, 0, size, size);
  // A hole cut clean through (fractions of the map, v from the top).
  if (hole) {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(hole.u * size, hole.v * size, hole.r * size, 0, 2 * Math.PI);
    ctx.fill();
  }
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
  const confetti = useRef<InstancedMesh>(null);
  const swing = useRef<Group>(null);
  const clapper = useRef<Group>(null);
  const pull = useRef<Group>(null);
  const offset = useStationOffset();

  const bell = useMemo(() => new LatheGeometry(BELL_PROFILE.map(([r, y]) => new Vector2(r, y)), 64), []);
  const dark = useDark();
  // Wall fades out at the sides and top; floor fades at the sides and front, so neither shows a hard edge.
  const fades = useMemo(
    () => ({
      wall: edgeFade(
        { left: 0.22, right: 0.22, top: 0.25, bottom: 0 },
        { u: (NICHE.center[0] - WALL.x) / WALL.width + 0.5, v: 1 - NICHE.center[1] / WALL.height, r: NICHE.radius / WALL.width },
        dark,
      ),
      floor: edgeFade({ left: 0.25, right: 0.25, top: 0, bottom: 0.45 }, undefined, dark),
    }),
    [dark],
  );
  const maps = useMemo(
    () => ({
      niche: nicheShade(),
      logo: thmLogo(),
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
    if (!root.current || !confetti.current || !swing.current || !clapper.current || !pull.current) return;
    fade(root.current, stationWeight(offset.current, "education"));
    if (!root.current.visible) return;
    const t = clock.elapsedTime;
    // Rings constantly: swings left and right about its crown like a real pendulum (lib/pendulum).
    const bellAt = (s: number) => pendulum(s, SWING.amplitude, SWING.omega);
    swing.current.rotation.z = bellAt(t);
    clapper.current.rotation.z = MathUtils.clamp(CLAPPER.gain * bellAt(t - CLAPPER.lag) - swing.current.rotation.z, -CLAPPER.strike, CLAPPER.strike);
    pull.current.rotation.z = PULL.gain * bellAt(t - PULL.lag) - swing.current.rotation.z;
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
        <meshStandardMaterial color="#f2f2ef" roughness={0.95} alphaMap={fades.wall} transparent depthWrite={false} />
      </mesh>
      {/* Niche: a round recess cut into the wall (the wall's alpha map has the hole), its back shaded darker under the lip. */}
      <group position={[NICHE.center[0], NICHE.center[1], WALL.z]}>
        <mesh position-z={-NICHE.depth / 2} rotation-x={Math.PI / 2} receiveShadow>
          <cylinderGeometry args={[NICHE.radius, NICHE.radius, NICHE.depth, 64, 1, true]} />
          <meshStandardMaterial color="#a4a5a8" roughness={0.95} side={BackSide} />
        </mesh>
        <mesh position-z={-NICHE.depth} receiveShadow>
          <circleGeometry args={[NICHE.radius, 64]} />
          <meshStandardMaterial map={maps.niche} roughness={0.9} />
        </mesh>
        <mesh>
          <torusGeometry args={[NICHE.radius, 0.012, 8, 96]} />
          <meshStandardMaterial color="#e4e4e1" roughness={0.9} />
        </mesh>
      </group>
      {/* Bracket from the niche's back wall to the bell's crown. */}
      <mesh position={[bellTop[0], bellTop[1] + 0.05, (WALL.z - NICHE.depth + bellTop[2]) / 2]}>
        <boxGeometry args={[0.05, 0.05, bellTop[2] - WALL.z + NICHE.depth]} />
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
        {/* Handle hanging below the mouth: what he pulls in the photo. Hinged at the mouth, so it swings on its own. */}
        <group ref={pull} position={[HANDLE[0] - BELL[0], -BELL_HEIGHT, HANDLE[2] - BELL[2]]}>
          <mesh position-y={(HANDLE[1] - bellTop[1] + BELL_HEIGHT) / 2}>
            <cylinderGeometry args={[0.012, 0.012, bellTop[1] - BELL_HEIGHT - HANDLE[1] + 0.06, 8]} />
            <meshStandardMaterial color="#1f1f22" roughness={0.5} />
          </mesh>
        </group>
      </group>
      <mesh position={[WALL.x, 0.001, WALL.z + FLOOR.depth / 2]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[FLOOR.width, FLOOR.depth]} />
        <meshStandardMaterial color="#2c2d31" roughness={0.6} alphaMap={fades.floor} transparent depthWrite={false} />
      </mesh>
      <points geometry={chips}>
        <pointsMaterial color="#9a9a9a" size={0.02} />
      </points>
      <mesh position={LOGO.position}>
        <planeGeometry args={[LOGO.width, LOGO.height]} />
        <meshStandardMaterial map={maps.logo} transparent roughness={0.9} depthWrite={false} />
      </mesh>
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
      <instancedMesh ref={confetti} args={[undefined, undefined, CONFETTI]}>
        <planeGeometry args={[0.03, 0.018]} />
        <meshStandardMaterial side={DoubleSide} roughness={0.8} />
      </instancedMesh>
    </group>
  );
}
