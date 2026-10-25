"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, Color, Float32BufferAttribute, type Group, type InstancedMesh, type LineSegments, Matrix4, Quaternion, Vector3 } from "three";
import { STATIONS, stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { sitePalette } from "./SkillCloud";
import { useStationOffset } from "../station-offset";

/** Vertical field of view of the scene camera (Experience3D). */
export const FOV_DEG = 35;
/** Widest screen the sheet must still cover edge to edge. */
const MAX_ASPECT = 21 / 9;
/** How far behind the figure the sheet hangs. */
const BEHIND = 4;
const COUNT = 2200;
/** Clusters of meaning in the embedding space, on a jittered grid so every part of the screen gets some; the rest of
 * the points scatter loosely between them. */
const GRID = [6, 3];
const CLUSTERS = GRID[0] * GRID[1];
const LOOSE = 0.2;
/** Each neuron wires to its nearest few, none longer than this. */
const NEIGHBOURS = 3;
const MAX_WIRE = 1.2;
/** A thought: one neuron fires, the spike hops along the wiring, each hop passing on with this chance. */
const BURST_EVERY = 0.35;
const HOP_SECONDS = 0.09;
const MAX_HOPS = 6;
const PASS = 0.55;
/** How fast a flash dies away, per second. */
const DECAY = 3.5;
/** At rest a neuron is its palette colour this far toward the page background, so only firing ones stand out. */
const REST = 0.75;
/** Wire opacity at rest and while carrying a spike. */
const WIRE_REST = 0.15;
const WIRE_LIT = 1;
const BG = new Color("#f5f5f7");
/**
 * Render layer of the sheet. ContactShadows draws everything its camera sees on layer 0 (castShadow is ignored), so
 * on layer 0 the sheet would print blurred streaks on the floor; the scene camera enables this layer instead.
 */
const LAYER = 1;

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

/**
 * Hop count from `seed` to every neuron the spike reaches (breadth first, at most `maxHops`); `pass(a, b)` decides
 * whether the spike crosses the wire from a to b.
 */
export function cascade(wires: number[][], seed: number, maxHops: number, pass: (a: number, b: number) => boolean) {
  const hops = new Map([[seed, 0]]);
  let front = [seed];
  for (let h = 1; h <= maxHops && front.length; h++) {
    const next: number[] = [];
    for (const a of front)
      for (const b of wires[a])
        if (!hops.has(b) && pass(a, b)) {
          hops.set(b, h);
          next.push(b);
        }
    front = next;
  }
  return hops;
}

/** Points in soft clusters, each wired (both ways) to its nearest `NEIGHBOURS`; a cluster shares one hue, like one concept. */
function embedding(width: number, height: number) {
  const [cols, rows] = GRID;
  const centers = Array.from({ length: CLUSTERS }, (_, c) => [
    ((c % cols) + 0.5 + (rand(c * 7 + 1) - 0.5) * 0.7) / cols - 0.5,
    (Math.floor(c / cols) + 0.5 + (rand(c * 7 + 2) - 0.5) * 0.7) / rows - 0.5,
  ]).map(([u, v]) => [u * width, v * height * 0.8]);
  const spread = width * 0.022;
  const placed = Array.from({ length: COUNT }, (_, i) => {
    const z = (rand(i + 900) - 0.5) * 1.6;
    if (rand(i + 1300) < LOOSE) return { p: new Vector3((rand(i) - 0.5) * width, (rand(i + 500) - 0.5) * height, z), hue: rand(i + 1700) };
    const [cx, cy] = centers[i % CLUSTERS];
    const r = spread * Math.sqrt(-2 * Math.log(rand(i + 3) + 1e-6)); // Gaussian radius (Box-Muller)
    const a = 2 * Math.PI * rand(i + 99);
    return { p: new Vector3(cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.8, z), hue: ((i % CLUSTERS) * 0.618) % 1 }; // golden-ratio steps spread the hues evenly
  });
  const points = placed.map((d) => d.p);
  const wires: number[][] = points.map(() => []);
  points.forEach((p, i) => {
    const near: [number, number][] = [];
    points.forEach((q, j) => {
      const d = p.distanceToSquared(q);
      if (j !== i && d < MAX_WIRE * MAX_WIRE) near.push([d, j]);
    });
    near.sort((a, b) => a[0] - b[0]).splice(NEIGHBOURS);
    for (const [, j] of near)
      if (!wires[i].includes(j)) {
        wires[i].push(j);
        wires[j].push(i);
      }
  });
  return { points, wires, hues: placed.map((d) => d.hue) };
}

/** Agentic page: an embedding space behind the figure whose points fire like neurons, thoughts spreading along the wiring. */
export function AgentNetwork() {
  const root = useRef<Group>(null);
  const sway = useRef<Group>(null);
  const nodes = useRef<InstancedMesh>(null);
  const edges = useRef<LineSegments>(null);
  const camera = useThree((s) => s.camera);
  const offset = useStationOffset();
  const layout = useMemo(() => networkLayout(), []);

  const net = useMemo(() => {
    const { width, height } = layout;
    const { points, wires, hues } = embedding(width, height);
    const tint = hues.map((u) => sitePalette(u)); // same palette as the skills word cloud
    const pairs = wires.flatMap((ws, a) => ws.filter((b) => b > a).map((b) => [a, b]));
    const lines = new BufferGeometry();
    lines.setAttribute("position", new Float32BufferAttribute(pairs.flatMap(([a, b]) => [...points[a].toArray(), ...points[b].toArray()]), 3));
    lines.setAttribute("color", new Float32BufferAttribute(new Float32Array(pairs.length * 8), 4));
    return { points, wires, tint, pairs, lines };
  }, [layout]);
  // per-frame state: when each neuron last fired, the current thought, scratch objects
  const live = useRef({ fireAt: new Float32Array(COUNT).fill(-1e3), level: new Float32Array(COUNT), burst: -1, m: new Matrix4(), c: new Color() });

  useEffect(() => {
    edges.current?.layers.set(LAYER);
    nodes.current?.layers.set(LAYER);
    camera.layers.enable(LAYER);
  }, [camera]);

  useFrame(({ clock }) => {
    if (!root.current || !sway.current || !nodes.current || !edges.current) return;
    fade(root.current, stationWeight(offset.current, "agentic"));
    if (!root.current.visible) return;
    const t = clock.elapsedTime;
    sway.current.rotation.z = Math.sin(t * 0.15) * 0.03; // a slow drift, in the sheet's own plane

    const { points, wires, tint, pairs } = net;
    const s = live.current;
    const { fireAt, level, m, c } = s;
    const burst = Math.floor(t / BURST_EVERY);
    if (burst !== s.burst) {
      s.burst = burst;
      const seed = Math.floor(rand(burst + 7) * COUNT);
      const hops = cascade(wires, seed, MAX_HOPS, (a, b) => rand(burst * 31 + a * 7 + b) < PASS);
      // a neuron still glowing from the last thought sits this one out (refractory)
      for (const [i, h] of hops) if (t - fireAt[i] > 0.4) fireAt[i] = t + h * HOP_SECONDS;
    }

    const glow = (i: number) => {
      const since = t - fireAt[i];
      const spike = since >= 0 ? Math.exp(-since * DECAY) : 0;
      const idle = Math.pow(Math.max(0, Math.sin(t * 0.7 + i * 12.9)), 60) * 0.5; // the odd neuron flickers on its own
      return Math.max(spike, idle);
    };
    points.forEach((p, i) => {
      const g = (level[i] = glow(i));
      const k = 0.4 + 1.1 * g;
      nodes.current!.setMatrixAt(i, m.makeScale(k, k, k).setPosition(p));
      nodes.current!.setColorAt(i, c.copy(tint[i]).lerp(BG, REST * (1 - g)));
    });
    nodes.current.instanceMatrix.needsUpdate = true;
    nodes.current.instanceColor!.needsUpdate = true;

    const col = edges.current.geometry.getAttribute("color") as Float32BufferAttribute;
    pairs.forEach(([a, b], e) => {
      const g = Math.max(level[a], level[b]);
      for (const [v, i] of [[0, a], [1, b]]) {
        c.copy(tint[i]).lerp(BG, REST * (1 - g));
        col.setXYZW(e * 2 + v, c.r, c.g, c.b, WIRE_REST + (WIRE_LIT - WIRE_REST) * g);
      }
    });
    col.needsUpdate = true;
  });

  return (
    <group ref={root} position={layout.center} quaternion={layout.quaternion}>
      <group ref={sway}>
        <lineSegments ref={edges} geometry={net.lines}>
          <lineBasicMaterial vertexColors transparent toneMapped={false} />
        </lineSegments>
        <instancedMesh ref={nodes} args={[undefined, undefined, COUNT]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      </group>
    </group>
  );
}
