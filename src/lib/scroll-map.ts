export type StationId = "hero" | "about" | "timeline" | "skills" | "agentic" | "contact";
export type ClipName = "idle" | "walk" | "typing" | "wave";
type Vec3 = [number, number, number];

export interface Station {
  id: StationId;
  start: number;
  end: number;
  clip: ClipName;
  camera: Vec3;
  target: Vec3;
}

export const SCROLL_PAGES = 6;

// Figure stays at the origin; the timeline pulls the camera back along -z as the figure walks.
export const STATIONS: Station[] = [
  { id: "hero", start: 0, end: 0.15, clip: "idle", camera: [0, 1.4, 5], target: [0, 1, 0] },
  { id: "about", start: 0.15, end: 0.3, clip: "idle", camera: [3, 1.6, 3.5], target: [0, 1.1, 0] },
  { id: "timeline", start: 0.3, end: 0.6, clip: "walk", camera: [2.5, 2, -3], target: [0, 1, -6] },
  { id: "skills", start: 0.6, end: 0.75, clip: "idle", camera: [0, 2.2, 6], target: [0, 1, 0] },
  { id: "agentic", start: 0.75, end: 0.9, clip: "typing", camera: [-3, 1.8, 4], target: [0, 1, 0] },
  { id: "contact", start: 0.9, end: 1, clip: "wave", camera: [0, 1.5, 3.2], target: [0, 1.3, 0] },
];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function stationAt(offset: number): Station {
  const o = clamp01(offset);
  return STATIONS.find((s) => o < s.end) ?? STATIONS[STATIONS.length - 1];
}

export function localProgress(offset: number): number {
  const s = stationAt(offset);
  return clamp01((clamp01(offset) - s.start) / (s.end - s.start));
}
