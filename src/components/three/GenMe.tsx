"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { Box3, Vector3, type Mesh } from "three";

const MODEL = "/models/gen_me.glb";
const HEIGHT = 1.8;

/** Static generated likeness (no rig, no animation): scaled to HEIGHT with feet on the floor at the origin. */
export function GenMe({ shadows }: { shadows: boolean }) {
  const { scene } = useGLTF(MODEL, "/draco/");
  const { scale, offset } = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const s = HEIGHT / size.y;
    const c = box.getCenter(new Vector3());
    return { scale: s, offset: [-c.x * s, -box.min.y * s, -c.z * s] as [number, number, number] };
  }, [scene]);
  useMemo(() => scene.traverse((o) => ((o as Mesh).isMesh ? (o.castShadow = shadows) : undefined)), [scene, shadows]);

  // The export faces +x; turn it to face the camera (+z).
  return (
    <group rotation-y={-Math.PI / 2}>
      <primitive object={scene} scale={scale} position={offset} />
    </group>
  );
}

useGLTF.preload(MODEL, "/draco/");
