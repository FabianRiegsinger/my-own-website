"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  type Group,
  LatheGeometry,
  type Mesh,
  type PointLight,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  type Sprite,
  SpriteMaterial,
  Vector2,
} from "three";
import { STATIONS } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

/**
 * Launch pad on Fabian's right (Mixamo rigs face +z, so his right is -x), behind him. The whole set is built in pad
 * units and scaled up: the rocket stands ~3.8 m, twice his height.
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

/** Rocket stands on its nozzle this high above the pad deck. */
const NOZZLE = 0.22;
const STEAM = 12;

function useParts() {
  return useMemo(() => {
    const lathe = (pts: [number, number][]) =>
      new LatheGeometry(
        pts.map(([r, y]) => new Vector2(r, y)),
        40,
      );
    return {
      g: {
        pad: new CylinderGeometry(PAD.radius, PAD.radius + 0.08, PAD.height, 48),
        tower: new BoxGeometry(0.14, 2.9, 0.14),
        arm: new BoxGeometry(0.62, 0.06, 0.06),
        body: lathe([
          [0, 0],
          [0.3, 0],
          [0.33, 0.12],
          [0.33, 1.55],
          [0.3, 1.85],
          [0, 1.85],
        ]),
        nose: lathe([
          [0, 1.84],
          [0.3, 1.84],
          [0.24, 2.15],
          [0.13, 2.4],
          [0, 2.55],
        ]),
        band: new CylinderGeometry(0.335, 0.335, 0.08, 40),
        window: new CylinderGeometry(0.1, 0.1, 0.04, 32),
        fin: new BoxGeometry(0.035, 0.5, 0.34),
        nozzle: new CylinderGeometry(0.17, 0.24, NOZZLE, 32, 1, true),
        flame: new ConeGeometry(0.26, 1, 32, 1, true),
        core: new ConeGeometry(0.12, 1, 24, 1, true),
        glow: new SphereGeometry(0.3, 24, 16),
        splash: new CylinderGeometry(1, 1, 0.01, 40),
      },
      m: {
        pad: new MeshStandardMaterial({ color: "#3a3d45", roughness: 0.8 }),
        tower: new MeshStandardMaterial({ color: "#5b5f6b", roughness: 0.6, metalness: 0.4 }),
        hull: new MeshStandardMaterial({ color: "#f4f4f6", roughness: 0.35 }),
        orange: new MeshStandardMaterial({ color: "#ff6a1a", roughness: 0.4 }),
        violet: new MeshStandardMaterial({ color: "#7c5ce6", roughness: 0.4 }),
        glass: new MeshStandardMaterial({ color: "#1d2a4a", roughness: 0.1, metalness: 0.6 }),
        nozzle: new MeshStandardMaterial({ color: "#2a2b30", roughness: 0.5, metalness: 0.7 }),
        // Additive and unlit, so overlapping layers burn brighter toward the core.
        flame: new MeshBasicMaterial({ color: "#ff5a1a", toneMapped: false, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false }),
        core: new MeshBasicMaterial({ color: "#fff1b8", toneMapped: false, transparent: true, opacity: 0.95, blending: AdditiveBlending, depthWrite: false }),
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
      fade(fog.current, fogWeight(offset.current));
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
          {/* Service tower behind the rocket with two arms reaching over. */}
          <mesh geometry={g.tower} material={m.tower} position={[-0.72, 1.45, -0.3]} castShadow />
          {[1.2, 2.1].map((y) => (
            <mesh key={y} geometry={g.arm} material={m.tower} position={[-0.42, y, -0.15]} rotation-y={-0.45} />
          ))}
          <group ref={rocket} position-y={PAD.height + NOZZLE}>
            <mesh geometry={g.body} material={m.hull} castShadow />
            <mesh geometry={g.nose} material={m.orange} castShadow />
            <mesh geometry={g.band} material={m.violet} position-y={1.2} />
            <mesh geometry={g.window} material={m.glass} position={[0, 1.45, 0.33]} rotation-x={Math.PI / 2} />
            {[0, 1, 2].map((i) => {
              const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
              return <mesh key={i} geometry={g.fin} material={m.orange} position={[Math.sin(a) * 0.36, 0.22, Math.cos(a) * 0.36]} rotation-y={a} castShadow />;
            })}
            <mesh geometry={g.nozzle} material={m.nozzle} position-y={-NOZZLE / 2} />
            {/* Plume hangs down from the nozzle: orange outer cone, white-hot core, glow at the exit. Stretched by the frame loop. */}
            <group ref={flame} position-y={-NOZZLE} scale={0.001}>
              <mesh geometry={g.flame} material={m.flame} rotation-x={Math.PI} position-y={-0.5} />
              <mesh geometry={g.core} material={m.core} rotation-x={Math.PI} position-y={-0.3} scale-y={0.6} />
              <mesh geometry={g.glow} material={m.glow} scale-y={0.5} />
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
