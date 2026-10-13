"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { type Group, MeshPhysicalMaterial } from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

export const WORD = "Claude";
/** One colour per letter, starting from Claude's own orange. */
export const LETTER_COLORS = ["#d97757", "#f4b740", "#4cc38a", "#3b82f6", "#8b5cf6", "#ec4899"];
/** Inter ExtraBold, only these six glyphs (scripts/make-typeface.mjs). */
const FONT = "/fonts/inter-800-claude.typeface.json";
const SIZE = 1.5;
const GAP = 0.06;

/** Left edge x of each letter (advance `widths`), the whole word centred on x = 0. */
export function layoutLetters(widths: number[], gap: number): number[] {
  const total = widths.reduce((a, w) => a + w, 0) + gap * (widths.length - 1);
  let x = -total / 2;
  return widths.map((w) => {
    const at = x;
    x += w + gap;
    return at;
  });
}

/** Skills page: "Claude", big, extruded and colourful, tilted a little behind the figure. */
export function ClaudeWord() {
  const root = useRef<Group>(null);
  const letters = useRef<Group>(null);
  const offset = useStationOffset();
  const font = useLoader(FontLoader, FONT);

  const parts = useMemo(() => {
    const geometries = [...WORD].map((ch) => {
      const g = new TextGeometry(ch, { font, size: SIZE, depth: 0.35, curveSegments: 8, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.025, bevelSegments: 3 });
      g.computeBoundingBox();
      g.translate(-g.boundingBox!.min.x, 0, 0);
      return g;
    });
    const xs = layoutLetters(
      geometries.map((g) => g.boundingBox!.max.x - g.boundingBox!.min.x),
      GAP,
    );
    return geometries.map((geometry, i) => ({
      geometry,
      x: xs[i],
      material: new MeshPhysicalMaterial({ color: LETTER_COLORS[i], roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 }),
    }));
  }, [font]);

  useFrame(({ clock }) => {
    if (!root.current || !letters.current) return;
    fade(root.current, stationWeight(offset.current, "skills"));
    if (!root.current.visible) return;
    const t = clock.elapsedTime;
    letters.current.children.forEach((l, i) => {
      l.position.y = 0.08 * Math.sin(t * 1.1 + i * 0.7); // each letter bobs a little out of step
      l.rotation.y = 0.06 * Math.sin(t * 0.8 + i);
    });
  });

  // Behind the figure, slightly turned and tilted, filling the space right of the text panel. z = -7 keeps it outside
  // the floor's contact-shadow capture (10 x 10 around the origin), which would smear it into a grey band.
  return (
    <group ref={root} position={[-0.4, 1.4, -7]} rotation={[0.04, 0.22, 0.05]}>
      <group ref={letters}>
        {parts.map((p, i) => (
          <group key={i} position-x={p.x}>
            <mesh geometry={p.geometry} material={p.material} castShadow />
          </group>
        ))}
      </group>
    </group>
  );
}
