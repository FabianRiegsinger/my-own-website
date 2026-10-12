"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferGeometry, Color, Float32BufferAttribute, type Group, Vector3 } from "three";
import { stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

const COUNT = 40;
const LINK = 1.3;
const INK = new Color("#8a8a8a");
const GREY = new Color("#d4d4d4");

/** Deterministic pseudo-random so server/client and every visit look the same. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** A thin ink node graph of "agents" wrapped around the figure. */
export function AgentNetwork() {
  const root = useRef<Group>(null);
  const nodes = useRef<Group>(null);
  const offset = useStationOffset();

  const { points, lines } = useMemo(() => {
    const points = Array.from({ length: COUNT }, (_, i) => {
      const a = (1 + rand(i)) * Math.PI; // behind the figure only, never between figure and cameras
      const r = 1.6 + rand(i + 100) * 1.6;
      return new Vector3(Math.cos(a) * r, 0.3 + rand(i + 200) * 2.6, Math.sin(a) * r - 0.5);
    });
    const pos: number[] = [];
    const col: number[] = [];
    const c = new Color();
    points.forEach((p, i) =>
      points.slice(i + 1).forEach((q) => {
        if (p.distanceTo(q) > LINK) return;
        for (const v of [p, q]) {
          pos.push(v.x, v.y, v.z);
          c.copy(INK).lerp(GREY, v.y / 3);
          col.push(c.r, c.g, c.b);
        }
      }),
    );
    const lines = new BufferGeometry();
    lines.setAttribute("position", new Float32BufferAttribute(pos, 3));
    lines.setAttribute("color", new Float32BufferAttribute(col, 3));
    return { points, lines };
  }, []);

  useFrame(({ clock }, dt) => {
    if (!root.current || !nodes.current) return;
    fade(root.current, stationWeight(offset.current, "agentic"));
    root.current.rotation.y += dt * 0.05;
    const t = clock.elapsedTime;
    nodes.current.children.forEach((n, i) => n.scale.setScalar(1 + 0.35 * Math.sin(t * 2 + i)));
  });

  return (
    <group ref={root}>
      <lineSegments geometry={lines}>
        <lineBasicMaterial vertexColors opacity={0.5} toneMapped={false} />
      </lineSegments>
      <group ref={nodes}>
        {points.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color={INK.clone().lerp(GREY, p.y / 3)} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
