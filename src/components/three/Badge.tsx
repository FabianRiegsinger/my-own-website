"use client";

import { forwardRef, useMemo } from "react";
import { CanvasTexture, type Group, Matrix4, Quaternion, SRGBColorSpace, Vector3 } from "three";
import type { StationId } from "@/lib/scroll-map";

/**
 * Brand colour of each career page (as the page tints in globals.css): his shirt takes it on that page (GenMe), and on
 * the job pages a white patch with the company name in that colour sits on his left chest, as text, never a logo.
 */
export const BRANDS: { id: StationId; shirt: string; badge?: string }[] = [
  { id: "education", shirt: "#80ba24" },
  { id: "esas", shirt: "#f25544", badge: "esas" },
  { id: "mobileye", shirt: "#1e2eb8", badge: "Mobileye" },
];

/**
 * Patch on his left chest (metres): `x` just in front of the shirt, `y` below the collar, `z` toward his left; `w` wide,
 * `h` tall; `lean` follows the chest sloping back toward the collar, `curve` the shirt turning away toward his side.
 */
const PATCH = { x: 0.103, y: 1.15, z: -0.07, w: 0.075, h: 0.045, lean: 0.25, curve: 0.4 };

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
 * Chest patch for one company, modelled in his bind pose like the Gown (metres, facing +x, his left arm along -z);
 * the child group is named after the bone it rides on and GenMe moves it with that bone every frame.
 */
export const Badge = forwardRef<Group, { name: string; color: string }>(function Badge({ name, color }, ref) {
  const map = useMemo(() => patchTexture(name, color), [name, color]);
  // Text reads left to right from the front (-z is the viewer's right), tilted onto the chest's slope.
  const turn = useMemo(() => {
    const right = new Vector3(-PATCH.curve, 0, -1).normalize();
    const out = right.clone().cross(new Vector3(-PATCH.lean, 1, 0)).normalize();
    return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, out.clone().cross(right), out));
  }, []);
  return (
    <group ref={ref}>
      <group name="Spine02" matrixAutoUpdate={false}>
        <mesh position={[PATCH.x, PATCH.y, PATCH.z]} quaternion={turn}>
          <planeGeometry args={[PATCH.w, PATCH.h]} />
          <meshStandardMaterial map={map} transparent alphaTest={0.5} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
});
