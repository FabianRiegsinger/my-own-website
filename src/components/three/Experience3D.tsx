"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { memo, startTransition, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import type { Group } from "three";
import type { CV } from "@/content/types";
import type { Dictionary } from "@/i18n";
import { ENTRANCE } from "@/lib/entrance";
import type { ExperienceProps } from "../ExperienceGate";
import { Sections } from "../StaticPage";
import { CameraRig } from "./CameraRig";
import { GenMe } from "./GenMe";
import { Pacer } from "./Pacer";
import { ScrollTracker } from "./ScrollTracker";
import { StationOffset } from "./station-offset";
import { AgentNetwork } from "./stations/AgentNetwork";
import { Graduation } from "./stations/Graduation";
import { Launch } from "./stations/Launch";
import { Fleet } from "./stations/Fleet";
import { SkillCloud } from "./stations/SkillCloud";
import { Team } from "./stations/Team";

/** Starts the later scenes anyway if the hero model is this slow, so a stuck download cannot hold back the rest. */
const HERO_TIMEOUT_MS = 6000;

/**
 * False until `go`, then true at the browser's next idle moment. Gates the scenes after the hero: building every scene
 * at once (3D text, gown, colleague models and their downloads) held the hero figure back for seconds, though only the
 * hero is on screen at first. They are built together in one go, not one by one: on a slow device each build also costs
 * the graphics process a lot, and spreading that over many seconds kept the page sluggish while people use it.
 */
function useIdleAfter(go: boolean): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!go || idle) return;
    // Safari has no requestIdleCallback.
    if (!window.requestIdleCallback) {
      const id = setTimeout(() => startTransition(() => setIdle(true)), 50);
      return () => clearTimeout(id);
    }
    const id = window.requestIdleCallback(() => startTransition(() => setIdle(true)), { timeout: 500 });
    return () => window.cancelIdleCallback(id);
  }, [go, idle]);
  return idle;
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
 * One later scene: mounted once `show`, with its own boundary so its loading never hides a scene already shown. It
 * starts hidden: the contact shadows render the scene before a newly mounted set's own frame code has hidden it (it is
 * off its page), which would draw it once and compile shaders for it long before anyone scrolls to it.
 */
function Later({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null;
  return (
    <Suspense fallback={null}>
      <HiddenUntilFirstFrame>{children}</HiddenUntilFirstFrame>
    </Suspense>
  );
}

/**
 * Image-based lighting, memoised: drei's Environment re-renders its cube map and blur whenever it re-renders (its
 * children are new elements each time), a heavy GPU job that would otherwise run again on every state change above.
 */
const Lighting = memo(function Lighting() {
  return (
    <Environment resolution={256}>
      <Lightformer intensity={2} position={[0, 5, -2]} scale={[10, 2, 1]} rotation-x={Math.PI / 2} />
      <Lightformer intensity={1} position={[-5, 1, 0]} scale={[2, 6, 1]} rotation-y={Math.PI / 2} />
      <Lightformer intensity={1} position={[5, 1, 0]} scale={[2, 6, 1]} rotation-y={-Math.PI / 2} />
    </Environment>
  );
});

/** The figure, then every other page's set once he is up. Owns that state so its changes re-render only the scenes. */
function Scenes({ cv, t, lowPower, calm, onDecline }: { cv: CV; t: Dictionary; lowPower: boolean; calm: boolean; onDecline: () => void }) {
  const [heroReady, setHeroReady] = useState(false);
  // Full frame rate through his walk-in, which plays without any input; set once, when he first appears.
  const [holdUntil, setHoldUntil] = useState(0);
  const onHero = () => {
    setHeroReady(true);
    setHoldUntil((h) => h || performance.now() + (ENTRANCE.walk + ENTRANCE.turn + ENTRANCE.wave + ENTRANCE.settle) * 1000);
  };
  const later = useIdleAfter(heroReady);
  useEffect(() => {
    const id = setTimeout(() => setHeroReady(true), HERO_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <>
      <Pacer holdUntil={holdUntil} onDecline={onDecline} />
      <Suspense fallback={null}>
        <GenMe shadows={!lowPower} calm={calm} greeting={t.scene.hello} />
        <Mounted onMount={onHero} />
      </Suspense>
      {/* Anything that loads (models, the label font) suspends inside its own boundary, inside the canvas; uncaught
          it would bubble up to the page's fallback and flash the static page back in. */}
      <Later show={later}>
        <Graduation education={cv.education} />
      </Later>
      <Later show={later}>
        <Team labels={t.scene.fusion} />
      </Later>
      <Later show={later}>
        <Fleet />
      </Later>
      <Later show={later}>
        <AgentNetwork />
      </Later>
      <Later show={later}>
        <SkillCloud skills={cv.skills} />
      </Later>
      <Later show={later}>
        <Launch />
      </Later>
    </>
  );
}

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
          frameloop="never" // Pacer drives it
          shadows={!lowPower}
          camera={{ position: [0, 1.4, 5], fov: 35 }}
          onCreated={({ gl }) => gl.domElement.addEventListener("webglcontextlost", onFail)}
        >
          {/* Transparent canvas: the page's soft colour field shows through, which the glass panels need to read as glass. */}
          <Lighting />
          <hemisphereLight args={["#ffffff", "#f5f5f7", 0.8]} />
          <directionalLight position={[3, 6, 4]} intensity={1.2} castShadow={!lowPower} />
          <ScrollTracker content={content} />
          <CameraRig calm={calm} />
          <Scenes cv={cv} t={t} lowPower={lowPower} calm={calm} onDecline={() => setLowPower(true)} />
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
