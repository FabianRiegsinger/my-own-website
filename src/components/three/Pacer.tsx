"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { advance, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { isIdle, shouldDraw } from "@/lib/pace";

/** Anything the visitor does that can move the 3D scene (scroll, pointer, keys, touch, a resized window). */
const WAKE_EVENTS = ["scroll", "wheel", "pointermove", "pointerdown", "keydown", "touchstart", "resize"] as const;

/**
 * Drives the canvas (frameloop="never"): every frame while the visitor is doing something, at the idle frame rate once
 * they have been still for a while, which roughly halves the GPU work (and battery) while someone just reads.
 * `holdUntil` (ms, performance.now) keeps the full rate until then, for motion that plays without input (the walk-in).
 * The performance monitor only runs at full rate: it would read the deliberate idle rate as a struggling device.
 */
export function Pacer({ holdUntil, onDecline }: { holdUntil: number; onDecline: () => void }) {
  const get = useThree((s) => s.get);
  const [idle, setIdle] = useState(false);
  // A ref, not an effect dependency: restarting the loop would restart the scene clock.
  const hold = useRef(holdUntil);
  useEffect(() => {
    hold.current = holdUntil;
  }, [holdUntil]);

  useEffect(() => {
    const start = performance.now();
    let lastActive = start;
    let lastDrawn = -Infinity;
    let wasIdle = false;
    let id = 0;
    const wake = () => {
      lastActive = Math.max(performance.now(), lastActive);
    };
    for (const e of WAKE_EVENTS) window.addEventListener(e, wake, { passive: true });
    const tick = (now: number) => {
      id = requestAnimationFrame(tick);
      const nowIdle = isIdle(now, Math.max(lastActive, hold.current));
      if (nowIdle !== wasIdle) setIdle((wasIdle = nowIdle));
      if (!shouldDraw(now, lastDrawn, nowIdle)) return;
      lastDrawn = now;
      // With frameloop="never" this becomes the scene clock (clock.elapsedTime, and dt from it): in seconds, from 0.
      advance((now - start) / 1000, true, get());
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      for (const e of WAKE_EVENTS) window.removeEventListener(e, wake);
    };
  }, [get]);

  return idle ? null : <PerformanceMonitor onDecline={onDecline} />;
}
