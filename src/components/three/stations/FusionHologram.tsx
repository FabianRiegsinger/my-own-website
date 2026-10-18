"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  GridHelper,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  type Material,
  type Object3D,
} from "three";
import type { fusionBeats } from "@/lib/fusion";
import { STATIONS, stationWeight } from "@/lib/scroll-map";
import { useStationOffset } from "../station-offset";

type Beats = ReturnType<typeof fusionBeats>;
type Vec3 = [number, number, number];

const ACCENT = "#2f6bff";
/** Stream colours, in SENSORS order: camera, lidar, radar. */
const STREAM = ["#f97316", "#8b5cf6", "#0ea5e9"];
/** Noise per stream (x: along the road = range, z: across = angle): camera is poor at range, radar at angle. */
const NOISE: [number, number][] = [
  [0.12, 0.03],
  [0.035, 0.035],
  [0.03, 0.13],
];
const HOLO_Y = 0.95;
/** The hologram at full size: a tabletop model, small enough to stay clear of the people around it. */
const HOLO_SCALE = 0.62;
const TRAIL = 48;

/** Material whose opacity this station drives every frame (base x beat x page weight). */
const glow = (color: string, base = 1) => {
  const m = new MeshBasicMaterial({ color, transparent: true, opacity: base, depthWrite: false, side: DoubleSide });
  m.userData.base = base;
  return m;
};
const setOpacity = (m: Material, k: number) => {
  m.opacity = (m.userData.base ?? 1) * k;
};

function label(text: string, accent: boolean, size: number) {
  const font = "600 44px Inter, system-ui, sans-serif";
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  ctx.font = font;
  c.width = Math.ceil(ctx.measureText(text).width) + 44;
  c.height = 68;
  ctx.beginPath();
  ctx.roundRect(2, 2, c.width - 4, c.height - 4, 30);
  ctx.fillStyle = accent ? ACCENT : "rgba(255,255,255,0.94)";
  ctx.fill();
  ctx.font = font;
  ctx.fillStyle = accent ? "#ffffff" : "#1d1d1f";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, c.width / 2, c.height / 2 + 2);
  const map = new CanvasTexture(c);
  map.colorSpace = SRGBColorSpace;
  const s = new Sprite(new SpriteMaterial({ map, transparent: true, depthTest: false }));
  s.material.userData.base = 1;
  s.scale.set((size * c.width) / c.height, size, 1);
  s.renderOrder = 10;
  return s;
}

function line(color: string, points: number) {
  const g = new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(points * 3), 3));
  const l = new Line(g, new LineBasicMaterial({ color, transparent: true, depthTest: false }));
  l.material.userData.base = 1;
  l.frustumCulled = false;
  l.renderOrder = 9;
  return l;
}
function setLine(l: Line, pts: Vector3[]) {
  const p = l.geometry.attributes.position as BufferAttribute;
  pts.forEach((v, i) => p.setXYZ(i, v.x, v.y, v.z));
  l.geometry.setDrawRange(0, pts.length);
  p.needsUpdate = true;
}

/** Cone from the car's sensor mount, widening ahead (+x). */
function cone(radius: number, length: number, mat: Material) {
  const g = new ConeGeometry(radius, length, 32, 1, true);
  g.translate(0, -length / 2, 0);
  g.rotateZ(Math.PI / 2);
  const m = new Mesh(g, mat);
  m.position.set(-0.17, 0.08, 0);
  return m;
}

function build(team: { position: Vec3; height: number }[]) {
  const root = new Group();
  // Transparent so the page fade reaches them; still depth-writing, so they sort like solids.
  const prop = new MeshStandardMaterial({ color: "#b6b9c1", roughness: 0.9, transparent: true });
  const propDark = new MeshStandardMaterial({ color: "#8b9099", roughness: 0.9, transparent: true });
  const top = new Mesh(new CylinderGeometry(0.5, 0.5, 0.05, 48), prop);
  top.position.y = 0.75;
  const stem = new Mesh(new CylinderGeometry(0.06, 0.1, 0.73, 16), propDark);
  stem.position.y = 0.365;
  for (const m of [top, stem]) m.castShadow = m.receiveShadow = true;
  const pad = new Mesh(new CylinderGeometry(0.34, 0.34, 0.012, 48), glow(ACCENT, 0.5));
  pad.position.y = 0.782;
  root.add(top, stem, pad);

  // Hologram: the ego car on a strip of road, an object crossing ahead of it.
  const holo = new Group();
  holo.position.set(0.15, HOLO_Y, 0); // the car (at -0.42 x HOLO_SCALE) sits over the pad's centre
  const road = new Mesh(new PlaneGeometry(1.5, 0.9), glow(ACCENT, 0.07));
  road.rotation.x = -Math.PI / 2;
  const grid = new GridHelper(1.5, 10, ACCENT, ACCENT);
  grid.scale.z = 0.6;
  (grid.material as Material).transparent = true;
  (grid.material as Material).userData.base = 0.18;
  const car = new Group();
  car.position.x = -0.42;
  const edge = new LineBasicMaterial({ color: ACCENT, transparent: true });
  edge.userData.base = 1;
  const body = glow(ACCENT, 0.25);
  for (const [w, h, d, y, x] of [
    [0.5, 0.1, 0.22, 0.07, 0],
    [0.26, 0.08, 0.2, 0.16, -0.03],
  ]) {
    const b = new Mesh(new BoxGeometry(w, h, d), body);
    b.position.set(x, y, 0);
    const e = new LineSegments(new EdgesGeometry(b.geometry), edge);
    e.position.copy(b.position);
    car.add(b, e);
  }
  holo.add(road, grid, car);

  const ring = new Mesh(new TorusGeometry(0.55, 0.005, 8, 72), glow(STREAM[1]));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(-0.42, 0.04, 0);
  const zones = [cone(0.16, 1.0, glow(STREAM[0], 0.16)), ring, cone(0.42, 0.9, glow(STREAM[2], 0.1))];
  holo.add(...zones);

  const target = new Mesh(new CylinderGeometry(0.025, 0.025, 0.14, 12), glow("#ffffff", 0.5));
  holo.add(target);
  const dots = STREAM.flatMap((c, k) =>
    [0, 1, 2, 3].map((i) => {
      const m = new Mesh(new SphereGeometry(0.016, 10, 8), glow(c));
      m.userData = { ...m.userData, k, i };
      holo.add(m);
      return m;
    }),
  );
  const fusedMat = new LineBasicMaterial({ color: "#ffffff", transparent: true, depthTest: false });
  fusedMat.userData.base = 1;
  const fused = new LineSegments(new EdgesGeometry(new BoxGeometry(0.12, 0.18, 0.12)), fusedMat);
  fused.renderOrder = 9;
  const fusedTag = label("track 07 · fused", true, 0.08);
  const trail = line("#ffffff", TRAIL);
  trail.material.userData.base = 0.7;
  holo.add(fused, fusedTag, trail);
  root.add(holo);

  // Owners: a tag over each colleague, and a line in their stream's colour from them to the object while handing over.
  const tags = team.map((m, k) => {
    const s = label(["camera", "lidar", "radar"][k], false, 0.12);
    s.position.set(m.position[0], m.height + 0.22, m.position[2]);
    return s;
  });
  const links = team.map((_, k) => line(STREAM[k], 2));
  const beam = line(ACCENT, 2);
  beam.material.userData.base = 0.5;
  // One world-space group holds it all; the parts ride along in userData for the frame loop.
  const world = new Group();
  world.add(root, ...tags, ...links, beam);
  world.userData.parts = { root, holo, zones, target, dots, fused, fusedTag, trail, tags, links, beam, hist: [] as Vector3[] };
  return world;
}
type Parts = { root: Group; holo: Group; zones: Mesh[]; target: Mesh; dots: Mesh[]; fused: LineSegments; fusedTag: Sprite; trail: Line; tags: Sprite[]; links: Line[]; beam: Line; hist: Vector3[] };

const tp = new Vector3();
const a = new Vector3();
const b = new Vector3();

/**
 * The fusion demo on the ESAS page: a projection table with a hologram of the ego car; camera, lidar and radar each
 * report the crossing object with their own error, then merge into one fused track. Placed at `at` (world).
 */
export function FusionHologram({ at, team, beats }: { at: Vec3; team: { position: Vec3; height: number }[]; beats: RefObject<Beats> }) {
  const offset = useStationOffset();
  const world = useMemo(() => build(team), [team]);
  const ref = useRef<Group>(null);
  const yaw = STATIONS.find((s) => s.id === "esas")!.yaw;

  useFrame(({ clock }) => {
    const w = stationWeight(offset.current, "esas");
    const bt = beats.current;
    const g = ref.current;
    if (!g) return;
    g.visible = w > 0.01;
    if (!g.visible || !bt) return;
    const set = g.userData.parts as Parts;
    set.root.position.set(...at);
    const s = clock.elapsedTime;
    const fadeAll = (o: Object3D, k: number) =>
      o.traverse((x) => {
        const m = (x as Mesh).material;
        if (m && !Array.isArray(m)) setOpacity(m, k);
      });
    // Table and pad fade with the page; the hologram also with its own beat.
    fadeAll(set.root, w);
    set.holo.visible = bt.on > 0.01;
    set.holo.scale.setScalar(HOLO_SCALE * (0.5 + 0.5 * bt.on));
    set.holo.rotation.y = 0.1 * Math.sin(s * 0.4);
    fadeAll(set.holo, w * bt.on);

    // Beam from his laptop (in front of him at chest height, along his heading) down to the pad.
    a.set(Math.sin(yaw) * 0.35, 1.12, Math.cos(yaw) * 0.35);
    setLine(set.beam, [a, b.set(at[0], 0.8, at[2])]);
    setOpacity(set.beam.material as Material, w * bt.on * (1 - bt.thumb));

    // The crossing object walks across in front of the car.
    tp.set(0.32, 0, 0.32 * Math.sin(s * 0.7));
    set.target.position.copy(tp).setY(0.07);
    set.zones.forEach((z, k) => {
      z.visible = bt.sensor[k] > 0.01;
      setOpacity(z.material as Material, w * bt.sensor[k]);
    });
    set.dots.forEach((m) => {
      const { k, i } = m.userData as { k: number; i: number };
      const j = k * 7 + i * 3.1;
      const keep = 1 - bt.merge;
      m.position.set(tp.x + NOISE[k][0] * Math.sin(s * 2.3 + j) * keep, 0.06 + 0.02 * i * keep, tp.z + NOISE[k][1] * Math.cos(s * 1.9 + j * 1.7) * keep);
      m.visible = bt.dots[k] > 0.01;
      m.scale.setScalar(bt.dots[k]);
    });
    set.fused.visible = set.fusedTag.visible = set.trail.visible = bt.done > 0.01;
    set.fused.position.copy(tp).setY(0.09);
    set.fusedTag.position.copy(tp).setY(0.3);
    for (const o of [set.fused, set.fusedTag, set.trail]) setOpacity(o.material as Material, w * bt.on * bt.done);
    if (bt.done > 0.01) {
      set.hist.unshift(tp.clone().setY(0.01));
      set.hist.length = Math.min(set.hist.length, TRAIL);
      setLine(set.trail, set.hist);
    } else set.hist.length = 0;

    set.holo.updateMatrixWorld(true);
    team.forEach((m, k) => {
      setOpacity(set.tags[k].material, w * (0.3 + 0.7 * bt.sensor[k]));
      const l = set.links[k];
      l.visible = bt.sensor[k] > 0.01;
      setOpacity(l.material as Material, w * bt.sensor[k]);
      if (l.visible) setLine(l, [a.set(m.position[0], m.height + 0.1, m.position[2]), set.holo.localToWorld(b.copy(tp).setY(0.1))]);
    });
  });

  return <primitive ref={ref} object={world} />;
}
