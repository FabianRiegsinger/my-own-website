"use client";

import { MeshReflectorMaterial } from "@react-three/drei";

/** The studio floor every station stands on; reflective unless the device is in low-power mode. */
export function Hero({ lowPower }: { lowPower: boolean }) {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[60, 60]} />
      {lowPower ? (
        <meshStandardMaterial color="#ffffff" roughness={1} />
      ) : (
        <MeshReflectorMaterial color="#ffffff" resolution={512} blur={[400, 100]} mixBlur={1} mixStrength={0.25} roughness={1} mirror={0.2} depthScale={0} />
      )}
    </mesh>
  );
}
