"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { MathUtils, Vector3 } from "three";
import { localProgress, stationAt, STATIONS } from "@/lib/scroll-map";
import { useStationOffset } from "./station-offset";

/** Eases the camera from the current station's pose toward the next one as the section scrolls by. */
export function CameraRig() {
  const offset = useStationOffset();

  const [pos, look, goalPos, goalLook] = useMemo(() => [new Vector3(), new Vector3(), new Vector3(), new Vector3()], []);
  useFrame(({ camera }, dt) => {
    const s = stationAt(offset.current);
    const next = STATIONS[STATIONS.indexOf(s) + 1] ?? s;
    const t = MathUtils.smoothstep(localProgress(offset.current), 0.5, 1);
    goalPos.fromArray(s.camera).lerp(pos.fromArray(next.camera), t);
    goalLook.fromArray(s.target).lerp(pos.fromArray(next.target), t);
    const k = 1 - Math.exp(-3 * dt);
    camera.position.lerp(goalPos, k);
    look.lerp(goalLook, k);
    camera.lookAt(look);
  });
  return null;
}
