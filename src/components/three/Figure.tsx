"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { MathUtils, type Group, type Mesh } from "three";
import { entrance, poseFor } from "@/lib/entrance";
import { heading, stationAt, type ClipName } from "@/lib/scroll-map";
import { applyArms, findArms } from "./arm-pose";
import { attachHead, paintBody, updateAvatar } from "./avatar";
import { switchClip } from "./clips";
import { useStationOffset } from "./station-offset";

const MODEL = "/models/figure.glb";
const FADE = 0.4;
/** Scrolling past this many pixels ends the landing entrance so the page never fights the reader. */
const TOP_PX = 40;
const atTop = () => window.scrollY < TOP_PX;

export function Figure({ shadows }: { shadows: boolean }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL, "/draco/");
  const { actions, mixer } = useAnimations(animations, group);
  const offset = useStationOffset();
  const current = useRef<ClipName | null>(null);
  const intro = useRef<{ start: number | null; done: boolean }>({ start: null, done: false });
  const pose = useRef({ wave: 0, hips: 0 });
  const arms = useMemo(() => findArms(scene), [scene]);
  const head = useRef<Group | null>(null);

  useMemo(() => paintBody(scene), [scene]);
  useEffect(() => {
    scene.traverse((o) => {
      if ((o as Mesh).isMesh) o.castShadow = shadows;
    });
  }, [scene, shadows]);

  const clipFor = (offset: number): ClipName => {
    const wanted = stationAt(offset).clip;
    return actions[wanted] ? wanted : "idle"; // placeholder model lacks typing/wave
  };

  // Pose the skeleton before the first frame is drawn, so the T-pose never shows.
  // At the top of the page the figure starts off-screen right, mid-walk; anywhere else it is already in place.
  useLayoutEffect(() => {
    const top = atTop();
    intro.current.done = !top;
    const start = top ? entrance(0) : null;
    if (group.current && start) {
      group.current.position.x = start.x;
      group.current.rotation.y = start.heading;
    }
    if (!top) pose.current = poseFor(stationAt(offset.current).clip);
    const clip = start?.clip ?? clipFor(offset.current);
    switchClip(actions, null, clip, FADE);
    mixer.update(0);
    current.current = clip;
    // Memoji head over the mannequin's, sized from the posed head so it never pokes through.
    head.current = attachHead(scene);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when the animations are bound
  }, [actions, mixer]);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const it = intro.current;
    if (!it.done && !atTop()) it.done = true;
    let clip: ClipName;
    if (!it.done) {
      it.start ??= clock.elapsedTime;
      const s = entrance(clock.elapsedTime - it.start);
      g.position.x = s.x;
      g.rotation.y = s.heading;
      pose.current = { wave: s.wave, hips: s.hips };
      clip = s.clip;
      it.done = s.done;
    } else {
      g.position.x = MathUtils.damp(g.position.x, 0, 6, dt);
      // Walk toward the oncoming milestones (the future), not away from them.
      g.rotation.y = MathUtils.damp(g.rotation.y, heading(offset.current), 4, dt);
      const p = poseFor(stationAt(offset.current).clip);
      pose.current.wave = MathUtils.damp(pose.current.wave, p.wave, 6, dt);
      pose.current.hips = MathUtils.damp(pose.current.hips, p.hips, 6, dt);
      clip = clipFor(offset.current);
    }
    if (clip !== current.current) {
      switchClip(actions, current.current, clip, FADE);
      current.current = clip;
    }
    // Runs after useAnimations' mixer update (registered first), so the overlay sits on this frame's pose.
    if (arms) applyArms(g, arms, pose.current, clock.elapsedTime);
    if (head.current) updateAvatar(head.current, clock.elapsedTime);
  });

  return <primitive ref={group} object={scene} />;
}

useGLTF.preload(MODEL, "/draco/");
