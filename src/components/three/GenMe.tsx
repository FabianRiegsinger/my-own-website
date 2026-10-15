"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { Box3, MeshPhysicalMaterial, Vector3, type Mesh, type MeshStandardMaterial } from "three";

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

  // The export faces +x; turn it to face the camera (+z).
  return (
    <group rotation-y={-Math.PI / 2}>
      <primitive object={scene} scale={scale} position={offset} />
    </group>
  );
}

useGLTF.preload(MODEL, "/draco/");
