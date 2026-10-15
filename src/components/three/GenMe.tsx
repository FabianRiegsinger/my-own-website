"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { Box3, MeshPhysicalMaterial, Quaternion, Vector3, type Mesh, type MeshStandardMaterial, type Object3D } from "three";

const MODEL = "/models/me.glb";
const HEIGHT = 1.8;

// Model space of the export: faces +x, up +y, his left arm points -z in the T-pose.
const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);
const ARMS_DOWN = 1.35; // rad from T-pose; a little short of 90° so the arms clear the hips
const ELBOW = 0.2;

const q = new Quaternion();
const pq = new Quaternion();

/** One posed bone: its rest rotation and its parent's rotation relative to the model root (both fixed). */
interface Joint {
  bone: Object3D;
  rest: Quaternion;
  parent: Quaternion;
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

/** Generated likeness of Fabian, rigged but without clips: a procedural idle (arms down, breathing, weight shift). */
export function GenMe({ shadows }: { shadows: boolean }) {
  const { scene } = useGLTF(MODEL, "/draco/");
  const { scale, offset } = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const s = HEIGHT / size.y;
    const c = box.getCenter(new Vector3());
    return { scale: s, offset: [-c.x * s, -box.min.y * s, -c.z * s] as [number, number, number] };
  }, [scene]);
  // Toy-figure plastic: the export's metal/roughness map reads as dull dark metal, so keep only colour and normals.
  useMemo(
    () =>
      scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh || m.material instanceof MeshPhysicalMaterial) return;
        const { map, normalMap } = m.material as MeshStandardMaterial;
        // Faint self-glow in the texture's own colours lifts the shadow side evenly; reflections alone only brighten lit faces.
        m.material = new MeshPhysicalMaterial({ map, normalMap, metalness: 0, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 2.5, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.3 });
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
      return { bone, rest: bone.quaternion.clone(), parent: inv.clone().multiply(bone.parent.getWorldQuaternion(new Quaternion())) };
    };
    const names = ["L_Upperarm", "R_Upperarm", "L_Forearm", "R_Forearm", "Waist", "Spine02", "Head"] as const;
    const found = names.map(joint);
    return found.every(Boolean) ? (Object.fromEntries(names.map((n, i) => [n, found[i]!])) as Record<(typeof names)[number], Joint>) : null;
  }, [scene]);

  useFrame(({ clock }) => {
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
    // Weight shifts slowly from foot to foot; chest rises with each breath; head drifts a little.
    turn(joints.Waist, X, 0.03 * sway);
    turn(joints.Spine02, Z, -0.02 * breath);
    turn(joints.Head, Y, 0.12 * Math.sin(t * 0.3));
    turn(joints.Head, X, -0.02 * sway);
  });

  // The export faces +x; turn it to face the camera (+z).
  return (
    <group rotation-y={-Math.PI / 2}>
      <primitive object={scene} scale={scale} position={offset} />
    </group>
  );
}

useGLTF.preload(MODEL, "/draco/");
