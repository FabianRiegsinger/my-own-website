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
  ExtrudeGeometry,
  GridHelper,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
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

/** A thin tube for a line that must read thicker than WebGL's 1px lines; placed by `setRod`. Depth-tested, so it
 * passes behind whoever stands in front of it. */
function rod(color: string, radius: number) {
  const g = new CylinderGeometry(radius, radius, 1, 8, 1, true);
  g.translate(0, 0.5, 0);
  const m = new Mesh(g, new MeshBasicMaterial({ color, transparent: true, depthWrite: false }));
  m.material.userData.base = 1;
  m.frustumCulled = false;
  m.renderOrder = 9;
  return m;
}
const UP = new Vector3(0, 1, 0);
function setRod(r: Mesh, from: Vector3, to: Vector3) {
  r.position.copy(from);
  const d = to.clone().sub(from);
  r.scale.set(1, d.length(), 1);
  r.quaternion.setFromUnitVectors(UP, d.normalize());
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

/** The ego car as a wireframe hologram: a sedan side profile (hood, cabin, trunk) extruded to its width, wheels, lights. */
function egoCar() {
  const car = new Group();
  const edge = new LineBasicMaterial({ color: ACCENT, transparent: true });
  edge.userData.base = 1;
  const add = (m: Mesh, threshold = 20) => {
    const e = new LineSegments(new EdgesGeometry(m.geometry, threshold), edge);
    e.position.copy(m.position);
    e.rotation.copy(m.rotation);
    car.add(m, e);
  };
  // Side profile, front at +x.
  const profile = new Shape();
  const pts: [number, number][] = [[-0.25, 0.1], [-0.2, 0.12], [-0.12, 0.125], [-0.06, 0.19], [0.06, 0.19], [0.13, 0.125], [0.23, 0.11], [0.25, 0.075], [0.25, 0.04]];
  profile.moveTo(-0.25, 0.04);
  for (const [x, y] of pts) profile.lineTo(x, y);
  const shell = new ExtrudeGeometry(profile, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 2 });
  shell.translate(0, 0, -0.1);
  add(new Mesh(shell, glow(ACCENT, 0.22)), 25);
  // Glasshouse: brighter panes over the cabin.
  const glass = new Shape();
  glass.moveTo(-0.11, 0.128);
  for (const [x, y] of [[-0.055, 0.183], [0.055, 0.183], [0.12, 0.128]] as [number, number][]) glass.lineTo(x, y);
  const pane = new ExtrudeGeometry(glass, { depth: 0.216, bevelEnabled: false });
  pane.translate(0, 0, -0.108);
  car.add(new Mesh(pane, glow(ACCENT, 0.35)));
  for (const x of [-0.15, 0.15])
    for (const z of [-0.1, 0.1]) {
      const w = new Mesh(new CylinderGeometry(0.045, 0.045, 0.035, 20), glow(ACCENT, 0.4));
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.045, z);
      add(w, 30);
    }
  for (const [x, c] of [[0.257, "#ffffff"], [-0.257, "#ff4d5a"]] as [number, string][])
    for (const z of [-0.07, 0.07]) {
      const l = new Mesh(new BoxGeometry(0.008, 0.018, 0.05), glow(c, 0.9));
      l.position.set(x, 0.09, z);
      car.add(l);
    }
  return car;
}

function build(team: { position: Vec3; height: number }[]) {
  const root = new Group();
  // Transparent so the page fade reaches them; still depth-writing, so they sort like solids.
  const prop = new MeshStandardMaterial({ color: "#b6b9c1", roughness: 0.9, transparent: true });
  const propDark = new MeshStandardMaterial({ color: "#8b9099", roughness: 0.9, transparent: true });
  const top = new Mesh(new CylinderGeometry(0.5, 0.48, 0.05, 64), prop);
  top.position.y = 0.75;
  // A darker rim round the top's edge, a collar under it, the stem tapering to a weighted foot.
  const rim = new Mesh(new TorusGeometry(0.495, 0.018, 12, 96), propDark);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.757;
  const collar = new Mesh(new CylinderGeometry(0.16, 0.08, 0.06, 32), propDark);
  collar.position.y = 0.695;
  const stem = new Mesh(new CylinderGeometry(0.05, 0.08, 0.66, 24), propDark);
  stem.position.y = 0.36;
  const foot = new Mesh(new CylinderGeometry(0.24, 0.27, 0.03, 48), propDark);
  foot.position.y = 0.015;
  for (const m of [top, rim, collar, stem, foot]) m.castShadow = m.receiveShadow = true;
  // The projector: a glowing pad inset in the top, ringed by a brighter emitter and a faint outer guide ring.
  const pad = new Mesh(new CylinderGeometry(0.34, 0.34, 0.012, 64), glow(ACCENT, 0.45));
  pad.position.y = 0.782;
  const emitter = new Mesh(new TorusGeometry(0.345, 0.006, 8, 96), glow(ACCENT, 0.9));
  emitter.rotation.x = Math.PI / 2;
  emitter.position.y = 0.789;
  const guide = new Mesh(new TorusGeometry(0.42, 0.002, 6, 96), glow(ACCENT, 0.35));
  guide.rotation.x = Math.PI / 2;
  guide.position.y = 0.777;
  root.add(top, rim, collar, stem, foot, pad, emitter, guide);

  // Hologram: the ego car on a strip of road, an object crossing ahead of it.
  const holo = new Group();
  holo.position.set(0.15, HOLO_Y, 0); // the car (at -0.42 x HOLO_SCALE) sits over the pad's centre
  const road = new Mesh(new PlaneGeometry(1.5, 0.9), glow(ACCENT, 0.07));
  road.rotation.x = -Math.PI / 2;
  const grid = new GridHelper(1.5, 10, ACCENT, ACCENT);
  grid.scale.z = 0.6;
  (grid.material as Material).transparent = true;
  (grid.material as Material).userData.base = 0.18;
  const car = egoCar();
  car.position.x = -0.42;
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
  const links = team.map((_, k) => rod(STREAM[k], 0.006));
  const beam = line(ACCENT, 2);
  beam.material.userData.base = 0.5;
  // One world-space group holds it all; the parts ride along in userData for the frame loop.
  const world = new Group();
  world.add(root, ...tags, ...links, beam);
  world.userData.parts = { root, holo, zones, target, dots, fused, fusedTag, trail, tags, links, beam, hist: [] as Vector3[] };
  return world;
}
type Parts = { root: Group; holo: Group; zones: Mesh[]; target: Mesh; dots: Mesh[]; fused: LineSegments; fusedTag: Sprite; trail: Line; tags: Sprite[]; links: Mesh[]; beam: Line; hist: Vector3[] };

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
      if (l.visible) setRod(l, a.set(m.position[0], m.height + 0.1, m.position[2]), set.holo.localToWorld(b.copy(tp).setY(0.1)));
    });
  });

  return <primitive ref={ref} object={world} />;
}
