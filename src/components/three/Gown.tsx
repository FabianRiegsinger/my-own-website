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

function Cloth({ shadows, ...props }: { shadows: boolean; geometry: LatheGeometry }) {
  return (
    <mesh {...props} position={[AXIS.x, 0, AXIS.z]} scale={[DEPTH, 1, 1]} castShadow={shadows}>
      <meshStandardMaterial color={BLACK} roughness={0.85} side={DoubleSide} />
    </mesh>
  );
}

/** Wide sleeve along one arm bone, from `z0` to `z1` (signed: - his left), opening from `r0` to `r1`. */
function Sleeve({ z0, z1, r0, r1, y, shadows }: { z0: number; z1: number; r0: number; r1: number; y: number; shadows: boolean }) {
  return (
    <mesh position={[0.015, y, (z0 + z1) / 2]} rotation-x={(Math.sign(z1) * Math.PI) / 2} castShadow={shadows}>
      <cylinderGeometry args={[r1, r0, Math.abs(z1 - z0), 24, 1, true]} />
      <meshStandardMaterial color={BLACK} roughness={0.85} side={DoubleSide} />
    </mesh>
  );
}

export const Gown = forwardRef<Group, { shadows: boolean }>(function Gown({ shadows }, ref) {
  // Bodice up to just under the chin (rides on the chest), skirt over it from the waist to mid-calf (rides on the pelvis),
  // so leaning in or crouching never opens a gap.
  const bodice = useMemo(() => lathe([[0.19, 0.74], [0.185, 0.9], [0.178, 1.05], [0.17, 1.12], [0.15, 1.17], [0.1, 1.2]]), []);
  const skirt = useMemo(() => lathe([[0.2, 0.98], [0.2, 0.8], [0.23, 0.6], [0.27, 0.4], [0.3, 0.24]]), []);
  const sleeves = (side: 1 | -1, y: number) => (
    <>
      <group name={side < 0 ? "L_Upperarm" : "R_Upperarm"} matrixAutoUpdate={false}>
        <Sleeve z0={side * 0.12} z1={side * 0.36} r0={0.075} r1={0.088} y={y} shadows={shadows} />
      </group>
      <group name={side < 0 ? "L_Forearm" : "R_Forearm"} matrixAutoUpdate={false}>
        <Sleeve z0={side * 0.33} z1={side * 0.49} r0={0.086} r1={0.12} y={y} shadows={shadows} />
      </group>
    </>
  );
  return (
    <group ref={ref}>
      <group name="Spine02" matrixAutoUpdate={false}>
        <Cloth geometry={bodice} shadows={shadows} />
        {/* Stole: two green bands down the front, from the neckline to the skirt. */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.168, 1.01, AXIS.z + s * 0.065]} rotation-z={0.12}>
            <boxGeometry args={[0.008, 0.28, 0.055]} />
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
        <mesh position={[-0.005, 1.745, AXIS.z]} castShadow={shadows}>
          <cylinderGeometry args={[0.22, 0.235, 0.13, 36]} />
          <meshStandardMaterial color={BLACK} roughness={0.8} />
        </mesh>
        <mesh position={[-0.005, 1.822, AXIS.z]} castShadow={shadows}>
          <boxGeometry args={[0.56, 0.025, 0.56]} />
          <meshStandardMaterial color={BLACK} roughness={0.7} />
        </mesh>
        <mesh position={[-0.005, 1.84, AXIS.z]}>
          <cylinderGeometry args={[0.018, 0.018, 0.012, 12]} />
          <meshStandardMaterial color={GREEN} roughness={0.6} />
        </mesh>
        <mesh position={[-0.005, 1.838, AXIS.z - 0.14]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.005, 0.005, 0.27, 6]} />
          <meshStandardMaterial color={GREEN} roughness={0.6} />
        </mesh>
        <mesh position={[-0.005, 1.76, AXIS.z - 0.29]}>
          <cylinderGeometry args={[0.005, 0.005, 0.15, 6]} />
          <meshStandardMaterial color={GREEN} roughness={0.6} />
        </mesh>
        <mesh position={[-0.005, 1.67, AXIS.z - 0.29]}>
          <cylinderGeometry args={[0.006, 0.022, 0.06, 10]} />
          <meshStandardMaterial color={GREEN} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
});
