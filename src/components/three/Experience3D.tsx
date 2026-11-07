"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { startTransition, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import type { Group } from "three";
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

/** Scenes after the hero, in scroll order. Mounted one at a time once the hero figure is up (see useStaged). */
const LATER = 6;
/** Starts the later scenes anyway if the hero model is this slow, so a stuck download cannot hold back the rest. */
const HERO_TIMEOUT_MS = 6000;

/**
 * How many of the later scenes may mount: none until `go`, then one more each time the browser is idle. Building every
 * scene at once (3D text, gown, colleague models and their downloads) blocked the main thread for seconds and held the
 * hero figure back, though only the hero is on screen at first. Each scene is in place long before it is scrolled to.
 */
function useStaged(go: boolean, total: number): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!go || n >= total) return;
    // Safari has no requestIdleCallback.
    if (!window.requestIdleCallback) {
      const id = setTimeout(() => startTransition(() => setN(n + 1)), 50);
      return () => clearTimeout(id);
    }
    const id = window.requestIdleCallback(() => startTransition(() => setN(n + 1)), { timeout: 500 });
    return () => window.cancelIdleCallback(id);
  }, [go, n, total]);
  return n;
}

/** Runs `onMount` once its Suspense boundary has resolved, i.e. once everything before it in that boundary is loaded. */
function Mounted({ onMount }: { onMount: () => void }) {
  useEffect(onMount, [onMount]);
  return null;
}

/**
 * Starts hidden and shows from the end of its first frame. It commits with its children, so their frame code (which
 * hides a set that is off its page) runs before this, which runs after theirs because it subscribed after them.
 */
function HiddenUntilFirstFrame({ children }: { children: ReactNode }) {
  const root = useRef<Group>(null);
  useFrame(() => {
    if (root.current) root.current.visible = true;
  });
  return (
    <group ref={root} visible={false}>
      {children}
    </group>
  );
}

/**
 * One later scene: mounted at its turn, with its own boundary so its loading never hides a scene already shown. It
 * starts hidden: the contact shadows render the scene before a newly mounted set's own frame code has hidden it (it is
 * off its page), which would draw it once and compile shaders for it long before anyone scrolls to it.
 */
function Later({ at, staged, children }: { at: number; staged: number; children: ReactNode }) {
  if (staged <= at) return null;
  return (
    <Suspense fallback={null}>
      <HiddenUntilFirstFrame>{children}</HiddenUntilFirstFrame>
    </Suspense>
  );
}

/** Fixed full-screen 3D world behind natively scrolling text; scroll position drives camera, figure and stations. */
export function Experience3D({ cv, projects, t, lowPower: initialLowPower, calm, onFail }: ExperienceProps) {
  const [lowPower, setLowPower] = useState(initialLowPower);
  const content = useRef<HTMLDivElement>(null);
  const stationOffset = useRef(0);
  const [heroReady, setHeroReady] = useState(false);
  const staged = useStaged(heroReady, LATER);
  useEffect(() => {
    const id = setTimeout(() => setHeroReady(true), HERO_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, []);

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
            <Mounted onMount={() => setHeroReady(true)} />
          </Suspense>
          {/* Anything that loads (models, the label font) suspends inside its own boundary, inside the canvas; uncaught
              it would bubble up to the page's fallback and flash the static page back in. */}
          <Later at={0} staged={staged}>
            <Graduation education={cv.education} />
          </Later>
          <Later at={1} staged={staged}>
            <Team labels={t.scene.fusion} />
          </Later>
          <Later at={2} staged={staged}>
            <Fleet />
          </Later>
          <Later at={3} staged={staged}>
            <AgentNetwork />
          </Later>
          <Later at={4} staged={staged}>
            <SkillCloud skills={cv.skills} />
          </Later>
          <Later at={5} staged={staged}>
            <Launch />
          </Later>
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
