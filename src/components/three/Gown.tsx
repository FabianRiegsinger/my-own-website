"use client";

import { forwardRef, useMemo, type ReactNode } from "react";
import { BufferGeometry, DoubleSide, Float32BufferAttribute, type Group, LatheGeometry, SplineCurve, Vector2, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Graduation gown (black, THM-green stole) and mortarboard for the likeness, modelled in his bind pose: metres, feet
 * on the floor, facing +x, his left arm along -z (GenMe's model frame). Each child group is named after the bone it
 * rides on; GenMe moves it with that bone every frame.
 */
const BLACK = "#1b1c21";
const GREEN = "#80ba24";
/** Body centre in the model frame, and how much flatter front to back than side to side the gown is. */
const AXIS = { x: 0.01, z: -0.012 };
const DEPTH = 0.82;

/** Bodice up to just under the chin (rides on the chest); [radius, height] from the waist up. */
const BODICE: [number, number][] = [[0.15, 0.72], [0.172, 0.8], [0.182, 0.9], [0.184, 1.04], [0.188, 1.14], [0.172, 1.205], [0.13, 1.24], [0.075, 1.262]];
/** Skirt over the bodice from the waist to mid-calf (rides on the pelvis), so leaning in or crouching never opens a gap. */
const SKIRT: [number, number][] = [[0.19, 1.0], [0.197, 0.92], [0.205, 0.8], [0.235, 0.6], [0.275, 0.4], [0.31, 0.2]];
/** Skirt pleat depth (relative radius) at height y: none at the waist, deepest at the hem. */
const skirtPleat = (y: number) => 0.045 * Math.max(0, (1 - y) / 0.8) ** 1.4;
/** Back pleats of the bodice (the yoke gathers there), none on the chest where the stole lies. */
const bodicePleat = (y: number, phi: number) => 0.02 * Math.max(0, -Math.sin(phi)) * Math.max(0, (1.15 - y) / 0.43);

/** Smooth curve through a [radius, height] profile, as many points as a silhouette needs not to show corners. */
const smooth = (profile: [number, number][]) => new SplineCurve(profile.map(([r, y]) => new Vector2(r, y))).getPoints(48);

/** Radius of a profile at height y (profile sorted either way). */
function radiusAt(points: Vector2[], y: number) {
  const ps = [...points].sort((a, b) => a.y - b.y);
  if (y <= ps[0].y) return ps[0].x;
  for (let i = 1; i < ps.length; i++) if (y <= ps[i].y) return ps[i - 1].x + ((ps[i].x - ps[i - 1].x) * (y - ps[i - 1].y)) / (ps[i].y - ps[i - 1].y);
  return ps[ps.length - 1].x;
}

/**
 * Lathe through `profile` with `pleats` vertical folds of relative depth `pleat(y, phi)` (phi: 0 his right, π/2 the
 * front). Welded before the normals so the lathe's seam does not show as a crease.
 */
function cloth(profile: Vector2[], pleats: number, pleat: (y: number, phi: number) => number) {
  const g = new LatheGeometry(profile, 160);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = [p.getX(i), p.getY(i), p.getZ(i)];
    const phi = Math.atan2(x, z);
    // Rounded folds (|sin| would crease): crests stand out, valleys stay soft.
    const k = 1 + pleat(y, phi) * (0.5 + 0.5 * Math.sin(pleats * phi)) ** 1.5;
    p.setXYZ(i, x * k, y, z * k);
  }
  g.deleteAttribute("uv");
  const w = mergeVertices(g, 1e-5);
  w.computeVertexNormals();
  return w;
}

/**
 * Stole band for one side (+1 his right): from the hem of the bodice up the chest, over the shoulder beside the neck
 * and down the back, lying on the gown (`surface`: radius of the outermost layer at height y) in lathe space.
 */
function stoleGeometry(side: 1 | -1, surface: (y: number) => number) {
  const WIDTH = 0.06;
  // [phi, height]: phi π/2 is the front centre; the bands sit apart low on the chest and close in toward the neck.
  const path = new SplineCurve(
    [[0.44, 0.78], [0.42, 0.95], [0.38, 1.12], [0.5, 1.205], [1.05, 1.238], [1.6, 1.246], [2.3, 1.236], [2.9, 1.19], [3.05, 1.08]].map(
      ([d, y]) => new Vector2(Math.PI / 2 - side * d, y),
    ),
  ).getPoints(96);
  const at = (phi: number, y: number) => {
    const r = surface(y) + 0.005;
    return new Vector3(r * Math.sin(phi), y, r * Math.cos(phi));
  };
  const pos: number[] = [];
  const idx: number[] = [];
  path.forEach((q, i) => {
    const c = at(q.x, q.y);
    const n = path[Math.min(i + 1, path.length - 1)];
    const b = path[Math.max(i - 1, 0)];
    const t = at(n.x, n.y).sub(at(b.x, b.y)).normalize();
    // Outward from the gown (the lathe's slope tilts it up near the neck).
    const dy = 0.002;
    const out = new Vector3(Math.sin(q.x), -(surface(q.y + dy) - surface(q.y - dy)) / (2 * dy), Math.cos(q.x)).normalize();
    const across = t.clone().cross(out).normalize().multiplyScalar(WIDTH / 2);
    pos.push(...c.clone().add(across).toArray(), ...c.clone().sub(across).toArray());
    if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
  });
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Gown fabric: matte black with a soft sheen at grazing angles, so folds read instead of a flat silhouette. */
const Fabric = () => <meshPhysicalMaterial color={BLACK} roughness={0.8} sheen={0.8} sheenColor="#5f6470" sheenRoughness={0.5} side={DoubleSide} />;

/** Sits a lathe-space piece on the body: centred and flattened front to back like the gown. */
function OnBody({ children }: { children: ReactNode }) {
  return (
    <group position={[AXIS.x, 0, AXIS.z]} scale={[DEPTH, 1, 1]}>
      {children}
    </group>
  );
}

/**
 * Sleeve along +y (length `len`, radius `radius(s)` for s = 0..1 along it), with soft pleats that deepen toward the
 * opening (`pleat`: relative depth there) and a bag that hangs below the arm at the open end (`bag`: relative extra
 * radius on the underside). `side` is the arm (+1 his right): the underside is lathe +z on the right, -z on the left,
 * which the mesh's quarter turn about x maps to world down.
 */
export function sleeveGeometry(len: number, radius: (s: number) => number, pleat: number, bag: number, side: 1 | -1) {
  const RINGS = 16;
  const g = new LatheGeometry(Array.from({ length: RINGS + 1 }, (_, i) => new Vector2(radius(i / RINGS), (i / RINGS) * len)), 64);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = [p.getX(i), p.getY(i), p.getZ(i)];
    const s = y / len;
    const phi = Math.atan2(x, z);
    const under = Math.max(0, side * Math.cos(phi)) ** 2;
    const k = 1 + pleat * s * s * Math.sin(9 * phi) + bag * s ** 3 * under;
    p.setXYZ(i, x * k, y, z * k);
  }
  g.computeVertexNormals();
  return g;
}

/** Sleeve from `z0` along the arm (signed: - his left), at height `y`. */
function Sleeve({ z0, y, geometry, shadows }: { z0: number; y: number; geometry: LatheGeometry; shadows: boolean }) {
  return (
    <mesh geometry={geometry} position={[0.015, y, z0]} rotation-x={(Math.sign(z0) * Math.PI) / 2} castShadow={shadows}>
      <Fabric />
    </mesh>
  );
}

export const Gown = forwardRef<Group, { shadows: boolean }>(function Gown({ shadows }, ref) {
  const { bodice, skirt, stoles } = useMemo(() => {
    const b = smooth(BODICE);
    const s = smooth(SKIRT);
    // The stole lies on whichever layer is outside at that height, over the crests of the skirt's pleats.
    const surface = (y: number) => Math.max(radiusAt(b, y), y <= 1 ? radiusAt(s, y) * (1 + skirtPleat(y)) : 0);
    return {
      bodice: cloth(b, 22, bodicePleat),
      skirt: cloth(s, 26, skirtPleat),
      stoles: ([-1, 1] as const).map((side) => stoleGeometry(side, surface)),
    };
  }, []);
  // Upper sleeve: from the shoulder joint (any further in would swing up above the shoulder as the arm hangs), a little
  // full over the upper arm. Lower sleeve: the academic bell sleeve,
  // flaring and pleating toward the wrist, its open end bagging below the arm.
  const shapes = useMemo(
    () =>
      ([-1, 1] as const).map((side) => ({
        upper: sleeveGeometry(0.22, (s) => 0.086 + 0.014 * Math.sin(Math.PI * s), 0.05, 0, side),
        lower: sleeveGeometry(0.16, (s) => 0.09 + 0.06 * s ** 1.6, 0.06, 0.3, side),
      })),
    [],
  );
  const board = useMemo(() => new RoundedBoxGeometry(0.6, 0.022, 0.6, 3, 0.008), []);
  const sleeves = (side: 1 | -1, y: number) => (
    <>
      <group name={side < 0 ? "L_Upperarm" : "R_Upperarm"} matrixAutoUpdate={false}>
        <Sleeve z0={side * 0.14} y={y} geometry={shapes[(side + 1) / 2].upper} shadows={shadows} />
        {/* Shoulder: covers the joint whichever way the arm turns, flattened so it never rises above the yoke. */}
        <mesh position={[0.015, y - 0.01, side * 0.16]} scale={[1, 0.8, 1]} castShadow={shadows}>
          <sphereGeometry args={[0.085, 32, 20]} />
          <Fabric />
        </mesh>
      </group>
      <group name={side < 0 ? "L_Forearm" : "R_Forearm"} matrixAutoUpdate={false}>
        <Sleeve z0={side * 0.33} y={y} geometry={shapes[(side + 1) / 2].lower} shadows={shadows} />
      </group>
    </>
  );
  return (
    <group ref={ref}>
      <group name="Spine02" matrixAutoUpdate={false}>
        <OnBody>
          <mesh geometry={bodice} castShadow={shadows}>
            <Fabric />
          </mesh>
          {/* Stole: a green band each side, up the chest, round the neck and down the back. */}
          {stoles.map((g, i) => (
            <mesh key={i} geometry={g}>
              <meshPhysicalMaterial color={GREEN} roughness={0.55} sheen={0.6} sheenColor="#d8f0a8" side={DoubleSide} />
            </mesh>
          ))}
        </OnBody>
      </group>
      <group name="Hip" matrixAutoUpdate={false}>
        <OnBody>
          <mesh geometry={skirt} castShadow={shadows}>
            <Fabric />
          </mesh>
        </OnBody>
      </group>
      {sleeves(-1, 1.2)}
      {sleeves(1, 1.19)}
      {/* Mortarboard on top of his head: skull cap, board, button, and the tassel hanging over his left side. */}
      <group name="Head" matrixAutoUpdate={false}>
        <mesh position={[-0.005, 1.745, AXIS.z]} castShadow={shadows}>
          <cylinderGeometry args={[0.238, 0.255, 0.14, 64, 1, true]} />
          <Fabric />
        </mesh>
        <mesh geometry={board} position={[-0.005, 1.826, AXIS.z]} castShadow={shadows}>
          <meshPhysicalMaterial color={BLACK} roughness={0.6} sheen={1} sheenColor="#7c8190" sheenRoughness={0.35} />
        </mesh>
        <mesh position={[-0.005, 1.842, AXIS.z]}>
          <sphereGeometry args={[0.02, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={GREEN} roughness={0.6} />
        </mesh>
        <mesh position={[-0.005, 1.84, AXIS.z - 0.15]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.005, 0.005, 0.29, 8]} />
          <meshStandardMaterial color={GREEN} roughness={0.6} />
        </mesh>
        <mesh position={[-0.005, 1.766, AXIS.z - 0.302]}>
          <cylinderGeometry args={[0.005, 0.005, 0.15, 8]} />
          <meshStandardMaterial color={GREEN} roughness={0.6} />
        </mesh>
        <mesh position={[-0.005, 1.68, AXIS.z - 0.302]}>
          <cylinderGeometry args={[0.007, 0.024, 0.07, 16]} />
          <meshStandardMaterial color={GREEN} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
});
