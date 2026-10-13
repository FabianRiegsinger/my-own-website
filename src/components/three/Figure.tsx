"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { MathUtils, type Group, type Mesh, type Object3D } from "three";
import { entrance, introStep, POSES, poseFor, type Pose } from "@/lib/entrance";
import { heading, stationAt, type ClipName } from "@/lib/scroll-map";
import { applyArms, findArms } from "./arm-pose";
import { attachHead, paintBody, setOutfit, updateAvatar } from "./avatar";
import { buildLaptop, buildTablet } from "./props";
import { switchClip } from "./clips";
import { useStationOffset } from "./station-offset";

export const MODEL = "/models/figure.glb";
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
  const intro = useRef({ t: 0, done: false });
  const pose = useRef<Pose>(poseFor("walk"));
  const arms = useMemo(() => findArms(scene), [scene]);
  const head = useRef<Group | null>(null);
  const props = useRef<{ laptop: Object3D; tablet: Object3D } | null>(null);

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
    // Page props: laptop (ESAS), tablet (Mobileye). Shown by pose weight.
    if (!props.current && arms) {
      const p = { laptop: buildLaptop(), tablet: buildTablet(arms.left.side) };
      Object.values(p).forEach((o) => (o.userData.avatarExtra = true)); // so copies of the rig can drop them
      scene.add(p.laptop, p.tablet);
      props.current = p;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when the animations are bound
  }, [actions, mixer]);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const it = intro.current;
    if (!it.done && !atTop()) it.done = true;
    let clip: ClipName;
    if (!it.done) {
      it.t = introStep(it.t, dt); // frame time, not wall time: a first-frame stall must not skip the walk-in
      const s = entrance(it.t);
      g.position.x = s.x;
      g.rotation.y = s.heading;
      pose.current = s.pose;
      clip = s.clip;
      it.done = s.done;
    } else {
      g.position.x = MathUtils.damp(g.position.x, 0, 6, dt);
      g.rotation.y = MathUtils.damp(g.rotation.y, heading(offset.current), 4, dt);
      const p = poseFor(stationAt(offset.current).clip);
      for (const k of POSES) pose.current[k] = MathUtils.damp(pose.current[k], p[k], 6, dt);
      clip = clipFor(offset.current);
    }
    if (clip !== current.current) {
      switchClip(actions, current.current, clip, FADE);
      current.current = clip;
    }
    // Runs after useAnimations' mixer update (registered first), so the overlay sits on this frame's pose.
    if (arms) applyArms(g, arms, pose.current, clock.elapsedTime);
    if (head.current) updateAvatar(head.current, clock.elapsedTime);
    const pr = props.current;
    if (pr) {
      const p = pose.current;
      pr.laptop.visible = p.laptop > 0.5;
      pr.tablet.visible = p.tablet > 0.5;
      setOutfit(scene, p.ring > 0.5 ? "polo" : p.laptop > 0.5 ? "business" : "casual");
    }
  });

  return <primitive ref={group} object={scene} />;
}

useGLTF.preload(MODEL, "/draco/");
