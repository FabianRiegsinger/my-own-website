"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Suspense, useRef, useState } from "react";
import type { ExperienceProps } from "../ExperienceGate";
import { Sections } from "../StaticPage";
import { CameraRig } from "./CameraRig";
import { GenMe } from "./GenMe";
import { ScrollTracker } from "./ScrollTracker";
import { StationOffset } from "./station-offset";
import { AgentNetwork } from "./stations/AgentNetwork";
import { Graduation } from "./stations/Graduation";
import { Launch } from "./stations/Launch";
import { Fleet } from "./stations/Fleet";
import { SkillCloud } from "./stations/SkillCloud";
import { Team } from "./stations/Team";

/** Fixed full-screen 3D world behind natively scrolling text; scroll position drives camera, figure and stations. */
export function Experience3D({ cv, projects, t, lowPower: initialLowPower, calm, onFail }: ExperienceProps) {
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
          {/* Transparent canvas: the page's soft colour field shows through, which the glass panels need to read as glass. */}
          <PerformanceMonitor onDecline={() => setLowPower(true)} />
          <Environment resolution={256}>
            <Lightformer intensity={2} position={[0, 5, -2]} scale={[10, 2, 1]} rotation-x={Math.PI / 2} />
            <Lightformer intensity={1} position={[-5, 1, 0]} scale={[2, 6, 1]} rotation-y={Math.PI / 2} />
            <Lightformer intensity={1} position={[5, 1, 0]} scale={[2, 6, 1]} rotation-y={-Math.PI / 2} />
          </Environment>
          <hemisphereLight args={["#ffffff", "#f5f5f7", 0.8]} />
          <directionalLight position={[3, 6, 4]} intensity={1.2} castShadow={!lowPower} />
          <ScrollTracker content={content} />
          <CameraRig calm={calm} />
          <Suspense fallback={null}>
            <GenMe shadows={!lowPower} calm={calm} greeting={t.scene.hello} />
          </Suspense>
          <Graduation education={cv.education} />
          {/* Anything that loads (models, the label font) suspends here, inside the canvas; uncaught it would
              bubble up to the page's fallback and flash the static page back in. */}
          <Suspense fallback={null}>
            <Team labels={t.scene.fusion} />
            <Fleet />
            <SkillCloud skills={cv.skills} />
          </Suspense>
          <AgentNetwork />
          <Launch />
          {/* Always live: freezing them on low power (frames={1}) would keep whatever stood on the floor at that moment
              (rocket pad, colleagues, cars) as a stale shadow on every later page. Cheaper at low resolution instead. */}
          <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={10} blur={2.5} far={4} resolution={lowPower ? 256 : 512} />
        </Canvas>
      </div>
      <main ref={content} className="relative">
        <Sections cv={cv} projects={projects} t={t} />
      </main>
    </StationOffset.Provider>
  );
}
