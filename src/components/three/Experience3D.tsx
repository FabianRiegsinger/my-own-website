"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, Loader, PerformanceMonitor } from "@react-three/drei";
import { Suspense, useRef, useState } from "react";
import type { ExperienceProps } from "../ExperienceGate";
import { Sections } from "../StaticPage";
import { CameraRig } from "./CameraRig";
import { Figure } from "./Figure";
import { ScrollTracker } from "./ScrollTracker";
import { StationOffset } from "./station-offset";

/** Fixed full-screen 3D world behind natively scrolling text; scroll position drives camera, figure and stations. */
export function Experience3D({ cv, projects, lowPower: initialLowPower, onFail }: ExperienceProps) {
  const [lowPower, setLowPower] = useState(initialLowPower);
  const content = useRef<HTMLDivElement>(null);
  const stationOffset = useRef(0);

  return (
    <StationOffset.Provider value={stationOffset}>
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <Canvas
          dpr={[1, 1.5]}
          shadows={!lowPower}
          camera={{ position: [0, 1.4, 5], fov: 35 }}
          onCreated={({ gl }) => gl.domElement.addEventListener("webglcontextlost", onFail)}
        >
          <color attach="background" args={["#f5f5f7"]} />
          <PerformanceMonitor onDecline={() => setLowPower(true)} />
          <Environment resolution={256}>
            <Lightformer intensity={2} position={[0, 5, -2]} scale={[10, 2, 1]} rotation-x={Math.PI / 2} />
            <Lightformer intensity={1} position={[-5, 1, 0]} scale={[2, 6, 1]} rotation-y={Math.PI / 2} />
            <Lightformer intensity={1} position={[5, 1, 0]} scale={[2, 6, 1]} rotation-y={-Math.PI / 2} />
          </Environment>
          <directionalLight position={[3, 6, 4]} intensity={1.2} castShadow={!lowPower} />
          <ScrollTracker content={content} />
          <CameraRig />
          <Suspense fallback={null}>
            <Figure shadows={!lowPower} />
          </Suspense>
          <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={10} blur={2.5} far={4} frames={lowPower ? 1 : Infinity} />
        </Canvas>
      </div>
      <main ref={content} className="relative">
        <Sections cv={cv} projects={projects} />
      </main>
      <Loader containerStyles={{ background: "#f5f5f7" }} barStyles={{ background: "#2563eb" }} dataStyles={{ color: "#1d1d1f" }} />
    </StationOffset.Provider>
  );
}
