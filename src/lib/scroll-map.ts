export type StationId = "hero" | "about" | "education" | "esas" | "mobileye" | "skills" | "agentic" | "contact";
export type ClipName = "idle" | "walk" | "typing" | "wave";
type Vec3 = [number, number, number];

export interface Station {
  id: StationId;
  start: number;
  end: number;
  clip: ClipName;
  camera: Vec3;
  target: Vec3;
  /** Desktop only: moves the figure right by this fraction of the screen width (0 = centred). */
  shift: number;
}

// Figure stays at the origin; scenery (Task 8 stations) moves past it.
export const STATIONS: Station[] = [
  { id: "hero", start: 0, end: 0.12, clip: "idle", camera: [0, 1.4, 5], target: [0, 1, 0], shift: 0 },
  { id: "about", start: 0.12, end: 0.24, clip: "idle", camera: [3, 1.6, 3.5], target: [0, 1.1, 0], shift: 0 },
  // Career pages: one walk through the milestones, the camera drifting a little per page.
  { id: "education", start: 0.24, end: 0.36, clip: "walk", camera: [2.4, 1.6, 4.2], target: [0, 1, 0], shift: 0 },
  { id: "esas", start: 0.36, end: 0.48, clip: "walk", camera: [2.1, 1.5, 4.4], target: [0, 1, 0], shift: 0 },
  { id: "mobileye", start: 0.48, end: 0.6, clip: "walk", camera: [2.6, 1.7, 4], target: [0, 1, 0], shift: 0 },
  { id: "skills", start: 0.6, end: 0.72, clip: "idle", camera: [0, 2.2, 6], target: [0, 1, 0], shift: 0 },
  { id: "agentic", start: 0.72, end: 0.86, clip: "typing", camera: [-3, 1.8, 4], target: [0, 1, 0], shift: 0.32 },
  { id: "contact", start: 0.86, end: 1, clip: "wave", camera: [0, 1.3, 6], target: [0, 1, 0], shift: 0 },
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

/** Career pages in walking order; jobs map oldest first onto `JOB_STATIONS`. */
export const CAREER: StationId[] = ["education", "esas", "mobileye"];
export const JOB_STATIONS: StationId[] = ["esas", "mobileye"];

const byId = (id: StationId) => STATIONS.find((st) => st.id === id)!;

function rangeWeight(offset: number, start: number, end: number, fade: number): number {
  const o = clamp01(offset);
  if (o >= start && o <= end) return 1;
  const d = o < start ? start - o : o - end;
  return clamp01(1 - d / fade);
}

/** 1 inside the station's range, linear fade to 0 over `fade` on either side. */
export function stationWeight(offset: number, id: StationId, fade = 0.05): number {
  const s = byId(id);
  return rangeWeight(offset, s.start, s.end, fade);
}

/** Like `stationWeight`, for the whole career walk (education through the latest job). */
export function careerWeight(offset: number, fade = 0.05): number {
  return rangeWeight(offset, byId(CAREER[0]).start, byId(CAREER.at(-1)!).end, fade);
}

/** Milestones passed so far (fractional): each career page walks past its own `gates`. */
export function careerTravel(offset: number, gates: Partial<Record<StationId, number>>): number {
  const o = clamp01(offset);
  return CAREER.reduce((sum, id) => {
    const s = byId(id);
    return sum + (gates[id] ?? 0) * clamp01((o - s.start) / (s.end - s.start));
  }, 0);
}

/** Figure yaw: faces the visitor (0), turns to walk into the distance (π) through the career pages. */
export function heading(offset: number): number {
  return Math.PI * careerWeight(offset, 0.03);
}
