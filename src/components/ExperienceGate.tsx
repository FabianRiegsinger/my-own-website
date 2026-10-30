"use client";

import { Component, lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { CV } from "@/content/types";
import type { Dictionary } from "@/i18n";
import { canRender3D, detectEnv } from "@/lib/capabilities";
import type { Project } from "@/lib/projects";

export interface ExperienceProps {
  cv: CV;
  projects: Project[];
  t: Dictionary;
  lowPower: boolean;
  /** Reduced motion: the camera cuts between pages instead of gliding, and the landing walk-in is skipped. */
  calm: boolean;
  onFail: () => void;
}

// lazy (not next/dynamic) so the Suspense fallback keeps the static page visible while the 3D chunk loads.
const Experience3D = lazy(() => import("./three/Experience3D").then((m) => ({ default: m.Experience3D })));

/** Tells CSS the page has settled on the static version, so its still of the figure may show (see globals.css). */
function markStatic() {
  document.documentElement.dataset.experience = "static";
}

class FallbackBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    markStatic();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Server-rendered static page first; upgrade to 3D only when the device can, fall back on any failure. */
export function ExperienceGate({
  cv,
  projects,
  t,
  children,
  Experience = Experience3D,
}: {
  cv: CV;
  projects: Project[];
  t: Dictionary;
  children: ReactNode;
  Experience?: ComponentType<ExperienceProps>;
}) {
  const [mode, setMode] = useState<"static" | "3d">("static");
  const [lowPower, setLowPower] = useState(false);
  const [calm, setCalm] = useState(false);

  useEffect(() => {
    const env = detectEnv();
    if (!canRender3D(env)) return markStatic();
    // Device detection needs the browser, so it can only run after hydration: the server and first client render stay static.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLowPower(env.isMobile);
    setCalm(env.reducedMotion);
    setMode("3d");
  }, []);

  if (mode === "static") return children;
  return (
    <FallbackBoundary fallback={children}>
      <Suspense fallback={children}>
        <Experience cv={cv} projects={projects} t={t} lowPower={lowPower} calm={calm} onFail={() => {
            markStatic();
            setMode("static");
          }} />
      </Suspense>
    </FallbackBoundary>
  );
}
