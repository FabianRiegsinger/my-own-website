"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Box3, MathUtils, Matrix4, Raycaster, Vector2, MeshStandardMaterial, Quaternion, Vector3, type Group, type Material, type Mesh, type Object3D } from "three";
import { JUMP_PERIOD, jumpBeats } from "@/lib/cheer";
import { ENTRANCE, entrance, introStep } from "@/lib/entrance";
import { heading, stationAt, stationWeight } from "@/lib/scroll-map";
import { fade } from "./fade";
import { Gown } from "./Gown";
import { useStationOffset } from "./station-offset";

const MODEL = "/models/me.glb";
const HEIGHT = 1.8;

// Model space of the export: faces +x, up +y, his left arm points -z in the T-pose.
const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);
const ARMS_DOWN = 1.4; // rad from T-pose; a little short of 90° so the arms clear the hips
const ELBOW = 0.2;
/** Gait cycles per second: ~0.68 m steps at ENTRANCE pace (startX / walk ≈ 1.2 m/s), so the feet do not slide. */
const STRIDE_HZ = 0.9;
const ARM_SWING = 0.35; // rad
const ELBOW_SWING = 0.3;
const TWIST = 0.1; // pelvis yaw; the chest turns 1.5x against it
const LEAN = 0.05;
const SWAY = 0.02; // world units
/** Small steps in place while turning to the camera instead of pivoting on the spot. */
const TURN_STEPS = 0.45;
/** The head looks to the camera this long before the walk ends, the body follows (heading damped). */
const LOOK_AHEAD = 0.6; // s
const LOOK = 0.6;
const TURN_RATE = 5;
const WAVE_HZ = 2;
/** Relaxed hands: wrists bent toward the palm (toward the thigh once the arms hang) and trailing the arm swing. */
const HAND_IN = 0.15;
const HAND_LAG = 0.25;
/** Head yaw follows its target this fast (1/s): quick enough to lead the turn, slow enough never to snap. */
const HEAD_RATE = 3;
/** Click-and-hold spin: radians per dragged pixel, and how fast he turns back to the camera after release (1/s). */
const SPIN_PER_PX = 0.01;
const SPIN_BACK = 1.5;
/** A press that moves less than this (px) and lasts less than CLICK_MS is a click: he greets you. */
const CLICK_PX = 5;
const CLICK_MS = 400;
const GREET = 2.6; // s
const GREET_TILT = 0.12; // head tilt (rad) while greeting
const CHEER_V = 2.6; // rad up from arms-down: a V above the shoulders
const JUMP = 0.22; // world units
/** Waving hand: palm turned to the viewer (supination, shared with the forearm twist bones), tilted a little inward. */
const PALM_TURN = Math.PI / 2;
const HAND_TILT = 0.2;
const DEG = Math.PI / 180;
const TAU = 2 * Math.PI;

/** Wrap-around bump centred at gait phase `c` (0..1) with width ~`s`: a smooth periodic Gaussian. */
const bump = (p: number, c: number, s: number) => Math.exp((Math.cos(TAU * (p - c)) - 1) / (TAU * s) ** 2);

/**
 * One leg's sagittal angles (rad; + = flexion, toes up) over a gait cycle, shaped after typical gait-lab curves.
 * p = 0 at heel strike; stance until ~0.6, then swing.
 */
function gait(p: number) {
  return {
    hip: (7.5 + 22.5 * Math.cos(TAU * p)) * DEG,
    // Small give as the heel lands (loading response), big bend mid-swing so the foot clears the floor.
    knee: (4 + 15 * bump(p, 0.15, 0.06) + 58 * bump(p, 0.72, 0.1)) * DEG,
    // Foot slaps flat, shin rolls over it, push-off, toes lifted through swing.
    ankle: (-7 * bump(p, 0.06, 0.035) + 10 * bump(p, 0.42, 0.1) - 18 * bump(p, 0.62, 0.05) + 3 * bump(p, 0.85, 0.08)) * DEG,
    toe: 30 * bump(p, 0.56, 0.05) * DEG, // heel lifts off the flat toes before push-off
  };
}
/** Scrolling past this many pixels ends the landing entrance so the page never fights the reader. */
const TOP_PX = 40;
const atTop = () => window.scrollY < TOP_PX;

const q = new Quaternion();
const pq = new Quaternion();
const toFrame = new Matrix4();

/** One posed bone: its rest rotation and its parent's rotation relative to the model root (both fixed). */
interface Joint {
  bone: Object3D;
  rest: Quaternion;
  parent: Quaternion;
  /** Bind-pose transform relative to the model root. */
  bind: Matrix4;
}

/**
 * Turns `j.bone` by `angle` about a model-space `axis`, on top of the rotations already applied this frame.
 * The axis is mapped into the parent's frame, so the same call works for any bone.
 */
function turn(j: Joint, axis: Vector3, angle: number) {
  q.setFromAxisAngle(axis, angle);
  pq.copy(j.parent).invert().multiply(q).multiply(j.parent);
  j.bone.quaternion.premultiply(pq);
}

const v = new Vector3();
/** Lowest of `bones` in `root`'s own (unscaled model) frame. */
function lowest(root: Object3D, bones: Object3D[]) {
  root.updateMatrixWorld(true);
  return Math.min(...bones.map((b) => root.worldToLocal(b.getWorldPosition(v)).y));
}

/**
 * Generated likeness of Fabian, rigged but without clips: walks in on the landing page (same choreography as the
 * mannequin Figure: walk in, turn, wave), then a procedural idle (arms down, breathing, weight shift); turns with the scroll.
 * On the education page he wears gown and mortarboard (Gown) and jumps for joy: crouch, spring up with the arms in a V, land.
 */
export function GenMe({ shadows }: { shadows: boolean }) {
  const { scene } = useGLTF(MODEL, "/draco/");
  const group = useRef<Group>(null);
  const offset = useStationOffset();
  const intro = useRef({ t: 0, done: false });
  const walk = useRef(0); // walk-cycle weight, eased so the stop is not a snap
  const walkT = useRef(0); // time into the walk: every walk starts on a heel strike
  const wave = useRef(0);
  const model = useRef<Object3D>(null);
  const spinner = useRef<Group>(null);
  const spin = useRef({ angle: 0, dragging: false, x: 0, x0: 0, t0: 0 });
  const greet = useRef(-1); // seconds into a click greeting, -1 when none
  const headYaw = useRef(0);
  const gown = useRef<Group>(null);
  const { camera, gl } = useThree();
  const { scale, offset: centre } = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const s = HEIGHT / size.y;
    const c = box.getCenter(new Vector3());
    return { scale: s, offset: [-c.x * s, -box.min.y * s, -c.z * s] as [number, number, number] };
  }, [scene]);
  // Matte: the export's metal/roughness map reads as dull dark metal, so keep only colour and normals.
  useMemo(
    () =>
      scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh || (m.material as Material).userData.matte) return;
        const { map, normalMap } = m.material as MeshStandardMaterial;
        // Faint self-glow in the texture's own colours lifts the shadow side evenly; reflections alone only brighten lit faces.
        m.material = new MeshStandardMaterial({ map, normalMap, metalness: 0, roughness: 0.85, envMapIntensity: 1.2, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.35 });
        m.material.userData.matte = true;
      }),
    [scene],
  );
  useMemo(() => scene.traverse((o) => ((o as Mesh).isMesh ? (o.castShadow = shadows) : undefined)), [scene, shadows]);

  // Captured from the bind (T-)pose before anything is turned.
  const joints = useMemo(() => {
    scene.updateMatrixWorld(true);
    const inv = scene.getWorldQuaternion(new Quaternion()).invert();
    const joint = (name: string): Joint | null => {
      const bone = scene.getObjectByName(name);
      if (!bone?.parent) return null;
      return { bone, rest: bone.quaternion.clone(), parent: inv.clone().multiply(bone.parent.getWorldQuaternion(new Quaternion())), bind: scene.matrixWorld.clone().invert().multiply(bone.matrixWorld) };
    };
    const names = ["L_Upperarm", "R_Upperarm", "L_Forearm", "R_Forearm", "L_Thigh", "R_Thigh", "L_Calf", "R_Calf", "L_Foot", "R_Foot", "L_ToeBase", "R_ToeBase", "L_Hand", "R_Hand", "R_ForearmTwist01", "R_ForearmTwist02", "Hip", "Waist", "Spine02", "NeckTwist01", "NeckTwist02", "Head"] as const;
    const found = names.map(joint);
    return found.every(Boolean) ? (Object.fromEntries(names.map((n, i) => [n, found[i]!])) as Record<(typeof names)[number], Joint>) : null;
  }, [scene]);
  const feet = useMemo(() => (joints ? [joints.L_Foot, joints.R_Foot, joints.L_ToeBase, joints.R_ToeBase].map((j) => j.bone) : []), [joints]);
  /** Undoes each bone's bind pose in the gown's frame (metres, as placed by `centre` and `scale`), so a piece follows its bone. */
  const unbind = useMemo(() => {
    const place = new Matrix4().compose(new Vector3(...centre), new Quaternion(), new Vector3(scale, scale, scale));
    return joints ? Object.fromEntries(Object.entries(joints).map(([n, j]) => [n, place.clone().multiply(j.bind).invert()])) : {};
  }, [joints, centre, scale]);
  /** Lowest foot joint in the bind pose (model units): the height it is held at so a sole always rests on the floor. */
  const ground = useMemo(() => lowest(scene, feet), [scene, feet]);

  // At the top of the page start off-screen right before the first frame; anywhere else already in place.
  useLayoutEffect(() => {
    const top = atTop();
    intro.current.done = !top;
    if (top && group.current) {
      const s = entrance(0);
      group.current.position.x = s.x;
      group.current.rotation.y = s.heading;
      walk.current = 1; // already mid-walk when he comes into view, not easing into it
    }
  }, []);

  // Click and hold on him, then drag sideways to spin him about his centre. The canvas sits behind the page and takes
  // no pointer events, so this listens on the window and hit-tests his bounding box (cheap enough for every move).
  useEffect(() => {
    const ray = new Raycaster();
    const ndc = new Vector2();
    const box = new Box3();
    const root = document.documentElement;
    const over = (e: PointerEvent) => {
      const m = model.current;
      if (!m) return false;
      const r = gl.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.ray.intersectsBox(box.setFromObject(m));
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || !over(e)) return;
      e.preventDefault(); // no text selection while dragging
      Object.assign(spin.current, { dragging: true, x: e.clientX, x0: e.clientX, t0: e.timeStamp });
      root.style.cursor = "grabbing";
      root.style.userSelect = "none";
    };
    const move = (e: PointerEvent) => {
      const sp = spin.current;
      if (sp.dragging) {
        sp.angle += (e.clientX - sp.x) * SPIN_PER_PX;
        sp.x = e.clientX;
      } else if (e.pointerType === "mouse") root.style.cursor = over(e) ? "grab" : "";
    };
    const up = (e?: PointerEvent) => {
      const sp = spin.current;
      if (!sp.dragging) return;
      sp.dragging = false;
      if (e?.type === "pointerup" && Math.abs(e.clientX - sp.x0) < CLICK_PX && e.timeStamp - sp.t0 < CLICK_MS) greet.current = 0;
      root.style.cursor = "";
      root.style.userSelect = "";
    };
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up); // e.g. a touch that turns into a page scroll
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      up();
    };
  }, [camera, gl]);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const it = intro.current;
    if (!it.done && !atTop()) it.done = true;
    let walking = 0;
    let waving = 0;
    let look = 0; // how far the head (and a little the chest) leads the body toward the camera
    if (!it.done) {
      it.t = introStep(it.t, dt); // frame time, not wall time: a first-frame stall must not skip the walk-in
      const s = entrance(it.t);
      g.position.x = s.x;
      // Damped, so the body follows the head round instead of snapping on the eased curve.
      g.rotation.y = MathUtils.damp(g.rotation.y, s.heading, TURN_RATE, dt);
      walking = s.clip === "walk" ? 1 : it.t < ENTRANCE.walk + ENTRANCE.turn ? TURN_STEPS : 0;
      waving = s.pose.wave;
      look = LOOK * MathUtils.clamp((it.t - ENTRANCE.walk + LOOK_AHEAD) / 0.4, 0, 1);
      it.done = s.done;
    } else {
      g.position.x = MathUtils.damp(g.position.x, 0, 6, dt);
      g.rotation.y = MathUtils.damp(g.rotation.y, heading(offset.current), 4, dt);
      walking = stationAt(offset.current).clip === "walk" ? 1 : 0;
    }
    const sp = spin.current;
    if (!sp.dragging) sp.angle = MathUtils.damp(sp.angle, 0, SPIN_BACK, dt);
    if (spinner.current) spinner.current.rotation.y = sp.angle;
    walk.current = MathUtils.damp(walk.current, walking, 8, dt);
    if (greet.current >= 0) greet.current = greet.current + dt > GREET ? -1 : greet.current + dt;
    const gt = greet.current;
    const greeting = gt < 0 ? 0 : Math.min(MathUtils.smoothstep(gt, 0, 0.3), MathUtils.smoothstep(GREET - gt, 0, 0.5));
    wave.current = MathUtils.damp(wave.current, Math.max(waving, greeting), 6, dt);
    const w = walk.current;
    walkT.current = w > 0.001 ? walkT.current + dt : 0;
    const pL = (walkT.current * STRIDE_HZ) % 1;
    const pR = (pL + 0.5) % 1;
    // Weight shifts over the stance leg (his left is -z). Height is set below, once the feet are posed.
    const m = model.current;
    m?.position.set(centre[0], centre[1], centre[2] - w * SWAY * Math.cos(TAU * (pL - 0.3)));

    if (!joints) return;
    const t = clock.elapsedTime;
    for (const j of Object.values(joints)) j.bone.quaternion.copy(j.rest);
    const breath = Math.sin(t * 1.6);
    const sway = Math.sin(t * 0.5);
    // Arms: down from the T-pose about the facing axis, elbows bent a touch forward, swinging gently with the breath.
    turn(joints.L_Upperarm, X, -ARMS_DOWN + 0.03 * breath);
    turn(joints.R_Upperarm, X, ARMS_DOWN - 0.03 * breath);
    turn(joints.L_Forearm, Y, -ELBOW); // about Y in the rest frame: the T-posed forearm bends toward +x (forward)
    turn(joints.R_Forearm, Y, ELBOW);
    // Hands hang relaxed: bent toward the palm, which faces the thigh once the arm is down.
    turn(joints.L_Hand, X, -HAND_IN);
    turn(joints.R_Hand, X, HAND_IN * (1 - wave.current));
    // Weight shifts slowly from foot to foot; chest rises with each breath; head nods a touch.
    turn(joints.Waist, X, 0.03 * sway);
    turn(joints.Spine02, Z, -0.02 * breath);
    turn(joints.Head, X, -0.02 * sway);
    // Walk (+ = forward about the left-right axis): each leg follows the gait curves, the arms swing with the opposite leg,
    // the pelvis turns with the forward leg and the chest against it, and the body leans a touch into the walk.
    if (w > 0.001) {
      const leg = (p: number, thigh: Joint, calf: Joint, foot: Joint, toe: Joint) => {
        const a = gait(p);
        turn(thigh, Z, w * a.hip);
        turn(calf, Z, -w * a.knee);
        turn(foot, Z, w * a.ankle);
        turn(toe, Z, w * a.toe);
      };
      leg(pL, joints.L_Thigh, joints.L_Calf, joints.L_Foot, joints.L_ToeBase);
      leg(pR, joints.R_Thigh, joints.R_Calf, joints.R_Foot, joints.R_ToeBase);
      const armL = Math.cos(TAU * pR); // 1 = left arm fully forward, with the right leg
      turn(joints.L_Upperarm, Z, w * ARM_SWING * armL);
      turn(joints.R_Upperarm, Z, -w * ARM_SWING * armL);
      turn(joints.L_Forearm, Y, -w * ELBOW_SWING * (1 + armL) / 2); // rest frame, as for ELBOW
      turn(joints.R_Forearm, Y, w * ELBOW_SWING * (1 - armL) / 2);
      // Hands trail the swing (bent back while the arm travels forward); same expression for both arms, see ELBOW signs.
      const lag = -w * HAND_LAG * Math.sin(TAU * pR);
      turn(joints.L_Hand, Y, lag);
      turn(joints.R_Hand, Y, lag);
      const twist = Math.cos(TAU * pL); // 1 = left leg forward
      turn(joints.Hip, Y, -w * TWIST * twist); // +Y turns his left side (-z) back, so negate
      turn(joints.Spine02, Y, w * TWIST * 1.5 * twist);
      turn(joints.Waist, Z, -w * LEAN);
    }
    // Head yaw, eased: looks to the camera ahead of the body (-rotation.y is the yaw still to go), drifts while standing.
    // Spread over the neck so it turns as a whole, not from one joint; the chest follows a little.
    const lead = -look * g.rotation.y;
    headYaw.current = MathUtils.damp(headYaw.current, lead + 0.12 * (1 - w) * Math.sin(t * 0.3), HEAD_RATE, dt);
    // While walking the chest swings 0.5 x TWIST with the steps; the head holds still against it, eyes forward.
    const yaw = headYaw.current - (w > 0.001 ? 0.5 * w * TWIST * Math.cos(TAU * pL) : 0);
    turn(joints.Spine02, Y, 0.25 * lead);
    turn(joints.NeckTwist01, Y, 0.2 * yaw);
    turn(joints.NeckTwist02, Y, 0.2 * yaw);
    turn(joints.Head, Y, 0.6 * yaw);
    // Greeting: a friendly head tilt and a small nod as the hand comes up.
    if (gt >= 0) {
      turn(joints.Head, X, GREET_TILT * greeting);
      turn(joints.Head, Z, -0.12 * Math.sin(Math.PI * MathUtils.clamp(gt / 0.8, 0, 1)));
    }
    // Jump for joy (education page, lib/cheer). Gives way to walking and to a click greeting.
    // Axes as above: upper arm X lifts (R -, L +) and Z swings forward; forearm Y bends the elbow.
    const joy = stationWeight(offset.current, "education") * (1 - w) * (1 - wave.current);
    let hop = 0;
    if (joy > 0.001) {
      const b = jumpBeats((t / JUMP_PERIOD) % 1);
      // Arms swung back in the crouch, thrown up into a V, near straight, for the jump.
      const lift = joy * CHEER_V * b.up;
      turn(joints.R_Upperarm, X, -lift);
      turn(joints.L_Upperarm, X, lift);
      turn(joints.R_Upperarm, Z, joy * (0.2 * b.up - 0.6 * b.windup));
      turn(joints.L_Upperarm, Z, joy * (0.2 * b.up - 0.6 * b.windup));
      turn(joints.R_Forearm, Y, -joy * ELBOW * b.up);
      turn(joints.L_Forearm, Y, joy * ELBOW * b.up);
      // Chest over the knees in the crouch, opening up and looking skyward in the air.
      turn(joints.Waist, Z, joy * (-0.15 * b.crouch + 0.05 * b.up));
      turn(joints.Spine02, Z, joy * 0.06 * b.up);
      turn(joints.Head, Z, joy * (0.22 * b.up - 0.08 * b.crouch));
      // Knees bend for take-off and landing (the floor clamp below lowers him); toes point down in the air.
      const knee = joy * 0.35 * b.crouch;
      for (const [thigh, calf, foot] of [[joints.L_Thigh, joints.L_Calf, joints.L_Foot], [joints.R_Thigh, joints.R_Calf, joints.R_Foot]]) {
        turn(thigh, Z, knee);
        turn(calf, Z, -2 * knee);
        turn(foot, Z, knee - joy * 0.5 * b.air);
      }
      hop = joy * JUMP * b.air;
    }
    // Wave with his right hand (+z): upper arm out to the side, forearm up, swinging side to side at the elbow.
    const wv = wave.current;
    if (wv > 0.001) {
      const swing = Math.sin(t * WAVE_HZ * TAU);
      turn(joints.R_Upperarm, X, -1.15 * wv);
      turn(joints.R_Upperarm, Z, 0.25 * wv);
      turn(joints.R_Forearm, X, -wv * (1.5 + 0.3 * swing)); // rest frame: -X lifts the forearm (+z) up
      // Palm to the viewer: twist about the forearm (rest +z; -y palm turns to +x, forward), a third more at each twist bone.
      turn(joints.R_ForearmTwist01, Z, (wv * PALM_TURN) / 3);
      turn(joints.R_ForearmTwist02, Z, (wv * PALM_TURN) / 3);
      turn(joints.R_Hand, Z, wv * PALM_TURN);
      // Then, within the palm's plane, tilt inward and let the hand follow the swing a beat late.
      turn(joints.R_Hand, X, -wv * (HAND_TILT + 0.15 * Math.sin(t * WAVE_HZ * TAU - 0.8)));
    }
    // Feet on the floor: the body drops as the legs spread (the natural gait bob) instead of the feet lifting off.
    if (m) m.position.y = centre[1] + (ground - lowest(m, feet)) * scale + hop;
    // Gown: each piece follows its bone (pose relative to the gown's frame, times the inverse bind pose).
    const gw = gown.current;
    if (gw) fade(gw, stationWeight(offset.current, "education"));
    if (gw?.visible && gw.parent) {
      g.updateMatrixWorld(true);
      toFrame.copy(gw.parent.matrixWorld).invert();
      for (const piece of gw.children) piece.matrix.copy(toFrame).multiply(joints[piece.name as keyof typeof joints].bone.matrixWorld).multiply(unbind[piece.name]);
    }
  });

  // The export faces +x; turn it to face the camera (+z).
  return (
    <group ref={group}>
      <group ref={spinner}>
        <group rotation-y={-Math.PI / 2}>
          <primitive ref={model} object={scene} scale={scale} position={centre} />
          <Gown ref={gown} shadows={shadows} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(MODEL, "/draco/");
