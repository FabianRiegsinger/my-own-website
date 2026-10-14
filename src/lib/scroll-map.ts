export type StationId = "hero" | "about" | "education" | "esas" | "mobileye" | "skills" | "agentic" | "launch" | "contact";
export type ClipName = "idle" | "walk" | "typing" | "wave" | "think" | "ring" | "laptop" | "tablet";
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
  /** Figure yaw on this page (0 faces +z, the hero camera). */
  yaw: number;
}

/** Right edge of the glass text panel on desktop, as a fraction of the width: 3vw gutter + 36vw panel (GlassPanel). */
export const PANEL_EDGE = 0.39;
/** Shift that stands the figure midway between the panel's right edge and the screen's right edge. */
const BESIDE_PANEL = (PANEL_EDGE + 1) / 2 - 0.5;

// Figure stays at the origin; scenery (Task 8 stations) moves past it.
export const STATIONS: Station[] = [
  { id: "hero", start: 0, end: 0.12, clip: "idle", camera: [0, 1.4, 5], target: [0, 1, 0], shift: BESIDE_PANEL, yaw: 0 },
  // Reading the about text: turned part-way toward the panel on screen-left (camera sits front-right).
  { id: "about", start: 0.12, end: 0.24, clip: "think", camera: [3, 1.6, 3.5], target: [0, 1.1, 0], shift: BESIDE_PANEL, yaw: -0.25 },
  // Career pages are scenes (see stations/): ringing the bell at graduation, a team talk at ESAS, the AUDI test fleet at Mobileye.
  { id: "education", start: 0.24, end: 0.36, clip: "ring", camera: [0.4, 1.4, 5.4], target: [0, 1.5, 0], shift: BESIDE_PANEL, yaw: 0 },
  { id: "esas", start: 0.36, end: 0.48, clip: "laptop", camera: [0.3, 1.9, 5.8], target: [0.1, 1.1, 0], shift: BESIDE_PANEL, yaw: 0.35 },
  { id: "mobileye", start: 0.48, end: 0.6, clip: "tablet", camera: [1.6, 2.3, 6.2], target: [0, 1.3, -2], shift: BESIDE_PANEL, yaw: -0.3 },
  { id: "agentic", start: 0.6, end: 0.74, clip: "typing", camera: [-3, 1.8, 4], target: [0, 1, 0], shift: 0.32, yaw: 0 },
  { id: "skills", start: 0.74, end: 0.84, clip: "idle", camera: [0, 2.2, 6.4], target: [0, 1.2, 0], shift: BESIDE_PANEL, yaw: 0 },
  // What comes next: on the launch pad, looking up at the rocket (stations/Launch), which lifts off into contact.
  { id: "launch", start: 0.84, end: 0.93, clip: "idle", camera: [0.8, 1.2, 7.4], target: [-0.6, 2, 0], shift: BESIDE_PANEL, yaw: -0.4 },
  { id: "contact", start: 0.93, end: 1, clip: "wave", camera: [0, 1.3, 6], target: [0, 1, 0], shift: BESIDE_PANEL, yaw: 0 },
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

/** Job pages, oldest first, matching `cv.experience` reversed. */
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

/** Figure yaw: each page's own `yaw`, eased toward the next page's over the second half of the page (like the camera). */
export function heading(offset: number): number {
  const s = stationAt(offset);
  const next = STATIONS[STATIONS.indexOf(s) + 1] ?? s;
  const t = localProgress(offset);
  const k = t <= 0.5 ? 0 : (t - 0.5) / 0.5;
  return s.yaw + (next.yaw - s.yaw) * k * k * (3 - 2 * k);
}
