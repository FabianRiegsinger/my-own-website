"use client";

import { forwardRef, useMemo } from "react";
import { CanvasTexture, type Group, Matrix4, Quaternion, SRGBColorSpace, Vector3 } from "three";
import type { StationId } from "@/lib/scroll-map";

/**
 * Brand colour of each career page (as the page tints in globals.css): his shirt takes it on that page (GenMe), and on
 * the job pages a white patch with the company name in that colour sits on each sleeve, as text, never a logo.
 */
export const BRANDS: { id: StationId; shirt: string; badge?: string }[] = [
  { id: "education", shirt: "#80ba24" },
  { id: "esas", shirt: "#f25544", badge: "esas" },
  { id: "mobileye", shirt: "#1e2eb8", badge: "Mobileye" },
];

/**
 * Patch on the top of the upper arm in the T-pose, which is its outer side once the arm hangs (metres): `z` out along
 * the arm, `y` just above the sleeve, `x` the arm's centre; `w` across the arm, `h` along it; `slope` rises toward the
 * shoulder with the deltoid, so neither end sinks into the sleeve.
 */
const PATCH = { x: -0.016, y: 1.238, z: 0.18, w: 0.065, h: 0.042, slope: 0.4 };

function patchTexture(name: string, color: string) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 200;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.roundRect(0, 0, 320, 200, 36);
  g.fill();
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `800 ${name.length > 5 ? 70 : 104}px Inter, system-ui, sans-serif`;
  g.fillText(name, 160, 104);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/**
 * Sleeve patches for one company, modelled in his bind pose like the Gown (metres, facing +x, his left arm along -z);
 * each child group is named after the bone it rides on and GenMe moves it with that bone every frame.
 */
export const Badge = forwardRef<Group, { name: string; color: string }>(function Badge({ name, color }, ref) {
  const map = useMemo(() => patchTexture(name, color), [name, color]);
  // Text reads upright from beside him once the arm hangs: up toward the shoulder, left to right as seen from outside.
  const turn = useMemo(
    () =>
      ([1, -1] as const).map((side) =>
        new Quaternion().setFromRotationMatrix(
          new Matrix4().makeBasis(new Vector3(side, 0, 0), new Vector3(0, PATCH.slope, -side).normalize(), new Vector3(0, 1, side * PATCH.slope).normalize()),
        ),
      ),
    [],
  );
  return (
    <group ref={ref}>
      {([1, -1] as const).map((side, i) => (
        <group key={side} name={side > 0 ? "R_Upperarm" : "L_Upperarm"} matrixAutoUpdate={false}>
          <mesh position={[PATCH.x, PATCH.y, side * PATCH.z]} quaternion={turn[i]}>
            <planeGeometry args={[PATCH.w, PATCH.h]} />
            <meshStandardMaterial map={map} transparent alphaTest={0.5} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
});
