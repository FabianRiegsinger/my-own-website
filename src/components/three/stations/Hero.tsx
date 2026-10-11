"use client";

import { Grid } from "@react-three/drei";

/** Glowing perspective wireframe floor, as in engineering banner art; fog fades it into the navy sky. */
export function Hero() {
  return (
    <Grid
      infiniteGrid
      cellSize={0.5}
      cellThickness={0.6}
      cellColor="#3a4bb0"
      sectionSize={2.5}
      sectionThickness={1.2}
      sectionColor="#7b5cf0"
      fadeDistance={20}
      fadeStrength={1.2}
    />
  );
}
