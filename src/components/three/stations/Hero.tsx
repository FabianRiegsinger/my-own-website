"use client";

import { Grid } from "@react-three/drei";

/** Paper floor with a hard black grid, the stage every station stands on. */
export function Hero() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[80, 80]} />
        {/* Unlit, so the floor matches the page background exactly: no grey horizon band. */}
        <meshBasicMaterial color="#f4f1ea" toneMapped={false} />
      </mesh>
      <Grid
        position-y={0.002}
        infiniteGrid
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#000000"
        sectionSize={2.5}
        sectionThickness={1.4}
        sectionColor="#000000"
        fadeDistance={22}
        fadeStrength={1.5}
      />
    </>
  );
}
