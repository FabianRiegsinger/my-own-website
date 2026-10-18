"use client";

import { forwardRef, useMemo } from "react";
import { DoubleSide, type Group, LatheGeometry, Vector2 } from "three";

/**
 * Graduation gown (black, THM-green stole) and mortarboard for the likeness, modelled in his bind pose: metres, feet
 * on the floor, facing +x, his left arm along -z (GenMe's model frame). Each child group is named after the bone it
 * rides on; GenMe moves it with that bone every frame.
 */
const BLACK = "#17181b";
const GREEN = "#80ba24";
/** Body centre in the model frame, and how much flatter front to back than side to side the gown is. */
const AXIS = { x: 0.01, z: -0.012 };
const DEPTH = 0.82;

const lathe = (profile: [number, number][]) => new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), 48);

/** Gown fabric: matte black with a soft sheen at grazing angles, so folds read instead of a flat silhouette. */
const Fabric = () => <meshPhysicalMaterial color={BLACK} roughness={0.8} sheen={1} sheenColor="#5d616b" sheenRoughness={0.45} side={DoubleSide} />;

function Cloth({ shadows, ...props }: { shadows: boolean; geometry: LatheGeometry }) {
  return (
    <mesh {...props} position={[AXIS.x, 0, AXIS.z]} scale={[DEPTH, 1, 1]} castShadow={shadows}>
      <Fabric />
    </mesh>
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
  // Bodice up to just under the chin (rides on the chest), skirt over it from the waist to mid-calf (rides on the pelvis),
  // so leaning in or crouching never opens a gap.
  const bodice = useMemo(() => lathe([[0.15, 0.72], [0.175, 0.8], [0.185, 0.9], [0.185, 1.05], [0.19, 1.15], [0.17, 1.21], [0.12, 1.245], [0.075, 1.26]]), []);
  const skirt = useMemo(() => lathe([[0.188, 1.0], [0.196, 0.92], [0.2, 0.8], [0.23, 0.6], [0.27, 0.4], [0.3, 0.24]]), []);
  // Upper sleeve: gathered at the shoulder, a little full over the upper arm. Lower sleeve: the academic bell sleeve,
  // flaring and pleating toward the wrist, its open end bagging below the arm.
  const shapes = useMemo(
    () =>
      ([-1, 1] as const).map((side) => ({
        upper: sleeveGeometry(0.31, (s) => 0.086 + 0.014 * Math.sin(Math.PI * s), 0.05, 0, side),
        lower: sleeveGeometry(0.16, (s) => 0.09 + 0.06 * s ** 1.6, 0.06, 0.3, side),
      })),
    [],
  );
  const sleeves = (side: 1 | -1, y: number) => (
    <>
      <group name={side < 0 ? "L_Upperarm" : "R_Upperarm"} matrixAutoUpdate={false}>
        <Sleeve z0={side * 0.05} y={y} geometry={shapes[(side + 1) / 2].upper} shadows={shadows} />
        {/* Shoulder: covers the joint whichever way the arm turns. */}
        <mesh position={[0.015, y, side * 0.17]} castShadow={shadows}>
          <sphereGeometry args={[0.1, 24, 16]} />
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
        <Cloth geometry={bodice} shadows={shadows} />
        {/* Stole: two green bands down the front, from the neckline to the skirt. */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.172, 1.03, AXIS.z + s * 0.065]} rotation-z={0.1}>
            <boxGeometry args={[0.008, 0.32, 0.055]} />
            <meshStandardMaterial color={GREEN} roughness={0.7} />
          </mesh>
        ))}
      </group>
      <group name="Hip" matrixAutoUpdate={false}>
        <Cloth geometry={skirt} shadows={shadows} />
      </group>
      {sleeves(-1, 1.2)}
      {sleeves(1, 1.19)}
      {/* Mortarboard on top of his head: skull cap, board, button, and the tassel hanging over his left side. */}
      <group name="Head" matrixAutoUpdate={false}>
        <mesh position={[-0.005, 1.74, AXIS.z]} castShadow={shadows}>
          <cylinderGeometry args={[0.245, 0.258, 0.15, 36]} />
          <meshStandardMaterial color={BLACK} roughness={0.8} />
        </mesh>
        <mesh position={[-0.005, 1.828, AXIS.z]} castShadow={shadows}>
          <boxGeometry args={[0.6, 0.025, 0.6]} />
          <meshStandardMaterial color={BLACK} roughness={0.7} />
        </mesh>
        <mesh position={[-0.005, 1.846, AXIS.z]}>
          <cylinderGeometry args={[0.018, 0.018, 0.012, 12]} />
          <meshStandardMaterial color={GREEN} roughness={0.6} />
        </mesh>
        <mesh position={[-0.005, 1.844, AXIS.z - 0.15]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.005, 0.005, 0.29, 6]} />
          <meshStandardMaterial color={GREEN} roughness={0.6} />
        </mesh>
        <mesh position={[-0.005, 1.766, AXIS.z - 0.31]}>
          <cylinderGeometry args={[0.005, 0.005, 0.15, 6]} />
          <meshStandardMaterial color={GREEN} roughness={0.6} />
        </mesh>
        <mesh position={[-0.005, 1.676, AXIS.z - 0.31]}>
          <cylinderGeometry args={[0.006, 0.022, 0.06, 10]} />
          <meshStandardMaterial color={GREEN} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
});
