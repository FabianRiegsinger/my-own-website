"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { BufferGeometry, Color, Float32BufferAttribute, type Group, type InstancedMesh, Matrix4, Quaternion, Vector3 } from "three";
import { STATIONS, stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

/** Vertical field of view of the scene camera (Experience3D). */
export const FOV_DEG = 35;
/** Widest screen the sheet must still cover edge to edge. */
const MAX_ASPECT = 21 / 9;
/** How far behind the figure the sheet hangs. */
const BEHIND = 4;
const COUNT = 170;
const LINK = 1.6;
const CYAN = new Color("#22d3ee");
const VIOLET = new Color("#8b5cf6");

/** Deterministic pseudo-random so server/client and every visit look the same. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * A sheet facing the agentic camera, well behind the figure, sized to fill the whole screen at its depth:
 * widest aspect, plus the desktop view shift that moves the visible window sideways.
 */
export function networkLayout() {
  const s = STATIONS.find((st) => st.id === "agentic")!;
  const camera = new Vector3(...s.camera);
  const forward = new Vector3(...s.target).sub(camera);
  const depth = forward.length() + BEHIND;
  forward.normalize();
  const halfH = Math.tan(((FOV_DEG / 2) * Math.PI) / 180) * depth;
  return {
    center: camera.addScaledVector(forward, depth),
    quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), forward.negate()),
    width: 2 * halfH * MAX_ASPECT * (1 + 2 * s.shift) * 1.05,
    height: 2 * halfH * 1.3, // margin for the camera easing in from the neighbouring pages
  };
}

/** A glowing web of "agents" spanning the screen behind the figure on the agentic page. */
export function AgentNetwork() {
  const root = useRef<Group>(null);
  const sway = useRef<Group>(null);
  const nodes = useRef<InstancedMesh>(null);
  const offset = useStationOffset();
  const layout = useMemo(() => networkLayout(), []);
  const m = useMemo(() => new Matrix4(), []);

  const { points, lines, colors } = useMemo(() => {
    const { width, height } = layout;
    const points = Array.from({ length: COUNT }, (_, i) => new Vector3((rand(i) - 0.5) * width, (rand(i + 500) - 0.5) * height, (rand(i + 900) - 0.5) * 1.6));
    const tint = (p: Vector3) => CYAN.clone().lerp(VIOLET, p.x / width + 0.5);
    const pos: number[] = [];
    const col: number[] = [];
    points.forEach((p, i) =>
      points.slice(i + 1).forEach((q) => {
        if (p.distanceTo(q) > LINK) return;
        for (const v of [p, q]) {
          const c = tint(v);
          pos.push(v.x, v.y, v.z);
          col.push(c.r, c.g, c.b);
        }
      }),
    );
    const lines = new BufferGeometry();
    lines.setAttribute("position", new Float32BufferAttribute(pos, 3));
    lines.setAttribute("color", new Float32BufferAttribute(col, 3));
    return { points, lines, colors: points.map(tint) };
  }, [layout]);

  useLayoutEffect(() => {
    colors.forEach((c, i) => nodes.current?.setColorAt(i, c));
  }, [colors]);

  useFrame(({ clock }) => {
    if (!root.current || !sway.current || !nodes.current) return;
    fade(root.current, stationWeight(offset.current, "agentic"));
    if (!root.current.visible) return;
    const t = clock.elapsedTime;
    sway.current.rotation.z = Math.sin(t * 0.15) * 0.03; // a slow drift, in the sheet's own plane
    points.forEach((p, i) => {
      const k = 1 + 0.35 * Math.sin(t * 2 + i); // each node pulses
      nodes.current!.setMatrixAt(i, m.makeScale(k, k, k).setPosition(p));
    });
    nodes.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={root} position={layout.center} quaternion={layout.quaternion}>
      <group ref={sway}>
        <lineSegments geometry={lines}>
          <lineBasicMaterial vertexColors opacity={0.4} toneMapped={false} />
        </lineSegments>
        <instancedMesh ref={nodes} args={[undefined, undefined, COUNT]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      </group>
    </group>
  );
}
