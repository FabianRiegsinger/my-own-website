"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BoxGeometry, ConeGeometry, CylinderGeometry, type Group, LatheGeometry, type Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, Vector2 } from "three";
import { STATIONS, stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

/** Launch pad on Fabian's right (Mixamo rigs face +z, so his right is -x), a step behind him. */
export const PAD = { x: -1.35, z: -1.1, radius: 0.85, height: 0.12 };

const launch = STATIONS.find((s) => s.id === "launch")!;
/** Ignition late on the page, so the countdown is read first; lift-off carries on into contact. */
const IGNITION = launch.start + 0.7 * (launch.end - launch.start);

/** Rocket height above the pad (m) at a scroll offset: 0 until ignition, then accelerating (constant thrust). */
export function liftoff(offset: number) {
  const t = Math.max(0, offset - IGNITION) / 0.04;
  return 1.5 * t * t;
}

/** Rocket stands on its nozzle this high above the pad deck. */
const NOZZLE = 0.22;
const STEAM = 12;

function useParts() {
  return useMemo(() => {
    const lathe = (pts: [number, number][]) => new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), 40);
    return {
      g: {
        pad: new CylinderGeometry(PAD.radius, PAD.radius + 0.08, PAD.height, 48),
        tower: new BoxGeometry(0.14, 2.9, 0.14),
        arm: new BoxGeometry(0.62, 0.06, 0.06),
        body: lathe([[0, 0], [0.3, 0], [0.33, 0.12], [0.33, 1.55], [0.3, 1.85], [0, 1.85]]),
        nose: lathe([[0, 1.84], [0.3, 1.84], [0.24, 2.15], [0.13, 2.4], [0, 2.55]]),
        band: new CylinderGeometry(0.335, 0.335, 0.08, 40),
        window: new CylinderGeometry(0.1, 0.1, 0.04, 32),
        fin: new BoxGeometry(0.035, 0.5, 0.34),
        nozzle: new CylinderGeometry(0.17, 0.24, NOZZLE, 32, 1, true),
        flame: new ConeGeometry(0.2, 1, 24, 1, true),
        puff: new SphereGeometry(1, 16, 12),
      },
      m: {
        pad: new MeshStandardMaterial({ color: "#3a3d45", roughness: 0.8 }),
        tower: new MeshStandardMaterial({ color: "#5b5f6b", roughness: 0.6, metalness: 0.4 }),
        hull: new MeshStandardMaterial({ color: "#f4f4f6", roughness: 0.35 }),
        orange: new MeshStandardMaterial({ color: "#ff6a1a", roughness: 0.4 }),
        violet: new MeshStandardMaterial({ color: "#7c5ce6", roughness: 0.4 }),
        glass: new MeshStandardMaterial({ color: "#1d2a4a", roughness: 0.1, metalness: 0.6 }),
        nozzle: new MeshStandardMaterial({ color: "#2a2b30", roughness: 0.5, metalness: 0.7 }),
        flame: new MeshBasicMaterial({ color: "#ffb347", toneMapped: false }),
        steam: new MeshStandardMaterial({ color: "#ffffff", emissive: "#fff4ec", emissiveIntensity: 0.45, roughness: 1, opacity: 0.6, transparent: true, depthWrite: false }),
      },
    };
  }, []);
}

/** Next: a rocket on the pad, venting steam while the countdown is read, lifting off as the page hands over to contact. */
export function Launch() {
  const root = useRef<Group>(null);
  const rocket = useRef<Group>(null);
  const flame = useRef<Group>(null);
  const puffs = useRef<(Mesh | null)[]>([]);
  const offset = useStationOffset();
  const { g, m } = useParts();

  useFrame(({ clock }) => {
    if (!root.current || !rocket.current || !flame.current) return;
    fade(root.current, stationWeight(offset.current, "launch"));
    if (!root.current.visible) return;
    const t = clock.elapsedTime;
    const lift = liftoff(offset.current);
    const lit = offset.current > IGNITION;
    rocket.current.position.y = PAD.height + NOZZLE + lift;
    // Flickering flame once lit; nothing before.
    const flicker = 0.85 + 0.15 * Math.sin(t * 40) * Math.sin(t * 23);
    flame.current.scale.set(1, lit ? (0.8 + Math.min(lift, 1.2)) * flicker : 0.001, 1);
    // Steam rolls out from the pad: a slow vent on the pad, a big cloud at ignition.
    const burst = lit ? 1 + Math.min(lift, 1.2) : 0.45;
    puffs.current.forEach((p, i) => {
      if (!p) return;
      const a = (i / STEAM) * Math.PI * 2;
      const k = (t * 0.35 + i * 0.37) % 1; // each puff's own cycle
      const r = PAD.radius * (0.6 + k * 0.9 * burst);
      p.position.set(PAD.x + Math.cos(a) * r, PAD.height + 0.1 + k * 0.35 * burst, PAD.z + Math.sin(a) * r);
      p.scale.setScalar((0.1 + k * 0.16) * burst * (1 - k * 0.5));
    });
  });

  return (
    <group ref={root}>
      <mesh geometry={g.pad} material={m.pad} position={[PAD.x, PAD.height / 2, PAD.z]} receiveShadow castShadow />
      {/* Service tower behind the rocket with two arms reaching over. */}
      <mesh geometry={g.tower} material={m.tower} position={[PAD.x - 0.72, 1.45, PAD.z - 0.3]} castShadow />
      {[1.2, 2.1].map((y) => (
        <mesh key={y} geometry={g.arm} material={m.tower} position={[PAD.x - 0.42, y, PAD.z - 0.15]} rotation-y={-0.45} />
      ))}
      <group ref={rocket} position={[PAD.x, PAD.height + NOZZLE, PAD.z]}>
        <mesh geometry={g.body} material={m.hull} castShadow />
        <mesh geometry={g.nose} material={m.orange} castShadow />
        <mesh geometry={g.band} material={m.violet} position-y={1.2} />
        <mesh geometry={g.window} material={m.glass} position={[0, 1.45, 0.33]} rotation-x={Math.PI / 2} />
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
          return <mesh key={i} geometry={g.fin} material={m.orange} position={[Math.sin(a) * 0.36, 0.22, Math.cos(a) * 0.36]} rotation-y={a} castShadow />;
        })}
        <mesh geometry={g.nozzle} material={m.nozzle} position-y={-NOZZLE / 2} />
        {/* Cone hangs down from the nozzle; its group is stretched in y by the frame loop. */}
        <group ref={flame} position-y={-NOZZLE} scale={[1, 0.001, 1]}>
          <mesh geometry={g.flame} material={m.flame} rotation-x={Math.PI} position-y={-0.5} />
        </group>
      </group>
      {Array.from({ length: STEAM }, (_, i) => (
        <mesh key={i} ref={(el) => void (puffs.current[i] = el)} geometry={g.puff} material={m.steam} />
      ))}
    </group>
  );
}
