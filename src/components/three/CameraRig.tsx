"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { MathUtils, Vector3 } from "three";
import { isDesktop, localProgress, stationAt, STATIONS } from "@/lib/scroll-map";
import { useStationOffset } from "./station-offset";

/** Eases the camera from the current station's pose toward the next one as the section scrolls by. */
export function CameraRig() {
  const offset = useStationOffset();
  const shift = useRef<number | null>(null);

  const [pos, look, goalPos, goalLook] = useMemo(() => [new Vector3(), new Vector3(), new Vector3(), new Vector3()], []);
  useFrame(({ camera, size }, dt) => {
    const s = stationAt(offset.current);
    const next = STATIONS[STATIONS.indexOf(s) + 1] ?? s;
    const t = MathUtils.smoothstep(localProgress(offset.current), 0.5, 1);
    goalPos.fromArray(s.camera).lerp(pos.fromArray(next.camera), t);
    goalLook.fromArray(s.target).lerp(pos.fromArray(next.target), t);
    // First frame starts at the goal (k = 1): easing in from the Canvas default would tilt the view on load,
    // so the figure seemed to step down while walking in.
    const k = shift.current === null ? 1 : 1 - Math.exp(-3 * dt);
    camera.position.lerp(goalPos, k);
    look.lerp(goalLook, k);
    camera.lookAt(look);
    // Shift the projection (not the camera) so a station can stand the figure off-centre, clear of its scenery.
    const goalShift = MathUtils.lerp(s.shift, next.shift, t);
    // First frame starts at the goal, so the figure never slides sideways on load.
    shift.current = shift.current === null ? goalShift : MathUtils.lerp(shift.current, goalShift, k);
    if (!("setViewOffset" in camera)) return;
    if (isDesktop(size) && Math.abs(shift.current) > 1e-4) {
      camera.setViewOffset(size.width, size.height, -shift.current * size.width, 0, size.width, size.height);
    } else camera.clearViewOffset();
  });
  return null;
}
