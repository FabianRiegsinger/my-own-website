"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  type BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  type Group,
  LatheGeometry,
  MathUtils,
  Matrix4,
  type Mesh,
  type PointLight,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  type Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { contactJump } from "@/lib/jump";
import { STATIONS } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

/**
 * Launch pad on Fabian's right (Mixamo rigs face +z, so his right is -x), behind him. The whole set is built in pad
 * units and scaled up: the rocket stands ~4 m, over twice his height. A modern two-stage launcher: sooty first stage
 * with grid fins and folded landing legs, three engines, payload fairing; a lattice tower whose crew access arm swings
 * away before ignition, and hold-down clamps that let go at it.
 */
export const PAD = { x: -1.75, z: -1.9, radius: 0.85, height: 0.12, scale: 1.5 };

const launch = STATIONS.find((s) => s.id === "launch")!;
/** Ignition just past the middle of the page, once the countdown has been read. */
const IGNITION = launch.start + 0.55 * (launch.end - launch.start);
/** Height (m) the rocket has climbed by the end of the page: far out of frame, so contact never shows its fire. */
const GONE = 12;

/**
 * Launch set opacity: fades in over the start of the launch page only, never earlier (the skills page before it is
 * tall, so a wider fade would ghost the big rocket behind its word cloud); the empty pad clears away quickly as
 * contact begins, leaving only the fog.
 */
export function launchWeight(offset: number) {
  if (offset < launch.end) return Math.min(1, Math.max(0, (offset - launch.start) / 0.02));
  return Math.max(0, 1 - (offset - launch.end) / 0.015);
}

/** Crew access arm: 0 docked at the rocket, 1 swung clear; it retracts just before ignition. */
export function armSwing(offset: number) {
  return MathUtils.smoothstep(offset, IGNITION - 0.014, IGNITION - 0.003);
}

/** Hold-down clamps: 0 holding, 1 fallen open; they let go at ignition. */
export function clampRelease(offset: number) {
  return MathUtils.smoothstep(offset, IGNITION, IGNITION + 0.004);
}

/** Steepness of the climb: each fifth of it is e (~2.7x) faster than the one before. */
const CLIMB = 5;

/**
 * Rocket height above the pad (m) at a scroll offset: 0 until ignition, then an e-curve to GONE at the end of the
 * page: it creeps off the pad, then speeds up by the same factor over every equal stretch of scroll.
 */
export function liftoff(offset: number) {
  const u = Math.max(0, offset - IGNITION) / (launch.end - IGNITION);
  return (GONE * (Math.exp(CLIMB * u) - 1)) / (Math.exp(CLIMB) - 1);
}

/** Ground fog the launch leaves behind: low around his feet (top just over the shoes), across the stage. */
export const FOG = { top: 0.22, width: 3.4, puffs: 18 };
/** Render layer for fog and steam: the main camera sees it, ContactShadows' camera does not (no grey smudge under it). */
const MIST_LAYER = 1;
/** Moves a sprite onto MIST_LAYER only (set in code: a `layers` prop would set the mask, i.e. layer 0). */
const onMistLayer = (el: Sprite | null) => (el?.layers.set(MIST_LAYER), el);

/** Fog opacity: builds from ignition to the end of the page, then stays through contact. */
export function fogWeight(offset: number) {
  return Math.min(1, Math.max(0, (offset - IGNITION) / (launch.end - IGNITION)));
}

/** Deterministic pseudo-random so the fog lies the same on every visit. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Soft round puff: opaque centre fading to clear, for the fog and steam sprites. */
function puffTexture() {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.5, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(c);
}

/** Rocket stands on its engine bells this high above the pad deck. */
const NOZZLE = 0.22;
const STEAM = 12;
/** Launcher layout (pad units, y = 0 at the engine skirt). */
const R = 0.2;
const STAGE1 = 1.4;
const INTERSTAGE = { top: 1.56 };
const STAGE2 = { top: 1.95 };
const TIP = 2.55;
/** The front (decals, patch) faces the launch page's camera: yaw of the camera seen from the pad. */
const FACE = 0.27;
/** Lattice tower footprint (pad units): centre, side and height. */
const TOWER = { x: -0.72, z: -0.3, side: 0.22, height: 2.9 };
const ARM_Y = PAD.height + NOZZLE + (INTERSTAGE.top + STAGE2.top) / 2;
/** Access arm: pivot at the tower corner nearest the rocket, reaching to the stage's skin (yaw maps the arm's +x there). */
const ARM = (() => {
  const pivot: [number, number] = [TOWER.x + TOWER.side / 2, TOWER.z + TOWER.side / 2];
  const dist = Math.hypot(pivot[0], pivot[1]);
  return { pivot, length: dist - R - 0.01, yaw: Math.atan2(pivot[1], -pivot[0]) };
})();

/** Canvas texture for a surface that wraps all the way round: `w` x `h` pixels, drawn by `draw`. */
function wrapTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new CanvasTexture(c);
  t.colorSpace = "srgb";
  t.anisotropy = 4;
  return t;
}

/**
 * First stage skin (u around from the back, so u = 0.5 faces front; v up): white, soot rising from the engines in
 * streaks, panel seams, and the name running up the front. Sized so a pixel is square on the 0.2-radius, 1.4-tall hull.
 */
function stageSkin() {
  const w = 1024;
  const h = Math.round((w * STAGE1) / (2 * Math.PI * R));
  return wrapTexture(w, h, (ctx) => {
    ctx.fillStyle = "#f4f4f6";
    ctx.fillRect(0, 0, w, h);
    const soot = ctx.createLinearGradient(0, h, 0, h * 0.45);
    soot.addColorStop(0, "rgba(110,98,86,0.85)");
    soot.addColorStop(0.35, "rgba(140,128,116,0.45)");
    soot.addColorStop(1, "rgba(160,150,140,0)");
    ctx.fillStyle = soot;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      const x = rand(i + 300) * w;
      const len = h * (0.1 + rand(i + 400) * 0.35);
      ctx.fillStyle = `rgba(90,80,70,${0.06 + rand(i + 500) * 0.12})`;
      ctx.fillRect(x, h - len, 1 + rand(i + 600) * 3, len);
    }
    ctx.fillStyle = "rgba(60,62,70,0.25)";
    for (const f of [0.22, 0.48, 0.74]) ctx.fillRect(0, h * f, w, 2);
    // Name up the front, reading bottom to top.
    ctx.save();
    ctx.translate(w / 2 + 22, h * 0.8);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "#1b1c22";
    ctx.font = '800 64px "Archivo", "Helvetica Neue", Arial, sans-serif';
    ctx.fillText("RIEGSINGER", 0, 0);
    ctx.restore();
  });
}

/** Fairing skin (lathe: u around from the back, v up the profile): split seams at the sides, mission patch in front. */
function fairingSkin() {
  const w = 1024;
  const h = 480;
  return wrapTexture(w, h, (ctx) => {
    ctx.fillStyle = "#f4f4f6";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(60,62,70,0.45)";
    for (const u of [0.25, 0.75]) ctx.fillRect(u * w - 1, 0, 3, h);
    ctx.fillRect(0, h - 22, w, 3); // base joint
    const [cx, cy] = [w / 2, h * 0.68];
    ctx.fillStyle = "#ff6a1a";
    ctx.beginPath();
    ctx.arc(cx, cy, 46, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#f4f4f6";
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#7c5ce6";
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
    ctx.fill();
  });
}

/** Grid fin lattice: dark bars, open cells (cut out by alphaTest). */
function gridTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.strokeStyle = "#2c2e34";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 60, 60);
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 2 + i * 10);
    ctx.lineTo(64, 2 + i * 10);
    ctx.moveTo(2 + i * 10, 0);
    ctx.lineTo(2 + i * 10, 64);
    ctx.stroke();
  }
  return new CanvasTexture(c);
}

const UP = new Vector3(0, 1, 0);
/** Square bar of thickness `t` from `a` to `b`. */
function beam(a: Vector3, b: Vector3, t: number) {
  const d = b.clone().sub(a);
  const g = new BoxGeometry(t, d.length(), t);
  return g.applyMatrix4(new Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new Quaternion().setFromUnitVectors(UP, d.normalize()), new Vector3(1, 1, 1)));
}

/** Lattice tower: four corner posts, a ring of beams every level and one diagonal brace per side, merged into one mesh. */
function latticeTower() {
  const { x, z, side, height } = TOWER;
  const h = side / 2;
  const corners = [[-h, -h], [h, -h], [h, h], [-h, h]].map(([dx, dz]) => [x + dx, z + dz]);
  const parts: BufferGeometry[] = corners.map(([cx, cz]) => beam(new Vector3(cx, 0, cz), new Vector3(cx, height, cz), 0.028));
  const STEP = 0.29;
  for (let y = 0.1; y + STEP <= height; y += STEP)
    corners.forEach(([ax, az], i) => {
      const [bx, bz] = corners[(i + 1) % 4];
      parts.push(beam(new Vector3(ax, y, az), new Vector3(bx, y, bz), 0.016));
      parts.push(beam(new Vector3(ax, y, az), new Vector3(bx, y + STEP, bz), 0.012));
    });
  return mergeGeometries(parts)!;
}

function useParts() {
  return useMemo(() => {
    const lathe = (pts: [number, number][], phiStart = 0) =>
      new LatheGeometry(
        pts.map(([r, y]) => new Vector2(r, y)),
        48,
        phiStart,
      );
    return {
      g: {
        pad: new CylinderGeometry(PAD.radius, PAD.radius + 0.08, PAD.height, 48),
        tower: latticeTower(),
        arm: new BoxGeometry(1, 0.05, 0.07),
        whiteRoom: new BoxGeometry(0.12, 0.11, 0.12),
        // Open-ended cylinders starting at the back (thetaStart π), so the texture's centre faces front.
        stage1: new CylinderGeometry(R, R, STAGE1, 48, 1, true, Math.PI),
        interstage: new CylinderGeometry(R + 0.003, R + 0.003, INTERSTAGE.top - STAGE1, 48, 1, true),
        stage2: new CylinderGeometry(R, R, STAGE2.top - INTERSTAGE.top, 48, 1, true),
        // Fairing: a lip a touch wider than the stage, then an ogive to the tip.
        fairing: lathe(
          [
            [R + 0.012, STAGE2.top],
            [R + 0.015, STAGE2.top + 0.12],
            [R + 0.008, STAGE2.top + 0.26],
            [R - 0.03, STAGE2.top + 0.4],
            [R - 0.1, STAGE2.top + 0.52],
            [0.02, TIP - 0.005],
            [0, TIP],
          ],
          Math.PI,
        ),
        skirt: new CylinderGeometry(R + 0.008, R + 0.012, 0.1, 48),
        bell: lathe([[0.04, 0], [0.045, -0.04], [0.06, -0.11], [0.075, -NOZZLE + 0.04]]),
        leg: new BoxGeometry(0.035, 0.78, 0.022),
        foot: new BoxGeometry(0.06, 0.03, 0.035),
        gridFin: new BoxGeometry(0.13, 0.012, 0.11),
        clamp: new BoxGeometry(0.05, 0.22, 0.05),
        flame: new ConeGeometry(0.22, 1, 32, 1, true),
        core: new ConeGeometry(0.1, 1, 24, 1, true),
        glow: new SphereGeometry(0.26, 24, 16),
        diamond: new SphereGeometry(0.06, 16, 10),
        splash: new CylinderGeometry(1, 1, 0.01, 40),
      },
      m: {
        pad: new MeshStandardMaterial({ color: "#3a3d45", roughness: 0.8 }),
        tower: new MeshStandardMaterial({ color: "#5b5f6b", roughness: 0.6, metalness: 0.4 }),
        whiteRoom: new MeshStandardMaterial({ color: "#e9eaee", roughness: 0.5 }),
        hull: new MeshStandardMaterial({ color: "#f4f4f6", roughness: 0.35 }),
        stage1: new MeshStandardMaterial({ map: stageSkin(), roughness: 0.4 }),
        fairing: new MeshStandardMaterial({ map: fairingSkin(), roughness: 0.3 }),
        black: new MeshStandardMaterial({ color: "#1f2025", roughness: 0.5 }),
        carbon: new MeshStandardMaterial({ color: "#2a2b30", roughness: 0.45, metalness: 0.3 }),
        grid: new MeshStandardMaterial({ map: gridTexture(), alphaTest: 0.5, transparent: true, side: DoubleSide, metalness: 0.6, roughness: 0.4 }),
        nozzle: new MeshStandardMaterial({ color: "#2a2b30", roughness: 0.5, metalness: 0.7, side: DoubleSide }),
        clamp: new MeshStandardMaterial({ color: "#c9a227", roughness: 0.6, metalness: 0.3 }),
        // Additive and unlit, so overlapping layers burn brighter toward the core.
        flame: new MeshBasicMaterial({ color: "#ff5a1a", toneMapped: false, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false }),
        core: new MeshBasicMaterial({ color: "#fff1b8", toneMapped: false, transparent: true, opacity: 0.95, blending: AdditiveBlending, depthWrite: false }),
        diamond: new MeshBasicMaterial({ color: "#fff6d6", toneMapped: false, transparent: true, opacity: 0.8, blending: AdditiveBlending, depthWrite: false }),
        glow: new MeshBasicMaterial({ color: "#ffb347", toneMapped: false, transparent: true, opacity: 0.7, blending: AdditiveBlending, depthWrite: false }),
        steam: new SpriteMaterial({ map: puffTexture(), color: "#f2f0ee", opacity: 0.85, transparent: true, depthWrite: false }),
      },
    };
  }, []);
}

/** Next: a rocket on the pad, venting steam while the countdown is read, lifting off as the page hands over to contact. */
export function Launch() {
  const root = useRef<Group>(null);
  const rocket = useRef<Group>(null);
  const flame = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const splash = useRef<Mesh>(null);
  const arm = useRef<Group>(null);
  const clamps = useRef<(Group | null)[]>([]);
  const puffs = useRef<(Sprite | null)[]>([]);
  const fog = useRef<Group>(null);
  const fogPuffs = useRef<(Sprite | null)[]>([]);
  const offset = useStationOffset();
  const { g, m } = useParts();
  const camera = useThree((st) => st.camera);
  useEffect(() => void camera.layers.enable(MIST_LAYER), [camera]);
  // A touch cooler and denser than the floor, so it reads as fog on the light stage.
  const fogMaterial = useMemo(() => new SpriteMaterial({ map: m.steam.map, color: "#e3e4ea", opacity: 0.95, transparent: true, depthWrite: false }), [m]);
  // Each puff: a wide, low sprite on the stage around him, mostly in front of his feet, with its own drift phase.
  const fogLayout = useMemo(
    () =>
      Array.from({ length: FOG.puffs }, (_, i) => ({
        x: (rand(i) - 0.5) * FOG.width,
        z: -0.5 + rand(i + 50) * 1.6,
        w: 1.1 + rand(i + 100) * 0.9,
        phase: rand(i + 150) * Math.PI * 2,
      })),
    [],
  );

  useFrame(({ clock }) => {
    if (fog.current) {
      fade(fog.current, contactJump.clean ? 0 : fogWeight(offset.current)); // no launch seen, no fog
      // Slow sideways drift, so the fog lives without rising.
      if (fog.current.visible)
        fogPuffs.current.forEach((p, i) => p && (p.position.x = fogLayout[i].x + 0.15 * Math.sin(clock.elapsedTime * 0.25 + fogLayout[i].phase)));
    }
    if (!root.current || !rocket.current || !flame.current || !light.current || !splash.current) return;
    fade(root.current, launchWeight(offset.current));
    if (!root.current.visible) return;
    const t = clock.elapsedTime;
    const lift = liftoff(offset.current) / PAD.scale; // in pad units
    const lit = offset.current > IGNITION;
    if (arm.current) arm.current.rotation.y = ARM.yaw + 1.4 * armSwing(offset.current);
    const open = clampRelease(offset.current);
    clamps.current.forEach((c) => c && (c.rotation.z = -0.9 * open));
    rocket.current.position.y = PAD.height + NOZZLE + lift;
    // Once lit: a long, roaring plume that grows as the rocket climbs; nothing before.
    const flicker = 0.8 + 0.2 * Math.sin(t * 47) * Math.sin(t * 29);
    // Never through the deck: on the pad the plume stops at it and fans out as a glow across it instead.
    const length = lit ? Math.min((1.6 + Math.min(lift * 1.5, 3.4)) * flicker, NOZZLE + lift + 0.02) : 0.001;
    const fan = lit ? Math.max(0, 1 - lift / 1.5) : 0;
    splash.current.scale.set(0.35 + 0.5 * fan * flicker, 1, 0.35 + 0.5 * fan * flicker);
    splash.current.visible = fan > 0;
    const width = lit ? (1 + 0.3 * Math.min(lift, 1)) * (0.92 + 0.08 * Math.sin(t * 61)) : 0.001;
    flame.current.scale.set(width, length, width);
    light.current.intensity = lit ? 14 * flicker : 0;
    // Steam rolls out from the pad: a slow vent on the pad, a big cloud at ignition.
    const burst = lit ? 1 + Math.min(lift * 1.5, 1.2) : 0.45;
    puffs.current.forEach((p, i) => {
      if (!p) return;
      const a = (i / STEAM) * Math.PI * 2;
      const k = (t * (lit ? 0.6 : 0.35) + i * 0.37) % 1; // each puff's own cycle, faster once lit
      const r = PAD.radius * (0.6 + k * 0.9 * burst);
      p.position.set(Math.cos(a) * r, PAD.height + 0.1 + k * 0.35 * burst, Math.sin(a) * r);
      p.scale.setScalar(2.4 * (0.1 + k * 0.16) * burst * (1 - k * 0.5)); // sprite size = puff diameter, plus soft edge
    });
  });

  return (
    <>
      <group ref={fog}>
        {/* Sprites centred low so their soft top edge sits at FOG.top: over his shoes, nowhere near his knees. */}
        {fogLayout.map((f, i) => (
          <sprite
            key={i}
            ref={(el) => void (fogPuffs.current[i] = onMistLayer(el))}
            material={fogMaterial}
            position={[f.x, FOG.top / 2 - 0.02, f.z]}
            scale={[f.w, FOG.top + 0.06, 1]}
          />
        ))}
      </group>
      <group ref={root}>
        <group position={[PAD.x, 0, PAD.z]} scale={PAD.scale}>
          <mesh geometry={g.pad} material={m.pad} position-y={PAD.height / 2} receiveShadow castShadow />
          {/* Lattice service tower; the crew access arm (with its white room) docks at the second stage. */}
          <mesh geometry={g.tower} material={m.tower} castShadow />
          <group ref={arm} position={[ARM.pivot[0], ARM_Y, ARM.pivot[1]]} rotation-y={ARM.yaw}>
            <mesh geometry={g.arm} material={m.tower} position-x={ARM.length / 2} scale-x={ARM.length} />
            <mesh geometry={g.whiteRoom} material={m.whiteRoom} position-x={ARM.length - 0.06} />
          </group>
          {/* Hold-down clamps round the engines; they fall open outward at ignition. */}
          {[0, 1, 2, 3].map((i) => {
            const a = Math.PI / 4 + (i * Math.PI) / 2;
            return (
              <group key={i} ref={(el) => void (clamps.current[i] = el)} position={[Math.cos(a) * (R + 0.04), PAD.height, Math.sin(a) * (R + 0.04)]} rotation-y={-a}>
                <mesh geometry={g.clamp} material={m.clamp} position={[-0.015, 0.11, 0]} castShadow />
              </group>
            );
          })}
          <group ref={rocket} position-y={PAD.height + NOZZLE} rotation-y={FACE}>
            <mesh geometry={g.stage1} material={m.stage1} position-y={STAGE1 / 2} castShadow />
            <mesh geometry={g.interstage} material={m.black} position-y={(STAGE1 + INTERSTAGE.top) / 2} castShadow />
            <mesh geometry={g.stage2} material={m.hull} position-y={(INTERSTAGE.top + STAGE2.top) / 2} castShadow />
            <mesh geometry={g.fairing} material={m.fairing} castShadow />
            <mesh geometry={g.skirt} material={m.carbon} position-y={0} />
            {/* Grid fins stowed flat at the top of the first stage, landing legs folded along it. */}
            {[0, 1, 2, 3].map((i) => {
              const a = (i * Math.PI) / 2;
              return <mesh key={i} geometry={g.gridFin} material={m.grid} position={[Math.sin(a) * (R + 0.065), STAGE1 + 0.1, Math.cos(a) * (R + 0.065)]} rotation-y={a + Math.PI / 2} />;
            })}
            {[0, 1, 2, 3].map((i) => {
              const a = Math.PI / 4 + (i * Math.PI) / 2;
              return (
                <group key={i} rotation-y={a}>
                  <mesh geometry={g.leg} material={m.carbon} position={[0, 0.44, R + 0.012]} castShadow />
                  <mesh geometry={g.foot} material={m.carbon} position={[0, 0.06, R + 0.03]} />
                </group>
              );
            })}
            {[0, 1, 2].map((i) => {
              const a = Math.PI / 2 + (i * 2 * Math.PI) / 3;
              return <mesh key={i} geometry={g.bell} material={m.nozzle} position={[Math.sin(a) * 0.09, -0.04, Math.cos(a) * 0.09]} />;
            })}
            {/* Plume hangs down from the nozzle: orange outer cone, white-hot core, glow at the exit. Stretched by the frame loop. */}
            <group ref={flame} position-y={-NOZZLE} scale={0.001}>
              <mesh geometry={g.flame} material={m.flame} rotation-x={Math.PI} position-y={-0.5} />
              <mesh geometry={g.core} material={m.core} rotation-x={Math.PI} position-y={-0.3} scale-y={0.6} />
              <mesh geometry={g.glow} material={m.glow} scale-y={0.5} />
              {/* Shock diamonds: bright knots down the plume, fading as they go. */}
              {[0.12, 0.24, 0.36, 0.48].map((y, i) => (
                <mesh key={y} geometry={g.diamond} material={m.diamond} position-y={-y} scale={[1 - i * 0.15, 0.5, 1 - i * 0.15]} />
              ))}
            </group>
            {/* Lights the pad, the steam and Fabian orange once lit. */}
            <pointLight ref={light} color="#ff8a3d" intensity={0} distance={6} decay={1.5} position-y={-NOZZLE - 0.4} />
          </group>
          <mesh ref={splash} geometry={g.splash} material={m.glow} position-y={PAD.height + 0.01} visible={false} />
          {Array.from({ length: STEAM }, (_, i) => (
            <sprite key={i} ref={(el) => void (puffs.current[i] = onMistLayer(el))} material={m.steam} />
          ))}
        </group>
      </group>
    </>
  );
}
