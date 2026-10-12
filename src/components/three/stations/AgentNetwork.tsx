"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferGeometry, Color, Float32BufferAttribute, type Group, Vector3 } from "three";
import { STATIONS, stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

const COUNT = 36;
const LINK = 0.7;
export const NETWORK_RADIUS = 0.9;
const CYAN = new Color("#22d3ee");
const VIOLET = new Color("#8b5cf6");

/** Deterministic pseudo-random so server/client and every visit look the same. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Where the node cloud floats: screen-left of the figure as seen from the agentic camera and a little behind it,
 * so on screen it fills the gap between the text panel and the figure without ever crossing the model.
 */
export function networkCenter(): Vector3 {
  const s = STATIONS.find((st) => st.id === "agentic")!;
  const target = new Vector3(...s.target);
  const forward = target
    .clone()
    .sub(new Vector3(...s.camera))
    .setY(0)
    .normalize();
  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
  return target.addScaledVector(right, -1.25).addScaledVector(forward, 1).setY(1.3);
}

/** A glowing node graph of "agents" beside the figure. */
export function AgentNetwork() {
  const root = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const nodes = useRef<Group>(null);
  const center = useMemo(() => networkCenter(), []);
  const offset = useStationOffset();

  const { points, lines } = useMemo(() => {
    // Even spread inside a ball (cube-root radius), centred on the cloud's own origin.
    const points = Array.from({ length: COUNT }, (_, i) => {
      const u = rand(i) * 2 - 1;
      const a = rand(i + 100) * Math.PI * 2;
      const r = NETWORK_RADIUS * Math.cbrt(rand(i + 200));
      const h = Math.sqrt(1 - u * u);
      return new Vector3(Math.cos(a) * h * r, u * r, Math.sin(a) * h * r);
    });
    const pos: number[] = [];
    const col: number[] = [];
    const c = new Color();
    points.forEach((p, i) =>
      points.slice(i + 1).forEach((q) => {
        if (p.distanceTo(q) > LINK) return;
        for (const v of [p, q]) {
          pos.push(v.x, v.y, v.z);
          c.copy(CYAN).lerp(VIOLET, (v.y + NETWORK_RADIUS) / (2 * NETWORK_RADIUS));
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
    if (!root.current || !spin.current || !nodes.current) return;
    fade(root.current, stationWeight(offset.current, "agentic"));
    spin.current.rotation.y += dt * 0.08; // about the cloud's own centre, never sweeping round the figure
    const t = clock.elapsedTime;
    nodes.current.children.forEach((n, i) => n.scale.setScalar(1 + 0.35 * Math.sin(t * 2 + i)));
  });

  return (
    <group ref={root} position={center}>
      <group ref={spin}>
        <lineSegments geometry={lines}>
          <lineBasicMaterial vertexColors opacity={0.6} toneMapped={false} />
        </lineSegments>
        <group ref={nodes}>
          {points.map((p, i) => (
            <mesh key={i} position={p}>
              <sphereGeometry args={[0.03, 12, 12]} />
              <meshBasicMaterial color={CYAN.clone().lerp(VIOLET, (p.y + NETWORK_RADIUS) / (2 * NETWORK_RADIUS))} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
