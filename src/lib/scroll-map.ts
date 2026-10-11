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

// Figure stays at the origin; scenery (Task 8 stations) moves past it.
export const STATIONS: Station[] = [
  { id: "hero", start: 0, end: 0.15, clip: "idle", camera: [0, 1.4, 5], target: [0, 1, 0] },
  { id: "about", start: 0.15, end: 0.3, clip: "idle", camera: [3, 1.6, 3.5], target: [0, 1.1, 0] },
  { id: "timeline", start: 0.3, end: 0.6, clip: "walk", camera: [2.4, 1.6, 4.2], target: [0, 1, 0] },
  { id: "skills", start: 0.6, end: 0.75, clip: "idle", camera: [0, 2.2, 6], target: [0, 1, 0] },
  { id: "agentic", start: 0.75, end: 0.9, clip: "typing", camera: [-3, 1.8, 4], target: [0, 1, 0] },
  { id: "contact", start: 0.9, end: 1, clip: "wave", camera: [0, 1.3, 6], target: [0, 1, 0] },
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

/**
 * Maps a pixel position (viewport centre, in content coordinates) onto the station scale, using the
 * measured DOM sections (ordered like STATIONS). Keeps 3D in sync with text of any height.
 */
export function toStationOffset(y: number, sections: { top: number; height: number }[]): number {
  if (sections.length === 0) return 0;
  const i = sections.findIndex((s) => y < s.top + s.height);
  if (i === -1) return 1;
  const s = sections[i];
  const st = STATIONS[i];
  return st.start + clamp01((y - s.top) / s.height) * (st.end - st.start);
}

/** 1 inside the station's range, linear fade to 0 over `fade` on either side. */
export function stationWeight(offset: number, id: StationId, fade = 0.05): number {
  const s = STATIONS.find((st) => st.id === id)!;
  const o = clamp01(offset);
  if (o >= s.start && o <= s.end) return 1;
  const d = o < s.start ? s.start - o : o - s.end;
  return clamp01(1 - d / fade);
}

/** Figure yaw: faces the visitor (0), turns to walk into the distance (π) through the timeline. */
export function heading(offset: number): number {
  return Math.PI * stationWeight(offset, "timeline", 0.03);
}
