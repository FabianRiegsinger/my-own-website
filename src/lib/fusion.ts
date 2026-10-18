import { MathUtils } from "three";

const { smoothstep } = MathUtils;

/** Seconds the ESAS fusion demo takes to play through once he is on the page; the last frame is then held. */
export const FUSION_PLAY = 14;

/** Sensor streams, in the order of the colleagues who own them (stations/Team). */
export const SENSORS = ["camera", "lidar", "radar"] as const;
export type Sensor = (typeof SENSORS)[number];

/**
 * ESAS sensor-fusion demo (`t` = 0..1 through FUSION_PLAY), each a 0..1 weight: the hologram comes up from his laptop,
 * he hands each sensor stream to its owner (who points at it), the raw detections disagree (one owner stops to think),
 * his fusion module merges them into one track, and the team signs off with a nod and a thumbs-up.
 */
export function fusionBeats(t: number) {
  const k = MathUtils.clamp(t, 0, 1);
  const done = smoothstep(k, 0.7, 0.78);
  const end = smoothstep(k, 0.84, 0.9) * (1 - smoothstep(k, 0.97, 1));
  return {
    on: smoothstep(k, 0.02, 0.12),
    /** Per sensor: its cone shown (gone once fused), and its detections. */
    sensor: SENSORS.map((_, i) => smoothstep(k, 0.18 + i * 0.09, 0.26 + i * 0.09) * (1 - done)),
    dots: SENSORS.map((_, i) => smoothstep(k, 0.3 + i * 0.06, 0.4 + i * 0.06) * (1 - done)),
    merge: smoothstep(k, 0.6, 0.74),
    done,
    /** Per owner: pointing at their sensor while it is handed over. */
    point: SENSORS.map((_, i) => smoothstep(k, 0.18 + i * 0.09, 0.26 + i * 0.09) * (1 - smoothstep(k, 0.44 + i * 0.03, 0.5 + i * 0.03))),
    think: smoothstep(k, 0.48, 0.55) * (1 - done),
    nod: done * (1 - smoothstep(k, 0.84, 0.9)),
    thumb: end,
  };
}
