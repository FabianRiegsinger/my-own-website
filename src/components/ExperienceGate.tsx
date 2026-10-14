"use client";

import { Component, lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { CV } from "@/content/types";
import { canRender3D, detectEnv } from "@/lib/capabilities";
import type { Project } from "@/lib/projects";

export interface ExperienceProps {
  cv: CV;
  projects: Project[];
  lowPower: boolean;
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
  children,
  Experience = Experience3D,
}: {
  cv: CV;
  projects: Project[];
  children: ReactNode;
  Experience?: ComponentType<ExperienceProps>;
}) {
  const [mode, setMode] = useState<"static" | "3d">("static");
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    const env = detectEnv();
    if (!canRender3D(env)) return markStatic();
    // Device detection needs the browser, so it can only run after hydration: the server and first client render stay static.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLowPower(env.isMobile);
    setMode("3d");
  }, []);

  if (mode === "static") return children;
  return (
    <FallbackBoundary fallback={children}>
      <Suspense fallback={children}>
        <Experience cv={cv} projects={projects} lowPower={lowPower} onFail={() => {
            markStatic();
            setMode("static");
          }} />
      </Suspense>
    </FallbackBoundary>
  );
}
